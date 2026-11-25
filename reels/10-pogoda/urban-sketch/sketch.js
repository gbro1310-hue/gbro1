// «Погода Бишкека за день» — Urban Sketch (pen & wash) style frame, 13:00: summer arrives at lunch.
// Ink and wash are separate layers: sepia fineliner with wobble/overshoot/gaps, transparent washes offset from it,
// pigment pooling at dried edges, granulation into the paper tooth, a frayed page edge. Deterministic (seeded).
'use strict';
const W = 1080, H = 1920;
const cv = document.getElementById('c'), X = cv.getContext('2d');
const mk = () => { const c = document.createElement('canvas'); c.width = W; c.height = H; return c; };
function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
function hash2(x, y) { let h = Math.imul(x, 374761393) + Math.imul(y, 668265263); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
function vnoise(x, y) { const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, s = t => t * t * (3 - 2 * t), u = s(xf), v = s(yf); return (hash2(xi, yi) * (1 - u) + hash2(xi + 1, yi) * u) * (1 - v) + (hash2(xi, yi + 1) * (1 - u) + hash2(xi + 1, yi + 1) * u) * v; }
const fbm = (x, y) => 0.6 * vnoise(x, y) + 0.3 * vnoise(x * 2.1, y * 2.1) + 0.1 * vnoise(x * 4.3, y * 4.3);

(async () => {
for (const w of [500, 600, 700]) await document.fonts.load(`${w} 40px Caveat`, 'АБВабвёй ABC 0123');
const INK = '#3a2a1f';
const R = rng(21);
const inkC = mk(), I = inkC.getContext('2d');
const washC = mk(), Wc = washC.getContext('2d');
Wc.fillStyle = '#fff'; Wc.fillRect(0, 0, W, H);

// ---------------------------------------------------------------- ink: wobble, overshoot, a gap in long lines
function ink(pts, w = 2.2, { gap = true, over = true, smooth = true } = {}) {
  if (pts.length < 2) return;
  let P = pts.map(([x, y]) => [x + (R() - 0.5) * 2, y + (R() - 0.5) * 2]);
  if (over) {
    const ext = (a, b, d) => { const dx = a[0] - b[0], dy = a[1] - b[1], l = Math.hypot(dx, dy) || 1; return [a[0] + dx / l * d, a[1] + dy / l * d]; };
    P = [ext(P[0], P[1], 3 + R() * 5), ...P, ext(P[P.length - 1], P[P.length - 2], 3 + R() * 5)];
  }
  let len = 0; for (let i = 1; i < P.length; i++) len += Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]);
  const gapAt = gap && len > 160 && R() < 0.5 ? 0.3 + R() * 0.4 : -1;
  I.save(); I.strokeStyle = INK; I.lineWidth = w; I.lineCap = 'round'; I.lineJoin = 'round'; I.globalAlpha = 0.93;
  I.beginPath(); I.moveTo(P[0][0], P[0][1]);
  let acc = 0, gapping = false;
  for (let i = 1; i < P.length; i++) {
    const seg = Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]); acc += seg;
    const mx = (P[i - 1][0] + P[i][0]) / 2, my = (P[i - 1][1] + P[i][1]) / 2;
    if (gapAt > 0 && !gapping && acc / len > gapAt) { I.stroke(); I.beginPath(); gapping = true; I.moveTo(P[i][0], P[i][1]); continue; }
    if (smooth) I.quadraticCurveTo(P[i - 1][0], P[i - 1][1], mx, my); else I.lineTo(P[i][0], P[i][1]);
  }
  I.lineTo(P[P.length - 1][0], P[P.length - 1][1]); I.stroke(); I.restore();
}
const line = (x1, y1, x2, y2, w = 2) => { const n = Math.max(2, Math.round(Math.hypot(x2 - x1, y2 - y1) / 40)); ink(Array.from({ length: n + 1 }, (_, i) => [x1 + (x2 - x1) * i / n, y1 + (y2 - y1) * i / n]), w, { smooth: false }); };
const poly = (pts, w = 2, o = {}) => ink(pts, w, { smooth: false, ...o });
const wavy = (x, y, len, amp = 6, w = 1.6) => ink(Array.from({ length: 14 }, (_, i) => [x + Math.sin(i * 1.1) * amp, y - i * len / 13]), w, { gap: false });

// ---------------------------------------------------------------- wash: rough-edged, multiply, offset from the line
function rough(pts, j = 6) {
  const out = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length];
    const n = Math.max(1, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / 18));
    for (let k = 0; k < n; k++) { const t = k / n; out.push([a[0] + (b[0] - a[0]) * t + (R() - 0.5) * j, a[1] + (b[1] - a[1]) * t + (R() - 0.5) * j]); }
  }
  return out;
}
function wash(pts, col, a = 0.5, { off = [3, 2], j = 7 } = {}) {
  const P = rough(pts, j);
  Wc.save(); Wc.globalCompositeOperation = 'multiply'; Wc.globalAlpha = a; Wc.fillStyle = col;
  Wc.beginPath(); P.forEach(([x, y], i) => i ? Wc.lineTo(x + off[0], y + off[1]) : Wc.moveTo(x + off[0], y + off[1])); Wc.closePath(); Wc.fill(); Wc.restore();
}
const blobPts = (cx, cy, rx, ry, n = 22) => Array.from({ length: n }, (_, i) => { const a = i / n * Math.PI * 2, k = 0.82 + R() * 0.3; return [cx + rx * k * Math.cos(a), cy + ry * k * Math.sin(a)]; });
const rect = (x, y, w, h) => [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];

// ================================================================= the page
// sky: a few big soft washes, fading upward; the sun is a reserve with a warm halo around it
for (let k = 0; k < 3; k++) wash(rect(40, 470 + k * 60, 1000, 230 - k * 60), '#9fbcd6', 0.22, { j: 16 });
const sunX = 860, sunY = 480;
for (let k = 0; k < 14; k++) { const a = k / 14 * Math.PI * 2; wash(blobPts(sunX + 92 * Math.cos(a), sunY + 92 * Math.sin(a), 34, 34, 10), '#f0c75e', 0.3); }
ink(Array.from({ length: 30 }, (_, i) => [sunX + 52 * Math.cos(i / 28 * Math.PI * 2), sunY + 52 * Math.sin(i / 28 * Math.PI * 2)]), 1.8);

// Ala-Too: haze-violet ridge, snow caps left as paper, a broken ink outline
const ridge = []; for (let x = 40; x <= 1040; x += 20) ridge.push([x, 640 - 95 * Math.abs(Math.sin(x * 0.0065 + 0.3)) - 35 * Math.sin(x * 0.019)]);
const snow = ridge.map(([x, y]) => [x, y + 28 + 18 * Math.sin(x * 0.05)]);
wash([...snow, [1040, 700], [40, 700]], '#9aa3c4', 0.5);
wash([...snow.map(([x, y]) => [x, y + 30]), [1040, 700], [40, 700]], '#8a8fb8', 0.25);
ink(ridge.slice(0, 13), 1.4); ink(ridge.slice(15, 26), 1.4);
for (let i = 3; i < ridge.length - 3; i += 6) ink([snow[i], [snow[i][0] + 10, snow[i][1] + 14]], 1.2, { over: false, gap: false });

// trees (karagach): pale base, light and shadow masses, leaf dabs, scalloped outline fragments
const trees = [[640, 760, 150, 130], [860, 720, 180, 160], [1000, 780, 120, 140]];
trees.forEach(([cx, cy, rx, ry]) => {
  wash(blobPts(cx, cy, rx, ry), '#c3c96f', 0.55, { j: 14 });
  wash(blobPts(cx + rx * 0.25, cy + ry * 0.3, rx * 0.65, ry * 0.55), '#7fa04a', 0.55, { j: 12 });
  for (let k = 0; k < 40; k++) { const a = R() * Math.PI * 2, d = R(); wash(blobPts(cx + Math.cos(a) * rx * d, cy + Math.sin(a) * ry * d, 9, 7, 7), R() < 0.5 ? '#6e9440' : '#a9b85a', 0.6, { j: 3 }); }
  const sc = []; for (let i = 0; i <= 18; i++) { const a = Math.PI * (1.05 + i / 18 * 0.95); sc.push([cx + rx * Math.cos(a) * (0.95 + 0.08 * Math.sin(i * 2.7)), cy + ry * Math.sin(a) * (0.95 + 0.08 * Math.sin(i * 2.7))]); }
  ink(sc.slice(0, 10), 1.6); ink(sc.slice(11), 1.6);
  line(cx - 8, cy + ry * 0.55, cx - 12, 868, 2.4); line(cx + 10, cy + ry * 0.55, cx + 7, 868, 1.8);
  line(cx - 10, cy + ry * 0.75, cx - 50, cy + ry * 0.35, 1.5);
});

// khrushchyovka: local ochre, shadow side toward violet, a few window and balcony marks (suggested, not a grid)
wash(rect(40, 700, 390, 485), '#d8b98a', 0.55, { j: 4 });
wash([[430, 700], [500, 730], [500, 1185], [430, 1185]], '#b7a08e', 0.6, { j: 4 });
poly([[40, 700], [430, 700], [500, 730]], 2); poly([[430, 700], [430, 1185]], 2); poly([[500, 730], [500, 1185]], 1.8);
for (let r = 0; r < 6; r++) for (let c = 0; c < 4; c++) {
  if (R() < 0.3) continue;
  const x = 70 + c * 92, y = 730 + r * 72;
  if (R() < 0.5) poly([[x, y], [x + 46, y], [x + 46, y + 44], [x, y + 44], [x, y + 2]], 1.5, { gap: false });
  else { poly([[x, y + 44], [x + 46, y + 44]], 1.5); poly([[x + 4, y + 8], [x + 4, y + 40]], 1.2); }
  if (R() < 0.55) wash(rect(x + 2, y + 2, 42, 40), '#8f9fba', 0.35, { j: 4 });
  if (c === 3 && R() < 0.7) { poly([[x - 10, y + 54], [x + 58, y + 54]], 1.6); poly([[x - 10, y + 54], [x - 10, y + 66]], 1.2); }
}
// bus stop: blue-grey roof, posts, a bench
wash([[600, 880], [935, 868], [935, 900], [600, 912]], '#8b93a6', 0.6);
wash(rect(612, 912, 312, 190), '#bcd0dc', 0.25, { j: 10 });
poly([[598, 880], [936, 868]], 2.2); poly([[600, 912], [936, 900]], 1.8);
line(615, 912, 615, 1185, 2); line(922, 900, 922, 1185, 2);
poly([[650, 1100], [880, 1098]], 2); line(665, 1100, 665, 1140, 1.6); line(865, 1098, 865, 1140, 1.6);
I.save(); I.fillStyle = INK; I.font = '600 30px Caveat'; I.fillText('ост.', 640, 948); I.restore(); poly([[630, 922], [700, 922], [700, 960], [630, 960], [630, 924]], 1.4, { gap: false });
// sidewalk + curb; shadows of the figures in violet-grey
wash(rect(40, 1185, 1000, 140), '#d8c6a0', 0.45, { j: 10 });
ink([[40, 1186], [1040, 1182]], 1.8); ink([[40, 1262], [520, 1266]], 1.4); ink([[600, 1266], [1040, 1262]], 1.4);
wash(blobPts(420, 1292, 120, 16), '#8f86a8', 0.45);
wash(blobPts(800, 1200, 85, 12), '#8f86a8', 0.4);

// ================================================================= reserves: the figures are left as paper
function reserve(polys) {
  for (const P of polys) {
    for (const [ctx, mode, col] of [[Wc, 'source-over', '#fff'], [I, 'destination-out', '#000']]) {
      ctx.save(); ctx.globalCompositeOperation = mode; ctx.fillStyle = col; ctx.strokeStyle = col; ctx.lineWidth = 10; ctx.lineJoin = 'round';
      ctx.beginPath(); P.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
    }
  }
}
const ell = (cx, cy, rx, ry) => Array.from({ length: 24 }, (_, i) => [cx + rx * Math.cos(i / 24 * Math.PI * 2), cy + ry * Math.sin(i / 24 * Math.PI * 2)]);
reserve([
  ell(394, 790, 44, 52), [[358, 780], [362, 750], [390, 738], [426, 746], [436, 772]], [[380, 830], [410, 830], [410, 866], [380, 866]],
  [[338, 864], [448, 860], [474, 930], [452, 942], [442, 1042], [352, 1046], [348, 905], [332, 940], [312, 928]],
  [[318, 935], [334, 940], [314, 1040], [296, 1046]], [[454, 940], [470, 934], [478, 978], [542, 984], [538, 1000], [466, 996]],
  [[478, 968], [566, 974], [584, 1150], [560, 1156], [548, 1128], [488, 1120], [472, 1010]],
  [[360, 1040], [440, 1040], [462, 1158], [480, 1282], [446, 1300], [430, 1162], [380, 1160], [352, 1290], [304, 1290], [340, 1158]],
  ell(790, 812, 34, 40), [[754, 802], [760, 766], [790, 740], [822, 766], [826, 802]],
  [[750, 840], [830, 840], [856, 1106], [726, 1106]], [[752, 1100], [842, 1100], [846, 1196], [752, 1196]],
]);

// ================================================================= figures: normal proportions, faces left blank
// A — walking in a T-shirt, the morning's puffer jacket over the forearm
(function () {
  const skin = '#e9b896', shirt = '#d86a4f', jeans = '#5f7fa6', hair = '#4a3428', jacket = '#d9a83a';
  // legs (jeans): front leg forward, back leg pushing off
  wash([[360, 1040], [402, 1040], [380, 1160], [345, 1272], [322, 1268], [340, 1158]], jeans, 0.62);
  wash([[400, 1040], [440, 1040], [462, 1158], [478, 1278], [454, 1282], [430, 1162]], jeans, 0.62);
  wash([[358, 1040], [402, 1040], [380, 1160], [345, 1272]], '#4a5f8a', 0.25);
  ink([[360, 1040], [342, 1158], [320, 1268]], 2.2); ink([[402, 1046], [382, 1160], [347, 1272]], 2);
  ink([[440, 1040], [464, 1158], [480, 1278]], 2.2); ink([[404, 1050], [430, 1162], [454, 1282]], 2);
  // sneakers: paper white, ink only
  ink([[312, 1268], [356, 1270], [352, 1290], [304, 1288], [312, 1268]], 2, { gap: false });
  ink([[450, 1280], [500, 1284], [502, 1300], [446, 1298], [450, 1280]], 2, { gap: false });
  // torso: T-shirt from cross-sections
  const tee = [[338, 864], [448, 860], [474, 930], [452, 942], [440, 905], [442, 1042], [352, 1046], [348, 905], [332, 940], [312, 928]];
  wash(tee, shirt, 0.6);
  wash([[400, 870], [448, 864], [442, 1042], [404, 1044]], '#9e4a5a', 0.25);           // shadow side toward violet
  ink([[338, 864], [312, 928], [332, 940], [348, 905], [352, 1046]], 2.1); ink([[448, 860], [474, 930], [452, 942], [440, 905], [442, 1042]], 2.1);
  ink([[352, 1046], [442, 1042]], 1.8);
  // arms: back arm swinging, front forearm forward carrying the jacket
  wash([[318, 935], [334, 940], [314, 1040], [300, 1046], [296, 1036]], skin, 0.55);
  ink([[318, 935], [302, 1000], [296, 1040]], 2); ink([[334, 942], [318, 1004], [306, 1046]], 1.8);
  wash([[454, 940], [470, 934], [478, 978], [540, 984], [540, 1000], [466, 996]], skin, 0.55);
  ink([[470, 934], [480, 976], [542, 984]], 2); ink([[454, 942], [464, 994], [538, 1000]], 1.8);
  // the puffer jacket hanging over the forearm: quilting lines
  const jk = [[478, 968], [560, 974], [566, 1010], [548, 1128], [488, 1120], [472, 1010]];
  wash(jk, jacket, 0.65); wash([[520, 980], [560, 974], [548, 1128], [516, 1124]], '#b0803a', 0.3);
  ink([[478, 968], [560, 974], [566, 1010], [548, 1128], [488, 1120], [472, 1010], [478, 968]], 2.1);
  for (let k = 0; k < 4; k++) ink([[476 + k * 2, 1004 + k * 30], [562 - k * 3, 1010 + k * 30]], 1.3, { over: false });
  wash([[540, 990], [566, 996], [584, 1150], [560, 1156]], jacket, 0.6); ink([[540, 990], [560, 1156], [584, 1150], [566, 996]], 1.8, { gap: false });
  // neck + head; hair and head as one mass; one nose tick in 3/4
  wash([[384, 834], [404, 834], [406, 862], [384, 862]], skin, 0.5);
  wash(blobPts(394, 790, 38, 46, 18), skin, 0.5);
  wash([[358, 780], [362, 752], [390, 740], [424, 748], [434, 772], [428, 790], [414, 768], [380, 770], [366, 800]], hair, 0.7);
  ink(Array.from({ length: 20 }, (_, i) => { const a = -Math.PI * 0.95 + i / 19 * Math.PI * 1.9; return [394 + 38 * Math.cos(a), 792 + 46 * Math.sin(a)]; }), 2.1);
  ink([[430, 794], [438, 806], [430, 810]], 1.6, { over: false, gap: false });
  // dark glasses: the only face mark besides the nose — the joke of the shot
  ink([[402, 788], [436, 786]], 3.2, { over: false, gap: false });
  // heat, drawn: wavy strokes rising off the pavement and the shoulders
  wavy(330, 720, 60); wavy(455, 712, 55); wavy(570, 1250, 70, 5, 1.3);
})();

// B — still dressed for 07:00 under the bus stop: knit hat, scarf, long coat, boots
(function () {
  const coat = '#4f6b6a', hat = '#b8483e', scarf = '#e2b04a', skin = '#e9b896';
  wash([[748, 852], [832, 852], [856, 1104], [726, 1104]], coat, 0.7);
  wash([[790, 852], [832, 852], [856, 1104], [796, 1104]], '#3e4f66', 0.3);
  poly([[748, 852], [726, 1104], [856, 1104], [832, 852]], 2.2, { gap: false }); ink([[790, 870], [792, 1104]], 1.4);
  for (const x of [762, 812]) { ink([[x, 1104], [x - 2, 1180]], 2); ink([[x + 20, 1104], [x + 22, 1180]], 2); wash(rect(x - 8, 1170, 38, 24), '#3a2e2a', 0.7); }
  wash(blobPts(790, 812, 30, 36, 16), skin, 0.5);
  ink(Array.from({ length: 16 }, (_, i) => { const a = -Math.PI * 0.2 + i / 15 * Math.PI * 1.2; return [790 + 30 * Math.cos(a), 814 + 36 * Math.sin(a)]; }), 1.9);
  wash([[756, 800], [760, 768], [790, 752], [820, 768], [824, 800]], hat, 0.7); ink([[756, 800], [760, 768], [790, 752], [820, 768], [824, 800], [756, 800]], 1.9, { gap: false });
  wash(blobPts(790, 748, 11, 11, 10), hat, 0.6);
  wash([[754, 842], [828, 842], [826, 866], [756, 866]], scarf, 0.7); wash([[806, 860], [826, 860], [830, 930], [812, 932]], scarf, 0.65);
  ink([[754, 842], [828, 842]], 1.6); ink([[806, 866], [812, 932], [830, 930], [826, 860]], 1.6, { gap: false });
  ink([[762, 812], [752, 818], [760, 822]], 1.5, { over: false, gap: false });             // nose tick, profile to the left
  // sweat drops, drawn
  for (const [x, y] of [[740, 790], [842, 800], [846, 830]]) { wash(blobPts(x, y, 5, 8, 8), '#9fbcd6', 0.7, { j: 1, off: [1, 1] }); ink([[x, y - 9], [x - 5, y + 2], [x, y + 8], [x + 5, y + 2], [x, y - 9]], 1.2, { over: false, gap: false }); }
})();

// ================================================================= composite: paper × wash (pooled edges, granulation) + ink
const wd = Wc.getImageData(0, 0, W, H).data;
const blurC = mk(), B = blurC.getContext('2d'); B.filter = 'blur(6px)'; B.drawImage(washC, 0, 0);
const bd = B.getImageData(0, 0, W, H).data;
const out = X.createImageData(W, H), o = out.data;
const paper = [243, 235, 218];
// frayed page edge: the painting dissolves into dabs inside this box
const bx0 = 40, by0 = 400, bx1 = 1040, by1 = 1330;
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  const i = (y * W + x) * 4;
  const mot = 1 + (fbm(x * 0.004, y * 0.004) - 0.5) * 0.06;
  const tooth = 0.96 + 0.06 * (vnoise(x * 0.6, y * 0.6) - 0.5) * 2;
  let r = paper[0] * mot * tooth, g = paper[1] * mot * tooth, b = paper[2] * mot * tooth;
  const d = Math.min(x - bx0, bx1 - x, y - by0, by1 - y);
  const edgeMask = clamp((d + 40 * (fbm(x * 0.03, y * 0.03) - 0.5) + 10) / 22);
  if (edgeMask > 0) {
    const gran = 0.82 + 0.36 * fbm(x * 0.15, y * 0.15);
    for (let c = 0; c < 3; c++) {
      const pig = 1 - wd[i + c] / 255, pigB = 1 - bd[i + c] / 255;
      const pool = clamp((pig - pigB) * 2.2);
      const p = clamp(pig * gran * (1 + 0.7 * pool)) * edgeMask;
      if (c === 0) r *= 1 - p; else if (c === 1) g *= 1 - p; else b *= 1 - p;
    }
  }
  o[i] = r; o[i + 1] = g; o[i + 2] = b; o[i + 3] = 255;
}
X.putImageData(out, 0, 0);
X.drawImage(inkC, 0, 0);

// ================================================================= handwriting on the page
const hand = (s, x, y, size, w = 600, col = INK, rot = 0) => { X.save(); X.translate(x, y); X.rotate(rot); X.fillStyle = col; X.font = `${w} ${size}px Caveat`; X.fillText(s, 0, 0); X.restore(); };
hand('Погода за день', 70, 312, 96, 700, INK, -0.02);
hand('Бишкек · 13:00 · утром был снег', 74, 372, 44, 500, '#6b5644');
hand('В обед — уже лето.', 74, 1430, 70, 700, INK, -0.01);
hand('А кто-то ещё в пуховике.', 78, 1500, 54, 500, '#6b5644', -0.01);

window.DUR = 1; window.render = () => {}; window.READY = true;
})();
