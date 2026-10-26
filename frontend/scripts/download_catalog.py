import os
import re
import urllib.request

path = r'C:\Users\Pablo\.gemini\antigravity\scratch\mia\src\data\spanishGymMachines.ts'
dest_dir = r'C:\Users\Pablo\.gemini\antigravity\scratch\mia\public\machines'
os.makedirs(dest_dir, exist_ok=True)

with open(path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

current_id = None
current_url = None

items = []
for line in lines:
    m_id = re.search(r"id:\s*'([^']+)'", line)
    if m_id:
        current_id = m_id.group(1)
    m_url = re.search(r"image_url:\s*'([^']+)'", line)
    if m_url and current_id:
        current_url = m_url.group(1)
        items.append((current_id, current_url))
        current_id = None
        current_url = None

print(f"Total parsed: {len(items)}")

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Referer': 'https://www.technogym.com/'
}

for machine_id, url in items:
    if 'unsplash.com' in url or 'pexels.com' in url:
        continue
    
    ext = '.jpg'
    if '.png' in url.lower(): ext = '.png'
    elif '.jpeg' in url.lower(): ext = '.jpeg'
    
    filename = f"{machine_id}{ext}"
    target_path = os.path.join(dest_dir, filename)
    
    if os.path.exists(target_path) and os.path.getsize(target_path) > 10000:
        continue
        
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=6) as resp:
            data = resp.read()
            if len(data) > 5000:
                with open(target_path, 'wb') as out_f:
                    out_f.write(data)
                print(f"OK: {machine_id} ({len(data)} bytes) saved to {filename}")
            else:
                print(f"TOO SMALL: {machine_id} ({len(data)} bytes)")
    except Exception as e:
        print(f"ERR {machine_id}: {e}")
