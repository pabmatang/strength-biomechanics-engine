import urllib.request
import re

urls = [
    ('technogym_selection_leg_extension.jpg', 'https://www.technogym.com/en-INT/product/selection-900-leg-extension/'),
    ('technogym_selection_prone_leg_curl.jpg', 'https://www.technogym.com/en-INT/product/selection-900-prone-leg-curl/'),
    ('technogym_selection_lower_back.jpg', 'https://www.technogym.com/en-INT/product/selection-900-lower-back/'),
    ('technogym_selection_seated_dip.jpg', 'https://www.technogym.com/en-INT/product/selection-700-seated-dip/')
]

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)',
    'Referer': 'https://www.technogym.com/'
}

for target_name, u in urls:
    try:
        req = urllib.request.Request(u, headers=headers)
        with urllib.request.urlopen(req, timeout=6) as resp:
            html = resp.read().decode('utf-8', errors='ignore')
            imgs = re.findall(r'https://[^"\'\s]+\.(?:jpg|png|webp)', html)
            imgs = [img for img in imgs if 'feed/images' in img or 'ctfassets' in img]
            print(f"URL {u}: found {len(imgs)} imgs")
            if imgs:
                img_url = imgs[0]
                print(f"  Downloading: {img_url}")
                img_req = urllib.request.Request(img_url, headers=headers)
                with urllib.request.urlopen(img_req, timeout=6) as i_resp:
                    data = i_resp.read()
                    with open(r'C:\Users\Pablo\.gemini\antigravity\scratch\mia\public\machines\\' + target_name, 'wb') as f:
                        f.write(data)
                    print(f"  SUCCESS saved {target_name} ({len(data)} bytes)")
    except Exception as e:
        print(f"ERR {u}: {e}")
