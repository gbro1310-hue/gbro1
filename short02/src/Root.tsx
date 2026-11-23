import React from "react";
import { Composition, Folder } from "remotion";
import { BreadShort } from "./BreadShort";
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
