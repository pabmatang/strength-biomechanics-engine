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

if __name__ == "__main__":
    test_t_bar_row_vbt_stability()
