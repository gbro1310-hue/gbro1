#!/bin/sh
# One-command build of the low-poly 3D version. Needs the Lemo-Opuscar library (LIB) with deps installed.
set -e
HERE=$(cd "$(dirname "$0")" && pwd)
LIB=${LIB:-$HOME/lemo-opuscar}
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the Lemo-Opuscar library folder"; exit 1; }
cd "$LIB"
node core/render/events.mjs "$HERE" --size 1080x1920
"$LIB/.venv/bin/python" "$HERE/music.py"
node core/render/video.mjs "$HERE" --size 1080x1920 --fps 30 --workers 3 --out "$HERE/out/video.mp4"
sh core/render/mux.sh "$HERE/out/video.mp4" "$HERE/out/mix.wav" "$HERE/out/10-pogoda-3d_full.mp4" 30 0
sh core/render/mux.sh "$HERE/out/video.mp4" "$HERE/out/mix_voice.wav" "$HERE/out/10-pogoda-3d_voice_only.mp4" 30 0
