import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { Badge, C, Loaf, Person, Stage, Title, clamp } from "../theme";

const SHOPS = ["#E8D3A8", "#D9B98A", "#EBD9B4", "#D4AE7E"];

export const S1Bakeries: React.FC = () => {
  const frame = useCurrentFrame();
  const push = interpolate(frame, [0, 187], [1, 1.08], clamp);
  return (
    <AbsoluteFill style={{ background: "linear-gradient(#F7C873, #E9875A)" }}>
      <AbsoluteFill style={{ scale: push }}>
        <Stage>
          {/* street of shops */}
          {SHOPS.map((c, i) => (
            <g key={i}>
              <rect x={-40 + i * 290} y={700} width={290} height={900} fill={c} stroke={C.dark} strokeWidth={6} />
              <path d={`M ${-60 + i * 290} 700 L ${105 + i * 290} 620 L ${270 + i * 290} 700 Z`} fill={C.terra} stroke={C.dark} strokeWidth={6} />
            </g>
          ))}
          <rect x={0} y={1400} width={1080} height={520} fill="#8C7B66" />
          {/* bakery front */}
          <rect x={190} y={760} width={700} height={640} fill={C.plaster} stroke={C.dark} strokeWidth={8} />
          <rect x={250} y={800} width={580} height={110} rx={12} fill={C.dark} stroke={C.gold} strokeWidth={6} />
          <text x={540} y={878} textAnchor="middle" fontFamily="DejaVu Serif" fontWeight={700} fontSize={66} fill={C.gold}>
            PISTRINVM
          </text>
          <rect x={250} y={950} width={580} height={300} rx={150} fill={C.dark} opacity={0.85} />
          <rect x={210} y={1230} width={660} height={170} fill="#D9CBB0" stroke={C.dark} strokeWidth={6} />
          {[0, 1, 2, 3, 4].map((i) => (
            <g
              key={i}
              style={{
                opacity: interpolate(frame, [20 + i * 6, 30 + i * 6], [0, 1], clamp),
              }}
            >
              <Loaf x={300 + i * 120} y={1215} r={52} />
            </g>
          ))}
          <Person x={540} y={1230} s={0.62} tunic="#5C7C4A" mood="smile" armA={-25} armB={-25} />
          <Loaf x={300} y={1215} r={52} />
          {/* customer */}
          <Person
            x={interpolate(frame, [80, 130], [1250, 920], { ...clamp, easing: Easing.out(Easing.cubic) })}
            y={1660}
            s={0.75}
            tunic="#3E6E9E"
            walk={frame * 0.45 * (frame < 130 ? 1 : 0)}
          />
        </Stage>
      </AbsoluteFill>
      <Title name="POMPEII title" at={4} top={170} size={150} serif>
        POMPEII
      </Title>
      <Badge name="Buy it badge" at={88} top={400} bg={C.dark} fg={C.cream}>
        bread? you buy it
      </Badge>
      <Badge name="30 bakeries badge" at={136} top={520} bg={C.pompRed} size={70}>
        30+ BAKERIES
      </Badge>
    </AbsoluteFill>
  );
};
