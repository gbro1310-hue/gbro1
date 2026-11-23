// Tonight You Sleep With the Cow — Impasto Oil Painting version (1080×1920)
import { Impasto, Strokes, KNIFE, BRUSH, DAB, hex } from './engine/impasto.js';
import * as SC from './scenes.js';
import { lerp, clamp, ss, seg, eo, eio, hash } from './common.js';

const W = 1080, H = 1920, NEVER = 1e6;
const mul = (A, B) => [A[0] * B[0] + A[2] * B[1], A[1] * B[0] + A[3] * B[1], A[0] * B[2] + A[2] * B[3], A[1] * B[2] + A[3] * B[3], A[0] * B[4] + A[2] * B[5] + A[4], A[1] * B[4] + A[3] * B[5] + A[5]];
const TR = (x, y) => [1, 0, 0, 1, x, y], SCm = (sx, sy = sx) => [sx, 0, 0, sy, 0, 0], RO = a => [Math.cos(a), Math.sin(a), -Math.sin(a), Math.cos(a), 0, 0];
const about = (px, py, a) => mul(TR(px, py), mul(RO(a), TR(-px, -py)));

let E, Pl = {}, dyn, sub, WORDS, PARAS, SHOTS, SUBS = [], EV = [], DUR = 62.4;
const wordT = (re, from = 0) => { const w = WORDS.find(w => w[1] >= from && re.test(w[0])); return w ? w[1] : from; };

const POST = {
  night: { light: [-.55, -.6, .7], lightCol: [.82, .88, 1.05], expo: .98, vig: .36, sat: 1.0, spec: .2 },
  warm: { light: [.4, .55, .72], lightCol: [1.06, .9, .74], expo: 1.0, vig: .4, sat: 1.05, spec: .18 },
  dusk: { light: [-.5, -.5, .7], lightCol: [1.0, .9, .85], expo: 1.0, vig: .3, sat: 1.0 },
};

export async function setup(canvas) {
  await document.fonts.load('600 100px "Cormorant SC"'); await document.fonts.load('500 40px "Cormorant Garamond"');
  WORDS = await (await fetch('words.json')).json(); PARAS = await (await fetch('paras.json')).json();
  E = new Impasto(canvas, { W, H, ss: 2 }); dyn = new Strokes(8192);
  const up = (b, ox = 0, oy = 0) => ({ b: E.batch(b.strokes.data()), tex: E.texture(b.ref.ctx.canvas), w: b.w, h: b.h, ox, oy });
  Pl.ext = up(SC.build(SC.drawExterior, SC.SW, SC.SH, .5, undefined, 1));
  Pl.int = up(SC.build(SC.drawInterior, SC.SW, SC.SH, .5, undefined, 2));
  Pl.cow = up(SC.build(SC.drawCow, SC.SW, SC.SH, .5, undefined, 3));
  Pl.hearth = up(SC.build(SC.drawHearth, SC.HW, SC.HH, .45, undefined, 4));
  Pl.emb = up(SC.build(SC.drawEmbers, SC.SW, SC.SH, .5, undefined, 5));
  Pl.shovel = up(SC.build(R => { R.ctx.translate(0, 300); R.idc.translate(0, 300); SC.drawShovel(R); }, 1100, 650, .6, [16, 8, 4, 2], 6));
  Pl.town = up(SC.build(SC.drawTown, SC.SW, SC.SH, .5, undefined, 7));
  Pl.bell = up(SC.build(SC.drawBell, 420, 480, .8, [10, 5, 2.5, 1.4], 8));
  Pl.hay = up(SC.build(SC.drawHay, SC.SW, SC.SH, .5, undefined, 9));
  Pl.stall = up(SC.build(SC.drawStall, SC.SW, SC.SH, .5, undefined, 10));
  Pl.cloth = up(SC.build(SC.drawCloth, SC.SW, SC.SH, .5, undefined, 11));
  Pl.sleep = up(SC.build(SC.drawSleep, SC.SW, SC.SH, .5, undefined, 12));
  Pl.scow = up(SC.build(SC.drawSleepCow, 1200, 300, .5, [20, 10, 5, 2.5], 13));
  const title = (txt, size, seed) => up(SC.build(R => SC.drawTitle(R, txt, 1000, 260, size), 1000, 260, 1, [7, 3.5, 1.8], seed, { app: (x, y) => x / 1000 * .9 }));
  Pl.tCouvre = title('COUVRE-FEU', 150, 21); Pl.tCurfew = title('CURFEW', 190, 22); Pl.tBlood = title('BLOOD MONTH', 130, 23);
  buildTimeline();
  sub = document.createElement('div');
  sub.style.cssText = 'position:fixed;left:70px;right:70px;top:1590px;text-align:center;font-family:"Cormorant Garamond",serif;font-weight:500;font-size:56px;line-height:1.12;color:#f6ead2;opacity:0;text-shadow:0 2px 10px rgba(0,0,0,.85)';
  const inner = document.createElement('span'); inner.style.cssText = 'background:rgba(18,12,8,.55);padding:8px 22px;border-radius:10px;box-decoration-break:clone;-webkit-box-decoration-break:clone';
  sub.appendChild(inner); sub.inner = inner; document.body.appendChild(sub);
  window.DUR = DUR; window.EV = EV; window.TEXTS = texts;
  return frame;
}

function plate(pl, o) {
  const M = o.M || [1, 0, 0, 1, 0, 0];
  if (!o.noUnder) E.under(pl.tex, pl.w, pl.h, { ...o, M: mul(M, TR(-pl.ox, -pl.oy)) });
  E.draw(pl.b, { ...o, M });
}
const flush = o => { if (dyn.n) E.drawNow(dyn.data(), o); dyn.clear(); };
const C = h => hex(h);

// ---- moving paint (fixed seeds per stroke so nothing boils except the fire, which re-cuts on twos)
function fire(cx, cy, s, t) {
  const k = Math.floor(t * 12);
  for (let i = 0; i < 34; i++) {
    const r = hash(k * 31 + i), r2 = hash(k * 17 + i * 3), x = cx + (r - .5) * 230 * s, h = (80 + r2 * 160) * s * (1.1 - Math.abs(r - .5) * 1.4);
    dyn.push({ x, y: cy - h * .45, ang: -Math.PI / 2 + (r2 - .5) * .7, len: h, wid: (34 + r * 26) * s, c: C(['#d8481a', '#f08a2a', '#ffd36a'][i % 3]), c2: C(i % 2 ? '#ffe9a8' : '#f0a040'), type: KNIFE, taper: .96, seed: i, hgt: .6 });
  }
  for (let i = 0; i < 10; i++) dyn.push({ x: cx + (hash(i * 7) - .5) * 260 * s, y: cy + (hash(i * 5) - .5) * 30 * s, len: 26 * s, wid: 22 * s, c: C('#ffb04a'), type: DAB, seed: 40 + i });
}
function smoke(cx, cy, top, t, n = 26) {
  for (let i = 0; i < n; i++) {
    const ph = (t * .09 + hash(i)) % 1, y = lerp(cy, top, ph), sw = Math.sin(ph * 6 + i) * (30 + ph * 140);
    for (let j = 0; j < 3; j++) dyn.push({ x: cx + sw + (hash(i * 3 + j) - .5) * (40 + ph * 120), y: y + (hash(i * 5 + j) - .5) * 60, len: 70 + ph * 150, wid: 60 + ph * 130, c: C('#7a726c'), c2: C('#a49a92'), type: DAB, alpha: .16 * Math.sin(Math.PI * ph), seed: 60 + i * 3 + j, hgt: .15 });
  }
}
function snow(t, n = 140, speed = 70, seed = 0) {
  for (let i = 0; i < n; i++) {
    const x = hash(i * 13 + seed) * W, y = ((hash(i * 7 + seed) * H + t * speed * (.6 + hash(i) * .8)) % H), sz = 4 + hash(i * 3) * 7;
    dyn.push({ x: x + Math.sin(t + i) * 12, y, len: sz, wid: sz, c: C('#eef2ff'), type: DAB, seed: 100 + i, alpha: .85, hgt: .5 });
  }
}

// ---- shots
const SH = {};
SH.ext = (t, lt, d) => {
  const z = lt < 1.6 ? lerp(3.2, 1.0, eio(lt / 1.6)) : lerp(1.0, 1.35, eio(seg(lt, 1.8, d)));
  const cam = lt < 1.6 ? { x: lerp(430, 600, eio(lt / 1.6)), y: lerp(1180, 1180, 0), zoom: z } : { x: 605, y: lerp(1180, 1430, eio(seg(lt, 1.8, d))), zoom: z };
  plate(Pl.ext, { t, cam, grey: 0 });
  smoke(600, 1030, 600, t, 18); flush({ t, cam, grey: 0, run: .3 });
  snow(t); flush({ t, grey: 0, hgt: .4 });
  return POST.night;
};
SH.int = (t, lt, d) => {
  const u = eio(seg(lt, 0, d));
  const cam = { x: 600, y: lerp(1050, 1220, u), zoom: lerp(1.55, 1.03, u) };
  plate(Pl.int, { t, cam, grey: 0 });
  fire(600, 1600, .7, t); flush({ t, cam, grey: 0, run: .2 });
  smoke(600, 1560, 500, t, 12); flush({ t, cam, grey: 0 });
  return POST.warm;
};
SH.cow = (t, lt, d) => {
  const kHeat = wordT(/^heating/, PARAS[2][0]);
  const cam = { x: lerp(560, 600, ss(lt / d)), y: lerp(1200, 1160, ss(lt / d)), zoom: lerp(1.05, 1.2, ss(lt / d)) };
  plate(Pl.cow, { t, cam, grey: 1, reveal: kHeat, revC: [640, 1100, 700] });
  // breath from the muzzle
  const br = (lt % 3.2) / 3.2, mx = 640 - 425 * 1.32, my = 1460 - 210 * 1.32;
  if (br < .7) for (let i = 0; i < 5; i++) dyn.push({ x: mx - 30 - br * 140 - i * 16, y: my - br * 40 + Math.sin(i) * 10, len: 50 + br * 90, wid: 30 + br * 50, c: C('#d8d4cc'), type: BRUSH, alpha: .3 * (1 - br / .7), seed: 200 + i, hgt: .2 });
  flush({ t, cam, grey: t < kHeat ? 1 : 0, reveal: NEVER });
  return t < kHeat ? POST.night : POST.warm;
};
SH.hearth = (t, lt, d) => {
  const u = eio(seg(lt, .6, d - .3));
  const cam = { x: 600, y: lerp(2700, 980, u), zoom: lerp(1.08, .98, u) };
  plate(Pl.hearth, { t, cam, grey: 0 });
  smoke(600, 2760, 660, t, 34); flush({ t, cam, grey: 0 });
  fire(600, 2790, 1.25, t); flush({ t, cam, grey: 0, run: .2 });
  return POST.warm;
};
// ash strokes: precomputed, laid when the shovel passes
let ASH = null;
SH.emb = (t, lt, d) => {
  const cam = { x: 600, y: 1300, zoom: lerp(1.0, 1.22, ss(lt / d)) };
  const edge = lerp(-100, 1250, eio(seg(lt, .3, d - .5)));
  plate(Pl.emb, { t, cam, grey: 0 });
  if (!ASH) { ASH = []; for (let i = 0; i < 900; i++) { const x = 100 + hash(i * 5) * 1000, y = 1000 + hash(i * 9) * 620; if (Math.hypot(x - 640, y - 1330) < 70) continue; ASH.push({ x, y, ang: (hash(i) - .5) * .5, len: 34 + hash(i * 2) * 36, wid: 22 + hash(i * 3) * 20, c: C(hash(i * 4) > .5 ? '#5a5450' : '#726c66'), c2: C('#3e3a38'), type: KNIFE, seed: 300 + i, hgt: .55 }); } }
  for (const a of ASH) if (a.x < edge) dyn.push(a);
  flush({ t, cam, grey: 0, run: .5 });
  // the one ember that stays
  const gl = .85 + .15 * Math.sin(t * 5);
  dyn.push({ x: 640, y: 1330, len: 70, wid: 60, c: C('#ff9a3a'), c2: C('#ffe08a'), type: DAB, seed: 400, alpha: gl }); flush({ t, cam, grey: 0 });
  plate(Pl.shovel, { t, cam, grey: 0, M: mul(TR(edge - 170, 1260 - 300), SCm(.55)), noUnder: true });
  return POST.warm;
};
SH.town = (t, lt, d) => {
  const t0 = SHOTS.find(s => s.id === 'town').t0;
  const kCv = wordT(/^Couvre/, PARAS[5][0]), kCur = wordT(/^Curfew/, PARAS[5][0]);
  const cam = { x: 600, y: 1100, zoom: 1.0 };
  plate(Pl.town, { t, cam, grey: 0 });
  const sw = t > kCv - .3 ? Math.sin((t - kCv + .3) * 3.2) * .22 * Math.exp(-(t - kCv) * .2) : 0;
  plate(Pl.bell, { t, cam, grey: 0, M: mul(TR(600 - 200, 560 - 40), about(200, 40, sw)), noUnder: true });
  snow(t, 60, 50, 7); flush({ t, grey: 0, hgt: .4 });
  const scrape = seg(t, kCur - .25, kCur);
  if (t < kCur) plate(Pl.tCouvre, { t, cam: { x: W / 2, y: H / 2, zoom: 1 }, M: TR(40, 1180), grey: 0, appear: kCv - .15, appDur: .12, alpha: 1 - scrape, noUnder: true });
  else plate(Pl.tCurfew, { t, cam: { x: W / 2, y: H / 2, zoom: 1 }, M: TR(40, 1160), grey: 0, appear: kCur, appDur: .1, noUnder: true });
  return POST.dusk;
};
SH.nov = (t, lt, d) => {
  const t0 = PARAS[6][0];
  const cuts = [SHOTS.find(s => s.id === 'nov').t0, wordT(/^There/, t0) - .1, wordT(/^The$/, t0 + 1) - .1];
  let k = 0; cuts.forEach((c, i) => { if (t >= c) k = i; });
  const since = t - cuts[k], whip = k > 0 ? (1 - eo(seg(since, 0, .22))) * 900 : 0;
  const cam = { x: 600 + whip, y: 1150, zoom: 1.02 };
  const pl = [Pl.hay, Pl.stall, Pl.cloth][k];
  plate(pl, { t, cam, grey: 0 });
  if (k === 0) { snow(t, 90, 60, 3); flush({ t, grey: 0, hgt: .4 }); }
  if (k === 2) { const kB = wordT(/^blood/, t0); plate(Pl.tBlood, { t, cam: { x: W / 2, y: H / 2, zoom: 1 }, M: TR(40, 560), grey: 0, appear: kB - .1, appDur: .12, noUnder: true }); }
  return k === 2 ? POST.warm : POST.night;
};
function sleepPlate(t, lt, cam, dark = 0) {
  plate(Pl.sleep, { t, cam, grey: 0 });
  const br = 1 + .025 * Math.sin(t * 1.9);
  plate(Pl.scow, { t, cam, grey: 0, M: mul(TR(0, 1180), mul(TR(640, 260), mul(SCm(1, br), TR(-640, -260)))) });
  // re-lay the near sleepers over the cow (draw blanket plate again is costly: the blanket sits lower than the cow, so order is fine)
  snow(t, 30, 40, 11); dyn.n = 0;   // (snow only through the door: skipped indoors for calm)
  // dark: a black knife plane over everything, then the ember on top
  if (dark > 0) { dyn.push({ x: W / 2, y: H / 2, len: 2600, wid: 2600, c: [0, 0, 0], type: DAB, seed: 9, alpha: dark, hgt: 0 }); flush({ t, grey: 0, run: 0 }); }
  const gl = .8 + .2 * Math.sin(t * 2.3);
  const ex = 130, ey = 1700;
  const sx = (ex - cam.x) * cam.zoom + W / 2, sy = (ey - cam.y) * cam.zoom + H / 2;
  dyn.push({ x: sx, y: sy, len: 46 * cam.zoom, wid: 40 * cam.zoom, c: C('#ff8a2a'), c2: C('#ffdc8a'), type: DAB, seed: 500, alpha: gl });
  for (let i = 0; i < 6; i++) dyn.push({ x: sx + (hash(i) - .5) * 60 * cam.zoom, y: sy + (hash(i + 3) - .5) * 24 * cam.zoom, len: 16 * cam.zoom, wid: 14 * cam.zoom, c: C('#c84a1a'), type: DAB, seed: 510 + i, alpha: .8 });
  flush({ t, grey: 0 });
}
SH.sleep = (t, lt, d) => { const cam = { x: 600, y: lerp(1300, 1360, ss(lt / d)), zoom: lerp(1.0, 1.12, ss(lt / d)) }; sleepPlate(t, lt, cam); return POST.night; };
SH.endp = (t, lt, d) => {
  const u = eio(seg(lt, .3, d - .3));
  const cam = { x: lerp(600, 330, u), y: lerp(1360, 1560, u), zoom: lerp(1.12, 1.6, u) };
  sleepPlate(t, lt, cam, ss(seg(lt, .4, 3.6)) * .96);
  const p = POST.night; const k = seg(lt, .4, 3.6);
  return { ...p, light: [lerp(-.55, -.95, k), lerp(-.6, -.15, k), lerp(.7, .18, k)] };   // raking light sinks
};

function buildTimeline() {
  DUR = +(PARAS[PARAS.length - 1][1] + 1.4).toFixed(2);
  const st = i => i === 0 ? 0 : PARAS[i][0] - .3;
  const ids = ['ext', 'int', 'cow', 'hearth', 'emb', 'town', 'nov', 'sleep', 'endp'];
  SHOTS = ids.map((id, i) => ({ id, t0: st(i), t1: i + 1 < ids.length ? st(i + 1) : DUR }));
  const sents = []; let cur = null;
  for (const w of WORDS) { if (!cur) cur = { t0: w[1], text: '' }; cur.text += (cur.text ? ' ' : '') + w[0]; cur.end = w[2]; if (/[.?!]$/.test(w[0])) { cur.para = w[3]; sents.push(cur); cur = null; } }
  const mg = [];
  for (const s of sents) { const l = mg[mg.length - 1]; if (l && !l.para && ((l.end - l.t0 < 1.9) || (s.end - s.t0 < 1.9)) && (l.text + ' ' + s.text).length <= 90) { l.text += ' ' + s.text; l.end = s.end; l.para = s.para; } else mg.push({ ...s }); }
  SUBS = mg.map((s, i) => ({ t0: Math.max(0, s.t0 - .05), t1: Math.min(i + 1 < mg.length ? mg[i + 1].t0 - .05 : DUR, Math.max(s.t0 + 1.9, s.end + .6)), text: s.text.replace('thirteen hundred', '1300') }));
  EV.length = 0;
  SHOTS.forEach((s, i) => EV.push({ t: s.t0, type: i ? 'cut' : 'open', id: s.id }));
  EV.push({ t: SHOTS[3].t0, type: 'fireOn' }, { t: SHOTS[5].t0, type: 'fireOff' });
  const bk = SHOTS[4]; for (let x = bk.t0 + .5; x < bk.t1 - .3; x += .9) EV.push({ t: x, type: 'scrape' });
  EV.push({ t: wordT(/^Couvre/, PARAS[5][0]) - .25, type: 'bell' }, { t: wordT(/^Curfew/, PARAS[5][0]), type: 'impress' });
  const t6 = PARAS[6][0]; [wordT(/^There/, t6), wordT(/^The$/, t6 + 1), wordT(/^blood/, t6)].forEach(x => EV.push({ t: x - .1, type: 'impress' }));
  EV.push({ t: wordT(/^heating/, PARAS[2][0]), type: 'heat' });
  EV.sort((a, b) => a.t - b.t);
}
function texts(t) { const s = SUBS.find(s => t >= s.t0 && t < s.t1); return s ? [{ id: 'sub' + SUBS.indexOf(s), text: s.text, x0: 70, y0: 1590, x1: W - 70, y1: 1820 }] : []; }

function frame(t) {
  const s = SHOTS.find(s => t >= s.t0 && t < s.t1) || SHOTS[SHOTS.length - 1];
  E.begin([.08, .06, .05]);
  const post = SH[s.id](t, t - s.t0, s.t1 - s.t0) || {};
  const fade = Math.min(seg(t, 0, .3), 1 - seg(t, DUR - .6, DUR));
  E.finish({ ...post, expo: (post.expo ?? 1) * fade });
  const c = SUBS.find(x => t >= x.t0 && t < x.t1);
  if (c) { sub.inner.textContent = c.text; sub.style.opacity = Math.min(seg(t, c.t0, c.t0 + .12), 1 - seg(t, c.t1 - .15, c.t1)); } else sub.style.opacity = 0;
}
