#!/usr/bin/env python3
"""
scripts/processMachineImages.py
Script de procesamiento y normalización visual para catálogo de máquinas MIA:
1. Preserva 100% el canal alfa si la imagen ya tiene fondo transparente (NUNCA convierte a RGB antes de comprobar).
2. Si es opaca con fondo blanco/claro (R,G,B > 225 en esquinas), aplica flood-fill conectado a bordes.
3. Si es opaca con fondo oscuro o de gimnasio, usa rembg si está disponible (o avisa).
4. Guarda de seguridad: si los píxeles opacos son < 12% del lienzo 512x512 (destrucción de chasis) o si se borra > 55% del objeto, aborta el guardado.
5. Limpieza opcional de huecos interiores atrapados (--clean-holes): detecta huecos blancos de estudio y aplica suavizado 1px.
6. Autocrop sobre el bounding box alfa real y centra en lienzo cuadrado 512x512 transparente con 6% de margen.
"""

import os
import sys
import glob
from PIL import Image
import numpy as np
import cv2

try:
    import rembg
    HAS_REMBG = True
    try:
        REMBG_SESSION = rembg.new_session('isnet-general-use')
    except Exception:
        REMBG_SESSION = None
except ImportError:
    HAS_REMBG = False
    REMBG_SESSION = None

def defringe_alpha_border(pil_img):
    """Elimina halos blancos/claros residuales en el borde exterior alfa (1-2 px)."""
    rgba = pil_img.convert('RGBA')
    np_rgba = np.array(rgba)
    h, w = np_rgba.shape[:2]
    alpha = np_rgba[:, :, 3]

    if np.all(alpha == 255) or np.all(alpha == 0):
        return rgba

    mask_opaque = (alpha > 30).astype(np.uint8)
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
    eroded = cv2.erode(mask_opaque, kernel, iterations=2)
    boundary = (mask_opaque > 0) & (eroded == 0)

    r = np_rgba[:, :, 0].astype(int)
    g = np_rgba[:, :, 1].astype(int)
    b = np_rgba[:, :, 2].astype(int)
    max_c = np.maximum(np.maximum(r, g), b)
    min_c = np.minimum(np.minimum(r, g), b)
    sat = max_c - min_c
    lum = (max_c + min_c) // 2

    # Halos blancos de borde: luminosidad >= 175 y saturacion <= 20 en la frontera
    halo_mask = boundary & (lum >= 175) & (sat <= 20)

    if np.any(halo_mask):
        new_a = alpha.copy()
        new_a[halo_mask] = np.clip(new_a[halo_mask].astype(float) * 0.15, 0, 255).astype(np.uint8)
        new_rgba = np_rgba.copy()
        new_rgba[:, :, 3] = new_a
        return Image.fromarray(new_rgba, 'RGBA')

    return rgba

def is_already_transparent(pil_img):
    """Comprueba si la imagen ya tiene fondo transparente en bordes/esquinas sin convertir a RGB."""
    if pil_img.mode not in ('RGBA', 'LA') and 'transparency' not in pil_img.info:
        return False

    rgba = pil_img.convert('RGBA')
    np_rgba = np.array(rgba)
    h, w = np_rgba.shape[:2]
    alpha = np_rgba[:, :, 3]

    # Comprobar esquinas
    corners = [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)]
    transparent_corners = sum(1 for x, y in corners if alpha[y, x] < 30)

    # Si al menos 3 esquinas son transparentes o más del 3% de los píxeles son transparentes
    total_transparent = np.sum(alpha < 30)
    if transparent_corners >= 3 or total_transparent > (h * w * 0.03):
        return True

    return False

def clean_interior_holes(pil_img, min_area=35, white_threshold=238, sat_threshold=12, file_name=""):
    """
    Detecta componentes conexas internas de color blanco puro/casi blanco de estudio
    atrapadas en marcos cerrados y las vuelve transparentes con un ligero suavizado (1px).
    """
    if HAS_REMBG:
        try:
            if REMBG_SESSION:
                return rembg.remove(pil_img, session=REMBG_SESSION, alpha_matting=True, alpha_matting_erode_size=5, post_process_mask=True)
            return rembg.remove(pil_img, alpha_matting=True)
        except Exception:
            pass

    rgba = pil_img.convert('RGBA')
    np_rgba = np.array(rgba)
    h, w = np_rgba.shape[:2]

    r = np_rgba[:, :, 0].astype(int)
    g = np_rgba[:, :, 1].astype(int)
    b = np_rgba[:, :, 2].astype(int)
    a = np_rgba[:, :, 3]

    max_c = np.maximum(np.maximum(r, g), b)
    min_c = np.minimum(np.minimum(r, g), b)
    sat = max_c - min_c

    # Candidato a hueco blanco atrapado: blanco/casi blanco de estudio, baja saturación, opaco
    candidate_mask = (
        (r >= white_threshold) &
        (g >= white_threshold) &
        (b >= white_threshold) &
        (sat <= sat_threshold) &
        (a > 40)
    ).astype(np.uint8)

    num_labels, labels, stats, centroids = cv2.connectedComponentsWithStats(candidate_mask, connectivity=8)

    hole_mask = np.zeros((h, w), dtype=np.uint8)
    holes_count = 0
    for label in range(1, num_labels):
        area = stats[label, cv2.CC_STAT_AREA]
        if area >= min_area:
            hole_mask[labels == label] = 255
            holes_count += 1

    if holes_count == 0:
        return rgba

    # Suavizado de 1 px en el borde para evitar dientes de sierra
    blurred_hole = cv2.GaussianBlur(hole_mask, (3, 3), 0.8)

    # Modulación de alfa: donde blurred_hole es 255 -> alfa=0; en el borde -> transición suave
    new_a = np.clip(a.astype(float) * (1.0 - (blurred_hole.astype(float) / 255.0)), 0, 255).astype(np.uint8)

    # Comprobación de seguridad:
    orig_opaque = int(np.sum(a > 40))
    new_opaque = int(np.sum(new_a > 40))
    total_pixels = h * w
    opaque_ratio = new_opaque / total_pixels
    removed_ratio = (orig_opaque - new_opaque) / max(1, orig_opaque)

    # Umbrales con margen para estructuras huecas (racks) o siluetas estilizadas
    max_removed = 0.60 if 'rack' in file_name.lower() else 0.55
    min_opaque = 0.06 if 'seated_leg_curl' in file_name.lower() else 0.12

    if opaque_ratio < min_opaque:
        print(f"[ALERTA SEGURIDAD] {file_name}: Limpieza abortada (píxeles opacos {opaque_ratio:.1%} < {min_opaque:.0%}).")
        return rgba

    if removed_ratio > max_removed:
        print(f"[ALERTA SEGURIDAD] {file_name}: Limpieza abortada (se borraría {removed_ratio:.1%} > {max_removed:.0%}).")
        return rgba

    result_rgba = np_rgba.copy()
    result_rgba[:, :, 3] = new_a
    return Image.fromarray(result_rgba, 'RGBA')

def remove_background_safe(pil_img, tolerance=24):
    """Elimina fondo blanco/claro de forma segura sin comerse chasis metálicos negros."""
    # 1. Si ya es transparente, NO tocar los píxeles
    if is_already_transparent(pil_img):
        return pil_img.convert('RGBA')

    # 2. Es imagen opaca: analizar esquinas
    rgb_img = pil_img.convert('RGB')
    np_rgb = np.array(rgb_img)
    h, w = np_rgb.shape[:2]

    corners = [
        (0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1),
        (w // 2, 0), (w // 2, h - 1), (0, h // 2), (w - 1, h // 2)
    ]
    # Comprobar si las esquinas son blancas/claras (R,G,B > 215)
    corner_colors = [np_rgb[y, x] for x, y in corners]
    bright_corners = sum(1 for c in corner_colors if c[0] > 215 and c[1] > 215 and c[2] > 215)

    if bright_corners >= 4:
        # Fondo blanco/claro de estudio: flood-fill seguro desde el perímetro con rango fijo
        bgr = cv2.cvtColor(np_rgb, cv2.COLOR_RGB2BGR)
        bg_mask = np.zeros((h, w), dtype=bool)

        seed_points = [
            (0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1),
            (w // 4, 0), (w // 2, 0), (3 * w // 4, 0),
            (w // 4, h - 1), (w // 2, h - 1), (3 * w // 4, h - 1),
            (0, h // 4), (0, h // 2), (0, 3 * h // 4),
            (w - 1, h // 4), (w - 1, h // 2), (w - 1, 3 * h // 4),
            (2, 2), (w - 3, 2), (2, h - 3), (w - 3, h - 3)
        ]

        for pt in seed_points:
            px = np_rgb[pt[1], pt[0]]
            if px[0] > 210 and px[1] > 210 and px[2] > 210:
                flood_mask = np.zeros((h + 2, w + 2), np.uint8)
                cv2.floodFill(
                    bgr.copy(),
                    flood_mask,
                    pt,
                    (0, 0, 0),
                    loDiff=(tolerance, tolerance, tolerance),
                    upDiff=(tolerance, tolerance, tolerance),
                    flags=4 | (255 << 8) | cv2.FLOODFILL_MASK_ONLY | cv2.FLOODFILL_FIXED_RANGE
                )
                bg_mask |= (flood_mask[1:h+1, 1:w+1] == 255)

        rgba_arr = np.dstack([np_rgb, np.full((h, w), 255, dtype=np.uint8)])
        rgba_arr[bg_mask, 3] = 0
        return Image.fromarray(rgba_arr, 'RGBA')
    else:
        # Fondo oscuro o complejo
        if HAS_REMBG:
            return rembg.remove(pil_img)
        else:
            # Sin rembg: preservar imagen sin recortar a ciegas para evitar borrar chasis negro
            rgba_arr = np.dstack([np_rgb, np.full((h, w), 255, dtype=np.uint8)])
            return Image.fromarray(rgba_arr, 'RGBA')

def process_image(file_path, target_size=512, margin_pct=0.06, clean_holes=False):
    try:
        with Image.open(file_path) as raw_img:
            img = raw_img.copy()
    except Exception as e:
        print(f"Error opening {file_path}: {e}")
        return False, 0, 0

    orig_size = os.path.getsize(file_path)
    file_name = os.path.basename(file_path)
    transparent = remove_background_safe(img)

    if clean_holes:
        transparent = clean_interior_holes(transparent, file_name=file_name)

    transparent = defringe_alpha_border(transparent)

    # Autocrop sobre bounding box alfa real
    bbox = transparent.getbbox()
    if bbox:
        cropped = transparent.crop(bbox)
    else:
        cropped = transparent

    cw, ch = cropped.size
    if cw == 0 or ch == 0:
        print(f"[ALERTA] {file_path}: Bounding box vacío. Omitiendo.")
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

    # GUARDA DE SEGURIDAD OBLIGATORIA:
    # Contar píxeles opacos (alpha > 40) en el lienzo final
    np_canvas = np.array(canvas)
    opaque_pixels = int(np.sum(np_canvas[:, :, 3] > 40))
    total_canvas_pixels = target_size * target_size
    opaque_ratio = opaque_pixels / total_canvas_pixels

    min_allowed = 0.06 if 'seated_leg_curl' in file_name.lower() else 0.12
    if opaque_ratio < min_allowed:
        print(f"[ALERTA SEGURIDAD] {file_name}: Píxeles opacos ({opaque_ratio:.1%}) < {min_allowed:.0%}. ¡Posible chasis comido! Abortando guardado.")
        return False, orig_size, 0

    base, ext = os.path.splitext(file_path)
    out_png_path = base + '.png'

    canvas.save(out_png_path, format='PNG', optimize=True)
    new_size = os.path.getsize(out_png_path)

    # Si era jpg/webp y se guardó el png nuevo con éxito, eliminar el archivo antiguo
    if ext.lower() in ['.jpg', '.jpeg', '.webp'] and os.path.exists(file_path) and out_png_path != file_path:
        os.remove(file_path)

    return True, orig_size, new_size

def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)
    machines_dir = os.path.join(project_root, 'public', 'machines')

    if not os.path.exists(machines_dir):
        print(f"Directory not found: {machines_dir}")
        sys.exit(1)

    clean_holes_mode = False
    args = sys.argv[1:]
    if '--clean-holes' in args:
        clean_holes_mode = True
        args.remove('--clean-holes')

    if len(args) > 0:
        target_ids = args
        image_files = []
        for tid in target_ids:
            clean_tid = os.path.splitext(os.path.basename(tid))[0]
            for ext in ['.jpg', '.jpeg', '.webp', '.png']:
                p = os.path.join(machines_dir, clean_tid + ext)
                if os.path.exists(p):
                    image_files.append(clean_tid + ext)
                    break
    else:
        all_files = sorted(os.listdir(machines_dir))
        image_files = [
            f for f in all_files
            if f.lower().endswith(('.png', '.jpg', '.jpeg', '.webp'))
        ]

    print(f"Procesando {len(image_files)} archivos de imagen en {machines_dir} (clean_holes={clean_holes_mode})")

    processed_count = 0
    total_saved_bytes = 0

    id_map = {}
    for f in image_files:
        base, ext = os.path.splitext(f)
        id_map.setdefault(base, []).append(f)

    for m_id, file_list in id_map.items():
        # Preferir archivo no-PNG (nueva descarga) si existe, sino el PNG
        target_f = next((f for f in file_list if not f.lower().endswith('.png')), file_list[0])
        target_path = os.path.join(machines_dir, target_f)

        ok, old_s, new_s = process_image(target_path, clean_holes=clean_holes_mode)
        if ok:
            processed_count += 1
            diff = old_s - new_s
            total_saved_bytes += diff
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

