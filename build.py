#!/usr/bin/env python3
"""
La Ville build step — inline assets/css/styles.css and assets/js/main.js into
every page so each HTML file is fully self-contained (deploys anywhere, works
when opened directly). Edit the files in assets/ as the source of truth, then
run:  python build.py

Idempotent: re-running updates the inlined blocks in place.
"""
import re
import pathlib

ROOT = pathlib.Path(__file__).parent
CSS = (ROOT / "assets" / "css" / "styles.css").read_text(encoding="utf-8")
JS = (ROOT / "assets" / "js" / "main.js").read_text(encoding="utf-8")

PAGES = [
    "index.html", "rooms.html", "restaurant.html", "chez-bar.html",
    "food-dude.html", "alderney.html", "contact.html",
]

style_block = '<style data-inline="css">\n' + CSS + "\n</style>"
script_block = '<script data-inline="js">\n' + JS + "\n</script>"

css_link_re = re.compile(r'<link rel="stylesheet" href="assets/css/styles\.css"[^>]*>')
css_inline_re = re.compile(r'<style data-inline="css">.*?</style>', re.S)
js_src_re = re.compile(r'<script src="assets/js/main\.js"[^>]*></script>')
js_inline_re = re.compile(r'<script data-inline="js">.*?</script>', re.S)

for name in PAGES:
    path = ROOT / name
    html = path.read_text(encoding="utf-8")

    if css_inline_re.search(html):
        html = css_inline_re.sub(lambda m: style_block, html, count=1)
    elif css_link_re.search(html):
        html = css_link_re.sub(lambda m: style_block, html, count=1)
    else:
        print(f"  ! {name}: no CSS link/inline found")

    if js_inline_re.search(html):
        html = js_inline_re.sub(lambda m: script_block, html, count=1)
    elif js_src_re.search(html):
        html = js_src_re.sub(lambda m: script_block, html, count=1)
    else:
        print(f"  ! {name}: no JS script/inline found")

    path.write_text(html, encoding="utf-8")
    print(f"  inlined -> {name}")

print("Done. All pages are self-contained.")
