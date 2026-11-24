import os
import requests
import sys

TARGET_MACHINES = {
    # 1. TITANIUM STRENGTH (13)
    "titanium_black_leg_press_45": "https://www.titaniumstrength.es/media/catalog/product/cache/a6d0cdeb89887e36d4c13453d187eac1/b/s/bs-pl2-1_2.jpg",
    "titanium_black_leg_extension": "https://www.titaniumstrength.es/media/catalog/product/cache/a6d0cdeb89887e36d4c13453d187eac1/b/s/bs-pl4-1.jpg",
    "titanium_black_hack_squat": "https://www.titaniumstrength.es/media/catalog/product/cache/a6d0cdeb89887e36d4c13453d187eac1/b/s/bs-pl33_1__1.jpg",
    "titanium_black_pendulum_squat": "https://www.titaniumstrength.es/media/catalog/product/cache/a6d0cdeb89887e36d4c13453d187eac1/b/s/bs-pl42_1_1.jpg",
    "titanium_black_lat_pulldown": "https://www.titaniumstrength.es/media/catalog/product/cache/a6d0cdeb89887e36d4c13453d187eac1/b/s/bs-pl6-1_1.jpg",
    "titanium_black_low_row": "https://www.titaniumstrength.es/media/catalog/product/cache/a6d0cdeb89887e36d4c13453d187eac1/b/s/bs-pl17-1_1.jpg",
    "titanium_black_t_bar_row": "https://www.titaniumstrength.es/media/catalog/product/cache/a6d0cdeb89887e36d4c13453d187eac1/t/-/t-pl23-1.jpg",
    "titanium_black_high_row": "https://www.titaniumstrength.es/media/catalog/product/cache/a6d0cdeb89887e36d4c13453d187eac1/b/s/bs-pl18-1_1.jpg",
    "titanium_black_hip_thrust": "https://www.titaniumstrength.es/media/catalog/product/cache/a6d0cdeb89887e36d4c13453d187eac1/g/h/gh-pl13_i.jpg",
    "titanium_black_shoulder_press": "https://www.titaniumstrength.es/media/catalog/product/cache/a6d0cdeb89887e36d4c13453d187eac1/b/s/bs-pl7-1_2.jpg",
    "titanium_black_standing_lateral_raise": "https://www.titaniumstrength.es/media/catalog/product/cache/a6d0cdeb89887e36d4c13453d187eac1/b/s/bs-pl29-1.jpg",
    "titanium_black_chest_press": "https://www.titaniumstrength.es/media/catalog/product/cache/a6d0cdeb89887e36d4c13453d187eac1/b/s/bs-pl25-1_2.jpg",
    "titanium_black_incline_press": "https://www.titaniumstrength.es/media/catalog/product/cache/a6d0cdeb89887e36d4c13453d187eac1/b/s/bs-pl1-1_1.jpg",

    # 2. TECHNOGYM (8)
    "technogym_selection_rotary_torso": "https://www.technogym.com/es-ES/feed/images/MNYP/selection-900-rotary-torso-plp.jpg",
    "technogym_selection_vertical_traction": "https://www.technogym.com/es-ES/feed/images/MNGP/selection-900-vertical-traction-plp.jpg",
    "technogym_selection_upper_back": "https://www.technogym.com/es-ES/feed/images/MN1P/selection-900-upper-back.jpg",
    "technogym_pure_seated_calf": "https://www.technogym.com/es-ES/feed/images/MG46/pure-strength-seated-calf_MG46_grey.jpg",
    "technogym_selection_glute": "https://www.technogym.com/es-ES/feed/images/MN4P/selection-900-glute-press-MN4-plp.jpg",
    "technogym_selection_delts_machine": "https://www.technogym.com/es-ES/feed/images/MNKP/selection-900delt-machine.jpg",
    "technogym_selection_chest_incline": "https://www.renewfit.com/photos_grd/ph1670235583160.jpg",
    "technogym_selection_arm_extension": "https://www.technogym.com/es-ES/feed/images/MNSP/selection-900-arm-extension-plp.jpg",

    # 3. PANATTA (9)
    "panatta_monolith_standing_abductor": "https://panattafitness.com/wp-content/uploads/2023/05/1MTH096.jpg",
    "panatta_super_belt_squat": "https://www.panattagymequipment.com.au/wp-content/uploads/2021/03/belt-squat-1fw095.jpg",
    "panatta_circular_glute_kickback": "https://panattafitness.com/wp-content/uploads/2023/05/1mth094a.jpg",
    "panatta_standing_unilateral_leg_curl": "https://panattafitness.com/wp-content/uploads/2021/07/1FE084.jpg",
    "panatta_45_hyperextension_bench": "https://panattafitness.com/wp-content/uploads/2021/07/1FE221-1.jpg",
    "panatta_monolith_triceps_dip": "https://panattafitness.com/wp-content/uploads/2021/07/1MTH138.jpg",
    "panatta_super_rowing_plate": "https://panattafitness.com/wp-content/uploads/2021/07/pic_fw104_01.jpg",
    "panatta_super_t_bar_row": "https://panattafitness.com/wp-content/uploads/2021/07/1FW007-1.jpg",
    "panatta_super_preacher_curl": "https://panattafitness.com/wp-content/uploads/2021/07/1FW151-1.jpg",

    # 4. HAMMER STRENGTH (2)
    "hammer_select_ab_crunch": "https://www.lifefitness.com/Kentico13CoreBase/media/LFMedia/LifeFitnessImages/MediaSync/165-025-hammer-strength-select-abdominal-crunch-image-1--data.jpg",
    "hammer_select_pec_fly": "https://www.lifefitness.com/Kentico13CoreBase/media/LFMedia/LifeFitnessImages/MediaSync/22-855-hammer-strength-select-pectoral-fly-rear-deltoid-image.jpg",

    # 5. MATRIX (1)
    "matrix_ultra_seated_row": "https://www.renewfit.com/photos_grd/ph1671718468538.jpg"
}

def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)
    machines_dir = os.path.join(project_root, 'public', 'machines')
    os.makedirs(machines_dir, exist_ok=True)

    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Encoding': 'identity'
    }

    print(f"Descargando {len(TARGET_MACHINES)} imágenes en {machines_dir}...")
    success_count = 0
    fail_count = 0

    for m_id, url in TARGET_MACHINES.items():
        # Determine extension from url or default to .jpg
        ext = '.jpg'
        if '.jpeg' in url.lower():
            ext = '.jpeg'
        elif '.png' in url.lower():
            ext = '.png'
        elif '.webp' in url.lower():
            ext = '.webp'

        # Remove existing broken png if it exists
        broken_png = os.path.join(machines_dir, m_id + '.png')
        if os.path.exists(broken_png):
            try:
                os.remove(broken_png)
            except Exception as e:
                print(f"Could not remove old {broken_png}: {e}")

        dest_file = os.path.join(machines_dir, m_id + ext)

        try:
            r = requests.get(url, headers=headers, timeout=20)
            if r.status_code == 200 and len(r.content) > 1000:
                with open(dest_file, 'wb') as f:
                    f.write(r.content)
                print(f"  [OK] {m_id:38s} -> {m_id + ext} ({len(r.content)} bytes)")
                success_count += 1
            else:
                print(f"  [FAIL {r.status_code}] {m_id:38s} (bytes: {len(r.content)})")
                fail_count += 1
        except Exception as e:
            print(f"  [ERROR] {m_id:38s}: {e}")
            fail_count += 1

    print("\n" + "="*50)
    print(f"Descargas completadas: {success_count} exitosas, {fail_count} fallidas.")
    print("="*50)

if __name__ == '__main__':
    main()
