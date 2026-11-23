import React from "react";
import { AbsoluteFill, Easing, interpolate, random, useCurrentFrame } from "remotion";
import { CameraRig, Loaf3D, Particles, lerp3, useTextures } from "../kit";
import { Set, Sun } from "../Set";
import { Chapter, Fact, FilmLook } from "../look";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const T3Grit: React.FC = () => {
  const frame = useCurrentFrame();
  const tex = useTextures();
  const push = interpolate(frame, [0, 265], [0, 1], { ...clamp, easing: Easing.inOut(Easing.sin) });
  return (
    <AbsoluteFill>
      <Set bg="#2a1c14" fog={[3, 9]}>
        <CameraRig pos={lerp3([0.0, 2.6, 4.2], [0.2, 1.6, 2.4], push)} look={lerp3([0, 0.3, 0], [0.05, 0.4, 0], push)} fov={40} />
        <ambientLight intensity={0.25} />
        <Sun position={[-3, 5, 2]} color="#ffd1a0" intensity={3} size={4} />
        <spotLight position={[3, 3, 2]} angle={0.5} penumbra={0.8} color="#ff9f5a" intensity={20} />
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[12, 12]} />
          <meshStandardMaterial map={tex.wood} roughness={0.8} />
        </mesh>
        <Loaf3D tex={tex} r={1} position={[0, 0, 0]} />
        {Array.from({ length: 26 }).map((_, k) => {
          const a = random(`ga${k}`) * Math.PI * 2;
          const rr = 0.25 + random(`gr${k}`) * 0.65;
          const y = 0.55 * Math.sqrt(Math.max(0, 1 - rr * rr)) + 0.03;
          const s = interpolate(frame, [70 + k * 2, 80 + k * 2], [0, 1], clamp);
          return (
            <mesh key={k} position={[Math.cos(a) * rr, y, Math.sin(a) * rr]} scale={s * (0.025 + random(`gs${k}`) * 0.025)} castShadow>
              <dodecahedronGeometry args={[1, 0]} />
              <meshStandardMaterial color="#3a3836" roughness={0.6} metalness={0.1} />
            </mesh>
          );
        })}
        <Particles count={400} seed="flour" frame={frame} box={[3, 2.5, 3]} center={[0, 1.3, 0]} speed={0.003} size={0.012} color="#fffaf0" opacity={0.6} />
      </Set>
      <FilmLook />
      <Chapter name="Never clean" kicker="the flour" title="Never quite clean" at={6} out={200} size={92} />
      <Fact name="Millstone grit" at={88} out={200} top={1060}>
        Grit from the millstones in every loaf
      </Fact>
      <Chapter name="Worn teeth" kicker="a lifetime of it" title="Worn-down teeth" at={212} size={96} />
    </AbsoluteFill>
  );
};
