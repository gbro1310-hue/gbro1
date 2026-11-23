import React from "react";
import { AbsoluteFill, Series, interpolate, staticFile, useCurrentFrame } from "remotion";
import { Audio } from "@remotion/media";
import { Captions } from "./Captions";
import { S1Bakeries } from "./scenes/S1Bakeries";
import { S2Mill } from "./scenes/S2Mill";
import { S3Grit } from "./scenes/S3Grit";
import { S4Stamp } from "./scenes/S4Stamp";
import { S5Eruption } from "./scenes/S5Eruption";
import { S6Found } from "./scenes/S6Found";
import { S7Closer } from "./scenes/S7Closer";

export const BreadShort: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Series>
        <Series.Sequence name="Bakeries" durationInFrames={187}>
          <S1Bakeries />
        </Series.Sequence>
        <Series.Sequence name="Mill" durationInFrames={295}>
          <S2Mill />
        </Series.Sequence>
        <Series.Sequence name="Grit" durationInFrames={265}>
          <S3Grit />
        </Series.Sequence>
        <Series.Sequence name="Stamp" durationInFrames={412}>
          <S4Stamp />
        </Series.Sequence>
        <Series.Sequence name="Eruption" durationInFrames={225}>
          <S5Eruption />
        </Series.Sequence>
        <Series.Sequence name="Found" durationInFrames={258}>
          <S6Found />
        </Series.Sequence>
        <Series.Sequence name="Closer" durationInFrames={218}>
          <S7Closer />
        </Series.Sequence>
      </Series>
      <Captions />
      <Audio name="Voiceover" src={staticFile("voice.mp3")} />
      <AbsoluteFill
        name="Fade out"
        style={{ background: "#000", opacity: interpolate(frame, [1845, 1860], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}
      />
    </AbsoluteFill>
  );
};
