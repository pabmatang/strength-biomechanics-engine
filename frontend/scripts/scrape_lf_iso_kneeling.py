import urllib.request
import re

url = "https://www.lifefitness.com/es-es/productos/fuerza/plate-loaded/plate-loaded-iso-lateral-kneeling-leg-curl"
headers = {'User-Agent': 'Mozilla/5.0'}
req = urllib.request.Request(url, headers=headers)
with urllib.request.urlopen(req) as r:
    html = r.read().decode('utf-8', errors='ignore')

imgs = set(re.findall(r'https://[^"\'\s]+\.(?:png|jpg|jpeg|webp)', html))
for img in imgs:
    if 'kentico13corebase' in img.lower():
        print(img)
