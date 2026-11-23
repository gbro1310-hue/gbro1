import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { CameraRig, Loaf3D, Oven3D, Particles, lerp3, useTextures } from "../kit";
import { Set, Sun } from "../Set";
import { Chapter, Fact, FilmLook } from "../look";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const T6Found: React.FC = () => {
  const frame = useCurrentFrame();
  const tex = useTextures();
  const ash = interpolate(frame, [30, 95], [1, 0], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const push = interpolate(frame, [150, 230], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  return (
    <AbsoluteFill>
      <Set bg="#14100e" fog={[4, 13]}>
        <CameraRig pos={lerp3([0.4, 2.6, 7.4], [0.0, 2.45, 2.7], push)} look={lerp3([0, 1.0, -1.0], [0, 0.6, -1.3], push)} fov={42} />
        <ambientLight intensity={0.1} />
        <Sun position={[3, 6, 5]} color="#9fb4d8" intensity={0.9} size={6} />
        <pointLight position={[0.8, 1.4, 0.6]} color="#ffb060" intensity={5} distance={5} decay={1.5} />
        <pointLight position={[0.5, 1.6, -0.5]} color="#ffc27a" intensity={7} distance={4} decay={1.4} />
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[20, 20]} />
          <meshStandardMaterial map={tex.ash} roughness={1} />
        </mesh>
        <Oven3D tex={tex} frame={frame} fire={false} ashLevel={ash} />
        {[
          [-0.7, -1.6],
          [-0.1, -1.9],
          [0.5, -1.6],
          [-0.4, -1.0],
          [0.25, -1.1],
          [0.85, -0.95],
          [-1.0, -1.1],
        ].map(([x, z], i) => (
          <Loaf3D key={i} tex={tex} r={0.36} char={1} position={[x, 0.6, z]} rotation={[0, i * 0.7, 0]} />
        ))}
        <Particles count={250} seed="dust6" frame={frame} box={[4, 3, 4]} center={[0, 1.5, 0]} speed={0.001} size={0.02} color="#cfc6ba" opacity={0.35} />
      </Set>
      <FilmLook />
      <Chapter name="1862" kicker="excavated in" title="1862" at={29} out={150} size={140} />
      <Fact name="Still in the oven" at={81} out={140} top={1080}>
        still in the oven
      </Fact>
      <Fact name="Charcoal" at={129} out={180} top={1080}>
        burnt to charcoal
      </Fact>
      <Chapter name="Still eight" title="Still cut into eight." at={185} size={88} />
    </AbsoluteFill>
  );
};
