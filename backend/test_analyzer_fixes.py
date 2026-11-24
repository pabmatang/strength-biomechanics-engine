import numpy as np
import main


def test_auto_trim_discards_leading_no_person_and_camera_shake():
    """(a) Auto-descarte de frames iniciales sin persona / cámara en movimiento."""
    n = 60
    timestamps = [i / 15.0 for i in range(n)]
    # First 15 frames (1.0s): low visibility (< 0.65) and erratic camera jump
    vis = np.ones(n, dtype=np.float64) * 0.92
    vis[:12] = 0.30
    sh_x = np.ones(n, dtype=np.float64) * 0.50
    sh_y = np.ones(n, dtype=np.float64) * 0.40
    sh_x[12] = 0.72  # sudden camera jump at frame 12 -> 13
    sh_x[13] = 0.50

    primary_joints = {
        "shoulder": {"x": sh_x, "y": sh_y, "score": vis},
        "elbow": {"x": np.ones(n) * 0.55, "y": np.ones(n) * 0.50, "score": vis},
        "wrist": {"x": np.ones(n) * 0.60, "y": np.ones(n) * 0.45, "score": vis},
        "hip": {"x": np.ones(n) * 0.48, "y": np.ones(n) * 0.65, "score": vis},
    }
    start_idx, end_idx = main.compute_valid_frame_bounds(primary_joints, timestamps)
    assert start_idx >= 14
    assert end_idx == n - 1


def test_vbt_strict_rep_equality_and_velocity_loss_on_heavy_r5():
    """(b) Igualdad estricta total_reps == len(rep_velocities) y pérdida VBT > 20% cuando R5 es lenta."""
    reps = [
        {"rep_number": 1, "rom_px": 120.0, "rom_deg": 92.0, "mean_concentric_vel": 68.0, "concentric_sec": 1.1, "duration_sec": 2.4},
        {"rep_number": 2, "rom_px": 118.0, "rom_deg": 90.0, "mean_concentric_vel": 64.0, "concentric_sec": 1.2, "duration_sec": 2.5},
        {"rep_number": 3, "rom_px": 115.0, "rom_deg": 88.0, "mean_concentric_vel": 55.0, "concentric_sec": 1.6, "duration_sec": 3.0},
        {"rep_number": 4, "rom_px": 112.0, "rom_deg": 86.0, "mean_concentric_vel": 44.0, "concentric_sec": 2.1, "duration_sec": 3.6},
        {"rep_number": 5, "rom_px": 100.0, "rom_deg": 78.0, "mean_concentric_vel": 29.0, "concentric_sec": 3.2, "duration_sec": 4.7},
    ]
    intensity, rep_comp, _ = main.compute_vbt_and_rom_metrics(reps, weight_kg=100.0)
    assert len(intensity["rep_velocities"]) == len(reps)
    assert intensity["velocity_loss_pct"] > 20.0
    assert intensity["exact_rir"] <= 2.0
    assert "RIR 4+" not in intensity["estimated_rir"]
    assert rep_comp["rom_loss_pct"] < 20.0


def test_incline_press_lockout_elbow_angle_exceeds_bottom_by_35_deg():
    """(c) Ángulo de codo en lockout_frame > bottom_frame + 35° en incline_press."""
    n = 150
    fps = 15.0
    timestamps = [i / fps for i in range(n)]
    # 3 clean push reps: elbow goes from ~155 deg (lockout) down to ~55 deg (bottom) and back to ~155 deg
    t_arr = np.array(timestamps)
    elbow_angles = 105.0 + 50.0 * np.cos(2.0 * np.pi * (t_arr - 1.0) / 3.0)

    # Rep 2 window peak-to-peak [4.0s..7.0s] -> frames 60..105
    sf, ef = 60, 105
    f_stretch, f_peak = main.extract_push_snapshot_frames(elbow_angles, sf, ef, n)

    assert elbow_angles[f_peak] > elbow_angles[f_stretch] + 35.0
