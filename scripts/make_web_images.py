#!/usr/bin/env python3
"""Make web-sized copies of the photos in assets/img/photos/Original.

For every image in Original (JPG, PNG, WebP, TIFF, HEIC), writes two files to
assets/img/photos/Web:

    <name>.jpg     long edge 2000px  (use this as the photo)
    <name>-sm.jpg  800px wide        (use this as the "Smaller version")

Photos are turned the right way up, converted to sRGB and saved as compressed
JPEGs without camera metadata (e.g. GPS location). Nothing is ever enlarged.

Web/.sources.json remembers which originals have been processed (by content
hash), so each photo is only processed once, and a changed original with the
same name is processed again. Deleting an original leaves its web copies alone
(the site may be using them).

GitHub runs this automatically when photos are added to Original
(.github/workflows/web-images.yml). To run it by hand:
    pip install pillow pillow-heif
    python3 scripts/make_web_images.py
"""
import hashlib
import io
import json
import re
import sys
from pathlib import Path

from PIL import Image, ImageCms, ImageOps

try:  # iPhone HEIC photos
    from pillow_heif import register_heif_opener
    register_heif_opener()
except ImportError:
    pass

ROOT = Path(__file__).resolve().parent.parent
ORIGINAL = ROOT / "assets/img/photos/Original"
WEB = ROOT / "assets/img/photos/Web"
MANIFEST = WEB / ".sources.json"
EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".tif", ".tiff", ".heic", ".heif"}
LONG_EDGE = 2000
SMALL_WIDTH = 800


def web_name(path):
    """'My Photo (1).JPG' -> 'my-photo-1'"""
    stem = re.sub(r"[^a-z0-9]+", "-", path.stem.lower()).strip("-")
    return stem or "photo"


def to_srgb(img):
    icc = img.info.get("icc_profile")
    if icc:
        try:
            src = ImageCms.ImageCmsProfile(io.BytesIO(icc))
            dst = ImageCms.createProfile("sRGB")
            img = ImageCms.profileToProfile(img, src, dst, outputMode="RGB")
        except Exception:
            pass
    if img.mode in ("RGBA", "LA", "P"):
        img = img.convert("RGBA")
        flat = Image.new("RGB", img.size, (14, 14, 16))  # site background colour
        flat.paste(img, mask=img.split()[-1])
        img = flat
    return img.convert("RGB")


def save(img, path, quality):
    img.save(path, "JPEG", quality=quality, optimize=True, progressive=True)


def process(src, name):
    with Image.open(src) as im:
        im = ImageOps.exif_transpose(im)
        im = to_srgb(im)
        big = im.copy()
        big.thumbnail((LONG_EDGE, LONG_EDGE), Image.LANCZOS)
        save(big, WEB / f"{name}.jpg", 82)
        small = im.copy()
        if small.width > SMALL_WIDTH:
            small = small.resize((SMALL_WIDTH, round(small.height * SMALL_WIDTH / small.width)), Image.LANCZOS)
        save(small, WEB / f"{name}-sm.jpg", 75)
        return big.size


def main():
    WEB.mkdir(parents=True, exist_ok=True)
    manifest = json.loads(MANIFEST.read_text()) if MANIFEST.exists() else {}
    done = 0
    for src in sorted(ORIGINAL.iterdir()):
        if src.suffix.lower() not in EXTENSIONS or not src.is_file():
            continue
        digest = hashlib.sha1(src.read_bytes()).hexdigest()
        entry = manifest.get(src.name)
        if entry and entry.get("sha1") == digest:
            continue
        name = (entry or {}).get("web") or web_name(src)
        # Don't overwrite web copies that belong to a different original.
        taken = {e.get("web") for k, e in manifest.items() if k != src.name}
        base, n = name, 2
        while name in taken:
            name, n = f"{base}-{n}", n + 1
        try:
            size = process(src, name)
        except Exception as err:
            print(f"Couldn't process {src.name}: {err}")
            continue
        manifest[src.name] = {"sha1": digest, "web": name}
        print(f"{src.name} -> Web/{name}.jpg ({size[0]}x{size[1]}) + Web/{name}-sm.jpg")
        done += 1
    MANIFEST.write_text(json.dumps(manifest, indent=2, sort_keys=True) + "\n")
    print(f"{done} photo(s) processed.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
