import urllib.request
from PIL import Image
import io

test_urls = {
    '1. panatta_monolith_standing_abductor': [
        'https://panattafitness.com/wp-content/uploads/2023/05/1MTH096.jpg',
        'https://panattafitness.com/wp-content/uploads/2023/05/1MTH096-768x768.jpg'
    ],
    '2. panatta_super_preacher_curl': [
        'https://panattafitness.com/wp-content/uploads/2021/07/1FW151-1.jpg',
        'http://www.panattagymequipment.com.au/wp-content/uploads/2020/08/Biceps-Curling-Machine-1FW151.jpg'
    ],
    '3. panatta_super_belt_squat': [
        'https://www.panattagymequipment.com.au/wp-content/uploads/2021/03/belt-squat-1fw095.jpg',
        'https://panattafitness.com/wp-content/uploads/2021/07/pic-1FW095-01.jpg'
    ],
    '4. panatta_super_pendulum_squat': [
        'https://www.panattagymequipment.com.au/wp-content/uploads/2022/09/1FW080-1.jpeg',
        'https://panattafitness.com/wp-content/uploads/2021/07/1FW080-1.jpg'
    ],
    '5. panatta_super_pullover_machine': [
        'https://panattafitness.com/wp-content/uploads/2021/07/1FW039-1.jpg',
        'http://www.panattagymequipment.com.au/wp-content/uploads/2020/05/1fw039-1.jpg'
    ],
    '6. panatta_super_rowing_plate': [
        'https://panattafitness.com/wp-content/uploads/2021/07/pic_fw104_01.jpg',
        'https://www.panattagymequipment.com.au/wp-content/uploads/2021/03/pic-1hp504a_01.jpg'
    ],
    '7. panatta_super_t_bar_row': [
        'https://panattafitness.com/wp-content/uploads/2021/07/1FW007-1.jpg',
        'https://www.panattagymequipment.com.au/wp-content/uploads/2021/03/t-bar-row-1fw007.jpg'
    ],
    '8. panatta_circular_glute_kickback': [
        'https://panattafitness.com/wp-content/uploads/2023/05/1mth094a.jpg',
        'https://panattafitness.com/wp-content/uploads/2021/07/1FE094A.jpg',
        'https://panattafitness.com/wp-content/uploads/2021/07/1FE094.jpg'
    ],
    '9. panatta_freeweight_lying_leg_curl': [
        'https://panattafitness.com/wp-content/uploads/2021/07/1FW182-1.jpg',
        'http://www.panattagymequipment.com.au/wp-content/uploads/2020/05/1fw182-1.jpg'
    ],
    '10. panatta_standing_unilateral_leg_curl': [
        'https://panattafitness.com/wp-content/uploads/2021/07/1FE084.jpg',
        'https://panattafitness.com/wp-content/uploads/2021/07/1FW082-1.jpg',
        'https://panattafitness.com/wp-content/uploads/2021/07/1MTH082_Leg_Curling_1.jpg'
    ],
    '11. panatta_45_hyperextension_bench': [
        'https://panattafitness.com/wp-content/uploads/2021/07/1FE221-1.jpg',
        'https://panattafitness.com/wp-content/uploads/2021/07/1SC221.jpg'
    ],
    '12. panatta_monolith_triceps_dip': [
        'https://panattafitness.com/wp-content/uploads/2021/07/1MTH138.jpg',
        'https://www.panattagymequipment.com.au/wp-content/uploads/2021/11/1MTH138-pic-01.jpeg'
    ]
}

headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}

for name, urls in test_urls.items():
    print(f"\n{name}:")
    for u in urls:
        try:
            req = urllib.request.Request(u, headers=headers)
            with urllib.request.urlopen(req, timeout=8) as resp:
                status = resp.status
                ct = resp.headers.get('Content-Type')
                data = resp.read()
                size_kb = len(data) / 1024
                img = Image.open(io.BytesIO(data))
                print(f"  OK {status} | {ct} | {size_kb:.1f} KB | {img.size} {img.format} | {u}")
        except Exception as e:
            print(f"  FAILED: {e} | {u}")
