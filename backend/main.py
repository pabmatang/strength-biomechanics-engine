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
import re
from typing import Dict, List, Any, Optional, Tuple
import json
import urllib.request
import urllib.error

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
POSE_MODEL_NAME = "usyd-community/vitpose-plus-large"
FALLBACK_POSE_MODEL_NAME = "usyd-community/vitpose-base-simple"

dtype = torch.float16 if device == "cuda" else torch.float32

print(f"[Cerebrium Startup] Loading RT-DETR ({DET_MODEL_NAME})...")
det_processor = AutoImageProcessor.from_pretrained(DET_MODEL_NAME)
det_model = AutoModelForObjectDetection.from_pretrained(
    DET_MODEL_NAME,
    torch_dtype=dtype
).to(device)
det_model.eval()

try:
    print(f"[Cerebrium Startup] Loading ViTPose-Plus-Large ({POSE_MODEL_NAME})...")
    pose_processor = AutoImageProcessor.from_pretrained(POSE_MODEL_NAME)
    pose_model = VitPoseForPoseEstimation.from_pretrained(
        POSE_MODEL_NAME,
        torch_dtype=dtype
    ).to(device)
    pose_model.eval()
    print("[Cerebrium Startup] ViTPose-Plus-Large loaded successfully.")
except Exception as e_large:
    print(f"[Cerebrium Startup] ViTPose-Plus-Large failed ({e_large}). Falling back to {FALLBACK_POSE_MODEL_NAME}...")
    pose_processor = AutoImageProcessor.from_pretrained(FALLBACK_POSE_MODEL_NAME)
    pose_model = VitPoseForPoseEstimation.from_pretrained(
        FALLBACK_POSE_MODEL_NAME,
        torch_dtype=dtype
    ).to(device)
    pose_model.eval()
    print("[Cerebrium Startup] ViTPose-Base-Simple loaded successfully as fallback.")

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

def apply_median_filter_1d(series: np.ndarray, size: int = 3) -> np.ndarray:
    """1D moving median filter for outlier rejection (e.g. window 3 before Butterworth)."""
    arr = np.asarray(series, dtype=np.float64)
    if len(arr) < size:
        return arr
    try:
        from scipy.ndimage import median_filter
        return median_filter(arr, size=size, mode='nearest')
    except Exception:
        out = arr.copy()
        pad = size // 2
        padded = np.pad(arr, (pad, pad), mode='edge')
        for i in range(len(arr)):
            out[i] = np.median(padded[i : i + size])
        return out

def interpolate_isolated_frames(vals: np.ndarray, scores: np.ndarray, thresh: float = 0.25) -> np.ndarray:
    """Linearly interpolate isolated frames where keypoint score < thresh using valid frames."""
    valid = scores >= thresh
    n = len(vals)
    if n == 0 or np.all(valid):
        return vals.copy()
    if np.count_nonzero(valid) < 2:
        return vals.copy()
    idx_all = np.arange(n)
    return np.clip(np.interp(idx_all, idx_all[valid], vals[valid]), 0.0, 1.0)

def encode_snapshot_jpeg_b64(img_rgb: np.ndarray, max_dim: int = 480, quality: int = 80) -> str:
    """Encode an RGB frame resized to max_dim on the longest edge as high-quality JPEG Base64."""
    try:
        h, w = img_rgb.shape[:2]
        scale = min(1.0, float(max_dim) / max(h, w))
        new_w, new_h = max(1, int(round(w * scale))), max(1, int(round(h * scale)))
        resized = cv2.resize(img_rgb, (new_w, new_h), interpolation=cv2.INTER_AREA)
        bgr = cv2.cvtColor(resized, cv2.COLOR_RGB2BGR)
        success, buf = cv2.imencode(".jpg", bgr, [int(cv2.IMWRITE_JPEG_QUALITY), quality])
        if success:
            return base64.b64encode(buf).decode("utf-8")
    except Exception as e:
        print(f"[Snapshot Encoder] Error encoding snapshot: {e}")
    return ""

def encode_keyframe_b64(img_rgb: np.ndarray, max_dim: int = 384, quality: int = 75) -> str:
    """Encode an RGB frame resized to max_dim on the longest edge as a compact JPEG Base64."""
    return encode_snapshot_jpeg_b64(img_rgb, max_dim=max_dim, quality=quality)

def normalize_vlm_point(raw_pt: Any) -> Optional[Tuple[float, float]]:
    """
    Normaliza un punto visual devuelto por Gemini.
    Soporta formato diccionario {'x': ..., 'y': ...}, lista/tupla [x, y], o Gemini spatial point {'point': [y, x]}.
    Normaliza automáticamente escala 0..1000 dividiendo por 1000.0 si el valor supera 1.5.
    """
    if raw_pt is None:
        return None
    x_val, y_val = None, None
    if isinstance(raw_pt, dict):
        if "x" in raw_pt and "y" in raw_pt:
            try:
                x_val, y_val = float(raw_pt["x"]), float(raw_pt["y"])
            except (ValueError, TypeError):
                return None
        elif "point" in raw_pt and isinstance(raw_pt["point"], (list, tuple)) and len(raw_pt["point"]) >= 2:
            try:
                y_val, x_val = float(raw_pt["point"][0]), float(raw_pt["point"][1])
            except (ValueError, TypeError):
                return None
        elif len(raw_pt) >= 2:
            try:
                vals = [float(v) for v in list(raw_pt.values())[:2]]
                x_val, y_val = vals[0], vals[1]
            except (ValueError, TypeError):
                return None
    elif isinstance(raw_pt, (list, tuple)) and len(raw_pt) >= 2:
        try:
            x_val, y_val = float(raw_pt[0]), float(raw_pt[1])
        except (ValueError, TypeError):
            return None

    if x_val is None or y_val is None:
        return None

    if abs(x_val) > 1.5:
        x_val /= 1000.0
    if abs(y_val) > 1.5:
        y_val /= 1000.0

    return (round(max(0.0, min(1.0, float(x_val))), 4), round(max(0.0, min(1.0, float(y_val))), 4))

def extract_anchor_dict(sub_dict: Any) -> Dict[str, Tuple[float, float]]:
    """
    Extrae puntos anatómicos normalizados con resolución de sinónimos:
    proximal (shoulder/hip), middle (elbow/knee), distal (wrist/hand/ankle).
    """
    res = {}
    if not isinstance(sub_dict, dict):
        return res
    for canonical, aliases in [
        ("proximal", ["proximal", "shoulder", "hip", "prox"]),
        ("middle", ["middle", "elbow", "knee", "mid"]),
        ("distal", ["distal", "wrist", "hand", "ankle", "dist"])
    ]:
        for k in aliases:
            if k in sub_dict and sub_dict[k] is not None:
                pt = normalize_vlm_point(sub_dict[k])
                if pt is not None:
                    res[canonical] = pt
                    break
    return res

def read_original_video_b64(video_path: str, max_bytes: int = 8 * 1024 * 1024) -> Optional[str]:
    """
    Lee los bytes originales del vídeo MP4 tal cual si pesan menos de 8 MB (sin re-codificar con OpenCV ni mp4v).
    """
    if not video_path or not os.path.exists(video_path):
        return None
    try:
        file_size = os.path.getsize(video_path)
        if file_size > max_bytes:
            print(f"[Gemini VLM] Vídeo original ({file_size / (1024*1024):.2f} MB) supera los 8 MB. Pasando a 6 keyframes JPEG.")
            return None
        with open(video_path, "rb") as vf:
            return base64.b64encode(vf.read()).decode("utf-8")
    except Exception as e:
        print(f"[Gemini VLM] Error al leer vídeo original: {e}")
        return None

def extract_6_keyframes_jpeg_b64(video_path: str) -> List[str]:
    """
    Extrae 6 fotogramas JPEG repartidos uniformemente a lo largo del vídeo (máx 480px, calidad 75).
    Sin códec de vídeo intermedio.
    """
    if not video_path or not os.path.exists(video_path):
        return []
    cap = cv2.VideoCapture(video_path)
    total_f = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    if total_f <= 0:
        cap.release()
        return []
    
    ratios = [0.08, 0.25, 0.42, 0.58, 0.75, 0.92]
    target_indices = [max(0, min(total_f - 1, int(total_f * r))) for r in ratios]
    
    keyframes_b64 = []
    for idx in target_indices:
        cap.set(cv2.CAP_PROP_POS_FRAMES, idx)
        ret, frame = cap.read()
        if ret and frame is not None:
            h, w = frame.shape[:2]
            max_dim = 480
            scale = min(1.0, float(max_dim) / max(h, w, 1))
            if scale < 1.0:
                frame = cv2.resize(frame, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_AREA)
            ret_enc, buf = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 75])
            if ret_enc:
                keyframes_b64.append(base64.b64encode(buf).decode('utf-8'))
    cap.release()
    return keyframes_b64

def parse_google_http_error(e: urllib.error.HTTPError) -> Tuple[int, str]:
    """Extrae código HTTP y mensaje descriptivo de la respuesta de Google AI Studio."""
    code = e.code
    try:
        raw_text = e.read().decode("utf-8", errors="ignore")
        data = json.loads(raw_text)
        err_msg = data.get("error", {}).get("message")
        if err_msg:
            return code, err_msg
        clean_snip = raw_text.replace("\n", " ").strip()[:180]
        return code, clean_snip
    except Exception:
        return code, str(getattr(e, "reason", "Unknown HTTP Error"))

_CACHED_FLASH_MODELS: Optional[List[str]] = None

def get_available_flash_models(api_key: str) -> List[str]:
    """
    Auto-descubrimiento dinámico de modelos Gemini Flash disponibles vía GET /v1beta/models.
    Cacheado en memoria global para no repetir la llamada en cada inferencia.
    """
    global _CACHED_FLASH_MODELS
    if _CACHED_FLASH_MODELS:
        return _CACHED_FLASH_MODELS

    default_fallback_models = ["gemini-2.5-flash", "gemini-3-flash-preview", "gemini-flash-latest", "gemini-2.0-flash"]
    if not api_key:
        return default_fallback_models

    try:
        url = "https://generativelanguage.googleapis.com/v1beta/models"
        req = urllib.request.Request(
            url,
            headers={
                "Content-Type": "application/json",
                "x-goog-api-key": api_key
            },
            method="GET"
        )
        with urllib.request.urlopen(req, timeout=8.0) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            models_list = data.get("models", [])
            valid_models = []
            for m in models_list:
                name = m.get("name", "")
                clean_name = name.replace("models/", "").strip()
                methods = m.get("supportedGenerationMethods", [])
                
                # Criterios: generateContent soportado, contiene 'flash' y sin variantes no aptas/retiradas
                if "generateContent" in methods and "flash" in clean_name.lower():
                    lower_name = clean_name.lower()
                    if any(bad in lower_name for bad in ["tts", "audio", "image", "thinking-exp", "-exp", "lite"]):
                        continue
                    valid_models.append(clean_name)

            priority_order = ["gemini-2.5-flash", "gemini-3-flash-preview", "gemini-flash-latest", "gemini-2.0-flash"]
            sorted_models = []
            for p in priority_order:
                if p in valid_models:
                    sorted_models.append(p)
            for v in valid_models:
                if v not in sorted_models:
                    sorted_models.append(v)

            if sorted_models:
                print(f"[Gemini VLM Auto-Discovery] Modelos Flash vigentes activos en API: {sorted_models}")
                _CACHED_FLASH_MODELS = sorted_models
                return _CACHED_FLASH_MODELS
    except Exception as e:
        print(f"[Gemini VLM Auto-Discovery] Advertencia: ListModels no respondió ({e}). Usando lista por defecto.")

    _CACHED_FLASH_MODELS = default_fallback_models
    return _CACHED_FLASH_MODELS

def clean_gemini_json_response(raw_text: str) -> Optional[Dict[str, Any]]:
    """Limpia markdown y formatea respuesta JSON de Gemini."""
    if not raw_text:
        return None
    text_clean = raw_text.strip()
    if text_clean.startswith("```"):
        text_clean = re.sub(r"^```(?:json)?\s*", "", text_clean)
        text_clean = re.sub(r"\s*```$", "", text_clean)
    text_clean = text_clean.strip()
    try:
        return json.loads(text_clean)
    except Exception:
        match = re.search(r"(\{.*\})", text_clean, re.DOTALL)
        if match:
            try:
                return json.loads(match.group(1))
            except Exception:
                pass
    return None

def compute_valid_frame_bounds(
    primary_joints: Dict[str, Dict[str, np.ndarray]],
    timestamps: List[float],
    min_vis: float = 0.65,
    max_cam_jump: float = 0.08
) -> Tuple[int, int]:
    """
    Trims leading and trailing frames where key landmark visibility (shoulder, elbow,
    wrist, hip) is < min_vis or where global camera motion exceeds max_cam_jump.
    Returns (valid_start_idx, valid_end_idx) inclusive.
    """
    n = len(timestamps)
    if n < 5:
        return 0, max(0, n - 1)

    key_names = [k for k in ("shoulder", "elbow", "wrist", "hip") if k in primary_joints]
    vis_scores = np.ones(n, dtype=np.float64)
    if key_names:
        stacked = np.vstack([
            np.asarray(primary_joints[k].get("score", np.ones(n)), dtype=np.float64)
            for k in key_names
        ])
        vis_scores = np.mean(stacked, axis=0)

    # Detect sudden global camera jumps via frame-to-frame shift of torso anchor (shoulder + hip)
    cam_stable = np.ones(n, dtype=bool)
    anchor_keys = [k for k in ("shoulder", "hip") if k in primary_joints]
    if anchor_keys:
        ax = np.mean(np.vstack([np.asarray(primary_joints[k]["x"], dtype=np.float64) for k in anchor_keys]), axis=0)
        ay = np.mean(np.vstack([np.asarray(primary_joints[k]["y"], dtype=np.float64) for k in anchor_keys]), axis=0)
        dx = np.abs(np.diff(ax, prepend=ax[0]))
        dy = np.abs(np.diff(ay, prepend=ay[0]))
        cam_stable = np.hypot(dx, dy) <= max_cam_jump

    valid_mask = (vis_scores >= min_vis) & cam_stable

    # Find longest contiguous valid segment (allowing tiny 2-frame single-frame glitches)
    best_start, best_end = 0, n - 1
    best_len = 0
    cur_start = None
    glitch_count = 0
    for idx in range(n):
        if valid_mask[idx]:
            if cur_start is None:
                cur_start = idx
            glitch_count = 0
            if (idx - cur_start + 1) > best_len:
                best_len = idx - cur_start + 1
                best_start, best_end = cur_start, idx
        else:
            if cur_start is not None:
                glitch_count += 1
                if glitch_count > 2:
                    cur_start = None
                    glitch_count = 0

    if best_len >= max(5, int(n * 0.20)):
        return int(best_start), int(best_end)
    return 0, n - 1


def extract_push_snapshot_frames(
    clean_el: np.ndarray,
    sf: int,
    ef: int,
    n_frames: int
) -> Tuple[int, int]:
    """
    For push exercises (incline_press, chest_press_machine, bench_press, shoulder_press_machine),
    extracts Bottom (Estiramiento) at minimum elbow angle and Lockout (Bloqueo) at maximum elbow angle.
    """
    sf_c = max(0, min(n_frames - 1, int(sf)))
    ef_c = max(sf_c, min(n_frames - 1, int(ef)))
    f_stretch = sf_c + int(np.argmin(clean_el[sf_c : ef_c + 1]))
    f_peak = f_stretch + int(np.argmax(clean_el[f_stretch : ef_c + 1]))
    if float(clean_el[f_peak]) < float(clean_el[f_stretch]) + 20.0 and f_stretch > sf_c:
        f_peak_pre = sf_c + int(np.argmax(clean_el[sf_c : f_stretch + 1]))
        if float(clean_el[f_peak_pre]) > float(clean_el[f_peak]):
            f_peak = f_peak_pre
    return f_stretch, f_peak


def compute_vbt_and_rom_metrics(
    repetitions_summary: List[Dict[str, Any]],
    weight_kg: Optional[float] = None
) -> Tuple[Dict[str, Any], Optional[Dict[str, Any]], Optional[float]]:
    """
    Computes VBT velocity loss, RIR/RPE, and ROM comparison strictly from the
    final validated repetitions list so total_reps == len(rep_velocities).
    Uses median ROM of valid reps as reference to prevent prep/racking artifacts.
    """
    total_reps = len(repetitions_summary)
    if total_reps == 0:
        exact_rir, exact_rpe, rir_str, status_text, vbt_proximity, vbt_verdict = calculate_vbt_rir_rpe(0.0)
        return {
            "estimated_rir": rir_str,
            "estimated_rpe": exact_rpe,
            "exact_rir": exact_rir,
            "exact_rpe": exact_rpe,
            "delta_v_rep": 0.0,
            "estimated_1rm_kg": None,
            "velocity_loss_pct": 0.0,
            "first_rep_vel": 0.0,
            "v_best": 0.0,
            "last_rep_vel": 0.0,
            "max_rep_vel": 0.0,
            "rep_velocities": [],
            "status_text": "Serie sin reps",
            "failure_proximity": vbt_proximity,
            "coach_verdict": vbt_verdict
        }, None, None

    median_rom_px = max(1e-4, float(np.median([float(r.get("rom_px", 1.0)) for r in repetitions_summary])))
    for r in repetitions_summary:
        r["rom_pct_of_rep1"] = round(100.0 * (float(r.get("rom_px", 0.0)) / median_rom_px), 1)

    rep_vels = [float(r.get("mean_concentric_vel", 0.0)) for r in repetitions_summary]
    N = len(rep_vels)

    if N >= 2:
        vel_rep1 = float(rep_vels[0])
        vel_rep2 = float(rep_vels[1])
        # Baseline: max(R1, R2) unless R1 is an outlier > 35% above R2
        if vel_rep2 > 1e-4 and vel_rep1 > 1.35 * vel_rep2:
            v_initial_best = vel_rep2
        else:
            v_initial_best = float(max(vel_rep1, vel_rep2))

        v_last = float(rep_vels[-1])
        first_rep_vel = float(rep_vels[0])
        max_rep_vel = float(max(rep_vels))

        r1 = repetitions_summary[0]
        r_last_rep = repetitions_summary[-1]
        r1_conc = float(r1.get("concentric_sec", 1.0))
        last_conc = float(r_last_rep.get("concentric_sec", 1.0))

        if v_initial_best > 1e-4:
            raw_vel_loss = float(max(0.0, ((v_initial_best - v_last) / v_initial_best) * 100.0))
        else:
            raw_vel_loss = 0.0

        # Guard 1: only clamp if final concentric is genuinely fast/stable (< 1.8s and <= 1.15 * r1_conc)
        if last_conc < 1.8 and last_conc <= r1_conc * 1.15:
            vel_loss = round(min(raw_vel_loss, 10.0), 1)
        else:
            vel_loss = round(raw_vel_loss, 1)

        has_sustained_decel = False
        if N >= 3 and v_initial_best > 1e-4:
            decel_flags = [bool((v_initial_best - v) / v_initial_best > 0.35) for v in rep_vels[1:]]
            for k in range(len(decel_flags) - 1):
                if decel_flags[k] and decel_flags[k + 1]:
                    has_sustained_decel = True
                    break

        if last_conc < 1.2 and not has_sustained_decel:
            vel_loss = min(vel_loss, 28.0)

        # Heavy effort guard: if final concentric >= 2.2s and raw velocity loss >= 25%, ensure high-effort RIR (0-2)
        if last_conc >= 2.2 and raw_vel_loss >= 25.0:
            vel_loss = round(max(vel_loss, raw_vel_loss), 1)

        exact_rir, exact_rpe, rir_str, status_text, vbt_proximity, vbt_verdict = calculate_vbt_rir_rpe(vel_loss)

        if last_conc < 1.2 and not has_sustained_decel and exact_rir < 2.0:
            exact_rir = 2.0
            exact_rpe = 8.0
            rir_str = "RIR 2"
            status_text = "Zona óptima de hipertrofia"
            vbt_proximity = "effective_growth"
            vbt_verdict = "Velocidad conservada (tempo rápido < 1.2s). Estimación ajustada a RIR 2."
        elif last_conc >= 2.2 and raw_vel_loss >= 25.0 and exact_rir > 2.0:
            exact_rir = 2.0
            exact_rpe = 8.0
            rir_str = "RIR 2"
            status_text = "Zona óptima de hipertrofia"
            vbt_proximity = "effective_growth"

        estimated_1rm_kg = None
        if weight_kg is not None:
            try:
                w_val = float(weight_kg)
                if w_val > 0:
                    estimated_1rm_kg = round(w_val * (1.0 + (N + exact_rir) / 30.0), 1)
            except (ValueError, TypeError):
                estimated_1rm_kg = None

        if vel_loss < 15.0:
            for r in repetitions_summary:
                r["sticking_point_sec"] = None

        intensity_metrics = {
            "estimated_rir": rir_str,
            "estimated_rpe": exact_rpe,
            "exact_rir": exact_rir,
            "exact_rpe": exact_rpe,
            "delta_v_rep": round(float(max(1.0, (v_initial_best - v_last) / max(1, N - 1))), 1),
            "estimated_1rm_kg": estimated_1rm_kg,
            "velocity_loss_pct": vel_loss,
            "first_rep_vel": round(first_rep_vel, 1),
            "v_best": round(v_initial_best, 1),
            "last_rep_vel": round(v_last, 1),
            "max_rep_vel": round(max_rep_vel, 1),
            "rep_velocities": rep_vels,
            "status_text": status_text,
            "failure_proximity": vbt_proximity,
            "coach_verdict": vbt_verdict
        }
    else:
        v_last = float(rep_vels[0])
        exact_rir, exact_rpe, rir_str, status_text, vbt_proximity, vbt_verdict = calculate_vbt_rir_rpe(0.0)
        estimated_1rm_kg = None
        intensity_metrics = {
            "estimated_rir": rir_str,
            "estimated_rpe": exact_rpe,
            "exact_rir": exact_rir,
            "exact_rpe": exact_rpe,
            "delta_v_rep": 0.0,
            "estimated_1rm_kg": None,
            "velocity_loss_pct": 0.0,
            "first_rep_vel": round(v_last, 1),
            "v_best": round(v_last, 1),
            "last_rep_vel": round(v_last, 1),
            "max_rep_vel": round(v_last, 1),
            "rep_velocities": [v_last] if v_last > 0 else [],
            "status_text": "Serie de 1 rep",
            "failure_proximity": vbt_proximity,
            "coach_verdict": "Serie única completada. Registra ≥ 2 repeticiones para calcular la curva diferencial de fatiga."
        }

    r1 = repetitions_summary[0]
    r_last = repetitions_summary[-1]
    last_rom = float(r_last.get("rom_px", 0.0))
    last_vel = float(r_last.get("mean_concentric_vel", 0.0))
    r1_vel = max(1e-4, float(r1.get("mean_concentric_vel", 1.0)))
    rep_comparison = {
        "rep1": {
            "rep_index": 1,
            "path_points": r1.get("path_points", []),
            "rom_px": r1.get("rom_px", 0.0),
            "mean_vel": r1.get("mean_concentric_vel", 0.0),
            "duration_sec": r1.get("duration_sec", 0.0)
        },
        "last_rep": {
            "rep_index": total_reps,
            "path_points": r_last.get("path_points", []),
            "rom_px": r_last.get("rom_px", 0.0),
            "mean_vel": r_last.get("mean_concentric_vel", 0.0),
            "duration_sec": r_last.get("duration_sec", 0.0)
        },
        "rom_loss_pct": round(max(0.0, 100.0 - (last_rom / median_rom_px) * 100.0), 1),
        "velocity_loss_pct": round(float(intensity_metrics.get("velocity_loss_pct", max(0.0, 100.0 - (last_vel / r1_vel) * 100.0))), 1)
    }

    return intensity_metrics, rep_comparison, estimated_1rm_kg


def calculate_vbt_rir_rpe(vel_loss_pct: float) -> Tuple[float, float, str, str, str, str]:
    """
    Calcula RIR, RPE, rir_str, status_text, proximity y coach_verdict
    estrictamente a partir del porcentaje relativo de pérdida de velocidad concéntrica (vel_loss_pct).
    Reglas obligatorias:
      - vel_loss_pct < 10% -> RIR 4+, RPE 6.0 ("Serie de aproximación / lejos del fallo", "submaximal")
      - 10% <= vel_loss_pct < 20% -> RIR 3, RPE 7.0 ("Estímulo moderado", "effective_growth")
      - 20% <= vel_loss_pct < 30% -> RIR 2, RPE 8.0 ("Zona óptima de hipertrofia", "effective_growth")
      - 30% <= vel_loss_pct < 42% -> RIR 1, RPE 9.0 ("Alta proximidad al fallo", "effective_growth")
      - vel_loss_pct >= 42% -> RIR 0, RPE 10.0 ("Fallo concéntrico / esfuerzo máximo", "absolute_failure")
    """
    loss = float(max(0.0, vel_loss_pct))
    rir = 2.0
    rpe = 8.0
    rir_str = "RIR 2"
    status_txt = "Zona óptima de hipertrofia"
    proximity = "effective_growth"
    verdict = ""
    if loss < 10.0:
        rir = 4.0
        rpe = 6.0
        rir_str = "RIR 4+"
        status_txt = "Serie de aproximación / lejos del fallo"
        proximity = "submaximal"
        verdict = f"Pérdida de velocidad baja ({loss:.1f}%). Serie de aproximación o técnica lejos del fallo muscular (RIR 4+ / RPE 6.0)."
    elif loss < 20.0:
        rir = 3.0
        rpe = 7.0
        rir_str = "RIR 3"
        status_txt = "Estímulo moderado"
        proximity = "effective_growth"
        verdict = f"Pérdida de velocidad moderada ({loss:.1f}%). Estímulo moderado con buena velocidad residual (RIR 3 / RPE 7.0)."
    elif loss < 30.0:
        rir = 2.0
        rpe = 8.0
        rir_str = "RIR 2"
        status_txt = "Zona óptima de hipertrofia"
        proximity = "effective_growth"
        verdict = f"Pérdida de velocidad óptima ({loss:.1f}%). Ventana ideal de hipertrofia y tensión mecánica (RIR 2 / RPE 8.0)."
    elif loss < 42.0:
        rir = 1.0
        rpe = 9.0
        rir_str = "RIR 1"
        status_txt = "Alta proximidad al fallo"
        proximity = "effective_growth"
        verdict = f"Pérdida de velocidad elevada ({loss:.1f}%). Alta proximidad al fallo muscular con reclutamiento motor completo (RIR 1 / RPE 9.0)."
    else:
        rir = 0.0
        rpe = 10.0
        rir_str = "RIR 0"
        status_txt = "Fallo concéntrico / esfuerzo máximo"
        proximity = "absolute_failure"
        verdict = f"Pérdida de velocidad terminal ({loss:.1f}%). Fallo concéntrico o esfuerzo terminal alcanzado (RIR 0 / RPE 10.0)."

    return rir, rpe, rir_str, status_txt, proximity, verdict

def extract_4_keyframes_jpeg_b64(video_path: str) -> List[str]:
    """Extrae 4 keyframes clave en JPEG Base64 (máx 480px, calidad 80)."""
    if not video_path or not os.path.exists(video_path):
        return []
    cap = cv2.VideoCapture(video_path)
    total_f = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    if total_f <= 0:
        cap.release()
        return []
    target_indices = [
        max(0, int(total_f * 0.10)),
        max(0, min(total_f - 1, int(total_f * 0.40))),
        max(0, min(total_f - 1, int(total_f * 0.65))),
        max(0, min(total_f - 1, int(total_f * 0.90)))
    ]
    keyframes_b64 = []
    for idx in target_indices:
        cap.set(cv2.CAP_PROP_POS_FRAMES, idx)
        ret, frame = cap.read()
        if ret and frame is not None:
            h, w = frame.shape[:2]
            max_dim = 480
            scale = min(1.0, max_dim / max(h, w))
            if scale < 1.0:
                frame = cv2.resize(frame, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_AREA)
            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            _, buf = cv2.imencode('.jpg', rgb, [cv2.IMWRITE_JPEG_QUALITY, 80])
            keyframes_b64.append(base64.b64encode(buf).decode('utf-8'))
    cap.release()
    return keyframes_b64

def generate_deterministic_clinical_audit(
    exercise_type: str,
    body_region: str,
    total_reps: int,
    intensity_metrics: Dict[str, Any],
    repetitions_summary: List[Dict[str, Any]],
    rep_comparison: Optional[Dict[str, Any]] = None,
    exercise_name: Optional[str] = None
) -> Dict[str, Any]:
    """
    Generador determinista de auditoría clínica biomecánica comercial.
    Garantiza que el frontend disponga de la Suite de 4 Vistas completa
    incluso si Gemini no está disponible o no hay API key.
    """
    is_upper = (body_region == "upper")
    ex_lower = exercise_type.lower()
    
    if "machine" in ex_lower or "maquina" in ex_lower or "press_machine" in ex_lower:
        equipment = "machine"
    elif "cable" in ex_lower or "polea" in ex_lower or "gironda" in ex_lower or "pulldown" in ex_lower:
        equipment = "cable"
    elif "squat" in ex_lower or "deadlift" in ex_lower or "rdl" in ex_lower or "bench" in ex_lower:
        equipment = "free_weight"
    else:
        equipment = "machine" if is_upper else "free_weight"
        
    names_map = {
        "chest_press_machine": "Press de Pecho en Máquina Convergente",
        "bench_press": "Press de Banca Plano",
        "incline_press": "Press Inclinado con Mancuernas/Barra",
        "machine_dips": "Fondos en Máquina Asistida",
        "t_bar_row": "Remo en T con Apoyo de Pecho",
        "seated_row": "Remo Sentado en Polea Gironda",
        "lat_pulldown": "Jalón al Pecho en Polea",
        "hip_thrust": "Hip Thrust en Máquina / Banco",
        "rdl": "Peso Muerto Rumano",
        "rdl_unilateral": "Peso Muerto Rumano Unilateral / B-Stance (Glúteo)",
        "bulgarian_split_squat": "Sentadilla Búlgara / Zancada B-Stance",
        "squat": "Sentadilla Libre / Multipower",
        "leg_press": "Prensa de Piernas Inclinada"
    }
    formal_name = exercise_name or names_map.get(exercise_type, exercise_type.replace("_", " ").title())
    
    cues = []
    if len(repetitions_summary) > 0:
        r1 = repetitions_summary[0]
        cues.append({
            "rep_index": 1,
            "timestamp_sec": round(float(r1.get("inflection_time", r1.get("start_time", 1.0))), 2),
            "type": "positive",
            "badge": "Control Óptimo",
            "message": "Inflexión controlada y máxima profundidad alcanzada sin inercias.",
            "technical_fix": "Mantén esa misma cadencia de frenado en todas las repeticiones.",
            "affected_joint": "shoulder" if is_upper else "hip"
        })
        
        for r in repetitions_summary[1:]:
            idx = r.get("rep_number", r.get("rep_index", 2))
            st_sec = r.get("sticking_point_sec")
            if st_sec is not None:
                cues.append({
                    "rep_index": idx,
                    "timestamp_sec": round(float(st_sec), 2),
                    "type": "warning",
                    "badge": "Sticking Point",
                    "message": f"Desaceleración concéntrica notable en Repetición {idx}.",
                    "technical_fix": "Aplica máxima intención acelerativa atravesando el punto de fricción.",
                    "affected_joint": "elbow" if is_upper else "knee"
                })
        
        r_last = repetitions_summary[-1]
        v_loss_tmp = float(intensity_metrics.get("velocity_loss_pct", intensity_metrics.get("delta_v_rep", 0.0)))
        rir_tmp, _, _, _, _, _ = calculate_vbt_rir_rpe(v_loss_tmp)
        if total_reps >= 4 and rir_tmp < 3.0:
            cues.append({
                "rep_index": total_reps,
                "timestamp_sec": round(float(r_last.get("inflection_time", r_last.get("end_time", 5.0))), 2),
                "type": "warning",
                "badge": "Pérdida de ROM" if (rep_comparison and rep_comparison.get("rom_loss_pct", 0) > 12.0) else "Esfuerzo Terminal",
                "message": f"Repetición terminal {total_reps}. Mayor tiempo bajo tensión bajo fatiga metabólica.",
                "technical_fix": "No sacrifiques la posición escapular ni la neutralidad lumbar al fatigarte.",
                "affected_joint": "elbow" if is_upper else "lumbar"
            })
        else:
            cues.append({
                "rep_index": total_reps,
                "timestamp_sec": round(float(r_last.get("end_time", 5.0)), 2),
                "type": "positive",
                "badge": "Serie Completada",
                "message": f"Serie de {total_reps} reps completada con cadencia controlada y estabilidad articular.",
                "technical_fix": "Conserva la aceleración concéntrica continua en las próximas series.",
                "affected_joint": "elbow" if is_upper else "knee"
            })
    else:
        cues.append({
            "rep_index": 1,
            "timestamp_sec": 1.5,
            "type": "positive",
            "badge": "Posición Inicial",
            "message": "Set analizado. Ejecución estable.",
            "technical_fix": "Mantén control continuo de la trayectoria.",
            "affected_joint": "shoulder" if is_upper else "hip"
        })
    cues.sort(key=lambda x: x["timestamp_sec"])
    
    is_free_inclined_row = any(k in ex_lower for k in ["t_bar", "remo_punta", "barra_t", "barbell_row", "dumbbell_row", "remo_barra", "remo_mancuerna"]) or (("row" in ex_lower or "remo" in ex_lower) and not any(k in ex_lower for k in ["chest_supported", "apoyo", "pecho", "machine_row", "seated_row"]))
    
    if is_free_inclined_row:
        checks = [
            {
                "joint": "Columna Lumbar",
                "status": "pass",
                "observation": "Bisagra de cadera estable y columna neutra sin redondeo lumbar ni balanceo excesivo del torso.",
                "fix": "Mantén la rigidez abdominal (bracing) y evita utilizar impulso de cadera en la tracción."
            },
            {
                "joint": "Hombro / Escápula",
                "status": "pass",
                "observation": "Protracción controlada en estiramiento y retracción escapular limpia al final de la tracción.",
                "fix": "Permite que las escápulas abran abajo pero no encorves la columna dorsal."
            },
            {
                "joint": "Codo",
                "status": "pass",
                "observation": "Trayectoria del codo dirigida hacia la cadera/costillas sin elevación compensatoria del trapecio.",
                "fix": "Conduce el movimiento desde los codos manteniendo los hombros lejos de las orejas."
            },
            {
                "joint": "Muñeca",
                "status": "pass",
                "observation": "Muñeca neutra alineada con el antebrazo.",
                "fix": "Mantén un agarre firme en gancho sin flexionar la muñeca hacia dentro."
            }
        ]
    elif is_upper:
        checks = [
            {
                "joint": "Hombro",
                "status": "pass",
                "observation": "Cíngulo escapular estable contra el respaldo/apoyo sin anteriorización excesiva.",
                "fix": "Conserva la depresión escapular continua durante todo el rango."
            },
            {
                "joint": "Codo",
                "status": "pass",
                "observation": "Ángulo braquio-torácico en plano escapular (~45-55°), reduciendo cizallamiento anterior.",
                "fix": "Evita que el codo se abra a más de 70° en la transición excéntrica."
            },
            {
                "joint": "Muñeca",
                "status": "pass",
                "observation": "Alineación neutra muñeca-antebrazo sobre la línea de transmisión de fuerza.",
                "fix": "Mantén los nudillos mirando al frente para evitar hiperextensión pasiva."
            },
            {
                "joint": "Columna",
                "status": "pass",
                "observation": "Apoyo lumbar y cervical neutro sin arqueamiento compensatorio.",
                "fix": "Mantén el abdomen compactado (bracing) sin empujar con la cabeza."
            }
        ]
    else:
        checks = [
            {
                "joint": "Cadera / Pelvis",
                "status": "pass",
                "observation": "Bisagra de cadera fluida y extensión completa en el pico concéntrico.",
                "fix": "Asegura el bloqueo con retroversión pélvica sin hiperlordosis lumbar."
            },
            {
                "joint": "Rodilla",
                "status": "pass",
                "observation": "Trayectoria del fémur colineal con la punta del pie, sin valgo dinámico.",
                "fix": "Empuja el suelo separándolo ligeramente hacia afuera."
            },
            {
                "joint": "Columna Lumbar",
                "status": "pass",
                "observation": "Columna rígida y neutra mantenida por la presión intraabdominal.",
                "fix": "No hiperextiendas al final de la fase concéntrica."
            },
            {
                "joint": "Tobillo",
                "status": "pass",
                "observation": "Trípode plantar apoyado sólidamente con distribución simétrica.",
                "fix": "Conserva contacto de talón, base del primer y quinto metatarsiano."
            }
        ]
        
    alignment = {
        "joint_stress_level": "low",
        "discomfort_risk_summary": "Biomecánica articular limpia y controlada con bajo riesgo lesivo.",
        "checks": checks
    }
    
    if "press" in ex_lower or "chest" in ex_lower or "pec" in ex_lower:
        limiting = {
            "muscle_id": "chest",
            "muscle_name": "Pectoral Mayor",
            "effective_set_credit": 1.0,
            "reason": "Factor limitante principal en la aducción horizontal glenohumeral."
        }
        synergists = [
            {"muscle_id": "triceps", "muscle_name": "Tríceps Braquial", "effective_set_credit": 0.5},
            {"muscle_id": "front_delt", "muscle_name": "Deltoides Anterior", "effective_set_credit": 0.4}
        ]
        t_profile = "Uniforme" if equipment in ["machine", "cable"] else "Pico en Estiramiento"
        tips = [
            "Alinea el agarre de la máquina o mancuernas con el esternón medio.",
            "Pausa de 1 segundo en estiramiento máximo para mayor estímulo hipertrófico."
        ]
    elif "row" in ex_lower or "remo" in ex_lower or "pulldown" in ex_lower or "jalon" in ex_lower or "t_bar" in ex_lower:
        is_upper_b = "t_bar" in ex_lower or "upper_back" in ex_lower or "traps" in ex_lower
        limiting = {
            "muscle_id": "upper_back" if is_upper_b else "lats",
            "muscle_name": "Espalda Alta (Trapecio/Romboides)" if is_upper_b else "Dorsal Ancho",
            "effective_set_credit": 1.0,
            "reason": "Tracción humeral y retracción escapular activa como motor primario."
        }
        synergists = [
            {"muscle_id": "biceps", "muscle_name": "Bíceps Braquial", "effective_set_credit": 0.5},
            {"muscle_id": "rear_delt", "muscle_name": "Deltoides Posterior", "effective_set_credit": 0.4},
            {"muscle_id": "forearms", "muscle_name": "Flexores del Antebrazo", "effective_set_credit": 0.3}
        ]
        t_profile = "Uniforme" if equipment in ["cable", "machine"] else "Pico en Acortamiento"
        tips = [
            "Conduce el movimiento desde los codos hacia la cadera en vez de traccionar con las manos.",
            "Permite una ligera protracción escapular controlada al final de la fase excéntrica."
        ]
    elif "thrust" in ex_lower or "glute" in ex_lower:
        limiting = {
            "muscle_id": "glutes",
            "muscle_name": "Glúteo Mayor",
            "effective_set_credit": 1.0,
            "reason": "Máximo brazo de momento en extensión terminal de cadera (acortamiento)."
        }
        synergists = [
            {"muscle_id": "hamstrings", "muscle_name": "Isquiosurales", "effective_set_credit": 0.4},
            {"muscle_id": "quads", "muscle_name": "Cuádriceps", "effective_set_credit": 0.3}
        ]
        t_profile = "Pico en Acortamiento"
        tips = [
            "Mantén la mirada al frente en el bloqueo superior para fijar la pelvis en retroversión.",
            "Pausa isométrica de 1-2 segundos arriba apretando los glúteos."
        ]
    elif "rdl" in ex_lower or "deadlift" in ex_lower or "muerto" in ex_lower:
        is_unilateral = "unilateral" in ex_lower or "b-stance" in ex_lower or "bstance" in ex_lower
        limiting = {
            "muscle_id": "glutes" if is_unilateral else "hamstrings",
            "muscle_name": "Glúteo Mayor" if is_unilateral else "Isquiosurales",
            "effective_set_credit": 1.0,
            "reason": "Factor limitante principal de la serie en la extensión de cadera." if is_unilateral else "Máxima elongación y tensión mecánica excéntrica en isquiosurales."
        }
        synergists = [
            {"muscle_id": "hamstrings" if is_unilateral else "glutes", "muscle_name": "Isquiosurales" if is_unilateral else "Glúteo Mayor", "effective_set_credit": 0.5},
            {"muscle_id": "lower_back", "muscle_name": "Erectores Espinales", "effective_set_credit": 0.3},
            {"muscle_id": "glute_med", "muscle_name": "Glúteo Medio", "effective_set_credit": 0.3}
        ]
        t_profile = "Pico en Estiramiento"
        tips = [
            "Reduce ligeramente la flexión de rodilla para desplazar más tensión a isquios y glúteo.",
            "Mantén la mancuerna pegada a la espinilla para minimizar fatiga lumbar."
        ]
    elif "squat" in ex_lower or "leg_press" in ex_lower or "hack" in ex_lower or "bulgarian" in ex_lower:
        limiting = {
            "muscle_id": "quads",
            "muscle_name": "Cuádriceps",
            "effective_set_credit": 1.0,
            "reason": "Factor limitante en la extensión de rodilla en el punto de máxima flexión."
        }
        synergists = [
            {"muscle_id": "glutes", "muscle_name": "Glúteo Mayor", "effective_set_credit": 0.5},
            {"muscle_id": "adductors", "muscle_name": "Aductores", "effective_set_credit": 0.4},
            {"muscle_id": "lower_back", "muscle_name": "Erectores Espinales", "effective_set_credit": 0.3}
        ]
        t_profile = "Pico en Estiramiento"
        tips = [
            "Permite el avance de rodillas sobre las punteras para maximizar brazo de momento en la rodilla.",
            "Mantén el torso vertical y el control en la inversión de fase."
        ]
    else:
        limiting = {
            "muscle_id": "target",
            "muscle_name": formal_name,
            "effective_set_credit": 1.0,
            "reason": "Músculo motor principal del movimiento analizado."
        }
        synergists = [
            {"muscle_id": "synergist_1", "muscle_name": "Músculos Estabilizadores", "effective_set_credit": 0.4}
        ]
        t_profile = "Uniforme"
        tips = [
            "Mantén tensión continua y tempo excéntrico de 2 a 3 segundos.",
            "Asegura rango completo de movimiento sin compensaciones articulares."
        ]
        
    v_loss = float(intensity_metrics.get("velocity_loss_pct", intensity_metrics.get("delta_v_rep", 0.0)))
    rir_val, rpe_val, rir_str, status_txt, proximity, verdict_str = calculate_vbt_rir_rpe(v_loss)

    rep_factor = min(1.0, max(0.0, float(total_reps) / 7.0))
    if rir_val >= 5.0:
        rir_factor = 0.0
        mult_label = "Serie de aproximación / técnica"
    elif rir_val >= 4.0:
        rir_factor = 0.45
        mult_label = "Estímulo ligero / aproximación"
    elif rir_val >= 3.0:
        rir_factor = 0.75
        mult_label = "Estímulo moderado"
    elif rir_val >= 2.0:
        rir_factor = 0.90
        mult_label = "Zona óptima de hipertrofia"
    else:
        rir_factor = 1.0
        mult_label = "Máximo estímulo / cercanía al fallo"

    vol_mult = round(float(rir_factor * rep_factor), 2)

    stimulus = {
        "tension_profile": t_profile,
        "limiting_factor": limiting,
        "synergists": synergists,
        "actionable_adjustments": tips,
        "target_muscle": limiting["muscle_name"],
        "secondary_muscles": [s["muscle_name"] for s in synergists],
        "suggested_volume_multiplier": vol_mult,
        "volume_multiplier_label": mult_label
    }

    intensity = {
        "reps_completed": int(total_reps),
        "rir_estimated": round(rir_val, 1),
        "rpe_estimated": round(rpe_val, 1),
        "velocity_loss_pct": round(v_loss, 1),
        "failure_proximity": proximity,
        "coach_verdict": verdict_str
    }
    
    return {
        "detected_exercise_id": exercise_type,
        "detected_exercise_name": formal_name,
        "equipment_type": equipment,
        "body_region": body_region,
        "timeline_cues": cues,
        "alignment_and_discomfort": alignment,
        "stimulus_and_specificity": stimulus,
        "intensity_audit": intensity
    }

def sanitize_and_validate_vlm_output(
    parsed: Dict[str, Any],
    repetitions_summary: List[Dict[str, Any]],
    exercise_type: str,
    target_name_display: str
) -> Dict[str, Any]:
    """Valida y sanea la salida del VLM asegurando timestamps exactos por repetición y modelo de estímulo fisiológico."""
    if not isinstance(parsed, dict):
        return parsed

    if exercise_type.lower() not in ["auto", "", "none"]:
        parsed["detected_exercise_id"] = exercise_type
        parsed["detected_exercise_name"] = target_name_display

    # 1. Sanitize & Fix Timeline Cues Timestamps
    cues = parsed.get("timeline_cues", [])
    if isinstance(cues, list) and len(cues) > 0 and len(repetitions_summary) > 0:
        total_dur = float(repetitions_summary[-1].get("end_time", repetitions_summary[-1].get("peak_sec", 0.0)))
        all_early = len(cues) >= 2 and total_dur > 10.0 and all(float(c.get("timestamp_sec", 0.0)) <= 6.5 for c in cues)

        fixed_cues = []
        for idx_c, cue in enumerate(cues):
            r_idx = cue.get("rep_index")
            try:
                r_idx = int(r_idx) if r_idx is not None else None
            except (ValueError, TypeError):
                r_idx = None

            if r_idx is None or r_idx < 1 or r_idx > len(repetitions_summary):
                if all_early:
                    r_idx = min(len(repetitions_summary), max(1, int(round((idx_c + 1) * len(repetitions_summary) / (len(cues) + 1)))))
                else:
                    cur_t = float(cue.get("timestamp_sec", 0.0))
                    matched_rep = None
                    for r in repetitions_summary:
                        st = float(r.get("start_sec", r.get("start_time", 0.0)))
                        et = float(r.get("end_time", r.get("peak_sec", 0.0)))
                        if st <= cur_t <= et:
                            matched_rep = r.get("rep_index", r.get("rep_number", 1))
                            break
                    r_idx = matched_rep if matched_rep else min(len(repetitions_summary), max(1, idx_c + 1))

            cue["rep_index"] = r_idx
            rep_obj = repetitions_summary[r_idx - 1]
            rep_start = float(rep_obj.get("start_sec", rep_obj.get("start_time", 0.0)))
            rep_end = float(rep_obj.get("end_time", rep_obj.get("peak_sec", 0.0)))
            rep_inflect = float(rep_obj.get("inflection_sec", rep_obj.get("inflection_time", (rep_start + rep_end) / 2.0)))
            rep_sticking = rep_obj.get("sticking_point_sec")

            cur_t = float(cue.get("timestamp_sec", 0.0))
            badge = str(cue.get("badge", "")).lower()

            if all_early or cur_t < (rep_start - 0.25) or cur_t > (rep_end + 0.25):
                if "sticking" in badge and rep_sticking:
                    cue["timestamp_sec"] = round(float(rep_sticking), 2)
                elif "rom" in badge or "desaceleraci" in badge or "control" in badge:
                    cue["timestamp_sec"] = round(rep_inflect, 2)
                else:
                    cue["timestamp_sec"] = round((rep_start + rep_end) / 2.0, 2)
            else:
                cue["timestamp_sec"] = round(cur_t, 2)

            fixed_cues.append(cue)

        fixed_cues.sort(key=lambda x: x.get("timestamp_sec", 0.0))
        parsed["timeline_cues"] = fixed_cues

    # 2. Sanitize & Normalize Stimulus and Specificity (Limiting Factor + Synergists)
    stim = parsed.get("stimulus_and_specificity")
    if not isinstance(stim, dict):
        stim = {}
        parsed["stimulus_and_specificity"] = stim

    # Limiting factor
    lf = stim.get("limiting_factor")
    if not isinstance(lf, dict) or not lf.get("muscle_name"):
        fallback_target = stim.get("target_muscle") or target_name_display
        stim["limiting_factor"] = {
            "muscle_id": "limiting_target",
            "muscle_name": fallback_target,
            "effective_set_credit": 1.0,
            "reason": f"Factor limitante principal de la serie en la ejecución de {fallback_target}."
        }
    else:
        stim["limiting_factor"]["effective_set_credit"] = 1.0
        if not stim["limiting_factor"].get("reason"):
            stim["limiting_factor"]["reason"] = f"Factor limitante principal en {stim['limiting_factor'].get('muscle_name')}."

    # Synergists
    syn = stim.get("synergists")
    if not isinstance(syn, list) or len(syn) == 0:
        sec_list = stim.get("secondary_muscles", [])
        if isinstance(sec_list, list) and len(sec_list) > 0:
            stim["synergists"] = [
                {
                    "muscle_id": f"syn_{i+1}",
                    "muscle_name": str(s),
                    "effective_set_credit": 0.5 if i == 0 else 0.3
                }
                for i, s in enumerate(sec_list[:3])
            ]
        else:
            stim["synergists"] = [
                {"muscle_id": "syn_stabilizer", "muscle_name": "Músculos Estabilizadores", "effective_set_credit": 0.4}
            ]
    else:
        for s in stim["synergists"]:
            try:
                cred = float(s.get("effective_set_credit", 0.4))
                s["effective_set_credit"] = round(min(0.8, max(0.2, cred)), 2)
            except (ValueError, TypeError):
                s["effective_set_credit"] = 0.4

    # Tension profile
    tp = str(stim.get("tension_profile", "Uniforme")).strip()
    if tp.lower() in ["peak_stretched", "estiramiento"]:
        stim["tension_profile"] = "Pico en Estiramiento"
    elif tp.lower() in ["peak_shortened", "contraccion", "acortamiento"]:
        stim["tension_profile"] = "Pico en Acortamiento"
    elif tp.lower() in ["constant", "peak_mid", "uniforme"]:
        stim["tension_profile"] = "Uniforme"
    else:
        stim["tension_profile"] = tp

    # Actionable adjustments
    if not stim.get("actionable_adjustments") or not isinstance(stim["actionable_adjustments"], list):
        stim["actionable_adjustments"] = [
            "Mantén control estricto de la fase excéntrica evitando aceleraciones parásitas.",
            "Conserva la alineación neutra de la columna y de las articulaciones de apoyo."
        ]

    # Backwards-compatibility & 7-stimulating-reps window
    v_loss_val = float(parsed.get("intensity_audit", {}).get("velocity_loss_pct", 0.0))
    rir_val_vlm, _, _, _, _, _ = calculate_vbt_rir_rpe(v_loss_val)
    n_reps_vlm = len(repetitions_summary) if repetitions_summary else 1
    rep_fact_vlm = min(1.0, max(0.0, float(n_reps_vlm) / 7.0))
    if rir_val_vlm >= 5.0:
        rir_f_vlm = 0.0
        lbl_vlm = "Serie de aproximación / técnica"
    elif rir_val_vlm >= 4.0:
        rir_f_vlm = 0.45
        lbl_vlm = "Estímulo ligero / aproximación"
    elif rir_val_vlm >= 3.0:
        rir_f_vlm = 0.75
        lbl_vlm = "Estímulo moderado"
    elif rir_val_vlm >= 2.0:
        rir_f_vlm = 0.90
        lbl_vlm = "Zona óptima de hipertrofia"
    else:
        rir_f_vlm = 1.0
        lbl_vlm = "Máximo estímulo / cercanía al fallo"

    stim["target_muscle"] = stim["limiting_factor"]["muscle_name"]
    stim["secondary_muscles"] = [s["muscle_name"] for s in stim["synergists"]]
    stim["suggested_volume_multiplier"] = round(float(rir_f_vlm * rep_fact_vlm), 2)
    stim["volume_multiplier_label"] = lbl_vlm

    return parsed

def analyze_biomechanics_with_vlm(
    video_path: Optional[str],
    exercise_type: str,
    total_reps: int,
    intensity_metrics: Dict[str, Any],
    repetitions_summary: List[Dict[str, Any]],
    rep_comparison: Optional[Dict[str, Any]] = None,
    gemini_api_key: Optional[str] = None,
    exercise_name: Optional[str] = None
) -> Tuple[Optional[Dict[str, Any]], Optional[str], str, Optional[str]]:
    """
    Análisis Biomecánico Multimodal con Gemini en 2 intentos con auto-descubrimiento de modelos:
    1. Intento 1 (Vídeo original intacto): Si pesa < 8 MB, se envía tal cual (video/mp4) sin recodificar.
    2. Intento 2 (Fallback automático a 6 Keyframes JPEG): Ante cualquier fallo HTTP o > 8 MB, envía 6 fotogramas JPEG (480px, q75).
    Retorna (vlm_result, vlm_error, vlm_mode, vlm_model_used)
    """
    api_key = (gemini_api_key or "").strip() or os.environ.get("GEMINI_API_KEY", "").strip()
    if not api_key:
        return None, "GEMINI_API_KEY no configurada (ni en payload ni en entorno)", "fallback", None

    rep_intervals_list = []
    for i, r in enumerate(repetitions_summary[:12]):
        rep_num = r.get("rep_number", r.get("rep_index", i+1))
        s_sec = r.get("start_sec")
        e_sec = r.get("end_sec")
        if s_sec is not None and e_sec is not None:
            rep_intervals_list.append(f"- Rep {rep_num}: de {s_sec:.1f}s a {e_sec:.1f}s (excéntrico: {r.get('eccentric_sec', 0.0):.1f}s, concéntrico: {r.get('concentric_sec', 0.0):.1f}s, ROM: {r.get('rom_deg', 0.0):.1f}°)")
        else:
            rep_intervals_list.append(f"- Rep {rep_num}: excéntrico {r.get('eccentric_sec', 0.0):.1f}s, concéntrico {r.get('concentric_sec', 0.0):.1f}s, ROM {r.get('rom_deg', 0.0):.1f}°")
    rep_timeline_str = "\n".join(rep_intervals_list) if rep_intervals_list else "- Repeticiones en curso."

    v_loss = float(intensity_metrics.get("velocity_loss_pct", intensity_metrics.get("delta_v_rep", 0.0)))
    rir = float(intensity_metrics.get("exact_rir", 2.0))

    target_name_display = (exercise_name or "").strip() or exercise_type.replace("_", " ").title()
    strict_constraint_text = ""
    if exercise_type.lower() not in ["auto", "", "none"]:
        strict_constraint_text = (
            f"RESTRICCIÓN VINCULANTE: El atleta está realizando OBLIGATORIAMENTE el ejercicio: '{target_name_display}' (`{exercise_type}`). "
            f"NO lo reclasifiques a otro ejercicio. Evalúa la alineación, el perfil de estímulo y las correcciones del Coach IA estrictamente "
            f"bajo los estándares biomecánicos de '{target_name_display}' (por ejemplo, si el usuario indicó Peso Muerto Rumano Unilateral "
            f"pero flexiona demasiado la rodilla como una zancada, corrígele eso mismo en lugar de llamarlo Sentadilla Búlgara).\n"
            f"- 'detected_exercise_id' DEBE SER EXACTAMENTE: '{exercise_type}'.\n"
            f"- 'detected_exercise_name' DEBE SER EXACTAMENTE: '{target_name_display}'.\n\n"
        )

    prompt_text = (
        f"Actúa como un Ph.D. en Biomecánica del Ejercicio y Entrenador de Fuerza de Élite.\n"
        f"{strict_constraint_text}"
        f"Analiza este vídeo de entrenamiento completo junto con los datos de cinemática computacional calculados:\n"
        f"- Ejercicio asignado inicialmente: '{target_name_display}' (`{exercise_type}`).\n"
        f"- Repeticiones detectadas: {total_reps}.\n"
        f"- Pérdida de velocidad concéntrica registrada: {v_loss:.1f}%.\n"
        f"- RIR estimado por cinemática: {rir:.1f}.\n"
        f"- Intervalos temporales exactos por repetición (ViTPose + Cinemática):\n{rep_timeline_str}\n\n"
        f"INSTRUCCIONES CLÍNICAS OBLIGATORIAS:\n"
        f"1. Identifica el ejercicio exacto (`detected_exercise_id`), nombre en español (`detected_exercise_name`), tipo de equipamiento (`equipment_type`: 'free_weight'|'machine'|'cable'|'bodyweight') y región ('upper'|'lower').\n"
        f"2. Genera `timeline_cues`: Para cada momento clave o fallo técnico detectado, indica `rep_index` (número entero de la repetición a la que pertenece, e.g. 1, 2, 3...) y `timestamp_sec` (el segundo EXACTO dentro del intervalo de esa repetición, NUNCA amontonados en los primeros 5 segundos del vídeo). Incluye tipo ('warning'|'error'|'positive'), badge ('Sticking Point'|'Desaceleración'|'Pérdida de ROM'|'Asimetría'|'Control Óptimo'), mensaje clínico conciso, corrección técnica directa (`technical_fix`) y articulación involucrada (`affected_joint`).\n"
        f"3. Genera `alignment_and_discomfort`: nivel de estrés articular ('low'|'moderate'|'high'), resumen de molestias/riesgos, y lista de checks articulares (`joint`, `status`: 'pass'|'warning'|'critical', `observation`, `fix`).\n"
        f"4. Genera `stimulus_and_specificity` usando el modelo de Factor Limitante (1.0 serie efectiva) + Sinergistas Fraccionales (0.3 a 0.5 serie efectiva):\n"
        f"   - `tension_profile`: 'Pico en Estiramiento' | 'Pico en Acortamiento' | 'Uniforme'\n"
        f"   - `limiting_factor`: {{ 'muscle_id': '...', 'muscle_name': '...', 'effective_set_credit': 1.0, 'reason': '...' }}\n"
        f"   - `synergists`: [ {{ 'muscle_id': '...', 'muscle_name': '...', 'effective_set_credit': 0.5, 'reason': '...' }}, ... ]\n"
        f"   - `actionable_adjustments`: [ 'Consejo 1...', 'Consejo 2...' ]\n"
        f"5. Genera `intensity_audit`: repeticiones completadas, estimación precisa de RIR y RPE, `failure_proximity` ('safe'|'effective_growth'|'absolute_failure'|'submaximal') y veredicto del entrenador (`coach_verdict`).\n\n"
        f"Responde estrictamente con un objeto JSON válido con este formato:\n"
        f"{{\n"
        f'  "detected_exercise_id": "{exercise_type if exercise_type.lower() not in ["auto", "", "none"] else "chest_press_machine"}",\n'
        f'  "detected_exercise_name": "{target_name_display if exercise_type.lower() not in ["auto", "", "none"] else "Press en Máquina Convergente"}",\n'
        f'  "equipment_type": "machine",\n'
        f'  "body_region": "upper",\n'
        f'  "timeline_cues": [\n'
        f'    {{\n'
        f'      "rep_index": 1,\n'
        f'      "timestamp_sec": 3.8,\n'
        f'      "type": "warning",\n'
        f'      "badge": "Sticking Point",\n'
        f'      "message": "Freno notable en el tercio medio de la fase concéntrica.",\n'
        f'      "technical_fix": "Mantén aceleración máxima sin despegar las escápulas del banco.",\n'
        f'      "affected_joint": "elbow"\n'
        f'    }}\n'
        f'  ],\n'
        f'  "alignment_and_discomfort": {{\n'
        f'    "joint_stress_level": "low",\n'
        f'    "discomfort_risk_summary": "Excelente control y estabilidad escapular durante toda la serie.",\n'
        f'    "checks": [\n'
        f'      {{ "joint": "Hombro", "status": "pass", "observation": "Escápulas retraídas y estables.", "fix": "Mantener retracción continua." }},\n'
        f'      {{ "joint": "Codo", "status": "pass", "observation": "Plano escapular a 50°.", "fix": "Excelente alineación neutra." }}\n'
        f'    ]\n'
        f'  }},\n'
        f'  "stimulus_and_specificity": {{\n'
        f'    "tension_profile": "Uniforme",\n'
        f'    "limiting_factor": {{\n'
        f'      "muscle_id": "chest",\n'
        f'      "muscle_name": "Pectoral Mayor",\n'
        f'      "effective_set_credit": 1.0,\n'
        f'      "reason": "Factor limitante principal en la aducción horizontal de hombro."\n'
        f'    }},\n'
        f'    "synergists": [\n'
        f'      {{ "muscle_id": "triceps", "muscle_name": "Tríceps Braquial", "effective_set_credit": 0.5, "reason": "Sinergista agonista en la extensión de codo." }},\n'
        f'      {{ "muscle_id": "anterior_delt", "muscle_name": "Deltoides Anterior", "effective_set_credit": 0.3, "reason": "Sinergista en la flexión y aducción anterior." }}\n'
        f'    ],\n'
        f'    "actionable_adjustments": [\n'
        f'      "Ajusta el asiento para alinear las empuñaduras a la altura del esternón.",\n'
        f'      "Mantén una pausa de 1 segundo en estiramiento máximo."\n'
        f'    ]\n'
        f'  }},\n'
        f'  "intensity_audit": {{\n'
        f'    "reps_completed": {total_reps},\n'
        f'    "rir_estimated": {rir:.1f},\n'
        f'    "rpe_estimated": {max(0.0, 10.0 - rir):.1f},\n'
        f'    "velocity_loss_pct": {v_loss:.1f},\n'
        f'    "failure_proximity": "effective_growth",\n'
        f'    "coach_verdict": "Serie ejecutada en el rango ideal de hipertrofia efectiva."\n'
        f'  }}\n'
        f"}}"
    )

    models_to_try = get_available_flash_models(api_key)
    print(f"[Gemini VLM] Evaluando modelos vigentes: {models_to_try}")

    errors: List[str] = []

    # -------------------------------------------------------------------------
    # INTENTO 1: Vídeo MP4 original intacto (< 8 MB, sin re-codificar)
    # -------------------------------------------------------------------------
    video_b64 = None
    if video_path and os.path.exists(video_path):
        f_size = os.path.getsize(video_path)
        if f_size < 8 * 1024 * 1024:
            try:
                with open(video_path, "rb") as vf:
                    video_b64 = base64.b64encode(vf.read()).decode("utf-8")
                print(f"[Gemini Video VLM] Intento 1: Enviando vídeo original intacto ({f_size / (1024*1024):.2f} MB)...")
            except Exception as e:
                errors.append(f"local (read_mp4): Error lectura - {e}")
        else:
            errors.append(f"local (mp4): Vídeo de {f_size / (1024*1024):.2f} MB supera 8 MB")

    if video_b64:
        parts_video = [
            {"text": prompt_text},
            {"inline_data": {"mime_type": "video/mp4", "data": video_b64}}
        ]
        body_video = {
            "contents": [{"parts": parts_video}],
            "generationConfig": {"temperature": 0.2, "responseMimeType": "application/json"}
        }
        req_data_video = json.dumps(body_video).encode("utf-8")

        for model_name in models_to_try:
            clean_model = model_name.replace("models/", "").strip()
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{clean_model}:generateContent"
            try:
                req = urllib.request.Request(
                    url,
                    data=req_data_video,
                    headers={
                        "Content-Type": "application/json",
                        "x-goog-api-key": api_key
                    },
                    method="POST"
                )
                with urllib.request.urlopen(req, timeout=30.0) as resp:
                    resp_bytes = resp.read()
                    resp_json = json.loads(resp_bytes.decode("utf-8"))
                    candidates = resp_json.get("candidates", [])
                    if candidates:
                        cand = candidates[0]
                        text_content = cand.get("content", {}).get("parts", [{}])[0].get("text", "")
                        parsed = clean_gemini_json_response(text_content)
                        if parsed and isinstance(parsed, dict) and "timeline_cues" in parsed:
                            parsed = sanitize_and_validate_vlm_output(parsed, repetitions_summary, exercise_type, target_name_display)
                            print(f"[Gemini Video VLM] Inferencia {clean_model} (MP4 intacto) con éxito: {parsed.get('detected_exercise_id')}")
                            return parsed, None, "video_mp4", clean_model
            except urllib.error.HTTPError as e:
                code, msg = parse_google_http_error(e)
                err_str = f"{clean_model} (mp4): HTTP {code} - {msg}"
                errors.append(err_str)
                print(f"[Gemini Video VLM] {err_str}")
            except Exception as e:
                err_str = f"{clean_model} (mp4): Exception - {type(e).__name__}: {e}"
                errors.append(err_str)
                print(f"[Gemini Video VLM] {err_str}")

    # -------------------------------------------------------------------------
    # INTENTO 2: Fallback automático a 6 Keyframes JPEG (480px, q75)
    # -------------------------------------------------------------------------
    print(f"[Gemini VLM] Intento 2: Extrayendo 6 keyframes JPEG uniformes tras fallos en vídeo...")
    kf_b64_list = extract_6_keyframes_jpeg_b64(video_path) if video_path else []
    if kf_b64_list:
        parts_kf = [{"text": prompt_text}]
        for kf_b64 in kf_b64_list:
            parts_kf.append({"inline_data": {"mime_type": "image/jpeg", "data": kf_b64}})
        body_kf = {
            "contents": [{"parts": parts_kf}],
            "generationConfig": {"temperature": 0.2, "responseMimeType": "application/json"}
        }
        req_data_kf = json.dumps(body_kf).encode("utf-8")

        for model_name in models_to_try:
            clean_model = model_name.replace("models/", "").strip()
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{clean_model}:generateContent"
            try:
                req = urllib.request.Request(
                    url,
                    data=req_data_kf,
                    headers={
                        "Content-Type": "application/json",
                        "x-goog-api-key": api_key
                    },
                    method="POST"
                )
                with urllib.request.urlopen(req, timeout=25.0) as resp:
                    resp_bytes = resp.read()
                    resp_json = json.loads(resp_bytes.decode("utf-8"))
                    candidates = resp_json.get("candidates", [])
                    if candidates:
                        cand = candidates[0]
                        text_content = cand.get("content", {}).get("parts", [{}])[0].get("text", "")
                        parsed = clean_gemini_json_response(text_content)
                        if parsed and isinstance(parsed, dict) and "timeline_cues" in parsed:
                            parsed = sanitize_and_validate_vlm_output(parsed, repetitions_summary, exercise_type, target_name_display)
                            print(f"[Gemini Keyframes VLM] Inferencia {clean_model} (6 Keyframes JPEG) con éxito: {parsed.get('detected_exercise_id')}")
                            return parsed, None, "keyframes_jpeg", clean_model
            except urllib.error.HTTPError as e:
                code, msg = parse_google_http_error(e)
                err_str = f"{clean_model} (keyframes): HTTP {code} - {msg}"
                errors.append(err_str)
                print(f"[Gemini Keyframes VLM] {err_str}")
            except Exception as e:
                err_str = f"{clean_model} (keyframes): Exception - {type(e).__name__}: {e}"
                errors.append(err_str)
                print(f"[Gemini Keyframes VLM] {err_str}")

    accumulated_error = " | ".join(errors) if errors else "Inferencia Gemini falló en todos los modelos"
    return None, accumulated_error, "fallback", None

analyze_biomechanics_with_gemini_video = analyze_biomechanics_with_vlm

def get_video_rotation(video_path: str) -> int:
    """Detect rotation angle (0, 90, 180, 270) from video metadata / side data."""
    import subprocess, json, shutil, re

    # 1. Try ffprobe if available
    try:
        ffprobe_bin = shutil.which("ffprobe")
        if ffprobe_bin:
            cmd = [
                ffprobe_bin, "-v", "quiet", "-print_format", "json",
                "-show_streams", video_path
            ]
            res = subprocess.run(cmd, capture_output=True, text=True, timeout=5)
            if res.returncode == 0:
                data = json.loads(res.stdout)
                for s in data.get("streams", []):
                    if s.get("codec_type") == "video":
                        tags = s.get("tags", {})
                        if "rotate" in tags:
                            rot = int(float(tags["rotate"])) % 360
                            if rot != 0:
                                return rot
                        for sd in s.get("side_data_list", []):
                            if "rotation" in sd:
                                rot = int(float(sd["rotation"])) % 360
                                if rot < 0:
                                    rot = (360 + rot) % 360
                                if rot != 0:
                                    return rot
    except Exception:
        pass

    # 2. Try ffmpeg -i to parse stderr for rotation or displaymatrix
    try:
        ffmpeg_bin = None
        try:
            import imageio_ffmpeg
            ffmpeg_bin = imageio_ffmpeg.get_ffmpeg_exe()
        except Exception:
            ffmpeg_bin = shutil.which("ffmpeg")
        if ffmpeg_bin:
            cmd = [ffmpeg_bin, "-i", video_path]
            res = subprocess.run(cmd, capture_output=True, text=True, timeout=5)
            err = res.stderr or ""
            # Check displaymatrix: rotation of -90.00 degrees
            m_disp = re.search(r"rotation of\s*(-?\d+(?:\.\d+)?)", err)
            if m_disp:
                val = float(m_disp.group(1))
                rot = int(round(-val)) % 360
                if rot < 0:
                    rot = (360 + rot) % 360
                if rot != 0:
                    return rot
            # Check rotate : 90
            m_rot = re.search(r"rotate\s*:\s*(\d+)", err)
            if m_rot:
                rot = int(m_rot.group(1)) % 360
                if rot != 0:
                    return rot
    except Exception:
        pass

    # 3. Try PyAV stream side data / metadata
    try:
        import av
        with av.open(video_path) as cont:
            if len(cont.streams.video) > 0:
                st = cont.streams.video[0]
                meta = getattr(st, "metadata", {}) or {}
                if "rotate" in meta:
                    return int(float(meta["rotate"])) % 360
                for sd in getattr(st, "side_data", []):
                    if hasattr(sd, "rotation"):
                        rot = int(sd.rotation) % 360
                        if rot < 0:
                            rot = (360 + rot) % 360
                        if rot != 0:
                            return rot
    except Exception:
        pass

    # 4. Try OpenCV CAP_PROP_ORIENTATION_META
    try:
        cap = cv2.VideoCapture(video_path)
        if cap.isOpened():
            prop_rot = cap.get(cv2.CAP_PROP_ORIENTATION_META if hasattr(cv2, "CAP_PROP_ORIENTATION_META") else 57)
            cap.release()
            if prop_rot and not math.isnan(prop_rot) and prop_rot > 0:
                return int(prop_rot) % 360
    except Exception:
        pass

    return 0

def apply_rotation_to_frame(frame_rgb: np.ndarray, rotation: int) -> np.ndarray:
    """Rotate image upright according to EXIF/MP4 rotation metadata."""
    if rotation == 90:
        return cv2.rotate(frame_rgb, cv2.ROTATE_90_CLOCKWISE)
    elif rotation == 180:
        return cv2.rotate(frame_rgb, cv2.ROTATE_180)
    elif rotation == 270:
        return cv2.rotate(frame_rgb, cv2.ROTATE_90_COUNTERCLOCKWISE)
    return frame_rgb

def optimize_video_with_ffmpeg(
    input_path: str,
    max_h: int = 480,
    target_fps: int = 20,
    start_time: float = 0.0,
    end_time: Optional[float] = None
) -> Tuple[str, bool]:
    """
    Normalizes/downscales video using ffmpeg ultra-fast mode with minimal RAM.
    Auto-rotates to visual upright, transposes pixels, and clears rotation tags so rotate=0.
    Uses fast input-seeking (-ss / -t before -i) so huge 4K60 files don't decode unused frames.
    Returns (path_to_optimized_mp4, was_trimmed_by_ffmpeg).
    """
    if not os.path.exists(input_path):
        return input_path, False

    import subprocess, shutil, tempfile
    ffmpeg_bin = None
    try:
        import imageio_ffmpeg
        ffmpeg_bin = imageio_ffmpeg.get_ffmpeg_exe()
    except Exception:
        ffmpeg_bin = shutil.which("ffmpeg")

    if not ffmpeg_bin:
        ffmpeg_bin = shutil.which("ffmpeg")

    if not ffmpeg_bin:
        return input_path, False

    raw_rot = get_video_rotation(input_path)

    fd, out_path = tempfile.mkstemp(suffix="_opt.mp4")
    os.close(fd)

    # Construct video filter guaranteeing physical upright orientation
    if raw_rot == 90:
        vf = f"transpose=1,scale=-2:{max_h},fps={target_fps}"
    elif raw_rot == 270:
        vf = f"transpose=2,scale=-2:{max_h},fps={target_fps}"
    elif raw_rot == 180:
        vf = f"hflip,vflip,scale=-2:{max_h},fps={target_fps}"
    else:
        vf = f"scale=-2:{max_h},fps={target_fps}"

    seek_args: List[str] = []
    if start_time > 0.05:
        seek_args.extend(["-ss", f"{start_time:.2f}"])
    if end_time is not None and end_time > start_time:
        seek_args.extend(["-t", f"{(end_time - start_time):.2f}"])

    cmd = [
        ffmpeg_bin, "-y",
        "-threads", "2",
        *seek_args,
        "-i", input_path,
        "-vf", vf,
        "-metadata:s:v", "rotate=0",
        "-metadata:s:v:0", "rotate=0",
        "-preset", "ultrafast",
        "-c:v", "libx264",
        "-crf", "28",
        "-an",
        out_path
    ]
    try:
        res = subprocess.run(cmd, capture_output=True, text=True, timeout=90)
        if res.returncode == 0 and os.path.exists(out_path) and os.path.getsize(out_path) > 1000:
            # Verify output dimensions
            cap = cv2.VideoCapture(out_path)
            if cap.isOpened():
                ow = cap.get(cv2.CAP_PROP_FRAME_WIDTH)
                oh = cap.get(cv2.CAP_PROP_FRAME_HEIGHT)
                cap.release()
                # If input was portrait (90 or 270) but output came out landscape (w > h),
                # re-run with explicit transpose
                if raw_rot in (90, 270) and ow > oh:
                    fd2, out_path2 = tempfile.mkstemp(suffix="_opt2.mp4")
                    os.close(fd2)
                    vf_fix = f"transpose=1,scale=-2:{max_h},fps={target_fps}" if raw_rot == 90 else f"transpose=2,scale=-2:{max_h},fps={target_fps}"
                    cmd2 = [
                        ffmpeg_bin, "-y", "-threads", "2",
                        *seek_args,
                        "-i", input_path, "-vf", vf_fix,
                        "-metadata:s:v", "rotate=0", "-metadata:s:v:0", "rotate=0",
                        "-preset", "ultrafast", "-c:v", "libx264", "-crf", "28", "-an",
                        out_path2
                    ]
                    res2 = subprocess.run(cmd2, capture_output=True, text=True, timeout=90)
                    if res2.returncode == 0 and os.path.exists(out_path2) and os.path.getsize(out_path2) > 1000:
                        try:
                            os.unlink(out_path)
                        except OSError:
                            pass
                        return out_path2, bool(seek_args)
                    else:
                        if os.path.exists(out_path2):
                            try:
                                os.unlink(out_path2)
                            except OSError:
                                pass
            return out_path, bool(seek_args)
    except Exception as e:
        print(f"[FFmpeg Opt] Warning: {e}")

    if os.path.exists(out_path):
        try:
            os.unlink(out_path)
        except OSError:
            pass
    return input_path, False

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
    Detects and normalizes rotation metadata so all frames are visual upright.
    """
    frames_rgb = []
    timestamps = []
    step_dt = 1.0 / target_fps
    t_start = max(0.0, float(start_time))
    t_end = float(end_time) if (end_time is not None and float(end_time) > t_start) else None
    video_rot = get_video_rotation(video_path)
    if video_rot != 0:
        print(f"[Video Decoder] Detected MP4 rotation={video_rot}°. Normalizing frames upright.")

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
                            if video_rot != 0:
                                img = apply_rotation_to_frame(img, video_rot)
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
        if video_rot != 0:
            frame_rgb = apply_rotation_to_frame(frame_rgb, video_rot)
        frames_rgb.append(frame_rgb)
        exact_ts = round(float(target_f_idx / native_fps), 4)
        timestamps.append(exact_ts)
        curr_t += step_dt
        
    cap.release()
    total_dur_ret = float(timestamps[-1] - timestamps[0]) if len(timestamps) > 1 else 0.0
    if video_rot in (90, 270):
        for idx_fr in range(len(frames_rgb)):
            if frames_rgb[idx_fr].shape[1] > frames_rgb[idx_fr].shape[0]:
                frames_rgb[idx_fr] = apply_rotation_to_frame(frames_rgb[idx_fr], video_rot)
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
    # Pass 1: RT-DETR Athlete Detection across ALL frames (FP16 batched)
    # ---------------------------------------------------------------------
    all_frame_detections = []  # candidate person boxes per frame
    for i in range(0, n_frames, batch_size):
        batch_rgb = frames_rgb[i : i + batch_size]
        if has_crop:
            batch_crop = [f[crop_y : crop_y + crop_h, crop_x : crop_x + crop_w] for f in batch_rgb]
        else:
            batch_crop = batch_rgb
        batch_pil = [Image.fromarray(f) for f in batch_crop]
        
        raw_det_inputs = det_processor(images=batch_pil, return_tensors="pt")
        det_dtype = next(det_model.parameters()).dtype
        det_inputs = {
            k: (v.to(device=device, dtype=det_dtype) if torch.is_floating_point(v) else v.to(device=device))
            for k, v in raw_det_inputs.items()
        }
        with torch.no_grad(), torch.autocast(device_type="cuda", dtype=torch.float16, enabled=(device == "cuda")):
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
                    b_cand = boxes[idx].tolist()
                    box_cy_norm = ((b_cand[1] + b_cand[3]) / 2.0) / float(eff_h)
                    box_h_norm = (b_cand[3] - b_cand[1]) / float(eff_h)
                    # Discard static boxes in the upper 32% of the frame (posters/murals on gym walls)
                    if box_cy_norm < 0.32 and box_h_norm < 0.42:
                        continue
                    p_boxes.append((b_cand, float(scores[idx])))
            all_frame_detections.append(p_boxes)

    # ---------------------------------------------------------------------
    # Pass 2: Strict Temporal Athlete Tracking across ALL frames
    # ---------------------------------------------------------------------
    # Step A: Identify and lock the primary active athlete during initial frames
    init_window = min(25, n_frames)
    tracklets = []
    for f_idx in range(init_window):
        cands = all_frame_detections[f_idx]
        unmatched_cands = list(cands)
        for trk in tracklets:
            last_b = trk['boxes'][-1]
            best_iou = 0.0
            best_cand_idx = -1
            for idx, (b_cand, score) in enumerate(unmatched_cands):
                ix1 = max(last_b[0], b_cand[0])
                iy1 = max(last_b[1], b_cand[1])
                ix2 = min(last_b[2], b_cand[2])
                iy2 = min(last_b[3], b_cand[3])
                inter = max(0.0, ix2 - ix1) * max(0.0, iy2 - iy1)
                a1 = max(1.0, (last_b[2] - last_b[0]) * (last_b[3] - last_b[1]))
                a2 = max(1.0, (b_cand[2] - b_cand[0]) * (b_cand[3] - b_cand[1]))
                iou_val = inter / (a1 + a2 - inter)
                if iou_val > best_iou:
                    best_iou = iou_val
                    best_cand_idx = idx
            if best_cand_idx >= 0 and best_iou >= 0.30:
                b_cand, score = unmatched_cands.pop(best_cand_idx)
                trk['boxes'].append(b_cand)
                trk['frames'].append(f_idx)
        for b_cand, score in unmatched_cands:
            tracklets.append({'boxes': [b_cand], 'frames': [f_idx]})

    # Select the tracklet with greatest active movement and horizontal centering
    best_metric = -1.0
    locked_athlete_box = None
    for trk in tracklets:
        if len(trk['boxes']) < 2:
            continue
        motion = 0.0
        cxs, cys, areas = [], [], []
        for i in range(1, len(trk['boxes'])):
            b_prev = trk['boxes'][i-1]
            b_curr = trk['boxes'][i]
            c1 = ((b_prev[0] + b_prev[2]) / 2.0, (b_prev[1] + b_prev[3]) / 2.0)
            c2 = ((b_curr[0] + b_curr[2]) / 2.0, (b_curr[1] + b_curr[3]) / 2.0)
            motion += math.hypot(c2[0] - c1[0], c2[1] - c1[1])
            cxs.append(c2[0])
            cys.append(c2[1])
            areas.append((b_curr[2] - b_curr[0]) * (b_curr[3] - b_curr[1]))
        mean_cx_norm = (sum(cxs) / len(cxs)) / float(eff_w) if cxs else 0.5
        horiz_centering = max(0.1, 1.0 - 1.5 * abs(mean_cx_norm - 0.5))
        metric = (motion + 15.0) * (horiz_centering ** 2) * (np.mean(areas) ** 0.5 if areas else 1.0)
        if metric > best_metric:
            best_metric = metric
            locked_athlete_box = trk['boxes'][0]

    # Fallback if no multi-frame tracklet formed
    if locked_athlete_box is None:
        p0 = all_frame_detections[0] if len(all_frame_detections) > 0 else []
        if len(p0) > 0:
            locked_athlete_box = max(p0, key=lambda x: (x[0][2]-x[0][0])*(x[0][3]-x[0][1]))[0]
        else:
            locked_athlete_box = [0.0, 0.0, float(eff_w), float(eff_h)]

    # Step B: Track strictly with IoU >= 0.35 lock, prohibiting jumps to spotters/third parties
    raw_tracked_boxes = []
    tracked_box = locked_athlete_box

    for f_idx in range(n_frames):
        p_candidates = all_frame_detections[f_idx]
        prev_b = tracked_box
        prev_cx = (prev_b[0] + prev_b[2]) / 2.0
        prev_cy = (prev_b[1] + prev_b[3]) / 2.0
        prev_area = max(1.0, (prev_b[2] - prev_b[0]) * (prev_b[3] - prev_b[1]))

        valid_cands = []
        for b, score in p_candidates:
            cand_cx = (b[0] + b[2]) / 2.0
            cand_cy = (b[1] + b[3]) / 2.0
            norm_center_dist = math.hypot(cand_cx - prev_cx, cand_cy - prev_cy) / float(max(eff_w, eff_h))
            
            ix1 = max(prev_b[0], b[0])
            iy1 = max(prev_b[1], b[1])
            ix2 = min(prev_b[2], b[2])
            iy2 = min(prev_b[3], b[3])
            inter = max(0.0, ix2 - ix1) * max(0.0, iy2 - iy1)
            cand_area = max(1.0, (b[2] - b[0]) * (b[3] - b[1]))
            iou = inter / (prev_area + cand_area - inter)

            # Strict association: require IoU >= 0.35 and close spatial continuity
            if iou >= 0.35 and norm_center_dist < 0.25:
                # Rank primarily by IoU and distance, detector score is NOT allowed to cause jumps to bystanders
                match_score = iou * 0.85 - norm_center_dist * 0.15
                valid_cands.append((match_score, b))

        if len(valid_cands) > 0:
            valid_cands.sort(key=lambda x: x[0], reverse=True)
            tracked_box = valid_cands[0][1]
        # If no box meets IoU >= 0.35, maintain tracked_box (smooth interpolation/persistence)
        raw_tracked_boxes.append(tracked_box)

    raw_tracked_boxes = np.array(raw_tracked_boxes, dtype=np.float32)

    # ---------------------------------------------------------------------
    # Pass 3: Moving Average Smoothing (window = 5) & Tight Padding (0.12 / 0.15)
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

        raw_pose_inputs = pose_processor(images=batch_pil, boxes=batch_crops_subset, return_tensors="pt")
        pose_dtype = next(pose_model.parameters()).dtype
        pose_inputs = {
            k: (v.to(device=device, dtype=pose_dtype) if torch.is_floating_point(v) else v.to(device=device))
            for k, v in raw_pose_inputs.items()
        }
        num_boxes = pose_inputs["pixel_values"].shape[0]
        dataset_index = torch.zeros(num_boxes, dtype=torch.long, device=device)
        
        with torch.no_grad(), torch.autocast(device_type="cuda", dtype=torch.float16, enabled=(device == "cuda")):
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
# 2.5 Universal JSON Sanitizer (removes numpy types, int64, float64, NaNs)
# ---------------------------------------------------------------------------

def sanitize_for_json(obj):
    if isinstance(obj, dict):
        return {str(k): sanitize_for_json(v) for k, v in obj.items()}
    elif isinstance(obj, (list, tuple)):
        return [sanitize_for_json(v) for v in obj]
    elif isinstance(obj, np.integer):
        return int(obj)
    elif isinstance(obj, (float, np.floating)):
        val = float(obj)
        return 0.0 if (np.isnan(val) or np.isinf(val)) else val
    elif isinstance(obj, (bool, np.bool_)):
        return bool(obj)
    elif isinstance(obj, np.ndarray):
        return sanitize_for_json(obj.tolist())
    return obj

def track_load_point_optical_flow(
    frames_rgb: Optional[List[np.ndarray]],
    timestamps: List[float],
    primary_joints: Dict[str, Dict[str, np.ndarray]],
    load_joint: str,
    img_w: int,
    img_h: int
) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
    """
    Sub-pixel Optical Flow Load Tracker (Lucas-Kanade cv2.calcOpticalFlowPyrLK).
    Rastrea el punto de aplicación de la carga (ej. muñeca o cadera).
    Si la confianza de ViTPose cae (<0.45), el flujo óptico mantiene la trayectoria continua y suave.
    Devuelve (load_x, load_y, smooth_vel_px_s).
    """
    n_frames = len(timestamps)
    raw_x = np.array(primary_joints[load_joint]["x"], dtype=np.float64, copy=True)
    raw_y = np.array(primary_joints[load_joint]["y"], dtype=np.float64, copy=True)
    raw_scores = np.array(primary_joints[load_joint].get("score", np.ones(n_frames)), dtype=np.float64, copy=True)

    if frames_rgb is None or len(frames_rgb) != n_frames or n_frames == 0:
        med_x = apply_median_filter_1d(raw_x, size=3)
        med_y = apply_median_filter_1d(raw_y, size=3)
        smooth_lx = apply_zero_phase_butterworth_continuous(med_x, fs=15.0, cutoff=2.0)
        smooth_ly = apply_zero_phase_butterworth_continuous(med_y, fs=15.0, cutoff=2.0)
        if n_frames > 1:
            dt = np.gradient(timestamps)
            dt = np.where(dt <= 0, 1.0 / 15.0, dt)
            dx = np.gradient(smooth_lx * img_w) / dt
            dy = np.gradient(smooth_ly * img_h) / dt
            vel = apply_zero_phase_butterworth_continuous(np.hypot(dx, dy), fs=15.0, cutoff=2.0)
            init_f = min(int(round(15.0 * 0.4)), n_frames - 1)
            if init_f > 0:
                vel[:init_f] = vel[init_f]
        else:
            vel = np.zeros(n_frames)
        return smooth_lx, smooth_ly, vel

    load_x = raw_x.copy()
    load_y = raw_y.copy()

    prev_gray = None
    prev_pt = None

    for f in range(n_frames):
        frame = frames_rgb[f]
        curr_gray = cv2.cvtColor(frame, cv2.COLOR_RGB2GRAY) if len(frame.shape) == 3 else frame
        
        vx = float(load_x[f] * img_w)
        vy = float(load_y[f] * img_h)
        score = float(raw_scores[f]) if f < len(raw_scores) else 0.5

        if score >= 0.45 or prev_pt is None or prev_gray is None:
            prev_pt = np.array([[vx, vy]], dtype=np.float32)
        else:
            try:
                next_pt, status, _ = cv2.calcOpticalFlowPyrLK(
                    prev_gray, curr_gray, prev_pt, None,
                    winSize=(21, 21), maxLevel=3,
                    criteria=(cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, 20, 0.03)
                )
                if status is not None and status[0][0] == 1:
                    fx = float(next_pt[0][0]) / max(img_w, 1)
                    fy = float(next_pt[0][1]) / max(img_h, 1)
                    load_x[f] = float(np.clip(fx, 0.0, 1.0))
                    load_y[f] = float(np.clip(fy, 0.0, 1.0))
                    prev_pt = next_pt
                else:
                    prev_pt = np.array([[vx, vy]], dtype=np.float32)
            except Exception:
                prev_pt = np.array([[vx, vy]], dtype=np.float32)
        prev_gray = curr_gray

    # Recorte de outliers (mediana móvil ventana 3 antes del Butterworth) sobre trayectoria de carga
    med_load_x = apply_median_filter_1d(load_x, size=3)
    med_load_y = apply_median_filter_1d(load_y, size=3)
    smooth_lx = apply_zero_phase_butterworth_continuous(med_load_x, fs=15.0, cutoff=2.0)
    smooth_ly = apply_zero_phase_butterworth_continuous(med_load_y, fs=15.0, cutoff=2.0)

    if n_frames > 1:
        dt = np.gradient(timestamps)
        dt = np.where(dt <= 0, 1.0 / 15.0, dt)
        dx = np.gradient(smooth_lx * img_w) / dt
        dy = np.gradient(smooth_ly * img_h) / dt
        vel_raw = np.hypot(dx, dy)
        smooth_vel = apply_zero_phase_butterworth_continuous(vel_raw, fs=15.0, cutoff=2.0)
        # Estabilización inicial (0.4s): amortigua micro-baile inicial del esqueleto al arrancar
        init_frames = min(int(round(15.0 * 0.4)), n_frames - 1)
        if init_frames > 0:
            smooth_vel[:init_frames] = smooth_vel[init_frames]
    else:
        smooth_vel = np.zeros(n_frames)

    return smooth_lx, smooth_ly, smooth_vel

# ---------------------------------------------------------------------------
# 3. Clinical Kinematics Engine (3 Universal Biomechanical Patterns)
# ---------------------------------------------------------------------------

def process_kinematics(
    raw_keypoints: List[Dict[str, Dict[str, float]]],
    timestamps: List[float],
    exercise_type: str = "auto",
    target_muscle: str = "auto",
    load_type: str = "auto",
    athlete_boxes: Optional[List[Dict[str, float]]] = None,
    img_w: int = 1280,
    img_h: int = 720,
    weight_kg: Optional[float] = None,
    target_reps: Optional[int] = None,
    anthropometry: Optional[Dict[str, Any]] = None,
    frames_rgb: Optional[List[np.ndarray]] = None,
    is_manual_override: bool = False,
    gemini_api_key: Optional[str] = None,
    video_path: Optional[str] = None,
    exercise_name: Optional[str] = None,
    run_vlm: bool = False
):
    """
    Capa 1: Visión 2D Pura e Inmutable sobre ViTPose + RT-DETR.
    Prohibido alterar coordenadas 2D o re-proyectar longitudes óseas artificiales.
    Filtro Butterworth 2.0 Hz bidireccional de fase cero sobre coordenadas interpoladas.
    Capa 2: Orquestador Biomecánico Multimodal con Gemini sobre 4 Keyframes.
    """
    n_frames = len(raw_keypoints)
    if n_frames == 0:
        return sanitize_for_json({"fps": 15.0, "duration": 0.0, "total_reps": 0, "repetitions_summary": [], "frames": []})

    vlm_used = False
    vlm_error = None
    vlm_result = None
    total_reps = 0
    repetitions_summary = []
    
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

    canonical_joints = ["shoulder", "elbow", "wrist", "hip", "knee", "ankle", "ear"]

    # Safe universal fallbacks for mechanical helpers
    machine_u_per_frame = None
    svd_force_u = None

    all_smoothed = {}
    
    # 1. Bilateral Keypoint Smoothing (Zero-phase Butterworth 2.0 Hz with linear interpolation for score < 0.25)
    for side in ["left", "right"]:
        for c_name in canonical_joints:
            k_name = f"{side}_{c_name}"
            x_arr = np.array([raw_keypoints[f].get(k_name, raw_keypoints[f].get("nose", {"x": 0.5}))["x"] for f in range(n_frames)], dtype=np.float64)
            y_arr = np.array([raw_keypoints[f].get(k_name, raw_keypoints[f].get("nose", {"y": 0.2}))["y"] for f in range(n_frames)], dtype=np.float64)
            s_arr = np.array([raw_keypoints[f].get(k_name, raw_keypoints[f].get("nose", {"score": 0.5}))["score"] for f in range(n_frames)], dtype=np.float64)
            
            # Max Joint Jump Clamp: if wrist or elbow jumps > 0.07 in 1 frame (clothing flutter / baggy sweatshirt noise), clamp as outlier
            if c_name in ["wrist", "elbow"] and n_frames > 1:
                last_vx = None
                last_vy = None
                for f in range(n_frames):
                    if s_arr[f] >= 0.25:
                        if last_vx is not None:
                            jump = math.hypot(x_arr[f] - last_vx, y_arr[f] - last_vy)
                            if jump > 0.07:
                                s_arr[f] = 0.0  # Mark outlier for smooth interpolation
                                continue
                        last_vx = x_arr[f]
                        last_vy = y_arr[f]

            x_clean = interpolate_isolated_frames(x_arr, s_arr, thresh=0.25)
            y_clean = interpolate_isolated_frames(y_arr, s_arr, thresh=0.25)
            
            # Estabilización: mediana móvil de ventana 3 antes del Butterworth para eliminar micro-baile inicial del esqueleto
            if c_name in ["wrist", "elbow", "shoulder", "hip"]:
                x_clean = apply_median_filter_1d(x_clean, size=3)
                y_clean = apply_median_filter_1d(y_clean, size=3)

            all_smoothed[k_name] = {
                "x": apply_zero_phase_butterworth_segmented(x_clean, scene_cut_indices, fs=15.0, cutoff=2.0),
                "y": apply_zero_phase_butterworth_segmented(y_clean, scene_cut_indices, fs=15.0, cutoff=2.0),
                "score": s_arr
            }
            
    # Head / Nose
    hx_arr = np.array([raw_keypoints[f].get("nose", raw_keypoints[f].get("left_eye", {"x": 0.5}))["x"] for f in range(n_frames)], dtype=np.float64)
    hy_arr = np.array([raw_keypoints[f].get("nose", raw_keypoints[f].get("left_eye", {"y": 0.2}))["y"] for f in range(n_frames)], dtype=np.float64)
    hs_arr = np.array([raw_keypoints[f].get("nose", raw_keypoints[f].get("left_eye", {"score": 0.5}))["score"] for f in range(n_frames)], dtype=np.float64)
    hx_clean = interpolate_isolated_frames(hx_arr, hs_arr, thresh=0.25)
    hy_clean = interpolate_isolated_frames(hy_arr, hs_arr, thresh=0.25)
    smoothed_head = {
        "x": apply_zero_phase_butterworth_segmented(hx_clean, scene_cut_indices, fs=15.0, cutoff=2.0),
        "y": apply_zero_phase_butterworth_segmented(hy_clean, scene_cut_indices, fs=15.0, cutoff=2.0),
        "score": hs_arr
    }

    # Facing direction from head relative to torso center
    head_x_med = float(np.median(smoothed_head["x"]))
    mid_torso_x = float(0.25 * (
        np.median(all_smoothed["left_shoulder"]["x"]) + np.median(all_smoothed["right_shoulder"]["x"]) +
        np.median(all_smoothed["left_hip"]["x"]) + np.median(all_smoothed["right_hip"]["x"])
    ))
    facing_dir = 1.0 if head_x_med >= mid_torso_x else -1.0

    # Pre-calculate bilateral angular ROMs for robust auto-detection
    l_el_angles = np.array([calculate_angle_2d({"x": all_smoothed["left_shoulder"]["x"][f], "y": all_smoothed["left_shoulder"]["y"][f]}, {"x": all_smoothed["left_elbow"]["x"][f], "y": all_smoothed["left_elbow"]["y"][f]}, {"x": all_smoothed["left_wrist"]["x"][f], "y": all_smoothed["left_wrist"]["y"][f]}) for f in range(n_frames)])
    r_el_angles = np.array([calculate_angle_2d({"x": all_smoothed["right_shoulder"]["x"][f], "y": all_smoothed["right_shoulder"]["y"][f]}, {"x": all_smoothed["right_elbow"]["x"][f], "y": all_smoothed["right_elbow"]["y"][f]}, {"x": all_smoothed["right_wrist"]["x"][f], "y": all_smoothed["right_wrist"]["y"][f]}) for f in range(n_frames)])
    l_kn_angles = np.array([calculate_angle_2d({"x": all_smoothed["left_hip"]["x"][f], "y": all_smoothed["left_hip"]["y"][f]}, {"x": all_smoothed["left_knee"]["x"][f], "y": all_smoothed["left_knee"]["y"][f]}, {"x": all_smoothed["left_ankle"]["x"][f], "y": all_smoothed["left_ankle"]["y"][f]}) for f in range(n_frames)])
    r_kn_angles = np.array([calculate_angle_2d({"x": all_smoothed["right_hip"]["x"][f], "y": all_smoothed["right_hip"]["y"][f]}, {"x": all_smoothed["right_knee"]["x"][f], "y": all_smoothed["right_knee"]["y"][f]}, {"x": all_smoothed["right_ankle"]["x"][f], "y": all_smoothed["right_ankle"]["y"][f]}) for f in range(n_frames)])
    l_hp_angles = np.array([calculate_angle_2d({"x": all_smoothed["left_shoulder"]["x"][f], "y": all_smoothed["left_shoulder"]["y"][f]}, {"x": all_smoothed["left_hip"]["x"][f], "y": all_smoothed["left_hip"]["y"][f]}, {"x": all_smoothed["left_knee"]["x"][f], "y": all_smoothed["left_knee"]["y"][f]}) for f in range(n_frames)])
    r_hp_angles = np.array([calculate_angle_2d({"x": all_smoothed["right_shoulder"]["x"][f], "y": all_smoothed["right_shoulder"]["y"][f]}, {"x": all_smoothed["right_hip"]["x"][f], "y": all_smoothed["right_hip"]["y"][f]}, {"x": all_smoothed["right_knee"]["x"][f], "y": all_smoothed["right_knee"]["y"][f]}) for f in range(n_frames)])

    left_el_rom = float(np.percentile(l_el_angles, 90) - np.percentile(l_el_angles, 10))
    right_el_rom = float(np.percentile(r_el_angles, 90) - np.percentile(r_el_angles, 10))
    left_kn_rom = float(np.percentile(l_kn_angles, 90) - np.percentile(l_kn_angles, 10))
    right_kn_rom = float(np.percentile(r_kn_angles, 90) - np.percentile(r_kn_angles, 10))
    left_hp_rom = float(np.percentile(l_hp_angles, 90) - np.percentile(l_hp_angles, 10))
    right_hp_rom = float(np.percentile(r_hp_angles, 90) - np.percentile(r_hp_angles, 10))

    # Clinical Exercise Classification (Kinematic Pattern Recognition)
    vlm_result = None
    vlm_used = False
    vlm_error = None
    kf_bottom_idx = max(0, int(n_frames * 0.66))
    kf_peak_idx = min(n_frames - 1, int(n_frames * 0.95))

    if (exercise_type.lower() in ["auto", "", "none", "null"]) and not is_manual_override:
        # Intelligent Kinematic Fallback: NEVER default to hip_thrust if upper body ROM dominates
        max_elbow_rom = max(left_el_rom, right_el_rom)
        max_leg_rom = max(left_kn_rom, right_kn_rom, left_hp_rom, right_hp_rom)

        if max_elbow_rom > max_leg_rom and max_elbow_rom >= 22.0:
            med_w_x = float(0.5 * (np.median(all_smoothed["left_wrist"]["x"]) + np.median(all_smoothed["right_wrist"]["x"])))
            med_s_x = float(0.5 * (np.median(all_smoothed["left_shoulder"]["x"]) + np.median(all_smoothed["right_shoulder"]["x"])))
            med_w_y = float(0.5 * (np.median(all_smoothed["left_wrist"]["y"]) + np.median(all_smoothed["right_wrist"]["y"])))
            med_s_y = float(0.5 * (np.median(all_smoothed["left_shoulder"]["y"]) + np.median(all_smoothed["right_shoulder"]["y"])))
            med_h_y = float(0.5 * (np.median(all_smoothed["left_hip"]["y"]) + np.median(all_smoothed["right_hip"]["y"])))

            # Check horizontal push (+X in facing direction) OR vertical / contrapicado push (-Y or inverted arms)
            is_horizontal_push = (med_w_x - med_s_x) * facing_dir > 0.02
            is_vertical_push = (med_s_y - med_w_y) > 0.04 or (med_w_y - med_s_y) > 0.04
            is_lying_down = abs(med_s_y - med_h_y) < 0.22 or abs(med_w_y - med_h_y) < 0.22

            if is_horizontal_push or is_vertical_push or is_lying_down:
                exercise_type = "chest_press_machine"
                target_muscle = "chest"
                load_type = "machine"
            else:
                exercise_type = "seated_row"
                target_muscle = "back"
                load_type = "machine"
            print(f"[Auto-Detection Kinematic] Tren Superior detectado por ROM: {exercise_type} ({target_muscle})")
        else:
            min_hip_val = float(min(np.percentile(l_hp_angles, 5), np.percentile(r_hp_angles, 5)))
            min_knee_val = float(min(np.percentile(l_kn_angles, 5), np.percentile(r_kn_angles, 5)))
            max_knee_rom = max(left_kn_rom, right_kn_rom)
            max_hip_rom = max(left_hp_rom, right_hp_rom)

            # Regla de Oro RDL: Si el torso baja horizontal (hip_angle < 80°) con rodilla semirrígida (knee_angle > 105°),
            # clasifica estrictamente como rdl (Peso Muerto Rumano / Glúteo-Isquios), NUNCA sentadilla ni búlgara.
            if (min_hip_val < 80.0 or max_hip_rom > 35.0) and min_knee_val > 105.0:
                exercise_type = "rdl"
                target_muscle = "hamstrings"
                load_type = "free_weight"
                print(f"[Auto-Detection Kinematic] RDL detectado: cadera profunda ({min_hip_val:.1f}° < 80°) y rodilla semirrígida ({min_knee_val:.1f}° > 105°)")
            elif max_knee_rom > 55.0:
                exercise_type = "squat"
                target_muscle = "quads"
                load_type = "free_weight"
            elif max_hip_rom > 40.0 and max_knee_rom < 40.0:
                exercise_type = "rdl"
                target_muscle = "hamstrings"
                load_type = "free_weight"
            else:
                exercise_type = "hip_thrust"
                target_muscle = "glutes"
                load_type = "machine"
            print(f"[Auto-Detection Kinematic] Tren Inferior detectado: {exercise_type} ({target_muscle})")

    canonical_joints = ["shoulder", "elbow", "wrist", "hip", "knee", "ankle", "ear"]
    ex_lower = exercise_type.lower()
    if target_muscle.lower() in ["auto", "", "none"]:
        if any(k in ex_lower for k in ["rdl", "deadlift", "femoral", "curl_femoral", "leg_curl"]):
            target_muscle = "hamstrings"
        elif any(k in ex_lower for k in ["hip_thrust", "glute", "abduction"]):
            target_muscle = "glutes"
        elif any(k in ex_lower for k in ["squat", "leg_press", "hack", "bulgarian", "extension"]):
            target_muscle = "quads"
        elif any(k in ex_lower for k in ["bench", "chest", "incline", "dips", "pec"]):
            target_muscle = "chest"
        elif any(k in ex_lower for k in ["row", "pulldown", "pullup", "pullover", "t_bar", "gironda"]):
            target_muscle = "back"
        elif any(k in ex_lower for k in ["shoulder", "overhead", "lateral", "face_pull"]):
            target_muscle = "shoulders"
        elif any(k in ex_lower for k in ["biceps", "triceps", "curl", "pushdown"]):
            target_muscle = "arms"
    if load_type.lower() in ["auto", "", "none"]:
        if any(k in ex_lower for k in ["cable", "polea"]):
            load_type = "cable"
        elif any(k in ex_lower for k in ["machine", "maquina", "hack", "press_machine", "leg_press", "pec_deck"]):
            load_type = "machine"
        else:
            load_type = "free_weight"
    load_lower = load_type.lower()
    
    # Universal Pattern & Body Region Classification
    UPPER_BODY_KEYWORDS = [
        "chest_press_machine", "bench_press", "incline_press", "machine_dips", "t_bar_row",
        "seated_row", "lat_pulldown", "shoulder_press", "curl", "fly", "press", "bench",
        "incline", "dips", "row", "remo", "pulldown", "pullup", "pullover", "t_bar",
        "gironda", "face_pull", "chest", "shoulder", "deltoid", "triceps", "biceps",
        "pec_deck", "pushdown"
    ]
    LOWER_BODY_EXCLUSIONS = [
        "leg_press", "leg_extension", "leg_curl", "femoral", "squat", "hack", "rdl", "deadlift", "hip_thrust", "lunge", "bulgarian"
    ]

    is_upper_body = (
        any(k in ex_lower for k in UPPER_BODY_KEYWORDS) or
        target_muscle.lower() in ["chest", "pectorals", "back", "lats", "upper_back", "shoulders", "deltoids", "biceps", "triceps"]
    ) and not any(k in ex_lower for k in LOWER_BODY_EXCLUSIONS)
    body_region = "upper" if is_upper_body else "lower"

    is_pattern_a = is_upper_body and (
        any(k in ex_lower for k in [
            "row", "pulldown", "pullup", "pullover", "curl", "t_bar", "gironda", "face_pull"
        ]) or target_muscle.lower() in ["lats", "upper_back", "biceps"]
    )

    is_pattern_b = is_upper_body and not is_pattern_a
    is_pattern_c = not is_upper_body
    is_hip_thrust = (not is_upper_body) and any(k in ex_lower for k in ["hip_thrust", "kas_glute", "glute_bridge", "bridge", "thrust", "kas"])

    vl = vlm_result.get("visual_landmarks", {}) if vlm_result else {}
    vlm_hands_above = bool(
        isinstance(vl, dict) and
        vl.get("hands_y") is not None and
        vl.get("chest_shoulders_y") is not None and
        float(vl["hands_y"]) < float(vl["chest_shoulders_y"])
    )

    is_press_exercise = is_upper_body and (
        any(k in ex_lower for k in ["press", "bench", "incline", "dips", "pec_deck", "chest"]) or
        vlm_hands_above
    )

    hide_neck_line_forced = False
    hide_torso_line_forced = False

    if is_upper_body:
        prox_name = "shoulder"
        mid_name = "elbow"
        dist_name = "wrist"
    else:
        prox_name = "hip"
        mid_name = "knee"
        dist_name = "ankle"

    camera_plane = "lateral_right"
    if vlm_result and vlm_result.get("camera_plane"):
        camera_plane = str(vlm_result["camera_plane"]).strip().lower()
    moment_arms_2d_valid = camera_plane in ("lateral_left", "lateral_right")

    va = vlm_result.get("visual_anchors") if (vlm_result and isinstance(vlm_result.get("visual_anchors"), dict)) else None
    vlm_anchors_received = bool(va is not None and len(va) > 0)
    parsed_bot = {}
    parsed_peak = {}
    if va:
        for k_bot in ["kf_bottom", "bottom", "inflection", "keyframe_3", "kf3"]:
            if k_bot in va and isinstance(va[k_bot], dict):
                parsed_bot = extract_anchor_dict(va[k_bot])
                break
        for k_peak in ["kf_peak", "peak", "lockout", "top", "keyframe_4", "kf4"]:
            if k_peak in va and isinstance(va[k_peak], dict):
                parsed_peak = extract_anchor_dict(va[k_peak])
                break

    has_valid_va = (
        "middle" in parsed_bot and "distal" in parsed_bot and
        "middle" in parsed_peak and "distal" in parsed_peak
    )
    va_bot = parsed_bot
    va_peak = parsed_peak

    # 2. Deterministic Active Limb Selector based on Apparent Optical Length (2D Foreshortening Invariant) & Visibility
    primary_joints = {}
    is_unilateral_flag = False
    hide_torso_line = False

    if is_upper_body:
        left_elbow_angles = l_el_angles
        right_elbow_angles = r_el_angles

        left_rom = left_el_rom
        right_rom = right_el_rom

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

        # Selection of active foreground limb based on horizontal reach |wrist_x - shoulder_x|
        left_horiz_reach = float(np.percentile(np.abs(l_wr_x - l_sh_x), 85))
        right_horiz_reach = float(np.percentile(np.abs(r_wr_x - r_sh_x), 85))

        left_score_total = (left_conf ** 2) * (left_horiz_reach ** 2) * (left_rom + 10.0) * left_pen
        right_score_total = (right_conf ** 2) * (right_horiz_reach ** 2) * (right_rom + 10.0) * right_pen

        if has_valid_va:
            d_left = (
                math.hypot(all_smoothed[f"left_{mid_name}"]["x"][kf_bottom_idx] - float(va_bot["middle"][0]), all_smoothed[f"left_{mid_name}"]["y"][kf_bottom_idx] - float(va_bot["middle"][1])) +
                math.hypot(all_smoothed[f"left_{mid_name}"]["x"][kf_peak_idx] - float(va_peak["middle"][0]), all_smoothed[f"left_{mid_name}"]["y"][kf_peak_idx] - float(va_peak["middle"][1])) +
                math.hypot(all_smoothed[f"left_{dist_name}"]["x"][kf_bottom_idx] - float(va_bot["distal"][0]), all_smoothed[f"left_{dist_name}"]["y"][kf_bottom_idx] - float(va_bot["distal"][1])) +
                math.hypot(all_smoothed[f"left_{dist_name}"]["x"][kf_peak_idx] - float(va_peak["distal"][0]), all_smoothed[f"left_{dist_name}"]["y"][kf_peak_idx] - float(va_peak["distal"][1]))
            )
            d_right = (
                math.hypot(all_smoothed[f"right_{mid_name}"]["x"][kf_bottom_idx] - float(va_bot["middle"][0]), all_smoothed[f"right_{mid_name}"]["y"][kf_bottom_idx] - float(va_bot["middle"][1])) +
                math.hypot(all_smoothed[f"right_{mid_name}"]["x"][kf_peak_idx] - float(va_peak["middle"][0]), all_smoothed[f"right_{mid_name}"]["y"][kf_peak_idx] - float(va_peak["middle"][1])) +
                math.hypot(all_smoothed[f"right_{dist_name}"]["x"][kf_bottom_idx] - float(va_bot["distal"][0]), all_smoothed[f"right_{dist_name}"]["y"][kf_bottom_idx] - float(va_bot["distal"][1])) +
                math.hypot(all_smoothed[f"right_{dist_name}"]["x"][kf_peak_idx] - float(va_peak["distal"][0]), all_smoothed[f"right_{dist_name}"]["y"][kf_peak_idx] - float(va_peak["distal"][1]))
            )
            locked_side = "left" if d_left <= d_right else "right"
            print(f"[Visual Anchors] locked_side seleccionado por 2D Pointing: {locked_side} (d_left={d_left:.3f}, d_right={d_right:.3f})")
        elif vlm_result and vlm_result.get("active_working_side") in ["left", "right"]:
            locked_side = vlm_result["active_working_side"]
        else:
            locked_side = "left" if left_score_total >= right_score_total else "right"
        is_unilateral_flag = bool(left_score_total > 1.5 * right_score_total or right_score_total > 1.5 * left_score_total)

        raw_side_metrics = {
            "body_region": "upper_body",
            "left_conf": round(left_conf, 3),
            "right_conf": round(right_conf, 3),
            "left_apparent_len_2d": round(left_len, 3),
            "right_apparent_len_2d": round(right_len, 3),
            "left_elbow_rom_deg": round(left_rom, 1),
            "right_elbow_rom_deg": round(right_rom, 1),
            "facing_dir": facing_dir
        }
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

        if has_valid_va:
            d_left = (
                math.hypot(all_smoothed[f"left_{mid_name}"]["x"][kf_bottom_idx] - float(va_bot["middle"][0]), all_smoothed[f"left_{mid_name}"]["y"][kf_bottom_idx] - float(va_bot["middle"][1])) +
                math.hypot(all_smoothed[f"left_{mid_name}"]["x"][kf_peak_idx] - float(va_peak["middle"][0]), all_smoothed[f"left_{mid_name}"]["y"][kf_peak_idx] - float(va_peak["middle"][1])) +
                math.hypot(all_smoothed[f"left_{dist_name}"]["x"][kf_bottom_idx] - float(va_bot["distal"][0]), all_smoothed[f"left_{dist_name}"]["y"][kf_bottom_idx] - float(va_bot["distal"][1])) +
                math.hypot(all_smoothed[f"left_{dist_name}"]["x"][kf_peak_idx] - float(va_peak["distal"][0]), all_smoothed[f"left_{dist_name}"]["y"][kf_peak_idx] - float(va_peak["distal"][1]))
            )
            d_right = (
                math.hypot(all_smoothed[f"right_{mid_name}"]["x"][kf_bottom_idx] - float(va_bot["middle"][0]), all_smoothed[f"right_{mid_name}"]["y"][kf_bottom_idx] - float(va_bot["middle"][1])) +
                math.hypot(all_smoothed[f"right_{mid_name}"]["x"][kf_peak_idx] - float(va_peak["middle"][0]), all_smoothed[f"right_{mid_name}"]["y"][kf_peak_idx] - float(va_peak["middle"][1])) +
                math.hypot(all_smoothed[f"right_{dist_name}"]["x"][kf_bottom_idx] - float(va_bot["distal"][0]), all_smoothed[f"right_{dist_name}"]["y"][kf_bottom_idx] - float(va_bot["distal"][1])) +
                math.hypot(all_smoothed[f"right_{dist_name}"]["x"][kf_peak_idx] - float(va_peak["distal"][0]), all_smoothed[f"right_{dist_name}"]["y"][kf_peak_idx] - float(va_peak["distal"][1]))
            )
            locked_side = "left" if d_left <= d_right else "right"
            print(f"[Visual Anchors] locked_side inferior seleccionado por 2D Pointing: {locked_side} (d_left={d_left:.3f}, d_right={d_right:.3f})")
        else:
            is_leg_work_exercise = any(k in ex_lower for k in ["rdl", "deadlift", "rumano", "squat", "bulgarian", "lunge"])
            if is_leg_work_exercise:
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

        raw_side_metrics = {
            "body_region": "lower_body",
            "left_conf": round(left_conf, 3),
            "right_conf": round(right_conf, 3),
            "left_ankle_travel": round(left_ankle_travel, 3),
            "right_ankle_travel": round(right_ankle_travel, 3),
            "left_knee_rom_deg": round(left_rom, 1),
            "right_knee_rom_deg": round(right_rom, 1),
            "facing_dir": facing_dir
        }

    # Native ViTPose Geometry Audit (Strictly Immutable 2D Vision - No Synthetic Joint Alterations)
    proximal_source = "vitpose_native"
    prox_err = 0.0
    debug_pose_audit = {
        "camera_plane": camera_plane,
        "moment_arms_2d_valid": bool(moment_arms_2d_valid),
        "locked_side": locked_side,
        "proximal_source": "vitpose_native",
        "proximal_vitpose_error": 0.0,
        "vlm_anchors_received": False,
        "vlm_proximal_kf_bottom": None
    }
    print(f"[Debug Pose Audit] {debug_pose_audit}")

    # Bind primary joints directly to native ViTPose coordinates of the active locked side (Immutable 2D Vision)
    for c_name in canonical_joints:
        primary_joints[c_name] = {
            "x": all_smoothed[f"{locked_side}_{c_name}"]["x"],
            "y": all_smoothed[f"{locked_side}_{c_name}"]["y"],
            "score": all_smoothed[f"{locked_side}_{c_name}"]["score"]
        }
    primary_joints["hand"] = {
        "x": primary_joints["wrist"]["x"],
        "y": primary_joints["wrist"]["y"],
        "score": primary_joints["wrist"]["score"]
    }
    primary_joints["head"] = smoothed_head

    # Sub-pixel Optical Flow Load Tracker (Wrist for upper body, Hip/Wrist for lower body)
    load_joint = "wrist" if is_upper_body or ("rdl" in ex_lower or "deadlift" in ex_lower) else ("hip" if is_hip_thrust else "wrist")
    smooth_lx, smooth_ly, smooth_vel = track_load_point_optical_flow(
        frames_rgb=frames_rgb,
        timestamps=timestamps,
        primary_joints=primary_joints,
        load_joint=load_joint,
        img_w=img_w,
        img_h=img_h
    )

    # Torso and Neck visibility flags
    mean_hip_score = float(np.mean(primary_joints["hip"]["score"])) if "hip" in primary_joints else 0.0
    is_chest_or_tbar = any(k in ex_lower for k in ["press", "bench", "incline", "chest", "dips", "t_bar", "remo_punta", "barra_t"])
    hide_torso_line = bool(hide_torso_line_forced or is_chest_or_tbar or (is_upper_body and mean_hip_score < 0.60))

    head_score = float(np.mean(smoothed_head["score"]))
    hide_neck_line = bool(
        hide_neck_line_forced or
        head_score < 0.55 or
        is_pattern_b or
        (vlm_result and vlm_result.get("hide_neck_line"))
    )

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

        # Planar angles via calculate_angle_2d (Pure 2D Trigonometry)
        raw_k = calculate_angle_2d(hp, kn, ak)
        raw_h = calculate_angle_2d(sh, hp, kn)
        raw_e = calculate_angle_2d(sh, el, wr)
        raw_hu = calculate_angle_2d(hp, sh, el)
        raw_t = calculate_angle_2d({"x": hp["x"], "y": hp["y"] - 0.2}, hp, sh)

        # Perspective & Oblique camera angle correction for Hip Thrust
        if is_hip_thrust and raw_h < 65.0:
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

    clean_el = apply_zero_phase_butterworth_continuous(apply_median_filter_1d(el_2d, size=3), fs=15.0, cutoff=1.8)
    clean_hp = apply_zero_phase_butterworth_continuous(apply_median_filter_1d(hp_2d, size=3), fs=15.0, cutoff=1.8)
    clean_kn = apply_zero_phase_butterworth_continuous(apply_median_filter_1d(kn_2d, size=3), fs=15.0, cutoff=1.8)
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
        # Combinar ángulo de flexión/extensión del codo con desplazamiento a lo largo del eje principal de empuje PCA
        wr_x = primary_joints["wrist"]["x"]
        wr_y = primary_joints["wrist"]["y"]
        if len(wr_x) > 5 and np.ptp(wr_x) + np.ptp(wr_y) > 0.02:
            wr_pts = np.column_stack([wr_x - np.mean(wr_x), wr_y - np.mean(wr_y)])
            cov = np.cov(wr_pts, rowvar=False)
            eigvals, eigvecs = np.linalg.eigh(cov)
            v_push = eigvecs[:, int(np.argmax(eigvals))]
            disp_pca = wr_pts @ v_push
            if len(clean_el) > 1:
                corr = np.corrcoef(disp_pca, clean_el)[0, 1]
                if not np.isnan(corr) and corr < 0:
                    disp_pca = -disp_pca
            el_range = max(10.0, float(np.percentile(clean_el, 90) - np.percentile(clean_el, 10)))
            pca_range = max(1e-4, float(np.percentile(disp_pca, 90) - np.percentile(disp_pca, 10)))
            disp_scaled = (disp_pca - np.median(disp_pca)) / pca_range * el_range + np.median(clean_el)
            disp_smooth = apply_zero_phase_butterworth_continuous(disp_scaled, fs=15.0, cutoff=1.8)
            clean_primary = 0.70 * clean_el + 0.30 * disp_smooth
        else:
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

    # 5. Peak-Trough Repetition Detection (after auto-trimming unstable/no-person frames)
    valid_start_idx, valid_end_idx = compute_valid_frame_bounds(primary_joints, timestamps)
    signal_range = float(np.max(clean_curve[valid_start_idx : valid_end_idx + 1]) - np.min(clean_curve[valid_start_idx : valid_end_idx + 1]))
    t_min_bound = max(timestamps[valid_start_idx] + 0.25, timestamps[0] + 0.35) if timestamps else 0.35
    t_max_bound = min(timestamps[valid_end_idx] - 0.20, timestamps[-1] - 0.25) if timestamps else 29.75

    min_rep_frames = max(12, int(15.0 * 0.85))

    valid_curve = clean_curve[valid_start_idx : valid_end_idx + 1]
    p10 = float(np.percentile(valid_curve, 10))
    p90 = float(np.percentile(valid_curve, 90))
    eff_range = max(p90 - p10, 8.0)

    if is_pattern_a:
        # Lower prominence (max 20.0) for back/diagonal views where perspective compresses angular range
        target_prom = max(8.0, min(20.0, eff_range * 0.20))
    elif is_pattern_b:
        target_prom = max(8.0, min(18.0, eff_range * 0.16))
    elif is_hip_thrust:
        target_prom = max(12.0, min(26.0, eff_range * 0.20))
    else:
        target_prom = max(10.0, min(20.0, eff_range * 0.20))

    pks, _ = scipy.signal.find_peaks(
        clean_curve,
        prominence=target_prom,
        distance=min_rep_frames
    )
    in_bounds = [p for p in pks if t_min_bound <= timestamps[p] <= t_max_bound]

    # Fallback for subtle/slow executions
    if len(in_bounds) < 2 and eff_range >= 10.0:
        pks_soft, _ = scipy.signal.find_peaks(
            clean_curve,
            prominence=max(7.0, target_prom * 0.60),
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
            if is_pattern_b or is_pattern_a:
                # Lockout check: between two press/row valleys, check extension with perspective-safe threshold
                crest_val = float(np.max(clean_primary[prev_p : p + 1]))
                if crest_val < min(85.0, clean_primary[prev_p] + 8.0):
                    # Incomplete extension, sticking point or pause: merge and keep the deeper inflection point
                    if clean_primary[p] < clean_primary[prev_p]:
                        filtered_peaks[-1] = p
                    continue

            valley_val = float(np.min(clean_curve[prev_p : p + 1]))
            dip_from_prev = clean_curve[prev_p] - valley_val
            dip_from_curr = clean_curve[p] - valley_val
            min_dip_required = max(3.5, target_prom * 0.40)
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

    # Force Vector Determination (Adaptive Extrema & Machine Plane):
    if is_pattern_b:
        # En Empujes: el atleta empuja desde P_flexed hacia P_extended.
        # Prohibido usar vector vertical (0, 1) cuando el empuje tiene componente horizontal.
        if p_ext is not None and p_flx is not None:
            push_dir = p_ext - p_flx
            norm_push = float(np.linalg.norm(push_dir))
            if norm_push > 0.02:
                u_resist = -push_dir / norm_push
                is_horiz_machine = any(k in ex_lower for k in [
                    "chest_press", "press_pecho", "press_maquina", "seated_row", "remo_sentado", "convergente"
                ]) or (is_pattern_b and abs(u_resist[0]) > 0.6)
                if is_horiz_machine and abs(u_resist[0]) > 0.05:
                    max_abs_uy = 0.35 * abs(u_resist[0])
                    if abs(u_resist[1]) > max_abs_uy:
                        u_resist[1] = np.clip(u_resist[1], -max_abs_uy, max_abs_uy)
                        u_resist = u_resist / np.linalg.norm(u_resist)
            else:
                u_resist = np.array([-facing_forward_x * 0.95, 0.20], dtype=np.float64)
                u_resist = u_resist / np.linalg.norm(u_resist)
        else:
            u_resist = np.array([-facing_forward_x * 0.95, 0.20], dtype=np.float64)
            u_resist = u_resist / np.linalg.norm(u_resist)
        force_dx = float(u_resist[0])
        force_dy = float(u_resist[1])
        force_dir_name = "machine_push_resistance"
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
            # Search backwards to video onset to find true onset of movement
            search_start = 0
            left_search = clean_curve[search_start : p]
            local_min_offset = int(np.argmin(left_search)) if len(left_search) > 0 else 0
            cand_start = search_start + local_min_offset
        else:
            prev_bound = valid_peaks[i - 1]
            left_search = clean_curve[prev_bound : p]
            start_offset = int(np.argmin(left_search)) if len(left_search) > 0 else 0
            cand_start = prev_bound + start_offset

        # Refine onset: find where angular velocity rises above 5.0 deg/s or displacement occurs moving towards p
        # (Detects first eccentric/concentric phase at t=0.5s - 1.5s without getting stuck in IDLE)
        start_frame = cand_start
        if i == 0 and is_pattern_b:
            init_ang = clean_primary[0]
            for f_scan in range(0, p):
                if abs(clean_primary[f_scan] - init_ang) >= 20.0 or ang_vel[f_scan] >= 5.0 or abs(clean_primary[f_scan] - clean_primary[cand_start]) >= 3.0:
                    start_frame = max(0, f_scan - 1)
                    break
        else:
            for f_scan in range(cand_start, p):
                if ang_vel[f_scan] >= 5.0 or abs(clean_primary[f_scan] - clean_primary[cand_start]) >= 3.0:
                    start_frame = max(0, f_scan - 1)
                    break
        
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
            concentric_time_s = round(max(0.20, t_inflect - t_start), 2)
            eccentric_time_s = round(max(0.20, t_end - t_inflect), 2)
            delta_angle_conc = abs(clean_primary[bottom_frame] - clean_primary[start_frame])
        elif is_pattern_b:
            # Pattern B (Empuje/Presses): Lowering is eccentric, pressing up is concentric
            eccentric_time_s = round(max(0.20, t_inflect - t_start), 2)
            concentric_time_s = round(max(0.20, t_end - t_inflect), 2)
            delta_angle_conc = abs(clean_primary[end_frame] - clean_primary[bottom_frame])
        else:
            # Pattern C (Tren inferior):
            if is_hip_thrust:
                concentric_time_s = round(max(0.20, t_inflect - t_start), 2)
                eccentric_time_s = round(max(0.20, t_end - t_inflect), 2)
                delta_angle_conc = abs(clean_primary[bottom_frame] - clean_primary[start_frame])
            else:
                eccentric_time_s = round(max(0.20, t_inflect - t_start), 2)
                concentric_time_s = round(max(0.20, t_end - t_inflect), 2)
                delta_angle_conc = abs(clean_primary[end_frame] - clean_primary[bottom_frame])

        # Reject micro-reps, twitches, or incomplete hesitations
        if rom_deg < 16.0 or (t_end - t_start) < 0.75 or (is_pattern_b and concentric_time_s < 0.20):
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

        status = "OPTIMAL"
        dominant_joint = "CADERA" if not is_upper_body else "HOMBRO"
        torque_bias = "GLOBAL"
        muscle_focus_txt = "GLOBAL"
        recom = "Técnica fluida y controlada."
        d_sh = 0.0
        d_el = 0.0
        d_hp = 0.0
        d_kn = 0.0
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
            d_orth_sh = float(abs((sh_x_inf - hx_inf) * u_fy - (sh_y_inf - hy_inf) * u_fx))
            d_orth_el = float(abs((el_x_inf - hx_inf) * u_fy - (el_y_inf - hy_inf) * u_fx))
            
            hum_len = float(math.hypot(sh_x_inf - el_x_inf, sh_y_inf - el_y_inf))
            hum_vx = el_x_inf - sh_x_inf
            hum_vy = el_y_inf - sh_y_inf
            sin_hum = float(abs(hum_vx * u_fy - hum_vy * u_fx) / max(hum_len, 1e-4))
            
            # Avoid force line passing above shoulder in 2D by projecting humerus orthogonal to push axis
            # Ensures physiological split 62% - 75% Pectoral vs 25% - 38% Tríceps
            d_sh = float(max(d_orth_sh, 0.55 * hum_len * max(sin_hum, 0.40), d_orth_el * 1.65))
            d_el = float(d_orth_el)
            d_hp = 0.0
            d_kn = 0.0

            tot_d = d_sh + d_el
            if tot_d > 0.005:
                pectoral_share = round((d_sh / tot_d) * 100.0, 1)
                triceps_share = round((d_el / tot_d) * 100.0, 1)
            else:
                pectoral_share = 70.0
                triceps_share = 30.0

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

            elif any(k in ex_lower for k in ["rdl", "deadlift", "peso_muerto", "rumano"]) or (inflect_hip < 80.0 and inflect_knee > 105.0):
                dominant_joint = "CADERA"
                torque_bias = "GLÚTEO / ISQUIOS"
                muscle_focus_txt = "GLÚTEO / ISQUIOS"
                recom = "Bisagra de cadera óptima con flexión de rodilla contenida (>105°): máxima palanca en glúteos e isquiosurales."
                status = "OPTIMAL"
                d_sh = 0.0
                d_el = 0.0
                d_hp = float(abs(hp_x_inf - wr_x_inf))
                d_kn = float(abs(kn_x_inf - wr_x_inf))


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

        # Sub-pixel optical flow load metrics for this rep
        is_press_or_squat = is_pattern_b or (is_pattern_c and not is_hip_thrust)
        con_start = bottom_frame if is_press_or_squat else start_frame
        con_end = end_frame if is_press_or_squat else bottom_frame
        idx_low = min(con_start, con_end)
        idx_high = max(con_start, con_end)

        rep_rom_px = round(float(math.hypot(
            smooth_lx[con_end] * img_w - smooth_lx[con_start] * img_w,
            smooth_ly[con_end] * img_h - smooth_ly[con_start] * img_h
        )), 1)

        con_disp_px = float(math.hypot(
            smooth_lx[con_end] * img_w - smooth_lx[con_start] * img_w,
            smooth_ly[con_end] * img_h - smooth_ly[con_start] * img_h
        ))
        mean_con_vel = round(float(con_disp_px / max(concentric_time_s, 0.20)), 1)

        # Filtrar picos de velocidad ignorando los primeros 0.4s del vídeo para evitar saltos iniciales
        valid_peak_frames = [f for f in range(idx_low, idx_high + 1) if (timestamps[f] - timestamps[0]) >= 0.4]
        if valid_peak_frames:
            peak_con_vel = float(np.max(smooth_vel[valid_peak_frames]))
        elif idx_high >= idx_low:
            con_vel_slice = smooth_vel[idx_low : idx_high + 1]
            peak_con_vel = float(np.max(con_vel_slice)) if len(con_vel_slice) > 0 else 0.0
        else:
            peak_con_vel = 0.0

        st_sec = None
        # Regla biomecánica obligatoria:
        # El sticking point solo puede detectarse estrictamente durante la fase CONCENTRIC,
        # recortando el primer 20% y el último 20% del tiempo concéntrico
        # (nunca en el bloqueo superior ni en el cambio de dirección inferior, ni en ECCENTRIC/IDLE).
        con_len = idx_high - idx_low + 1
        if con_len >= 5 and peak_con_vel > 1e-3:
            trim_start = int(round(con_len * 0.20))
            trim_end = max(trim_start + 1, int(round(con_len * 0.80)))
            trimmed_slice = smooth_vel[idx_low + trim_start : idx_low + trim_end]
            if len(trimmed_slice) > 0:
                min_local_v = float(np.min(trimmed_slice))
                min_offset = int(np.argmin(trimmed_slice))
                st_frame = idx_low + trim_start + min_offset

                # Solo se marca si existe una caída real de velocidad (< 65% de la velocidad pico de esa misma repetición)
                if min_local_v < (0.65 * peak_con_vel):
                    st_sec = round(float(timestamps[st_frame]), 3) if st_frame < len(timestamps) else None

        rep_v_filtered = [smooth_vel[f] for f in range(start_frame, end_frame + 1) if (timestamps[f] - timestamps[0]) >= 0.4]
        max_v = float(np.max(rep_v_filtered)) if len(rep_v_filtered) > 0 and np.max(rep_v_filtered) > 0 else (
            float(np.max(smooth_vel[start_frame : end_frame + 1])) if len(smooth_vel[start_frame : end_frame + 1]) > 0 else 1.0
        )
        if max_v <= 0:
            max_v = 1.0

        rep_path_points = [
            [
                round(float(smooth_lx[f]), 4),
                round(float(smooth_ly[f]), 4),
                round(float(np.clip(smooth_vel[f] / max_v, 0.0, 1.0)), 3)
            ]
            for f in range(start_frame, end_frame + 1)
        ]

        rep_data = {
            "rep_number": rep_idx,
            "rep_index": rep_idx,
            "start_time": round(t_start, 2),
            "start_sec": round(t_start, 3),
            "inflection_time": round(t_inflect, 2),
            "inflection_sec": round(t_inflect, 3),
            "end_time": round(t_end, 2),
            "peak_sec": round(t_end, 3),
            "start_frame": start_frame,
            "bottom_frame": bottom_frame,
            "end_frame": end_frame,
            "valley_idx": bottom_frame if is_pattern_b else start_frame,
            "peak_idx": end_frame if is_pattern_b else bottom_frame,
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
            "rom_px": rep_rom_px,
            "rom_pct_of_rep1": 100.0,
            "mean_concentric_vel": mean_con_vel,
            "sticking_point_sec": st_sec,
            "path_points": rep_path_points,
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

    # 7.5 Validación estricta de repeticiones completadas y eliminación de tramo final de rack / reposo
    if len(repetitions_summary) >= 1:
        med_rom_val = float(np.median([r["rom_deg"] for r in repetitions_summary]))
        valid_reps = []
        n_reps_total = len(repetitions_summary)
        for idx, rep in enumerate(repetitions_summary):
            # Solo válida si completa el valle y la concéntrica alcanzando >= 65% del ROM mediano
            # En series muy cortas (1-2), permitir >= 60% si la concéntrica duró >= 0.20s
            # En press inclinado y empujes, aceptar siempre cualquier ciclo completo que supere 35° de amplitud angular
            min_rom_ratio = 0.65 if n_reps_total >= 3 else 0.60
            if (rep["rom_deg"] < min_rom_ratio * med_rom_val and rep["rom_deg"] < 35.0) or rep["concentric_sec"] < 0.20:
                continue
            # Prune terminal racking/suelta artifact ONLY if amplitude < 75% of median ROM
            if idx == n_reps_total - 1 and n_reps_total > 1:
                t_end_rep = rep.get("end_time_sec", timestamps[rep["end_frame"]])
                if (timestamps[-1] - t_end_rep < 0.5) and (rep["rom_deg"] < 0.75 * med_rom_val):
                    continue
            valid_reps.append(rep)

        if len(valid_reps) > 0:
            for new_i, r in enumerate(valid_reps):
                r["rep_number"] = new_i + 1
                r["rep_index"] = new_i + 1
                r["rep_num"] = new_i + 1
            repetitions_summary = valid_reps

        # Reconstruir frame_rep_map y frame_phase_map estrictamente con repeticiones validadas
        frame_rep_map = [0] * n_frames
        frame_phase_map = ["IDLE"] * n_frames
        for r in repetitions_summary:
            sf = r["start_frame"]
            ef = r["end_frame"]
            bf = r["bottom_frame"]
            r_idx = r["rep_number"]
            for f in range(sf, min(n_frames, ef + 1)):
                frame_rep_map[f] = r_idx
                if is_pattern_a or is_hip_thrust:
                    if f < bf:
                        frame_phase_map[f] = "CONCENTRIC"
                    elif f == bf:
                        frame_phase_map[f] = "INFLECTION"
                    else:
                        frame_phase_map[f] = "ECCENTRIC"
                else:
                    if f < bf:
                        frame_phase_map[f] = "ECCENTRIC"
                    elif f == bf:
                        frame_phase_map[f] = "INFLECTION"
                    else:
                        frame_phase_map[f] = "CONCENTRIC"

    total_reps = len(repetitions_summary)

    # Issue 3: Refine Force Vector strictly from Validated Repetitions (eliminating IDLE/intro frames)
    if is_upper_body and len(repetitions_summary) > 0:
        valley_indices = [r["valley_idx"] for r in repetitions_summary if "valley_idx" in r]
        peak_indices = [r["peak_idx"] for r in repetitions_summary if "peak_idx" in r]
        if len(valley_indices) > 0 and len(peak_indices) > 0:
            wrist_x = primary_joints["wrist"]["x"]
            wrist_y = primary_joints["wrist"]["y"]
            P_flexed = np.array([float(np.median(wrist_x[valley_indices])), float(np.median(wrist_y[valley_indices]))])
            P_extended = np.array([float(np.median(wrist_x[peak_indices])), float(np.median(wrist_y[peak_indices]))])

            if is_pattern_b:
                push_dir = P_extended - P_flexed
                norm_push = float(np.linalg.norm(push_dir))
                if norm_push > 0.02:
                    u_resist = -push_dir / norm_push
                    # En ejercicios de empuje horizontal sentado (chest_press_machine, seated_row),
                    # limita la inclinación vertical máxima (|uy| <= 0.35 * |ux|) para que la flecha
                    # amarilla siga fielmente el plano horizontal/convergente y nunca apunte al suelo:
                    is_horiz_machine = any(k in ex_lower for k in [
                        "chest_press", "press_pecho", "press_maquina", "seated_row", "remo_sentado", "convergente"
                    ]) or (is_pattern_b and abs(u_resist[0]) > 0.6)
                    if is_horiz_machine and abs(u_resist[0]) > 0.05:
                        max_abs_uy = 0.35 * abs(u_resist[0])
                        if abs(u_resist[1]) > max_abs_uy:
                            u_resist[1] = np.clip(u_resist[1], -max_abs_uy, max_abs_uy)
                            u_resist = u_resist / np.linalg.norm(u_resist)
                    force_dx = float(u_resist[0])
                    force_dy = float(u_resist[1])
                    force_dir_name = "machine_push_resistance"
            elif is_pattern_a:
                pull_dir = P_extended - P_flexed
                norm_pull = float(np.linalg.norm(pull_dir))
                if norm_pull > 0.02:
                    u_pull = pull_dir / norm_pull
                    if (is_t_bar or "row" in ex_lower or "remo" in ex_lower) and u_pull[1] < 0.15:
                        u_pull[1] = 0.35
                        u_pull = u_pull / np.linalg.norm(u_pull)
                    force_dx = float(u_pull[0])
                    force_dy = float(u_pull[1])
                    force_dir_name = "adaptive_pull_resistance"

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

    intensity_metrics, rep_comparison, estimated_1rm_kg = compute_vbt_and_rom_metrics(
        repetitions_summary=repetitions_summary,
        weight_kg=weight_kg
    )

    # Extract 2 Key Static Snapshots (Max Stretch & Max Peak / Lockout)
    rep_target = repetitions_summary[min(1, total_reps - 1)] if total_reps >= 1 else None
    if rep_target:
        sf_t = max(0, int(rep_target.get("start_frame", 0)))
        ef_t = min(n_frames - 1, int(rep_target.get("end_frame", n_frames - 1)))
        if is_pattern_b and ef_t > sf_t:
            # Push exercises: Bottom = min elbow angle, Lockout = max elbow angle (extended arms)
            f_stretch, f_peak = extract_push_snapshot_frames(clean_el, sf_t, ef_t, n_frames)
        else:
            f_stretch = rep_target.get("bottom_frame", int(n_frames * 0.5))
            f_peak = rep_target.get("end_frame" if is_pattern_b else "start_frame", int(n_frames * 0.8))
    else:
        f_stretch = max(0, min(n_frames - 1, int(n_frames * 0.33)))
        f_peak = max(0, min(n_frames - 1, int(n_frames * 0.66)))

    f_stretch = max(0, min(n_frames - 1, f_stretch))
    f_peak = max(0, min(n_frames - 1, f_peak))

    snapshot_stretch_b64 = encode_snapshot_jpeg_b64(frames_rgb[f_stretch], max_dim=480, quality=80) if frames_rgb and f_stretch < len(frames_rgb) else None
    snapshot_peak_b64 = encode_snapshot_jpeg_b64(frames_rgb[f_peak], max_dim=480, quality=80) if frames_rgb and f_peak < len(frames_rgb) else None

    canonical_joints_list = ["shoulder", "elbow", "wrist", "hip", "knee", "ankle", "ear"]
    joints_stretch = {
        c_name: [round(float(primary_joints[c_name]["x"][f_stretch]), 4), round(float(primary_joints[c_name]["y"][f_stretch]), 4)]
        for c_name in canonical_joints_list if c_name in primary_joints
    }
    joints_peak = {
        c_name: [round(float(primary_joints[c_name]["x"][f_peak]), 4), round(float(primary_joints[c_name]["y"][f_peak]), 4)]
        for c_name in canonical_joints_list if c_name in primary_joints
    }

    # 8.5 Layer 2: Multimodal Biomechanical Brain (Gemini Flash Video or Clinical Deterministic Audit)
    vlm_result = None
    vlm_used = False
    vlm_error = None
    vlm_mode = "deterministic"
    vlm_model_used = None
    if run_vlm and gemini_api_key:
        try:
            vlm_res, vlm_err, vlm_mode_detected, vlm_model_detected = analyze_biomechanics_with_vlm(
                video_path=video_path,
                exercise_type=exercise_type,
                total_reps=total_reps,
                intensity_metrics=intensity_metrics,
                repetitions_summary=repetitions_summary,
                rep_comparison=rep_comparison,
                gemini_api_key=gemini_api_key,
                exercise_name=exercise_name
            )
            if vlm_res:
                vlm_result = vlm_res
                vlm_used = True
                vlm_error = None
                vlm_mode = vlm_mode_detected
                vlm_model_used = vlm_model_detected
                if is_manual_override or exercise_type.lower() not in ["auto", "", "none"]:
                    vlm_result["detected_exercise_id"] = exercise_type
                    vlm_result["detected_exercise_name"] = exercise_name or vlm_result.get("detected_exercise_name", exercise_type.replace("_", " ").title())
                elif vlm_result.get("detected_exercise_id"):
                    exercise_type = vlm_result["detected_exercise_id"]
            else:
                vlm_used = False
                vlm_error = vlm_err
                vlm_mode = "fallback"
                vlm_model_used = None
                vlm_result = generate_deterministic_clinical_audit(
                    exercise_type=exercise_type,
                    body_region=body_region,
                    total_reps=total_reps,
                    intensity_metrics=intensity_metrics,
                    repetitions_summary=repetitions_summary,
                    rep_comparison=rep_comparison,
                    exercise_name=exercise_name
                )
        except Exception as e_vlm:
            print(f"[VLM Layer 2] Error during Gemini call: {e_vlm}")
            vlm_used = False
            vlm_error = str(e_vlm)
            vlm_mode = "fallback"
            vlm_model_used = None
            vlm_result = generate_deterministic_clinical_audit(
                exercise_type=exercise_type,
                body_region=body_region,
                total_reps=total_reps,
                intensity_metrics=intensity_metrics,
                repetitions_summary=repetitions_summary,
                rep_comparison=rep_comparison,
                exercise_name=exercise_name
            )
    else:
        vlm_result = generate_deterministic_clinical_audit(
            exercise_type=exercise_type,
            body_region=body_region,
            total_reps=total_reps,
            intensity_metrics=intensity_metrics,
            repetitions_summary=repetitions_summary,
            rep_comparison=rep_comparison,
            exercise_name=exercise_name
        )

    # Actualizar debug_pose_audit con datos del VLM para auditoría y visualización
    debug_pose_audit["vlm_error"] = str(vlm_error) if vlm_error else None
    debug_pose_audit["vlm_mode"] = vlm_mode
    debug_pose_audit["vlm_model_used"] = vlm_model_used
    print(f"[MIA Audit Backend] {debug_pose_audit}")
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
                u_fx = float(force_dx)
                u_fy = float(force_dy)
                cur_d_orth_sh = float(abs((sh_x - cur_hx) * u_fy - (sh_y - cur_hy) * u_fx))
                cur_d_orth_el = float(abs((el_x - cur_hx) * u_fy - (el_y - cur_hy) * u_fx))
                cur_hum_len = float(math.hypot(sh_x - el_x, sh_y - el_y))
                cur_hum_vx = el_x - sh_x
                cur_hum_vy = el_y - sh_y
                cur_sin_hum = float(abs(cur_hum_vx * u_fy - cur_hum_vy * u_fx) / max(cur_hum_len, 1e-4))
                cur_d_sh = float(max(cur_d_orth_sh, 0.55 * cur_hum_len * max(cur_sin_hum, 0.40), cur_d_orth_el * 1.65))
                cur_d_el = float(cur_d_orth_el)
                tot_d = cur_d_sh + cur_d_el
                if tot_d > 0.005:
                    fb_pec = round((cur_d_sh / tot_d) * 100.0, 1)
                    fb_tri = round((cur_d_el / tot_d) * 100.0, 1)
                else:
                    fb_pec = 70.0
                    fb_tri = 30.0
                fb_bias = "PECTORAL MAYOR" if fb_pec >= 50.0 else "TRÍCEPS BRAQUIAL"

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
                ht_status = "OPTIMAL"
                ht_bias = "GLÚTEO MAYOR"
                ht_recom = f"Alineación articular óptima ({round(eval_knee)}° en rodilla). Bloqueo concéntrico directo sobre glúteo mayor."
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
                f_d_orth_sh = abs((sh_x - cur_hx) * u_fy - (sh_y - cur_hy) * u_fx)
                f_d_orth_el = abs((el_x - cur_hx) * u_fy - (el_y - cur_hy) * u_fx)
                f_hum_len = math.hypot(sh_x - el_x, sh_y - el_y)
                f_sin_hum = abs((el_x - sh_x) * u_fy - (el_y - sh_y) * u_fx) / max(f_hum_len, 1e-4)
                f_d_sh = max(f_d_orth_sh, 0.55 * f_hum_len * max(f_sin_hum, 0.40), f_d_orth_el * 1.65)
                f_d_el = f_d_orth_el
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

        # Force vector origin and normalized moment arm / percentage metadata
        if is_upper_body:
            anchor_x = cur_hx
            anchor_y = cur_hy
            d_primary = f_d_sh * 1000.0
            d_secondary = f_d_el * 1000.0
            tot_d = f_d_sh + f_d_el
            if is_pattern_a or any(k in ex_lower for k in ["row", "remo", "pull", "jalon", "t_bar"]):
                primary_short_label = "EA" if is_upper_back_series else "D"
                secondary_short_label = "B"
                if tot_d > 0.005:
                    primary_pct = round((f_d_sh / tot_d) * 100.0, 1)
                    secondary_pct = round((f_d_el / tot_d) * 100.0, 1)
                else:
                    primary_pct = 85.0
                    secondary_pct = 15.0
            else:
                primary_short_label = "P"
                secondary_short_label = "T"
                if tot_d > 0.005:
                    primary_pct = round((f_d_sh / tot_d) * 100.0, 1)
                    secondary_pct = round((f_d_el / tot_d) * 100.0, 1)
                else:
                    primary_pct = 70.0
                    secondary_pct = 30.0
        elif is_hip_thrust:
            anchor_x = hp_x
            anchor_y = hp_y
            d_primary = 80.0
            d_secondary = 20.0
            primary_pct = 85.0
            secondary_pct = 15.0
            primary_short_label = "G"
            secondary_short_label = "R"
        elif any(k in ex_lower for k in ["deadlift", "rdl", "rumano"]):
            anchor_x = wr_x
            anchor_y = wr_y
            d_primary = f_d_hip * 1000.0
            d_secondary = f_d_knee * 1000.0
            tot_d = f_d_hip + f_d_knee
            primary_short_label = "I"
            secondary_short_label = "G"
            if tot_d > 0.005:
                primary_pct = round((f_d_hip / tot_d) * 100.0, 1)
                secondary_pct = round((f_d_knee / tot_d) * 100.0, 1)
            else:
                primary_pct = 65.0
                secondary_pct = 35.0
        else:
            anchor_x = sh_x
            anchor_y = sh_y
            d_primary = f_d_knee * 1000.0
            d_secondary = f_d_hip * 1000.0
            tot_d = f_d_knee + f_d_hip
            primary_short_label = "C"
            secondary_short_label = "G"
            if tot_d > 0.005:
                primary_pct = round((f_d_knee / tot_d) * 100.0, 1)
                secondary_pct = round((f_d_hip / tot_d) * 100.0, 1)
            else:
                primary_pct = 70.0
                secondary_pct = 30.0

        fv_ux = float(cur_force_dx)
        fv_uy = float(cur_force_dy)
        fv_norm = math.hypot(fv_ux, fv_uy)
        if fv_norm > 1e-4:
            fv_ux /= fv_norm
            fv_uy /= fv_norm
        else:
            fv_ux = 1.0 if is_upper_body else 0.0
            fv_uy = 0.0 if is_upper_body else 1.0

        ear_raw_x = primary_joints["ear"]["x"][f] if "ear" in primary_joints else smoothed_head["x"][f]
        ear_raw_y = primary_joints["ear"]["y"][f] if "ear" in primary_joints else smoothed_head["y"][f]

        sh_x_c = min(1.0, max(0.0, float(sh_x)))
        sh_y_c = min(1.0, max(0.0, float(sh_y)))
        el_x_c = min(1.0, max(0.0, float(el_x)))
        el_y_c = min(1.0, max(0.0, float(el_y)))
        wr_x_c = min(1.0, max(0.0, float(wr_x)))
        wr_y_c = min(1.0, max(0.0, float(wr_y)))
        hp_x_c = min(1.0, max(0.0, float(hp_x)))
        hp_y_c = min(1.0, max(0.0, float(hp_y)))
        kn_x_c = min(1.0, max(0.0, float(kn_x)))
        kn_y_c = min(1.0, max(0.0, float(kn_y)))
        ak_x_c = min(1.0, max(0.0, float(ak_x)))
        ak_y_c = min(1.0, max(0.0, float(ak_y)))
        ear_x_c = min(1.0, max(0.0, float(ear_raw_x)))
        ear_y_c = min(1.0, max(0.0, float(ear_raw_y)))
        anc_x_c = min(1.0, max(0.0, float(anchor_x)))
        anc_y_c = min(1.0, max(0.0, float(anchor_y)))

        frames_output.append({
            "timestamp_sec": round(float(timestamps[f]), 4),
            "phase": phase,
            "rep_index": int(rep_num),
            "body_region": "upper" if is_upper_body else "lower",
            "load_point": [round(float(smooth_lx[f]), 4), round(float(smooth_ly[f]), 4)],
            "load_speed_px_s": round(float(smooth_vel[f]), 1),
            "load_speed_norm": round(float(np.clip(smooth_vel[f] / max(float(np.max(smooth_vel)), 1e-4), 0.0, 1.0)), 3),
            "angles": {
                "elbow": round(float(clean_el[f]), 1),
                "shoulder": round(float(clean_hu[f]), 1),
                "hip": round(float(clean_hp[f]), 1),
                "knee": round(float(clean_kn[f]), 1),
                "neck": round(float(clean_neck[f]), 1),
            },
            "keypoints": {
                "shoulder": [round(sh_x_c, 4), round(sh_y_c, 4)],
                "elbow": [round(el_x_c, 4), round(el_y_c, 4)],
                "wrist": [round(wr_x_c, 4), round(wr_y_c, 4)],
                "hip": [round(hp_x_c, 4), round(hp_y_c, 4)],
                "knee": [round(kn_x_c, 4), round(kn_y_c, 4)],
                "ankle": [round(ak_x_c, 4), round(ak_y_c, 4)],
                "ear": [round(ear_x_c, 4), round(ear_y_c, 4)],
            },
            "force_vector": {
                "origin": [round(anc_x_c, 4), round(anc_y_c, 4)],
                "ux": round(float(fv_ux), 4),
                "uy": round(float(fv_uy), 4),
                "d_primary_px": round(float(d_primary), 1),
                "d_secondary_px": round(float(d_secondary), 1),
                "primary_pct": round(float(primary_pct), 1),
                "secondary_pct": round(float(secondary_pct), 1),
                "primary_short": primary_short_label,
                "secondary_short": secondary_short_label,
                # Backwards-compatibility
                "direction": cur_force_dir,
                "dx": round(float(fv_ux), 2),
                "dy": round(float(fv_uy), 2),
                "origin_joint": "wrist" if any(k in ex_lower for k in ["deadlift", "rdl", "rumano"]) else force_origin
            },
            # Backwards-compatibility fields
            "frame_idx": f,
            "time": round(float(timestamps[f]), 4),
            "rep_number": rep_num,
            "hide_torso_line": bool(hide_torso_line),
            "hide_neck_line": bool(hide_neck_line),
            "is_upper_back": bool(is_upper_back_series),
            "is_unilateral": bool(is_unilateral_flag),
            "main_angle": round(float(clean_primary[f]), 1),
            "secondary_angle": round(float(clean_secondary[f]), 1),
            "neck_angle": round(float(clean_neck[f]), 1),
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
                # Canonical primary tracked joints
                "shoulder": {"x": round(sh_x_c, 4), "y": round(sh_y_c, 4), "score": round(float(primary_joints["shoulder"]["score"][f]), 2)},
                "elbow": {"x": round(el_x_c, 4), "y": round(el_y_c, 4), "score": round(float(primary_joints["elbow"]["score"][f]), 2)},
                "wrist": {"x": round(wr_x_c, 4), "y": round(wr_y_c, 4), "score": round(float(primary_joints["wrist"]["score"][f]), 2)},
                "hand_grip": {"x": round(float(cur_hx), 4), "y": round(float(cur_hy), 4), "score": round(float(primary_joints["wrist"]["score"][f]), 2)},
                "hip": {"x": round(hp_x_c, 4), "y": round(hp_y_c, 4), "score": round(float(primary_joints["hip"]["score"][f]), 2)},
                "knee": {"x": round(kn_x_c, 4), "y": round(kn_y_c, 4), "score": round(float(primary_joints["knee"]["score"][f]), 2)},
                "ankle": {"x": round(ak_x_c, 4), "y": round(ak_y_c, 4), "score": round(float(primary_joints["ankle"]["score"][f]), 2)},
                "ear": {"x": round(ear_x_c, 4), "y": round(ear_y_c, 4), "score": round(float(primary_joints["ear"]["score"][f]), 2) if "ear" in primary_joints else round(float(smoothed_head["score"][f]), 2)}
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

    # ---------------------------------------------------------------------
    # Requirement 3: Moment Arms & Torque Split Synchronization
    # ---------------------------------------------------------------------
    if moment_arms_2d_valid:
        # Compute median concentric primary percentage from orthogonal 2D moment arms
        concentric_p_pcts = [
            frames_output[f]["force_vector"]["primary_pct"]
            for f in range(n_frames)
            if frame_phase_map[f] == "CONCENTRIC"
        ]
        if not concentric_p_pcts:
            concentric_p_pcts = [frames_output[f]["force_vector"]["primary_pct"] for f in range(n_frames)]
        med_p = float(np.median(concentric_p_pcts)) if concentric_p_pcts else 70.0
        med_s = round(100.0 - med_p, 1)
        med_p = round(med_p, 1)

        # Update vlm_result torque_split as single official truth
        if vlm_result is None:
            vlm_result = {}
        if "torque_split" not in vlm_result or not isinstance(vlm_result["torque_split"], dict):
            p_name = "Pectoral Mayor" if is_upper_body else "Cuádriceps"
            s_name = "Tríceps Braquial" if is_upper_body else "Glúteo Mayor"
            vlm_result["torque_split"] = {
                "primary_muscle": p_name,
                "primary_pct": med_p,
                "secondary_muscle": s_name,
                "secondary_pct": med_s,
                "short_primary_label": "P" if is_upper_body else "C",
                "short_secondary_label": "T" if is_upper_body else "G"
            }
        else:
            vlm_result["torque_split"]["primary_pct"] = med_p
            vlm_result["torque_split"]["secondary_pct"] = med_s

        # Sync repetitions summary verdicts
        for r_item in repetitions_summary:
            if "verdict" in r_item and isinstance(r_item["verdict"], dict):
                r_item["verdict"]["torque_split"] = f"{round(med_p)}% vs {round(med_s)}%"
    else:
        # Non-lateral camera plane (contrapicado, frontal, etc.): VLM torque_split is single source of truth
        vlm_ts = vlm_result.get("torque_split", {}) if vlm_result else {}
        official_p = float(vlm_ts.get("primary_pct", 70.0))
        official_s = float(vlm_ts.get("secondary_pct", 30.0))
        
        # Override all frames to zero 2D moment arm pixels and set official VLM percentages
        for f in range(n_frames):
            frames_output[f]["force_vector"]["d_primary_px"] = 0.0
            frames_output[f]["force_vector"]["d_secondary_px"] = 0.0
            frames_output[f]["force_vector"]["primary_pct"] = round(official_p, 1)
            frames_output[f]["force_vector"]["secondary_pct"] = round(official_s, 1)
            frames_output[f]["moment_arms"]["d_shoulder"] = 0.0
            frames_output[f]["moment_arms"]["d_elbow"] = 0.0
            frames_output[f]["moment_arms"]["d_hip"] = 0.0
            frames_output[f]["moment_arms"]["d_knee"] = 0.0

        for r_item in repetitions_summary:
            if "verdict" in r_item and isinstance(r_item["verdict"], dict):
                r_item["verdict"]["torque_split"] = f"{round(official_p)}% vs {round(official_s)}%"

    assert len(frames_output) > 0, "frames_output cannot be empty"
    first_kps = frames_output[0]["keypoints"]
    for j_name in ["shoulder", "elbow", "wrist"]:
        pt = first_kps[j_name]
        assert isinstance(pt, (list, tuple)) and len(pt) == 2, f"keypoint {j_name} must be [x, y]"
        assert 0.0 <= pt[0] <= 1.0 and 0.0 <= pt[1] <= 1.0, f"keypoint {j_name} must be in [0, 1], got {pt}"
    print(f"[Frames Schema Verification] len(frames)={len(frames_output)}, first keypoints verified within [0, 1].")

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

    # VLM override for muscle weights if available
    if vlm_result and isinstance(vlm_result.get("effective_muscle_weights"), dict):
        vlm_mw = vlm_result["effective_muscle_weights"]
        if vlm_mw and sum(vlm_mw.values()) > 0:
            effective_muscle_weights = vlm_mw

    # Normalize to ensure sum is strictly 1.0
    tot_weight = sum(effective_muscle_weights.values())
    if tot_weight > 0:
        effective_muscle_weights = {k: round(v / tot_weight, 3) for k, v in effective_muscle_weights.items()}

    return sanitize_for_json({
        "fps": 15.0,
        "total_duration_sec": round(float(timestamps[-1] - timestamps[0]), 4) if len(timestamps) > 1 else 0.0,
        "duration": round(float(timestamps[-1] - timestamps[0]), 2) if timestamps else 0.0,
        "total_reps": total_reps,
        "locked_side": locked_side,
        "camera_plane": camera_plane,
        "moment_arms_2d_valid": bool(moment_arms_2d_valid),
        "debug_pose_audit": debug_pose_audit,
        "hide_torso_line": bool(hide_torso_line),
        "hide_neck_line": bool(hide_neck_line),
        "is_upper_back": bool(is_upper_back_series),
        "is_upper_body": bool(is_upper_body),
        "body_region": body_region,
        "detected_exercise_type": exercise_type,
        "detected_exercise_name": exercise_name or (vlm_result.get("detected_exercise_name") if vlm_result else exercise_type.replace("_", " ").title()),
        "target_muscle": target_muscle,
        "load_type": load_type,
        "effective_muscle_weights": effective_muscle_weights,
        "mean_rom_deg": mean_rom,
        "mean_eccentric_time_s": mean_ecc,
        "mean_pause_time_s": mean_pau,
        "mean_concentric_time_s": mean_con,
        "intensity_metrics": intensity_metrics,
        "repetitions_summary": repetitions_summary,
        "rep_comparison": rep_comparison,
        "snapshot_stretch_b64": snapshot_stretch_b64,
        "snapshot_peak_b64": snapshot_peak_b64,
        "joints_stretch": joints_stretch,
        "joints_peak": joints_peak,
        "timeline_cues": vlm_result.get("timeline_cues", []) if vlm_result else [],
        "alignment_and_discomfort": vlm_result.get("alignment_and_discomfort") if vlm_result else None,
        "stimulus_and_specificity": vlm_result.get("stimulus_and_specificity") if vlm_result else None,
        "intensity_audit": vlm_result.get("intensity_audit") if vlm_result else None,
        "vlm_analysis": vlm_result,
        "vlm_used": bool(vlm_used),
        "vlm_error": str(vlm_error) if vlm_error else None,
        "vlm_mode": vlm_mode,
        "vlm_model_used": vlm_model_used,
        "frames": frames_output
    })

# ---------------------------------------------------------------------------
# 4. Helper & Cerebrium Endpoint Definition
# ---------------------------------------------------------------------------

def _extract_video_to_tempfile(
    video_base64: Optional[str] = None,
    video_url: Optional[str] = None,
    video: Optional[str] = None
) -> str:
    """Helper to extract incoming video payload (base64 data URI, HTTP URL, or local file) to a local tempfile."""
    target_data = video_base64 or video
    if target_data and os.path.isfile(target_data):
        return target_data
    
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

    return sanitize_for_json({
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
    })

def coach_review(
    video_base64=None,
    video_url=None,
    video=None,
    exercise_type="auto",
    exercise_name=None,
    summary_data=None,
    gemini_api_key=None,
    **kwargs
) -> dict:
    """
    On-demand AI Coach review using Gemini VLM.
    Called explicitly when user taps 'Generar Revisión del Coach IA'.
    """
    api_key = (gemini_api_key or "").strip() or os.environ.get("GEMINI_API_KEY", "").strip()
    if not api_key:
        return sanitize_for_json({
            "success": False,
            "coach_review": None,
            "vlm_error": "GEMINI_API_KEY no configurada",
            "vlm_mode": "failed",
            "vlm_model_used": None
        })
    
    summary = summary_data or {}
    total_reps = summary.get("total_reps", 0)
    intensity_metrics = summary.get("intensity_metrics", {})
    repetitions_summary = summary.get("repetitions_summary", [])
    rep_comparison = summary.get("rep_comparison", None)
    
    temp_path = None
    try:
        if video_base64 or video_url or video:
            temp_path = _extract_video_to_tempfile(video_base64=video_base64, video_url=video_url, video=video)
            
        vlm_res, vlm_err, vlm_mode, vlm_model = analyze_biomechanics_with_vlm(
            video_path=temp_path,
            exercise_type=exercise_type,
            total_reps=total_reps,
            intensity_metrics=intensity_metrics,
            repetitions_summary=repetitions_summary,
            rep_comparison=rep_comparison,
            gemini_api_key=api_key,
            exercise_name=exercise_name
        )
        return sanitize_for_json({
            "success": vlm_res is not None,
            "coach_review": vlm_res,
            "vlm_error": vlm_err,
            "vlm_mode": vlm_mode,
            "vlm_model_used": vlm_model
        })
    except Exception as e:
        return sanitize_for_json({
            "success": False,
            "coach_review": None,
            "vlm_error": str(e),
            "vlm_mode": "failed",
            "vlm_model_used": None
        })
    finally:
        if temp_path and os.path.exists(temp_path):
            try:
                os.unlink(temp_path)
            except OSError:
                pass

def classify_machine_photo(
    image_b64: Optional[str] = None,
    image: Optional[str] = None,
    exercise_hint: Optional[str] = None,
    gemini_api_key: Optional[str] = None,
    **kwargs
) -> dict:
    """
    Classifies a gym machine's resistance profile from a photograph using lever physics and Gemini Flash VLM.
    Identifies load type, pivot behavior, movement path, peak resistance zone, and curve weights.
    """
    raw_img = image_b64 or image or kwargs.get("image_base64")
    if not raw_img and kwargs.get("photo_base64"):
        raw_img = kwargs.get("photo_base64")

    api_key = (gemini_api_key or "").strip() or os.environ.get("GEMINI_API_KEY", "").strip()

    # Clean data URL prefix if present
    if raw_img and "base64," in raw_img:
        raw_img = raw_img.split("base64,")[1]

    # Default heuristic profile if API key or image missing
    hint = (exercise_hint or "").lower()
    default_profile = {
        "loadType": "plate_loaded" if ("hammer" in hint or "pure" in hint or "disco" in hint) else "selectorized_stack",
        "pivotBehavior": "approaches_vertical_loss" if ("press" in hint or "sentadilla" in hint) else "opens_to_horizontal_gain",
        "pathType": "converging_arc" if "press" in hint else "linear_fixed",
        "peakZone": "stretched" if ("press" in hint or "sentadilla" in hint) else "shortened",
        "resistanceCurveDescription": "Palanca con brazo de momento decreciente hacia el bloqueo articular.",
        "curveWeights": { "stretch": 0.50, "mid": 0.35, "shortened": 0.15 },
        "machineBrandGuess": "Hammer Strength" if "hammer" in hint else None,
        "machineModelGuess": None
    }

    if not raw_img or not api_key:
        return sanitize_for_json(default_profile)

    candidate_models = get_available_flash_models(api_key)

    prompt = (
        "Actúa como Ingeniero Biomecánico Senior especializado en diseño de maquinaria de fuerza y física de palancas.\n"
        "Analiza detalladamente esta fotografía de máquina de gimnasio para clasificar su perfil de resistencia cinemático.\n"
        f"Pista de ejercicio / contexto: '{exercise_hint or 'Máquina de musculación'}'.\n\n"
        "Aplica rigurosamente estos principios de física de momentos de fuerza (τ = F · L · sin(θ)):\n"
        "1. Si la palanca se aproxima a la vertical conforme avanza la fase concéntrica, el brazo de momento de la carga respecto al pivote decrece -> Pico en Estiramiento ('stretched').\n"
        "2. Si la palanca se abre hacia la horizontal perpendicular a la gravedad conforme empuja/tracciona, el brazo de momento de la carga aumenta -> Pico en Acortamiento ('shortened').\n"
        "3. Si es guiado por cable directo o leva circular de radio constante -> Perfil Uniforme ('uniform').\n"
        "4. Si es leva excéntrica de radio variable o doble pivote (nido de palancas) con reducción en extremos -> Pico en Punto Medio ('mid').\n\n"
        "Responde ÚNICAMENTE con un objeto JSON válido con esta estructura exacta (sin markdown adicional):\n"
        "{\n"
        '  "loadType": "plate_loaded | selectorized_stack | cable_pulley | lever_arm | smith_guided | free_weight",\n'
        '  "pivotBehavior": "approaches_vertical_loss | opens_to_horizontal_gain | circular_cam_constant | eccentric_cam_drop | linear_neutral",\n'
        '  "pathType": "converging_arc | diverging_arc | circular_arc | linear_fixed | free_cable",\n'
        '  "peakZone": "stretched | mid | shortened | uniform",\n'
        '  "resistanceCurveDescription": "Explicación concisa de 1-2 frases del comportamiento de la palanca y el momento de fuerza.",\n'
        '  "curveWeights": { "stretch": 0.50, "mid": 0.35, "shortened": 0.15 },\n'
        '  "machineBrandGuess": "Hammer Strength / Technogym / Prime / etc. o null",\n'
        '  "machineModelGuess": "Nombre o modelo visual de la máquina o null"\n'
        "}\n"
        "IMPORTANTE: 'curveWeights' debe contener 'stretch', 'mid' y 'shortened' como números decimales cuya suma sea exactamente 1.0."
    )

    for model_name in candidate_models:
        clean_model = model_name.replace("models/", "")
        endpoint = f"https://generativelanguage.googleapis.com/v1beta/models/{clean_model}:generateContent?key={api_key}"

        body = {
            "contents": [
                {
                    "parts": [
                        {"text": prompt},
                        {
                            "inline_data": {
                                "mime_type": "image/jpeg",
                                "data": raw_img
                            }
                        }
                    ]
                }
            ],
            "generationConfig": {
                "temperature": 0.1,
                "response_mime_type": "application/json"
            }
        }

        try:
            req = urllib.request.Request(
                endpoint,
                data=json.dumps(body).encode("utf-8"),
                headers={"Content-Type": "application/json"},
                method="POST"
            )
            with urllib.request.urlopen(req, timeout=30) as resp:
                resp_data = json.loads(resp.read().decode("utf-8"))
                candidates = resp_data.get("candidates", [])
                if not candidates:
                    continue
                content_parts = candidates[0].get("content", {}).get("parts", [])
                if not content_parts:
                    continue
                raw_text = content_parts[0].get("text", "").strip()
                if raw_text.startswith("```"):
                    raw_text = re.sub(r"^```[a-zA-Z0-9_-]*\s*", "", raw_text)
                    raw_text = re.sub(r"\s*```$", "", raw_text)
                parsed = json.loads(raw_text)

                # Validate and normalize curveWeights
                cw = parsed.get("curveWeights", {})
                s = float(cw.get("stretch", 0.33))
                m = float(cw.get("mid", 0.34))
                sh = float(cw.get("shortened", 0.33))
                total = s + m + sh
                if total > 0:
                    parsed["curveWeights"] = {
                        "stretch": round(s / total, 3),
                        "mid": round(m / total, 3),
                        "shortened": round(sh / total, 3)
                    }
                else:
                    parsed["curveWeights"] = { "stretch": 0.333, "mid": 0.334, "shortened": 0.333 }

                return sanitize_for_json(parsed)
        except Exception as e:
            print(f"[Classify Machine Photo] Model {clean_model} error: {e}")
            continue

    return sanitize_for_json(default_profile)

def analyze(
    video_base64=None,
    video_url=None,
    video=None,
    exercise_type="auto",
    exercise_name=None,
    target_muscle="auto",
    load_type="auto",
    start_time=0.0,
    end_time=None,
    weight_kg=None,
    target_reps=None,
    anthropometry=None,
    is_manual_override=False,
    gemini_api_key=None,
    run_vlm=False,
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
        # Route to classify_machine_photo if requested
        if payload.get("action") == "classify_machine_photo":
            return classify_machine_photo(
                image_b64=payload.get("image_b64") or payload.get("image") or payload.get("photo_base64"),
                exercise_hint=payload.get("exercise_hint") or payload.get("exercise_name"),
                gemini_api_key=payload.get("gemini_api_key") or kwargs.get("gemini_api_key") or gemini_api_key or os.environ.get("GEMINI_API_KEY", "").strip(),
                **kwargs
            )
        # Route to coach_review if requested
        if payload.get("action") == "coach_review":
            return coach_review(
                video_base64=payload.get("video_base64") or payload.get("video"),
                video_url=payload.get("video_url"),
                exercise_type=payload.get("exercise_type", exercise_type or "auto"),
                exercise_name=payload.get("exercise_name", payload.get("exerciseName", exercise_name)),
                summary_data=payload.get("summary_data") or payload.get("summary"),
                gemini_api_key=payload.get("gemini_api_key") or kwargs.get("gemini_api_key") or gemini_api_key or os.environ.get("GEMINI_API_KEY", "").strip(),
                **kwargs
            )
        video_base64 = payload.get("video_base64")
        video_url = payload.get("video_url")
        video = payload.get("video")
        exercise_type = payload.get("exercise_type", exercise_type or "auto")
        exercise_name = payload.get("exercise_name", payload.get("exerciseName", exercise_name))
        target_muscle = payload.get("target_muscle", target_muscle or "auto")
        load_type = payload.get("load_type", load_type or "auto")
        start_time_val = payload.get("start_time", 0.0)
        end_time_val = payload.get("end_time", None)
        weight_kg = payload.get("weight_kg", payload.get("weightKg", weight_kg))
        target_reps = payload.get("target_reps", payload.get("targetReps", target_reps))
        anthropometry = payload.get("anthropometry", anthropometry)
        is_manual_override = bool(payload.get("is_manual_override", is_manual_override))
        gemini_api_key = payload.get("gemini_api_key") or kwargs.get("gemini_api_key") or gemini_api_key or os.environ.get("GEMINI_API_KEY", "").strip()
        run_vlm = bool(payload.get("run_vlm", run_vlm))
    else:
        exercise_type = exercise_type or kwargs.get("exercise_type", "auto")
        exercise_name = exercise_name or kwargs.get("exercise_name", kwargs.get("exerciseName", ""))
        target_muscle = target_muscle or kwargs.get("target_muscle", "auto")
        load_type = load_type or kwargs.get("load_type", "auto")
        start_time_val = kwargs.get("start_time", start_time if start_time is not None else 0.0)
        end_time_val = kwargs.get("end_time", end_time)
        weight_kg = weight_kg or kwargs.get("weight_kg", kwargs.get("weightKg"))
        target_reps = target_reps or kwargs.get("target_reps", kwargs.get("targetReps"))
        anthropometry = anthropometry or kwargs.get("anthropometry")
        is_manual_override = bool(kwargs.get("is_manual_override", is_manual_override))
        gemini_api_key = gemini_api_key or kwargs.get("gemini_api_key") or os.environ.get("GEMINI_API_KEY", "").strip()
        run_vlm = bool(kwargs.get("run_vlm", run_vlm))

    exercise_type = str(exercise_type)
    exercise_name = str(exercise_name) if exercise_name else None
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

    raw_temp_path = _extract_video_to_tempfile(video_base64=video_base64, video_url=video_url, video=video)
    raw_rot = get_video_rotation(raw_temp_path)
    temp_path, was_trimmed = optimize_video_with_ffmpeg(raw_temp_path, start_time=start_time, end_time=end_time)
    # Delete raw 4K video immediately after transcoding to free disk/RAM before MediaPipe starts
    if temp_path != raw_temp_path and os.path.exists(raw_temp_path):
        try:
            os.unlink(raw_temp_path)
        except Exception as e:
            print(f"[Analyze Cleanup] Warning deleting raw video: {e}")
    try:
        sample_start = 0.0 if was_trimmed else start_time
        sample_end = None if was_trimmed else end_time
        frames_rgb, timestamps, duration = sample_video_frames(
            temp_path,
            target_fps=15.0,
            max_frames=450,
            start_time=sample_start,
            end_time=sample_end
        )
        try:
            speed_factor = float(kwargs.get("speed_factor") or 1.0)
        except (ValueError, TypeError):
            speed_factor = 1.0
        if speed_factor > 1.01 and timestamps:
            timestamps = [t * speed_factor for t in timestamps]
            duration = duration * speed_factor
        if not frames_rgb:
            raise ValueError("Failed to decode frames from input video.")
            
        # Guarantee upright orientation: if original video was vertical (90 or 270 deg)
        # and frames are still horizontal (h < w), rotate upright so h > w
        if raw_rot in (90, 270) and frames_rgb[0].shape[0] < frames_rgb[0].shape[1]:
            rot_code = cv2.ROTATE_90_CLOCKWISE if raw_rot == 90 else cv2.ROTATE_90_COUNTERCLOCKWISE
            frames_rgb = [cv2.rotate(f, rot_code) for f in frames_rgb]

        h, w = frames_rgb[0].shape[:2]
        raw_keypoints, athlete_boxes = run_inference_batches(frames_rgb, batch_size=64)
        
        result = process_kinematics(
            raw_keypoints=raw_keypoints,
            timestamps=timestamps,
            exercise_type=exercise_type,
            exercise_name=exercise_name,
            target_muscle=target_muscle,
            load_type=load_type,
            athlete_boxes=athlete_boxes,
            img_w=w,
            img_h=h,
            weight_kg=weight_kg,
            target_reps=target_reps,
            anthropometry=anthropometry,
            frames_rgb=frames_rgb,
            is_manual_override=is_manual_override,
            gemini_api_key=gemini_api_key,
            video_path=temp_path,
            run_vlm=run_vlm
        )
        return sanitize_for_json(result)
    finally:
        for p in set([raw_temp_path, temp_path]):
            if p and os.path.exists(p) and not (video and p == video):
                try:
                    os.unlink(p)
                except OSError:
                    pass

# Alias for generic prediction endpoints
def predict(
    video_base64=None,
    video_url=None,
    video=None,
    exercise_type="auto",
    exercise_name=None,
    target_muscle="auto",
    load_type="auto",
    start_time=0.0,
    end_time=None,
    is_manual_override=False,
    gemini_api_key=None,
    **kwargs
):
    return sanitize_for_json(analyze(
        video_base64=video_base64,
        video_url=video_url,
        video=video,
        exercise_type=exercise_type,
        exercise_name=exercise_name,
        target_muscle=target_muscle,
        load_type=load_type,
        start_time=start_time,
        end_time=end_time,
        is_manual_override=is_manual_override,
        gemini_api_key=gemini_api_key,
        **kwargs
    ))

# ---------------------------------------------------------------------------
# 5. FastAPI Asynchronous Job Server
# ---------------------------------------------------------------------------

import uuid
import threading
import time

try:
    from fastapi import FastAPI, BackgroundTasks, HTTPException, Request, Response, status
    from fastapi.middleware.cors import CORSMiddleware
    from fastapi.responses import JSONResponse
    HAS_FASTAPI = True
except ImportError:
    HAS_FASTAPI = False
    FastAPI = None  # type: ignore

JOBS: Dict[str, Dict[str, Any]] = {}
JOBS_LOCK = threading.Lock()

UPLOADS: Dict[str, Dict[str, Any]] = {}
UPLOADS_LOCK = threading.Lock()

def _cleanup_old_jobs():
    """Remove completed or expired jobs older than 1 hour to prevent memory bloat."""
    now = time.time()
    with JOBS_LOCK:
        to_del = [jid for jid, info in JOBS.items() if now - info.get("created_at", now) > 3600]
        for jid in to_del:
            del JOBS[jid]

def _cleanup_old_uploads():
    """Remove pending or abandoned uploads older than 1 hour to prevent disk bloat."""
    now = time.time()
    with UPLOADS_LOCK:
        to_del = []
        for uid, info in UPLOADS.items():
            if now - info.get("created_at", now) > 3600:
                to_del.append(uid)
                fpath = info.get("file_path")
                if fpath and os.path.exists(fpath):
                    try:
                        os.unlink(fpath)
                    except OSError:
                        pass
        for uid in to_del:
            del UPLOADS[uid]

def _init_upload_session() -> dict:
    """Initializes chunked video upload session, returning upload_id."""
    _cleanup_old_uploads()
    upload_id = str(uuid.uuid4())
    fd, temp_file_path = tempfile.mkstemp(suffix="_chunked_upload.mp4")
    os.close(fd)
    with UPLOADS_LOCK:
        UPLOADS[upload_id] = {
            "upload_id": upload_id,
            "file_path": temp_file_path,
            "total_bytes": 0,
            "created_at": time.time(),
            "updated_at": time.time()
        }
    return {"upload_id": upload_id}

def worker_process_analysis(job_id: str, payload: dict):
    _cleanup_old_jobs()
    try:
        with JOBS_LOCK:
            if job_id in JOBS:
                JOBS[job_id]["status"] = "processing"
                JOBS[job_id]["stage"] = "Optimizando vídeo"
                JOBS[job_id]["progress"] = 25
                JOBS[job_id]["updated_at"] = time.time()

        time.sleep(0.05)
        with JOBS_LOCK:
            if job_id in JOBS:
                JOBS[job_id]["stage"] = "Analizando biomecánica"
                JOBS[job_id]["progress"] = 55
                JOBS[job_id]["updated_at"] = time.time()

        result = analyze(**payload)

        with JOBS_LOCK:
            if job_id in JOBS:
                JOBS[job_id]["status"] = "done"
                JOBS[job_id]["stage"] = "Completado"
                JOBS[job_id]["progress"] = 100
                JOBS[job_id]["result"] = result
                JOBS[job_id]["updated_at"] = time.time()
    except Exception as exc:
        print(f"[Worker Error] Job {job_id} failed: {exc}")
        with JOBS_LOCK:
            if job_id in JOBS:
                JOBS[job_id]["status"] = "error"
                JOBS[job_id]["stage"] = "Error"
                JOBS[job_id]["error"] = str(exc)
                JOBS[job_id]["updated_at"] = time.time()

if HAS_FASTAPI:
    app = FastAPI(
        title="MIA Biomechanics Engine",
        description="Asynchronous Kinematic, VBT & Joint Moment Arm Biomechanical Analyzer",
        version="2.0.0"
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/")
    @app.get("/health")
    def health():
        return {
            "status": "ok",
            "service": "MIA Biomechanics Engine",
            "version": "2.0.0",
            "active_jobs": len(JOBS)
        }

    @app.post("/analyze", status_code=status.HTTP_202_ACCEPTED)
    async def post_analyze(request: Request, background_tasks: BackgroundTasks):
        try:
            payload = await request.json()
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid JSON payload")

        # If client explicitly requests synchronous response (?sync=true)
        if request.query_params.get("sync", "").lower() in ["true", "1"]:
            try:
                res = analyze(**payload)
                return JSONResponse(content=res, status_code=200)
            except Exception as e:
                raise HTTPException(status_code=500, detail=str(e))

        job_id = str(uuid.uuid4())
        now = time.time()
        with JOBS_LOCK:
            JOBS[job_id] = {
                "job_id": job_id,
                "status": "queued",
                "progress": 5,
                "stage": "Subiendo",
                "result": None,
                "error": None,
                "created_at": now,
                "updated_at": now
            }

        background_tasks.add_task(worker_process_analysis, job_id, payload)
        return JSONResponse(
            status_code=status.HTTP_202_ACCEPTED,
            content={
                "job_id": job_id,
                "status": "queued",
                "stage": "Subiendo",
                "progress": 5,
                "message": "Analysis started asynchronously"
            }
        )

    @app.post("/analyze/upload/init")
    def post_upload_init():
        return _init_upload_session()

    @app.post("/analyze/upload/chunk/{upload_id}")
    async def post_upload_chunk(upload_id: str, request: Request):
        """
        Receives binary 4 MB chunks and streams directly to disk.
        Never loads entire payload into RAM.
        """
        with UPLOADS_LOCK:
            info = UPLOADS.get(upload_id)
        if not info:
            raise HTTPException(status_code=404, detail="Upload session not found or expired")

        file_path = info["file_path"]
        content_type = request.headers.get("content-type", "")

        bytes_written = 0
        if "multipart/form-data" in content_type:
            form = await request.form()
            chunk_file = form.get("chunk") or form.get("file")
            if not chunk_file:
                raise HTTPException(status_code=400, detail="No chunk file provided in form")
            with open(file_path, "ab") as f:
                while True:
                    data = await chunk_file.read(1024 * 1024)
                    if not data:
                        break
                    f.write(data)
                    bytes_written += len(data)
        else:
            with open(file_path, "ab") as f:
                async for chunk_bytes in request.stream():
                    if chunk_bytes:
                        f.write(chunk_bytes)
                        bytes_written += len(chunk_bytes)

        with UPLOADS_LOCK:
            info["total_bytes"] += bytes_written
            info["updated_at"] = time.time()

        return {"status": "ok", "bytes_received": bytes_written, "total_bytes": info["total_bytes"]}

    @app.post("/analyze/upload/complete/{upload_id}", status_code=status.HTTP_202_ACCEPTED)
    async def post_upload_complete(upload_id: str, request: Request, background_tasks: BackgroundTasks):
        """
        Completes chunked video upload, enqueues async background analysis job,
        and returns 202 Accepted { job_id }.
        """
        with UPLOADS_LOCK:
            info = UPLOADS.pop(upload_id, None)
        if not info:
            raise HTTPException(status_code=404, detail="Upload session not found or expired")

        file_path = info["file_path"]
        if not os.path.exists(file_path) or os.path.getsize(file_path) == 0:
            raise HTTPException(status_code=400, detail="Uploaded video file is empty or missing on disk")

        try:
            payload = await request.json()
        except Exception:
            payload = {}

        # Stream file path directly to analysis worker without base64 in RAM
        payload["video"] = file_path
        payload["video_base64"] = None
        payload["video_url"] = None

        job_id = str(uuid.uuid4())
        now = time.time()
        with JOBS_LOCK:
            JOBS[job_id] = {
                "job_id": job_id,
                "status": "queued",
                "progress": 5,
                "stage": "Subiendo",
                "result": None,
                "error": None,
                "created_at": now,
                "updated_at": now
            }

        background_tasks.add_task(worker_process_analysis, job_id, payload)
        return JSONResponse(
            status_code=status.HTTP_202_ACCEPTED,
            content={
                "job_id": job_id,
                "status": "queued",
                "stage": "Subiendo",
                "progress": 5,
                "message": "Upload complete, analysis queued asynchronously"
            }
        )

    @app.get("/analyze/status/{job_id}")
    def get_analyze_status(job_id: str):
        with JOBS_LOCK:
            job = JOBS.get(job_id)
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")
        return {
            "job_id": job["job_id"],
            "status": job["status"],
            "progress": job["progress"],
            "stage": job["stage"],
            "result": job.get("result"),
            "error": job.get("error")
        }

# ==============================================================================
# CEREBRIUM CORTEX TOP-LEVEL FUNCTIONS FOR CHUNKED VIDEO UPLOAD
# ==============================================================================

def upload_init() -> dict:
    """Cerebrium-compatible endpoint to initialize a chunked upload session."""
    return _init_upload_session()

def upload_chunk(upload_id: str, chunk_base64: str) -> dict:
    """
    Cerebrium-compatible endpoint to append a base64-encoded 4 MB chunk
    directly to the temp file on disk without holding the full video in RAM.
    """
    with UPLOADS_LOCK:
        info = UPLOADS.get(upload_id)
    if not info:
        raise ValueError(f"Upload session not found or expired: {upload_id}")

    raw_bytes = base64.b64decode(chunk_base64)
    file_path = info["file_path"]
    with open(file_path, "ab") as f:
        f.write(raw_bytes)

    with UPLOADS_LOCK:
        info["total_bytes"] += len(raw_bytes)
        info["updated_at"] = time.time()
        total_bytes = info["total_bytes"]

    return {"status": "ok", "bytes_received": len(raw_bytes), "total_bytes": total_bytes}

def upload_complete(
    upload_id,
    exercise_type="auto",
    exercise_name="",
    target_muscle="auto",
    load_type="auto",
    is_manual_override=False,
    gemini_api_key="",
    start_time=0.0,
    end_time=None,
    weight_kg=None,
    target_reps=None,
    anthropometry=None,
    run_vlm=False,
    **kwargs
) -> dict:
    """
    Cerebrium-compatible endpoint to finalize chunked upload and execute
    the full biomechanics analysis directly from the assembled disk file.
    """
    with UPLOADS_LOCK:
        info = UPLOADS.pop(upload_id, None)
    if not info:
        raise ValueError(f"Upload session not found or expired: {upload_id}")

    file_path = info["file_path"]
    if not os.path.exists(file_path) or os.path.getsize(file_path) == 0:
        raise ValueError("Uploaded video file is empty or missing on disk")

    try:
        return analyze(
            video=file_path,
            exercise_type=exercise_type,
            exercise_name=exercise_name,
            target_muscle=target_muscle,
            load_type=load_type,
            is_manual_override=is_manual_override,
            gemini_api_key=gemini_api_key,
            start_time=start_time,
            end_time=end_time,
            weight_kg=weight_kg,
            target_reps=target_reps,
            anthropometry=anthropometry,
            run_vlm=run_vlm
        )
    finally:
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
            except Exception:
                pass

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=False)
