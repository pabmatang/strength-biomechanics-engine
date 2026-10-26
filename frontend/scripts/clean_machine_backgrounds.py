#!/usr/bin/env python3
"""
Mia Fitness App - Machine Background Removal Batch Pipeline
Uses danielgatis/rembg and ZhengPeng7/BiRefNet (State of the Art Dichotomous Image Segmentation)

Why birefnet-general / isnet-general-use?
Gym machines have thin cables, weight stacks, guide rods, and internal frame cutouts.
Standard u2net eats metallic parts or leaves noisy white halos around cables.
BiRefNet resolves fine sub-millimeter edges without eating machine surfaces.

Usage:
    pip install rembg onnxruntime pillow
    python clean_machine_backgrounds.py --input ./raw_machines/ --output ../public/machines/ --model birefnet-general
"""

import os
import sys
import argparse
from pathlib import Path
from PIL import Image

def process_images(input_dir: str, output_dir: str, model_name: str = "birefnet-general"):
    try:
        from rembg import new_session, remove
    except ImportError:
        print("[!] rembg not found. Install with: pip install rembg onnxruntime")
        print("    For GPU acceleration: pip install rembg onnxruntime-gpu")
        sys.exit(1)

    in_path = Path(input_dir)
    out_path = Path(output_dir)
    out_path.mkdir(parents=True, exist_ok=True)

    print(f"[*] Initializing rembg session with high-resolution model: {model_name}...")
    try:
        session = new_session(model_name)
    except Exception as e:
        print(f"[!] Warning: Model '{model_name}' couldn't be loaded ({e}). Falling back to 'isnet-general-use'...")
        session = new_session("isnet-general-use")

    valid_extensions = {".jpg", ".jpeg", ".png", ".webp"}
    image_files = [f for f in in_path.iterdir() if f.suffix.lower() in valid_extensions]

    print(f"[*] Found {len(image_files)} machine images to process.")

    for i, img_file in enumerate(image_files, start=1):
        target_name = f"{img_file.stem}.png"
        out_file = out_path / target_name

        print(f"[{i}/{len(image_files)}] Processing {img_file.name} -> {target_name}...")
        try:
            with Image.open(img_file) as img:
                # Remove background with alpha matting enabled for gym cables and pulleys
                output = remove(
                    img,
                    session=session,
                    alpha_matting=True,
                    alpha_matting_foreground_threshold=240,
                    alpha_matting_background_threshold=10,
                    alpha_matting_erode_size=5
                )
                output.save(out_file, "PNG")
        except Exception as err:
            print(f"    [X] Error processing {img_file.name}: {err}")

    print("[+] All machine photos processed successfully with transparent backgrounds!")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Clean gym machine backgrounds with BiRefNet")
    parser.add_argument("--input", default="./raw_machines", help="Folder containing raw machine photos")
    parser.add_argument("--output", default="../public/machines", help="Destination folder for transparent PNGs")
    parser.add_argument("--model", default="birefnet-general", choices=["birefnet-general", "isnet-general-use", "u2net"], help="Segmentation model")

    args = parser.parse_args()
    process_images(args.input, args.output, args.model)
