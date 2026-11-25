// «Погода Бишкека за день» — Lemo-Opuscar Urban Sketch (pen & wash), 1080×1920, 30 fps.
// One sketchbook page, one street: drawn once in ink, then the weather arrives as watercolour.
// render(t) is pure: static layers are prebuilt once; per frame we only composite, draw figures, snow, text.
'use strict';
const W = 1080, H = 1920;
const cv = document.getElementById('c'), X = cv.getContext('2d');
const mk = () => { const c = document.createElement('canvas'); c.width = W; c.height = H; return c; };
function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const seg = (t, a, b) => clamp((t - a) / (b - a));
const lerp = (a, b, p) => a + (b - a) * p;
const ease = p => p * p * (3 - 2 * p);
function hash2(x, y) { let h = Math.imul(x, 374761393) + Math.imul(y, 668265263); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
function vnoise(x, y) { const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, s = t => t * t * (3 - 2 * t), u = s(xf), v = s(yf); return (hash2(xi, yi) * (1 - u) + hash2(xi + 1, yi) * u) * (1 - v) + (hash2(xi, yi + 1) * (1 - u) + hash2(xi + 1, yi + 1) * u) * v; }
const fbm = (x, y) => 0.6 * vnoise(x, y) + 0.3 * vnoise(x * 2.1, y * 2.1) + 0.1 * vnoise(x * 4.3, y * 4.3);

// ============================================================ timeline (jazz waltz, 144 BPM, 3/4 → bar = 1.25 s)
const BPM = 144, BEAT = 60 / BPM, BAR = 3 * BEAT;
const at = (bar, beat = 0) => (bar * 3 + beat) * BEAT;
const SC = [
  { id: 'h', t0: at(0), t1: at(4), voice: 'h0', note: null, sub: ['В Бишкеке прогноз погоды не нужен.', 'Просто бери с собой всё.'] },
  { id: 'snow', t0: at(4), t1: at(8), voice: 's1', note: 'Бишкек · 07:00 · снег', sub: ['7 утра. Снег.', 'Пуховик, шапка, шарф — поехали.'] },
  { id: 'sun', t0: at(8), t1: at(12), voice: 's2', note: 'Бишкек · 13:00 · солнце', sub: ['13:00. Лето.', 'Пуховик теперь носишь в руках.'] },
  { id: 'smog', t0: at(12), t1: at(16), voice: 's3', note: 'Бишкек · 18:00 · смог', sub: ['18:00. Смог.', 'Горы? Какие горы?'] },
  { id: 'night', t0: at(16), t1: at(20), voice: 's4', note: 'Бишкек · 23:00 · снова снег', sub: ['23:00. Снова зима.', 'А пуховик — на работе.'] },
  { id: 'end', t0: at(20), t1: at(25), voice: 'f0', note: 'Бишкек · а у тебя?', sub: ['А тебя погода сегодня как переобула?', 'Пиши в комменты ↓'] },
];
const DUR = SC[SC.length - 1].t1;
window.DUR = DUR;
const VOICE_AT = { h0: 0.3, s1: at(4, 1), s2: at(8, 1), s3: at(12, 1), s4: at(16, 1), f0: at(20, 1) };
const ARRIVE = 1.0;                 // seconds for a weather wash to arrive
const EV = [], TEXTS_ = [];
const ev = (t, type, o = {}) => EV.push({ t: +t.toFixed(4), type, ...o });

const INK = '#3a2a1f', PAPER = [243, 235, 218];

// ============================================================ ink strokes (prebuilt, drawable partially for draw-on)
let R = rng(21);
function mkStroke(pts, w = 2.2, { gap = true, over = true, smooth = true } = {}) {
  let P = pts.map(([x, y]) => [x + (R() - 0.5) * 2, y + (R() - 0.5) * 2]);
  if (over && P.length > 1) {
    const ext = (a, b, d) => { const dx = a[0] - b[0], dy = a[1] - b[1], l = Math.hypot(dx, dy) || 1; return [a[0] + dx / l * d, a[1] + dy / l * d]; };
    P = [ext(P[0], P[1], 3 + R() * 5), ...P, ext(P[P.length - 1], P[P.length - 2], 3 + R() * 5)];
  }
  let len = 0; const cum = [0]; for (let i = 1; i < P.length; i++) { len += Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]); cum.push(len); }
  const gapAt = gap && len > 160 && R() < 0.5 ? 0.3 + R() * 0.4 : -1;
  return { P, w, smooth, len, cum, gapAt };
}
function drawStroke(ctx, S, frac = 1, jitter = 0, seed = 0) {
  if (frac <= 0) return;
  const P = jitter ? S.P.map(([x, y], i) => [x + (hash2(i + seed * 31, seed) - 0.5) * jitter, y + (hash2(seed, i + seed * 17) - 0.5) * jitter]) : S.P;
  const lim = S.len * frac;
  ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = S.w; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.globalAlpha = 0.93;
  ctx.beginPath(); ctx.moveTo(P[0][0], P[0][1]);
  let gapped = false;
  for (let i = 1; i < P.length; i++) {
    if (S.cum[i] > lim) { const k = (lim - S.cum[i - 1]) / (S.cum[i] - S.cum[i - 1] || 1); ctx.lineTo(lerp(P[i - 1][0], P[i][0], k), lerp(P[i - 1][1], P[i][1], k)); break; }
    if (S.gapAt > 0 && !gapped && S.cum[i] / S.len > S.gapAt) { ctx.stroke(); ctx.beginPath(); ctx.moveTo(P[i][0], P[i][1]); gapped = true; continue; }
    if (S.smooth) ctx.quadraticCurveTo(P[i - 1][0], P[i - 1][1], (P[i - 1][0] + P[i][0]) / 2, (P[i - 1][1] + P[i][1]) / 2); else ctx.lineTo(P[i][0], P[i][1]);
  }
  if (frac >= 1) ctx.lineTo(P[P.length - 1][0], P[P.length - 1][1]);
  ctx.stroke(); ctx.restore();
}
// layers of strokes
const STREET = [], MOUNT = [];
let target = STREET;
const ink = (pts, w, o) => target.push(mkStroke(pts, w, o));
const poly = (pts, w = 2, o = {}) => ink(pts, w, { smooth: false, ...o });
const line = (x1, y1, x2, y2, w = 2) => { const n = Math.max(2, Math.round(Math.hypot(x2 - x1, y2 - y1) / 40)); poly(Array.from({ length: n + 1 }, (_, i) => [x1 + (x2 - x1) * i / n, y1 + (y2 - y1) * i / n]), w); };

// ============================================================ washes
function rough(pts, j = 6, r = R) {
  const out = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length]; const n = Math.max(1, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / 18));
    for (let k = 0; k < n; k++) { const t = k / n; out.push([a[0] + (b[0] - a[0]) * t + (r() - 0.5) * j, a[1] + (b[1] - a[1]) * t + (r() - 0.5) * j]); }
  }
  return out;
}
function washOn(ctx, pts, col, a = 0.5, { off = [3, 2], j = 7, r = R } = {}) {
  const P = rough(pts, j, r);
  ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = a; ctx.fillStyle = col;
  ctx.beginPath(); P.forEach(([x, y], i) => i ? ctx.lineTo(x + off[0], y + off[1]) : ctx.moveTo(x + off[0], y + off[1])); ctx.closePath(); ctx.fill(); ctx.restore();
}
const blobPts = (cx, cy, rx, ry, n = 22, r = R) => Array.from({ length: n }, (_, i) => { const a = i / n * Math.PI * 2, k = 0.82 + r() * 0.3; return [cx + rx * k * Math.cos(a), cy + ry * k * Math.sin(a)]; });
const rect = (x, y, w, h) => [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];

// ------------------------------------------------------------ the street (ink, built once, in drawing order)
const ridge = []; for (let x = 40; x <= 1040; x += 20) ridge.push([x, 640 - 95 * Math.abs(Math.sin(x * 0.0065 + 0.3)) - 35 * Math.sin(x * 0.019)]);
const snowLine = ridge.map(([x, y]) => [x, y + 28 + 18 * Math.sin(x * 0.05)]);
const trees = [[640, 760, 150, 130], [860, 720, 180, 160], [1000, 780, 120, 140]];
const windows = [];
function buildInk() {
  target = MOUNT;
  ink(ridge.slice(0, 13), 1.4); ink(ridge.slice(15, 26), 1.4);
  for (let i = 3; i < 26; i += 6) ink([snowLine[i], [snowLine[i][0] + 10, snowLine[i][1] + 14]], 1.2, { over: false, gap: false });
  target = STREET;
  // house
  poly([[40, 700], [430, 700], [500, 730]], 2); poly([[430, 700], [430, 1185]], 2); poly([[500, 730], [500, 1185]], 1.8);
  const r = rng(7);
  for (let row = 0; row < 6; row++) for (let c = 0; c < 4; c++) {
    if (r() < 0.3) continue;
    const x = 70 + c * 92, y = 730 + row * 72; windows.push([x, y]);
    if (r() < 0.5) poly([[x, y], [x + 46, y], [x + 46, y + 44], [x, y + 44], [x, y + 2]], 1.5, { gap: false });
    else { poly([[x, y + 44], [x + 46, y + 44]], 1.5); poly([[x + 4, y + 8], [x + 4, y + 40]], 1.2); }
    if (c === 3 && r() < 0.7) { poly([[x - 10, y + 54], [x + 58, y + 54]], 1.6); poly([[x - 10, y + 54], [x - 10, y + 66]], 1.2); }
  }
  // trees: scalloped outline fragments, trunks to the shelter roof
  trees.forEach(([cx, cy, rx, ry]) => {
    const sc = []; for (let i = 0; i <= 18; i++) { const a = Math.PI * (1.05 + i / 18 * 0.95); sc.push([cx + rx * Math.cos(a) * (0.95 + 0.08 * Math.sin(i * 2.7)), cy + ry * Math.sin(a) * (0.95 + 0.08 * Math.sin(i * 2.7))]); }
    ink(sc.slice(0, 10), 1.6); ink(sc.slice(11), 1.6);
    line(cx - 8, cy + ry * 0.55, cx - 12, 868, 2.4); line(cx + 10, cy + ry * 0.55, cx + 7, 868, 1.8);
  });
  // bus stop + lamp post
  poly([[598, 880], [936, 868]], 2.2); poly([[600, 912], [936, 900]], 1.8);
  line(615, 912, 615, 1185, 2); line(922, 900, 922, 1185, 2);
  poly([[650, 1100], [880, 1098]], 2); line(665, 1100, 665, 1140, 1.6); line(865, 1098, 865, 1140, 1.6);
  poly([[630, 922], [700, 922], [700, 960], [630, 960], [630, 924]], 1.4, { gap: false });
  line(560, 1185, 560, 820, 2.2); poly([[560, 822], [590, 812], [604, 824]], 2, { gap: false });
  // sidewalk
  ink([[40, 1186], [1040, 1182]], 1.8); ink([[40, 1262], [520, 1266]], 1.4); ink([[600, 1266], [1040, 1262]], 1.4);
}

// ------------------------------------------------------------ washes per weather
function buildWash(kind) {
  const c = mk(), g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, W, H);
  const r = rng({ snow: 31, sun: 32, smog: 33, night: 34 }[kind]);
  const w = (pts, col, a, o = {}) => washOn(g, pts, col, a, { r, ...o });
  const pal = {
    snow: { sky: '#b9c3d1', mount: '#a7afc6', house: '#cdb796', houseSh: '#a99fa6', leaf: '#a9b796', leaf2: '#8f9f86', stop: '#8b93a6', walk: '#c9cfdc' },
    sun: { sky: '#9fbcd6', mount: '#9aa3c4', house: '#d8b98a', houseSh: '#b7a08e', leaf: '#c3c96f', leaf2: '#7fa04a', stop: '#8b93a6', walk: '#d8c6a0' },
    smog: { sky: '#c9b98d', mount: '#c4b48e', house: '#c9ab80', houseSh: '#a39486', leaf: '#a9ab6e', leaf2: '#7f8a52', stop: '#8b8a86', walk: '#c8b590' },
    night: { sky: '#4f5585', mount: '#5d6390', house: '#8d7f8e', houseSh: '#5f5876', leaf: '#5d7468', leaf2: '#3f5550', stop: '#4c5170', walk: '#7d7f9e' },
  }[kind];
  // sky
  for (let k = 0; k < 3; k++) w(rect(40, 470 + k * 60, 1000, 230 - k * 60), pal.sky, kind === 'night' ? 0.55 : 0.24, { j: 16 });
  if (kind === 'sun') { for (let k = 0; k < 14; k++) { const a = k / 14 * Math.PI * 2; w(blobPts(860 + 92 * Math.cos(a), 480 + 92 * Math.sin(a), 34, 34, 10, r), '#f0c75e', 0.3); } }
  if (kind === 'smog') { w(blobPts(860, 520, 60, 60, 16, r), '#d9874e', 0.55); }
  if (kind === 'night') { w(blobPts(870, 470, 36, 36, 14, r), '#f3e7b0', 0.2); }
  // mountains: haze (smog nearly erases them; snow caps are paper)
  const ma = { snow: 0.45, sun: 0.5, smog: 0.06, night: 0.45 }[kind];
  w([...snowLine, [1040, 700], [40, 700]], pal.mount, ma); w([...snowLine.map(([x, y]) => [x, y + 30]), [1040, 700], [40, 700]], pal.mount, ma * 0.5);
  // trees (in the snow: white dabs on top of the crowns)
  trees.forEach(([cx, cy, rx, ry]) => {
    w(blobPts(cx, cy, rx, ry, 22, r), pal.leaf, 0.55, { j: 14 });
    w(blobPts(cx + rx * 0.25, cy + ry * 0.3, rx * 0.65, ry * 0.55, 22, r), pal.leaf2, 0.55, { j: 12 });
    for (let k = 0; k < 40; k++) { const a = r() * Math.PI * 2, d = r(); w(blobPts(cx + Math.cos(a) * rx * d, cy + Math.sin(a) * ry * d, 9, 7, 7, r), r() < 0.5 ? pal.leaf2 : pal.leaf, 0.6, { j: 3 }); }
    if (kind === 'snow' || kind === 'night') for (let k = 0; k < 26; k++) { const a = Math.PI * (1.1 + r() * 0.8), d = 0.7 + r() * 0.3; g.save(); g.fillStyle = '#fff'; g.beginPath(); rough(blobPts(cx + Math.cos(a) * rx * d, cy + Math.sin(a) * ry * d, 16, 9, 8, r), 3, r).forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.fill(); g.restore(); }
  });
  // house
  w(rect(40, 700, 390, 485), pal.house, 0.55, { j: 4 }); w([[430, 700], [500, 730], [500, 1185], [430, 1185]], pal.houseSh, 0.6, { j: 4 });
  windows.forEach(([x, y]) => { if (kind === 'night') { if (hash2(x, y) < 0.55) { g.save(); g.fillStyle = '#fff'; g.fillRect(x + 1, y + 1, 44, 42); g.restore(); w(rect(x + 3, y + 3, 40, 38), '#f2c66a', 0.75, { j: 3 }); } else w(rect(x + 2, y + 2, 42, 40), '#2f3352', 0.45, { j: 4 }); } else if (hash2(x, y) < 0.55) w(rect(x + 2, y + 2, 42, 40), '#8f9fba', 0.35, { j: 4 }); });
  if (kind === 'snow' || kind === 'night') { g.save(); g.fillStyle = '#fff'; g.beginPath(); rough([[36, 690], [434, 690], [504, 720], [504, 736], [430, 712], [36, 712]], 4, r).forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.fill(); g.restore(); }
  // bus stop + lamp
  w([[600, 880], [935, 868], [935, 900], [600, 912]], pal.stop, 0.6); w(rect(612, 912, 312, 190), kind === 'night' ? '#6a6f93' : '#bcd0dc', 0.25, { j: 10 });
  if (kind === 'night') { w(blobPts(590, 1060, 120, 160, 20, r), '#f2d98a', 0.0); g.save(); const gr = g.createRadialGradient(592, 830, 10, 592, 1000, 260); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.beginPath(); g.moveTo(592, 826); g.lineTo(420, 1300); g.lineTo(780, 1300); g.closePath(); g.fill(); g.restore(); w([[592, 830], [470, 1250], [720, 1250]], '#f2d98a', 0.35, { j: 20 }); }
  // sidewalk (snow: paper with blue shadow)
  w(rect(40, 1185, 1000, 140), pal.walk, kind === 'snow' ? 0.3 : 0.45, { j: 10 });
  // smog: a yellow-grey haze over everything above the street, in drifting bands
  if (kind === 'smog') for (let k = 0; k < 5; k++) w(rect(40, 470 + k * 120, 1000, 150), '#cbb88c', 0.28, { j: 26 });
  // night: one indigo glaze over the whole page area
  if (kind === 'night') w(rect(40, 400, 1000, 930), '#6b6fa0', 0.35, { j: 18 });
  // shadows on the pavement
  w(blobPts(420, 1292, 120, 16, 22, r), '#8f86a8', 0.45);
  if (kind === 'sun') w(blobPts(800, 1200, 85, 12, 22, r), '#8f86a8', 0.4);
  return c;
}

// ------------------------------------------------------------ composite: paper × wash (pooled edges, granulation) + ink
const bx0 = 40, by0 = 400, bx1 = 1040, by1 = 1330;
let PAPERC, EDGE;
function buildPaper() {
  PAPERC = mk(); const g = PAPERC.getContext('2d'); const im = g.createImageData(W, H), o = im.data;
  EDGE = new Float32Array(W * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = (y * W + x) * 4;
    const mot = 1 + (fbm(x * 0.004, y * 0.004) - 0.5) * 0.06, tooth = 0.96 + 0.06 * (vnoise(x * 0.6, y * 0.6) - 0.5) * 2;
    o[i] = PAPER[0] * mot * tooth; o[i + 1] = PAPER[1] * mot * tooth; o[i + 2] = PAPER[2] * mot * tooth; o[i + 3] = 255;
    const d = Math.min(x - bx0, bx1 - x, y - by0, by1 - y);
    EDGE[y * W + x] = clamp((d + 40 * (fbm(x * 0.03, y * 0.03) - 0.5) + 10) / 22);
  }
  g.putImageData(im, 0, 0);
}
function composite(washC, strokes) {
  const c = mk(), g = c.getContext('2d');
  const wd = washC.getContext('2d').getImageData(0, 0, W, H).data;
  const bl = mk(), B = bl.getContext('2d'); B.filter = 'blur(6px)'; B.drawImage(washC, 0, 0); const bd = B.getImageData(0, 0, W, H).data;
  const pd = PAPERC.getContext('2d').getImageData(0, 0, W, H).data;
  const im = g.createImageData(W, H), o = im.data;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = (y * W + x) * 4, m = EDGE[y * W + x];
    let r = pd[i], gg = pd[i + 1], b = pd[i + 2];
    if (m > 0) {
      const gran = 0.82 + 0.36 * fbm(x * 0.15, y * 0.15);
      const f = c2 => { const pig = 1 - wd[i + c2] / 255, pigB = 1 - bd[i + c2] / 255; return clamp(pig * gran * (1 + 0.7 * clamp((pig - pigB) * 2.2))) * m; };
      r *= 1 - f(0); gg *= 1 - f(1); b *= 1 - f(2);
    }
    o[i] = r; o[i + 1] = gg; o[i + 2] = b; o[i + 3] = 255;
  }
  g.putImageData(im, 0, 0);
  strokes.forEach(S => drawStroke(g, S));
  return c;
}

// ============================================================ figures (boil at 12 fps; reserved paper behind them)
function heroSil(dx, dy, outfit) {
  const L = [];
  const e = (cx, cy, rx, ry) => Array.from({ length: 24 }, (_, i) => [cx + rx * Math.cos(i / 24 * Math.PI * 2), cy + ry * Math.sin(i / 24 * Math.PI * 2)]);
  L.push(e(394, 790, 44, 52), [[350, 790], [356, 730], [394, 716], [432, 730], [440, 790]]);
  L.push([[330, 858], [456, 856], [480, 940], [450, 1050], [340, 1050], [306, 940]]);
  L.push([[352, 1040], [442, 1040], [470, 1160], [490, 1300], [440, 1300], [420, 1170], [385, 1170], [355, 1300], [300, 1300], [335, 1160]]);
  if (outfit === 'sun') L.push([[454, 930], [566, 968], [590, 1160], [478, 1130]]);
  if (outfit === 'snow') L.push([[300, 850], [490, 850], [500, 1100], [290, 1100]]);
  return L.map(p => p.map(([x, y]) => [x + dx, y + dy]));
}
function drawHero(g, t, outfit, dx = 0, dy = 0, walk = 0, shiver = 0) {
  const seed = Math.floor(t * 12);
  const bR = rng(seed * 7 + 3);
  const jit = 1.4;
  const J = ([x, y]) => [x + dx + (bR() - 0.5) * jit + (shiver ? Math.sin(t * 50) * shiver : 0), y + dy + (bR() - 0.5) * jit];
  const S = (pts, w = 2, o = {}) => { const s = mkStrokeFixed(pts.map(J), w, o, seed); drawStroke(g, s); };
  const Wsh = (pts, col, a) => washOn(g, pts.map(J), col, a, { r: rng(seed * 13 + pts.length), j: 5 });
  // reserve: the paper itself shows through the silhouette
  g.save(); g.beginPath(); heroSil(dx, dy, outfit).forEach(p => { p.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); }); g.clip(); g.drawImage(PAPERC, 0, 0); g.restore();
  const skin = '#e9b896', hair = '#4a3428';
  const sw = Math.sin(walk) * 22;                       // leg swing
  // legs (jeans)
  const jeans = '#5f7fa6';
  const fL = [[360, 1040], [402, 1040], [380 - sw * 0.3, 1160], [345 - sw, 1272], [322 - sw, 1268], [340 - sw * 0.3, 1158]];
  const fR = [[400, 1040], [440, 1040], [462 + sw * 0.3, 1158], [478 + sw, 1278], [454 + sw, 1282], [430 + sw * 0.3, 1162]];
  Wsh(fL, jeans, 0.62); Wsh(fR, jeans, 0.62);
  S([[360, 1040], [342 - sw * 0.3, 1158], [320 - sw, 1268]], 2.2); S([[402, 1046], [382 - sw * 0.3, 1160], [347 - sw, 1272]], 2);
  S([[440, 1040], [464 + sw * 0.3, 1158], [480 + sw, 1278]], 2.2); S([[404, 1050], [430 + sw * 0.3, 1162], [454 + sw, 1282]], 2);
  const boots = outfit === 'snow' || outfit === 'night';
  if (boots) { Wsh(rect(300 - sw, 1256, 60, 34), '#3a2e2a', 0.7); Wsh(rect(446 + sw, 1262, 60, 34), '#3a2e2a', 0.7); }
  S([[312 - sw, 1268], [356 - sw, 1270], [352 - sw, 1290], [304 - sw, 1288], [312 - sw, 1268]], 2, { gap: false, smooth: false });
  S([[450 + sw, 1280], [500 + sw, 1284], [502 + sw, 1300], [446 + sw, 1298], [450 + sw, 1280]], 2, { gap: false, smooth: false });
  // torso + arms by outfit
  if (outfit === 'snow') {
    const coat = [[322, 862], [466, 858], [492, 960], [486, 1092], [312, 1096], [302, 960]];
    Wsh(coat, '#e08a3c', 0.7); Wsh([[400, 862], [466, 858], [492, 960], [486, 1092], [404, 1094]], '#a8584a', 0.25);
    S([...coat, coat[0]], 2.2, { gap: false });
    for (let k = 1; k < 5; k++) S([[306 + k, 860 + k * 46], [488 - k, 858 + k * 46]], 1.3, { over: false });
    S([[320, 900], [300, 1050]], 1.8); S([[468, 900], [488, 1050]], 1.8);
    Wsh([[350, 842], [440, 842], [442, 874], [350, 874]], '#c24a3c', 0.75); Wsh([[420, 868], [444, 868], [452, 960], [430, 962]], '#c24a3c', 0.7);
    S([[350, 842], [440, 842]], 1.6); S([[420, 874], [430, 962], [452, 960], [444, 870]], 1.6, { gap: false });
  } else if (outfit === 'sun' || outfit === 'night') {
    const tee = [[338, 864], [448, 860], [474, 930], [452, 942], [440, 905], [442, 1042], [352, 1046], [348, 905], [332, 940], [312, 928]];
    Wsh(tee, outfit === 'night' ? '#b4576a' : '#d86a4f', 0.6); Wsh([[400, 870], [448, 864], [442, 1042], [404, 1044]], '#9e4a5a', 0.25);
    S([[338, 864], [312, 928], [332, 940], [348, 905], [352, 1046]], 2.1); S([[448, 860], [474, 930], [452, 942], [440, 905], [442, 1042]], 2.1);
    S([[352, 1046], [442, 1042]], 1.8, { smooth: false });
    if (outfit === 'sun') {
      Wsh([[318, 935], [334, 940], [314, 1040], [300, 1046], [296, 1036]], skin, 0.55); S([[318, 935], [302, 1000], [296, 1040]], 2); S([[334, 942], [318, 1004], [306, 1046]], 1.8);
      Wsh([[454, 940], [470, 934], [478, 978], [540, 984], [540, 1000], [466, 996]], skin, 0.55); S([[470, 934], [480, 976], [542, 984]], 2); S([[454, 942], [464, 994], [538, 1000]], 1.8);
      const jk = [[478, 968], [560, 974], [566, 1010], [548, 1128], [488, 1120], [472, 1010]];
      Wsh(jk, '#e08a3c', 0.65); S([...jk, jk[0]], 2.1, { gap: false });
      for (let k = 0; k < 4; k++) S([[476 + k * 2, 1004 + k * 30], [562 - k * 3, 1010 + k * 30]], 1.3, { over: false });
      Wsh([[540, 990], [566, 996], [584, 1150], [560, 1156]], '#e08a3c', 0.6); S([[540, 990], [560, 1156], [584, 1150], [566, 996]], 1.8, { gap: false });
    } else {
      // arms hugging the body: crossed in front
      Wsh([[318, 935], [334, 940], [420, 990], [470, 960], [480, 972], [420, 1010], [326, 960]], skin, 0.55);
      Wsh([[470, 934], [456, 942], [380, 990], [330, 962], [322, 976], [384, 1010], [474, 956]], skin, 0.55);
      S([[318, 935], [330, 965], [420, 1006], [480, 972]], 2); S([[470, 934], [470, 958], [384, 1008], [322, 976]], 2);
      for (const s of [-1, 1]) for (let k = 0; k < 3; k++) S([[394 + s * (110 + k * 14), 880 + k * 40], [394 + s * (124 + k * 14), 896 + k * 40]], 1.6, { over: false, gap: false });
    }
  } else if (outfit === 'smog') {
    const hood = [[328, 862], [460, 858], [480, 950], [472, 1050], [318, 1052], [308, 950]];
    Wsh(hood, '#8f9097', 0.6); S([...hood, hood[0]], 2.1, { gap: false });
    S([[320, 900], [306, 1040]], 1.8); S([[466, 900], [478, 1040]], 1.8);
    S([[360, 1000], [430, 1000]], 1.4, { smooth: false });
  }
  // neck + head; hair as one mass; face blank except one mark per outfit
  Wsh([[384, 834], [404, 834], [406, 862], [384, 862]], skin, 0.5);
  Wsh(blobPts(394, 790, 38, 46, 18, rng(5)), skin, 0.5);
  if (outfit === 'snow') { Wsh([[352, 784], [356, 744], [394, 724], [434, 744], [438, 784]], '#3f7fd9', 0.75); S([[352, 784], [356, 744], [394, 724], [434, 744], [438, 784], [352, 784]], 1.9, { gap: false }); Wsh(blobPts(394, 716, 13, 13, 10, rng(6)), '#f3f0e6', 0.4); }
  else Wsh([[358, 780], [362, 752], [390, 740], [424, 748], [434, 772], [428, 790], [414, 768], [380, 770], [366, 800]], hair, 0.7);
  S(Array.from({ length: 20 }, (_, i) => { const a = -Math.PI * 0.95 + i / 19 * Math.PI * 1.9; return [394 + 38 * Math.cos(a), 792 + 46 * Math.sin(a)]; }), 2.1);
  S([[430, 794], [438, 806], [430, 810]], 1.6, { over: false, gap: false });
  if (outfit === 'sun') S([[402, 788], [436, 786]], 3.2, { over: false, gap: false });
  if (outfit === 'smog') { Wsh([[372, 802], [432, 800], [428, 830], [376, 830]], '#ffffff', 0.0); S([[372, 802], [432, 800], [428, 830], [376, 830], [372, 802]], 1.6, { gap: false, smooth: false }); S([[372, 806], [356, 798]], 1.2); S([[432, 804], [436, 792]], 1.2); }
}
// a stroke whose wobble is fixed by a seed (figures boil on twos, the page doesn't)
function mkStrokeFixed(pts, w, o, seed) { const keep = R; R = rng(seed * 101 + pts.length * 7 + Math.round(pts[0][0])); const s = mkStroke(pts, w, o); R = keep; return s; }
function drawCoatMan(g, t) {
  const seed = Math.floor(t * 12), bR = rng(seed * 11 + 5);
  const J = ([x, y]) => [x + (bR() - 0.5) * 1.4, y + (bR() - 0.5) * 1.4];
  const S = (pts, w = 2, o = {}) => drawStroke(g, mkStrokeFixed(pts.map(J), w, o, seed + 50));
  const Wsh = (pts, col, a) => washOn(g, pts.map(J), col, a, { r: rng(seed * 17 + pts.length), j: 5 });
  g.save(); g.beginPath();
  [[[748, 750], [832, 750], [860, 1106], [722, 1106]], [[750, 1100], [846, 1100], [846, 1198], [750, 1198]]].forEach(p => { p.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); });
  g.clip(); g.drawImage(PAPERC, 0, 0); g.restore();
  Wsh([[748, 852], [832, 852], [856, 1104], [726, 1104]], '#4f6b6a', 0.7);
  S([[748, 852], [726, 1104], [856, 1104], [832, 852]], 2.2, { gap: false, smooth: false }); S([[790, 870], [792, 1104]], 1.4);
  for (const x of [762, 812]) { S([[x, 1104], [x - 2, 1180]], 2); S([[x + 20, 1104], [x + 22, 1180]], 2); Wsh(rect(x - 8, 1170, 38, 24), '#3a2e2a', 0.7); }
  Wsh(blobPts(790, 812, 30, 36, 16, rng(9)), '#e9b896', 0.5);
  S(Array.from({ length: 16 }, (_, i) => { const a = -Math.PI * 0.2 + i / 15 * Math.PI * 1.2; return [790 + 30 * Math.cos(a), 814 + 36 * Math.sin(a)]; }), 1.9);
  Wsh([[756, 800], [760, 768], [790, 752], [820, 768], [824, 800]], '#b8483e', 0.7); S([[756, 800], [760, 768], [790, 752], [820, 768], [824, 800], [756, 800]], 1.9, { gap: false });
  Wsh([[754, 842], [828, 842], [826, 866], [756, 866]], '#e2b04a', 0.7); S([[754, 842], [828, 842]], 1.6);
  S([[762, 812], [752, 818], [760, 822]], 1.5, { over: false, gap: false });
  const drip = (t * 1.5) % 1;
  for (const [x, y] of [[740, 790], [842, 800]]) { Wsh(blobPts(x, y + drip * 30, 5, 8, 8, rng(3)), '#9fbcd6', 0.7); S([[x, y - 9 + drip * 30], [x - 5, y + 2 + drip * 30], [x, y + 8 + drip * 30], [x + 5, y + 2 + drip * 30], [x, y - 9 + drip * 30]], 1.2, { over: false, gap: false }); }
}

// ============================================================ weather effects per frame
function snowfall(g, t, n = 90) {
  for (let i = 0; i < n; i++) {
    const x0 = hash2(i, 7) * 1000 + 40, sp = 40 + hash2(i, 9) * 50;
    const y = 400 + ((hash2(i, 3) * 930 + t * sp) % 930), x = x0 + Math.sin(t * 1.3 + i) * 14;
    const r = 4 + hash2(i, 5) * 5;
    g.save(); g.fillStyle = 'rgba(252,249,242,0.95)'; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
    g.globalCompositeOperation = 'multiply'; g.fillStyle = 'rgba(160,180,210,0.35)'; g.beginPath(); g.arc(x + 1.5, y + 1.5, r, 0.2, 2.6); g.fill(); g.restore();
  }
}
function heat(g, t) {
  const ph = Math.floor(t * 12) / 12;
  for (const [x, y, len] of [[330, 720, 60], [455, 712, 55], [570, 1250, 70], [250, 1255, 60]]) {
    drawStroke(g, mkStrokeFixed(Array.from({ length: 14 }, (_, i) => [x + Math.sin(i * 1.1 + ph * 6) * 6, y - i * len / 13]), 1.5, { gap: false }, Math.floor(t * 12) + x));
  }
}
function wind(g, t, t0) {
  // ink curls draw on and erase from the tail
  for (let k = 0; k < 3; k++) {
    const s = t0 + k * 0.7, p = ((t - s) % 2.1) / 2.1; if (t < s) continue;
    const cx = 120 + k * 300, cy = 520 + k * 60;
    const pts = Array.from({ length: 24 }, (_, i) => { const a = i / 23 * Math.PI * 1.6; return [cx + i * 16, cy + Math.sin(a) * 20 - (i > 18 ? (i - 18) * 6 : 0)]; });
    const S = mkStrokeFixed(pts, 1.6, { gap: false, over: false }, k + 900);
    const head = clamp(p * 1.6), tail = clamp(p * 1.6 - 0.6);
    g.save(); g.beginPath(); g.rect(cx + tail * 380, 0, (head - tail) * 380 + 10, H); g.clip(); drawStroke(g, S, head); g.restore();
  }
}

// ============================================================ handwriting
function hand(g, s, x, y, size, w = 600, col = INK, rot = 0, frac = 1) {
  g.save(); g.translate(x, y); g.rotate(rot); g.fillStyle = col; g.font = `${w} ${size}px Caveat`;
  if (frac < 1) { const full = g.measureText(s).width; g.beginPath(); g.rect(-4, -size, full * frac + 4, size * 1.4); g.clip(); }
  g.fillText(s, 0, 0); g.restore();
}
function regText(id, text, t0, t1, box) { TEXTS_.push({ id, text, t0, t1, box }); }

// ============================================================ build
let LAYERS = {};
let ARR;     // colour arrival field (0..1 per pixel)
function build() {
  buildInk(); buildPaper();
  const all = [...MOUNT, ...STREET];
  for (const k of ['snow', 'sun', 'smog', 'night']) LAYERS[k] = composite(buildWash(k), k === 'smog' ? STREET : all);
  ARR = new Float32Array(W * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) ARR[y * W + x] = clamp(0.55 * fbm(x * 0.006, y * 0.006) + 0.45 * (1 - y / H) * 0.0 + 0.45 * (x / W));
  // order the street strokes for the draw-on: top to bottom, left to right
  DRAW_ORDER = all.slice().sort((a, b) => (a.P[0][1] - b.P[0][1]) * 0.6 + (a.P[0][0] - b.P[0][0]) * 0.4);
  // events
  ev(0.15, 'pen', { dur: 2.6 });
  SC.forEach((s, i) => {
    ev(VOICE_AT[s.voice], 'voice', { id: s.voice });
    ev(VOICE_AT[s.voice] - 0.1, 'write', { dur: 0.9 });
    if (i > 0 && i < 5) ev(s.t0, 'wash', { scene: s.id });
    if (i > 0) ev(s.t0, 'scene', { scene: s.id });
  });
  ev(at(2, 1), 'wash', { scene: 'snow' });
  for (let b = 0; b < 12; b++) ev(at(8) + b * BEAT, 'step');
  // texts
  const tTitle = 0.2;
  regText('title', 'Погода за день', tTitle, DUR, [70, 230, 640, 330]);
  SC.forEach((s, i) => {
    if (s.note) regText(`note${i}`, s.note, s.t0 + 0.2, s.t1, [74, 330, 760, 385]);
    const t0 = VOICE_AT[s.voice] - 0.1;
    regText(`sub${i}a`, s.sub[0], t0, s.t1, [74, 1380, 1000, 1445]);
    regText(`sub${i}b`, s.sub[1], t0, s.t1, [74, 1455, 1000, 1515]);
  });
}
let DRAW_ORDER = [];
const sceneAt = t => SC.find(s => t >= s.t0 && t < s.t1) || SC[SC.length - 1];
const WEATHER = { h: 'snow', snow: 'snow', sun: 'sun', smog: 'smog', night: 'night', end: 'night' };

// ============================================================ render
const page = mk(), P = page.getContext('2d');
const mixBuf = mk(), M = mixBuf.getContext('2d');
let cacheA = {}, cacheData = {};
const dataOf = k => cacheData[k] || (cacheData[k] = LAYERS[k].getContext('2d').getImageData(0, 0, W, H).data);
function arrive(fromKey, toKey, p) {
  // colour arrival field: each pixel switches when the front passes it; a darker wet band just behind the front
  const a = fromKey ? dataOf(fromKey) : PAPERC.getContext('2d').getImageData(0, 0, W, H).data, b = dataOf(toKey);
  const im = M.createImageData(W, H), o = im.data;
  const front = p * 1.25;
  for (let i = 0, n = W * H; i < n; i++) {
    const f = ARR[i], d = front - f, j = i * 4;
    if (d <= 0) { o[j] = a[j]; o[j + 1] = a[j + 1]; o[j + 2] = a[j + 2]; }
    else { const wet = d < 0.06 && EDGE[i] > 0.5 ? 0.9 : 1; const k = clamp(d / 0.04); o[j] = (a[j] * (1 - k) + b[j] * k) * wet; o[j + 1] = (a[j + 1] * (1 - k) + b[j + 1] * k) * wet; o[j + 2] = (a[j + 2] * (1 - k) + b[j + 2] * k) * wet; }
    o[j + 3] = 255;
  }
  M.putImageData(im, 0, 0); return mixBuf;
}
window.render = (t) => {
  const s = sceneAt(t), idx = SC.indexOf(s);
  // ---- background
  if (s.id === 'h') {
    // ink draws itself on blank paper, then the morning's washes arrive
    const tw = at(2, 1);
    if (t < tw) {
      P.drawImage(PAPERC, 0, 0);
      const p = clamp((t - 0.15) / 2.6), n = DRAW_ORDER.length, k = p * n;
      for (let i = 0; i < n; i++) if (i < k) drawStroke(P, DRAW_ORDER[i], clamp(k - i));
    } else {
      const p = seg(t, tw, tw + 1.4);
      if (p < 1) { const blank = mk(); const bg = blank.getContext('2d'); bg.drawImage(PAPERC, 0, 0); DRAW_ORDER.forEach(S => drawStroke(bg, S)); cacheData.__ink = cacheData.__ink || bg.getImageData(0, 0, W, H).data; LAYERS.__ink = blank; P.drawImage(arrive('__ink', 'snow', p), 0, 0); }
      else P.drawImage(LAYERS.snow, 0, 0);
    }
  } else {
    const prev = WEATHER[SC[idx - 1].id], cur = WEATHER[s.id];
    const p = seg(t, s.t0, s.t0 + ARRIVE);
    if (prev !== cur && p < 1) P.drawImage(arrive(prev, cur, ease(p)), 0, 0); else P.drawImage(LAYERS[cur], 0, 0);
  }
  // ---- weather in motion + figures
  const wk = WEATHER[s.id];
  if ((wk === 'snow' && s.id !== 'h') || wk === 'night' || (s.id === 'h' && t > at(3))) snowfall(P, t, wk === 'night' ? 60 : 90);
  if (wk === 'sun') heat(P, t);
  if (wk === 'smog') wind(P, t, s.t0 + 0.6);
  if (s.id !== 'h') {
    const outfit = { snow: 'snow', sun: 'sun', smog: 'smog', night: 'night', end: 'night' }[s.id];
    let dx = 0, walk = 0;
    if (s.id === 'sun') { const p = seg(t, s.t0, s.t1); dx = lerp(-60, 40, p); walk = (t - s.t0) / BEAT * Math.PI; }
    const bloom = s.id === 'snow' ? seg(t, s.t0, s.t0 + 0.5) : 1;
    P.save();
    if (bloom < 1) { P.beginPath(); for (let a = 0; a <= 64; a++) { const A = a / 64 * Math.PI * 2, r = (40 + 520 * bloom) * (0.85 + 0.3 * vnoise(A * 3, t * 4)); P.lineTo(400 + r * Math.cos(A), 1000 + r * Math.sin(A)); } P.clip(); }
    drawHero(P, t, outfit, dx, 0, walk, outfit === 'night' ? 1.2 : 0);
    P.restore();
    if (s.id === 'sun') drawCoatMan(P, t);
    if (wk === 'night' || s.id === 'snow') snowfall(P, t + 0.37, 30);
  }
  // ---- handwriting on the page
  hand(P, 'Погода за день', 70, 312, 96, 700, INK, -0.02, clamp((t - 0.2) / 0.8));
  if (s.note) hand(P, s.note, 74, 372, 44, 500, '#6b5644', 0, clamp((t - s.t0 - 0.2) / 0.6));
  const ts = VOICE_AT[s.voice] - 0.1;
  hand(P, s.sub[0], 74, 1430, 64, 700, INK, -0.01, clamp((t - ts) / 0.45));
  hand(P, s.sub[1], 78, 1500, 52, 500, '#6b5644', -0.01, clamp((t - ts - 0.35) / 0.55));
  hand(P, 'bishkek.motion', 76, 1552, 34, 600, '#8a7660');
  // ---- camera: a slow push per moment (smooth every frame), the page moves as one
  const p = seg(t, s.t0, s.t1), sc = 1 + 0.035 * ease(p);
  X.fillStyle = '#F3EBDA'; X.fillRect(0, 0, W, H);
  X.save(); X.translate(495, 900); X.scale(sc, sc); X.translate(-495, -900); X.drawImage(page, 0, 0); X.restore();
};
window.TEXTS = (t) => TEXTS_.filter(x => t >= x.t0 && t < x.t1).map(x => ({ id: x.id, text: x.text, x0: x.box[0], y0: x.box[1], x1: x.box[2], y1: x.box[3] }));

(async () => {
  for (const w of [500, 600, 700]) await document.fonts.load(`${w} 40px Caveat`, 'АБВабвёй ABC 0123 ↓·');
  build();
  EV.sort((a, b) => a.t - b.t); window.EV = EV;
  window.render(0);
  window.READY = true;
})();
