import urllib.request
import re

url = 'https://www.lifefitness.com/en-us/catalog/strength/plate-loaded/hammer-strength/iso-lateral-dy-row'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
try:
    with urllib.request.urlopen(req) as res:
        html = res.read().decode('utf-8', errors='ignore')
        matches = re.findall(r'https://www\.lifefitness\.com/Kentico13CoreBase/media[^\s"\'<>]+', html)
        print('Found on DY page:')
        for m in sorted(list(set(matches))):
            if any(ext in m.lower() for ext in ['.png', '.jpg', '.webp']):
                print(m)
except Exception as e:
    print('Error loading DY page:', e)
