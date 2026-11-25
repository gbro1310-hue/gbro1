// 2D overlay for a 9:16 Short (1080×1920): RPG interface over the diorama — place card, a locked action, statute box,
// FORBIDDEN stamp, a "day vs candle" panel with a stitch inset, day-length bars, 8 YEARS, subtitles, title, fades.
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
// an RPG action prompt that turns out to be locked
function lockPrompt(t) {
  const a = fadeIO(t, T.lockIn, 14.2, .3); if (a <= 0) return;
  const bw = 760, bh = 150, x = (W - bw) / 2, y = 260 + (1 - a) * 14, no = ss(seg(t, T.lockNo, T.lockNo + .2));
  const shake = no > 0 && no < 1 ? Math.sin(t * 90) * 10 * (1 - no) : 0;
  g.save(); g.globalAlpha = a; g.translate(shake, 0); plate(x, y, bw, bh);
  g.textAlign = 'left'; g.textBaseline = 'middle';
  g.fillStyle = 'rgba(226,201,137,.16)'; g.fillRect(x + 30, y + 36, bw - 60, bh - 72);
  const bx = x + 70 + Math.sin(t * 7) * 4, by = y + bh / 2; g.fillStyle = GOLD; g.beginPath(); g.moveTo(bx - 12, by - 14); g.lineTo(bx + 12, by); g.lineTo(bx - 12, by + 14); g.fill();
  g.font = FR.rg(58); g.fillStyle = no > .5 ? 'rgba(244,239,228,.45)' : '#fff6dc'; g.fillText('Light the candle', x + 112, by + 2);
  if (no > .5) { g.strokeStyle = 'rgba(224,87,74,.9)'; g.lineWidth = 4; g.beginPath(); g.moveTo(x + 108, by + 2); g.lineTo(x + 108 + g.measureText('Light the candle').width, by + 2); g.stroke(); }
  if (no > 0) {   // pixel padlock
    const lx = x + bw - 92, ly = by + 4, s = 1 + .5 * Math.sin(Math.PI * no) * (1 - no);
    g.save(); g.translate(lx, ly); g.scale(s, s); g.fillStyle = '#e0574a'; g.fillRect(-22, -6, 44, 34); g.strokeStyle = '#e0574a'; g.lineWidth = 7; g.beginPath(); g.arc(0, -8, 14, Math.PI, 0); g.stroke(); g.fillStyle = '#2a0c0c'; g.fillRect(-4, 4, 8, 12); g.restore();
  }
  g.restore();
  if (no > .5) { g.save(); g.globalAlpha = a * ss(seg(t, T.lockNo + .2, T.lockNo + .5)); g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = FR.cin(36); g.fillStyle = '#ef8a7e'; spaced('NOT ALLOWED', W / 2, y + bh + 50, 10); g.restore(); }
}
function stamp(t, at, outT, text, x, y, col = '#d0392e', w = 520) {
  const a = ss(seg(t, at, at + .12)) * (1 - ss(seg(t, outT - .4, outT))); if (a <= 0) return;
  const s = 1 + 1.2 * (1 - ss(seg(t, at, at + .18)));
  g.save(); g.globalAlpha = a; g.translate(x, y); g.rotate(-.16); g.scale(s, s);
  g.strokeStyle = col; g.lineWidth = 8; g.strokeRect(-w / 2, -72, w, 144); g.lineWidth = 3; g.strokeRect(-w / 2 + 13, -59, w - 26, 118);
  g.fillStyle = col; g.font = FR.cinB(88); g.textAlign = 'center'; g.textBaseline = 'middle'; spaced(text, 0, 6, 8);
  g.restore();
}
// "By day / By candle" panel, then a stitch inset: a crooked line that the candle makes look straight
function whyPanel(t) {
  const a = fadeIO(t, T.reason, 35.9, .4); if (a <= 0) return;
  const bw = 900, x = (W - bw) / 2, y = 200 + (1 - a) * 14, bh = 520;
  g.save(); g.globalAlpha = a; plate(x, y, bw, bh);
  g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#d8c28e'; g.font = FR.cin(36); spaced('THE SAME WORK', W / 2, y + 54, 9); ornament(W / 2, y + 94, 220, 1);
  const rows = [['By day', 'ok', T.day + .5], ['By candlelight', 'no', T.worse]];
  rows.forEach(([n, m, at], i) => {
    const ra = ss(seg(t, at - .4, at)); if (ra <= 0) return; const ry = y + 150 + i * 76;
    g.globalAlpha = a * ra; g.textAlign = 'left'; g.font = FR.rg(52); g.fillStyle = '#f4efe4'; g.fillText(n, x + 60, ry);
    const ma = ss(seg(t, at, at + .25)); if (ma > 0) mark(m, x + bw - 80, ry, ma, 1 + .4 * Math.sin(Math.PI * seg(t, at, at + .3)));
    if (i === 1 && t > T.worse) { g.font = FR.it(38); g.fillStyle = '#ef8a7e'; g.textAlign = 'right'; g.globalAlpha = a * ss(seg(t, T.worse, T.worse + .3)); g.fillText('comes out worse', x + bw - 130, ry + 2); }
  });
  // two swatches: the same crooked stitch, seen by day and by candle
  const sa = ss(seg(t, T.yellow - .3, T.yellow + .2)); if (sa > 0) {
    const sw = 360, sh = 170, sy = y + 312;
    [['DAY', x + 70], ['CANDLE', x + bw - 70 - sw]].forEach(([lab, sx], k) => {
      g.globalAlpha = a * sa;
      g.fillStyle = k ? '#7a5424' : '#d9cfb6'; g.fillRect(sx, sy, sw, sh);
      if (k) { const fl = .5 + .5 * Math.sin(t * 13) * Math.sin(t * 5.3); const gr = g.createRadialGradient(sx + sw * .3, sy - 30, 10, sx + sw * .3, sy - 30, sw * (1 + .08 * fl)); gr.addColorStop(0, 'rgba(255,190,90,.75)'); gr.addColorStop(1, 'rgba(60,30,10,.6)'); g.fillStyle = gr; g.fillRect(sx, sy, sw, sh); }
      // pixel weave
      for (let yy = 0; yy < sh; yy += 10) for (let xx = (yy / 10) % 2 * 10; xx < sw; xx += 20) { g.fillStyle = k ? 'rgba(0,0,0,.08)' : 'rgba(0,0,0,.05)'; g.fillRect(sx + xx, sy + yy, 10, 10); }
      // the stitch: gold, with a kink in the middle
      const show = ss(seg(t, T.stitch - .3, T.stitch + .3)), blur = k ? ss(seg(t, T.straight - .8, T.straight)) : 0;
      if (show > 0) {
        g.globalAlpha = a * sa * show; g.fillStyle = k ? '#ffd27a' : '#c8942c';
        for (let i = 0; i < 18; i++) { const px = sx + 18 + i * 18; let dy = (i >= 8 && i <= 10) ? [-12, -20, -12][i - 8] : 0; dy *= 1 - blur * .85; g.fillRect(px, sy + sh / 2 - 6 + dy + (k ? Math.sin(t * 9 + i) * 1.5 : 0), 14, 12); }
        if (!k && t > T.stitch + .2) { g.strokeStyle = '#e0574a'; g.lineWidth = 4; g.globalAlpha = a * sa * ss(seg(t, T.stitch + .2, T.stitch + .5)); g.beginPath(); g.arc(sx + 18 + 9 * 18 + 7, sy + sh / 2 - 14, 36, 0, 7); g.stroke(); }
        if (k && t > T.straight) { mark('ok', sx + sw - 34, sy + 34, ss(seg(t, T.straight, T.straight + .3)) * a, .9); }
      }
      g.globalAlpha = a * sa; g.fillStyle = '#d8c28e'; g.font = FR.cin(30); g.textAlign = 'center'; spaced(lab, sx + sw / 2, sy + sh + 32, 8);
    });
  }
  g.restore();
}
function dayBars(t) {
  const a = fadeIO(t, T.june - .3, 44.7, .4); if (a <= 0) return;
  const bw = 900, x = (W - bw) / 2, y = 230, bh = 300;
  g.save(); g.globalAlpha = a; plate(x, y, bw, bh);
  g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#d8c28e'; g.font = FR.cin(34); spaced('YOUR WORKING DAY', W / 2, y + 52, 8); ornament(W / 2, y + 90, 200, 1);
  [['June', 16, T.june], ['December', 8, T.dec]].forEach(([n, h, at], i) => {
    const k = ss(seg(t, at, at + 1.0)), yy = y + 140 + i * 92;
    g.globalAlpha = a * ss(seg(t, at, at + .3)); g.textAlign = 'left'; g.font = FR.rg(46); g.fillStyle = '#f4efe4'; g.fillText(n, x + 60, yy);
    g.font = FR.it(38); g.fillStyle = GOLD; g.textAlign = 'right'; g.fillText(`≈ ${h} h of light`, x + bw - 60, yy);
    g.fillStyle = 'rgba(255,255,255,.08)'; g.fillRect(x + 60, yy + 26, bw - 120, 18);
    const L = (bw - 120) * h / 16, gr = g.createLinearGradient(x + 60, 0, x + 60 + L, 0); gr.addColorStop(0, '#ffe2a0'); gr.addColorStop(1, '#e2a24a'); g.fillStyle = gr; g.fillRect(x + 60, yy + 26, L * k, 18);
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
  g.fillStyle = gr; glowText(() => { spaced('NO', W / 2, 470, 14); spaced('CANDLES', W / 2, 590, 14); }, 'rgba(255,200,120,.5)', 34);
  ornament(W / 2, 668, 260 * (.3 + .7 * a), a * out);
  const b = ss(seg(t, T.title + .8, T.title + 1.6)); g.globalAlpha = b * out; g.font = FR.it(52); g.fillStyle = '#f3ead6';
  glowText(() => g.fillText('Ordinary Lives · Paris, 1303', W / 2, 736), 'rgba(0,0,0,.8)', 10);
  const c = ss(seg(t, T.title + 1.6, T.title + 2.4)); g.globalAlpha = c * out; g.font = FR.cin(30); g.fillStyle = '#d8c28e';
  spaced('FULL STORY · EIGHT YEARS OF DAYLIGHT', W / 2, 812, 4);
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
  card(t, T.cardIn, 5.6, 'PARIS', 'the year 1303');
  { const a = fadeIO(t, T.half - .2, 9.9, .3); if (a > 0) { g.save(); g.globalAlpha = a; plate(W / 2 - 300, 250, 600, 150); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#d8c28e'; g.font = FR.cin(30); spaced('THE WORK', W / 2, 290, 8); g.fillStyle = 'rgba(255,255,255,.1)'; g.fillRect(W / 2 - 230, 336, 460, 22); const k = ss(seg(t, T.half - .2, T.half + .5)) * .7, gr = g.createLinearGradient(W / 2 - 230, 0, W / 2 + 230, 0); gr.addColorStop(0, '#ffe2a0'); gr.addColorStop(1, '#c8942c'); g.fillStyle = gr; g.fillRect(W / 2 - 230, 336, 460 * k, 22); g.restore(); } }
  lockPrompt(t);
  dialog(t, T.law - .4, 18.2, 'YOUR MASTER', 'Not my rule. The law.', T.law - .2, T.law + .7, 250, 170);
  dialog(t, T.statute - .3, 24.3, 'STATUTES OF THE EMBROIDERERS · 1303', 'No work by candlelight.', T.statute, T.statute + 3.4, 250, 170);
  stamp(t, T.forbid, 24.3, 'FORBIDDEN', W / 2, 640);
  whyPanel(t);
  dayBars(t);
  bigCenter(t, T.eight, 47.8, 'TERM OF SERVICE', '8 YEARS', 'from age twelve');
  title(t);
  subtitles(t);
  blackout(t);
}
