import re

path = r'C:\Users\Pablo\.gemini\antigravity\scratch\mia\src\data\spanishGymMachines.ts'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

brands = set(re.findall(r"brand:\s*'([^']+)'", text))
print('Brands in spanishGymMachines.ts:', sorted(list(brands)))

# Check all exercises with their brand and title
pattern = re.compile(r"title:\s*'([^']+)'(?:(?!id:).)*?brand:\s*'([^']+)'", re.DOTALL)
matches = pattern.findall(text)
for title, brand in matches:
    if 'hammer' in title.lower() and brand != 'Hammer Strength':
        print(f"MISMATCH HAMMER: title='{title}' but brand='{brand}'")
    if 'technogym' in title.lower() and brand != 'Technogym':
        print(f"MISMATCH TECHNOGYM: title='{title}' but brand='{brand}'")
