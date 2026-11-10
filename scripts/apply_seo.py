#!/usr/bin/env python3
"""Write the SEO text from the CMS into the page files.

Reads data/seo.json (main pages) and data/photos.json (gallery pages) and
updates each page's <title>, meta description and the matching Open Graph /
Twitter tags. GitHub runs this automatically when the site is published
(.github/workflows/pages.yml), so search engines and link previews (WhatsApp,
Facebook, LinkedIn) see the text without running any JavaScript.

Run it by hand from the site folder with:  python3 scripts/apply_seo.py
"""
import html
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PAGES = {
    "home": "index.html",
    "film": "film/index.html",
    "photography": "photography/index.html",
    "music": "music/index.html",
    "about": "about/index.html",
    "contact": "contact/index.html",
}


def load(name):
    path = ROOT / "data" / name
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, ValueError) as err:
        print(f"Skipping {name}: {err}")
        return {}


def apply(page_file, title, description):
    path = ROOT / page_file
    if not path.exists():
        print(f"Missing page, skipped: {page_file}")
        return False
    text = path.read_text(encoding="utf-8")
    original = text
    attr = lambda v: html.escape(v.strip(), quote=True)

    def set_meta(text, key, name, value):
        pattern = re.compile(r'(<meta %s="%s" content=")[^"]*(")' % (key, re.escape(name)))
        return pattern.sub(lambda m: m.group(1) + attr(value) + m.group(2), text, count=1)

    if title and title.strip():
        text = re.sub(r"<title>.*?</title>", lambda m: "<title>" + html.escape(title.strip(), quote=False) + "</title>", text, count=1, flags=re.S)
        text = set_meta(text, "property", "og:title", title)
        text = set_meta(text, "name", "twitter:title", title)
    if description and description.strip():
        text = set_meta(text, "name", "description", description)
        text = set_meta(text, "property", "og:description", description)
        text = set_meta(text, "name", "twitter:description", description)

    if text != original:
        path.write_text(text, encoding="utf-8")
        print(f"Updated {page_file}")
        return True
    return False


def main():
    changed = 0
    seo = load("seo.json")
    for key, page_file in PAGES.items():
        entry = seo.get(key) or {}
        changed += apply(page_file, entry.get("title"), entry.get("description"))
    for cat in (load("photos.json").get("categories") or []):
        slug = (cat.get("slug") or "").strip()
        if slug and re.fullmatch(r"[a-z0-9-]+", slug):
            changed += apply(f"photography/{slug}/index.html", cat.get("metaTitle"), cat.get("metaDescription"))
    print(f"{changed} page(s) updated.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
