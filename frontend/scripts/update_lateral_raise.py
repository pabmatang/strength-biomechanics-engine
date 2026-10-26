import re

path = r'C:\Users\Pablo\.gemini\antigravity\scratch\mia\src\data\spanishGymMachines.ts'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

text = re.sub(
    r"(id:\s*'technogym_pure_lateral_raise'(?:(?!id:).)*?image_url:\s*')[^']+'",
    r"\1/machines/technogym_pure_lateral_raise.jpg'",
    text,
    flags=re.DOTALL
)

text = re.sub(
    r"(id:\s*'matrix_ultra_lateral_raise'(?:(?!id:).)*?image_url:\s*')[^']+'",
    r"\1/machines/matrix_ultra_lateral_raise.jpg'",
    text,
    flags=re.DOTALL
)

with open(path, 'w', encoding='utf-8') as f:
    f.write(text)

print('Updated lateral raise image URLs in spanishGymMachines.ts!')
