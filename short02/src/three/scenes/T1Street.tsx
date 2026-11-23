import React, { useMemo } from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { Building, CameraRig, Loaf3D, Person3D, Street, lerp3, textTexture, useTextures } from "../kit";
import { Set, Sun } from "../Set";
import { Chapter, Fact, FilmLook } from "../look";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const T1Street: React.FC = () => {
  const frame = useCurrentFrame();
  const tex = useTextures();
  const sign = useMemo(() => textTexture(["PISTRINVM"], { bg: "#2a1a10", color: "#e9c987", w: 1024, h: 160, font: "bold 110px 'DejaVu Serif'" }), []);
  const t = interpolate(frame, [0, 187], [0, 1], { ...clamp, easing: Easing.inOut(Easing.sin) });
  const walkerZ = interpolate(frame, [0, 187], [2, -9], clamp);
  return (
    <AbsoluteFill>
      <Set bg="#e9b98a" fog={[10, 42]} exposure={1.2}>
        <CameraRig pos={lerp3([0.0, 2.2, 9], [-1.6, 1.9, 0.5], t)} look={lerp3([0, 2.0, -20], [3.8, 1.4, -8], t)} fov={50} />
        <hemisphereLight args={["#ffd9a8", "#5a4636", 0.55]} />
        <Sun position={[-14, 9, 4]} color="#ffc27a" intensity={3.2} size={20} />
        <Street tex={tex} length={44} />
        {[-6, -14, -22, -30].map((z, i) => (
          <Building key={`l${i}`} position={[-6, 0, z]} w={7.5} h={5 + (i % 2) * 1.3} tex={tex} variant={i} rotationY={Math.PI / 2} />
        ))}
        {[0, -8, -16, -24, -32].map((z, i) => (
          <Building
            key={`r${i}`}
            position={[6, 0, z]}
            w={7.5}
            h={i === 1 ? 5.4 : 4.6 + (i % 2) * 1.5}
            tex={tex}
            variant={i + 1}
            rotationY={-Math.PI / 2}
            sign={i === 1 ? sign : undefined}
          />
        ))}
        {[-9.4, -8.6, -7.8, -7.0, -6.2].map((z, i) => (
          <Loaf3D key={i} tex={tex} r={0.28} position={[3.72, 1.0, z]} />
        ))}
        <Person3D position={[3.3, 0.4, -10.2]} rotationY={-Math.PI / 2 + 0.4} tunic="#5c6e48" />
        <Person3D position={[-1.0, 0, walkerZ]} rotationY={Math.PI} tunic="#7a3a2a" walking walk={frame * 0.32} />
        <Person3D position={[-3.3, 0.4, -15]} rotationY={0.6} tunic="#3e5e7e" />
      </Set>
      <FilmLook />
      <Chapter name="Pompeii title" kicker="79 AD · Bay of Naples" title="Pompeii" at={6} out={120} size={130} />
      <Fact name="Buy bread fact" at={88} out={180} top={1020}>
        Bread was bought, not baked at home
      </Fact>
      <Chapter name="Bakeries count" kicker="in one small town" title="30+ bakeries" at={136} top={260} size={110} />
    </AbsoluteFill>
  );
};
