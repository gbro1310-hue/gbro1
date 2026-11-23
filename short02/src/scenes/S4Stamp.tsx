import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { Badge, C, Loaf, Stage, Title, clamp } from "../theme";

export const S4Stamp: React.FC = () => {
  const frame = useCurrentFrame();
  const cut = interpolate(frame, [56, 86], [0, 1], clamp);
  const pull = interpolate(frame, [96, 112, 124, 134], [0, 1, 1, 0], clamp);
  const stampY = interpolate(frame, [140, 152, 160, 172], [-1500, 0, 0, -1500], {
    ...clamp,
    easing: Easing.inOut(Easing.cubic),
  });
  const herc = frame >= 222;
  const shake = frame > 150 && frame < 160 ? Math.sin(frame * 3) * 8 : 0;
  return (
    <AbsoluteFill style={{ background: herc ? "radial-gradient(#5A4636, #2E1C12)" : "radial-gradient(#F6E7C8, #D9A441)" }}>
      <Stage>
        <g transform={`translate(${shake} 0)`}>
          {pull > 0 ? (
            [0, 1, 2, 3, 4, 5, 6, 7].map((k) => {
              const a = ((k + 0.5) * Math.PI) / 4;
              return (
                <g key={k} transform={`translate(${Math.cos(a) * 40 * pull} ${Math.sin(a) * 25 * pull})`}>
                  <clipPath id={`w${k}`}>
                    <path d={`M 540 1150 L ${540 + Math.cos(a - Math.PI / 8) * 600} ${1150 + Math.sin(a - Math.PI / 8) * 600} L ${540 + Math.cos(a + Math.PI / 8) * 600} ${1150 + Math.sin(a + Math.PI / 8) * 600} Z`} />
                  </clipPath>
                  <g clipPath={`url(#w${k})`}>
                    <Loaf x={540} y={1150} r={340} cut={1} />
                  </g>
                </g>
              );
            })
          ) : (
            <Loaf
              x={540}
              y={1150}
              r={340}
              cut={cut}
              charred={herc ? 0.85 : 0}
              stamp={
                frame >= 152 ? (
                  <g>
                    <ellipse rx={95} ry={58} fill="none" stroke={herc ? "#0E0B09" : C.crustD} strokeWidth={8} />
                    <text
                      y={14}
                      textAnchor="middle"
                      fontFamily="DejaVu Serif"
                      fontWeight={700}
                      fontSize={herc ? 26 : 34}
                      fill={herc ? "#0E0B09" : C.crustD}
                    >
                      {herc ? "CELER·Q·GRANI" : "YOUR NAME"}
                    </text>
                    {herc && (
                      <text y={44} textAnchor="middle" fontFamily="DejaVu Serif" fontWeight={700} fontSize={22} fill="#0E0B09">
                        VERI·SER
                      </text>
                    )}
                  </g>
                ) : undefined
              }
            />
          )}
        </g>
        {/* wooden stamp */}
        <g transform={`translate(540 ${1100 + stampY})`}>
          <rect x={-60} y={-330} width={120} height={260} rx={30} fill="#9A6A44" stroke={C.dark} strokeWidth={6} />
          <rect x={-130} y={-80} width={260} height={70} rx={14} fill="#6B4128" stroke={C.dark} strokeWidth={6} />
        </g>
      </Stage>
      {!herc ? (
        <>
          <Title name="Eight pieces title" at={60} top={170} size={110}>
            CUT INTO 8
          </Title>
          <Badge name="By hand badge" at={96} top={400} bg={C.dark} fg={C.cream}>
            so it breaks by hand
          </Badge>
          <Badge name="Stamp badge" at={152} top={520} bg={C.pompRed} size={64}>
            THEN YOU STAMP IT
          </Badge>
        </>
      ) : (
        <>
          <Title name="Herculaneum title" at={230} top={170} size={96} color={C.gold} serif>
            HERCULANEUM
          </Title>
          <Badge name="Celer translation" at={311} top={1390} bg={C.cream} fg={C.dark} size={44} rotate={0}>
            “Celer, slave of Quintus Granius Verus”
          </Badge>
        </>
      )}
    </AbsoluteFill>
  );
};
