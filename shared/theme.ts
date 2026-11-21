import { Easing } from "remotion";
import { staticFile } from "remotion";
import { loadFont } from "@remotion/fonts";

/**
 * Шрифты лежат локально (reels/_shared/fonts, лицензия SIL OFL) — рендер не зависит от сети.
 * Montserrat и Inter — вариативные: один файл покрывает веса 100–900.
 */
const CYR = "U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116";
const LAT = "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD";
for (const [family, file] of [["Montserrat", "montserrat"], ["Inter", "inter"]] as const) {
  loadFont({ family, url: staticFile(`_shared/fonts/${file}-cyrillic.woff2`), weight: "100 900", unicodeRange: CYR });
  loadFont({ family, url: staticFile(`_shared/fonts/${file}-latin.woff2`), weight: "100 900", unicodeRange: LAT });
}
export const montserrat = "Montserrat";
export const inter = "Inter";

export const colors = {
  bg: "#0E0E12",
  bg2: "#1A1A24",
  red: "#FF3B30",
  yellow: "#FFD60A",
  green: "#34C759",
  kgRed: "#E8112D",
  kgSun: "#FFEF00",
  text: "#FFFFFF",
  muted: "#A1A1AA",
  card: "#23232F",
};

export const fonts = {
  heading: `${montserrat}, sans-serif`,
  body: `${inter}, ${montserrat}, sans-serif`,
  emoji: `"Noto Color Emoji", "Apple Color Emoji", sans-serif`,
};

export const FPS = 30;
export const W = 1080;
export const H = 1920;

/** Безопасные зоны Instagram Reels */
export const safe = { top: 250, bottom: 350, right: 150, left: 60 };
/** Центр безопасной области по X (учитывает кнопки справа) */
export const safeCenterX = (W - safe.right + safe.left) / 2;

export const springs = {
  pop: { damping: 12, stiffness: 180, mass: 0.8 },
  soft: { damping: 18, stiffness: 120 },
  snappy: { damping: 14, stiffness: 260 },
};

export const easeOutCubic = Easing.out(Easing.cubic);

/** Жирная обводка текста для читаемости на любом фоне */
export const textStroke = (px = 10, color = "rgba(0,0,0,0.85)") =>
  ({
    WebkitTextStroke: `${px}px ${color}`,
    paintOrder: "stroke fill",
    textShadow: "0 6px 24px rgba(0,0,0,0.55)",
  }) as const;
