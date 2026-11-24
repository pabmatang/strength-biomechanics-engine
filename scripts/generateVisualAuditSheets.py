#!/usr/bin/env python3
"""
generateVisualAuditSheets.py
Genera hojas de contacto visuales en alta definición (.jpg) en cuadrícula 4x4 (16 máquinas por lámina)
para auditar visualmente el catálogo completo de máquinas biomecánicas de MIA.
"""

import os
import json
import math
from PIL import Image, ImageDraw, ImageFont

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
DOCS_DIR = os.path.join(PROJECT_ROOT, 'docs')
AUDIT_DIR = os.path.join(DOCS_DIR, 'audit_sheets')
PUBLIC_MACHINES_DIR = os.path.join(PROJECT_ROOT, 'public', 'machines')
DATA_JSON_PATH = os.path.join(DOCS_DIR, 'machines_audit.json')

os.makedirs(AUDIT_DIR, exist_ok=True)

# Colors
BG_COLOR = (11, 13, 23)           # #0b0d17
CARD_BG = (19, 22, 37)            # #131625
CARD_BORDER = (30, 41, 59)        # #1e293b
IMAGE_BG = (12, 14, 26)           # #0c0e1a
IMAGE_BORDER = (40, 50, 70)
TEXT_WHITE = (241, 245, 249)      # #f1f5f9
TEXT_MUTED = (148, 163, 184)      # #94a3b8
TEXT_CYAN = (6, 182, 212)         # #06b6d4
TEXT_AMBER = (245, 158, 11)
TEXT_RED = (239, 68, 68)
TEXT_EMERALD = (16, 185, 129)

BRAND_COLORS = {
    'technogym': ((245, 158, 11, 40), (251, 191, 36)),     # amber
    'hammer strength': ((239, 68, 68, 40), (248, 113, 113)), # red
    'matrix': ((16, 185, 129, 40), (52, 211, 153)),        # emerald
    'panatta': ((6, 182, 212, 40), (103, 232, 249)),        # cyan
    'titanium strength': ((249, 115, 22, 40), (251, 146, 60)), # orange
    'life fitness': ((2, 132, 199, 40), (56, 189, 248)),    # sky
    'estándar': ((20, 184, 166, 40), (45, 212, 191)),      # teal
}

def get_fonts():
    try:
        title_font = ImageFont.truetype('segoeuib.ttf', 26)
        card_title_font = ImageFont.truetype('segoeuib.ttf', 13)
        badge_font = ImageFont.truetype('segoeuib.ttf', 10)
        mono_font = ImageFont.truetype('consola.ttf', 10)
        sub_font = ImageFont.truetype('segoeui.ttf', 11)
    except:
        title_font = ImageFont.load_default()
        card_title_font = ImageFont.load_default()
        badge_font = ImageFont.load_default()
        mono_font = ImageFont.load_default()
        sub_font = ImageFont.load_default()
    return title_font, card_title_font, badge_font, mono_font, sub_font

def get_machine_image(image_url):
    if not image_url:
        return None
    rel = image_url.lstrip('/')
    full = os.path.join(PROJECT_ROOT, 'public', rel)
    candidates = [
        full,
        full[:-4] + '.png' if full.endswith('.jpg') else full[:-4] + '.jpg',
        full[:-5] + '.png' if full.endswith('.jpeg') else full,
        os.path.join(PUBLIC_MACHINES_DIR, os.path.basename(image_url)),
        os.path.join(PUBLIC_MACHINES_DIR, os.path.splitext(os.path.basename(image_url))[0] + '.png'),
        os.path.join(PUBLIC_MACHINES_DIR, os.path.splitext(os.path.basename(image_url))[0] + '.jpg'),
    ]
    for c in candidates:
        if os.path.exists(c):
            try:
                img = Image.open(c).convert('RGBA')
                return img
            except Exception:
                pass
    return None

def draw_sheet(machines, sheet_num, total_sheets, sheet_title, output_path):
    W, H = 1600, 1800
    sheet = Image.new('RGB', (W, H), BG_COLOR)
    draw = ImageDraw.Draw(sheet)
    title_font, card_title_font, badge_font, mono_font, sub_font = get_fonts()

    # Header
    draw.rectangle([0, 0, W, 70], fill=(15, 18, 30))
    draw.line([0, 70, W, 70], fill=CARD_BORDER, width=1)
    draw.text((40, 20), f"MIA · Hoja de Auditoría Visual de Máquinas — {sheet_title}", fill=TEXT_WHITE, font=title_font)
    draw.text((W - 240, 26), f"Lámina {sheet_num} de {total_sheets} ({len(machines)} máq.)", fill=TEXT_CYAN, font=sub_font)

    # 4x4 Grid layout
    cols, rows = 4, 4
    margin_x, margin_top, margin_bottom = 40, 90, 30
    gap_x, gap_y = 16, 16
    card_w = (W - 2 * margin_x - (cols - 1) * gap_x) // cols  # ~368 px
    card_h = (H - margin_top - margin_bottom - (rows - 1) * gap_y) // rows # ~406 px

    for idx, m in enumerate(machines[:16]):
        r = idx // cols
        c = idx % cols
        x0 = margin_x + c * (card_w + gap_x)
        y0 = margin_top + r * (card_h + gap_y)
        x1 = x0 + card_w
        y1 = y0 + card_h

        # Card container
        draw.rounded_rectangle([x0, y0, x1, y1], radius=14, fill=CARD_BG, outline=CARD_BORDER, width=1)

        # Image container
        img_pad = 8
        ix0 = x0 + img_pad
        iy0 = y0 + img_pad
        ix1 = x1 - img_pad
        iy1 = iy0 + 205
        draw.rounded_rectangle([ix0, iy0, ix1, iy1], radius=10, fill=IMAGE_BG, outline=IMAGE_BORDER, width=1)

        # Load and paste machine photo
        raw_img = get_machine_image(m.get('imageUrl'))
        if raw_img:
            # Resize preserving aspect ratio
            max_w = ix1 - ix0 - 12
            max_h = iy1 - iy0 - 12
            raw_img.thumbnail((max_w, max_h), Image.Resampling.LANCZOS)
            px = ix0 + (ix1 - ix0 - raw_img.width) // 2
            py = iy0 + (iy1 - iy0 - raw_img.height) // 2
            sheet.paste(raw_img, (px, py), raw_img)
        else:
            # Placeholder clean icon
            draw.text((ix0 + (ix1 - ix0) // 2 - 40, iy0 + 80), "📷 [Falta Foto]", fill=TEXT_MUTED, font=card_title_font)
            short_id = m.get('id', '')
            draw.text((ix0 + 10, iy0 + 110), f"/machines/{short_id}.png", fill=(244, 63, 94), font=mono_font)

        # Muscle badge on top-right of image
        muscle = m.get('muscleGroupLabel', '')
        if muscle:
            mb_w = len(muscle) * 6 + 12
            draw.rounded_rectangle([ix1 - mb_w - 6, iy0 + 6, ix1 - 6, iy0 + 24], radius=6, fill=(15, 23, 42), outline=(51, 65, 85))
            draw.text((ix1 - mb_w, iy0 + 9), muscle, fill=TEXT_WHITE, font=badge_font)

        # Brand and Load Badges
        brand = m.get('brand', 'Estándar')
        brand_key = brand.lower()
        badge_style = BRAND_COLORS.get(brand_key, ((40, 50, 70), TEXT_CYAN))
        draw.rounded_rectangle([ix0, iy1 + 8, ix0 + 90, iy1 + 24], radius=5, fill=(30, 41, 59), outline=badge_style[1])
        draw.text((ix0 + 6, iy1 + 10), brand[:14], fill=badge_style[1], font=badge_font)

        # Plate vs Stack badge
        load_type = m.get('profile', {}).get('loadType', '')
        load_label = "Discos" if "plate" in load_type else "Placas" if "stack" in load_type else "Libre"
        load_color = TEXT_AMBER if load_label == "Discos" else TEXT_EMERALD
        draw.rounded_rectangle([ix0 + 96, iy1 + 8, ix0 + 145, iy1 + 24], radius=5, fill=(24, 30, 45), outline=CARD_BORDER)
        draw.text((ix0 + 102, iy1 + 10), load_label, fill=load_color, font=badge_font)

        # Model Name (with wrapping)
        model_name = m.get('modelName', m.get('id', ''))
        # Truncate clean
        if len(model_name) > 42:
            model_line1 = model_name[:40]
            model_line2 = model_name[40:80]
            draw.text((ix0, iy1 + 28), model_line1, fill=TEXT_WHITE, font=card_title_font)
            draw.text((ix0, iy1 + 44), model_line2, fill=TEXT_WHITE, font=card_title_font)
        else:
            draw.text((ix0, iy1 + 32), model_name, fill=TEXT_WHITE, font=card_title_font)

        # ID (monospace)
        draw.text((ix0, iy1 + 64), m.get('id', '')[:45], fill=TEXT_CYAN, font=mono_font)

        # Curve Info Bar
        curve = m.get('profile', {}).get('curveWeights', {'stretch': 0.33, 'mid': 0.33, 'shortened': 0.34})
        st_p = int(round(curve.get('stretch', 0) * 100))
        mi_p = int(round(curve.get('mid', 0) * 100))
        sh_p = int(round(curve.get('shortened', 0) * 100))
        curve_label = m.get('profile', {}).get('curveLabel', '') or m.get('profile', {}).get('peakZone', '')

        draw.line([ix0, iy1 + 80, ix1, iy1 + 80], fill=CARD_BORDER, width=1)
        draw.text((ix0, iy1 + 86), f"Est {st_p}% · Med {mi_p}% · Aco {sh_p}%", fill=TEXT_WHITE, font=badge_font)
        draw.text((ix0 + 180, iy1 + 86), curve_label[:20], fill=TEXT_MUTED, font=badge_font)

        # Mini 3-segment color bar
        bar_x = ix0
        bar_y = iy1 + 102
        total_bar_w = ix1 - ix0
        w_st = int(total_bar_w * (st_p / 100.0))
        w_mi = int(total_bar_w * (mi_p / 100.0))
        w_sh = total_bar_w - w_st - w_mi

        draw.rectangle([bar_x, bar_y, bar_x + w_st, bar_y + 4], fill=(6, 182, 212)) # Stretch = Cyan
        draw.rectangle([bar_x + w_st, bar_y, bar_x + w_st + w_mi, bar_y + 4], fill=(139, 92, 246)) # Mid = Purple
        draw.rectangle([bar_x + w_st + w_mi, bar_y, bar_x + total_bar_w, bar_y + 4], fill=(236, 72, 153)) # Short = Pink

    sheet.save(output_path, 'JPEG', quality=92)
    print(f"Generated visual audit sheet: {output_path}")

def main():
    if not os.path.exists(DATA_JSON_PATH):
        print("machines_audit.json not found, running export script first...")
        os.system(f'cd "{PROJECT_ROOT}" && npx tsx scripts/exportMachineCatalogAudit.ts')

    with open(DATA_JSON_PATH, 'r', encoding='utf-8') as f:
        machines = json.load(f)

    print(f"Loaded {len(machines)} machines for visual sheet generation.")

    # Sort: Brand -> Muscle -> Model
    machines.sort(key=lambda m: (m.get('brand', ''), m.get('muscleGroupLabel', ''), m.get('modelName', '')))

    # 1. Continuous Sheets (All machines, 16 per sheet)
    chunk_size = 16
    total_sheets = math.ceil(len(machines) / chunk_size)
    for i in range(total_sheets):
        chunk = machines[i * chunk_size : (i + 1) * chunk_size]
        filename = f"sheet_{i+1:02d}.jpg"
        out = os.path.join(AUDIT_DIR, filename)
        draw_sheet(chunk, i + 1, total_sheets, f"Catálogo Completo ({i+1}/{total_sheets})", out)

    # 2. Per-brand Sheets
    brands = sorted(list(set(m.get('brand', '') for m in machines)))
    for b in brands:
        b_machines = [m for m in machines if m.get('brand', '') == b]
        b_sheets = math.ceil(len(b_machines) / chunk_size)
        slug = b.lower().replace(' ', '_').replace('á', 'a').replace('é', 'e').replace('í', 'i').replace('ó', 'o').replace('ú', 'u')
        for bi in range(b_sheets):
            b_chunk = b_machines[bi * chunk_size : (bi + 1) * chunk_size]
            filename = f"{slug}_{bi+1:02d}.jpg"
            out = os.path.join(AUDIT_DIR, filename)
            draw_sheet(b_chunk, bi + 1, b_sheets, f"{b} ({bi+1}/{b_sheets})", out)

    print(f"All contact sheets successfully generated into: {AUDIT_DIR}")

if __name__ == '__main__':
    main()
