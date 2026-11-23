import React from "react";
import { AbsoluteFill, Series, interpolate, staticFile, useCurrentFrame } from "remotion";
import { Audio } from "@remotion/media";
import { Captions3D } from "./three/Captions3D";
import { T1Street } from "./three/scenes/T1Street";
import { T2Mill } from "./three/scenes/T2Mill";
import { T3Grit } from "./three/scenes/T3Grit";
import { T4Stamp } from "./three/scenes/T4Stamp";
import { T5Eruption } from "./three/scenes/T5Eruption";
import { T6Found } from "./three/scenes/T6Found";
import { T7Closer } from "./three/scenes/T7Closer";

export const BreadShort3D: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Series>
        <Series.Sequence name="Street" durationInFrames={187}>
          <T1Street />
        </Series.Sequence>
        <Series.Sequence name="Mill" durationInFrames={295}>
          <T2Mill />
        </Series.Sequence>
        <Series.Sequence name="Grit" durationInFrames={265}>
          <T3Grit />
        </Series.Sequence>
        <Series.Sequence name="Stamp" durationInFrames={412}>
          <T4Stamp />
        </Series.Sequence>
        <Series.Sequence name="Eruption" durationInFrames={225}>
          <T5Eruption />
        </Series.Sequence>
        <Series.Sequence name="Found" durationInFrames={258}>
          <T6Found />
        </Series.Sequence>
        <Series.Sequence name="Closer" durationInFrames={218}>
          <T7Closer />
        </Series.Sequence>
      </Series>
      <Captions3D />
      <Audio name="Voiceover" src={staticFile("voice.mp3")} />
      <AbsoluteFill
        name="Fade in/out"
        style={{
          background: "#000",
          opacity: interpolate(frame, [0, 10, 1840, 1860], [1, 0, 0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
        }}
      />
    </AbsoluteFill>
  );
};
