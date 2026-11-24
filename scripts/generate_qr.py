import sys
import io
import qrcode
import json
import urllib.request

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# Get hostUri from metro bundler
url = "exp://192.168.1.15:8081"
try:
    with urllib.request.urlopen("http://localhost:8081/", timeout=3) as resp:
        data = json.loads(resp.read().decode('utf-8'))
        host_uri = data.get('extra', {}).get('expoClient', {}).get('hostUri')
        if host_uri:
            url = f"exp://{host_uri}"
except Exception as e:
    pass

print(f"Target Expo URL: {url}")

qr = qrcode.QRCode(border=1)
qr.add_data(url)
qr.make(fit=True)

# Save PNG
img = qr.make_image(fill_color="black", back_color="white")
img.save(r"C:\Users\Pablo\.gemini\antigravity\scratch\mia\public\expo-qr.png")
img.save(r"C:\Users\Pablo\.gemini\antigravity\scratch\mia-mobile\assets\expo-qr.png")
print("Saved QR image to public/expo-qr.png")

# Print text representation
matrix = qr.get_matrix()
for row in matrix:
    line = "".join("██" if cell else "  " for cell in row)
    print(line)
