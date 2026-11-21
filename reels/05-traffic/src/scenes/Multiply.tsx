import React from "react";
import { AbsoluteFill, interpolate, random } from "remotion";
import { useAnim } from "../../../../shared/anim";
import { Background } from "../../../../shared/components/Background";
import { Counter } from "../../../../shared/components/Counter";
import { colors, fonts, safeCenterX, springs, textStroke } from "../../../../shared/theme";
import { at } from "../timing";

/** Сцена 3 — «1 ч × 365» → цифры разлетаются → счётчик 0→365 → сжимается в «15 СУТОК / год» */
export const Multiply: React.FC = () => {
  const { t, sp, lin } = useAnim();
  const one = sp(at("умножаем"));
  const times = sp(at("триста", 1));
  const burstAt = at("получается");
  const burst = lin([burstAt, burstAt + 0.45], [0, 1], (x) => 1 - Math.pow(1 - x, 3));
  const countStart = burstAt + 0.1;
  const countEnd = at("часов") + 0.05;
  const counterIn = sp(countStart, springs.pop);
  const hoursLabel = sp(at("часов"));
  const shrink = sp(at("это"), springs.soft);
  const days = sp(at("пятнадцать"), springs.pop);
  const perYear = sp(at("год", 1));
  const head: React.CSSProperties = { fontFamily: fonts.heading, fontWeight: 900, color: colors.text, whiteSpace: "nowrap", ...textStroke(12) };

  return (
    <AbsoluteFill>
      <Background tint={colors.yellow} tintStrength={0.1 + 0.1 * days} seed="mul" />
      {/* «1 ч × 365» — разлетается на осколки */}
      {burst < 1 ? (
        <div style={{ position: "absolute", left: safeCenterX, top: 700, translate: "-50% -50%", display: "flex", gap: 40, alignItems: "baseline" }}>
          {["1 Ч", "×", "365"].map((s, i) => {
            const vis = i === 0 ? one : times;
            const dx = (random(`bx${i}`) - 0.5) * 1600 * burst;
            const dy = (random(`by${i}`) - 0.5) * 1400 * burst;
            return (
              <span
                key={i}
                style={{
                  ...head, fontSize: i === 1 ? 140 : 190, color: i === 2 ? colors.yellow : colors.text,
                  display: "inline-block", scale: interpolate(vis, [0, 1], [0, 1]) * (1 + burst),
                  translate: `${dx}px ${dy}px`, rotate: `${burst * (random(`br${i}`) - 0.5) * 220}deg`,
                  opacity: 1 - burst,
                }}
              >
                {s}
              </span>
            );
          })}
        </div>
      ) : null}
      {/* счётчик 0 → 365 часов */}
      {t >= countStart ? (
        <div
          style={{
            position: "absolute", left: safeCenterX, top: interpolate(shrink, [0, 1], [680, 420]),
            translate: "-50% -50%", textAlign: "center",
            scale: interpolate(counterIn, [0, 1], [0.3, 1]) * interpolate(shrink, [0, 1], [1, 0.48]),
            opacity: interpolate(shrink, [0, 1], [1, 0.55]),
          }}
        >
          <Counter to={365} startSec={countStart} endSec={countEnd} style={{ ...head, fontSize: 330, color: colors.yellow, display: "block", lineHeight: 1 }} />
          <div style={{ ...head, fontSize: 96, scale: interpolate(hoursLabel, [0, 1], [0, 1]), marginTop: 10 }}>ЧАСОВ</div>
        </div>
      ) : null}
      {/* 15 суток в год */}
      {t >= at("пятнадцать") - 0.05 ? (
        <div style={{ position: "absolute", left: safeCenterX, top: 790, translate: "-50% -50%", textAlign: "center" }}>
          <div style={{ ...head, fontSize: 168, lineHeight: 1, scale: interpolate(days, [0, 1], [3, 1]), opacity: interpolate(days, [0, 0.4], [0, 1], { extrapolateRight: "clamp" }) }}>
            15 СУТОК
          </div>
          <div style={{ ...head, fontSize: 80, color: colors.yellow, marginTop: 14, scale: interpolate(perYear, [0, 1], [0, 1]) }}>
            КАЖДЫЙ ГОД
          </div>
        </div>
      ) : null}
      {/* календарная полоска из 15 дней */}
      <div style={{ position: "absolute", left: safeCenterX, top: 1095, translate: "-50% 0", display: "flex", gap: 10 }}>
        {new Array(15).fill(0).map((_, i) => {
          const p = sp(at("пятнадцать") + 0.25 + i * 0.06, springs.snappy);
          return (
            <div key={i} style={{ width: 40, height: 52, borderRadius: 8, background: colors.red, scale: p, opacity: p, boxShadow: `0 0 18px ${colors.red}77` }} />
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
