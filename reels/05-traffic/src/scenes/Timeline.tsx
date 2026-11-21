import React from "react";
import { AbsoluteFill, interpolate } from "remotion";
import { useAnim } from "../../../../shared/anim";
import { Background } from "../../../../shared/components/Background";
import { Counter } from "../../../../shared/components/Counter";
import { colors, fonts, safeCenterX, springs, textStroke } from "../../../../shared/theme";
import { at, SCENES } from "../timing";

/** Сцена 5 — шкала 1 год → 10 лет → 40 лет; финальная цифра — зум-драма */
export const Timeline: React.FC = () => {
  const { t, sp, lin } = useAnim();
  const appear = sp(SCENES.timeline, springs.soft);
  const forty = at("сорок");
  const p = t < forty ? lin([at("десять"), at("десять") + 0.6], [0, 0.5]) : lin([forty, forty + 0.6], [0.5, 1]);
  const dark = lin([forty - 0.1, forty + 0.5], [0, 0.55]);
  const drama = sp(at("год", 2), { damping: 13, stiffness: 160 });
  const months = sp(at("восемь"), springs.pop);
  const life = sp(at("жизни"));
  const moveUp = sp(at("машине") - 0.25, springs.soft);
  const x0 = safeCenterX - 360, x1 = safeCenterX + 360;
  const nodes = [
    { label: "1 ГОД", pos: 0 },
    { label: "10 ЛЕТ", pos: 0.5 },
    { label: "40 ЛЕТ", pos: 1 },
  ];
  const head: React.CSSProperties = { fontFamily: fonts.heading, fontWeight: 900, color: colors.text, whiteSpace: "nowrap", ...textStroke(12) };
  const tenPhase = t < forty - 0.05;
  const tenOut = lin([forty - 0.15, forty + 0.1], [1, 0]);
  return (
    <AbsoluteFill>
      <Background tint={colors.red} tintStrength={0.12 + 0.2 * dark} dim={dark} seed="tl" />
      {/* шкала времени */}
      <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, opacity: appear * interpolate(moveUp, [0, 1], [1, 0]) }}>
        <div style={{ position: "absolute", left: x0, top: 400, width: x1 - x0, height: 14, borderRadius: 7, background: "#2a2a35" }} />
        <div
          style={{
            position: "absolute", left: x0, top: 400, width: (x1 - x0) * p, height: 14, borderRadius: 7,
            background: `linear-gradient(90deg, ${colors.yellow}, ${colors.red})`, boxShadow: `0 0 24px ${colors.red}`,
          }}
        />
        {nodes.map((n, i) => {
          const reached = p >= n.pos - 0.001;
          return (
            <div key={i} style={{ position: "absolute", left: x0 + (x1 - x0) * n.pos, top: 407, translate: "-50% -50%", display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ width: 44, height: 44, borderRadius: 22, background: reached ? (i === 2 ? colors.red : colors.yellow) : "#2a2a35", border: "6px solid #0E0E12", scale: reached ? 1.15 : 1 }} />
              <div style={{ position: "absolute", top: 60, whiteSpace: "nowrap", fontFamily: fonts.heading, fontWeight: 800, fontSize: 44, color: reached ? colors.text : colors.muted }}>{n.label}</div>
            </div>
          );
        })}
      </div>
      {/* 10 лет: 150 суток ≈ 5 месяцев */}
      {tenPhase || tenOut > 0 ? (
        <div style={{ position: "absolute", left: safeCenterX, top: 820, translate: "-50% -50%", textAlign: "center", opacity: tenOut * appear }}>
          <div style={{ ...head, fontSize: 250, lineHeight: 1, color: colors.yellow }}>
            <Counter from={15} to={150} startSec={at("сто")} endSec={at("суток", 2) + 0.2} />
          </div>
          <div style={{ ...head, fontSize: 90 }}>СУТОК</div>
          <div style={{ ...head, fontSize: 64, color: colors.muted, marginTop: 18, scale: sp(at("почти", 1)) }}>≈ 5 МЕСЯЦЕВ</div>
        </div>
      ) : null}
      {/* 40 лет: зум-драма */}
      {t >= at("год", 2) - 0.05 ? (
        <div
          style={{
            position: "absolute", left: safeCenterX, top: interpolate(moveUp, [0, 1], [820, 470]),
            translate: "-50% -50%", textAlign: "center",
            scale: interpolate(drama, [0, 1], [3.2, 1]) * interpolate(moveUp, [0, 1], [1, 0.62]),
            opacity: interpolate(drama, [0, 0.25], [0, 1], { extrapolateRight: "clamp" }),
          }}
        >
          <div style={{ ...head, fontSize: 280, lineHeight: 0.95, color: colors.red, textShadow: `0 0 80px ${colors.red}` }}>1 ГОД</div>
          <div style={{ ...head, fontSize: 132, lineHeight: 1.05, color: colors.red, scale: interpolate(months, [0, 1], [0, 1]) }}>8 МЕСЯЦЕВ</div>
          <div style={{ ...head, fontSize: 60, color: colors.text, marginTop: 14, opacity: life, translate: `0 ${interpolate(life, [0, 1], [30, 0])}px` }}>ТВОЕЙ ЖИЗНИ</div>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};
