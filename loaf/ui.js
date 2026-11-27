// 2D overlay for a 9:16 Short (1080×1920): place card, the penny-loaf weight meter, the assize panel, the three penalties, subtitles, title, fades.
import { T, SHOTS, DUR } from './story.js';

const cv = document.getElementById('ov'), g = cv.getContext('2d');
const W = 1080, H = 1920;
let SUBS = [];
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const seg = (t, a, b) => clamp((t - a) / (b - a));
const ss = x => { x = clamp(x); return x * x * (3 - 2 * x); };
const GOLD = '#e2c989', PARCH = '#f6f0e2', DIM = 'rgba(244,239,228,.72)';
const FR = { cin: n => `500 ${n}px Cinzel`, cinB: n => `700 ${n}px Cinzel`, it: n => `italic 500 ${n}px "Cormorant Garamond"`, sb: n => `600 ${n}px "Cormorant Garamond"`, rg: n => `500 ${n}px "Cormorant Garamond"` };

export async function overlayReady() {
  await Promise.all(['500 40px Cinzel', '700 40px Cinzel', 'italic 500 40px "Cormorant Garamond"', '600 40px "Cormorant Garamond"', '500 40px "Cormorant Garamond"'].map(f => document.fonts.load(f)));
  SUBS = await (await fetch('subs.json')).json();
}
const fadeIO = (t, a, b, d = .35) => ss(seg(t, a, a + d)) * (1 - ss(seg(t, b - d, b)));
function ornament(cx, y, w, a) {
  g.save(); g.globalAlpha *= a; g.fillStyle = GOLD; g.lineWidth = 1.5;
  for (const s of [-1, 1]) {
    const gr = g.createLinearGradient(cx, 0, cx + s * w, 0); gr.addColorStop(0, 'rgba(226,201,137,1)'); gr.addColorStop(1, 'rgba(226,201,137,0)');
    g.strokeStyle = gr; g.beginPath(); g.moveTo(cx + s * 16, y); g.lineTo(cx + s * w, y); g.stroke(); g.beginPath(); g.arc(cx + s * 26, y, 2.5, 0, 7); g.fill();
  }
  g.strokeStyle = '#c9a863'; g.beginPath(); g.moveTo(cx, y - 8); g.lineTo(cx + 8, y); g.lineTo(cx, y + 8); g.lineTo(cx - 8, y); g.closePath(); g.stroke();
  g.beginPath(); g.moveTo(cx, y - 3.5); g.lineTo(cx + 3.5, y); g.lineTo(cx, y + 3.5); g.lineTo(cx - 3.5, y); g.closePath(); g.fill();
  g.restore();
}
function spaced(text, x, y, sp) { const ws = [...text].map(c => g.measureText(c).width), tot = ws.reduce((a, b) => a + b, 0) + sp * (ws.length - 1); let cx = x - tot / 2; [...text].forEach((c, i) => { g.fillText(c, cx + ws[i] / 2, y); cx += ws[i] + sp; }); }
function glowText(fn, col, blur) { g.save(); g.shadowColor = col; g.shadowBlur = blur; fn(); g.restore(); fn(); }
function wrap(text, maxW) { const words = text.split(' '), lines = []; let cur = ''; for (const w of words) { const n = cur ? cur + ' ' + w : w; if (g.measureText(n).width > maxW && cur) { lines.push(cur); cur = w; } else cur = n; } if (cur) lines.push(cur); return lines; }
function band(y, h, a) { const sh = g.createLinearGradient(0, y - h / 2, 0, y + h / 2); sh.addColorStop(0, 'rgba(0,0,0,0)'); sh.addColorStop(.5, `rgba(0,0,0,${.48 * a})`); sh.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = sh; g.fillRect(0, y - h / 2, W, h); }
function plate(x, y, w, h) {
  const bgr = g.createLinearGradient(0, y, 0, y + h); bgr.addColorStop(0, 'rgba(14,18,34,.88)'); bgr.addColorStop(1, 'rgba(6,8,18,.93)');
  g.fillStyle = bgr; g.fillRect(x, y, w, h);
  g.strokeStyle = 'rgba(214,190,130,.9)'; g.lineWidth = 2; g.strokeRect(x + .5, y + .5, w - 1, h - 1);
  g.strokeStyle = 'rgba(214,190,130,.35)'; g.lineWidth = 1; g.strokeRect(x + 7.5, y + 7.5, w - 15, h - 15);
  for (const [cx, cy] of [[x, y], [x + w, y], [x, y + h], [x + w, y + h]]) { g.fillStyle = GOLD; g.beginPath(); g.moveTo(cx, cy - 7); g.lineTo(cx + 7, cy); g.lineTo(cx, cy + 7); g.lineTo(cx - 7, cy); g.fill(); }
}
function nameTag(x, y, who) { g.font = FR.sb(34); const nw = g.measureText(who).width + 52; g.fillStyle = 'rgba(10,12,24,.96)'; g.fillRect(x, y - 26, nw, 50); g.strokeStyle = 'rgba(214,190,130,.9)'; g.lineWidth = 1.5; g.strokeRect(x + .5, y - 25.5, nw - 1, 49); g.fillStyle = '#e8d5a4'; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText(who, x + 26, y - 1); }
function mark(kind, x, y, a = 1, s = 1) {
  g.save(); g.globalAlpha *= a; g.lineWidth = 6 * s; g.lineCap = 'square';
  if (kind === 'ok') { g.strokeStyle = '#9ad06a'; g.beginPath(); g.moveTo(x - 13 * s, y); g.lineTo(x - 4 * s, y + 10 * s); g.lineTo(x + 15 * s, y - 12 * s); g.stroke(); }
  if (kind === 'no') { g.strokeStyle = '#e0574a'; g.beginPath(); g.moveTo(x - 12 * s, y - 12 * s); g.lineTo(x + 12 * s, y + 12 * s); g.moveTo(x + 12 * s, y - 12 * s); g.lineTo(x - 12 * s, y + 12 * s); g.stroke(); }
  g.restore();
}

// —— building blocks ——
function card(t, a0t, outT, label, name) {
  const a0 = ss(seg(t, a0t, a0t + .8)), a1 = ss(seg(t, a0t + .5, a0t + 1.3)), out = 1 - ss(seg(t, outT - .6, outT));
  if (a0 * out <= 0) return;
  g.save(); band(330, 300, a0 * out); g.textAlign = 'center'; g.textBaseline = 'middle';
  g.globalAlpha = a0 * out; g.fillStyle = '#d8c28e'; g.font = FR.cin(48); glowText(() => spaced(label, W / 2, 292, 16), 'rgba(0,0,0,.8)', 12);
  ornament(W / 2, 340, 220 * (.4 + .6 * a0), a0 * out);
  if (name) { g.globalAlpha = a1 * out; g.fillStyle = '#f3ead6'; g.font = FR.it(66); glowText(() => g.fillText(name, W / 2, 398 - (1 - a1) * 10), 'rgba(0,0,0,.85)', 16); }
  g.restore();
}
function dialog(t, tin, tout, who, text, typeA, typeB, y0 = 250, h = 230) {
  const a = fadeIO(t, tin, tout); if (a <= 0) return;
  const bw = 940, x = (W - bw) / 2, y = y0 + (1 - a) * 14;
  g.save(); g.globalAlpha = a; plate(x, y, bw, h); nameTag(x + 36, y, who);
  g.font = FR.rg(52); g.fillStyle = '#f4efe4'; g.textAlign = 'left'; g.textBaseline = 'middle';
  const n = text.length, shown = Math.floor(n * clamp((t - typeA) / (typeB - typeA)));
  const lines = wrap(text, bw - 130); let k = shown;
  lines.forEach((L, i) => { const s = L.slice(0, Math.max(0, k)); k -= L.length + 1; g.fillText(s, x + 64, y + 84 + i * 64); });
  if (shown >= n && Math.floor(t * 2.5) % 2 === 0) { g.fillStyle = GOLD; const tx = x + bw - 52, ty = y + h - 36; g.beginPath(); g.moveTo(tx - 9, ty - 5); g.lineTo(tx + 9, ty - 5); g.lineTo(tx, ty + 6); g.fill(); }
  g.restore();
}
// the weight meter: required weight vs this loaf
function weighPanel(t, tin, tout, k) {
  const a = fadeIO(t, tin, tout, .3); if (a <= 0) return;
  const bw = 760, bh = 230, x = (W - bw) / 2, y = 250 + (1 - a) * 14;
  g.save(); g.globalAlpha = a; plate(x, y, bw, bh);
  g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#d8c28e'; g.font = FR.cin(32); spaced('THE PENNY LOAF', W / 2, y + 48, 8);
  const bx = x + 70, bwid = bw - 140, by = y + 108;
  g.fillStyle = 'rgba(255,255,255,.1)'; g.fillRect(bx, by, bwid, 26);
  const gr = g.createLinearGradient(bx, 0, bx + bwid, 0); gr.addColorStop(0, '#ffe2a0'); gr.addColorStop(1, '#c8942c'); g.fillStyle = gr; g.fillRect(bx, by, bwid * k, 26);
  g.strokeStyle = '#f4efe4'; g.lineWidth = 3; g.beginPath(); g.moveTo(bx + bwid, by - 14); g.lineTo(bx + bwid, by + 40); g.stroke();
  g.font = FR.it(34); g.textAlign = 'right'; g.fillStyle = DIM; g.fillText('the law', bx + bwid, by + 66);
  g.textAlign = 'left';
  if (k < .995) { g.fillStyle = '#ef8a7e'; g.font = FR.sb(40); g.fillText('a little too light', bx, by + 66); g.fillStyle = 'rgba(224,87,74,.55)'; g.fillRect(bx + bwid * k, by, bwid * (1 - k), 26); }
  else { g.fillStyle = '#9ad06a'; g.font = FR.sb(40); g.fillText('full weight', bx, by + 66); mark('ok', bx + bwid - 160, by + 66, 1, .9); }
  g.restore();
}
// the assize: grain price up → loaf weight down
function assize(t) {
  const a = fadeIO(t, T.weighs - .3, 20.1, .4); if (a <= 0) return;
  const bw = 900, x = (W - bw) / 2, y = 220 + (1 - a) * 14, bh = 420;
  g.save(); g.globalAlpha = a; plate(x, y, bw, bh);
  g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#d8c28e'; g.font = FR.cin(34); spaced('THE ASSIZE OF BREAD', W / 2, y + 52, 8); ornament(W / 2, y + 92, 220, 1);
  const k = .5 + .5 * Math.sin((t - T.grain) * 1.6) * ss(seg(t, T.grain - .2, T.grain + .6));
  const rows = [['Price of grain', k, T.grain - .3, '#c8942c'], ['Weight of a penny loaf', 1 - k * .7, T.heavy - .3, '#ffe2a0']];
  rows.forEach(([n, v, at, col], i) => {
    const ra = ss(seg(t, at, at + .3)); if (ra <= 0) return; const ry = y + 150 + i * 100;
    g.globalAlpha = a * ra; g.textAlign = 'left'; g.font = FR.rg(46); g.fillStyle = '#f4efe4'; g.fillText(n, x + 60, ry);
    g.fillStyle = 'rgba(255,255,255,.08)'; g.fillRect(x + 60, ry + 30, bw - 120, 18); g.fillStyle = col; g.fillRect(x + 60, ry + 30, (bw - 120) * (.2 + .8 * v), 18);
  });
  const ca = ss(seg(t, T.men - .2, T.men + .3)); if (ca > 0) { g.globalAlpha = a * ca; g.textAlign = 'center'; g.font = FR.it(44); g.fillStyle = GOLD; g.fillText('and men come to check', W / 2, y + bh - 50); }
  g.restore();
}
// pixel icons for the three penalties
function icon(kind, cx, cy, s, a) {
  g.save(); g.globalAlpha *= a; g.translate(cx, cy); const P = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x * s, y * s, w * s, h * s); };
  if (kind === 'hurdle') {   // a wattle sledge, a man lying on it, a loaf at his neck, a rope pulling
    for (let i = -10; i <= 10; i += 3) P(i, -2, 1, 8, '#7a5428'); P(-11, -1, 23, 1, '#a8783a'); P(-11, 3, 23, 1, '#a8783a');
    P(-8, -4, 12, 3, '#3e5a8a'); P(4, -5, 4, 4, '#e9b896'); P(3, -1, 3, 3, '#cc8a44'); P(12, 0, 6, 1, '#d8c28e');
  }
  if (kind === 'pillory') {  // a post, a board with head and hands through it
    P(-1, -2, 2, 14, '#7a5428'); P(-9, -5, 18, 3, '#a8783a'); P(-2, -9, 4, 4, '#e9b896'); P(-7, -5, 2, 2, '#e9b896'); P(5, -5, 2, 2, '#e9b896'); P(-3, -2, 6, 7, '#3e5a8a'); P(-5, 12, 10, 1, '#5a4030');
  }
  if (kind === 'oven') {     // a brick dome with a red cross over it
    for (let y = -6; y <= 4; y++) { const w = Math.round(Math.sqrt(Math.max(0, 49 - (y + 1) ** 2 * .9))); P(-w, y, 2 * w, 1, (y % 2 ? '#a85434' : '#843c24')); }
    P(-2, 1, 4, 3, '#1a0e0a'); P(-9, 4, 18, 2, '#5e2a1a');
  }
  g.restore();
  if (kind === 'oven') mark('no', cx, cy, a, 1.6);
}
function penalties(t) {
  const a = fadeIO(t, T.first - .4, 44.2, .4); if (a <= 0) return;
  const bw = 940, x = (W - bw) / 2, y = 180 + (1 - a) * 14, bh = 660;
  g.save(); g.globalAlpha = a; plate(x, y, bw, bh);
  g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#d8c28e'; g.font = FR.cin(32); spaced('IF THE BREAD IS SHORT', W / 2, y + 50, 8); ornament(W / 2, y + 88, 220, 1);
  const rows = [['1st time', 'Dragged on a hurdle', 'the light loaf at his neck', 'hurdle', T.first, T.neck], ['2nd time', 'The pillory', 'one hour, in front of everyone', 'pillory', T.second, T.hour], ['3rd time', 'His oven pulled down', 'and never to bake in the city again', 'oven', T.third, T.never]];
  rows.forEach(([n, h, sub, ic, at, at2], i) => {
    const ra = ss(seg(t, at - .3, at + .2)); if (ra <= 0) return; const ry = y + 170 + i * 165;
    const cur = (i === 2 || t < rows[i + 1][4]) ? 1 : .55;
    g.globalAlpha = a * ra * cur;
    g.fillStyle = 'rgba(226,201,137,.08)'; g.fillRect(x + 30, ry - 66, bw - 60, 140);
    icon(ic, x + 130, ry, 5.5, 1);
    g.textAlign = 'left'; g.font = FR.cin(28); g.fillStyle = '#d8c28e'; g.fillText(n.toUpperCase(), x + 250, ry - 40);
    g.font = FR.sb(50); g.fillStyle = '#f4efe4'; g.fillText(h, x + 250, ry + 6);
    const sa = ss(seg(t, at2 - .3, at2 + .2)); g.globalAlpha = a * ra * cur * sa; g.font = FR.it(38); g.fillStyle = i === 2 ? '#ef8a7e' : GOLD; g.fillText(sub, x + 250, ry + 52);
  });
  g.restore();
}
function bigCenter(t, tin, tout, top, big, sub) {
  const a = fadeIO(t, tin, tout, .3); if (a <= 0) return;
  const s = 1 + .08 * (1 - ss(seg(t, tin, tin + .5))), cy = 560;
  g.save(); band(cy, 520, a); g.globalAlpha = a; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillStyle = '#d8c28e'; g.font = FR.cin(40); spaced(top, W / 2, cy - 140, 12);
  g.translate(W / 2, cy - 10); g.scale(s, s);
  const gr = g.createLinearGradient(0, -90, 0, 70); gr.addColorStop(0, '#fff3cf'); gr.addColorStop(.55, '#e2c27c'); gr.addColorStop(1, '#a8803e');
  g.fillStyle = gr; g.font = FR.cinB(170); glowText(() => spaced(big, 0, 0, 12), 'rgba(255,200,120,.5)', 36);
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.font = FR.it(54); g.fillStyle = '#f3ead6'; glowText(() => g.fillText(sub, W / 2, cy + 120), 'rgba(0,0,0,.8)', 10);
  g.restore();
}
function subtitles(t) {
  for (const s of SUBS) {
    const a = ss(seg(t, s.t, s.t + .12)) * (1 - ss(seg(t, s.out - .1, s.out))); if (a <= 0) continue;
    g.save(); g.globalAlpha = a; g.textAlign = 'center'; g.textBaseline = 'alphabetic'; g.font = FR.it(62);
    const lines = wrap(s.sub, 880), y0 = 1500 - (lines.length - 1) * 34;
    band(y0 + (lines.length - 1) * 34 - 18, 130 + lines.length * 62, 1);
    g.shadowColor = 'rgba(0,0,0,.95)'; g.shadowBlur = 12; g.shadowOffsetY = 2; g.fillStyle = PARCH;
    lines.forEach((L, i) => g.fillText(L, W / 2, y0 + i * 70));
    g.restore();
  }
}
function title(t) {
  const a = ss(seg(t, T.title, T.title + 1.1)), out = 1 - ss(seg(t, DUR - 1.0, DUR - .4)); if (a * out <= 0) return;
  g.save(); g.textAlign = 'center'; g.textBaseline = 'middle'; band(560, 560, a * out);
  g.globalAlpha = a * out; g.font = FR.cinB(104);
  const gr = g.createLinearGradient(0, 430, 0, 660); gr.addColorStop(0, '#fff3cf'); gr.addColorStop(.55, '#e2c27c'); gr.addColorStop(1, '#a8803e');
  g.fillStyle = gr; glowText(() => { spaced('A LIGHT', W / 2, 470, 14); spaced('LOAF', W / 2, 590, 14); }, 'rgba(255,200,120,.5)', 34);
  ornament(W / 2, 668, 260 * (.3 + .7 * a), a * out);
  const b = ss(seg(t, T.title + .8, T.title + 1.6)); g.globalAlpha = b * out; g.font = FR.it(52); g.fillStyle = '#f3ead6';
  glowText(() => g.fillText('Ordinary Lives · London, c. 1300', W / 2, 736), 'rgba(0,0,0,.8)', 10);
  const c = ss(seg(t, T.title + 1.6, T.title + 2.4)); g.globalAlpha = c * out; g.font = FR.cin(30); g.fillStyle = '#d8c28e';
  spaced('ONE ORDINARY LIFE AT A TIME', W / 2, 812, 5);
  g.restore();
}
const CUTS = SHOTS.slice(1).map(s => s.a);
function blackout(t) {
  let a = 1 - ss(seg(t, 0, .5));
  for (const c of CUTS) { const o = .18, i = .22; if (t < c && t > c - o) a = Math.max(a, ss((t - (c - o)) / o)); if (t >= c && t < c + i) a = Math.max(a, 1 - ss((t - c) / i)); }
  a = Math.max(a, ss(seg(t, DUR - .6, DUR - .05)));
  if (a > 0) { g.fillStyle = `rgba(0,0,0,${a})`; g.fillRect(0, 0, W, H); }
}

export function drawOverlay(t) {
  g.clearRect(0, 0, W, H);
  card(t, T.cardIn, 7.4, 'LONDON', 'the early 1300s');
  weighPanel(t, 8.0, 10.9, .9);
  assize(t);
  penalties(t);
  weighPanel(t, T.back, 48.7, .9 + .1 * ss(seg(t, T.dough + .1, T.dough + .9)));
  title(t);
  subtitles(t);
  blackout(t);
}
