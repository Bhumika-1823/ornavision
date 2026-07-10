import os
from rembg import remove
from PIL import Image

def process_image(input_path, output_path):
    print(f"Processing {input_path}")
    try:
        input_img = Image.open(input_path)
        output_img = remove(input_img)
        output_img.save(output_path)
        print(f"Saved {output_path}")
        # Remove original jpeg to keep directory clean
        os.remove(input_path)
    except Exception as e:
        print(f"Error processing {input_path}: {e}")

images = ['image_5', 'image_6', 'in10', 'in3']
base_dir = r"e:\new 1\public\images"

for img_name in images:
    for folder in ['products', 'tryon']:
        in_path = os.path.join(base_dir, folder, f"{img_name}.jpeg")
        out_path = os.path.join(base_dir, folder, f"{img_name}.png")
        if os.path.exists(in_path):
            process_image(in_path, out_path)
