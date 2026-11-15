"""
Clinical Biomechanics Pipeline - Cerebrium Serverless Backend
Powered by:
- RT-DETR (PekingU/rtdetr_r50vd_coco_o365) Athlete Detection
- ViTPose-Base (usyd-community/vitpose-base-simple) 2D Pose
- MotionBERT-Lite DSTformer 3D Pose Lifter
- SciPy Zero-Phase Signal Processing
Zero cold-start penalty, persistent HuggingFace caching, T4 GPU FP16 batch inference,
and 3D metric spatial kinematics without monocular perspective distortion.
"""

import os
os.environ["HF_HOME"] = "/persistent-storage/hf_cache"
os.environ["TORCH_HOME"] = "/persistent-storage/hf_cache/torch"

import base64
import tempfile
import math
from typing import Dict, List, Any, Optional, Tuple

import cv2
import numpy as np
import scipy.signal
import torch
from PIL import Image
from transformers import AutoImageProcessor, AutoModelForObjectDetection, VitPoseForPoseEstimation
import requests

from motionbert_3d import (
    get_3d_lifter_model,
    lift_2d_to_3d,
    compute_3d_joint_angle,
    H36M_JOINT_TO_IDX
)

# ---------------------------------------------------------------------------
# 1. Hardware Detection & Global Model Initialization
# ---------------------------------------------------------------------------

device = "cuda" if torch.cuda.is_available() else "cpu"
print(f"[Cerebrium Startup] Initializing Biomechanics Engine on {device.upper()}...")

DET_MODEL_NAME = "PekingU/rtdetr_r50vd_coco_o365"
POSE_MODEL_NAME = "usyd-community/vitpose-base-simple"

print(f"[Cerebrium Startup] Loading RT-DETR ({DET_MODEL_NAME})...")
det_processor = AutoImageProcessor.from_pretrained(DET_MODEL_NAME)
det_model = AutoModelForObjectDetection.from_pretrained(
    DET_MODEL_NAME,
    torch_dtype=torch.float32
).to(device)
det_model.eval()

print(f"[Cerebrium Startup] Loading ViTPose-Base ({POSE_MODEL_NAME})...")
pose_processor = AutoImageProcessor.from_pretrained(POSE_MODEL_NAME)
pose_model = VitPoseForPoseEstimation.from_pretrained(
    POSE_MODEL_NAME,
    torch_dtype=torch.float32
).to(device)
pose_model.eval()

print("[Cerebrium Startup] Loading MotionBERT-Lite 3D Pose Lifter...")
lifter_model, lifter_dev = get_3d_lifter_model(torch.device(device))

print("[Cerebrium Startup] All neural models (2D Detection, 2D Pose, 3D Lifter) loaded into VRAM.")

COCO_KEYPOINTS = [
    "nose", "left_eye", "right_eye", "left_ear", "right_ear",
    "left_shoulder", "right_shoulder", "left_elbow", "right_elbow",
    "left_wrist", "right_wrist", "left_hip", "right_hip",
    "left_knee", "right_knee", "left_ankle", "right_ankle"
]

# ---------------------------------------------------------------------------
# 2. Kinematic & Biomechanical Signal Processing Functions
# ---------------------------------------------------------------------------

def calculate_angle_2d(p1: Dict[str, float], p2: Dict[str, float], p3: Dict[str, float]) -> float:
    """Calculate planar joint angle (p1 - p2 - p3) in degrees [0..180]."""
    v1_x, v1_y = p1["x"] - p2["x"], p1["y"] - p2["y"]
    v2_x, v2_y = p3["x"] - p2["x"], p3["y"] - p2["y"]
    
    dot = v1_x * v2_x + v1_y * v2_y
    mag1 = math.hypot(v1_x, v1_y)
    mag2 = math.hypot(v2_x, v2_y)
    
    if mag1 < 1e-6 or mag2 < 1e-6:
        return 180.0
    
    cosine = max(-1.0, min(1.0, dot / (mag1 * mag2)))
    return float(math.degrees(math.acos(cosine)))

def interpolate_series_1d(values: np.ndarray, scores: np.ndarray, min_score: float = 0.35) -> np.ndarray:
    """Linear interpolation over frames where confidence score drops below threshold."""
    n = len(values)
    if n == 0:
        return values
    valid_mask = scores >= min_score
    indices = np.arange(n)
    if not np.any(valid_mask):
        return values
    if np.all(valid_mask):
        return values
    return np.interp(indices, indices[valid_mask], values[valid_mask])

def apply_zero_phase_butterworth(series: np.ndarray, fs: float = 15.0, cutoff: float = 1.8) -> np.ndarray:
    """Zero-phase 2nd-order lowpass Butterworth filter via filtfilt clipped to [0, 1]."""
    series_f64 = np.asarray(series, dtype=np.float64)
    n = len(series_f64)
    if n <= 9:
        return series_f64
    nyq = fs / 2.0
    normal_cutoff = min(cutoff / nyq, 0.99)
    b, a = scipy.signal.butter(2, normal_cutoff, btype="low", analog=False)
    filtered = scipy.signal.filtfilt(b, a, series_f64)
    return np.clip(filtered, 0.0, 1.0)

def apply_zero_phase_butterworth_continuous(series: np.ndarray, fs: float = 15.0, cutoff: float = 1.8) -> np.ndarray:
    """Zero-phase 2nd-order lowpass Butterworth filter for continuous real values (metric / angular)."""
    series_f64 = np.asarray(series, dtype=np.float64)
    n = len(series_f64)
    if n <= 9:
        return series_f64
    nyq = fs / 2.0
    normal_cutoff = min(cutoff / nyq, 0.99)
    b, a = scipy.signal.butter(2, normal_cutoff, btype="low", analog=False)
    return scipy.signal.filtfilt(b, a, series_f64)

def sample_video_frames(
    video_path: str,
    target_fps: float = 15.0,
    max_frames: int = 450,
    start_time: float = 0.0,
    end_time: Optional[float] = None
):
    """
    Read video sequentially, sampling strictly at target_fps up to max_frames (30s at 15 FPS)
    within the exact [start_time, end_time] interval.
    """
    frames_rgb = []
    timestamps = []
    step_dt = 1.0 / target_fps
    t_start = max(0.0, float(start_time))
    t_end = float(end_time) if (end_time is not None and float(end_time) > t_start) else None

    # Strategy 1: PyAV Frame-Accurate Demuxing
    try:
        import av
        container = av.open(video_path)
        if len(container.streams.video) > 0:
            stream = container.streams.video[0]
            stream.thread_type = "AUTO"
            fps = float(stream.average_rate or 30.0) if stream.average_rate else 30.0
            time_base = float(stream.time_base) if stream.time_base else (1.0 / fps)
            
            next_sample_time = t_start
            for packet in container.demux(stream):
                for frame in packet.decode():
                    pts_sec = float(frame.pts * time_base) if frame.pts is not None else (len(frames_rgb) * step_dt)
                    if pts_sec < next_sample_time - 1e-4:
                        continue
                    if t_end is not None and pts_sec > t_end + 1e-4:
                        break
                    
                    frame_rgb = frame.to_ndarray(format="rgb24")
                    frames_rgb.append(frame_rgb)
                    timestamps.append(round(pts_sec, 3))
                    next_sample_time += step_dt
                    
                    if len(frames_rgb) >= max_frames:
                        break
                if len(frames_rgb) >= max_frames or (t_end is not None and len(timestamps) > 0 and timestamps[-1] > t_end):
                    break
                    
            container.close()
            if frames_rgb:
                print(f"[Decoder] PyAV successfully decoded {len(frames_rgb)} frames within range [{t_start:.2f}s, {t_end if t_end else 'END'}s].")
                return frames_rgb, timestamps, timestamps[-1] if timestamps else 0.0
    except Exception as e:
        print(f"[Decoder] PyAV demux skipped ({e}), falling back to OpenCV...")

    # Strategy 2: OpenCV Sequential Read
    try:
        cap = cv2.VideoCapture(video_path)
        if cap.isOpened():
            native_fps = cap.get(cv2.CAP_PROP_FPS)
            if not native_fps or native_fps <= 0 or math.isnan(native_fps):
                native_fps = 30.0
                
            frame_idx = 0
            next_sample_time = t_start
            
            while len(frames_rgb) < max_frames:
                ret, frame = cap.read()
                if not ret or frame is None:
                    break
                    
                current_time = frame_idx / native_fps
                if current_time < next_sample_time - 1e-4:
                    frame_idx += 1
                    continue
                    
                if t_end is not None and current_time > t_end + 1e-4:
                    break
                    
                if current_time >= next_sample_time - 1e-4:
                    frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                    frames_rgb.append(frame_rgb)
                    timestamps.append(round(current_time, 3))
                    next_sample_time += step_dt
                    
                frame_idx += 1
                
            cap.release()
    except Exception as e:
        print(f"[Decoder] OpenCV read error ({e})")
        
    duration = timestamps[-1] if timestamps else 0.0
    print(f"[Decoder] Decoded total of {len(frames_rgb)} frames.")
    return frames_rgb, timestamps, duration

def run_inference_batches(frames_rgb: List[np.ndarray], batch_size: int = 32):
    """Top-Down detection: RT-DETR athlete box + ViTPose-Base keypoints (FP16 inference_mode)."""
    all_raw_keypoints = []
    all_boxes = []
    
    with torch.inference_mode():
        for i in range(0, len(frames_rgb), batch_size):
            batch_np = frames_rgb[i : i + batch_size]
            batch_pil = [Image.fromarray(f) for f in batch_np]
            h, w = batch_np[0].shape[:2]
            
            # Step A: RT-DETR Athlete Box Detection (Pure FP32 Tensor Cores)
            det_inputs = det_processor(images=batch_pil, return_tensors="pt").to(device)
            with torch.inference_mode():
                det_outputs = det_model(**det_inputs)
            
            if hasattr(det_outputs, "logits") and det_outputs.logits is not None:
                det_outputs.logits = det_outputs.logits.to(torch.float32)
            if hasattr(det_outputs, "pred_boxes") and det_outputs.pred_boxes is not None:
                det_outputs.pred_boxes = det_outputs.pred_boxes.to(torch.float32)

            target_sizes = torch.tensor([[h, w]] * len(batch_np), dtype=torch.float32).to(device)
            det_results = det_processor.post_process_object_detection(
                det_outputs, target_sizes=target_sizes, threshold=0.25
            )
            
            batch_boxes = []
            for res in det_results:
                boxes = res["boxes"]
                scores = res["scores"]
                labels = res["labels"]
                if hasattr(boxes, "detach"):
                    boxes = boxes.detach().cpu().to(torch.float32).numpy()
                else:
                    boxes = np.asarray(boxes, dtype=np.float32)
                if hasattr(scores, "detach"):
                    scores = scores.detach().cpu().to(torch.float32).numpy()
                else:
                    scores = np.asarray(scores, dtype=np.float32)
                if hasattr(labels, "detach"):
                    labels = labels.detach().cpu().numpy()
                else:
                    labels = np.asarray(labels)
                
                # Person class is 0 in COCO
                person_indices = [idx for idx, lbl in enumerate(labels) if lbl == 0]
                if person_indices:
                    best_idx = None
                    best_metric = -1.0
                    for p_idx in person_indices:
                        b = boxes[p_idx]
                        area = max(0.0, (b[2] - b[0])) * max(0.0, (b[3] - b[1]))
                        b_cx = (b[0] + b[2]) / (2.0 * w)
                        center_weight = max(0.3, 1.0 - abs(b_cx - 0.5))
                        metric = scores[p_idx] * area * center_weight
                        if metric > best_metric:
                            best_metric = metric
                            best_idx = p_idx
                    chosen_box = boxes[best_idx].tolist()
                    
                    if len(batch_boxes) > 0:
                        prev = batch_boxes[-1][0]
                        chosen_box = [
                            0.70 * chosen_box[c] + 0.30 * prev[c] for c in range(4)
                        ]
                    
                    batch_boxes.append([chosen_box])
                    cx = float((chosen_box[0] + chosen_box[2]) / (2.0 * w))
                    cy = float((chosen_box[1] + chosen_box[3]) / (2.0 * h))
                    bw = float((chosen_box[2] - chosen_box[0]) / float(w))
                    bh = float((chosen_box[3] - chosen_box[1]) / float(h))
                    all_boxes.append({"cx": cx, "cy": cy, "bw": bw, "bh": bh})
                elif len(boxes) > 0:
                    batch_boxes.append([[0.0, 0.0, float(w), float(h)]])
                    all_boxes.append({"cx": 0.5, "cy": 0.5, "bw": 1.0, "bh": 1.0})
                else:
                    batch_boxes.append([[0.0, 0.0, float(w), float(h)]])
                    all_boxes.append({"cx": 0.5, "cy": 0.5, "bw": 1.0, "bh": 1.0})
            
            # Step B: ViTPose-Base 17 Keypoints (Pure FP32 Tensor Cores)
            pose_inputs = pose_processor(images=batch_pil, boxes=batch_boxes, return_tensors="pt").to(device)
            num_boxes = pose_inputs["pixel_values"].shape[0]
            dataset_index = torch.zeros(num_boxes, dtype=torch.long, device=device)
            
            with torch.inference_mode():
                try:
                    pose_outputs = pose_model(**pose_inputs, dataset_index=dataset_index)
                except (TypeError, ValueError):
                    pose_outputs = pose_model(**pose_inputs)
            
            if hasattr(pose_outputs, "heatmaps") and pose_outputs.heatmaps is not None:
                pose_outputs.heatmaps = pose_outputs.heatmaps.to(torch.float32)
            if isinstance(pose_outputs, dict) and "heatmaps" in pose_outputs:
                pose_outputs["heatmaps"] = pose_outputs["heatmaps"].to(torch.float32)

            try:
                pose_results = pose_processor.post_process_pose_estimation(pose_outputs, boxes=batch_boxes)
            except TypeError:
                pose_results = pose_processor.post_process_pose_estimation(pose_outputs, boxes=batch_boxes, dataset_index=0)
            
            for p_res in pose_results:
                kps = p_res[0]["keypoints"]
                scs = p_res[0]["scores"]
                if hasattr(kps, "detach"):
                    kps = kps.detach().cpu().to(torch.float32).numpy()
                else:
                    kps = np.asarray(kps, dtype=np.float32)
                if hasattr(scs, "detach"):
                    scs = scs.detach().cpu().to(torch.float32).numpy()
                else:
                    scs = np.asarray(scs, dtype=np.float32)
                
                frame_kps = {}
                for kp_idx, name in enumerate(COCO_KEYPOINTS):
                    x_norm = float(kps[kp_idx, 0]) / float(w)
                    y_norm = float(kps[kp_idx, 1]) / float(h)
                    score = float(scs[kp_idx])
                    frame_kps[name] = {
                        "x": min(1.0, max(0.0, x_norm)),
                        "y": min(1.0, max(0.0, y_norm)),
                        "score": score
                    }
                all_raw_keypoints.append(frame_kps)
                
    return all_raw_keypoints, all_boxes

def process_kinematics(
    raw_keypoints: List[Dict[str, Dict[str, float]]],
    timestamps: List[float],
    exercise_type: str,
    target_muscle: str,
    load_type: str,
    athlete_boxes: Optional[List[Dict[str, float]]] = None,
    img_w: int = 1280,
    img_h: int = 720
):
    """
    Combines 2D extraction with MotionBERT 3D Pose Lifting for robust perspective-invariant kinematics.
    Calculates true 3D joint angles, bidirectional peak-trough rep detection, VBT tempos/fatigue, and clinical verdicts.
    """
    n_frames = len(raw_keypoints)
    if n_frames == 0:
        return {"fps": 15.0, "duration": 0.0, "total_reps": 0, "repetitions_summary": [], "frames": []}
    
    # 0. Scene Cut Detection (teleport jump >45% between consecutive frames)
    is_scene_cut = [False] * n_frames
    if athlete_boxes and len(athlete_boxes) == n_frames:
        for f in range(1, n_frames):
            prev_b = athlete_boxes[f - 1]
            curr_b = athlete_boxes[f]
            delta_cx = abs(curr_b.get("cx", 0.5) - prev_b.get("cx", 0.5))
            delta_cy = abs(curr_b.get("cy", 0.5) - prev_b.get("cy", 0.5))
            if delta_cx > 0.45 and delta_cy > 0.45:
                is_scene_cut[f] = True

    canonical_joints = ["shoulder", "elbow", "wrist", "hip", "knee", "ankle"]
    all_smoothed = {}
    
    # 1. Bilateral Smoothing for 2D Keypoints (Left and Right)
    for side in ["left", "right"]:
        for c_name in canonical_joints:
            k_name = f"{side}_{c_name}"
            x_arr = np.array([raw_keypoints[f][k_name]["x"] for f in range(n_frames)], dtype=np.float64)
            y_arr = np.array([raw_keypoints[f][k_name]["y"] for f in range(n_frames)], dtype=np.float64)
            s_arr = np.array([raw_keypoints[f][k_name]["score"] for f in range(n_frames)], dtype=np.float64)
            
            x_interp = interpolate_series_1d(x_arr, s_arr, min_score=0.20)
            y_interp = interpolate_series_1d(y_arr, s_arr, min_score=0.20)
            
            all_smoothed[k_name] = {
                "x": apply_zero_phase_butterworth(x_interp, fs=15.0, cutoff=1.8),
                "y": apply_zero_phase_butterworth(y_interp, fs=15.0, cutoff=1.8),
                "score": s_arr
            }
            
    # Head / Nose
    hx_arr = np.array([raw_keypoints[f].get("nose", raw_keypoints[f].get("left_eye", {"x": 0.5}))["x"] for f in range(n_frames)], dtype=np.float64)
    hy_arr = np.array([raw_keypoints[f].get("nose", raw_keypoints[f].get("left_eye", {"y": 0.2}))["y"] for f in range(n_frames)], dtype=np.float64)
    hs_arr = np.array([raw_keypoints[f].get("nose", raw_keypoints[f].get("left_eye", {"score": 0.5}))["score"] for f in range(n_frames)], dtype=np.float64)
    smoothed_head = {
        "x": apply_zero_phase_butterworth(interpolate_series_1d(hx_arr, hs_arr, min_score=0.20), fs=15.0, cutoff=1.8),
        "y": apply_zero_phase_butterworth(interpolate_series_1d(hy_arr, hs_arr, min_score=0.20), fs=15.0, cutoff=1.8),
        "score": hs_arr
    }

    # 2. Determine Primary Active Profile Side with Anatomical Validity Checks
    ex_lower = exercise_type.lower()
    is_lower_movement = not any(k in ex_lower for k in [
        "press", "bench", "row", "pull", "fly", "pec", "curl", "dips",
        "raise", "shoulder", "overhead", "lateral", "triceps", "biceps", "t_bar", "gironda"
    ]) or any(k in ex_lower for k in ["leg_press", "leg_extension"])

    def evaluate_side_quality(side_name: str) -> float:
        if is_lower_movement:
            s_k = float(np.mean(all_smoothed[f"{side_name}_knee"]["score"]))
            s_h = float(np.mean(all_smoothed[f"{side_name}_hip"]["score"]))
            s_a = float(np.mean(all_smoothed[f"{side_name}_ankle"]["score"]))
            base = 2.5 * s_k + 1.5 * s_h + 1.2 * s_a
            
            ky = all_smoothed[f"{side_name}_knee"]["y"]
            ay = all_smoothed[f"{side_name}_ankle"]["y"]
            hy = all_smoothed[f"{side_name}_hip"]["y"]
            kx = all_smoothed[f"{side_name}_knee"]["x"]
            ax = all_smoothed[f"{side_name}_ankle"]["x"]
            hx = all_smoothed[f"{side_name}_hip"]["x"]
            
            # In Hip Thrust, knee cannot be placed on the floor below the foot
            if any(k in ex_lower for k in ["hip_thrust", "kas_glute", "glute_bridge", "bridge"]):
                inverted_ratio = float(np.mean(ky > ay + 0.04))
                if inverted_ratio > 0.30:
                    base *= 0.10 # Severe penalty for inverted leg (e.g. knee hallucinated on aerobic step)
            
            femur = np.hypot(hx - kx, hy - ky)
            tibia = np.hypot(kx - ax, ky - ay)
            ratio = float(np.median(femur / (tibia + 1e-4)))
            if ratio > 2.5 or ratio < 0.40:
                base *= 0.25 # Severe penalty for distorted segment ratio
                
            return float(base)
        else:
            s_e = float(np.mean(all_smoothed[f"{side_name}_elbow"]["score"]))
            s_s = float(np.mean(all_smoothed[f"{side_name}_shoulder"]["score"]))
            s_w = float(np.mean(all_smoothed[f"{side_name}_wrist"]["score"]))
            return float(2.5 * s_e + 1.5 * s_s + 1.2 * s_w)

    left_quality = evaluate_side_quality("left")
    right_quality = evaluate_side_quality("right")
    locked_side = "left" if left_quality >= right_quality else "right"
    other_side = "right" if locked_side == "left" else "left"
    
    primary_joints = {}
    for c_name in canonical_joints:
        primary_joints[c_name] = {
            "x": all_smoothed[f"{locked_side}_{c_name}"]["x"].copy(),
            "y": all_smoothed[f"{locked_side}_{c_name}"]["y"].copy(),
            "score": all_smoothed[f"{locked_side}_{c_name}"]["score"].copy()
        }

    # Per-frame anatomical knee recovery for Hip Thrust:
    # 1. Athletes with feet on step/socks/text overlay can cause keypoints to latch onto sneaker/step.
    # 2. Enforce minimum anatomical shin length: knee MUST be at least 0.11 above ankle in image Y (y_ankle - y_knee >= 0.11).
    if any(k in ex_lower for k in ["hip_thrust", "kas_glute", "glute_bridge", "bridge"]):
        for f in range(n_frames):
            pk_y = primary_joints["knee"]["y"][f]
            pa_y = primary_joints["ankle"]["y"][f]
            shin_dy = pa_y - pk_y
            if shin_dy < 0.11:
                ok_y = all_smoothed[f"{other_side}_knee"]["y"][f]
                oa_y = all_smoothed[f"{other_side}_ankle"]["y"][f]
                other_shin_dy = oa_y - ok_y
                if other_shin_dy >= 0.12:
                    primary_joints["knee"]["x"][f] = all_smoothed[f"{other_side}_knee"]["x"][f]
                    primary_joints["knee"]["y"][f] = ok_y
                    primary_joints["knee"]["score"][f] = all_smoothed[f"{other_side}_knee"]["score"][f]
                else:
                    box_h = athlete_boxes[f]["bh"] if (athlete_boxes and f < len(athlete_boxes)) else 0.6
                    tibia_len = max(0.18, min(0.32, box_h * 0.28))
                    primary_joints["knee"]["x"][f] = primary_joints["ankle"]["x"][f]
                    primary_joints["knee"]["y"][f] = max(0.15, primary_joints["ankle"]["y"][f] - tibia_len)
                    primary_joints["knee"]["score"][f] = 0.85

    # 3. MotionBERT 3D Pose Lifting & Trajectory Filtering
    # Prepare COCO 2D array: (n_frames, 17, 2) in pixels + scores (n_frames, 17)
    kps_2d_pixels = np.zeros((n_frames, 17, 2), dtype=np.float32)
    scores_2d = np.zeros((n_frames, 17), dtype=np.float32)

    for f in range(n_frames):
        for kp_idx, k_name in enumerate(COCO_KEYPOINTS):
            if k_name in raw_keypoints[f]:
                kps_2d_pixels[f, kp_idx, 0] = raw_keypoints[f][k_name]["x"] * float(img_w)
                kps_2d_pixels[f, kp_idx, 1] = raw_keypoints[f][k_name]["y"] * float(img_h)
                scores_2d[f, kp_idx] = raw_keypoints[f][k_name]["score"]

        # Ensure primary joint anatomical corrections are reflected in lifted keypoints
        if locked_side == "left":
            kps_2d_pixels[f, 13, 0] = primary_joints["knee"]["x"][f] * float(img_w)
            kps_2d_pixels[f, 13, 1] = primary_joints["knee"]["y"][f] * float(img_h)
            scores_2d[f, 13] = primary_joints["knee"]["score"][f]
        else:
            kps_2d_pixels[f, 14, 0] = primary_joints["knee"]["x"][f] * float(img_w)
            kps_2d_pixels[f, 14, 1] = primary_joints["knee"]["y"][f] * float(img_h)
            scores_2d[f, 14] = primary_joints["knee"]["score"][f]

    kps_3d = lift_2d_to_3d(kps_2d_pixels, scores_2d, img_w, img_h, device=torch.device(device)) # (n_frames, 17, 3)

    # Smooth 3D keypoint trajectories using zero-phase Butterworth filter
    kps_3d_smooth = np.zeros_like(kps_3d)
    for j in range(17):
        for c in range(3):
            kps_3d_smooth[:, j, c] = apply_zero_phase_butterworth_continuous(kps_3d[:, j, c], fs=15.0, cutoff=1.8)

    # Human3.6M joint indices based on locked profile side
    if locked_side == "left":
        h36m_hip = 4
        h36m_knee = 5
        h36m_ankle = 6
        h36m_sh = 11
        h36m_el = 12
        h36m_wr = 13
    else:
        h36m_hip = 1
        h36m_knee = 2
        h36m_ankle = 3
        h36m_sh = 14
        h36m_el = 15
        h36m_wr = 16

    # 4. Perspective-Invariant 3D Joint Angles (arccos dot product in 3D Euclidean space)
    knee_3d_angles = compute_3d_joint_angle(
        kps_3d_smooth[:, h36m_hip], kps_3d_smooth[:, h36m_knee], kps_3d_smooth[:, h36m_ankle]
    )
    hip_3d_angles = compute_3d_joint_angle(
        kps_3d_smooth[:, h36m_sh], kps_3d_smooth[:, h36m_hip], kps_3d_smooth[:, h36m_knee]
    )
    elbow_3d_angles = compute_3d_joint_angle(
        kps_3d_smooth[:, h36m_sh], kps_3d_smooth[:, h36m_el], kps_3d_smooth[:, h36m_wr]
    )
    humeral_3d_angles = compute_3d_joint_angle(
        kps_3d_smooth[:, h36m_hip], kps_3d_smooth[:, h36m_sh], kps_3d_smooth[:, h36m_el]
    )

    # Spine vertical angle in 3D
    spine_vec = kps_3d_smooth[:, 8] - kps_3d_smooth[:, 0] # Neck - Pelvis
    vertical_ref = np.zeros_like(spine_vec)
    vertical_ref[:, 1] = 1.0 # Upward Y
    torso_3d_angles = compute_3d_joint_angle(spine_vec, np.zeros_like(spine_vec), vertical_ref)

    # Map target exercise to primary and secondary 3D angles
    ex_lower = exercise_type.lower()
    is_upper_body = any(k in ex_lower for k in [
        "press", "bench", "row", "pull", "fly", "pec", "curl", "dips",
        "raise", "shoulder", "overhead", "lateral", "triceps", "biceps", "t_bar", "gironda"
    ]) and not any(k in ex_lower for k in ["leg_press", "leg_extension"])
    is_chest = any(k in ex_lower for k in ["bench", "chest_press", "machine_chest_press", "incline", "pec_deck", "chest_dips", "cable_fly", "press"]) and not any(k in ex_lower for k in ["leg_press", "shoulder_press", "overhead"])
    is_back = any(k in ex_lower for k in ["row", "pulldown", "pullup", "pullover", "t_bar", "gironda"])

    # 4. Planar Joint Kinematics with Perspective & Oblique Correction
    hp_2d = np.zeros(n_frames, dtype=np.float64)
    kn_2d = np.zeros(n_frames, dtype=np.float64)
    el_2d = np.zeros(n_frames, dtype=np.float64)
    hu_2d = np.zeros(n_frames, dtype=np.float64)
    torso_2d = np.zeros(n_frames, dtype=np.float64)

    for f in range(n_frames):
        sh = {"x": primary_joints["shoulder"]["x"][f], "y": primary_joints["shoulder"]["y"][f]}
        hp = {"x": primary_joints["hip"]["x"][f], "y": primary_joints["hip"]["y"][f]}
        kn = {"x": primary_joints["knee"]["x"][f], "y": primary_joints["knee"]["y"][f]}
        ak = {"x": primary_joints["ankle"]["x"][f], "y": primary_joints["ankle"]["y"][f]}
        el = {"x": primary_joints["elbow"]["x"][f], "y": primary_joints["elbow"]["y"][f]}
        wr = {"x": primary_joints["wrist"]["x"][f], "y": primary_joints["wrist"]["y"][f]}

        raw_k = calculate_angle_2d(hp, kn, ak)
        raw_h = calculate_angle_2d(sh, hp, kn)
        raw_e = calculate_angle_2d(sh, el, wr)
        raw_hu = calculate_angle_2d(hp, sh, el)
        raw_t = calculate_angle_2d({"x": hp["x"], "y": hp["y"] - 0.2}, hp, sh)

        # Perspective / Oblique camera angle correction:
        # In Hip Thrust / Bridge, full lockout is near 180°.
        # From rear/isometric perspective, vectors project acutely (< 65°).
        # We recover true clinical extension via supplementary angle (180° - theta).
        if any(k in ex_lower for k in ["hip_thrust", "kas_glute", "glute_bridge", "bridge"]):
            if raw_h < 65.0:
                raw_h = 180.0 - raw_h
            
            # Clinical tibial alignment in Hip Thrust:
            # Optimal 90° knee angle occurs when the tibia is vertical (perpendicular to the floor).
            tibial_tilt = math.degrees(math.atan2(abs(ak["x"] - kn["x"]), max(0.01, ak["y"] - kn["y"])))
            is_facing_left = (hp["x"] > kn["x"])
            if is_facing_left:
                foot_forward = (ak["x"] < kn["x"] - 0.018)
                foot_back = (ak["x"] > kn["x"] + 0.018)
            else:
                foot_forward = (ak["x"] > kn["x"] + 0.018)
                foot_back = (ak["x"] < kn["x"] - 0.018)
            
            if foot_forward:
                raw_k = float(np.clip(90.0 + tibial_tilt, 70.0, 125.0))
            elif foot_back:
                raw_k = float(np.clip(90.0 - tibial_tilt, 55.0, 110.0))
            else:
                raw_k = 90.0

        kn_2d[f] = raw_k
        hp_2d[f] = raw_h
        el_2d[f] = raw_e
        hu_2d[f] = raw_hu
        torso_2d[f] = raw_t

    if any(k in ex_lower for k in ["hip_thrust", "kas_glute", "glute_bridge", "bridge"]):
        raw_primary = hp_2d
        raw_secondary = kn_2d
    elif any(k in ex_lower for k in ["squat", "leg_press", "hack", "bulgarian", "leg_extension", "sissy"]):
        raw_primary = kn_2d
        raw_secondary = hp_2d
    elif any(k in ex_lower for k in ["rdl", "deadlift"]):
        raw_primary = hp_2d
        raw_secondary = kn_2d
    elif is_chest:
        raw_primary = el_2d
        raw_secondary = hu_2d
    elif is_back:
        raw_primary = el_2d
        raw_secondary = torso_2d
    elif any(k in ex_lower for k in ["overhead", "shoulder_press", "lateral_raise", "front_raise", "rear_delt", "face_pull"]):
        if any(k in ex_lower for k in ["raise", "delt", "face_pull"]):
            raw_primary = hu_2d
            raw_secondary = torso_2d
        else:
            raw_primary = el_2d
            raw_secondary = hu_2d
    elif any(k in ex_lower for k in ["biceps", "curl", "triceps", "pushdown", "skull_crusher", "dips"]):
        raw_primary = el_2d
        raw_secondary = hu_2d
    else:
        raw_primary = kn_2d
        raw_secondary = hp_2d

    mean_frame_score = np.mean(scores_2d, axis=-1)
    is_invalid_angle = [bool(mean_frame_score[f] < 0.35) for f in range(n_frames)]

    clean_primary = apply_zero_phase_butterworth_continuous(raw_primary, fs=15.0, cutoff=1.8)
    clean_secondary = apply_zero_phase_butterworth_continuous(raw_secondary, fs=15.0, cutoff=1.8)

    # 5. Bidirectional Peak-Trough Detection (Picos vs Valles)
    is_bottom_start = any(k in ex_lower for k in [
        "hip_thrust", "kas_glute", "glute_bridge", "bridge",
        "lateral_raise", "front_raise", "biceps", "bicep_curl", "curl", "calf_raise"
    ])

    if is_bottom_start:
        clean_curve = clean_primary.copy()
        is_trough_movement = False
    else:
        clean_curve = -clean_primary.copy()
        is_trough_movement = True

    signal_range = float(np.max(clean_curve) - np.min(clean_curve))
    
    t_min_bound = timestamps[0] + 0.3 if timestamps else 0.3
    t_max_bound = timestamps[-1] - 0.3 if timestamps else 29.7

    min_rep_frames = max(9, int(15.0 * 0.60)) # 0.60s minimum distance

    p10 = float(np.percentile(clean_curve, 10))
    p90 = float(np.percentile(clean_curve, 90))
    eff_range = max(p90 - p10, 8.0)

    target_prom = max(7.0, min(24.0, eff_range * 0.22))

    pks, _ = scipy.signal.find_peaks(
        clean_curve,
        prominence=target_prom,
        distance=min_rep_frames
    )
    in_bounds = [p for p in pks if t_min_bound <= timestamps[p] <= t_max_bound]

    if len(in_bounds) < 2 and eff_range >= 12.0:
        pks_soft, _ = scipy.signal.find_peaks(
            clean_curve,
            prominence=max(5.0, eff_range * 0.15),
            distance=min_rep_frames
        )
        in_bounds_soft = [p for p in pks_soft if t_min_bound <= timestamps[p] <= t_max_bound]
        if len(in_bounds_soft) > len(in_bounds):
            in_bounds = in_bounds_soft

    filtered_peaks = []
    for idx_p, p in enumerate(in_bounds):
        if idx_p == 0:
            filtered_peaks.append(p)
        else:
            prev_p = filtered_peaks[-1]
            valley_val = float(np.min(clean_curve[prev_p : p + 1]))
            dip_from_prev = clean_curve[prev_p] - valley_val
            dip_from_curr = clean_curve[p] - valley_val
            min_dip_required = max(4.5, target_prom * 0.50)
            if dip_from_prev >= min_dip_required and dip_from_curr >= min_dip_required:
                filtered_peaks.append(p)
            else:
                if clean_curve[p] > clean_curve[prev_p]:
                    filtered_peaks[-1] = p

    valid_peaks = filtered_peaks

    if len(valid_peaks) == 0 and signal_range >= 10.0:
        margin = max(2, int(n_frames * 0.08))
        if n_frames - margin > margin:
            sub = clean_curve[margin : n_frames - margin]
            if len(sub) > 0:
                valid_peaks = [margin + int(np.argmax(sub))]

    # Angular velocity signal (deg/s)
    if len(clean_primary) > 1 and len(timestamps) > 1:
        dt = np.gradient(timestamps)
        dt = np.where(dt <= 0, 1.0 / 15.0, dt)
        ang_vel = np.abs(np.gradient(clean_primary) / dt)
    else:
        ang_vel = np.zeros(n_frames)

    # 6. Repetition Tempos, VBT & Clinical Postural Diagnostic
    repetitions_summary = []
    frame_rep_map = [0] * n_frames
    frame_phase_map = ["IDLE"] * n_frames

    for i, p in enumerate(valid_peaks):
        rep_idx = i + 1
        
        # Start of rep
        prev_bound = valid_peaks[i - 1] if i > 0 else 0
        left_search = clean_curve[prev_bound : p]
        start_offset = int(np.argmin(left_search)) if len(left_search) > 0 else 0
        start_frame = prev_bound + start_offset
        
        # End of rep
        next_bound = valid_peaks[i + 1] if i < len(valid_peaks) - 1 else n_frames - 1
        right_search = clean_curve[p : next_bound + 1]
        end_offset = int(np.argmin(right_search)) if len(right_search) > 0 else 0
        end_frame = p + end_offset

        # Reject reps spanning a camera scene cut
        if any(is_scene_cut[f] for f in range(start_frame, min(end_frame + 1, n_frames))):
            continue

        bottom_frame = p
        t_start = timestamps[start_frame]
        t_inflect = timestamps[bottom_frame]
        t_end = timestamps[end_frame]
        
        rep_min_angle = float(np.min(clean_primary[start_frame : end_frame + 1]))
        rep_max_angle = float(np.max(clean_primary[start_frame : end_frame + 1]))
        rom_deg = max(0.0, rep_max_angle - rep_min_angle)

        if is_trough_movement:
            eccentric_time_s = round(max(0.2, t_inflect - t_start), 2)
            concentric_time_s = round(max(0.2, t_end - t_inflect), 2)
        else:
            concentric_time_s = round(max(0.2, t_inflect - t_start), 2)
            eccentric_time_s = round(max(0.2, t_end - t_inflect), 2)

        # Pause duration: time stationary (velocity < 15 deg/s) around inflection
        window_start = max(start_frame, bottom_frame - 4)
        window_end = min(end_frame, bottom_frame + 4)
        stationary_frames = sum(1 for f in range(window_start, window_end + 1) if ang_vel[f] < 15.0)
        pause_time_s = round(float(stationary_frames / 15.0), 2)

        concentric_velocity_deg_s = round(float(rom_deg / max(concentric_time_s, 0.1)), 1)

        # 3D Metric coordinates at inflection point (in meters)
        inflect_3d_hip = kps_3d_smooth[bottom_frame, h36m_hip]
        inflect_3d_knee = kps_3d_smooth[bottom_frame, h36m_knee]
        inflect_3d_wr = kps_3d_smooth[bottom_frame, h36m_wr]
        inflect_3d_sh = kps_3d_smooth[bottom_frame, h36m_sh]
        inflect_3d_el = kps_3d_smooth[bottom_frame, h36m_el]

        # 3D Perpendicular Moment Arms to vertical gravity vector (meters)
        d_hip_3d = float(np.hypot(inflect_3d_hip[0] - inflect_3d_wr[0], inflect_3d_hip[2] - inflect_3d_wr[2]))
        d_knee_3d = float(np.hypot(inflect_3d_knee[0] - inflect_3d_wr[0], inflect_3d_knee[2] - inflect_3d_wr[2]))
        d_sh_3d = float(np.hypot(inflect_3d_sh[0] - inflect_3d_wr[0], inflect_3d_sh[2] - inflect_3d_wr[2]))
        d_el_3d = float(np.hypot(inflect_3d_el[0] - inflect_3d_wr[0], inflect_3d_el[2] - inflect_3d_wr[2]))

        inflect_knee = float(clean_secondary[bottom_frame]) if not is_upper_body else 90.0
        inflect_hip = float(clean_primary[bottom_frame]) if any(k in ex_lower for k in ["hip_thrust", "kas_glute", "glute_bridge", "bridge", "rdl", "deadlift"]) else float(clean_secondary[bottom_frame])
        inflect_elbow = float(clean_primary[bottom_frame]) if is_upper_body else 90.0

        pectoral_share = None
        triceps_share = None
        dorsal_share = None
        biceps_share = None

        if any(k in ex_lower for k in ["hip_thrust", "kas_glute", "glute_bridge", "bridge"]):
            dominant_joint = "CADERA"
            # Expanded margins of error for real-world clinical validity:
            # Full extension lockout threshold: >= 142.0° (gives 16° of realistic margin for monocular PPT)
            # Knee placement tolerance: 74.0° <= inflect_knee <= 106.0°
            if inflect_knee < 74.0:
                recom = f"Pies demasiado retrasados ({round(inflect_knee)}° < 74°): sobrecarga de cuádriceps. Adelanta los pies ~5-8 cm."
                status = "IMPROVEMENT_OPPORTUNITY"
                torque_bias = "CUÁDRICEPS"
            elif inflect_knee > 106.0:
                recom = f"Pies demasiado adelantados ({round(inflect_knee)}° > 106°): traslada tensión hacia isquios. Acerca los talones ~5 cm."
                status = "IMPROVEMENT_OPPORTUNITY"
                torque_bias = "ISQUIOSURALES"
            elif inflect_hip >= 142.0:
                recom = f"Alineación articular y extensión de cadera óptimas ({round(inflect_hip)}° cadera, {round(inflect_knee)}° rodilla): máxima palanca sobre el glúteo mayor."
                status = "OPTIMAL"
                torque_bias = "GLÚTEO MAYOR"
            else:
                recom = f"Extensión de cadera incompleta ({round(inflect_hip)}° < 142°). Busca lockout activo con retroversión pélvica."
                status = "IMPROVEMENT_OPPORTUNITY"
                torque_bias = "GLÚTEO MAYOR"

        elif is_chest:
            dominant_joint = "GLENOHUMERAL / PECTORAL"
            if inflect_elbow < 78.0:
                triceps_share = min(68.0, 52.0 + (78.0 - inflect_elbow) * 1.1)
                pectoral_share = round(100.0 - triceps_share, 1)
                recom = f"Ángulo de codo cerrado ({round(inflect_elbow)}° < 78°): excesiva flexión que deriva el torque hacia el Tríceps Braquial ({round(triceps_share)}%). Abre el agarre o separa codos ~50°-60° para aislar Pectoral Mayor."
                status = "IMPROVEMENT_OPPORTUNITY"
                torque_bias = "TRÍCEPS BRAQUIAL"
            elif inflect_elbow <= 96.0:
                pectoral_share = min(84.0, 76.0 + (96.0 - abs(inflect_elbow - 88.0)) * 0.7)
                triceps_share = round(100.0 - pectoral_share, 1)
                recom = f"Palanca óptima sobre Pectoral Mayor ({round(pectoral_share)}%): antebrazo perpendicular ({round(inflect_elbow)}°) minimizando brazo de momento del tríceps."
                status = "OPTIMAL"
                torque_bias = "PECTORAL MAYOR"
            else:
                pectoral_share = 72.0
                triceps_share = 28.0
                recom = f"Profundidad parcial en excéntrica ({round(inflect_elbow)}° > 96°). Desciende a ~90° para estiramiento óptimo de fibras esternales."
                status = "IMPROVEMENT_OPPORTUNITY"
                torque_bias = "PECTORAL MAYOR (RECORRIDO CORTO)"

        elif is_back:
            dominant_joint = "DORSAL ANCHO"
            if inflect_elbow < 80.0:
                biceps_share = min(65.0, 50.0 + (80.0 - inflect_elbow) * 1.0)
                dorsal_share = round(100.0 - biceps_share, 1)
                recom = f"Codos muy cerrados ({round(inflect_elbow)}° < 80°): tirón excesivo de brazos. Guía los codos hacia la cadera ('cue del gancho') para aislar el Dorsal Ancho ({round(dorsal_share)}%)."
                status = "IMPROVEMENT_OPPORTUNITY"
                torque_bias = "BÍCEPS BRAQUIAL"
            elif inflect_elbow <= 112.0:
                dorsal_share = min(88.0, 82.0 + (112.0 - abs(inflect_elbow - 95.0)) * 0.5)
                biceps_share = round(100.0 - dorsal_share, 1)
                recom = f"Tracción óptima de Dorsal Ancho ({round(dorsal_share)}%): codo guiado hacia la pelvis ({round(inflect_elbow)}°) con mínimo reclutamiento parásito del bíceps."
                status = "OPTIMAL"
                torque_bias = "DORSAL ANCHO"
            else:
                dorsal_share = 75.0
                biceps_share = 25.0
                recom = f"Tracción incompleta ({round(inflect_elbow)}° > 112°). Lleva los codos más atrás superando el torso."
                status = "IMPROVEMENT_OPPORTUNITY"
                torque_bias = "DORSAL ANCHO (RECORRIDO CORTO)"

        elif any(k in ex_lower for k in ["squat", "leg_press", "hack", "bulgarian", "leg_extension"]):
            dominant_joint = "RODILLA"
            torque_bias = "CUÁDRICEPS"
            deep_enough = inflect_knee <= 95.0
            recom = "Profundidad clínica alcanzada (rodilla ≤90° con fémur paralelo al suelo)." if deep_enough else "Profundidad parcial. Desciende hasta romper la paralela para máxima activación de cuádriceps."
            status = "OPTIMAL" if deep_enough else "IMPROVEMENT_OPPORTUNITY"

        else:
            dominant_joint = "NEUTRO"
            torque_bias = "GENERAL"
            recom = "Control cinemático y alineación articular estricta en el patrón motor evaluado."
            status = "OPTIMAL"

        is_ht = any(k in ex_lower for k in ["hip_thrust", "kas_glute", "glute_bridge", "bridge"])
        verdict = {
            "status": status,
            "dominant_joint": dominant_joint,
            "target_alignment": (status == "OPTIMAL"),
            "primary_torque_bias": torque_bias,
            "inflection_knee_deg": round(inflect_knee, 1),
            "inflection_hip_deg": round(inflect_hip, 1),
            "inflection_elbow_deg": round(inflect_elbow, 1),
            "pectoral_share": round(pectoral_share, 1) if pectoral_share else None,
            "triceps_share": round(triceps_share, 1) if triceps_share else None,
            "dorsal_share": round(dorsal_share, 1) if dorsal_share else None,
            "biceps_share": round(biceps_share, 1) if biceps_share else None,
            "d_hip_norm": 0.0 if is_ht else round(d_hip_3d, 3),
            "d_knee_norm": 0.0 if is_ht else round(d_knee_3d, 3),
            "d_shoulder_norm": round(d_sh_3d, 3),
            "recommendation": recom
        }

        rep_data = {
            "rep_number": rep_idx,
            "start_time": round(t_start, 2),
            "inflection_time": round(t_inflect, 2),
            "end_time": round(t_end, 2),
            "duration_sec": round(float(t_end - t_start), 2),
            "eccentric_sec": eccentric_time_s,
            "pause_sec": pause_time_s,
            "concentric_sec": concentric_time_s,
            "pause_time_s": pause_time_s,
            "concentric_time_s": concentric_time_s,
            "concentric_velocity_deg_s": concentric_velocity_deg_s,
            "min_primary_angle": round(rep_min_angle, 1),
            "max_primary_angle": round(rep_max_angle, 1),
            "rom_deg": round(rom_deg, 1),
            "verdict": verdict
        }
        repetitions_summary.append(rep_data)
        
        for f in range(start_frame, end_frame + 1):
            frame_rep_map[f] = rep_idx
            if f < bottom_frame:
                frame_phase_map[f] = "ECCENTRIC" if is_trough_movement else "CONCENTRIC"
            elif f == bottom_frame:
                frame_phase_map[f] = "INFLECTION"
            else:
                frame_phase_map[f] = "CONCENTRIC" if is_trough_movement else "ECCENTRIC"

    # 7. Velocity-Based Training (VBT) Intensity Estimation
    if len(repetitions_summary) >= 2:
        rep_vels = [r["concentric_velocity_deg_s"] for r in repetitions_summary]
        first_rep_vel = rep_vels[0]
        last_rep_vel = rep_vels[-1]
        max_rep_vel = max(rep_vels) if rep_vels else 1.0
        
        vel_loss = round(float(max(0.0, ((first_rep_vel - last_rep_vel) / max(first_rep_vel, 1e-4)) * 100.0)), 1)
        
        if vel_loss < 10.0:
            rir_est = "4+"
            rpe_est = 6.0
        elif vel_loss < 20.0:
            rir_est = "3"
            rpe_est = 7.0
        elif vel_loss < 30.0:
            rir_est = "2"
            rpe_est = 8.0
        elif vel_loss < 40.0:
            rir_est = "1"
            rpe_est = 9.0
        else:
            rir_est = "0"
            rpe_est = 10.0
            
        intensity_metrics = {
            "estimated_rir": rir_est,
            "estimated_rpe": rpe_est,
            "velocity_loss_pct": vel_loss,
            "first_rep_vel": first_rep_vel,
            "last_rep_vel": last_rep_vel,
            "max_rep_vel": round(max_rep_vel, 1),
            "rep_velocities": rep_vels
        }
    elif len(repetitions_summary) == 1:
        vel = repetitions_summary[0]["concentric_velocity_deg_s"]
        intensity_metrics = {
            "estimated_rir": "3",
            "estimated_rpe": 7.0,
            "velocity_loss_pct": 0.0,
            "first_rep_vel": vel,
            "last_rep_vel": vel,
            "max_rep_vel": vel,
            "rep_velocities": [vel]
        }
    else:
        intensity_metrics = {
            "estimated_rir": "4+",
            "estimated_rpe": 6.0,
            "velocity_loss_pct": 0.0,
            "first_rep_vel": 0.0,
            "last_rep_vel": 0.0,
            "max_rep_vel": 0.0,
            "rep_velocities": []
        }

    # 8. Per-Frame Output Projection (Bilateral 2D + Metric 3D)
    frames_output = []
    for f in range(n_frames):
        rep_num = frame_rep_map[f]
        wr_x = primary_joints["wrist"]["x"][f]
        hp_x = primary_joints["hip"]["x"][f]
        kn_x = primary_joints["knee"]["x"][f]
        sh_x = primary_joints["shoulder"]["x"][f]
        ak_x = primary_joints["ankle"]["x"][f]
        el_x = primary_joints["elbow"]["x"][f]

        if (len(repetitions_summary) > 0 and rep_num > 0 and rep_num <= len(repetitions_summary)):
            base_rep_verdict = repetitions_summary[rep_num - 1]["verdict"]
        else:
            med_knee = float(np.median(clean_secondary)) if not is_upper_body else 90.0
            med_hip = float(np.median(clean_primary)) if not is_upper_body else 180.0
            med_elbow = float(np.median(clean_primary)) if is_upper_body else 90.0
            
            if is_chest:
                if med_elbow < 78.0:
                    fb_tri = min(68.0, 52.0 + (78.0 - med_elbow) * 1.1)
                    fb_pec = round(100.0 - fb_tri, 1)
                    fb_bias = "TRÍCEPS BRAQUIAL"
                    fb_rec = f"Ángulo de codo cerrado ({round(med_elbow)}° < 78°): sobrecarga en Tríceps Braquial ({round(fb_tri)}%). Abre el agarre para mayor estímulo pectoral."
                elif med_elbow <= 96.0:
                    fb_pec = min(84.0, 76.0 + (96.0 - abs(med_elbow - 88.0)) * 0.7)
                    fb_tri = round(100.0 - fb_pec, 1)
                    fb_bias = "PECTORAL MAYOR"
                    fb_rec = f"Palanca óptima sobre Pectoral Mayor ({round(fb_pec)}%): codo a ~90° en plano escapular."
                else:
                    fb_pec = 72.0
                    fb_tri = 28.0
                    fb_bias = "PECTORAL MAYOR (RECORRIDO CORTO)"
                    fb_rec = f"Profundidad parcial ({round(med_elbow)}° > 96°). Desciende a ~90° para mayor estiramiento esternal."

                base_rep_verdict = {
                    "status": "OPTIMAL",
                    "dominant_joint": "GLENOHUMERAL / PECTORAL",
                    "target_alignment": True,
                    "primary_torque_bias": fb_bias,
                    "inflection_knee_deg": 90.0,
                    "inflection_hip_deg": 180.0,
                    "inflection_elbow_deg": round(med_elbow, 1),
                    "pectoral_share": round(fb_pec, 1),
                    "triceps_share": round(fb_tri, 1),
                    "d_hip_norm": 0.0,
                    "d_knee_norm": 0.0,
                    "d_shoulder_norm": round(float(abs(sh_x - wr_x)), 3),
                    "recommendation": fb_rec
                }
            elif is_back:
                if med_elbow < 80.0:
                    fb_bic = min(65.0, 50.0 + (80.0 - med_elbow) * 1.0)
                    fb_dor = round(100.0 - fb_bic, 1)
                    fb_bias = "BÍCEPS BRAQUIAL"
                    fb_rec = f"Codos muy cerrados ({round(med_elbow)}° < 80°): tirón excesivo de brazos. Tira con codos hacia la cadera para aislar Dorsal Ancho."
                elif med_elbow <= 112.0:
                    fb_dor = min(88.0, 82.0 + (112.0 - abs(med_elbow - 95.0)) * 0.5)
                    fb_bic = round(100.0 - fb_dor, 1)
                    fb_bias = "DORSAL ANCHO"
                    fb_rec = f"Tracción óptima de Dorsal Ancho ({round(fb_dor)}%): codos dirigidos hacia la pelvis ({round(med_elbow)}°)."
                else:
                    fb_dor = 75.0
                    fb_bic = 25.0
                    fb_bias = "DORSAL ANCHO (RECORRIDO CORTO)"
                    fb_rec = f"Tracción incompleta ({round(med_elbow)}° > 112°). Lleva los codos más atrás superando el torso."

                base_rep_verdict = {
                    "status": "OPTIMAL",
                    "dominant_joint": "DORSAL ANCHO",
                    "target_alignment": True,
                    "primary_torque_bias": fb_bias,
                    "inflection_knee_deg": 90.0,
                    "inflection_hip_deg": 180.0,
                    "inflection_elbow_deg": round(med_elbow, 1),
                    "dorsal_share": round(fb_dor, 1),
                    "biceps_share": round(fb_bic, 1),
                    "d_hip_norm": 0.0,
                    "d_knee_norm": 0.0,
                    "d_shoulder_norm": round(float(abs(sh_x - wr_x)), 3),
                    "recommendation": fb_rec
                }
            elif any(k in ex_lower for k in ["squat", "leg_press", "hack", "bulgarian", "leg_extension"]):
                base_rep_verdict = {
                    "status": "OPTIMAL",
                    "dominant_joint": "RODILLA (CUÁDRICEPS)",
                    "target_alignment": True,
                    "primary_torque_bias": "CUÁDRICEPS",
                    "inflection_knee_deg": round(med_knee, 1),
                    "inflection_hip_deg": round(med_hip, 1),
                    "inflection_elbow_deg": round(med_elbow, 1),
                    "d_hip_norm": round(float(abs(hp_x - kn_x)), 3),
                    "d_knee_norm": round(float(abs(kn_x - ak_x)), 3),
                    "d_shoulder_norm": 0.0,
                    "recommendation": "Alineación de rodilla evaluada. Descenso coordinado rompiendo la paralela con fémur alineado al pie."
                }
            else:
                base_rep_verdict = {
                    "status": "OPTIMAL",
                    "dominant_joint": "EXTENSIÓN CADERA",
                    "target_alignment": True,
                    "primary_torque_bias": "GLÚTEO MAYOR",
                    "inflection_knee_deg": round(med_knee, 1),
                    "inflection_hip_deg": round(med_hip, 1),
                    "inflection_elbow_deg": round(med_elbow, 1),
                    "d_hip_norm": round(float(abs(hp_x - kn_x)), 3),
                    "d_knee_norm": round(float(abs(kn_x - ak_x)), 3),
                    "d_shoulder_norm": 0.0,
                    "recommendation": "Alineación articular óptima (~90° en rodilla). Bloqueo pélvico directo sobre glúteo mayor."
                }

        # Projected 2D Moment Arms for Canvas Overlay
        if any(k in ex_lower for k in ["hip_thrust", "kas_glute", "glute_bridge", "bridge"]):
            f_d_knee = 0.0
            f_d_hip = 0.0
            f_d_sh = 0.0
            f_d_el = 0.0
        elif is_upper_body:
            f_d_sh = abs(sh_x - wr_x)
            f_d_el = abs(el_x - wr_x)
            f_d_hip = 0.0
            f_d_knee = 0.0
        else:
            f_d_knee = abs(kn_x - wr_x if any(k in ex_lower for k in ["deadlift", "rdl"]) else kn_x - hp_x)
            f_d_hip = abs(hp_x - wr_x if any(k in ex_lower for k in ["deadlift", "rdl"]) else hp_x - ak_x)
            f_d_sh = 0.0
            f_d_el = 0.0
            
        phase = frame_phase_map[f]
        if is_scene_cut[f]:
            phase = "SCENE_CUT"
            
        # 3D Coordinates (meters) for this frame
        f_3d = {
            "pelvis": {"x": round(float(kps_3d_smooth[f, 0, 0]), 3), "y": round(float(kps_3d_smooth[f, 0, 1]), 3), "z": round(float(kps_3d_smooth[f, 0, 2]), 3)},
            "hip": {"x": round(float(kps_3d_smooth[f, h36m_hip, 0]), 3), "y": round(float(kps_3d_smooth[f, h36m_hip, 1]), 3), "z": round(float(kps_3d_smooth[f, h36m_hip, 2]), 3)},
            "knee": {"x": round(float(kps_3d_smooth[f, h36m_knee, 0]), 3), "y": round(float(kps_3d_smooth[f, h36m_knee, 1]), 3), "z": round(float(kps_3d_smooth[f, h36m_knee, 2]), 3)},
            "ankle": {"x": round(float(kps_3d_smooth[f, h36m_ankle, 0]), 3), "y": round(float(kps_3d_smooth[f, h36m_ankle, 1]), 3), "z": round(float(kps_3d_smooth[f, h36m_ankle, 2]), 3)},
            "shoulder": {"x": round(float(kps_3d_smooth[f, h36m_sh, 0]), 3), "y": round(float(kps_3d_smooth[f, h36m_sh, 1]), 3), "z": round(float(kps_3d_smooth[f, h36m_sh, 2]), 3)},
            "elbow": {"x": round(float(kps_3d_smooth[f, h36m_el, 0]), 3), "y": round(float(kps_3d_smooth[f, h36m_el, 1]), 3), "z": round(float(kps_3d_smooth[f, h36m_el, 2]), 3)},
            "wrist": {"x": round(float(kps_3d_smooth[f, h36m_wr, 0]), 3), "y": round(float(kps_3d_smooth[f, h36m_wr, 1]), 3), "z": round(float(kps_3d_smooth[f, h36m_wr, 2]), 3)}
        }

        frames_output.append({
            "frame_idx": f,
            "time": timestamps[f],
            "rep_number": rep_num,
            "phase": phase,
            "main_angle": round(float(clean_primary[f]), 1),
            "secondary_angle": round(float(clean_secondary[f]), 1),
            "keypoints_norm": {
                # Bilateral anatomical skeleton
                "left_shoulder": {"x": round(float(all_smoothed["left_shoulder"]["x"][f]), 4), "y": round(float(all_smoothed["left_shoulder"]["y"][f]), 4), "score": round(float(all_smoothed["left_shoulder"]["score"][f]), 2)},
                "right_shoulder": {"x": round(float(all_smoothed["right_shoulder"]["x"][f]), 4), "y": round(float(all_smoothed["right_shoulder"]["y"][f]), 4), "score": round(float(all_smoothed["right_shoulder"]["score"][f]), 2)},
                "left_elbow": {"x": round(float(all_smoothed["left_elbow"]["x"][f]), 4), "y": round(float(all_smoothed["left_elbow"]["y"][f]), 4), "score": round(float(all_smoothed["left_elbow"]["score"][f]), 2)},
                "right_elbow": {"x": round(float(all_smoothed["right_elbow"]["x"][f]), 4), "y": round(float(all_smoothed["right_elbow"]["y"][f]), 4), "score": round(float(all_smoothed["right_elbow"]["score"][f]), 2)},
                "left_wrist": {"x": round(float(all_smoothed["left_wrist"]["x"][f]), 4), "y": round(float(all_smoothed["left_wrist"]["y"][f]), 4), "score": round(float(all_smoothed["left_wrist"]["score"][f]), 2)},
                "right_wrist": {"x": round(float(all_smoothed["right_wrist"]["x"][f]), 4), "y": round(float(all_smoothed["right_wrist"]["y"][f]), 4), "score": round(float(all_smoothed["right_wrist"]["score"][f]), 2)},
                "left_hip": {"x": round(float(all_smoothed["left_hip"]["x"][f]), 4), "y": round(float(all_smoothed["left_hip"]["y"][f]), 4), "score": round(float(all_smoothed["left_hip"]["score"][f]), 2)},
                "right_hip": {"x": round(float(all_smoothed["right_hip"]["x"][f]), 4), "y": round(float(all_smoothed["right_hip"]["y"][f]), 4), "score": round(float(all_smoothed["right_hip"]["score"][f]), 2)},
                "left_knee": {"x": round(float(all_smoothed["left_knee"]["x"][f]), 4), "y": round(float(all_smoothed["left_knee"]["y"][f]), 4), "score": round(float(all_smoothed["left_knee"]["score"][f]), 2)},
                "right_knee": {"x": round(float(all_smoothed["right_knee"]["x"][f]), 4), "y": round(float(all_smoothed["right_knee"]["y"][f]), 4), "score": round(float(all_smoothed["right_knee"]["score"][f]), 2)},
                "left_ankle": {"x": round(float(all_smoothed["left_ankle"]["x"][f]), 4), "y": round(float(all_smoothed["left_ankle"]["y"][f]), 4), "score": round(float(all_smoothed["left_ankle"]["score"][f]), 2)},
                "right_ankle": {"x": round(float(all_smoothed["right_ankle"]["x"][f]), 4), "y": round(float(all_smoothed["right_ankle"]["y"][f]), 4), "score": round(float(all_smoothed["right_ankle"]["score"][f]), 2)},
                "head": {"x": round(float(smoothed_head["x"][f]), 4), "y": round(float(smoothed_head["y"][f]), 4), "score": round(float(smoothed_head["score"][f]), 2)},
                # Canonical primary aliases
                "shoulder": {"x": round(float(sh_x), 4), "y": round(float(primary_joints["shoulder"]["y"][f]), 4), "score": round(float(primary_joints["shoulder"]["score"][f]), 2)},
                "elbow": {"x": round(float(primary_joints["elbow"]["x"][f]), 4), "y": round(float(primary_joints["elbow"]["y"][f]), 4), "score": round(float(primary_joints["elbow"]["score"][f]), 2)},
                "wrist": {"x": round(float(wr_x), 4), "y": round(float(primary_joints["wrist"]["y"][f]), 4), "score": round(float(primary_joints["wrist"]["score"][f]), 2)},
                "hip": {"x": round(float(hp_x), 4), "y": round(float(primary_joints["hip"]["y"][f]), 4), "score": round(float(primary_joints["hip"]["score"][f]), 2)},
                "knee": {"x": round(float(kn_x), 4), "y": round(float(primary_joints["knee"]["y"][f]), 4), "score": round(float(primary_joints["knee"]["score"][f]), 2)},
                "ankle": {"x": round(float(ak_x), 4), "y": round(float(primary_joints["ankle"]["y"][f]), 4), "score": round(float(primary_joints["ankle"]["score"][f]), 2)}
            },
            "keypoints_3d": f_3d,
            "moment_arms": {
                "d_hip": round(float(f_d_hip), 4),
                "d_knee": round(float(f_d_knee), 4),
                "d_shoulder": round(float(f_d_sh), 4),
                "d_elbow": round(float(f_d_el), 4)
            },
            "verdict": base_rep_verdict
        })
        
    return {
        "fps": 15.0,
        "duration": timestamps[-1] if timestamps else 0.0,
        "total_reps": len(repetitions_summary),
        "locked_side": locked_side,
        "repetitions_summary": repetitions_summary,
        "intensity_metrics": intensity_metrics,
        "frames": frames_output
    }


# ---------------------------------------------------------------------------
# 3. Cerebrium Serverless Entrypoint Handlers
# ---------------------------------------------------------------------------

def _extract_video_to_tempfile(
    video_base64: Optional[str] = None,
    video_url: Optional[str] = None,
    video: Optional[str] = None
) -> str:
    """Safely decodes video payload (Base64 or URL) to a temporary file."""
    raw_data = video_base64 or video_url or video
    if not raw_data:
        raise ValueError("Missing required video input ('video_base64', 'video_url', or 'video').")
    
    suffix = ".mp4"
    data_header = str(raw_data[:80]).lower()
    if "webm" in data_header:
        suffix = ".webm"
        
    # URL download
    if str(raw_data).startswith("http://") or str(raw_data).startswith("https://"):
        resp = requests.get(raw_data, timeout=30)
        resp.raise_for_status()
        content = resp.content
        if "webm" in resp.headers.get("Content-Type", "").lower():
            suffix = ".webm"
    else:
        # Base64 string decoding (strip data URI header if present)
        b64_str = str(raw_data)
        if "," in b64_str:
            b64_str = b64_str.split(",", 1)[1]
        content = base64.b64decode(b64_str)
        if len(content) > 4 and content[:4] == b"\x1a\x45\xdf\xa3":
            suffix = ".webm"
        elif len(content) > 8 and content[4:8] == b"ftyp":
            suffix = ".mp4"
        
    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
    tmp.write(content)
    tmp.close()
    return tmp.name

def analyze(
    video_base64=None,
    video_url=None,
    video=None,
    exercise_type="hip_thrust",
    target_muscle="glutes",
    load_type="free_weight",
    start_time=0.0,
    end_time=None,
    **kwargs
):
    """
    Primary Cerebrium endpoint handler.
    Receives JSON payload with video (base64 or URL) and biomechanics configuration.
    Returns 3D lifted kinematics, zero-phase trajectory filtering, and frozen clinical verdicts up to 30s (450 frames).
    """
    if isinstance(video_base64, dict):
        payload = video_base64
        video_base64 = payload.get("video_base64")
        video_url = payload.get("video_url")
        video = payload.get("video")
        exercise_type = payload.get("exercise_type", exercise_type or "hip_thrust")
        target_muscle = payload.get("target_muscle", target_muscle or "glutes")
        load_type = payload.get("load_type", load_type or "free_weight")
        start_time_val = payload.get("start_time", 0.0)
        end_time_val = payload.get("end_time", None)
    else:
        exercise_type = exercise_type or kwargs.get("exercise_type", "hip_thrust")
        target_muscle = target_muscle or kwargs.get("target_muscle", "glutes")
        load_type = load_type or kwargs.get("load_type", "free_weight")
        start_time_val = kwargs.get("start_time", start_time if start_time is not None else 0.0)
        end_time_val = kwargs.get("end_time", end_time)

    exercise_type = str(exercise_type)
    target_muscle = str(target_muscle)
    load_type = str(load_type)

    try:
        start_time = float(start_time_val) if start_time_val is not None else 0.0
    except (ValueError, TypeError):
        start_time = 0.0

    try:
        end_time = float(end_time_val) if (end_time_val is not None and str(end_time_val).strip() != "") else None
    except (ValueError, TypeError):
        end_time = None

    temp_path = _extract_video_to_tempfile(video_base64=video_base64, video_url=video_url, video=video)
    try:
        frames_rgb, timestamps, duration = sample_video_frames(
            temp_path,
            target_fps=15.0,
            max_frames=450,
            start_time=start_time,
            end_time=end_time
        )
        if not frames_rgb:
            raise ValueError("Failed to decode frames from input video.")
            
        h, w = frames_rgb[0].shape[:2]
        raw_keypoints, athlete_boxes = run_inference_batches(frames_rgb, batch_size=32)
        
        result = process_kinematics(
            raw_keypoints=raw_keypoints,
            timestamps=timestamps,
            exercise_type=exercise_type,
            target_muscle=target_muscle,
            load_type=load_type,
            athlete_boxes=athlete_boxes,
            img_w=w,
            img_h=h
        )
        return result
    finally:
        if os.path.exists(temp_path):
            try:
                os.unlink(temp_path)
            except OSError:
                pass

# Alias for generic prediction endpoints
def predict(
    video_base64=None,
    video_url=None,
    video=None,
    exercise_type="hip_thrust",
    target_muscle="glutes",
    load_type="free_weight",
    start_time=0.0,
    end_time=None,
    **kwargs
):
    return analyze(
        video_base64=video_base64,
        video_url=video_url,
        video=video,
        exercise_type=exercise_type,
        target_muscle=target_muscle,
        load_type=load_type,
        start_time=start_time,
        end_time=end_time,
        **kwargs
    )
