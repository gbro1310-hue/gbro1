import React from "react";
import { AbsoluteFill, interpolate, random, useCurrentFrame, useVideoConfig } from "remotion";
import { colors } from "../theme";

/** Тёмный градиент с «дыханием» (зум 1.00→1.05) и плавающими частицами */
export const Background: React.FC<{
  tint?: string; // цвет свечения
  tintStrength?: number;
  dim?: number; // 0..1 затемнение
  particles?: number;
  seed?: string;
}> = ({ tint = colors.red, tintStrength = 0.18, dim = 0, particles = 26, seed = "bg" }) => {
  const frame = useCurrentFrame();
  const { durationInFrames, width, height } = useVideoConfig();
  const zoom = interpolate(frame, [0, durationInFrames], [1, 1.05]);
  const alpha = Math.round(tintStrength * 255).toString(16).padStart(2, "0");
  return (
    <AbsoluteFill style={{ backgroundColor: colors.bg, overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          scale: zoom,
          background: `radial-gradient(ellipse 90% 60% at 50% 38%, ${tint}${alpha} 0%, transparent 70%), linear-gradient(180deg, ${colors.bg} 0%, ${colors.bg2} 100%)`,
        }}
      />
      {new Array(particles).fill(0).map((_, i) => {
        const x = random(`${seed}x${i}`) * width;
        const y0 = random(`${seed}y${i}`) * height;
        const speed = 0.3 + random(`${seed}s${i}`) * 0.9;
        const size = 3 + random(`${seed}r${i}`) * 7;
        const y = ((y0 - frame * speed) % height + height) % height;
        const drift = Math.sin((frame + i * 40) / 45) * 14;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x + drift,
              top: y,
              width: size,
              height: size,
              borderRadius: "50%",
              background: i % 3 === 0 ? tint : "#ffffff",
              opacity: 0.08 + random(`${seed}o${i}`) * 0.18,
              filter: "blur(1px)",
            }}
          />
        );
      })}
      {/* лёгкий шум-виньетка */}
      <AbsoluteFill
        style={{
          background: "radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.55) 100%)",
        }}
      />
      {dim > 0 ? <AbsoluteFill style={{ backgroundColor: `rgba(0,0,0,${dim})` }} /> : null}
    </AbsoluteFill>
  );
};
