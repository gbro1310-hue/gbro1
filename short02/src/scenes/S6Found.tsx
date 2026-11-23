import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { Badge, C, Loaf, Stage, Title, clamp } from "../theme";

export const S6Found: React.FC = () => {
  const frame = useCurrentFrame();
  const dig = interpolate(frame, [30, 90], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const zoom = interpolate(frame, [180, 215], [1, 2.6], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const glow = interpolate(frame, [205, 225], [0, 1], clamp);
  return (
    <AbsoluteFill style={{ background: "radial-gradient(#4A3E36, #1A1410)" }}>
      <Stage>
        <g transform={`translate(540 1250) scale(${zoom}) translate(-540 -1250)`}>
          <path d="M 120 1500 L 120 1050 Q 540 600 960 1050 L 960 1500 Z" fill="#7E7361" stroke={C.dark} strokeWidth={8} />
          <path d="M 300 1500 L 300 1230 Q 540 1000 780 1230 L 780 1500 Z" fill="#14100D" stroke={C.dark} strokeWidth={8} />
          {[0, 1, 2, 3, 4].map((k) => (
            <Loaf key={k} x={380 + k * 80} y={1440 - (k % 2) * 30} r={58} charred={1} />
          ))}
          <Loaf x={540} y={1300} r={70} charred={1} />
          {glow > 0 &&
            [0, 1, 2, 3].map((i) => {
              const a = (i * Math.PI) / 4;
              return (
                <line
                  key={i}
                  x1={540 - Math.cos(a) * 64}
                  y1={1300 - Math.sin(a) * 38}
                  x2={540 + Math.cos(a) * 64}
                  y2={1300 + Math.sin(a) * 38}
                  stroke={C.gold}
                  strokeWidth={5}
                  opacity={glow}
                  strokeLinecap="round"
                />
              );
            })}
          {/* ash covering, dug away */}
          <rect x={100} y={600 + dig * 1000} width={880} height={1000} fill="#8A8078" />
        </g>
        <rect x={0} y={1500} width={1080} height={420} fill="#3A302A" />
      </Stage>
      <Title name="1862 title" at={29} top={170} size={150} serif color={C.cream}>
        1862
      </Title>
      <Badge name="Still in oven" at={81} top={420} bg={C.dark} fg={C.cream}>
        still in the oven
      </Badge>
      <Badge name="Charcoal" at={129} top={540} bg={C.char} fg={C.cream}>
        burnt to charcoal
      </Badge>
      {frame > 183 && (
        <Badge name="Still eight" at={185} top={1390} bg={C.gold} fg={C.dark} size={64}>
          STILL CUT INTO 8
        </Badge>
      )}
    </AbsoluteFill>
  );
};
