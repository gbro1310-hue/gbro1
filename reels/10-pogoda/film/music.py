# Jazz waltz (3/4, 144 BPM) + foley + voice for «Погода Бишкека за день». Reads events.json from the page.
# Writes out/mix.wav (full) and out/mix_voice.wav (voice + foley only).
import json, os, wave
import numpy as np
os.chdir(os.path.dirname(os.path.abspath(__file__)))
import synth_lib as S
from synth_lib import SR, mtof, lp, hp, bp, bell
from scipy.signal import lfilter
EVJ = json.load(open('events.json'))
TOTAL = EVJ['dur'] + 1.0; N = int(TOTAL * SR)
S.N = N; S.L = np.zeros(N); S.R = np.zeros(N)
VL = np.zeros(N); VR = np.zeros(N)
rng = np.random.default_rng(5)
BEAT = 60 / 144; BAR = 3 * BEAT
at = lambda bar, beat=0: (bar * 3 + beat) * BEAT
def addm(sig, t0, g=1.0, pan=0.0): S.add(sig, t0, g, pan)
def addv(sig, t0, g=1.0, pan=0.0):
    i = int(t0 * SR)
    if i < 0 or i >= N: return
    sig = sig[: N - i] * g; l = np.cos((pan + 1) * np.pi / 4); r = np.sin((pan + 1) * np.pi / 4)
    VL[i:i + len(sig)] += sig * l * 1.414; VR[i:i + len(sig)] += sig * r * 1.414
T = lambda d: np.arange(int(d * SR)) / SR

# ---------------- instruments
def upright(m, d=0.42):
    t = T(d); f = mtof(m)
    s = np.sin(2 * np.pi * f * t) + 0.45 * np.sin(4 * np.pi * f * t) * np.exp(-t * 9) + 0.2 * np.sin(6 * np.pi * f * t) * np.exp(-t * 14)
    thump = lp(rng.standard_normal(len(t)), 300) * np.exp(-t * 60) * 0.3
    return (s * np.exp(-t * 4.5) * np.minimum(1, t / 0.006) + thump) * 0.55
def swish(d=0.36):
    t = T(d); x = bp(rng.standard_normal(len(t)), 2500, 9000)
    return x * np.sin(np.pi * t / d) ** 1.5 * 0.16
def tap():
    t = T(0.12); return bp(rng.standard_normal(len(t)), 1800, 7000) * np.exp(-t * 45) * 0.22
def vibe(ms, d=0.9):
    t = T(d); s = np.zeros(len(t))
    for m in ms: f = mtof(m); s += (np.sin(2 * np.pi * f * t) + 0.25 * np.sin(2 * np.pi * 4 * f * t) * np.exp(-t * 12)) * np.exp(-t * 2.6)
    return s / len(ms) * (1 + 0.25 * np.sin(2 * np.pi * 5.5 * t)) * np.minimum(1, t / 0.004) * 0.5
def clar(m, d):
    t = T(d); f = mtof(m) * (1 + 0.004 * np.sin(2 * np.pi * 5 * t) * np.minimum(1, t / 0.3))
    ph = 2 * np.pi * np.cumsum(f) / SR
    s = np.sin(ph) + 0.35 * np.sin(3 * ph) + 0.15 * np.sin(5 * ph)
    env = np.minimum(1, t / 0.06) * np.clip((d - t) / 0.08, 0, 1)
    return lp(s, 2800) * env * 0.28
# ---------------- harmony: one chord per bar
F = 53
CH = {'Gm7': (43, [55, 58, 62, 65]), 'C7': (48, [52, 55, 58, 62]), 'Fmaj7': (41, [53, 57, 60, 64]), 'Dm7': (50, [53, 57, 60, 62]),
      'G7': (43, [53, 55, 59, 62]), 'Am7': (45, [55, 57, 60, 64]), 'Bbmaj7': (46, [53, 57, 58, 62]), 'E7': (40, [52, 56, 59, 62])}
PROG = ['Fmaj7', 'Dm7', 'Gm7', 'C7'] * 2 + ['Fmaj7', 'Bbmaj7', 'Gm7', 'C7'] + ['Dm7', 'Am7', 'Bbmaj7', 'E7'] + ['Fmaj7', 'Dm7', 'Gm7', 'C7'] + ['Gm7', 'C7', 'Fmaj7', 'Fmaj7', 'Fmaj7']
SECT = lambda b: 'h' if b < 4 else 'snow' if b < 8 else 'sun' if b < 12 else 'smog' if b < 16 else 'night' if b < 20 else 'end'
# theme (clarinet) for the sun bars and a quieter echo at night: (bar offset, beat, midi, beats)
THEME = [(0, 0, 72, 2), (0, 2, 74, 1), (1, 0, 77, 2), (1, 2, 76, 1), (2, 0, 74, 1.5), (2, 1.5, 72, 1.5), (3, 0, 70, 3)]
for b, name in enumerate(PROG):
    sec = SECT(b); root, ch = CH[name]
    # walking bass, 3 notes per bar
    if sec != 'h' or b >= 2:
        walk = [root, root + 7, root + (4 if name.endswith('7') and 'm' not in name else 3)]
        for k, m in enumerate(walk): addm(upright(m - 12 if m > 52 else m), at(b, k), 0.9 if sec != 'smog' else 0.7)
    # brushes: a swish on 1, taps on 2 and 3
    addm(swish(), at(b, 0), 0.9, 0.2); addm(tap(), at(b, 1), 0.8, 0.25); addm(tap(), at(b, 2), 0.8, 0.25)
    if sec in ('snow', 'sun', 'night', 'end'): addm(vibe(ch, 0.8), at(b, 1), 0.5 if sec != 'night' else 0.35, -0.3); addm(vibe(ch[1:], 0.6), at(b, 2), 0.35, -0.3)
    if sec == 'smog': addm(vibe([m - 12 for m in ch[:2]], 1.2), at(b, 0), 0.25, -0.2)
for b0, g in ((8, 1.0), (10, 0.9), (16, 0.45), (20, 0.7)):
    for (bo, bt, m, d) in THEME: addm(clar(m, d * BEAT * 0.95), at(b0 + bo, bt), g, 0.15)
# final cadence
addm(vibe([53, 57, 60, 64, 69], 2.6), at(24), 0.7); addm(upright(29, 1.5), at(24), 1.0)

# ---------------- foley
def pen(d):
    t = T(d); x = bp(rng.standard_normal(len(t)), 2500, 7500)
    grit = (rng.random(len(t)) < 0.004).astype(float); grit = np.convolve(grit, np.exp(-np.arange(200) / 30))[: len(t)]
    strokes = 0.5 + 0.5 * np.sin(2 * np.pi * 3.3 * t + 2 * np.sin(2 * np.pi * 0.7 * t)) ** 2
    return (x * 0.06 + bp(grit * rng.standard_normal(len(t)), 3000, 9000) * 0.5) * strokes * np.minimum(1, t / 0.05) * np.clip((d - t) / 0.1, 0, 1)
def brushwater(d=1.2):
    t = T(d); x = lp(rng.standard_normal(len(t)), 1800)
    return x * np.sin(np.pi * t / d) ** 2 * 0.12
def step():
    t = T(0.18); return lp(rng.standard_normal(len(t)), 500) * np.exp(-t * 30) * 0.5
def birds(d):
    out = np.zeros(int(d * SR))
    for k in range(int(d * 2.2)):
        i = int(rng.uniform(0, d - 0.3) * SR); t = T(0.12); f = rng.uniform(2800, 4200)
        s = np.sin(2 * np.pi * np.cumsum(f * (1 + 0.25 * np.sin(2 * np.pi * 30 * t))) / SR) * np.sin(np.pi * t / 0.12) * 0.05
        out[i:i + len(s)] += s[: len(out) - i]
    return out
def hush(d, fc=1200, g=0.02):
    t = T(d); return lp(rng.standard_normal(len(t)), fc) * g * np.minimum(1, t / 0.5) * np.clip((d - t) / 0.5, 0, 1)
def wind(d):
    t = T(d); x = rng.standard_normal(len(t)); out = np.zeros(len(t)); seg = 2048
    for i in range(0, len(t), seg):
        fc = 300 + 500 * (0.5 + 0.5 * np.sin(2 * np.pi * 0.3 * i / SR)); out[i:i + seg] = bp(x[max(0, i - 4096):i + seg], fc * 0.6, fc * 1.6)[-len(x[i:i + seg]):]
    return out * 0.18 * np.minimum(1, t / 0.6) * np.clip((d - t) / 0.6, 0, 1)

def load(name):
    w = wave.open(f'voice/{name}.wav'); x = np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(float) / 32768
    return x
def comp(x, thr=0.25, ratio=3.5):
    e = lfilter([1 - np.exp(-1 / (0.08 * SR))], [1, -np.exp(-1 / (0.08 * SR))], np.abs(x))
    return x * np.where(e > thr, (thr + (e - thr) / ratio) / np.maximum(e, 1e-9), 1.0)
scenes = {}
for e in EVJ['ev']:
    t, ty = e['t'], e['type']
    if ty == 'voice':
        x = load(e['id']); x = comp(x / (np.max(np.abs(x)) + 1e-9)); addv(x / (np.sqrt(np.mean(x ** 2)) + 1e-9) * 0.12, t)
    elif ty == 'pen': addv(pen(e['dur']), t, 0.9, 0.1)
    elif ty == 'write': addv(pen(e['dur']), t, 0.6, 0.1)
    elif ty == 'wash': addv(brushwater(1.3), t, 1.0, -0.1)
    elif ty == 'step': addv(step(), t, 0.5, rng.uniform(-.2, .2))
    elif ty == 'scene': scenes[e['scene']] = t
# ambience beds per moment (sound design table)
addv(hush(at(8) - at(4), 900, 0.03), at(4))
addv(birds(at(12) - at(8)), at(8), 1.0, 0.3); addv(hush(at(12) - at(8), 600, 0.02), at(8))
addv(wind(at(16) - at(12)), at(12), 1.0, -0.2); addv(hush(at(16) - at(12), 250, 0.05), at(12))
addv(hush(TOTAL - at(16) - 0.5, 900, 0.025), at(16))

# ---------------- mix
mus = np.stack([S.L, S.R]); vb = np.stack([VL, VR])
env = lfilter([1 - np.exp(-1 / (0.06 * SR))], [1, -np.exp(-1 / (0.06 * SR))], np.abs(vb).max(0))
mus *= 1 - 0.5 * np.clip(env / (np.percentile(env[env > 1e-4], 90) + 1e-9), 0, 1)
# smog: music sits lower
t = np.arange(N) / SR; mus *= np.where((t > at(12)) & (t < at(16)), 0.7, 1.0)
rms = lambda x: np.sqrt(np.mean(x ** 2) + 1e-12); vm = env > 0.02
mus *= rms(vb[:, vm]) / rms(mus[:, vm]) * 10 ** (-11 / 20)
fade = np.clip((TOTAL - t) / 0.8, 0, 1); mus *= fade
def master(x): return np.tanh(x / (np.max(np.abs(x)) + 1e-9) * 1.2) * 0.89
def write(name, x):
    w = wave.open(name, 'wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((np.clip(x, -1, 1).T * 32767).astype('<i2').tobytes()); w.close()
os.makedirs('out', exist_ok=True)
write('out/mix.wav', master(mus + vb)); write('out/mix_voice.wav', master(vb))
print('mix ok', round(TOTAL, 2))
