import React from "react";
import { AbsoluteFill, random, useCurrentFrame } from "remotion";

/**
 * Тряска камеры на ударных моментах.
 * hits — кадры (в системе координат родителя), amplitude 3–6 px, длительность 6–8 кадров.
 */
export const CameraShake: React.FC<{
  hits: number[];
  amplitude?: number;
  duration?: number;
  children: React.ReactNode;
}> = ({ hits, amplitude = 6, duration = 7, children }) => {
  const frame = useCurrentFrame();
  let dx = 0, dy = 0, rot = 0;
  for (const h of hits) {
    const p = frame - h;
    if (p >= 0 && p < duration) {
      const k = 1 - p / duration;
      dx += (random(`sx${h}-${p}`) - 0.5) * 2 * amplitude * k;
      dy += (random(`sy${h}-${p}`) - 0.5) * 2 * amplitude * k;
      rot += (random(`sr${h}-${p}`) - 0.5) * 0.6 * k;
    }
  }
  return (
    <AbsoluteFill style={{ translate: `${dx}px ${dy}px`, rotate: `${rot}deg` }}>
      {children}
    </AbsoluteFill>
  );
};
