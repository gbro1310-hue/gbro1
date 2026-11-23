"""Folk score + ambience + foley + channel voice → out/mix.wav (48 kHz stereo). All synthesised except the voice."""
import os, sys
import numpy as np
HERE = os.path.dirname(os.path.abspath(__file__))
LIB = os.environ.get("LIB", "/root/lemo-opuscar")
sys.path.insert(0, os.path.join(LIB, "core", "audio"))
from sfx import SR, t_, env_exp, bp, lp, hp, noise, norm, brown, add, compress, limit, whoosh, step, ding, roar  # noqa: E402
import soundfile as sf  # noqa: E402

DUR = 56.4
N = int(DUR * SR) + SR
mus = np.zeros((N, 2)); fol = np.zeros((N, 2)); amb = np.zeros((N, 2))
rng = np.random.default_rng(7)
SH = dict(map=0, dozen=5.1, law=10.1, light=22.2, price=28.4, sunday=37.2, steam=42.6, day=50.3, end=56.4)

def fade(x, a=.3, b=.3):
    n = len(x); ia, ib = min(n, int(a * SR)), min(n, int(b * SR))
    if ia: x[:ia] *= np.linspace(0, 1, ia)
    if ib: x[-ib:] *= np.linspace(1, 0, ib)
    return x
def span(a, b): return b - a

# —— lute: Karplus–Strong plucks ——
def pluck(f, d=1.6, bright=.5):
    n = int(d * SR); p = max(2, int(SR / f)); buf = rng.uniform(-1, 1, p); out = np.zeros(n)
    for i in range(n):
        out[i] = buf[i % p]; buf[i % p] = .996 * .5 * (buf[i % p] + buf[(i + 1) % p])
    out = lp(out, 3200) * np.minimum(1, t_(d)[:n] / .002)
    return out.astype(np.float32)
D4 = 293.66
SC = {k: D4 * 2 ** (s / 12) for k, s in dict(D=0, E=2, F=3, G=5, A=7, B=9, C=10, d=12, e=14, f=15, g=17, a=19, A2=-5, D2=-12, C2=-14).items()}
_cache = {}
def note(n, d=1.6):
    k = (n, d)
    if k not in _cache: _cache[k] = pluck(SC[n], d)
    return _cache[k]
beat = 60 / 84
MEL = 'D A d f e d A C D F E D A2 C D -'.split()
def lute(a, b, gain=.22, bass=True, mel=MEL):
    t = a; i = 0
    while t < b - .2:
        n = mel[i % len(mel)]
        if n != '-': add(mus, note(n), t, gain, -.2 + .4 * ((i % 3) / 2))
        if bass and i % 4 == 0: add(mus, note('D2' if (i // 8) % 2 == 0 else 'C2', 2.4), t, gain * .9, .15)
        t += beat * (1 if i % 4 != 3 else 2) * .5 + beat * .5; i += 1

# —— drone (recorder-ish pad) ——
def pad(d, f=146.83, k=(1, 1.5, 2)):
    x = t_(d); vib = 1 + .004 * np.sin(2 * np.pi * 4.6 * x)
    y = sum(a * np.sin(2 * np.pi * f * m * vib * x) for m, a in zip(k, (1, .4, .25)))
    return lp(y, 1600).astype(np.float32)

# score layout
lute(.3, SH['law'] - .4, .2)                                   # pre-dawn: quiet lute
add(mus, fade(pad(span(SH['law'], SH['light'] + .5), 110), 1.5, 1.2), SH['law'], .05, 0)   # the law: only a low pad
lute(SH['light'] + .3, SH['sunday'] - .3, .26)                 # first light → bathhouse: lute returns
add(mus, fade(pad(span(SH['light'], SH['sunday']), 146.83), 2, 1.0), SH['light'], .03, 0)
lute(SH['steam'] + .2, SH['day'] + 1.6, .2, mel='D F A d A F E C D A2 D -'.split())
for i, n in enumerate(['D2', 'A2', 'D', 'F', 'A', 'd']):       # title: a rolled final chord
    add(mus, note(n, 4.5), 52.4 + i * .07, .3, -.3 + i * .12)

# —— ambience ——
night = fade(lp(hp(brown(span(0, SH['light'] + 3)), 90), 600).astype(np.float32), .4, 3)
add(amb, night, 0, .09, -.2); add(amb, night[::-1].copy(), 0, .07, .25)
def bark(): x = t_(.18); y = np.sin(2 * np.pi * (520 - 900 * x) * x) * env_exp(.18, .05); return lp(y + .3 * noise(.18) * env_exp(.18, .03), 2200).astype(np.float32)
for t in (3.2, 3.55, 14.2): add(amb, bark(), t, .05, .7)      # a distant dog
def chirp(f0=3200):
    d = .09 + rng.random() * .08; x = t_(d); f = f0 * (1 + .35 * np.sin(np.pi * x / d))
    return (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * x / d) ** 2).astype(np.float32)
for a, b, dens in ((24.0, SH['price'], 4), (SH['day'], DUR - .5, 6)):
    t = a
    while t < b: add(amb, chirp(2600 + rng.random() * 1800), t, .04, rng.uniform(-.8, .8)); t += rng.exponential(1 / dens)
# inside: furnace roar + crackle, steam hiss, water
def crackle(d, dens=14):
    x = np.zeros(int(d * SR))
    for _ in range(int(d * dens)):
        p = rng.integers(0, len(x) - 700); L = rng.integers(60, 500); x[p:p + L] += rng.standard_normal(L) * np.exp(-np.arange(L) / (L / 4)) * (.3 + rng.random())
    return hp(x, 900).astype(np.float32)
for a, b in ((SH['price'], SH['sunday']), (SH['steam'], SH['day'])):
    d = span(a, b)
    add(amb, fade(lp(brown(d), 220).astype(np.float32), .3, .3), a, .22, -.3)
    add(amb, fade(crackle(d), .3, .3), a, .08, -.4)
    add(amb, fade(bp(noise(d), 3000, 9000).astype(np.float32) * (.6 + .4 * np.sin(np.linspace(0, 9, len(t_(d))))) , .5, .5), a, .025, .2)
def drip(): x = t_(.12); return (np.sin(2 * np.pi * (900 + 1400 * x) * x) * env_exp(.12, .02)).astype(np.float32)
for t in (30.2, 31.7, 33.9, 35.4, 36.4, 44.1, 46.6, 48.2): add(fol, drip(), t, .07, .4)
splash = fade(bp(noise(1.2), 300, 4000).astype(np.float32) * env_exp(1.2, .35), .02, .3)
add(fol, splash, 35.3, .12, .35)
# Sunday: church bell, slow tolls, nothing else
def bell(f=196.0, d=4.0):
    x = t_(d); y = sum(a * np.sin(2 * np.pi * f * m * x) * np.exp(-x / (2.4 / m ** .5)) for m, a in ((.5, .6), (1, 1), (1.19, .5), (1.56, .4), (2.0, .3), (2.74, .2)))
    return (y * np.minimum(1, x / .003)).astype(np.float32)
for i, t in enumerate((SH['sunday'] + .2, SH['sunday'] + 2.0, SH['sunday'] + 3.8)): add(mus, bell(), t, .2 - i * .03, -.2)
add(amb, fade(lp(hp(brown(span(SH['sunday'], SH['steam'])), 80), 500).astype(np.float32), .3, .3), SH['sunday'], .08, 0)
# day murmur
add(amb, fade(bp(noise(span(SH['day'], DUR)), 250, 1400).astype(np.float32) * (.7 + .3 * np.sin(np.linspace(0, 23, len(t_(span(SH['day'], DUR)))))), .5, .8), SH['day'], .03, 0)

# —— foley ——
def cob(v=1.0): return (step(v)[:int(.18 * SR)] if len(step(v)) > int(.18 * SR) else step(v)).astype(np.float32)
for t in np.arange(23.2, 26.6, .37): add(fol, cob(), t, .22, .3)          # crier on the cobbles
for t in np.arange(19.15, 19.9, .33): add(fol, cob(.7), t, .14, -.1)       # someone in the alley
for t in np.arange(50.45, 56.0, .34): add(fol, cob(.8), t, .14, -.2)       # you, walking out
for t in (11.0, 26.5, 28.6, 28.76, 34.98, 37.5): add(fol, ding(.5).astype(np.float32), t, .1, 0)   # UI chimes
add(fol, ding(.7).astype(np.float32), 52.4, .1, 0)
for t in (SH['price'], SH['steam'], SH['day']): add(fol, whoosh(.35, .6).astype(np.float32), t - .2, .12, 0)
# the crier's shout under the narrator's line: a far, wet echo
shout = fade(bp(noise(.9), 500, 2400).astype(np.float32) * env_exp(.9, .3), .05, .2)
add(fol, shout, 26.9, .05, .5); add(fol, shout * .5, 27.25, .04, -.5)

# —— voice ——
vo, vsr = sf.read(os.path.join(HERE, "voice.wav"))
if vo.ndim > 1: vo = vo.mean(1)
assert vsr == SR, vsr
vo = norm(compress(vo.astype(np.float32), thr=.2, ratio=3.0), .9)
voice = np.zeros((N, 2)); add(voice, vo, 0, 1.0, 0)
env = np.abs(vo); k = int(SR * .15)
env = np.convolve(env, np.ones(k) / k, "same"); env = np.clip(env / (env.max() * .25), 0, 1)
duck = np.ones(N); duck[:len(env)] = 1 - env * (1 - 10 ** (-9 / 20))
duckf = np.ones(N); duckf[:len(env)] = 1 - env * (1 - 10 ** (-4 / 20))
mix = voice * .9 + mus * duck[:, None] + (fol + amb) * duckf[:, None]
mix[int((DUR - .3) * SR):] *= np.linspace(1, 0, len(mix) - int((DUR - .3) * SR))[:, None]
mix = np.stack([limit(mix[:, 0], .95), limit(mix[:, 1], .95)], 1)
os.makedirs(os.path.join(HERE, "out"), exist_ok=True)
sf.write(os.path.join(HERE, "out", "mix.wav"), mix[:int(DUR * SR)].astype(np.float32), SR)
print("mix written", DUR)
