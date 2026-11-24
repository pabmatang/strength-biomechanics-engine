import urllib.request
import re

headers = {'User-Agent': 'Mozilla/5.0'}
url = 'https://www.renewfit.com/en/used-technogym-selection-c62.html'
try:
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req, timeout=6) as r:
        html = r.read().decode('utf-8', errors='ignore')
        imgs = re.findall(r'https?://[^\s"\'<>]+\.(?:jpg|png|webp)', html)
        print(f"Found {len(imgs)} imgs:")
        for img in sorted(set(imgs)):
            if 'photos' in img:
                print(' ', img)
except Exception as e:
    print('ERR:', e)
