import React from "react";
import { AbsoluteFill, interpolate } from "remotion";
import { useAnim } from "../../../../shared/anim";
import { Background } from "../../../../shared/components/Background";
import { TrafficLight } from "../../../../shared/components/TrafficLight";
import { colors, fonts, safeCenterX, springs } from "../../../../shared/theme";
import { at, SCENES } from "../timing";

/** Сцена 4 — руль, мигающие стоп-сигналы; 🛏 и 🍽 перечёркиваются */
export const Wheel: React.FC = () => {
  const { t, sp, lin } = useAnim();
  const appear = sp(SCENES.wheel, springs.soft);
  const pulse = 0.5 + 0.5 * Math.sin(t * 7);
  const onlyYou = sp(at("только"), springs.soft);
  const red = sp(at("красный"));
  const iconsOut = lin([at("красный") - 0.2, at("красный") + 0.1], [1, 0]);
  const R = 300;
  const rot = Math.sin(t * 1.4) * 4 + interpolate(onlyYou, [0, 1], [0, -18]);
  const Icon: React.FC<{ e: string; atSec: number; x: number }> = ({ e, atSec, x }) => {
    const p = sp(atSec);
    const cross = lin([atSec + 0.28, atSec + 0.5], [0, 1]);
    return (
      <div style={{ position: "absolute", left: x - 90, top: 1010, width: 180, height: 180, scale: p * iconsOut, opacity: iconsOut }}>
        <div style={{ fontSize: 150, lineHeight: "180px", textAlign: "center", fontFamily: "Noto Color Emoji" }}>{e}</div>
        <svg width="180" height="180" style={{ position: "absolute", left: 0, top: 0 }}>
          <line x1="20" y1="20" x2={20 + 140 * cross} y2={20 + 140 * cross} stroke={colors.red} strokeWidth="16" strokeLinecap="round" />
          <line x1="160" y1="20" x2={160 - 140 * cross} y2={20 + 140 * cross} stroke={colors.red} strokeWidth="16" strokeLinecap="round" />
        </svg>
      </div>
    );
  };
  return (
    <AbsoluteFill>
      <Background tint={colors.red} tintStrength={0.14 + 0.18 * pulse} seed="wheel" />
      <div
        style={{
          position: "absolute", left: safeCenterX - R, top: 690 - R, width: R * 2, height: R * 2,
          rotate: `${rot}deg`, scale: interpolate(appear, [0, 1], [0.6, 1]), opacity: appear,
          filter: `drop-shadow(0 0 ${30 + 30 * pulse}px ${colors.red}88)`,
        }}
      >
        <svg width={R * 2} height={R * 2} viewBox="-100 -100 200 200">
          <circle r="86" fill="none" stroke="#2c2c36" strokeWidth="20" />
          <circle r="86" fill="none" stroke="#3b3b48" strokeWidth="6" />
          <path d="M-84 -6 Q-40 -26 0 -26 Q40 -26 84 -6" fill="none" stroke="#2c2c36" strokeWidth="18" />
          <path d="M-12 -2 L-24 80 M12 -2 L24 80" stroke="#2c2c36" strokeWidth="18" strokeLinecap="round" />
          <circle r="26" fill="#1f1f27" stroke="#3b3b48" strokeWidth="4" />
          <circle r="9" fill={colors.red} opacity={0.4 + 0.6 * red} />
        </svg>
      </div>
      <Icon e="🛏️" atSec={at("сна")} x={safeCenterX - 170} />
      <Icon e="🍽️" atSec={at("еды")} x={safeCenterX + 170} />
      {t >= at("красный") - 0.05 ? (
        <div style={{ position: "absolute", left: safeCenterX, top: 1100, translate: "-50% -50%", scale: red }}>
          <TrafficLight state="red" horizontal size={80} />
        </div>
      ) : null}
      <div
        style={{
          position: "absolute", left: safeCenterX, top: 330, translate: "-50% 0",
          fontFamily: fonts.heading, fontWeight: 800, fontSize: 44, color: colors.muted,
          letterSpacing: 6, opacity: appear, whiteSpace: "nowrap",
        }}
      >
        БЕЗ СНА · БЕЗ ЕДЫ
      </div>
    </AbsoluteFill>
  );
};
