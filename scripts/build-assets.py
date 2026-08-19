"""
Regenerates every asset the app serves, from the raw brand exports.

  public/assets/logo/snapmint-{orange,slate}.{svg,png}
  public/assets/widgets/preview/{orange,slate}/<id>.svg
  src/widgets.json

Widget SVGs are *preview only* — they are never downloaded by the user, so we
ship a tight-cropped variant with the exporter's whitespace removed.

Slate recolouring only touches <path fill="#FF6F00"> (the wordmark letterforms).
<rect> fills stay orange so CTA buttons and pills keep their brand colour.

  pip install resvg-py pillow --break-system-packages
  python3 scripts/build-assets.py
"""

import json
import os
import re
import shutil
from io import BytesIO

import resvg_py
from PIL import Image

SRC = "/Users/harshvishwakarma/Downloads/logo guidlines"
SVG_DIR = os.path.join(SRC, "Widgets-png")  # folder names are swapped: this holds .svg
APP = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(APP, "public/assets")

ORANGE, SLATE = "#FF6F00", "#151E29"
RENDER_W = 1200  # rasterisation width used only to measure content bounds


def slate_svg(s: str) -> str:
    return re.sub(r'(<path\b[^>]*?fill=")#FF6F00(")', r"\g<1>" + SLATE + r"\g<2>", s, flags=re.I)


# (source basename, id, group, variant, spec, cta)
# Order mirrors the Gold Standard PDP board, left to right.
CATALOG = [
    ("Group 1321316930",   "emi-999-3m-viewplans",  "v1-3-1", "Single Plan", "or ₹999 /month (3 months)",              "View Plans"),
    ("Group 1321316930-3", "emi-499-246",           "v1-3-1", "Multi Plan",  "₹499/month | 2/4/6 months EMI options",  "View Plans"),
    ("Group 1321316930-1", "emi-999-4m-viewplans",  "v1-4-1", "Single Plan", "or ₹999 /month (4 months)",              "View Plans"),
    ("Group 1321316930-4", "emi-499-369",           "v1-4-1", "Multi Plan",  "₹499/month | 3/6/9 months EMI options",  "View Plans"),
    ("Group 1321316930-2", "emi-999-3m-buyonemi",   "v2",     "Single Plan", "or ₹999 /month (3 months)",              "Buy On EMI"),
    ("Group 1321316930-5", "emi-499-24",            "v2",     "Multi Plan",  "₹499/month | 2/4 months EMI options",    "Buy On EMI"),
    ("Group 1321318384",   "cashback-new-999-3m",   "cashback", "Single Plan", "or ₹999 /month (3 months)",             "Buy On EMI"),
    ("Group 1321318385",   "cashback-new-499-24",   "cashback", "Multi Plan",  "₹499/month | 2/4 months EMI options",   "Buy On EMI"),
    ("Frame 2147229035",   "cashback-999-3m",       "cashback-no-tag", "Single Plan", "or ₹999 /month (3 months)",       "Buy On EMI"),
    ("Group 1321316829",   "dp-1-1199-2m",          "dp1-emi", "2 months", "₹1 now + ₹1199 /month (2 months)",         "View Plans"),
    ("Group 1321316829-2", "dp-1-799-3m",           "dp1-emi", "3 months", "₹1 now + ₹799 /month (3 months)",          "View Plans"),
    ("Group 1321316829-1", "dp-0-1199-2m",          "dp0-emi", "2 months", "₹0 now + ₹1199 /month (2 months)",         "View Plans"),
    ("Group 1321316829-3", "dp-0-799-3m",           "dp0-emi", "3 months", "₹0 now + ₹799 /month (3 months)",          "View Plans"),
    ("Group 1244829581",   "paylater-0-dp",         "dp0-paylater", "Standard", "or ₹0 now, rest later — No Extra Cost",  "View Plans"),
    ("Group 1321318357",   "paylater-0-dp-compact", "dp0-paylater", "Compact",  "or ₹0 now, rest later at 0 Extra Cost",  "View Plans"),
    ("Group 1244829581-1", "paylater-1-dp",         "dp1-paylater", "Standard", "or ₹1 now, rest later — No Extra Cost",  "View Plans"),
    ("Group 1321318357-1", "paylater-1-dp-compact", "dp1-paylater", "Compact",  "or ₹1 now, rest later at 0 Extra Cost",  "View Plans"),
    ("Frame 1244829761",   "pay-in-3-sale-paylater", "dp19-paylater", "Sale", "Pay ₹19* now, rest later at 0 Extra Cost", "Buy On EMI"),
    ("Frame 1244829761-1", "pay-in-3-sale-emi",      "dp19-emi",      "Sale", "Pay ₹19* now, rest in 2 No Cost EMIs",     "Buy On EMI"),
]

# Popup catalog - separate from widget catalog
# (source basename, id, group, variant, spec, cta)
POPUP_CATALOG = [
    # Check Eligibility popups
    ("Check Eligibility 4/1 ,3/SP 1.0",           "popup-check-eligibility-1", "check-eligibility", "Check Eligibility 1.0", "Standard eligibility check", ""),
    ("Check Eligibility 4/1 ,3/SP 1.0-1",         "popup-check-eligibility-2", "check-eligibility", "Check Eligibility 1.0 Alt", "Alternate eligibility check", ""),
    
    # Merchant Popup
    ("Merchant Popup/With EMIs Plan",             "popup-merchant-emi",        "merchant",          "Merchant EMI Plans",      "Popup with EMI plan options", ""),
    
    # SM MP 2 - Popup 1.0 variants
    ("SM- MP- 2/4/POP-UP 1.0",                    "popup-1-0-main",            "popup-1-0",         "Popup 1.0 Main",          "Main popup 1.0 screen", ""),
    ("SM- MP- 2/4/POP-UP 1.0-1",                  "popup-1-0-1",               "popup-1-0",         "Popup 1.0 Variant 1",     "Popup 1.0 - variant 1", ""),
    ("SM- MP- 2/4/POP-UP 1.0-2",                  "popup-1-0-2",               "popup-1-0",         "Popup 1.0 Variant 2",     "Popup 1.0 - variant 2", ""),
    ("SM- MP- 2/4/POP-UP 1.0-3",                  "popup-1-0-3",               "popup-1-0",         "Popup 1.0 Variant 3",     "Popup 1.0 - variant 3", ""),
    ("SM- MP- 2/4/POP-UP 1.0-4",                  "popup-1-0-4",               "popup-1-0",         "Popup 1.0 Variant 4",     "Popup 1.0 - variant 4", ""),
    ("SM- MP- 2/4/POP-UP 1.0-5",                  "popup-1-0-5",               "popup-1-0",         "Popup 1.0 Variant 5",     "Popup 1.0 - variant 5", ""),
    ("SM- MP- 2/4/POP-UP 1.0-6",                  "popup-1-0-6",               "popup-1-0",         "Popup 1.0 Variant 6",     "Popup 1.0 - variant 6", ""),
    ("SM- MP- 2/4/POP-UP 1.0-7",                  "popup-1-0-7",               "popup-1-0",         "Popup 1.0 Variant 7",     "Popup 1.0 - variant 7", ""),
    
    # SM MP 2 - Popup 2.0 variants
    ("SM- MP- 2/4/POP-UP 2.0",                    "popup-2-0-main",            "popup-2-0",         "Popup 2.0 Main",          "Main popup 2.0 screen", ""),
    ("SM- MP- 2/4/POP-UP 2.0-1",                  "popup-2-0-1",               "popup-2-0",         "Popup 2.0 Variant 1",     "Popup 2.0 - variant 1", ""),
    ("SM- MP- 2/4/POP-UP 2.0-2",                  "popup-2-0-2",               "popup-2-0",         "Popup 2.0 Variant 2",     "Popup 2.0 - variant 2", ""),
    ("SM- MP- 2/4/POP-UP 2.0-3",                  "popup-2-0-3",               "popup-2-0",         "Popup 2.0 Variant 3",     "Popup 2.0 - variant 3", ""),
    ("SM- MP- 2/4/POP-UP 2.0-4",                  "popup-2-0-4",               "popup-2-0",         "Popup 2.0 Variant 4",     "Popup 2.0 - variant 4", ""),
    ("SM- MP- 2/4/POP-UP 2.0-5",                  "popup-2-0-5",               "popup-2-0",         "Popup 2.0 Variant 5",     "Popup 2.0 - variant 5", ""),
    ("SM- MP- 2/4/POP-UP 2.0-6",                  "popup-2-0-6",               "popup-2-0",         "Popup 2.0 Variant 6",     "Popup 2.0 - variant 6", ""),
    ("SM- MP- 2/4/POP-UP 2.0-7",                  "popup-2-0-7",               "popup-2-0",         "Popup 2.0 Variant 7",     "Popup 2.0 - variant 7", ""),
    
    # SM MP 3 - Popup 1.0 & 2.0
    ("SM- MP- 3/6/9/POP-UP 1.0",                  "popup-3-1-0",               "popup-3",           "Popup 3 - 1.0",           "Popup version 3, variant 1.0", ""),
    ("SM- MP- 3/6/9/POP-UP 2.0",                  "popup-3-2-0",               "popup-3",           "Popup 3 - 2.0",           "Popup version 3, variant 2.0", ""),
]


def tight_crop(svg: str, w: float, h: float) -> tuple[str, float, float]:
    """Rewrite width/height/viewBox so the SVG hugs its visible content."""
    png = resvg_py.svg_to_bytes(svg_string=svg, width=RENDER_W)
    im = Image.open(BytesIO(bytes(png))).convert("RGBA")
    box = im.getbbox()
    if box is None:
        return svg, w, h
    k = w / im.width
    x0, y0, x1, y1 = (round(v * k, 2) for v in box)
    cw, ch = round(x1 - x0, 2), round(y1 - y0, 2)
    out = re.sub(r'^<svg width="[\d.]+" height="[\d.]+"', f'<svg width="{cw}" height="{ch}"', svg)
    out = re.sub(r'viewBox="[^"]*"', f'viewBox="{x0} {y0} {cw} {ch}"', out, count=1)
    return out, cw, ch


for d in ["logo", "widgets/preview/orange", "widgets/preview/slate", "widgets/preview/popup"]:
    os.makedirs(os.path.join(OUT, d), exist_ok=True)

for pref, folder, name in [
    ("orange", "orange-logo", "Group 48098327"),
    ("slate", "slate blue logo", "Group 1321316956"),
    ("popup", "logo for popup", "Logo"),
]:
    for ext in ("svg", "png"):
        shutil.copy(os.path.join(SRC, folder, f"{name}.{ext}"), f"{OUT}/logo/snapmint-{pref}.{ext}")

meta = []
for base, wid, group, variant, spec, cta in CATALOG:
    src = os.path.join(SVG_DIR, base + ".svg")
    assert os.path.exists(src), base
    s = open(src).read()
    m = re.match(r'<svg width="([\d.]+)" height="([\d.]+)"', s)
    w, h = float(m.group(1)), float(m.group(2))

    o, pw, ph = tight_crop(s, w, h)
    open(f"{OUT}/widgets/preview/orange/{wid}.svg", "w").write(o)
    sl, _, _ = tight_crop(slate_svg(s), w, h)
    open(f"{OUT}/widgets/preview/slate/{wid}.svg", "w").write(sl)

    meta.append({"id": wid, "group": group, "variant": variant, "spec": spec,
                 "cta": cta, "w": w, "h": h, "pw": pw, "ph": ph})

# Process popup catalog
popup_meta = []
for base, wid, group, variant, spec, cta in POPUP_CATALOG:
    src = os.path.join(SRC, "Snapmint popup svg", base + ".svg")
    assert os.path.exists(src), base
    s = open(src).read()
    m = re.match(r'<svg width="([\d.]+)" height="([\d.]+)"', s)
    w, h = float(m.group(1)), float(m.group(2))

    o, pw, ph = tight_crop(s, w, h)
    open(f"{OUT}/widgets/preview/popup/{wid}.svg", "w").write(o)

    popup_meta.append({"id": wid, "group": group, "variant": variant, "spec": spec,
                 "cta": cta, "w": w, "h": h, "pw": pw, "ph": ph})

json.dump(meta, open(os.path.join(APP, "src/widgets.json"), "w"), ensure_ascii=False, indent=1)
json.dump(popup_meta, open(os.path.join(APP, "src/popup-widgets.json"), "w"), ensure_ascii=False, indent=1)
print("done", len(meta), "widgets,", len(popup_meta), "popups")
