import urllib.request
import re

headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
url = 'https://www.renewfit.com/en/technogym-selection-m945-triceps-extension-refurbished-machine-a3939.html'
try:
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req, timeout=6) as r:
        html = r.read().decode('utf-8', errors='ignore')
        imgs = re.findall(r'https?://[^\s"\'<>]+\.(?:jpg|png|webp)', html)
        print('Renewfit M945 images:')
        for img in set(imgs):
            if 'photos' in img:
                print(' ', img)
except Exception as e:
    print('ERR:', e)
