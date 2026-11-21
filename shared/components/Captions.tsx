import React, { useMemo } from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { colors, fonts, safeCenterX, textStroke, springs } from "../theme";
import type { Word } from "../timing";

const norm = (s: string) => s.toLowerCase().replace(/ё/g, "е").replace(/[^\p{L}\p{N}]/gu, "");

type Page = { words: Word[]; start: number; end: number };

/** Делит слова на страницы по 2–4 слова, рвёт по концу предложения */
export const buildPages = (words: Word[], maxWords = 3, maxChars = 18): Page[] => {
  const pages: Page[] = [];
  let cur: Word[] = [];
  const flush = () => {
    if (cur.length) pages.push({ words: cur, start: cur[0].start, end: cur[cur.length - 1].end });
    cur = [];
  };
  for (const w of words) {
    const chars = cur.reduce((s, x) => s + x.text.length + 1, 0) + w.text.length;
    if (cur.length >= maxWords || (cur.length > 0 && chars > maxChars)) {
      const last = cur[cur.length - 1];
      if (cur.length > 1 && last.text.length <= 2 && !/[.,?!…—:]$/.test(last.text)) {
        cur.pop();
        flush();
        cur.push(last);
      } else flush();
    }
    cur.push(w);
    if (/[.?!…]$/.test(w.text) || (/[,—:]$/.test(w.text) && cur.length >= 2)) flush();
  }
  flush();
  // не оставляем «висящих» одиночных коротких слов (предлоги) — склеиваем с соседом
  for (let i = 0; i < pages.length; i++) {
    const p = pages[i];
    if (p.words.length === 1 && p.words[0].text.length <= 2 && pages[i + 1]) {
      pages[i + 1].words.unshift(...p.words);
      pages[i + 1].start = p.start;
      pages.splice(i, 1);
      i--;
    }
  }
  return pages;
};

/**
 * Караоке-субтитры по таймингам ElevenLabs.
 * Акцентные слова подсвечиваются жёлтым и чуть увеличиваются в момент произнесения.
 */
export const Captions: React.FC<{
  words: Word[];
  accent?: string[];
  y?: number; // центр строки по Y
  fontSize?: number;
  hideBetween?: [number, number][]; // интервалы (сек), где субтитры скрыты
}> = ({ words, accent = [], y = 1290, fontSize = 76, hideBetween = [] }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const pages = useMemo(() => buildPages(words), [words]);
  const accentSet = useMemo(() => new Set(accent.map(norm)), [accent]);

  if (hideBetween.some(([a, b]) => t >= a && t < b)) return null;

  const idx = pages.findIndex((p, i) => {
    const next = pages[i + 1];
    const until = next ? next.start : p.end + 0.6;
    return t >= p.start - 0.05 && t < until;
  });
  if (idx < 0) return null;
  const page = pages[idx];
  const local = frame - Math.round((page.start - 0.05) * fps);
  const pop = spring({ frame: local, fps, config: springs.snappy, durationInFrames: 10 });

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          left: safeCenterX - 430,
          width: 860,
          top: y,
          translate: "0 -50%",
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          alignItems: "baseline",
          columnGap: 30,
          rowGap: 4,
          scale: interpolate(pop, [0, 1], [0.82, 1]),
          opacity: interpolate(pop, [0, 1], [0, 1]),
          fontFamily: fonts.heading,
          fontWeight: 900,
          fontSize,
          lineHeight: 1.08,
          textTransform: "uppercase",
          textAlign: "center",
        }}
      >
        {page.words.map((w, i) => {
          const active = t >= w.start - 0.03 && t < w.end + 0.05;
          const spoken = t >= w.start - 0.03;
          const isAccent = accentSet.has(norm(w.text));
          const wf = frame - Math.round(w.start * fps);
          const bump = spring({ frame: wf, fps, config: springs.pop, durationInFrames: 8 });
          const scale = isAccent && spoken ? 1 + 0.1 * bump - (active ? 0 : 0.04) : active ? 1.03 : 1;
          return (
            <span
              key={i}
              style={{
                display: "inline-block",
                margin: isAccent ? "0 0.08em" : 0,
                color: isAccent && spoken ? colors.yellow : colors.text,
                opacity: spoken ? 1 : 0.6,
                scale,
                ...textStroke(14),
              }}
            >
              {w.text.replace(/[,.]$/, "")}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
