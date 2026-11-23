// Timeline (seconds). Narration timings come from words.json (channel ElevenLabs voice); phrases from subs.json.
export const DUR = 56.4;
export const SHOTS = [
  { id: 'map', a: 0, b: 5.1 },        // pre-dawn street from very high
  { id: 'dozen', a: 5.1, b: 10.1 },   // top-down city: two dozen bathhouse plumes
  { id: 'law', a: 10.1, b: 22.2 },    // dark street, hero's door, alley
  { id: 'light', a: 22.2, b: 28.4 },  // dawn, the crier walks
  { id: 'price', a: 28.4, b: 37.2 },  // inside: steam room → tubs, price menu
  { id: 'sunday', a: 37.2, b: 42.6 }, // the city cold
  { id: 'steam', a: 42.6, b: 50.3 },  // inside: dive close on you
  { id: 'day', a: 50.3, b: 56.4 },    // daylight wide + title
];
export const T = {
  plume0: 8.6,            // first bathhouse plume ("two dozen")
  statIn: 11.0, statOut: 21.6,
  dawn0: 22.4, dawn1: 27.6,
  crierWalk: 23.2, cryIn: 26.75, cryOut: 28.3,
  bathLit: 27.0,
  menuIn: 28.6, row1: 28.76, row2: 34.98, menuOut: 36.95,
  sundayCard: 37.5,
  smoke: 47.9,
  titleIn: 52.4,
};
export const shotAt = t => SHOTS.find(s => t >= s.a && t < s.b) || SHOTS[SHOTS.length - 1];
