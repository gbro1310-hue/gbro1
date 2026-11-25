#!/usr/bin/env python3
"""ElevenLabs TTS per line → voice/<id>.wav (24 kHz mono, trimmed) + voice/dur.json + voice/<id>.align.json
Usage: python3 tts_eleven.py lines.json voice/   (ключ: ELEVENLABS_API_KEY или прокси)"""
import base64, json, os, subprocess, sys, urllib.request
VOICES = {
    "narr": "6Pm064JKx8KhPSIAdbHd",   # Lev Lavrin
    "hero": "RjY1wx8VeYo2R2WFDXfX",   # Kup
    "eje": "5dORE7Khzn5FlSDUvuHn",    # Guldana
    "mama": "ymDCYd8puC7gYjxIamPt",   # Marina
    "driver": "LmV7j80HF5QYSKe3sDtR", # Mark Rubins
}
lines = json.load(open(sys.argv[1], encoding="utf-8")); out = sys.argv[2]
os.makedirs(out, exist_ok=True)
only = set(sys.argv[3].split(",")) if len(sys.argv) > 3 else None
hdr = {"Content-Type": "application/json"}
if os.environ.get("ELEVENLABS_API_KEY"): hdr["xi-api-key"] = os.environ["ELEVENLABS_API_KEY"]
durs = json.load(open(f"{out}/dur.json")) if os.path.exists(f"{out}/dur.json") else {}
for L in lines:
    if only and L["id"] not in only: continue
    shout = L.get("shout")
    vs = {"stability": 0.3 if shout else 0.4, "similarity_boost": 0.75, "style": 0.6 if shout else 0.35,
          "use_speaker_boost": True, "speed": L.get("speed", 1.0)}
    body = json.dumps({"text": L.get("say", L["text"]), "model_id": "eleven_multilingual_v2", "voice_settings": vs}).encode()
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{VOICES[L['who']]}/with-timestamps?output_format=mp3_44100_128"
    d = json.load(urllib.request.urlopen(urllib.request.Request(url, data=body, headers=hdr), timeout=180))
    mp3 = f"{out}/{L['id']}.mp3"; open(mp3, "wb").write(base64.b64decode(d["audio_base64"]))
    json.dump(d["alignment"], open(f"{out}/{L['id']}.align.json", "w"), ensure_ascii=False)
    wav = f"{out}/{L['id']}.wav"
    # trim leading/trailing silence, 44.1k mono
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", mp3, "-af",
        "silenceremove=start_periods=1:start_threshold=-55dB:start_silence=0.03,areverse,silenceremove=start_periods=1:start_threshold=-55dB:start_silence=0.08,areverse",
        "-ac", "1", "-ar", "44100", wav], check=True)
    os.remove(mp3)
    dur = float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", wav]))
    durs[L["id"]] = round(dur, 3); print(L["id"], L["who"], durs[L["id"]], L["text"])
json.dump(durs, open(f"{out}/dur.json", "w"), indent=1)
