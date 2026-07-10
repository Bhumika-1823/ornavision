import os
import shutil
from rembg import remove, new_session
from PIL import Image

session = new_session("isnet-general-use")

# Map of source desktop file to destination product filename
files_to_process = {
    r"C:\Users\User\OneDrive\Desktop\images\image 9.jpeg": r"e:\new 1\public\images\products\ring_1.png",
    r"C:\Users\User\OneDrive\Desktop\images\ChatGPT Image Jul 9, 2026, 10_20_31 PM.png": r"e:\new 1\public\images\products\ring_2.png",
    r"C:\Users\User\OneDrive\Desktop\images\in12.jpeg": r"e:\new 1\public\images\products\ring_3.png",
}

for src, dst in files_to_process.items():
    print(f"Processing {src}")
    try:
        input_img = Image.open(src)
        # Background removal
        output_img = remove(input_img, session=session, post_process_mask=True)
        # We need a copy for the tryon directory as well
        dst_tryon = dst.replace('products', 'tryon')
        
        output_img.save(dst)
        print(f"Saved product image: {dst}")
        
        output_img.save(dst_tryon)
        print(f"Saved tryon image: {dst_tryon}")
        
    except Exception as e:
        print(f"Error processing {src}: {e}")
