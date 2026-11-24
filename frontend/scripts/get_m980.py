import urllib.request
import re

headers = {'User-Agent': 'Mozilla/5.0'}
url = 'https://www.renewfit.com/en/technogym-selection-low-row-m980-refurbished-machine-a3930.html'

try:
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req, timeout=6) as r:
        html = r.read().decode('utf-8', errors='ignore')
        imgs = re.findall(r'https?://[^\s"\'<>]+\.(?:jpg|png|webp)', html)
        for img in set(imgs):
            if 'photos' in img:
                print('Found Renewfit Low Row:', img)
except Exception as e:
    print('ERR:', e)
