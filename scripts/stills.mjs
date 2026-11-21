// node scripts/stills.mjs <compId> <outDir> <frame,frame,...> [scale]
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import path from "node:path";
const browserExecutable = process.env.REMOTION_BROWSER || "/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell";
const [comp, outDir, framesArg, scale = "0.5"] = process.argv.slice(2);
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts"), publicDir: path.resolve("reels"), rspack: true });
const composition = await selectComposition({ serveUrl, id: comp, inputProps: { showSafeZones: process.env.SAFE === "1" }, browserExecutable });
for (const f of framesArg.split(",").map(Number)) {
  await renderStill({ serveUrl, composition, frame: f, output: path.join(outDir, `f${String(f).padStart(4, "0")}.png`), scale: Number(scale), browserExecutable, inputProps: { ...composition.defaultProps, showSafeZones: process.env.SAFE === "1" } });
  console.log("frame", f);
}
