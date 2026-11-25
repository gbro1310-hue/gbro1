// «Кыргызы поймут» — Rhythm Game Show (Lemo-Opuscar style), 1080×1920.
// render(t) is a pure function of t. Every element is built once per scene; update(t) only sets attributes.
// Helpers el/txt/tf/op/seg/E/rng and the bean() construction are adapted from the Lemo-Opuscar
// game-show demo engine (MIT, © SecondFirst Pty Ltd t/a LemoLab).
'use strict';

// ============================================================ basics
const NS = 'http://www.w3.org/2000/svg';
const W = 1080, H = 1920;
const CX = 495;                       // centre of the Instagram-safe area (right 150 px are UI)
const BPM = 100, B = 60 / BPM, BAR = 4 * B;
const at = (bar, beat = 0) => (bar * 4 + beat) * B;
const K = {
  ol: '#1B1B2F', white: '#FFFFFF', cream: '#FFF4E2', yellow: '#FFD23F', orange: '#FF9F43', red: '#FF4D5E',
  pink: '#FF6FA5', sky: '#5AC8FA', green: '#2FBF5B', lime: '#B5E655', navy: '#24307A', blue: '#2F5BD9',
  brown: '#9C5B34', wood: '#C98A55', skin: '#F7C9A1', sea: '#2EC4E6', sand: '#FFE08A', grey: '#C9CCD6',
};
const FONT = "'Rubik', sans-serif";
const SO = { stroke: K.ol, 'stroke-width': 8, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' };

function el(tag, attrs = {}, parent) {
  const e = document.createElementNS(NS, tag);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(e);
  return e;
}
function txt(parent, str, attrs) { const e = el('text', attrs, parent); e.textContent = str; return e; }
function tf(e, x = 0, y = 0, s = 1, r = 0, sy) {
  e.setAttribute('transform', `translate(${x.toFixed(2)} ${y.toFixed(2)}) rotate(${r.toFixed(2)}) scale(${s.toFixed(4)} ${(sy ?? s).toFixed(4)})`);
}
function op(e, o) { e.setAttribute('opacity', Math.max(0, Math.min(1, o)).toFixed(3)); }
function show(e, v) { e.style.display = v ? '' : 'none'; }
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const seg = (t, a, b) => clamp((t - a) / (b - a));
const lerp = (a, b, p) => a + (b - a) * p;
const E = {
  out: p => 1 - Math.pow(1 - p, 3),
  in: p => p * p * p,
  back: p => { const c = 1.9; return 1 + (c + 1) * Math.pow(p - 1, 3) + c * Math.pow(p - 1, 2); },
};
const pop = (t, t0, d = 0.3) => t < t0 ? 0 : E.back(seg(t, t0, t0 + d));
function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const mctx = document.createElement('canvas').getContext('2d');
function measure(str, size, weight = 900) { mctx.font = `${weight} ${size}px Rubik`; return mctx.measureText(str).width; }

// beat helpers
const hopY = (t, h = 18, phase = 0) => -h * Math.abs(Math.sin(Math.PI * ((t / B) + phase)));
const hitSq = (t, t0, amt = 0.22) => (t < t0 || t > t0 + 0.4) ? 1 : 1 - amt * Math.exp(-(t - t0) * 9) * Math.cos((t - t0) * 30);
const near = (times, t, w = 0.25) => times.some(t0 => t >= t0 - 0.02 && t < t0 + w);

// ============================================================ timeline + events (single source of truth)
const EV = [];                       // sound events for music.py
const PUNCH = [];                    // [t, amount]
const CUTS = [];                     // flash on these times
const TEXTS_ = [];                   // readcheck registry
const ev = (t, type, o = {}) => EV.push({ t: +t.toFixed(4), type, ...o });
const punch = (t, a = 0.02) => PUNCH.push([t, a]);
function regText(id, text, t0, t1, box, pass = false) { TEXTS_.push({ id, text, t0, t1, box, pass }); }

// ============================================================ drawing kit
function gtext(parent, s, x, y, size, o = {}) {
  const { fill = K.white, stroke = K.ol, sw = size * 0.14, anchor = 'middle', weight = 900, ls = 0 } = o;
  return txt(parent, s, { x, y, 'font-size': size, 'font-family': FONT, 'font-weight': weight, fill, stroke, 'stroke-width': sw,
    'paint-order': 'stroke', 'stroke-linejoin': 'round', 'text-anchor': anchor, 'letter-spacing': ls });
}
function fitSize(s, size, maxW, weight = 900) { const w = measure(s, size, weight); return w > maxW ? size * maxW / w : size; }
function bg(p, col) { return el('rect', { width: W, height: H, fill: col }, p); }
function stripes(p, col, w = 60, angle = -20) {
  const g = el('g', {}, p); const n = 30;
  for (let i = -n; i < n; i++) el('rect', { x: i * w * 2, y: -1200, width: w, height: 4400, fill: col }, g);
  g.setAttribute('transform', `translate(${W / 2} ${H / 2}) rotate(${angle})`);
  return g;
}
function dots(p, col, step = 90, r = 16) {
  const g = el('g', {}, p);
  for (let y = 0, j = 0; y < H + step; y += step, j++) for (let x = (j % 2) * step / 2; x < W + step; x += step) el('circle', { cx: x, cy: y, r, fill: col }, g);
  return g;
}
function rays(p, n, col) {
  const g = el('g', {}, p); const R = 2400;
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * Math.PI * 2, a1 = a0 + Math.PI / n;
    el('path', { d: `M0 0 L${R * Math.cos(a0)} ${R * Math.sin(a0)} L${R * Math.cos(a1)} ${R * Math.sin(a1)} Z`, fill: col }, g);
  }
  return g;
}
function starPath(n, r1, r2) {
  let d = '';
  for (let i = 0; i < n * 2; i++) { const a = (i / (n * 2)) * Math.PI * 2 - Math.PI / 2, r = i % 2 ? r2 : r1; d += (i ? 'L' : 'M') + (r * Math.cos(a)).toFixed(1) + ' ' + (r * Math.sin(a)).toFixed(1); }
  return d + 'Z';
}
function floor(p, col, y = 1150) {
  el('rect', { x: 0, y, width: W, height: H - y, fill: col }, p);
  el('rect', { x: 0, y: y - 4, width: W, height: 10, fill: K.ol }, p);
}
// hard-shadow card
function card(p, x, y, w, h, fill, rx = 34, sh = 14) {
  el('rect', { x: x + sh, y: y + sh, width: w, height: h, rx, fill: K.ol }, p);
  return el('rect', { x, y, width: w, height: h, rx, fill, stroke: K.ol, 'stroke-width': 7 }, p);
}

// ============================================================ characters: toy beans
function bean(parent, o) {
  const { color, belly = null, acc = null, name = null } = o;
  const g = el('g', {}, parent);
  const body = el('g', {}, g);
  const mkArm = () => { const a = el('g', {}, body); el('rect', { x: -14, y: -4, width: 28, height: 70, rx: 14, fill: color, ...SO }, a); el('circle', { cx: 0, cy: 70, r: 17, fill: K.white, ...SO, 'stroke-width': 6 }, a); return a; };
  const armL = mkArm(), armR = mkArm();
  for (const x of [-34, 34]) el('ellipse', { cx: x, cy: -8, rx: 30, ry: 15, fill: color, ...SO }, body);
  el('path', { d: 'M -80 -20 C -88 -112 -52 -172 0 -172 C 52 -172 88 -112 80 -20 C 72 -2 -72 -2 -80 -20 Z', fill: color, ...SO }, body);
  if (belly) el('ellipse', { cx: 0, cy: -46, rx: 44, ry: 30, fill: belly }, body);
  if (acc === 'apron') {
    el('path', { d: 'M -52 -70 L 52 -70 L 60 -14 Q 0 0 -60 -14 Z', fill: K.white, ...SO, 'stroke-width': 6 }, body);
    for (const [x, y] of [[-28, -52], [6, -40], [32, -56], [-12, -24], [28, -22]]) el('circle', { cx: x, cy: y, r: 6, fill: K.red }, body);
  }
  if (name) {
    el('circle', { cx: 0, cy: -44, r: 22, fill: K.white, ...SO, 'stroke-width': 5 }, body);
    txt(body, name, { x: 0, y: -33, 'font-size': 30, 'font-family': FONT, 'font-weight': 900, fill: K.ol, 'text-anchor': 'middle' });
  }
  // headwear
  if (acc === 'kalpak') {
    el('path', { d: 'M -58 -150 L -38 -246 Q 0 -262 38 -246 L 58 -150 Z', fill: K.white, ...SO }, body);
    el('path', { d: 'M -62 -150 L -6 -150 L -14 -126 L -66 -126 Z', fill: K.ol }, body);
    el('path', { d: 'M 6 -150 L 62 -150 L 66 -126 L 14 -126 Z', fill: K.ol }, body);
    el('path', { d: 'M -30 -200 Q 0 -214 30 -200', fill: 'none', stroke: K.ol, 'stroke-width': 4 }, body);
    el('circle', { cx: 0, cy: -258, r: 7, fill: K.ol }, body);
  } else if (acc === 'curlers') {
    for (const [x, c] of [[-40, K.yellow], [0, K.sky], [40, K.lime]]) el('rect', { x: x - 16, y: -196, width: 32, height: 36, rx: 12, fill: c, ...SO, 'stroke-width': 5 }, body);
  } else if (acc === 'cap') {
    el('path', { d: 'M -64 -146 C -64 -206 64 -206 64 -146 Z', fill: K.navy, ...SO }, body);
    el('path', { d: 'M 30 -150 L 112 -150 L 106 -136 L 30 -136 Z', fill: K.navy, ...SO, 'stroke-width': 6 }, body);
  } else if (acc === 'scarf') {
    el('path', { d: 'M -66 -150 C -66 -214 66 -214 66 -150 C 40 -162 -40 -162 -66 -150 Z', fill: K.red, ...SO }, body);
    for (const [x, y] of [[-30, -184], [0, -192], [30, -184]]) el('circle', { cx: x, cy: y, r: 6, fill: K.white }, body);
  } else if (acc === 'towel') {
    el('path', { d: 'M -70 -146 C -80 -230 80 -230 70 -146 C 40 -160 -40 -160 -70 -146 Z', fill: K.white, ...SO }, body);
    el('path', { d: 'M -40 -200 Q 0 -232 40 -200', fill: 'none', stroke: K.grey, 'stroke-width': 5 }, body);
  }
  const eyes = el('g', {}, body);
  for (const x of [-28, 28]) { el('ellipse', { cx: x, cy: -112, rx: 11, ry: 16, fill: K.ol }, eyes); el('circle', { cx: x + 4, cy: -118, r: 4, fill: K.white }, eyes); }
  const eyesX = el('path', { d: 'M -40 -124 L -16 -100 M -16 -124 L -40 -100 M 16 -124 L 40 -100 M 40 -124 L 16 -100', stroke: K.ol, 'stroke-width': 7, 'stroke-linecap': 'round' }, body);
  const eyesUp = el('path', { d: 'M -40 -108 Q -28 -124 -16 -108 M 16 -108 Q 28 -124 40 -108', stroke: K.ol, 'stroke-width': 7, fill: 'none', 'stroke-linecap': 'round' }, body);
  for (const x of [-54, 54]) el('ellipse', { cx: x, cy: -86, rx: 14, ry: 8, fill: K.pink, opacity: .85 }, body);
  const mC = el('path', { d: 'M -14 -80 Q 0 -68 14 -80', fill: 'none', stroke: K.ol, 'stroke-width': 6, 'stroke-linecap': 'round' }, body);
  const mO = el('g', {}, body);
  el('ellipse', { cx: 0, cy: -74, rx: 17, ry: 19, fill: K.ol }, mO);
  el('ellipse', { cx: 0, cy: -64, rx: 10, ry: 7, fill: K.red }, mO);
  const c = { g, body, armL, armR, eyes, eyesX, eyesUp, mC, mO };
  pose(c, {});
  return c;
}
function pose(c, { hey = 0, open = false, sq = 1, lean = 0, face = null, armsL = null, armsR = null }) {
  const aL = armsL ?? lerp(18, 158, hey), aR = armsR ?? lerp(18, 158, hey);
  c.armL.setAttribute('transform', `translate(-72 -98) rotate(${aL})`);
  c.armR.setAttribute('transform', `translate(72 -98) rotate(${-aR})`);
  c.body.setAttribute('transform', `rotate(${lean}) scale(${(1 / Math.sqrt(sq)).toFixed(3)} ${sq.toFixed(3)})`);
  show(c.mO, open); show(c.mC, !open);
  show(c.eyes, !face); show(c.eyesX, face === 'x'); show(c.eyesUp, face === 'up');
}
// a phone held in the right hand (attached to the arm, so it follows the pose)
function phoneIn(c) { const p = el('g', { transform: 'translate(0 70) rotate(180)' }, c.armR); el('rect', { x: -20, y: -38, width: 40, height: 70, rx: 9, fill: K.ol, stroke: K.ol, 'stroke-width': 4 }, p); el('rect', { x: -14, y: -30, width: 28, height: 48, rx: 4, fill: K.yellow }, p); return p; }
const HERO = (p) => bean(p, { color: K.sky, belly: '#BFEAFF', acc: 'kalpak' });
const HERO_TOWEL = (p) => bean(p, { color: K.sky, belly: '#BFEAFF', acc: 'towel' });
const EJE = (p) => bean(p, { color: K.orange, acc: 'apron' });
const MAMA = (p) => bean(p, { color: K.pink, belly: '#FFD0E2', acc: 'curlers' });
const DRIVER = (p) => bean(p, { color: K.green, belly: '#A9EBC0', acc: 'cap' });

// ============================================================ telops
// call: speech card above the character; the text pops in glyph-free (whole), with a back-ease
function callCard(p, s, x, y, tailX) {
  const g = el('g', {}, p);
  const size = fitSize(s, 66, 740);
  const w = measure(s, size) + 90, h = size + 70;
  const inner = el('g', {}, g);
  card(inner, -w / 2, -h / 2, w, h, K.cream, 40);
  el('path', { d: `M ${tailX - 30} ${h / 2 - 4} L ${tailX + 34} ${h / 2 - 4} L ${tailX - 6} ${h / 2 + 52} Z`, fill: K.cream, stroke: K.ol, 'stroke-width': 7, 'stroke-linejoin': 'round' }, inner);
  el('rect', { x: tailX - 26, y: h / 2 - 12, width: 54, height: 12, fill: K.cream }, inner);
  txt(inner, s, { x: 0, y: size * 0.36, 'font-size': size, 'font-family': FONT, 'font-weight': 900, fill: K.ol, 'text-anchor': 'middle' });
  return { g, inner, x, y, w, h };
}
function cardAnim(c, t, t0, t1) {
  if (t < t0 || t >= t1) { op(c.g, 0); return; }
  op(c.g, 1);
  const p = seg(t, t0, t0 + 0.3);
  tf(c.g, c.x, c.y + 50 * (1 - E.out(p)), lerp(0.6, 1, E.back(p)), -2 * (1 - p));
}
// response: the "translation" plate at the bottom — it flips in like a scoreboard tile
function transPlate(p, s, y) {
  const g = el('g', {}, p);
  const size = fitSize(s, 72, 760);
  const w = Math.max(measure(s, size) + 100, 520), h = size + 84;
  const inner = el('g', {}, g);
  card(inner, -w / 2, -h / 2, w, h, K.yellow, 30, 16);
  const tab = el('g', { transform: `translate(${-w / 2 + 26} ${-h / 2 - 26}) rotate(-3)` }, inner);
  el('rect', { x: 0, y: -24, width: 250, height: 56, rx: 16, fill: K.ol }, tab);
  txt(tab, 'ПЕРЕВОД:', { x: 125, y: 16, 'font-size': 34, 'font-family': FONT, 'font-weight': 900, fill: K.white, 'text-anchor': 'middle', 'letter-spacing': 2 });
  txt(inner, s, { x: 0, y: size * 0.36 + 6, 'font-size': size, 'font-family': FONT, 'font-weight': 900, fill: K.ol, 'text-anchor': 'middle' });
  return { g, inner, x: CX, y, w, h, size };
}
function plateAnim(c, t, t0, t1) {
  if (t < t0 || t >= t1) { op(c.g, 0); return; }
  op(c.g, 1);
  const p = seg(t, t0, t0 + 0.24);
  // scoreboard flip: scaleY 0 → overshoot → 1
  const sy = p < 1 ? Math.max(0.02, E.back(p)) : 1;
  tf(c.g, c.x, c.y, 1, 0, sy);
}
function sticker(p, label) {
  const g = el('g', {}, p);
  const w = measure(label, 40) + 56;
  el('rect', { x: 8, y: 8, width: w, height: 70, rx: 35, fill: K.ol }, g);
  el('rect', { x: 0, y: 0, width: w, height: 70, rx: 35, fill: K.white, stroke: K.ol, 'stroke-width': 6 }, g);
  txt(g, label, { x: w / 2, y: 49, 'font-size': 40, 'font-family': FONT, 'font-weight': 900, fill: K.ol, 'text-anchor': 'middle', 'letter-spacing': 2 });
  return { g, w };
}
function judgeEl(p, word, x, y, col, rot = -9) {
  const g = el('g', {}, p);
  const size = fitSize(word, 170, 700);
  const burstG = el('g', {}, g);
  el('path', { d: starPath(14, 300, 200), fill: K.white, stroke: K.ol, 'stroke-width': 8, 'stroke-linejoin': 'round' }, burstG);
  const wg = el('g', { transform: `rotate(${rot})` }, g);
  gtext(wg, word, 12, size * 0.36 + 12, size, { fill: K.ol, stroke: K.ol, sw: size * 0.16 });
  gtext(wg, word, 0, size * 0.36, size, { fill: col, sw: size * 0.15 });
  return { g, burstG, x, y };
}
function judgeAnim(j, t, t0, t1) {
  if (t < t0 || t >= t1) { op(j.g, 0); return; }
  op(j.g, 1);
  const s = pop(t, t0, 0.22);
  tf(j.g, j.x, j.y, s);
  j.burstG.setAttribute('transform', `rotate(${(t - t0) * 40}) scale(${(0.5 + 0.5 * E.out(seg(t, t0, t0 + 0.2))).toFixed(3)})`);
}

// ============================================================ scenes
const SCENES = [];
function scene(t0, t1, build) {
  const g = el('g', {}, document.getElementById('world'));
  const s = { t0, t1, g, fx: [] };
  s.update = build(g, s);
  SCENES.push(s);
}
const set = (g, o) => {
  bg(g, o.bg);
  let pat = null;
  if (o.kind === 'stripes') pat = stripes(g, o.pat, 56, -18);
  if (o.kind === 'dots') pat = dots(g, o.pat, 96, 18);
  if (o.kind === 'rays') { pat = rays(g, 18, o.pat); }
  floor(g, o.floor, o.floorY ?? 1150);
  return pat;
};

let DURS = {};
const VOICE_LEAD = 0.3;                    // call starts on the "and" of beat 1
const snapUp = (x, q = B / 4) => Math.ceil(x / q - 1e-6) * q;

const ROUNDS = [
  { n: 1, bar: 2, set: { bg: '#FFB870', pat: '#FFC489', kind: 'stripes', floor: '#E8955A' }, who: 'hero',
    call: ['c1', 'Щас подъеду!'], resp: ['r1', 'вышел из душа'], judge: ['ЖИЗА!', K.pink], shout: 's_hero', scene: 'shower' },
  { n: 2, bar: 4, set: { bg: '#5FD3C1', pat: '#7DDECF', kind: 'dots', floor: '#36AE9B' }, who: 'eje',
    call: ['c2', 'Бери, для тебя скидка!'], resp: ['r2', 'цена та же'], judge: ['100%!', K.yellow], shout: 's_eje', scene: 'bazaar' },
  { n: 3, bar: 6, set: { bg: '#FF8DB7', pat: '#FFA6C7', kind: 'stripes', floor: '#E0618F' }, who: 'hero',
    call: ['c3', '5 минут — и начинаем!'], resp: ['r3', '2 часа и 3 тоста'], judge: ['ЖИЗА!', K.yellow], shout: 's_driver', scene: 'toi' },
  { n: 4, bar: 8, set: { bg: '#FFD23F', pat: '#FFDD6B', kind: 'dots', floor: '#E3AE1F' }, who: 'mama',
    call: ['c5', 'Алло, покушал?'], resp: ['r5', 'это вместо «привет»'], judge: ['ЭТО МЫ!', K.pink], shout: 's_mama', scene: 'phone' },
  { n: 5, bar: 10, set: { bg: '#A98BFF', pat: '#B9A0FF', kind: 'stripes', floor: '#7E5CE0' }, who: 'driver',
    call: ['c6', 'Проходим, есть место!'], resp: ['r6', 'мест нет. ты внутри'], judge: ['ЖИЗА!', K.yellow], shout: 's_driver', scene: 'bus' },
  { n: 6, bar: 12, set: { bg: '#2F5BD9', pat: '#4570E6', kind: 'rays', floor: '#1F3FA6' }, who: 'hero',
    call: ['c7', 'На Иссык-Куль на выходные!'], resp: ['r7', '5 ч в пути, 1 день пляжа'], judge: ['ЖИЗА!', K.yellow], shout: 's_hero', scene: 'road' },
];
const FINAL_BAR = 14, END_BAR = 17;
const DUR = at(END_BAR);
window.DUR = DUR;

// ----- per-round prop builders: return update(t, k) where k = timing keys
const PROPS = {
  shower(g, k) {
    const head = el('g', {}, g);
    el('path', { d: 'M 760 560 L 760 470 L 620 470', fill: 'none', stroke: K.grey, 'stroke-width': 22, 'stroke-linecap': 'round' }, head);
    el('path', { d: 'M 560 470 L 680 470 L 700 520 L 540 520 Z', fill: K.grey, ...SO }, head);
    const drops = el('g', {}, g); const r = rng(5); const D = [];
    for (let i = 0; i < 26; i++) D.push({ x: 560 + r() * 140 - 60 + (r() - 0.5) * 120, ph: r(), e: el('rect', { width: 8, height: 34, rx: 4, fill: '#E9F8FF', stroke: K.ol, 'stroke-width': 3 }, drops) });
    const steam = el('g', {}, g); const S = [];
    for (let i = 0; i < 5; i++) S.push(el('circle', { r: 40, fill: K.white, opacity: 0.6 }, steam));
    const w = el('g', {}, g); const c = HERO_TOWEL(w); phoneIn(c);
    return (t) => {
      const heavy = t >= k.flip ? 1.8 : 1;
      D.forEach((d, i) => { const ph = ((t * 1.3 * heavy + d.ph) % 1); tf(d.e, d.x, 540 + ph * 560); op(d.e, ph < 0.92 ? 1 : 0); });
      S.forEach((s, i) => { const ph = (t * 0.25 + i / 5) % 1; s.setAttribute('cx', 380 + i * 90 + Math.sin(t * 2 + i) * 20); s.setAttribute('cy', 1080 - ph * 520); s.setAttribute('r', 30 + ph * 40); op(s, 0.55 * (1 - ph)); });
      tf(w, 560, 1150 + hopY(t, 10), 1.45);
      const talk = t >= k.call && t < k.call + (DURS.c1 || 0.7);
      pose(c, { open: talk && Math.floor(t * 12) % 2 === 0, armsR: 150, armsL: t >= k.judge ? 150 : 25, face: t >= k.flip && t < k.judge ? 'up' : null, sq: hitSq(t, k.judge) });
    };
  },
  bazaar(g, k) {
    const w = el('g', {}, g); const c = EJE(w);
    const counter = el('g', {}, g);
    el('rect', { x: 150, y: 930, width: 720, height: 230, rx: 18, fill: K.wood, ...SO }, counter);
    el('rect', { x: 150, y: 930, width: 720, height: 40, rx: 14, fill: '#E0A676', ...SO, 'stroke-width': 6 }, counter);
    for (let i = 0; i < 9; i++) for (let j = 0; j < 2; j++) el('circle', { cx: 220 + i * 70 + j * 35, cy: 900 - j * 50, r: 34, fill: K.red, ...SO, 'stroke-width': 6 }, counter);
    // price tag on a stick
    const tag = el('g', {}, g);
    el('line', { x1: 0, y1: 0, x2: 0, y2: 220, stroke: K.ol, 'stroke-width': 10 }, tag);
    el('rect', { x: -120, y: -110, width: 240, height: 130, rx: 18, fill: K.white, ...SO }, tag);
    const price = txt(tag, '100 сом', { x: 0, y: -26, 'font-size': 56, 'font-family': FONT, 'font-weight': 900, fill: K.ol, 'text-anchor': 'middle' });
    const cross = el('path', { d: 'M -100 -50 L 100 -60', stroke: K.red, 'stroke-width': 14, 'stroke-linecap': 'round' }, tag);
    const fake = gtext(tag, '-10%', 60, -130, 60, { fill: K.yellow });
    const hammer = el('g', {}, g);
    el('rect', { x: -12, y: 0, width: 24, height: 200, rx: 10, fill: K.wood, ...SO }, hammer);
    el('rect', { x: -70, y: -50, width: 140, height: 70, rx: 14, fill: K.grey, ...SO }, hammer);
    return (t) => {
      tf(w, 330, 960 + hopY(t, 8), 1.5);
      const talk = t >= k.call && t < k.call + (DURS.c2 || 1.6);
      pose(c, { open: talk && Math.floor(t * 12) % 2 === 0, armsR: talk ? 120 : 30, armsL: 30, sq: hitSq(t, k.judge) });
      tf(tag, 700, 640, 1 + 0.25 * Math.exp(-Math.max(0, t - k.flip) * 8) * (t >= k.flip ? 1 : 0), -6);
      const fakeOn = t >= k.call + 0.5 && t < k.flip;
      op(fake, fakeOn ? 1 : 0); op(cross, fakeOn ? 1 : 0);
      price.setAttribute('fill', t >= k.flip ? K.red : K.ol);
      const hp = seg(t, k.flip - 0.3, k.flip);
      op(hammer, t >= k.flip - 0.3 && t < k.flip + 0.5 ? 1 : 0);
      tf(hammer, 860, 460, 1, lerp(70, -10, E.in(hp)));
    };
  },
  toi(g, k) {
    const clock = el('g', {}, g);
    el('circle', { r: 120, fill: K.white, ...SO, 'stroke-width': 10 }, clock);
    for (let i = 0; i < 12; i++) el('rect', { x: -5, y: -110, width: 10, height: i % 3 ? 16 : 28, fill: K.ol, transform: `rotate(${i * 30})` }, clock);
    const hh = el('rect', { x: -7, y: -60, width: 14, height: 66, rx: 7, fill: K.ol }, clock);
    const mh = el('rect', { x: -5, y: -96, width: 10, height: 102, rx: 5, fill: K.red }, clock);
    el('circle', { r: 12, fill: K.ol }, clock);
    const table = el('g', {}, g);
    el('rect', { x: 120, y: 980, width: 780, height: 60, rx: 14, fill: K.white, ...SO }, table);
    for (const x of [180, 840]) el('rect', { x: x - 14, y: 1030, width: 28, height: 120, fill: K.wood, ...SO, 'stroke-width': 6 }, table);
    for (let i = 0; i < 5; i++) { el('ellipse', { cx: 200 + i * 150, cy: 970, rx: 56, ry: 18, fill: '#FFE9C7', ...SO, 'stroke-width': 5 }, table); }
    const glasses = [];
    for (let i = 0; i < 3; i++) {
      const gg = el('g', {}, g);
      el('path', { d: 'M -26 -90 L 26 -90 L 18 -10 L -18 -10 Z', fill: '#E7F6FF', ...SO, 'stroke-width': 6 }, gg);
      el('rect', { x: -5, y: -10, width: 10, height: 40, fill: K.ol }, gg);
      el('rect', { x: -26, y: 26, width: 52, height: 10, rx: 5, fill: K.ol }, gg);
      gtext(gg, `×${i + 1}`, 0, -110, 50, { fill: K.yellow });
      glasses.push(gg);
    }
    const w = el('g', {}, g); const c = HERO(w);
    const toasts = [k.flip + B, k.flip + 2 * B, k.flip + 3 * B];
    toasts.forEach(t0 => { ev(t0, 'sfx', { name: 'clink' }); punch(t0, 0.012); });
    return (t) => {
      // clock: 5 minutes → spins to +2 h after the flip
      const spin = E.out(seg(t, k.flip, k.flip + 1.2));
      tf(clock, 700, 560, 1);
      mh.setAttribute('transform', `rotate(${30 + spin * 720})`);
      hh.setAttribute('transform', `rotate(${150 + spin * 60})`);
      glasses.forEach((gg, i) => { const p = pop(t, toasts[i], 0.25); op(gg, p > 0 ? 1 : 0); tf(gg, 300 + i * 170, 960 - 20 * Math.max(0, 1 - (t - toasts[i]) * 4), p); });
      tf(w, 260, 1150 + hopY(t, 10), 1.3);
      const talk = t >= k.call && t < k.call + (DURS.c3 || 1.1);
      pose(c, { open: talk && Math.floor(t * 12) % 2 === 0, hey: talk ? 0.6 : 0, face: t >= k.flip + 1.2 && t < k.judge ? 'x' : null, sq: hitSq(t, k.judge) });
    };
  },
  phone(g, k) {
    // split stage: mama (left) / hero (right), a zig-zag divider
    const right = el('g', {}, g);
    el('path', { d: 'M 560 0 L 1080 0 L 1080 1150 L 520 1150 L 580 900 L 500 700 L 580 500 L 500 300 L 580 120 Z', fill: '#FFB3CF', stroke: K.ol, 'stroke-width': 8 }, right);
    const wm = el('g', {}, g); const m = MAMA(wm); phoneIn(m);
    const wh = el('g', {}, g); const h = HERO(wh); phoneIn(h);
    const card2 = el('g', {}, g);
    card(card2, -170, -60, 340, 120, K.white, 26, 10);
    const hi = gtext(card2, 'ПРИВЕТ', 0, 22, 62, { fill: K.ol, stroke: K.white, sw: 2 });
    const strike = el('path', { d: 'M -140 4 L 140 -6', stroke: K.red, 'stroke-width': 14, 'stroke-linecap': 'round' }, card2);
    const ring = el('g', {}, g);
    for (let i = 0; i < 3; i++) el('path', { d: `M ${-30 - i * 22} ${-30 - i * 22} A ${40 + i * 30} ${40 + i * 30} 0 0 1 ${30 + i * 22} ${-30 - i * 22}`, fill: 'none', stroke: K.ol, 'stroke-width': 8, 'stroke-linecap': 'round' }, ring);
    return (t) => {
      tf(wm, 260, 1150 + hopY(t, 10), 1.35);
      tf(wh, 780, 1150 + hopY(t, 10, 0.5), 1.2);
      const talk = t >= k.call && t < k.call + (DURS.c5 || 1.2);
      pose(m, { open: talk && Math.floor(t * 12) % 2 === 0, armsR: 150, armsL: 20, sq: hitSq(t, k.judge) });
      pose(h, { armsR: 150, armsL: 20, face: t >= k.flip && t < k.judge ? 'up' : null, open: t >= k.judge, sq: hitSq(t, k.judge) });
      op(ring, t < k.call ? (Math.floor(t / 0.15) % 2 ? 1 : 0.3) : 0); tf(ring, 780, 640);
      const cp = pop(t, k.flip, 0.25);
      op(card2, cp > 0 ? 1 : 0); tf(card2, 740, 560, cp, 4);
      op(strike, t >= k.flip + 0.45 ? 1 : 0);
    };
  },
  bus(g, k) {
    const bus = el('g', {}, g);
    el('rect', { x: 60, y: 560, width: 860, height: 470, rx: 60, fill: K.yellow, ...SO, 'stroke-width': 10 }, bus);
    el('rect', { x: 60, y: 900, width: 860, height: 40, fill: K.orange, stroke: K.ol, 'stroke-width': 6 }, bus);
    for (const x of [230, 760]) { el('circle', { cx: x, cy: 1040, r: 70, fill: K.ol }, bus); el('circle', { cx: x, cy: 1040, r: 28, fill: K.grey }, bus); }
    // windows packed with passengers
    const cols = ['#FF6FA5', '#FF9F43', '#2FBF5B', '#5AC8FA', '#FFFFFF', '#C9CCD6', '#FF4D5E', '#8E6CFF'];
    const wins = el('g', {}, bus); const r = rng(9);
    for (let i = 0; i < 4; i++) {
      const x = 110 + i * 150;
      el('rect', { x, y: 610, width: 130, height: 200, rx: 20, fill: '#D6F3FF', ...SO, 'stroke-width': 6 }, wins);
      for (let j = 0; j < 3; j++) {
        const cx = x + 30 + j * 36, cy = 700 + (r() - 0.5) * 50;
        el('circle', { cx, cy, r: 34, fill: cols[(i * 3 + j) % cols.length], ...SO, 'stroke-width': 5 }, wins);
        el('circle', { cx: cx - 9, cy: cy - 6, r: 4, fill: K.ol }, wins); el('circle', { cx: cx + 9, cy: cy - 6, r: 4, fill: K.ol }, wins);
      }
    }
    // driver in the front window
    el('rect', { x: 720, y: 610, width: 170, height: 230, rx: 20, fill: '#D6F3FF', ...SO, 'stroke-width': 6 }, bus);
    const wd = el('g', {}, bus); const d = DRIVER(wd);
    // door + squeezed hero
    const door = el('rect', { x: 620, y: 620, width: 90, height: 300, rx: 10, fill: '#D6F3FF', ...SO, 'stroke-width': 6 }, g);
    const wh = el('g', {}, g); const h = HERO(wh);
    ev(k.call - 0.25, 'sfx', { name: 'horn' });
    return (t) => {
      const shake = t >= k.flip ? Math.sin(t * 60) * 4 * Math.exp(-(t - k.flip) * 3) : 0;
      tf(bus, shake, hopY(t, 4));
      tf(wd, 805, 840, 0.9);
      const talk = t >= k.call && t < k.call + (DURS.c6 || 1.6);
      pose(d, { open: talk && Math.floor(t * 12) % 2 === 0, armsR: talk ? 130 : 20, sq: hitSq(t, k.judge) });
      // hero: pushed into the door after the flip, squashed flat
      const p = E.out(seg(t, k.flip, k.flip + 0.4));
      tf(wh, lerp(470, 665, p), 1150, 1.15);
      pose(h, { sq: lerp(1, 1.5, p), face: p > 0.5 ? 'x' : null, hey: t >= k.judge ? 1 : 0 });
      op(door, p > 0.9 ? 0.85 : 0);
    };
  },
  road(g, k) {
    // vertical road scrolling toward the viewer, a tiny car, an hours counter; after the flip — the beach
    const road = el('g', {}, g);
    el('path', { d: 'M 380 360 L 610 360 L 900 1150 L 90 1150 Z', fill: '#4A4F63', ...SO }, road);
    const dashes = el('g', {}, road); const DS = [];
    for (let i = 0; i < 8; i++) DS.push(el('rect', { width: 18, height: 60, rx: 6, fill: K.white }, dashes));
    const car = el('g', {}, g);
    el('rect', { x: -110, y: -80, width: 220, height: 110, rx: 30, fill: K.red, ...SO }, car);
    el('rect', { x: -70, y: -130, width: 140, height: 70, rx: 20, fill: '#D6F3FF', ...SO, 'stroke-width': 6 }, car);
    for (const x of [-70, 70]) el('circle', { cx: x, cy: 34, r: 26, fill: K.ol }, car);
    const hw = el('g', { transform: 'translate(0 -66) scale(0.42)' }, car); const h = HERO(hw);
    const hours = el('g', {}, g);
    card(hours, -120, -70, 240, 140, K.white, 28, 10);
    const hn = gtext(hours, '0 ч', 0, 30, 84, { fill: K.ol, stroke: K.white, sw: 2 });
    const beach = el('g', {}, g);
    el('rect', { x: 0, y: 820, width: W, height: 160, fill: K.sea, stroke: K.ol, 'stroke-width': 8 }, beach);
    el('rect', { x: 0, y: 960, width: W, height: 200, fill: K.sand, stroke: K.ol, 'stroke-width': 8 }, beach);
    el('circle', { cx: 790, cy: 520, r: 90, fill: K.yellow, ...SO }, beach);
    el('path', { d: 'M 300 1080 L 340 760', stroke: K.ol, 'stroke-width': 12 }, beach);
    el('path', { d: 'M 180 800 Q 340 640 500 800 Z', fill: K.red, ...SO }, beach);
    const day = el('g', {}, beach); card(day, -150, -60, 300, 120, K.white, 26, 10);
    gtext(day, '1 день', 0, 24, 66, { fill: K.ol, stroke: K.white, sw: 2 });
    const hourTimes = [0, 1, 2, 3, 4].map(i => k.call + 0.1 + i * B / 2);
    hourTimes.forEach((t0, i) => ev(t0, 'sfx', { name: 'pip', f: 600 + i * 120 }));
    return (t) => {
      const beachOn = t >= k.flip;
      show(road, !beachOn); show(car, !beachOn); show(hours, !beachOn); show(beach, beachOn);
      DS.forEach((d, i) => { const ph = (t * 1.6 + i / 8) % 1; const y = 360 + ph * ph * 790; const s = 0.4 + ph * 1.4; tf(d, 495 - 9 * s, y, s); });
      tf(car, 495, 1010 + hopY(t, 6), 1);
      pose(h, { open: t >= k.call && t < k.call + (DURS.c7 || 1.4) && Math.floor(t * 12) % 2 === 0, hey: 1 });
      let n = 0; hourTimes.forEach(t0 => { if (t >= t0) n++; });
      hn.textContent = `${n} ч`;
      tf(hours, 495, 560 + (hourTimes.some(t0 => t >= t0 && t < t0 + 0.1) ? -8 : 0), 1);
      tf(day, 760, 1050, pop(t, k.flip + 0.2, 0.25), 5);
    };
  },
};

function buildRound(R) {
  const T0 = at(R.bar), T1 = at(R.bar + 2);
  const k = { call: T0 + VOICE_LEAD };
  const cd = DURS[R.call[0]] ?? 1.2;
  k.flip = T0 + Math.max(4 * B / 2, snapUp(VOICE_LEAD + cd + 0.1));   // ≥ beat 2, on a half-beat
  k.judge = T0 + 7 * B;                                                // bar 2, beat 3
  ev(T0, 'cut'); CUTS.push(T0); punch(T0, 0.03);
  ev(k.call, 'voice', { id: R.call[0] }); ev(k.call, 'sfx', { name: 'pop', f: 820 }); punch(k.call, 0.015);
  ev(k.flip, 'voice', { id: R.resp[0] }); ev(k.flip, 'sfx', { name: 'flip' }); punch(k.flip, 0.02);
  if (R.scene === 'bazaar') { ev(k.flip, 'sfx', { name: 'hammer' }); punch(k.flip, 0.04); }
  ev(k.judge, 'sfx', { name: 'stamp' }); ev(k.judge - 0.03, 'voice', { id: R.shout, gain: 0.9 }); punch(k.judge, 0.05);
  scene(T0, T1, (g, s) => {
    const pat = set(g, R.set);
    const stage = el('g', {}, g);
    const upd = PROPS[R.scene](stage, k);
    const st = sticker(g, `РАУНД ${R.n}`);
    const tailX = { hero: -120, eje: -160, mama: -200, driver: 260 }[R.who] ?? -100;
    const cc = callCard(g, R.call[1], CX, 380, R.scene === 'phone' ? -230 : tailX);
    const tp = transPlate(g, R.resp[1], 1300);
    const j = judgeEl(g, R.judge[0], CX, 700, R.judge[1]);
    regText(`call${R.n}`, R.call[1], k.call, T1, [CX - cc.w / 2, 380 - cc.h / 2, CX + cc.w / 2, 380 + cc.h / 2]);
    regText(`resp${R.n}`, R.resp[1], k.flip + 0.24, T1, [CX - tp.w / 2, 1300 - tp.h / 2 - 50, CX + tp.w / 2, 1300 + tp.h / 2]);
    regText(`judge${R.n}`, R.judge[0], k.judge, T1, [CX - 320, 560, CX + 320, 840], true);
    regText(`sticker${R.n}`, `РАУНД ${R.n}`, T0, T1, [64, 262, 64 + st.w, 340], true);
    return (t) => {
      if (pat && R.set.kind === 'stripes') pat.setAttribute('transform', `translate(${W / 2 + ((t * 40) % 224)} ${H / 2}) rotate(-18)`);
      if (pat && R.set.kind === 'rays') pat.setAttribute('transform', `translate(${CX} 760) rotate(${t * 12})`);
      upd(t);
      const sp = pop(t, T0, 0.3); tf(st.g, 64, 262, sp, -4);
      cardAnim(cc, t, k.call, T1);
      plateAnim(tp, t, k.flip, T1);
      judgeAnim(j, t, k.judge, T1);
    };
  });
}

function buildHook() {
  const T0 = 0, T1 = at(2);
  ev(0, 'cut'); punch(0, 0.04); ev(0, 'sfx', { name: 'stamp' });
  ev(VOICE_LEAD, 'voice', { id: 'h0' });
  const heroAt = at(0, 2);
  ev(heroAt, 'sfx', { name: 'boing' }); punch(heroAt, 0.02);
  scene(T0, T1, (g) => {
    bg(g, K.yellow); const r = rays(g, 20, '#FFE27A'); floor(g, '#E3AE1F', 1150);
    const title = el('g', {}, g);
    const l1 = gtext(title, 'КЫРГЫЗЫ', 0, 0, 150, { fill: K.white, sw: 24 });
    const l2 = gtext(title, 'ПОЙМУТ', 0, 170, 190, { fill: K.pink, sw: 28 });
    const w = el('g', {}, g); const c = HERO(w);
    const sub = el('g', {}, g);
    const s = 'переводчик с нашего на честный';
    const size = fitSize(s, 52, 760); const sw = measure(s, size) + 80;
    card(sub, -sw / 2, -56, sw, 112, K.cream, 30, 12);
    txt(sub, s, { x: 0, y: size * 0.36, 'font-size': size, 'font-family': FONT, 'font-weight': 900, fill: K.ol, 'text-anchor': 'middle' });
    const subAt = 1.2;
    ev(subAt, 'sfx', { name: 'flip' });
    regText('title', 'КЫРГЫЗЫ ПОЙМУТ', 0.05, T1, [CX - 420, 330, CX + 420, 640]);
    regText('sub', s, subAt, T1, [CX - sw / 2, 1300 - 60, CX + sw / 2, 1300 + 60]);
    return (t) => {
      r.setAttribute('transform', `translate(${CX} 700) rotate(${t * 14})`);
      const p1 = pop(t, 0, 0.3), p2 = pop(t, B, 0.3);
      tf(l1, 0, 0, p1, -5); op(l1, p1 > 0 ? 1 : 0);
      tf(l2, 0, 0, p2, 3); op(l2, p2 > 0 ? 1 : 0);
      tf(title, CX, 440);
      const dy = t < heroAt ? -900 * (1 - E.in(seg(t, heroAt - 0.3, heroAt))) : 0;
      tf(w, CX, 1150 + dy + (t >= heroAt ? hopY(t, 16) : 0), 1.6);
      pose(c, { hey: t >= heroAt + 0.1 ? 1 : 0, open: t >= VOICE_LEAD && t < VOICE_LEAD + (DURS.h0 || 3) && Math.floor(t * 10) % 2 === 0, sq: hitSq(t, heroAt, 0.3) });
      const sp = pop(t, subAt, 0.28); op(sub, sp > 0 ? 1 : 0); tf(sub, CX, 1300, sp, -2);
    };
  });
}

function buildFinal() {
  const T0 = at(FINAL_BAR), T1 = DUR;
  const slotT = ROUNDS.map((_, i) => at(FINAL_BAR, i * 0.5));
  const hit = at(FINAL_BAR + 1);
  const ctaAt = at(FINAL_BAR + 1, 1);
  ev(T0, 'cut'); CUTS.push(T0); punch(T0, 0.03);
  slotT.forEach((t0, i) => ev(t0, 'sfx', { name: 'pip', f: 520 * Math.pow(2, [0, 2, 4, 5, 7, 9][i] / 12) }));
  ev(hit, 'sfx', { name: 'crash' }); punch(hit, 0.06);
  ['s_hero', 's_eje', 's_mama', 's_driver'].forEach((id, i) => ev(hit - 0.03 + i * 0.012, 'voice', { id, gain: 0.8, pan: [-0.6, 0.6, -0.25, 0.25][i] }));
  ev(ctaAt, 'voice', { id: 'f0' }); ev(ctaAt, 'sfx', { name: 'flip' });
  [0, 1, 2, 3].forEach(i => punch(hit + B * (i + 1) * 2, 0.012));
  scene(T0, T1, (g) => {
    bg(g, K.yellow); const r = rays(g, 22, '#FFE27A');
    const short = ['щас подъеду', 'для тебя скидка', '5 минут', 'покушал?', 'есть место', 'на выходные'];
    const cols = ['#FFB870', '#5FD3C1', '#FF8DB7', '#FFF4E2', '#A98BFF', '#7FA6FF'];
    const slots = short.map((s, i) => {
      const sg = el('g', {}, g);
      const cw = 390, ch = 150;
      card(sg, -cw / 2, -ch / 2, cw, ch, cols[i], 26, 10);
      el('circle', { cx: -cw / 2 + 52, cy: 0, r: 34, fill: K.ol }, sg);
      txt(sg, String(i + 1), { x: -cw / 2 + 52, y: 15, 'font-size': 44, 'font-family': FONT, 'font-weight': 900, fill: K.white, 'text-anchor': 'middle' });
      const fs = fitSize(s, 44, cw - 120);
      txt(sg, s, { x: 30, y: fs * 0.36, 'font-size': fs, 'font-family': FONT, 'font-weight': 900, fill: K.ol, 'text-anchor': 'middle' });
      const x = CX + (i % 2 ? 210 : -210), y = 430 + Math.floor(i / 2) * 190;
      return { sg, x, y, t0: slotT[i] };
    });
    const crowd = el('g', {}, g); const cast = [];
    [[HERO, 160], [EJE, 360], [MAMA, 600], [DRIVER, 820]].forEach(([fn, x], i) => { const w = el('g', {}, crowd); cast.push({ w, c: fn(w), x, i }); });
    floor(g, '#E3AE1F', 1160);
    // crowd stands in front of the floor line
    g.appendChild(crowd);
    const j = judgeEl(g, 'ЖИЗА!', CX, 640, K.pink, -8);
    const cta = el('g', {}, g);
    const s1 = 'ДОПИШИ СВОЮ 👇', s2 = 'лучшие — во второй части';
    card(cta, -400, -110, 800, 220, K.ol, 34, 0);
    gtext(cta, s1, 0, -14, 76, { fill: K.yellow, stroke: K.ol, sw: 2 });
    txt(cta, s2, { x: 0, y: 64, 'font-size': 48, 'font-family': FONT, 'font-weight': 800, fill: K.white, 'text-anchor': 'middle' });
    regText('cta1', s1, ctaAt, T1, [CX - 400, 1300 - 110, CX + 400, 1300]);
    regText('cta2', s2, ctaAt, T1, [CX - 400, 1300, CX + 400, 1300 + 110]);
    slots.forEach((sl, i) => regText(`slot${i}`, short[i], sl.t0, T1, [sl.x - 195, sl.y - 75, sl.x + 195, sl.y + 75], true));
    regText('judgeF', 'ЖИЗА!', hit, hit + 1.5, [CX - 320, 500, CX + 320, 780], true);
    return (t) => {
      r.setAttribute('transform', `translate(${CX} 700) rotate(${t * 18})`);
      const bounce = t >= hit ? 1 : 0;
      slots.forEach((sl, i) => {
        const dy = t < sl.t0 ? -1400 * (1 - E.in(seg(t, sl.t0 - 0.25, sl.t0))) : 0;
        const by = bounce ? hopY(t, 14, i * 0.25) : 0;
        op(sl.sg, t >= sl.t0 - 0.25 ? 1 : 0);
        tf(sl.sg, sl.x, sl.y + dy + by, hitSq(t, sl.t0, 0.15) * (t >= hit && t < hit + 0.3 ? 1.06 : 1), (i % 2 ? 2 : -2));
      });
      cast.forEach(({ w, c, x, i }) => {
        tf(w, x, 1160 + hopY(t, t >= hit ? 26 : 10, i * 0.5), 0.95);
        pose(c, { hey: t >= hit ? 1 : 0, open: t >= hit && t < hit + 0.6, sq: hitSq(t, hit, 0.3) });
      });
      judgeAnim(j, t, hit, hit + 1.5);
      const cp = pop(t, ctaAt, 0.3); op(cta, cp > 0 ? 1 : 0); tf(cta, CX, 1300, cp, -1.5);
    };
  });
}

// watermark (HUD, always on)
function buildHud() {
  const hud = document.getElementById('hud');
  txt(hud, 'bishkek.motion', { x: 60, y: 1545, 'font-size': 34, 'font-family': FONT, 'font-weight': 700, fill: K.white, stroke: K.ol, 'stroke-width': 6, 'paint-order': 'stroke', 'stroke-linejoin': 'round', opacity: 0.8 });
}

// ============================================================ render
function cam(t) {
  let a = 0;
  for (const [t0, amt] of PUNCH) if (t >= t0 && t < t0 + 0.5) a += amt * Math.exp(-(t - t0) / 0.16);
  a = Math.min(a, 0.06);
  document.getElementById('cam').setAttribute('transform', `translate(${CX} 960) scale(${(1 + a).toFixed(4)}) translate(${-CX} -960)`);
}
window.render = (t) => {
  for (const s of SCENES) { const on = t >= s.t0 && t < s.t1; show(s.g, on); if (on) s.update(t); }
  cam(t);
  let f = 0; for (const c of CUTS) if (t >= c && t < c + 0.12) f = Math.max(f, 0.7 * (1 - (t - c) / 0.12));
  op(document.getElementById('flash'), f);
};
window.TEXTS = (t) => TEXTS_.filter(x => t >= x.t0 && t < x.t1).map(x => ({ id: x.id, text: x.text, x0: x.box[0], y0: x.box[1], x1: x.box[2], y1: x.box[3], pass: x.pass }));

(async () => {
  try { DURS = await (await fetch('voice/dur.json')).json(); } catch (e) { DURS = {}; }
  const SAMPLE = 'АБВГДабвгдёЁйЙщЩыЫ ABCabc 0123456789';
  for (const w of [700, 800, 900]) await document.fonts.load(`${w} 60px Rubik`, SAMPLE);
  await document.fonts.ready;
  buildHook();
  ROUNDS.forEach(buildRound);
  buildFinal();
  buildHud();
  EV.sort((a, b) => a.t - b.t);
  window.EV = EV;
  window.render(0);
  window.READY = true;
})();
