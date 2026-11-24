import re

path = r'C:\Users\Pablo\.gemini\antigravity\scratch\mia\src\data\machines\estandar.ts'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

replacements = {
    'standard_incline_press': '/machines/technogym_pure_incline_chest.png',
    'standard_pec_deck': '/machines/technogym_selection_pec_deck.png',
    'standard_seated_row': '/machines/technogym_pure_row_dorian.png',
    'standard_lat_pulldown': '/machines/technogym_selection_lat_machine.png',
    'standard_shoulder_press': '/machines/technogym_selection_shoulder_press.png',
    'standard_lateral_raise': '/machines/technogym_selection_lateral_raise.png',
    'standard_leg_extension': '/machines/technogym_selection_leg_extension.png',
    'standard_seated_leg_curl': '/machines/technogym_selection_leg_curl.png',
    'standard_lying_leg_curl': '/machines/technogym_selection_prone_leg_curl.png',
    'standard_abductor_machine': '/machines/technogym_selection_abductor.png',
    'standard_adductor_machine': '/machines/technogym_selection_adductor.png',
    'standard_seated_calf': '/machines/technogym_pure_seated_calf.png',
    'standard_standing_calf': '/machines/technogym_selection_standing_calf.png',
}

count = 0
for m_id, img_path in replacements.items():
    pattern = rf"(id:\s*'{m_id}',[\s\S]*?imageUrl:\s*)null"
    if re.search(pattern, content):
        content = re.sub(pattern, rf"\g<1>'{img_path}'", content, count=1)
        count += 1
    else:
        print(f'NOT FOUND: {m_id}')

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print(f'Replaced {count} machine images in estandar.ts')
