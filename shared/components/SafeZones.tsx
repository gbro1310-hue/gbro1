import React from "react";
import { AbsoluteFill } from "remotion";
import { safe } from "../theme";

/** Отладочная подсветка зон интерфейса Instagram (включается пропсом showSafeZones) */
export const SafeZones: React.FC = () => {
  const s: React.CSSProperties = { position: "absolute", background: "rgba(255,0,80,0.25)" };
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{ ...s, left: 0, right: 0, top: 0, height: safe.top }} />
      <div style={{ ...s, left: 0, right: 0, bottom: 0, height: safe.bottom }} />
      <div style={{ ...s, right: 0, top: safe.top, bottom: safe.bottom, width: safe.right }} />
    </AbsoluteFill>
  );
};
