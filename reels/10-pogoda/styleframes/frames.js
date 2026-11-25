// Style frames for «Погода Бишкека за день»: one still per Lemo-Opuscar style, drawn in code (no animation).
// ?style=microgame | swiss | midcentury | stick
'use strict';
const NS = 'http://www.w3.org/2000/svg';
const W = 1080, H = 1920;
const S = document.getElementById('s');
function el(tag, a = {}, p = S) { const e = document.createElementNS(NS, tag); for (const k in a) e.setAttribute(k, a[k]); p.appendChild(e); return e; }
function txt(p, s, a) { const e = el('text', a, p); e.textContent = s; return e; }
function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function starPath(cx, cy, n, r1, r2, rot = -90) {
  let d = '';
  for (let i = 0; i < n * 2; i++) { const a = (rot + i * 180 / n) * Math.PI / 180, r = i % 2 ? r2 : r1; d += (i ? 'L' : 'M') + (cx + r * Math.cos(a)).toFixed(1) + ' ' + (cy + r * Math.sin(a)).toFixed(1); }
  return d + 'Z';
}
const style = new URLSearchParams(location.search).get('style') || 'microgame';

// ======================================================================== 1. MICROGAME FRENZY
function microgame() {
  const K = { ground: '#2a0f5c', ray: '#3a1878', mag: '#ff2e88', gold: '#ffc928', cyan: '#1fd1d1', ink: '#140a2e', white: '#fff', ok: '#3ee07a', fail: '#ff4d4d' };
  const F = "'Rubik', sans-serif";
  el('rect', { width: W, height: H, fill: K.ground });
  const rays = el('g', { transform: 'translate(495 880)' });
  for (let i = 0; i < 24; i++) { const a0 = i * 15 * Math.PI / 180, a1 = a0 + 7.5 * Math.PI / 180; el('path', { d: `M0 0 L${2400 * Math.cos(a0)} ${2400 * Math.sin(a0)} L${2400 * Math.cos(a1)} ${2400 * Math.sin(a1)}Z`, fill: K.ray }, rays); }
  const ink = { stroke: K.ink, 'stroke-width': 7, 'stroke-linejoin': 'round' };
  const hard = (x, y, w, h, fill, rx = 24, d = 12) => { el('rect', { x: x + d, y: y - d * 0.0 + d, width: w, height: h, rx, fill: K.ink }); return el('rect', { x, y, width: w, height: h, rx, fill, ...ink }); };
  // stage badge + lives
  hard(70, 270, 400, 76, K.gold, 38, 8);
  txt(S, 'ЭТАП 1 · 07:00', { x: 270, y: 322, 'font-family': F, 'font-weight': 900, 'font-size': 40, fill: K.ink, 'text-anchor': 'middle' });
  for (let i = 0; i < 3; i++) {
    const x = 700 + i * 78, y = 308;
    el('path', { d: `M${x} ${y + 26} C${x - 44} ${y - 4} ${x - 26} ${y - 40} ${x} ${y - 16} C${x + 26} ${y - 40} ${x + 44} ${y - 4} ${x} ${y + 26}Z`, fill: i < 2 ? K.mag : K.ground, ...ink, 'stroke-width': 6 });
  }
  // game window: a phone-shaped frame
  const gx = 120, gy = 660, cell = 13, cols = 56, rows = 46, gw = cols * cell, gh = rows * cell;
  el('rect', { x: gx - 26 + 14, y: gy - 26 + 14, width: gw + 52, height: gh + 52, rx: 44, fill: K.ink });
  el('rect', { x: gx - 26, y: gy - 26, width: gw + 52, height: gh + 52, rx: 44, fill: K.cyan, ...ink });
  // --- the microgame in PIXEL medium: an indexed buffer, auto outline
  const PAL = { 0: '#101a4a', 1: '#1b2a6b', 2: '#24357d', 3: '#8a93b8', 4: '#e8ecff', 5: '#ffffff', 6: '#5aa0ff', 7: '#ff3b30', 8: '#ffb347', 9: '#e07b1a', 10: '#000000', 11: '#c7d0f0', 12: '#f2c6a0' };
  const buf = Array.from({ length: rows }, (_, y) => Array.from({ length: cols }, () => (y < 14 ? 0 : y < 26 ? 1 : 2)));
  // Ala-Too ridge with snow caps
  for (let x = 0; x < cols; x++) {
    const h = 24 + Math.round(6 * Math.sin(x * 0.35) + 4 * Math.sin(x * 0.9 + 1));
    for (let y = h; y < 38; y++) buf[y][x] = y < h + 3 ? 4 : 3;
  }
  for (let y = 38; y < rows; y++) for (let x = 0; x < cols; x++) buf[y][x] = (x + y) % 7 === 0 ? 11 : 5;
  const r = rng(3); for (let i = 0; i < 70; i++) { const x = Math.floor(r() * cols), y = Math.floor(r() * 36); buf[y][x] = 5; }
  // hero (t-shirt, shivering) 8×13 — the accent red dot survives every medium
  const hero = ['..6666..', '.666666.', '.6A66A6.', '.666666.', '..6666..', '.888888.', '68888886', '68878886', '.888888.', '.888888.', '..6..6..', '..6..6..', '.AA..AA.'];
  const hx = 25, hy = 30;
  hero.forEach((row, j) => [...row].forEach((c, i) => { if (c === '.') return; buf[hy + j][hx + i] = c === '6' ? 6 : c === '8' ? 8 : c === '7' ? 7 : 10; }));
  // shiver marks
  for (const [x, y] of [[22, 33], [21, 35], [34, 33], [35, 35]]) buf[y][x] = 5;
  // falling puffer jacket (the target)
  const jacket = ['..9999..', '.999999.', '99799799', '99999999', '99799799', '.999999.', '.99..99.'];
  jacket.forEach((row, j) => [...row].forEach((c, i) => { if (c !== '.') buf[10 + j][38 + i] = c === '7' ? 7 : 9; }));
  for (let j = 0; j < 4; j++) buf[18 + j][41] = 8;  buf[21][40] = 8; buf[21][42] = 8;   // arrow ↓
  const game = el('g', {});
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) el('rect', { x: gx + x * cell, y: gy + y * cell, width: cell + 0.6, height: cell + 0.6, fill: PAL[buf[y][x]] }, game);
  el('rect', { x: gx, y: gy, width: gw, height: gh, fill: 'none', stroke: K.ink, 'stroke-width': 6 });
  txt(game, 'СНЕГ: ДА', { x: gx + 20, y: gy + 44, 'font-family': "'Rubik'", 'font-weight': 900, 'font-size': 30, fill: '#ffffff', 'letter-spacing': 3 });
  // command word: slammed in, skewed, burst behind
  el('path', { d: starPath(495, 470, 16, 175, 115), fill: K.gold, ...ink, 'stroke-width': 8 });
  const cmd = el('g', { transform: 'translate(495 520) rotate(-6) skewX(-8)' });
  for (const [dx, dy, fill, sw] of [[12, 12, K.mag, 30], [0, 0, K.white, 26]]) txt(cmd, 'ОДЕНЬСЯ!', { x: dx, y: dy, 'font-family': F, 'font-weight': 900, 'font-size': 150, fill, stroke: K.ink, 'stroke-width': sw, 'paint-order': 'stroke', 'stroke-linejoin': 'round', 'text-anchor': 'middle' });
  // timer: a fuse burning towards the bomb
  const ty = gy + gh + 60;
  el('rect', { x: 100, y: ty, width: 640, height: 16, rx: 8, fill: '#57348f' });
  el('rect', { x: 100, y: ty, width: 380, height: 16, rx: 8, fill: K.gold });
  el('path', { d: starPath(480, ty + 8, 8, 30, 12), fill: K.white });
  el('circle', { cx: 800, cy: ty + 8, r: 46, fill: K.ink });
  el('rect', { x: 788, y: ty - 52, width: 24, height: 20, fill: K.ink });
  // line card (other speech): rounded card in the home palette above the host
  const cy = ty + 70;
  hard(80, cy, 760, 120, '#ffffff', 30, 10);
  el('circle', { cx: 140, cy: cy + 60, r: 30, fill: K.mag, ...ink, 'stroke-width': 5 });
  el('path', { d: `M128 ${cy + 50} L140 ${cy + 50} L152 ${cy + 40} L152 ${cy + 80} L140 ${cy + 70} L128 ${cy + 70}Z`, fill: K.white });
  txt(S, 'Утро. Снег. Ты в футболке.', { x: 186, y: cy + 76, 'font-family': F, 'font-weight': 800, 'font-size': 46, fill: K.ink });
}

// ======================================================================== 2. SWISS MOTION GRAPHICS
function swiss() {
  const P = '#F2F0EA', INK = '#141414', G1 = '#D9D6CE', G2 = '#9A968C', SIG = '#FF5A00';
  const F = "'Inter', sans-serif";
  el('rect', { width: W, height: H, fill: P });
  const M = 72, col = (W - 2 * M - 5 * 24) / 6, cx = i => M + i * (col + 24);
  for (let i = 0; i <= 6; i++) el('line', { x1: cx(i) - (i === 6 ? 24 : 0), y1: 250, x2: cx(i) - (i === 6 ? 24 : 0), y2: 1570, stroke: '#E6E3DB', 'stroke-width': 1 });
  // top caption row
  el('line', { x1: M, y1: 268, x2: W - M - 150 + 72, y2: 268, stroke: INK, 'stroke-width': 1 });
  txt(S, 'БИШКЕК — ПРОГНОЗ НА ОДИН ДЕНЬ', { x: M, y: 300, 'font-family': F, 'font-weight': 500, 'font-size': 22, fill: INK, 'letter-spacing': 2 });
  txt(S, '4 × 6 ч', { x: cx(5) - 24, y: 300, 'font-family': F, 'font-weight': 500, 'font-size': 22, fill: G2 });
  // giant numeral + statement
  txt(S, '4', { x: M - 22, y: 900, 'font-family': F, 'font-weight': 800, 'font-size': 700, fill: INK, 'letter-spacing': -14 });
  txt(S, 'сезона', { x: cx(3), y: 600, 'font-family': F, 'font-weight': 800, 'font-size': 116, fill: INK, 'letter-spacing': -3 });
  txt(S, 'за один', { x: cx(3), y: 700, 'font-family': F, 'font-weight': 400, 'font-size': 76, fill: INK, 'letter-spacing': -2 });
  txt(S, 'день.', { x: cx(3), y: 790, 'font-family': F, 'font-weight': 400, 'font-size': 76, fill: INK, 'letter-spacing': -2 });
  // the day as a table on the grid: rows = hours, bars = how much you wear
  const rows = [['07:00', 'снег', 5], ['13:00', 'лето', 1], ['18:00', 'смог', 3], ['23:00', 'снова зима', 5]];
  const y0 = 980, rh = 120;
  rows.forEach(([h, w, n], i) => {
    const y = y0 + i * rh;
    el('line', { x1: M, y1: y, x2: cx(5) + col, y2: y, stroke: INK, 'stroke-width': 1 });
    txt(S, h, { x: M, y: y + 46, 'font-family': F, 'font-weight': 500, 'font-size': 22, fill: G2, 'letter-spacing': 1 });
    txt(S, w, { x: M, y: y + 98, 'font-family': F, 'font-weight': 800, 'font-size': 56, fill: INK, 'letter-spacing': -1 });
    // clothing layers as merged bars on the artifact grid (cols 3–5)
    for (let k = 0; k < 5; k++) {
      const on = k < n, x = cx(3) + k * ((3 * col + 48) / 5);
      el('rect', { x, y: y + 24, width: (3 * col + 48) / 5 - 8, height: 76, fill: on ? INK : G1 });
    }
  });
  el('line', { x1: M, y1: y0 + 4 * rh, x2: cx(5) + col, y2: y0 + 4 * rh, stroke: INK, 'stroke-width': 1 });
  txt(S, 'слоёв одежды', { x: cx(3), y: y0 - 16, 'font-family': F, 'font-weight': 500, 'font-size': 20, fill: G2, 'letter-spacing': 1 });
  // the one exception: the sun, in the signal colour, slightly off the grid
  el('circle', { cx: cx(4) + 40, cy: y0 + rh + 62, r: 92, fill: SIG });
  txt(S, 'жара', { x: cx(4) + 40, y: y0 + rh + 76, 'font-family': F, 'font-weight': 800, 'font-size': 40, fill: INK, 'text-anchor': 'middle' });
  // subtitle as part of the layout: grey lead-in + bold statement at a column start
  txt(S, 'в обед —', { x: M, y: 1520, 'font-family': F, 'font-weight': 500, 'font-size': 40, fill: G2 });
  txt(S, 'уже лето.', { x: M + 186, y: 1520, 'font-family': F, 'font-weight': 800, 'font-size': 40, fill: INK });
}

// ======================================================================== 3. MID-CENTURY CARTOON
function midcentury() {
  const C = { paper: '#F4ECD8', ink: '#2B2320', wall: '#8FD0C8', floor: '#5FAEA5', coral: '#F07A5A', mustard: '#E9B44C', powder: '#A9C8E8', skin: '#F2C6A0', cream: '#FFF6E0', shade: '#D9CDB4' };
  const SLAB = "'Roboto Slab', serif", SCRIPT = "'Lobster', cursive", SANS = "'Jost', sans-serif";
  const OFF = [6, 5];
  // a "cel": fill printed a few px off its line, line broken and breathing
  const cel = (d, fill, sw = 4.5, p = S) => {
    const g = el('g', {}, p);
    el('path', { d, fill, transform: `translate(${OFF[0]} ${OFF[1]})` }, g);
    el('path', { d, fill: 'none', stroke: C.ink, 'stroke-width': sw, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-dasharray': '140 9 60 7 210 11' }, g);
    return g;
  };
  el('rect', { width: W, height: H, fill: C.paper });
  el('rect', { x: 0, y: 380, width: W, height: 820, fill: C.wall });
  el('rect', { x: 0, y: 1200, width: W, height: 420, fill: C.floor });
  el('path', { d: 'M0 1200 L320 1200 M360 1200 L760 1200 M800 1200 L1080 1200', stroke: C.ink, 'stroke-width': 5 });
  // sunburst behind the sun (semi-transparent wedges)
  const sx = 760, sy = 600;
  for (let i = 0; i < 30; i++) { const a0 = i * 12 * Math.PI / 180, a1 = a0 + 5 * Math.PI / 180; el('path', { d: `M${sx} ${sy} L${sx + 520 * Math.cos(a0)} ${sy + 520 * Math.sin(a0)} L${sx + 520 * Math.cos(a1)} ${sy + 520 * Math.sin(a1)}Z`, fill: '#FFF2B8', opacity: 0.45 }); }
  cel(starPath(sx, sy, 14, 120, 92), C.mustard, 4);
  cel(`M${sx - 70} ${sy} a70 70 0 1 0 140 0 a70 70 0 1 0 -140 0`, C.coral, 4);
  // melting snowman (prop 1)
  cel('M190 1210 C150 1210 150 1150 200 1140 C180 1100 200 1060 240 1060 C290 1060 300 1110 280 1140 C330 1150 330 1210 290 1210 C260 1230 220 1230 190 1210 Z', '#FFFFFF', 4);
  cel('M150 1222 C190 1236 300 1236 340 1222 C300 1250 190 1250 150 1222 Z', '#DDEFF4', 3);
  el('path', { d: 'M232 1090 L262 1098 L232 1104 Z', fill: C.coral, transform: 'translate(3 2)' });
  for (const [x, y] of [[226, 1084], [252, 1084]]) el('circle', { cx: x, cy: y, r: 5, fill: C.ink });
  // presenter: egg head, mustard jacket over the arm, sunglasses, sweat drops
  const px = 520, py = 1210;
  cel(`M${px - 90} ${py} L${px - 70} ${py - 280} C${px - 40} ${py - 320} ${px + 40} ${py - 320} ${px + 70} ${py - 280} L${px + 90} ${py} Z`, C.powder, 4.5);
  cel(`M${px - 50} ${py - 300} C${px - 110} ${py - 420} ${px - 40} ${py - 520} ${px + 10} ${py - 515} C${px + 80} ${py - 510} ${px + 100} ${py - 420} ${px + 60} ${py - 300} C${px + 20} ${py - 280} ${px - 20} ${py - 280} ${px - 50} ${py - 300} Z`, C.skin, 4.5);
  // nose is part of the outline: a bump on the right
  cel(`M${px + 60} ${py - 420} C${px + 110} ${py - 410} ${px + 100} ${py - 380} ${px + 66} ${py - 378}`, 'none', 4);
  // sunglasses
  el('path', { d: `M${px - 50} ${py - 432} h56 v26 a14 14 0 0 1 -14 14 h-28 a14 14 0 0 1 -14 -14 Z M${px + 16} ${py - 432} h50 v26 a14 14 0 0 1 -14 14 h-22 a14 14 0 0 1 -14 -14 Z M${px + 6} ${py - 426} h10`, fill: C.ink, stroke: C.ink, 'stroke-width': 4 });
  el('path', { d: `M${px - 18} ${py - 360} q 26 18 52 0`, fill: 'none', stroke: C.ink, 'stroke-width': 5, 'stroke-linecap': 'round' });
  for (const [x, y] of [[px - 76, py - 470], [px + 96, py - 486], [px - 96, py - 410]]) cel(`M${x} ${y} c-10 16 -10 26 0 28 c10 -2 10 -12 0 -28 Z`, '#BFE6FF', 3);
  // arm with the puffer jacket hanging over it
  cel(`M${px + 60} ${py - 250} C${px + 140} ${py - 230} ${px + 180} ${py - 200} ${px + 200} ${py - 170}`, 'none', 4.5);
  cel(`M${px + 140} ${py - 210} L${px + 260} ${py - 200} L${px + 250} ${py - 30} L${px + 150} ${py - 40} Z`, C.mustard, 4.5);
  for (let i = 0; i < 5; i++) el('path', { d: `M${px + 148} ${py - 180 + i * 30} L${px + 254} ${py - 172 + i * 30}`, stroke: C.ink, 'stroke-width': 3 });
  // glove: four fingers, one outline
  cel(`M${px + 196} ${py - 190} c20 -20 50 -10 44 12 c14 4 12 24 -2 26 c6 14 -8 26 -22 18 c-14 10 -34 -4 -26 -20 c-14 -10 -8 -30 6 -36 Z`, '#FFFFFF', 4);
  // atomic sparkles
  for (const [x, y, r] of [[150, 520, 26], [930, 980, 20], [340, 450, 16]]) cel(starPath(x, y, 4, r, r * 0.28, 0), C.cream, 3);
  // step header
  el('circle', { cx: 120, cy: 300, r: 44, fill: C.ink });
  txt(S, '2', { x: 120, y: 318, 'font-family': SLAB, 'font-weight': 900, 'font-size': 52, fill: C.paper, 'text-anchor': 'middle' });
  txt(S, 'ШАГ 2 ИЗ 4', { x: 184, y: 284, 'font-family': SANS, 'font-weight': 600, 'font-size': 26, fill: C.ink, 'letter-spacing': 6 });
  el('rect', { x: 184 + 6, y: 296 + 5, width: 560, height: 64, rx: 10, fill: C.mustard });
  el('rect', { x: 184, y: 296, width: 560, height: 64, rx: 10, fill: C.cream, stroke: C.ink, 'stroke-width': 3.5 });
  txt(S, 'Обед: внезапно лето', { x: 204, y: 342, 'font-family': SLAB, 'font-weight': 900, 'font-size': 42, fill: C.ink });
  txt(S, 'Бишкек!', { x: 820, y: 290, 'font-family': SCRIPT, 'font-size': 64, fill: C.coral, transform: 'rotate(-6 820 290)', 'text-anchor': 'middle' });
  // detail tag next to the jacket
  el('rect', { x: 690 + 6, y: 880 + 5, width: 250, height: 92, rx: 14, fill: C.shade });
  el('rect', { x: 690, y: 880, width: 250, height: 92, rx: 14, fill: C.cream, stroke: C.ink, 'stroke-width': 3.5 });
  el('path', { d: starPath(722, 926, 4, 16, 5, 0), fill: C.coral });
  txt(S, 'пуховик', { x: 748, y: 922, 'font-family': SANS, 'font-weight': 600, 'font-size': 32, fill: C.ink });
  txt(S, 'уже в руках', { x: 748, y: 956, 'font-family': SANS, 'font-weight': 500, 'font-size': 28, fill: C.ink });
  // caption card bottom-centre
  const cy = 1360;
  el('rect', { x: 95 + 6, y: cy + 5, width: 800, height: 120, rx: 60, fill: C.coral });
  el('rect', { x: 95, y: cy, width: 800, height: 120, rx: 60, fill: C.paper, stroke: C.ink, 'stroke-width': 3 });
  for (const x of [128, 862]) el('path', { d: starPath(x, cy + 60, 4, 18, 5, 0), fill: C.ink });
  txt(S, 'В обед снимаешь всё, что надел утром.', { x: 495, y: cy + 73, 'font-family': SANS, 'font-weight': 500, 'font-size': 34, fill: C.ink, 'text-anchor': 'middle' });
}

// ======================================================================== 4. STICK-FIGURE EXPLAINER
function stick() {
  const C = { paper: '#F3F0EA', ink: '#24242C', mute: '#9C978C', tint: '#E2DDD2', acc: '#EB4A2A' };
  const F = "'Jost', sans-serif";
  el('rect', { width: W, height: H, fill: C.paper });
  const M = 80;
  txt(S, 'ПОГОДА · ОДИН ЧЕЛОВЕК · ОДИН ДЕНЬ', { x: M, y: 300, 'font-family': F, 'font-weight': 500, 'font-size': 21, fill: C.mute, 'letter-spacing': 3 });
  txt(S, '4 сезона', { x: M, y: 410, 'font-family': F, 'font-weight': 600, 'font-size': 112, fill: C.ink, 'letter-spacing': -2 });
  txt(S, 'за один день в Бишкеке', { x: M, y: 478, 'font-family': F, 'font-weight': 500, 'font-size': 44, fill: C.ink });
  // figure rig: hip, spine, two-bone limbs drawn as quadratic curves (joint = control point)
  const q = (a, j, b, k = 0.8) => { const cx = (j[0] - (a[0] + b[0]) / 4 * 2 * (1 - k) / 1) ; return `M${a[0]} ${a[1]} Q${j[0]} ${j[1]} ${b[0]} ${b[1]}`; };
  const fig = (x, gy, h, p, accent = false) => {
    const g = el('g', {});
    const sw = 8 * Math.sqrt(h / 380);
    const hip = [x + (p.lean || 0) * 0.3, gy - 0.47 * h], neck = [x + (p.lean || 0), gy - 0.82 * h + (p.bend || 0)];
    const sh = [neck[0], neck[1] + 0.04 * h];
    const line = { fill: 'none', stroke: C.ink, 'stroke-width': sw, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' };
    el('path', { d: `M${hip[0]} ${hip[1]} Q${(hip[0] + neck[0]) / 2 + (p.spine || 0)} ${(hip[1] + neck[1]) / 2} ${neck[0]} ${neck[1]}`, ...line }, g);
    for (const L of p.legs) el('path', { d: q(hip, [x + L[0], gy - 0.24 * h + L[1]], [x + L[2], gy]), ...line }, g);
    for (const A of p.arms) el('path', { d: q(sh, [sh[0] + A[0], sh[1] + A[1]], [sh[0] + A[2], sh[1] + A[3]]), ...line }, g);
    const hr = 0.09 * h, hc = [neck[0] + (p.headX || 0), neck[1] - hr * 0.98];
    el('circle', { cx: hc[0], cy: hc[1], r: hr, fill: accent ? C.acc : C.paper, stroke: accent ? C.acc : C.ink, 'stroke-width': sw }, g);
    return g;
  };
  const gy = 1180, hgt = 300, xs = [170, 375, 590, 805];
  // smog: the one pale filled shape, behind the 18:00 figure
  el('path', { d: 'M470 900 C460 840 540 820 570 850 C600 800 690 820 690 870 C740 870 750 940 700 950 L490 960 C440 960 440 905 470 900 Z', fill: C.tint });
  // ground line with nodes; the accent run fills from 07:00 to 13:00 (the change)
  el('line', { x1: M, y1: gy, x2: 900, y2: gy, stroke: C.tint, 'stroke-width': 6, 'stroke-linecap': 'round' });
  el('line', { x1: xs[0], y1: gy, x2: xs[1], y2: gy, stroke: C.acc, 'stroke-width': 6, 'stroke-linecap': 'round' });
  // poses: hug (cold) · arms wide (heat) · bent, hand to mouth (smog) · hug again
  const hug = { legs: [[-14, 0, -26], [14, 0, 26]], arms: [[40, 40, 30, 70], [-40, 40, -30, 70]], spine: -6, bend: 6 };
  const wide = { legs: [[-26, 0, -44], [26, 0, 44]], arms: [[60, -10, 110, -60], [-60, -10, -110, -60]] };
  const cough = { legs: [[-10, 0, -24], [20, 6, 30]], arms: [[44, 50, 16, -24], [-30, 50, -24, 110]], lean: 30, bend: 24, spine: 14, headX: 16 };
  const figs = [[hug, false], [wide, true], [cough, false], [hug, false]];
  figs.forEach(([p, a], i) => fig(xs[i], gy - 10, hgt, p, a));
  const labels = [['07:00', 'снег'], ['13:00', 'лето'], ['18:00', 'смог'], ['23:00', 'снег']];
  labels.forEach(([t, w], i) => {
    el('circle', { cx: xs[i], cy: gy, r: 12, fill: i <= 1 ? C.acc : C.paper, stroke: i <= 1 ? C.acc : C.mute, 'stroke-width': 4 });
    txt(S, t, { x: xs[i], y: gy + 56, 'font-family': F, 'font-weight': 500, 'font-size': 22, fill: C.mute, 'letter-spacing': 3, 'text-anchor': 'middle' });
    txt(S, w, { x: xs[i], y: gy + 100, 'font-family': F, 'font-weight': 600, 'font-size': 38, fill: i === 1 ? C.acc : C.ink, 'text-anchor': 'middle' });
  });
  // subtitle on the page: accent bar at the margin, no box
  el('rect', { x: M, y: 1440, width: 4, height: 54, fill: C.acc });
  txt(S, 'Утром — зима. В обед — лето.', { x: M + 24, y: 1480, 'font-family': F, 'font-weight': 500, 'font-size': 40, fill: C.ink });
}

(async () => {
  const sample = 'АБВабвёйщЫ ABCabc 0123456789';
  for (const f of ['900 40px Rubik', '800 40px Inter', '500 40px Inter', '400 40px Inter', '600 40px Jost', '500 40px Jost', '900 40px "Roboto Slab"', '40px Lobster']) await document.fonts.load(f, sample);
  ({ microgame, swiss, midcentury, stick })[style]();
  window.DUR = 1;
  window.render = () => {};
  window.READY = true;
})();
