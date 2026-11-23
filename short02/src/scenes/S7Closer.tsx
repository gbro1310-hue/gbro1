import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { C, Loaf, Stage, Title, clamp } from "../theme";

export const S7Closer: React.FC = () => {
  const frame = useCurrentFrame();
  const strike = interpolate(frame, [110, 126], [0, 1], clamp);
  const loafIn = interpolate(frame, [140, 158], [0, 1], clamp);
  return (
    <AbsoluteFill style={{ background: "radial-gradient(#5A3A28, #1C120C)" }}>
      <Stage>
        {/* statue bust */}
        <g opacity={1 - strike * 0.6}>
          <path d="M 120 1250 Q 130 1060 310 1040 Q 490 1060 500 1250 Z" fill="#BDB6AC" stroke={C.dark} strokeWidth={6} />
          <rect x={270} y={960} width={80} height={90} fill="#BDB6AC" stroke={C.dark} strokeWidth={6} />
          <ellipse cx={310} cy={880} rx={95} ry={105} fill="#CFC8BE" stroke={C.dark} strokeWidth={6} />
          <rect x={160} y={1250} width={300} height={90} fill="#A39C92" stroke={C.dark} strokeWidth={6} />
        </g>
        <line x1={120} y1={800} x2={120 + strike * 380} y2={800 + strike * 560} stroke={C.pompRed} strokeWidth={22} strokeLinecap="round" />
        {/* loaf */}
        <g opacity={loafIn} transform={`translate(0 ${(1 - loafIn) * 60})`}>
          <circle cx={780} cy={1150} r={260} fill={C.gold} opacity={0.18} />
          <Loaf x={780} y={1150} r={170} charred={1} />
        </g>
      </Stage>
      <Title name="Not a statue" at={103} top={260} size={100}>
        NOT A STATUE.
      </Title>
      <Title name="Morning's work" at={150} top={1380} size={74} color={C.gold}>
        A MORNING'S WORK.
      </Title>
      <div
        style={{
          position: "absolute",
          bottom: 120,
          width: "100%",
          textAlign: "center",
          fontFamily: "'DejaVu Serif', serif",
          fontWeight: 700,
          fontSize: 44,
          letterSpacing: 4,
          color: C.cream,
          opacity: interpolate(frame, [180, 195], [0, 1], clamp),
        }}
      >
        ORDINARY LIVES
      </div>
    </AbsoluteFill>
  );
};
