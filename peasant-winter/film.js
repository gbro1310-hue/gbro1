// Tonight You Sleep With the Cow — Woodcut Print short (1080×1920)
import * as WC from './engine/index.js';
import { clamp, lerp, seg, ss, eio, eo, mulberry } from '/core/lib.js';

export const W = 1080, H = 1920;
const IMG = { x: 40, y: 40, w: 1000, h: 1560 };            // printed area; captions live in the bottom margin
const [M, m] = WC.canvas(W, H), [C, c] = WC.canvas(W, H);
let P = null;
const printer = () => P || (P = WC.makePrinter(W, H));
const COPPER = '#C8502A';

export let DUR = 62.4, EV = [], SUBS = [];
let WORDS = [], PARAS = [];
const wordT = (re, from = 0) => { const w = WORDS.find(w => w[1] >= from && re.test(w[0])); return w ? w[1] : from; };

// ---------- camera / frame ----------
function begin(cam = {}, { mirror = false } = {}) {
  m.setTransform(1, 0, 0, 1, 0, 0); c.setTransform(1, 0, 0, 1, 0, 0);
  m.fillStyle = '#fff'; m.fillRect(0, 0, W, H); c.clearRect(0, 0, W, H);
  const z = cam.z ?? 1, x = cam.x ?? 500, y = cam.y ?? 780;
  for (const g of [m, c]) {
    g.save(); g.beginPath(); g.rect(IMG.x, IMG.y, IMG.w, IMG.h); g.clip();
    if (mirror) g.setTransform(-1, 0, 0, 1, W, 0);
    g.translate(IMG.x + IMG.w / 2, IMG.y + IMG.h / 2); g.scale(z, z); g.translate(-x, -y);
  }
  m.fillStyle = '#000'; m.fillRect(-6000, -6000, 14000, 14000);
}
function end() { m.restore(); c.restore(); }
function caption(t) {
  const s = SUBS.find(s => t >= s.t0 && t < s.t1); if (!s) return;
  const a = Math.min(seg(t, s.t0, s.t0 + .1), 1 - seg(t, s.t1 - .15, s.t1));
  m.save(); m.setTransform(1, 0, 0, 1, 0, 0);
  m.font = '400 50px "IM Fell English"'; m.textAlign = 'center'; m.textBaseline = 'middle'; m.fillStyle = `rgba(0,0,0,${a})`;
  const lines = wrap(m, s.text, 960);
  const y0 = IMG.y + IMG.h + 78 - (lines.length - 1) * 30;
  lines.forEach((l, i) => m.fillText(l, W / 2, y0 + i * 60));
  m.restore();
}
function wrap(g, text, maxw) {
  const out = []; let cur = '';
  for (const w of text.split(' ')) { const tryL = cur ? cur + ' ' + w : w; if (g.measureText(tryL).width > maxw && cur) { out.push(cur); cur = w; } else cur = tryL; }
  if (cur) out.push(cur); return out;
}
function print(g, o = {}) { g.drawImage(printer().render(M, C, { plate: COPPER, ...o }), 0, 0); }

// ---------- geometry helpers ----------
const tf = (P, s, ox, oy, flip = false) => P.map(([x, y]) => [ox + (flip ? -x : x) * s, oy + y * s]);
const memo = new Map();
const once = (k, f) => { if (!memo.has(k)) memo.set(k, f()); return memo.get(k); };
const carveText = (txt, x, y, size, font = 'IM Fell English SC', reveal = 1) => {
  m.save(); m.font = `400 ${size}px "${font}"`; m.textAlign = 'center'; m.textBaseline = 'middle';
  const w = m.measureText(txt).width;
  m.beginPath(); m.rect(x - w / 2 - 10, y - size, (w + 20) * reveal, size * 2); m.clip();
  m.fillStyle = '#fff'; m.fillText(txt, x, y); m.restore();
};
const dot = (x, y, r, col = '#fff') => { m.fillStyle = col; m.beginPath(); m.arc(x, y, r, 0, Math.PI * 2); m.fill(); };

// cow, side profile facing left; feet at y=0
const COW = [[-180, -330], [-60, -345], [80, -350], [200, -345], [250, -325], [275, -285], [280, -220], [262, -170], [255, -110], [262, -4], [228, -4], [222, -100], [205, -150], [178, -172], [176, -110], [182, -4], [148, -4], [142, -110], [130, -162], [40, -156], [-80, -158], [-118, -150], [-124, -100], [-118, -4], [-150, -4], [-158, -100], [-168, -136], [-178, -108], [-174, -4], [-208, -4], [-212, -110], [-218, -170], [-234, -228], [-250, -268], [-276, -290], [-302, -302], [-346, -300], [-386, -276], [-410, -238], [-420, -206], [-402, -188], [-370, -194], [-334, -214], [-300, -234], [-268, -250], [-248, -298], [-222, -330]];
const HORN = [[-326, -298], [-338, -338], [-322, -350], [-312, -304]];
const EAR = [[-300, -292], [-262, -318], [-280, -286]];
const TAIL = [[268, -300], [292, -220], [296, -120], [284, -60]];
// lying cow (for the night plate), facing left
const COW_LIE = [[-150, -170], [0, -190], [150, -185], [250, -150], [285, -90], [270, -20], [200, 0], [-60, 0], [-170, -10], [-215, -40], [-240, -80], [-270, -120], [-300, -150], [-350, -150], [-390, -120], [-404, -88], [-380, -72], [-340, -84], [-300, -96], [-250, -110], [-215, -150]];
// sitting figure facing right, origin at seat; head separately
const SIT = [[-60, -250], [20, -255], [50, -220], [60, -150], [110, -120], [150, -100], [150, -60], [90, -50], [60, -10], [-80, -10], [-90, -120], [-80, -200]];

function cowShape(key, s, ox, oy, flip, o = {}) {
  return once(key, () => ({
    body: WC.shape([tf(COW, s, ox, oy, flip)], { light: WC.light(flip ? .5 : -.5, -.6, .35), sp: 7 * Math.max(.6, s), halo: 5 * Math.max(.6, s), R: 60 * s, seed: 3, reveal: o.reveal }),
    horn: WC.shape([tf(HORN, s, ox, oy, flip)], { white: true, sp: 3, halo: 2, R: 6 }),
    ear: WC.shape([tf(EAR, s, ox, oy, flip)], { sp: 4, halo: 3 * s, R: 10 }),
    tail: WC.cutAlong(tf(TAIL, s, ox, oy, flip), { w: 4 * s, kind: 'k', seg: [200, 400] }),
    eye: [ox + (flip ? 360 : -360) * s, oy - 262 * s, 7 * s],
  }));
}
function drawCow(cw, t) {
  cw.body.draw(m, t); cw.ear.draw(m, t); cw.horn.draw(m, t); WC.drawStrokes(m, cw.tail, { t, color: '#fff' });
  dot(cw.eye[0], cw.eye[1], cw.eye[2] * 1.7); dot(cw.eye[0], cw.eye[1], cw.eye[2] * .8, '#000');
}
function sitter(key, s, ox, oy, flip) {
  return once(key, () => ({
    body: WC.shape([tf(SIT, s, ox, oy, flip)], { light: WC.light(flip ? -.6 : .6, -.4, .3), sp: 6, halo: 4, R: 30 * s, seed: 9 }),
    head: WC.shape([WC.ellipse(ox + (flip ? 5 : -5) * s, oy - 300 * s, 40 * s, 46 * s, 40)], { white: true, sp: 4, halo: 3, R: 20 * s, lo: .45 }),
    hood: WC.shape([tf([[-48, -318], [0, -352], [44, -320], [52, -270], [30, -250], [30, -300], [-30, -300], [-44, -250]], s, ox, oy - 0, flip)], { sp: 5, halo: 2, R: 12 }),
  }));
}
function drawSitter(sh, t) { sh.body.draw(m, t); sh.head.draw(m, t); sh.hood.draw(m, t); }

function flames(cx, cy, s, t, plateA = 1) {
  const k = Math.floor(t * 12);          // fire re-cut on twos
  const rnd = mulberry(1000 + k), polys = [];
  for (let i = 0; i < 7; i++) {
    const x = cx + (i - 3) * 26 * s + (rnd() - .5) * 10 * s, h = (90 + rnd() * 110) * s * (i === 3 ? 1.4 : 1), w = (22 + rnd() * 12) * s, sway = (rnd() - .5) * 30 * s;
    polys.push([[x - w, cy], [x - w * .6, cy - h * .45], [x + sway * .5, cy - h], [x + w * .5, cy - h * .5], [x + w, cy]]);
  }
  m.fillStyle = '#fff'; m.beginPath(); for (const p of polys) WC.pathOf(m, p); m.fill('nonzero');
  // black licks inside flames
  for (let i = 0; i < 6; i++) {
    const x = cx + (rnd() - .5) * 140 * s, y = cy - rnd() * 120 * s;
    m.strokeStyle = '#000'; m.lineWidth = 3 * s; m.beginPath(); m.moveTo(x, y); m.quadraticCurveTo(x + (rnd() - .5) * 20 * s, y - 30 * s, x + (rnd() - .5) * 10 * s, y - 55 * s); m.stroke();
  }
  WC.plate(c, polys, plateA);
  WC.drawStrokes(m, WC.rays(cx, cy - 60 * s, { n: 34, r0: 150 * s, r1: [230 * s, 420 * s], w: 9 * s, seed: 7 + (k % 3), jit: .5 }), { color: '#fff' });
}
function logsAndStones(cx, cy, s) {
  return once(`stones${cx}${cy}${s}`, () => {
    const st = []; for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2; st.push(WC.ellipse(cx + Math.cos(a) * 170 * s, cy + Math.sin(a) * 52 * s, 30 * s, 20 * s, 18, a)); }
    return {
      stones: WC.shape(st, { light: WC.light(0, -.8, .4), sp: 4, halo: 3, R: 12 * s }),
      logs: WC.shape([[[cx - 130 * s, cy - 10 * s], [cx + 120 * s, cy - 40 * s], [cx + 126 * s, cy - 18 * s], [cx - 124 * s, cy + 12 * s]], [[cx - 110 * s, cy - 44 * s], [cx + 130 * s, cy + 4 * s], [cx + 120 * s, cy + 24 * s], [cx - 120 * s, cy - 22 * s]]], { dir: 0.1, sp: 4, halo: 3, R: 10 * s, light: WC.light(0, -.9, .3) }),
    };
  });
}

// ---------- plates ----------
const SH = {};
SH.eye = (t, lt, d) => {   // 1: cow head close, snap zoom and hold
  const z = lerp(1.35, 1.0, eo(seg(lt, 0, .35)));
  begin({ x: 470, y: 720, z: z * 1.15 });
  const cw = cowShape('cowBig', 2.9, 1550, 1500, false, { reveal: { t0: 0, t1: 1.4, key: (x, y) => Math.hypot(x - 506, y - 740) / 900 } });
  drawCow(cw, lt);
  WC.drawStrokes(m, once('eyeRays', () => WC.rays(506, 740, { n: 22, r0: 60, r1: [90, 150], w: 4, seed: 4 })), { t: lt });
  end();
};
SH.house = (t, lt, d) => {   // 2: longhouse down its length, pull back
  const u = eio(seg(lt, 0, d - .6));
  begin({ x: lerp(500, 500, u), y: lerp(640, 800, u), z: lerp(2.3, 1, u) });
  const VP = [500, 600];
  const S = once('house', () => {
    const floor = [[60, 1500], [940, 1500], [620, 700], [380, 700]];
    const lw = [[60, 250], [380, 470], [380, 700], [60, 1500]], rw = [[940, 250], [620, 470], [620, 700], [940, 1500]];
    const lr = [[60, 250], [500, 130], [500, 420], [380, 470]], rr = [[940, 250], [500, 130], [500, 420], [620, 470]];
    const fire = [500, 1180];
    const toneFloor = (x, y) => clamp(.25 + .8 * Math.exp(-((x - fire[0]) ** 2 + ((y - fire[1]) * 2) ** 2) / 140000), 0, 1);
    const toneWall = (x, y) => clamp(.15 + .55 * Math.exp(-((x - fire[0]) ** 2 + (y - fire[1]) ** 2) / 500000), 0, 1);
    return {
      floor: WC.hatch(new WC.Region([floor]), { dir: WC.dirRadial(...VP), tone: toneFloor, sp: 9, seed: 2 }),
      walls: WC.hatch(new WC.Region([lw, rw]), { dir: WC.dirRadial(...VP), tone: toneWall, sp: 10, seed: 3, seg: [30, 90] }),
      roofL: WC.hatch(new WC.Region([lr]), { dir: WC.dirAngle(Math.PI * .87), tone: () => .3, sp: 8, seed: 4, seg: [20, 60] }),
      roofR: WC.hatch(new WC.Region([rr]), { dir: WC.dirAngle(Math.PI * .13), tone: () => .3, sp: 8, seed: 5, seg: [20, 60] }),
      rafters: [0, .25, .5, .75, 1].flatMap((k, i) => [...WC.cutAlong([[lerp(500, 500, k), lerp(130, 420, k)], [lerp(60, 380, k), lerp(250, 470, k)]], { w: 5, kind: 'u', seed: 20 + i }), ...WC.cutAlong([[500, lerp(130, 420, k)], [lerp(940, 620, k), lerp(250, 470, k)]], { w: 5, kind: 'u', seed: 30 + i })]),
      drain: WC.cutAlong([[500, 1500], [500, 700]], { w: (u) => 22 - 16 * u, kind: 'u', seg: [80, 200], seed: 8 }),
      back: WC.hatch(new WC.Region([[[380, 470], [620, 470], [620, 700], [380, 700]]]), { dir: WC.dirAngle(0), tone: () => .12, sp: 7, seed: 6 }),
      cow1: cowShape('hcow1', .34, 450, 712, false), cow2: cowShape('hcow2', .3, 575, 705, true),
      s1: sitter('hs1', .9, 260, 1360, false), s2: sitter('hs2', .82, 740, 1380, true),
      fireSt: logsAndStones(500, 1205, .75),
      door: (() => { const arch = []; arch.push([110, 1560]); for (let i = 0; i <= 24; i++) { const a = Math.PI + i / 24 * Math.PI; arch.push([500 + Math.cos(a) * 390, 420 + Math.sin(a) * 330]); } arch.push([890, 1560]); return arch; })(),
    };
  });
  const rv = (s) => s;   // strokes drawn whole; carving reveal via clip below
  WC.drawStrokes(m, S.back, {}); WC.drawStrokes(m, S.roofL, {}); WC.drawStrokes(m, S.roofR, {}); WC.drawStrokes(m, S.walls, {}); WC.drawStrokes(m, S.floor, {});
  WC.drawStrokes(m, S.rafters, { color: '#fff' }); WC.drawStrokes(m, S.drain, { color: '#fff' });
  drawCow(S.cow1, 1e9); drawCow(S.cow2, 1e9);
  S.fireSt.stones.draw(m); S.fireSt.logs.draw(m); flames(500, 1190, .75, t);
  drawSitter(S.s1, 1e9); drawSitter(S.s2, 1e9);
  // doorway frame (frame in a frame)
  m.fillStyle = '#000'; m.beginPath(); m.rect(-200, -200, 1400, 2000); WC.pathOf(m, S.door); m.fill('evenodd');
  WC.drawStrokes(m, once('doorHalo', () => WC.cutAlong(S.door, { w: 7, kind: 'v', seg: [80, 220], seed: 12 })), { color: '#fff' });
  end();
};
SH.heat = (t, lt, d) => {   // 3: the cow as a heater
  const kHeat = wordT(/^heating/, PARAS[2][0]) - PARAS[2][0];
  begin({ x: 500, y: 860, z: lerp(1, 1.12, ss(seg(lt, 0, d))) });
  const S = once('heat', () => ({
    straw: WC.hatch(new WC.Region([[[0, 1250], [1000, 1250], [1000, 1560], [0, 1560]]]), { dir: (x, y) => .3 + Math.sin(x * .05) * .6, tone: () => .55, sp: 7, seg: [12, 40], gap: [4, 16], seed: 41 }),
    wall: WC.hatch(new WC.Region([[[0, 0], [1000, 0], [1000, 1250], [0, 1250]]]), { dir: WC.dirAngle(.04), tone: (x, y) => .08 + .1 * Math.sin(y * .02), sp: 14, seg: [40, 140], seed: 42 }),
    cow: cowShape('heatCow', 1.3, 600, 1250, false),
    rays: WC.rays(560, 830, { n: 46, r0: 470, r1: [600, 900], w: 10, bend: .5, seed: 13, reveal: { t0: 0, t1: 1.6, jit: .4 } }),
    kid: sitter('kid', .75, 170, 1330, false),
  }));
  WC.drawStrokes(m, S.wall, {});
  WC.drawStrokes(m, S.rays, { t: lt - kHeat, color: '#fff' });
  drawCow(S.cow, 1e9); WC.drawStrokes(m, S.straw, {});
  // breath clouds from the muzzle, carved (behind nothing)
  const br = (lt % 3) / 3;
  WC.drawStrokes(m, WC.cutAlong(WC.ellipse(600 - 425 * 1.3 - br * 90, 1250 - 205 * 1.3 - br * 40, 30 + br * 60, 16 + br * 26, 24), { closed: true, w: 3 * (1 - br), kind: 'v', seed: 3 }), { color: '#fff' });
  drawSitter(S.kid, 1e9);
  end();
};
SH.hearth = (t, lt, d) => {   // 4: fire, smoke to the thatch; crane up
  const u = eio(seg(lt, .8, d - .4));
  begin({ x: 500, y: lerp(1900, 820, u), z: lerp(1.05, .82, u) });
  const S = once('hearth', () => {
    const smoke = []; for (let i = 0; i < 9; i++) smoke.push(WC.ellipse(500 + Math.sin(i * 1.3) * (40 + i * 22), 1900 - i * 170, 110 + i * 28, 90 + i * 12, 40));
    return {
      thatch: WC.hatch(new WC.Region([[[-300, -200], [1300, -200], [1300, 420], [700, 520], [500, 470], [300, 520], [-300, 420]]]), { dir: (x, y) => Math.PI / 2 + (x - 500) * .0009, tone: () => .38, sp: 8, seg: [30, 90], seed: 51 }),
      hole: WC.ellipse(500, 470, 70, 34, 30),
      smoke: WC.hatch(new WC.Region(smoke), { dir: (x, y) => Math.PI / 2 + Math.sin(y * .01 + x * .004) * .8, tone: (x, y) => .35 + .25 * Math.sin(y * .006), sp: 10, seg: [30, 110], seed: 52 }),
      floor: WC.hatch(new WC.Region([[[-300, 2150], [1300, 2150], [1300, 2700], [-300, 2700]]]), { dir: WC.dirRadial(500, 2150), tone: (x, y) => clamp(.8 - Math.abs(x - 500) / 900, .1, .8), sp: 9, seed: 53 }),
      st: logsAndStones(500, 2180, 1.25),
      walls: WC.hatch(new WC.Region([[[-300, 420], [1300, 420], [1300, 2150], [-300, 2150]]]), { dir: WC.dirAngle(0), tone: (x, y) => clamp(.05 + .5 * Math.exp(-((x - 500) ** 2 + (y - 2100) ** 2) / 900000), 0, .6), sp: 12, seg: [40, 140], seed: 54 }),
    };
  });
  WC.drawStrokes(m, S.walls, {}); WC.drawStrokes(m, S.thatch, {});
  m.fillStyle = '#fff'; m.beginPath(); WC.pathOf(m, S.hole); m.fill();   // gap in the thatch: daylight / night sky
  WC.drawStrokes(m, S.smoke, { color: '#fff' });
  WC.drawStrokes(m, S.floor, {}); S.st.stones.draw(m); S.st.logs.draw(m); flames(500, 2165, 1.3, t);
  end();
};
SH.bank = (t, lt, d) => {   // 5: bury the embers in ash; colour withdraws to one ember
  begin({ x: 500, y: 900, z: lerp(1, 1.18, ss(seg(lt, 0, d))) });
  const cover = eio(seg(lt, .3, d - .6));
  const S = once('bank', () => {
    const rnd = mulberry(77), em = [];
    for (let i = 0; i < 16; i++) em.push([140 + rnd() * 720, 980 + rnd() * 300, 40 + rnd() * 50]);
    em.push([520, 1120, 80]);
    return { em, ash: WC.hatch(new WC.Region([[[0, 900], [1000, 900], [1000, 1560], [0, 1560]]]), { dir: WC.dirAngle(.1), tone: () => .7, sp: 6, seg: [10, 30], gap: [3, 10], seed: 61 }),
      shovel: WC.shape([[[-260, -70], [120, -80], [150, 80], [-250, 90]]], { light: WC.light(0, -.7, .5), sp: 6, halo: 5, R: 16, dir: 0 }),
      handle: WC.cutAlong([[110, 0], [520, -420]], { w: 30, kind: 'u', seg: [400, 600] }),
      hand: WC.shape([WC.ellipse(0, 0, 60, 40, 30)], { white: true, sp: 4, halo: 4, R: 20, lo: .5 }) };
  });
  // embers: carved white blobs with the colour plate; covered progressively from the left by ash
  const edge = lerp(-100, 1100, cover);
  for (const [x, y, r] of S.em) {
    const last = r === 80;
    const alive = last || x > edge;
    m.fillStyle = alive ? '#fff' : '#000'; m.beginPath(); m.arc(x, y, r, 0, Math.PI * 2); m.fill();
    if (alive) { m.strokeStyle = '#000'; m.lineWidth = 4; for (let k = 0; k < 3; k++) { m.beginPath(); m.arc(x, y, r * (.35 + k * .2), .3 + k, 2 + k); m.stroke(); } WC.plate(c, [WC.ellipse(x, y, r, r, 30)], last ? .9 + .1 * Math.sin(t * 6) : .85); }
  }
  // ash already pushed over (left of the edge): fine grey hatching
  m.save(); m.beginPath(); m.rect(-100, 0, edge + 100, 1560); m.clip(); WC.drawStrokes(m, S.ash, { color: '#fff' }); m.restore();
  // shovel follows the edge
  m.save(); m.translate(edge, 1060); m.rotate(-.12);
  S.shovel.draw(m); WC.drawStrokes(m, S.handle, { color: '#fff' });
  m.translate(330, -270); S.hand.draw(m); m.translate(120, -100); S.hand.draw(m);
  m.restore();
  end();
};
SH.bell = (t, lt, d) => {   // 6: couvre-feu (mirrored, on the block) → CURFEW (pulled print)
  const kCur = wordT(/^Curfew/, PARAS[5][0]) - PARAS[5][0];
  const pulled = lt >= kCur;
  const swing = Math.sin(lt * 3.1) * .18 * Math.exp(-lt * .15);
  begin({ x: 500, y: 760, z: 1 }, { mirror: !pulled });
  const S = once('bell', () => {
    const bell = [[-60, -260], [60, -260], [90, -220], [110, -120], [130, -20], [190, 70], [200, 100], [-200, 100], [-190, 70], [-130, -20], [-110, -120], [-90, -220]];
    const arch = []; for (let i = 0; i <= 24; i++) { const a = Math.PI + i / 24 * Math.PI; arch.push([500 + Math.cos(a) * 330, 520 + Math.sin(a) * 330]); } arch.push([830, 1120], [170, 1120]);
    return { bell: WC.shape([bell], { light: WC.light(.6, -.5, .45), sp: 6, halo: 5, R: 70, dir: 'contour', seed: 71 }),
      arch, sky: WC.hatch(new WC.Region([arch]), { dir: WC.dirAngle(0), tone: () => .55, sp: 9, seed: 72 }),
      stones: WC.hatch(new WC.Region([[[-200, -200], [1200, -200], [1200, 1700], [-200, 1700]]]), { dir: WC.dirAngle(0), tone: (x, y) => .15 + .1 * ((Math.floor(y / 60) + Math.floor(x / 120)) % 2), sp: 12, seg: [40, 110], seed: 73 }),
      flecks: WC.flecks(Array.from({ length: 40 }, (_, i) => [180 + (i * 97) % 640, 230 + (i * 53) % 860, 3 + (i % 3)]), { seed: 74 }) };
  });
  WC.drawStrokes(m, S.stones, {});
  m.fillStyle = '#000'; m.beginPath(); WC.pathOf(m, S.arch); m.fill();
  WC.drawStrokes(m, S.sky, {}); WC.drawStrokes(m, S.flecks, { color: '#fff' });
  m.save(); m.translate(500, 400); m.rotate(swing); m.translate(0, 230);
  WC.drawStrokes(m, WC.cutAlong([[0, -470], [0, -260]], { w: 8, kind: 'k', seed: 75 }), { color: '#fff' });
  S.bell.draw(m); dot(0, 120 + Math.sin(lt * 3.1 + 1) * 6, 22); dot(0, 120 + Math.sin(lt * 3.1 + 1) * 6, 14, '#000');
  m.restore();
  if (pulled) {
    carveText('CURFEW', 500, 1330, 150, 'IM Fell English SC', 1);
    carveText('couvre-feu  ·  cover the fire', 500, 1450, 46, 'IM Fell English', 1);
  } else {
    const kCv = wordT(/^Couvre/, PARAS[5][0]) - PARAS[5][0];
    carveText('COUVRE-FEU', 500, 1330, 120, 'IM Fell English SC', eo(seg(lt, kCv - .2, kCv + .9)));
  }
  end();
  return { mode: pulled ? 'print' : 'block', reg: pulled && lt - kCur < 2 / 24 ? [5, -3] : [0, 0], inkSeed: pulled ? 7 : 3 };
};
SH.nov = (t, lt, d) => {   // 7: hard cuts, each a new impression
  const t0 = PARAS[6][0];
  const cuts = [0, wordT(/^There/, t0) - t0, wordT(/^The$/, t0 + 1) - t0, wordT(/^blood/, t0) - t0];
  let k = 0; for (let i = 0; i < cuts.length; i++) if (lt >= cuts[i] - .05) k = i;
  begin({ x: 500, y: 780, z: 1 });
  const S = once('nov', () => ({
    floor: WC.hatch(new WC.Region([[[0, 1150], [1000, 1150], [1000, 1560], [0, 1560]]]), { dir: WC.dirAngle(.02), tone: () => .3, sp: 10, seg: [30, 100], seed: 81 }),
    cows: [cowShape('n1', .55, 230, 1150, false), cowShape('n2', .55, 560, 1160, false), cowShape('n3', .55, 890, 1150, false)],
    hay: WC.shape([[[180, 1150], [260, 900], [420, 820], [580, 830], [740, 920], [820, 1150]]], { light: WC.light(-.4, -.8, .4), sp: 6, halo: 6, R: 120, dir: (x, y) => 1.2 + Math.sin(x * .03) * .5, seg: [14, 40], gap: [3, 9], seed: 82 }),
    tub: WC.shape([[[270, 1150], [250, 820], [750, 820], [730, 1150]]], { light: WC.light(-.6, -.5, .3), sp: 7, halo: 6, R: 80, dir: Math.PI / 2, seed: 83 }),
    salt: WC.flecks(Array.from({ length: 70 }, (_, i) => [290 + (i * 61) % 420, 640 + (i * 37) % 170, 4 + (i % 3)]), { seed: 84 }),
  }));
  WC.drawStrokes(m, S.floor, {});
  if (k === 0) { S.cows.forEach(cw => drawCow(cw, 1e9)); }
  else if (k === 1) { S.hay.draw(m); carveText('HAY FOR ONE', 500, 560, 90); }
  else if (k === 2) { drawCow(S.cows[1], 1e9); carveText('ONE COW STAYS', 500, 560, 80); WC.drawStrokes(m, S.salt, { color: '#fff' }); }
  else { S.tub.draw(m); [900, 980, 1060].forEach(y => WC.drawStrokes(m, WC.cutAlong([[255, y], [745, y]], { w: 6, kind: 'v', seed: y }), { color: '#fff' }));
    carveText('BLOOD MONTH', 500, 470, 104, 'IM Fell English SC', eo(seg(lt, cuts[3], cuts[3] + .7))); carveText('Old English: Blōtmōnaþ', 500, 600, 44, 'IM Fell English', eo(seg(lt, cuts[3] + .4, cuts[3] + 1))); }
  end();
  const since = lt - cuts[k];
  return { reg: k > 0 && since < 2 / 24 ? [4, -2] : [0, 0], inkSeed: 20 + k };
};
function nightPlate(t, lt, cover = 0) {
  const S = once('night', () => {
    const blanket = [[150, 1200], [250, 1110], [400, 1090], [560, 1105], [720, 1090], [860, 1130], [920, 1210], [900, 1260], [140, 1265]];
    return {
      straw: WC.hatch(new WC.Region([[[0, 1180], [1000, 1180], [1000, 1560], [0, 1560]]]), { dir: (x, y) => .2 + Math.sin(x * .04 + y * .02) * .7, tone: () => .4, sp: 7, seg: [12, 36], gap: [4, 14], seed: 91 }),
      wall: WC.hatch(new WC.Region([[[0, 0], [1000, 0], [1000, 1180], [0, 1180]]]), { dir: WC.dirAngle(.03), tone: (x, y) => .05 + .05 * Math.sin(y * .03), sp: 16, seg: [40, 120], seed: 92 }),
      cow: WC.shape([tf(COW_LIE, 1.25, 560, 1080, false)], { light: WC.light(-.5, -.6, .3), sp: 8, halo: 6, R: 80, seed: 93 }),
      cowHorn: WC.shape([tf(HORN, 1.25, 560 + 40, 1080 + 165, false)], { white: true, sp: 3, halo: 2, R: 6 }),
      blanket: WC.shape([blanket], { light: WC.light(.3, -.8, .35), sp: 7, halo: 6, R: 60, dir: (x, y) => .1 + Math.sin(x * .02) * .3, seed: 94 }),
      heads: [[200, 1190, 46], [330, 1170, 40], [470, 1180, 30]].map(([x, y, r], i) => WC.shape([WC.ellipse(x, y, r, r * .85, 30)], { white: true, sp: 4, halo: 4, R: r * .6, lo: .45, seed: 95 + i })),
      door: [[880, 300], [1000, 300], [1000, 1000], [880, 1000]],
      snow: WC.flecks(Array.from({ length: 30 }, (_, i) => [900 + (i * 41) % 90, 320 + (i * 97) % 660, 3 + (i % 2)]), { seed: 96 }),
    };
  });
  WC.drawStrokes(m, S.wall, {});
  m.fillStyle = '#fff'; m.beginPath(); WC.pathOf(m, S.door); m.fill();   // the door gap: snow light
  for (const s of S.snow) { s.y = s.y; }
  m.save(); m.translate(0, (lt * 40) % 120); WC.drawStrokes(m, S.snow, { color: '#000' }); m.restore();
  const br = 1 + .03 * Math.sin(lt * 1.9);
  m.save(); m.translate(560, 1080); m.scale(1, br); m.translate(-560, -1080); S.cow.draw(m); m.restore();
  dot(560 - 330 * 1.25, 1080 - 110 * 1.25, 7);   // closed eye line
  m.strokeStyle = '#000'; m.lineWidth = 3; m.beginPath(); m.moveTo(560 - 340 * 1.25, 1080 - 110 * 1.25); m.lineTo(560 - 320 * 1.25, 1080 - 108 * 1.25); m.stroke();
  WC.drawStrokes(m, S.straw, {});
  S.blanket.draw(m); S.heads.forEach(h => h.draw(m));
  // closed eyes on the sleepers
  m.strokeStyle = '#000'; m.lineWidth = 3;
  [[200, 1190, 46], [330, 1170, 40], [470, 1180, 30]].forEach(([x, y, r]) => { m.beginPath(); m.arc(x + r * .2, y, r * .25, .2, Math.PI - .2); m.stroke(); });
  // banked ember, bottom left
  const ex = 110, ey = 1450;
  m.fillStyle = '#fff'; m.beginPath(); m.arc(ex, ey, 26, 0, Math.PI * 2); m.fill();
  WC.plate(c, [WC.ellipse(ex, ey, 26, 26, 24)], .8 + .2 * Math.sin(t * 2.3));
  // ink roller closing the night (ending): everything but the ember goes back to black
  if (cover > 0) {
    m.fillStyle = '#000'; m.beginPath(); m.rect(-400, -400, 1800, 400 + 2200 * cover); m.fill();
    m.fillStyle = '#fff'; m.beginPath(); m.arc(ex, ey, 26, 0, Math.PI * 2); m.fill();   // the ember stays carved
    WC.drawStrokes(m, WC.rays(ex, ey, { n: 18, r0: 34, r1: [50, 90], w: 3, seed: 98 }), { color: '#fff' });
  }
}
SH.sleep = (t, lt, d) => { begin({ x: 520, y: 1060, z: lerp(1.0, 1.25, ss(seg(lt, 0, d))) }); nightPlate(t, lt); end(); };
SH.endp = (t, lt, d) => {
  const cov = eio(seg(lt, .6, 3.4));
  begin({ x: lerp(560, 110, eio(seg(lt, 1.8, d - .4))), y: lerp(1130, 1450, eio(seg(lt, 1.8, d - .4))), z: lerp(1.25, 2.4, eio(seg(lt, 1.8, d - .4))) });
  nightPlate(t, lt + 6.5, cov); end();
};

// ---------- timeline ----------
let SHOTS = [];
export async function init() {
  WORDS = await (await fetch('words.json')).json();
  PARAS = await (await fetch('paras.json')).json();
  DUR = +(PARAS[PARAS.length - 1][1] + 1.4).toFixed(2);
  const st = i => i === 0 ? 0 : PARAS[i][0] - .3;
  const ids = ['eye', 'house', 'heat', 'hearth', 'bank', 'bell', 'nov', 'sleep', 'endp'];
  SHOTS = ids.map((id, i) => ({ id, t0: st(i), t1: i + 1 < ids.length ? st(i + 1) : DUR }));
  // subtitles: sentences, merged until each holds ≥ 1.9 s
  const sents = []; let cur = null;
  for (const w of WORDS) {
    if (!cur) cur = { t0: w[1], text: '' };
    cur.text += (cur.text ? ' ' : '') + w[0]; cur.end = w[2];
    if (/[.?!]$/.test(w[0])) { cur.para = w[3]; sents.push(cur); cur = null; }
  }
  if (cur) sents.push(cur);
  const merged = [];
  for (const s of sents) { const last = merged[merged.length - 1]; if (last && !last.para && ((last.end - last.t0 < 1.9) || (s.end - s.t0 < 1.9)) && (last.text + ' ' + s.text).length <= 90) { last.text += ' ' + s.text; last.end = s.end; last.para = s.para; } else merged.push({ ...s }); }
  SUBS = merged.map((s, i) => ({ t0: s.t0 - .05, t1: Math.min(i + 1 < merged.length ? merged[i + 1].t0 - .05 : DUR, Math.max(s.t0 + 1.9, s.end + .6)), text: s.text.replace('thirteen hundred', '1300') }));
  // sound events
  EV = [];
  SHOTS.forEach((s, i) => EV.push({ t: s.t0, type: i ? 'cut' : 'open', id: s.id }));
  EV.push({ t: SHOTS[3].t0, type: 'fireOn' }, { t: SHOTS[5].t0, type: 'fireOff' });
  const bk = SHOTS[4]; for (let x = bk.t0 + .5; x < bk.t1 - .3; x += .9) EV.push({ t: x, type: 'scrape' });
  EV.push({ t: wordT(/^Couvre/, PARAS[5][0]) - .25, type: 'bell' }, { t: wordT(/^Curfew/, PARAS[5][0]), type: 'impress' });
  const t6 = PARAS[6][0]; [wordT(/^There/, t6), wordT(/^The$/, t6 + 1), wordT(/^blood/, t6)].forEach(x => EV.push({ t: x - .05, type: 'impress' }));
  EV.push({ t: wordT(/^heating/, PARAS[2][0]), type: 'heat' });
  EV.sort((a, b) => a.t - b.t);
}
export function render(g, t) {
  const s = SHOTS.find(s => t >= s.t0 && t < s.t1) || SHOTS[SHOTS.length - 1];
  const lt = t - s.t0;
  const o = SH[s.id](t, lt, s.t1 - s.t0) || {};
  caption(t);
  const fresh = lt < 2 / 24 && s.t0 > 0 ? [3, -2] : [0, 0];
  print(g, { mode: o.mode || 'print', seed: 5, inkSeed: o.inkSeed ?? (10 + SHOTS.indexOf(s)), reg: o.reg && (o.reg[0] || o.reg[1]) ? o.reg : fresh });
  if (t < .25) { g.fillStyle = `rgba(0,0,0,${1 - t / .25})`; g.fillRect(0, 0, W, H); }
  if (t > DUR - .6) { g.fillStyle = `rgba(0,0,0,${seg(t, DUR - .6, DUR)})`; g.fillRect(0, 0, W, H); }
}
export function texts(t) {
  const s = SUBS.find(s => t >= s.t0 && t < s.t1);
  return s ? [{ id: 'sub' + SUBS.indexOf(s), text: s.text, x0: 60, y0: IMG.y + IMG.h + 20, x1: W - 60, y1: H - 40 }] : [];
}
