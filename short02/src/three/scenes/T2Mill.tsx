import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { CameraRig, Donkey3D, Mill3D, Particles, Person3D, mixColor, useTextures } from "../kit";
import { Set, Sun } from "../Set";
import { Chapter, Fact, FilmLook } from "../look";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const T2Mill: React.FC = () => {
  const frame = useCurrentFrame();
  const tex = useTextures();
  const dawn = interpolate(frame, [30, 140], [0, 1], clamp);
  const rot = Math.max(0, frame - 150) * 0.028;
  const orbit = -0.5 + frame * 0.0022;
  const bg = `#${mixColor("#1e2440", "#d79a6a", dawn).getHexString()}`;
  return (
    <AbsoluteFill>
      <Set bg={bg} fog={[8, 26]}>
        <CameraRig pos={[Math.sin(orbit) * 9.5, 3.6, Math.cos(orbit) * 9.5]} look={[0, 1.2, 0]} fov={46} />
        <hemisphereLight args={[mixColor("#5a6aa0", "#ffd2a0", dawn), "#3a2a20", 0.5]} />
        <Sun position={[-6, 7, 5]} color={`#${mixColor("#8090ff", "#ffb36a", dawn).getHexString()}`} intensity={0.6 + 2.4 * dawn} size={10} />
        <pointLight position={[2.5, 2.2, 2]} color="#ff9a4a" intensity={4 * (1 - dawn) + 1} distance={8} />
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[30, 30]} />
          <meshStandardMaterial map={tex.basalt} roughness={0.9} />
        </mesh>
        <mesh position={[0, 2.5, -4.5]} receiveShadow>
          <boxGeometry args={[16, 5, 0.4]} />
          <meshStandardMaterial map={tex.plasterA} roughness={0.95} />
        </mesh>
        <mesh position={[0, 0.6, -4.28]}>
          <planeGeometry args={[16, 1.2]} />
          <meshStandardMaterial map={tex.plasterRed} roughness={0.95} />
        </mesh>
        <Mill3D tex={tex} rot={rot} />
        <Donkey3D position={[Math.cos(-rot) * 1.7, 0, Math.sin(-rot) * 1.7]} rotationY={rot + Math.PI} walk={frame > 150 ? frame * 0.3 : 0} />
        <Person3D position={[-1.8, 0, 1.6]} rotationY={0.9} tunic="#8a5a36" armsUp={frame > 90 && frame < 170 ? 1.2 : 0.1} />
        {frame > 92 && <Particles count={120} seed="grain" frame={frame} box={[0.35, 1.3, 0.35]} center={[0, 3.2, 0]} speed={0.025} size={0.05} color="#d9a441" />}
        <Particles count={300} seed="dust" frame={frame} box={[8, 5, 8]} center={[0, 2.5, 0]} speed={0.0015} size={0.025} color="#fff4dc" opacity={0.35 + 0.3 * dawn} />
      </Set>
      <FilmLook />
      <Chapter name="Before dawn" kicker="the bakery" title="Before dawn" at={50} out={160} size={110} />
      <Fact name="Hourglass mill" at={150} out={290} top={300}>
        A lava-stone mill shaped like an hourglass
      </Fact>
      <Chapter name="For hours" title="For hours." at={248} top={1080} size={100} />
    </AbsoluteFill>
  );
};
