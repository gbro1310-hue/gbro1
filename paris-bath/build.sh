#!/bin/sh
# Rebuild: voice (ElevenLabs channel voice) → subs → mix → picture → master. Fonts: see CREDITS (Google Fonts, latin slices, h0..h4.woff2).
set -e
LIB=${LIB:-/root/lemo-opuscar}; HERE=$(cd "$(dirname "$0")" && pwd)
(cd "$HERE/voice" && python3 tts.py --reuse) && ffmpeg -v error -y -i "$HERE/voice/voice.mp3" -af atempo=0.96 -ar 48000 -ac 1 "$HERE/voice.wav"
python3 "$HERE/make_subs.py"
"$LIB/.venv/bin/python" "$HERE/mix.py"
cd "$LIB" && node core/render/video.mjs "$HERE" --fps 24 --workers 2 --q 'ss=1.25' --size 1080x1920 --out "$HERE/out/video.mp4"
sh core/render/mux.sh "$HERE/out/video.mp4" "$HERE/out/mix.wav" "$HERE/the-baths-are-hot.mp4" 24 0
