#!/bin/sh
# One-command build: picture → mix → master. Needs the Lemo-Opuscar library (LIB) with core deps installed.
set -e
LIB=${LIB:-/root/lemo-opuscar}
HERE=$(cd "$(dirname "$0")" && pwd)
export LIB
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the library folder"; exit 1; }
ffmpeg -v error -y -i "$HERE/voice.mp3" -ar 48000 -ac 1 "$HERE/voice.wav"
cd "$LIB"
node core/render/events.mjs "$HERE" --size 1080x1920
node core/render/video.mjs "$HERE" --fps 24 --workers 4 --size 1080x1920 --out "$HERE/out/video.mp4"
"$LIB/.venv/bin/python" "$HERE/mix.py"
sh core/render/mux.sh "$HERE/out/video.mp4" "$HERE/out/mix.wav" "$HERE/tonight-you-sleep-with-the-cow.mp4" 24 1
