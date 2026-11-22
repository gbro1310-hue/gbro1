import math, cairo
import lib
from lib import *
W, H = 1920, 1080
surf = cairo.ImageSurface(cairo.FORMAT_ARGB32, W, H); cr = cairo.Context(surf)
g = cairo.LinearGradient(0, 0, 0, H); g.add_color_stop_rgb(0, *hexc("#1C1B3A")); g.add_color_stop_rgb(1, *hexc("#7A2E2A"))
cr.set_source(g); cr.paint()
import importlib.util, sys
spec = importlib.util.spec_from_file_location("r", "render.py"); r = importlib.util.module_from_spec(spec); spec.loader.exec_module(r)
cr.save(); cr.translate(1350, 1080); cr.scale(1.08, 1.08); cr.translate(-1350, -1080)
fl = r.insula(cr, 1350, 1080, w=820, t=0.3, fire=1.0, lit=lambda i, k: 0.9 if i == 5 and k == 4 else 0)
cr.restore()
# glow on top window + tiny person
y5 = 1080 - (1080 - fl[5][1]) * 1.08
r.person(cr, 1350, y5 - 12, 0.2, mood="disgust", arms=(2.4, 2.4), t=0)
text(cr, "5TH", 470, 330, 300, GOLD, DARK, 26, maxw=900)
text(cr, "FLOOR", 470, 590, 230, (1, 1, 1), DARK, 24, maxw=900)
badge(cr, "ANCIENT ROME", 470, 830, 1, 0, bg=POMP_RED, fg=CREAM, size=72)
surf.write_to_png("thumbnail.png")
from PIL import Image
Image.open("thumbnail.png").convert("RGB").resize((1280, 720), Image.LANCZOS).save("thumbnail.jpg", quality=90)
