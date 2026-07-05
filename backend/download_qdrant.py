import os
import urllib.request
import zipfile

ZIP_URL = "https://github.com/qdrant/qdrant/releases/download/v1.9.0/qdrant-x86_64-pc-windows-msvc.zip"
TARGET_DIR = r"C:\Users\BAVISHYA\Desktop\lost-and-found\backend\qdrant-bin"
ZIP_PATH = os.path.join(TARGET_DIR, "qdrant.zip")

def main():
    print(f"Creating directory: {TARGET_DIR}")
    os.makedirs(TARGET_DIR, exist_ok=True)
    
    print(f"Downloading Qdrant from {ZIP_URL}...")
    urllib.request.urlretrieve(ZIP_URL, ZIP_PATH)
    print("Download completed.")
    
    print("Extracting zip file...")
    with zipfile.ZipFile(ZIP_PATH, 'r') as zip_ref:
        zip_ref.extractall(TARGET_DIR)
    
    print("Clean up zip file...")
    os.remove(ZIP_PATH)
    print("Qdrant is ready in backend/qdrant-bin")

if __name__ == "__main__":
    main()
