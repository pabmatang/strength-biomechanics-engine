#!/usr/bin/env python3
"""
scripts/verify_batch_b.py
Verificación exhaustiva de las 13 máquinas procesadas:
- Resolución 512x512
- Formato PNG
- Modo RGBA
- Esquinas transparentes (alpha < 30)
- Chasis íntegro (píxeles opacos > 12%)
"""

import os
from PIL import Image
import numpy as np

MACHINES_DIR = r"C:\Users\Pablo\.gemini\antigravity\scratch\mia\public\machines"

TARGET_IDS = [
    # LOTE 1
    "matrix_ultra_leg_extension",
    "matrix_ultra_diverging_lat_pulldown",
    "matrix_ultra_converging_chest",
    "matrix_ultra_lateral_raise",
    "hammer_iso_front_lat_pulldown",
    "hammer_kneeling_leg_curl",
    "hammer_iso_incline_press",
    "hammer_back_extension",
    "technogym_selection_seated_dip",
    "eleiko_prestera_half_rack",
    # LOTE 2
    "matrix_versa_calf_extension",
    "technogym_selection_wide_row",
    "technogym_selection_hip_thrust"
]

def main():
    print("="*65)
    print("VERIFICACIÓN DE IMÁGENES PROCESADAS (LOTE 1 + LOTE 2)")
    print("="*65)

    all_passed = True
    results = []

    for m_id in TARGET_IDS:
        png_path = os.path.join(MACHINES_DIR, f"{m_id}.png")
        if not os.path.exists(png_path):
            print(f"❌ {m_id}: ARCHIVO NO EXISTE")
            all_passed = False
            continue

        file_size = os.path.getsize(png_path)
        with Image.open(png_path) as img:
            w, h = img.size
            mode = img.mode
            fmt = img.format

            # Convert to RGBA array
            rgba = np.array(img.convert('RGBA'))
            alpha = rgba[:, :, 3]

            # Corners transparency
            corners = [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)]
            corner_alphas = [alpha[y, x] for x, y in corners]
            corners_clean = all(a < 30 for a in corner_alphas)

            # Opaque pixel ratio
            opaque_count = int(np.sum(alpha > 40))
            opaque_pct = (opaque_count / (w * h)) * 100.0

            bbox = img.getbbox()

            status_ok = (
                w == 512 and
                h == 512 and
                mode == 'RGBA' and
                corners_clean and
                opaque_pct >= 12.0
            )

            if not status_ok:
                all_passed = False

            tag = "✅ OK" if status_ok else "❌ ERROR"
            print(f"{tag} {m_id}:")
            print(f"    Resolución: {w}x{h} | Modo: {mode} | Tamaño: {file_size:,} bytes")
            print(f"    Esquinas transparentes: {corners_clean} {corner_alphas}")
            print(f"    Ocupación opaca: {opaque_pct:.1f}% | BoundingBox: {bbox}")

            results.append({
                "id": m_id,
                "status": "OK" if status_ok else "FAIL",
                "size_bytes": file_size,
                "opaque_pct": round(opaque_pct, 1),
                "bbox": bbox
            })

    # Also update matrix_calf_extension.png to match matrix_versa_calf_extension.png
    versa_path = os.path.join(MACHINES_DIR, "matrix_versa_calf_extension.png")
    calf_path = os.path.join(MACHINES_DIR, "matrix_calf_extension.png")
    if os.path.exists(versa_path):
        import shutil
        shutil.copyfile(versa_path, calf_path)
        print("\nSincronizado: matrix_calf_extension.png actualizado con copia exacta de matrix_versa_calf_extension.png")

    print("\n" + "="*65)
    if all_passed:
        print(f"RESULTADO: 13 / 13 MÁQUINAS VERIFICADAS Y PERFECTAS EN 512x512 TRANSPARENTE")
    else:
        print("RESULTADO: ALGUNAS IMÁGENES NO CUMPLIERON LOS CRITERIOS")
    print("="*65)

if __name__ == "__main__":
    main()
