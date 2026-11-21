import math, cairo
from render import *
surf = cairo.ImageSurface(cairo.FORMAT_ARGB32, W, H); cr = cairo.Context(surf)
g = cairo.RadialGradient(540, 1000, 80, 540, 1000, 1200)
g.add_color_stop_rgb(0, *hexc("#FFE38A")); g.add_color_stop_rgb(1, *hexc("#9B2D20"))
cr.set_source(g); cr.paint()
cr.save(); cr.translate(540, 1000); 
for k in range(16):
    cr.move_to(0, 0); cr.arc(0, 0, 1600, k*math.pi/8, k*math.pi/8+0.1); cr.close_path(); col(cr,(1,1,1),0.18); cr.fill()
cr.restore()
t = 0.4
for s in (-1, 1):
    up = 70 if s < 0 else 0
    cr.move_to(540+s*45, 1010); cr.line_to(540+s*50, 1230-up); col(cr,DARK); cr.set_line_width(46); cr.set_line_cap(cairo.LINE_CAP_ROUND); cr.stroke()
    cr.move_to(540+s*45, 1010); cr.line_to(540+s*50, 1230-up); col(cr,SKIN); cr.set_line_width(34); cr.stroke()
tub(cr, 540, 1250, rx=400, ry=80, h=300, t=t, wob=1)
ellipse(cr, 490, 1185, 34, 20); fill_stroke(cr, SKIN, DARK, 5)
for k in range(10):
    a = -math.pi*(0.1+k*0.085); ellipse(cr, 540+math.cos(a)*300, 1240+math.sin(a)*170, 14, 18); col(cr, PEE); cr.fill()
body(cr, 540, 790, hexc("#B5653E"), w=150, h=240, arms=(1.2, 1.2), arm_len=150)
head(cr, 540, 715, r=75, mood="disgust", look=0)
stink(cr, 380, 1180, 0.2, 2, 280, GREEN, 0.9, 80); stink(cr, 700, 1180, 0.5, 2, 280, GREEN, 0.9, 80)
text(cr, "WASHED", 540, 260, 190, PEE, DARK, 22)
text(cr, "IN PEE?!", 540, 450, 190, (1,1,1), DARK, 22)
badge(cr, "ANCIENT ROME", 540, 1700, 1, 0, bg=DARK, fg=GOLD, size=80)
surf.write_to_png("thumbnail.png")
