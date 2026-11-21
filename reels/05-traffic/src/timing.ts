import data from "../public/voice_timestamps.json";
import { makeTimeline } from "../../../shared/timing";

/** Голос начинается чуть позже кадра 0, чтобы бас-удар успел прозвучать */
export const VOICE_OFFSET = 0.2;
export const TL = makeTimeline(data.words, VOICE_OFFSET);
export const { at } = TL;

export const ID = "05-traffic";
export const asset = (p: string) => `${ID}/public/${p}`;

/** Начала сцен (сек) — привязаны к словам озвучки */
export const SCENES = {
  hook: 0,
  clock: at("допустим") - 0.15,
  multiply: at("умножаем") - 0.15,
  wheel: at("без") - 0.15,
  timeline: at("за", 1) - 0.15,
  green: at("за", 3) - 0.15,
  cta: at("напиши") - 0.15,
};
export const TOTAL_SEC = 40;

/** Слова, которые подсвечиваются жёлтым в субтитрах */
export const ACCENT = [
  "стой", "час", "один", "триста", "шестьдесят", "пять", "часов", "пятнадцать", "суток",
  "сна", "еды", "красный", "свет", "десять", "сто", "пятьдесят", "месяцев", "сорок",
  "год", "восемь", "жизни", "пятьсот", "серий", "язык", "комментариях", "цифру",
];
