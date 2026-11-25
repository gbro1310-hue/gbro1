#!/usr/bin/env python3
"""Проверка озвучки: faster-whisper (ru) распознаёт каждую реплику и сравнивает со сценарием.
Usage: $LIB/.venv/bin/python asr_ru.py lines.json voice/ [model]"""
import json, re, sys, difflib
from faster_whisper import WhisperModel
lines = json.load(open(sys.argv[1], encoding="utf-8")); vd = sys.argv[2]
model = WhisperModel(sys.argv[3] if len(sys.argv) > 3 else "small", device="cpu", compute_type="int8")
norm = lambda s: re.sub(r"[^а-яa-z0-9 ]", "", s.lower().replace("ё", "е").replace("щас", "сейчас")).split()
bad = 0
for L in lines:
    segs, _ = model.transcribe(f"{vd}/{L['id']}.wav", language="ru", beam_size=5)
    heard = " ".join(s.text.strip() for s in segs)
    r = difflib.SequenceMatcher(None, norm(L["text"]), norm(heard)).ratio()
    ok = r >= 0.8 or L.get("shout")
    bad += not ok
    print(f"{'✓' if ok else '✗'} {L['id']:9} {r:.2f}  «{L['text']}» → «{heard}»")
sys.exit(1 if bad else 0)
