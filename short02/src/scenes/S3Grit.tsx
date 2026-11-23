import React from "react";
import { AbsoluteFill, Easing, interpolate, random, useCurrentFrame } from "remotion";
import { Badge, C, Loaf, Stage, Title, clamp } from "../theme";

export const S3Grit: React.FC = () => {
  const frame = useCurrentFrame();
  const zoom = interpolate(frame, [60, 120], [1, 1.9], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const tooth = interpolate(frame, [205, 245], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  return (
    <AbsoluteFill style={{ background: "radial-gradient(#F6E7C8, #C9A77A)" }}>
      <Stage>
        {/* flour falling */}
        {frame < 140 &&
          Array.from({ length: 60 }).map((_, k) => {
            const ph = (frame * 0.012 + random(`f${k}`)) % 1;
            const stone = k % 7 === 0 && frame > 60;
            return (
              <circle
                key={k}
                cx={160 + random(`x${k}`) * 760}
                cy={300 + ph * 900}
                r={stone ? 9 : 5}
                fill={stone ? C.stoneD : "#FFF8E8"}
                opacity={0.9}
              />
            );
          })}
        <g transform={`translate(540 1160) scale(${zoom})`}>
          <Loaf x={0} y={0} r={250} />
          {frame > 70 &&
            Array.from({ length: 14 }).map((_, k) => (
              <g key={k} opacity={interpolate(frame, [72 + k * 2, 80 + k * 2], [0, 1], clamp)}>
                <polygon
                  points="0,-9 8,-2 5,8 -6,7 -8,-3"
                  transform={`translate(${(random(`a${k}`) - 0.5) * 380} ${(random(`b${k}`) - 0.5) * 220}) scale(${1.2 + random(`c${k}`)})`}
                  fill="#5E5850"
                  stroke={C.dark}
                  strokeWidth={1.5}
                />
              </g>
            ))}
        </g>
        {/* tooth wearing down */}
        {frame > 190 && (
          <g transform="translate(830 560)" opacity={interpolate(frame, [190, 200], [0, 1], clamp)}>
            <circle r={150} fill={C.cream} stroke={C.dark} strokeWidth={6} />
            <path
              d={`M -70 ${-70 + tooth * 50} Q -40 ${-95 + tooth * 75} 0 ${-70 + tooth * 50} Q 40 ${-95 + tooth * 75} 70 ${-70 + tooth * 50} L 60 30 Q 50 100 25 100 Q 10 40 0 40 Q -10 40 -25 100 Q -50 100 -60 30 Z`}
              fill="#FFFDF5"
              stroke={C.dark}
              strokeWidth={6}
            />
            <rect x={-90} y={-110} width={180} height={tooth * 50 + 1} fill={C.cream} />
          </g>
        )}
      </Stage>
      <Title name="Flour title" at={4} top={170} size={96}>
        NEVER QUITE CLEAN
      </Title>
      <Badge name="Stone badge" at={88} top={430} bg={C.dark} fg={C.cream}>
        bits of millstone
      </Badge>
      {frame > 200 && (
        <Badge name="Teeth badge" at={212} top={1390} bg={C.pompRed} size={60}>
          WORN-DOWN TEETH
        </Badge>
      )}
    </AbsoluteFill>
  );
};
