import os
import shutil
from rembg import remove, new_session
from PIL import Image

session = new_session("isnet-general-use")

# Map of source desktop file to destination product filename
files_to_process = {
    r"C:\Users\User\OneDrive\Desktop\images\in14.jpeg": r"e:\new 1\public\images\products\watch_1.png",
    r"C:\Users\User\OneDrive\Desktop\images\in16.jpeg": r"e:\new 1\public\images\products\watch_2.png",
    r"C:\Users\User\OneDrive\Desktop\images\in17.jpeg": r"e:\new 1\public\images\products\watch_3.png",
    r"C:\Users\User\OneDrive\Desktop\images\in18.jpeg": r"e:\new 1\public\images\products\watch_4.png",
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
