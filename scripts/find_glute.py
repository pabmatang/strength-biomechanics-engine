import urllib.request, re

req = urllib.request.Request('https://www.panattagymequipment.com.au/products/glute-machines/', headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req, timeout=10) as r:
    html = r.read().decode('utf-8', errors='ignore')
    links = re.findall(r'href=[\'"](https://[^\'"]+)[\'"]', html)
    for l in set(links):
        if '/product/' in l:
            print(l)
