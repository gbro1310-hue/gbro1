import React from "react";
import { AbsoluteFill, interpolate, random } from "remotion";
import { useAnim } from "../../../../shared/anim";
import { Background } from "../../../../shared/components/Background";
import { TrafficLight } from "../../../../shared/components/TrafficLight";
import { colors, fonts, safeCenterX, springs, textStroke } from "../../../../shared/theme";
import { at } from "../timing";

/** Сцена 1 — «СТОЙ.»: загорается красный, слово выпрыгивает, сзади встаёт пробка из стоп-сигналов */
export const Hook: React.FC = () => {
  const { t, sp, lin } = useAnim();
  const flicker = t < 0.25 ? (Math.floor(t * 30) % 3 === 1 ? 0.3 : lin([0.03, 0.22], [0, 1])) : 1;
  const stop = sp(0.12, springs.pop);
  const settle = sp(at("сколько"), springs.soft);
  const jam = sp(at("сегодня"), springs.soft);
  return (
    <AbsoluteFill>
      <Background tint={colors.red} tintStrength={0.28 * flicker} dim={lin([0, 0.25], [0.6, 0])} seed="hook" />
      {/* пробка: ряды стоп-сигналов (боке) */}
      <AbsoluteFill style={{ opacity: jam }}>
        {new Array(4).fill(0).map((_, row) =>
          new Array(5).fill(0).map((__, i) => {
            const x = 60 + i * 210 + (row % 2) * 100 + (random(`j${row}${i}`) - 0.5) * 40;
            const y = 1480 + row * 90;
            const s = 1 - row * 0.12;
            const fromX = (i < 2.5 ? -1 : 1) * 400 * (1 - jam);
            const blink = 0.75 + 0.25 * Math.sin(t * 6 + row + i);
            return (
              <div key={`${row}-${i}`} style={{ position: "absolute", left: x + fromX, top: y, display: "flex", gap: 70 * s, scale: s }}>
                {[0, 1].map((k) => (
                  <div
                    key={k}
                    style={{
                      width: 46, height: 22, borderRadius: 12, background: colors.red, opacity: blink,
                      boxShadow: `0 0 30px 10px ${colors.red}88`, filter: `blur(${row * 1.5}px)`,
                    }}
                  />
                ))}
              </div>
            );
          }),
        )}
      </AbsoluteFill>
      <div
        style={{
          position: "absolute", left: safeCenterX, top: 300, translate: "-50% 0",
          scale: interpolate(settle, [0, 1], [1, 0.82]), transformOrigin: "50% 0%",
        }}
      >
        <TrafficLight state="red" level={flicker} size={150} />
      </div>
      <div
        style={{
          position: "absolute", left: safeCenterX, top: interpolate(settle, [0, 1], [1010, 930]),
          translate: "-50% -50%", fontFamily: fonts.heading, fontWeight: 900,
          fontSize: 250, color: colors.text, letterSpacing: -6, whiteSpace: "nowrap",
          scale: interpolate(stop, [0, 1], [2.4, 1]) * interpolate(settle, [0, 1], [1, 0.8]),
          opacity: interpolate(stop, [0, 0.3], [0, 1], { extrapolateRight: "clamp" }),
          ...textStroke(16),
          textShadow: `0 0 60px ${colors.red}`,
        }}
      >
        СТОЙ.
      </div>
    </AbsoluteFill>
  );
};
