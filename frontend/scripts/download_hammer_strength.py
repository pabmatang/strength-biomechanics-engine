import os
import urllib.request
import urllib.parse
from PIL import Image
import io

OUTPUT_DIR = r"C:\Users\Pablo\.gemini\antigravity\scratch\mia\public\machines"
os.makedirs(OUTPUT_DIR, exist_ok=True)

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Referer': 'https://www.lifefitness.com/'
}

MACHINES = [
    {
        "id": "hammer_select_ab_crunch",
        "name": "Hammer Strength Select Abdominal Crunch",
        "url": "https://www.lifefitness.com/Kentico13CoreBase/media/LFMedia/LifeFitnessImages/MediaSync/165-025-hammer-strength-select-abdominal-crunch-image-1--data.jpg",
        "ext": ".jpg"
    },
    {
        "id": "hammer_plate_loaded_belt_squat",
        "name": "Hammer Strength Plate-Loaded Belt Squat",
        "url": "https://www.lifefitness.com/Kentico13CoreBase/media/LFMedia/LifeFitnessImages/Equipment/Strength/Plate-Loaded/Belt%20Squat/Strength-PlateLoaded-BeltSquat-7.png",
        "ext": ".png"
    },
    {
        "id": "hammer_plate_loaded_pendulum_squat",
        "name": "Hammer Strength Plate-Loaded Pendulum Squat",
        "url": "https://www.lifefitness.com/Kentico13CoreBase/media/LFMedia/LifeFitnessImages/Equipment/Strength/Plate-Loaded/Pendulum-X%20Squat/Strength-PlateLoaded-PendulumXSquat-Thumbnail-1.png",
        "ext": ".png"
    },
    {
        "id": "hammer_plate_loaded_seated_row",
        "name": "Hammer Strength Plate-Loaded Iso-Lateral Seated Row",
        "url": "https://www.lifefitness.com/Kentico13CoreBase/media/LFMedia/LifeFitnessImages/Equipment/Strength/Plate-Loaded/Iso-Lateral%20Row/Strength-PlateLoaded-IsoLateral-Row-Thumbnail-1.png",
        "ext": ".png"
    },
    {
        "id": "hammer_iso_wide_pulldown",
        "name": "Hammer Strength Plate-Loaded Iso-Lateral Wide Pulldown",
        "url": "https://www.lifefitness.com/Kentico13CoreBase/media/LFMedia/LifeFitnessImages/Equipment/Strength/Plate-Loaded/Iso-Lateral%20Wide%20Pulldown/Strength-PlateLoaded-IsoLateralWidePulldown-Render-2.png",
        "ext": ".png"
    },
    {
        "id": "hammer_iso_high_row",
        "name": "Hammer Strength Plate-Loaded Iso-Lateral High Row",
        "url": "https://www.lifefitness.com/Kentico13CoreBase/media/LFMedia/LifeFitnessImages/Equipment/Strength/Plate-Loaded/High%20Row/Strength-PlateLoaded-IsoLateral-HighRow-7.png",
        "ext": ".png"
    },
    {
        "id": "hammer_tibia_dorsi_flexion",
        "name": "Hammer Strength Ground Base Tibia Dorsi Flexion",
        "url": "https://www.lifefitness.com/Kentico13CoreBase/media/LFMedia/LifeFitnessImages/Equipment/Strength/Plate-Loaded/Tibia%20Dorsi%20Flexion/Strength-PlateLoaded-TibiaDorsiFlexion-8.png",
        "ext": ".png"
    },
    {
        "id": "hammer_iso_lateral_raise",
        "name": "Hammer Strength Plate-Loaded Iso-Lateral Lateral Raise",
        "url": "https://www.lifefitness.com/Kentico13CoreBase/media/LFMedia/LifeFitnessImages/Equipment/Strength/Plate-Loaded/Lateral%20Raise/Strength-PlateLoaded-LateralRaise-Thumbnail-1.png",
        "ext": ".png"
    },
    {
        "id": "hammer_iso_shoulder_press",
        "name": "Hammer Strength Plate-Loaded Iso-Lateral Shoulder Press",
        "url": "https://www.lifefitness.com/Kentico13CoreBase/media/LFMedia/LifeFitnessImages/Equipment/Strength/Plate-Loaded/Iso-Lateral%20Shoulder%20Press/Strength-PlateLoaded-IsoLateralShoulderPress-Render-2.png",
        "ext": ".png"
    },
    {
        "id": "hammer_select_seated_leg_curl",
        "name": "Hammer Strength Select Seated Leg Curl",
        "url": "https://www.lifefitness.com/Kentico13CoreBase/media/LFMedia/LifeFitnessImages/MediaSync/29-496-hammer-strength-select-seated-leg-curl-image.jpg",
        "ext": ".jpg"
    },
    {
        "id": "hammer_iso_super_incline_press",
        "name": "Hammer Strength Plate-Loaded Iso-Lateral Super Incline Press",
        "url": "https://www.lifefitness.com/Kentico13CoreBase/media/LFMedia/LifeFitnessImages/Equipment/Strength/Plate-Loaded/Super%20Incline%20Press/Strength-PlateLoaded-SuperInclinePress-Thumbnail-1.png",
        "ext": ".png"
    },
    {
        "id": "hammer_select_pec_fly",
        "name": "Hammer Strength Select Pec Fly / Rear Delt",
        "url": "https://www.lifefitness.com/Kentico13CoreBase/media/LFMedia/LifeFitnessImages/MediaSync/22-855-hammer-strength-select-pectoral-fly-rear-deltoid-image.jpg",
        "ext": ".jpg"
    }
]

downloaded = []
failed = []

for item in MACHINES:
    m_id = item["id"]
    m_name = item["name"]
    url = item["url"]
    expected_ext = item["ext"]
    filename = f"{m_id}{expected_ext}"
    target_path = os.path.join(OUTPUT_DIR, filename)

    print(f"\nProcessing {m_id}...")
    print(f"  URL: {url}")

    try:
        req = urllib.request.Request(url, headers=HEADERS)
        with urllib.request.urlopen(req, timeout=20) as resp:
            status = resp.status
            ctype = resp.headers.get('content-type', '').lower()
            data = resp.read()

        # Validation 1: HTTP Status 200
        if status != 200:
            raise ValueError(f"HTTP status is {status}, expected 200")

        # Validation 2: Content-Type check
        valid_ctypes = ['image/png', 'image/jpeg', 'image/webp']
        if not any(vc in ctype for vc in valid_ctypes):
            raise ValueError(f"Invalid Content-Type: {ctype}")

        # Validation 3: File size >= 12 KB (12,288 bytes)
        size_bytes = len(data)
        size_kb = size_bytes / 1024
        if size_bytes < 12288:
            raise ValueError(f"File size {size_kb:.2f} KB is under minimum 12 KB")

        # Validation 4: Valid image verification with PIL
        try:
            im = Image.open(io.BytesIO(data))
            im.verify()
            # re-open for dimensions and format (verify closes the image)
            im = Image.open(io.BytesIO(data))
            img_format = im.format
            width, height = im.size
        except Exception as e:
            raise ValueError(f"Corrupt or invalid image file: {e}")

        # Validation 5: Verify format matches extension
        if expected_ext == ".jpg" and img_format != "JPEG":
            raise ValueError(f"Expected JPEG format for .jpg, got {img_format}")
        if expected_ext == ".png" and img_format != "PNG":
            raise ValueError(f"Expected PNG format for .png, got {img_format}")

        # Write to disk
        with open(target_path, "wb") as f:
            f.write(data)

        # Confirm file on disk
        actual_size = os.path.getsize(target_path)
        print(f"  SUCCESS: Saved {filename}")
        print(f"  Size: {actual_size/1024:.2f} KB | Resolution: {width}x{height} | Format: {img_format}")

        downloaded.append({
            "id": m_id,
            "name": m_name,
            "filename": filename,
            "path": target_path,
            "size_kb": f"{actual_size/1024:.2f} KB",
            "resolution": f"{width}x{height}",
            "format": img_format,
            "url": url
        })

    except Exception as e:
        print(f"  FAILED {m_id}: {e}")
        failed.append({
            "id": m_id,
            "name": m_name,
            "error": str(e),
            "url": url
        })

print("\n" + "="*70)
print(f"DOWNLOAD SUMMARY: {len(downloaded)} / {len(MACHINES)} downloaded successfully.")
if failed:
    print(f"FAILED / PENDING ({len(failed)}):")
    for f in failed:
        print(f"  - {f['id']}: {f['error']}")
else:
    print("ALL 12 MACHINES DOWNLOADED AND VALIDATED SUCCESSFULLY!")
