import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import words from "../words.json";
import { GOLD, SANS3 } from "./look";

type Word = [string, number, number, boolean];
const W = words as Word[];

const chunks = (() => {
  const out: Word[][] = [];
  let cur: Word[] = [];
  for (const w of W) {
    cur.push(w);
    if (cur.length >= 4 || /[.,?!:]$/.test(w[0]) || w[3]) {
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

export const Captions3D: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const c = chunks.find((ch) => t >= ch.start && t < ch.end);
  if (!c) return null;
  const k = Math.min(1, (t - c.start) / 0.15);
  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: 300 }}>
      <div
        style={{
          display: "flex",
          gap: 18,
          flexWrap: "wrap",
          justifyContent: "center",
          maxWidth: 900,
          opacity: k,
          translate: `0px ${(1 - k) * 12}px`,
          fontFamily: SANS3,
          fontWeight: 700,
          fontSize: 66,
          textShadow: "0 3px 18px rgba(0,0,0,0.9), 0 1px 3px rgba(0,0,0,1)",
        }}
      >
        {c.ws.map((w, i) => (
          <span key={i} style={{ color: t >= w[1] && t < w[2] + 0.05 ? GOLD : "#FBF3E2" }}>
            {w[0]}
          </span>
        ))}
      </div>
    </AbsoluteFill>
  );
};
