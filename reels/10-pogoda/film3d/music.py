# Event-driven pentatonic score for the low-poly island: every rising tile plays a note; marimba/kalimba/bells,
# no piano, no strings. Foley follows material. Writes out/mix.wav and out/mix_voice.wav.
import json, os, wave
import numpy as np
os.chdir(os.path.dirname(os.path.abspath(__file__)))
import synth_lib as S
from synth_lib import SR, mtof, lp, hp, bp
from scipy.signal import lfilter
EVJ = json.load(open('events.json')); TOTAL = EVJ['dur'] + 1.0; N = int(TOTAL * SR)
S.N = N; S.L = np.zeros(N); S.R = np.zeros(N); VL = np.zeros(N); VR = np.zeros(N)
rng = np.random.default_rng(9)
BEAT = 60 / 144; at = lambda bar, beat=0: (bar * 3 + beat) * BEAT
T = lambda d: np.arange(int(d * SR)) / SR
def addm(x, t0, g=1.0, pan=0.0): S.add(x, t0, g, pan)
def addv(x, t0, g=1.0, pan=0.0):
    i = int(t0 * SR)
    if i < 0 or i >= N: return
    x = x[: N - i] * g; l = np.cos((pan + 1) * np.pi / 4); r = np.sin((pan + 1) * np.pi / 4); VL[i:i + len(x)] += x * l * 1.414; VR[i:i + len(x)] += x * r * 1.414
PENTA = [0, 2, 4, 7, 9]
def pn(k, base=65): return base + 12 * (k // 5) + PENTA[k % 5]
# ---------------- instruments
def marimba(m, d=0.5):
    t = T(d); f = mtof(m)
    return (np.sin(2 * np.pi * f * t) + 0.35 * np.sin(2 * np.pi * 4 * f * t) * np.exp(-t * 30)) * np.exp(-t * 7) * np.minimum(1, t / 0.002) * 0.45
def kalimba(m, d=0.6):
    t = T(d); f = mtof(m)
    return (np.sin(2 * np.pi * f * t) + 0.2 * np.sin(2 * np.pi * 5.4 * f * t) * np.exp(-t * 20)) * np.exp(-t * 5) * 0.4
def bellv(m, d=1.6):
    t = T(d); f = mtof(m); s = sum(a * np.sin(2 * np.pi * f * r * t) * np.exp(-t * k) for a, r, k in [(1, 1, 2.2), (0.5, 2.76, 4), (0.3, 5.4, 7)])
    return s * 0.3
def celesta(m, d=0.9): t = T(d); f = mtof(m); return (np.sin(2 * np.pi * f * t) + 0.4 * np.sin(4 * np.pi * f * t)) * np.exp(-t * 4) * 0.3
def steel(m, d=0.45):
    t = T(d); f = mtof(m); return (np.sin(2 * np.pi * f * t) + 0.5 * np.sin(2 * np.pi * 2 * f * t + 1) + 0.25 * np.sin(2 * np.pi * 3.02 * f * t)) * np.exp(-t * 6) * 0.3
def pad(ms, d):
    t = T(d); s = sum(np.sin(2 * np.pi * mtof(m) * (1 + det) * t) for m in ms for det in (-0.002, 0.002))
    return lp(s / (2 * len(ms)), 1500) * np.minimum(1, t / 0.6) * np.clip((d - t) / 0.6, 0, 1) * 0.35
def shaker(): t = T(0.08); return bp(rng.standard_normal(len(t)), 4000, 11000) * np.exp(-t * 50) * 0.12
def softkick(): t = T(0.3); f = 50 + 60 * np.exp(-t * 30); return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 9) * 0.6
def drone(m, d): t = T(d); return lp(np.sin(2 * np.pi * mtof(m) * t) + 0.3 * np.sin(2 * np.pi * mtof(m + 7) * t), 600) * np.minimum(1, t / 1.0) * np.clip((d - t) / 1.0, 0, 1) * 0.3
# ---------------- score by section (bars of 1.25 s)
SECT = lambda b: 'h' if b < 4 else 'snow' if b < 8 else 'sun' if b < 12 else 'smog' if b < 16 else 'night' if b < 20 else 'end'
CHORDS = [[53, 57, 60], [50, 53, 57], [48, 52, 55], [46, 50, 53]]     # F, Dm, C, Bb — modal, pentatonic on top
for b in range(25):
    sec = SECT(b); ch = CHORDS[b % 4]
    if sec in ('snow', 'sun', 'night', 'end') or (sec == 'h' and b >= 3): addm(pad(ch, 1.3), at(b), 0.8 if sec != 'night' else 0.5)
    if sec in ('snow', 'sun', 'end'):
        for k in range(6): addm(marimba(pn((b * 3 + k * 2) % 7, 65) if k % 2 else ch[0] + 12, 0.4), at(b, k * 0.5), 0.5 if k % 2 else 0.6, -0.3)
    if sec in ('sun', 'end'):
        addm(softkick(), at(b, 0), 0.8)
        for k in range(6): addm(shaker(), at(b, k * 0.5), 0.8 if k % 2 else 0.5, 0.4)
        for k, d in [(0, 1), (1.5, 0.5), (2, 1)]: addm(steel(pn((b * 2 + int(k * 2)) % 8, 72), 0.4), at(b, k), 0.6, 0.2)
    if sec == 'smog':
        addm(marimba(ch[0] + 12, 0.6), at(b, 0), 0.35)                       # thinned to one voice
        if b == 12: addm(drone(41, 5.2), at(b), 0.9)
    if sec == 'night':
        for k in (0, 1.5): addm(celesta(pn((b + int(k)) % 6, 77), 0.9), at(b, k), 0.45, 0.3)
addm(bellv(77, 3.0), at(24), 0.8); addm(marimba(65, 1.2), at(24), 0.7); addm(pad([53, 57, 60, 65], 2.5), at(24), 0.8)
# ---------------- events: the picture writes the tune
for e in EVJ['ev']:
    t, ty = e['t'], e['type']
    if ty == 'tile':
        n = e['n']; big = e.get('big', 0)
        addm(kalimba(pn(n % 10, 65 - 12 * big), 0.7), t, 0.55, (n % 7 - 3) / 6)
        tt = T(0.25); bub = np.sin(2 * np.pi * np.cumsum(300 + 900 * tt / 0.25) / SR) * np.exp(-tt * 14) * 0.15   # bubble sweep
        addv(bub, t - 0.12, 0.5 if not big else 0.8); addv(lp(rng.standard_normal(int(0.2 * SR)), 2500) * np.exp(-T(0.2) * 20) * 0.2, t, 0.6)
    elif ty == 'pop': addm(kalimba(pn(rng.integers(5, 10), 72), 0.4), t, 0.5); tt = T(0.08); addv(np.sin(2 * np.pi * 1200 * tt) * np.exp(-tt * 60) * 0.3, t, 0.6)
    elif ty == 'knock':
        tt = T(0.15); k = (np.sin(2 * np.pi * 420 * tt) + 0.5 * np.sin(2 * np.pi * 680 * tt)) * np.exp(-tt * 35) * 0.4
        addv(k, t, 0.8); addv(k * 0.5, t + 0.12, 0.6)
    elif ty == 'change': addm(bellv({'sun': 81, 'smog': 69, 'night': 74}.get(e['w'], 77)), t, 0.6)   # the world's bell, changed each time
    elif ty == 'step': tt = T(0.12); addv(lp(rng.standard_normal(len(tt)), 700) * np.exp(-tt * 35) * 0.35, t, 0.6, rng.uniform(-.2, .2))
    elif ty == 'voice':
        w = wave.open(f"voice/{e['id']}.wav"); x = np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(float) / 32768
        x /= np.max(np.abs(x)) + 1e-9
        env = lfilter([1 - np.exp(-1 / (0.08 * SR))], [1, -np.exp(-1 / (0.08 * SR))], np.abs(x)); x = x * np.where(env > 0.25, (0.25 + (env - 0.25) / 3.5) / np.maximum(env, 1e-9), 1)
        addv(x / (np.sqrt(np.mean(x ** 2)) + 1e-9) * 0.12, t)
# beds
def noise_bed(d, lo, hi, g, fade=0.6): t = T(d); return bp(rng.standard_normal(len(t)), lo, hi) * g * np.minimum(1, t / fade) * np.clip((d - t) / fade, 0, 1)
addv(noise_bed(at(8) - at(3), 200, 1200, 0.03), at(3))
for k in range(9):
    tt = T(0.16); f0 = rng.uniform(3200, 4200); chirp = np.sin(2 * np.pi * np.cumsum(f0 - 1500 * tt / 0.16) / SR) * np.sin(np.pi * tt / 0.16) * 0.05; addv(chirp, at(8) + rng.uniform(0.2, 4.6), 1.0, 0.4)
addv(noise_bed(at(16) - at(12), 120, 700, 0.09, 1.0), at(12), 1.0, -0.2)
addv(noise_bed(TOTAL - at(16) - 0.3, 300, 2000, 0.025), at(16))
# mix
mus = np.stack([S.L, S.R]); vb = np.stack([VL, VR])
env = lfilter([1 - np.exp(-1 / (0.06 * SR))], [1, -np.exp(-1 / (0.06 * SR))], np.abs(vb).max(0))
mus *= 1 - 0.45 * np.clip(env / (np.percentile(env[env > 1e-4], 90) + 1e-9), 0, 1)
rms = lambda x: np.sqrt(np.mean(x ** 2) + 1e-12); vm = env > 0.02
mus *= rms(vb[:, vm]) / rms(mus[:, vm]) * 10 ** (-10 / 20)
tt = np.arange(N) / SR; mus *= np.clip((TOTAL - tt) / 0.8, 0, 1)
def master(x): return np.tanh(x / (np.max(np.abs(x)) + 1e-9) * 1.2) * 0.89
def write(n, x): w = wave.open(n, 'wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((np.clip(x, -1, 1).T * 32767).astype('<i2').tobytes()); w.close()
os.makedirs('out', exist_ok=True); write('out/mix.wav', master(mus + vb)); write('out/mix_voice.wav', master(vb)); print('mix ok', round(TOTAL, 2))
