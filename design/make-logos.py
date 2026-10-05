"""Generate public/mahindra-logo.png (colour) and public/mahindra-logo-white.png
from design/mahindra-logo-source.jpg. Run: python3 design/make-logos.py (needs Pillow)."""
from PIL import Image, ImageChops, ImageDraw, ImageFilter

src = Image.open("design/mahindra-logo-source.jpg").convert("RGB")
W, H = src.size
L = src.convert("L")
SPLIT = 309  # blank band between the emblem (above) and the wordmark (below)

# Soft alpha from distance to white keeps anti-aliased edges on the wordmark
soft = L.point(lambda v: 0 if v > 245 else min(255, int((255 - v) * 4)))

# Emblem: close thin highlight lines, fill enclosed holes, then smooth the edge
m = L.crop((0, 0, W, SPLIT)).point(lambda v: 255 if v < 242 else 0)
m = m.filter(ImageFilter.MaxFilter(7)).filter(ImageFilter.MinFilter(7))
ImageDraw.floodfill(m, (0, 0), 128)
m = m.point(lambda v: 0 if v == 128 else 255)
m = m.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(1.2))
m = m.point(lambda v: max(0, min(255, (v - 64) * 2)))
emblem = Image.new("L", (W, H), 0)
emblem.paste(m, (0, 0))

alpha = ImageChops.lighter(soft, emblem)
bbox = alpha.point(lambda v: 255 if v > 20 else 0).getbbox()
pad = 6
bbox = (max(bbox[0] - pad, 0), max(bbox[1] - pad, 0), min(bbox[2] + pad, W), min(bbox[3] + pad, H))
a = alpha.crop(bbox)
a = a.resize((a.width * 2, a.height * 2), Image.LANCZOS)

color = src.crop(bbox).convert("RGBA").resize(a.size, Image.LANCZOS)
color.putalpha(a)
color.save("public/mahindra-logo.png", optimize=True)

white = Image.new("RGBA", a.size, (255, 255, 255, 0))
white.putalpha(a)
white.save("public/mahindra-logo-white.png", optimize=True)
