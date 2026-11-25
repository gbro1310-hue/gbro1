// Timeline (seconds, absolute; the channel voice starts at 1.0 s). Word timings: words.json; phrases: subs.json.
export const DUR = 57.0;
export const SHOTS = [
  { id: 'open', a: 0, b: 5.9 },        // dusk in the workshop: you at the frame
  { id: 'silk', a: 5.9, b: 10.0 },     // the silk, gold thread, half finished
  { id: 'table', a: 10.0, b: 14.3 },   // the candle you may not light
  { id: 'master', a: 14.3, b: 18.3 },  // not your master being cheap; the law
  { id: 'statute', a: 18.3, b: 24.4 }, // the statute; FORBIDDEN
  { id: 'reason', a: 24.4, b: 36.1 },  // what a candle does to the work
  { id: 'down', a: 36.1, b: 45.0 },    // the light goes; June / December
  { id: 'years', a: 45.0, b: 47.9 },   // eight years
  { id: 'end', a: 47.9, b: 57.0 },     // an ordinary life; title
];
export const T = {
  cardIn: .6,
  gold: 8.3, half: 9.6,
  lockIn: 11.6, lockNo: 12.6,
  cheap: 16.0, law: 17.5,
  statute: 18.9, forbid: 23.0,
  candleLit: 24.4, reason: 25.0, day: 26.8, worse: 29.1, yellow: 31.0, moves: 31.95, stitch: 32.85, straight: 34.4,
  dusk0: 36.2, needleDown: 37.6, june: 39.0, dec: 41.3,
  eight: 45.05, grow0: 45.2, grow1: 47.4,
  ordinary: 48.1, title: 52.6, snuff: 999,
};
export const shotAt = t => SHOTS.find(s => t >= s.a && t < s.b) || SHOTS[SHOTS.length - 1];
