// Timeline (seconds, absolute; the channel voice starts at 1.0 s). Word timings: words.json; phrases: subs.json.
export const DUR = 59.0;
export const SHOTS = [
  { id: 'open', a: 0, b: 7.7 },        // dawn in the bakehouse: you with the loaf, the master at the trough
  { id: 'scale', a: 7.7, b: 11.0 },    // the loaf on the scale: a little light
  { id: 'check', a: 11.0, b: 20.3 },   // the city weighs bread; the assize; the officers come in
  { id: 'first', a: 20.3, b: 32.8 },   // first offence: the hurdle
  { id: 'second', a: 32.8, b: 39.0 },  // second: the pillory
  { id: 'third', a: 39.0, b: 44.4 },   // third: the oven pulled down
  { id: 'fix', a: 44.4, b: 48.9 },     // back on the scale; add dough
  { id: 'end', a: 48.9, b: 59.0 },     // an ordinary life; title
];
export const T = {
  cardIn: .6, light: 6.9, notice: 10.0,
  will: 11.2, weighs: 12.2, grain: 14.8, heavy: 15.9, men: 17.9, check: 19.2,
  first: 24.3, hurdle: 26.1, dirty: 27.6, neck: 31.4,
  second: 33.0, pillory: 34.4, hour: 35.5,
  third: 39.2, oven: 41.0, never: 42.0,
  back: 45.3, dough: 47.5,
  ordinary: 50.3, title: 54.0,
};
export const shotAt = t => SHOTS.find(s => t >= s.a && t < s.b) || SHOTS[SHOTS.length - 1];
