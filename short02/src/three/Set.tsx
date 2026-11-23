import React from "react";
import * as THREE from "three";
import { ThreeCanvas } from "@remotion/three";
import { useVideoConfig } from "remotion";

/** Shared 3D canvas: shadows, ACES tone mapping, fog. */
export const Set: React.FC<{ children: React.ReactNode; bg: string; fog?: [number, number]; exposure?: number }> = ({
  children,
  bg,
  fog,
  exposure = 1,
}) => {
  const { width, height } = useVideoConfig();
  return (
    <ThreeCanvas
      width={width}
      height={height}
      shadows
      gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: exposure }}
      camera={{ fov: 40, near: 0.05, far: 200 }}
      style={{ background: bg }}
    >
      <color attach="background" args={[bg]} />
      {fog && <fog attach="fog" args={[bg, fog[0], fog[1]]} />}
      {children}
    </ThreeCanvas>
  );
};

export const Sun: React.FC<{ position: [number, number, number]; color: string; intensity: number; size?: number }> = ({
  position,
  color,
  intensity,
  size = 12,
}) => (
  <directionalLight
    position={position}
    color={color}
    intensity={intensity}
    castShadow
    shadow-mapSize-width={2048}
    shadow-mapSize-height={2048}
    shadow-camera-left={-size}
    shadow-camera-right={size}
    shadow-camera-top={size}
    shadow-camera-bottom={-size}
    shadow-camera-far={80}
    shadow-bias={-0.0004}
  />
);
