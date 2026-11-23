import React from "react";
import { AbsoluteFill, Easing, interpolate, random, useCurrentFrame } from "remotion";
import { CameraRig, Loaf3D, Oven3D, Particles, Volcano, lerp3, mixColor, useTextures } from "../kit";
import { Set, Sun } from "../Set";
import { Chapter, Fact, FilmLook } from "../look";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const T5Eruption: React.FC = () => {
  const frame = useCurrentFrame();
  const tex = useTextures();
  const count = Math.round(interpolate(frame, [92, 137], [0, 81], clamp));
  if (frame < 150) {
    const slide = interpolate(frame, [60, 140], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
    return (
      <AbsoluteFill>
        <Set bg="#1a100b" fog={[5, 14]}>
          <CameraRig pos={lerp3([0.8, 2.4, 8.2], [0, 1.8, 6.2], frame / 150)} look={[0, 1.1, -0.8]} fov={44} />
          <ambientLight intensity={0.12} />
          <Sun position={[-4, 6, 6]} color="#ffb070" intensity={0.8} size={6} />
          <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[20, 20]} />
            <meshStandardMaterial map={tex.basalt} roughness={0.9} />
          </mesh>
          <Oven3D tex={tex} frame={frame} />
          {/* wooden peel with loaves */}
          <group position={[0, 0.75, 1.8 - slide * 2.6]}>
            <mesh castShadow>
              <boxGeometry args={[1.2, 0.04, 0.9]} />
              <meshStandardMaterial map={tex.wood} roughness={0.85} />
            </mesh>
            <mesh position={[0, 0, 1.6]} castShadow>
              <boxGeometry args={[0.08, 0.06, 2.4]} />
              <meshStandardMaterial map={tex.wood} roughness={0.85} />
            </mesh>
            {[-0.32, 0.32].map((x, i) => (
              <Loaf3D key={i} tex={tex} r={0.26} position={[x, 0.02, 0]} />
            ))}
          </group>
          {[-0.9, -0.3, 0.3, 0.9].map((x, i) => (
            <Loaf3D key={i} tex={tex} r={0.26} position={[x, 0.62, -1.9 + (i % 2) * 0.5]} />
          ))}
        </Set>
        <FilmLook />
        <Chapter name="79 AD" kicker="one morning in" title="79 AD" at={6} size={130} />
        <Fact name="81 loaves" at={92} top={1080}>
          {`${count} loaves go into the oven`}
        </Fact>
      </AbsoluteFill>
    );
  }
  const f = frame - 150;
  const plume = interpolate(f, [8, 75], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const bg = `#${mixColor("#c98a62", "#3a3034", plume).getHexString()}`;
  return (
    <AbsoluteFill>
      <Set bg={bg} fog={[18, 60]}>
        <CameraRig pos={[0, 2.5 + f * 0.01, 46 - f * 0.04]} look={[0, 9, 0]} fov={50} />
        <hemisphereLight args={["#ffd0a0", "#3a2a20", 0.6 - plume * 0.3]} />
        <Sun position={[-20, 15, 10]} color="#ffb070" intensity={2.4 - plume * 1.6} size={30} />
        <pointLight position={[0, 7, 0]} color="#ff5a1a" intensity={30 * plume} distance={30} />
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[200, 200]} />
          <meshStandardMaterial color="#6e5a44" roughness={1} />
        </mesh>
        <Volcano tex={tex} />
        {/* the town in front */}
        {Array.from({ length: 34 }).map((_, i) => (
          <mesh key={i} position={[(random(`tx${i}`) - 0.5) * 22, 0.4, 14 + random(`tz${i}`) * 6]} castShadow>
            <boxGeometry args={[0.6 + random(`tw${i}`), 0.8 + random(`th${i}`) * 0.6, 0.6 + random(`td${i}`)]} />
            <meshStandardMaterial color={i % 3 ? "#d9c19a" : "#b4553a"} roughness={0.95} />
          </mesh>
        ))}
        {/* eruption column */}
        {Array.from({ length: 70 }).map((_, k) => {
          const h = plume * (1 + random(`ph${k}`) * 26);
          const r = 0.6 + h * 0.12 + random(`pr${k}`) * 0.8;
          return (
            <mesh key={k} position={[(random(`px${k}`) - 0.5) * (1 + h * 0.3) + h * h * 0.006, 6 + h, (random(`pz${k}`) - 0.5) * (1 + h * 0.2)]} scale={plume > 0 ? r : 0.001}>
              <sphereGeometry args={[1, 16, 12]} />
              <meshStandardMaterial color={k % 4 ? "#6a6064" : "#8a8084"} roughness={1} />
            </mesh>
          );
        })}
        <Particles count={600} seed="ash" frame={f} box={[30, 20, 20]} center={[0, 9, 12]} speed={0.006} size={0.08} color="#d8d0c8" opacity={0.6 * plume} />
      </Set>
      <FilmLook />
      <Chapter name="Vesuvius" kicker="then" title="Vesuvius erupted" at={10} size={96} />
    </AbsoluteFill>
  );
};
