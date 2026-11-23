// 2D overlay (16:9, 1920×1080): RPG interface over the diorama — quest boxes, chapter cards, panels, checklists, counters,
// calendar, stamp, class change, subtitles, title and end card, dips to black between shots.
import { T, SHOTS } from './story.js';

const cv = document.getElementById('ov'), g = cv.getContext('2d');
const W = 1920, H = 1080;
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
function vband(y, h, a) { const sh = g.createLinearGradient(0, y - h / 2, 0, y + h / 2); sh.addColorStop(0, 'rgba(0,0,0,0)'); sh.addColorStop(.5, `rgba(0,0,0,${.5 * a})`); sh.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = sh; g.fillRect(0, y - h / 2, W, h); }
function plate(x, y, w, h) {
  const bgr = g.createLinearGradient(0, y, 0, y + h); bgr.addColorStop(0, 'rgba(14,18,34,.88)'); bgr.addColorStop(1, 'rgba(6,8,18,.93)');
  g.fillStyle = bgr; g.fillRect(x, y, w, h);
  g.strokeStyle = 'rgba(214,190,130,.9)'; g.lineWidth = 2; g.strokeRect(x + .5, y + .5, w - 1, h - 1);
  g.strokeStyle = 'rgba(214,190,130,.35)'; g.lineWidth = 1; g.strokeRect(x + 7.5, y + 7.5, w - 15, h - 15);
  for (const [cx, cy] of [[x, y], [x + w, y], [x, y + h], [x + w, y + h]]) { g.fillStyle = GOLD; g.beginPath(); g.moveTo(cx, cy - 7); g.lineTo(cx + 7, cy); g.lineTo(cx, cy + 7); g.lineTo(cx - 7, cy); g.fill(); }
}
function nameTag(x, y, who) { g.font = FR.sb(30); const nw = g.measureText(who).width + 48; g.fillStyle = 'rgba(10,12,24,.96)'; g.fillRect(x, y - 23, nw, 44); g.strokeStyle = 'rgba(214,190,130,.9)'; g.lineWidth = 1.5; g.strokeRect(x + .5, y - 22.5, nw - 1, 43); g.fillStyle = '#e8d5a4'; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText(who, x + 24, y - 1); }
function coin(x, y, r) { g.save(); g.fillStyle = '#8a6a2a'; g.beginPath(); g.arc(x, y + 2, r, 0, 7); g.fill(); g.fillStyle = '#d8b25a'; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); g.fillStyle = '#fff0b8'; g.fillRect(x - r * .45, y - r * .55, r * .35, r * .35); g.strokeStyle = '#8a6a2a'; g.lineWidth = 2; g.beginPath(); g.arc(x, y, r * .62, 0, 7); g.stroke(); g.restore(); }
function mark(kind, x, y, a = 1, s = 1) {   // ✓ ✗ ☐ … drawn as pixel-crisp strokes
  g.save(); g.globalAlpha *= a; g.lineWidth = 5 * s; g.lineCap = 'square';
  if (kind === 'ok') { g.strokeStyle = '#9ad06a'; g.beginPath(); g.moveTo(x - 11 * s, y); g.lineTo(x - 3 * s, y + 9 * s); g.lineTo(x + 13 * s, y - 10 * s); g.stroke(); }
  if (kind === 'no') { g.strokeStyle = '#e0574a'; g.beginPath(); g.moveTo(x - 10 * s, y - 10 * s); g.lineTo(x + 10 * s, y + 10 * s); g.moveTo(x + 10 * s, y - 10 * s); g.lineTo(x - 10 * s, y + 10 * s); g.stroke(); }
  if (kind === 'box') { g.strokeStyle = GOLD; g.lineWidth = 3; g.strokeRect(x - 11 * s, y - 11 * s, 22 * s, 22 * s); }
  if (kind === 'q') { g.fillStyle = GOLD; g.font = FR.sb(40 * s); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('?', x, y + 2); }
  if (kind === 'dots') { g.fillStyle = GOLD; for (let i = 0; i < 3; i++) if (Math.floor(Date.now ? 0 : 0) >= 0) g.fillRect(x - 14 + i * 12, y, 6, 6); }
  g.restore();
}
function kidIcon(x, y, s, col = '#4a9a4e') {   // tiny pixel person
  g.save(); g.fillStyle = col; g.fillRect(x - 5 * s, y - 2 * s, 10 * s, 12 * s); g.fillStyle = '#f3c9a6'; g.fillRect(x - 3 * s, y - 9 * s, 6 * s, 6 * s); g.fillStyle = col; g.fillRect(x - 4 * s, y - 11 * s, 8 * s, 3 * s); g.restore();
}

// —— building blocks ——
function card(t, a0t, outT, label, name) {
  const a0 = ss(seg(t, a0t, a0t + .8)), a1 = ss(seg(t, a0t + .5, a0t + 1.3)), out = 1 - ss(seg(t, outT - .6, outT));
  if (a0 * out <= 0) return;
  g.save(); vband(150, 260, a0 * out); g.textAlign = 'center'; g.textBaseline = 'middle';
  g.globalAlpha = a0 * out; g.fillStyle = '#d8c28e'; g.font = FR.cin(46); glowText(() => spaced(label, W / 2, 110, 16), 'rgba(0,0,0,.8)', 12);
  ornament(W / 2, 154, 240 * (.4 + .6 * a0), a0 * out);
  if (name) { g.globalAlpha = a1 * out; g.fillStyle = '#f3ead6'; g.font = FR.it(60); glowText(() => g.fillText(name, W / 2, 206 - (1 - a1) * 10), 'rgba(0,0,0,.85)', 16); }
  g.restore();
}
function chapter(t, at, num, name) {
  const a = ss(seg(t, at, at + .7)) * (1 - ss(seg(t, at + 3.0, at + 3.8)));
  if (a <= 0) return;
  g.save(); vband(H / 2 - 20, 400, a * 1.2); g.globalAlpha = a; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillStyle = '#d8c28e'; g.font = FR.cin(40); glowText(() => spaced('CHAPTER ' + num, W / 2, H / 2 - 92, 18), 'rgba(0,0,0,.8)', 12);
  const gr = g.createLinearGradient(0, H / 2 - 60, 0, H / 2 + 40); gr.addColorStop(0, '#fff3cf'); gr.addColorStop(.55, '#e2c27c'); gr.addColorStop(1, '#a8803e');
  g.fillStyle = gr; g.font = FR.cinB(96); glowText(() => spaced(name, W / 2, H / 2 - 12, 10), 'rgba(255,200,120,.45)', 30);
  ornament(W / 2, H / 2 + 62, 300 * (.3 + .7 * a), 1);
  g.restore();
}
function dialog(t, tin, tout, who, text, typeA, typeB, o = {}) {
  const a = fadeIO(t, tin, tout);
  if (a <= 0) return;
  const bw = o.w ?? 1240, bh = o.h ?? 170, x = o.x ?? (W - bw) / 2, y = (o.y ?? 70) + (1 - a) * 14;
  g.save(); g.globalAlpha = a; plate(x, y, bw, bh); nameTag(x + 36, y, who);
  g.font = FR.rg(o.fs ?? 46); g.fillStyle = '#f4efe4'; g.textAlign = 'left'; g.textBaseline = 'middle';
  const n = text.length, shown = Math.floor(n * clamp((t - typeA) / (typeB - typeA)));
  const lines = wrap(text, bw - 130); let k = shown;
  lines.forEach((L, i) => { const s = L.slice(0, Math.max(0, k)); k -= L.length + 1; g.fillText(s, x + 64, y + 66 + i * 54); });
  if (shown >= n && Math.floor(t * 2.5) % 2 === 0) { g.fillStyle = GOLD; const tx = x + bw - 48, ty = y + bh - 32; g.beginPath(); g.moveTo(tx - 9, ty - 5); g.lineTo(tx + 9, ty - 5); g.lineTo(tx, ty + 6); g.fill(); }
  g.restore();
}
// side panel with a title and rows: rows = [{ t: appear time, text, mark: 'ok'|'no'|'box'|'q', markT, sub }]
function panel(t, tin, tout, title, rows, o = {}) {
  const a = fadeIO(t, tin, tout, .4);
  if (a <= 0) return;
  const pw = o.w ?? 600, rh = o.rh ?? 74, ph = 112 + rows.length * rh + (o.extra ?? 0), x = o.x ?? W - pw - 70, y = (o.y ?? 150) + (1 - a) * 16;
  g.save(); g.globalAlpha = a; plate(x, y, pw, ph);
  g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#d8c28e'; g.font = FR.cin(30); spaced(title, x + pw / 2, y + 46, 7);
  ornament(x + pw / 2, y + 80, pw * .3, 1);
  rows.forEach((r, i) => {
    const ra = ss(seg(t, r.t, r.t + .35)); if (ra <= 0) return;
    const ry = y + 128 + i * rh;
    g.globalAlpha = a * ra; g.textAlign = 'left'; g.font = FR.rg(r.fs ?? 40); g.fillStyle = r.dim ? DIM : '#f4efe4'; g.fillText(r.text, x + 46, ry);
    if (r.sub) { g.font = FR.it(28); g.fillStyle = DIM; g.fillText(r.sub, x + 46, ry + 32); }
    if (r.mark) { const ma = r.markT ? ss(seg(t, r.markT, r.markT + .25)) : 1; const pop = r.markT ? 1 + .4 * Math.sin(Math.PI * seg(t, r.markT, r.markT + .3)) : 1; if (ma > 0) mark(r.mark, x + pw - 54, ry, ma, pop); else mark('q', x + pw - 54, ry, 1); }
    if (r.draw) r.draw(x, ry, pw);
  });
  g.restore();
}
function bigCenter(t, tin, tout, top, big, sub) {
  const a = fadeIO(t, tin, tout, .45); if (a <= 0) return;
  const s = 1 + .08 * (1 - ss(seg(t, tin, tin + .6)));
  g.save(); vband(H / 2 - 30, 420, a); g.globalAlpha = a; g.textAlign = 'center'; g.textBaseline = 'middle';
  if (top) { g.fillStyle = '#d8c28e'; g.font = FR.cin(34); spaced(top, W / 2, H / 2 - 150, 12); }
  g.translate(W / 2, H / 2 - 40); g.scale(s, s);
  const gr = g.createLinearGradient(0, -80, 0, 60); gr.addColorStop(0, '#fff3cf'); gr.addColorStop(.55, '#e2c27c'); gr.addColorStop(1, '#a8803e');
  g.fillStyle = gr; g.font = FR.cinB(150); glowText(() => spaced(big, 0, 0, 14), 'rgba(255,200,120,.5)', 36);
  g.setTransform(1, 0, 0, 1, 0, 0);
  if (sub) { g.font = FR.it(46); g.fillStyle = '#f3ead6'; glowText(() => g.fillText(sub, W / 2, H / 2 + 76), 'rgba(0,0,0,.8)', 10); }
  g.restore();
}
function stamp(t, at, text, x, y, col = '#d0392e') {
  const a = ss(seg(t, at, at + .12)) * (1 - ss(seg(t, at + 3.4, at + 3.9))); if (a <= 0) return;
  const s = 1 + 1.2 * (1 - ss(seg(t, at, at + .18)));
  g.save(); g.globalAlpha = a; g.translate(x, y); g.rotate(-.18); g.scale(s, s);
  g.strokeStyle = col; g.lineWidth = 7; g.strokeRect(-190, -62, 380, 124); g.lineWidth = 2.5; g.strokeRect(-178, -50, 356, 100);
  g.fillStyle = col; g.font = FR.cinB(78); g.textAlign = 'center'; g.textBaseline = 'middle'; spaced(text, 0, 4, 8);
  g.restore();
}

// —— Subtitles ——
function subtitles(t) {
  for (const s of SUBS) {
    const a = ss(seg(t, s.t, s.t + .12)) * (1 - ss(seg(t, s.out - .1, s.out)));
    if (a <= 0) continue;
    g.save(); g.globalAlpha = a; g.textAlign = 'center'; g.textBaseline = 'alphabetic'; g.font = FR.it(50);
    const lines = wrap(s.sub, 1500), y0 = 1000 - (lines.length - 1) * 56;
    vband(y0 + (lines.length - 1) * 28 - 14, 110 + lines.length * 50, 1);
    g.shadowColor = 'rgba(0,0,0,.95)'; g.shadowBlur = 10; g.shadowOffsetY = 2; g.fillStyle = PARCH;
    lines.forEach((L, i) => g.fillText(L, W / 2, y0 + i * 56));
    g.restore();
  }
}

// —— Title & end card ——
function title(t, tin, tout, big1, big2, sub) {
  const a = ss(seg(t, tin, tin + 1.0)), out = 1 - ss(seg(t, tout - .7, tout));
  if (a * out <= 0) return;
  g.save(); g.textAlign = 'center'; g.textBaseline = 'middle'; vband(H / 2 - 40, 560, a * out * 1.1);
  g.globalAlpha = a * out; g.font = FR.cinB(110);
  const gr = g.createLinearGradient(0, H / 2 - 200, 0, H / 2 + 40); gr.addColorStop(0, '#fff3cf'); gr.addColorStop(.55, '#e2c27c'); gr.addColorStop(1, '#a8803e');
  g.fillStyle = gr; glowText(() => { spaced(big1, W / 2, H / 2 - 150, 14); spaced(big2, W / 2, H / 2 - 20, 14); }, 'rgba(255,200,120,.5)', 34);
  ornament(W / 2, H / 2 + 62, 320 * (.3 + .7 * a), a * out);
  const b = ss(seg(t, tin + .8, tin + 1.6)); g.globalAlpha = b * out; g.font = FR.it(50); g.fillStyle = '#f3ead6';
  glowText(() => g.fillText(sub, W / 2, H / 2 + 124), 'rgba(0,0,0,.8)', 10);
  g.restore();
}
function endCard(t) {
  const a = fadeIO(t, T.sub, DUR_END - .4, .6); if (a <= 0) return;
  g.save(); g.globalAlpha = a; const bw = 760, bh = 150, x = (W - bw) / 2, y = 760; plate(x, y, bw, bh);
  g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#d8c28e'; g.font = FR.cin(32); spaced('ONE ORDINARY LIFE AT A TIME', W / 2, y + 52, 6);
  g.font = FR.it(44); g.fillStyle = '#f4efe4'; g.fillText('Ordinary Lives', W / 2, y + 104);
  const bx = x + bw - 70 + Math.sin(t * 6) * 4, by = y + 104; g.fillStyle = GOLD; g.beginPath(); g.moveTo(bx - 12, by - 14); g.lineTo(bx + 12, by); g.lineTo(bx - 12, by + 14); g.fill();
  g.restore();
}
const DUR_END = 387.0;

// —— Dips to black at cuts between sets / chapters ——
const CUTS = SHOTS.slice(1).map(s => s.a);
function blackout(t) {
  let a = 1 - ss(seg(t, 0, .8));
  for (const c of CUTS) { const o = .28, i = .32; if (t < c && t > c - o) a = Math.max(a, ss((t - (c - o)) / o)); if (t >= c && t < c + i) a = Math.max(a, 1 - ss((t - c) / i)); }
  a = Math.max(a, ss(seg(t, DUR_END - 1.4, DUR_END - .1)));
  if (a > 0) { g.fillStyle = `rgba(0,0,0,${a})`; g.fillRect(0, 0, W, H); }
}

// —— day-length bars (Paris: ≈16 h of daylight in June, ≈8 h in December) ——
function dayBars(x, y, t) {
  const rows = [['June', 16, T.june], ['December', 8, T.dec]];
  rows.forEach(([n, h, at], i) => {
    const k = ss(seg(t, at, at + 1.0)), yy = y + i * 86;
    g.globalAlpha = ss(seg(t, at, at + .3)); g.textAlign = 'left'; g.textBaseline = 'middle'; g.font = FR.rg(38); g.fillStyle = '#f4efe4'; g.fillText(n, x + 46, yy);
    g.fillStyle = 'rgba(255,255,255,.08)'; g.fillRect(x + 46, yy + 22, 24 * 20, 18);
    const gr = g.createLinearGradient(x + 46, 0, x + 46 + 24 * h, 0); gr.addColorStop(0, '#ffe2a0'); gr.addColorStop(1, '#e2a24a'); g.fillStyle = gr; g.fillRect(x + 46, yy + 22, 20 * h * k, 18);
    g.font = FR.it(34); g.fillStyle = GOLD; g.textAlign = 'right'; g.fillText(`≈ ${h} h of daylight`, x + 546, yy);
  });
  g.globalAlpha = 1;
}
function calendar(x, y, t) {
  const D = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  D.forEach((d, i) => {
    const at = T.cal + i * .22, a = ss(seg(t, at, at + .3)), xx = x + 40 + i * 74, yy = y;
    g.globalAlpha = a; const sun = i === 6, sat = i === 5;
    g.fillStyle = sun ? 'rgba(120,120,130,.35)' : 'rgba(226,201,137,.22)'; g.fillRect(xx, yy, 62, 72);
    if (sat && t > T.sat) { const k = ss(seg(t, T.sat, T.sat + .6)); g.fillStyle = 'rgba(14,18,34,.9)'; g.fillRect(xx, yy + 72 * (1 - .35 * k), 62, 72 * .35 * k); g.fillStyle = GOLD; g.font = FR.sb(20); g.textAlign = 'center'; if (k > .5) g.fillText('vespers', xx + 31, yy + 62); }
    g.strokeStyle = sun ? 'rgba(160,160,170,.8)' : 'rgba(214,190,130,.9)'; g.lineWidth = 2; g.strokeRect(xx + .5, yy + .5, 61, 71);
    g.fillStyle = sun ? 'rgba(200,200,210,.8)' : '#f4efe4'; g.font = FR.cin(30); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(d, xx + 31, yy + 30);
    if (sun && t > T.sunday) mark('no', xx + 31, yy + 30, ss(seg(t, T.sunday, T.sunday + .3)), 1.1);
  });
  g.globalAlpha = 1;
}

export function drawOverlay(t) {
  g.clearRect(0, 0, W, H);
  // prologue
  card(t, T.cardIn, 6.6, 'PARIS', 'the year 1303');
  dialog(t, T.quest, 11.0, 'NEW QUEST', 'The Apprentice. Term: eight years.', T.quest + .25, T.quest + 1.6, { w: 1000 });
  panel(t, T.party, 36.9, 'YOUR MASTER', [{ t: T.party + .2, text: 'Embroiderer of Paris', sub: 'silk, and thread of gold' }, { t: T.party + 1.0, text: 'You live in his house', dim: 1 }, { t: T.party + 1.6, text: 'You learn his trade', dim: 1 }], { y: 170 });
  title(t, T.titleIn, T.titleOut, 'EIGHT YEARS', 'OF DAYLIGHT', 'Ordinary Lives · Paris, 1303');
  // I · the contract
  chapter(t, T.ch1, 'I', 'THE CONTRACT');
  dialog(t, T.book, 57.6, 'THE BOOK OF TRADES', 'Rules of the trades of Paris, written down under the provost Étienne Boileau, around 1268.', T.book + .3, T.book + 2.6, { w: 1300, h: 210 });
  {
    const a = fadeIO(t, T.trades0, 63.4); if (a > 0) { const n = Math.min(100, Math.floor(100 * ss(seg(t, T.trades0, T.trades1)))); g.save(); g.globalAlpha = a; plate(W / 2 - 230, 70, 460, 120); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#d8c28e'; g.font = FR.cin(28); spaced('TRADES', W / 2, 104, 8); g.fillStyle = '#fff3cf'; g.font = FR.cinB(54); g.fillText(n >= 100 ? '100 +' : String(n), W / 2, 152); g.restore(); }
  }
  dialog(t, T.jures, 69.3, 'JURÉS', 'Sworn men of each trade. Their job: make sure the rules are kept.', T.jures + .3, T.jures + 2.0, { w: 1200 });
  panel(t, 73.0, 85.6, 'BEFORE THE CONTRACT', [
    { t: 73.2, text: 'Questions about: the master', fs: 36 },
    { t: T.q1, text: 'Can he do the work?', mark: 'ok', markT: T.q1ok },
    { t: T.q2, text: 'Can he feed and train you?', mark: 'ok', markT: T.q2ok },
    { t: T.refuse, text: 'Bad at it, or too poor: refused', fs: 34, dim: 1 },
  ]);
  panel(t, T.slots, 99.0, 'APPRENTICE PLACES', [
    { t: T.slotsKids, text: "Master's own children", sub: 'no limit', draw: (x, y, pw) => { for (let i = 0; i < 5; i++) kidIcon(x + pw - 230 + i * 30, y + 4, 1.6, '#8a6a4a'); g.fillStyle = GOLD; g.font = FR.sb(30); g.textAlign = 'right'; g.fillText('…', x + pw - 40, y); } },
    { t: T.slotsOut, text: 'Boys from other families', sub: 'usually one', draw: (x, y, pw) => { const bx = x + pw - 90, by = y - 26; g.strokeStyle = GOLD; g.lineWidth = 3; g.strokeRect(bx, by, 52, 52); const k = ss(seg(t, T.slotYou, T.slotYou + .3)); if (k > 0) { g.globalAlpha *= k; kidIcon(bx + 26, by + 30, 2.2); } } },
  ], { rh: 96, w: 700 });
  panel(t, T.witness, 108.6, 'THE CONTRACT', [{ t: T.witness + .2, text: 'Made before witnesses', sub: 'masters, and men of the trade' }, { t: T.witness + 2.0, text: 'Everyone hears the terms', dim: 1 }], { rh: 90 });
  panel(t, T.pays, 126.6, 'WHO PAYS?', [
    { t: T.pays + .1, text: 'Your family', mark: 'box', fs: 42 },
    { t: T.earns, text: 'You earn: nothing', dim: 1 },
    { t: T.bars, text: 'Short term', sub: 'your family pays more', draw: (x, y, pw) => { for (let i = 0; i < 5; i++) coin(x + pw - 70 - i * 26, y, 12); } },
    { t: T.barsLong, text: 'Long term', sub: 'can cost almost nothing', draw: (x, y, pw) => coin(x + pw - 70, y, 12) },
  ], { rh: 90 });
  dialog(t, T.statute, 137.6, 'STATUTES OF THE EMBROIDERERS · 1303', 'The shortest term an apprentice may serve: eight years.', T.statute + .3, T.statute + 2.4, { w: 1280 });
  bigCenter(t, T.eight, 141.3, 'TERM OF SERVICE', '8 YEARS', 'from age twelve to twenty');
  // II · the light
  chapter(t, T.ch2, 'II', 'THE LIGHT');
  panel(t, 149.0, 164.9, 'YOUR WORKING DAY', [{ t: 149.2, text: 'Starts: enough light to see a thread', fs: 34 }, { t: 152.5, text: 'Stops: when there is not', fs: 34 }], { extra: 190, draw: null, rh: 64 });
  if (t > 149 && t < 165) { const a = fadeIO(t, 149, 164.9, .4); g.save(); g.globalAlpha = a; dayBars(W - 670, 150 + 112 + 2 * 64 + 26, t); g.restore(); }
  dialog(t, T.rule, 185.6, 'STATUTES OF THE EMBROIDERERS · 1303', 'No work by candlelight: it comes out worse than work done by day.', T.rule + .3, T.rule + 2.6, { w: 1240 });
  stamp(t, T.snuff - .1, 'FORBIDDEN', 1460, 620);
  panel(t, T.nightPanel, 198.9, 'AFTER DARK', [{ t: T.nightPanel + .2, text: 'Night work: banned', sub: 'in many trades of Paris' }, { t: 190.7, text: 'A candle hides mistakes', dim: 1 }, { t: 193.0, text: 'Daylight shows them', dim: 1 }], { rh: 86 });
  panel(t, 200.4, 213.9, 'YEAR ONE · TASKS', [{ t: 200.6, text: "Touch the silk", mark: 'no', markT: 201.8 }, { t: T.fetch, text: 'Fetch', mark: 'ok', markT: T.fetch + .4 }, { t: T.wind, text: 'Wind thread', mark: 'ok', markT: T.wind + .4 }, { t: T.watch, text: 'Watch', sub: 'the work of the first year', mark: 'box' }], { rh: 82 });
  // III · the week
  chapter(t, T.ch3, 'III', 'THE WEEK');
  { const a = fadeIO(t, T.cal - .2, 240.5, .4); if (a > 0) { g.save(); g.globalAlpha = a; plate(W / 2 - 320, 60, 640, 190); g.globalAlpha = a; calendar(W / 2 - 300, 120, t); g.globalAlpha = a; g.fillStyle = '#d8c28e'; g.font = FR.cin(26); g.textAlign = 'center'; g.textBaseline = 'middle'; spaced('YOUR WEEK', W / 2, 92, 8); if (t > T.feast) { g.globalAlpha = a * ss(seg(t, T.feast, T.feast + .4)); g.font = FR.it(30); g.fillStyle = GOLD; g.fillText('+ feast days: no work', W / 2, 228); } g.restore(); } }
  dialog(t, T.bell - .2, 238.6, 'THE BELL', 'First bell of vespers. Saturday’s work is over.', T.bell, T.bell + 1.8, { w: 1100, y: 290 });
  // IV · the knock
  chapter(t, T.ch4, 'IV', 'THE KNOCK');
  panel(t, T.thread - .5, 265.3, 'INSPECTION', [{ t: T.thread, text: 'The thread', mark: 'ok', markT: T.thread + .3 }, { t: T.materials, text: 'The materials', mark: 'ok', markT: T.materials + .3 }, { t: T.finish, text: 'The finish', mark: 'q' }, { t: T.fine, text: 'Fine', draw: (x, y, pw) => { for (let i = 0; i < 3; i++) coin(x + pw - 70 - i * 26, y, 12); g.fillStyle = '#e0574a'; g.font = FR.sb(40); g.textAlign = 'right'; g.fillText('−', x + pw - 140, y); } }], { rh: 80 });
  stamp(t, T.seize, 'SEIZED', 760, 560);
  // V · eight years
  chapter(t, T.ch5, 'V', 'EIGHT YEARS');
  { const a = fadeIO(t, T.year0, 305.6, .4); if (a > 0) { const yr = 1 + Math.min(7, Math.floor(8 * seg(t, T.year0, T.year1))); g.save(); g.globalAlpha = a; plate(W - 470, 70, 400, 150); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#d8c28e'; g.font = FR.cin(28); spaced('YEAR', W - 270, 108, 8); g.fillStyle = '#fff3cf'; g.font = FR.cinB(64); g.fillText(`${yr} / 8`, W - 270, 168); g.restore(); } }
  panel(t, T.needleHold - .3, 300.0, 'SKILL', [{ t: T.needleHold, text: 'Hold the needle', mark: 'ok', markT: T.needleHold + .3 }, { t: T.plain, text: 'Plain background', mark: 'ok', markT: T.plain + .3 }, { t: T.looked, text: 'Work people will see', mark: 'ok', markT: T.looked + .6 }], { y: 260, rh: 76 });
  { const a = fadeIO(t, 301.0, 305.9, .4); if (a > 0) { g.save(); g.globalAlpha = a; vband(H / 2 - 40, 360, a); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#d8c28e'; g.font = FR.cin(34); spaced('CLASS CHANGE', W / 2, H / 2 - 130, 12); g.font = FR.cinB(80); g.fillStyle = 'rgba(244,239,228,.6)'; g.fillText('APPRENTICE', W / 2 - 360, H / 2 - 40); const k = ss(seg(t, T.journey, T.journey + .5)); g.fillStyle = GOLD; g.beginPath(); g.moveTo(W / 2 - 30, H / 2 - 64); g.lineTo(W / 2 + 18, H / 2 - 40); g.lineTo(W / 2 - 30, H / 2 - 16); g.fill(); g.globalAlpha = a * k; const gr = g.createLinearGradient(0, H / 2 - 90, 0, H / 2 + 10); gr.addColorStop(0, '#fff3cf'); gr.addColorStop(1, '#c89a4a'); g.fillStyle = gr; glowText(() => g.fillText('JOURNEYMAN', W / 2 + 380, H / 2 - 40), 'rgba(255,200,120,.6)', 30); g.restore(); } }
  panel(t, T.wage, 316.2, 'JOURNEYMAN', [{ t: T.wage + .1, text: 'Paid by the day', draw: (x, y, pw) => coin(x + pw - 70, y, 14) }, { t: T.anyMaster, text: 'Any master who will hire you', fs: 36 }, { t: 312.0, text: 'Free to leave', mark: 'ok', markT: 313.2 }], { rh: 80 });
  panel(t, T.become, 342.0, 'TO BECOME A MASTER', [{ t: T.skill, text: 'The skill', mark: 'ok', markT: T.skill + .5 }, { t: T.money, text: 'Money for a workshop', mark: 'no', markT: 325.0 }, { t: T.oath, text: 'The oath before the jurés', mark: 'box', fs: 36 }, { t: T.buy, text: 'Some trades: buy the right', sub: 'to work at all', dim: 1 }], { rh: 84 });
  // ending
  title(t, T.endTitle, 386.2, 'EIGHT YEARS', 'OF DAYLIGHT', 'Ordinary Lives · Paris, 1303');
  endCard(t);
  subtitles(t);
  blackout(t);
}
