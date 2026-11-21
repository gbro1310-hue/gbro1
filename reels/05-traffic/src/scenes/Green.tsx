import React from "react";
import { AbsoluteFill, interpolate } from "remotion";
import { useAnim } from "../../../../shared/anim";
import { Background } from "../../../../shared/components/Background";
import { Counter } from "../../../../shared/components/Counter";
import { TrafficLight } from "../../../../shared/components/TrafficLight";
import { colors, fonts, safeCenterX, springs, textStroke } from "../../../../shared/theme";
import { at, SCENES } from "../timing";

const COLS = 18, ROWS = 27; // 18 × 27 = 486 «серий»

/** Сцена 6 — светофор переключается на зелёный; сетка из 486 серий заполняется волной; «новый язык» */
export const Green: React.FC = () => {
  const { t, sp, lin } = useAnim();
  const s0 = SCENES.green;
  const state = t < s0 + 0.12 ? "red" : t < s0 + 0.35 ? "yellow" : "green";
  const level = state === "green" ? sp(s0 + 0.35, springs.soft) : 1;
  const waveStart = at("посмотреть") - 0.1;
  const waveEnd = at("серий") + 0.2;
  const pill = sp(at("пятьсот"), springs.pop);
  const langAt = at("или");
  const gridOut = lin([langAt - 0.1, langAt + 0.3], [1, 0]);
  const langLabel = sp(at("язык"));
  const cw = 36, ch = 20, gap = 6;
  const gw = COLS * (cw + gap) - gap, gh = ROWS * (ch + gap) - gap;
  const head: React.CSSProperties = { fontFamily: fonts.heading, fontWeight: 900, color: colors.text, whiteSpace: "nowrap", ...textStroke(12) };
  return (
    <AbsoluteFill>
      <Background tint={state === "green" ? colors.green : colors.red} tintStrength={0.22 * (state === "green" ? level : 1)} seed="green" />
      <div style={{ position: "absolute", left: safeCenterX, top: 275, translate: "-50% 0" }}>
        <TrafficLight state={state} level={level} horizontal size={86} />
      </div>
      {/* сетка серий */}
      <div style={{ position: "absolute", left: safeCenterX - gw / 2, top: 450, width: gw, height: gh, opacity: gridOut, scale: interpolate(gridOut, [0, 1], [0.85, 1]) }}>
        {new Array(ROWS * COLS).fill(0).map((_, i) => {
          const r = Math.floor(i / COLS), c = i % COLS;
          const k = (r / ROWS) * 0.75 + (c / COLS) * 0.25;
          const at0 = waveStart + k * (waveEnd - waveStart);
          const on = lin([at0, at0 + 0.18], [0, 1]);
          return (
            <div
              key={i}
              style={{
                position: "absolute", left: c * (cw + gap), top: r * (ch + gap), width: cw, height: ch, borderRadius: 5,
                background: on > 0 ? (i % 7 === 0 ? colors.yellow : colors.green) : "#22222c",
                opacity: 0.35 + 0.65 * on, scale: 0.6 + 0.4 * on,
              }}
            />
          );
        })}
      </div>
      {t >= at("пятьсот") - 0.05 ? (
        <div
          style={{
            position: "absolute", left: safeCenterX, top: 800, translate: "-50% -50%",
            background: "rgba(14,14,18,0.86)", border: `4px solid ${colors.green}`, borderRadius: 36,
            padding: "26px 48px", textAlign: "center", scale: interpolate(pill, [0, 1], [0.3, 1]) * gridOut, opacity: gridOut,
          }}
        >
          <div style={{ ...head, fontSize: 150, lineHeight: 1, color: colors.green }}>
            ≈<Counter from={300} to={486} startSec={at("пятьсот")} endSec={at("сериала")} />
          </div>
          <div style={{ ...head, fontSize: 64 }}>СЕРИЙ СЕРИАЛА</div>
        </div>
      ) : null}
      {/* новый язык */}
      {t >= langAt ? (
        <div style={{ position: "absolute", left: safeCenterX, top: 760, translate: "-50% -50%", display: "flex", flexDirection: "column", alignItems: "center", gap: 40 }}>
          <div style={{ display: "flex", gap: 34 }}>
            {["あ", "Ab", "한", "Ü"].map((g, i) => {
              const p = sp(langAt + 0.08 + i * 0.18, springs.pop);
              return (
                <div
                  key={g}
                  style={{
                    width: 170, height: 170, borderRadius: 85, background: i % 2 ? colors.card : colors.green,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontFamily: `${fonts.heading}, "Noto Sans CJK JP", "Noto Sans CJK KR", sans-serif`, fontWeight: 900, fontSize: 86, color: colors.text,
                    scale: p, rotate: `${interpolate(p, [0, 1], [-90, 0])}deg`, boxShadow: "0 18px 40px rgba(0,0,0,0.5)",
                  }}
                >
                  {g}
                </div>
              );
            })}
          </div>
          <div style={{ ...head, fontSize: 100, color: colors.green, scale: langLabel }}>НОВЫЙ ЯЗЫК</div>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};
