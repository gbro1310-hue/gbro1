"""Folk score + ambience + foley + channel voice → out/mix.wav (48 kHz stereo). All synthesised except the voice (starts at 1.0 s)."""
import os, sys, json
import numpy as np
HERE = os.path.dirname(os.path.abspath(__file__))
LIB = os.environ.get("LIB", "/root/lemo-opuscar")
sys.path.insert(0, os.path.join(LIB, "core", "audio"))
from sfx import SR, t_, env_exp, bp, lp, hp, noise, norm, brown, add, compress, limit, whoosh, step, ding, thump, creak, click  # noqa: E402
import soundfile as sf  # noqa: E402

DUR = 387.0; VO = 1.0
N = int(DUR * SR) + SR
mus = np.zeros((N, 2)); fol = np.zeros((N, 2)); amb = np.zeros((N, 2))
rng = np.random.default_rng(11)
T = dict(quest=7.6, gold=28.1, party=30.0, title=37.9, ch1=41.0, book=49.8, trades0=58.6, jures=63.6, q1ok=76.6, q2ok=80.5, slots=86.3, slotYou=96.4,
         witness=100.6, pays=109.9, bars=116.5, barsLong=120.4, statute=127.9, eight=138.9, ch2=141.8, june=157.6, dec=159.8, candleLit=166.6, rule=170.6, snuff=173.8,
         nightPanel=187.6, fetch=204.9, wind=206.6, watch=209.5, ch3=214.5, cal=216.0, sunday=218.3, sat=226.7, bell=232.0, ch4=241.0, knock=242.6,
         thread=253.2, materials=254.05, seize=258.2, fine=260.2, ch5=285.0, year0=286.4, year1=299.6, needleHold=292.3, plain=294.0, looked=296.3, journey=304.6,
         wage=307.2, become=318.5, skill=320.5, money=323.0, oath=327.6, needleDown=361.2, endTitle=368.6, sub=375.4)
SH = [('open', 0, 11.1), ('frame', 11.1, 29.5), ('master', 29.5, 40.2), ('trades', 40.2, 69.6), ('jures1', 69.6, 99.3), ('contract', 99.3, 141.6), ('window', 141.6, 165.3),
      ('candle', 165.3, 187.0), ('night', 187.0, 199.4), ('chores', 199.4, 214.3), ('week', 214.3, 240.9), ('knock', 240.9, 244.5), ('inspect', 244.5, 265.8),
      ('signs', 265.8, 279.6), ('still', 279.6, 284.9), ('years', 284.9, 306.2), ('leave', 306.2, 316.5), ('mastery', 316.5, 342.6), ('end', 342.6, 387.0)]

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

# score
lute(.6, 40.0, .16, MEL_A)
chord(T['title'], ['D2', 'A2', 'D', 'F', 'A', 'd'], .28)
lute(41.4, 69.4, .15, MEL_B)
add(mus, fade(pad(69.6 - 41.0, 146.83), 2, 1.5), 41.0, .025, 0)
add(mus, fade(pad(141.6 - 69.6, 110.0), 2.5, 2.0), 69.6, .045, 0)               # contract: low pad, sparse lute
lute(70.0, 141.0, .11, MEL_D, bass=False, sparse=2)
chord(T['eight'], ['D2', 'A2', 'D', 'A', 'd', 'f'], .24, 3.5)
lute(142.2, 165.0, .17, MEL_C)
add(mus, fade(pad(199.4 - 165.3, 98.0), 2, 2.5), 165.3, .05, 0)                 # candle / night: only a pad
lute(199.8, 240.4, .15, MEL_A)
add(mus, fade(pad(284.9 - 240.9, 73.42, (1, 2, 3)), 1, 2.5), 240.9, .06, 0)     # the knock: low drone
for t in np.arange(244.6, 265.4, beat * 2): add(mus, note('D2', 1.2), t, .12, 0)   # slow pulse under the inspection
lute(285.4, 342.0, .16, MEL_C)
for i, n in enumerate(['D', 'F', 'A', 'd', 'f', 'a']): add(mus, note(n, 2.5), T['journey'] + i * .09, .22, -.4 + i * .16)   # class change
lute(343.0, 368.0, .13, MEL_B, sparse=1)
chord(T['endTitle'], ['D2', 'A2', 'D', 'F', 'A', 'd', 'f'], .3, 6.0, .1)
lute(371.0, 385.5, .11, MEL_A, bass=False, sparse=2)
for ch in ('ch1', 'ch2', 'ch3', 'ch4', 'ch5'): chord(T[ch] + .05, ['D2', 'A2', 'D'], .2, 3.0, .12)

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
for name, a, b in SH:
    if name in ('open',): birds(a + 1, b, 3); wind(a, b, .05)
    if name in ('trades', 'signs', 'leave'): birds(a, b, 4); murmur(a, b, .035)
    if name == 'week': birds(a, 226, 4); murmur(a, b, .03)
    if name == 'mastery': birds(a, b, 1.5, .025); murmur(a, b, .02)
    if name == 'knock': murmur(a, b, .02)
    if name == 'night': wind(a, b, .1)
    if name in ('frame', 'master', 'jures1', 'contract', 'window', 'chores', 'inspect', 'still', 'years', 'end'): room(a, b, .05); birds(a, b, .7, .012)
    if name == 'candle': room(a, b, .05); wind(a, b, .04)
def bark(): x = t_(.18); y = np.sin(2 * np.pi * (520 - 900 * x) * x) * env_exp(.18, .05); return lp(y + .3 * noise(.18) * env_exp(.18, .03), 2200).astype(np.float32)
for t in (190.2, 190.55, 196.0): add(amb, bark(), t, .04, .7)

# —— foley ——
def cob(v=1.0): s = step(v); return s[:int(.18 * SR)].astype(np.float32)
def wood(v=1.0): s = step(v); return lp(s[:int(.16 * SR)], 900).astype(np.float32)
for t in np.arange(.9, 10.2, .42): add(fol, cob(.9), t, .16, -.2)                 # your father on the cobbles
for t in np.arange(1.1, 10.2, .33): add(fol, cob(.6), t, .09, -.1)                # your shorter steps
for t in np.arange(12.1, 18.5, .38): add(fol, wood(.8), t, .14, .3)                # into the workshop
for t in np.arange(63.3, 69.4, .4): add(fol, cob(.8), t, .12, .3)                 # the jurés in the street
for t in np.arange(200.1, 204.4, .32): add(fol, wood(.6), t, .1, .2)               # you fetching
for t in np.arange(240.95, 242.4, .4): add(fol, cob(.8), t, .14, .3)
for t in np.arange(248.7, 252.5, .38): add(fol, wood(.9), t, .14, .35)
for t in np.arange(307.4, 316.2, .4): add(fol, cob(.9), t, .14, -.1)
def knock(): return lp(thump(1.0, 160)[:int(.25 * SR)] + .3 * bp(noise(.25), 400, 2500) * env_exp(.25, .02), 2500).astype(np.float32)
for i in range(3): add(fol, knock(), T['knock'] + i * .28, .5, .2)
add(fol, creak(.8).astype(np.float32), 247.4, .25, .4)                              # the door
# candle: strike + flare, then the snuff
add(fol, fade(bp(noise(.5), 1500, 7000).astype(np.float32) * env_exp(.5, .12), .005, .1), T['candleLit'] - .1, .16, .3)
add(fol, fade(bp(noise(.6), 200, 1200).astype(np.float32) * env_exp(.6, .15), .02, .2), T['snuff'], .2, .3)
# the winder
w = t_(2.6); add(fol, fade((bp(noise(2.6), 300, 1800) * (.6 + .4 * np.sin(2 * np.pi * 3.2 * w))).astype(np.float32), .2, .3), T['wind'], .05, -.2)
# church bells (vespers): two strokes, then the rest of the city's bells, faint
def bell(f=196.0, d=5.0):
    x = t_(d); y = sum(a * np.sin(2 * np.pi * f * m * x) * np.exp(-x / (2.6 / m ** .5)) for m, a in ((.5, .6), (1, 1), (1.19, .5), (1.56, .4), (2.0, .3), (2.74, .2)))
    return (y * np.minimum(1, x / .003)).astype(np.float32)
for i, t in enumerate((T['bell'], T['bell'] + 3.0, T['bell'] + 5.6)): add(mus, bell(), t, .24 - i * .05, -.2)
add(mus, bell(261.6, 4), T['bell'] + 1.4, .05, .7); add(mus, bell(233.1, 4), T['bell'] + 4.1, .04, -.7)
# UI: dings on panels and checks, stamps, coins, whooshes at cuts
def coins(n=3):
    out = np.zeros(int(.6 * SR), np.float32)
    for i in range(n):
        x = t_(.25); y = sum(np.sin(2 * np.pi * f * x) * np.exp(-x / .06) for f in (2800 + i * 170, 4100 + i * 230, 5900)); s = int(i * .09 * SR); out[s:s + len(y)] += (y * .3).astype(np.float32)[:len(out) - s]
    return out
for t in (T['quest'], T['party'], T['book'], T['jures'], T['slots'], T['witness'], T['pays'], T['statute'], T['june'], T['rule'], T['nightPanel'], T['cal'], T['bell'] - .2, T['thread'] - .5, T['become'], 312.0):
    add(fol, ding(.45).astype(np.float32), t, .08, 0)
for t in (T['q1ok'], T['q2ok'], T['slotYou'], T['fetch'] + .4, T['wind'] + .4, T['thread'] + .3, T['materials'] + .3, T['needleHold'] + .3, T['plain'] + .3, T['looked'] + .6, T['skill'] + .5, 313.2):
    add(fol, ding(.6).astype(np.float32), t, .07, .1)
for t in (T['snuff'] - .1, T['seize'], T['money'] + 2.0, 201.8): add(fol, thump(1.0, 60).astype(np.float32), t, .3, 0)
for t, n in ((T['bars'], 5), (T['barsLong'], 1), (T['fine'], 3), (T['wage'], 1)): add(fol, coins(n), t, .14, .1)
for t in np.arange(T['year0'], T['year1'] + .1, (T['year1'] - T['year0']) / 7): add(fol, ding(.35).astype(np.float32), t, .06, -.1)
for _, a, _b in SH[1:]: add(fol, whoosh(.35, .5).astype(np.float32), a - .25, .08, 0)
# gold glint
add(fol, (np.sin(2 * np.pi * 4200 * t_(.8)) * env_exp(.8, .25) * .4 + np.sin(2 * np.pi * 6300 * t_(.8)) * env_exp(.8, .15) * .2).astype(np.float32), T['gold'], .05, -.3)

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
e = int((DUR - .8) * SR); mix[e:] *= np.linspace(1, 0, len(mix) - e)[:, None]
mix = np.stack([limit(mix[:, 0], .95), limit(mix[:, 1], .95)], 1)
os.makedirs(os.path.join(HERE, "out"), exist_ok=True)
sf.write(os.path.join(HERE, "out", "mix.wav"), mix[:int(DUR * SR)].astype(np.float32), SR)
print("mix written", DUR)
