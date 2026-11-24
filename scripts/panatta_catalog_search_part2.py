import urllib.request, re

req = urllib.request.Request('https://panattafitness.com/product-sitemap.xml', headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req, timeout=10) as r:
    xml = r.read().decode('utf-8')
    urls = re.findall(r'<loc>([^<]+)</loc>', xml)

targets = [
    ('panatta_super_pendulum_squat', ['pendulum', 'squat']),
    ('panatta_super_pullover_machine', ['pullover']),
    ('panatta_super_rowing_plate', ['rowing']),
    ('panatta_super_t_bar_row', ['t-bar', 'tbar', 'row']),
    ('panatta_circular_glute_kickback', ['glute', 'kickback'])
]

for tid, kws in targets:
    print(f"\nTarget: {tid}")
    matched = [u for u in urls if any(kw in u.lower() for kw in kws)]
    for m in matched:
        print("  ->", m)
