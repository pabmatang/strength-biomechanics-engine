import urllib.request
import re

url = 'https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQFlWqX88vFh9YXcCHBabMz0KdRZmUwIXs33jwmSe4lOKbMTW10mQyNLGLCxVtJsYYQOgddo-au6af2evlh11p0lJAzcKwo7JWpi2QpXTeJTgCkbV0NyY0-t16Lzh14_QEWhC6GIpP6uA8UDT-SnQUwIkpUm4gmJODSRpDW4sqtoKtZ1JgumuAcDHV3GU1hzQcPxwHqRaKE='
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
try:
    with urllib.request.urlopen(req) as res:
        print('Final URL:', res.geturl())
        html = res.read().decode('utf-8', errors='ignore')
        matches = re.findall(r'https://www\.lifefitness\.com/Kentico13CoreBase/media[^\s"\'<>]+', html)
        for m in sorted(list(set(matches))):
            if any(ext in m.lower() for ext in ['.png', '.jpg', '.webp']):
                print(m)
except Exception as e:
    print('Error:', e)
