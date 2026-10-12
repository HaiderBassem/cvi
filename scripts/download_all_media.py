import os
import json
import urllib.request
import urllib.parse
from concurrent.futures import ThreadPoolExecutor

os.makedirs("public/uploads", exist_ok=True)
os.makedirs("public/brand", exist_ok=True)

with open("discovered_projects.json") as f:
    data = json.load(f)

projects = data.get("data", [])
print(f"Total projects: {len(projects)}")

image_urls = set()
for p in projects:
    if p.get("logoSrc"):
        image_urls.add(p["logoSrc"])
    for img in p.get("images", []):
        if img.get("url"):
            image_urls.add(img["url"])

brand_images = [
    "/who are we.jpg",
    "/map.png",
    "/Creative Innovation2.jpg",
    "/Client-Focused Process.jpg",
    "/Sustainable Design.jpg",
    "/Excellence in Detail.jpg",
    "/Architectural Design.png",
    "/Interior Design.jpg",
    "/Exterior Design.png",
    "/3D Visualization BIM.jpg",
    "/renovating and remodeling.png",
    "/Structural Design.jpg",
    "/Sustainable Design.png",
    "/BIM Drawing.jpg"
]

print(f"Total unique project images to download: {len(image_urls)}")
print(f"Total brand images to download: {len(brand_images)}")

def download_file(item):
    url_path, target_dir = item
    clean_name = os.path.basename(url_path)
    target_path = os.path.join(target_dir, clean_name)
    
    if os.path.exists(target_path) and os.path.getsize(target_path) > 0:
        return f"Exists: {clean_name}"
    
    encoded_url = "https://cvi-arch.com" + urllib.parse.quote(url_path)
    try:
        req = urllib.request.Request(encoded_url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=30) as resp:
            content = resp.read()
            with open(target_path, "wb") as f_out:
                f_out.write(content)
        return f"OK: {clean_name} ({len(content)} B)"
    except Exception as e:
        return f"FAIL: {clean_name} ({e})"

tasks = []
for u in image_urls:
    tasks.append((u, "public/uploads"))
for b in brand_images:
    tasks.append((b, "public/brand"))

with ThreadPoolExecutor(max_workers=8) as executor:
    results = list(executor.map(download_file, tasks))

ok_count = sum(1 for r in results if r.startswith("OK") or r.startswith("Exists"))
print(f"Finished downloads! Successfully obtained {ok_count} / {len(tasks)} assets.")
