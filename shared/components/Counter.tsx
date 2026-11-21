import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { easeOutCubic } from "../theme";

/** Счётчик: быстро в начале, замедляется к финальной цифре (Easing.out(cubic)) */
export const Counter: React.FC<{
  from?: number;
  to: number;
  startSec: number;
  endSec: number;
  decimals?: number;
  style?: React.CSSProperties;
  suffix?: string;
}> = ({ from = 0, to, startSec, endSec, decimals = 0, style, suffix = "" }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const v = interpolate(frame, [startSec * fps, endSec * fps], [from, to], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: easeOutCubic,
  });
  const text = v.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return (
    <span style={{ fontVariantNumeric: "tabular-nums", ...style }}>
      {text}
      {suffix}
    </span>
  );
};
