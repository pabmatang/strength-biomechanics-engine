import urllib.request
import os

url = 'https://webapi-prod.technogym.com/dw/image/v2/BFLQ_PRD/on/demandware.static/-/Sites-tg-catalog-master/default/dw668e0beb/product/MNSP/selection_900_arm_extension_related.jpg'
headers = {'User-Agent': 'Mozilla/5.0'}
req = urllib.request.Request(url, headers=headers)
with urllib.request.urlopen(req, timeout=5) as r:
    data = r.read()
    print('Downloaded arm_extension_related:', len(data), 'bytes')
    with open(r'C:\Users\Pablo\.gemini\antigravity\scratch\mia\public\machines\technogym_selection_seated_dip.jpg', 'wb') as f:
        f.write(data)
