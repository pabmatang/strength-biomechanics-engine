import os

folder = r'C:\Users\Pablo\.gemini\antigravity\scratch\mia\public\machines'
ts_file = r'C:\Users\Pablo\.gemini\antigravity\scratch\mia\src\utils\machineImages.ts'

with open(ts_file, 'r', encoding='utf-8') as f:
    text = f.read()

# For any .jpg or .jpeg in text, if the .png exists in folder, replace with .png
for fname in os.listdir(folder):
    if fname.endswith('.png'):
        base = os.path.splitext(fname)[0]
        text = text.replace(f"'/machines/{base}.jpg'", f"'/machines/{base}.png'")
        text = text.replace(f"'/machines/{base}.jpeg'", f"'/machines/{base}.png'")
        text = text.replace(f'"/machines/{base}.jpg"', f'"/machines/{base}.png"')
        text = text.replace(f'"/machines/{base}.jpeg"', f'"/machines/{base}.png"')

with open(ts_file, 'w', encoding='utf-8') as f:
    f.write(text)

# Also update in spanishGymMachines.ts
machines_file = r'C:\Users\Pablo\.gemini\antigravity\scratch\mia\src\data\spanishGymMachines.ts'
with open(machines_file, 'r', encoding='utf-8') as f:
    m_text = f.read()

for fname in os.listdir(folder):
    if fname.endswith('.png'):
        base = os.path.splitext(fname)[0]
        m_text = m_text.replace(f"'/machines/{base}.jpg'", f"'/machines/{base}.png'")
        m_text = m_text.replace(f"'/machines/{base}.jpeg'", f"'/machines/{base}.png'")
        m_text = m_text.replace(f'"/machines/{base}.jpg"', f'"/machines/{base}.png"')
        m_text = m_text.replace(f'"/machines/{base}.jpeg"', f'"/machines/{base}.png"')

with open(machines_file, 'w', encoding='utf-8') as f:
    f.write(m_text)

print("Updated machine image references to transparent PNGs!")
