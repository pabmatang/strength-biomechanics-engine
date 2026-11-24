import urllib.request
from PIL import Image
import io

urls = {
    '1. panatta_monolith_standing_abductor': 'https://panattafitness.com/wp-content/uploads/2023/05/1MTH096.jpg',
    '2. panatta_super_preacher_curl': 'https://panattafitness.com/wp-content/uploads/2021/07/1FW151-1.jpg',
    '2b. panatta_super_preacher_curl_au': 'http://www.panattagymequipment.com.au/wp-content/uploads/2020/08/Biceps-Curling-Machine-1FW151.jpg',
    '3. panatta_super_belt_squat': 'https://www.panattagymequipment.com.au/wp-content/uploads/2021/03/belt-squat-1fw095.jpg',
    '3b. panatta_super_belt_squat_us': 'https://panattafitness.com/wp-content/uploads/2021/07/pic-1FW095-01.jpg',
    '4. panatta_super_pendulum_squat': 'https://www.panattagymequipment.com.au/wp-content/uploads/2022/09/1FW080-1.jpeg',
    '5. panatta_super_pullover_machine': 'https://panattafitness.com/wp-content/uploads/2021/07/1FW039-1.jpg',
    '5b. panatta_super_pullover_machine_au': 'http://www.panattagymequipment.com.au/wp-content/uploads/2020/05/1fw039-1.jpg',
    '6. panatta_super_rowing_plate': 'https://panattafitness.com/wp-content/uploads/2021/07/pic_fw104_01.jpg',
    '6b. panatta_super_rowing_plate_au': 'https://www.panattagymequipment.com.au/wp-content/uploads/2021/03/pic-1hp504a_01.jpg',
    '7. panatta_super_t_bar_row': 'https://www.panattagymequipment.com.au/wp-content/uploads/2021/03/t-bar-row-1fw007.jpg',
    '7b. panatta_super_t_bar_row_us': 'https://panattafitness.com/wp-content/uploads/2021/07/1FW007-1.jpg',
    '8. panatta_circular_glute_kickback_1mth': 'https://panattafitness.com/wp-content/uploads/2023/05/1mth094a.jpg',
    '8b. panatta_circular_glute_kickback_1fe': 'https://panattafitness.com/wp-content/uploads/2021/07/1FE094A.jpg',
    '9. panatta_freeweight_lying_leg_curl': 'https://panattafitness.com/wp-content/uploads/2021/07/1FW182-1.jpg',
    '9b. panatta_freeweight_lying_leg_curl_au': 'http://www.panattagymequipment.com.au/wp-content/uploads/2020/05/1fw182-1.jpg',
    '10. 1FE084_standing_leg_curl': 'https://panattafitness.com/wp-content/uploads/2021/07/1FE084.jpg',
    '10b. 1FW082_alternate_leg_curl': 'https://panattafitness.com/wp-content/uploads/2021/07/1FW082-1.jpg',
    '10c. 1MTH082_leg_curl': 'https://panattafitness.com/wp-content/uploads/2021/07/1MTH082_Leg_Curling_1.jpg',
    '11. panatta_45_hyperextension_bench': 'https://panattafitness.com/wp-content/uploads/2021/07/1FE221-1.jpg',
    '12. panatta_monolith_triceps_dip': 'https://www.panattagymequipment.com.au/wp-content/uploads/2021/11/1MTH138-pic-01.jpeg',
    '12b. panatta_monolith_triceps_dip_us': 'https://panattafitness.com/wp-content/uploads/2021/07/1MTH138.jpg'
}

headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}

for k, u in urls.items():
    req = urllib.request.Request(u, headers=headers)
    with urllib.request.urlopen(req, timeout=8) as r:
        data = r.read()
        im = Image.open(io.BytesIO(data))
        # inspect corners
        w, h = im.size
        # sample some pixels to see background
        corners = [im.getpixel((0,0)), im.getpixel((w-1, 0)), im.getpixel((0, h-1)), im.getpixel((w-1, h-1))]
        print(f"{k}: size={im.size}, bytes={len(data)}, mode={im.mode}, corners={corners[:2]}")
