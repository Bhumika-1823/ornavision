import os
import shutil
from rembg import remove, new_session
from PIL import Image
import numpy as np

# Copy originals back to fix the chains
desktop_imgs = [
    (r"C:\Users\User\OneDrive\Desktop\images\image 5.jpeg", "image_5"),
    (r"C:\Users\User\OneDrive\Desktop\images\image 6.jpeg", "image_6"),
    (r"C:\Users\User\OneDrive\Desktop\images\in10.jpeg", "in10"),
    (r"C:\Users\User\OneDrive\Desktop\images\in3.jpeg", "in3")
]

base_dir = r"e:\new 1\public\images"
for src, name in desktop_imgs:
    for folder in ['products', 'tryon']:
        dst = os.path.join(base_dir, folder, f"{name}.jpeg")
        shutil.copy(src, dst)

session = new_session("isnet-general-use")

def process_image(input_path, output_path):
    print(f"Processing {input_path}")
    try:
        input_img = Image.open(input_path)
        # Check if it already has transparency
        if input_img.mode in ('RGBA', 'LA') or (input_img.mode == 'P' and 'transparency' in input_img.info):
            alpha = input_img.convert('RGBA').split()[-1]
            if np.min(np.array(alpha)) < 255:
                print(f"Skipping {input_path}, already has transparency.")
                return

        output_img = remove(input_img, session=session, post_process_mask=True)
        output_img.save(output_path)
        print(f"Saved {output_path}")
        if input_path != output_path:
            os.remove(input_path)
    except Exception as e:
        print(f"Error processing {input_path}: {e}")

# Process all images in products and tryon
for folder in ['products', 'tryon']:
    folder_path = os.path.join(base_dir, folder)
    for f in os.listdir(folder_path):
        if f.lower().endswith(('.jpg', '.jpeg', '.webp', '.png')):
            # Don't process svgs
            in_path = os.path.join(folder_path, f)
            out_path = os.path.join(folder_path, os.path.splitext(f)[0] + '.png')
            process_image(in_path, out_path)
