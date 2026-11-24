import urllib.request, re

req = urllib.request.Request('https://panattafitness.com/product-sitemap.xml', headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req, timeout=10) as r:
    xml = r.read().decode('utf-8')
    urls = re.findall(r'<loc>([^<]+)</loc>', xml)

targets = [
    ('panatta_monolith_standing_abductor', 'Standing Abductor', ['standing-abductor', 'abductor', '1mth096', '1fe096', '1fw099']),
    ('panatta_super_preacher_curl', 'Super Preacher / Scott Curl', ['preacher', 'scott', 'curling', '1fw033', '1fw051', '1fw151', '1mth051']),
    ('panatta_super_belt_squat', 'Super Belt Squat', ['belt-squat', '1fw095']),
    ('panatta_super_pendulum_squat', 'Super Pendulum Squat', ['pendulum']),
    ('panatta_super_pullover_machine', 'Super Pullover', ['pullover', '1fw039', '1fw139']),
    ('panatta_super_rowing_plate', 'Super Rowing Plate', ['super-rowing', '1fw004', '1fw204', '1hp504']),
    ('panatta_super_t_bar_row', 'Super T-Bar Row', ['t-bar', 'tbar', '1fw007', '1hp507']),
    ('panatta_circular_glute_kickback', 'Circular Glute Kickback', ['glute', 'kickback', 'circular', '1fw094', '1fw194', '1fw089', '1fw096']),
    ('panatta_freeweight_lying_leg_curl', 'FreeWeight Lying Leg Curl', ['lying-leg-curl', 'prone-leg-curl', '1fw182', '1hp582', '1fw081', '1fw082']),
    ('panatta_standing_unilateral_leg_curl', 'Standing Unilateral Leg Curl', ['standing-leg-curl', 'standing-unilateral', '1mth082', '1fw082', 'alternate-leg-curl']),
    ('panatta_45_hyperextension_bench', '45 Hyperextension Bench', ['hyperextension', 'roman-chair', '45', 'back-extension']),
    ('panatta_monolith_triceps_dip', 'Monolith Triceps Dip', ['dip', 'triceps-dip', '1mth035', '1mth038', '1mth138', '1mth053', '1fe038'])
]

for tid, desc, kws in targets:
    print(f"\n==========================================")
    print(f"Target: {tid} ({desc})")
    matched = []
    for u in urls:
        u_lower = u.lower()
        if any(kw in u_lower for kw in kws):
            matched.append(u)
    for m in matched:
        print("  ->", m)
