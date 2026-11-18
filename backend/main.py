"""
Clinical Biomechanics Pipeline - Cerebrium Serverless Backend
Powered by:
- RT-DETR (PekingU/rtdetr_r50vd_coco_o365) Athlete Detection
- ViTPose-Base (usyd-community/vitpose-base-simple) 2D Pose
- Anatomical Kinematic Stabilizer + Bone Length Plate Occlusion Reconstructor
- SciPy Zero-Phase Butterworth Signal Processing (scipy.signal.filtfilt)
Zero cold-start penalty, persistent HuggingFace caching, fast T4 GPU inference,
and perspective-corrected planar kinematics organized across 3 Universal Biomechanical Patterns.
"""

import os
os.environ["HF_HOME"] = "/persistent-storage/hf_cache"
os.environ["TORCH_HOME"] = "/persistent-storage/hf_cache/torch"

import base64
import io
import tempfile
import math
from typing import Dict, List, Any, Optional, Tuple

import cv2
import numpy as np
import scipy.signal
import scipy.interpolate
import torch
from PIL import Image
from transformers import AutoImageProcessor, AutoModelForObjectDetection, VitPoseForPoseEstimation
import requests

# ---------------------------------------------------------------------------
# 1. Hardware Detection & Global Model Initialization
# ---------------------------------------------------------------------------

device = "cuda" if torch.cuda.is_available() else "cpu"
print(f"[Cerebrium Startup] Initializing Biomechanics Engine on {device.upper()}...")

DET_MODEL_NAME = "PekingU/rtdetr_r50vd_coco_o365"
POSE_MODEL_NAME = "usyd-community/vitpose-base-simple"

dtype = torch.float16 if device == "cuda" else torch.float32

print(f"[Cerebrium Startup] Loading RT-DETR ({DET_MODEL_NAME})...")
det_processor = AutoImageProcessor.from_pretrained(DET_MODEL_NAME)
det_model = AutoModelForObjectDetection.from_pretrained(
    DET_MODEL_NAME,
    torch_dtype=dtype
).to(device)
det_model.eval()

print(f"[Cerebrium Startup] Loading ViTPose-Base ({POSE_MODEL_NAME})...")
pose_processor = AutoImageProcessor.from_pretrained(POSE_MODEL_NAME)
pose_model = VitPoseForPoseEstimation.from_pretrained(
    POSE_MODEL_NAME,
    torch_dtype=dtype
).to(device)
pose_model.eval()

print("[Cerebrium Startup] 2D Neural Pipeline (RT-DETR + ViTPose) successfully loaded into VRAM.")

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
    """Robust cubic/linear interpolation over frames where confidence score drops below threshold."""
    n = len(values)
    if n == 0:
        return values
    valid_mask = scores >= min_score
    indices = np.arange(n)
    valid_indices = indices[valid_mask]
    if len(valid_indices) == 0:
        return values
    if len(valid_indices) == n:
        return values
    
    # Use cubic spline when sufficient valid points exist, fallback to linear
    if len(valid_indices) >= 4:
        try:
            cs = scipy.interpolate.CubicSpline(valid_indices, values[valid_mask], bc_type='natural', extrapolate=True)
            res = cs(indices)
            return np.clip(res, 0.0, 1.0)
        except Exception:
            pass
    return np.interp(indices, valid_indices, values[valid_mask])

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
    """Zero-phase 2nd-order lowpass Butterworth filter for continuous real values (angular degrees)."""
    series_f64 = np.asarray(series, dtype=np.float64)
    n = len(series_f64)
    if n <= 9:
        return series_f64
    nyq = fs / 2.0
    normal_cutoff = min(cutoff / nyq, 0.99)
    b, a = scipy.signal.butter(2, normal_cutoff, btype="low", analog=False)
    return scipy.signal.filtfilt(b, a, series_f64)

def apply_zero_phase_butterworth_segmented(series: np.ndarray, cuts: List[int], fs: float = 15.0, cutoff: float = 1.8, continuous: bool = False) -> np.ndarray:
    """Zero-phase Butterworth filter applied independently to each scene-cut segment."""
    series_f64 = np.asarray(series, dtype=np.float64)
    n = len(series_f64)
    if n <= 9 or len(cuts) <= 2:
        return apply_zero_phase_butterworth_continuous(series_f64, fs, cutoff) if continuous else apply_zero_phase_butterworth(series_f64, fs, cutoff)
    out = series_f64.copy()
    fn = apply_zero_phase_butterworth_continuous if continuous else apply_zero_phase_butterworth
    for i in range(len(cuts) - 1):
        s_start = cuts[i]
        s_end = cuts[i + 1]
        seg_len = s_end - s_start
        if seg_len >= 10:
            out[s_start:s_end] = fn(series_f64[s_start:s_end], fs, cutoff)
        elif seg_len > 0:
            out[s_start:s_end] = series_f64[s_start:s_end]
    return out

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
            
            fps_val = float(stream.average_rate or 30.0)
            if fps_val <= 0 or math.isnan(fps_val):
                fps_val = 30.0
            
            stream_dur = float(stream.duration * stream.time_base) if (stream.duration and stream.time_base) else None
            
            # If video was already trimmed by client, stream_dur is shorter than t_start
            actual_start = t_start
            if stream_dur is not None and stream_dur > 0 and stream_dur < t_start:
                actual_start = 0.0
                effective_end = min(stream_dur, (t_end - t_start) if t_end is not None else stream_dur)
            elif stream_dur is not None and stream_dur > 0:
                effective_end = min(stream_dur, t_end) if t_end is not None else stream_dur
            else:
                effective_end = t_end if t_end is not None else (actual_start + 30.0)
            
            target_timestamps = []
            curr_t = actual_start
            while curr_t <= effective_end and len(target_timestamps) < max_frames:
                target_timestamps.append(curr_t)
                curr_t += step_dt
                
            if len(target_timestamps) > 0:
                target_idx = 0
                for packet in container.demux(stream):
                    for frame in packet.decode():
                        if frame.pts is None:
                            continue
                        f_pts_sec = float(frame.pts * stream.time_base)
                        
                        while target_idx < len(target_timestamps) and f_pts_sec >= target_timestamps[target_idx] - (0.5 / fps_val):
                            img = frame.to_rgb().to_ndarray()
                            frames_rgb.append(img)
                            timestamps.append(target_timestamps[target_idx])
                            target_idx += 1
                            if target_idx >= len(target_timestamps):
                                break
                                
                        if target_idx >= len(target_timestamps) or len(frames_rgb) >= max_frames:
                            break
                    if target_idx >= len(target_timestamps) or len(frames_rgb) >= max_frames:
                        break
                        
                container.close()
                if len(frames_rgb) > 0:
                    return frames_rgb, timestamps, float(timestamps[-1] - timestamps[0])
    except Exception as e:
        print(f"[Video Decoder] PyAV fast path bypassed: {e}. Falling back to OpenCV.")

    # Strategy 2: OpenCV Frame Sampling
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise ValueError(f"Unable to open video: {video_path}")
        
    native_fps = cap.get(cv2.CAP_PROP_FPS)
    if native_fps <= 0 or math.isnan(native_fps):
        native_fps = 30.0
    total_native_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    native_duration = total_native_frames / native_fps if total_native_frames > 0 else None
    
    actual_start = t_start
    if native_duration is not None and native_duration > 0 and native_duration < t_start:
        actual_start = 0.0
        effective_end = min(native_duration, (t_end - t_start) if t_end is not None else native_duration)
    elif native_duration is not None and native_duration > 0:
        effective_end = min(native_duration, t_end) if t_end is not None else native_duration
    else:
        effective_end = t_end if t_end is not None else (actual_start + 30.0)
    
    curr_t = actual_start
    while curr_t <= effective_end and len(frames_rgb) < max_frames:
        target_f_idx = int(round(curr_t * native_fps))
        cap.set(cv2.CAP_PROP_POS_FRAMES, target_f_idx)
        ret, frame_bgr = cap.read()
        if not ret or frame_bgr is None:
            break
        frame_rgb = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGB)
        frames_rgb.append(frame_rgb)
        timestamps.append(curr_t)
        curr_t += step_dt
        
    cap.release()
    total_dur_ret = float(timestamps[-1] - timestamps[0]) if len(timestamps) > 1 else 0.0
    return frames_rgb, timestamps, total_dur_ret

def detect_content_bbox(frame: np.ndarray, threshold: int = 15) -> Tuple[int, int, int, int]:
    """Detect non-black bounding box to strip pillarboxing/letterboxing."""
    gray = cv2.cvtColor(frame, cv2.COLOR_RGB2GRAY) if len(frame.shape) == 3 else frame
    h, w = gray.shape[:2]
    row_max = np.max(gray, axis=1)
    col_max = np.max(gray, axis=0)
    non_zero_rows = np.where(row_max > threshold)[0]
    non_zero_cols = np.where(col_max > threshold)[0]
    if len(non_zero_rows) == 0 or len(non_zero_cols) == 0:
        return 0, 0, w, h
    y_min, y_max = int(non_zero_rows[0]), int(non_zero_rows[-1])
    x_min, x_max = int(non_zero_cols[0]), int(non_zero_cols[-1])
    cw = x_max - x_min + 1
    ch = y_max - y_min + 1
    # Only crop if substantial bars exist (>8% of width or height is black)
    if (cw < w * 0.92) or (ch < h * 0.92):
        x_min = max(0, x_min - 4)
        y_min = max(0, y_min - 4)
        x_max = min(w - 1, x_max + 4)
        y_max = min(h - 1, y_max + 4)
        return x_min, y_min, x_max - x_min + 1, y_max - y_min + 1
    return 0, 0, w, h

def run_inference_batches(
    frames_rgb: List[np.ndarray],
    batch_size: int = 64
) -> Tuple[List[Dict[str, Dict[str, float]]], List[Dict[str, float]]]:
    """
    Batched neural inference across video frames with RT-DETR and ViTPose.
    - RT-DETR athlete detection: Sampled 1 of every 3 frames with piecewise linear
      interpolation of bounding boxes across intermediate frames (reducing detector load by 66%).
    - Strict athlete isolation against background gym users on sampled frames.
    - Moving average smoothing (window = 5) on bounding box coordinates (x1, y1, x2, y2).
    - ViTPose inference: Full batch across all frames (batch_size = 64, fp16).
    """
    n_frames = len(frames_rgb)
    all_raw_keypoints = []
    all_boxes = []
    
    if n_frames == 0:
        return all_raw_keypoints, all_boxes

    h, w = frames_rgb[0].shape[:2]
    crop_x, crop_y, crop_w, crop_h = detect_content_bbox(frames_rgb[0])
    has_crop = (crop_w < w or crop_h < h)
    eff_h, eff_w = (crop_h, crop_w) if has_crop else (h, w)
    
    # ---------------------------------------------------------------------
    # Pass 1: RT-DETR Detection sampled 1 of every 3 frames
    # ---------------------------------------------------------------------
    sample_step = 3
    if n_frames <= sample_step:
        sampled_indices = list(range(n_frames))
    else:
        sampled_indices = list(range(0, n_frames, sample_step))
        if (n_frames - 1) not in sampled_indices:
            sampled_indices.append(n_frames - 1)
    
    sampled_frames = [frames_rgb[idx] for idx in sampled_indices]
    n_sampled = len(sampled_frames)

    sampled_frame_detections = []  # candidate person boxes per sampled frame
    for i in range(0, n_sampled, batch_size):
        batch_rgb = sampled_frames[i : i + batch_size]
        if has_crop:
            batch_crop = [f[crop_y : crop_y + crop_h, crop_x : crop_x + crop_w] for f in batch_rgb]
        else:
            batch_crop = batch_rgb
        batch_pil = [Image.fromarray(f) for f in batch_crop]
        
        det_inputs = det_processor(images=batch_pil, return_tensors="pt").to(device)
        with torch.inference_mode():
            det_outputs = det_model(**det_inputs)
            
        target_sizes = torch.tensor([[eff_h, eff_w]] * len(batch_pil), dtype=torch.float32, device=device)
        if hasattr(det_outputs, "logits") and det_outputs.logits is not None:
            det_outputs.logits = det_outputs.logits.to(torch.float32)
        if hasattr(det_outputs, "pred_boxes") and det_outputs.pred_boxes is not None:
            det_outputs.pred_boxes = det_outputs.pred_boxes.to(torch.float32)

        det_results = det_processor.post_process_object_detection(
            det_outputs, target_sizes=target_sizes, threshold=0.20
        )
        for d_res in det_results:
            boxes = d_res["boxes"].detach().cpu().numpy()
            scores = d_res["scores"].detach().cpu().numpy()
            labels = d_res["labels"].detach().cpu().numpy()
            p_boxes = []
            for idx, l in enumerate(labels):
                if l == 0 and scores[idx] >= 0.20:
                    p_boxes.append((boxes[idx].tolist(), float(scores[idx])))
            sampled_frame_detections.append(p_boxes)

    # ---------------------------------------------------------------------
    # Pass 2: Strict Temporal Athlete Tracking across sampled frames
    # ---------------------------------------------------------------------
    sampled_tracked_boxes = []
    tracked_box = None

    for s_idx in range(n_sampled):
        p_candidates = sampled_frame_detections[s_idx]
        if tracked_box is None:
            # First valid frame: pick person with max area * centeredness
            if len(p_candidates) > 0:
                best_metric = -1.0
                best_box = p_candidates[0][0]
                for b, score in p_candidates:
                    area = max(0.0, b[2] - b[0]) * max(0.0, b[3] - b[1])
                    cx_norm = ((b[0] + b[2]) / 2.0) / float(eff_w)
                    cy_norm = ((b[1] + b[3]) / 2.0) / float(eff_h)
                    dist_center = math.hypot(cx_norm - 0.5, cy_norm - 0.5)
                    centeredness = max(0.05, 1.0 - 0.8 * dist_center)
                    metric = area * centeredness * score
                    if metric > best_metric:
                        best_metric = metric
                        best_box = b
                tracked_box = best_box
            else:
                tracked_box = [0.0, 0.0, float(eff_w), float(eff_h)]
            sampled_tracked_boxes.append(tracked_box)
        else:
            prev_b = tracked_box
            prev_cx = (prev_b[0] + prev_b[2]) / 2.0
            prev_cy = (prev_b[1] + prev_b[3]) / 2.0
            prev_area = max(1.0, (prev_b[2] - prev_b[0]) * (prev_b[3] - prev_b[1]))

            # Filter candidates within normalized center distance < 0.20
            valid_cands = []
            for b, score in p_candidates:
                cand_cx = (b[0] + b[2]) / 2.0
                cand_cy = (b[1] + b[3]) / 2.0
                norm_center_dist = math.hypot(cand_cx - prev_cx, cand_cy - prev_cy) / float(max(eff_w, eff_h))
                if norm_center_dist < 0.20:
                    # Compute IoU with tracked_box
                    ix1 = max(prev_b[0], b[0])
                    iy1 = max(prev_b[1], b[1])
                    ix2 = min(prev_b[2], b[2])
                    iy2 = min(prev_b[3], b[3])
                    inter = max(0.0, ix2 - ix1) * max(0.0, iy2 - iy1)
                    cand_area = max(1.0, (b[2] - b[0]) * (b[3] - b[1]))
                    iou = inter / (prev_area + cand_area - inter)
                    match_score = iou * 0.70 + score * 0.30 - norm_center_dist * 0.50
                    valid_cands.append((match_score, b))

            if len(valid_cands) > 0:
                valid_cands.sort(key=lambda x: x[0], reverse=True)
                tracked_box = valid_cands[0][1]
            sampled_tracked_boxes.append(tracked_box)

    # ---------------------------------------------------------------------
    # Pass 2.5: Linear Interpolation of Bounding Boxes for all intermediate frames
    # ---------------------------------------------------------------------
    sampled_boxes_arr = np.array(sampled_tracked_boxes, dtype=np.float32)
    all_frame_indices = np.arange(n_frames, dtype=np.float32)
    raw_tracked_boxes = np.zeros((n_frames, 4), dtype=np.float32)
    for c in range(4):
        raw_tracked_boxes[:, c] = np.interp(
            all_frame_indices,
            sampled_indices,
            sampled_boxes_arr[:, c]
        )

    # ---------------------------------------------------------------------
    # Pass 3: Moving Average Smoothing (window = 5) & Tight Padding (0.08)
    # ---------------------------------------------------------------------
    smoothed_boxes = np.zeros_like(raw_tracked_boxes)
    for c in range(4):
        smoothed_boxes[:, c] = scipy.ndimage.uniform_filter1d(raw_tracked_boxes[:, c], size=5, mode='nearest')

    vitpose_crops = []
    for f_idx in range(n_frames):
        sb = smoothed_boxes[f_idx]
        bw = sb[2] - sb[0]
        bh = sb[3] - sb[1]
        pad_w = 0.12 * bw
        pad_h = 0.15 * bh
        x1_pad = max(0.0, sb[0] - pad_w)
        y1_pad = max(0.0, sb[1] - pad_h)
        x2_pad = min(float(eff_w), sb[2] + pad_w)
        y2_pad = min(float(eff_h), sb[3] + pad_h)
        vitpose_crops.append([x1_pad, y1_pad, x2_pad, y2_pad])

        cx = float((crop_x + (sb[0] + sb[2]) / 2.0) / float(w))
        cy = float((crop_y + (sb[1] + sb[3]) / 2.0) / float(h))
        all_boxes.append({"cx": cx, "cy": cy, "bw": float(bw / w), "bh": float(bh / h)})

    # ---------------------------------------------------------------------
    # Pass 4: Batched ViTPose Inference (batch_size = 64, fp16)
    # ---------------------------------------------------------------------
    for i in range(0, n_frames, batch_size):
        batch_rgb = frames_rgb[i : i + batch_size]
        if has_crop:
            batch_crop = [f[crop_y : crop_y + crop_h, crop_x : crop_x + crop_w] for f in batch_rgb]
        else:
            batch_crop = batch_rgb
        batch_pil = [Image.fromarray(f) for f in batch_crop]
        batch_crops_subset = [[vitpose_crops[k]] for k in range(i, min(i + batch_size, n_frames))]

        pose_inputs = pose_processor(images=batch_pil, boxes=batch_crops_subset, return_tensors="pt").to(device)
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
            pose_results = pose_processor.post_process_pose_estimation(pose_outputs, boxes=batch_crops_subset)
        except TypeError:
            pose_results = pose_processor.post_process_pose_estimation(pose_outputs, boxes=batch_crops_subset, dataset_index=0)
        
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
                x_norm = float(crop_x + kps[kp_idx, 0]) / float(w)
                y_norm = float(crop_y + kps[kp_idx, 1]) / float(h)
                score = float(scs[kp_idx])
                frame_kps[name] = {
                    "x": min(1.0, max(0.0, x_norm)),
                    "y": min(1.0, max(0.0, y_norm)),
                    "score": score
                }
            all_raw_keypoints.append(frame_kps)
            
    return all_raw_keypoints, all_boxes

# ---------------------------------------------------------------------------
# 3. Clinical Kinematics Engine (3 Universal Biomechanical Patterns)
# ---------------------------------------------------------------------------

def process_kinematics(
    raw_keypoints: List[Dict[str, Dict[str, float]]],
    timestamps: List[float],
    exercise_type: str,
    target_muscle: str,
    load_type: str,
    athlete_boxes: Optional[List[Dict[str, float]]] = None,
    img_w: int = 1280,
    img_h: int = 720,
    weight_kg: Optional[float] = None,
    target_reps: Optional[int] = None,
    anthropometry: Optional[Dict[str, Any]] = None
):
    """
    High-density kinematic pipeline organized around 3 Universal Biomechanical Patterns:
    - Pattern A: Tracción / Flexión (rowing, pulldown, curl)
    - Pattern B: Empuje / Extensión (press, bench, dips, extension)
    - Pattern C: Tren Inferior (hip thrust, squat, rdl, bulgarian)
    Includes Anatomical Kinematic Stabilizer with Strict Side Lock, Rigid Bone Length Constraint,
    and Bumper Plate Occlusion Spline Reconstructor.
    """
    n_frames = len(raw_keypoints)
    if n_frames == 0:
        return {"fps": 15.0, "duration": 0.0, "total_reps": 0, "repetitions_summary": [], "frames": []}
    
    # 0. Scene Cut Detection (salto brusco >22% en posición o tamaño de bounding box)
    is_scene_cut = [False] * n_frames
    scene_cut_indices = [0]
    if athlete_boxes and len(athlete_boxes) == n_frames:
        for f in range(1, n_frames):
            prev_b = athlete_boxes[f - 1]
            curr_b = athlete_boxes[f]
            delta_cx = abs(curr_b.get("cx", 0.5) - prev_b.get("cx", 0.5))
            delta_cy = abs(curr_b.get("cy", 0.5) - prev_b.get("cy", 0.5))
            prev_area = prev_b.get("bw", 0.5) * prev_b.get("bh", 0.5)
            curr_area = curr_b.get("bw", 0.5) * curr_b.get("bh", 0.5)
            area_jump = abs(curr_area - prev_area) / max(prev_area, 1e-4)
            if delta_cx > 0.22 or delta_cy > 0.22 or area_jump > 0.22:
                is_scene_cut[f] = True
                scene_cut_indices.append(f)
    scene_cut_indices.append(n_frames)

    canonical_joints = ["shoulder", "elbow", "wrist", "hip", "knee", "ankle"]
    ex_lower = exercise_type.lower()
    load_lower = load_type.lower()
    
    # Universal Pattern Classification
    is_pattern_a = (
        any(k in ex_lower for k in [
            "row", "pulldown", "pullup", "pullover", "curl", "t_bar", "gironda", "face_pull"
        ]) or target_muscle.lower() in ["lats", "upper_back", "biceps"]
    ) and not any(k in ex_lower for k in ["leg_curl", "femoral"])

    is_pattern_b = (
        any(k in ex_lower for k in [
            "press", "bench", "incline", "dips", "extension", "pushdown", "pec_deck", "fly", "chest"
        ]) or target_muscle.lower() in ["pectorals", "chest", "triceps", "deltoids", "shoulders"]
    ) and not any(k in ex_lower for k in ["leg_press", "leg_extension", "hack"])

    is_pattern_c = not is_pattern_a and not is_pattern_b
    is_upper_body = is_pattern_a or is_pattern_b
    is_hip_thrust = any(k in ex_lower for k in ["hip_thrust", "kas_glute", "glute_bridge", "bridge", "thrust", "kas"])

    all_smoothed = {}
    
    # 1. Bilateral Initial Interpolation & Smoothing (Segmented per scene cut)
    for side in ["left", "right"]:
        for c_name in canonical_joints:
            k_name = f"{side}_{c_name}"
            x_arr = np.array([raw_keypoints[f][k_name]["x"] for f in range(n_frames)], dtype=np.float64)
            y_arr = np.array([raw_keypoints[f][k_name]["y"] for f in range(n_frames)], dtype=np.float64)
            s_arr = np.array([raw_keypoints[f][k_name]["score"] for f in range(n_frames)], dtype=np.float64)
            
            x_interp = interpolate_series_1d(x_arr, s_arr, min_score=0.20)
            y_interp = interpolate_series_1d(y_arr, s_arr, min_score=0.20)
            
            all_smoothed[k_name] = {
                "x": apply_zero_phase_butterworth_segmented(x_interp, scene_cut_indices, fs=15.0, cutoff=1.8),
                "y": apply_zero_phase_butterworth_segmented(y_interp, scene_cut_indices, fs=15.0, cutoff=1.8),
                "score": s_arr
            }
            
    # Head / Nose
    hx_arr = np.array([raw_keypoints[f].get("nose", raw_keypoints[f].get("left_eye", {"x": 0.5}))["x"] for f in range(n_frames)], dtype=np.float64)
    hy_arr = np.array([raw_keypoints[f].get("nose", raw_keypoints[f].get("left_eye", {"y": 0.2}))["y"] for f in range(n_frames)], dtype=np.float64)
    hs_arr = np.array([raw_keypoints[f].get("nose", raw_keypoints[f].get("left_eye", {"score": 0.5}))["score"] for f in range(n_frames)], dtype=np.float64)
    smoothed_head = {
        "x": apply_zero_phase_butterworth_segmented(interpolate_series_1d(hx_arr, hs_arr, min_score=0.20), scene_cut_indices, fs=15.0, cutoff=1.8),
        "y": apply_zero_phase_butterworth_segmented(interpolate_series_1d(hy_arr, hs_arr, min_score=0.20), scene_cut_indices, fs=15.0, cutoff=1.8),
        "score": hs_arr
    }

    # Safe universal fallbacks for all anatomical bone length medians (Guarantees no UnboundLocalError)
    box_h = np.median([b.get("bh", 0.6) for b in athlete_boxes]) if athlete_boxes else 0.6
    l_humerus_median = float(max(0.16, min(0.35, box_h * 0.26)))
    l_forearm_median = float(max(0.14, min(0.32, box_h * 0.22)))
    l_femur_median = float(max(0.18, min(0.42, box_h * 0.32)))
    l_torso_median = float(max(0.24, min(0.52, box_h * 0.40)))
    l_tibia_median = float(max(0.16, min(0.36, box_h * 0.28)))

    # Facing direction from head relative to torso center
    head_x_med = float(np.median(smoothed_head["x"]))
    mid_torso_x = float(0.25 * (
        np.median(all_smoothed["left_shoulder"]["x"]) + np.median(all_smoothed["right_shoulder"]["x"]) +
        np.median(all_smoothed["left_hip"]["x"]) + np.median(all_smoothed["right_hip"]["x"])
    ))
    facing_dir = 1.0 if head_x_med >= mid_torso_x else -1.0

    # 2. Dynamic Active Limb Selector based on Apparent Optical Length (2D Foreshortening Invariant) & Visibility
    primary_joints = {}
    is_unilateral_flag = False
    hide_torso_line = False

    if is_upper_body:
        left_elbow_angles = []
        right_elbow_angles = []
        for f in range(n_frames):
            ls = {"x": all_smoothed["left_shoulder"]["x"][f], "y": all_smoothed["left_shoulder"]["y"][f]}
            le = {"x": all_smoothed["left_elbow"]["x"][f], "y": all_smoothed["left_elbow"]["y"][f]}
            lw = {"x": all_smoothed["left_wrist"]["x"][f], "y": all_smoothed["left_wrist"]["y"][f]}
            left_elbow_angles.append(calculate_angle_2d(ls, le, lw))

            rs = {"x": all_smoothed["right_shoulder"]["x"][f], "y": all_smoothed["right_shoulder"]["y"][f]}
            re = {"x": all_smoothed["right_elbow"]["x"][f], "y": all_smoothed["right_elbow"]["y"][f]}
            rw = {"x": all_smoothed["right_wrist"]["x"][f], "y": all_smoothed["right_wrist"]["y"][f]}
            right_elbow_angles.append(calculate_angle_2d(rs, re, rw))

        left_elbow_angles = np.array(left_elbow_angles)
        right_elbow_angles = np.array(right_elbow_angles)

        # Dynamic ROM between 90th and 10th percentiles to eliminate camera/noise spikes
        left_rom = float(np.percentile(left_elbow_angles, 90) - np.percentile(left_elbow_angles, 10))
        right_rom = float(np.percentile(right_elbow_angles, 90) - np.percentile(right_elbow_angles, 10))

        # Optical apparent length in 2D (foreground limb has strictly greater apparent length)
        l_sh_x, l_sh_y = all_smoothed["left_shoulder"]["x"], all_smoothed["left_shoulder"]["y"]
        l_el_x, l_el_y = all_smoothed["left_elbow"]["x"], all_smoothed["left_elbow"]["y"]
        l_wr_x, l_wr_y = all_smoothed["left_wrist"]["x"], all_smoothed["left_wrist"]["y"]
        r_sh_x, r_sh_y = all_smoothed["right_shoulder"]["x"], all_smoothed["right_shoulder"]["y"]
        r_el_x, r_el_y = all_smoothed["right_elbow"]["x"], all_smoothed["right_elbow"]["y"]
        r_wr_x, r_wr_y = all_smoothed["right_wrist"]["x"], all_smoothed["right_wrist"]["y"]

        left_len = float(np.median(np.hypot(l_sh_x - l_el_x, l_sh_y - l_el_y) + np.hypot(l_el_x - l_wr_x, l_el_y - l_wr_y)))
        right_len = float(np.median(np.hypot(r_sh_x - r_el_x, r_sh_y - r_el_y) + np.hypot(r_el_x - r_wr_x, r_el_y - r_wr_y)))

        left_conf = float(np.mean(np.concatenate([
            all_smoothed["left_shoulder"]["score"],
            all_smoothed["left_elbow"]["score"],
            all_smoothed["left_wrist"]["score"]
        ])))
        right_conf = float(np.mean(np.concatenate([
            all_smoothed["right_shoulder"]["score"],
            all_smoothed["right_elbow"]["score"],
            all_smoothed["right_wrist"]["score"]
        ])))

        # Penalize hand at head/hair level in horizontal rows
        left_pen = 1.0
        right_pen = 1.0
        if is_pattern_a:
            for side in ["left", "right"]:
                hand_at_head_fraction = float(np.mean(all_smoothed[f"{side}_wrist"]["y"] < all_smoothed[f"{side}_shoulder"]["y"] - 0.05))
                if hand_at_head_fraction > 0.25:
                    if side == "left":
                        left_pen = 0.05
                    else:
                        right_pen = 0.05

        # Bug 1 Fix: Foreground arm selection weighted by apparent optical length and confidence**2
        left_score_total = (left_conf ** 2) * (left_len ** 2) * (left_rom + 10.0) * left_pen
        right_score_total = (right_conf ** 2) * (right_len ** 2) * (right_rom + 10.0) * right_pen
        locked_side = "left" if left_score_total >= right_score_total else "right"
        is_unilateral_flag = bool(left_score_total > 1.5 * right_score_total or right_score_total > 1.5 * left_score_total)

        # 2. Extract Native ViTPose keypoints of the chosen arm without any length projection or orientation alteration
        sh_x = np.array([raw_keypoints[f][f"{locked_side}_shoulder"]["x"] for f in range(n_frames)], dtype=np.float64)
        sh_y = np.array([raw_keypoints[f][f"{locked_side}_shoulder"]["y"] for f in range(n_frames)], dtype=np.float64)
        sh_sc = np.array([raw_keypoints[f][f"{locked_side}_shoulder"]["score"] for f in range(n_frames)], dtype=np.float64)

        el_x = np.array([raw_keypoints[f][f"{locked_side}_elbow"]["x"] for f in range(n_frames)], dtype=np.float64)
        el_y = np.array([raw_keypoints[f][f"{locked_side}_elbow"]["y"] for f in range(n_frames)], dtype=np.float64)
        el_sc = np.array([raw_keypoints[f][f"{locked_side}_elbow"]["score"] for f in range(n_frames)], dtype=np.float64)

        wr_x = np.array([raw_keypoints[f][f"{locked_side}_wrist"]["x"] for f in range(n_frames)], dtype=np.float64)
        wr_y = np.array([raw_keypoints[f][f"{locked_side}_wrist"]["y"] for f in range(n_frames)], dtype=np.float64)
        wr_sc = np.array([raw_keypoints[f][f"{locked_side}_wrist"]["score"] for f in range(n_frames)], dtype=np.float64)

        # 3. Linearly interpolate isolated low-confidence frames (score < 0.25)
        def interpolate_isolated_frames(vals: np.ndarray, scores: np.ndarray, thresh: float = 0.25) -> np.ndarray:
            valid = scores >= thresh
            if np.all(valid) or np.count_nonzero(valid) < 2:
                return vals.copy()
            idx_all = np.arange(len(vals))
            return np.interp(idx_all, idx_all[valid], vals[valid])

        sh_x = interpolate_isolated_frames(sh_x, sh_sc, 0.25)
        sh_y = interpolate_isolated_frames(sh_y, sh_sc, 0.25)
        el_x = interpolate_isolated_frames(el_x, el_sc, 0.25)
        el_y = interpolate_isolated_frames(el_y, el_sc, 0.25)
        wr_x = interpolate_isolated_frames(wr_x, wr_sc, 0.25)
        wr_y = interpolate_isolated_frames(wr_y, wr_sc, 0.25)

        # 4. Butterworth filter (2nd order, cutoff 2.0 Hz) via filtfilt
        primary_joints["shoulder"] = {
            "x": apply_zero_phase_butterworth_segmented(sh_x, scene_cut_indices, fs=15.0, cutoff=2.0),
            "y": apply_zero_phase_butterworth_segmented(sh_y, scene_cut_indices, fs=15.0, cutoff=2.0),
            "score": sh_sc
        }
        primary_joints["elbow"] = {
            "x": apply_zero_phase_butterworth_segmented(el_x, scene_cut_indices, fs=15.0, cutoff=2.0),
            "y": apply_zero_phase_butterworth_segmented(el_y, scene_cut_indices, fs=15.0, cutoff=2.0),
            "score": el_sc
        }
        primary_joints["wrist"] = {
            "x": apply_zero_phase_butterworth_segmented(wr_x, scene_cut_indices, fs=15.0, cutoff=2.0),
            "y": apply_zero_phase_butterworth_segmented(wr_y, scene_cut_indices, fs=15.0, cutoff=2.0),
            "score": wr_sc
        }
        primary_joints["hand"] = {
            "x": primary_joints["wrist"]["x"].copy(),
            "y": primary_joints["wrist"]["y"].copy(),
            "score": wr_sc.copy()
        }

        # Sincronizar array bilateral
        all_smoothed[f"{locked_side}_shoulder"]["x"] = primary_joints["shoulder"]["x"].copy()
        all_smoothed[f"{locked_side}_shoulder"]["y"] = primary_joints["shoulder"]["y"].copy()
        all_smoothed[f"{locked_side}_elbow"]["x"] = primary_joints["elbow"]["x"].copy()
        all_smoothed[f"{locked_side}_elbow"]["y"] = primary_joints["elbow"]["y"].copy()
        all_smoothed[f"{locked_side}_wrist"]["x"] = primary_joints["wrist"]["x"].copy()
        all_smoothed[f"{locked_side}_wrist"]["y"] = primary_joints["wrist"]["y"].copy()

        # Anatomically stable pelvis center for torso vector
        l_hip_conf = float(np.mean(all_smoothed["left_hip"]["score"]))
        r_hip_conf = float(np.mean(all_smoothed["right_hip"]["score"]))
        if l_hip_conf >= 0.35 and r_hip_conf >= 0.35:
            primary_joints["hip"] = {
                "x": 0.5 * (all_smoothed["left_hip"]["x"] + all_smoothed["right_hip"]["x"]),
                "y": 0.5 * (all_smoothed["left_hip"]["y"] + all_smoothed["right_hip"]["y"]),
                "score": 0.5 * (all_smoothed["left_hip"]["score"] + all_smoothed["right_hip"]["score"])
            }
        elif l_hip_conf >= r_hip_conf:
            primary_joints["hip"] = {
                "x": all_smoothed["left_hip"]["x"].copy(),
                "y": all_smoothed["left_hip"]["y"].copy(),
                "score": all_smoothed["left_hip"]["score"].copy()
            }
        else:
            primary_joints["hip"] = {
                "x": all_smoothed["right_hip"]["x"].copy(),
                "y": all_smoothed["right_hip"]["y"].copy(),
                "score": all_smoothed["right_hip"]["score"].copy()
            }

        for c_name in ["knee", "ankle"]:
            primary_joints[c_name] = {
                "x": all_smoothed[f"{locked_side}_{c_name}"]["x"].copy(),
                "y": all_smoothed[f"{locked_side}_{c_name}"]["y"].copy(),
                "score": all_smoothed[f"{locked_side}_{c_name}"]["score"].copy()
            }
        other_side = "right" if locked_side == "left" else "left"
    else:
        left_knee_angles = []
        right_knee_angles = []
        for f in range(n_frames):
            lk = {"x": all_smoothed["left_knee"]["x"][f], "y": all_smoothed["left_knee"]["y"][f]}
            lh = {"x": all_smoothed["left_hip"]["x"][f], "y": all_smoothed["left_hip"]["y"][f]}
            la = {"x": all_smoothed["left_ankle"]["x"][f], "y": all_smoothed["left_ankle"]["y"][f]}
            left_knee_angles.append(calculate_angle_2d(lh, lk, la))

            rk = {"x": all_smoothed["right_knee"]["x"][f], "y": all_smoothed["right_knee"]["y"][f]}
            rh = {"x": all_smoothed["right_hip"]["x"][f], "y": all_smoothed["right_hip"]["y"][f]}
            ra = {"x": all_smoothed["right_ankle"]["x"][f], "y": all_smoothed["right_ankle"]["y"][f]}
            right_knee_angles.append(calculate_angle_2d(rh, rk, ra))

        left_knee_angles = np.array(left_knee_angles)
        right_knee_angles = np.array(right_knee_angles)

        left_rom = float(np.percentile(left_knee_angles, 90) - np.percentile(left_knee_angles, 10))
        right_rom = float(np.percentile(right_knee_angles, 90) - np.percentile(right_knee_angles, 10))
        left_ankle_travel = float(np.hypot(np.ptp(all_smoothed["left_ankle"]["x"]), np.ptp(all_smoothed["left_ankle"]["y"])))
        right_ankle_travel = float(np.hypot(np.ptp(all_smoothed["right_ankle"]["x"]), np.ptp(all_smoothed["right_ankle"]["y"])))

        left_conf = float(np.mean(np.concatenate([
            all_smoothed["left_hip"]["score"],
            all_smoothed["left_knee"]["score"],
            all_smoothed["left_ankle"]["score"]
        ])))
        right_conf = float(np.mean(np.concatenate([
            all_smoothed["right_hip"]["score"],
            all_smoothed["right_knee"]["score"],
            all_smoothed["right_ankle"]["score"]
        ])))

        is_leg_work_exercise = any(k in ex_lower for k in ["rdl", "deadlift", "rumano", "squat", "bulgarian", "lunge"])
        if is_leg_work_exercise:
            # Bug 1 Fix: In RDL / B-Stance / Bulgarian, select the working leg whose ankle is forward in the facing direction
            # and firmly planted (lower ankle x std) rather than the rear kickstand leg with bent knee
            l_ank_x = all_smoothed["left_ankle"]["x"]
            r_ank_x = all_smoothed["right_ankle"]["x"]
            l_forward = float(np.median(l_ank_x) * facing_dir)
            r_forward = float(np.median(r_ank_x) * facing_dir)
            l_std = float(np.std(l_ank_x))
            r_std = float(np.std(r_ank_x))

            if abs(l_forward - r_forward) > 0.025:
                locked_side = "left" if l_forward > r_forward else "right"
                is_unilateral_flag = True
            elif abs(l_std - r_std) > 0.015:
                locked_side = "left" if l_std < r_std else "right"
                is_unilateral_flag = False
            elif abs(left_conf - right_conf) > 0.12:
                locked_side = "left" if left_conf > right_conf else "right"
                is_unilateral_flag = False
            else:
                left_activity = left_rom * (left_ankle_travel + 0.05) * (left_conf ** 2)
                right_activity = right_rom * (right_ankle_travel + 0.05) * (right_conf ** 2)
                is_unilateral_flag = bool(left_activity > 1.40 * right_activity or right_activity > 1.40 * left_activity)
                locked_side = "left" if left_activity >= right_activity else "right"
        else:
            if abs(left_conf - right_conf) > 0.12:
                locked_side = "left" if left_conf > right_conf else "right"
                is_unilateral_flag = False
            else:
                left_activity = left_rom * (left_ankle_travel + 0.05) * (left_conf ** 2)
                right_activity = right_rom * (right_ankle_travel + 0.05) * (right_conf ** 2)
                is_unilateral_flag = bool(left_activity > 1.40 * right_activity or right_activity > 1.40 * left_activity)
                locked_side = "left" if left_activity >= right_activity else "right"

        other_side = "right" if locked_side == "left" else "left"

        for c_name in canonical_joints:
            primary_joints[c_name] = {
                "x": all_smoothed[f"{locked_side}_{c_name}"]["x"].copy(),
                "y": all_smoothed[f"{locked_side}_{c_name}"]["y"].copy(),
                "score": all_smoothed[f"{locked_side}_{c_name}"]["score"].copy()
            }

    # 3. Anatomical Kinematic Stabilizer & Plate Occlusion Reconstructor (2-Circle Intersection)
    if is_hip_thrust:
        # A. Calculate Median Unoccluded Femur & Torso Lengths (score >= 0.65)
        knee_x = primary_joints["knee"]["x"]
        knee_y = primary_joints["knee"]["y"]
        hip_x = primary_joints["hip"]["x"]
        hip_y = primary_joints["hip"]["y"]
        sh_x = primary_joints["shoulder"]["x"]
        sh_y = primary_joints["shoulder"]["y"]
        hip_score = primary_joints["hip"]["score"]
        knee_score = primary_joints["knee"]["score"]
        sh_score = primary_joints["shoulder"]["score"]

        femur_lengths = np.hypot(hip_x - knee_x, hip_y - knee_y)
        torso_lengths = np.hypot(hip_x - sh_x, hip_y - sh_y)
        unoccluded_femur_mask = (hip_score >= 0.65) & (knee_score >= 0.65)
        unoccluded_torso_mask = (hip_score >= 0.65) & (sh_score >= 0.65)

        if np.any(unoccluded_femur_mask):
            l_femur_median = float(np.median(femur_lengths[unoccluded_femur_mask]))
        else:
            box_h = np.median([b.get("bh", 0.6) for b in athlete_boxes]) if athlete_boxes else 0.6
            l_femur_median = float(max(0.18, min(0.35, box_h * 0.32)))

        if np.any(unoccluded_torso_mask):
            l_torso_median = float(np.median(torso_lengths[unoccluded_torso_mask]))
        else:
            box_h = np.median([b.get("bh", 0.6) for b in athlete_boxes]) if athlete_boxes else 0.6
            l_torso_median = float(max(0.24, min(0.48, box_h * 0.40)))

        # B. Detect Outlier Jumps (> 0.12) or Severe Occlusion (score < 0.45)
        hip_jumps = np.zeros(n_frames, dtype=bool)
        for f in range(1, n_frames):
            if math.hypot(hip_x[f] - hip_x[f - 1], hip_y[f] - hip_y[f - 1]) > 0.12:
                hip_jumps[f] = True

        # Activate geometric reconstruction exclusively when score < 0.45 or sudden jump outlier
        is_plate_occluded = (hip_score < 0.45) | (hip_jumps & (hip_score < 0.50))

        # C. Reconstruct Occluded Hip Coordinates via 2-Circle Intersection & Monotonic PCHIP
        valid_frames = np.where(~is_plate_occluded)[0]
        if len(valid_frames) >= 2 and np.any(is_plate_occluded):
            try:
                pchip_x = scipy.interpolate.PchipInterpolator(valid_frames, hip_x[valid_frames])
                pchip_y = scipy.interpolate.PchipInterpolator(valid_frames, hip_y[valid_frames])
                all_idx = np.arange(n_frames)
                interp_hip_x = pchip_x(all_idx)
                interp_hip_y = pchip_y(all_idx)
            except Exception:
                all_idx = np.arange(n_frames)
                interp_hip_x = np.interp(all_idx, valid_frames, hip_x[valid_frames])
                interp_hip_y = np.interp(all_idx, valid_frames, hip_y[valid_frames])

            r1 = l_torso_median
            r2 = l_femur_median

            for f in range(n_frames):
                # Si ViTPose tiene score >= 0.40, mantener directamente la cadera nativa de ViTPose suavizada
                if hip_score[f] >= 0.40:
                    continue

                # Circle 1: Center P1 = Shoulder, radius r1 = L_torso
                p1x = float(sh_x[f])
                p1y = float(sh_y[f])
                # Circle 2: Center P2 = Knee, radius r2 = L_femur
                p2x = float(knee_x[f])
                p2y = float(knee_y[f])

                dx = p2x - p1x
                dy = p2y - p1y
                d = math.hypot(dx, dy)

                cand_x = interp_hip_x[f]
                cand_y = interp_hip_y[f]

                if d > 1e-4:
                    if d > r1 + r2:
                        ratio = r1 / (r1 + r2)
                        sol_x = p1x + ratio * dx
                        sol_y = p1y + ratio * dy
                    elif d < abs(r1 - r2):
                        if r1 > r2:
                            sol_x = p1x + (dx / d) * r1
                            sol_y = p1y + (dy / d) * r1
                        else:
                            sol_x = p2x - (dx / d) * r2
                            sol_y = p2y - (dy / d) * r2
                    else:
                        a = (r1 * r1 - r2 * r2 + d * d) / (2.0 * d)
                        h = math.sqrt(max(0.0, r1 * r1 - a * a))
                        p0x = p1x + (a / d) * dx
                        p0y = p1y + (a / d) * dy
                        rx = -(dy / d) * h
                        ry = (dx / d) * h

                        int_a_x = p0x + rx
                        int_a_y = p0y + ry
                        int_b_x = p0x - rx
                        int_b_y = p0y - ry

                        # Fix obligatorio: En Hip Thrust la cadera cae hacia el suelo (y mayor en imagen). Elige SIEMPRE la solución con mayor y
                        if int_a_y >= int_b_y:
                            sol_x, sol_y = int_a_x, int_a_y
                        else:
                            sol_x, sol_y = int_b_x, int_b_y
                else:
                    sol_x, sol_y = cand_x, cand_y

                primary_joints["hip"]["x"][f] = float(sol_x)
                primary_joints["hip"]["y"][f] = float(sol_y)
                primary_joints["hip"]["score"][f] = 0.85

            # Fix obligatorio: En un Hip Thrust / Glute Bridge, el glúteo/cadera en la fase excéntrica SIEMPRE cae por debajo de la recta hombro-rodilla
            for f in range(n_frames):
                min_hip_y = 0.5 * (sh_y[f] + knee_y[f]) - 0.02
                if primary_joints["hip"]["y"][f] < min_hip_y:
                    primary_joints["hip"]["y"][f] = float(min_hip_y)

                # Bug 3 Fix: En Hip Thrust en máquina, bloquea hip_x dentro de la franja horizontal entre el hombro y la rodilla
                min_span_x = min(sh_x[f], knee_x[f]) + 0.25 * abs(knee_x[f] - sh_x[f])
                max_span_x = max(sh_x[f], knee_x[f]) - 0.20 * abs(knee_x[f] - sh_x[f])
                if max_span_x > min_span_x:
                    primary_joints["hip"]["x"][f] = float(np.clip(primary_joints["hip"]["x"][f], min_span_x, max_span_x))

            # Re-smooth with zero-phase Butterworth filter post reconstruction (2.0 Hz)
            primary_joints["hip"]["x"] = apply_zero_phase_butterworth(primary_joints["hip"]["x"], fs=15.0, cutoff=2.0)
            primary_joints["hip"]["y"] = apply_zero_phase_butterworth(primary_joints["hip"]["y"], fs=15.0, cutoff=2.0)

        # D. Tibial Verticality & Knee Recovery
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

    # 3B. Upper Body Kinematic Stabilizer & Occlusion Guard (Perspective-Safe)
    if is_upper_body:
        wr_x = primary_joints["wrist"]["x"]
        wr_y = primary_joints["wrist"]["y"]
        el_x = primary_joints["elbow"]["x"]
        el_y = primary_joints["elbow"]["y"]
        sh_x = primary_joints["shoulder"]["x"]
        sh_y = primary_joints["shoulder"]["y"]
        wr_score = primary_joints["wrist"]["score"]
        el_score = primary_joints["elbow"]["score"]
        sh_score = primary_joints["shoulder"]["score"]

        # 1. Stable Virtual Hip Anchor if Hip is Obscured by Machine / T-Bar Pad (score_medio < 0.50)
        # Bug 3 Fix: facing_dir from head relative to torso midpoint (0.5 * (shoulder + hip))
        head_x_med = float(np.median(smoothed_head["x"]))
        mid_torso_x = float(0.5 * (np.median(sh_x) + np.median(primary_joints["hip"]["x"])))
        facing_dir = 1.0 if head_x_med >= mid_torso_x else -1.0
        
        mean_hip_score = float(np.mean(primary_joints["hip"]["score"])) if "hip" in primary_joints else 0.0
        is_chest_or_tbar = any(k in ex_lower for k in ["press", "bench", "incline", "chest", "dips", "t_bar", "remo_punta", "barra_t"])
        hide_torso_line = bool(is_chest_or_tbar or (is_upper_body and mean_hip_score < 0.60))
        if mean_hip_score < 0.50:
            for f in range(n_frames):
                primary_joints["hip"]["x"][f] = float(sh_x[f] - 0.08 * facing_dir)
                primary_joints["hip"]["y"][f] = float(min(0.92, sh_y[f] + 0.32))
                primary_joints["hip"]["score"][f] = 0.85
            primary_joints["hip"]["x"] = apply_zero_phase_butterworth_segmented(primary_joints["hip"]["x"], scene_cut_indices, fs=15.0, cutoff=2.2)
            primary_joints["hip"]["y"] = apply_zero_phase_butterworth_segmented(primary_joints["hip"]["y"], scene_cut_indices, fs=15.0, cutoff=2.2)

        # Update limb length medians passively from clean coordinates for downstream metrics
        sh_x_cur = primary_joints["shoulder"]["x"]
        sh_y_cur = primary_joints["shoulder"]["y"]
        el_x_cur = primary_joints["elbow"]["x"]
        el_y_cur = primary_joints["elbow"]["y"]
        wr_x_cur = primary_joints["wrist"]["x"]
        wr_y_cur = primary_joints["wrist"]["y"]

        hl_all = np.hypot(el_x_cur - sh_x_cur, el_y_cur - sh_y_cur)
        if len(hl_all) > 0 and np.median(hl_all) > 0.05:
            l_humerus_median = float(np.median(hl_all))
        fl_all = np.hypot(wr_x_cur - el_x_cur, wr_y_cur - el_y_cur)
        if len(fl_all) > 0 and np.median(fl_all) > 0.05:
            l_forearm_median = float(np.median(fl_all))

        primary_joints["hand"] = {
            "x": primary_joints["wrist"]["x"].copy(),
            "y": primary_joints["wrist"]["y"].copy(),
            "score": primary_joints["wrist"]["score"].copy()
        }
    else:
        primary_joints["hand"] = {
            "x": primary_joints["wrist"]["x"].copy(),
            "y": primary_joints["wrist"]["y"].copy(),
            "score": primary_joints["wrist"]["score"].copy()
        }

    # 4. Planar Joint Kinematics Calculated on Smoothed 2D Coordinates
    hp_2d = np.zeros(n_frames, dtype=np.float64)
    kn_2d = np.zeros(n_frames, dtype=np.float64)
    el_2d = np.zeros(n_frames, dtype=np.float64)
    hu_2d = np.zeros(n_frames, dtype=np.float64)
    torso_2d = np.zeros(n_frames, dtype=np.float64)
    neck_2d = np.zeros(n_frames, dtype=np.float64)

    for f in range(n_frames):
        sh = {"x": primary_joints["shoulder"]["x"][f], "y": primary_joints["shoulder"]["y"][f]}
        hp = {"x": primary_joints["hip"]["x"][f], "y": primary_joints["hip"]["y"][f]}
        kn = {"x": primary_joints["knee"]["x"][f], "y": primary_joints["knee"]["y"][f]}
        ak = {"x": primary_joints["ankle"]["x"][f], "y": primary_joints["ankle"]["y"][f]}
        el = {"x": primary_joints["elbow"]["x"][f], "y": primary_joints["elbow"]["y"][f]}
        wr = {"x": primary_joints["wrist"]["x"][f], "y": primary_joints["wrist"]["y"][f]}
        hd = {"x": smoothed_head["x"][f], "y": smoothed_head["y"][f]}

        # Fix obligatorio: Ángulo interno de la rodilla centrado en knee (90° con fémur horizontal y tibia vertical)
        v1_kn = np.array([hp["x"] - kn["x"], hp["y"] - kn["y"]])
        v2_kn = np.array([ak["x"] - kn["x"], ak["y"] - kn["y"]])
        cos_k = np.dot(v1_kn, v2_kn) / (np.linalg.norm(v1_kn) * np.linalg.norm(v2_kn) + 1e-6)
        raw_k = float(np.degrees(np.arccos(np.clip(cos_k, -1.0, 1.0))))

        # Ángulo interno de cadera centrado en hip
        v1_hp = np.array([sh["x"] - hp["x"], sh["y"] - hp["y"]])
        v2_hp = np.array([kn["x"] - hp["x"], kn["y"] - hp["y"]])
        cos_h = np.dot(v1_hp, v2_hp) / (np.linalg.norm(v1_hp) * np.linalg.norm(v2_hp) + 1e-6)
        raw_h = float(np.degrees(np.arccos(np.clip(cos_h, -1.0, 1.0))))
        if is_pattern_b:
            # 3D Foreshortening Perspective Compensation (prevents 2D planar angle collapse to 0.5 deg in presses/dips)
            d_fore = math.hypot(wr["x"] - el["x"], wr["y"] - el["y"])
            dz_fore = math.sqrt(max(0.0, l_forearm_median**2 - d_fore**2))
            v_hum = (sh["x"] - el["x"], sh["y"] - el["y"], 0.0)
            v_fore = (wr["x"] - el["x"], wr["y"] - el["y"], dz_fore)
            dot_p = v_hum[0] * v_fore[0] + v_hum[1] * v_fore[1]
            mag_prod = max(1e-5, l_humerus_median * l_forearm_median)
            cos_e = max(-1.0, min(1.0, dot_p / mag_prod))
            raw_e = float(math.degrees(math.acos(cos_e)))
            raw_e = float(np.clip(raw_e, 55.0, 175.0))
        else:
            raw_e = calculate_angle_2d(sh, el, wr)
        raw_hu = calculate_angle_2d(hp, sh, el)
        raw_t = calculate_angle_2d({"x": hp["x"], "y": hp["y"] - 0.2}, hp, sh)

        # Perspective & Oblique camera angle correction for Hip Thrust:
        if is_hip_thrust:
            if raw_h < 65.0:
                raw_h = 180.0 - raw_h
            
            # Dynamic continuous knee angle: preserve raw_k = calculate_angle_2d(hp, kn, ak)
            # so frames[t].secondary_angle updates live on canvas during ascent/descent.

        kn_2d[f] = raw_k
        hp_2d[f] = raw_h
        el_2d[f] = raw_e
        hu_2d[f] = raw_hu
        torso_2d[f] = raw_t

        # Ángulo cervical (desviación angular del cuello respecto al torso)
        v_torso = np.array([sh["x"] - hp["x"], sh["y"] - hp["y"]])
        v_neck = np.array([hd["x"] - sh["x"], hd["y"] - sh["y"]])
        nt = float(np.linalg.norm(v_torso))
        nn = float(np.linalg.norm(v_neck))
        if nt > 1e-4 and nn > 1e-4:
            cos_n = np.dot(v_torso, v_neck) / (nt * nn)
            raw_neck = float(np.degrees(np.arccos(np.clip(cos_n, -1.0, 1.0))))
        else:
            raw_neck = 0.0
        neck_2d[f] = raw_neck

    clean_el = apply_zero_phase_butterworth_continuous(el_2d, fs=15.0, cutoff=1.8)
    clean_hp = apply_zero_phase_butterworth_continuous(hp_2d, fs=15.0, cutoff=1.8)
    clean_kn = apply_zero_phase_butterworth_continuous(kn_2d, fs=15.0, cutoff=1.8)
    clean_hu = apply_zero_phase_butterworth_continuous(hu_2d, fs=15.0, cutoff=1.8)
    clean_torso = apply_zero_phase_butterworth_continuous(torso_2d, fs=15.0, cutoff=1.8)
    clean_neck = apply_zero_phase_butterworth_continuous(neck_2d, fs=15.0, cutoff=1.8)

    # Assign primary and secondary signals according to the 3 Universal Patterns:
    if is_pattern_a:
        # Pattern A — Tracción / Flexión
        clean_primary = clean_el
        clean_secondary = clean_torso
        is_trough_movement = True
        clean_curve = -clean_primary.copy()
    elif is_pattern_b:
        # Pattern B — Empuje / Extensión
        clean_primary = clean_el
        clean_secondary = clean_hu
        is_trough_movement = True
        clean_curve = -clean_primary.copy()
    else:
        # Pattern C — Tren Inferior
        if is_hip_thrust:
            clean_primary = clean_hp
            clean_secondary = clean_kn
            is_trough_movement = False
            clean_curve = clean_primary.copy()
        elif any(k in ex_lower for k in ["squat", "leg_press", "hack", "bulgarian", "leg_extension", "lunge"]):
            clean_primary = clean_kn
            clean_secondary = clean_hp
            is_trough_movement = True
            clean_curve = -clean_primary.copy()
        else: # RDL / Deadlift
            clean_primary = clean_hp
            clean_secondary = clean_kn
            is_trough_movement = True
            clean_curve = -clean_primary.copy()

    # 5. Peak-Trough Repetition Detection
    signal_range = float(np.max(clean_curve) - np.min(clean_curve))
    t_min_bound = timestamps[0] + 0.6 if timestamps else 0.6
    t_max_bound = timestamps[-1] - 0.3 if timestamps else 29.7

    min_rep_frames = max(20, int(15.0 * 1.30)) if is_pattern_b else max(16, int(15.0 * 1.15))

    p10 = float(np.percentile(clean_curve, 10))
    p90 = float(np.percentile(clean_curve, 90))
    eff_range = max(p90 - p10, 8.0)

    if is_pattern_a:
        # Bug 2 Fix: Lower prominence (max 20.0) for back/diagonal views where perspective compresses angular range
        target_prom = max(10.0, min(20.0, eff_range * 0.22))
    elif is_pattern_b:
        target_prom = max(10.0, min(20.0, eff_range * 0.18))
    elif is_hip_thrust:
        target_prom = max(15.0, min(28.0, eff_range * 0.22))
    else:
        target_prom = max(12.0, min(22.0, eff_range * 0.22))

    pks, _ = scipy.signal.find_peaks(
        clean_curve,
        prominence=target_prom,
        distance=min_rep_frames
    )
    in_bounds = [p for p in pks if t_min_bound <= timestamps[p] <= t_max_bound]

    # Fallback for subtle/slow executions
    if len(in_bounds) < 2 and eff_range >= 12.0:
        pks_soft, _ = scipy.signal.find_peaks(
            clean_curve,
            prominence=max(10.0, target_prom * 0.60),
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
            if is_pattern_b:
                # Lockout check: between two press valleys, check elbow extension with perspective-safe threshold
                crest_val = float(np.max(clean_primary[prev_p : p + 1]))
                if crest_val < max(100.0, clean_primary[prev_p] + 15.0):
                    # Incomplete extension, sticking point or pause: merge and keep the deeper inflection point
                    if clean_primary[p] < clean_primary[prev_p]:
                        filtered_peaks[-1] = p
                    continue

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

    # 6. Directional Force Vector Geometry & Moment Arms
    # Universal Auto-Adaptive Force Vector based on Real Wrist Extrema (P_extended vs P_flexed)
    p_ext = None
    p_flx = None
    if is_upper_body and len(clean_primary) > 0:
        p85_val = float(np.percentile(clean_primary, 85))
        p15_val = float(np.percentile(clean_primary, 15))
        ext_mask = clean_primary >= p85_val
        flx_mask = clean_primary <= p15_val
        if np.any(ext_mask) and np.any(flx_mask):
            p_ext = np.array([
                float(np.median(primary_joints["wrist"]["x"][ext_mask])),
                float(np.median(primary_joints["wrist"]["y"][ext_mask]))
            ])
            p_flx = np.array([
                float(np.median(primary_joints["wrist"]["x"][flx_mask])),
                float(np.median(primary_joints["wrist"]["y"][flx_mask]))
            ])

    # Athlete facing direction based on head/nose relative to torso midpoint
    head_x_med = float(np.median(smoothed_head["x"]))
    mid_torso_x = float(0.5 * (np.median(primary_joints["shoulder"]["x"]) + np.median(primary_joints["hip"]["x"])))
    facing_forward_x = 1.0 if head_x_med >= mid_torso_x else -1.0

    is_horizontal_pull = is_upper_body and (
        is_pattern_a or any(k in ex_lower for k in ["row", "t_bar", "gironda"])
    )
    is_machine_or_cable_pattern = (load_lower in ["machine", "cable"] or any(k in ex_lower for k in ["t_bar", "row"]))

    # Bug 4 Fix: Specific Machine Resistance Identifiers
    is_t_bar = any(k in ex_lower for k in ["t_bar", "remo_punta", "remo_en_punta", "barra_t"])
    is_chest_press_machine = any(k in ex_lower for k in ["chest_press", "press_pecho_maquina", "press_en_maquina", "press_maquina", "machine_press"])
    is_machine_dips = any(k in ex_lower for k in ["machine_dips", "dip_machine", "fondos_maquina", "fondos_en_maquina", "fondos_paralelas_maquina", "dips_machine", "chest_dips"])

    # Bug 3 Fix: Evaluate "Dorsal vs Espalda Alta" ONCE across the series strictly at peak contraction
    is_upper_back_series = False
    if is_upper_body and (is_pattern_a or "row" in ex_lower):
        if is_t_bar or "upper_back" in ex_lower or target_muscle.lower() in ["upper_back", "traps", "rhomboids"]:
            is_upper_back_series = True
        else:
            contraction_frames = valid_peaks if len(valid_peaks) > 0 else [int(np.argmin(clean_primary))]
            rel_heights = []
            for cpf in contraction_frames:
                sy = primary_joints["shoulder"]["y"][cpf]
                ey = primary_joints["elbow"]["y"][cpf]
                hy = primary_joints["hip"]["y"][cpf]
                sx = primary_joints["shoulder"]["x"][cpf]
                hx = primary_joints["hip"]["x"][cpf]
                t_len = math.hypot(sx - hx, sy - hy)
                if t_len > 0.05:
                    rel_heights.append((ey - sy) / t_len)
            if len(rel_heights) > 0:
                med_rh = float(np.median(rel_heights))
                is_upper_back_series = bool(med_rh < 0.48)
            else:
                is_upper_back_series = False

    # Force Vector Determination (Bug 2 Fix: Universal Adaptive Extrema):
    if is_pattern_b and p_ext is not None and p_flx is not None and (is_machine_or_cable_pattern or is_chest_press_machine or is_machine_dips or "incline" in ex_lower or "dumb" in ex_lower or "press" in ex_lower):
        # En Empujes: atleta empuja desde P_flexed hacia P_extended.
        # La resistencia de la máquina/barra actúa en sentido opuesto:
        push_dir = p_ext - p_flx
        norm_push = float(np.linalg.norm(push_dir))
        if norm_push > 0.02:
            u_resist = -push_dir / norm_push
            force_dx = float(u_resist[0])
            force_dy = float(u_resist[1])
            force_dir_name = "adaptive_push_resistance"
            force_origin = "hand_grip"
        else:
            force_dx = 0.0
            force_dy = 1.0
            force_dir_name = "vertical_down"
            force_origin = "hand_grip"
    elif is_pattern_a and p_ext is not None and p_flx is not None:
        # En Tracciones: atleta tira desde P_extended hacia P_flexed.
        # La carga tira hacia el anclaje en la dirección de P_extended:
        pull_dir = p_ext - p_flx
        norm_pull = float(np.linalg.norm(pull_dir))
        if norm_pull > 0.02:
            u_pull = pull_dir / norm_pull
            # En t_bar_row y remos asegurar uy >= 0.15 (hacia el suelo/discos, jamás hacia el techo)
            if (is_t_bar or "row" in ex_lower or "remo" in ex_lower) and u_pull[1] < 0.15:
                u_pull[1] = 0.35
                u_pull = u_pull / np.linalg.norm(u_pull)
            force_dx = float(u_pull[0])
            force_dy = float(u_pull[1])
            force_dir_name = "adaptive_pull_resistance"
            force_origin = "hand_grip"
        else:
            force_dx = float(facing_forward_x)
            force_dy = 0.35
            norm_f = math.hypot(force_dx, force_dy)
            force_dx /= norm_f
            force_dy /= norm_f
            force_dir_name = "along_pull"
            force_origin = "hand_grip"
    elif is_machine_or_cable_pattern:
        if any(k in ex_lower for k in ["lat_pulldown", "pulldown", "pullup"]):
            force_dir_name = "vertical_up"
            force_dx = 0.0
            force_dy = -1.0
            force_origin = "hand_grip"
        elif is_pattern_a:
            force_dir_name = "along_pull"
            force_dx = float(facing_forward_x)
            force_dy = 0.0
            force_origin = "hand_grip"
        elif is_pattern_b:
            force_dir_name = "horizontal_backward"
            force_dx = float(-facing_forward_x)
            force_dy = 0.0
            force_origin = "hand_grip"
        else:
            force_dir_name = "vertical_down"
            force_dx = 0.0
            force_dy = 1.0
            force_origin = "hand_grip" if is_upper_body else "load"
    else:  # free_weight / gravity
        force_dir_name = "vertical_down"
        force_dx = 0.0
        force_dy = 1.0
        force_origin = "hand_grip" if is_upper_body else "bar"

    # 7. Repetition Tempos, VBT & Clinical Postural Diagnostic
    repetitions_summary = []
    frame_rep_map = [0] * n_frames
    frame_phase_map = ["IDLE"] * n_frames

    # Congelar veredicto de colocación de pies en Hip Thrust usando la mediana en picos de extensión
    frozen_hip_thrust_knee = 90.0
    if is_hip_thrust:
        ext_peaks = valid_peaks if valid_peaks else [int(np.argmax(clean_curve))]
        ext_knee_vals = [float(clean_kn[p]) for p in ext_peaks if p < n_frames]
        if ext_knee_vals:
            frozen_hip_thrust_knee = float(np.median(ext_knee_vals))
        else:
            frozen_hip_thrust_knee = float(np.median(clean_kn))

    for i, p in enumerate(valid_peaks):
        rep_idx = i + 1
        
        # Start of rep
        if i == 0:
            # Search backwards from peak p to find the true onset of movement.
            # Frames prior to motion onset must stay rep_number = 0 and phase = "IDLE".
            search_start = max(0, p - int(15.0 * 2.5))
            left_search = clean_curve[search_start : p]
            local_min_offset = int(np.argmin(left_search)) if len(left_search) > 0 else 0
            cand_start = search_start + local_min_offset

            # Refine onset: find where angular velocity rises above 12 deg/s moving towards p
            start_frame = cand_start
            for f_scan in range(cand_start, p):
                if ang_vel[f_scan] >= 12.0:
                    start_frame = max(0, f_scan - 2)
                    break
        else:
            prev_bound = valid_peaks[i - 1]
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

        if is_pattern_a:
            # Pattern A (Tracción/Remo): Pulling to body is concentric, returning forward is eccentric
            concentric_time_s = round(max(0.25, t_inflect - t_start), 2)
            eccentric_time_s = round(max(0.25, t_end - t_inflect), 2)
            delta_angle_conc = abs(clean_primary[bottom_frame] - clean_primary[start_frame])
        elif is_pattern_b:
            # Pattern B (Empuje/Presses): Lowering is eccentric, pressing up is concentric
            eccentric_time_s = round(max(0.25, t_inflect - t_start), 2)
            concentric_time_s = round(max(0.25, t_end - t_inflect), 2)
            delta_angle_conc = abs(clean_primary[end_frame] - clean_primary[bottom_frame])
        else:
            # Pattern C (Tren inferior):
            if is_hip_thrust:
                concentric_time_s = round(max(0.25, t_inflect - t_start), 2)
                eccentric_time_s = round(max(0.25, t_end - t_inflect), 2)
                delta_angle_conc = abs(clean_primary[bottom_frame] - clean_primary[start_frame])
            else:
                eccentric_time_s = round(max(0.25, t_inflect - t_start), 2)
                concentric_time_s = round(max(0.25, t_end - t_inflect), 2)
                delta_angle_conc = abs(clean_primary[end_frame] - clean_primary[bottom_frame])

        # Reject micro-reps, twitches, or incomplete hesitations
        if rom_deg < 22.0 or (t_end - t_start) < 1.25 or (is_pattern_b and concentric_time_s < 0.28):
            continue

        # Pause duration: time stationary (velocity < 15 deg/s) around inflection
        window_start = max(start_frame, bottom_frame - 4)
        window_end = min(end_frame, bottom_frame + 4)
        stationary_frames = sum(1 for f in range(window_start, window_end + 1) if ang_vel[f] < 15.0)
        pause_time_s = round(float(stationary_frames / 15.0), 2)

        raw_conc_vel = float(delta_angle_conc / max(concentric_time_s, 0.1))
        # Bug 5 Fix: Clamp realistic concentric velocity between 25 deg/s and 140 deg/s
        concentric_velocity_deg_s = round(float(np.clip(raw_conc_vel, 25.0, 140.0)), 1)

        # Planar positions at inflection frame
        sh_x_inf = primary_joints["shoulder"]["x"][bottom_frame]
        sh_y_inf = primary_joints["shoulder"]["y"][bottom_frame]
        el_x_inf = primary_joints["elbow"]["x"][bottom_frame]
        el_y_inf = primary_joints["elbow"]["y"][bottom_frame]
        wr_x_inf = primary_joints["wrist"]["x"][bottom_frame]
        wr_y_inf = primary_joints["wrist"]["y"][bottom_frame]
        hx_inf = primary_joints["hand"]["x"][bottom_frame]
        hy_inf = primary_joints["hand"]["y"][bottom_frame]
        hp_x_inf = primary_joints["hip"]["x"][bottom_frame]
        hp_y_inf = primary_joints["hip"]["y"][bottom_frame]
        kn_x_inf = primary_joints["knee"]["x"][bottom_frame]
        kn_y_inf = primary_joints["knee"]["y"][bottom_frame]
        ak_x_inf = primary_joints["ankle"]["x"][bottom_frame]
        ak_y_inf = primary_joints["ankle"]["y"][bottom_frame]

        inflect_elbow = float(clean_el[bottom_frame])
        inflect_hip = float(clean_hp[bottom_frame])
        inflect_knee = float(clean_kn[bottom_frame])

        pectoral_share = None
        triceps_share = None
        dorsal_share = None
        biceps_share = None

        if is_pattern_a:
            # Pattern A — Tracción / Flexión
            # Perpendicular moment arms relative to the dynamic machine line of force passing through hand grip
            if is_horizontal_pull and machine_u_per_frame is not None:
                u_fx = float(machine_u_per_frame[bottom_frame, 0])
                u_fy = float(machine_u_per_frame[bottom_frame, 1])
            else:
                u_fx = float(force_dx)
                u_fy = float(force_dy)

            # Perpendicular distance formula to line passing through hand: d = |(Px - Hx)*uy - (Py - Hy)*ux|
            d_sh = float(abs((sh_x_inf - hx_inf) * u_fy - (sh_y_inf - hy_inf) * u_fx))
            d_el = float(abs((el_x_inf - hx_inf) * u_fy - (el_y_inf - hy_inf) * u_fx))
            d_hp = 0.0
            d_kn = 0.0

            # Bug 3 Fix: Locked Series-Wide Classification (Evaluated strictly at contraction)
            is_upper_back = bool(is_upper_back_series)

            # Torque distribution strictly from moment arms relative to the line of force (Sin depender del ángulo del codo)
            tot_d = d_sh + d_el
            if tot_d > 0.005:
                el_ratio = d_el / tot_d
                if el_ratio <= 0.10 or d_el <= 0.015:
                    # Line of force passes through/close to elbow -> Todo Espalda
                    biceps_share = 0.0
                    back_share = 100.0
                    if is_upper_back:
                        dominant_joint = "ESPALDA ALTA"
                        torque_bias = "ESPALDA ALTA (TODO ESPALDA)"
                        recom = "Todo Espalda: línea de fuerza alineada con el codo. Carga 100% sobre trapecio y romboides (bíceps neutro)."
                    else:
                        dominant_joint = "DORSAL ANCHO"
                        torque_bias = "DORSAL ANCHO (TODO ESPALDA)"
                        recom = "Todo Espalda: línea de fuerza alineada con el codo. Carga 100% sobre dorsal ancho (bíceps neutro)."
                else:
                    back_share = round((d_sh / tot_d) * 100.0, 1)
                    biceps_share = round((d_el / tot_d) * 100.0, 1)
                    if is_upper_back:
                        dominant_joint = "ESPALDA ALTA"
                        torque_bias = "ESPALDA ALTA (ROMBOIDES / TRAPECIO)"
                        recom = f"Codo separado del torso: palanca en espalda alta ({back_share}%) con brazo de momento activo en codo ({biceps_share}% bíceps)."
                    else:
                        dominant_joint = "DORSAL ANCHO"
                        torque_bias = "DORSAL ANCHO (CODO PEGADO AL TORSO)"
                        recom = f"Codo junto al torso: palanca en dorsal ancho ({back_share}%) con brazo de momento activo en codo ({biceps_share}% bíceps)."
            else:
                back_share = 85.0
                biceps_share = 15.0
                dominant_joint = "ESPALDA ALTA" if is_upper_back else "DORSAL ANCHO"
                torque_bias = dominant_joint
                recom = "Tracción fluida con escápulas activas."

            status = "OPTIMAL"
            dorsal_share = back_share

        elif is_pattern_b:
            # Pattern B — Empuje / Extensión (press, bench, dips)
            u_fx = float(force_dx)
            u_fy = float(force_dy)
            d_sh = float(abs((sh_x_inf - hx_inf) * u_fy - (sh_y_inf - hy_inf) * u_fx))
            d_el = float(abs((el_x_inf - hx_inf) * u_fy - (el_y_inf - hy_inf) * u_fx))
            d_hp = 0.0
            d_kn = 0.0

            tot_d = d_sh + d_el
            if tot_d > 0.005:
                pectoral_share = round((d_sh / tot_d) * 100.0, 1)
                triceps_share = round((d_el / tot_d) * 100.0, 1)
            else:
                pectoral_share = 75.0
                triceps_share = 25.0

            # Bug 4 Fix: Chest exercises show PECTORAL MAYOR (>=50%) or TRÍCEPS BRAQUIAL (>50%), never back
            dominant_joint = "PECTORAL MAYOR" if pectoral_share >= 50.0 else "TRÍCEPS BRAQUIAL"
            torque_bias = dominant_joint

            # Clinical Technical Coaching Recommendation (Modo 1: Corrección Técnica)
            recom = "Apoyo firme de pies en suelo (leg drive), escápulas retraídas con arco natural sin hiperextensión lumbar, codos a ~50° y descenso completo a clavículas."
            status = "OPTIMAL"

        else:
            # Pattern C — Tren Inferior
            if is_hip_thrust:
                dominant_joint = "CADERA"
                eval_knee = frozen_hip_thrust_knee
                if eval_knee < 78.0:
                    recom = f"Pies demasiado retrasados ({round(eval_knee)}° < 78°): sobrecarga de cuádriceps. Adelanta los pies ~5-8 cm."
                    status = "IMPROVEMENT_OPPORTUNITY"
                    torque_bias = "CUÁDRICEPS"
                elif eval_knee <= 102.0:
                    recom = f"Alineación articular óptima ({round(eval_knee)}° en rodilla). Bloqueo concéntrico directo sobre glúteo mayor."
                    status = "OPTIMAL"
                    torque_bias = "GLÚTEO MAYOR"
                else:
                    recom = f"Pies demasiado adelantados ({round(eval_knee)}° > 102°): sobrecarga de isquiosurales. Retrasa los pies ~5-8 cm."
                    status = "IMPROVEMENT_OPPORTUNITY"
                    torque_bias = "ISQUIOSURALES"
                inflect_knee = eval_knee
                d_sh = 0.0
                d_el = 0.0
                d_hp = 0.0
                d_kn = 0.0

            elif any(k in ex_lower for k in ["squat", "leg_press", "hack", "bulgarian", "leg_extension"]):
                dominant_joint = "RODILLA"
                torque_bias = "CUÁDRICEPS"
                deep_enough = inflect_knee <= 95.0
                recom = "Profundidad clínica alcanzada (rodilla ≤90° con fémur paralelo al suelo)." if deep_enough else "Profundidad parcial. Desciende hasta romper la paralela para máxima activación de cuádriceps."
                status = "OPTIMAL" if deep_enough else "IMPROVEMENT_OPPORTUNITY"
                d_sh = 0.0
                d_el = 0.0
                d_kn = float(abs(kn_x_inf - hp_x_inf))
                d_hp = float(abs(hp_x_inf - ak_x_inf))

            else: # RDL / Deadlift
                if inflect_knee >= 145.0:
                    dominant_joint = "CADERA"
                    torque_bias = "ISQUIOSURALES"
                    muscle_focus_txt = "ISQUIOSURALES"
                    recom = "Pierna semirrígida (rodilla ≥145°): máximo estiramiento y tensión mecánica en isquiosurales."
                    status = "OPTIMAL"
                elif inflect_knee >= 130.0:
                    dominant_joint = "CADERA"
                    torque_bias = "GLÚTEO E ISQUIOS"
                    muscle_focus_txt = "GLÚTEO E ISQUIOS"
                    recom = "Flexión moderada de rodilla (130°-145°): reparto equilibrado entre Glúteo Mayor e Isquiosurales."
                    status = "OPTIMAL"
                else: # inflect_knee < 130.0 (alta flexión de rodilla)
                    dominant_joint = "GLÚTEO MAYOR"
                    torque_bias = "GLÚTEO MAYOR"
                    muscle_focus_txt = "GLÚTEO MAYOR (Por flexión de rodilla)"
                    recom = "Alta flexión de rodilla (<130°): mayor reclutamiento de Glúteo Mayor y menor tensión pasiva en Isquiosurales."
                    status = "OPTIMAL"
                d_sh = 0.0
                d_el = 0.0
                d_hp = float(abs(hp_x_inf - wr_x_inf))
                d_kn = float(abs(kn_x_inf - wr_x_inf))

        verdict = {
            "status": status,
            "dominant_joint": dominant_joint,
            "target_alignment": bool(status == "OPTIMAL"),
            "primary_torque_bias": torque_bias,
            "muscle_focus": muscle_focus_txt if 'muscle_focus_txt' in locals() else torque_bias,
            "min_bottom_knee_angle": round(inflect_knee, 1),
            "inflection_knee_deg": round(inflect_knee, 1),
            "inflection_hip_deg": round(inflect_hip, 1),
            "inflection_elbow_deg": round(inflect_elbow, 1),
            "pectoral_share": round(pectoral_share, 1) if pectoral_share else None,
            "triceps_share": round(triceps_share, 1) if triceps_share else None,
            "dorsal_share": round(dorsal_share, 1) if dorsal_share else None,
            "biceps_share": round(biceps_share, 1) if biceps_share else None,
            "is_upper_back": bool(is_upper_back) if is_pattern_a else False,
            "d_hip_norm": round(d_hp, 3),
            "d_knee_norm": round(d_kn, 3),
            "d_shoulder_norm": round(d_sh, 3),
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
            if is_pattern_a:
                if f < bottom_frame:
                    frame_phase_map[f] = "CONCENTRIC"
                elif f == bottom_frame:
                    frame_phase_map[f] = "INFLECTION"
                else:
                    frame_phase_map[f] = "ECCENTRIC"
            elif is_pattern_b:
                if f < bottom_frame:
                    frame_phase_map[f] = "ECCENTRIC"
                elif f == bottom_frame:
                    frame_phase_map[f] = "INFLECTION"
                else:
                    frame_phase_map[f] = "CONCENTRIC"
            else:
                if is_hip_thrust:
                    if f < bottom_frame:
                        frame_phase_map[f] = "CONCENTRIC"
                    elif f == bottom_frame:
                        frame_phase_map[f] = "INFLECTION"
                    else:
                        frame_phase_map[f] = "ECCENTRIC"
                else:
                    if f < bottom_frame:
                        frame_phase_map[f] = "ECCENTRIC"
                    elif f == bottom_frame:
                        frame_phase_map[f] = "INFLECTION"
                    else:
                        frame_phase_map[f] = "CONCENTRIC"

    # Terminal Repetition Detection at Muscle Failure (Agonizing grind / sticking point / partial rep at set completion)
    if len(repetitions_summary) >= 1:
        last_rep_end = end_frame
        med_rom = float(np.median([r["rom_deg"] for r in repetitions_summary]))
        med_conc = float(np.median([r["concentric_sec"] for r in repetitions_summary]))
        best_rom = float(np.max([r["rom_deg"] for r in repetitions_summary]))

        # Check for uncompleted agonizing attempt in remaining frames
        if (n_frames - 1) - last_rep_end >= 12:
            tail_curve = clean_curve[last_rep_end : n_frames]
            tail_peak_rel = int(np.argmax(tail_curve))
            tail_peak_frame = last_rep_end + tail_peak_rel
            
            tail_start_rel = int(np.argmin(clean_curve[last_rep_end : tail_peak_frame + 1])) if tail_peak_frame > last_rep_end else 0
            tail_start_frame = last_rep_end + tail_start_rel

            tail_min_a = float(np.min(clean_primary[tail_start_frame : min(n_frames, tail_peak_frame + 6)]))
            tail_max_a = float(np.max(clean_primary[tail_start_frame : min(n_frames, tail_peak_frame + 6)]))
            tail_rom = max(0.0, tail_max_a - tail_min_a)

            tail_t_conc = max(0.25, timestamps[tail_peak_frame] - timestamps[tail_start_frame])
            is_terminal_failure_rep = (
                tail_rom >= 0.55 * med_rom and (
                    tail_t_conc >= 1.6 * med_conc or
                    tail_rom < 0.70 * med_rom
                )
            )

            if is_terminal_failure_rep:
                tail_rep_idx = len(repetitions_summary) + 1
                raw_tail_vel = float(np.clip(tail_rom / tail_t_conc, 25.0, 140.0))
                # Bug 5 Fix: Only apply quadratic penalty if ROM drops below 70%
                rom_penalty = (tail_rom / max(best_rom, 1.0)) ** 2 if tail_rom < 0.70 * med_rom else 1.0
                penalized_tail_vel = round(float(np.clip(raw_tail_vel * rom_penalty, 25.0, 140.0)), 1)

                t_t_start = timestamps[tail_start_frame]
                t_t_peak = timestamps[tail_peak_frame]
                t_t_end = timestamps[min(n_frames - 1, tail_peak_frame + 8)]

                tail_rep_data = {
                    "rep_number": tail_rep_idx,
                    "start_time": round(t_t_start, 2),
                    "inflection_time": round(t_t_peak, 2),
                    "end_time": round(t_t_end, 2),
                    "duration_sec": round(float(t_t_end - t_t_start), 2),
                    "eccentric_sec": round(max(0.2, t_t_end - t_t_peak), 2) if is_pattern_a or is_hip_thrust else round(max(0.2, t_t_peak - t_t_start), 2),
                    "pause_sec": 0.0,
                    "concentric_sec": round(tail_t_conc, 2),
                    "pause_time_s": 0.0,
                    "concentric_time_s": round(tail_t_conc, 2),
                    "concentric_velocity_deg_s": penalized_tail_vel,
                    "min_primary_angle": round(tail_min_a, 1),
                    "max_primary_angle": round(tail_max_a, 1),
                    "rom_deg": round(tail_rom, 1),
                    "verdict": {
                        "status": "IMPROVEMENT_OPPORTUNITY",
                        "dominant_joint": repetitions_summary[-1]["verdict"].get("dominant_joint", "CADERA"),
                        "target_alignment": False,
                        "primary_torque_bias": repetitions_summary[-1]["verdict"].get("primary_torque_bias", "FALLO MUSCULAR"),
                        "inflection_knee_deg": repetitions_summary[-1]["verdict"].get("inflection_knee_deg", 90.0),
                        "inflection_hip_deg": repetitions_summary[-1]["verdict"].get("inflection_hip_deg", 170.0),
                        "inflection_elbow_deg": repetitions_summary[-1]["verdict"].get("inflection_elbow_deg", 90.0),
                        "recommendation": "Fallo concéntrico real (RIR 0 / RPE 10) alcanzado. Repetición terminal al límite."
                    }
                }
                repetitions_summary.append(tail_rep_data)

                for f in range(tail_start_frame, min(n_frames, tail_peak_frame + 8)):
                    frame_rep_map[f] = tail_rep_idx
                    if f < tail_peak_frame:
                        frame_phase_map[f] = "CONCENTRIC" if (is_pattern_a or is_hip_thrust) else "ECCENTRIC"
                    elif f == tail_peak_frame:
                        frame_phase_map[f] = "INFLECTION"
                    else:
                        frame_phase_map[f] = "ECCENTRIC" if (is_pattern_a or is_hip_thrust) else "CONCENTRIC"
        else:
            # Bug 5 Fix: Only penalize if ROM drops below 70% of median (true failure midway)
            last_r = repetitions_summary[-1]
            if last_r["rom_deg"] < 0.70 * med_rom:
                rom_pen = (last_r["rom_deg"] / max(best_rom, 1.0)) ** 2
                last_r["concentric_velocity_deg_s"] = round(float(np.clip(last_r["concentric_velocity_deg_s"] * rom_pen, 25.0, 140.0)), 1)

    # 8. Velocity-Based Training (VBT) Precision Engine
    # Map V_fail by mechanical movement pattern:
    # - press / bench_press / chest_press_machine / dips: 28.0 °/s
    # - squat / bulgarian / leg_press: 35.0 °/s
    # - hip_thrust / rdl / deadlift: 26.0 °/s
    # - rowing / pulldown / curl: 42.0 °/s
    if is_pattern_c:
        if is_hip_thrust or any(k in ex_lower for k in ["rdl", "deadlift", "peso_muerto"]):
            v_fail = 26.0
        else:
            v_fail = 35.0
    elif is_pattern_b:
        v_fail = 28.0
    else:
        v_fail = 42.0

    if len(repetitions_summary) >= 2:
        rep_vels = [float(r["concentric_velocity_deg_s"]) for r in repetitions_summary]
        N = len(rep_vels)
        # Reference velocity v_best from fastest of first min(3, N) reps
        v_best = float(max(rep_vels[:min(3, N)]))
        v_last = float(rep_vels[-1])
        first_rep_vel = float(rep_vels[0])
        max_rep_vel = float(max(rep_vels))

        # Velocity decay slope per rep towards terminal failure
        delta_v_rep = float(max(1.5, (v_best - v_last) / max(1, N - 1)))

        # Exact RIR & RPE calculation via linear decay towards critical failure velocity
        exact_rir = round(float(max(0.0, min(5.0, (v_last - v_fail) / delta_v_rep))), 1)
        exact_rpe = round(float(10.0 - exact_rir), 1)

        vel_loss = round(float(max(0.0, ((v_best - v_last) / max(v_best, 1e-4)) * 100.0)), 1)
        med_rom_val = float(np.median([r["rom_deg"] for r in repetitions_summary]))
        has_rom_failure = bool(repetitions_summary[-1]["rom_deg"] < 0.70 * med_rom_val)

        if has_rom_failure or v_last <= v_fail:
            exact_rir = 0.0
            exact_rpe = 10.0

        estimated_1rm_kg = None
        if weight_kg is not None:
            try:
                w_val = float(weight_kg)
                if w_val > 0:
                    estimated_1rm_kg = round(w_val * (1.0 + (N + exact_rir) / 30.0), 1)
            except (ValueError, TypeError):
                estimated_1rm_kg = None

        intensity_metrics = {
            "estimated_rir": f"RIR {exact_rir}",
            "estimated_rpe": exact_rpe,
            "exact_rir": exact_rir,
            "exact_rpe": exact_rpe,
            "v_fail": v_fail,
            "delta_v_rep": round(delta_v_rep, 1),
            "estimated_1rm_kg": estimated_1rm_kg,
            "velocity_loss_pct": vel_loss,
            "first_rep_vel": round(first_rep_vel, 1),
            "v_best": round(v_best, 1),
            "last_rep_vel": round(v_last, 1),
            "max_rep_vel": round(max_rep_vel, 1),
            "rep_velocities": rep_vels,
            "status_text": "VBT Óptimo (Linear V_fail)"
        }
    else:
        v_last = float(repetitions_summary[0]["concentric_velocity_deg_s"]) if repetitions_summary else 0.0
        delta_v_rep = 5.0
        exact_rir = round(float(max(0.0, min(5.0, (v_last - v_fail) / delta_v_rep))), 1) if v_last > 0 else 3.0
        exact_rpe = round(float(10.0 - exact_rir), 1)
        estimated_1rm_kg = None
        if weight_kg is not None:
            try:
                w_val = float(weight_kg)
                if w_val > 0:
                    estimated_1rm_kg = round(w_val * (1.0 + (1 + exact_rir) / 30.0), 1)
            except (ValueError, TypeError):
                estimated_1rm_kg = None

        intensity_metrics = {
            "estimated_rir": f"RIR {exact_rir}" if len(repetitions_summary) == 1 else "N/A",
            "estimated_rpe": exact_rpe if len(repetitions_summary) == 1 else 0.0,
            "exact_rir": exact_rir if len(repetitions_summary) == 1 else None,
            "exact_rpe": exact_rpe if len(repetitions_summary) == 1 else None,
            "v_fail": v_fail,
            "delta_v_rep": delta_v_rep,
            "estimated_1rm_kg": estimated_1rm_kg,
            "velocity_loss_pct": 0.0,
            "first_rep_vel": round(v_last, 1),
            "last_rep_vel": round(v_last, 1),
            "max_rep_vel": round(v_last, 1),
            "rep_velocities": [v_last] if repetitions_summary else [],
            "status_text": "VBT: Estimado (1 rep)" if len(repetitions_summary) == 1 else "VBT: Requiere ≥ 2 reps"
        }

    # 9. Per-Frame Output Projection
    frames_output = []
    for f in range(n_frames):
        rep_num = frame_rep_map[f]
        wr_x = primary_joints["wrist"]["x"][f]
        wr_y = primary_joints["wrist"]["y"][f]
        hp_x = primary_joints["hip"]["x"][f]
        hp_y = primary_joints["hip"]["y"][f]
        kn_x = primary_joints["knee"]["x"][f]
        kn_y = primary_joints["knee"]["y"][f]
        sh_x = primary_joints["shoulder"]["x"][f]
        sh_y = primary_joints["shoulder"]["y"][f]
        ak_x = primary_joints["ankle"]["x"][f]
        ak_y = primary_joints["ankle"]["y"][f]
        el_x = primary_joints["elbow"]["x"][f]
        el_y = primary_joints["elbow"]["y"][f]
        cur_hx = primary_joints["hand"]["x"][f]
        cur_hy = primary_joints["hand"]["y"][f]

        if (len(repetitions_summary) > 0 and rep_num > 0 and rep_num <= len(repetitions_summary)):
            base_rep_verdict = repetitions_summary[rep_num - 1]["verdict"]
        else:
            med_knee = float(np.median(clean_kn))
            med_hip = float(np.median(clean_hp))
            med_elbow = float(np.median(clean_el))
            
            if is_pattern_a:
                # Relationship with dynamic machine line of force
                if is_horizontal_pull and machine_u_per_frame is not None:
                    u_fx = float(machine_u_per_frame[f, 0])
                    u_fy = float(machine_u_per_frame[f, 1])
                elif svd_force_u is not None:
                    u_fx = float(force_dx)
                    u_fy = float(force_dy)
                else:
                    u_fx = float(facing_forward_x)
                    u_fy = 0.0
                cur_d_sh = float(abs((sh_x - cur_hx) * u_fy - (sh_y - cur_hy) * u_fx))
                cur_d_el = float(abs((el_x - cur_hx) * u_fy - (el_y - cur_hy) * u_fx))
                
                # Bug 3 Fix: Use locked series-wide classification
                is_upper_back = bool(is_upper_back_series)

                tot_d = cur_d_sh + cur_d_el
                if tot_d > 0.005:
                    el_ratio = cur_d_el / tot_d
                    if el_ratio <= 0.10 or cur_d_el <= 0.015:
                        fb_bic = 0.0
                        fb_dor = 100.0
                        fb_bias = "ESPALDA ALTA (TODO ESPALDA)" if is_upper_back else "DORSAL ANCHO (TODO ESPALDA)"
                        fb_rec = "Línea de fuerza alineada con el codo: carga sobre la espalda (bíceps neutro)."
                    else:
                        fb_dor = round((cur_d_sh / tot_d) * 100.0, 1)
                        fb_bic = round((cur_d_el / tot_d) * 100.0, 1)
                        fb_bias = "ESPALDA ALTA (ROMBOIDES / TRAPECIO)" if is_upper_back else "DORSAL ANCHO (CODO PEGADO AL TORSO)"
                        fb_rec = f"Brazo de momento activo en codo ({fb_bic}% bíceps) y hombro ({fb_dor}% espalda)."
                else:
                    fb_dor = 85.0
                    fb_bic = 15.0
                    fb_bias = "ESPALDA ALTA" if is_upper_back else "DORSAL ANCHO"
                    fb_rec = "Tracción fluida."

                base_rep_verdict = {
                    "status": "OPTIMAL",
                    "dominant_joint": "ESPALDA ALTA" if is_upper_back else "DORSAL ANCHO",
                    "target_alignment": True,
                    "primary_torque_bias": fb_bias,
                    "inflection_knee_deg": 90.0,
                    "inflection_hip_deg": 180.0,
                    "inflection_elbow_deg": round(med_elbow, 1),
                    "dorsal_share": round(fb_dor, 1),
                    "biceps_share": round(fb_bic, 1),
                    "is_upper_back": bool(is_upper_back),
                    "d_hip_norm": 0.0,
                    "d_knee_norm": 0.0,
                    "d_shoulder_norm": round(cur_d_sh, 4),
                    "d_elbow_norm": round(cur_d_el, 4),
                    "recommendation": fb_rec
                }
            elif is_pattern_b:
                cur_d_sh = float(abs(sh_y - cur_hy) if force_dir_name.startswith("horizontal") else abs(sh_x - cur_hx))
                cur_d_el = float(abs(el_y - cur_hy) if force_dir_name.startswith("horizontal") else abs(el_x - cur_hx))
                tot_d = cur_d_sh + cur_d_el
                if tot_d > 0.005:
                    fb_pec = round((cur_d_sh / tot_d) * 100.0, 1)
                    fb_tri = round((cur_d_el / tot_d) * 100.0, 1)
                    if fb_tri < 5.0:
                        fb_tri = 5.0
                        fb_pec = 95.0
                    fb_bias = "PECTORAL MAYOR" if fb_pec >= 50.0 else "TRÍCEPS BRAQUIAL"
                else:
                    fb_pec = 75.0
                    fb_tri = 25.0
                    fb_bias = "PECTORAL MAYOR"

                base_rep_verdict = {
                    "status": "OPTIMAL",
                    "dominant_joint": fb_bias,
                    "target_alignment": True,
                    "primary_torque_bias": fb_bias,
                    "inflection_knee_deg": 90.0,
                    "inflection_hip_deg": 180.0,
                    "inflection_elbow_deg": round(med_elbow, 1),
                    "pectoral_share": round(fb_pec, 1),
                    "triceps_share": round(fb_tri, 1),
                    "d_hip_norm": 0.0,
                    "d_knee_norm": 0.0,
                    "d_shoulder_norm": round(cur_d_sh, 4),
                    "d_elbow_norm": round(cur_d_el, 4),
                    "recommendation": "Apoyo firme de pies en suelo (leg drive), escápulas retraídas con arco natural sin hiperextensión lumbar, codos a ~50° y descenso completo a clavículas."
                }
            elif is_hip_thrust:
                eval_knee = frozen_hip_thrust_knee
                if eval_knee < 78.0:
                    ht_recom = f"Pies demasiado retrasados ({round(eval_knee)}° < 78°): sobrecarga de cuádriceps. Adelanta los pies ~5-8 cm."
                    ht_status = "IMPROVEMENT_OPPORTUNITY"
                    ht_bias = "CUÁDRICEPS"
                elif eval_knee <= 102.0:
                    ht_recom = f"Alineación articular óptima ({round(eval_knee)}° en rodilla). Bloqueo concéntrico directo sobre glúteo mayor."
                    ht_status = "OPTIMAL"
                    ht_bias = "GLÚTEO MAYOR"
                else:
                    ht_recom = f"Pies demasiado adelantados ({round(eval_knee)}° > 102°): sobrecarga de isquiosurales. Retrasa los pies ~5-8 cm."
                    ht_status = "IMPROVEMENT_OPPORTUNITY"
                    ht_bias = "ISQUIOSURALES"
                base_rep_verdict = {
                    "status": ht_status,
                    "dominant_joint": "CADERA",
                    "target_alignment": bool(ht_status == "OPTIMAL"),
                    "primary_torque_bias": ht_bias,
                    "inflection_knee_deg": round(eval_knee, 1),
                    "inflection_hip_deg": round(med_hip, 1),
                    "inflection_elbow_deg": round(med_elbow, 1),
                    "d_hip_norm": 0.0,
                    "d_knee_norm": 0.0,
                    "d_shoulder_norm": 0.0,
                    "recommendation": ht_recom
                }
            elif any(k in ex_lower for k in ["squat", "leg_press", "hack", "bulgarian", "leg_extension"]):
                base_rep_verdict = {
                    "status": "OPTIMAL",
                    "dominant_joint": "RODILLA",
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
                if med_knee >= 145.0:
                    dom_j = "CADERA"
                    t_bias = "ISQUIOSURALES"
                    m_foc = "ISQUIOSURALES"
                    rec = "Pierna semirrígida (rodilla ≥145°): máximo estiramiento y tensión mecánica en isquiosurales."
                elif med_knee >= 130.0:
                    dom_j = "CADERA"
                    t_bias = "GLÚTEO E ISQUIOS"
                    m_foc = "GLÚTEO E ISQUIOS"
                    rec = "Flexión moderada de rodilla (130°-145°): reparto equilibrado entre Glúteo Mayor e Isquiosurales."
                else: # med_knee < 130.0 (alta flexión de rodilla)
                    dom_j = "GLÚTEO MAYOR"
                    t_bias = "GLÚTEO MAYOR"
                    m_foc = "GLÚTEO MAYOR (Por flexión de rodilla)"
                    rec = "Alta flexión de rodilla (<130°): mayor reclutamiento de Glúteo Mayor y menor tensión pasiva en Isquiosurales."

                base_rep_verdict = {
                    "status": "OPTIMAL",
                    "dominant_joint": dom_j,
                    "target_alignment": True,
                    "primary_torque_bias": t_bias,
                    "muscle_focus": m_foc,
                    "min_bottom_knee_angle": round(med_knee, 1),
                    "inflection_knee_deg": round(med_knee, 1),
                    "inflection_hip_deg": round(med_hip, 1),
                    "inflection_elbow_deg": round(med_elbow, 1),
                    "d_hip_norm": round(float(abs(hp_x - wr_x)), 3),
                    "d_knee_norm": round(float(abs(kn_x - wr_x)), 3),
                    "d_shoulder_norm": 0.0,
                    "recommendation": rec
                }

        # Projected 2D Moment Arms for Canvas Overlay
        if is_upper_body:
            # Check if exercise is T-Bar row or machine row where resistance follows the forearm
            is_t_bar_ex = is_t_bar or any(k in ex_lower for k in ["t_bar", "remo_punta", "barra_t"])
            if is_t_bar_ex or (is_pattern_a and (is_machine_or_cable_pattern or "machine" in ex_lower)):
                # Vector along forearm pointing forward/down toward machine
                arm_vx = cur_hx - el_x
                arm_vy = cur_hy - el_y
                arm_norm = math.hypot(arm_vx, arm_vy)
                if arm_norm > 1e-4:
                    u_fx = arm_vx / arm_norm
                    u_fy = arm_vy / arm_norm
                    if u_fy < 0.15:
                        u_fy = 0.35
                        renorm = math.hypot(u_fx, u_fy)
                        u_fx /= renorm
                        u_fy /= renorm
                else:
                    u_fx = float(facing_forward_x)
                    u_fy = 0.35
                    renorm = math.hypot(u_fx, u_fy)
                    u_fx /= renorm
                    u_fy /= renorm
                f_d_sh = max(0.08, abs((sh_x - cur_hx) * u_fy - (sh_y - cur_hy) * u_fx))
                f_d_el = max(0.025, abs((el_x - cur_hx) * u_fy - (el_y - cur_hy) * u_fx))
                cur_force_dir = "along_forearm_machine"
            elif is_pattern_b:
                u_fx = float(force_dx)
                u_fy = float(force_dy)
                sh_eff_x = sh_x + 0.15 * (el_x - sh_x)
                sh_eff_y = sh_y + 0.15 * (el_y - sh_y)
                f_d_sh = max(0.045, abs((sh_eff_x - cur_hx) * u_fy - (sh_eff_y - cur_hy) * u_fx))
                f_d_el = abs((el_x - cur_hx) * u_fy - (el_y - cur_hy) * u_fx)
                cur_force_dir = force_dir_name
            else:
                u_fx = float(force_dx)
                u_fy = float(force_dy)
                f_d_sh = abs((sh_x - cur_hx) * u_fy - (sh_y - cur_hy) * u_fx)
                f_d_el = abs((el_x - cur_hx) * u_fy - (el_y - cur_hy) * u_fx)
                cur_force_dir = force_dir_name
            cur_force_dx = u_fx
            cur_force_dy = u_fy
            f_d_hip = 0.0
            f_d_knee = 0.0
        elif is_hip_thrust:
            cur_force_dx = force_dx
            cur_force_dy = force_dy
            cur_force_dir = force_dir_name
            f_d_knee = 0.0
            f_d_hip = 0.0
            f_d_sh = 0.0
            f_d_el = 0.0
        elif any(k in ex_lower for k in ["deadlift", "rdl", "rumano"]):
            cur_force_dx = 0.0
            cur_force_dy = 1.0
            cur_force_dir = "vertical_down"
            # Bug 2 Fix: En RDL y Deadlift, el vector de carga pasa verticalmente por la muñeca/mano (wr_x).
            # d_hip y d_knee son distancias ortogonales horizontales a esa recta vertical.
            f_d_knee = abs(kn_x - wr_x)
            f_d_hip = abs(hp_x - wr_x)
            f_d_sh = 0.0
            f_d_el = 0.0
        else:
            cur_force_dx = force_dx
            cur_force_dy = force_dy
            cur_force_dir = force_dir_name
            f_d_knee = abs(kn_x - hp_x)
            f_d_hip = abs(hp_x - ak_x)
            f_d_sh = 0.0
            f_d_el = 0.0
            
        phase = frame_phase_map[f]
        if is_scene_cut[f]:
            phase = "SCENE_CUT"
            
        f_3d = {
            "pelvis": {"x": round(float(hp_x), 3), "y": round(float(hp_y), 3), "z": 0.0},
            "hip": {"x": round(float(hp_x), 3), "y": round(float(hp_y), 3), "z": 0.0},
            "knee": {"x": round(float(kn_x), 3), "y": round(float(kn_y), 3), "z": 0.0},
            "ankle": {"x": round(float(ak_x), 3), "y": round(float(ak_y), 3), "z": 0.0},
            "shoulder": {"x": round(float(sh_x), 3), "y": round(float(sh_y), 3), "z": 0.0},
            "elbow": {"x": round(float(el_x), 3), "y": round(float(el_y), 3), "z": 0.0},
            "wrist": {"x": round(float(wr_x), 3), "y": round(float(wr_y), 3), "z": 0.0},
            "hand_grip": {"x": round(float(cur_hx), 3), "y": round(float(cur_hy), 3), "z": 0.0}
        }

        frames_output.append({
            "frame_idx": f,
            "time": timestamps[f],
            "rep_number": rep_num,
            "phase": phase,
            "hide_torso_line": bool(hide_torso_line),
            "is_upper_back": bool(is_upper_back_series),
            "is_unilateral": bool(is_unilateral_flag),
            "main_angle": round(float(clean_primary[f]), 1),
            "secondary_angle": round(float(clean_secondary[f]), 1),
            "neck_angle": round(float(clean_neck[f]), 1),
            "force_vector": {
                "origin": "wrist" if any(k in ex_lower for k in ["deadlift", "rdl", "rumano"]) else force_origin,
                "direction": cur_force_dir,
                "dx": round(float(cur_force_dx), 2),
                "dy": round(float(cur_force_dy), 2)
            },
            "keypoints_norm": {
                # Bilateral anatomical skeleton
                "left_shoulder": {"x": round(float(all_smoothed["left_shoulder"]["x"][f]), 4), "y": round(float(all_smoothed["left_shoulder"]["y"][f]), 4), "score": round(float(all_smoothed["left_shoulder"]["score"][f]), 2)},
                "right_shoulder": {"x": round(float(all_smoothed["right_shoulder"]["x"][f]), 4), "y": round(float(all_smoothed["right_shoulder"]["x"][f]), 4), "score": round(float(all_smoothed["right_shoulder"]["score"][f]), 2)},
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
                # Canonical primary tracked joints
                "shoulder": {"x": round(float(sh_x), 4), "y": round(float(sh_y), 4), "score": round(float(primary_joints["shoulder"]["score"][f]), 2)},
                "elbow": {"x": round(float(el_x), 4), "y": round(float(el_y), 4), "score": round(float(primary_joints["elbow"]["score"][f]), 2)},
                "wrist": {"x": round(float(wr_x), 4), "y": round(float(wr_y), 4), "score": round(float(primary_joints["wrist"]["score"][f]), 2)},
                "hand_grip": {"x": round(float(cur_hx), 4), "y": round(float(cur_hy), 4), "score": round(float(primary_joints["wrist"]["score"][f]), 2)},
                "hip": {"x": round(float(hp_x), 4), "y": round(float(hp_y), 4), "score": round(float(primary_joints["hip"]["score"][f]), 2)},
                "knee": {"x": round(float(kn_x), 4), "y": round(float(kn_y), 4), "score": round(float(primary_joints["knee"]["score"][f]), 2)},
                "ankle": {"x": round(float(ak_x), 4), "y": round(float(ak_y), 4), "score": round(float(primary_joints["ankle"]["score"][f]), 2)}
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

    if is_upper_body and len(frames_output) >= 5:
        all_d_sh = [frames_output[f]["moment_arms"]["d_shoulder"] for f in range(n_frames)]
        all_d_el = [frames_output[f]["moment_arms"]["d_elbow"] for f in range(n_frames)]
        filter_size = min(9, n_frames if n_frames % 2 == 1 else n_frames - 1)
        if filter_size >= 3:
            smooth_d_sh = scipy.ndimage.median_filter(all_d_sh, size=filter_size)
            smooth_d_el = scipy.ndimage.median_filter(all_d_el, size=filter_size)
            for f in range(n_frames):
                frames_output[f]["moment_arms"]["d_shoulder"] = round(float(smooth_d_sh[f]), 4)
                frames_output[f]["moment_arms"]["d_elbow"] = round(float(smooth_d_el[f]), 4)

    # Overall set summary
    total_reps = len(repetitions_summary)
    mean_rom = round(float(np.mean([r["rom_deg"] for r in repetitions_summary])), 1) if repetitions_summary else round(float(np.max(clean_primary) - np.min(clean_primary)), 1)
    mean_ecc = round(float(np.mean([r["eccentric_sec"] for r in repetitions_summary])), 2) if repetitions_summary else 0.0
    mean_pau = round(float(np.mean([r["pause_sec"] for r in repetitions_summary])), 2) if repetitions_summary else 0.0
    mean_con = round(float(np.mean([r["concentric_sec"] for r in repetitions_summary])), 2) if repetitions_summary else 0.0

    # ---------------------------------------------------------------------
    # Requirement 4: Effective Muscle Weights Calculation (Normalized to 1.0)
    # ---------------------------------------------------------------------
    effective_muscle_weights: Dict[str, float] = {}
    is_rdl_deadlift_ex = any(k in ex_lower for k in ["rdl", "deadlift", "rumano"])
    
    if is_rdl_deadlift_ex:
        if repetitions_summary:
            eval_bottom_knee = float(np.median([r["verdict"].get("min_bottom_knee_angle", r["verdict"].get("inflection_knee_deg", 135.0)) for r in repetitions_summary]))
        else:
            eval_bottom_knee = float(np.median(clean_kn))
            
        if eval_bottom_knee >= 145.0:
            effective_muscle_weights = {"hamstrings": 0.65, "glutes": 0.25, "erectors": 0.10}
        elif eval_bottom_knee >= 130.0:
            effective_muscle_weights = {"glutes": 0.45, "hamstrings": 0.45, "erectors": 0.10}
        else:  # High knee flexion (< 130°)
            effective_muscle_weights = {"glutes": 0.65, "hamstrings": 0.20, "quads": 0.10, "erectors": 0.05}
            
    elif is_hip_thrust:
        if 82.0 <= frozen_hip_thrust_knee <= 98.0:
            effective_muscle_weights = {"glutes": 0.80, "hamstrings": 0.10, "quads": 0.10}
        elif frozen_hip_thrust_knee > 98.0:
            effective_muscle_weights = {"glutes": 0.55, "hamstrings": 0.35, "quads": 0.10}
        else:
            effective_muscle_weights = {"glutes": 0.60, "quads": 0.30, "hamstrings": 0.10}
            
    elif any(k in ex_lower for k in ["squat", "leg_press", "hack", "bulgarian", "prensa", "sentadilla"]):
        d_kn_vals = [frames_output[f]["moment_arms"]["d_knee"] for f in range(n_frames)]
        d_hp_vals = [frames_output[f]["moment_arms"]["d_hip"] for f in range(n_frames)]
        d_kn_med = float(np.median(d_kn_vals)) if d_kn_vals else 0.15
        d_hp_med = float(np.median(d_hp_vals)) if d_hp_vals else 0.12
        knee_ratio = d_kn_med / (d_kn_med + d_hp_med + 1e-4)
        if knee_ratio >= 0.55:
            effective_muscle_weights = {"quads": 0.70, "glutes": 0.25, "hamstrings": 0.05}
        elif knee_ratio >= 0.45:
            effective_muscle_weights = {"quads": 0.55, "glutes": 0.38, "hamstrings": 0.07}
        else:
            effective_muscle_weights = {"glutes": 0.55, "quads": 0.40, "hamstrings": 0.05}
            
    elif is_pattern_a or any(k in ex_lower for k in ["row", "remo", "pull", "jalon", "t_bar"]):
        if is_upper_back_series:
            effective_muscle_weights = {"upper_back": 0.55, "rear_delts": 0.15, "biceps": 0.20, "lats": 0.10}
        else:
            effective_muscle_weights = {"lats": 0.60, "biceps": 0.22, "upper_back": 0.10, "rear_delts": 0.08}
            
    elif is_pattern_b or any(k in ex_lower for k in ["press", "bench", "banca", "dips", "fondos", "incline"]):
        d_sh_vals = [frames_output[f]["moment_arms"]["d_shoulder"] for f in range(n_frames)]
        d_el_vals = [frames_output[f]["moment_arms"]["d_elbow"] for f in range(n_frames)]
        d_sh_med = float(np.median(d_sh_vals)) if d_sh_vals else 0.18
        d_el_med = float(np.median(d_el_vals)) if d_el_vals else 0.08
        sh_ratio = d_sh_med / (d_sh_med + d_el_med + 1e-4)
        if sh_ratio >= 0.65:
            effective_muscle_weights = {"chest": 0.70, "triceps": 0.18, "front_delts": 0.12}
        elif sh_ratio >= 0.50:
            effective_muscle_weights = {"chest": 0.55, "triceps": 0.30, "front_delts": 0.15}
        else:
            effective_muscle_weights = {"triceps": 0.55, "chest": 0.32, "front_delts": 0.13}
            
    else:
        effective_muscle_weights = {"target": 1.0}

    # Normalize to ensure sum is strictly 1.0
    tot_weight = sum(effective_muscle_weights.values())
    if tot_weight > 0:
        effective_muscle_weights = {k: round(v / tot_weight, 3) for k, v in effective_muscle_weights.items()}

    return {
        "fps": 15.0,
        "duration": round(float(timestamps[-1] - timestamps[0]), 2) if timestamps else 0.0,
        "total_reps": total_reps,
        "locked_side": locked_side,
        "hide_torso_line": bool(hide_torso_line),
        "is_upper_back": bool(is_upper_back_series),
        "effective_muscle_weights": effective_muscle_weights,
        "mean_rom_deg": mean_rom,
        "mean_eccentric_time_s": mean_ecc,
        "mean_pause_time_s": mean_pau,
        "mean_concentric_time_s": mean_con,
        "intensity_metrics": intensity_metrics,
        "repetitions_summary": repetitions_summary,
        "frames": frames_output
    }

# ---------------------------------------------------------------------------
# 4. Helper & Cerebrium Endpoint Definition
# ---------------------------------------------------------------------------

def _extract_video_to_tempfile(
    video_base64: Optional[str] = None,
    video_url: Optional[str] = None,
    video: Optional[str] = None
) -> str:
    """Helper to extract incoming video payload (base64 data URI or HTTP URL) to a local tempfile."""
    target_data = video_base64 or video
    
    if target_data and not target_data.startswith("http://") and not target_data.startswith("https://"):
        if "," in target_data:
            target_data = target_data.split(",", 1)[1]
        
        video_bytes = base64.b64decode(target_data)
        tfile = tempfile.NamedTemporaryFile(suffix=".mp4", delete=False)
        tfile.write(video_bytes)
        tfile.flush()
        tfile.close()
        return tfile.name
        
    url = video_url or target_data
    if url and (url.startswith("http://") or url.startswith("https://")):
        resp = requests.get(url, timeout=30)
        resp.raise_for_status()
        tfile = tempfile.NamedTemporaryFile(suffix=".mp4", delete=False)
        tfile.write(resp.content)
        tfile.flush()
        tfile.close()
        return tfile.name
        
    raise ValueError("No valid video payload provided (expected base64 or video_url).")

def _decode_b64_image(b64_str: Any) -> Optional[np.ndarray]:
    if not b64_str or not isinstance(b64_str, str):
        return None
    raw_str = b64_str.strip()
    if "," in raw_str:
        raw_str = raw_str.split(",", 1)[1]
    try:
        raw_bytes = base64.b64decode(raw_str)
        pil_img = Image.open(io.BytesIO(raw_bytes)).convert("RGB")
        return np.array(pil_img)
    except Exception as e:
        print(f"[Anthropometry] Image decode failed: {e}")
        return None

def analyze_anthropometry(
    front_image_base64=None,
    side_image_base64=None,
    **kwargs
) -> dict:
    """
    Analyzes client anthropometric proportions from frontal and lateral calibration photos.
    Uses RT-DETR + ViTPose to extract 17 anatomical keypoints and calculates
    distance-invariant bone ratios:
    - femur_to_torso_ratio: ||hip - knee|| / ||shoulder - hip|| (Population Mean ~0.82)
    - tibia_to_femur_ratio: ||knee - ankle|| / ||hip - knee|| (Population Mean ~0.88)
    - arm_to_torso_ratio: (||shoulder - elbow|| + ||elbow - wrist||) / ||shoulder - hip|| (Population Mean ~1.12)
    - clavicle_to_pelvis_ratio: ||left_shoulder - right_shoulder|| / ||left_hip - right_hip|| (Population Mean ~1.35)
    Returns structural archetype classification and custom biomechanical thresholds.
    """
    if isinstance(front_image_base64, dict):
        payload = front_image_base64
        front_image_base64 = payload.get("front_image_base64")
        side_image_base64 = payload.get("side_image_base64")
    else:
        front_image_base64 = front_image_base64 or kwargs.get("front_image_base64")
        side_image_base64 = side_image_base64 or kwargs.get("side_image_base64")

    front_rgb = _decode_b64_image(front_image_base64)
    side_rgb = _decode_b64_image(side_image_base64)

    images_to_process = []
    tags = []
    if front_rgb is not None:
        images_to_process.append(front_rgb)
        tags.append("front")
    if side_rgb is not None:
        images_to_process.append(side_rgb)
        tags.append("side")

    if not images_to_process:
        raise ValueError("At least one valid image (front_image_base64 or side_image_base64) must be provided.")

    keypoints_per_tag = {}
    for img, tag in zip(images_to_process, tags):
        kps_list, _ = run_inference_batches([img], batch_size=1)
        if kps_list:
            keypoints_per_tag[tag] = kps_list[0]

    ref_side = keypoints_per_tag.get("side") or keypoints_per_tag.get("front")
    ref_front = keypoints_per_tag.get("front") or keypoints_per_tag.get("side")

    def pt(kps, name):
        p = kps.get(name, {"x": 0.5, "y": 0.5, "score": 0.0})
        return np.array([p["x"], p["y"]], dtype=np.float64)

    # 1. Torso length
    sh_side = 0.5 * (pt(ref_side, "left_shoulder") + pt(ref_side, "right_shoulder"))
    hp_side = 0.5 * (pt(ref_side, "left_hip") + pt(ref_side, "right_hip"))
    torso_len = max(0.10, float(np.linalg.norm(sh_side - hp_side)))

    # 2. Femur length
    l_femur = float(np.linalg.norm(pt(ref_side, "left_hip") - pt(ref_side, "left_knee")))
    r_femur = float(np.linalg.norm(pt(ref_side, "right_hip") - pt(ref_side, "right_knee")))
    femur_len = max(l_femur, r_femur) if (l_femur > 0.05 and r_femur > 0.05) else (l_femur or r_femur or 0.25)

    # 3. Tibia length
    l_tibia = float(np.linalg.norm(pt(ref_side, "left_knee") - pt(ref_side, "left_ankle")))
    r_tibia = float(np.linalg.norm(pt(ref_side, "right_knee") - pt(ref_side, "right_ankle")))
    tibia_len = max(l_tibia, r_tibia) if (l_tibia > 0.05 and r_tibia > 0.05) else (l_tibia or r_tibia or 0.22)

    # 4. Arm length
    l_arm = float(np.linalg.norm(pt(ref_side, "left_shoulder") - pt(ref_side, "left_elbow")) + np.linalg.norm(pt(ref_side, "left_elbow") - pt(ref_side, "left_wrist")))
    r_arm = float(np.linalg.norm(pt(ref_side, "right_shoulder") - pt(ref_side, "right_elbow")) + np.linalg.norm(pt(ref_side, "right_elbow") - pt(ref_side, "right_wrist")))
    arm_len = max(l_arm, r_arm) if (l_arm > 0.05 and r_arm > 0.05) else (l_arm or r_arm or 0.35)

    # 5. Clavicle vs Pelvis width
    clavicle_w = float(np.linalg.norm(pt(ref_front, "left_shoulder") - pt(ref_front, "right_shoulder")))
    pelvis_w = max(0.04, float(np.linalg.norm(pt(ref_front, "left_hip") - pt(ref_front, "right_hip"))))

    femur_to_torso = float(femur_len / torso_len)
    tibia_to_femur = float(tibia_len / max(0.05, femur_len))
    arm_to_torso = float(arm_len / torso_len)
    clavicle_to_pelvis = float(clavicle_w / pelvis_w)

    archetypes = []
    if femur_to_torso > 0.88:
        archetypes.append("Fémur Largo / Torso Corto")
    elif femur_to_torso < 0.76:
        archetypes.append("Fémur Corto / Torso Largo")

    if arm_to_torso > 1.18:
        archetypes.append("Envergadura Larga")
    elif arm_to_torso < 1.04:
        archetypes.append("Brazos Cortos")

    if clavicle_to_pelvis > 1.45:
        archetypes.append("Estructura en V")

    primary_archetype = " · ".join(archetypes) if archetypes else "Proporciones Equilibradas / Neutras"

    archetype_desc = []
    squat_torso_tol = 0.0
    press_elbow_depth = 0.0
    rdl_depth = 0.0

    if femur_to_torso > 0.88:
        squat_torso_tol += 10.0
        rdl_depth += 6.0
        archetype_desc.append("Palanca dominante de cadera: mayor inclinación de torso biomecánicamente óptima y segura en sentadilla/RDL.")
    elif femur_to_torso < 0.76:
        squat_torso_tol -= 5.0
        archetype_desc.append("Palanca ideal para sentadilla profunda vertical con mínimo momento flexor lumbar.")

    if arm_to_torso > 1.18:
        press_elbow_depth += 8.0
        archetype_desc.append("Mayor recorrido en ejercicios de empuje: se tolera mayor flexión de codo sin riesgo glenohumeral.")
    elif arm_to_torso < 1.04:
        archetype_desc.append("Palanca favorable de empuje con trayectoria compacta y óptima producción de fuerza.")

    custom_thresholds = {
        "squat_torso_tolerance_deg": squat_torso_tol,
        "press_elbow_depth_deg": press_elbow_depth,
        "rdl_hip_hinge_depth_deg": rdl_depth,
        "archetype": primary_archetype
    }

    return {
        "success": True,
        "ratios": {
            "femur_to_torso": round(femur_to_torso, 2),
            "tibia_to_femur": round(tibia_to_femur, 2),
            "arm_to_torso": round(arm_to_torso, 2),
            "clavicle_to_pelvis": round(clavicle_to_pelvis, 2)
        },
        "population_means": {
            "femur_to_torso": 0.82,
            "tibia_to_femur": 0.88,
            "arm_to_torso": 1.12,
            "clavicle_to_pelvis": 1.35
        },
        "archetype": primary_archetype,
        "archetype_description": " ".join(archetype_desc) if archetype_desc else "Proporciones anatómicas estándar con palancas equilibradas entre articulaciones.",
        "custom_thresholds": custom_thresholds
    }

def analyze(
    video_base64=None,
    video_url=None,
    video=None,
    exercise_type="hip_thrust",
    target_muscle="glutes",
    load_type="free_weight",
    start_time=0.0,
    end_time=None,
    weight_kg=None,
    target_reps=None,
    anthropometry=None,
    **kwargs
) -> dict:
    """
    Primary Cerebrium endpoint handler.
    Receives JSON payload with video (base64 or URL) and biomechanics configuration.
    Returns 2D smoothed clinical kinematics organized across 3 Universal Biomechanical Patterns up to 30s (450 frames).
    """
    if isinstance(video_base64, dict):
        payload = video_base64
        # Route to anthropometry if requested
        if payload.get("action") == "anthropometry" or (payload.get("front_image_base64") is not None and not payload.get("video_base64") and not payload.get("video_url") and not payload.get("video")):
            return analyze_anthropometry(
                front_image_base64=payload.get("front_image_base64"),
                side_image_base64=payload.get("side_image_base64")
            )
        video_base64 = payload.get("video_base64")
        video_url = payload.get("video_url")
        video = payload.get("video")
        exercise_type = payload.get("exercise_type", exercise_type or "hip_thrust")
        target_muscle = payload.get("target_muscle", target_muscle or "glutes")
        load_type = payload.get("load_type", load_type or "free_weight")
        start_time_val = payload.get("start_time", 0.0)
        end_time_val = payload.get("end_time", None)
        weight_kg = payload.get("weight_kg", payload.get("weightKg", weight_kg))
        target_reps = payload.get("target_reps", payload.get("targetReps", target_reps))
        anthropometry = payload.get("anthropometry", anthropometry)
    else:
        exercise_type = exercise_type or kwargs.get("exercise_type", "hip_thrust")
        target_muscle = target_muscle or kwargs.get("target_muscle", "glutes")
        load_type = load_type or kwargs.get("load_type", "free_weight")
        start_time_val = kwargs.get("start_time", start_time if start_time is not None else 0.0)
        end_time_val = kwargs.get("end_time", end_time)
        weight_kg = weight_kg or kwargs.get("weight_kg", kwargs.get("weightKg"))
        target_reps = target_reps or kwargs.get("target_reps", kwargs.get("targetReps"))
        anthropometry = anthropometry or kwargs.get("anthropometry")

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
        raw_keypoints, athlete_boxes = run_inference_batches(frames_rgb, batch_size=64)
        
        result = process_kinematics(
            raw_keypoints=raw_keypoints,
            timestamps=timestamps,
            exercise_type=exercise_type,
            target_muscle=target_muscle,
            load_type=load_type,
            athlete_boxes=athlete_boxes,
            img_w=w,
            img_h=h,
            weight_kg=weight_kg,
            target_reps=target_reps,
            anthropometry=anthropometry
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
