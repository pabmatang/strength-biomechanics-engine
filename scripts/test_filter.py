import re

path = r'C:\Users\Pablo\.gemini\antigravity\scratch\mia\src\data\spanishGymMachines.ts'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

# Parse blocks
blocks = text.split('{')
print("Exercises with brand == 'Technogym':")
for b in blocks:
    if "brand: 'Technogym'" in b or 'brand: "Technogym"' in b:
        id_m = re.search(r"id:\s*'([^']+)'", b)
        title_m = re.search(r"title:\s*'([^']+)'", b)
        img_m = re.search(r"image_url:\s*'([^']+)'", b)
        brand_m = re.search(r"brand:\s*'([^']+)'", b)
        m_id = id_m.group(1) if id_m else '?'
        title = title_m.group(1) if title_m else '?'
        img = img_m.group(1) if img_m else '?'
        print(f"ID: {m_id:35} | Title: {title[:40]:40} | Img: {img}")
