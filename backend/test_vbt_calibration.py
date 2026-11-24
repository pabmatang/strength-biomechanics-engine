import sys
import os
import math
import numpy as np
from unittest.mock import MagicMock

# Mock torch and heavy vision libraries for testing process_kinematics directly
class MockTensor:
    pass

class MockTorch(MagicMock):
    Tensor = MockTensor

sys.modules["torch"] = MockTorch()
for mod in ["modal", "cv2", "transformers", "google", "google.genai", "google.genai.types"]:
    if mod not in sys.modules:
        try:
            __import__(mod)
        except ImportError:
            sys.modules[mod] = MagicMock()

sys.path.insert(0, os.path.dirname(__file__))
from main import process_kinematics

def _build_pose_keypoints(elbow_angles, n_frames, is_pull=False):
    frames_keypoints = []
    L_forearm = 0.18
    for f in range(n_frames):
        el_ang = float(elbow_angles[f])
        sh_x, sh_y = 0.45, 0.40
        hp_x, hp_y = 0.55, 0.65
        kn_x, kn_y = 0.52, 0.85
        ak_x, ak_y = 0.50, 0.95
        
        # Upper arm
        el_x = 0.45
        el_y = 0.60
        
        # Forearm angle
        rad = math.radians(el_ang)
        if is_pull:
            wr_x = el_x + L_forearm * math.cos(rad)
            wr_y = el_y + L_forearm * math.sin(rad)
        else:
            wr_x = el_x + L_forearm * math.sin(rad)
            wr_y = el_y - L_forearm * math.cos(rad)
            
        kp = {
            "left_shoulder": {"x": sh_x, "y": sh_y, "score": 0.95},
            "right_shoulder": {"x": sh_x - 0.02, "y": sh_y, "score": 0.40},
            "left_elbow": {"x": el_x, "y": el_y, "score": 0.95},
            "right_elbow": {"x": el_x - 0.02, "y": el_y, "score": 0.40},
            "left_wrist": {"x": wr_x, "y": wr_y, "score": 0.95},
            "right_wrist": {"x": wr_x - 0.02, "y": wr_y, "score": 0.40},
            "left_hip": {"x": hp_x, "y": hp_y, "score": 0.95},
            "right_hip": {"x": hp_x - 0.02, "y": hp_y, "score": 0.40},
            "left_knee": {"x": kn_x, "y": kn_y, "score": 0.95},
            "right_knee": {"x": kn_x - 0.02, "y": kn_y, "score": 0.40},
            "left_ankle": {"x": ak_x, "y": ak_y, "score": 0.95},
            "right_ankle": {"x": ak_x - 0.02, "y": ak_y, "score": 0.40},
            "left_ear": {"x": 0.42, "y": 0.32, "score": 0.95},
            "right_ear": {"x": 0.40, "y": 0.32, "score": 0.40},
            "nose": {"x": 0.41, "y": 0.35, "score": 0.90}
        }
        frames_keypoints.append(kp)
    return frames_keypoints

def test_incline_press_4_reps_starting_at_half_second():
    """
    (a) Valida la detección de 4 repeticiones completas en un press inclinado
    donde el usuario empieza a mover la carga en t = 0.5s.
    Verifica que la Rep #1 NO se pierde en 'PREPARACIÓN / IDLE' hasta t=8s.
    """
    fps = 15.0
    dt = 1.0 / fps
    total_duration = 16.0
    n_frames = int(total_duration * fps) # 240 frames
    timestamps = [f * dt for f in range(n_frames)]
    
    # 4 repeticiones de Press Inclinado:
    # Inicio en t=0.5s (frame 7-8)
    angles = np.full(n_frames, 155.0) # Lockout ~155°
    
    rep_windows = [
        (int(0.5 * fps), int(1.8 * fps), int(3.2 * fps)),   # Rep 1: 0.5s -> 1.8s (fondo 75°) -> 3.2s
        (int(3.8 * fps), int(5.1 * fps), int(6.5 * fps)),   # Rep 2: 3.8s -> 5.1s -> 6.5s
        (int(7.1 * fps), int(8.4 * fps), int(9.8 * fps)),   # Rep 3: 7.1s -> 8.4s -> 9.8s
        (int(10.4 * fps), int(11.7 * fps), int(13.1 * fps)) # Rep 4: 10.4s -> 11.7s -> 13.1s
    ]
    
    for f_start, f_inflect, f_end in rep_windows:
        # Descenso excéntrico
        for f in range(f_start, f_inflect + 1):
            frac = (f - f_start) / max(1, f_inflect - f_start)
            angles[f] = 155.0 - (155.0 - 75.0) * frac
        # Subida concéntrica
        for f in range(f_inflect + 1, f_end + 1):
            frac = (f - f_inflect) / max(1, f_end - f_inflect)
            angles[f] = 75.0 + (155.0 - 75.0) * frac
            
    frames_kp = _build_pose_keypoints(angles, n_frames, is_pull=False)
    boxes = [{"box": [100, 100, 400, 400]} for _ in range(n_frames)]
    
    result = process_kinematics(
        raw_keypoints=frames_kp,
        timestamps=timestamps,
        exercise_type="incline_press",
        exercise_name="Press Inclinado con Mancuernas",
        target_muscle="chest",
        load_type="dumbbell",
        athlete_boxes=boxes,
        img_w=720,
        img_h=1280,
        weight_kg=30.0,
        target_reps=4,
        frames_rgb=None,
        is_manual_override=True,
        run_vlm=False
    )
    
    total_reps = result.get("total_reps", 0)
    reps_summary = result.get("repetitions_summary", [])
    
    print(f"[Test 4 Reps] Total reps detectadas: {total_reps}")
    assert total_reps == 4, f"Se esperaban 4 repeticiones, pero se detectaron {total_reps}"
    
    # Verificar que la primera rep empieza en t <= 1.0s (no perdida en calibración hasta t=8s)
    rep1_start_t = reps_summary[0].get("start_time", reps_summary[0].get("start_sec", 0.0))
    assert rep1_start_t <= 1.0, f"Rep #1 empezó en t={rep1_start_t}s; debió iniciar cerca de t=0.5s"

def test_fast_t_bar_row_truncated_last_rep_no_false_rir0():
    """
    (b) Valida una serie rápida de 4 reps en t_bar_row con la última rep cortada
    (terminando en los últimos 0.5s de vídeo y con pérdida de ROM),
    asegurando que NO dispare un falso 'RIR 0 / Fallo Muscular'.
    """
    fps = 15.0
    dt = 1.0 / fps
    total_duration = 12.0
    n_frames = int(total_duration * fps) # 180 frames
    timestamps = [f * dt for f in range(n_frames)]
    
    # T-Bar Row (Pattern A):
    # Brazos extendidos ~ 150°, tracción a torso ~ 70°
    angles = np.full(n_frames, 150.0)
    
    # 3 reps completas rápidas + Rep 4 cortada al final del vídeo
    # Tempo concéntrico rápido (< 1.0s)
    rep_windows = [
        (int(0.6 * fps), int(1.4 * fps), int(2.6 * fps)),   # Rep 1: conc ~0.8s, ROM 80°
        (int(3.0 * fps), int(3.8 * fps), int(5.0 * fps)),   # Rep 2: conc ~0.8s, ROM 80°
        (int(5.5 * fps), int(6.4 * fps), int(7.8 * fps)),   # Rep 3: conc ~0.9s, ROM 80°
        (int(8.4 * fps), int(9.6 * fps), int(11.8 * fps))   # Rep 4 cortada: termina en 11.8s (a 0.2s del final), ROM recortado a 105° (ROM 45°)
    ]
    
    for idx, (f_start, f_inflect, f_end) in enumerate(rep_windows):
        target_flex = 70.0 if idx < 3 else 105.0 # Última rep incompleta / soltando
        # Concéntrica (tirón hacia el cuerpo)
        for f in range(f_start, f_inflect + 1):
            frac = (f - f_start) / max(1, f_inflect - f_start)
            angles[f] = 150.0 - (150.0 - target_flex) * frac
        # Excéntrica (retorno)
        for f in range(f_inflect + 1, f_end + 1):
            frac = (f - f_inflect) / max(1, f_end - f_inflect)
            angles[f] = target_flex + (150.0 - target_flex) * frac
            
    frames_kp = _build_pose_keypoints(angles, n_frames, is_pull=True)
    boxes = [{"box": [100, 100, 400, 400]} for _ in range(n_frames)]
    
    result = process_kinematics(
        raw_keypoints=frames_kp,
        timestamps=timestamps,
        exercise_type="t_bar_row",
        exercise_name="Remo en Punta T-Bar",
        target_muscle="upper_back",
        load_type="machine",
        athlete_boxes=boxes,
        img_w=720,
        img_h=1280,
        weight_kg=60.0,
        target_reps=4,
        frames_rgb=None,
        is_manual_override=True,
        run_vlm=False
    )
    
    metrics = result.get("intensity_metrics", {})
    exact_rir = metrics.get("exact_rir", 0.0)
    vel_loss = metrics.get("velocity_loss_pct", 0.0)
    rir_str = metrics.get("estimated_rir", "")
    verdict = metrics.get("coach_verdict", "")
    
    print(f"[Test T-Bar Row] RIR={exact_rir}, V_loss={vel_loss}%, RIR_str='{rir_str}', Verdict='{verdict}'")
    
    # Regla: Tempo concéntrico rápido (< 1.2s) y rep cortada al final NO deben disparar RIR 0
    assert exact_rir >= 2.0, f"Se disparó RIR {exact_rir} (< 2.0) a pesar de ser serie rápida con rep cortada!"
    assert vel_loss <= 28.0, f"Pérdida de velocidad {vel_loss}% excede el umbral seguro de 28%!"
    assert "Fallo concéntrico" not in verdict, f"El veredicto diagnosticó fallo muscular erróneo: {verdict}"
