import { Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { springs } from "./theme";

type SpringCfg = Parameters<typeof spring>[0]["config"];

/** Удобные хелперы анимации в секундах абсолютного времени ролика */
export const useAnim = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const sp = (atSec: number, config: SpringCfg = springs.pop, durationInFrames?: number) =>
    spring({ frame: frame - Math.round(atSec * fps), fps, config, durationInFrames });
  const lin = (secs: number[], out: number[], easing: (n: number) => number = Easing.inOut(Easing.cubic)) =>
    interpolate(t, secs, out, { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing });
  return { frame, fps, t, sp, lin };
};
