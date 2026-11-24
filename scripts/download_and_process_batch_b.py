#!/usr/bin/env python3
"""
scripts/download_and_process_batch_b.py
Descarga y reemplazo de fotos oficiales para Subagente B (13 máquinas).
"""

import os
import sys
import urllib.request
from PIL import Image

MACHINES_DIR = r"C:\Users\Pablo\.gemini\antigravity\scratch\mia\public\machines"

DOWNLOAD_TARGETS = [
    # LOTE 1 - 10 máquinas
    {
        "id": "matrix_ultra_leg_extension",
        "url": "https://assets.jhtbrand.co/files/product/e10f79caed550c793c3a31aa97c040a414f6a2b7/",
        "ext": ".png",
        "source": "Matrix Fitness (Official Brand CDN) - Ultra G7-S71 Leg Extension",
        "headers": {"User-Agent": "Mozilla/5.0"}
    },
    {
        "id": "matrix_ultra_diverging_lat_pulldown",
        "url": "https://fitnesswarehousecommercial.com.au/cdn/shop/files/MatrixUltraLatPulldownBase.png?v=1690169378&width=1920",
        "ext": ".png",
        "source": "Matrix Fitness Authorized Distributor - Ultra G7-S33 Lat Pulldown",
        "headers": {"User-Agent": "Mozilla/5.0"}
    },
    {
        "id": "matrix_ultra_converging_chest",
        "url": "https://assets.jhtbrand.co/files/product/323e9e0156e491ca216b7354178d3a4c87d38676/",
        "ext": ".png",
        "source": "Matrix Fitness (Official Brand CDN) - Ultra G7-S13 Converging Chest Press",
        "headers": {"User-Agent": "Mozilla/5.0"}
    },
    {
        "id": "matrix_ultra_lateral_raise",
        "url": "https://fitnesswarehousecommercial.com.au/cdn/shop/files/MatrixUltraLateralRaiseBase.png",
        "ext": ".png",
        "source": "Matrix Fitness Authorized Distributor - Ultra G7-S21 Lateral Raise (Dark/Silver chassis)",
        "headers": {"User-Agent": "Mozilla/5.0"}
    },
    {
        "id": "hammer_iso_front_lat_pulldown",
        "url": "https://www.lifefitness.com/Kentico13CoreBase/media/LFMedia/LifeFitnessImages/Equipment/Strength/Plate-Loaded/Font%20Lat%20Pulldown/Strength-PlateLoaded-IsoLateral-FrontLatPulldown-7.png",
        "ext": ".png",
        "source": "Life Fitness Official Kentico - Hammer Strength Iso-Lateral Front Lat Pulldown",
        "headers": {"User-Agent": "Mozilla/5.0", "Referer": "https://www.lifefitness.com/"}
    },
    {
        "id": "hammer_kneeling_leg_curl",
        "url": "https://www.lifefitness.com/Kentico13CoreBase/media/LFMedia/LifeFitnessImages/Equipment/Strength/Plate-Loaded/Kneeling%20Leg%20Curl/Strength-PlateLoaded-IsoLateral-KneelingLegCurl-Thumbnail-1.png",
        "ext": ".png",
        "source": "Life Fitness Official Kentico - Hammer Strength Plate-Loaded Kneeling Leg Curl",
        "headers": {"User-Agent": "Mozilla/5.0", "Referer": "https://www.lifefitness.com/"}
    },
    {
        "id": "hammer_iso_incline_press",
        "url": "https://www.lifefitness.com/Kentico13CoreBase/media/LFMedia/LifeFitnessImages/Equipment/Strength/Plate-Loaded/Iso%20Lateral%20Incline%20Press/Strength-PlateLoaded-IsoLateralInclinePress-8.png",
        "ext": ".png",
        "source": "Life Fitness Official Kentico - Hammer Strength Iso-Lateral Incline Press",
        "headers": {"User-Agent": "Mozilla/5.0", "Referer": "https://www.lifefitness.com/"}
    },
    {
        "id": "hammer_back_extension",
        "url": "https://www.lifefitness.com/Kentico13CoreBase/media/LFMedia/LifeFitnessImages/MediaSync/31-362-hammer-strength-select-back-extension-image-new.jpg",
        "ext": ".jpg",
        "source": "Life Fitness Official Kentico - Hammer Strength Select Back Extension (Weight stack tower)",
        "headers": {"User-Agent": "Mozilla/5.0", "Referer": "https://www.lifefitness.com/"}
    },
    {
        "id": "technogym_selection_seated_dip",
        "url": "https://www.technogym.com/en-GB/feed/images/MNSP/selection-900-arm-extension-plp.jpg",
        "ext": ".jpg",
        "source": "Technogym Official Feed - Selection 900 Arm Extension / Seated Dip (Vertical weight stack tower)",
        "headers": {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Referer": "https://www.technogym.com/"
        }
    },
    {
        "id": "eleiko_prestera_half_rack",
        "url": "https://media.eleiko.com/images/upload/4x5/3085608-03_10.jpg",
        "ext": ".jpg",
        "source": "Eleiko Official Media - Eleiko Prestera Half Rack 3085608-03",
        "headers": {"User-Agent": "Mozilla/5.0", "Referer": "https://eleiko.com/"}
    },

    # LOTE 2 - 3 máquinas pendientes
    {
        "id": "matrix_versa_calf_extension",
        "url": "https://assets.jhtbrand.co/files/product/777da503c313d848a5124f7239957cb946ec9e50/",
        "ext": ".png",
        "source": "Matrix Fitness (Official Brand CDN) - Versa VS-S70 Leg Press / Calf Extension",
        "headers": {"User-Agent": "Mozilla/5.0"}
    },
    {
        "id": "technogym_selection_wide_row",
        "url": "https://www.technogym.com/es-INT/feed/images/MN1P/selection-900-upper-back.jpg",
        "ext": ".jpg",
        "source": "Technogym Official Feed - Selection 900 Upper Back / Seated Wide Row (MN1P)",
        "headers": {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Referer": "https://www.technogym.com/"
        }
    },
    {
        "id": "technogym_selection_hip_thrust",
        "url": "https://www.technogym.com/en-INT/feed/images/MNP2/selection-900-hip-thrust-MN2-plp.jpg",
        "ext": ".jpg",
        "source": "Technogym Official Feed - Selection 900 Hip Thrust (MN2P)",
        "headers": {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Referer": "https://www.technogym.com/"
        }
    }
]

def main():
    print("Iniciando descarga y preparación para procesamiento de lote de 13 máquinas...")
    os.makedirs(MACHINES_DIR, exist_ok=True)

    downloaded_ids = []
    failed_ids = []

    for item in DOWNLOAD_TARGETS:
        m_id = item["id"]
        url = item["url"]
        ext = item["ext"]
        dest_filename = f"{m_id}{ext}"
        dest_path = os.path.join(MACHINES_DIR, dest_filename)

        print(f"\n[{m_id}] Descargando desde:")
        print(f"  URL: {url}")
        print(f"  Fuente: {item['source']}")

        # Si el nuevo archivo es .jpg/.webp, eliminar cualquier .png previo para que processMachineImages
        # procese el archivo nuevo en lugar del viejo .png
        if ext.lower() in ['.jpg', '.jpeg', '.webp']:
            old_png = os.path.join(MACHINES_DIR, f"{m_id}.png")
            if os.path.exists(old_png):
                print(f"  Eliminando .png antiguo para permitir procesamiento de {ext}: {old_png}")
                os.remove(old_png)

        try:
            req = urllib.request.Request(url, headers=item["headers"])
            with urllib.request.urlopen(req, timeout=15) as resp:
                data = resp.read()

            if len(data) < 5000:
                raise ValueError(f"Descarga demasiado pequeña ({len(data)} bytes), posible error.")

            with open(dest_path, "wb") as f:
                f.write(data)

            # Validar con PIL que es una imagen válida
            with Image.open(dest_path) as im:
                print(f"  Guardado OK: {dest_filename} ({im.size}, {im.format}, {len(data):,} bytes)")

            downloaded_ids.append(m_id)
        except Exception as e:
            print(f"  ERROR al descargar {m_id}: {e}")
            failed_ids.append((m_id, str(e)))

    print("\n" + "="*50)
    print(f"Descargas completadas con éxito: {len(downloaded_ids)} / {len(DOWNLOAD_TARGETS)}")
    if failed_ids:
        print(f"Fallidas: {failed_ids}")
    print("="*50)

    # Si matrix_versa_calf_extension fue descargada, asegurar también copia para matrix_calf_extension
    # si este existiera o fuera necesario para compatibilidad hacia atrás
    versa_new = os.path.join(MACHINES_DIR, "matrix_versa_calf_extension.png")
    if os.path.exists(versa_new):
        old_calf = os.path.join(MACHINES_DIR, "matrix_calf_extension.png")
        import shutil
        shutil.copyfile(versa_new, old_calf)
        print("  Copia sincronizada de matrix_versa_calf_extension a matrix_calf_extension.")

    return downloaded_ids

if __name__ == "__main__":
    main()
