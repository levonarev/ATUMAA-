#!/usr/bin/env python3
"""Build the CrazyGames edition into build/crazygames and zip it.

Same game.js and style.css as atumaa.com. Only the page differs: it loads the CrazyGames SDK,
sets the portal flag, and drops everything that points outside the portal (link-preview tags,
the web manifest, the analytics script and its notice). Run from the repository root.
"""
import os, re, shutil, zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'build', 'crazygames')
ZIP = os.path.join(ROOT, 'build', 'atumaa-crazygames.zip')

html = open(os.path.join(ROOT, 'index.html'), encoding='utf-8').read()

def drop(pattern, count=None):
    global html
    html, n = re.subn(pattern, '', html, flags=re.M)
    assert n >= 1 and (count is None or n == count), (pattern, n)

drop(r'^<meta property="og:[^>]*>\n')
drop(r'^<meta name="twitter:[^>]*>\n')
drop(r'^<meta name="(apple-)?mobile-web-app[^>]*>\n')
drop(r'^<meta name="apple-mobile-web-app[^>]*>\n|^<link rel="(manifest|apple-touch-icon)"[^>]*>\n')
drop(r'^<script data-goatcounter[^>]*></script>\n?', 1)
drop(r'^\s*<p class="credit note">[^<]*</p>\n', 1)

sdk = ('<script>window.ATUMAA_PORTAL = "crazygames";</script>\n'
       '<script src="https://sdk.crazygames.com/crazygames-sdk-v3.js"></script>\n')
assert html.count('<link rel="stylesheet" href="style.css">') == 1
html = html.replace('<link rel="stylesheet" href="style.css">', sdk + '<link rel="stylesheet" href="style.css">')

# nothing in the page may point outside the bundle except the portal's own SDK
outside = [u for u in re.findall(r'(?:src|href)="(https?:)?//[^"]+"', html)]
urls = re.findall(r'(?:src|href)="((?:https?:)?//[^"]+)"', html)
assert urls == ['https://sdk.crazygames.com/crazygames-sdk-v3.js'], urls
assert not re.search(r'(?:src|href)="/', html), 'absolute path in page'

shutil.rmtree(OUT, ignore_errors=True)
os.makedirs(OUT)
open(os.path.join(OUT, 'index.html'), 'w', encoding='utf-8').write(html)
for f in ['style.css', 'game.js', 'favicon.svg']:
    shutil.copy(os.path.join(ROOT, f), OUT)
for d in ['story', 'music']:
    shutil.copytree(os.path.join(ROOT, d), os.path.join(OUT, d))

files, total = 0, 0
with zipfile.ZipFile(ZIP, 'w', zipfile.ZIP_DEFLATED) as z:
    for base, _, names in os.walk(OUT):
        for n in sorted(names):
            p = os.path.join(base, n)
            z.write(p, os.path.relpath(p, OUT))  # index.html sits at the root of the zip
            files += 1
            total += os.path.getsize(p)
print(f'{files} files, {total / 1e6:.1f} MB unpacked, zip {os.path.getsize(ZIP) / 1e6:.1f} MB -> {ZIP}')
assert total <= 20e6, 'over the 20 MB that keeps the game eligible for the mobile home page'
