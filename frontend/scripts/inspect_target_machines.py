import re

path = r'C:\Users\Pablo\.gemini\antigravity\scratch\mia\src\data\spanishGymMachines.ts'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

ids = [
    'matrix_ultra_leg_extension',
    'matrix_ultra_diverging_lat_pulldown',
    'matrix_ultra_converging_chest',
    'matrix_ultra_lateral_raise',
    'hammer_iso_front_lat_pulldown',
    'hammer_kneeling_leg_curl',
    'hammer_iso_incline_press',
    'hammer_back_extension',
    'technogym_selection_seated_dip',
    'eleiko_prestera_half_rack',
    'matrix_versa_calf_extension',
    'technogym_selection_wide_row',
    'technogym_selection_hip_thrust'
]

for target in ids:
    m = re.search(r"id:\s*['\"]" + target + r"['\"].*?image_url:\s*['\"]([^'\"]*)['\"]", text, re.DOTALL)
    if m:
        print(f"{target}: url={m.group(1)}")
    else:
        # Search if ID is defined with other name or details
        m2 = re.search(r"id:\s*['\"]" + target + r"['\"].*?\n\s*name:\s*['\"]([^'\"]*)['\"]", text, re.DOTALL)
        if m2:
            print(f"{target}: name={m2.group(1)}")
        else:
            print(f"{target}: NOT FOUND IN spanishGymMachines.ts")
