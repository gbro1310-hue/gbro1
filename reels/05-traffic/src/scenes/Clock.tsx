import React from "react";
import { AbsoluteFill, interpolate } from "remotion";
import { useAnim } from "../../../../shared/anim";
import { Background } from "../../../../shared/components/Background";
import { colors, fonts, safeCenterX, springs, textStroke } from "../../../../shared/theme";
import { at, SCENES } from "../timing";

/** Сцена 2 — большие часы, минутная стрелка делает полный круг: «1 ЧАС» */
export const Clock: React.FC = () => {
  const { sp, lin } = useAnim();
  const appear = sp(SCENES.clock, springs.soft);
  const spinStart = at("час", 1) - 0.2;
  const minute = lin([spinStart, spinStart + 2], [0, 360], (x) => x);
  const hour = lin([spinStart, spinStart + 2], [300, 330], (x) => x);
  const label = sp(at("час", 1));
  const bump = sp(at("всего"), springs.pop);
  const R = 270;
  return (
    <AbsoluteFill>
      <Background tint={colors.yellow} tintStrength={0.12} seed="clock" />
      <div
        style={{
          position: "absolute", left: safeCenterX - R, top: 720 - R, width: R * 2, height: R * 2,
          scale: interpolate(appear, [0, 1], [0.5, 1]) * (1 + 0.06 * Math.sin(bump * Math.PI)),
          opacity: appear,
        }}
      >
        <svg width={R * 2} height={R * 2} viewBox="-100 -100 200 200">
          <defs>
            <radialGradient id="face" cx="50%" cy="40%" r="60%">
              <stop offset="0%" stopColor="#2b2b36" />
              <stop offset="100%" stopColor="#15151b" />
            </radialGradient>
          </defs>
          <circle r="96" fill="url(#face)" stroke={colors.yellow} strokeWidth="5" />
          {/* сектор пройденного времени */}
          <path
            d={describeArc(minute)}
            fill={`${colors.yellow}33`}
          />
          {new Array(12).fill(0).map((_, i) => (
            <line
              key={i}
              x1="0" y1={-84} x2="0" y2={i % 3 === 0 ? -70 : -76}
              stroke={i % 3 === 0 ? colors.text : colors.muted}
              strokeWidth={i % 3 === 0 ? 5 : 3} strokeLinecap="round"
              transform={`rotate(${i * 30})`}
            />
          ))}
          <line x1="0" y1="0" x2="0" y2="-45" stroke={colors.text} strokeWidth="8" strokeLinecap="round" transform={`rotate(${hour})`} />
          <line x1="0" y1="10" x2="0" y2="-74" stroke={colors.yellow} strokeWidth="5" strokeLinecap="round" transform={`rotate(${minute})`} />
          <circle r="7" fill={colors.yellow} />
        </svg>
      </div>
      <div
        style={{
          position: "absolute", left: safeCenterX, top: 1090, translate: "-50% -50%",
          fontFamily: fonts.heading, fontWeight: 900, fontSize: 130, color: colors.yellow, whiteSpace: "nowrap",
          scale: interpolate(label, [0, 1], [0, 1]) * (1 + 0.1 * Math.sin(bump * Math.PI)),
          ...textStroke(12),
        }}
      >
        1 ЧАС
      </div>
    </AbsoluteFill>
  );
};

function describeArc(deg: number) {
  if (deg <= 0.1) return "";
  const d = Math.min(deg, 359.9);
  const r = 90;
  const a = ((d - 90) * Math.PI) / 180;
  const x = r * Math.cos(a), y = r * Math.sin(a);
  return `M0 0 L0 ${-r} A${r} ${r} 0 ${d > 180 ? 1 : 0} 1 ${x} ${y} Z`;
}
