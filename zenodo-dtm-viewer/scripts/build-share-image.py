#!/usr/bin/env python3
"""Render the 1200x630 social card from a real terrain hillshade (Pillow)."""
import argparse
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageOps

parser = argparse.ArgumentParser()
parser.add_argument("hillshade", type=Path)
parser.add_argument("fonts", type=Path)
parser.add_argument("--output", type=Path, default=Path(__file__).resolve().parents[1] / "public/og-image.png")
args = parser.parse_args()
S = 2
W, H = 1200, 630
forest = (23, 43, 39)
ivory = "#fff9ed"
gold = "#f5d59e"
image = Image.new("RGB", (W*S, H*S), forest)
shade = Image.open(args.hillshade).convert("L")
terrain = ImageOps.colorize(shade, black="#1d3932", white="#bfc7ac")
terrain = ImageOps.fit(terrain, (720*S, H*S), method=Image.Resampling.LANCZOS)
image.paste(terrain, (480*S, 0))
# Smooth transition keeps typography clear without hiding all of the landscape.
veil = Image.new("RGB", image.size, forest)
mask = Image.new("L", image.size, 0)
md = ImageDraw.Draw(mask)
for x in range(W*S):
    opacity = 255 if x <= 470*S else int(255 * max(0, 1-(x-470*S)/(360*S)))
    md.line([(x,0),(x,H*S)], fill=opacity)
image = Image.composite(veil, image, mask)
draw = ImageDraw.Draw(image)

def font(name, size):
    return ImageFont.truetype(str(args.fonts / name), size*S)

def text(x, y, value, name, size, fill=ivory):
    face = font(name, size)
    bounds = draw.textbbox((x*S,y*S), value, font=face, anchor="lt")
    assert bounds[2] < W*S-24*S and bounds[3] < H*S-16*S, (value, bounds)
    draw.text((x*S,y*S), value, font=face, fill=fill, anchor="lt")

def line(points, fill, width=1):
    draw.line([(int(x*S),int(y*S)) for x,y in points], fill=fill, width=width*S)

text(64, 62, "L’ITALIA, DA ESPLORARE", "DMMono-Regular.ttf", 15, gold)
text(59, 139, "Il terreno,", "InstrumentSerif-Regular.ttf", 108)
text(60, 252, "da vicino.", "InstrumentSerif-Italic.ttf", 116, gold)
text(65, 399, "Ortofoto, rilievo e quote.", "InstrumentSerif-Regular.ttf", 30)
text(65, 438, "Il terreno d’Italia su una griglia di 5 metri.", "InstrumentSerif-Regular.ttf", 25, "#c5cfbf")
line([(65,510),(325,510)], "#768779")
text(65, 535, "22 GB. Solo quel che serve.", "DMMono-Regular.ttf", 17, gold)
# Cartographic marker, with a clear centre and restrained contrast.
cx, cy = 938, 294
for pts in [[(cx-27,cy),(cx-10,cy)],[(cx+10,cy),(cx+27,cy)],
            [(cx,cy-27),(cx,cy-10)],[(cx,cy+10),(cx,cy+27)]]:
    line(pts, forest, 4)
    line(pts, ivory, 2)
draw.ellipse(((cx-4)*S,(cy-4)*S,(cx+4)*S,(cy+4)*S), fill=forest, outline=ivory, width=2*S)
text(814, 45, "PALERMO / SICILIA", "DMMono-Regular.ttf", 13, "#172b27")
# Attribution stays in the image when it is shared outside the site.
draw.rectangle((650*S,578*S,1200*S,630*S), fill=forest)
text(676, 597, "DTM: Panza et al. · IRPI-CNR · CC BY 4.0", "DMMono-Regular.ttf", 12, "#c5cfbf")
args.output.parent.mkdir(parents=True, exist_ok=True)
image.resize((W,H), Image.Resampling.LANCZOS).save(args.output, optimize=True)
print(args.output)
