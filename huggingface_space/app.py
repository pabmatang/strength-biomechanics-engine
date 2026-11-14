"""
Clinical Biomechanics API - Hugging Face Spaces Entrypoint
Powered by RT-DETR (PekingU/rtdetr_r50vd_coco_o365) + ViTPose-Large (usyd-community/vitpose-plus-large) + SciPy Signal Processing
FastAPI REST endpoint POST /analyze mounted alongside Gradio Blocks interface.
"""

import os
import tempfile
import math
from typing import Dict, List, Any

import cv2
import numpy as np
import scipy.signal
import torch
from PIL import Image
from transformers import AutoImageProcessor, AutoModelForObjectDetection, VitPoseForPoseEstimation
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import gradio as gr
import uvicorn

# ---------------------------------------------------------------------------
# 1. Hardware Detection & Model Loading
# ---------------------------------------------------------------------------

device = "cuda" if torch.cuda.is_available() else "cpu"
torch_dtype = torch.float16 if device == "cuda" else torch.float32

print(f"[Startup] Initializing Biomechanics Pipeline on {device.upper()} ({torch_dtype})...")

DET_MODEL_NAME = "PekingU/rtdetr_r50vd_coco_o365"
POSE_MODEL_NAME = "usyd-community/vitpose-plus-large"

print(f"[Startup] Loading RT-DETR ({DET_MODEL_NAME})...")
det_processor = AutoImageProcessor.from_pretrained(DET_MODEL_NAME)
det_model = AutoModelForObjectDetection.from_pretrained(
    DET_MODEL_NAME,
    torch_dtype=torch_dtype
).to(device)
det_model.eval()

print(f"[Startup] Loading ViTPose-Large ({POSE_MODEL_NAME})...")
pose_processor = AutoImageProcessor.from_pretrained(POSE_MODEL_NAME)
pose_model = VitPoseForPoseEstimation.from_pretrained(
    POSE_MODEL_NAME,
    torch_dtype=torch_dtype
).to(device)
pose_model.eval()

print("[Startup] All models loaded and ready.")

COCO_KEYPOINTS = [
    "nose", "left_eye", "right_eye", "left_ear", "right_ear",
    "left_shoulder", "right_shoulder", "left_elbow", "right_elbow",
    "left_wrist", "right_wrist", "left_hip", "right_hip",
    "left_knee", "right_knee", "left_ankle", "right_ankle"
]

# ---------------------------------------------------------------------------
# 2. Kinematic & Biomechanical Helper Functions
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

def interpolate_series_1d(values: np.ndarray, scores: np.ndarray, min_score: float = 0.4) -> np.ndarray:
    """Linear interpolation over frames where score drops below confidence threshold."""
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

def apply_zero_phase_butterworth(series: np.ndarray, fs: float = 15.0, cutoff: float = 3.5) -> np.ndarray:
    """Zero-phase 2nd-order lowpass Butterworth filter via filtfilt."""
    n = len(series)
    if n <= 9:
        return series
    nyq = fs / 2.0
    normal_cutoff = min(cutoff / nyq, 0.99)
    b, a = scipy.signal.butter(2, normal_cutoff, btype="low", analog=False)
    filtered = scipy.signal.filtfilt(b, a, series)
    return np.clip(filtered, 0.0, 1.0)

def sample_video_frames(video_path: str, target_fps: float = 15.0, max_frames: int = 225):
    """Read video, sample at target_fps up to max_frames (15s at 15 FPS)."""
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise ValueError(f"Unable to open video: {video_path}")
    
    native_fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    total_native_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    duration = total_native_frames / native_fps if native_fps > 0 else 0.0
    
    frames_rgb = []
    timestamps = []
    
    step_dt = 1.0 / target_fps
    current_t = 0.0
    
    while len(frames_rgb) < max_frames:
        target_native_idx = int(round(current_t * native_fps))
        if target_native_idx >= total_native_frames:
            break
        
        cap.set(cv2.CAP_PROP_POS_FRAMES, target_native_idx)
        ret, frame = cap.read()
        if not ret or frame is None:
            break
        
        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        frames_rgb.append(frame_rgb)
        timestamps.append(round(current_t, 3))
        current_t += step_dt
        
    cap.release()
    return frames_rgb, timestamps, duration

def run_inference_batches(frames_rgb: List[np.ndarray], batch_size: int = 16):
    """Top-Down detection: RT-DETR athlete box + ViTPose-Large keypoints."""
    all_raw_keypoints = []
    
    for i in range(0, len(frames_rgb), batch_size):
        batch_np = frames_rgb[i : i + batch_size]
        batch_pil = [Image.fromarray(f) for f in batch_np]
        h, w = batch_np[0].shape[:2]
        
        # Step A: RT-DETR Athlete Box Detection
        det_inputs = det_processor(images=batch_pil, return_tensors="pt").to(device)
        with torch.no_grad():
            det_outputs = det_model(**det_inputs)
        
        target_sizes = torch.tensor([[h, w]] * len(batch_np)).to(device)
        det_results = det_processor.post_process_object_detection(
            det_outputs, target_sizes=target_sizes, threshold=0.25
        )
        
        batch_boxes = []
        for res in det_results:
            boxes = res["boxes"].detach().cpu().numpy()
            scores = res["scores"].detach().cpu().numpy()
            labels = res["labels"].detach().cpu().numpy()
            
            # Person class label is 0 in COCO
            person_indices = [idx for idx, lbl in enumerate(labels) if lbl == 0]
            if person_indices:
                best_idx = None
                best_metric = -1.0
                for p_idx in person_indices:
                    b = boxes[p_idx]
                    area = max(0.0, (b[2] - b[0])) * max(0.0, (b[3] - b[1]))
                    metric = scores[p_idx] * area
                    if metric > best_metric:
                        best_metric = metric
                        best_idx = p_idx
                batch_boxes.append([boxes[best_idx].tolist()])
            elif len(boxes) > 0:
                batch_boxes.append([[0.0, 0.0, float(w), float(h)]])
            else:
                batch_boxes.append([[0.0, 0.0, float(w), float(h)]])
        
        # Step B: ViTPose-Large 17 Keypoints
        pose_inputs = pose_processor(images=batch_pil, boxes=batch_boxes, return_tensors="pt").to(device)
        with torch.no_grad():
            pose_outputs = pose_model(**pose_inputs)
        
        pose_results = pose_processor.post_process_pose_estimation(pose_outputs, boxes=batch_boxes)
        
        for p_res in pose_results:
            kps = p_res[0]["keypoints"].detach().cpu().numpy()
            scs = p_res[0]["scores"].detach().cpu().numpy()
            
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
            
    return all_raw_keypoints

def process_kinematics(
    raw_keypoints: List[Dict[str, Dict[str, float]]],
    timestamps: List[float],
    exercise_type: str,
    target_muscle: str,
    load_type: str
):
    """Side-locking, linear interpolation, zero-phase Butterworth filter, rep audit & frozen verdicts."""
    n_frames = len(raw_keypoints)
    if n_frames == 0:
        return {"fps": 15.0, "duration": 0.0, "total_reps": 0, "repetitions_summary": [], "frames": []}
    
    # 1. Determine Locked Side (Profile Lock) using initial frames
    eval_window = min(15, n_frames)
    left_score_sum = 0.0
    right_score_sum = 0.0
    
    left_joints = ["left_shoulder", "left_elbow", "left_wrist", "left_hip", "left_knee", "left_ankle"]
    right_joints = ["right_shoulder", "right_elbow", "right_wrist", "right_hip", "right_knee", "right_ankle"]
    
    for f in range(eval_window):
        left_score_sum += sum(raw_keypoints[f][j]["score"] for j in left_joints)
        right_score_sum += sum(raw_keypoints[f][j]["score"] for j in right_joints)
        
    locked_side = "left" if left_score_sum >= right_score_sum else "right"
    prefix = "left_" if locked_side == "left" else "right_"
    
    tracked_keys = {
        "shoulder": prefix + "shoulder",
        "elbow": prefix + "elbow",
        "wrist": prefix + "wrist",
        "hip": prefix + "hip",
        "knee": prefix + "knee",
        "ankle": prefix + "ankle",
        "head": prefix + "ear" if (prefix + "ear") in raw_keypoints[0] else "nose"
    }
    
    # 2. Extract series & perform linear interpolation over occlusions (score < 0.4)
    smoothed_joints = {}
    for canonical, actual_key in tracked_keys.items():
        x_arr = np.array([raw_keypoints[f][actual_key]["x"] for f in range(n_frames)], dtype=np.float64)
        y_arr = np.array([raw_keypoints[f][actual_key]["y"] for f in range(n_frames)], dtype=np.float64)
        s_arr = np.array([raw_keypoints[f][actual_key]["score"] for f in range(n_frames)], dtype=np.float64)
        
        x_interp = interpolate_series_1d(x_arr, s_arr, min_score=0.4)
        y_interp = interpolate_series_1d(y_arr, s_arr, min_score=0.4)
        
        # 3. Apply Zero-Phase Butterworth Filter
        x_clean = apply_zero_phase_butterworth(x_interp, fs=15.0, cutoff=3.5)
        y_clean = apply_zero_phase_butterworth(y_interp, fs=15.0, cutoff=3.5)
        
        smoothed_joints[canonical] = {
            "x": x_clean,
            "y": y_clean,
            "score": s_arr
        }
        
    # 4. Compute Angular Kinematics per Frame
    primary_angles = []
    secondary_angles = []
    
    for f in range(n_frames):
        sh = {"x": smoothed_joints["shoulder"]["x"][f], "y": smoothed_joints["shoulder"]["y"][f]}
        el = {"x": smoothed_joints["elbow"]["x"][f], "y": smoothed_joints["elbow"]["y"][f]}
        wr = {"x": smoothed_joints["wrist"]["x"][f], "y": smoothed_joints["wrist"]["y"][f]}
        hp = {"x": smoothed_joints["hip"]["x"][f], "y": smoothed_joints["hip"]["y"][f]}
        kn = {"x": smoothed_joints["knee"]["x"][f], "y": smoothed_joints["knee"]["y"][f]}
        ak = {"x": smoothed_joints["ankle"]["x"][f], "y": smoothed_joints["ankle"]["y"][f]}
        
        knee_deg = calculate_angle_2d(hp, kn, ak)
        hip_deg = calculate_angle_2d(sh, hp, kn)
        elbow_deg = calculate_angle_2d(sh, el, wr)
        torso_deg = calculate_angle_2d({"x": hp["x"] + 0.1, "y": hp["y"]}, hp, sh)
        
        if exercise_type == "hip_thrust":
            p_angle = hip_deg
            s_angle = knee_deg
        elif exercise_type in ["squat", "bulgarian_squat"]:
            p_angle = knee_deg
            s_angle = hip_deg
        elif exercise_type == "rdl":
            p_angle = hip_deg
            s_angle = knee_deg
        elif exercise_type == "bench_press":
            p_angle = elbow_deg
            s_angle = hip_deg
        elif exercise_type == "row":
            p_angle = elbow_deg
            s_angle = torso_deg
        elif exercise_type == "cable_fly":
            p_angle = calculate_angle_2d(hp, sh, el)
            s_angle = elbow_deg
        else:
            p_angle = knee_deg
            s_angle = hip_deg
            
        primary_angles.append(p_angle)
        secondary_angles.append(s_angle)
        
    primary_angles = np.array(primary_angles)
    secondary_angles = np.array(secondary_angles)
    
    # 5. Repetition Segmentation with SciPy find_peaks
    repetitions_summary = []
    frame_rep_map = [0] * n_frames
    frame_phase_map = ["IDLE"] * n_frames
    
    if exercise_type == "hip_thrust":
        peaks, properties = scipy.signal.find_peaks(primary_angles, prominence=20, distance=12)
        if len(peaks) == 0:
            peaks, properties = scipy.signal.find_peaks(primary_angles, prominence=12, distance=10)
    else:
        inverted_curve = -primary_angles
        peaks, properties = scipy.signal.find_peaks(inverted_curve, prominence=22, distance=12)
        if len(peaks) == 0:
            peaks, properties = scipy.signal.find_peaks(inverted_curve, prominence=14, distance=10)
            
    for rep_idx, bottom_frame in enumerate(peaks, start=1):
        search_back = max(0, bottom_frame - 25)
        if exercise_type == "hip_thrust":
            start_frame = search_back + int(np.argmin(primary_angles[search_back:bottom_frame])) if bottom_frame > search_back else search_back
        else:
            start_frame = search_back + int(np.argmax(primary_angles[search_back:bottom_frame])) if bottom_frame > search_back else search_back
            
        search_fwd = min(n_frames, bottom_frame + 25)
        if exercise_type == "hip_thrust":
            end_frame = bottom_frame + int(np.argmin(primary_angles[bottom_frame:search_fwd])) if search_fwd > bottom_frame else bottom_frame
        else:
            end_frame = bottom_frame + int(np.argmax(primary_angles[bottom_frame:search_fwd])) if search_fwd > bottom_frame else bottom_frame
            
        if end_frame <= start_frame:
            end_frame = min(n_frames - 1, bottom_frame + 8)
            
        t_start = timestamps[start_frame]
        t_inflect = timestamps[bottom_frame]
        t_end = timestamps[end_frame]
        
        eccentric_sec = max(0.1, round(t_inflect - t_start, 2))
        concentric_sec = max(0.1, round(t_end - t_inflect, 2))
        pause_sec = max(0.0, round((t_end - t_start) - (eccentric_sec + concentric_sec), 2))
        
        # Repetition Clinical Biomechanical Verdict at Inflection Point
        inflect_knee = float(secondary_angles[bottom_frame] if exercise_type == "hip_thrust" else primary_angles[bottom_frame])
        inflect_hip = float(primary_angles[bottom_frame] if exercise_type == "hip_thrust" else secondary_angles[bottom_frame])
        
        # Moment arms at inflection
        wr_x = smoothed_joints["wrist"]["x"][bottom_frame]
        hp_x = smoothed_joints["hip"]["x"][bottom_frame]
        kn_x = smoothed_joints["knee"]["x"][bottom_frame]
        sh_x = smoothed_joints["shoulder"]["x"][bottom_frame]
        
        d_hip = abs(hp_x - wr_x)
        d_knee = abs(kn_x - wr_x)
        d_shoulder = abs(sh_x - wr_x)
        
        # Construct Frozen Verdict
        if exercise_type == "hip_thrust":
            knee_in_target = abs(inflect_knee - 90.0) <= 12.0
            hip_extended = inflect_hip >= 168.0
            status = "OPTIMAL" if (knee_in_target and hip_extended) else "IMPROVEMENT_OPPORTUNITY"
            dominant_joint = "CADERA"
            torque_bias = "GLÚTEO MAYOR" if knee_in_target else ("ISQUIOSURALES" if inflect_knee > 102 else "CUÁDRICEPS")
            if knee_in_target and hip_extended:
                recom = "Alineación articular perfecta a ~90° en rodilla. Brazo de momento sobre glúteo maximizado en lockout."
            elif not knee_in_target and inflect_knee < 78.0:
                recom = "Pies demasiado retrasados (<78°): incrementa torque en patela. Adelanta ligeramente la base."
            elif not knee_in_target and inflect_knee > 102.0:
                recom = "Pies demasiado adelantados (>102°): traslada tensión hacia isquios. Acerca los pies ~5 cm."
            else:
                recom = "Extensión de cadera incompleta. Busca bloqueo neutro activo sin hiperlordosis lumbar."
        elif exercise_type in ["squat", "bulgarian_squat"]:
            deep_enough = inflect_knee <= 95.0
            dominant_joint = "RODILLA" if d_knee >= d_hip else "CADERA"
            torque_bias = "CUÁDRICEPS" if dominant_joint == "RODILLA" else "CADERA / GLÚTEO"
            status = "OPTIMAL" if deep_enough else "IMPROVEMENT_OPPORTUNITY"
            recom = "Profundidad clínica alcanzada (rodilla ≤90°)." if deep_enough else "Profundidad parcial. Desciende hasta que fémur quede paralelo al suelo."
        elif exercise_type == "rdl":
            dominant_joint = "CADERA"
            torque_bias = "GLÚTEO / ISQUIOS"
            status = "OPTIMAL" if inflect_knee >= 140.0 else "IMPROVEMENT_OPPORTUNITY"
            recom = "Bisagra de cadera pura mantenida con rodilla semirrígida." if inflect_knee >= 140.0 else "Flexión excesiva de rodilla. Convierte el RDL en sentadilla; mantén tibia vertical."
        elif exercise_type == "row":
            dominant_joint = "DORSAL / HOMBRO"
            torque_bias = "DORSAL ANCHO" if abs(inflect_knee - 90) <= 15 else "BÍCEPS"
            status = "OPTIMAL"
            recom = "Tracción neutra a nivel de hombro/costillas con codo a 90° en máxima contracción."
        else:
            dominant_joint = "HOMBRO"
            torque_bias = "PECTORAL / TREN SUPERIOR"
            status = "OPTIMAL"
            recom = "Control de tempo cinemático estable."

        verdict = {
            "status": status,
            "dominant_joint": dominant_joint,
            "target_alignment": (status == "OPTIMAL"),
            "primary_torque_bias": torque_bias,
            "inflection_knee_deg": round(inflect_knee, 1),
            "inflection_hip_deg": round(inflect_hip, 1),
            "d_hip_norm": round(float(d_hip), 3),
            "d_knee_norm": round(float(d_knee), 3),
            "d_shoulder_norm": round(float(d_shoulder), 3),
            "recommendation": recom
        }
        
        rep_data = {
            "rep_number": rep_idx,
            "start_time": t_start,
            "inflection_time": t_inflect,
            "end_time": t_end,
            "eccentric_sec": eccentric_sec,
            "pause_sec": pause_sec,
            "concentric_sec": concentric_sec,
            "min_primary_angle": round(float(np.min(primary_angles[start_frame : end_frame + 1])), 1),
            "max_primary_angle": round(float(np.max(primary_angles[start_frame : end_frame + 1])), 1),
            "verdict": verdict
        }
        repetitions_summary.append(rep_data)
        
        # Map frames belonging to this rep
        for f in range(start_frame, end_frame + 1):
            frame_rep_map[f] = rep_idx
            if f < bottom_frame:
                frame_phase_map[f] = "ECCENTRIC"
            elif f == bottom_frame:
                frame_phase_map[f] = "BOTTOM" if exercise_type != "hip_thrust" else "LOCKOUT"
            else:
                frame_phase_map[f] = "CONCENTRIC"
                
    # 6. Build Per-Frame Output Array with Frozen Rep Verdict
    frames_output = []
    for f in range(n_frames):
        rep_num = frame_rep_map[f]
        rep_verdict = repetitions_summary[rep_num - 1]["verdict"] if (rep_num > 0 and rep_num <= len(repetitions_summary)) else {
            "status": "TRACKING",
            "dominant_joint": "NEUTRO",
            "target_alignment": True,
            "primary_torque_bias": "CALIBRANDO",
            "inflection_knee_deg": 90.0,
            "inflection_hip_deg": 180.0,
            "d_hip_norm": 0.0,
            "d_knee_norm": 0.0,
            "d_shoulder_norm": 0.0,
            "recommendation": "Mapeando cinemática articular..."
        }
        
        # Current orthogonal moment arms
        wr_x = smoothed_joints["wrist"]["x"][f]
        hp_x = smoothed_joints["hip"]["x"][f]
        kn_x = smoothed_joints["knee"]["x"][f]
        sh_x = smoothed_joints["shoulder"]["x"][f]
        
        frames_output.append({
            "frame_idx": f,
            "time": timestamps[f],
            "rep_number": rep_num,
            "phase": frame_phase_map[f],
            "main_angle": round(float(primary_angles[f]), 1),
            "secondary_angle": round(float(secondary_angles[f]), 1),
            "keypoints_norm": {
                "shoulder": {"x": round(float(sh_x), 4), "y": round(float(smoothed_joints["shoulder"]["y"][f]), 4), "score": round(float(smoothed_joints["shoulder"]["score"][f]), 2)},
                "elbow": {"x": round(float(smoothed_joints["elbow"]["x"][f]), 4), "y": round(float(smoothed_joints["elbow"]["y"][f]), 4), "score": round(float(smoothed_joints["elbow"]["score"][f]), 2)},
                "wrist": {"x": round(float(wr_x), 4), "y": round(float(smoothed_joints["wrist"]["y"][f]), 4), "score": round(float(smoothed_joints["wrist"]["score"][f]), 2)},
                "hip": {"x": round(float(hp_x), 4), "y": round(float(smoothed_joints["hip"]["y"][f]), 4), "score": round(float(smoothed_joints["hip"]["score"][f]), 2)},
                "knee": {"x": round(float(kn_x), 4), "y": round(float(smoothed_joints["knee"]["y"][f]), 4), "score": round(float(smoothed_joints["knee"]["score"][f]), 2)},
                "ankle": {"x": round(float(smoothed_joints["ankle"]["x"][f]), 4), "y": round(float(smoothed_joints["ankle"]["y"][f]), 4), "score": round(float(smoothed_joints["ankle"]["score"][f]), 2)},
                "head": {"x": round(float(smoothed_joints["head"]["x"][f]), 4), "y": round(float(smoothed_joints["head"]["y"][f]), 4), "score": round(float(smoothed_joints["head"]["score"][f]), 2)}
            },
            "moment_arms": {
                "d_hip": round(float(abs(hp_x - wr_x)), 4),
                "d_knee": round(float(abs(kn_x - wr_x)), 4),
                "d_shoulder": round(float(abs(sh_x - wr_x)), 4)
            },
            "verdict": rep_verdict
        })
        
    return {
        "fps": 15.0,
        "duration": timestamps[-1] if timestamps else 0.0,
        "total_reps": len(repetitions_summary),
        "locked_side": locked_side,
        "repetitions_summary": repetitions_summary,
        "frames": frames_output
    }

# ---------------------------------------------------------------------------
# 3. FastAPI App & Endpoint Definition
# ---------------------------------------------------------------------------

app = FastAPI(title="Biomechanics API Active", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/analyze")
async def analyze_video(
    video: UploadFile = File(...),
    exercise_type: str = Form("hip_thrust"),
    target_muscle: str = Form("glutes"),
    load_type: str = Form("free_weight"),
):
    """
    REST endpoint accepting multipart/form-data video and exercise params.
    Returns clean clinical biomechanics JSON.
    """
    if not video:
        raise HTTPException(status_code=400, detail="Missing required 'video' file in form-data.")
        
    suffix = os.path.splitext(video.filename or "video.mp4")[1] or ".mp4"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp_file:
        tmp_path = tmp_file.name
        content = await video.read()
        tmp_file.write(content)
        
    try:
        frames_rgb, timestamps, duration = sample_video_frames(tmp_path, target_fps=15.0, max_frames=225)
        if not frames_rgb:
            raise HTTPException(status_code=422, detail="Failed to decode video frames.")
            
        raw_keypoints = run_inference_batches(frames_rgb, batch_size=16)
        
        result = process_kinematics(
            raw_keypoints=raw_keypoints,
            timestamps=timestamps,
            exercise_type=exercise_type,
            target_muscle=target_muscle,
            load_type=load_type
        )
        
        return JSONResponse(content=result)
        
    finally:
        if os.path.exists(tmp_path):
            try:
                os.unlink(tmp_path)
            except OSError:
                pass

# ---------------------------------------------------------------------------
# 4. Gradio Interface Definition & Mounting
# ---------------------------------------------------------------------------

with gr.Blocks(title="Biomechanics API Active") as demo:
    gr.Markdown(
        f"""
        # 🏋️ Biomechanics Analysis API
        ### Status: **Active & Ready**
        
        This Hugging Face Space hosts the clinical biomechanics analysis engine.
        
        - **Hardware Device:** `{device.upper()}`
        - **Model Precision:** `{torch_dtype}`
        - **Athlete Detection:** `{DET_MODEL_NAME}`
        - **Pose Estimation:** `{POSE_MODEL_NAME}`
        - **Filtering & Signal:** `SciPy Butterworth (Zero-Phase)` + `find_peaks`
        
        ---
        
        ### 📡 REST API Endpoint
        `POST /analyze`
        
        #### Parameters (`multipart/form-data`):
        - `video`: Video File (MP4 / WebM / MOV)
        - `exercise_type`: `hip_thrust`, `squat`, `bulgarian_squat`, `rdl`, `bench_press`, `row`, `cable_fly`
        - `target_muscle`: `glutes`, `quads`, `hamstrings`, `chest`, `back`, etc.
        - `load_type`: `free_weight`, `cable`, `machine`
        
        #### Response Format:
        JSON with `{{"fps", "duration", "total_reps", "locked_side", "repetitions_summary", "frames"}}`.
        """
    )

app = gr.mount_gradio_app(app, demo, path="/")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=7860)
