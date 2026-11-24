import os
import re

mi_path = r'C:\Users\Pablo\.gemini\antigravity\scratch\mia\src\utils\machineImages.ts'
with open(mi_path, 'r', encoding='utf-8') as f:
    mi_content = f.read()

mappings = dict(re.findall(r'([a-zA-Z0-9_]+):\s*\'(/machines/[^\']+)\'', mi_content))
print(f'Found {len(mappings)} mappings')

path = r'C:\Users\Pablo\.gemini\antigravity\scratch\mia\src\data\spanishGymMachines.ts'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

def replace_entry(match):
    full = match.group(0)
    id_m = re.search(r"id:\s*'([^']+)'", full)
    if id_m:
        t_id = id_m.group(1)
        if t_id in mappings:
            new_url = mappings[t_id]
            full = re.sub(r"image_url:\s*'[^']+'", f"image_url: '{new_url}'", full)
    return full

new_content = re.sub(r'\{[^{}]*?id:\s*\'[^\']+\'[^{}]*?\}', replace_entry, content, flags=re.DOTALL)

with open(path, 'w', encoding='utf-8') as f:
    f.write(new_content)

print('Updated spanishGymMachines.ts successfully!')
