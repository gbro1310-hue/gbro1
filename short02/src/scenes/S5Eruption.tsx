import React from "react";
import { AbsoluteFill, Easing, interpolate, random, useCurrentFrame } from "remotion";
import { Badge, C, Flame, Loaf, Stage, Title, clamp } from "../theme";

export const S5Eruption: React.FC = () => {
  const frame = useCurrentFrame();
  const count = Math.round(interpolate(frame, [92, 137], [0, 81], clamp));
  const erupt = frame >= 150;
  const plume = interpolate(frame, [158, 225], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  if (!erupt) {
    return (
      <AbsoluteFill style={{ background: "radial-gradient(#6B4128, #2E1C12)" }}>
        <Stage>
          {/* oven dome */}
          <path d="M 120 1500 L 120 1050 Q 540 600 960 1050 L 960 1500 Z" fill="#A89F91" stroke={C.dark} strokeWidth={8} />
          {[0, 1, 2, 3, 4].map((r) => (
            <path key={r} d={`M ${150 + r * 10} ${1450 - r * 90} L ${930 - r * 10} ${1450 - r * 90}`} stroke="#7E7361" strokeWidth={5} />
          ))}
          <path d="M 330 1500 L 330 1260 Q 540 1060 750 1260 L 750 1500 Z" fill="#1A0F0A" stroke={C.dark} strokeWidth={8} />
          <ellipse cx={540} cy={1440} rx={190} ry={40} fill={C.fire2} opacity={0.5} />
          <Flame x={470} y={1470} s={0.9} t={frame} />
          <Flame x={610} y={1470} s={0.8} t={frame + 5} />
          {/* loaves sliding in on a peel */}
          {[0, 1, 2].map((k) => {
            const p = interpolate(frame, [70 + k * 18, 95 + k * 18], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
            return (
              <g key={k} opacity={p > 0 && p < 1 ? 1 : p >= 1 ? 0 : 0}>
                <Loaf x={1100 - p * 560} y={1400} r={70} />
              </g>
            );
          })}
          <rect x={0} y={1500} width={1080} height={420} fill="#5A4636" />
        </Stage>
        <Title name="79 AD title" at={6} top={170} size={140} serif color={C.gold}>
          79 AD
        </Title>
        <Badge name="Loaf counter" at={92} top={420} bg={C.dark} fg={C.cream} size={70}>
          {`${count} loaves`}
        </Badge>
      </AbsoluteFill>
    );
  }
  return (
    <AbsoluteFill style={{ background: `linear-gradient(#5A4A5A, #C46A45)` }}>
      <AbsoluteFill style={{ background: "#2A2026", opacity: plume * 0.6 }} />
      <Stage>
        {/* ash plume */}
        {Array.from({ length: 18 }).map((_, k) => {
          const h = plume * (300 + random(`h${k}`) * 900);
          return (
            <circle
              key={k}
              cx={540 + (random(`x${k}`) - 0.5) * 120 * (1 + h / 400)}
              cy={980 - h}
              r={60 + h * 0.25}
              fill={k % 3 ? "#5E5458" : "#7A6E70"}
              opacity={0.9}
            />
          );
        })}
        <path d="M -100 1500 L 400 1000 L 680 1000 L 1180 1500 Z" fill="#6E4A3A" stroke={C.dark} strokeWidth={8} />
        <path d="M 400 1000 L 680 1000 L 640 1060 L 440 1060 Z" fill={C.fire2} />
        <rect x={0} y={1480} width={1080} height={440} fill="#4A3A30" />
        {Array.from({ length: 40 }).map((_, k) => (
          <circle key={k} cx={random(`ax${k}`) * 1080} cy={((frame - 150) * (6 + random(`s${k}`) * 6) + random(`ay${k}`) * 1900) % 1900} r={4} fill="#D8D0C8" opacity={0.7} />
        ))}
      </Stage>
      <Title name="Vesuvius title" at={160} top={170} size={120} color={C.fire1}>
        VESUVIUS
      </Title>
    </AbsoluteFill>
  );
};
