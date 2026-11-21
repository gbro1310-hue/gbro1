import React from "react";
import { colors } from "../theme";

export type LightState = "off" | "red" | "yellow" | "green";

/**
 * Светофор. level — яркость активной лампы (0..1), чтобы анимировать включение/glow.
 */
export const TrafficLight: React.FC<{
  state: LightState;
  level?: number;
  size?: number; // диаметр лампы
  horizontal?: boolean;
  style?: React.CSSProperties;
}> = ({ state, level = 1, size = 150, horizontal = false, style }) => {
  const lamps: { key: LightState; color: string }[] = [
    { key: "red", color: colors.red },
    { key: "yellow", color: colors.yellow },
    { key: "green", color: colors.green },
  ];
  const pad = size * 0.18;
  return (
    <div
      style={{
        display: "flex",
        flexDirection: horizontal ? "row" : "column",
        gap: pad,
        padding: pad,
        background: "linear-gradient(180deg,#22222b,#121217)",
        borderRadius: size * 0.42,
        border: "4px solid #2f2f3a",
        boxShadow: "0 30px 80px rgba(0,0,0,0.6), inset 0 2px 0 rgba(255,255,255,0.06)",
        ...style,
      }}
    >
      {lamps.map((l) => {
        const on = state === l.key ? level : 0;
        return (
          <div
            key={l.key}
            style={{
              width: size,
              height: size,
              borderRadius: "50%",
              background: on
                ? `radial-gradient(circle at 40% 35%, #fff ${4 * on}%, ${l.color} ${35}%, ${l.color}cc 70%)`
                : "radial-gradient(circle at 40% 35%, #3a3a44, #1b1b22 70%)",
              opacity: 0.25 + 0.75 * Math.max(on, 0.0),
              boxShadow: on
                ? `0 0 ${size * 0.5 * on}px ${size * 0.15 * on}px ${l.color}aa, 0 0 ${size * 1.4 * on}px ${size * 0.4 * on}px ${l.color}55`
                : "inset 0 6px 18px rgba(0,0,0,0.7)",
            }}
          />
        );
      })}
    </div>
  );
};
