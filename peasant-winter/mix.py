"""Score + foley + voice → out/mix.wav (48 kHz stereo). All synthesised; voice = channel ElevenLabs take."""
import json, os, subprocess, sys
import numpy as np
HERE = os.path.dirname(os.path.abspath(__file__))
LIB = os.environ.get("LIB", "/root/lemo-opuscar")
sys.path.insert(0, os.path.join(LIB, "core", "audio"))
from sfx import SR, t_, env_exp, bp, lp, hp, noise, norm, brown, add, compress, limit, thump, whoosh  # noqa: E402
import soundfile as sf  # noqa: E402

ev = json.load(open(os.path.join(HERE, "events.json")))
DUR = ev["dur"]; EV = ev["ev"]
N = int(DUR * SR) + SR
mus = np.zeros((N, 2)); fol = np.zeros((N, 2)); amb = np.zeros((N, 2))
rng = np.random.default_rng(3)
T = lambda typ: [e["t"] for e in EV if e["type"] == typ]
cuts = {e["id"]: e["t"] for e in EV if e["type"] in ("cut", "open")}

def tone(f, d, partials=((1, 1),), tau=1.0, att=.01):
    x = t_(d); y = sum(a * np.sin(2 * np.pi * f * k * x + rng.random() * 6) for k, a in partials)
    return (y * np.minimum(1, x / att) * np.exp(-x / tau)).astype(np.float32)

# ---- ambience: winter wind, the whole film, swells at outdoor-ish plates ----
w = lp(hp(brown(DUR + 1), 80), 700) * .9
wm = .55 + .45 * np.sin(np.arange(len(w)) / SR * .35) ** 2
add(amb, (w * wm).astype(np.float32), 0, .10, -.2)
add(amb, (lp(hp(brown(DUR + 1), 120), 900) * wm[::-1]).astype(np.float32), 0, .08, .25)

# ---- fire bed (hearth plate + banking) and in the house plate, quieter ----
def crackle(d, dens=18):
    x = np.zeros(int(d * SR))
    for _ in range(int(d * dens)):
        p = rng.integers(0, len(x) - 2000); L = rng.integers(60, 600)
        x[p:p + L] += rng.standard_normal(L) * np.exp(-np.arange(L) / (L / 4)) * (.3 + rng.random())
    b = lp(brown(d), 300); n = min(len(x), len(b))
    return (hp(x, 900)[:n] + .5 * b[:n] * .3).astype(np.float32)
f_on, f_off = T("fireOn")[0], T("fireOff")[0]
fb = crackle(f_off - f_on + 1.5); fb *= np.minimum(1, np.arange(len(fb)) / (SR * .4)); fb[-int(SR * 1.2):] *= np.linspace(1, 0, int(SR * 1.2))
add(fol, fb, f_on, .32, .1)
hb = crackle(cuts["heat"] - cuts["house"]); add(fol, hb, cuts["house"], .12, .05)

# ---- cow breathing (house, heat, sleep, end) ----
def breath(d=2.4):
    n = lp(hp(noise(d), 150), 900); x = t_(d)
    e = np.sin(np.pi * np.clip(x / d, 0, 1)) ** 1.5
    return (n * e).astype(np.float32)
for a, b, g in [(cuts["eye"], cuts["house"], .5), (cuts["heat"], cuts["hearth"], .35), (cuts["sleep"], DUR - .8, .4)]:
    t = a + .3
    while t < b - 1.5: add(fol, breath(2.0), t, g, -.3); t += 3.3 if a == cuts["sleep"] else 2.9

# ---- straw rustle on the sleepers ----
for t in (cuts["sleep"] + .4, cuts["sleep"] + 3.1):
    add(fol, (hp(noise(.9), 2500) * env_exp(.9, .25)).astype(np.float32), t, .12, .2)

# ---- shovel scrapes ----
for t in T("scrape"):
    s = bp(noise(.6), 1200, 5000) * np.sin(np.pi * np.clip(t_(.6) / .6, 0, 1)) ** .7
    add(fol, s.astype(np.float32), t, .22, .15)

# ---- impressions (hard cut = a new print): knife-on-wood + paper ----
def impress():
    k = thump(1.0, 90)[:int(SR * .3)] * .9
    c = bp(noise(.12), 1500, 6000) * env_exp(.12, .02)
    out = np.zeros(int(SR * .4)); out[:len(k)] += k; out[:len(c)] += c * .6
    return out.astype(np.float32)
for t in T("impress"): add(fol, impress(), t, .45, -.15)
for e in EV:
    if e["type"] == "cut" and e["id"] not in ("bell",): add(fol, (bp(noise(.08), 2000, 7000) * env_exp(.08, .015)).astype(np.float32), e["t"], .18, .2)

# ---- music: drone in D + log drum + low pizzicato; near-silence before the bell; bell = loudest ----
def drone(d, f=73.42):
    x = t_(d); vib = 1 + .003 * np.sin(2 * np.pi * 5.2 * x)
    y = sum(a * np.sign(np.sin(2 * np.pi * f * k * vib * x)) * .25 + a * np.sin(2 * np.pi * f * k * vib * x)
            for k, a in ((1, 1), (2, .5), (3, .35), (4, .2), (1.5, .3)))
    return lp(y, 1400).astype(np.float32)
bell_t = T("bell")[0]
d1 = drone(bell_t - .9 - cuts["house"])
d1 *= np.minimum(1, np.arange(len(d1)) / (SR * 2.0)); d1[-int(SR * 1.5):] *= np.linspace(1, 0, int(SR * 1.5))
add(mus, d1, cuts["house"], .05, 0)
d2 = drone(DUR - cuts["nov"] - .6, 73.42 * .75)
d2 *= np.minimum(1, np.arange(len(d2)) / (SR * 1.0)); d2[-int(SR * 3.5):] *= np.linspace(1, 0, int(SR * 3.5)) ** 2
add(mus, d2, cuts["nov"], .045, 0)
def logdrum(f=110, v=1.0):
    out = tone(f, .5, ((1, 1), (2.3, .3), (3.9, .15)), tau=.12) * v
    hit = bp(noise(.03), 400, 2000) * env_exp(.03, .006) * .4; out[:len(hit)] += hit
    return out.astype(np.float32)
for name in ("house", "heat", "hearth", "bank", "nov", "sleep"):
    add(mus, logdrum(98 if name in ("nov",) else 110), cuts[name], .35, -.1)
beat = 60 / 72
t = cuts["heat"]; notes = [73.42, 87.31, 98.0, 73.42, 65.41, 73.42]; i = 0
while t < cuts["bank"] + 2:
    p = tone(notes[i % len(notes)], .9, ((1, 1), (2, .4), (3, .15)), tau=.25, att=.004)
    add(mus, p, t, .16, -.25 + .5 * (i % 2)); t += beat * 2; i += 1
for t in T("impress")[1:]: add(mus, logdrum(82, 1.2), t, .4, 0)

# bell: modal, inharmonic, long decay
bell = tone(220, 9, ((.5, .6), (1, 1), (1.19, .5), (1.56, .45), (2.0, .35), (2.74, .25), (3.76, .12)), tau=2.6, att=.002)
add(mus, bell.astype(np.float32), bell_t, .55, .1)
add(mus, (bell * .4).astype(np.float32), bell_t + .23, .25, -.4)   # echo off the walls

# ---- voice ----
vo, vsr = sf.read(os.path.join(HERE, "voice.wav"))
if vo.ndim > 1: vo = vo.mean(1)
assert vsr == SR, vsr
vo = compress(vo.astype(np.float32), thr=.2, ratio=3.0)
vo = norm(vo, .9)
voice = np.zeros((N, 2)); add(voice, vo, 0, 1.0, 0)

# ducking: music −8 dB and foley −4 dB under voice
env = np.abs(vo); k = int(SR * .15)
env = np.convolve(env, np.ones(k) / k, "same"); env = np.clip(env / (env.max() * .25), 0, 1)
duck = np.ones(N); duck[:len(env)] = 1 - env * (1 - 10 ** (-8 / 20))
duckf = np.ones(N); duckf[:len(env)] = 1 - env * (1 - 10 ** (-4 / 20))
mix = voice * .9 + mus * duck[:, None] + fol * duckf[:, None] + amb * duckf[:, None]
mix[int((DUR - .6) * SR):] *= 0                                  # true silence on the last beat
mix = limit(mix, .95) if mix.ndim == 1 else np.stack([limit(mix[:, 0], .95), limit(mix[:, 1], .95)], 1)
os.makedirs(os.path.join(HERE, "out"), exist_ok=True)
sf.write(os.path.join(HERE, "out", "mix.wav"), mix[:int(DUR * SR)].astype(np.float32), SR)
print("mix written", DUR)
