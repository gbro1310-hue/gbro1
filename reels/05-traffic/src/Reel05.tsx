import React, { useMemo } from "react";
import { AbsoluteFill, interpolate, Sequence, staticFile, useVideoConfig } from "remotion";
import { Audio } from "@remotion/media";
import { TransitionSeries, linearTiming, type TransitionPresentation } from "@remotion/transitions";
import { Captions } from "../../../shared/components/Captions";
import { CameraShake } from "../../../shared/components/CameraShake";
import { MemePopup } from "../../../shared/components/MemePopup";
import { SafeZones } from "../../../shared/components/SafeZones";
import { circleMask, whipPan, zoomThrough } from "../../../shared/components/transitions";
import { colors, fonts, safe } from "../../../shared/theme";
import { speechMask } from "../../../shared/timing";
import { ACCENT, asset, at, SCENES, TL, TOTAL_SEC, VOICE_OFFSET } from "./timing";
import { Hook } from "./scenes/Hook";
import { Clock } from "./scenes/Clock";
import { Multiply } from "./scenes/Multiply";
import { Wheel } from "./scenes/Wheel";
import { Timeline } from "./scenes/Timeline";
import { Green } from "./scenes/Green";
import { Cta } from "./scenes/Cta";

export type Reel05Props = { withMusic: boolean; showSafeZones: boolean };

const TD = 10; // длительность перехода, кадров

/** Сцена живёт в абсолютном времени ролика: внутри useCurrentFrame() = кадр всего ролика */
const Abs: React.FC<{ start: number; children: React.ReactNode }> = ({ start, children }) => (
  <Sequence from={-start} layout="absolute-fill">
    {children}
  </Sequence>
);

const SFX: React.FC<{ name: string; at: number; volume?: number; dur?: number; fadeOut?: number }> = ({
  name, at: atSec, volume = 0.5, dur, fadeOut = 0,
}) => {
  const { fps } = useVideoConfig();
  const from = Math.max(0, Math.round(atSec * fps));
  return (
    <Sequence from={from} durationInFrames={dur ? Math.round(dur * fps) : undefined} layout="none" name={`sfx:${name}`}>
      <Audio
        src={staticFile(asset(`sfx/${name}.mp3`))}
        volume={(f) =>
          dur && fadeOut
            ? volume * interpolate(f, [(dur - fadeOut) * fps, dur * fps], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
            : volume
        }
      />
    </Sequence>
  );
};

export const Reel05: React.FC<Reel05Props> = ({ withMusic, showSafeZones }) => {
  const { fps } = useVideoConfig();
  const total = TOTAL_SEC * fps;

  const order = [
    { key: "hook", el: <Hook /> },
    { key: "clock", el: <Clock /> },
    { key: "multiply", el: <Multiply /> },
    { key: "wheel", el: <Wheel /> },
    { key: "timeline", el: <Timeline /> },
    { key: "green", el: <Green /> },
    { key: "cta", el: <Cta /> },
  ] as const;
  const bounds = order.map((o) => Math.round(SCENES[o.key] * fps));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const presentations: TransitionPresentation<any>[] = [
    zoomThrough(),
    whipPan({ direction: 1 }),
    circleMask({ cx: 540, cy: 800 }),
    whipPan({ direction: -1 }),
    zoomThrough({ flash: colors.green }),
    whipPan({ direction: 1 }),
  ];

  const mask = useMemo(() => speechMask(TL.words, fps, total), [fps, total]);
  const dipStart = at("сорок") - 0.3;
  const dipEnd = SCENES.green;
  const musicVolume = (f: number) => {
    const sec = f / fps;
    const speaking = mask[Math.min(f, total - 1)] ?? 0;
    const base = interpolate(speaking, [0, 1], [0.2, 0.085]); // ≈ −18…−21 dB под голосом
    const dip = interpolate(sec, [dipStart, dipStart + 0.6, dipEnd - 0.3, dipEnd], [1, 0.18, 0.18, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    const bright = sec >= dipEnd ? 1.25 : 1;
    const fadeIn = interpolate(sec, [0, 0.6], [0.4, 1], { extrapolateRight: "clamp" });
    const fadeOut = interpolate(sec, [TOTAL_SEC - 1.5, TOTAL_SEC], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    return base * dip * bright * fadeIn * fadeOut;
  };

  const shakeHits = [
    Math.round(0.14 * fps),
    Math.round(at("пятнадцать") * fps),
    Math.round(at("год", 2) * fps),
    Math.round(at("восемь") * fps),
  ];

  return (
    <AbsoluteFill style={{ backgroundColor: colors.bg }}>
      <CameraShake hits={shakeHits} amplitude={6} duration={7}>
        <TransitionSeries>
          {order.map((o, i) => {
            const start = bounds[i] - (i > 0 ? TD / 2 : 0);
            const end = i < order.length - 1 ? bounds[i + 1] + TD / 2 : total;
            return (
              <React.Fragment key={o.key}>
                <TransitionSeries.Sequence durationInFrames={end - start} name={o.key}>
                  <Abs start={start}>{o.el}</Abs>
                </TransitionSeries.Sequence>
                {i < order.length - 1 ? (
                  <TransitionSeries.Transition presentation={presentations[i]} timing={linearTiming({ durationInFrames: TD })} />
                ) : null}
              </React.Fragment>
            );
          })}
        </TransitionSeries>
      </CameraShake>

      {/* Мем-вставки (4 шт.) */}
      <MemePopup type="push" atSec={at("всего") - 0.1} durSec={2.1} title="Мама" text="ты где? 🙂" icon="💬" />
      <MemePopup type="sticker" emoji="💀" atSec={at("суток", 1)} durSec={1.3} x={750} y={410} size={200} />
      <MemePopup type="text" atSec={at("только")} durSec={1.7} y={470} angle={-5} text={"бро, это не пробка,\nэто образ жизни"} />
      <MemePopup
        type="chat"
        atSec={at("машине") - 0.1}
        durSec={SCENES.green - at("машине") + 0.05}
        y={700}
        messages={[
          { text: "Что делал почти 2 года?", side: "left", atSec: at("машине") - 0.1 },
          { text: "Стоял на перекрёстке 🫠", side: "right", atSec: at("под") + 0.05 },
        ]}
      />

      <Captions words={TL.words} accent={ACCENT} y={1300} hideBetween={[[0, 0.62]]} />

      {/* водяной знак */}
      <div style={{ position: "absolute", left: safe.left, top: 1920 - safe.bottom - 60, fontFamily: fonts.body, fontWeight: 700, fontSize: 32, color: colors.muted, opacity: 0.75 }}>
        bishkek.motion
      </div>

      {showSafeZones ? <SafeZones /> : null}

      {/* ===== Звук ===== */}
      <Sequence from={Math.round(VOICE_OFFSET * fps)} layout="none" name="voice">
        <Audio src={staticFile(asset("voice.mp3"))} volume={1} />
      </Sequence>
      {withMusic ? <Audio src={staticFile(asset("music.mp3"))} volume={musicVolume} name="music" /> : null}

      <SFX name="bass_horn" at={0} volume={0.7} />
      <SFX name="ticking" at={SCENES.clock} volume={0.35} dur={at("пятнадцать") - SCENES.clock} fadeOut={0.4} />
      <SFX name="ding" at={at("всего") - 0.05} volume={0.35} />
      <SFX name="ding" at={at("пятнадцать")} volume={0.55} />
      <SFX name="pop" at={at("суток", 1)} volume={0.5} />
      <SFX name="pop" at={at("только")} volume={0.45} />
      <SFX name="engine" at={SCENES.wheel} volume={0.4} dur={SCENES.timeline - SCENES.wheel + 0.2} fadeOut={0.5} />
      <SFX name="dundun" at={at("сорок") + 0.05} volume={0.6} />
      <SFX name="pop" at={at("машине") - 0.1} volume={0.4} />
      <SFX name="pop" at={at("под") + 0.05} volume={0.4} />
      <SFX name="pop" at={at("или") + 0.08} volume={0.35} />
      <SFX name="pop" at={SCENES.cta + 0.05} volume={0.45} />
      <SFX name="pop" at={TL.voiceEnd + 0.15} volume={0.55} />
      {[SCENES.clock, SCENES.multiply, SCENES.wheel, SCENES.timeline, SCENES.green, SCENES.cta].map((s, i) => (
        <SFX key={i} name="whoosh" at={s - 0.22} volume={0.3} />
      ))}
    </AbsoluteFill>
  );
};
