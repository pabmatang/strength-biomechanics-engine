import os
from PIL import Image

folder = r'C:\Users\Pablo\.gemini\antigravity\scratch\mia\public\machines'
files = [f for f in os.listdir(folder) if f.endswith(('.jpg', '.png', '.jpeg'))]
print(f"Processing {len(files)} machine images...")

count = 0
for fname in files:
    # Skip cardio or already handled if needed
    p = os.path.join(folder, fname)
    try:
        im = Image.open(p).convert('RGBA')
        w, h = im.size
        # Sample corners to determine background color
        corners = [
            im.getpixel((2, 2)),
            im.getpixel((w - 3, 2)),
            im.getpixel((2, h - 3)),
            im.getpixel((w - 3, h - 3))
        ]
        
        # Check if corners are light/white
        is_light_bg = False
        for c in corners:
            r, g, b, a = c
            if r > 220 and g > 220 and b > 220:
                is_light_bg = True
                break
                
        if is_light_bg:
            datas = im.getdata()
            new_data = []
            made_transp = 0
            for item in datas:
                r, g, b, a = item
                # Check if near white/light grey with low color saturation
                if r > 225 and g > 225 and b > 225 and max(abs(r-g), abs(r-b), abs(g-b)) < 15:
                    new_data.append((255, 255, 255, 0))
                    made_transp += 1
                else:
                    new_data.append(item)
                    
            if made_transp > 1000:
                im.putdata(new_data)
                # Save as PNG
                base_name = os.path.splitext(fname)[0]
                out_png = os.path.join(folder, f"{base_name}.png")
                im.save(out_png, 'PNG')
                count += 1
                print(f"Processed transparency for: {base_name}.png ({made_transp} px)")
    except Exception as e:
        print(f"Error on {fname}: {e}")

print(f"Successfully converted {count} machine images to transparent PNG!")
