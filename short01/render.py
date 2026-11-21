"""Render the 'Roman laundry' Short: vector animation in cairo, piped to ffmpeg."""
import json, math, random, subprocess, sys
import cairo
import numpy as np

W, H, FPS = 1080, 1920, 30
DUR = 57.4
OUT = sys.argv[1] if len(sys.argv) > 1 else "short.mp4"
ONLY = float(sys.argv[2]) if len(sys.argv) > 2 else None  # render one still at time t

WORDS = json.load(open("words.json"))
WARP = json.load(open("timewarp.json"))  # (voice time, animation time) anchors

def warp(t):
    for (a0, b0), (a1, b1) in zip(WARP, WARP[1:]):
        if t <= a1:
            return b0 + (b1 - b0) * (t - a0) / (a1 - a0)
    return WARP[-1][1] + (t - WARP[-1][0])

# ---------- palette ----------
def hexc(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) / 255 for i in (0, 2, 4))

SKY1, SKY2 = hexc("#F7C873"), hexc("#E9875A")
TERRA = hexc("#C65D3B")
POMP_RED = hexc("#9B2D20")
DARK = hexc("#2E1C12")
CREAM = hexc("#F4E4C1")
OCHRE = hexc("#D9A441")
STONE, STONE_D = hexc("#B3A794"), hexc("#7E7361")
PEE, PEE_D = hexc("#E6C639"), hexc("#B89A1E")
TOGA_W, TOGA_D = hexc("#FBF8EE"), hexc("#A89A78")
SKIN, SKIN_D = hexc("#D69A64"), hexc("#A8703F")
HAIR = hexc("#3B2516")
GREEN = hexc("#8DB33A")
GOLD, GOLD_D = hexc("#F2C230"), hexc("#B8860B")
PURPLE = hexc("#6B2D6B")
WATER = hexc("#6FB7E0")
CLAY = hexc("#9C7A54")

# ---------- easing / helpers ----------
def clamp(x, a=0.0, b=1.0):
    return max(a, min(b, x))

def prog(t, a, b):
    return clamp((t - a) / (b - a)) if b > a else float(t >= a)

def ease_out(x):
    return 1 - (1 - x) ** 3

def ease_io(x):
    return 3 * x * x - 2 * x * x * x

def back(x):
    c1, c3 = 1.70158, 2.70158
    return 1 + c3 * (x - 1) ** 3 + c1 * (x - 1) ** 2 if x > 0 else 0

def lerp(a, b, x):
    return a + (b - a) * x

def lerpc(c1, c2, x):
    return tuple(lerp(a, b, x) for a, b in zip(c1, c2))

def col(cr, c, a=1.0):
    cr.set_source_rgba(c[0], c[1], c[2], a)

def rrect(cr, x, y, w, h, r):
    cr.new_sub_path()
    cr.arc(x + w - r, y + r, r, -math.pi / 2, 0)
    cr.arc(x + w - r, y + h - r, r, 0, math.pi / 2)
    cr.arc(x + r, y + h - r, r, math.pi / 2, math.pi)
    cr.arc(x + r, y + r, r, math.pi, 3 * math.pi / 2)
    cr.close_path()

def ellipse(cr, cx, cy, rx, ry):
    cr.save(); cr.translate(cx, cy); cr.scale(rx, ry)
    cr.arc(0, 0, 1, 0, 2 * math.pi); cr.restore()

def fill_stroke(cr, fillc, strokec=DARK, lw=6, a=1.0):
    col(cr, fillc, a); cr.fill_preserve()
    col(cr, strokec, a); cr.set_line_width(lw); cr.stroke()

def text(cr, s, x, y, size, fill=(1, 1, 1), stroke=DARK, sw=12, serif=False,
         scale=1.0, alpha=1.0, maxw=980, rot=0.0):
    if alpha <= 0 or scale <= 0:
        return
    cr.save()
    cr.select_font_face("DejaVu Serif" if serif else "DejaVu Sans",
                        cairo.FONT_SLANT_NORMAL, cairo.FONT_WEIGHT_BOLD)
    cr.set_font_size(size)
    e = cr.text_extents(s)
    if e.width > maxw:
        size *= maxw / e.width
        cr.set_font_size(size); e = cr.text_extents(s)
    cr.translate(x, y); cr.rotate(rot); cr.scale(scale, scale)
    cr.move_to(-(e.x_bearing + e.width / 2), -(e.y_bearing + e.height / 2))
    cr.text_path(s)
    cr.set_line_join(cairo.LINE_JOIN_ROUND)
    if stroke is not None:
        col(cr, stroke, alpha); cr.set_line_width(sw); cr.stroke_preserve()
    col(cr, fill, alpha); cr.fill()
    cr.restore()

def pop(t, t0, d=0.35):
    return max(0.001, back(prog(t, t0, t0 + d)))

def badge(cr, s, x, y, t, t0, bg=POMP_RED, fg=(1, 1, 1), size=64, rot=-0.03):
    k = pop(t, t0)
    if k <= 0:
        return
    cr.save(); cr.translate(x, y); cr.rotate(rot); cr.scale(k, k)
    cr.select_font_face("DejaVu Sans", cairo.FONT_SLANT_NORMAL, cairo.FONT_WEIGHT_BOLD)
    cr.set_font_size(size)
    e = cr.text_extents(s)
    w, h = e.width + 70, size * 1.6
    rrect(cr, -w / 2 + 8, -h / 2 + 10, w, h, 22); col(cr, DARK, 0.5); cr.fill()
    rrect(cr, -w / 2, -h / 2, w, h, 22); fill_stroke(cr, bg, DARK, 6)
    cr.restore()
    text(cr, s, x, y, size, fg, None, 0, scale=k, rot=rot)

def stink(cr, x, y, t, n=3, h=220, c=GREEN, a=0.85, spread=70):
    cr.save(); cr.set_line_cap(cairo.LINE_CAP_ROUND); cr.set_line_width(10)
    for i in range(n):
        ph = (t * 0.7 + i / n) % 1.0
        ox = x + (i - (n - 1) / 2) * spread
        cr.move_to(ox, y - ph * 60)
        for k in range(1, 21):
            yy = y - ph * 60 - k * h / 20
            xx = ox + 18 * math.sin(k * 0.6 + t * 5 + i)
            cr.line_to(xx, yy)
        col(cr, c, a * math.sin(ph * math.pi)); cr.stroke()
    cr.restore()

def sparkle(cr, x, y, r, a=1.0):
    cr.save(); cr.translate(x, y)
    cr.move_to(0, -r)
    for k in range(4):
        ang = k * math.pi / 2
        cr.line_to(r * 0.18 * math.cos(ang + math.pi / 4), r * 0.18 * math.sin(ang + math.pi / 4))
        cr.line_to(r * math.cos(ang + math.pi / 2), r * math.sin(ang + math.pi / 2))
    cr.close_path(); col(cr, (1, 1, 0.85), a); cr.fill(); cr.restore()

# ---------- props ----------
def sky(cr, top=SKY1, bot=SKY2):
    g = cairo.LinearGradient(0, 0, 0, H)
    g.add_color_stop_rgb(0, *top); g.add_color_stop_rgb(1, *bot)
    cr.set_source(g); cr.paint()

def pomp_wall(cr, y0=0, y1=H):
    col(cr, CREAM); cr.rectangle(0, y0, W, y1 - y0); cr.fill()
    col(cr, POMP_RED); cr.rectangle(0, y1 - 520, W, 520); cr.fill()
    col(cr, DARK, 0.8); cr.rectangle(0, y1 - 530, W, 14); cr.fill()
    for i in range(4):  # painted panels
        x = 60 + i * 260
        rrect(cr, x, y1 - 480, 200, 380, 8); col(cr, OCHRE, 0.35); cr.fill()

def tub(cr, cx, top, rx=330, ry=70, h=260, liquid=PEE, wob=0.0, t=0.0, level=1.0):
    # body
    cr.move_to(cx - rx, top)
    cr.line_to(cx - rx + 25, top + h)
    cr.curve_to(cx - rx + 25, top + h + ry, cx + rx - 25, top + h + ry, cx + rx - 25, top + h)
    cr.line_to(cx + rx, top); cr.close_path()
    fill_stroke(cr, STONE, DARK, 7)
    for i in range(3):  # stone joints
        yy = top + 60 + i * 70
        cr.move_to(cx - rx + 15, yy); cr.line_to(cx + rx - 15, yy)
        col(cr, STONE_D, 0.7); cr.set_line_width(5); cr.stroke()
    ellipse(cr, cx, top, rx, ry); fill_stroke(cr, STONE_D, DARK, 7)
    # liquid
    if level > 0:
        cr.save()
        ellipse(cr, cx, top + 4, rx - 26, ry - 14); cr.clip()
        col(cr, liquid); cr.paint()
        for i in range(5):
            xx = cx - rx + 80 + i * 120 + 20 * math.sin(t * 2 + i)
            ellipse(cr, xx, top + 4 + 8 * math.sin(t * 3 + i * 1.7) * (0.4 + wob), 50, 9)
            col(cr, (1, 1, 1), 0.3); cr.fill()
        cr.restore()

def toga(cr, x, y, w, h, c, t=0.0, sway=0.0):
    """Draped cloth hanging from a top edge at (x,y)."""
    cr.move_to(x - w / 2, y)
    cr.line_to(x + w / 2, y)
    sx = sway * math.sin(t * 2.5)
    cr.curve_to(x + w / 2 + 20, y + h * 0.4, x + w / 2 - 10 + sx, y + h * 0.8, x + w / 2 - 30 + sx, y + h)
    for k in range(4, -1, -1):
        px = x - w / 2 + 30 + k * (w - 60) / 4 + sx
        cr.line_to(px + (w - 60) / 8, y + h + (18 if k % 2 else -6))
        cr.line_to(px, y + h)
    cr.curve_to(x - w / 2 - 10 + sx, y + h * 0.8, x - w / 2 - 20, y + h * 0.4, x - w / 2, y)
    cr.close_path()
    fill_stroke(cr, c, DARK, 6)
    for k in range(1, 4):  # folds
        fx = x - w / 2 + k * w / 4
        cr.move_to(fx, y + 20)
        cr.curve_to(fx + 15, y + h * 0.4, fx - 15 + sx, y + h * 0.7, fx + sx * 0.5, y + h - 20)
        col(cr, DARK, 0.25); cr.set_line_width(5); cr.stroke()

def stains(cr, x, y, w, h, a):
    if a <= 0:
        return
    rnd = random.Random(7)
    for _ in range(7):
        ellipse(cr, x - w / 2 + rnd.random() * w, y + 40 + rnd.random() * (h - 80),
                18 + rnd.random() * 26, 12 + rnd.random() * 16)
        col(cr, hexc("#6E5530"), 0.75 * a); cr.fill()

def head(cr, x, y, r=58, mood="neutral", look=0.0, hair=HAIR, wreath=False, t=0.0):
    ellipse(cr, x, y, r, r * 1.05); fill_stroke(cr, SKIN, DARK, 6)
    cr.arc(x, y - 4, r + 2, math.pi * 1.05, math.pi * 1.95); cr.close_path()
    col(cr, hair); cr.fill()
    ex = x + look * 14
    for s in (-1, 1):
        ellipse(cr, ex + s * r * 0.36, y + 4, 7, 9 if mood != "squint" else 3); col(cr, DARK); cr.fill()
    cr.set_line_width(6); cr.set_line_cap(cairo.LINE_CAP_ROUND); col(cr, DARK)
    my = y + r * 0.5
    if mood == "disgust":
        cr.move_to(x - 22, my)
        for k in range(1, 7):
            cr.line_to(x - 22 + k * 7.3, my + (6 if k % 2 else -6))
        cr.stroke()
        for s in (-1, 1):  # brows
            cr.move_to(ex + s * r * 0.5, y - 18); cr.line_to(ex + s * r * 0.18, y - 10); cr.stroke()
    elif mood == "frown":
        cr.arc(x, my + 14, 18, math.pi * 1.15, math.pi * 1.85); cr.stroke()
    elif mood == "smile":
        cr.arc(x, my - 10, 20, math.pi * 0.15, math.pi * 0.85); cr.stroke()
    elif mood == "smug":
        cr.move_to(x - 18, my); cr.curve_to(x, my + 8, x + 12, my + 4, x + 24, my - 8); cr.stroke()
    else:
        cr.move_to(x - 16, my); cr.line_to(x + 16, my); cr.stroke()
    if wreath:
        for k in range(9):
            ang = math.pi * (1.0 + k / 8)
            lx, ly = x + (r + 6) * math.cos(ang), y - 6 + (r + 6) * math.sin(ang)
            cr.save(); cr.translate(lx, ly); cr.rotate(ang + math.pi / 2)
            ellipse(cr, 0, 0, 10, 20); fill_stroke(cr, GREEN, DARK, 3); cr.restore()

def body(cr, x, y, tunic, w=150, h=230, arms=(0.3, 0.3), arm_len=150):
    """y = shoulder line. Returns hand positions."""
    cr.move_to(x - w / 2, y); cr.line_to(x + w / 2, y)
    cr.line_to(x + w / 2 + 20, y + h); cr.line_to(x - w / 2 - 20, y + h); cr.close_path()
    fill_stroke(cr, tunic, DARK, 6)
    cr.move_to(x - w / 2 - 20, y + h - 30); cr.line_to(x + w / 2 + 20, y + h - 30)
    col(cr, DARK, 0.25); cr.set_line_width(6); cr.stroke()
    hands = []
    for s, ang in zip((-1, 1), arms):
        sx = x + s * (w / 2 - 6)
        hx = sx + s * arm_len * math.sin(ang)
        hy = y + 20 + arm_len * math.cos(ang)
        cr.set_line_cap(cairo.LINE_CAP_ROUND)
        cr.move_to(sx, y + 20); cr.line_to(hx, hy); col(cr, DARK); cr.set_line_width(32); cr.stroke()
        cr.move_to(sx, y + 20); cr.line_to(hx, hy); col(cr, SKIN); cr.set_line_width(22); cr.stroke()
        hands.append((hx, hy))
    return hands

def amphora(cr, x, y, s=1.0, fill_level=0.0, liquid=PEE):
    cr.save(); cr.translate(x, y); cr.scale(s, s)
    cr.move_to(-40, -170); cr.line_to(40, -170)
    cr.curve_to(40, -130, 120, -110, 110, -20)
    cr.curve_to(100, 60, 30, 120, 0, 150)
    cr.curve_to(-30, 120, -100, 60, -110, -20)
    cr.curve_to(-120, -110, -40, -130, -40, -170); cr.close_path()
    fill_stroke(cr, TERRA, DARK, 6)
    for sgn in (-1, 1):
        cr.move_to(sgn * 40, -160); cr.curve_to(sgn * 110, -170, sgn * 110, -100, sgn * 70, -95)
        col(cr, DARK); cr.set_line_width(14); cr.stroke()
        cr.move_to(sgn * 40, -160); cr.curve_to(sgn * 110, -170, sgn * 110, -100, sgn * 70, -95)
        col(cr, TERRA); cr.set_line_width(7); cr.stroke()
    ellipse(cr, 0, -170, 40, 12); fill_stroke(cr, DARK, DARK, 3)
    if fill_level > 0:
        ellipse(cr, 0, -170, 30, 8); col(cr, liquid, min(1, fill_level * 2)); cr.fill()
    cr.move_to(-90, -20); cr.line_to(90, -20); col(cr, DARK, 0.3); cr.set_line_width(6); cr.stroke()
    cr.restore()

def coin(cr, x, y, r, t=0.0, spin=0.0):
    sx = abs(math.cos(spin)) * 0.85 + 0.15
    cr.save(); cr.translate(x, y); cr.scale(sx, 1)
    cr.arc(0, 0, r, 0, 2 * math.pi); fill_stroke(cr, GOLD, DARK, 5)
    cr.arc(0, 0, r * 0.78, 0, 2 * math.pi); col(cr, GOLD_D); cr.set_line_width(4); cr.stroke()
    if sx > 0.5:  # tiny profile
        ellipse(cr, 0, 0, r * 0.32, r * 0.4); col(cr, GOLD_D); cr.fill()
    cr.restore()

def sun(cr, x, y, r, a=1.0):
    g = cairo.RadialGradient(x, y, r * 0.3, x, y, r * 2.2)
    g.add_color_stop_rgba(0, 1, 0.95, 0.7, 0.9 * a); g.add_color_stop_rgba(1, 1, 0.9, 0.6, 0)
    cr.set_source(g); cr.arc(x, y, r * 2.2, 0, 2 * math.pi); cr.fill()
    cr.arc(x, y, r, 0, 2 * math.pi); col(cr, (1, 0.96, 0.78), a); cr.fill()

# ---------- scenes ----------
def scene_intro(cr, t):
    sky(cr)
    sun(cr, 820, 380, 70)
    # Vesuvius
    cr.move_to(-80, 1150); cr.line_to(380, 560); cr.line_to(560, 560); cr.line_to(1160, 1150); cr.close_path()
    fill_stroke(cr, hexc("#6E4A3A"), DARK, 7)
    for i in range(4):
        ph = (t * 0.25 + i / 4) % 1
        ellipse(cr, 470 + 40 * math.sin(i + t), 540 - ph * 300, 40 + ph * 70, 30 + ph * 50)
        col(cr, (0.95, 0.92, 0.88), 0.55 * (1 - ph)); cr.fill()
    # town
    rnd = random.Random(3)
    x = -20
    while x < W:
        bw = rnd.randint(130, 220); bh = rnd.randint(170, 330)
        cr.rectangle(x, 1250 - bh, bw, bh + 500); fill_stroke(cr, lerpc(CREAM, OCHRE, rnd.random() * 0.6), DARK, 6)
        cr.move_to(x - 15, 1250 - bh); cr.line_to(x + bw / 2, 1250 - bh - 60); cr.line_to(x + bw + 15, 1250 - bh)
        cr.close_path(); fill_stroke(cr, TERRA, DARK, 6)
        rrect(cr, x + bw / 2 - 25, 1250 - bh + 60, 50, 70, 25); col(cr, DARK, 0.75); cr.fill()
        x += bw
    col(cr, hexc("#8C7B66")); cr.rectangle(0, 1250, W, H - 1250); cr.fill()
    k = pop(t, 0.05, 0.5)
    text(cr, "POMPEII", 540, 300, 170, CREAM, DARK, 16, serif=True, scale=k)
    text(cr, "79 AD", 540, 450, 90, GOLD, DARK, 12, serif=True, scale=pop(t, 0.9))

def fuller_shop(cr, t, t0):
    """Shop front where you hand over your toga. t0 = local start."""
    lt = t - t0
    slide = ease_out(prog(lt, 0, 0.45))
    cr.save(); cr.translate((1 - slide) * W, 0)
    pomp_wall(cr)
    # sign
    rrect(cr, 190, 230, 700, 150, 14); fill_stroke(cr, DARK, GOLD, 8)
    text(cr, "FULLONICA", 540, 305, 92, GOLD, None, 0, serif=True)
    text(cr, "laundry · dry cleaning", 540, 420, 40, DARK, None, 0)
    # fuller behind counter
    sh = 760
    body(cr, 640, sh, hexc("#5C7C4A"), arms=(0.9, 0.9 - 0.6 * ease_out(prog(lt, 1.2, 1.6))))
    head(cr, 640, sh - 70, mood="smile" if lt < 2.4 else "smug", look=-0.6)
    # counter
    cr.rectangle(0, 980, W, 380); fill_stroke(cr, hexc("#8E5B3A"), DARK, 7)
    cr.rectangle(0, 970, W, 30); fill_stroke(cr, hexc("#6B4128"), DARK, 6)
    # your hand with toga
    hp = ease_out(prog(lt, 0.4, 1.3))
    hx = lerp(-150, 380, hp)
    toga(cr, hx + 60, 760, 230, 260, TOGA_D, t, 10)
    stains(cr, hx + 60, 760, 230, 260, 1)
    cr.move_to(-40, 820); cr.line_to(hx, 770); col(cr, DARK); cr.set_line_width(64)
    cr.set_line_cap(cairo.LINE_CAP_ROUND); cr.stroke()
    cr.move_to(-40, 820); cr.line_to(hx, 770); col(cr, SKIN); cr.set_line_width(50); cr.stroke()
    stink(cr, hx + 60, 740, t, 3, 160, GREEN, 0.6)
    cr.restore()

def scene_tub_drop(cr, t, t0):
    lt = t - t0
    pomp_wall(cr)
    col(cr, hexc("#8C7B66")); cr.rectangle(0, 1300, W, H - 1300); cr.fill()
    drop = prog(lt, 0.2, 0.9)
    splash_t = lt - 0.9
    wob = max(0, 1 - splash_t) if splash_t > 0 else 0
    # toga falling (behind tub front? draw before tub then liquid over it)
    ty = lerp(200, 950, drop ** 2)
    if drop < 1:
        cr.save(); cr.translate(540, ty); cr.rotate(0.3 * math.sin(lt * 6))
        toga(cr, 0, -130, 220, 240, TOGA_D, t, 25); stains(cr, 0, -130, 220, 240, 1); cr.restore()
    tub(cr, 540, 1000, wob=wob, t=t)
    if splash_t > 0:
        # sunken toga hint
        ellipse(cr, 540, 1008, 160, 30); col(cr, TOGA_D, 0.8); cr.fill()
        rnd = random.Random(11)
        for i in range(16):
            ang = -math.pi * (0.1 + 0.8 * rnd.random())
            sp = 500 + 500 * rnd.random()
            st = splash_t
            x = 540 + math.cos(ang) * sp * st * 0.8
            y = 990 + math.sin(ang) * sp * st + 1400 * st * st
            if y < 1050 and st < 1.2:
                ellipse(cr, x, y, 14, 18); col(cr, PEE); cr.fill()
        stink(cr, 540, 960, t, 4, 260, GREEN, 0.8, 120)
    text(cr, "STALE URINE", 540, 330, 120, PEE, DARK, 16, scale=pop(lt, 0.9))
    if lt > 3.2:
        badge(cr, "HUMAN", 330, 560, lt, 3.25, bg=hexc("#3E6E9E"))
        badge(cr, "+", 540, 560, lt, 3.5, bg=DARK, size=60)
        badge(cr, "ANIMAL", 750, 560, lt, 3.7, bg=hexc("#7A5230"))

def scene_jars(cr, t, t0):
    lt = t - t0
    sky(cr, hexc("#F2D49A"), hexc("#E8A86E"))
    # street corner building
    cr.rectangle(0, 300, 640, 1100); fill_stroke(cr, CREAM, DARK, 7)
    col(cr, POMP_RED); cr.rectangle(0, 1000, 640, 400); cr.fill()
    cr.rectangle(640, 500, 500, 900); fill_stroke(cr, lerpc(CREAM, OCHRE, 0.4), DARK, 7)
    # road stones
    col(cr, hexc("#7F7464")); cr.rectangle(0, 1300, W, H); cr.fill()
    rnd = random.Random(5)
    for i in range(22):
        ellipse(cr, rnd.random() * W, 1340 + rnd.random() * 500, 70, 28); fill_stroke(cr, hexc("#9A8F7C"), DARK, 4)
    # jars
    for i, (x, s) in enumerate([(380, 1.25), (720, 1.0)]):
        fl = prog(lt, 0.5 + i * 0.4, 2.2)
        k = pop(lt, 0.1 + i * 0.25)
        cr.save(); cr.translate(x, 1240); cr.scale(k, k)
        amphora(cr, 0, -150 * s, s, fl); cr.restore()
        if k > 0.9:
            stink(cr, x, 1240 - 330 * s, t, 2, 160, GREEN, 0.7, 50)
    # drips falling into big jar
    for i in range(4):
        ph = (lt * 1.6 + i / 4) % 1
        ellipse(cr, 380, 600 + ph * 230, 9, 13); col(cr, PEE, 1 - ph * 0.3); cr.fill()
    rrect(cr, 690, 700, 300, 110, 10); fill_stroke(cr, CREAM, DARK, 5)
    text(cr, "PUBLIC", 840, 735, 42, DARK, None, 0)
    text(cr, "COLLECTION", 840, 780, 34, POMP_RED, None, 0)
    text(cr, "ON EVERY CORNER", 540, 330, 92, CREAM, DARK, 14, scale=pop(lt, 0.2))

def scene_ammonia(cr, t, t0):
    lt = t - t0
    col(cr, PEE_D); cr.paint()
    g = cairo.RadialGradient(540, 1000, 50, 540, 1000, 900)
    g.add_color_stop_rgba(0, 1, 0.92, 0.45, 1); g.add_color_stop_rgba(1, 0.72, 0.6, 0.12, 1)
    cr.set_source(g); cr.paint()
    whiten = ease_io(prog(lt, 0.6, 2.6))
    # cloth seen from above, wavy
    cr.save(); cr.translate(540, 1000); cr.rotate(0.05 * math.sin(t * 2))
    cr.move_to(-330, -280)
    for k in range(9):
        cr.line_to(-330 + k * 82.5, -280 + 14 * math.sin(k + t * 3))
    for k in range(9):
        cr.line_to(330 + 14 * math.sin(k + t * 3), -280 + k * 70)
    for k in range(9):
        cr.line_to(330 - k * 82.5, 280 + 14 * math.sin(k + t * 3))
    for k in range(9):
        cr.line_to(-330 + 14 * math.sin(k + t * 3), 280 - k * 70)
    cr.close_path()
    fill_stroke(cr, lerpc(TOGA_D, TOGA_W, whiten), DARK, 6)
    rnd = random.Random(9)
    for i in range(9):  # grease blobs dissolving
        x = rnd.uniform(-260, 260); y = rnd.uniform(-220, 220)
        r = rnd.uniform(25, 55) * (1 - prog(lt, 0.4 + i * 0.12, 1.4 + i * 0.12))
        if r > 1:
            ellipse(cr, x, y, r, r * 0.7); col(cr, hexc("#5E4520"), 0.85); cr.fill()
    cr.restore()
    for i in range(18):  # bubbles
        ph = (lt * 0.6 + i / 18) % 1
        x = 120 + (i * 137) % 840 + 20 * math.sin(t * 3 + i)
        y = 1500 - ph * 1000
        cr.arc(x, y, 10 + (i % 4) * 7, 0, 2 * math.pi)
        col(cr, (1, 1, 1), 0.65 * (1 - ph)); cr.set_line_width(4); cr.stroke()
    badge(cr, "NH₃  AMMONIA", 540, 330, lt, 0.1, bg=hexc("#3E6E9E"), size=70)
    text(cr, "GREASE: GONE", 540, 500, 70, CREAM, DARK, 12, scale=pop(lt, 1.2))

def scene_stomp(cr, t, t0, sun_p):
    lt = t - t0
    day = 1 - prog(sun_p, 0.75, 1.0)
    top = lerpc(hexc("#2A2350"), SKY1, day); bot = lerpc(hexc("#5A3050"), SKY2, day)
    sky(cr, top, bot)
    # sun moving in an arc
    ang = math.pi * (1 - sun_p)
    sun(cr, 540 + 430 * math.cos(ang), 760 - 520 * math.sin(ang), 55, 0.4 + 0.6 * day)
    col(cr, hexc("#8C7B66")); cr.rectangle(0, 1330, W, H); cr.fill()
    # zoom on feet for "ankle-deep"
    zoom = 1 + 0.9 * ease_io(prog(t, 24.45, 24.95))
    cr.save(); cr.translate(540, 1250); cr.scale(zoom, zoom); cr.translate(-540, -1250)
    stomp_rate = 2.6
    ph = (lt * stomp_rate) % 1
    left_up = (int(lt * stomp_rate) % 2 == 0)
    lift = math.sin(ph * math.pi) * 70
    bob = abs(math.sin(ph * math.pi)) * 12
    tub_top = 1080
    # legs (drawn before tub liquid so feet are under)
    for s in (-1, 1):
        up = lift if (s < 0) == left_up else 0
        cr.move_to(540 + s * 45, 860 - bob); cr.line_to(540 + s * 50, tub_top + 30 - up)
        col(cr, DARK); cr.set_line_width(46); cr.set_line_cap(cairo.LINE_CAP_ROUND); cr.stroke()
        cr.move_to(540 + s * 45, 860 - bob); cr.line_to(540 + s * 50, tub_top + 30 - up)
        col(cr, SKIN); cr.set_line_width(34); cr.stroke()
    tub(cr, 540, tub_top, rx=300, ry=62, h=220, t=t, wob=1)
    # feet stamping: the part above liquid
    for s in (-1, 1):
        up = lift if (s < 0) == left_up else 0
        if up > 20:
            ellipse(cr, 540 + s * 55, tub_top + 25 - up, 34, 20); fill_stroke(cr, SKIN, DARK, 5)
            for k in range(3):
                ellipse(cr, 540 + s * 55 + (k - 1) * 30, tub_top + 45 - up + k * 6, 8, 12); col(cr, PEE); cr.fill()
    # ankle ring of liquid
    for s in (-1, 1):
        ellipse(cr, 540 + s * 50, tub_top + 12, 40, 10); col(cr, PEE_D, 0.9); cr.fill()
    # splash on impact
    if ph < 0.25:
        for k in range(6):
            a2 = -math.pi * (0.15 + k * 0.14)
            sx = (-1 if not left_up else 1) * 50 + 540
            ellipse(cr, sx + math.cos(a2) * 90 * (ph * 4 + 0.3), tub_top + math.sin(a2) * 90 * (ph * 4 + 0.3), 10, 13)
            col(cr, PEE); cr.fill()
    # body (tunic tucked up) and head
    body(cr, 540, 640 - bob, hexc("#B5653E"), w=140, h=230,
         arms=(0.6 + 0.2 * math.sin(lt * 5), 0.6 + 0.2 * math.cos(lt * 5)), arm_len=140)
    head(cr, 540, 570 - bob, mood="disgust" if lt > 3.4 else "neutral", look=0.4 * math.sin(lt))
    stink(cr, 540, 1020, t, 4, 250, GREEN, 0.75, 130)
    cr.restore()

def scene_steps(cr, t, t0):
    lt = t - t0
    pomp_wall(cr)
    steps = [("RINSE", 26.32), ("CLAY", 27.04), ("BRUSH", 30.96), ("SULPHUR", 31.88), ("PRESS", 34.09)]
    cur = max([0] + [i for i, (_, s) in enumerate(steps) if t >= s - 0.05])
    # progress bar
    for i, (name, s) in enumerate(steps):
        x = 140 + i * 200
        done = i <= cur
        cr.arc(x, 260, 44, 0, 2 * math.pi)
        fill_stroke(cr, GOLD if i == cur else (POMP_RED if done else CREAM), DARK, 6)
        text(cr, str(i + 1), x, 262, 46, DARK if i == cur else (CREAM if done else DARK), None, 0)
        if i < 4:
            cr.move_to(x + 48, 260); cr.line_to(x + 152, 260)
            col(cr, DARK, 0.6); cr.set_line_width(8); cr.stroke()
    name, s0 = steps[cur]
    st = t - s0
    text(cr, name, 540, 430, 120, CREAM, DARK, 16, scale=pop(st, 0.0, 0.3))
    whiten = cur / 4 + prog(st, 0, 1.5) * 0.25
    clothc = lerpc(TOGA_D, TOGA_W, clamp(0.35 + whiten * 0.65))
    if name == "RINSE":
        toga(cr, 540, 650, 300, 380, clothc, t, 15)
        for i in range(24):
            ph = (st * 1.5 + i / 24) % 1
            ellipse(cr, 300 + (i * 97) % 480, 560 + ph * 600, 9, 15); col(cr, WATER, 0.9); cr.fill()
    elif name == "CLAY":
        cr.save(); cr.translate(540, 900)
        rrect(cr, -330, -200, 660, 400, 20); fill_stroke(cr, clothc, DARK, 6)
        spread = ease_out(prog(st, 0.1, 2.5))
        for i in range(10):
            ang = i * 2.4
            ellipse(cr, math.cos(ang) * 220 * spread, math.sin(ang) * 130 * spread, 90 * spread + 5, 50 * spread + 5)
            col(cr, CLAY, 0.8); cr.fill()
        hx = 160 * math.sin(st * 6)
        hy = 60 * math.cos(st * 6)
        for s in (-1, 1):
            ellipse(cr, hx + s * 90, hy, 55, 40); fill_stroke(cr, SKIN, DARK, 5)
        cr.restore()
        text(cr, "fuller's earth", 540, 1230, 58, CREAM, DARK, 10)
    elif name == "BRUSH":
        cr.save(); cr.translate(540, 900)
        rrect(cr, -330, -200, 660, 400, 20); fill_stroke(cr, clothc, DARK, 6)
        bx = 220 * math.sin(st * 14)
        cr.save(); cr.translate(bx, -40); cr.rotate(-0.3)
        rrect(cr, -110, -40, 220, 60, 14); fill_stroke(cr, hexc("#8E5B3A"), DARK, 5)
        for k in range(11):
            cr.move_to(-95 + k * 19, 20); cr.line_to(-95 + k * 19, 70)
            col(cr, DARK); cr.set_line_width(6); cr.stroke()
        cr.restore(); cr.restore()
    elif name == "SULPHUR":
        # brazier + wicker dome with toga over it
        for i in range(10):
            ph = (st * 0.8 + i / 10) % 1
            ellipse(cr, 540 + 60 * math.sin(i * 1.3 + t * 2), 1150 - ph * 600, 50 + ph * 80, 40 + ph * 50)
            col(cr, hexc("#E7E28A"), 0.45 * (1 - ph)); cr.fill()
        cr.move_to(420, 1180); cr.line_to(660, 1180); cr.line_to(620, 1280); cr.line_to(460, 1280); cr.close_path()
        fill_stroke(cr, hexc("#5A4A3A"), DARK, 6)
        for k in range(5):
            ellipse(cr, 470 + k * 25, 1175, 18, 10); col(cr, (1, 0.5, 0.15)); cr.fill()
        cr.save()
        cr.move_to(270, 1180); cr.curve_to(270, 640, 810, 640, 810, 1180)
        cr.close_path()
        fill_stroke(cr, clothc, DARK, 6)
        cr.restore()
        stink(cr, 540, 760, t, 3, 200, hexc("#C9C24A"), 0.8, 160)
        text(cr, "burning sulphur = bleach", 540, 1300, 50, CREAM, DARK, 10)
    elif name == "PRESS":
        down = ease_out(prog(st, 0.1, 0.45))
        shake = 8 * math.sin(st * 60) * (1 - prog(st, 0.45, 0.8)) if st > 0.45 else 0
        cr.save(); cr.translate(shake, 0)
        for x in (260, 820):
            cr.rectangle(x - 30, 560, 60, 760); fill_stroke(cr, hexc("#7A4B2C"), DARK, 6)
        cr.rectangle(230, 540, 620, 70); fill_stroke(cr, hexc("#6B4128"), DARK, 6)
        py = lerp(700, 1000, down)
        cr.rectangle(520, 600, 40, py - 600); fill_stroke(cr, STONE_D, DARK, 5)
        for k in range(int((py - 600) / 30)):
            cr.move_to(520, 610 + k * 30); cr.line_to(560, 625 + k * 30)
            col(cr, DARK, 0.6); cr.set_line_width(4); cr.stroke()
        cr.rectangle(320, py, 440, 50); fill_stroke(cr, hexc("#8E5B3A"), DARK, 6)
        rrect(cr, 330, 1050, 420, 70 - 30 * down, 10); fill_stroke(cr, TOGA_W, DARK, 5)
        cr.rectangle(280, 1120, 520, 60); fill_stroke(cr, hexc("#6B4128"), DARK, 6)
        cr.restore()

def emperor(cr, x, y, mood="smug", look=0.5):
    # bust with purple toga
    cr.move_to(x - 210, y + 420); cr.curve_to(x - 200, y + 160, x + 200, y + 160, x + 210, y + 420)
    cr.close_path(); fill_stroke(cr, PURPLE, DARK, 7)
    cr.move_to(x - 150, y + 210); cr.line_to(x + 120, y + 420); col(cr, GOLD); cr.set_line_width(18); cr.stroke()
    cr.rectangle(x - 40, y + 90, 80, 90); fill_stroke(cr, SKIN, DARK, 6)
    head(cr, x, y, r=105, mood=mood, look=look, hair=hexc("#6E6A66"), wreath=True)
    # double chin & wrinkles (Vespasian was famously stern)
    cr.arc(x, y + 85, 50, math.pi * 0.2, math.pi * 0.8); col(cr, SKIN_D); cr.set_line_width(5); cr.stroke()
    for k in range(2):
        cr.move_to(x - 40, y - 50 - k * 16); cr.line_to(x + 40, y - 50 - k * 16)
        col(cr, SKIN_D); cr.set_line_width(4); cr.stroke()

def scene_tax(cr, t, t0):
    lt = t - t0
    g = cairo.RadialGradient(540, 900, 50, 540, 900, 1100)
    g.add_color_stop_rgb(0, *hexc("#F4D58A")); g.add_color_stop_rgb(1, *hexc("#B5533A"))
    cr.set_source(g); cr.paint()
    if t < 37.0:
        k = pop(lt, 0.0)
        cr.save(); cr.translate(540, 1000); cr.scale(k, k); amphora(cr, 0, 0, 1.6, 1); cr.restore()
        text(cr, "AND THE URINE?", 540, 420, 100, CREAM, DARK, 14, scale=pop(lt, 0.05))
        stink(cr, 540, 690, t, 3, 200, GREEN, 0.8, 70)
        return
    if t < 40.8:
        st = t - 37.02
        emperor(cr, 540, 780, mood="smug", look=0.0)
        text(cr, "VESPASIAN", 540, 360, 110, GOLD, DARK, 14, serif=True, scale=pop(st, 0.0))
        text(cr, "Emperor, 69–79 AD", 540, 470, 46, CREAM, DARK, 8, scale=pop(st, 0.25))
        # coins raining
        rnd = random.Random(21)
        for i in range(26):
            c0 = rnd.random() * 2.5
            ct = st - c0
            if ct > 0:
                y = min(1460, -60 + 900 * ct * ct + 300 * ct)
                coin(cr, 60 + rnd.random() * 960, y, 34, spin=ct * 8 + i)
        # stamp
        sk = pop(st, 2.0, 0.25)
        if sk > 0:
            cr.save(); cr.translate(540, 1300); cr.rotate(-0.12); cr.scale(2.4 - 1.4 * sk, 2.4 - 1.4 * sk)
            rrect(cr, -300, -80, 600, 160, 14); col(cr, POMP_RED, 0.92); cr.fill()
            rrect(cr, -285, -65, 570, 130, 10); col(cr, CREAM); cr.set_line_width(6); cr.stroke()
            cr.restore()
            text(cr, "URINE TAX", 540, 1300, 92, CREAM, None, 0, scale=2.4 - 1.4 * sk, rot=-0.12)
        return
    # 40.82 – 46.6: coin to the son's nose
    st = t - 40.82
    emperor(cr, 330, 760, mood="smug", look=1.0)
    # son (Titus)
    sx = lerp(1300, 800, ease_out(prog(st, 0.0, 0.5)))
    body(cr, sx, 900, hexc("#C9C0A8"), arms=(0.2, 0.2))
    head(cr, sx, 830, r=70, mood="frown" if st < 2.6 else "squint", look=-1, wreath=False)
    badge(cr, "his son Titus", sx, 1210, st, 0.4, bg=DARK, size=40)
    # arm with coin moving to son's nose
    cp = ease_io(prog(st, 1.3, 2.4))
    cx, cy = lerp(450, sx - 95, cp), lerp(1050, 845, cp)
    cr.move_to(480, 990); cr.line_to(cx - 20, cy + 20)
    cr.set_line_cap(cairo.LINE_CAP_ROUND); col(cr, DARK); cr.set_line_width(44); cr.stroke()
    cr.move_to(480, 990); cr.line_to(cx - 20, cy + 20); col(cr, SKIN); cr.set_line_width(32); cr.stroke()
    coin(cr, cx, cy, 42, spin=0)
    if st > 2.6:  # sniff lines
        for k in range(3):
            ph = (st * 1.5 + k / 3) % 1
            cr.arc(sx - 70 - ph * 50, 840, 20 + ph * 30, math.pi * 0.7, math.pi * 1.3)
            col(cr, DARK, 1 - ph); cr.set_line_width(5); cr.stroke()
    text(cr, "“Does it smell?”", 540, 380, 80, CREAM, DARK, 12, scale=pop(st, 2.2))
    if t >= 45.6:
        k = pop(t, 45.62, 0.3)
        cr.save(); cr.translate(540, 560); cr.scale(k, k)
        rrect(cr, -440, -90, 880, 180, 24); fill_stroke(cr, GOLD, DARK, 7); cr.restore()
        text(cr, "PECUNIA NON OLET", 540, 540, 70, DARK, None, 0, serif=True, scale=k)
        text(cr, "money doesn't stink", 540, 605, 40, POMP_RED, None, 0, scale=k)

def scene_finale(cr, t, t0):
    lt = t - t0
    sky(cr, hexc("#FFF4D6"), hexc("#F7C873"))
    reveal = ease_io(prog(t, 49.2, 50.4))
    zoom = lerp(1.0, 0.62, reveal)
    cr.save(); cr.translate(540, 820); cr.scale(zoom, zoom); cr.translate(-540, -820)
    # rays
    cr.save(); cr.translate(540, 820); cr.rotate(lt * 0.3)
    for k in range(14):
        cr.move_to(0, 0); cr.arc(0, 0, 1400, k * 2 * math.pi / 14, k * 2 * math.pi / 14 + 0.12)
        cr.close_path(); col(cr, (1, 1, 1), 0.35); cr.fill()
    cr.restore()
    # hanger
    cr.move_to(540, 470); cr.line_to(540, 520); col(cr, DARK); cr.set_line_width(10); cr.stroke()
    cr.move_to(360, 580); cr.line_to(540, 520); cr.line_to(720, 580); cr.set_line_width(12); cr.stroke()
    toga(cr, 540, 575, 400, 560, TOGA_W, t, 12)
    for i in range(7):
        ph = (lt * 0.9 + i / 7) % 1
        sparkle(cr, 340 + (i * 151) % 400, 620 + (i * 211) % 480, 34 * math.sin(ph * math.pi), 0.95)
    # tub revealed underneath
    if reveal > 0:
        tub(cr, 540, 1530, rx=420, ry=85, h=300, t=t, wob=0.5)
        stink(cr, 540, 1480, t, 5, 330, GREEN, 0.9 * reveal, 150)
    cr.restore()
    text(cr, "GLEAMING WHITE", 540, 300, 110, POMP_RED, CREAM, 14, scale=pop(lt, 0.05))
    if t > 49.2:
        text(cr, "...thanks to strangers' pee", 540, 430, 60, DARK, CREAM, 10, scale=pop(t, 49.3))

def draw_scene(cr, t):
    if t < 2.7:
        scene_intro(cr, t)
    elif t < 6.9:
        fuller_shop(cr, t, 2.7)
        if t > 5.1:
            text(cr, "Here's what happens next...", 540, 1190, 56, CREAM, DARK, 10, scale=pop(t, 5.1))
    elif t < 11.5:
        scene_tub_drop(cr, t, 6.9)
    elif t < 14.55:
        scene_jars(cr, t, 11.5)
    elif t < 17.5:
        scene_ammonia(cr, t, 14.55)
    elif t < 26.25:
        lt = t - 17.5
        sun_p = 0.15 + 0.15 * prog(t, 17.5, 21.2) + 0.55 * ease_io(prog(t, 21.2, 25.0)) + 0.15 * prog(t, 25, 26.2)
        scene_stomp(cr, t, 17.5, sun_p)
        if t > 21.2 and t < 22.3:
            badge(cr, "FOR HOURS", 540, 300, t, 21.25, bg=POMP_RED, size=80)
        elif t >= 22.3 and t < 23.4:
            badge(cr, "THAT'S THE JOB", 540, 300, t, 22.34, bg=DARK, size=72)
        elif t >= 23.4 and t < 24.5:
            badge(cr, "ALL DAY", 540, 300, t, 23.44, bg=hexc("#3E2F6E"), size=90)
        elif t >= 24.5:
            badge(cr, "ANKLE-DEEP IN PEE", 540, 300, t, 24.51, bg=PEE_D, fg=DARK, size=70)
    elif t < 35.6:
        scene_steps(cr, t, 26.25)
    elif t < 46.55:
        scene_tax(cr, t, 35.6)
    else:
        scene_finale(cr, t, 46.55)

# ---------- captions ----------
def build_chunks():
    chunks, cur = [], []
    for w in WORDS:
        cur.append(w)
        if len(cur) >= 3 or w[0][-1] in ".?!,":
            chunks.append(cur); cur = []
    if cur:
        chunks.append(cur)
    out = []
    for i, c in enumerate(chunks):
        start = c[0][1]
        end = chunks[i + 1][0][1] if i + 1 < len(chunks) else c[-1][2] + 0.6
        end = min(end, c[-1][2] + 0.6)
        out.append((start, end, c))
    return out

CHUNKS = build_chunks()

def captions(cr, t):
    for start, end, ws in CHUNKS:
        if start <= t < end:
            k = pop(t, start, 0.18)
            cr.save()
            cr.select_font_face("DejaVu Sans", cairo.FONT_SLANT_NORMAL, cairo.FONT_WEIGHT_BOLD)
            size = 84
            cr.set_font_size(size)
            parts = [w[0].upper() for w in ws]
            space = cr.text_extents(" ").x_advance
            widths = [cr.text_extents(p).x_advance for p in parts]
            total = sum(widths) + space * (len(parts) - 1)
            if total > 980:
                size *= 980 / total; cr.set_font_size(size)
                widths = [cr.text_extents(p).x_advance for p in parts]
                space = cr.text_extents(" ").x_advance
                total = sum(widths) + space * (len(parts) - 1)
            y = 1600
            cr.translate(540, y); cr.scale(k, k); cr.translate(-540, -y)
            x = 540 - total / 2
            for p, wdt, w in zip(parts, widths, ws):
                active = w[1] <= t < w[2] + 0.05
                cr.move_to(x, y + size * 0.35)
                cr.text_path(p)
                cr.set_line_join(cairo.LINE_JOIN_ROUND)
                col(cr, DARK); cr.set_line_width(16); cr.stroke_preserve()
                col(cr, GOLD if active else (1, 1, 1)); cr.fill()
                x += wdt + space
            cr.restore()
            break

def vignette(cr):
    g = cairo.RadialGradient(540, 960, 600, 540, 960, 1250)
    g.add_color_stop_rgba(0, 0, 0, 0, 0); g.add_color_stop_rgba(1, 0, 0, 0, 0.35)
    cr.set_source(g); cr.paint()

def frame(t):
    surf = cairo.ImageSurface(cairo.FORMAT_ARGB32, W, H)
    cr = cairo.Context(surf)
    # subtle cut "punch" at scene starts
    cuts = [2.7, 6.9, 11.5, 14.55, 17.5, 26.25, 35.6, 37.02, 40.82, 46.55]
    punch = 1.0
    ta = warp(t)
    for c in cuts:
        if 0 <= ta - c < 0.22:
            punch = 1.0 + 0.05 * (1 - (ta - c) / 0.22)
    drift = 1.0 + 0.01 * math.sin(t * 0.7)
    s = punch * drift
    cr.translate(540, 960); cr.scale(s, s); cr.translate(-540, -960)
    draw_scene(cr, ta)
    cr.identity_matrix()
    vignette(cr)
    captions(cr, t)
    # channel tag
    text(cr, "ORDINARY LIVES", 540, 1840, 34, CREAM, DARK, 6, alpha=0.8)
    if t > DUR - 0.5:  # fade out
        cr.set_source_rgba(0, 0, 0, prog(t, DUR - 0.5, DUR)); cr.paint()
    return surf

if __name__ == "__main__":
    if ONLY is not None:
        frame(ONLY).write_to_png(OUT)
        sys.exit()
    n = int(DUR * FPS)
    ff = subprocess.Popen([
        "ffmpeg", "-y", "-loglevel", "error",
        "-f", "rawvideo", "-pix_fmt", "bgra", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
        "-i", "voice.mp3",
        "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p",
        "-c:a", "aac", "-b:a", "192k", "-af", "apad", "-t", str(DUR),
        "-movflags", "+faststart", OUT], stdin=subprocess.PIPE)
    for i in range(n):
        ff.stdin.write(bytes(frame(i / FPS).get_data()))
        if i % 150 == 0:
            print(f"{i}/{n}", flush=True)
    ff.stdin.close(); ff.wait()
    print("done", ff.returncode)
