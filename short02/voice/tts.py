"""Generate channel voiceover (ElevenLabs) and tighten pauses to ~153 wpm."""
import json, base64, re, subprocess, sys, urllib.request
VOICE = "OEHTkiHZj6OczWZHu0Aj"  # Ordinary Lives channel voice
paras = [p.strip().replace("\n", " ") for p in open("script.txt").read().split("\n\n") if p.strip()]
PB = " "  # paragraph marker
text = ' <break time="0.7s"/> '.join(paras)
if "--reuse" not in sys.argv:
    body = json.dumps({"text": text, "model_id": "eleven_multilingual_v2",
                       "voice_settings": {"stability": 0.5, "similarity_boost": 0.75, "speed": 0.85}}).encode()
    req = urllib.request.Request(
        f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE}/with-timestamps?output_format=mp3_44100_128",
        data=body, headers={"xi-api-key": "proxy-injected", "Content-Type": "application/json"})
    d = json.load(urllib.request.urlopen(req, timeout=600))
    json.dump(d, open("tts_raw.json", "w"))
d = json.load(open("tts_raw.json"))
open("voice_raw.mp3", "wb").write(base64.b64decode(d["audio_base64"]))
a = d["alignment"]; ch = a["characters"]; st = a["character_start_times_seconds"]; en = a["character_end_times_seconds"]
t = "".join(ch); keep = [True] * len(ch); para_after = set()
for m in re.finditer(r"<[^>]*>", t):
    for i in range(m.start(), m.end()): keep[i] = False
idx = [i for i in range(len(ch)) if keep[i]]
# word list with paragraph flags
words = []; cur = ""; s = e = None; pbreak = False
tagpos = [m.start() for m in re.finditer(r"<[^>]*>", t)]
for i in range(len(ch)):
    c = ch[i]
    if not keep[i]:
        if cur: words.append([cur, s, e, False]); cur = ""
        if words: words[-1][3] = True
        continue
    if c.isspace():
        if cur: words.append([cur, s, e, False]); cur = ""
    else:
        if not cur: s = st[i]
        cur += c; e = en[i]
if cur: words.append([cur, s, e, False])
cuts = []
for i in range(len(words) - 1):
    g0, g1 = words[i][2], words[i + 1][1]; w = words[i][0]
    cap = 0.75 if words[i][3] else (0.34 if w[-1] in ".?!" else (0.2 if w[-1] in ",:;" else 0.12))
    if g1 - g0 > cap + 0.05:
        cuts.append((g0 + cap / 2, g1 - cap / 2))
def remap(x):
    sh = 0
    for a0, b0 in cuts:
        if x >= b0: sh += b0 - a0
        elif x > a0: sh += x - a0
    return x - sh
segs = []; prev = 0.0
for a0, b0 in cuts: segs.append((prev, a0)); prev = b0
segs.append((prev, words[-1][2] + 0.5))
# write segment list to a filter script (long)
lines = []
for i, (a0, b0) in enumerate(segs):
    lines.append(f"[0:a]atrim={a0:.3f}:{b0:.3f},asetpts=PTS-STARTPTS,afade=t=in:d=0.01,afade=t=out:st={max(0, b0 - a0 - 0.01):.3f}:d=0.01[s{i}];")
lines.append("".join(f"[s{i}]" for i in range(len(segs))) + f"concat=n={len(segs)}:v=0:a=1[o]")
open("cut_filter.txt", "w").write("\n".join(lines))
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", "voice_raw.mp3", "-filter_complex_script", "cut_filter.txt",
                "-map", "[o]", "-ar", "44100", "-b:a", "192k", "voice.mp3"], check=True)
out = [[w[0], round(remap(w[1]), 3), round(remap(w[2]), 3), w[3]] for w in words]
json.dump(out, open("words.json", "w"), indent=0)
print("words", len(out), "end", out[-1][2], "wpm", round(len(out) / out[-1][2] * 60), "removed", round(sum(b - a for a, b in cuts), 1))
