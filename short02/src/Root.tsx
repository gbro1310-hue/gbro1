import React from "react";
import { Composition, Folder } from "remotion";
import { BreadShort } from "./BreadShort";
import { BreadShort3D } from "./BreadShort3D";
import { T1Street } from "./three/scenes/T1Street";
import { T2Mill } from "./three/scenes/T2Mill";
import { T3Grit } from "./three/scenes/T3Grit";
import { T4Stamp } from "./three/scenes/T4Stamp";
import { T5Eruption } from "./three/scenes/T5Eruption";
import { T6Found } from "./three/scenes/T6Found";
import { T7Closer } from "./three/scenes/T7Closer";
import { S1Bakeries } from "./scenes/S1Bakeries";
import { S2Mill } from "./scenes/S2Mill";
import { S3Grit } from "./scenes/S3Grit";
import { S4Stamp } from "./scenes/S4Stamp";
import { S5Eruption } from "./scenes/S5Eruption";
import { S6Found } from "./scenes/S6Found";
import { S7Closer } from "./scenes/S7Closer";

const V = { width: 1080, height: 1920, fps: 30 };

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition id="BreadShort" component={BreadShort} durationInFrames={1860} {...V} />
      <Composition id="BreadShort3D" component={BreadShort3D} durationInFrames={1860} {...V} />
      <Folder name="BreadShort3D-Scenes">
        <Composition id="T1-Street" component={T1Street} durationInFrames={187} {...V} />
        <Composition id="T2-Mill" component={T2Mill} durationInFrames={295} {...V} />
        <Composition id="T3-Grit" component={T3Grit} durationInFrames={265} {...V} />
        <Composition id="T4-Stamp" component={T4Stamp} durationInFrames={412} {...V} />
        <Composition id="T5-Eruption" component={T5Eruption} durationInFrames={225} {...V} />
        <Composition id="T6-Found" component={T6Found} durationInFrames={258} {...V} />
        <Composition id="T7-Closer" component={T7Closer} durationInFrames={218} {...V} />
      </Folder>
      <Folder name="BreadShort-Scenes">
        <Composition id="S1-Bakeries" component={S1Bakeries} durationInFrames={187} {...V} />
        <Composition id="S2-Mill" component={S2Mill} durationInFrames={295} {...V} />
        <Composition id="S3-Grit" component={S3Grit} durationInFrames={265} {...V} />
        <Composition id="S4-Stamp" component={S4Stamp} durationInFrames={412} {...V} />
        <Composition id="S5-Eruption" component={S5Eruption} durationInFrames={225} {...V} />
        <Composition id="S6-Found" component={S6Found} durationInFrames={258} {...V} />
        <Composition id="S7-Closer" component={S7Closer} durationInFrames={218} {...V} />
      </Folder>
    </>
  );
};
