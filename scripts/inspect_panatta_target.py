with open(r'C:\Users\Pablo\.gemini\antigravity\scratch\mia\src\data\machineCatalog.ts', 'r', encoding='utf-8') as f:
    lines = [line.strip() for line in f if 'panatta' in line.lower()]

print(lines[:20])
