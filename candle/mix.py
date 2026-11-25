"""Folk score + ambience + foley + channel voice → out/mix.wav (48 kHz stereo). All synthesised except the voice (starts at 1.0 s)."""
import os, sys, json
import numpy as np
HERE = os.path.dirname(os.path.abspath(__file__))
LIB = os.environ.get("LIB", "/root/lemo-opuscar")
sys.path.insert(0, os.path.join(LIB, "core", "audio"))
from sfx import SR, t_, env_exp, bp, lp, hp, noise, norm, brown, add, compress, limit, whoosh, step, ding, thump, creak, click  # noqa: E402
import soundfile as sf  # noqa: E402

DUR = 57.0; VO = 1.0
N = int(DUR * SR) + SR
mus = np.zeros((N, 2)); fol = np.zeros((N, 2)); amb = np.zeros((N, 2))
rng = np.random.default_rng(11)
T = dict(card=.6, gold=8.3, half=9.6, lockIn=11.6, lockNo=12.6, law=17.5, statute=18.9, forbid=23.0, candleLit=24.4, reason=25.0, day=26.8, worse=29.1,
         yellow=31.0, stitch=32.85, straight=34.4, needleDown=37.6, june=39.0, dec=41.3, eight=45.05, grow0=45.2, grow1=47.4, title=52.6)
CUTS = [5.9, 10.0, 14.3, 18.3, 24.4, 36.1, 45.0, 47.9]
def fade(x, a=.3, b=.3):
    n = len(x); ia, ib = min(n, int(a * SR)), min(n, int(b * SR))
    if ia: x[:ia] *= np.linspace(0, 1, ia)
    if ib: x[-ib:] *= np.linspace(1, 0, ib)
    return x

# —— lute (Karplus–Strong) ——
def pluck(f, d=1.6):
    n = int(d * SR); p = max(2, int(SR / f)); buf = rng.uniform(-1, 1, p); out = np.zeros(n)
    for i in range(n):
        out[i] = buf[i % p]; buf[i % p] = .996 * .5 * (buf[i % p] + buf[(i + 1) % p])
    return (lp(out, 3200) * np.minimum(1, t_(d)[:n] / .002)).astype(np.float32)
D4 = 293.66
SC = {k: D4 * 2 ** (s / 12) for k, s in dict(D=0, E=2, F=3, G=5, A=7, B=9, C=10, d=12, e=14, f=15, g=17, a=19, A2=-5, G2=-7, F2=-9, D2=-12, C2=-14, Bb2=-4).items()}
_cache = {}
def note(n, d=1.6):
    k = (n, d)
    if k not in _cache: _cache[k] = pluck(SC[n], d)
    return _cache[k]
beat = 60 / 80
MEL_A = 'D A d f e d A C D F E D A2 C D -'.split()
MEL_B = 'D F A d A F E C D A2 D -'.split()
MEL_C = 'A d e f g f e d e d C A d - - -'.split()
MEL_D = 'F A C d C A G E F D E C D - - -'.split()
def lute(a, b, gain=.2, mel=MEL_A, bass=True, sparse=1):
    t = a; i = 0
    while t < b - .2:
        n = mel[i % len(mel)]
        if n != '-' and (i % sparse == 0): add(mus, note(n), t, gain, -.25 + .5 * ((i % 3) / 2))
        if bass and i % 4 == 0: add(mus, note('D2' if (i // 8) % 2 == 0 else 'C2', 2.4), t, gain * .85, .15)
        t += beat * (1 if i % 4 != 3 else 2) * .5 + beat * .5; i += 1
def pad(d, f=146.83, k=(1, 1.5, 2)):
    x = t_(d); vib = 1 + .004 * np.sin(2 * np.pi * 4.6 * x)
    return lp(sum(a * np.sin(2 * np.pi * f * m * vib * x) for m, a in zip(k, (1, .4, .25))), 1600).astype(np.float32)
def chord(at, ns, g=.26, d=4.5, sp=.07):
    for i, n in enumerate(ns): add(mus, note(n, d), at + i * sp, g, -.3 + i * .12)

# score: quiet lute; it stops for the candle and comes back with the daylight
lute(.4, 18.0, .13, MEL_A, bass=True)
add(mus, fade(pad(36.1 - 18.3, 98.0), 1.5, 1.5), 18.3, .05, 0)          # statute + candle: only a low pad
lute(36.4, 44.8, .14, MEL_C)
chord(T['eight'], ['D2', 'A2', 'D', 'A', 'd', 'f'], .24, 3.0)
lute(48.2, 56.0, .12, MEL_B, sparse=1)
chord(T['title'], ['D2', 'A2', 'D', 'F', 'A', 'd', 'f'], .28, 4.5, .1)
# —— ambience ——
def chirp(f0=3200):
    d = .09 + rng.random() * .08; x = t_(d); f = f0 * (1 + .35 * np.sin(np.pi * x / d))
    return (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * x / d) ** 2).astype(np.float32)
def birds(a, b, dens, g=.035):
    t = a
    while t < b: add(amb, chirp(2600 + rng.random() * 1800), t, g, rng.uniform(-.8, .8)); t += rng.exponential(1 / dens)
def murmur(a, b, g=.03):
    d = b - a; x = bp(noise(d), 250, 1400).astype(np.float32) * (.7 + .3 * np.sin(np.linspace(0, d * .4, len(t_(d)))))
    add(amb, fade(x, .6, .6), a, g, 0)
def wind(a, b, g=.08):
    d = b - a; x = fade(lp(hp(brown(d), 90), 600).astype(np.float32), .5, .8); add(amb, x, a, g, -.2); add(amb, x[::-1].copy(), a, g * .8, .25)
def room(a, b, g=.05):
    d = b - a; add(amb, fade(lp(brown(d), 300).astype(np.float32), .4, .4), a, g, 0)
def wind(a, b, g=.08):
    d = b - a; x = fade(lp(hp(brown(d), 90), 600).astype(np.float32), .5, .8); add(amb, x, a, g, -.2); add(amb, x[::-1].copy(), a, g * .8, .25)
def room(a, b, g=.05):
    d = b - a; add(amb, fade(lp(brown(d), 300).astype(np.float32), .4, .4), a, g, 0)
room(0, DUR, .05); birds(0, 6, .8, .014); wind(18.3, 36.1, .05); birds(48, 56, .5, .01)
def bell(f=196.0, d=5.0):
    x = t_(d); y = sum(a * np.sin(2 * np.pi * f * m * x) * np.exp(-x / (2.6 / m ** .5)) for m, a in ((.5, .6), (1, 1), (1.19, .5), (1.56, .4), (2.0, .3), (2.74, .2)))
    return (y * np.minimum(1, x / .003)).astype(np.float32)
def coins(n=3):
    out = np.zeros(int(.6 * SR), np.float32)
    for i in range(n):
        x = t_(.25); y = sum(np.sin(2 * np.pi * f * x) * np.exp(-x / .06) for f in (2800 + i * 170, 4100 + i * 230, 5900)); s = int(i * .09 * SR); out[s:s + len(y)] += (y * .3).astype(np.float32)[:len(out) - s]
    return out
# —— foley + UI ——
add(fol, fade(bp(noise(.5), 1500, 7000).astype(np.float32) * env_exp(.5, .12), .005, .1), T['candleLit'] + .05, .16, .3)   # the (imagined) strike
add(fol, (np.sin(2 * np.pi * 4200 * t_(.8)) * env_exp(.8, .25) * .4 + np.sin(2 * np.pi * 6300 * t_(.8)) * env_exp(.8, .15) * .2).astype(np.float32), T['gold'], .05, -.3)
for t in (T['card'], T['half'] - .2, T['lockIn'], T['law'] - .4, T['statute'] - .3, T['reason'], T['june'] - .3): add(fol, ding(.45).astype(np.float32), t, .08, 0)
for t in (T['day'] + .5, T['straight']): add(fol, ding(.6).astype(np.float32), t, .07, .1)
x = t_(.22); buzz = (np.sign(np.sin(2 * np.pi * 110 * x)) * env_exp(.22, .08) * .4).astype(np.float32); add(fol, lp(buzz, 1800).astype(np.float32), T['lockNo'], .12, 0)   # locked
add(fol, thump(1.0, 60).astype(np.float32), T['forbid'], .3, 0); add(fol, thump(1.0, 70).astype(np.float32), T['worse'], .14, 0)
add(fol, coins(1), T['stitch'] + .2, .06, 0)
add(fol, fade(bp(noise(.4), 2000, 6000).astype(np.float32) * env_exp(.4, .1), .005, .1), T['needleDown'], .08, -.2)   # the needle laid down
for t in np.arange(T['grow0'], T['grow1'] + .05, (T['grow1'] - T['grow0']) / 7): add(fol, ding(.35).astype(np.float32), t, .05, -.1)
for i, t in enumerate((T['june'] + 2.6,)): add(mus, bell(), t, .1, -.3)
for c in CUTS: add(fol, whoosh(.35, .5).astype(np.float32), c - .25, .07, 0)

# —— voice ——
vo, vsr = sf.read(os.path.join(HERE, "voice.wav"))
if vo.ndim > 1: vo = vo.mean(1)
assert vsr == SR, vsr
vo = norm(compress(vo.astype(np.float32), thr=.2, ratio=3.0), .9)
voice = np.zeros((N, 2)); add(voice, vo, VO, 1.0, 0)
env = np.zeros(N); a0 = int(VO * SR); env[a0:a0 + len(vo)] = np.abs(vo)
k = int(SR * .15); env = np.convolve(env, np.ones(k) / k, "same"); env = np.clip(env / (env.max() * .25), 0, 1)
duck = 1 - env * (1 - 10 ** (-9 / 20)); duckf = 1 - env * (1 - 10 ** (-4 / 20))
mix = voice * .9 + mus * duck[:, None] + (fol + amb) * duckf[:, None]
e = int((DUR - .7) * SR); mix[e:] *= np.linspace(1, 0, len(mix) - e)[:, None]
mix = np.stack([limit(mix[:, 0], .95), limit(mix[:, 1], .95)], 1)
os.makedirs(os.path.join(HERE, "out"), exist_ok=True)
sf.write(os.path.join(HERE, "out", "mix.wav"), mix[:int(DUR * SR)].astype(np.float32), SR)
print("mix written", DUR)
