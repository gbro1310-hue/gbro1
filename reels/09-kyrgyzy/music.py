# Score + foley + voice mix for «Кыргызы поймут» (100 BPM, bright pop-funk on I–V–vi–IV).
# Reads events.json (exported from the page) so every sound sits on its picture event.
# Writes out/mix.wav (full) and out/mix_voice.wav (voices + foley, no music — for a trending IG track on top).
# Instrument functions adapted from the Lemo-Opuscar game-show demo (MIT, © SecondFirst Pty Ltd t/a LemoLab).
import json, os, sys, wave
import numpy as np
os.chdir(os.path.dirname(os.path.abspath(__file__)))
import synth_lib as S
from synth_lib import SR, mtof, lp, hp, bp, kick, snare, clap, hat, pluck, bell, pad, stamp, boing, pop, clink, whoosh, key_click

EVJ = json.load(open('events.json'))
TOTAL = EVJ['dur'] + 0.6
N = int(TOTAL * SR)
S.N = N; S.L = np.zeros(N); S.R = np.zeros(N)          # music bus
VL = np.zeros(N); VR = np.zeros(N)                     # voice + foley bus
rng = np.random.default_rng(11)

BEAT = 60 / 100; BAR = 4 * BEAT
at = lambda bar, beat=0: (bar * 4 + beat) * BEAT

def addm(sig, t0, gain=1.0, pan=0.0): S.add(sig, t0, gain, pan)
def addv(sig, t0, gain=1.0, pan=0.0):
    i = int(t0 * SR)
    if i >= N or i < 0: return
    sig = sig[: N - i] * gain
    l = np.cos((pan + 1) * np.pi / 4); r = np.sin((pan + 1) * np.pi / 4)
    VL[i:i + len(sig)] += sig * l * 1.414; VR[i:i + len(sig)] += sig * r * 1.414

# ---------------- instruments
def brass_stab(ms, dur=0.16):
    n = int(dur * SR); t = np.arange(n) / SR; s = np.zeros(n)
    for m in ms:
        for d in (-0.08, 0.08):
            ph = np.cumsum(np.full(n, mtof(m) * (1 + d / 100))) / SR
            s += 2 * (ph % 1) - 1
    s /= len(ms) * 2
    k = np.exp(-t * 25)
    return (lp(s, 4000) * k + lp(s, 900) * (1 - k)) * np.minimum(1, t / 0.004) * np.clip((dur - t) / 0.04, 0, 1) * 0.8
def slap(m, dur=0.2):
    n = int(dur * SR); t = np.arange(n) / SR; f = mtof(m); ph = 2 * np.pi * f * t
    s = np.sin(ph) + 0.5 * np.sin(2 * ph) * np.exp(-t * 30) + 0.3 * (2 * ((f * t) % 1) - 1) * np.exp(-t * 20)
    return lp(s, 1600) * np.minimum(1, t / 0.003) * np.exp(-t * 7) * 0.7
def arp(m, dur=0.1):
    n = int(dur * SR); t = np.arange(n) / SR
    return lp(np.sign(np.sin(2 * np.pi * mtof(m) * t)), 5000) * np.exp(-t * 28) * 0.3
def crash(dur=1.6):
    n = int(dur * SR); t = np.arange(n) / SR
    return hp(rng.standard_normal(n), 3500) * np.exp(-t * 2.6) * 0.35
def cowbell():
    n = int(0.25 * SR); t = np.arange(n) / SR
    s = np.sign(np.sin(2 * np.pi * 560 * t)) + np.sign(np.sin(2 * np.pi * 845 * t))
    return bp(s, 500, 3000) * np.exp(-t * 14) * 0.3
def horn():
    n = int(0.5 * SR); t = np.arange(n) / SR
    s = np.sign(np.sin(2 * np.pi * 392 * t)) + np.sign(np.sin(2 * np.pi * 494 * t))
    s = lp(s, 2200) * np.minimum(1, t / 0.01) * np.clip((0.5 - t) / 0.05, 0, 1)
    out = np.zeros(int(0.9 * SR)); out[:n] += s; out[int(0.35 * SR):int(0.35 * SR) + n] += s
    return out * 0.25
def drip():
    n = int(0.08 * SR); t = np.arange(n) / SR
    f = 1200 + 1800 * t / 0.08
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 50) * 0.25
def ring_phone():
    n = int(0.6 * SR); t = np.arange(n) / SR
    s = (np.sin(2 * np.pi * 1400 * t) + np.sin(2 * np.pi * 1750 * t)) * (np.sin(2 * np.pi * 20 * t) > 0)
    return s * np.clip((0.6 - t) / 0.05, 0, 1) * 0.12
def squish():
    n = int(0.35 * SR); t = np.arange(n) / SR
    f = 500 * np.exp(-t * 6) + 90
    return (np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.6 + lp(rng.standard_normal(n), 900) * 0.3) * np.exp(-t * 9)
def waves(dur=2.5):
    n = int(dur * SR); t = np.arange(n) / SR
    return lp(rng.standard_normal(n), 900) * (0.4 + 0.6 * np.sin(np.pi * t / dur) ** 2) * 0.35

# ---------------- arrangement: one chord per bar, I–V–vi–IV
PROG = [(60, [60, 64, 67]), (55, [59, 62, 67]), (57, [57, 60, 64]), (53, [57, 60, 65])]
MODE = {}
def span(a, b, mode):
    for bar in range(a, b): MODE[bar] = mode
span(0, 2, 'hook'); span(2, 6, 'funk'); span(6, 10, 'funk2'); span(10, 14, 'up'); span(14, 15, 'break'); span(15, 17, 'final')
END = 17
for bar in range(END):
    mode = MODE[bar]; t0 = at(bar)
    tr = 2 if mode in ('up', 'final') else 0
    root, ch = PROG[bar % 4]; ch = [m + tr for m in ch]; root += tr
    if mode == 'break':
        for b in range(4): addm(kick(), at(bar, b), 0.9)
        continue
    dense = mode in ('funk2', 'up', 'final')
    # drums
    for b in range(4):
        addm(kick(), at(bar, b if b in (0, 2) else b), 0.95 if b in (0, 2) else 0.0)
        if b in (1, 3): addm(clap() if dense else snare(), at(bar, b), 0.55, rng.uniform(-.1, .1)); addm(snare(), at(bar, b), 0.25)
    if dense: addm(kick(), at(bar, 2.5), 0.6)
    step = 0.25 if dense else 0.5
    k = 0
    while k < 4:
        addm(hat(), at(bar, k), 0.18 if (k % 1) else 0.26, 0.3)
        k += step
    if mode == 'up': addm(cowbell(), at(bar, 1.5), 0.5, -0.3); addm(cowbell(), at(bar, 3.5), 0.4, -0.3)
    # slap bass: root on 1, octave on and-of-2, fifth on 3, walk on 4
    for b, m, d in [(0, root - 24, 0.3), (1.5, root - 12, 0.18), (2, root - 17, 0.25), (3, root - 24, 0.15), (3.5, root - 22, 0.15)]:
        addm(slap(m, d), at(bar, b), 0.9)
    # chords: brass stabs on the offbeats (funk), marimba-ish plucks (hook/final), square arp (up)
    if mode in ('funk', 'funk2', 'final'):
        for b in (0.5, 1.5, 2.5, 3.5) if mode != 'funk' else (1.5, 3.5):
            addm(brass_stab([m + 12 for m in ch], 0.14), at(bar, b), 0.32, 0.15)
    if mode in ('hook', 'final', 'funk'):
        for i, b in enumerate((0, 0.75, 1.5, 2, 3, 3.5)):
            addm(pluck(ch[i % 3] + 12, 0.3), at(bar, b), 0.22, -0.25)
    if mode in ('up', 'final'):
        for i in range(16): addm(arp(ch[i % 3] + 24, 0.09), at(bar, i * 0.25), 0.35, 0.35)
    addm(pad([m for m in ch], BAR), t0, 0.12)
# jingles: crash + rising brass into each round
for bar in (0, 2, 4, 6, 8, 10, 12, 15):
    addm(crash(), at(bar), 0.55 if bar != 15 else 0.9)
    if bar in (2, 6, 10, 15):
        for k, m in enumerate([72, 76, 79]): addm(brass_stab([m, m + 4], 0.12), at(bar - 1, 3) + k * BEAT / 3, 0.35)
# button ending
addm(brass_stab([74, 78, 81, 86], 0.9), at(16, 3), 0.6); addm(crash(2.2), at(16, 3), 0.7)

# ---------------- voices + foley from picture events
def load(name):
    w = wave.open(f'voice/{name}.wav'); sr = w.getframerate()
    x = np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(float) / 32768
    if w.getnchannels() == 2: x = x.reshape(-1, 2).mean(1)
    assert sr == SR, sr
    return x
def comp(x, thr=0.25, ratio=3.5):
    env = np.abs(x); a = np.exp(-1 / (0.004 * SR)); r = np.exp(-1 / (0.08 * SR))
    from scipy.signal import lfilter
    e = lfilter([1 - r], [1, -r], env)
    g = np.where(e > thr, (thr + (e - thr) / ratio) / np.maximum(e, 1e-9), 1.0)
    return x * g
VO = {}
for e in EVJ['ev']:
    if e['type'] == 'voice' and e['id'] not in VO:
        x = load(e['id']); x = comp(x / (np.max(np.abs(x)) + 1e-9)); VO[e['id']] = x / (np.sqrt(np.mean(x ** 2)) + 1e-9) * 0.12

for e in EVJ['ev']:
    t, ty = e['t'], e['type']
    if ty == 'voice':
        addv(VO[e['id']], t, e.get('gain', 1.0), e.get('pan', 0.0))
    elif ty == 'cut':
        addv(whoosh(0.35, True), t - 0.3, 0.25)
    elif ty == 'sfx':
        n = e['name']
        if n == 'pop': addv(pop(e.get('f', 900)), t, 0.35)
        elif n == 'flip': addv(key_click(), t, 0.6); addv(key_click(), t + 0.05, 0.5); addv(bell(91, 0.5), t + 0.04, 0.22)
        elif n == 'stamp': addv(stamp(False), t, 0.55)
        elif n == 'boing': addv(boing(), t, 0.5)
        elif n == 'clink': addv(clink(2600 + 300 * rng.random()), t, 0.7, rng.uniform(-.4, .4))
        elif n == 'hammer': addv(stamp(True), t, 0.45); addv(clink(1800), t, 0.5)
        elif n == 'horn': addv(horn(), t, 0.8, 0.3)
        elif n == 'pip': addv(pop(e.get('f', 700)), t, 0.4); addv(bell(int(round(69 + 12 * np.log2(e.get('f', 700) / 440))) + 12, 0.4), t, 0.15)
        elif n == 'crash': addv(stamp(True), t, 0.5)
# scene beds (from the sound design table)
ev_cuts = sorted(e['t'] for e in EVJ['ev'] if e['type'] == 'cut')
def bar_t(b): return at(b)
for k in range(int(BAR * 2 / 0.11)): addv(drip(), at(2) + 0.3 + k * 0.11 + rng.uniform(0, 0.05), 0.35, rng.uniform(-.5, .5))      # shower
for k in range(4): addv(ring_phone(), at(8) + k * 0.15 * 2, 0.6, 0.4) if k < 2 else None                                            # phone
addv(squish(), at(10) + 0.3 + 1.95, 0.6)                                                                                             # bus squeeze (≈ flip)
addv(waves(3.0), at(12) + 1.8, 0.6)                                                                                                  # beach

# ---------------- mix: duck music under the voice/foley bus, balance, soft-clip
mus = np.stack([S.L, S.R]); vb = np.stack([VL, VR])
from scipy.signal import lfilter
env = lfilter([1 - np.exp(-1 / (0.05 * SR))], [1, -np.exp(-1 / (0.05 * SR))], np.abs(vb).max(0))
duck = 1 - 0.55 * np.clip(env / (np.percentile(env[env > 1e-4], 90) + 1e-9), 0, 1)
mus = mus * duck
rms = lambda x: np.sqrt(np.mean(x ** 2) + 1e-12)
vmask = env > 0.02
mus *= (rms(vb[:, vmask]) / rms(mus[:, vmask])) * 10 ** (-10 / 20)       # voice ≈ 10 dB above the music
def master(x):
    x = np.tanh(x / (np.max(np.abs(x)) + 1e-9) * 1.25) * 0.89
    return x
def write(name, x):
    x = np.clip(x, -1, 1)
    w = wave.open(name, 'wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((x.T * 32767).astype('<i2').tobytes()); w.close()
os.makedirs('out', exist_ok=True)
write('out/mix.wav', master(mus + vb))
write('out/mix_voice.wav', master(vb))
print('mix ok', round(TOTAL, 2), 's')
