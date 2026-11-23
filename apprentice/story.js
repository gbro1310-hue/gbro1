// Timeline (seconds, absolute; the channel voice starts at 1.0 s). Word timings: words.json; phrases: subs.json.
export const DUR = 387.0;
export const SHOTS = [
  { id: 'open', a: 0, b: 11.1, set: 'street' },        // dawn street: father walks you to the workshop
  { id: 'frame', a: 11.1, b: 29.5, set: 'shop' },      // the room, the frame, gold thread
  { id: 'master', a: 29.5, b: 40.2, set: 'shop' },     // your master; title
  { id: 'trades', a: 40.2, b: 69.6, set: 'street' },   // I · the contract: a city of trades from above
  { id: 'jures1', a: 69.6, b: 99.3, set: 'shop' },     // the jurés question the master; one place
  { id: 'contract', a: 99.3, b: 141.6, set: 'shop' },  // witnesses; who pays; eight years
  { id: 'window', a: 141.6, b: 165.3, set: 'shop' },   // II · the light
  { id: 'candle', a: 165.3, b: 187.0, set: 'shop' },   // the candle rule
  { id: 'night', a: 187.0, b: 199.4, set: 'street' },  // the city's dark workshops
  { id: 'chores', a: 199.4, b: 214.3, set: 'shop' },   // fetch, wind, watch
  { id: 'week', a: 214.3, b: 240.9, set: 'street' },   // III · the week; the vespers bell
  { id: 'knock', a: 240.9, b: 244.5, set: 'street' },  // IV · the knock
  { id: 'inspect', a: 244.5, b: 265.8, set: 'shop' },  // inspection, seizure, fine
  { id: 'signs', a: 265.8, b: 279.6, set: 'street' },  // every workshop's name
  { id: 'still', a: 279.6, b: 284.9, set: 'shop' },    // your master stands very still
  { id: 'years', a: 284.9, b: 306.2, set: 'shop' },    // V · eight years
  { id: 'leave', a: 306.2, b: 316.5, set: 'street' },  // journeyman: out of the door
  { id: 'mastery', a: 316.5, b: 342.6, set: 'street' },// what it takes to be a master
  { id: 'end', a: 342.6, b: 387.0, set: 'shop' },      // dusk: the needle goes down
];
export const T = {
  cardIn: 1.2, quest: 7.6,
  gold: 28.1,
  party: 30.0, titleIn: 37.9, titleOut: 40.9,
  ch1: 41.0, book: 49.8, trades0: 58.6, trades1: 63.0, jures: 63.6,
  q1: 75.0, q1ok: 76.6, q2: 76.75, q2ok: 80.5, refuse: 83.9, slots: 86.3, slotsKids: 90.0, slotsOut: 93.4, slotYou: 96.4,
  witness: 100.6, pays: 109.9, earns: 112.4, bars: 116.5, barsLong: 120.4, statute: 127.9, eight: 138.9,
  ch2: 141.8, june: 157.6, dec: 159.8,
  candleLit: 166.6, rule: 170.6, snuff: 173.8, nightPanel: 187.6,
  fetch: 204.9, wind: 206.6, watch: 209.5,
  ch3: 214.5, cal: 216.0, sunday: 218.3, feast: 220.7, sat: 226.7, bell: 232.0, needle: 236.6,
  ch4: 241.0, knock: 242.6,
  insp: 248.0, thread: 253.2, materials: 254.05, finish: 255.2, seize: 258.2, fine: 260.2, evidence: 264.0,
  ch5: 285.0, year0: 286.4, year1: 299.6, needleHold: 292.3, plain: 294.0, looked: 296.3, journey: 304.6,
  wage: 307.2, anyMaster: 309.5, leaveDoor: 312.5,
  become: 318.5, skill: 320.5, money: 323.0, oath: 327.6, buy: 334.5,
  needleDown: 361.2, endTitle: 368.6, sub: 375.4,
};
export const shotAt = t => SHOTS.find(s => t >= s.a && t < s.b) || SHOTS[SHOTS.length - 1];
