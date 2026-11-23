import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import words from "./words.json";
import { C, SANS } from "./theme";

type Word = [string, number, number, boolean];
const W = words as Word[];

const chunks: { start: number; end: number; ws: Word[] }[] = (() => {
  const out: Word[][] = [];
  let cur: Word[] = [];
  for (const w of W) {
    cur.push(w);
    if (cur.length >= 3 || /[.,?!:]$/.test(w[0]) || w[3]) {
      out.push(cur);
      cur = [];
    }
  }
  if (cur.length) out.push(cur);
  return out.map((ws, i) => ({
    start: ws[0][1],
    end: Math.min(i + 1 < out.length ? out[i + 1][0][1] : ws[ws.length - 1][2] + 0.6, ws[ws.length - 1][2] + 0.6),
    ws,
  }));
})();

export const Captions: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const c = chunks.find((ch) => t >= ch.start && t < ch.end);
  if (!c) return null;
  const k = Math.min(1, (t - c.start) / 0.12);
  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: 230 }}>
      <div
        style={{
          display: "flex",
          gap: 22,
          flexWrap: "wrap",
          justifyContent: "center",
          maxWidth: 920,
          scale: 0.85 + 0.15 * k,
          fontFamily: SANS,
          fontWeight: 700,
          fontSize: 84,
          textTransform: "uppercase",
          WebkitTextStroke: `14px ${C.dark}`,
          paintOrder: "stroke fill",
        }}
      >
        {c.ws.map((w, i) => (
          <span key={i} style={{ color: t >= w[1] && t < w[2] + 0.05 ? C.gold : "#fff" }}>
            {w[0]}
          </span>
        ))}
      </div>
    </AbsoluteFill>
  );
};
