import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Badge, C, Stage, Title, clamp } from "../theme";

const Donkey: React.FC<{ x: number; y: number; s: number; flip: boolean; step: number }> = ({ x, y, s, flip, step }) => (
  <g transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s})`} strokeLinecap="round">
    {[-70, -40, 50, 80].map((lx, i) => (
      <line key={i} x1={lx} y1={-20} x2={lx + Math.sin(step + i * 1.6) * 16} y2={90} stroke={C.dark} strokeWidth={22} />
    ))}
    <ellipse cx={0} cy={-40} rx={120} ry={62} fill="#8A7F74" stroke={C.dark} strokeWidth={6} />
    <path d="M 95 -70 L 150 -140 L 205 -120 L 175 -60 Z" fill="#8A7F74" stroke={C.dark} strokeWidth={6} />
    <path d="M 150 -140 L 140 -205 L 165 -150 Z" fill="#8A7F74" stroke={C.dark} strokeWidth={5} />
    <path d="M 170 -135 L 175 -200 L 188 -140 Z" fill="#8A7F74" stroke={C.dark} strokeWidth={5} />
    <circle cx={172} cy={-118} r={6} fill={C.dark} />
    <path d="M -120 -50 Q -150 -10 -140 30" fill="none" stroke={C.dark} strokeWidth={8} />
  </g>
);

export const S2Mill: React.FC = () => {
  const frame = useCurrentFrame();
  const dawn = interpolate(frame, [40, 110], [0, 1], clamp);
  const ang = Math.max(0, frame - 190) * 0.03;
  const cx = 540;
  const cy = 1180;
  const dx = Math.cos(ang) * 330;
  const dz = Math.sin(ang); // depth: >0 front
  const donkey = (
    <Donkey x={cx + dx} y={cy + 230 + dz * 60} s={0.9 + dz * 0.12} flip={Math.sin(ang) < 0} step={frame * 0.5} />
  );
  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(${dawn > 0.5 ? "#F4B979" : "#1C1B3A"}, ${dawn > 0.5 ? "#C46A45" : "#3A2E5A"})`,
      }}
    >
      <AbsoluteFill style={{ background: "linear-gradient(#F7C873, #D9875A)", opacity: dawn }} />
      <Stage>
        <rect x={0} y={1350} width={1080} height={570} fill="#7F7464" />
        <ellipse cx={cx} cy={cy + 240} rx={420} ry={120} fill="#6F6455" />
        {dz < 0 && donkey}
        {/* meta (lower cone) */}
        <path d={`M ${cx - 170} ${cy + 230} L ${cx - 60} ${cy - 40} L ${cx + 60} ${cy - 40} L ${cx + 170} ${cy + 230} Z`} fill={C.stoneD} stroke={C.dark} strokeWidth={7} />
        {/* catillus (hourglass), stripes rotate */}
        <path
          d={`M ${cx - 150} ${cy - 330} L ${cx + 150} ${cy - 330} L ${cx + 55} ${cy - 120} L ${cx + 150} ${cy + 80} L ${cx - 150} ${cy + 80} L ${cx - 55} ${cy - 120} Z`}
          fill={C.stone}
          stroke={C.dark}
          strokeWidth={8}
        />
        {[0, 1, 2, 3, 4, 5].map((k) => {
          const ph = ((k / 6 + ang / (2 * Math.PI)) % 1) * 2 - 1;
          return (
            <line key={k} x1={cx + ph * 130} y1={cy - 320} x2={cx + ph * 48} y2={cy - 125} stroke={C.stoneD} strokeWidth={5} opacity={1 - Math.abs(ph)} />
          );
        })}
        <ellipse cx={cx} cy={cy - 330} rx={150} ry={34} fill="#D9C7A0" stroke={C.dark} strokeWidth={7} />
        {/* wooden bar to donkey */}
        <line x1={cx} y1={cy - 120} x2={cx + dx * 0.95} y2={cy + 150 + dz * 55} stroke="#6B4128" strokeWidth={26} strokeLinecap="round" />
        {/* grain falling in */}
        {frame > 95 &&
          [0, 1, 2, 3, 4, 5, 6, 7].map((k) => {
            const ph = ((frame * 0.04 + k / 8) % 1);
            return <ellipse key={k} cx={cx - 40 + (k % 4) * 26} cy={cy - 640 + ph * 300} rx={7} ry={11} fill={C.ochre} />;
          })}
        {dz >= 0 && donkey}
      </Stage>
      <Title name="Before dawn title" at={50} top={190} size={110}>
        BEFORE DAWN
      </Title>
      <Badge name="Hourglass badge" at={150} top={400} bg={C.dark} fg={C.cream}>
        an hourglass mill
      </Badge>
      <Badge name="For hours badge" at={248} top={520} bg={C.pompRed} size={70}>
        FOR HOURS
      </Badge>
    </AbsoluteFill>
  );
};
