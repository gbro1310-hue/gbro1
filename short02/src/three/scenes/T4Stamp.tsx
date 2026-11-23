import React, { useMemo } from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { CameraRig, Loaf3D, lerp3, textTexture, useTextures } from "../kit";
import { Set, Sun } from "../Set";
import { Chapter, Fact, FilmLook } from "../look";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const T4Stamp: React.FC = () => {
  const frame = useCurrentFrame();
  const tex = useTextures();
  const yours = useMemo(() => textTexture(["YOUR", "NAME"], { color: "#5a2e10", w: 256, h: 256, font: "bold 64px 'DejaVu Serif'" }), []);
  const celer = useMemo(
    () => textTexture(["CELER·Q·", "GRANI·VERI", "SER"], { color: "#0b0806", w: 256, h: 256, font: "bold 40px 'DejaVu Serif'" }),
    [],
  );
  const herc = frame >= 222;
  const gap = interpolate(frame, [56, 86], [0, 1], clamp);
  const spread = interpolate(frame, [96, 112, 124, 136], [0, 1, 1, 0], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const stampY = interpolate(frame, [138, 152, 160, 176], [5.5, 0.78, 0.78, 5.5], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const t = interpolate(frame, [0, 222], [0, 1], { ...clamp, easing: Easing.inOut(Easing.sin) });
  const spin = herc ? (frame - 222) * 0.006 : 0;
  return (
    <AbsoluteFill>
      <Set bg={herc ? "#0b0908" : "#2e2018"} fog={herc ? undefined : [4, 12]}>
        {herc ? (
          <>
            <CameraRig pos={[0, 3.0, 3.0]} look={[0, 0.25, 0]} fov={38} />
            <ambientLight intensity={0.08} />
            <spotLight position={[0.5, 4, 1]} angle={0.35} penumbra={0.6} intensity={60} color="#ffe2b8" castShadow />
            <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
              <planeGeometry args={[10, 10]} />
              <meshStandardMaterial color="#141110" roughness={0.9} />
            </mesh>
            <Loaf3D tex={tex} r={0.9} char={0.9} stamp={celer} rotation={[0, spin, 0]} />
          </>
        ) : (
          <>
            <CameraRig pos={lerp3([0, 3.9, 3.7], [0.5, 3.2, 2.9], t)} look={[0, 0.3, 0]} fov={40} />
            <hemisphereLight args={["#ffdcb0", "#3a2a20", 0.5]} />
            <Sun position={[-3, 6, 3]} color="#ffcf98" intensity={3} size={4} />
            <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
              <planeGeometry args={[12, 12]} />
              <meshStandardMaterial map={tex.wood} roughness={0.85} />
            </mesh>
            <Loaf3D tex={tex} r={0.9} gap={gap} spread={spread} stamp={frame >= 152 ? yours : undefined} />
            {/* knife line hint */}
            <group position={[0, stampY, 0]}>
              <mesh position={[0, 0.5, 0]} castShadow>
                <cylinderGeometry args={[0.09, 0.11, 0.9, 16]} />
                <meshStandardMaterial map={tex.wood} roughness={0.8} />
              </mesh>
              <mesh castShadow>
                <cylinderGeometry args={[0.2, 0.2, 0.12, 32]} />
                <meshStandardMaterial map={tex.wood} color="#9a6a44" roughness={0.8} />
              </mesh>
            </group>
          </>
        )}
      </Set>
      <FilmLook />
      {!herc ? (
        <>
          <Chapter name="Cut into eight" kicker="shape · cut · stamp" title="Cut into eight" at={60} out={210} size={100} />
          <Fact name="By hand" at={96} out={140} top={1080}>
            so it breaks by hand
          </Fact>
          <Fact name="Stamp it" at={152} out={215} top={1080}>
            then you stamp it: your name, or your master's
          </Fact>
        </>
      ) : (
        <>
          <Chapter name="Herculaneum" kicker="a real loaf from" title="Herculaneum" at={228} size={100} />
          <Fact name="Celer" at={311} top={1100}>
            “Celer, slave of Quintus Granius Verus”
          </Fact>
        </>
      )}
    </AbsoluteFill>
  );
};
