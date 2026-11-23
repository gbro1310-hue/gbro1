// 2D overlay for a 9:16 Short: day card, statute + crier dialogue boxes, price menu, Sunday card, subtitles, title, fades.
import { T } from './story.js';

const cv = document.getElementById('ov'), g = cv.getContext('2d');
const W = 1080, H = 1920;
let SUBS = [];
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const seg = (t, a, b) => clamp((t - a) / (b - a));
const ss = x => { x = clamp(x); return x * x * (3 - 2 * x); };
const GOLD = '#e2c989', PARCH = '#f6f0e2';

export async function overlayReady() {
  await Promise.all(['500 40px Cinzel', '700 40px Cinzel', 'italic 500 40px "Cormorant Garamond"', '600 40px "Cormorant Garamond"', '500 40px "Cormorant Garamond"'].map(f => document.fonts.load(f)));
  SUBS = await (await fetch('subs.json')).json();
}
function ornament(cx, y, w, a) {
  g.save(); g.globalAlpha = a; g.fillStyle = GOLD; g.lineWidth = 1.5;
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
function band(y, h, a) { const sh = g.createLinearGradient(0, y - h / 2, 0, y + h / 2); sh.addColorStop(0, 'rgba(0,0,0,0)'); sh.addColorStop(.5, `rgba(0,0,0,${.45 * a})`); sh.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = sh; g.fillRect(0, y - h / 2, W, h); }

// —— Card at the top of frame (chapter label + name) ——
function card(t, a0t, outT, label, name) {
  const a0 = ss(seg(t, a0t, a0t + .8)), a1 = ss(seg(t, a0t + .5, a0t + 1.3)), out = 1 - ss(seg(t, outT - .6, outT));
  if (a0 * out <= 0) return;
  g.save(); band(330, 300, a0 * out);
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.globalAlpha = a0 * out; g.fillStyle = '#d8c28e'; g.font = '500 46px Cinzel'; glowText(() => spaced(label, W / 2, 292, 14), 'rgba(0,0,0,.8)', 12);
  ornament(W / 2, 338, 220 * (.4 + .6 * a0), a0 * out);
  if (name) { g.globalAlpha = a1 * out; g.fillStyle = '#f3ead6'; g.font = 'italic 500 64px "Cormorant Garamond"'; glowText(() => g.fillText(name, W / 2, 396 - (1 - a1) * 10), 'rgba(0,0,0,.85)', 16); }
  g.restore();
}

// —— Dialogue box: dark plate, thin gold frame, name plate, typewriter ——
function dialog(t, tin, tout, who, text, typeA, typeB, y0 = 1130) {
  const a = ss(seg(t, tin, tin + .35)) * (1 - ss(seg(t, tout - .35, tout)));
  if (a <= 0) return;
  const bw = 940, bh = 220, x = (W - bw) / 2, y = y0 + (1 - a) * 14;
  g.save(); g.globalAlpha = a;
  const bgr = g.createLinearGradient(0, y, 0, y + bh); bgr.addColorStop(0, 'rgba(14,18,34,.88)'); bgr.addColorStop(1, 'rgba(6,8,18,.92)');
  g.fillStyle = bgr; g.fillRect(x, y, bw, bh);
  g.strokeStyle = 'rgba(214,190,130,.9)'; g.lineWidth = 2; g.strokeRect(x + .5, y + .5, bw - 1, bh - 1);
  g.strokeStyle = 'rgba(214,190,130,.35)'; g.lineWidth = 1; g.strokeRect(x + 7.5, y + 7.5, bw - 15, bh - 15);
  for (const [cx, cy] of [[x, y], [x + bw, y], [x, y + bh], [x + bw, y + bh]]) { g.fillStyle = GOLD; g.beginPath(); g.moveTo(cx, cy - 7); g.lineTo(cx + 7, cy); g.lineTo(cx, cy + 7); g.lineTo(cx - 7, cy); g.fill(); }
  g.font = '600 36px "Cormorant Garamond"'; const nw = g.measureText(who).width + 56;
  g.fillStyle = 'rgba(10,12,24,.96)'; g.fillRect(x + 36, y - 27, nw, 52); g.strokeStyle = 'rgba(214,190,130,.9)'; g.lineWidth = 1.5; g.strokeRect(x + 36.5, y - 26.5, nw - 1, 51);
  g.fillStyle = '#e8d5a4'; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText(who, x + 64, y - 1);
  g.font = '500 50px "Cormorant Garamond"'; g.fillStyle = '#f4efe4';
  const n = text.length, shown = Math.floor(n * clamp((t - typeA) / (typeB - typeA)));
  const lines = wrap(text, bw - 130); let k = shown;
  lines.forEach((L, i) => { const s = L.slice(0, Math.max(0, k)); k -= L.length + 1; g.fillText(s, x + 64, y + 82 + i * 62); });
  if (shown >= n && Math.floor(t * 2.5) % 2 === 0) { g.fillStyle = GOLD; const tx = x + bw - 52, ty = y + bh - 36; g.beginPath(); g.moveTo(tx - 9, ty - 5); g.lineTo(tx + 9, ty - 5); g.lineTo(tx, ty + 6); g.fill(); }
  g.restore();
}

// —— Price list: an RPG shop menu, the cursor follows the narration ——
function coin(x, y, r) { g.save(); g.fillStyle = '#8a6a2a'; g.beginPath(); g.arc(x, y + 2, r, 0, 7); g.fill(); g.fillStyle = '#d8b25a'; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); g.fillStyle = '#fff0b8'; g.fillRect(x - r * .45, y - r * .55, r * .35, r * .35); g.strokeStyle = '#8a6a2a'; g.lineWidth = 2; g.beginPath(); g.arc(x, y, r * .62, 0, 7); g.stroke(); g.restore(); }
function menu(t) {
  const a = ss(seg(t, T.menuIn, T.menuIn + .4)) * (1 - ss(seg(t, T.menuOut - .4, T.menuOut)));
  if (a <= 0) return;
  const bw = 760, bh = 330, x = (W - bw) / 2, y = 210 - (1 - a) * 16;
  g.save(); g.globalAlpha = a;
  const bgr = g.createLinearGradient(0, y, 0, y + bh); bgr.addColorStop(0, 'rgba(14,18,34,.9)'); bgr.addColorStop(1, 'rgba(6,8,18,.93)');
  g.fillStyle = bgr; g.fillRect(x, y, bw, bh); g.strokeStyle = 'rgba(214,190,130,.9)'; g.lineWidth = 2; g.strokeRect(x + .5, y + .5, bw - 1, bh - 1);
  g.strokeStyle = 'rgba(214,190,130,.35)'; g.lineWidth = 1; g.strokeRect(x + 7.5, y + 7.5, bw - 15, bh - 15);
  g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#d8c28e'; g.font = '500 36px Cinzel'; spaced('THE BATHHOUSE', W / 2, y + 52, 8);
  ornament(W / 2, y + 92, 180, 1);
  const rows = [['Steam room', 2, T.row1], ['A tub', 4, T.row2]];
  const cur = t >= T.row2 ? 1 : 0, curA = ss(seg(t, T.row1, T.row1 + .25));
  rows.forEach(([name, d, tr], i) => {
    const ry = y + 160 + i * 92, on = i === cur && curA > 0, lit = ss(seg(t, tr, tr + .3));
    if (on) { g.fillStyle = 'rgba(226,201,137,.14)'; g.fillRect(x + 30, ry - 38, bw - 60, 76); }
    g.textAlign = 'left'; g.font = '500 54px "Cormorant Garamond"'; g.fillStyle = on ? '#fff6dc' : 'rgba(244,239,228,.75)'; g.fillText(name, x + 110, ry);
    g.textAlign = 'right'; g.font = '600 54px "Cormorant Garamond"'; g.fillStyle = on ? '#ffe3a0' : 'rgba(244,239,228,.75)'; g.fillText(d + ' deniers', x + bw - 110, ry);
    for (let k = 0; k < d; k++) coin(x + bw - 84 + (k % 2) * 0, ry - 18 + k * 9 - (d - 1) * 4.5, 14 * (on ? 1 : .9) * (.6 + .4 * lit));
    if (on) { const bx = x + 64 + Math.sin(t * 7) * 4; g.fillStyle = GOLD; g.beginPath(); g.moveTo(bx - 12, ry - 14); g.lineTo(bx + 12, ry); g.lineTo(bx - 12, ry + 14); g.fill(); }
  });
  g.restore();
}

// —— Subtitles (phrases from the channel voice timing) ——
function subtitles(t) {
  for (const s of SUBS) {
    const a = ss(seg(t, s.t, s.t + .15)) * (1 - ss(seg(t, s.out - .12, s.out)));
    if (a <= 0) continue;
    g.save(); g.globalAlpha = a; g.textAlign = 'center'; g.textBaseline = 'alphabetic'; g.font = 'italic 500 60px "Cormorant Garamond"';
    const lines = wrap(s.sub, 900), y0 = 1510 - (lines.length - 1) * 34;
    band(y0 + (lines.length - 1) * 34 - 18, 120 + lines.length * 60, 1);
    g.shadowColor = 'rgba(0,0,0,.95)'; g.shadowBlur = 12; g.shadowOffsetY = 2; g.fillStyle = PARCH;
    lines.forEach((L, i) => g.fillText(L, W / 2, y0 + i * 68));
    g.restore();
  }
}

// —— Title ——
function title(t) {
  const a = ss(seg(t, T.titleIn, T.titleIn + 1.2)), out = 1 - ss(seg(t, 55.7, 56.4));
  if (a <= 0) return;
  g.save(); g.textAlign = 'center'; g.textBaseline = 'middle';
  band(560, 520, a * out);
  g.globalAlpha = a * out; g.font = '700 92px Cinzel';
  const gr = g.createLinearGradient(0, 460, 0, 650); gr.addColorStop(0, '#fff3cf'); gr.addColorStop(.55, '#e2c27c'); gr.addColorStop(1, '#a8803e');
  g.fillStyle = gr; glowText(() => { spaced('THE BATHS', W / 2, 500, 12); spaced('ARE HOT', W / 2, 610, 12); }, 'rgba(255,200,120,.5)', 34);
  ornament(W / 2, 685, 260 * (.3 + .7 * a), a * out);
  const b = ss(seg(t, T.titleIn + .8, T.titleIn + 1.6));
  g.globalAlpha = b * out; g.font = 'italic 500 50px "Cormorant Garamond"'; g.fillStyle = '#f3ead6'; glowText(() => g.fillText('Ordinary Lives · Paris, 1292', W / 2, 752), 'rgba(0,0,0,.8)', 10);
  g.restore();
}

// —— Black between sets ——
const FADES = [[28.4, .3, .35], [37.2, .3, .3], [42.6, .3, .35], [50.3, .3, .35]];
function blackout(t) {
  let a = 1 - ss(seg(t, 0, .5));
  for (const [c, o, i] of FADES) { if (t < c && t > c - o) a = Math.max(a, ss((t - (c - o)) / o)); if (t >= c && t < c + i) a = Math.max(a, 1 - ss((t - c) / i)); }
  a = Math.max(a, ss(seg(t, 55.9, 56.4)));
  if (a > 0) { g.fillStyle = `rgba(0,0,0,${a})`; g.fillRect(0, 0, W, H); }
}

export function drawOverlay(t) {
  g.clearRect(0, 0, W, H);
  card(t, .25, 4.9, 'SATURDAY', 'Paris, 1292');
  dialog(t, T.statIn, T.statOut, "PROVOST'S STATUTE", 'No one may cry their baths until it is day.', T.statIn + .3, T.statIn + 3.0, 250);
  dialog(t, T.cryIn - .25, T.cryOut, 'CRIER', 'The baths are hot!', 26.95, 27.9, 250);
  menu(t);
  card(t, T.sundayCard, 42.3, 'SUNDAY', 'Every fire stays cold');
  subtitles(t);
  title(t);
  blackout(t);
}
