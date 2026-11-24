import sys
import os
import math
import numpy as np
from unittest.mock import MagicMock

# Mock torch for environment compatibility
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

def test_incline_press_2_reps_in_13s():
    """
    Test a 13-second incline press video with 2 clean repetitions where
    Rep 1 begins eccentric descent at t ~ 1.0s - 1.5s.
    Verifies that Rep 1 is NOT lost/classified as IDLE, and total_reps == 2.
    """
    fps = 15.0
    dt = 1.0 / fps
    total_duration = 13.0
    n_frames = int(total_duration * fps) # 195 frames
    
    timestamps = [f * dt for f in range(n_frames)]
    
    # Angle curve for Incline Press:
    # Pattern B (Elbow angle: Lockout ~ 160°, Bottom/Chest ~ 75°)
    # - t=0.0 to 1.0s (frames 0..15): Unrack & lockout hold at 160°
    # - Rep 1 (t=1.0s to 6.0s):
    #   - Eccentric descent (t=1.0 to 3.2s, 33 frames): 160° -> 75°
    #   - Inflection / pause (t=3.2 to 3.5s, 5 frames): 75°
    #   - Concentric press (t=3.5 to 5.5s, 30 frames): 75° -> 160°
    #   - Top pause (t=5.5 to 6.5s, 15 frames): 160°
    # - Rep 2 (t=6.5s to 11.5s):
    #   - Eccentric descent (t=6.5 to 8.7s): 160° -> 75°
    #   - Inflection / pause (t=8.7 to 9.0s): 75°
    #   - Concentric press (t=9.0 to 11.2s): 75° -> 160°
    # - Racking hold (t=11.2 to 13.0s): 160°
    
    angles = np.full(n_frames, 160.0)
    
    # Rep 1 descent: frames 15 to 48 (t=1.0 to 3.2s)
    f_desc1_start = 15
    f_desc1_end = 48
    for f in range(f_desc1_start, f_desc1_end + 1):
        frac = (f - f_desc1_start) / (f_desc1_end - f_desc1_start)
        angles[f] = 160.0 - (160.0 - 75.0) * frac
        
    # Rep 1 bottom: frames 49 to 53 (t=3.26 to 3.53s)
    angles[49:54] = 75.0
    
    # Rep 1 concentric: frames 54 to 83 (t=3.6 to 5.53s)
    f_conc1_start = 54
    f_conc1_end = 83
    for f in range(f_conc1_start, f_conc1_end + 1):
        frac = (f - f_conc1_start) / (f_conc1_end - f_conc1_start)
        angles[f] = 75.0 + (160.0 - 75.0) * frac
        
    # Rep 2 descent: frames 98 to 131 (t=6.53 to 8.73s)
    f_desc2_start = 98
    f_desc2_end = 131
    for f in range(f_desc2_start, f_desc2_end + 1):
        frac = (f - f_desc2_start) / (f_desc2_end - f_desc2_start)
        angles[f] = 160.0 - (160.0 - 75.0) * frac
        
    # Rep 2 bottom: frames 132 to 135
    angles[132:136] = 75.0
    
    # Rep 2 concentric: frames 136 to 168 (t=9.06 to 11.2s)
    f_conc2_start = 136
    f_conc2_end = 168
    for f in range(f_conc2_start, f_conc2_end + 1):
        frac = (f - f_conc2_start) / (f_conc2_end - f_conc2_start)
        angles[f] = 75.0 + (160.0 - 75.0) * frac
        
    # Build 2D keypoints
    frames_keypoints = []
    L_forearm = 0.18
    for f in range(n_frames):
        el_ang = angles[f]
        sh_x, sh_y = 0.45, 0.40
        hp_x, hp_y = 0.55, 0.65
        kn_x, kn_y = 0.52, 0.85
        ak_x, ak_y = 0.50, 0.95
        
        # Upper arm: shoulder to elbow
        el_x = 0.45
        el_y = 0.60
        
        # Forearm: elbow to wrist satisfying calculate_angle_2d(sh, el, wr) == el_ang
        rad = math.radians(el_ang)
        wr_x = el_x + L_forearm * math.sin(rad)
        wr_y = el_y - L_forearm * math.cos(rad)
        
        frame_kp = {
            "left_shoulder": {"x": sh_x, "y": sh_y, "score": 0.95},
            "left_elbow": {"x": el_x, "y": el_y, "score": 0.95},
            "left_wrist": {"x": wr_x, "y": wr_y, "score": 0.95},
            "left_hip": {"x": hp_x, "y": hp_y, "score": 0.95},
            "left_knee": {"x": kn_x, "y": kn_y, "score": 0.95},
            "left_ankle": {"x": ak_x, "y": ak_y, "score": 0.95},
            "left_ear": {"x": 0.42, "y": 0.32, "score": 0.95},
            
            "right_shoulder": {"x": sh_x - 0.02, "y": sh_y, "score": 0.40},
            "right_elbow": {"x": el_x - 0.02, "y": el_y, "score": 0.40},
            "right_wrist": {"x": wr_x - 0.02, "y": wr_y, "score": 0.40},
            "right_hip": {"x": hp_x - 0.02, "y": hp_y, "score": 0.40},
            "right_knee": {"x": kn_x - 0.02, "y": kn_y, "score": 0.40},
            "right_ankle": {"x": ak_x - 0.02, "y": ak_y, "score": 0.40},
            "right_ear": {"x": 0.40, "y": 0.32, "score": 0.40},
            "nose": {"x": 0.41, "y": 0.35, "score": 0.90}
        }
        frames_keypoints.append(frame_kp)
        
    result = process_kinematics(
        raw_keypoints=frames_keypoints,
        timestamps=timestamps,
        exercise_type="incline_press",
        target_muscle="chest",
        load_type="free_weight",
        img_w=1280,
        img_h=720,
        run_vlm=False
    )
    
    reps = result.get("repetitions_summary", [])
    print(f"Detected reps in 13s incline press: {len(reps)}")
    for r in reps:
        print(f"Rep {r['rep_number']}: start={r['start_time']}s, bottom={r['inflection_time']}s, end={r['end_time']}s, rom={r['rom_deg']}°")
        
    assert len(reps) == 2, f"Expected exactly 2 reps, got {len(reps)}"
    assert reps[0]["start_time"] <= 2.0, f"Expected Rep 1 start <= 2.0s, got {reps[0]['start_time']}"
    print("TEST PASSED: Incline press 13s with 2 reps detected both reps accurately without losing Rep 1!")

def test_incline_press_4_reps_elbow_angle_55_to_150():
    """
    (2) Valida la detección de 4 repeticiones completas en un press inclinado de 19 s
    con ángulo de codo variando de 55° a 150°.
    Verifica que:
    - La serie comienza tan pronto como el ángulo cambia >= 20° desde la posición inicial.
    - Se detectan exactamente 4 repeticiones completas.
    - Cada repetición supera los 35° de ROM (amplitud ~95°).
    - La Rep #1 inicia tempranamente (t <= 1.5s), sin quedarse en 'PREPARACIÓN / IDLE' hasta t=7s.
    """
    fps = 15.0
    dt = 1.0 / fps
    total_duration = 19.0
    n_frames = int(total_duration * fps) # 285 frames
    timestamps = [f * dt for f in range(n_frames)]
    
    # Iniciar en posición de preparación/bloqueo a 150°
    angles = np.full(n_frames, 150.0)
    
    # 4 repeticiones completas (descenso a 55°, subida a 150°)
    rep_windows = [
        (int(0.6 * fps), int(2.2 * fps), int(4.0 * fps)),    # Rep 1: 0.6s -> 2.2s -> 4.0s
        (int(4.8 * fps), int(6.4 * fps), int(8.2 * fps)),    # Rep 2: 4.8s -> 6.4s -> 8.2s
        (int(9.0 * fps), int(10.7 * fps), int(12.5 * fps)),  # Rep 3: 9.0s -> 10.7s -> 12.5s
        (int(13.4 * fps), int(15.2 * fps), int(17.1 * fps))  # Rep 4: 13.4s -> 15.2s -> 17.1s
    ]
    
    for f_start, f_inflect, f_end in rep_windows:
        # Descenso excéntrico a 55°
        for f in range(f_start, f_inflect + 1):
            frac = (f - f_start) / max(1, f_inflect - f_start)
            angles[f] = 150.0 - (150.0 - 55.0) * frac
        # Subida concéntrica a 150°
        for f in range(f_inflect + 1, f_end + 1):
            frac = (f - f_inflect) / max(1, f_end - f_inflect)
            angles[f] = 55.0 + (150.0 - 55.0) * frac

    frames_keypoints = []
    L_forearm = 0.18
    for f in range(n_frames):
        el_ang = float(angles[f])
        sh_x, sh_y = 0.45, 0.40
        hp_x, hp_y = 0.55, 0.65
        kn_x, kn_y = 0.52, 0.85
        ak_x, ak_y = 0.50, 0.95
        
        # Upper arm
        el_x = 0.45
        el_y = 0.60
        
        # Forearm aligned with elbow angle
        rad = math.radians(el_ang)
        wr_x = el_x + L_forearm * math.sin(rad)
        wr_y = el_y - L_forearm * math.cos(rad)
        
        frame_kp = {
            "left_shoulder": {"x": sh_x, "y": sh_y, "score": 0.95},
            "left_elbow": {"x": el_x, "y": el_y, "score": 0.95},
            "left_wrist": {"x": wr_x, "y": wr_y, "score": 0.95},
            "left_hip": {"x": hp_x, "y": hp_y, "score": 0.95},
            "left_knee": {"x": kn_x, "y": kn_y, "score": 0.95},
            "left_ankle": {"x": ak_x, "y": ak_y, "score": 0.95},
            "left_ear": {"x": 0.42, "y": 0.32, "score": 0.95},
            
            "right_shoulder": {"x": sh_x - 0.02, "y": sh_y, "score": 0.40},
            "right_elbow": {"x": el_x - 0.02, "y": el_y, "score": 0.40},
            "right_wrist": {"x": wr_x - 0.02, "y": wr_y, "score": 0.40},
            "right_hip": {"x": hp_x - 0.02, "y": hp_y, "score": 0.40},
            "right_knee": {"x": kn_x - 0.02, "y": kn_y, "score": 0.40},
            "right_ankle": {"x": ak_x - 0.02, "y": ak_y, "score": 0.40},
            "right_ear": {"x": 0.40, "y": 0.32, "score": 0.40},
            "nose": {"x": 0.41, "y": 0.35, "score": 0.90}
        }
        frames_keypoints.append(frame_kp)
        
    result = process_kinematics(
        raw_keypoints=frames_keypoints,
        timestamps=timestamps,
        exercise_type="incline_press",
        exercise_name="Press Inclinado con Mancuernas 19s",
        target_muscle="chest",
        load_type="dumbbell",
        img_w=720,
        img_h=1280,
        run_vlm=False
    )
    
    reps = result.get("repetitions_summary", [])
    total_reps = result.get("total_reps", 0)
    print(f"[Test Incline Press 19s] Detected reps: {total_reps}")
    for r in reps:
        print(f"  Rep {r['rep_number']}: start={r['start_time']}s, bottom={r['inflection_time']}s, end={r['end_time']}s, rom={r['rom_deg']}°")
        
    assert total_reps == 4, f"Se esperaban 4 repeticiones completas, pero se detectaron {total_reps}"
    assert reps[0]["start_time"] <= 1.5, f"La Rep #1 empezó tarde en t={reps[0]['start_time']}s (esperado <= 1.5s)"
    for r in reps:
        assert r["rom_deg"] >= 35.0, f"La Rep #{r['rep_number']} tiene ROM {r['rom_deg']}° < 35°"
        assert abs(r["rom_deg"] - 95.0) <= 15.0, f"La Rep #{r['rep_number']} debería rondar 95° ROM, dio {r['rom_deg']}°"

if __name__ == "__main__":
    test_incline_press_2_reps_in_13s()
    test_incline_press_4_reps_elbow_angle_55_to_150()
