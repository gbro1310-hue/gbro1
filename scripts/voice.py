#!/usr/bin/env python3
"""Озвучка ролика через ElevenLabs (with-timestamps) → public/voice.mp3 + public/voice_timestamps.json

Использование:  python3 scripts/voice.py reels/05-traffic
Переменные:     ELEVENLABS_API_KEY (обязательно локально; не коммить!)
                VOICE_ID (по умолчанию Lev Lavrin), MODEL_ID (eleven_multilingual_v2)
Громкость:      компрессия 3:1 + усиление до ≈ −15 LUFS (ffmpeg), тайминги не сдвигаются.
"""
import base64, json, os, subprocess, sys, urllib.request

reel = sys.argv[1]
voice_id = os.environ.get("VOICE_ID", "6Pm064JKx8KhPSIAdbHd")
model_id = os.environ.get("MODEL_ID", "eleven_multilingual_v2")
gain_db = os.environ.get("GAIN_DB", "8")
pub = os.path.join(reel, "public")
os.makedirs(pub, exist_ok=True)
text = open(os.path.join(reel, "voiceover.txt"), encoding="utf-8").read().strip()

headers = {"Content-Type": "application/json"}
if os.environ.get("ELEVENLABS_API_KEY"):
    headers["xi-api-key"] = os.environ["ELEVENLABS_API_KEY"]
body = json.dumps({
    "text": text,
    "model_id": model_id,
    "voice_settings": {"stability": 0.4, "similarity_boost": 0.75, "style": 0.3, "use_speaker_boost": True},
}).encode()
url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}/with-timestamps?output_format=mp3_44100_128"
d = json.load(urllib.request.urlopen(urllib.request.Request(url, data=body, headers=headers), timeout=300))

raw = os.path.join(pub, "voice_raw.mp3")
open(raw, "wb").write(base64.b64decode(d["audio_base64"]))
al = d["alignment"]
json.dump(al, open(os.path.join(pub, "voice_alignment_chars.json"), "w"), ensure_ascii=False)

# символы → слова
words, cur, s, e = [], "", None, None
for c, a, b in zip(al["characters"], al["character_start_times_seconds"], al["character_end_times_seconds"]):
    if c.isspace():
        if cur:
            words.append({"text": cur, "start": s, "end": e}); cur = ""
        continue
    if not cur:
        s = a
    cur += c; e = b
if cur:
    words.append({"text": cur, "start": s, "end": e})
words = [w for w in words if w["text"] not in ("—", "-", "–")]
json.dump({"words": words, "duration": al["character_end_times_seconds"][-1]},
          open(os.path.join(pub, "voice_timestamps.json"), "w"), ensure_ascii=False, indent=1)

subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", raw, "-af",
                f"acompressor=threshold=0.125:ratio=3:attack=4:release=90:makeup=1,volume={gain_db}dB",
                "-b:a", "192k", os.path.join(pub, "voice.mp3")], check=True)
os.remove(raw)
print(f"ok: {len(words)} слов, {al['character_end_times_seconds'][-1]:.2f} с")
