#!/bin/sh
# Rebuild: voice (ElevenLabs channel voice) → subs → mix → picture → master. Fonts: see CREDITS (Google Fonts, latin slices, h0..h4.woff2).
set -e
LIB=${LIB:-/root/lemo-opuscar}; HERE=$(cd "$(dirname "$0")" && pwd)
(cd "$HERE/voice" && python3 tts.py --reuse) && ffmpeg -v error -y -i "$HERE/voice/voice.mp3" -af atempo=0.97 -ar 48000 -ac 1 "$HERE/voice.wav"
(cd "$HERE" && python3 make_subs.py)
"$LIB/.venv/bin/python" "$HERE/mix.py"
cd "$LIB" && node core/render/video.mjs "$HERE" --fps 24 --workers 2 --q 'ss=1' --size 1920x1080 --out "$HERE/out/video.mp4"
sh core/render/mux.sh "$HERE/out/video.mp4" "$HERE/out/mix.wav" "$HERE/eight-years-of-daylight.mp4" 24 0
