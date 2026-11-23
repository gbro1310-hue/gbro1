// Reference illustrations (flat, value-planned) for each painted plate. Units = pixels at zoom 1.
import { Ref, paintRef } from './engine/plate.js';
import { KNIFE, BRUSH, DAB } from './engine/impasto.js';
import { P, E, RR, lin, rad, lerp, hash } from './common.js';

export const SW = 1200, SH = 2133;
const tf = (pts, s, ox, oy, flip = false) => pts.map(([x, y]) => [ox + (flip ? -x : x) * s, oy + y * s]);

// cow, side profile facing left, feet at y=0 (same silhouette family as the woodcut version)
const COW = [[-180, -330], [-60, -345], [80, -350], [200, -345], [250, -325], [275, -285], [280, -220], [262, -170], [255, -110], [262, -4], [228, -4], [222, -100], [205, -150], [178, -172], [176, -110], [182, -4], [148, -4], [142, -110], [130, -162], [40, -156], [-80, -158], [-118, -150], [-124, -100], [-118, -4], [-150, -4], [-158, -100], [-168, -136], [-178, -108], [-174, -4], [-208, -4], [-212, -110], [-218, -170], [-234, -228], [-250, -268], [-276, -290], [-302, -302], [-346, -300], [-386, -276], [-410, -238], [-420, -206], [-402, -188], [-370, -194], [-334, -214], [-300, -234], [-268, -250], [-248, -298], [-222, -330]];
const MUZ = [[-386, -276], [-410, -238], [-420, -206], [-402, -188], [-370, -194], [-360, -230], [-372, -262]];
const HORN = [[-326, -298], [-342, -340], [-322, -352], [-310, -304]];
const EAR = [[-300, -292], [-258, -322], [-280, -284]];
const COW_LIE = [[-150, -170], [0, -190], [150, -185], [250, -150], [285, -90], [270, -20], [200, 0], [-60, 0], [-170, -10], [-215, -40], [-240, -80], [-270, -120], [-300, -150], [-350, -150], [-390, -120], [-404, -88], [-380, -72], [-340, -84], [-300, -96], [-250, -110], [-215, -150]];

export function cow(R, s, ox, oy, { flip = false, hide = '#7a3f22', lit = '#c27a42', side = 1, g = 'cow', maxR = 22 } = {}) {
  const pts = tf(COW, s, ox, oy, flip);
  const xs = pts.map(p => p[0]), x0 = Math.min(...xs), x1 = Math.max(...xs);
  const lx = side > 0 ? x1 : x0, dx = side > 0 ? x0 : x1;
  R.fill(P(pts), lin(lx, oy - 300 * s, dx, oy, [[0, lit], [.55, hide], [1, '#3a2014']]), { dir: { fn: (x, y) => .2 }, maxR, group: g, detail: 1.3 });
  R.fill(P(tf(MUZ, s, ox, oy, flip)), '#d9b08a', { maxR: 8, group: g + 'm' });
  R.fill(P(tf(HORN, s, ox, oy, flip)), '#efe2c0', { maxR: 4, group: g + 'h' });
  R.fill(P(tf(EAR, s, ox, oy, flip)), '#5a2e18', { maxR: 6, group: g + 'e' });
  const ex = ox + (flip ? 360 : -360) * s, ey = oy - 262 * s;
  R.fill(E(ex, ey, 8 * s, 7 * s), '#120a06', { maxR: 2, group: g + 'y' });
  R.fill(E(ex + 2 * s, ey - 2 * s, 2.6 * s, 2.4 * s), '#f4e0b0', { maxR: 1, group: g + 'y2' });
}
export function cowLying(R, s, ox, oy, g = 'cowl') {
  const pts = tf(COW_LIE, s, ox, oy);
  R.fill(P(pts), lin(ox - 300 * s, oy - 190 * s, ox + 200 * s, oy, [[0, '#a4643a'], [.5, '#6e3a20'], [1, '#2e180e']]), { dir: 10, maxR: 22, group: g });
  R.fill(P(tf([[-404, -88], [-380, -72], [-350, -80], [-356, -110], [-390, -120]], s, ox, oy)), '#cfa682', { maxR: 6, group: g + 'm' });
  R.fill(P(tf([[-300, -150], [-316, -190], [-298, -200], [-288, -152]], s, ox, oy)), '#efe2c0', { maxR: 4, group: g + 'h' });
}
// a seated figure facing right (or left with flip); warm lit side toward the fire
export function sitter(R, s, ox, oy, { flip = false, tunic = '#5c6e48', g = 'sit', light = '#f0a060' } = {}) {
  const body = tf([[-60, -250], [20, -255], [50, -220], [60, -150], [110, -120], [150, -100], [150, -60], [90, -50], [60, -10], [-80, -10], [-90, -120], [-80, -200]], s, ox, oy, flip);
  R.fill(P(body), lin(ox + (flip ? -100 : 100) * s, 0, ox - (flip ? -100 : 100) * s, 0, [[0, light], [.35, tunic], [1, '#1e1a14']]), { dir: 90, maxR: 12, group: g });
  const hx = ox + (flip ? -5 : 5) * s, hy = oy - 300 * s;
  R.fill(E(hx, hy, 40 * s, 46 * s), lin(hx + (flip ? -40 : 40) * s, 0, hx - (flip ? -40 : 40) * s, 0, [[0, '#f2b47c'], [.6, '#a8643c'], [1, '#4a2a18']]), { maxR: 6, group: g + 'f', detail: 1.6 });
  R.fill(P(tf([[-50, -318], [0, -356], [46, -322], [54, -268], [32, -246], [30, -300], [-30, -300], [-46, -248]], s, ox, oy, flip)), '#3a3026', { maxR: 6, group: g + 'h' });
}

// ---------------- 1 · exterior: snowy longhouse at night
export function drawExterior(R) {
  R.fill(P([[0, 0], [SW, 0], [SW, 1250], [0, 1250]]), lin(0, 0, 0, 1250, [[0, '#0e1630'], [.6, '#1e2c50'], [1, '#3c4a6e']]), { dir: -4, maxR: 40, group: 'sky' });
  for (let i = 0; i < 40; i++) R.fill(E(hash(i) * SW, hash(i + 9) * 900, 3, 3), '#dfe6ff', { maxR: 2, group: 's' + i });
  // far hills and trees
  R.fill(P([[0, 1150], [300, 1060], [700, 1110], [1000, 1040], [SW, 1090], [SW, 1300], [0, 1300]]), '#2a3450', { dir: 0, maxR: 30, group: 'hill' });
  for (let i = 0; i < 9; i++) { const x = 60 + i * 135 + hash(i) * 40, h = 120 + hash(i + 3) * 90; R.fill(P([[x, 1150 - h], [x + 40, 1150], [x - 40, 1150]]), '#18203a', { dir: 90, maxR: 10, group: 't' + i }); }
  // snow ground
  R.fill(P([[0, 1250], [SW, 1220], [SW, SH], [0, SH]]), lin(0, 1250, 0, SH, [[0, '#8a9ac4'], [.4, '#b8c4e0'], [1, '#6a78a0']]), { dir: 0, maxR: 40, group: 'snow' });
  // the longhouse: low walls, huge thatch
  R.fill(P([[160, 1540], [1040, 1520], [1040, 1300], [160, 1320]]), lin(0, 1300, 0, 1540, [[0, '#5a4636'], [1, '#2e241c']]), { dir: 0, maxR: 16, group: 'wall' });
  R.fill(P([[90, 1340], [600, 940], [1110, 1320], [1060, 1360], [600, 1010], [140, 1380]]), '#e6ecf8', { dir: { fn: (x, y) => x < 600 ? -.65 : .65 }, maxR: 14, group: 'snowroof' });
  R.fill(P([[140, 1380], [600, 1010], [1060, 1360], [1040, 1330], [160, 1350]]), lin(0, 1010, 0, 1380, [[0, '#7a5a34'], [1, '#4a3420']]), { dir: { fn: (x, y) => x < 600 ? .9 : -.9 }, maxR: 14, group: 'thatch' });
  // door: warm light spilling
  R.fill(P([[560, 1530], [660, 1528], [660, 1380], [560, 1382]]), lin(0, 1380, 0, 1530, [[0, '#ffcf7a'], [1, '#e8782a']]), { dir: 90, maxR: 8, group: 'door' });
  R.fill(P([[540, 1535], [680, 1532], [760, 1720], [470, 1730]]), lin(0, 1530, 0, 1730, [[0, 'rgba(255,190,110,.95)'], [1, 'rgba(255,170,90,.15)']]), { dir: 90, maxR: 10, group: 'spill' });
  // smoke hole glow
  R.fill(E(600, 1035, 26, 10), '#f0a050', { maxR: 4, group: 'hole' });
}
// ---------------- 2 · interior down the length (perspective), warm hearth near, cattle far
export function drawInterior(R) {
  const VP = [600, 720];
  const roofL = [[0, 0], [600, 0], [600, 560], [470, 600]], roofR = [[SW, 0], [600, 0], [600, 560], [730, 600]];
  R.fill(P([[0, 0], [470, 600], [470, 900], [0, 1900]]), lin(0, 0, 470, 0, [[0, '#2a1a10'], [1, '#5a4030']]), { dir: { radial: VP }, maxR: 26, group: 'wl' });
  R.fill(P([[SW, 0], [730, 600], [730, 900], [SW, 1900]]), lin(SW, 0, 730, 0, [[0, '#2a1a10'], [1, '#5a4030']]), { dir: { radial: VP }, maxR: 26, group: 'wr' });
  R.fill(P(roofL), lin(0, 0, 600, 560, [[0, '#120a06'], [1, '#3a281a']]), { dir: { radial: VP }, maxR: 26, group: 'rl' });
  R.fill(P(roofR), lin(SW, 0, 600, 560, [[0, '#120a06'], [1, '#3a281a']]), { dir: { radial: VP }, maxR: 26, group: 'rr' });
  R.fill(P([[470, 600], [730, 600], [730, 900], [470, 900]]), '#2a2018', { dir: 0, maxR: 12, group: 'back' });
  // floor: beaten earth, firelight pool
  R.fill(P([[0, 1900], [SW, 1900], [SW, SH], [0, SH]]), '#2a1c12', { dir: 0, maxR: 30, group: 'floor0' });
  R.fill(P([[0, 1900], [SW, 1900], [730, 900], [470, 900]]), rad(600, 1560, 40, 900, [[0, '#d8904a'], [.35, '#8a5a34'], [1, '#2a1c12']]), { dir: { radial: VP }, maxR: 26, group: 'floor' });
  // drain down the middle
  R.fill(P([[585, 900], [615, 900], [650, 1900], [550, 1900]]), '#1a120c', { dir: { radial: VP }, maxR: 6, group: 'drain' });
  // rafters
  for (let k = 0; k < 5; k++) { const u = k / 4; const y = lerp(0, 560, u); R.line(c => { c.moveTo(600, y); c.lineTo(lerp(0, 470, u), lerp(0, 600, u)); c.moveTo(600, y); c.lineTo(lerp(SW, 730, u), lerp(0, 600, u)); }, '#4a3020', 10 - k * 1.6, { maxR: 5, group: 'raft' + k }); }
  // cattle at the far end (dim)
  cow(R, .3, 545, 900, { hide: '#3a2a20', lit: '#7a5038', g: 'fc1', maxR: 5 });
  cow(R, .26, 660, 895, { flip: true, hide: '#3a2a20', lit: '#6a4630', g: 'fc2', maxR: 5 });
  // hearth stones + people near
  for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; R.fill(E(600 + Math.cos(a) * 150, 1600 + Math.sin(a) * 46, 30, 20, a), lin(0, 1560, 0, 1640, [[0, '#9a8a74'], [1, '#3a3028']]), { maxR: 6, group: 'st' + i }); }
  R.fill(E(600, 1600, 130, 36), '#ffb050', { maxR: 8, group: 'embers' });
  sitter(R, .95, 300, 1720, { g: 's1', tunic: '#5c6e48' });
  sitter(R, .85, 900, 1735, { flip: true, g: 's2', tunic: '#7a3a2a' });
  sitter(R, .55, 760, 1560, { flip: true, g: 's3', tunic: '#4a4a6a' });
}
// ---------------- 3 · the cow as a heater
export function drawCow(R) {
  R.fill(P([[0, 0], [SW, 0], [SW, 1450], [0, 1450]]), lin(0, 0, 0, 1450, [[0, '#1e140e'], [1, '#4a3424']]), { dir: 2, maxR: 36, group: 'wall' });
  for (let i = 0; i < 7; i++) R.line(c => { c.moveTo(0, 300 + i * 160); c.bezierCurveTo(400, 280 + i * 160, 800, 320 + i * 160, SW, 300 + i * 160); }, '#5a4030', 14, { maxR: 6, group: 'wat' + i });
  R.fill(P([[0, 1450], [SW, 1450], [SW, SH], [0, SH]]), lin(0, 1450, 0, SH, [[0, '#c69a52'], [1, '#6a4a22']]), { dir: { fn: (x, y) => .4 + Math.sin(x * .02) }, maxR: 14, group: 'straw', type: KNIFE, len: 1.6, wid: .6 });
  cow(R, 1.32, 640, 1460, { side: -1, g: 'cow' });
  sitter(R, .72, 190, 1540, { g: 'kid', tunic: '#5a6a4a', light: '#d0905a' });
}
// ---------------- 4 · the hearth and the smoke (tall plate for the tilt)
export const HW = 1200, HH = 3300;
export function drawHearth(R) {
  R.fill(P([[0, 0], [HW, 0], [HW, 700], [0, 700]]), lin(0, 0, 0, 700, [[0, '#2a1c10'], [1, '#5a4024']]), { dir: { fn: (x, y) => x < 600 ? 1.2 : -1.2 }, maxR: 20, group: 'thatch', len: 1.6, wid: .7 });
  R.fill(E(600, 640, 90, 40), '#1a2648', { maxR: 6, group: 'hole' });
  for (let i = 0; i < 5; i++) R.fill(E(600 + (hash(i) - .5) * 120, 600 + hash(i + 4) * 50, 3, 3), '#e0e6ff', { maxR: 1.5, group: 'hs' + i });
  R.fill(P([[0, 700], [HW, 700], [HW, 2700], [0, 2700]]), rad(600, 2650, 60, 1700, [[0, '#a8683a'], [.4, '#4a3222'], [1, '#1a120c']]), { dir: 0, maxR: 30, group: 'walls' });
  for (let k = 0; k < 4; k++) R.line(c => { c.moveTo(0, 760 + k * 40); c.lineTo(HW, 720 + k * 50); }, '#2a1c12', 18, { maxR: 7, group: 'beam' + k });
  R.fill(P([[0, 2700], [HW, 2700], [HW, HH], [0, HH]]), rad(600, 2780, 40, 900, [[0, '#e0a058'], [.4, '#7a4e2c'], [1, '#22160e']]), { dir: { radial: [600, 2780] }, maxR: 26, group: 'floor' });
  for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2; R.fill(E(600 + Math.cos(a) * 250, 2800 + Math.sin(a) * 70, 46, 30, a), lin(0, 2740, 0, 2860, [[0, '#c0aa8a'], [1, '#4a3c30']]), { maxR: 8, group: 'st' + i }); }
  R.fill(P([[420, 2800], [780, 2760], [790, 2790], [430, 2830]]), '#3a2414', { dir: -6, maxR: 8, group: 'log1' });
  R.fill(P([[440, 2760], [770, 2810], [760, 2840], [430, 2790]]), '#2e1c10', { dir: 8, maxR: 8, group: 'log2' });
  R.fill(E(600, 2790, 200, 46), '#ffb850', { maxR: 10, group: 'coals' });
}
// ---------------- 5 · embers close (ash spreads over them in the film)
export function drawEmbers(R) {
  R.fill(P([[0, 0], [SW, 0], [SW, SH], [0, SH]]), rad(600, 1300, 60, 1300, [[0, '#4a3020'], [1, '#120c08']]), { dir: 0, maxR: 36, group: 'bg' });
  for (let i = 0; i < 26; i++) {
    const x = 160 + hash(i * 3) * 880, y = 1050 + hash(i * 7) * 520, r = 50 + hash(i * 11) * 60;
    R.fill(E(x, y, r, r * .7, hash(i) * 3), rad(x - r * .2, y - r * .2, 4, r * 1.1, [[0, '#ffe08a'], [.4, '#f08a30'], [.8, '#a03a14'], [1, '#3a1a0c']]), { maxR: 10, group: 'em' + i, detail: 1.3 });
  }
}
export function drawShovel(R) {   // local: blade centred at (300,200)
  R.fill(P([[80, 120], [470, 110], [500, 270], [70, 290]]), lin(80, 110, 80, 290, [[0, '#9a9a94'], [1, '#4a4a46']]), { dir: 0, maxR: 10, group: 'blade' });
  R.fill(P([[90, 250], [480, 230], [500, 270], [70, 290]]), '#bfbab0', { dir: 0, maxR: 6, group: 'ashon' });
  R.fill(P([[460, 150], [1000, -260], [1020, -232], [480, 190]]), lin(460, 0, 1000, 0, [[0, '#6a4428'], [1, '#3a2414']]), { dir: { fn: () => -.65 }, maxR: 8, group: 'handle' });
  R.fill(E(820, -100, 70, 46, -.6), lin(780, -140, 860, -60, [[0, '#f0b47c'], [1, '#8a4a28']]), { maxR: 6, group: 'hand1' });
  R.fill(E(960, -210, 62, 42, -.6), lin(920, -250, 1000, -170, [[0, '#f0b47c'], [1, '#8a4a28']]), { maxR: 6, group: 'hand2' });
}
// ---------------- 6 · town street at dusk, bell tower
export function drawTown(R) {
  R.fill(P([[0, 0], [SW, 0], [SW, 1300], [0, 1300]]), lin(0, 0, 0, 1300, [[0, '#2a2a52'], [.55, '#6a5a7a'], [.85, '#d88a5a'], [1, '#f0b070']]), { dir: -3, maxR: 40, group: 'sky' });
  // tower
  R.fill(P([[440, 1500], [760, 1500], [760, 420], [440, 420]]), lin(440, 0, 760, 0, [[0, '#8a7262'], [1, '#4a3c36']]), { dir: 90, maxR: 18, group: 'tower' });
  R.fill(P([[420, 430], [600, 180], [780, 430]]), '#3a2e30', { dir: { fn: (x, y) => x < 600 ? -1 : 1 }, maxR: 12, group: 'spire' });
  R.fill(c => { c.moveTo(500, 760); c.lineTo(500, 600); c.arc(600, 600, 100, Math.PI, 0); c.lineTo(700, 760); c.closePath(); }, '#1e1824', { maxR: 8, group: 'arch' });
  // houses: half-timbered, lit windows
  const house = (x, w, h, g, col) => {
    R.fill(P([[x, 1500], [x + w, 1500], [x + w, 1500 - h], [x, 1500 - h]]), col, { dir: 90, maxR: 16, group: g });
    R.fill(P([[x - 20, 1500 - h], [x + w / 2, 1500 - h - w * .55], [x + w + 20, 1500 - h]]), '#4a3028', { dir: { fn: (xx) => xx < x + w / 2 ? -.8 : .8 }, maxR: 12, group: g + 'r' });
    for (let k = 0; k < 3; k++) R.line(c => { c.moveTo(x + w * (k + .5) / 3, 1500); c.lineTo(x + w * (k + .5) / 3, 1500 - h); }, '#2a1c16', 12, { maxR: 5, group: g + 'b' + k });
    R.fill(RR(x + w * .3, 1500 - h * .62, w * .28, h * .2, 4), '#ffc870', { maxR: 6, group: g + 'w' });
  };
  house(-20, 420, 460, 'h1', '#c8b08a'); house(790, 430, 520, 'h2', '#b89a7a');
  R.fill(P([[0, 1500], [SW, 1500], [SW, SH], [0, SH]]), lin(0, 1500, 0, SH, [[0, '#9aa0b8'], [1, '#4a4e66']]), { dir: { radial: [600, 1450] }, maxR: 30, group: 'street' });
  for (let i = 0; i < 3; i++) R.fill(RR(560 - 30, 1530 + i * 120, 60 + i * 40, 18, 6), '#d8a870', { dir: 0, maxR: 6, group: 'refl' + i });
}
export function drawBell(R) {   // local: hang point (200,40)
  R.fill(P([[140, 60], [260, 60], [290, 100], [310, 200], [330, 300], [390, 390], [400, 420], [0, 420], [10, 390], [70, 300], [90, 200], [110, 100]]), lin(40, 0, 360, 0, [[0, '#e8c070'], [.35, '#b07a34'], [1, '#4a3014']]), { dir: { fn: (x) => Math.PI / 2 + (x - 200) * .004 }, maxR: 10, group: 'bell' });
  R.fill(E(200, 440, 26, 26), '#3a2410', { maxR: 4, group: 'clap' });
  R.fill(P([[180, 0], [220, 0], [220, 64], [180, 64]]), '#3a2a20', { maxR: 4, group: 'yoke' });
}
export function drawTitle(R, txt, w, h, size, col = '#f2dca6') { R.text(txt, w / 2, h * .72, `600 ${size}px "Cormorant SC"`, col, { maxR: 3, group: 'tx' }); }
// ---------------- 7 · November plates
export function drawHay(R) {
  R.fill(P([[0, 0], [SW, 0], [SW, 1400], [0, 1400]]), lin(0, 0, 0, 1400, [[0, '#1a2442'], [1, '#4a5274']]), { dir: -3, maxR: 40, group: 'sky' });
  R.fill(P([[0, 1400], [SW, 1380], [SW, SH], [0, SH]]), lin(0, 1400, 0, SH, [[0, '#aab4d4'], [1, '#5a6488']]), { dir: 0, maxR: 36, group: 'snow' });
  R.fill(c => { c.moveTo(380, 1420); c.quadraticCurveTo(410, 1180, 600, 1150); c.quadraticCurveTo(790, 1180, 820, 1420); c.closePath(); }, lin(0, 1150, 0, 1420, [[0, '#d8b060'], [1, '#7a5a28']]), { dir: { fn: (x) => 1.2 + (x - 600) * .002 }, maxR: 12, group: 'hay', len: 1.5, wid: .7 });
  R.fill(c => { c.moveTo(395, 1300); c.quadraticCurveTo(470, 1175, 600, 1158); c.quadraticCurveTo(730, 1175, 805, 1300); c.quadraticCurveTo(600, 1250, 395, 1300); }, '#eef2fb', { maxR: 8, group: 'haysnow' });
}
export function drawStall(R) {
  R.fill(P([[0, 0], [SW, 0], [SW, 1500], [0, 1500]]), lin(0, 0, 0, 1500, [[0, '#1a120c'], [1, '#3a2a1c']]), { dir: 2, maxR: 36, group: 'wall' });
  R.fill(P([[0, 1500], [SW, 1500], [SW, SH], [0, SH]]), lin(0, 1500, 0, SH, [[0, '#a07a3c'], [1, '#4a3418']]), { dir: { fn: (x) => .3 + Math.sin(x * .03) }, maxR: 14, group: 'straw', len: 1.6, wid: .6 });
  for (let k = 0; k < 3; k++) R.fill(P([[120 + k * 380, 1500], [150 + k * 380, 1500], [150 + k * 380, 700], [120 + k * 380, 700]]), '#4a3020', { dir: 90, maxR: 8, group: 'post' + k });
  cow(R, .9, 640, 1510, { side: -1, g: 'cow' });
}
export function drawCloth(R) {
  R.fill(P([[0, 0], [SW, 0], [SW, SH], [0, SH]]), rad(600, 900, 80, 1300, [[0, '#7a2a1e'], [.6, '#4a1810'], [1, '#1a0806']]), { dir: { fn: (x, y) => .3 + Math.sin(y * .01) * .4 }, maxR: 34, group: 'cloth' });
  R.fill(c => { c.moveTo(300, 1500); c.lineTo(900, 1500); c.lineTo(860, 1900); c.lineTo(340, 1900); c.closePath(); }, lin(300, 0, 900, 0, [[0, '#8a6a4a'], [.5, '#c09a6a'], [1, '#5a4430']]), { dir: 90, maxR: 12, group: 'tub' });
  for (let k = 0; k < 3; k++) R.line(c => { c.moveTo(312 + k * 10, 1580 + k * 120); c.lineTo(888 - k * 10, 1580 + k * 120); }, '#3a2a1a', 14, { maxR: 5, group: 'hoop' + k });
  R.fill(E(600, 1500, 300, 40), '#efece4', { maxR: 6, group: 'salt' });
}
// ---------------- 8 · the sleepers (night)
export function drawSleep(R) {
  R.fill(P([[0, 0], [SW, 0], [SW, 1450], [0, 1450]]), lin(0, 0, 0, 1450, [[0, '#0e0c10'], [1, '#2a2026']]), { dir: 2, maxR: 40, group: 'wall' });
  R.fill(P([[1020, 400], [1200, 400], [1200, 1200], [1020, 1200]]), lin(1020, 0, 1200, 0, [[0, '#3a4a78'], [1, '#8a9ac8']]), { dir: 90, maxR: 10, group: 'door' });
  R.fill(P([[0, 1450], [SW, 1450], [SW, SH], [0, SH]]), lin(0, 1450, 0, SH, [[0, '#7a5a32'], [1, '#2a1c10']]), { dir: { fn: (x) => .2 + Math.sin(x * .03) * .8 }, maxR: 14, group: 'straw', len: 1.6, wid: .6 });
  R.fill(c => { c.moveTo(150, 1560); c.bezierCurveTo(300, 1420, 500, 1430, 650, 1460); c.bezierCurveTo(800, 1430, 950, 1450, 1060, 1560); c.lineTo(1080, 1640); c.lineTo(130, 1650); c.closePath(); }, lin(0, 1430, 0, 1650, [[0, '#8a6a52'], [1, '#3a2a22']]), { dir: { fn: (x) => .15 + Math.sin(x * .01) * .2 }, maxR: 16, group: 'blanket' });
  [[230, 1530, 48], [380, 1500, 42], [530, 1515, 32]].forEach(([x, y, r], i) => {
    R.fill(E(x, y, r, r * .85), lin(x - r, y, x + r, y, [[0, '#e8a070'], [.6, '#9a5a3a'], [1, '#3a2218']]), { maxR: 6, group: 'hd' + i, detail: 1.5 });
    R.fill(E(x - r * .1, y - r * .45, r * 1.02, r * .55), '#2a1a12', { maxR: 6, group: 'hr' + i });
  });
}
export function drawSleepCow(R) { cowLying(R, 1.25, 640, 260, 'cowl'); }   // local plate 1200×300

// build helper
export function build(draw, w, h, scale = .5, R0 = [26, 13, 6.5, 3.2, 1.8], seed = 1, opts = {}) {
  const R = new Ref(w, h, scale); draw(R);
  const st = paintRef(R, { R: R0, T: 12, seed, ...opts });
  return { ref: R, strokes: st, w, h };
}
