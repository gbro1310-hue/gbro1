import React from "react";
import { AbsoluteFill, interpolate } from "remotion";
import type { TransitionPresentation, TransitionPresentationComponentProps } from "@remotion/transitions";

/** Whip-pan: быстрый горизонтальный сдвиг с motion blur */
type WhipProps = { direction?: 1 | -1 };
const WhipPan: React.FC<TransitionPresentationComponentProps<WhipProps>> = ({
  children,
  presentationProgress: p,
  presentationDirection,
  passedProps,
}) => {
  const dir = passedProps.direction ?? 1;
  const entering = presentationDirection === "entering";
  const x = entering ? interpolate(p, [0, 1], [1080 * dir, 0]) : interpolate(p, [0, 1], [0, -1080 * dir]);
  const blur = Math.sin(p * Math.PI) * 28;
  return (
    <AbsoluteFill style={{ translate: `${x}px 0`, filter: `blur(${blur}px)` }}>{children}</AbsoluteFill>
  );
};
export const whipPan = (props: WhipProps = {}): TransitionPresentation<WhipProps> => ({
  component: WhipPan,
  props,
});

/** Zoom-through: уходящая сцена «пролетает» в камеру, новая выезжает из глубины */
type ZoomProps = { flash?: string };
const ZoomThrough: React.FC<TransitionPresentationComponentProps<ZoomProps>> = ({
  children,
  presentationProgress: p,
  presentationDirection,
  passedProps,
}) => {
  const entering = presentationDirection === "entering";
  const scale = entering ? interpolate(p, [0, 1], [0.6, 1]) : interpolate(p, [0, 1], [1, 2.6]);
  const opacity = entering ? interpolate(p, [0, 0.5, 1], [0, 1, 1]) : interpolate(p, [0, 0.6, 1], [1, 0.6, 0]);
  const blur = entering ? interpolate(p, [0, 1], [18, 0]) : interpolate(p, [0, 1], [0, 22]);
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ scale, opacity, filter: `blur(${blur}px)` }}>{children}</AbsoluteFill>
      {passedProps.flash && entering ? (
        <AbsoluteFill
          style={{
            background: `radial-gradient(circle at 50% 40%, ${passedProps.flash} 0%, transparent 75%)`,
            opacity: interpolate(p, [0, 0.35, 1], [0, 0.55, 0]),
          }}
        />
      ) : null}
    </AbsoluteFill>
  );
};
export const zoomThrough = (props: ZoomProps = {}): TransitionPresentation<ZoomProps> => ({
  component: ZoomThrough,
  props,
});

/** Маска-круг (iris), раскрывается из точки */
type CircleProps = { cx?: number; cy?: number };
const CircleMask: React.FC<TransitionPresentationComponentProps<CircleProps>> = ({
  children,
  presentationProgress: p,
  presentationDirection,
  passedProps,
}) => {
  if (presentationDirection === "exiting") return <AbsoluteFill>{children}</AbsoluteFill>;
  const r = interpolate(p, [0, 1], [0, 2300]);
  const cx = passedProps.cx ?? 540;
  const cy = passedProps.cy ?? 760;
  return (
    <AbsoluteFill style={{ clipPath: `circle(${r}px at ${cx}px ${cy}px)` }}>{children}</AbsoluteFill>
  );
};
export const circleMask = (props: CircleProps = {}): TransitionPresentation<CircleProps> => ({
  component: CircleMask,
  props,
});
