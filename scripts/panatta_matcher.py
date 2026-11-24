# Inspect matches from the 163 product urls on panattagymequipment.com.au
import urllib.request, re

with open('scratch_links.txt', 'w') as f:
    pass

targets = [
    ('panatta_monolith_standing_abductor', ['standing-abductor', 'abductor', '1mth096', '1fw099']),
    ('panatta_super_preacher_curl', ['preacher', 'scott', 'curling-machine-1fw151', 'preacher-curl-machine-1mth051', '1fw033']),
    ('panatta_super_belt_squat', ['belt-squat-1fw095']),
    ('panatta_super_pendulum_squat', ['pendulum', 'squat']),
    ('panatta_super_pullover_machine', ['pullover']),
    ('panatta_super_rowing_plate', ['super-rowing-1fw004', 'rowing']),
    ('panatta_super_t_bar_row', ['t-bar-row-1fw007', 't-bar']),
    ('panatta_circular_glute_kickback', ['glute', 'kickback', 'circular']),
    ('panatta_freeweight_lying_leg_curl', ['lying-leg-curling-machine-1fw182', 'leg-curl']),
    ('panatta_standing_unilateral_leg_curl', ['alternate-leg-curling-1fw082', 'standing-leg-curl', 'curling']),
    ('panatta_45_hyperextension_bench', ['hyperextension', 'bench', 'roman']),
    ('panatta_monolith_triceps_dip', ['dip-press-1mth138', 'dual-dip-press-station-1mth038', 'triceps-machine-1mth053', 'dip'])
]

sm = 'https://www.panattagymequipment.com.au/page-sitemap.xml'
req = urllib.request.Request(sm, headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req, timeout=10) as r:
    xml = r.read().decode('utf-8')
    locs = re.findall(r'<loc>([^<]+)</loc>', xml)
prods = [l for l in locs if '/product/' in l]

for tid, kws in targets:
    print(f"\nTarget: {tid}")
    for p in prods:
        if any(kw in p.lower() for kw in kws):
            print(f"   Candidate: {p}")
