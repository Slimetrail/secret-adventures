"""Rebuild only journal book art from the installed simple leather covers at db8adbb.
Pillow composite; no generated imagery. Coordinates shared with intro.js hit targets.
"""
from pathlib import Path
from io import BytesIO
import subprocess
from PIL import Image, ImageDraw, ImageFont, ImageFilter
ROOT = Path(__file__).resolve().parents[1]
BASE = "db8adbb9c070568c11956b4af53d7326434ad156"
LABELS = ["Inventory", "Beasts", "Map", "Found art", "Journal", "Recipes", "Settings"]
TAB_X, TAB_Y, TAB_W, TAB_H, TAB_STEP = 780, 334, 208, 108, 122
FONT = ImageFont.truetype("/usr/share/fonts/truetype/liberation/LiberationSerif-Regular.ttf", 31)
def original(name):
    return Image.open(BytesIO(subprocess.check_output(["git", "show", BASE+":art-intro/journal/"+name], cwd=ROOT))).convert("RGBA")
def tab_strip(source):
    # Clone the existing tab silhouette and parchment; erase old lettering with blank parchment.
    patch = source.crop((780,334,988,454))
    patch.paste(patch.crop((18,8,195,35)).resize((177,68)), (18,35))
    patch = patch.resize((TAB_W,TAB_H), Image.Resampling.LANCZOS)
    strip = Image.new("RGBA", source.size)
    for i,label in enumerate(LABELS):
        tab=patch.copy(); d=ImageDraw.Draw(tab)
        d.text((TAB_W/2, TAB_H/2), label, font=FONT, fill=(47,29,15,255), anchor="mm")
        strip.alpha_composite(tab,(TAB_X,TAB_Y+i*TAB_STEP))
    return strip
page = Image.open(ROOT/"art-intro/journal/page.webp").convert("RGBA")
for zone in range(1,6):
    src=original(f"book-zone{zone}.webp")
    tabs=tab_strip(src)
    closed=src.copy(); closed.paste((0,0,0,0),(780,0,1024,1536)); closed.alpha_composite(tabs)
    closed.save(ROOT/f"art-intro/journal/book-zone{zone}.webp", lossless=True)
    opened=Image.new("RGBA",src.size)
    # Inside leather boards inherit each installed cover's wear. No closed spine/corner remains.
    leather=src.crop((155,260,718,1215)).resize((740,1090))
    mask=Image.new("L",leather.size); ImageDraw.Draw(mask).rounded_rectangle((0,0,739,1089),radius=18,fill=255)
    leather.putalpha(mask);opened.alpha_composite(leather,(48,204))
    # Reuse the simple brass fittings on the outside backboard, not the closed front cover.
    for box,pos in [((112,204,202,284),(48,204)),((665,204,772,304),(748,204)),
                    ((112,1205,202,1287),(48,1254)),((665,1187,772,1287),(748,1254))]:
        opened.alpha_composite(src.crop(box).resize((40,40),Image.Resampling.LANCZOS),pos)
    # Page stacks: slightly staggered edges on both sides of a narrow, partly-open left leaf.
    d=ImageDraw.Draw(opened)
    for n in range(5):
        off=n*3
        d.polygon([(65+off,235+off),(167,263),(167,1261),(65+off,1239-off)],fill=(194+n*8,174+n*8,132+n*9,255))
        d.polygon([(175,263),(774-off,229+off),(774-off,1250-off),(175,1261)],fill=(195+n*8,176+n*8,135+n*9,255))
    # Parchment leaves and a dark binding gutter, not a sheet on a closed cover.
    left=page.resize((98,977));opened.alpha_composite(left,(70,261))
    right=page.resize((588,990));opened.alpha_composite(right,(178,253))
    shade=Image.new("RGBA",src.size);sd=ImageDraw.Draw(shade)
    for x in range(126,216):
        alpha=int(155*max(0,1-abs(x-171)/45))
        sd.line((x,265,x,1238),fill=(45,25,10,alpha),width=1)
    opened.alpha_composite(shade)
    # Bent top/bottom leaf edges converge at the binding, making the opening explicit.
    d=ImageDraw.Draw(opened)
    d.line([(70,261),(164,278),(174,270),(765,253)],fill=(153,125,77,255),width=2)
    d.line([(70,1238),(164,1221),(174,1230),(765,1243)],fill=(153,125,77,255),width=2)
    opened.alpha_composite(tabs)
    opened.save(ROOT/f"art-intro/journal/book-open-zone{zone}.webp",lossless=True)
