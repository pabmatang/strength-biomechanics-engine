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

def test_incline_press_lateral_floor_intro_bottom_start_5_reps_fatigue():
    """
    4s iniciales con visibilidad baja (suelo) + 25s de plano lateral donde el lado izquierdo
    tiene visibilidad 0.15 (ocluido) y el derecho 0.92, realizando 5 repeticiones empezando
    desde abajo (60° -> 155° -> 60°) con fatiga progresiva (concéntrica de 1.1s en R1 a 3.2s en R5).
    """
    fps = 15.0
    dt = 1.0 / fps
    total_duration = 29.0
    n_frames = int(total_duration * fps)  # 435 frames
    timestamps = [f * dt for f in range(n_frames)]

    # Build angle trajectory starting from bottom (60°) at t = 4.0s (frame 60)
    angles = np.full(n_frames, 60.0)
    # 5 reps: R1..R5 with concentric durations 1.1s, 1.4s, 1.8s, 2.4s, 3.2s and ~1.5s eccentric
    con_durs = [1.1, 1.4, 1.8, 2.4, 3.2]
    ecc_dur = 1.5
    cur_t = 4.2  # start pushing up at t=4.2s
    for idx_r, con_d in enumerate(con_durs):
        t_con_start = cur_t
        t_con_end = cur_t + con_d
        f0 = int(round(t_con_start * fps))
        f1 = min(n_frames - 1, int(round(t_con_end * fps)))
        for f in range(f0, f1 + 1):
            frac = (f - f0) / max(1, f1 - f0)
            angles[f] = 60.0 + (155.0 - 60.0) * frac

        # Hold briefly at lockout (0.3s)
        f_hold_end = min(n_frames - 1, f1 + int(round(0.3 * fps)))
        angles[f1 : f_hold_end + 1] = 155.0

        # Eccentric descent back to 60° (except after R5, where it holds or descends partially)
        t_ecc_start = f_hold_end * dt
        t_ecc_end = t_ecc_start + ecc_dur
        fe0 = f_hold_end
        fe1 = min(n_frames - 1, int(round(t_ecc_end * fps)))
        for f in range(fe0, fe1 + 1):
            frac = (f - fe0) / max(1, fe1 - fe0)
            angles[f] = 155.0 - (155.0 - 60.0) * frac

        cur_t = fe1 * dt + 0.3

    frames_keypoints = []
    L_forearm = 0.18
    for f in range(n_frames):
        t = timestamps[f]
        is_floor = t < 4.0
        el_ang = angles[f]
        sh_x, sh_y = 0.45, 0.40
        hp_x, hp_y = 0.55, 0.65
        kn_x, kn_y = 0.52, 0.85
        ak_x, ak_y = 0.50, 0.95
        el_x, el_y = 0.45, 0.60

        rad = math.radians(el_ang)
        wr_x = el_x + L_forearm * math.sin(rad)
        wr_y = el_y - L_forearm * math.cos(rad)

        right_score = 0.12 if is_floor else 0.92
        left_score = 0.12 if is_floor else 0.15

        frame_kp = {
            "left_shoulder": {"x": sh_x - 0.02, "y": sh_y, "score": left_score},
            "left_elbow": {"x": el_x - 0.02, "y": el_y, "score": left_score},
            "left_wrist": {"x": wr_x - 0.02, "y": wr_y, "score": left_score},
            "left_hip": {"x": hp_x - 0.02, "y": hp_y, "score": left_score},
            "left_knee": {"x": kn_x - 0.02, "y": kn_y, "score": left_score},
            "left_ankle": {"x": ak_x - 0.02, "y": ak_y, "score": left_score},
            "left_ear": {"x": 0.40, "y": 0.32, "score": left_score},

            "right_shoulder": {"x": sh_x, "y": sh_y, "score": right_score},
            "right_elbow": {"x": el_x, "y": el_y, "score": right_score},
            "right_wrist": {"x": wr_x, "y": wr_y, "score": right_score},
            "right_hip": {"x": hp_x, "y": hp_y, "score": right_score},
            "right_knee": {"x": kn_x, "y": kn_y, "score": right_score},
            "right_ankle": {"x": ak_x, "y": ak_y, "score": right_score},
            "right_ear": {"x": 0.42, "y": 0.32, "score": right_score},
            "nose": {"x": 0.41, "y": 0.35, "score": right_score},
        }
        frames_keypoints.append(frame_kp)

    result = process_kinematics(
        raw_keypoints=frames_keypoints,
        timestamps=timestamps,
        exercise_type="incline_press",
        exercise_name="Technogym Pure Strength - Incline Chest Press",
        target_muscle="chest",
        load_type="plate_loaded",
        img_w=720,
        img_h=1280,
        run_vlm=False,
    )

    total_reps = result.get("total_reps", 0)
    intensity = result.get("intensity_metrics", {})
    vel_loss = float(intensity.get("velocity_loss_pct", 0.0))
    exact_rir = float(intensity.get("exact_rir", 4.0))
    rep_vels = intensity.get("rep_velocities", [])
    frames_out = result.get("frames", [])

    assert total_reps == 5, f"Expected 5 reps, got {total_reps}"
    assert len(rep_vels) == 5, f"Expected 5 rep_velocities, got {len(rep_vels)}"
    assert vel_loss >= 30.0, f"Expected velocity_loss_pct >= 30%, got {vel_loss}%"
    assert exact_rir <= 2.0, f"Expected RIR <= 2, got {exact_rir}"

    # Floor intro frames (t < 3.8s) must not draw ghost skeleton and must be IDLE
    for fo in frames_out:
        if fo["timestamp_sec"] < 3.8:
            assert fo.get("pose_visible") is False
            assert fo.get("phase") == "IDLE"

    # Radiografía snapshots must be inside a real rep with >= 60 deg elbow delta
    reps = result.get("repetitions_summary", [])
    rep_target = reps[min(1, len(reps) - 1)]
    bottom_f = int(rep_target["valley_idx"])
    lockout_f = int(rep_target["peak_idx"])
    el_bottom = float(frames_out[bottom_f]["angles"]["elbow"])
    el_lockout = float(frames_out[lockout_f]["angles"]["elbow"])
    assert (el_lockout - el_bottom) >= 60.0, (
        f"Expected elbow_angle[lockout] - elbow_angle[bottom] >= 60°, got {el_lockout - el_bottom:.1f}°"
    )


def test_no_flatline_after_fast_transition_and_spike():
    """
    Reproduces Video_Project_5 failure mode:
    - Floor/walk frames with >0.07/frame jump transitioning into seated Incline Press
    - Fast concentric push (>0.07 wrist displacement in 1 frame)
    - One single-frame spike glitch
    Previously Max Joint Jump Clamp froze s_arr=0 forever after the first >0.07 jump,
    flattening elbow angle at ~153° for the whole set. Must track all 4 reps cleanly.
    """
    fps = 15.0
    dt = 1.0 / fps
    n_frames = int(20.0 * fps)
    timestamps = [f * dt for f in range(n_frames)]

    angles = np.full(n_frames, 155.0)
    # 4 reps starting at t=5.0s (frame 75)
    for rep_i in range(4):
        f_top = 75 + rep_i * 45
        f_bot = f_top + 20
        f_end = f_top + 38
        for f in range(f_top, f_bot + 1):
            frac = (f - f_top) / max(1, f_bot - f_top)
            angles[f] = 155.0 - 90.0 * frac
        for f in range(f_bot, f_end + 1):
            frac = (f - f_bot) / max(1, f_end - f_bot)
            angles[f] = 65.0 + 90.0 * frac

    frames_keypoints = []
    L_forearm = 0.25
    for f in range(n_frames):
        t = timestamps[f]
        if t < 4.0:
            # Floor/walk frames at totally different screen coords with >0.07 shift into seat
            sh_x, sh_y = 0.20, 0.25
            hp_x, hp_y = 0.22, 0.45
            kn_x, kn_y = 0.25, 0.70
            ak_x, ak_y = 0.25, 0.90
            el_x, el_y = 0.15, 0.30
            wr_x, wr_y = 0.12, 0.20
            sc = 0.35  # high enough during walk to trigger old jump clamp!
        else:
            sh_x, sh_y = 0.65, 0.48
            hp_x, hp_y = 0.58, 0.72
            kn_x, kn_y = 0.45, 0.80
            ak_x, ak_y = 0.42, 0.95
            el_x, el_y = 0.62, 0.56
            rad = math.radians(angles[f])
            wr_x = el_x - L_forearm * math.sin(rad)
            wr_y = el_y - L_forearm * math.cos(rad)
            sc = 0.90

        # Inject a single-frame spike glitch at f=160
        if f == 160:
            wr_x, wr_y = 0.95, 0.10

        frames_keypoints.append({
            "left_shoulder": {"x": sh_x, "y": sh_y, "score": sc},
            "left_elbow": {"x": el_x, "y": el_y, "score": sc},
            "left_wrist": {"x": wr_x, "y": wr_y, "score": sc},
            "left_hip": {"x": hp_x, "y": hp_y, "score": sc},
            "left_knee": {"x": kn_x, "y": kn_y, "score": sc},
            "left_ankle": {"x": ak_x, "y": ak_y, "score": sc},
            "left_ear": {"x": 0.63, "y": 0.36, "score": sc},
            "right_shoulder": {"x": sh_x - 0.18, "y": sh_y, "score": 0.85 if t >= 4.0 else 0.35},
            "right_elbow": {"x": el_x - 0.22, "y": el_y, "score": 0.85 if t >= 4.0 else 0.35},
            "right_wrist": {"x": wr_x - 0.12, "y": wr_y, "score": 0.85 if t >= 4.0 else 0.35},
            "right_hip": {"x": hp_x - 0.12, "y": hp_y, "score": 0.85 if t >= 4.0 else 0.35},
            "right_knee": {"x": kn_x - 0.10, "y": kn_y, "score": 0.85 if t >= 4.0 else 0.35},
            "right_ankle": {"x": ak_x - 0.10, "y": ak_y, "score": 0.85 if t >= 4.0 else 0.35},
            "right_ear": {"x": 0.50, "y": 0.36, "score": 0.85 if t >= 4.0 else 0.35},
            "nose": {"x": 0.56, "y": 0.38, "score": sc},
        })

    res = process_kinematics(
        raw_keypoints=frames_keypoints,
        timestamps=timestamps,
        exercise_type="auto",
        exercise_name="",
        target_muscle="auto",
        load_type="auto",
        img_w=720,
        img_h=1280,
        run_vlm=False,
    )
    assert res.get("total_reps", 0) == 4, f"Expected 4 reps (no flatline!), got {res.get('total_reps')}"


def test_incline_press_4th_rep_at_clip_edge_and_avg_tempo_no_idle_leak():
    """
    4th slow rep ending 0.2s before clip end must be counted (4 reps total),
    reflected in velocity_loss_pct & RIR, and avg_tempo must exclude prior IDLE setup time.
    """
    fps = 15.0
    dt = 1.0 / fps
    total_duration = 16.0
    n_frames = int(total_duration * fps)  # 240 frames
    timestamps = [f * dt for f in range(n_frames)]

    angles = np.full(n_frames, 155.0)
    # 5s IDLE floor/setup at start, then 4 reps:
    # R1: t=5.0..7.0 (ecc 1.0, con 1.0)
    # R2: t=7.2..9.3 (ecc 1.0, con 1.1)
    # R3: t=9.5..12.1 (ecc 1.1, con 1.5)
    # R4: t=12.3..15.8 (ecc 1.0, con 2.5 -> ends at 15.8s, 0.2s before 16.0s!)
    reps_spec = [
        (5.0, 6.0, 7.0),
        (7.2, 8.2, 9.3),
        (9.5, 10.6, 12.1),
        (12.3, 13.3, 15.8),
    ]
    for t0, t_bot, t1 in reps_spec:
        f0 = int(round(t0 * fps))
        fb = int(round(t_bot * fps))
        f1 = min(n_frames - 1, int(round(t1 * fps)))
        for f in range(f0, fb + 1):
            angles[f] = 155.0 - 90.0 * ((f - f0) / max(1, fb - f0))
        for f in range(fb, f1 + 1):
            angles[f] = 65.0 + 90.0 * ((f - fb) / max(1, f1 - fb))

    frames_keypoints = []
    L_forearm = 0.20
    for f in range(n_frames):
        t = timestamps[f]
        sc = 0.15 if t < 4.5 else 0.92
        sh_x, sh_y = 0.45, 0.40
        el_x, el_y = 0.45, 0.60
        rad = math.radians(angles[f])
        wr_x = el_x + L_forearm * math.sin(rad)
        wr_y = el_y - L_forearm * math.cos(rad)
        frames_keypoints.append({
            "left_shoulder": {"x": sh_x - 0.02, "y": sh_y, "score": 0.15},
            "left_elbow": {"x": el_x - 0.02, "y": el_y, "score": 0.15},
            "left_wrist": {"x": wr_x - 0.02, "y": wr_y, "score": 0.15},
            "left_hip": {"x": 0.53, "y": 0.65, "score": 0.15},
            "left_knee": {"x": 0.50, "y": 0.85, "score": 0.15},
            "left_ankle": {"x": 0.48, "y": 0.95, "score": 0.15},
            "left_ear": {"x": 0.40, "y": 0.32, "score": 0.15},
            "right_shoulder": {"x": sh_x, "y": sh_y, "score": sc},
            "right_elbow": {"x": el_x, "y": el_y, "score": sc},
            "right_wrist": {"x": wr_x, "y": wr_y, "score": sc},
            "right_hip": {"x": 0.55, "y": 0.65, "score": sc},
            "right_knee": {"x": 0.52, "y": 0.85, "score": sc},
            "right_ankle": {"x": 0.50, "y": 0.95, "score": sc},
            "right_ear": {"x": 0.42, "y": 0.32, "score": sc},
            "nose": {"x": 0.41, "y": 0.35, "score": sc},
        })

    res = process_kinematics(
        raw_keypoints=frames_keypoints,
        timestamps=timestamps,
        exercise_type="incline_press",
        exercise_name="Incline Press",
        target_muscle="chest",
        load_type="plate_loaded",
        img_w=720,
        img_h=1280,
        run_vlm=False,
    )
    assert res.get("total_reps") == 4, f"Expected 4 reps (including edge rep), got {res.get('total_reps')}"
    im = res.get("intensity_metrics", {})
    assert float(im.get("velocity_loss_pct", 0.0)) >= 30.0, f"Expected >=30% velocity loss, got {im.get('velocity_loss_pct')}"
    assert float(im.get("exact_rir", 4.0)) <= 2.0, f"Expected RIR <= 2, got {im.get('exact_rir')}"

    avg_tempo = res.get("avg_tempo", {})
    # 5s IDLE at start must NOT contaminate eccentric_s (~1.0s, never >= 2.0s)
    assert avg_tempo.get("eccentric_s", 9.9) <= 1.6, f"IDLE leaked into avg_tempo: {avg_tempo}"
    assert avg_tempo.get("formatted") == f"{res['mean_eccentric_time_s']:.1f}s-{res['mean_pause_time_s']:.1f}s-{res['mean_concentric_time_s']:.1f}s"
    aw = res.get("active_window", {})
    assert aw.get("start_sec", 0.0) >= 4.0, f"Expected active_window.start_sec >= 4.0, got {aw}"


def test_trimmed_timestamps_within_clip_bounds():
    """
    With start_sec=9.0 and end_sec=30.0 (21.0s clip), all returned events
    (frames, repetitions_summary, active_window, deterministic timeline_cues)
    must strictly satisfy 0.0 <= t <= 21.0.
    """
    fps = 15.0
    dt = 1.0 / fps
    n_frames = int(21.0 * fps)
    # Simulate raw unshifted timestamps [9.0 .. 30.0] passed to process_kinematics
    timestamps = [9.0 + f * dt for f in range(n_frames)]

    angles = np.full(n_frames, 155.0)
    for rep_i in range(3):
        f0 = 15 + rep_i * 75
        fb = f0 + 30
        f1 = f0 + 60
        for f in range(f0, fb + 1):
            angles[f] = 155.0 - 90.0 * ((f - f0) / 30.0)
        for f in range(fb, f1 + 1):
            angles[f] = 65.0 + 90.0 * ((f - fb) / 30.0)

    frames_keypoints = []
    for f in range(n_frames):
        rad = math.radians(angles[f])
        wr_x = 0.45 + 0.20 * math.sin(rad)
        wr_y = 0.60 - 0.20 * math.cos(rad)
        frames_keypoints.append({
            "left_shoulder": {"x": 0.45, "y": 0.40, "score": 0.92},
            "left_elbow": {"x": 0.45, "y": 0.60, "score": 0.92},
            "left_wrist": {"x": wr_x, "y": wr_y, "score": 0.92},
            "left_hip": {"x": 0.55, "y": 0.65, "score": 0.92},
            "left_knee": {"x": 0.52, "y": 0.85, "score": 0.92},
            "left_ankle": {"x": 0.50, "y": 0.95, "score": 0.92},
            "left_ear": {"x": 0.42, "y": 0.32, "score": 0.92},
            "right_shoulder": {"x": 0.43, "y": 0.40, "score": 0.20},
            "right_elbow": {"x": 0.43, "y": 0.60, "score": 0.20},
            "right_wrist": {"x": wr_x - 0.02, "y": wr_y, "score": 0.20},
            "right_hip": {"x": 0.53, "y": 0.65, "score": 0.20},
            "right_knee": {"x": 0.50, "y": 0.85, "score": 0.20},
            "right_ankle": {"x": 0.48, "y": 0.95, "score": 0.20},
            "right_ear": {"x": 0.40, "y": 0.32, "score": 0.20},
            "nose": {"x": 0.41, "y": 0.35, "score": 0.90},
        })

    res = process_kinematics(
        raw_keypoints=frames_keypoints,
        timestamps=timestamps,
        exercise_type="incline_press",
        target_muscle="chest",
        load_type="plate_loaded",
        img_w=720,
        img_h=1280,
        run_vlm=False,
    )
    clip_dur = 21.0
    for fo in res.get("frames", []):
        assert 0.0 <= fo["timestamp_sec"] <= clip_dur
    for r in res.get("repetitions_summary", []):
        assert 0.0 <= r["start_time"] <= clip_dur
        assert 0.0 <= r["inflection_time"] <= clip_dur
        assert 0.0 <= r["end_time"] <= clip_dur
        if r.get("sticking_point_sec") is not None:
            assert 0.0 <= r["sticking_point_sec"] <= clip_dur
    aw = res.get("active_window", {})
    assert 0.0 <= aw.get("start_sec", 0.0) <= clip_dur
    assert 0.0 <= aw.get("end_sec", 0.0) <= clip_dur


def test_camera_stability_flags_25pct_scale_drift():
    """
    A progressive 25% increase in apparent skeleton scale (handheld zoom/approach)
    must flag camera_stability['stable'] == False and scale_drift_pct > 18.0.
    """
    fps = 15.0
    dt = 1.0 / fps
    n_frames = 150
    timestamps = [f * dt for f in range(n_frames)]
    frames_keypoints = []
    for f in range(n_frames):
        scale = 1.0 + 0.38 * (f / max(1, n_frames - 1))  # >25% scale growth across working reps
        sh_x, sh_y = 0.45, 0.40
        el_y = sh_y + 0.18 * scale
        hp_x = sh_x + 0.10 * scale
        hp_y = sh_y + 0.25 * scale
        ang = 110.0 + 40.0 * math.sin(2.0 * math.pi * f / 35.0)
        rad = math.radians(ang)
        wr_x = sh_x + 0.16 * scale * math.sin(rad)
        wr_y = el_y - 0.16 * scale * math.cos(rad)
        frames_keypoints.append({
            "left_shoulder": {"x": sh_x, "y": sh_y, "score": 0.92},
            "left_elbow": {"x": sh_x, "y": el_y, "score": 0.92},
            "left_wrist": {"x": wr_x, "y": wr_y, "score": 0.92},
            "left_hip": {"x": hp_x, "y": hp_y, "score": 0.92},
            "left_knee": {"x": 0.52, "y": 0.85, "score": 0.92},
            "left_ankle": {"x": 0.50, "y": 0.95, "score": 0.92},
            "left_ear": {"x": 0.42, "y": 0.32, "score": 0.92},
            "right_shoulder": {"x": 0.43, "y": sh_y, "score": 0.20},
            "right_elbow": {"x": 0.43, "y": el_y, "score": 0.20},
            "right_wrist": {"x": wr_x - 0.02, "y": wr_y, "score": 0.20},
            "right_hip": {"x": 0.53, "y": hp_y, "score": 0.20},
            "right_knee": {"x": 0.50, "y": 0.85, "score": 0.20},
            "right_ankle": {"x": 0.48, "y": 0.95, "score": 0.20},
            "right_ear": {"x": 0.40, "y": 0.32, "score": 0.20},
            "nose": {"x": 0.41, "y": 0.35, "score": 0.90},
        })

    res = process_kinematics(
        raw_keypoints=frames_keypoints,
        timestamps=timestamps,
        exercise_type="incline_press",
        target_muscle="chest",
        load_type="plate_loaded",
        img_w=720,
        img_h=1280,
        run_vlm=False,
    )
    cs = res.get("camera_stability", {})
    assert cs.get("stable") is False, f"Expected unstable camera, got {cs}"
    assert float(cs.get("scale_drift_pct", 0.0)) > 18.0


def test_rtdetr_strided_and_vitpose_batched_output_format():
    """
    RT-DETR strided (1 of every 5 frames) + ViTPose batched inference must return
    the exact same length (n_frames) and COCO keypoint dict schema as frame-by-frame.
    """
    import main as backend_main

    n_frames = 13
    frames_rgb = [np.full((240, 180, 3), 128, dtype=np.uint8) for _ in range(n_frames)]

    det_call_batch_sizes = []

    class FakeTensor:
        def __init__(self, shape):
            self.shape = shape

        def to(self, *args, **kwargs):
            return self

    class FakeDetProcessor:
        def __call__(self, images, return_tensors="pt"):
            det_call_batch_sizes.append(len(images))
            return {"pixel_values": FakeTensor((len(images), 3, 240, 180))}

        def post_process_object_detection(self, outputs, target_sizes, threshold=0.2):
            bs = len(target_sizes) if hasattr(target_sizes, "__len__") else 1
            return [
                {
                    "boxes": np.array([[20.0, 40.0, 150.0, 220.0]], dtype=np.float32),
                    "scores": np.array([0.95], dtype=np.float32),
                    "labels": np.array([0], dtype=np.int64),
                }
                for _ in range(bs)
            ]

    class FakeDetModel:
        def parameters(self):
            yield MagicMock(dtype=np.float32)

        def __call__(self, **kwargs):
            return MagicMock(logits=None, pred_boxes=None)

    class FakePoseProcessor:
        def __call__(self, images, boxes, return_tensors="pt"):
            return {"pixel_values": FakeTensor((len(images), 3, 256, 192))}

        def post_process_pose_estimation(self, outputs, boxes, **kwargs):
            bs = len(boxes)
            kps = np.tile(np.array([[90.0, 120.0]], dtype=np.float32), (17, 1))
            scs = np.full(17, 0.90, dtype=np.float32)
            return [[{"keypoints": kps, "scores": scs}] for _ in range(bs)]

    class FakePoseModel:
        def parameters(self):
            yield MagicMock(dtype=np.float32)

        def __call__(self, **kwargs):
            return MagicMock(heatmaps=None)

    orig_det_p, orig_det_m = getattr(backend_main, "det_processor", None), getattr(backend_main, "det_model", None)
    orig_pose_p, orig_pose_m = getattr(backend_main, "pose_processor", None), getattr(backend_main, "pose_model", None)
    orig_device = getattr(backend_main, "device", "cpu")
    try:
        backend_main.det_processor = FakeDetProcessor()
        backend_main.det_model = FakeDetModel()
        backend_main.pose_processor = FakePoseProcessor()
        backend_main.pose_model = FakePoseModel()
        backend_main.device = "cpu"

        raw_kps, boxes = backend_main.run_inference_batches(frames_rgb, batch_size=32)
    finally:
        backend_main.det_processor, backend_main.det_model = orig_det_p, orig_det_m
        backend_main.pose_processor, backend_main.pose_model = orig_pose_p, orig_pose_m
        backend_main.device = orig_device

    assert len(raw_kps) == n_frames
    assert len(boxes) == n_frames
    # Stride=5 on 13 frames -> sampled indices [0, 5, 10, 12] = 4 frames (< 13)
    assert sum(det_call_batch_sizes) < n_frames
    for fk in raw_kps:
        assert "left_shoulder" in fk and "right_wrist" in fk
        assert 0.0 <= fk["left_shoulder"]["x"] <= 1.0
        assert 0.0 <= fk["left_shoulder"]["y"] <= 1.0


def test_seated_incline_press_ignores_8s_standing_and_builds_alignment_frames():
    """
    8s standing intro (high hip_y=0.40, extended knee_angle~170 deg) followed by
    4 seated incline_press reps (hip_y=0.65, knee_angle~90 deg).
    Verifies standing frames are excluded from active reps and alignment_frames has 2 valid keyframes.
    """
    fps = 15.0
    dt = 1.0 / fps
    standing_frames = int(8.0 * fps)  # 120 frames
    rep_tpl = []
    for k in range(1, 16):
        rep_tpl.append(150.0 - 95.0 * (k / 15.0))
    for k in range(1, 16):
        rep_tpl.append(55.0 + 95.0 * (k / 15.0))
    seated_angles = [150.0] * 10 + rep_tpl * 4 + [150.0] * 10
    n_frames = standing_frames + len(seated_angles)
    timestamps = [f * dt for f in range(n_frames)]

    frames_keypoints = []
    L_forearm = 0.18
    for f in range(n_frames):
        is_standing = f < standing_frames
        el_ang = 165.0 if is_standing else seated_angles[f - standing_frames]
        sh_x, sh_y = (0.48, 0.22) if is_standing else (0.45, 0.40)
        hp_x, hp_y = (0.48, 0.42) if is_standing else (0.55, 0.65)
        kn_x, kn_y = (0.48, 0.68) if is_standing else (0.52, 0.85)
        ak_x, ak_y = (0.50, 0.94) if is_standing else (0.50, 0.95)
        el_x, el_y = (0.48, 0.38) if is_standing else (0.45, 0.60)
        rad = math.radians(el_ang)
        wr_x = el_x + L_forearm * math.sin(rad)
        wr_y = el_y - L_forearm * math.cos(rad)

        frames_keypoints.append({
            "left_shoulder": {"x": sh_x, "y": sh_y, "score": 0.95},
            "left_elbow": {"x": el_x, "y": el_y, "score": 0.95},
            "left_wrist": {"x": wr_x, "y": wr_y, "score": 0.95},
            "left_hip": {"x": hp_x, "y": hp_y, "score": 0.95},
            "left_knee": {"x": kn_x, "y": kn_y, "score": 0.95},
            "left_ankle": {"x": ak_x, "y": ak_y, "score": 0.95},
            "left_ear": {"x": sh_x - 0.02, "y": sh_y - 0.08, "score": 0.95},
            "right_shoulder": {"x": sh_x - 0.02, "y": sh_y, "score": 0.30},
            "right_elbow": {"x": el_x - 0.02, "y": el_y, "score": 0.30},
            "right_wrist": {"x": wr_x - 0.02, "y": wr_y, "score": 0.30},
            "right_hip": {"x": hp_x - 0.02, "y": hp_y, "score": 0.30},
            "right_knee": {"x": kn_x - 0.02, "y": kn_y, "score": 0.30},
            "right_ankle": {"x": ak_x - 0.02, "y": ak_y, "score": 0.30},
            "right_ear": {"x": sh_x - 0.04, "y": sh_y - 0.08, "score": 0.30},
            "nose": {"x": sh_x - 0.02, "y": sh_y - 0.05, "score": 0.90},
        })

    result = process_kinematics(
        raw_keypoints=frames_keypoints,
        timestamps=timestamps,
        exercise_type="incline_press",
        exercise_name="Incline Press Sentado con Intro de Pie",
        target_muscle="chest",
        load_type="machine",
        img_w=720,
        img_h=1280,
        run_vlm=False,
    )
    assert result.get("total_reps") == 4, f"Expected 4 seated reps, got {result.get('total_reps')}"
    reps = result.get("repetitions_summary", [])
    assert reps[0]["start_time"] >= 7.5, f"Standing intro leaked into Rep 1 at {reps[0]['start_time']}s"

    clip_dur = result.get("total_duration_sec", timestamps[-1])
    af = result.get("alignment_frames", [])
    assert len(af) == 2, f"Expected 2 alignment_frames, got {len(af)}"
    for item in af:
        assert 0.0 <= item["timestamp_sec"] <= clip_dur + 0.01
        assert item["status"] in ("optimal", "caution", "risk")
        assert item.get("label")
        assert item.get("clinical_note")
        assert isinstance(item.get("metrics"), dict) and len(item["metrics"]) >= 1
        assert len(item.get("overlays", [])) >= 1
        assert len(item.get("notes", [])) >= 1
    # Radiografía geometric invariant for push: lockout elbow_deg >= bottom elbow_deg + 35°
    assert af[1]["metrics"]["elbow_deg"] >= af[0]["metrics"]["elbow_deg"] + 35.0, (
        f"Inverted push keyframes: bottom={af[0]['metrics']['elbow_deg']}°, lockout={af[1]['metrics']['elbow_deg']}°"
    )


def test_hip_thrust_5_reps_alignment_and_key_moments():
    """
    Hip thrust with 5 clean hip angle oscillations (117 deg bottom <-> 174 deg lockout):
    - total_reps == 5 (no premature FIN DE SERIE cut)
    - alignment_frames[0] is at bottom (hip_deg <= 125) and alignment_frames[1] is at lockout (hip_deg >= 165)
    - key_moments / timeline_cues all have 0.0 <= timestamp_sec <= clip_duration and snapshot_b64 when frames_rgb given
    """
    fps = 15.0
    dt = 1.0 / fps
    # 5 reps of ~2.4s each (18 frames up, 18 frames down)
    rep_tpl = [117.0 + (174.0 - 117.0) * (k / 18.0) for k in range(1, 19)] + [174.0 - (174.0 - 117.0) * (k / 18.0) for k in range(1, 19)]
    angles = [117.0] * 12 + rep_tpl * 5 + [117.0] * 12
    n_frames = len(angles)
    timestamps = [f * dt for f in range(n_frames)]

    frames_keypoints = []
    frames_rgb = [np.zeros((120, 90, 3), dtype=np.uint8) for _ in range(n_frames)]
    for hip_ang in angles:
        # Hip at (0.50, 0.65), knee fixed at (0.70, 0.65), ankle at (0.72, 0.90)
        # Shoulder moves so angle(shoulder - hip - knee) == hip_ang
        rad = math.radians(hip_ang)
        hp_x, hp_y = 0.50, 0.65
        kn_x, kn_y = 0.70, 0.65
        ak_x, ak_y = 0.72, 0.90
        sh_x = hp_x + 0.25 * math.cos(rad)
        sh_y = hp_y - 0.25 * math.sin(rad)
        frames_keypoints.append({
            "left_shoulder": {"x": sh_x, "y": sh_y, "score": 0.95},
            "left_elbow": {"x": sh_x, "y": sh_y + 0.12, "score": 0.95},
            "left_wrist": {"x": sh_x + 0.08, "y": sh_y + 0.14, "score": 0.95},
            "left_hip": {"x": hp_x, "y": hp_y, "score": 0.95},
            "left_knee": {"x": kn_x, "y": kn_y, "score": 0.95},
            "left_ankle": {"x": ak_x, "y": ak_y, "score": 0.95},
            "left_ear": {"x": sh_x - 0.04, "y": sh_y - 0.06, "score": 0.95},
            "right_shoulder": {"x": sh_x, "y": sh_y, "score": 0.30},
            "right_elbow": {"x": sh_x, "y": sh_y + 0.12, "score": 0.30},
            "right_wrist": {"x": sh_x + 0.08, "y": sh_y + 0.14, "score": 0.30},
            "right_hip": {"x": hp_x, "y": hp_y, "score": 0.30},
            "right_knee": {"x": kn_x, "y": kn_y, "score": 0.30},
            "right_ankle": {"x": ak_x, "y": ak_y, "score": 0.30},
            "right_ear": {"x": sh_x - 0.04, "y": sh_y - 0.06, "score": 0.30},
            "nose": {"x": sh_x - 0.03, "y": sh_y - 0.04, "score": 0.90},
        })

    result = process_kinematics(
        raw_keypoints=frames_keypoints,
        timestamps=timestamps,
        exercise_type="hip_thrust",
        exercise_name="Hip Thrust en Máquina",
        target_muscle="glutes",
        load_type="machine",
        img_w=90,
        img_h=120,
        frames_rgb=frames_rgb,
        run_vlm=False,
    )
    assert result.get("total_reps") == 5, f"Expected 5 hip_thrust reps, got {result.get('total_reps')}"
    af = result.get("alignment_frames", [])
    assert len(af) == 2
    assert af[0]["metrics"]["hip_deg"] <= 125.0, f"Expected bottom hip_deg <= 125°, got {af[0]['metrics']['hip_deg']}"
    assert af[1]["metrics"]["hip_deg"] >= 165.0, f"Expected lockout hip_deg >= 165°, got {af[1]['metrics']['hip_deg']}"
    clip_dur = result.get("total_duration_sec", timestamps[-1])
    for km in result.get("key_moments", []):
        assert 0.0 <= km["timestamp_sec"] <= clip_dur + 0.01
        assert km.get("snapshot_b64")


if __name__ == "__main__":
    test_incline_press_2_reps_in_13s()
    test_incline_press_4_reps_elbow_angle_55_to_150()
    test_incline_press_lateral_floor_intro_bottom_start_5_reps_fatigue()
    test_no_flatline_after_fast_transition_and_spike()
    test_incline_press_4th_rep_at_clip_edge_and_avg_tempo_no_idle_leak()
    test_trimmed_timestamps_within_clip_bounds()
    test_camera_stability_flags_25pct_scale_drift()
    test_rtdetr_strided_and_vitpose_batched_output_format()
    test_seated_incline_press_ignores_8s_standing_and_builds_alignment_frames()
    test_hip_thrust_5_reps_alignment_and_key_moments()
