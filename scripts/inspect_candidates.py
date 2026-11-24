import urllib.request, re

candidates = {
    'panatta_monolith_standing_abductor': [
        'https://panattafitness.com/product/monolith/lower-body-monolith/panatta-monolith-standing-abductor-machine-1mth096/',
        'https://www.panattagymequipment.com.au/product/standing-abductor-1fw099/'
    ],
    'panatta_super_preacher_curl': [
        'https://panattafitness.com/product/freeweight-special/upper-body-freeweight/panatta-freeweight-special-curling-machine-1fw151-2/',
        'https://www.panattagymequipment.com.au/product/curling-machine-1fw151/'
    ],
    'panatta_super_belt_squat': [
        'https://panattafitness.com/product/freeweight-special/lower-body/panatta-freeweight-special-belt-squat-1fw095/',
        'https://www.panattagymequipment.com.au/product/belt-squat-1fw095/'
    ],
    'panatta_super_pendulum_squat': [
        'https://panattafitness.com/product/freeweight-special/lower-body/panatta-freeweight-special-super-super-pendulum-squat-1fw080/',
        'https://www.panattagymequipment.com.au/product/1FW080'
    ],
    'panatta_super_pullover_machine': [
        'https://panattafitness.com/product/freeweight-special/upper-body-freeweight/panatta-freeweight-special-super-pullover-machine-1fw039/',
        'https://www.panattagymequipment.com.au/product/super-pullover-machine-1fw039/'
    ],
    'panatta_super_rowing_plate': [
        'https://panattafitness.com/product/freeweight-special/upper-body-freeweight/panatta-freeweight-special-super-rowing-1fw104/',
        'https://www.panattagymequipment.com.au/product/super-rowing-1fw004'
    ],
    'panatta_super_t_bar_row': [
        'https://panattafitness.com/product/freeweight-special/upper-body-freeweight/panatta-freeweight-special-t-bar-row-1fw007/',
        'https://www.panattagymequipment.com.au/product/t-bar-row-1fw007/'
    ],
    'panatta_circular_glute_kickback': [
        'https://panattafitness.com/product/monolith/lower-body-monolith/panatta-monolith-master-gluteus-plus-1mth094a/',
        'https://panattafitness.com/product/fit-evo/lower-body-fit-evo/panatta-fit-evo-master-gluteus-plus-1fe094a/'
    ],
    'panatta_freeweight_lying_leg_curl': [
        'https://panattafitness.com/product/freeweight-special/lower-body/panatta-freeweight-special-leg-curling-1fw182/',
        'https://www.panattagymequipment.com.au/product/lying-leg-curling-machine-1fw182/'
    ],
    'panatta_standing_unilateral_leg_curl': [
        'https://panattafitness.com/product/monolith/lower-body-monolith/panatta-monolith-leg-curling-1mth082/',
        'https://panattafitness.com/product/freeweight-special/lower-body/panatta-freeweight-special-alternate-leg-curling-1fw082/',
        'https://panattafitness.com/product/fit-evo/lower-body-fit-evo/panatta-fit-evo-standing-leg-curling-1fe084/'
    ],
    'panatta_45_hyperextension_bench': [
        'https://panattafitness.com/product/fit-evo/benches-fit-evo/panatta-fit-evo-iperextension-45-bench-1fe221/',
        'https://panattafitness.com/product/sec/benches/panatta-sec-iperextension-45-degree-bench-1sc221/'
    ],
    'panatta_monolith_triceps_dip': [
        'https://panattafitness.com/product/monolith/upper-body-monolith/panatta-monolith-dips-press-1mth138/',
        'https://www.panattagymequipment.com.au/product/dip-press-1mth138/'
    ]
}

headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}

for tid, urls in candidates.items():
    print(f"\n==========================================", flush=True)
    print(f"Target: {tid}", flush=True)
    for u in urls:
        print(f"Checking URL: {u}", flush=True)
        try:
            req = urllib.request.Request(u, headers=headers)
            with urllib.request.urlopen(req, timeout=5) as r:
                html = r.read().decode('utf-8', errors='ignore')
                m_title = re.search(r'<title>([^<]+)</title>', html)
                title = m_title.group(1) if m_title else 'No Title'
                imgs = re.findall(r'https?://[^\s"\'<>]+\.(?:jpg|jpeg|png|webp)', html)
                prod_imgs = [img for img in set(imgs) if 'wp-content/uploads' in img and not any(x in img.lower() for x in ['logo', 'icon', 'banner', 'flag', 'facebook', 'instagram', 'avatar', 'payment', 'cropped'])]
                print(f"  Title: {title.strip()}", flush=True)
                for pi in sorted(prod_imgs)[:3]:
                    print(f"    - {pi}", flush=True)
        except Exception as e:
            print(f"  Error fetching {u}: {e}", flush=True)
