# Бишкек изнутри — Reels на Remotion

Один Remotion-проект на все ролики канала (водяной знак в видео — bishkek.motion).

```
reels/
  _shared/fonts/        Montserrat + Inter (локально, SIL OFL)
  05-traffic/
    script.md           сценарий: сцены, тайминги, источники, подпись, хэштеги
    voiceover.txt       текст для TTS
    public/             voice.mp3, voice_timestamps.json, music.mp3, sfx/
    samples/            сэмплы голосов на выбор
    src/                композиция ролика (Reel05.tsx, scenes/, timing.ts)
    out/                05-traffic_full.mp4, 05-traffic_voice_only.mp4
shared/
  theme.ts              цвета, шрифты, safe-зоны, spring-пресеты
  timing.ts, anim.ts    тайминги по словам озвучки, хелперы анимации
  components/           Captions, MemePopup, ChatBubble, Counter, TrafficLight,
                        CameraShake, Background, SafeZones, transitions (whipPan, zoomThrough, circleMask)
  tools/lofi.py         генератор фонового lo-fi без авторских прав
scripts/
  voice.py              ElevenLabs TTS with-timestamps → voice.mp3 + voice_timestamps.json
  stills.mjs            рендер отдельных кадров для проверки
```

## Конвейер для ролика
```bash
npm i
export ELEVENLABS_API_KEY=...            # никогда не коммить
npm run voice reels/05-traffic           # озвучка + тайминги слов
npm run studio                           # превью (Reel05-full; пропс showSafeZones: true — подсветить зоны IG)
npm run render:05                        # out/*_full.mp4 и out/*_voice_only.mp4
```

Тайминги сцен и анимаций привязаны к словам (`at("сорок")`), поэтому после
перегенерации озвучки ролик сам подстраивается — ничего не надо сдвигать руками.
