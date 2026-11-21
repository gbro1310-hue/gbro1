import React from "react";
import { Composition, Folder } from "remotion";
import { Reel05 } from "../reels/05-traffic/src/Reel05";
import { TOTAL_SEC } from "../reels/05-traffic/src/timing";
import { FPS, H, W } from "../shared/theme";

export const RemotionRoot: React.FC = () => (
  <Folder name="Reel-05-traffic">
    <Composition
      id="Reel05-full"
      component={Reel05}
      width={W}
      height={H}
      fps={FPS}
      durationInFrames={TOTAL_SEC * FPS}
      defaultProps={{ withMusic: true, showSafeZones: false }}
    />
    <Composition
      id="Reel05-voice-only"
      component={Reel05}
      width={W}
      height={H}
      fps={FPS}
      durationInFrames={TOTAL_SEC * FPS}
      defaultProps={{ withMusic: false, showSafeZones: false }}
    />
  </Folder>
);
