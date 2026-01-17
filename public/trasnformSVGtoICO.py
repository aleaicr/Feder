import os
import subprocess
import time
from PIL import Image

def convert_svg_to_ico(input_path, output_path):
    """
    Converts SVG to a Windows ICO file using Microsoft Edge as a renderer.
    This bypasses the need for Cairo/DLLs on Windows.
    """
    temp_html = "temp_icon.html"
    temp_png = "temp_icon.png"
    
    try:
        if not os.path.exists(input_path):
            print(f"Error: File {input_path} not found.")
            return

        print(f"Reading SVG: {input_path}")
        with open(input_path, 'r', encoding='utf-8') as f:
            svg_content = f.read()

        # Create a temporary HTML to render the SVG full-screen
        # We use a white background if transparent fails, but let's try for transparent
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ margin: 0; padding: 0; overflow: hidden; background: transparent; display: flex; justify-content: center; align-items: center; height: 100vh; width: 100vw; }}
                svg {{ width: 90%; height: 90%; }}
            </style>
        </head>
        <body>
            {svg_content}
        </body>
        </html>
        """
        
        with open(temp_html, 'w', encoding='utf-8') as f:
            f.write(html_content)

        # Path to Edge (Standard on Windows)
        edge_path = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
        if not os.path.exists(edge_path):
            # Fallback for some systems
            edge_path = "msedge" 

        print("Rendering SVG via Edge (headless)...")
        # Command to take a screenshot of the HTML
        # We use a large enough size for high quality
        subprocess.run([
            edge_path,
            "--headless",
            "--disable-gpu",
            f"--screenshot={os.path.abspath(temp_png)}",
            "--window-size=1024,1024",
            "--default-background-color=00000000",
            f"file:///{os.path.abspath(temp_html)}"
        ], check=True, capture_output=True)

        if not os.path.exists(temp_png):
            print("Error: Failed to generate temporary PNG.")
            return

        # Open with Pillow
        img = Image.open(temp_png)
        
        # Ensure it's RGBA
        img = img.convert("RGBA")
        
        # Crop to the actual icon content (optional, but Edge might take a full page)
        # However, since we centered it and it's 1024x1024, it should be fine.
        
        # Standard sizes for Windows ICO
        icon_sizes = [(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)]
        
        print(f"Saving ICO: {output_path}")
        img.save(output_path, format='ICO', sizes=icon_sizes)
        print(f"Success! Icon generated at: {output_path}")

    except Exception as e:
        print(f"An unexpected error occurred: {e}")
    finally:
        # Cleanup
        if os.path.exists(temp_html):
            os.remove(temp_html)
        if os.path.exists(temp_png):
            os.remove(temp_png)

if __name__ == "__main__":
    SOURCE_SVG = "feder.svg" 
    TARGET_ICO = "feder.ico"
    
    convert_svg_to_ico(SOURCE_SVG, TARGET_ICO)