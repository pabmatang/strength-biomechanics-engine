#!/usr/bin/env python3
"""
Script de procesamiento y normalización visual para catálogo de máquinas MIA:
1. Elimina fondos uniformes blancos/claros mediante flood-fill conectado a bordes (sin dañar piezas interiores metálicas).
2. Aplica autocrop inteligente basado en el bounding box alfa real.
3. Centra y escala proporcionalmente sobre un lienzo cuadrado de 512x512 px transparente con 6% de margen.
4. Si la imagen original era .jpg, guarda como .png transparente optimizado y elimina el .jpg obsoleto.
"""

import os
import sys
import glob
from PIL import Image
import numpy as np
import cv2

def remove_background_floodfill(pil_img, tolerance=24):
    img_rgba = pil_img.convert('RGBA')
    np_rgba = np.array(img_rgba)
    h, w = np_rgba.shape[:2]

    # Check if already has transparent background (> 5% of pixels)
    existing_alpha = np_rgba[:, :, 3]
    if np.sum(existing_alpha == 0) > (h * w * 0.05):
        return img_rgba

    rgb = np_rgba[:, :, :3]
    bgr = cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR)

    # Perimeter seeds to sample edges
    seed_points = [
        (0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1),
        (w // 4, 0), (w // 2, 0), (3 * w // 4, 0),
        (w // 4, h - 1), (w // 2, h - 1), (3 * w // 4, h - 1),
        (0, h // 4), (0, h // 2), (0, 3 * h // 4),
        (w - 1, h // 4), (w - 1, h // 2), (w - 1, 3 * h // 4),
        (2, 2), (w - 3, 2), (2, h - 3), (w - 3, h - 3)
    ]

    bg_mask = np.zeros((h, w), dtype=bool)

    for pt in seed_points:
        px = rgb[pt[1], pt[0]]
        # Floodfill if edge seed is bright (mean RGB > 210)
        if np.mean(px) > 210:
            flood_mask = np.zeros((h + 2, w + 2), np.uint8)
            cv2.floodFill(
                bgr.copy(),
                flood_mask,
                pt,
                (0, 0, 0),
                loDiff=(tolerance, tolerance, tolerance),
                upDiff=(tolerance, tolerance, tolerance),
                flags=4 | (255 << 8) | cv2.FLOODFILL_MASK_ONLY
            )
            bg_mask |= (flood_mask[1:h+1, 1:w+1] == 255)

    np_rgba[bg_mask, 3] = 0
    return Image.fromarray(np_rgba, 'RGBA')

def process_image(file_path, target_size=512, margin_pct=0.06):
    try:
        with Image.open(file_path) as raw_img:
            img = raw_img.copy()
    except Exception as e:
        print(f"Error opening {file_path}: {e}")
        return False, 0, 0

    orig_size = os.path.getsize(file_path)
    transparent = remove_background_floodfill(img)

    # Autocrop
    bbox = transparent.getbbox()
    if bbox:
        cropped = transparent.crop(bbox)
    else:
        cropped = transparent

    cw, ch = cropped.size
    if cw == 0 or ch == 0:
        return False, orig_size, 0

    avail = target_size * (1.0 - 2 * margin_pct)
    scale = min(avail / cw, avail / ch)
    nw = max(1, int(round(cw * scale)))
    nh = max(1, int(round(ch * scale)))

    resized = cropped.resize((nw, nh), Image.Resampling.LANCZOS)

    canvas = Image.new('RGBA', (target_size, target_size), (0, 0, 0, 0))
    paste_x = (target_size - nw) // 2
    paste_y = (target_size - nh) // 2
    canvas.paste(resized, (paste_x, paste_y), resized)

    base, ext = os.path.splitext(file_path)
    out_png_path = base + '.png'

    canvas.save(out_png_path, format='PNG', optimize=True)
    new_size = os.path.getsize(out_png_path)

    # If original was .jpg or .jpeg, remove it now that clean .png exists
    if ext.lower() in ['.jpg', '.jpeg', '.webp'] and os.path.exists(file_path):
        os.remove(file_path)

    return True, orig_size, new_size

def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)
    machines_dir = os.path.join(project_root, 'public', 'machines')

    if not os.path.exists(machines_dir):
        print(f"Directory not found: {machines_dir}")
        sys.exit(1)

    all_files = sorted(os.listdir(machines_dir))
    image_files = [
        f for f in all_files
        if f.lower().endswith(('.png', '.jpg', '.jpeg', '.webp'))
    ]

    print(f"Encontrados {len(image_files)} archivos de imagen en {machines_dir}")

    # Process files uniquely by machine ID
    processed_count = 0
    total_saved_bytes = 0

    # Group by base name
    id_map = {}
    for f in image_files:
        base, ext = os.path.splitext(f)
        id_map.setdefault(base, []).append(f)

    for m_id, file_list in id_map.items():
        # Prefer .png if exists, else first available
        target_f = next((f for f in file_list if f.lower().endswith('.png')), file_list[0])
        target_path = os.path.join(machines_dir, target_f)

        ok, old_s, new_s = process_image(target_path)
        if ok:
            processed_count += 1
            diff = old_s - new_s
            total_saved_bytes += diff
            # Clean any stray jpg if png was generated
            for stray in file_list:
                if stray != (m_id + '.png'):
                    stray_path = os.path.join(machines_dir, stray)
                    if os.path.exists(stray_path):
                        os.remove(stray_path)

    print(f"\n==========================================")
    print(f"Total imágenes procesadas a 512x512 transparente: {processed_count}")
    print(f"Ahorro neto de peso: {total_saved_bytes / (1024*1024):.2f} MB")
    print(f"==========================================")

if __name__ == '__main__':
    main()
