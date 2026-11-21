"""Procedural lo-fi / chill-hop background (own composition, royalty-free).
Usage: python3 lofi.py OUT.wav SECONDS [BPM] [SEED]"""
import sys, wave, numpy as np

SR = 44100
out, secs = sys.argv[1], float(sys.argv[2])
bpm = float(sys.argv[3]) if len(sys.argv) > 3 else 90
rng = np.random.default_rng(int(sys.argv[4]) if len(sys.argv) > 4 else 7)
beat = 60 / bpm
N = int(secs * SR)
L = np.zeros(N); R = np.zeros(N)

def add(buf, sig, t):
    i = int(t * SR)
    if i >= N: return
    j = min(N, i + len(sig)); buf[i:j] += sig[: j - i]

def mtof(m): return 440 * 2 ** ((m - 69) / 12)

def rhodes(f, dur, vel=0.18):
    t = np.arange(int(dur * SR)) / SR
    env = np.exp(-t * 1.6) * (1 - np.exp(-t * 300))
    s = np.sin(2*np.pi*f*t) + 0.35*np.sin(2*np.pi*2*f*t)*np.exp(-t*4) + 0.12*np.sin(2*np.pi*3.01*f*t)*np.exp(-t*7)
    s *= 1 + 0.25*np.sin(2*np.pi*4.5*t)  # tremolo
    return vel * s * env

def kick():
    t = np.arange(int(0.45*SR))/SR
    f = 50 + 90*np.exp(-t*28)
    return 0.9*np.sin(2*np.pi*np.cumsum(f)/SR)*np.exp(-t*7)

def snare():
    t = np.arange(int(0.3*SR))/SR
    n = rng.standard_normal(len(t))
    n = np.convolve(n, np.ones(3)/3, 'same')
    return 0.28*(n*np.exp(-t*16) + 0.5*np.sin(2*np.pi*190*t)*np.exp(-t*25))

def hat(v=0.07):
    t = np.arange(int(0.06*SR))/SR
    n = np.diff(rng.standard_normal(len(t)+1))
    return v*n*np.exp(-t*70)

def bass(f, dur):
    t = np.arange(int(dur*SR))/SR
    env = np.minimum(1, t*80) * np.exp(-t*1.2)
    return 0.32*(np.sin(2*np.pi*f*t) + 0.15*np.sin(2*np.pi*2*f*t))*env

# Fmaj7 - Em7 - Dm9 - Cmaj7 (warm, slightly melancholic city vibe)
prog = [[53,57,60,64,67],[52,55,59,62,67],[50,53,57,60,64],[48,52,55,59,62]]
roots = [41,40,38,36]
bar = 4*beat
nbars = int(np.ceil(secs/bar))
for b in range(nbars):
    t0 = b*bar
    ch = prog[b % 4]
    for k, m in enumerate(ch):
        sig = rhodes(mtof(m), bar*1.1, 0.10)
        add(L, sig*(0.6+0.1*k), t0 + k*0.012); add(R, sig*(1.0-0.1*k), t0 + k*0.012)
    # little re-strike on the "and" of 3
    for m in ch[1:4]:
        s = rhodes(mtof(m+12), beat, 0.045); add(L, s, t0+2.5*beat); add(R, s, t0+2.5*beat)
    bs = bass(mtof(roots[b % 4]), bar*0.9); add(L, bs, t0); add(R, bs, t0)
    bs2 = bass(mtof(roots[b % 4]+7), beat); add(L, bs2*0.6, t0+3*beat); add(R, bs2*0.6, t0+3*beat)
    swing = 0.06*beat
    for st in [0, 2.5]:
        k_ = kick(); add(L, k_, t0+st*beat); add(R, k_, t0+st*beat)
    for st in [1, 3]:
        s_ = snare(); add(L, s_, t0+st*beat+0.01); add(R, s_*0.9, t0+st*beat+0.01)
    for e in range(8):
        tt = t0 + e*beat/2 + (swing if e % 2 else 0)
        h = hat(0.06 if e % 2 else 0.08); add(L, h*0.7, tt); add(R, h, tt)

# vinyl crackle + hiss
crack = np.zeros(N)
idx = rng.integers(0, N, int(secs*25)); crack[idx] = rng.uniform(-0.25, 0.25, len(idx))
crack = np.convolve(crack, np.exp(-np.arange(40)/6), 'same')
hiss = 0.004*rng.standard_normal(N)
L += crack + hiss; R += crack*0.8 + hiss

# gentle low-pass (one-pole) for the lo-fi warmth
def lp(x, a=0.32):
    y = np.empty_like(x); acc = 0.0
    from itertools import accumulate
    # vectorised via lfilter-like recursion
    for i in range(0, len(x)):
        acc += a*(x[i]-acc); y[i] = acc
    return y
L, R = lp(L), lp(R)
# fade in/out
fade = int(1.0*SR)
env = np.ones(N); env[:fade] = np.linspace(0, 1, fade); env[-fade*2:] = np.linspace(1, 0, fade*2)
L *= env; R *= env
st = np.stack([L, R], 1)
st = np.tanh(st*1.4)/np.tanh(1.4)
st *= 0.9/np.abs(st).max()
with wave.open(out, 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((st*32767).astype('<i2').tobytes())
print("ok", out, secs)
