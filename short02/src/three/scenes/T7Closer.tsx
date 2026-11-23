import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Bust3D, CameraRig, Loaf3D, SpotAt, useTextures } from "../kit";
import { Set } from "../Set";
import { Chapter, FilmLook, GOLD, SERIF3 } from "../look";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const T7Closer: React.FC = () => {
  const frame = useCurrentFrame();
  const tex = useTextures();
  const bustLight = interpolate(frame, [100, 130], [260, 12], clamp);
  const loafLight = interpolate(frame, [130, 165], [0, 260], clamp);
  return (
    <AbsoluteFill>
      <Set bg="#0d0a09">
        <CameraRig pos={[0, 2.6, 9.8 - frame * 0.005]} look={[0, 1.7, 0]} fov={40} />
        <ambientLight intensity={0.06} />
        <SpotAt position={[-1.4, 6, 3]} target={[-1.0, 2.2, 0]} angle={0.32} penumbra={0.7} intensity={bustLight} color="#e8eeff" />
        <SpotAt position={[1.4, 6, 3]} target={[1.0, 1.3, 0]} angle={0.22} penumbra={0.6} intensity={loafLight * 1.6} color="#ffd29a" />
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[30, 30]} />
          <meshStandardMaterial color="#1a1614" roughness={0.6} />
        </mesh>
        <Bust3D tex={tex} position={[-1.0, 0, 0]} />
        <mesh position={[1.0, 0.6, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.9, 1.2, 0.9]} />
          <meshStandardMaterial color="#2a2420" roughness={0.7} />
        </mesh>
        <Loaf3D tex={tex} r={0.42} char={1} position={[1.0, 1.2, 0]} rotation={[0, frame * 0.004, 0]} />
      </Set>
      <FilmLook />
      <Chapter name="Not a statue" kicker="what an ordinary life leaves behind" title="Not a statue." at={103} out={1000} top={230} size={96} />
      <Chapter name="Morning's work" title="A morning's work." at={150} top={1250} size={84} />
      <div
        style={{
          position: "absolute",
          bottom: 130,
          width: "100%",
          textAlign: "center",
          fontFamily: SERIF3,
          fontSize: 40,
          letterSpacing: 12,
          color: GOLD,
          opacity: interpolate(frame, [185, 200], [0, 1], clamp),
        }}
      >
        ORDINARY LIVES
      </div>
    </AbsoluteFill>
  );
};
