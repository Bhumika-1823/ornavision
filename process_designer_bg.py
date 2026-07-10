import os
from rembg import remove, new_session
from PIL import Image

session = new_session("isnet-general-use")
folder_path = r"e:\new 1\public\images\designer"

def process_image(input_path, output_path):
    print(f"Processing {input_path}")
    try:
        input_img = Image.open(input_path)
        output_img = remove(input_img, session=session, post_process_mask=True)
        output_img.save(output_path)
        print(f"Saved {output_path}")
        if input_path != output_path:
            os.remove(input_path)
    except Exception as e:
        print(f"Error processing {input_path}: {e}")

for f in os.listdir(folder_path):
    if f.lower().endswith(('.jpg', '.jpeg', '.webp', '.png')):
        in_path = os.path.join(folder_path, f)
        out_path = os.path.join(folder_path, os.path.splitext(f)[0] + '.png')
        process_image(in_path, out_path)
