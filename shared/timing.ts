export type Word = { text: string; start: number; end: number };

const norm = (s: string) =>
  s.toLowerCase().replace(/ё/g, "е").replace(/[^\p{L}\p{N}]/gu, "");

/**
 * Тайм-коды по словам озвучки.
 * at("час", 2) — начало второго вхождения слова «час» (в секундах, с учётом offset).
 */
export const makeTimeline = (words: Word[], offset = 0) => {
  const at = (word: string, n = 1): number => {
    const target = norm(word);
    let seen = 0;
    for (const w of words) {
      if (norm(w.text) === target && ++seen === n) return w.start + offset;
    }
    throw new Error(`Слово «${word}» #${n} не найдено в таймингах`);
  };
  const endOf = (word: string, n = 1): number => {
    const target = norm(word);
    let seen = 0;
    for (const w of words) {
      if (norm(w.text) === target && ++seen === n) return w.end + offset;
    }
    throw new Error(`Слово «${word}» #${n} не найдено в таймингах`);
  };
  const shifted = words.map((w) => ({ ...w, start: w.start + offset, end: w.end + offset }));
  return { at, endOf, words: shifted, voiceEnd: words[words.length - 1].end + offset };
};

/** Маска «голос звучит» по кадрам, сглаженная — для ducking музыки */
export const speechMask = (words: Word[], fps: number, totalFrames: number) => {
  const raw = new Float32Array(totalFrames);
  for (const w of words) {
    const a = Math.max(0, Math.floor((w.start - 0.12) * fps));
    const b = Math.min(totalFrames - 1, Math.ceil((w.end + 0.3) * fps));
    for (let i = a; i <= b; i++) raw[i] = 1;
  }
  const out = new Float32Array(totalFrames);
  const r = 5;
  for (let i = 0; i < totalFrames; i++) {
    let s = 0, c = 0;
    for (let j = i - r; j <= i + r; j++) if (j >= 0 && j < totalFrames) { s += raw[j]; c++; }
    out[i] = s / c;
  }
  return out;
};
