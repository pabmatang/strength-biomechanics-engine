import urllib.request
import os

PANATTA_MAP = {
    'panatta_monolith_standing_abductor.jpg': 'https://panattafitness.com/wp-content/uploads/2023/05/1MTH096.jpg',
    'panatta_super_preacher_curl.jpg': 'https://panattafitness.com/wp-content/uploads/2021/07/1FW151-1.jpg',
    'panatta_super_belt_squat.jpg': 'https://www.panattagymequipment.com.au/wp-content/uploads/2021/03/belt-squat-1fw095.jpg',
    'panatta_super_pendulum_squat.jpg': 'https://www.panattagymequipment.com.au/wp-content/uploads/2022/09/1FW080-1.jpeg',
    'panatta_super_pullover_machine.jpg': 'https://panattafitness.com/wp-content/uploads/2021/07/1FW039-1.jpg',
    'panatta_super_rowing_plate.jpg': 'https://panattafitness.com/wp-content/uploads/2021/07/pic_fw104_01.jpg',
    'panatta_super_t_bar_row.jpg': 'https://panattafitness.com/wp-content/uploads/2021/07/1FW007-1.jpg',
    'panatta_circular_glute_kickback.jpg': 'https://panattafitness.com/wp-content/uploads/2023/05/1mth094a.jpg',
    'panatta_freeweight_lying_leg_curl.jpg': 'https://panattafitness.com/wp-content/uploads/2021/07/1FW182-1.jpg',
    'panatta_standing_unilateral_leg_curl.jpg': 'https://panattafitness.com/wp-content/uploads/2021/07/1FE084.jpg',
    'panatta_45_hyperextension_bench.jpg': 'https://panattafitness.com/wp-content/uploads/2021/07/1FE221-1.jpg',
    'panatta_monolith_triceps_dip.jpg': 'https://panattafitness.com/wp-content/uploads/2021/07/1MTH138.jpg',
}

headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
out_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'public', 'machines')

print(f"Downloading {len(PANATTA_MAP)} Panatta images to {out_dir}...")
for fname, url in PANATTA_MAP.items():
    out_path = os.path.join(out_dir, fname)
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=12) as res:
            data = res.read()
            with open(out_path, 'wb') as f:
                f.write(data)
            print(f"  [OK] {fname} ({len(data)} bytes)")
    except Exception as e:
        print(f"  [ERROR] {fname} from {url}: {e}")

print("Panatta batch download completed.")
