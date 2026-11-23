import React from "react";
import { AbsoluteFill, Easing, Interactive, interpolate, useCurrentFrame } from "remotion";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
export const GOLD = "#E9C987";
export const SERIF3 = "'DejaVu Serif', serif";
export const SANS3 = "'DejaVu Sans', sans-serif";

/** Elegant lower-third style title: small kicker + big serif line. */
export const Chapter: React.FC<{
  name: string;
  kicker?: string;
  title: string;
  at: number;
  out?: number;
  top?: number;
  size?: number;
}> = ({ name, kicker, title, at, out = 100000, top = 210, size = 96 }) => {
  const frame = useCurrentFrame();
  return (
    <Interactive.Div
      name={name}
      style={{
        position: "absolute",
        left: 90,
        right: 90,
        top,
        textAlign: "center",
        opacity: interpolate(frame, [at, at + 14, out, out + 10], [0, 1, 1, 0], clamp),
        translate: interpolate(frame, [at, at + 20], ["0px 30px", "0px 0px"], {
          ...clamp,
          easing: Easing.bezier(0.16, 1, 0.3, 1),
        }),
      }}
    >
      {kicker && (
        <div
          style={{
            fontFamily: SANS3,
            fontSize: 34,
            letterSpacing: 10,
            color: GOLD,
            textTransform: "uppercase",
            marginBottom: 18,
            textShadow: "0 2px 12px rgba(0,0,0,0.8)",
          }}
        >
          {kicker}
        </div>
      )}
      <div
        style={{
          fontFamily: SERIF3,
          fontWeight: 700,
          fontSize: size,
          lineHeight: 1.08,
          color: "#FBF3E2",
          textShadow: "0 4px 30px rgba(0,0,0,0.85), 0 2px 4px rgba(0,0,0,0.9)",
        }}
      >
        {title}
      </div>
      <div
        style={{
          margin: "26px auto 0",
          height: 3,
          background: GOLD,
          width: interpolate(frame, [at + 8, at + 28], [0, 220], clamp),
        }}
      />
    </Interactive.Div>
  );
};

/** Small fact label. */
export const Fact: React.FC<{ name: string; children: React.ReactNode; at: number; out?: number; top: number }> = ({
  name,
  children,
  at,
  out = 100000,
  top,
}) => {
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
        opacity: interpolate(frame, [at, at + 10, out, out + 10], [0, 1, 1, 0], clamp),
        translate: interpolate(frame, [at, at + 16], ["0px 20px", "0px 0px"], { ...clamp, easing: Easing.bezier(0.16, 1, 0.3, 1) }),
      }}
    >
      <div
        style={{
          fontFamily: SANS3,
          fontSize: 46,
          color: "#FBF3E2",
          background: "rgba(20,12,8,0.62)",
          border: `2px solid ${GOLD}`,
          padding: "14px 34px",
          borderRadius: 8,
          letterSpacing: 1,
        }}
      >
        {children}
      </div>
    </Interactive.Div>
  );
};

/** Vignette + animated film grain + warm grade. */
export const FilmLook: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <>
      <AbsoluteFill
        style={{
          background: "radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.55) 100%)",
          pointerEvents: "none",
        }}
      />
      <AbsoluteFill style={{ background: "rgba(255,170,90,0.05)", mixBlendMode: "overlay" }} />
      <AbsoluteFill style={{ opacity: 0.09, mixBlendMode: "overlay" }}>
        <svg width="1080" height="1920">
          <filter id="grain">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={frame % 12} />
          </filter>
          <rect width="1080" height="1920" filter="url(#grain)" />
        </svg>
      </AbsoluteFill>
    </>
  );
};
