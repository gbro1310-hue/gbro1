"""Shared cairo drawing helpers for Ordinary Lives animations."""
import math, random
import cairo

W, H = 1920, 1080

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

