import urllib.request, re

sm = 'https://www.panattagymequipment.com.au/page-sitemap.xml'
req = urllib.request.Request(sm, headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req, timeout=10) as r:
    xml = r.read().decode('utf-8')
    locs = re.findall(r'<loc>([^<]+)</loc>', xml)

prods = [l for l in locs if '/product/' in l]
print(f"Total product pages: {len(prods)}")
for p in sorted(prods):
    print(p)
