#!/usr/bin/env python3
"""Make web versions of the videos in assets/video/Original.

For every video in Original (MP4, MOV, M4V, WebM), writes to assets/video/Web:

    <name>-1080.mp4   up to 1920x1080, for desktops
    <name>-720.mp4    up to 1280x720, for phones
    <name>-poster.jpg a still frame, shown while the video loads

The videos are H.264 MP4s without sound, set up to start playing before
they've fully downloaded. Nothing is ever enlarged, and only the first
60 seconds are used (it's a background loop).

Web/.sources.json remembers which originals have been processed (by content
hash), so each video is only processed once; a changed original with the same
name is processed again.

GitHub runs this automatically when videos are added to Original
(.github/workflows/web-videos.yml). To run it by hand you need ffmpeg:
    python3 scripts/make_web_videos.py
"""
import hashlib
import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ORIGINAL = ROOT / "assets/video/Original"
WEB = ROOT / "assets/video/Web"
MANIFEST = WEB / ".sources.json"
EXTENSIONS = {".mp4", ".mov", ".m4v", ".webm"}
MAX_SECONDS = 60
VERSIONS = [  # (suffix, max width, max height, quality (lower = better), max bitrate)
    ("1080", 1920, 1080, 21, "8M"),
    ("720", 1280, 720, 24, "3.5M"),
]
# Frames to drop from the end of a video's web versions (the original is left
# as it is), e.g. a stray cut left at the end of an export. Remove the entry
# once a fixed version is uploaded.
TRIM_END_FRAMES = {
    "2N2T Homepage Loop v4 9x16.mp4": 2,
}
# Tall (portrait, e.g. 9:16) videos, for phones: the same sizes turned on their side.
PORTRAIT_VERSIONS = [
    ("1080", 1080, 1920, 22, "6M"),
    ("720", 720, 1280, 24, "2.5M"),
]


def web_name(path):
    """'My Reel (Final).MOV' -> 'my-reel-final' (main.js uses the same rule)."""
    stem = re.sub(r"[^a-z0-9]+", "-", path.stem.lower()).strip("-")
    return stem or "video"


def run(args):
    subprocess.run(args, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)


def duration(src):
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                          "-of", "default=nw=1:nk=1", str(src)], capture_output=True, text=True)
    try:
        return float(out.stdout.strip())
    except ValueError:
        return 0.0


def is_portrait(src):
    out = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries",
                          "stream=width,height:stream_side_data=rotation", "-of", "json", str(src)],
                         capture_output=True, text=True)
    try:
        st = json.loads(out.stdout)["streams"][0]
        w, h = st["width"], st["height"]
        rot = abs(int(next((d.get("rotation", 0) for d in st.get("side_data_list", [])), 0)))
        if rot in (90, 270):
            w, h = h, w
        return h > w
    except (ValueError, KeyError, IndexError):
        return False


def fit(w, h):
    # Shrink to fit (never enlarge), keep even dimensions for H.264.
    return (f"scale='min({w},iw)':'min({h},ih)':force_original_aspect_ratio=decrease,"
            "scale=trunc(iw/2)*2:trunc(ih/2)*2,format=yuv420p")


def frame_count(src):
    out = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-count_packets",
                          "-show_entries", "stream=nb_read_packets", "-of", "csv=p=0", str(src)],
                         capture_output=True, text=True)
    try:
        return int(out.stdout.strip())
    except ValueError:
        return 0


def process(src, name, portrait=False, trim=0):
    keep = ["-frames:v", str(frame_count(src) - trim)] if trim else []
    for suffix, w, h, crf, maxrate in (PORTRAIT_VERSIONS if portrait else VERSIONS):
        run(["ffmpeg", "-y", "-v", "error", "-i", str(src), "-t", str(MAX_SECONDS), *keep, "-an",
             "-vf", fit(w, h), "-c:v", "libx264", "-preset", "slow", "-crf", str(crf),
             "-maxrate", maxrate, "-bufsize", "16M", "-profile:v", "high", "-level", "4.1",
             "-movflags", "+faststart", str(WEB / f"{name}-{suffix}.mp4")])
    at = min(1.0, max(duration(src) / 3, 0))
    run(["ffmpeg", "-y", "-v", "error", "-ss", f"{at:.2f}", "-i", str(src), "-frames:v", "1",
         "-vf", fit(1080, 1920) if portrait else fit(1920, 1080), "-q:v", "3", str(WEB / f"{name}-poster.jpg")])


def main():
    WEB.mkdir(parents=True, exist_ok=True)
    manifest = json.loads(MANIFEST.read_text()) if MANIFEST.exists() else {}
    done = 0
    for src in sorted(ORIGINAL.iterdir()):
        if src.suffix.lower() not in EXTENSIONS or not src.is_file():
            continue
        h = hashlib.sha1()
        with src.open("rb") as f:
            for chunk in iter(lambda: f.read(1 << 20), b""):
                h.update(chunk)
        digest = h.hexdigest()
        entry = manifest.get(src.name)
        portrait = is_portrait(src)
        # (Tall videos made before portrait sizes existed are made again.)
        trim = TRIM_END_FRAMES.get(src.name, 0)
        if (entry and entry.get("sha1") == digest and (not portrait or entry.get("portrait"))
                and entry.get("trimEnd", 0) == trim):
            continue
        name = web_name(src)
        try:
            process(src, name, portrait, trim)
        except subprocess.CalledProcessError as err:
            print(f"Couldn't process {src.name}: {err.stderr.decode(errors='replace')[-500:]}")
            continue
        manifest[src.name] = {"sha1": digest, "web": name}
        if portrait:
            manifest[src.name]["portrait"] = True
        if trim:
            manifest[src.name]["trimEnd"] = trim
        sizes = ", ".join(f"{p.name} {p.stat().st_size / 1e6:.1f} MB" for p in sorted(WEB.glob(f"{name}-*")))
        print(f"{src.name} -> {sizes}")
        done += 1
    MANIFEST.write_text(json.dumps(manifest, indent=2, sort_keys=True) + "\n")
    print(f"{done} video(s) processed.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
