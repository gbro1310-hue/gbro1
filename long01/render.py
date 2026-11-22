"""Render 'Fifth floor in Ancient Rome' long-form video (1920x1080) with cairo.

usage: python3 render.py out.mp4            full render (parallel)
       python3 render.py still.png 123.4    single still
"""
import json, math, os, random, subprocess, sys
from multiprocessing import Pool
import cairo
from lib import *

W, H, FPS = 1920, 1080, 30
WORDS = json.load(open("words.json"))
PARAS = json.load(open("paras.json"))
DUR = PARAS[-1][1] + 1.6

NIGHT = hexc("#1C1B3A")
WOOD, WOOD_D = hexc("#9A6A44"), hexc("#6B4128")
PLASTER = hexc("#E8D3A8")
FIRE1, FIRE2 = hexc("#FFB833"), hexc("#E8501E")
BLUE = hexc("#3E6E9E")

# ---------- extra props ----------
def person(cr, x, y, s=1.0, tunic=hexc("#B5653E"), mood="neutral", look=0.0, arms=(0.3, 0.3),
           walk=0.0, t=0.0, wreath=False, hair=HAIR):
    """x,y = feet position."""
    cr.save(); cr.translate(x, y); cr.scale(s, s)
    sw = math.sin(t * 9) * 0.35 * walk
    for k, sgn in enumerate((-1, 1)):
        a = sw * (1 if k else -1)
        x0 = sgn * 28
        cr.move_to(x0, -110); cr.line_to(x0 + 100 * math.sin(a), -110 + 100 * math.cos(a))
        cr.set_line_cap(cairo.LINE_CAP_ROUND); col(cr, DARK); cr.set_line_width(40); cr.stroke()
        cr.move_to(x0, -110); cr.line_to(x0 + 100 * math.sin(a), -110 + 100 * math.cos(a))
        col(cr, SKIN); cr.set_line_width(28); cr.stroke()
    bob = abs(math.sin(t * 9)) * 6 * walk
    hands = body(cr, 0, -330 - bob, tunic, w=130, h=230, arms=arms, arm_len=130)
    head(cr, 0, -395 - bob, r=60, mood=mood, look=look, wreath=wreath, hair=hair)
    cr.restore()
    return [(x + hx * s, y + (hy) * s) for hx, hy in [(h[0], h[1]) for h in hands]]

def bucket(cr, x, y, s=1.0, water=True):
    cr.save(); cr.translate(x, y); cr.scale(s, s)
    cr.move_to(-40, -60); cr.line_to(40, -60); cr.line_to(30, 0); cr.line_to(-30, 0); cr.close_path()
    fill_stroke(cr, WOOD, DARK, 5)
    if water:
        ellipse(cr, 0, -60, 40, 10); col(cr, WATER); cr.fill()
    cr.arc(0, -60, 44, math.pi, 2 * math.pi); col(cr, DARK); cr.set_line_width(5); cr.stroke()
    cr.restore()

def pot(cr, x, y, s=1.0):
    cr.save(); cr.translate(x, y); cr.scale(s, s)
    cr.move_to(-45, -70); cr.curve_to(-70, -40, -55, 0, 0, 0); cr.curve_to(55, 0, 70, -40, 45, -70); cr.close_path()
    fill_stroke(cr, TERRA, DARK, 5)
    ellipse(cr, 0, -70, 45, 12); fill_stroke(cr, PEE_D, DARK, 4)
    cr.restore()

def flame(cr, x, y, s, t, a=1.0):
    for k, (c, sc) in enumerate(((FIRE2, 1.0), (FIRE1, 0.65), ((1, 0.95, 0.7), 0.35))):
        w = 40 * s * sc; h = 120 * s * sc * (1 + 0.15 * math.sin(t * 13 + k + x))
        cr.move_to(x - w, y)
        cr.curve_to(x - w, y - h * 0.5, x - w * 0.2 + 8 * math.sin(t * 9 + x), y - h * 0.7, x + 6 * math.sin(t * 11), y - h)
        cr.curve_to(x + w * 0.3, y - h * 0.6, x + w, y - h * 0.5, x + w, y)
        cr.close_path(); col(cr, c, a); cr.fill()

def smoke(cr, x, y, t, n=6, a=0.5, spread=1.0):
    for i in range(n):
        ph = (t * 0.25 + i / n) % 1
        ellipse(cr, x + 60 * math.sin(i * 1.7 + t) * spread, y - ph * 500, 50 + ph * 110, 40 + ph * 80)
        col(cr, (0.35, 0.33, 0.35), a * (1 - ph)); cr.fill()

def street(cr, y0, c=hexc("#7F7464")):
    col(cr, c); cr.rectangle(0, y0, W, H - y0); cr.fill()
    rnd = random.Random(5)
    for i in range(40):
        ellipse(cr, rnd.random() * W, y0 + 30 + rnd.random() * (H - y0), 70, 24)
        fill_stroke(cr, hexc("#978C78"), DARK, 3)

FLOOR_H = [230, 170, 140, 115, 95, 80]   # ground .. 5th floor heights

def insula(cr, cx, base, w=900, t=0.0, night=0.0, fire=0.0, lit=None, crack=0.0, wobble=0.0, highlight=None):
    """Front view of an insula. Returns list of (y_top, y_bottom) per floor."""
    cr.save()
    if wobble:
        cr.translate(cx, base); cr.rotate(wobble); cr.translate(-cx, -base)
    floors = []
    y = base
    for i, fh in enumerate(FLOOR_H):
        floors.append((y - fh, y)); y -= fh
    top = y
    # walls
    for i, (y0, y1) in enumerate(floors):
        shade = lerpc(PLASTER, hexc("#C9A77A"), i / 6)
        if i == 0:
            shade = hexc("#D9B98A")
        cr.rectangle(cx - w / 2, y0, w, y1 - y0); fill_stroke(cr, shade, DARK, 6)
        if highlight == i:
            cr.rectangle(cx - w / 2, y0, w, y1 - y0); col(cr, GOLD, 0.35 + 0.15 * math.sin(t * 4)); cr.fill()
        if i == 0:
            n = 4
            for k in range(n):
                ax = cx - w / 2 + (k + 0.5) * w / n
                rrect(cr, ax - 70, y0 + 60, 140, y1 - y0 - 60, 70); col(cr, DARK, 0.8); cr.fill()
                cr.move_to(ax - 95, y0 + 60); cr.line_to(ax + 95, y0 + 60); cr.line_to(ax + 80, y0 + 100)
                cr.line_to(ax - 80, y0 + 100); cr.close_path()
                fill_stroke(cr, POMP_RED if k % 2 else hexc("#3E6E5E"), DARK, 4)
        else:
            n = [0, 5, 6, 7, 8, 9][i]
            for k in range(n):
                wx = cx - w / 2 + (k + 0.5) * w / n
                ww, wh = (60 - i * 6), (y1 - y0) * 0.55
                lit_k = lit(i, k) if lit else 0
                cr.rectangle(wx - ww / 2, y0 + (y1 - y0) * 0.22, ww, wh)
                fill_stroke(cr, lerpc(DARK, GOLD, lit_k) if i < 5 else lerpc(WOOD_D, GOLD, lit_k), DARK, 4)
    # roof
    cr.move_to(cx - w / 2 - 30, top); cr.line_to(cx, top - 70); cr.line_to(cx + w / 2 + 30, top); cr.close_path()
    fill_stroke(cr, TERRA, DARK, 6)
    if crack > 0:
        cr.move_to(cx + 120, floors[2][1])
        pts = [(cx + 140, floors[2][1] - 40), (cx + 110, floors[2][1] - 80), (cx + 150, floors[3][1] - 10),
               (cx + 125, floors[3][0] + 30), (cx + 160, floors[4][1])]
        for k, p in enumerate(pts[:max(1, int(len(pts) * crack))]):
            cr.line_to(*p)
        col(cr, DARK); cr.set_line_width(7); cr.stroke()
    if night > 0:
        pass
    if fire > 0:
        fy = floors[1][0]
        for k in range(5):
            flame(cr, cx - w / 2 + 120 + k * (w - 240) / 4, fy + 40, 1.4 * fire, t)
        smoke(cr, cx, fy - 50, t, 8, 0.6 * fire, 3)
    cr.restore()
    return floors

def chapter(cr, s, t, t0):
    k = ease_out(prog(t, t0, t0 + 0.4)) * (1 - prog(t, t0 + 3.2, t0 + 3.8))
    if k <= 0: return
    cr.save(); cr.translate(-260 * (1 - k), 0)
    rrect(cr, 50, 50, 40 + len(s) * 30, 76, 14); col(cr, DARK, 0.85 * k); cr.fill()
    cr.restore()
    text(cr, s, 70 + len(s) * 15 - 260 * (1 - k), 89, 42, GOLD, None, 0, alpha=k, maxw=900)

def night_overlay(cr, a):
    if a > 0:
        col(cr, NIGHT, a); cr.paint()

def room_interior(cr, t, dark=0.0, shutter_open=1.0):
    """Tiny 5th-floor room, wooden."""
    col(cr, WOOD); cr.paint()
    for k in range(14):
        cr.rectangle(k * 140, 0, 6, H); col(cr, WOOD_D, 0.6); cr.fill()
    # sloped roof
    cr.move_to(0, 0); cr.line_to(W, 0); cr.line_to(W, 160); cr.line_to(0, 320); cr.close_path()
    col(cr, WOOD_D); cr.fill()
    for k in range(8):
        cr.move_to(k * 260, 320 - k * 260 * 160 / W); cr.line_to(k * 260 + 40, 0); col(cr, DARK, 0.5); cr.set_line_width(14); cr.stroke()
    col(cr, hexc("#5C3A22")); cr.rectangle(0, 860, W, 220); cr.fill()
    # window
    wx, wy, ww, wh = 1300, 380, 300, 300
    sky_c = lerpc(hexc("#F7D9A0"), NIGHT, dark)
    cr.rectangle(wx, wy, ww, wh); col(cr, sky_c); cr.fill()
    so = shutter_open
    for sgn in (-1, 1):
        cx = wx + ww / 2 + sgn * (ww / 4 + ww / 4 * so * 2) if so > 0 else wx + ww / 2 + sgn * ww / 4
        sw_ = ww / 2 * (1 - so * 0.85)
        x0 = wx + (0 if sgn < 0 else ww - sw_) if True else 0
        x0 = wx if sgn < 0 else wx + ww - sw_
        cr.rectangle(x0, wy, sw_, wh); fill_stroke(cr, WOOD_D, DARK, 5)
    cr.rectangle(wx, wy, ww, wh); col(cr, DARK); cr.set_line_width(8); cr.stroke()
    # straw mattress
    rrect(cr, 150, 800, 620, 90, 30); fill_stroke(cr, hexc("#D8C27A"), DARK, 5)
    for k in range(12):
        cr.move_to(180 + k * 48, 815); cr.line_to(200 + k * 48, 875); col(cr, hexc("#A88F45")); cr.set_line_width(4); cr.stroke()
    if dark > 0:
        col(cr, NIGHT, dark * 0.7); cr.paint()

def stairs(cr, x0, y0, flights, fw=420, fh=150, c=WOOD):
    """Zig-zag staircase going up from (x0,y0). Returns path points per flight."""
    pts = []
    for f in range(flights):
        d = 1 if f % 2 == 0 else -1
        xa = x0 if d > 0 else x0 + fw
        ya = y0 - f * fh
        pts.append(((xa, ya), (xa + d * fw, ya - fh)))
        cr.move_to(xa, ya); cr.line_to(xa + d * fw, ya - fh)
        col(cr, DARK); cr.set_line_width(34); cr.stroke()
        cr.move_to(xa, ya); cr.line_to(xa + d * fw, ya - fh)
        col(cr, c); cr.set_line_width(24); cr.stroke()
        for k in range(8):
            sx = xa + d * fw * k / 8; sy = ya - fh * k / 8
            cr.move_to(sx, sy); cr.line_to(sx, sy - 18); col(cr, DARK, 0.6); cr.set_line_width(4); cr.stroke()
    return pts

def aqueduct(cr, y, t):
    col(cr, hexc("#C9B48C")); cr.rectangle(0, y - 90, W, 60); cr.fill()
    col(cr, DARK); cr.rectangle(0, y - 90, W, 60); cr.set_line_width(5); cr.stroke()
    for k in range(9):
        x = k * 240
        cr.rectangle(x, y - 30, 240, 320); col(cr, hexc("#C9B48C")); cr.fill()
        cr.move_to(x + 30, y + 290); cr.line_to(x + 30, y + 80)
        cr.arc(x + 120, y + 80, 90, math.pi, 2 * math.pi); cr.line_to(x + 210, y + 290); cr.close_path()
        col(cr, hexc("#F2C890")); cr.fill()
        cr.move_to(x + 30, y + 290); cr.line_to(x + 30, y + 80); cr.arc(x + 120, y + 80, 90, math.pi, 2 * math.pi)
        cr.line_to(x + 210, y + 290); col(cr, DARK); cr.set_line_width(5); cr.stroke()
    # water flow on top
    for k in range(20):
        ph = (t * 0.4 + k / 20) % 1
        ellipse(cr, ph * W, y - 92, 40, 7); col(cr, WATER, 0.9); cr.fill()

def fountain(cr, x, y, t):
    rrect(cr, x - 160, y - 110, 320, 110, 10); fill_stroke(cr, STONE, DARK, 6)
    ellipse(cr, x, y - 110, 150, 22); col(cr, WATER); cr.fill()
    cr.rectangle(x - 40, y - 330, 80, 220); fill_stroke(cr, STONE_D, DARK, 6)
    head(cr, x, y - 270, r=34, mood="neutral")
    for k in range(8):
        ph = (t * 1.5 + k / 8) % 1
        ellipse(cr, x + ph * 60, y - 255 + ph * ph * 140, 8, 11); col(cr, WATER); cr.fill()

def counter_bar(cr, x, y, w=900):
    rrect(cr, x - w / 2, y, w, 220, 12); fill_stroke(cr, hexc("#D9CBB0"), DARK, 6)
    for k in range(4):
        jx = x - w / 2 + 130 + k * (w - 260) / 3
        ellipse(cr, jx, y + 5, 70, 18); fill_stroke(cr, TERRA, DARK, 5)
        ellipse(cr, jx, y + 5, 52, 12); col(cr, [hexc("#8B5E2B"), hexc("#C9A23A"), hexc("#7A1F2B"), hexc("#B07A3A")][k]); cr.fill()
    for k in range(6):
        cr.rectangle(x - w / 2 + 40 + k * (w - 80) / 6, y + 70, (w - 80) / 6 - 14, 110)
        col(cr, [POMP_RED, OCHRE, hexc("#3E6E5E")][k % 3], 0.6); cr.fill()

def wagon(cr, x, y, t, s=1.0):
    cr.save(); cr.translate(x, y); cr.scale(s, s)
    rrect(cr, -220, -170, 440, 110, 8); fill_stroke(cr, WOOD, DARK, 6)
    for k in range(3):
        rrect(cr, -190 + k * 130, -230, 110, 70, 8); fill_stroke(cr, STONE, DARK, 4)
    for sx in (-140, 140):
        cr.save(); cr.translate(sx, -50); cr.rotate(t * 4)
        cr.arc(0, 0, 60, 0, 2 * math.pi); fill_stroke(cr, WOOD_D, DARK, 6)
        for k in range(6):
            cr.move_to(0, 0); cr.line_to(60 * math.cos(k * math.pi / 3), 60 * math.sin(k * math.pi / 3))
            col(cr, DARK); cr.set_line_width(5); cr.stroke()
        cr.restore()
    cr.restore()

def lamp(cr, x, y, t, s=1.0, lit=1.0):
    cr.save(); cr.translate(x, y); cr.scale(s, s)
    if lit > 0:
        g = cairo.RadialGradient(70, -40, 10, 70, -40, 420)
        g.add_color_stop_rgba(0, 1, 0.85, 0.5, 0.55 * lit); g.add_color_stop_rgba(1, 1, 0.8, 0.4, 0)
        cr.set_source(g); cr.arc(70, -40, 420, 0, 2 * math.pi); cr.fill()
    cr.move_to(-90, 0); cr.curve_to(-90, -60, 60, -60, 90, -20); cr.line_to(110, -20); cr.line_to(90, 5)
    cr.curve_to(40, 25, -60, 25, -90, 0); cr.close_path(); fill_stroke(cr, TERRA, DARK, 5)
    ellipse(cr, -10, -30, 22, 8); col(cr, DARK); cr.fill()
    if lit > 0:
        flame(cr, 104, -22, 0.35 * lit, t)
    cr.restore()

def bust(cr, x, y, s, t, label, mood="neutral"):
    cr.save(); cr.translate(x, y); cr.scale(s, s)
    cr.move_to(-170, 320); cr.curve_to(-160, 120, 160, 120, 170, 320); cr.close_path(); fill_stroke(cr, PURPLE, DARK, 6)
    cr.rectangle(-35, 70, 70, 80); fill_stroke(cr, SKIN, DARK, 6)
    head(cr, 0, 0, r=90, mood=mood, hair=hexc("#6E6A66"), wreath=True)
    cr.restore()
    badge(cr, label, x, y + 330 * s, t, 0.3, bg=DARK, fg=GOLD, size=44)

# ---------- scenes (one per paragraph) ----------
def s01(cr, t, lt, d):  # hook: higher = cheaper
    sky(cr)
    street(cr, 900)
    cr.save(); cr.translate(760, 900); cr.scale(0.82, 0.82); cr.translate(-760, -900)
    fl = insula(cr, 760, 900, w=820, t=t, fire=ease_out(prog(lt, 4.8, 6.0)))
    cr.restore()
    fl = [(900 - (900 - a) * 0.82, 900 - (900 - b) * 0.82) for a, b in fl]
    prices = ["XXXX", "XXX", "XX", "XX", "X", "x"]
    for i, (y0, y1) in enumerate(fl):
        k = pop(lt, 0.4 + i * 0.35)
        cr.save(); cr.translate(1300, (y0 + y1) / 2); cr.scale(k, k)
        cr.move_to(-30, 0); cr.line_to(0, -30); cr.line_to(190, -30); cr.line_to(190, 30); cr.line_to(0, 30); cr.close_path()
        fill_stroke(cr, GOLD if i == 5 else CREAM, DARK, 4)
        cr.restore()
        text(cr, ["shops", "RICH", "floor 2", "floor 3", "floor 4", "YOU"][i], 1385, (y0 + y1) / 2, 30, DARK, None, 0, scale=k)
    if lt > 2.5:
        y0, y1 = fl[5]
        person(cr, 700, y1 - 4, 0.14, mood="neutral" if lt < 5 else "disgust", t=t)
    text(cr, "HIGHER  =  CHEAPER", 960, 110, 80, CREAM, DARK, 12, scale=pop(lt, 0.2), maxw=1200)
    if lt > 5.2:
        badge(cr, "LAST ONE OUT", 1500, 500, lt, 5.3, bg=POMP_RED, size=56)

def s02(cr, t, lt, d):  # Rome, 100 AD, a million people, 5th floor
    sky(cr, hexc("#F7D9A0"), hexc("#E9A36A"))
    rnd = random.Random(2)
    for row in range(4):
        y = 520 + row * 120
        for k in range(16):
            x = k * 130 + (row % 2) * 60 - 40
            h = rnd.randint(140, 300)
            cr.rectangle(x, y - h + 120, 120, h); fill_stroke(cr, lerpc(PLASTER, OCHRE, rnd.random() * 0.5), DARK, 4)
            cr.move_to(x - 8, y - h + 120); cr.line_to(x + 60, y - h + 80); cr.line_to(x + 128, y - h + 120); cr.close_path()
            fill_stroke(cr, TERRA, DARK, 4)
    text(cr, "ROME", 960, 200, 150, CREAM, DARK, 16, serif=True, scale=pop(lt, 0.1))
    text(cr, "around 100 AD", 960, 320, 56, GOLD, DARK, 10, scale=pop(lt, 0.6))
    n = int(1000000 * ease_out(prog(lt, 1.6, 3.6)))
    if lt > 1.6:
        badge(cr, f"{n:,} people", 960, 470, lt, 1.6, bg=DARK, fg=CREAM, size=60)
    if lt > 4.3:
        badge(cr, "YOUR ROOM: 5th FLOOR", 960, 640, lt, 4.4, bg=POMP_RED, size=70)

def s03(cr, t, lt, d):  # insula = island, 46,000 vs <2,000
    sky(cr)
    street(cr, 960)
    zoom = lerp(1.0, 0.85, ease_io(prog(lt, 0, 6)))
    cr.save(); cr.translate(560, 960); cr.scale(zoom, zoom); cr.translate(-560, -960)
    insula(cr, 560, 960, w=760, t=t)
    cr.restore()
    text(cr, "INSULA", 560, 150, 110, CREAM, DARK, 14, serif=True, scale=pop(lt, 0.2))
    text(cr, "= “island”", 560, 250, 54, GOLD, DARK, 8, scale=pop(lt, 1.6))
    if lt > 6.5:
        # bar chart
        k1 = ease_out(prog(lt, 7.0, 9.0)); k2 = ease_out(prog(lt, 9.5, 10.5))
        base = 860
        cr.rectangle(1150, base - 600 * k1, 220, 600 * k1); fill_stroke(cr, OCHRE, DARK, 6)
        cr.rectangle(1500, base - 26 * k2, 220, 26 * k2 + 1); fill_stroke(cr, POMP_RED, DARK, 6)
        text(cr, f"{int(46000 * k1):,}", 1260, base - 600 * k1 - 50, 54, CREAM, DARK, 10)
        text(cr, "apartment blocks", 1260, base + 50, 34, DARK, None, 0)
        if lt > 9.5:
            text(cr, "< 2,000", 1610, base - 80, 54, CREAM, DARK, 10)
            text(cr, "private houses", 1610, base + 50, 34, DARK, None, 0)
    if lt > d - 4.2:
        badge(cr, "THIS IS ROME", 1430, 160, lt, d - 4.1, bg=DARK, fg=GOLD, size=64)

def section(cr, t, lt, focus=None, people=True):
    """Cross-section of the insula: rooms per floor."""
    col(cr, hexc("#3A2A20")); cr.paint()
    base = 1040; x0, w = 260, 1400
    y = base
    rows = []
    for i, fh in enumerate([250, 210, 170, 140, 115, 95]):
        rows.append((y - fh, y)); y -= fh
    rows_top = y
    for i, (y0, y1) in enumerate(rows):
        n = [3, 2, 3, 4, 5, 6][i]
        for k in range(n):
            rx = x0 + k * w / n
            c = [hexc("#D9B98A"), hexc("#F0DDB0"), PLASTER, lerpc(PLASTER, WOOD, 0.3), lerpc(PLASTER, WOOD, 0.6), WOOD][i]
            cr.rectangle(rx, y0, w / n, y1 - y0); fill_stroke(cr, c, DARK, 6)
            if i == 1:  # rich: fresco panel + glass window
                cr.rectangle(rx + 40, y0 + 40, 120, 90); col(cr, POMP_RED, 0.7); cr.fill()
                cr.rectangle(rx + w / n - 160, y0 + 40, 100, 110); fill_stroke(cr, hexc("#BFE3F2"), DARK, 4)
            if i == 0:
                ellipse(cr, rx + w / n / 2, y1 - 40, 60, 18); col(cr, TERRA); cr.fill()
            if people and i >= 1:
                s = [0, 0.36, 0.3, 0.25, 0.21, 0.17][i]
                if (k + i) % 2 == 0:
                    person(cr, rx + w / n / 2 + 20 * math.sin(t * 0.7 + k + i), y1 - 2, s,
                           tunic=[OCHRE, PURPLE, hexc("#5C7C4A"), hexc("#B5653E"), hexc("#8B7B6B"), hexc("#B5653E")][i],
                           t=t, look=math.sin(t + k))
        if focus is not None and focus == i:
            cr.rectangle(x0, y0, w, y1 - y0); col(cr, GOLD, 0.25 + 0.15 * math.sin(t * 4)); cr.fill()
    cr.move_to(x0 - 40, rows_top); cr.line_to(x0 + w / 2, rows_top - 120); cr.line_to(x0 + w + 40, rows_top); cr.close_path()
    fill_stroke(cr, TERRA, DARK, 6)
    return rows

def s04(cr, t, lt, d):  # shops + rich floor
    rows = section(cr, t, lt, focus=0 if lt < 6 else 1)
    if lt < 6:
        text(cr, "SHOPS", 960, 120, 90, CREAM, DARK, 12, scale=pop(lt, 0.2))
        for k, s in enumerate(["baker", "wine counter", "sandal repair"]):
            badge(cr, s, 470 + k * 480, rows[0][0] + 60, lt, 1.0 + k * 0.7, bg=DARK, fg=CREAM, size=36)
    else:
        text(cr, "THE GOOD APARTMENTS", 960, 120, 80, GOLD, DARK, 12, scale=pop(lt, 6.0), maxw=1500)

def s05(cr, t, lt, d):  # every floor cheaper; shutter
    if lt < 9.5:
        f = min(5, 1 + int(lt / 1.8))
        rows = section(cr, t, lt, focus=f)
        text(cr, ["", "", "lower ceilings", "smaller rooms", "thinner walls", "WOODEN BOXES"][f], 960, 110, 72, CREAM, DARK, 12, scale=pop(lt, (f - 1) * 1.8))
    else:
        open_ = 1.0 if lt < 12.5 else max(0.0, 1 - prog(lt, 13.0, 13.7))
        room_interior(cr, t, dark=1 - open_ if lt > 12.5 else 0, shutter_open=open_)
        text(cr, "NO GLASS. A SHUTTER.", 960, 110, 72, CREAM, DARK, 12, scale=pop(lt, 9.6))
        if lt < 13:
            for k in range(5):
                ph = (lt * 0.8 + k / 5) % 1
                text(cr, "!", 1450 + 60 * math.sin(k * 2) , 520 - ph * 200, 40 + 30 * ph, GOLD, DARK, 6, alpha=1 - ph)
            badge(cr, "light + noise", 1450, 760, lt, 10.5, bg=GOLD, fg=DARK, size=42)
        else:
            badge(cr, "dark", 1450, 760, lt, 13.4, bg=NIGHT, fg=CREAM, size=42)

def s06(cr, t, lt, d):  # Augustus 20 m limit
    sky(cr)
    street(cr, 980)
    wob = 0
    if lt > 4.0:
        wob = 0.02 * math.sin(lt * 7) * prog(lt, 4.0, 5.0) + 0.25 * ease_io(prog(lt, 5.5, 7.0)) ** 2
    cr.save(); cr.translate(1250, 980); cr.scale(0.85, 0.85); cr.translate(-1250, -980)
    insula(cr, 1250, 980, w=600, t=t, wobble=wob)
    cr.restore()
    # measuring line 20 m
    ytop = 980 - 0.85 * sum(FLOOR_H)
    k = ease_out(prog(lt, 1.0, 2.0))
    cr.move_to(870, 980); cr.line_to(870, 980 - (980 - ytop) * k); col(cr, POMP_RED); cr.set_line_width(10); cr.stroke()
    for yy in (980, 980 - (980 - ytop) * k):
        cr.move_to(840, yy); cr.line_to(900, yy); cr.stroke()
    text(cr, "~20 m", 760, (980 + ytop) / 2, 60, CREAM, DARK, 10, scale=pop(lt, 1.6))
    bust(cr, 380, 330, 0.75, lt, "AUGUSTUS", mood="frown")

def s07(cr, t, lt, d):  # crack painted over; poet quote
    col(cr, PLASTER); cr.paint()
    for k in range(10):
        cr.rectangle(0, k * 108, W, 4); col(cr, hexc("#CDB58A"), 0.6); cr.fill()
    crack = ease_out(prog(lt, 1.5, 4.0))
    paint = ease_io(prog(lt, 7.0, 10.5))
    cr.save()
    cr.move_to(900, 150)
    pts = [(950, 260), (910, 360), (1000, 470), (960, 600), (1050, 720), (1010, 860)]
    for p in pts[:max(1, int(len(pts) * crack))]:
        cr.line_to(*p)
    col(cr, DARK); cr.set_line_width(12); cr.stroke()
    cr.restore()
    if paint > 0:
        cr.rectangle(820, 120, 300, 780 * paint); col(cr, hexc("#EFE0BC")); cr.fill()
    # landlord with brush
    by = 150 + 760 * paint
    person(cr, 1400, 1060, 0.95, tunic=hexc("#6B8E5A"), mood="smug", look=-1, arms=(0.4, -1.9 + 0.2 * math.sin(lt * 6)), t=t)
    rrect(cr, 1060, by - 30, 120, 50, 8); fill_stroke(cr, WOOD, DARK, 5)
    cr.move_to(1180, by - 5); cr.line_to(1290, 620); col(cr, WOOD_D); cr.set_line_width(14); cr.stroke()
    text(cr, "THE LANDLORD KNOWS", 960, 80, 66, POMP_RED, CREAM, 10, scale=pop(lt, 0.2), maxw=1400)
    if lt > 11:
        k = pop(lt, 11.0)
        cr.save(); cr.translate(500, 560); cr.scale(k, k)
        rrect(cr, -400, -170, 800, 340, 24); fill_stroke(cr, CREAM, DARK, 6); cr.restore()
        text(cr, "“Sleep well,”", 500, 480, 64, DARK, None, 0, serif=True, scale=k)
        text(cr, "says the manager,", 500, 560, 44, DARK, None, 0, scale=k)
        text(cr, "while the building hangs over you.", 500, 630, 34, POMP_RED, None, 0, scale=k)
        text(cr, "— Juvenal, Satire 3 (paraphrase)", 500, 760, 28, DARK, None, 0, scale=k)

def s08(cr, t, lt, d):  # morning, thirsty, no water
    room_interior(cr, t, dark=0.3 * (1 - prog(lt, 0, 2)), shutter_open=ease_out(prog(lt, 0.3, 1.5)))
    person(cr, 760, 900, 0.9, mood="frown", look=0.6, arms=(0.3, -0.9), t=t)
    # empty cup
    cr.move_to(870, 590); cr.line_to(930, 590); cr.line_to(920, 660); cr.line_to(880, 660); cr.close_path()
    fill_stroke(cr, TERRA, DARK, 5)
    text(cr, "MORNING", 960, 110, 80, CREAM, DARK, 12, scale=pop(lt, 0.1))
    if lt > 2.8:
        badge(cr, "NO WATER IN YOUR ROOM", 960, 230, lt, 2.8, bg=BLUE, size=50)
    if lt > 4.8:
        badge(cr, "NO WATER ON YOUR FLOOR", 960, 330, lt, 4.8, bg=BLUE, size=50)

def s09(cr, t, lt, d):  # aqueducts -> fountain, five floors down
    sky(cr, hexc("#BFE3F2"), hexc("#F7D9A0"))
    if lt < 6.5:
        # hills + aqueduct
        cr.move_to(0, 520); cr.curve_to(400, 380, 800, 560, 1200, 460); cr.curve_to(1500, 400, 1800, 480, W, 440)
        cr.line_to(W, H); cr.line_to(0, H); cr.close_path(); col(cr, hexc("#9DB36A")); cr.fill()
        aqueduct(cr, 600, t)
        text(cr, "AQUEDUCTS", 960, 140, 90, CREAM, DARK, 12, scale=pop(lt, 0.3))
    else:
        street(cr, 880)
        insula(cr, 1450, 880, w=700, t=t)
        fountain(cr, 520, 940, t)
        for k, s in enumerate(["clean", "cold", "free"]):
            badge(cr, s, 300 + k * 230, 450, lt, 7.3 + k * 0.5, bg=BLUE, size=46)
        if lt > 9.8:
            # arrow from top floor down
            k = ease_out(prog(lt, 9.8, 11))
            cr.move_to(1450, 300); cr.line_to(1450, 300 + 450 * k)
            col(cr, POMP_RED); cr.set_line_width(14); cr.stroke()
            badge(cr, "FIVE FLOORS DOWN", 1450, 200, lt, 9.8, bg=POMP_RED, size=52)

def s10(cr, t, lt, d):  # carry the bucket up
    col(cr, hexc("#4A3626")); cr.paint()
    for k in range(6):
        cr.rectangle(0, 1060 - k * 180, W, 8); col(cr, DARK); cr.fill()
        text(cr, f"floor {k}" if k else "street", 160, 1060 - k * 180 - 40, 34, CREAM, None, 0)
    pts = stairs(cr, 560, 1060, 5, fw=800, fh=180)
    # climber position along flights
    climb = prog(lt, 1.5, 11.0)
    fpos = climb * 5
    fi = min(4, int(fpos)); fr = fpos - fi
    (xa, ya), (xb, yb) = pts[fi]
    px, py = lerp(xa, xb, fr), lerp(ya, yb, fr)
    person(cr, px, py - 10, 0.42, mood="frown" if climb > 0.5 else "neutral", walk=1.0 if 0 < climb < 1 else 0, t=t,
           arms=(0.2, -0.1))
    bucket(cr, px + 55, py - 60, 0.6)
    if lt > 3.0:
        badge(cr, "10 LITRES = 10 KG", 1500, 200, lt, 3.0, bg=BLUE, size=52)
    if lt > 7:
        cnt = min(5, int(fpos))
        text(cr, f"{cnt}/5", 1500, 330, 90, GOLD, DARK, 12)
    if lt > d - 3.2:
        badge(cr, "THIS IS TUESDAY", 960, 540, lt, d - 3.1, bg=DARK, fg=GOLD, size=80)

def s11(cr, t, lt, d):  # no toilet
    room_interior(cr, t)
    pot(cr, 1000, 860, 1.4)
    stink(cr, 1000, 740, t, 3, 200, GREEN, 0.7, 60)
    text(cr, "NO TOILET", 960, 160, 120, CREAM, DARK, 14, scale=pop(lt, 0.4))

def s12(cr, t, lt, d):  # carry pot down to jar; fuller buys it
    col(cr, hexc("#4A3626")); cr.paint()
    stairs(cr, 300, 900, 4, fw=700, fh=200)
    # big dolium under stairs
    cr.save(); cr.translate(1420, 1000)
    cr.move_to(-180, -380); cr.curve_to(-260, -200, -200, 0, 0, 0); cr.curve_to(200, 0, 260, -200, 180, -380); cr.close_path()
    fill_stroke(cr, TERRA, DARK, 6); ellipse(cr, 0, -380, 180, 34); fill_stroke(cr, PEE, DARK, 5)
    cr.restore()
    stink(cr, 1420, 600, t, 3, 220, GREEN, 0.7, 90)
    walk = prog(lt, 1.0, 6.0)
    person(cr, lerp(900, 1180, walk), 1000, 0.6, walk=1 if walk < 1 else 0, t=t, mood="disgust")
    pot(cr, lerp(900, 1180, walk) + 70, 830, 0.6)
    text(cr, "THE BUILDING JAR", 960, 100, 76, CREAM, DARK, 12, scale=pop(lt, 0.8))
    if lt > 8.5:
        person(cr, 1760, 1000, 0.6, tunic=hexc("#5C7C4A"), mood="smile", look=-1, t=t, arms=(0.3, -1.2))
        coin(cr, 1690, 760 - 10 * math.sin(lt * 4), 30, spin=lt * 5)
        badge(cr, "the fuller buys it", 1700, 300, lt, 8.6, bg=DARK, fg=GOLD, size=40)
        badge(cr, "remember the laundry?", 1700, 380, lt, 10.0, bg=PEE_D, fg=DARK, size=34)

def s13(cr, t, lt, d):  # out the window; law; Juvenal
    sky(cr, hexc("#22204A"), hexc("#4A3A6A")) if lt > 9 else sky(cr)
    street(cr, 900)
    insula(cr, 700, 900, w=760, t=t, lit=(lambda i, k: 0.8 if lt > 9 and (i * 7 + k) % 3 == 0 else 0))
    # shutter on top floor opens, arc of liquid
    k = prog(lt, 1.0, 2.5)
    if k > 0:
        for i in range(14):
            ph = (lt * 1.3 + i / 14) % 1 if lt < 9 else 0
            if ph > 0:
                x = 820 + ph * 350; y = 300 + ph * ph * 600
                ellipse(cr, x, y, 12, 16); col(cr, PEE, 0.9); cr.fill()
    walker = (lt * 120) % 2300 - 200
    person(cr, walker, 1010, 0.45, tunic=hexc("#3E6E5E"), walk=1, t=t, look=1)
    if lt > 3.5:
        k2 = pop(lt, 3.6)
        cr.save(); cr.translate(1550, 380); cr.scale(k2, k2); cr.rotate(0.03)
        rrect(cr, -260, -180, 520, 360, 16); fill_stroke(cr, CREAM, DARK, 6)
        for j in range(5):
            cr.move_to(-200, -90 + j * 50); cr.line_to(200, -90 + j * 50); col(cr, DARK, 0.25); cr.set_line_width(6); cr.stroke()
        cr.restore()
        text(cr, "ROMAN LAW", 1550, 260, 52, POMP_RED, None, 0, serif=True, scale=k2)
        text(cr, "thrown from a window?", 1550, 340, 34, DARK, None, 0, scale=k2)
        text(cr, "the household pays", 1550, 400, 40, DARK, None, 0, scale=k2)
    if lt > 9.5:
        badge(cr, "make your will before dinner", 1500, 720, lt, 9.6, bg=DARK, fg=GOLD, size=40)
        text(cr, "— Juvenal (paraphrase)", 1500, 800, 28, CREAM, DARK, 6)

def s14(cr, t, lt, d):  # brazier on wooden floor
    room_interior(cr, t)
    cr.move_to(820, 860); cr.line_to(1080, 860); cr.line_to(1040, 760); cr.line_to(860, 760); cr.close_path()
    fill_stroke(cr, hexc("#5A4A3A"), DARK, 6)
    for k in range(6):
        ellipse(cr, 880 + k * 28, 755, 18, 9); col(cr, (1, 0.45 + 0.1 * math.sin(t * 8 + k), 0.12)); cr.fill()
    flame(cr, 950, 755, 0.8, t)
    text(cr, "NO KITCHEN", 960, 140, 100, CREAM, DARK, 14, scale=pop(lt, 0.2))
    for k, s in enumerate(["wooden floor", "wooden room", "full building"]):
        badge(cr, s, 420 + k * 540, 300, lt, 3.0 + k * 1.0, bg=POMP_RED, size=44)
    if lt > d - 2.8:
        badge(cr, "MOST DON'T", 960, 520, lt, d - 2.7, bg=DARK, fg=GOLD, size=70)

def s15(cr, t, lt, d):  # street counter
    sky(cr, hexc("#F7D9A0"), hexc("#E9A36A"))
    col(cr, PLASTER); cr.rectangle(0, 0, W, 760); cr.fill()
    col(cr, POMP_RED); cr.rectangle(0, 520, W, 240); cr.fill()
    street(cr, 900)
    counter_bar(cr, 960, 640, 1100)
    person(cr, 1620, 1050, 0.75, tunic=hexc("#8B7B6B"), mood="smile", t=t, arms=(0.3, -1.0))
    person(cr, 330, 1050, 0.75, tunic=hexc("#B5653E"), mood="neutral", t=t, arms=(-0.9, 0.3), look=1)
    text(cr, "THE STREET COUNTER", 960, 110, 84, CREAM, DARK, 12, scale=pop(lt, 0.2), maxw=1500)
    for k, s in enumerate(["hot lentils", "bread", "watered wine"]):
        badge(cr, s, 520 + k * 440, 300, lt, 3.2 + k * 0.8, bg=DARK, fg=CREAM, size=42)
    if lt > d - 3.8:
        badge(cr, "THE STREET IS THE KITCHEN", 960, 440, lt, d - 3.7, bg=POMP_RED, size=56)

def s16(cr, t, lt, d):  # work
    sky(cr, hexc("#BFE3F2"), hexc("#F7D9A0"))
    col(cr, hexc("#4F8FB0")); cr.rectangle(0, 760, W, 320); cr.fill()
    for k in range(10):
        ph = (t * 0.2 + k / 10) % 1
        cr.move_to(ph * W, 820 + k * 24); cr.line_to(ph * W + 80, 820 + k * 24); col(cr, (1, 1, 1), 0.4); cr.set_line_width(4); cr.stroke()
    col(cr, WOOD); cr.rectangle(0, 700, 1300, 70); cr.fill()
    for k in range(6):
        amphora(cr, 150 + k * 110, 690, 0.45)
    walk = (lt * 0.15) % 1
    person(cr, lerp(1250, 750, walk), 700, 0.6, walk=1, t=t, arms=(2.6, 2.6), mood="frown")
    amphora(cr, lerp(1250, 750, walk), 450, 0.4)
    text(cr, "WORK", 960, 120, 100, CREAM, DARK, 14, scale=pop(lt, 0.2))
    if lt > 4.5:
        badge(cr, "your room is for sleeping", 1500, 300, lt, 4.6, bg=DARK, fg=GOLD, size=42)

def s17(cr, t, lt, d):  # baths
    col(cr, hexc("#E9DCC0")); cr.paint()
    for k in range(5):
        x = 200 + k * 380
        cr.rectangle(x, 120, 70, 620); fill_stroke(cr, CREAM, DARK, 5)
    rrect(cr, 150, 700, 1620, 260, 30); fill_stroke(cr, STONE, DARK, 6)
    rrect(cr, 190, 730, 1540, 200, 20); col(cr, WATER); cr.fill()
    for k in range(10):
        ph = (t * 0.3 + k / 10) % 1
        ellipse(cr, 260 + k * 150, 700 - ph * 400, 60 + ph * 60, 30 + ph * 30); col(cr, (1, 1, 1), 0.5 * (1 - ph)); cr.fill()
    for k in range(4):
        cr.save(); cr.rectangle(0, 0, W, 800); cr.clip()
        person(cr, 400 + k * 380, 900, 0.55, tunic=[OCHRE, PURPLE, hexc("#B5653E"), hexc("#5C7C4A")][k], mood="smile", t=t, look=math.sin(t + k))
        cr.restore()
    text(cr, "THE BATHS", 960, 90, 90, POMP_RED, CREAM, 12, scale=pop(lt, 0.2))
    if lt > 2.5:
        coin(cr, 1650, 330, 70, spin=lt * 2)
        badge(cr, "1 quadrans", 1650, 450, lt, 2.6, bg=DARK, fg=GOLD, size=40)
    if lt > 6:
        badge(cr, "same hot water", 960, 220, lt, 6.2, bg=BLUE, size=50)

def s18(cr, t, lt, d):  # light goes orange
    k = ease_io(prog(lt, 0, d))
    sky(cr, lerpc(SKY1, hexc("#E8763A"), k), lerpc(SKY2, hexc("#7A3050"), k))
    sun(cr, 1500, lerp(300, 700, k), 90, 1)
    street(cr, 880)
    insula(cr, 520, 880, w=640, t=t, lit=lambda i, kk: k * 0.8 if (i + kk) % 3 == 0 else 0)
    insula(cr, 1250, 900, w=520, t=t, lit=lambda i, kk: k * 0.8 if (i * 2 + kk) % 4 == 0 else 0)
    night_overlay(cr, 0.25 * k)

def s19(cr, t, lt, d):  # wagons at night
    sky(cr, NIGHT, hexc("#3A2E5A"))
    for k in range(40):
        rnd = random.Random(k)
        cr.arc(rnd.random() * W, rnd.random() * 400, 2 + rnd.random() * 2, 0, 2 * math.pi); col(cr, (1, 1, 0.9), 0.7); cr.fill()
    street(cr, 860, hexc("#4E4A55"))
    insula(cr, 960, 860, w=900, t=t, lit=lambda i, k: 0.85 if (i * 5 + k) % 4 == 0 else 0)
    night_overlay(cr, 0.35)
    x = (lt * 260) % 2600 - 300
    wagon(cr, x, 1000, lt, 1.0)
    shake = 3 * math.sin(lt * 40)
    for k in range(4):
        ph = (lt * 1.2 + k / 4) % 1
        text(cr, "CLACK", x - 200 + k * 90, 820 - ph * 160, 30 + 20 * ph, GOLD, DARK, 5, alpha=1 - ph, rot=-0.2)
    bust(cr, 280, 250, 0.55, lt, "JULIUS CAESAR", mood="neutral")
    text(cr, "NO WAGONS BY DAY", 1150, 110, 72, CREAM, DARK, 12, scale=pop(lt, 1.0), maxw=1300)
    if lt > 14:
        badge(cr, "only the rich can afford to sleep", 1180, 240, lt, 14.2, bg=DARK, fg=GOLD, size=42)
        text(cr, "— Juvenal (paraphrase)", 1180, 315, 28, CREAM, DARK, 6)

def s20(cr, t, lt, d):  # lamp
    room_interior(cr, t, dark=1.0, shutter_open=0.0)
    lit = ease_out(prog(lt, 0.8, 1.6))
    lamp(cr, 900, 820, t, 1.5, lit)
    if lt > 3.2:
        badge(cr, "a flame", 600, 300, lt, 3.2, bg=FIRE2, size=46)
        badge(cr, "in a wooden room", 960, 300, lt, 3.8, bg=WOOD_D, size=46)
        badge(cr, "five floors up", 1340, 300, lt, 4.4, bg=DARK, fg=GOLD, size=46)

def s21(cr, t, lt, d):  # FIRE.
    col(cr, hexc("#1A0F0A")); cr.paint()
    for k in range(9):
        flame(cr, 120 + k * 210, 1080, 3.0 * ease_out(prog(lt, 2.4, 3.6)), t)
    text(cr, "FIRE.", 960, 470, 260, FIRE1, DARK, 20, scale=pop(lt, 2.6, 0.4))

def s22(cr, t, lt, d):  # vigiles bucket chain
    sky(cr, NIGHT, hexc("#5A2E3A"))
    street(cr, 900, hexc("#4E4A55"))
    insula(cr, 1250, 900, w=760, t=t, fire=ease_out(prog(lt, 0.5, 2.0)))
    text(cr, "VIGILES", 520, 120, 100, FIRE1, DARK, 14, serif=True, scale=pop(lt, 2.0))
    text(cr, "Rome's fire brigade, from Augustus", 520, 210, 36, CREAM, DARK, 6, scale=pop(lt, 2.5))
    for k in range(6):
        x = 120 + k * 150
        person(cr, x, 1050, 0.5, tunic=POMP_RED, t=t, arms=(-1.2 + 0.4 * math.sin(lt * 4 + k), 1.2), look=1)
    for k in range(3):
        ph = (lt * 0.8 + k / 3) % 1
        bucket(cr, lerp(130, 900, ph), 800 - 30 * math.sin(ph * math.pi * 6), 0.6)
    if lt > 6:
        for k, s in enumerate(["buckets", "ropes", "axes", "vinegar blankets"]):
            badge(cr, s, 300 + (k % 2) * 400, 330 + (k // 2) * 100, lt, 6.0 + k * 0.6, bg=DARK, fg=CREAM, size=38)
    if lt > 12:
        cr.move_to(1600, 900); cr.line_to(1600, 400)
        col(cr, CREAM, 0.6); cr.set_line_width(4); cr.set_dash([16, 12]); cr.stroke(); cr.set_dash([])
        badge(cr, "no pump reaches floor 5", 1600, 320, lt, 12.2, bg=POMP_RED, size=40)

def s23(cr, t, lt, d):  # smoke, stairs crowded
    col(cr, hexc("#3A2A20")); cr.paint()
    pts = stairs(cr, 600, 1060, 5, fw=700, fh=200)
    for k in range(9):
        f = (k * 0.55 + lt * 0.12) % 5
        fi = int(f); fr = f - fi
        (xa, ya), (xb, yb) = pts[fi]
        # people going DOWN: reverse direction
        person(cr, lerp(xb, xa, fr), lerp(yb, ya, fr) - 6, 0.32, walk=1, t=t + k,
               tunic=[OCHRE, hexc("#B5653E"), hexc("#5C7C4A"), hexc("#8B7B6B")][k % 4], mood="frown")
    smoke(cr, 960, 1000, t, 10, 0.55, 4)
    night_overlay(cr, 0.2)
    text(cr, "THE STAIRS ARE THE ONLY WAY OUT", 960, 110, 64, CREAM, DARK, 10, scale=pop(lt, 2.5), maxw=1600)

def s24(cr, t, lt, d):  # Crassus
    sky(cr, NIGHT, hexc("#5A2E3A"))
    street(cr, 900, hexc("#4E4A55"))
    sold = lt > 13
    insula(cr, 1350, 900, w=700, t=t, fire=(1.0 if not sold else max(0.0, 1 - prog(lt, 15, 17))))
    bust(cr, 300, 260, 0.6, lt, "CRASSUS", mood="smug")
    person(cr, 760, 1050, 0.65, tunic=PURPLE, mood="smug", t=t, arms=(0.3, -1.4), wreath=False)
    for k in range(3):
        coin(cr, 860 + k * 30, 640 - k * 18, 28, spin=lt * 3 + k)
    person(cr, 1000, 1050, 0.6, tunic=hexc("#8B7B6B"), mood="frown", t=t, look=-1)
    for k in range(4):
        person(cr, 120 + k * 110, 1060, 0.45, tunic=hexc("#6B4128"), t=t, look=1)
    if lt > 7:
        badge(cr, "“I'll buy it. Now. Cheap.”", 900, 380, lt, 7.2, bg=CREAM, fg=DARK, size=40)
    if sold:
        k = pop(lt, 13.2, 0.25)
        cr.save(); cr.translate(1350, 500); cr.rotate(-0.15); cr.scale(2.2 - 1.2 * k, 2.2 - 1.2 * k)
        rrect(cr, -220, -70, 440, 140, 12); col(cr, POMP_RED, 0.95); cr.fill(); cr.restore()
        text(cr, "SOLD", 1350, 500, 100, CREAM, None, 0, scale=2.2 - 1.2 * k, rot=-0.15)

def s25(cr, t, lt, d):  # rent July 1
    col(cr, PLASTER); cr.paint()
    k = pop(lt, 0.3)
    cr.save(); cr.translate(560, 480); cr.scale(k, k)
    rrect(cr, -300, -300, 600, 600, 30); fill_stroke(cr, CREAM, DARK, 8)
    rrect(cr, -300, -300, 600, 150, 30); col(cr, POMP_RED); cr.fill()
    cr.restore()
    text(cr, "KAL. IVL.", 560, 255, 70, CREAM, None, 0, serif=True, scale=k)
    text(cr, "1", 560, 520, 260, DARK, None, 0, serif=True, scale=k)
    text(cr, "July", 560, 700, 60, POMP_RED, None, 0, scale=k)
    text(cr, "RENT DAY", 1350, 160, 100, POMP_RED, CREAM, 12, scale=pop(lt, 0.8))
    if lt > 6.5:
        walk = prog(lt, 6.5, d)
        person(cr, lerp(1150, 1900, walk), 1040, 0.7, walk=1, t=t, mood="frown", arms=(2.4, 2.4))
        rrect(cr, lerp(1150, 1900, walk) - 90, 600, 180, 120, 12); fill_stroke(cr, hexc("#C9A77A"), DARK, 5)
        badge(cr, "MISS IT: YOU'RE OUT", 1350, 300, lt, 6.6, bg=DARK, fg=GOLD, size=50)

def s26(cr, t, lt, d):  # recap montage
    col(cr, hexc("#2E1C12")); cr.paint()
    items = [("water you carry", lambda x, y: bucket(cr, x, y + 60, 1.4)),
             ("a pot you carry", lambda x, y: pot(cr, x, y + 60, 1.3)),
             ("food at a counter", lambda x, y: amphora(cr, x, y + 40, 0.55)),
             ("a shared bath", lambda x, y: coin(cr, x, y, 60, spin=t)),
             ("a room to sleep", lambda x, y: (rrect(cr, x - 120, y, 240, 50, 18), fill_stroke(cr, hexc("#D8C27A"), DARK, 5))),
             ("a lamp, blown out", lambda x, y: lamp(cr, x - 30, y + 40, t, 0.9, 1 - prog(lt, d - 2.5, d - 1.5)))]
    for i, (lab, fn) in enumerate(items):
        x = 360 + (i % 3) * 600; y = 300 + (i // 3) * 420
        k = pop(lt, 0.4 + i * 2.3)
        if k <= 0.01: continue
        cr.save(); cr.translate(x, y); cr.scale(k, k); cr.translate(-x, -y)
        rrect(cr, x - 250, y - 170, 500, 340, 26); fill_stroke(cr, CREAM, GOLD, 6)
        fn(x, y - 20)
        cr.restore()
        text(cr, lab, x, y + 120, 40, DARK, None, 0, scale=k)

def s27(cr, t, lt, d):  # closer
    sky(cr, NIGHT, hexc("#2A2350"))
    for k in range(60):
        rnd = random.Random(k)
        cr.arc(rnd.random() * W, rnd.random() * 500, 1.5 + rnd.random() * 2, 0, 2 * math.pi); col(cr, (1, 1, 0.9), 0.7); cr.fill()
    street(cr, 900, hexc("#3E3A45"))
    insula(cr, 960, 900, w=900, t=t, lit=lambda i, k: (0.9 if (i * 5 + k) % 3 == 0 and lt < d - 1.5 - (i + k) * 0.1 else 0))
    night_overlay(cr, 0.3)
    for k, s in enumerate(["NOT SMALL.", "NOT SAD."]):
        text(cr, s, 960, 160 + k * 100, 76, CREAM, DARK, 10, scale=pop(lt, 2.4 + k * 0.9))

def s28(cr, t, lt, d):  # CTA
    col(cr, hexc("#2E1C12")); cr.paint()
    g = cairo.RadialGradient(960, 540, 50, 960, 540, 900)
    g.add_color_stop_rgba(0, 0.95, 0.75, 0.3, 0.35); g.add_color_stop_rgba(1, 0, 0, 0, 0)
    cr.set_source(g); cr.paint()
    text(cr, "ORDINARY LIVES", 960, 430, 130, CREAM, DARK, 14, serif=True, scale=pop(lt, 0.2))
    text(cr, "one ordinary life at a time", 960, 560, 50, GOLD, None, 0, scale=pop(lt, 0.8))
    k = pop(lt, 2.5)
    cr.save(); cr.translate(960, 720); cr.scale(k, k)
    rrect(cr, -230, -55, 460, 110, 55); col(cr, hexc("#CC2A1E")); cr.fill(); cr.restore()
    text(cr, "SUBSCRIBE", 960, 720, 54, (1, 1, 1), None, 0, scale=k)

SCENES = [s01, s02, s03, s04, s05, s06, s07, s08, s09, s10, s11, s12, s13, s14,
          s15, s16, s17, s18, s19, s20, s21, s22, s23, s24, s25, s26, s27, s28]
CHAPTERS = {7: "MORNING", 10: "THE TOILET", 13: "FOOD", 15: "WORK & BATHS", 17: "NIGHT", 20: "FIRE", 24: "RENT"}

def scene_index(t):
    for i in range(len(PARAS)):
        nxt = PARAS[i + 1][0] if i + 1 < len(PARAS) else 1e9
        if t < nxt - 0.35:
            return i
    return len(PARAS) - 1

# ---------- captions ----------
def build_chunks():
    chunks, cur = [], []
    for w in WORDS:
        cur.append(w)
        if len(cur) >= 5 or w[0][-1] in ".?!," or w[3]:
            chunks.append(cur); cur = []
    if cur: chunks.append(cur)
    out = []
    for i, c in enumerate(chunks):
        end = chunks[i + 1][0][1] if i + 1 < len(chunks) else c[-1][2] + 0.6
        out.append((c[0][1], min(end, c[-1][2] + 0.5), c))
    return out
CHUNKS = build_chunks()

def captions(cr, t):
    for start, end, ws in CHUNKS:
        if start <= t < end:
            cr.save()
            cr.select_font_face("DejaVu Sans", cairo.FONT_SLANT_NORMAL, cairo.FONT_WEIGHT_BOLD)
            size = 50; cr.set_font_size(size)
            parts = [w[0] for w in ws]
            space = cr.text_extents(" ").x_advance
            widths = [cr.text_extents(p).x_advance for p in parts]
            total = sum(widths) + space * (len(parts) - 1)
            y = 1010; x = 960 - total / 2
            rrect(cr, x - 24, y - 46, total + 48, 66, 14); col(cr, (0, 0, 0), 0.55); cr.fill()
            for p, wdt, w in zip(parts, widths, ws):
                cr.move_to(x, y); cr.text_path(p)
                col(cr, GOLD if w[1] <= t < w[2] + 0.05 else (1, 1, 1)); cr.fill()
                x += wdt + space
            cr.restore(); break

def frame(t):
    surf = cairo.ImageSurface(cairo.FORMAT_ARGB32, W, H)
    cr = cairo.Context(surf)
    i = scene_index(t)
    t0 = PARAS[i][0] - (0.35 if i else 0)
    t1 = (PARAS[i + 1][0] - 0.35) if i + 1 < len(PARAS) else DUR
    lt = t - t0
    punch = 1.0 + 0.04 * max(0.0, 1 - lt / 0.25) if i else 1.0
    drift = 1.0 + 0.025 * (lt / max(1, t1 - t0))
    s = punch * drift
    cr.translate(960, 540); cr.scale(s, s); cr.translate(-960, -540)
    SCENES[i](cr, t, lt, t1 - t0)
    cr.identity_matrix()
    if i + 1 in CHAPTERS:
        chapter(cr, CHAPTERS[i + 1], t, t0)
    g = cairo.RadialGradient(960, 540, 700, 960, 540, 1250)
    g.add_color_stop_rgba(0, 0, 0, 0, 0); g.add_color_stop_rgba(1, 0, 0, 0, 0.35)
    cr.set_source(g); cr.paint()
    captions(cr, t)
    if t < 0.4:
        cr.set_source_rgba(0, 0, 0, 1 - t / 0.4); cr.paint()
    if t > DUR - 0.8:
        cr.set_source_rgba(0, 0, 0, prog(t, DUR - 0.8, DUR)); cr.paint()
    return surf

def render_chunk(args):
    idx, f0, f1 = args
    path = f"chunk_{idx:02d}.mp4"
    ff = subprocess.Popen(["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "bgra",
                           "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-", "-c:v", "libx264", "-preset", "medium",
                           "-crf", "19", "-pix_fmt", "yuv420p", path], stdin=subprocess.PIPE)
    for f in range(f0, f1):
        ff.stdin.write(bytes(frame(f / FPS).get_data()))
    ff.stdin.close(); ff.wait()
    return path

if __name__ == "__main__":
    out = sys.argv[1]
    if len(sys.argv) > 2:
        frame(float(sys.argv[2])).write_to_png(out); sys.exit()
    n = int(DUR * FPS)
    workers = os.cpu_count() or 4
    step = math.ceil(n / (workers * 3))
    jobs = [(i, f, min(n, f + step)) for i, f in enumerate(range(0, n, step))]
    with Pool(workers) as p:
        paths = p.map(render_chunk, jobs)
    with open("chunks.txt", "w") as fh:
        for pth in paths: fh.write(f"file '{pth}'\n")
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", "chunks.txt",
                    "-i", "voice.mp3", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-af", "apad",
                    "-t", f"{DUR:.2f}", "-movflags", "+faststart", out], check=True)
    for pth in paths: os.remove(pth)
    os.remove("chunks.txt")
    print("done", out)
