import React from "react";
import { AbsoluteFill, interpolate } from "remotion";
import { useAnim } from "../../../../shared/anim";
import { Background } from "../../../../shared/components/Background";
import { colors, fonts, safeCenterX, springs, textStroke } from "../../../../shared/theme";
import { at, SCENES, TL } from "../timing";

/** Сцена 7 — поле ввода с мигающим курсором, стрелка вниз, пульсирующая иконка комментария */
export const Cta: React.FC = () => {
  const { t, sp } = useAnim();
  const card = sp(SCENES.cta + 0.05, springs.soft);
  const cursorOn = Math.floor(t * 2.2) % 2 === 0;
  const result = sp(at("посчитаю"), springs.pop);
  const end = TL.voiceEnd + 0.15;
  const final = sp(end, springs.pop);
  const arrowBounce = Math.abs(Math.sin(t * 4.5)) * 26;
  const pulse = 1 + 0.08 * Math.sin(t * 7);
  const head: React.CSSProperties = { fontFamily: fonts.heading, fontWeight: 900, color: colors.text, whiteSpace: "nowrap", ...textStroke(12) };
  return (
    <AbsoluteFill>
      <Background tint={colors.yellow} tintStrength={0.14} seed="cta" />
      <div
        style={{
          position: "absolute", left: safeCenterX - 420, top: 330, width: 840,
          background: colors.card, borderRadius: 44, padding: "44px 48px",
          boxShadow: "0 30px 80px rgba(0,0,0,0.55)", border: "2px solid #34344a",
          scale: interpolate(card, [0, 1], [0.7, 1]), opacity: card,
          translate: `0 ${interpolate(card, [0, 1], [120, 0])}px`,
        }}
      >
        <div style={{ fontFamily: fonts.heading, fontWeight: 800, fontSize: 54, lineHeight: 1.15, color: colors.text }}>
          Сколько часов в день ты в пробке?
        </div>
        <div
          style={{
            marginTop: 34, height: 130, borderRadius: 28, background: "#15151c", border: `4px solid ${colors.yellow}`,
            display: "flex", alignItems: "center", padding: "0 34px", fontFamily: fonts.heading, fontWeight: 800, fontSize: 70, color: colors.muted,
          }}
        >
          ___ ч
          <span style={{ width: 6, height: 80, background: colors.yellow, marginLeft: 14, opacity: cursorOn ? 1 : 0 }} />
        </div>
        <div
          style={{
            marginTop: 30, display: "flex", alignItems: "center", gap: 18, fontFamily: fonts.body, fontWeight: 700,
            fontSize: 42, color: colors.yellow, opacity: result, translate: `0 ${interpolate(result, [0, 1], [30, 0])}px`,
          }}
        >
          🧮 посчитаю твою цифру в след. ролике
        </div>
      </div>
      {/* стрелка вниз + иконка комментария */}
      <div style={{ position: "absolute", left: safeCenterX, top: 950 + arrowBounce, translate: "-50% 0", display: "flex", alignItems: "center", gap: 30, opacity: card }}>
        <div style={{ fontSize: 120, fontFamily: fonts.emoji }}>👇</div>
        <div style={{ fontSize: 120, fontFamily: fonts.emoji, scale: pulse }}>💬</div>
      </div>
      {t >= end ? (
        <div style={{ position: "absolute", left: safeCenterX, top: 1330, translate: "-50% -50%", textAlign: "center", scale: final }}>
          <div style={{ ...head, fontSize: 78, color: colors.yellow, lineHeight: 1.05 }}>ПИШИ В КОММЕНТЫ</div>
          <div style={{ ...head, fontSize: 52, color: colors.text, marginTop: 10 }}>сколько часов ты стоишь?</div>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};
