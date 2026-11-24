import math
from PIL import Image, ImageDraw, ImageFont

def create_icon(size):
    img = Image.new('RGBA', (size, size), (11, 14, 23, 255))
    draw = ImageDraw.Draw(img)

    # Gradient-like background circles
    for r in range(size // 2, 0, -8):
        alpha = int(40 * (1 - r / (size // 2)))
        draw.ellipse([size//2 - r, size//2 - r, size//2 + r, size//2 + r], fill=(37, 99, 235, alpha))

    # Outer rounded border subtle
    margin = size * 0.08
    # Draw Triangle Delta (Δ)
    # Points for Delta
    top = (size * 0.5, size * 0.22)
    right = (size * 0.82, size * 0.78)
    left = (size * 0.18, size * 0.78)

    stroke = int(size * 0.065)

    # Glow effect
    glow_stroke = int(stroke * 1.6)
    draw.polygon([top, right, left], outline=(56, 189, 248, 60), width=glow_stroke)

    # Sharp Delta triangle
    draw.polygon([top, right, left], outline=(56, 189, 248, 255), width=stroke)

    # Inner modern accent line or bar
    bar_y = size * 0.62
    bar_x1 = size * 0.32
    bar_x2 = size * 0.68
    draw.line([(bar_x1, bar_y), (bar_x2, bar_y)], fill=(96, 165, 250, 255), width=int(stroke * 0.8))

    return img

icon_512 = create_icon(512)
icon_512.save(r'C:\Users\Pablo\.gemini\antigravity\scratch\mia\public\icon-512.png')
icon_512.save(r'C:\Users\Pablo\.gemini\antigravity\scratch\mia\public\apple-touch-icon.png')

icon_192 = create_icon(192)
icon_192.save(r'C:\Users\Pablo\.gemini\antigravity\scratch\mia\public\icon-192.png')

icon_64 = create_icon(64)
icon_64.save(r'C:\Users\Pablo\.gemini\antigravity\scratch\mia\public\favicon.png')

print("Generated all app icons successfully!")
