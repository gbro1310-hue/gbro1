import React from "react";
import { Easing, Interactive, interpolate, useCurrentFrame } from "remotion";

export const C = {
  dark: "#2E1C12",
  cream: "#F4E4C1",
  plaster: "#E8D3A8",
  terra: "#C65D3B",
  pompRed: "#9B2D20",
  ochre: "#D9A441",
  gold: "#F2C230",
  stone: "#B3A794",
  stoneD: "#7E7361",
  skin: "#D69A64",
  hair: "#3B2516",
  crust: "#B9782F",
  crustD: "#7A4A1C",
  char: "#2A211C",
  night: "#1C1B3A",
  fire1: "#FFB833",
  fire2: "#E8501E",
  green: "#8DB33A",
};

export const SANS = "'DejaVu Sans', sans-serif";
export const SERIF = "'DejaVu Serif', serif";

export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** Springy 0→1 pop starting at frame `at`. */
export const usePop = (at: number, dur = 12) => {
  const frame = useCurrentFrame();
  return interpolate(frame, [at, at + dur], [0, 1], {
    ...clamp,
    easing: Easing.bezier(0.34, 1.56, 0.64, 1),
  });
};

export const Title: React.FC<{
  children: React.ReactNode;
  at?: number;
  top?: number;
  size?: number;
  color?: string;
  serif?: boolean;
  name: string;
}> = ({ children, at = 0, top = 170, size = 104, color = C.cream, serif = false, name }) => {
  const frame = useCurrentFrame();
  return (
    <Interactive.Div
      name={name}
      style={{
        position: "absolute",
        left: 80,
        right: 80,
        top,
        textAlign: "center",
        fontFamily: serif ? SERIF : SANS,
        fontWeight: 700,
        fontSize: size,
        lineHeight: 1.05,
        color,
        WebkitTextStroke: `${Math.round(size / 9)}px ${C.dark}`,
        paintOrder: "stroke fill",
        scale: interpolate(frame, [at, at + 12], [0, 1], {
          ...clamp,
          easing: Easing.bezier(0.34, 1.56, 0.64, 1),
        }),
      }}
    >
      {children}
    </Interactive.Div>
  );
};

export const Badge: React.FC<{
  children: React.ReactNode;
  at: number;
  top: number;
  bg?: string;
  fg?: string;
  size?: number;
  rotate?: number;
  name: string;
}> = ({ children, at, top, bg = C.pompRed, fg = "#fff", size = 54, rotate = -2, name }) => {
  const frame = useCurrentFrame();
  return (
    <Interactive.Div
      name={name}
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top,
        display: "flex",
        justifyContent: "center",
        scale: interpolate(frame, [at, at + 10], [0, 1], {
          ...clamp,
          easing: Easing.bezier(0.34, 1.56, 0.64, 1),
        }),
        rotate: `${rotate}deg`,
      }}
    >
      <div
        style={{
          background: bg,
          color: fg,
          fontFamily: SANS,
          fontWeight: 700,
          fontSize: size,
          padding: "14px 36px",
          borderRadius: 22,
          border: `6px solid ${C.dark}`,
          boxShadow: `8px 10px 0 rgba(46,28,18,0.5)`,
        }}
      >
        {children}
      </div>
    </Interactive.Div>
  );
};

/** Simple flat character. (x, y) = feet. */
export const Person: React.FC<{
  x: number;
  y: number;
  s?: number;
  tunic?: string;
  mood?: "neutral" | "smile" | "frown" | "tired";
  armA?: number;
  armB?: number;
  walk?: number;
}> = ({ x, y, s = 1, tunic = "#B5653E", mood = "neutral", armA = 20, armB = 20, walk = 0 }) => {
  const legA = Math.sin(walk) * 18;
  const mouth =
    mood === "smile" ? "M -16 42 Q 0 58 16 42" : mood === "frown" ? "M -16 52 Q 0 38 16 52" : "M -16 46 L 16 46";
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} strokeLinecap="round" strokeLinejoin="round">
      {[legA, -legA].map((a, i) => (
        <g key={i} transform={`translate(${i ? 26 : -26} -110) rotate(${a})`}>
          <line x1={0} y1={0} x2={0} y2={100} stroke={C.dark} strokeWidth={40} />
          <line x1={0} y1={0} x2={0} y2={100} stroke={C.skin} strokeWidth={28} />
        </g>
      ))}
      <g transform="translate(-62 -310)">
        <line x1={0} y1={0} x2={0} y2={120} stroke={C.dark} strokeWidth={34} transform={`rotate(${armA})`} />
        <line x1={0} y1={0} x2={0} y2={120} stroke={C.skin} strokeWidth={22} transform={`rotate(${armA})`} />
      </g>
      <g transform="translate(62 -310)">
        <line x1={0} y1={0} x2={0} y2={120} stroke={C.dark} strokeWidth={34} transform={`rotate(${-armB})`} />
        <line x1={0} y1={0} x2={0} y2={120} stroke={C.skin} strokeWidth={22} transform={`rotate(${-armB})`} />
      </g>
      <path d="M -65 -330 L 65 -330 L 85 -100 L -85 -100 Z" fill={tunic} stroke={C.dark} strokeWidth={6} />
      <line x1={-85} y1={-130} x2={85} y2={-130} stroke={C.dark} strokeOpacity={0.25} strokeWidth={6} />
      <g transform="translate(0 -400)">
        <ellipse rx={60} ry={63} fill={C.skin} stroke={C.dark} strokeWidth={6} />
        <path d="M -62 -8 A 62 62 0 0 1 62 -8 Z" fill={C.hair} />
        <ellipse cx={-22} cy={6} rx={7} ry={mood === "tired" ? 2.5 : 9} fill={C.dark} />
        <ellipse cx={22} cy={6} rx={7} ry={mood === "tired" ? 2.5 : 9} fill={C.dark} />
        <path d={mouth} fill="none" stroke={C.dark} strokeWidth={6} />
      </g>
    </g>
  );
};

/** Round Pompeian loaf cut into eight. */
export const Loaf: React.FC<{
  x: number;
  y: number;
  r: number;
  cut?: number; // 0..1 how much of the 8 cuts are drawn
  charred?: number; // 0..1
  stamp?: React.ReactNode;
}> = ({ x, y, r, cut = 1, charred = 0, stamp }) => {
  const mix = (a: string, b: string, t: number) => {
    const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
    const [A, B] = [p(a), p(b)];
    return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * t)).join(",")})`;
  };
  const top = mix(C.crust, C.char, charred);
  const edge = mix(C.crustD, "#14100D", charred);
  const n = Math.floor(cut * 4 + 0.0001);
  return (
    <g transform={`translate(${x} ${y})`}>
      <ellipse cx={0} cy={r * 0.18} rx={r * 1.02} ry={r * 0.62} fill={edge} stroke={C.dark} strokeWidth={6} />
      <ellipse cx={0} cy={0} rx={r} ry={r * 0.6} fill={top} stroke={C.dark} strokeWidth={6} />
      {Array.from({ length: n }).map((_, i) => {
        const a = (i * Math.PI) / 4;
        return (
          <line
            key={i}
            x1={-Math.cos(a) * r * 0.92}
            y1={-Math.sin(a) * r * 0.55}
            x2={Math.cos(a) * r * 0.92}
            y2={Math.sin(a) * r * 0.55}
            stroke={edge}
            strokeWidth={r * 0.07}
            strokeLinecap="round"
          />
        );
      })}
      <ellipse cx={0} cy={0} rx={r * 0.26} ry={r * 0.16} fill={top} stroke={edge} strokeWidth={4} />
      {stamp}
      {charred < 0.5 && <ellipse cx={-r * 0.35} cy={-r * 0.25} rx={r * 0.25} ry={r * 0.06} fill="#fff" opacity={0.18} />}
    </g>
  );
};

export const Flame: React.FC<{ x: number; y: number; s: number; t: number }> = ({ x, y, s, t }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    {[
      [C.fire2, 1],
      [C.fire1, 0.65],
      ["#FFF3B0", 0.35],
    ].map(([c, k], i) => {
      const kk = k as number;
      const h = 120 * kk * (1 + 0.15 * Math.sin(t * 0.45 + i + x));
      const w = 40 * kk;
      return (
        <path
          key={i}
          d={`M ${-w} 0 C ${-w} ${-h * 0.5} ${-w * 0.2 + 8 * Math.sin(t * 0.3)} ${-h * 0.7} ${6 * Math.sin(t * 0.37)} ${-h} C ${w * 0.3} ${-h * 0.6} ${w} ${-h * 0.5} ${w} 0 Z`}
          fill={c as string}
        />
      );
    })}
  </g>
);

export const Stage: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <svg viewBox="0 0 1080 1920" width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
    {children}
  </svg>
);
