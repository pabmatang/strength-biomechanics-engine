import sys
import os
import math
import numpy as np
from unittest.mock import MagicMock

# Mock torch, modal, cv2 if not installed
# Mock torch with proper Tensor class for scipy compatibility
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

# Ensure backend directory is in path
sys.path.insert(0, os.path.dirname(__file__))

from main import process_kinematics

def test_t_bar_row_vbt_stability():
    """
    Test that a steady, stable execution of t_bar_row with pauses at full stretch
    does not falsely inflate concentric time or trigger catastrophic velocity loss (> 15%).
    """
    fps = 15.0
    dt = 1.0 / fps
    
    # 4 clean repetitions:
    # Each rep:
    # - pause at stretch: 0.8s (12 frames)
    # - concentric pull: 0.53s (8 frames)
    # - inflection / squeeze: 0.13s (2 frames)
    # - eccentric lower: 1.0s (15 frames)
    # Total per rep = 37 frames (~2.5s)
    # 4 reps = ~148 frames (~10s)
    
    frames_keypoints = []
    timestamps = []
    
    rep_template = []
    # 12 frames pause (elbow extended = 150 deg)
    for _ in range(12):
        rep_template.append(150.0)
    # 8 frames concentric (150 -> 65 deg)
    for k in range(1, 9):
        ang = 150.0 - (150.0 - 65.0) * (k / 8.0)
        rep_template.append(ang)
    # 2 frames inflection
    rep_template.append(65.0)
    rep_template.append(66.0)
    # 15 frames eccentric (66 -> 150 deg)
    for k in range(1, 16):
        ang = 66.0 + (150.0 - 66.0) * (k / 15.0)
        rep_template.append(ang)
        
    angles = []
    # Initial setup 10 frames
    for _ in range(10):
        angles.append(150.0)
    for _ in range(4):
        angles.extend(rep_template)
    # Final racking 15 frames
    for _ in range(15):
        angles.append(150.0)
        
    n_frames = len(angles)
    
    # Generate 2D coordinates for shoulder, elbow, wrist
    # Shoulder at (0.45, 0.35)
    # Hip at (0.55, 0.65)
    L_arm = 0.20
    L_forearm = 0.18
    for f in range(n_frames):
        t = f * dt
        timestamps.append(t)
        
        elbow_target = angles[f]
        
        sh_x, sh_y = 0.45, 0.35
        hp_x, hp_y = 0.55, 0.65
        kn_x, kn_y = 0.52, 0.85
        ak_x, ak_y = 0.50, 0.95
        
        # When pulling, upper arm rotates back from 80 deg (down) to 30 deg (back)
        frac = (150.0 - elbow_target) / (150.0 - 65.0)
        arm_angle_deg = 80.0 - 50.0 * frac
        arm_rad = math.radians(arm_angle_deg)
        el_x = sh_x + L_arm * math.cos(arm_rad)
        el_y = sh_y + L_arm * math.sin(arm_rad)
        
        # Forearm angle relative to upper arm
        forearm_angle_deg = arm_angle_deg + 180.0 - elbow_target
        forearm_rad = math.radians(forearm_angle_deg)
        wr_x = el_x + L_forearm * math.cos(forearm_rad)
        wr_y = el_y + L_forearm * math.sin(forearm_rad)
        
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
        exercise_type="t_bar_row",
        target_muscle="back",
        load_type="free_weight",
        img_w=1280,
        img_h=720,
        run_vlm=False
    )
    
    reps = result.get("repetitions_summary", [])
    print(f"Detected reps: {len(reps)}")
    for r in reps:
        print(f"Rep {r['rep_number']}: conc_s={r['concentric_sec']}, ecc_s={r['eccentric_sec']}, vel={r.get('mean_concentric_vel')}")
        
    metrics = result.get("intensity_metrics", {})
    vel_loss = metrics.get("velocity_loss_pct", 100.0)
    exact_rir = metrics.get("exact_rir", 0.0)
    print(f"Velocity Loss: {vel_loss}% | RIR: {exact_rir}")
    
    assert len(reps) >= 3, f"Expected >= 3 reps, got {len(reps)}"
    assert vel_loss <= 15.0, f"Expected velocity loss <= 15.0%, got {vel_loss}%"
    assert exact_rir >= 3.0, f"Expected exact RIR >= 3.0, got {exact_rir}"
    print("TEST PASSED: t_bar_row VBT calculation is stable and robust against stretch pauses!")

def test_t_bar_row_oblique_3_4_view_22deg_4_reps():
    """
    t_bar_row in 3/4 oblique view with compressed 22 deg elbow amplitude (4 quick reps):
    must detect total_reps == 4 (not merge into 1 rep).
    """
    fps = 15.0
    dt = 1.0 / fps
    angles = [148.0] * 10
    # 4 quick reps: ~15 frames (~1.0s) each, 148° -> 126° -> 148° (22° elbow amplitude)
    rep_tpl = []
    for k in range(1, 8):
        rep_tpl.append(148.0 - 22.0 * (k / 7.0))
    for k in range(1, 9):
        rep_tpl.append(126.0 + 22.0 * (k / 8.0))
    for _ in range(4):
        angles.extend(rep_tpl)
    angles.extend([148.0] * 10)

    n_frames = len(angles)
    timestamps = [f * dt for f in range(n_frames)]
    frames_keypoints = []
    L_arm = 0.20
    L_forearm = 0.18

    for f in range(n_frames):
        elbow_target = angles[f]
        sh_x, sh_y = 0.45, 0.35
        frac = (148.0 - elbow_target) / 22.0
        arm_angle_deg = 85.0 - 45.0 * frac
        arm_rad = math.radians(arm_angle_deg)
        el_x = sh_x + L_arm * math.cos(arm_rad)
        el_y = sh_y + L_arm * math.sin(arm_rad)
        forearm_angle_deg = arm_angle_deg + 180.0 - elbow_target
        forearm_rad = math.radians(forearm_angle_deg)
        wr_x = el_x + L_forearm * math.cos(forearm_rad)
        wr_y = el_y + L_forearm * math.sin(forearm_rad)

        frames_keypoints.append({
            "left_shoulder": {"x": sh_x, "y": sh_y, "score": 0.94},
            "left_elbow": {"x": el_x, "y": el_y, "score": 0.94},
            "left_wrist": {"x": wr_x, "y": wr_y, "score": 0.94},
            "left_hip": {"x": 0.55, "y": 0.65, "score": 0.94},
            "left_knee": {"x": 0.52, "y": 0.85, "score": 0.94},
            "left_ankle": {"x": 0.50, "y": 0.95, "score": 0.94},
            "left_ear": {"x": 0.42, "y": 0.32, "score": 0.94},
            "right_shoulder": {"x": sh_x - 0.02, "y": sh_y, "score": 0.30},
            "right_elbow": {"x": el_x - 0.02, "y": el_y, "score": 0.30},
            "right_wrist": {"x": wr_x - 0.02, "y": wr_y, "score": 0.30},
            "right_hip": {"x": 0.53, "y": 0.65, "score": 0.30},
            "right_knee": {"x": 0.50, "y": 0.85, "score": 0.30},
            "right_ankle": {"x": 0.48, "y": 0.95, "score": 0.30},
            "right_ear": {"x": 0.40, "y": 0.32, "score": 0.30},
            "nose": {"x": 0.41, "y": 0.35, "score": 0.90},
        })

    result = process_kinematics(
        raw_keypoints=frames_keypoints,
        timestamps=timestamps,
        exercise_type="t_bar_row",
        target_muscle="back",
        load_type="machine",
        img_w=720,
        img_h=1280,
        run_vlm=False,
    )
    assert result.get("total_reps") == 4, f"Expected 4 reps in 3/4 t_bar_row, got {result.get('total_reps')}"


def test_t_bar_row_frontal_view_shoulder_elbow_height_4_reps():
    """
    Frontal t_bar_row where 2D elbow angle changes < 10 deg, while relative vertical
    height (shoulder_y - elbow_y) / arm_length oscillates across 4 clean reps.
    """
    fps = 15.0
    dt = 1.0 / fps
    # Cycle parameter u in [0, 1] (0=bottom/stretch, 1=top/contraction)
    u_tpl = [k / 10.0 for k in range(1, 11)] + [1.0 - (k / 10.0) for k in range(1, 11)]
    u_vals = [0.0] * 12 + u_tpl * 4 + [0.0] * 12
    n_frames = len(u_vals)
    timestamps = [f * dt for f in range(n_frames)]

    frames_keypoints = []
    for u in u_vals:
        sh_x, sh_y = 0.45, 0.35
        # Elbow moves vertically upward as user pulls (el_y goes from 0.56 down to 0.36)
        # while forearm stays nearly aligned so 2D elbow angle stays ~145-151 deg (<10 deg delta)
        el_x = 0.36 - 0.02 * u
        el_y = 0.56 - 0.20 * u
        wr_x = 0.43 - 0.01 * u
        wr_y = el_y + 0.14
        frames_keypoints.append({
            "left_shoulder": {"x": sh_x, "y": sh_y, "score": 0.94},
            "left_elbow": {"x": el_x, "y": el_y, "score": 0.94},
            "left_wrist": {"x": wr_x, "y": wr_y, "score": 0.94},
            "left_hip": {"x": 0.48, "y": 0.65, "score": 0.94},
            "left_knee": {"x": 0.48, "y": 0.84, "score": 0.94},
            "left_ankle": {"x": 0.48, "y": 0.95, "score": 0.94},
            "left_ear": {"x": 0.46, "y": 0.25, "score": 0.94},
            "right_shoulder": {"x": 0.55, "y": sh_y, "score": 0.35},
            "right_elbow": {"x": 0.64, "y": el_y, "score": 0.35},
            "right_wrist": {"x": 0.57, "y": wr_y, "score": 0.35},
            "right_hip": {"x": 0.52, "y": 0.65, "score": 0.35},
            "right_knee": {"x": 0.52, "y": 0.84, "score": 0.35},
            "right_ankle": {"x": 0.52, "y": 0.95, "score": 0.35},
            "right_ear": {"x": 0.54, "y": 0.25, "score": 0.35},
            "nose": {"x": 0.50, "y": 0.27, "score": 0.90},
        })

    result = process_kinematics(
        raw_keypoints=frames_keypoints,
        timestamps=timestamps,
        exercise_type="t_bar_row",
        target_muscle="back",
        load_type="machine",
        img_w=720,
        img_h=1280,
        run_vlm=False,
    )
    assert result.get("total_reps") == 4, f"Expected 4 reps in frontal t_bar_row, got {result.get('total_reps')}"
    af = result.get("alignment_frames", [])
    assert len(af) == 2


def test_t_bar_row_radiography_stretch_exceeds_peak_by_25deg():
    """
    Radiografía geometric invariant for pull (t_bar_row):
    stretch frame elbow_deg >= peak contraction elbow_deg + 25 deg.
    """
    fps = 24.0
    dt = 1.0 / fps
    angles = [155.0] * 12
    rep_tpl = [155.0 - 70.0 * (k / 14.0) for k in range(1, 15)] + [85.0 + 70.0 * (k / 16.0) for k in range(1, 17)]
    angles += rep_tpl * 3 + [155.0] * 12
    timestamps = [f * dt for f in range(len(angles))]
    frames_keypoints = []
    for el in angles:
        sh_x, sh_y = 0.45, 0.35
        frac = (155.0 - el) / 70.0
        arm_rad = math.radians(85.0 - 45.0 * frac)
        el_x = sh_x + 0.20 * math.cos(arm_rad)
        el_y = sh_y + 0.20 * math.sin(arm_rad)
        forearm_rad = math.radians((85.0 - 45.0 * frac) + 180.0 - el)
        wr_x = el_x + 0.18 * math.cos(forearm_rad)
        wr_y = el_y + 0.18 * math.sin(forearm_rad)
        frames_keypoints.append({
            "left_shoulder": {"x": sh_x, "y": sh_y, "score": 0.95},
            "left_elbow": {"x": el_x, "y": el_y, "score": 0.95},
            "left_wrist": {"x": wr_x, "y": wr_y, "score": 0.95},
            "left_hip": {"x": 0.55, "y": 0.65, "score": 0.95},
            "left_knee": {"x": 0.52, "y": 0.85, "score": 0.95},
            "left_ankle": {"x": 0.50, "y": 0.95, "score": 0.95},
            "left_ear": {"x": 0.42, "y": 0.32, "score": 0.95},
            "right_shoulder": {"x": sh_x - 0.02, "y": sh_y, "score": 0.30},
            "right_elbow": {"x": el_x - 0.02, "y": el_y, "score": 0.30},
            "right_wrist": {"x": wr_x - 0.02, "y": wr_y, "score": 0.30},
            "right_hip": {"x": 0.53, "y": 0.65, "score": 0.30},
            "right_knee": {"x": 0.50, "y": 0.85, "score": 0.30},
            "right_ankle": {"x": 0.48, "y": 0.95, "score": 0.30},
            "right_ear": {"x": 0.40, "y": 0.32, "score": 0.30},
            "nose": {"x": 0.41, "y": 0.35, "score": 0.90},
        })
    result = process_kinematics(
        raw_keypoints=frames_keypoints,
        timestamps=timestamps,
        exercise_type="t_bar_row",
        target_muscle="back",
        load_type="machine",
        img_w=720,
        img_h=1280,
        run_vlm=False,
    )
    af = result.get("alignment_frames", [])
    assert len(af) == 2
    assert af[0]["metrics"]["elbow_deg"] >= af[1]["metrics"]["elbow_deg"] + 25.0, (
        f"Pull keyframes failed 25° guard: stretch={af[0]['metrics']['elbow_deg']}°, peak={af[1]['metrics']['elbow_deg']}°"
    )


if __name__ == "__main__":
    test_t_bar_row_vbt_stability()
    test_t_bar_row_oblique_3_4_view_22deg_4_reps()
    test_t_bar_row_frontal_view_shoulder_elbow_height_4_reps()
    test_t_bar_row_radiography_stretch_exceeds_peak_by_25deg()
