// Style frames, set 2, for «Погода Бишкека за день»: Risograph · Pop Art · Neon Tubes · Crayon Picture Book.
// Each is drawn as its medium: ink plates + halftone, glass tubes + light, wax on paper tooth. ?style=riso|pop|neon|crayon
'use strict';
const W = 1080, H = 1920;
const cv = document.getElementById('c'), X = cv.getContext('2d');
const mk = () => { const c = document.createElement('canvas'); c.width = W; c.height = H; return c; };
function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const hex = h => [parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255];
// value noise
function hash2(x, y) { let h = Math.imul(x, 374761393) + Math.imul(y, 668265263); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
function vnoise(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const s = t => t * t * (3 - 2 * t), u = s(xf), v = s(yf);
  const a = hash2(xi, yi), b = hash2(xi + 1, yi), c = hash2(xi, yi + 1), d = hash2(xi + 1, yi + 1);
  return (a * (1 - u) + b * u) * (1 - v) + (c * (1 - u) + d * u) * v;
}
const style = new URLSearchParams(location.search).get('style') || 'riso';

// ============================================================ shared: ink plates → printed page
// plates: [{canvas (alpha = density), ink, dx, dy, angle, period}], paper colour; multiply overprint
function printPlates(plates, paper, { grain = 0.06, solid = 0.9, key = null } = {}) {
  const out = X.createImageData(W, H), o = out.data;
  const pp = hex(paper);
  const P = plates.map(p => ({ ...p, d: p.canvas.getContext('2d').getImageData(0, 0, W, H).data, c: hex(p.ink), ca: Math.cos(p.angle * Math.PI / 180), sa: Math.sin(p.angle * Math.PI / 180) }));
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = (y * W + x) * 4;
    const fib = 1 - 0.035 * vnoise(x * 0.05, y * 0.8) - 0.02 * vnoise(x * 0.3, y * 0.3);
    let r = pp[0] * fib, g = pp[1] * fib, b = pp[2] * fib;
    for (const p of P) {
      const sx = Math.round(x - p.dx), sy = Math.round(y - p.dy);
      if (sx < 0 || sy < 0 || sx >= W || sy >= H) continue;
      const d = p.d[(sy * W + sx) * 4 + 3] / 255;
      if (d < 0.02) continue;
      let cov;
      const n = (hash2(x, y) - 0.5) * grain + (vnoise(x * 0.01, y * 0.003) - 0.5) * 0.12;   // grain + feed streak
      if (d >= solid) cov = hash2(x * 7, y * 3) < 0.004 ? 0.2 : clamp(0.9 + n);              // solid with pinholes
      else {
        const u = (x * p.ca + y * p.sa) * 2 * Math.PI / p.period, v = (-x * p.sa + y * p.ca) * 2 * Math.PI / p.period;
        const spot = 0.5 + 0.25 * (Math.cos(u) + Math.cos(v));
        cov = clamp((d - spot + n * 0.5) / 0.09 + 0.5);
      }
      r *= 1 - cov * (1 - p.c[0]); g *= 1 - cov * (1 - p.c[1]); b *= 1 - cov * (1 - p.c[2]);
    }
    o[i] = r * 255; o[i + 1] = g * 255; o[i + 2] = b * 255; o[i + 3] = 255;
  }
  X.putImageData(out, 0, 0);
  if (key) X.drawImage(key, 0, 0);
}

// ============================================================ 1. RISOGRAPH — 18:00, the smog eats the mountains
function riso() {
  const INK = { blue: '#0078BF', yellow: '#FFE800', pink: '#FF48B0' };
  const pl = { blue: mk(), yellow: mk(), pink: mk() };
  const c = k => pl[k].getContext('2d');
  const fill = (k, a, f) => { const g = c(k); g.save(); g.globalAlpha = a; g.fillStyle = '#000'; g.beginPath(); f(g); g.fill(); g.restore(); };
  const knock = (f) => { for (const k in pl) { const g = c(k); g.save(); g.globalCompositeOperation = 'destination-out'; g.fillStyle = '#000'; g.beginPath(); f(g); g.fill(); g.restore(); } };
  // sky: peach (pink tint over yellow tint) → smog band (yellow 45 %)
  fill('pink', 0.22, g => g.rect(0, 0, W, 1150));
  fill('yellow', 0.3, g => g.rect(0, 0, W, 760));
  fill('yellow', 0.55, g => g.rect(0, 760, W, 390));
  // the sun: solid pink disc, half swallowed by smog
  fill('pink', 1, g => g.arc(720, 690, 150, 0, Math.PI * 2));
  // Ala-Too: a ghost — blue only at 20 % (you can barely see them)
  fill('blue', 0.2, g => { g.moveTo(0, 900); for (let x = 0; x <= W; x += 30) g.lineTo(x, 760 - 140 * Math.abs(Math.sin(x * 0.006 + 0.4)) - 60 * Math.sin(x * 0.021)); g.lineTo(W, 1000); g.lineTo(0, 1000); });
  // smog stripes over everything (yellow tint bands)
  for (let i = 0; i < 4; i++) fill('yellow', 0.35, g => g.rect(0, 820 + i * 70, W, 26));
  // the city: solid blue blocks, windows knocked out to paper, a few lit (yellow)
  const r = rng(4);
  const blocks = []; for (let x = -10; x < W; ) { const w = 90 + r() * 110, h = 140 + r() * 260; blocks.push([x, 1150 - h, w, h]); x += w + 6; }
  blocks.forEach(([x, y, w, h]) => fill('blue', 1, g => g.rect(x, y, w, h + 10)));
  blocks.forEach(([x, y, w, h]) => { for (let yy = y + 26; yy < 1130; yy += 44) for (let xx = x + 16; xx < x + w - 24; xx += 34) if (r() < 0.55) { knock(g => g.rect(xx, yy, 16, 22)); if (r() < 0.5) fill('yellow', 1, g => g.rect(xx, yy, 16, 22)); } });
  // street: blue 55 % tint
  fill('blue', 0.55, g => g.rect(0, 1150, W, 770));
  // the figure: paper-white knockout halo, then pink coat + blue mask
  const fx = 300, fy = 1270;
  knock(g => { g.ellipse(fx, fy - 70, 64, 120, 0, 0, Math.PI * 2); g.moveTo(fx + 50, fy - 210); g.arc(fx, fy - 210, 50, 0, Math.PI * 2); });
  fill('pink', 1, g => { g.moveTo(fx - 50, fy); g.lineTo(fx - 40, fy - 150); g.quadraticCurveTo(fx, fy - 175, fx + 40, fy - 150); g.lineTo(fx + 50, fy); });
  fill('yellow', 0.35, g => g.arc(fx, fy - 210, 42, 0, Math.PI * 2));
  fill('blue', 1, g => g.rect(fx - 30, fy - 205, 60, 26));
  // title — the riso double hit: blue and pink plates offset
  const t = (k, a, s, x, y, font, al = 'left') => { const g = c(k); g.save(); g.globalAlpha = a; g.fillStyle = '#000'; g.font = font; g.textAlign = al; g.fillText(s, x, y); g.restore(); };
  knock(g => g.rect(56, 250, 600, 230));
  t('pink', 1, '18:00', 72 + 8, 440 + 6, "900 210px Rubik");
  t('blue', 1, '18:00', 72, 440, "900 210px Rubik");
  t('blue', 1, 'горы? какие горы?', 76, 540, "700 64px Jost");
  // subtitle: a paper-white knockout strip, text on one plate
  knock(g => g.roundRect(70, 1400, 800, 100, 14));
  t('blue', 1, 'Вечером горы прячутся в смоге.', 470, 1465, "600 42px Jost", 'center');
  printPlates([
    { canvas: pl.yellow, ink: INK.yellow, dx: 0, dy: 0, angle: 0, period: 7 },
    { canvas: pl.pink, ink: INK.pink, dx: 4, dy: -3, angle: 75, period: 7 },
    { canvas: pl.blue, ink: INK.blue, dx: -3, dy: 2, angle: 15, period: 7 },
  ], '#F4EEE2');
}

// ============================================================ 2. POP ART — the same day, pulled four times
function pop() {
  const INK = { red: '#E4232B', yellow: '#FFD21F', blue: '#1E62B0' };
  const pl = { red: mk(), yellow: mk(), blue: mk() }, key = mk();
  const c = k => pl[k].getContext('2d'), K = key.getContext('2d');
  const fill = (k, a, f) => { const g = c(k); g.save(); g.globalAlpha = a; g.fillStyle = '#000'; g.beginPath(); f(g); g.fill(); g.restore(); };
  const knock = (f) => { for (const k in pl) { const g = c(k); g.save(); g.globalCompositeOperation = 'destination-out'; g.beginPath(); f(g); g.fill(); g.restore(); } };
  const keyStroke = (w, f) => { K.save(); K.strokeStyle = '#141414'; K.lineWidth = w; K.lineJoin = 'round'; K.lineCap = 'round'; K.beginPath(); f(K); K.stroke(); K.restore(); };
  // headline: condensed, printed in, with an offset shadow plate
  const head = (s, x, y, size, col, sh) => {
    c(sh).save(); c(sh).font = `700 ${size}px Oswald`; c(sh).fillStyle = '#000'; c(sh).fillText(s, x + 10, y + 10); c(sh).restore();
    knock(g => { g.font = `700 ${size}px Oswald`; }); { const g = c(col); g.save(); g.font = `700 ${size}px Oswald`; g.fillText(s, x, y); g.restore(); }
    K.save(); K.font = `700 ${size}px Oswald`; K.lineWidth = 6; K.strokeStyle = '#141414'; K.lineJoin = 'round'; K.strokeText(s, x, y); K.restore();
  };
  // four prints of the same image: a sky window with the weather, four colourways
  const tiles = [
    { t: '07:00', ground: ['blue', 1], icon: 'snow', iconInk: null, label: 'СНЕГ' },
    { t: '13:00', ground: ['red', 1], icon: 'sun', iconInk: 'yellow', label: 'ЖАРА' },
    { t: '18:00', ground: ['red', 0.55, 'blue', 0.55], icon: 'cloud', iconInk: null, label: 'СМОГ' },
    { t: '23:00', ground: ['blue', 1], icon: 'snow', iconInk: null, label: 'ЗИМА' },
  ];
  const TW = 400, TH = 470, x0 = 70, y0 = 520, gap = 30;
  tiles.forEach((T, i) => {
    const x = x0 + (i % 2) * (TW + gap), y = y0 + Math.floor(i / 2) * (TH + gap);
    const j = (i * 3) % 5 - 2;                                   // each pull a little different
    for (let k = 0; k < T.ground.length; k += 2) fill(T.ground[k], T.ground[k + 1], g => g.rect(x + j, y + j, TW, TH));
    // dot shading gets heavier towards the bottom of each print
    fill('yellow', 0.25, g => g.rect(x, y + TH * 0.7, TW, TH * 0.3));
    const cx = x + TW / 2, cy = y + TH / 2 - 20;
    knock(g => g.arc(cx, cy, 130, 0, Math.PI * 2));               // a paper disc behind the subject
    if (T.icon === 'sun') {
      fill('yellow', 1, g => g.arc(cx, cy, 95, 0, Math.PI * 2));
      fill('red', 0.35, g => g.arc(cx + 20, cy + 25, 95, 0, Math.PI * 2));
      keyStroke(7, g => { g.arc(cx, cy, 95, 0, Math.PI * 2); for (let a = 0; a < 12; a++) { const A = a * Math.PI / 6; g.moveTo(cx + 108 * Math.cos(A), cy + 108 * Math.sin(A)); g.lineTo(cx + 125 * Math.cos(A), cy + 125 * Math.sin(A)); } });
    } else if (T.icon === 'snow') {
      fill('blue', 0.3, g => g.arc(cx, cy, 128, 0, Math.PI * 2));
      keyStroke(11, g => { for (let a = 0; a < 6; a++) { const A = a * Math.PI / 3; const ex = cx + 90 * Math.cos(A), ey = cy + 90 * Math.sin(A); g.moveTo(cx, cy); g.lineTo(ex, ey); const mx = cx + 55 * Math.cos(A), my = cy + 55 * Math.sin(A); for (const s of [-1, 1]) { g.moveTo(mx, my); g.lineTo(mx + 28 * Math.cos(A + s * 0.8), my + 28 * Math.sin(A + s * 0.8)); } } });
    } else {
      const cl = g => { g.arc(cx - 50, cy + 20, 50, 0, Math.PI * 2); g.moveTo(cx + 90, cy); g.arc(cx + 30, cy, 60, 0, Math.PI * 2); g.moveTo(cx + 40, cy - 40); g.arc(cx - 10, cy - 30, 55, 0, Math.PI * 2); };
      fill('red', 0.45, cl); fill('blue', 0.45, cl);
      keyStroke(7, g => { g.arc(cx - 50, cy + 20, 50, 0.6, 3.6); g.moveTo(cx - 52, cy - 50); g.arc(cx - 10, cy - 30, 55, 3.5, 6.0); g.moveTo(cx + 50, cy - 54); g.arc(cx + 30, cy, 60, 4.6, 7.6); g.moveTo(cx - 100, cy + 40); g.lineTo(cx + 80, cy + 50); });
    }
    keyStroke(8, g => g.rect(x + j, y + j, TW, TH));
    // label slip: paper, black frame, plate-coloured block behind, tilted
    const lx = x + 30, ly = y + TH - 96;
    fill('yellow', 1, g => g.rect(lx + 10, ly + 10, 250, 70));
    knock(g => g.rect(lx, ly, 250, 70));
    keyStroke(5, g => g.rect(lx, ly, 250, 70));
    K.save(); K.font = '700 30px Oswald'; K.fillStyle = '#141414'; K.fillText(`${T.t} · ${T.label}`, lx + 16, ly + 47); K.restore();
  });
  head('1 ДЕНЬ.', 70, 390, 150, 'red', 'blue');
  head('4 ПОГОДЫ.', 70, 500, 100, 'yellow', 'red');
  // subtitle: the same paper slip, bottom centre
  knock(g => g.rect(110, 1510, 760, 76));
  fill('red', 1, g => g.rect(120, 1520, 760, 76));
  knock(g => g.rect(110, 1510, 760, 76));
  keyStroke(5, g => g.rect(110, 1510, 760, 76));
  K.save(); K.font = '700 40px Oswald'; K.fillStyle = '#141414'; K.textAlign = 'center'; K.fillText('ОДИН И ТОТ ЖЕ ДЕНЬ. ЧЕТЫРЕ РАЗНЫХ.', 490, 1562); K.restore();
  printPlates([
    { canvas: pl.yellow, ink: INK.yellow, dx: 0, dy: 0, angle: 0, period: 16 },
    { canvas: pl.red, ink: INK.red, dx: 5, dy: 3, angle: 45, period: 16 },
    { canvas: pl.blue, ink: INK.blue, dx: -4, dy: 4, angle: 15, period: 16 },
  ], '#F8F2E2', { key });
}

// ============================================================ 3. NEON TUBES — 23:00, winter again on a wet street
function neon() {
  const Hh = 1300;                                  // facade height; below it the wet street mirrors it
  const fac = mk(), F = fac.getContext('2d');
  // brick facade
  F.fillStyle = '#120d10'; F.fillRect(0, 0, W, Hh);
  const r = rng(2);
  for (let y = 0, row = 0; y < Hh; y += 44, row++) for (let x = (row % 2) * -60; x < W; x += 120) {
    const v = 22 + r() * 12; F.fillStyle = `rgb(${v + 8},${v - 2},${v})`; F.fillRect(x + 3, y + 3, 114, 38);
  }
  // a shopfront with a roller shutter and a painted clock
  F.fillStyle = '#1b1a22'; F.fillRect(560, 900, 360, 400);
  for (let y = 910; y < 1300; y += 18) { F.fillStyle = y % 36 ? '#26252f' : '#2e2d38'; F.fillRect(566, y, 348, 12); }
  F.fillStyle = '#e9e2cf'; F.fillRect(640, 780, 200, 90); F.fillStyle = '#2b2b2b'; F.font = '700 64px Jost'; F.textAlign = 'center'; F.fillText('23:00', 740, 848);
  // boards behind the signs
  F.fillStyle = '#1a0a24'; F.beginPath(); F.roundRect(90, 300, 760, 300, 24); F.fill();
  F.fillStyle = '#0a1626'; F.beginPath(); F.roundRect(120, 660, 330, 330, 24); F.fill();
  // emission layer
  const em = mk(), E = em.getContext('2d');
  const tube = (ctx, col, w, draw) => {
    ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.strokeStyle = col; ctx.lineWidth = w; ctx.beginPath(); draw(ctx); ctx.stroke();
    ctx.restore();
  };
  const glassTube = (col, w, draw) => {
    // halo into the emission layer
    tube(E, col, w * 1.1, draw);
    // glass on the facade: rim, gas column, hot core, top highlight
    tube(F, 'rgba(255,255,255,0.25)', w + 6, draw);
    tube(F, col, w, draw);
    tube(F, 'rgba(255,255,255,0.75)', w * 0.35, draw);
    F.save(); F.translate(0, -w * 0.25); tube(F, 'rgba(255,255,255,0.55)', 2, draw); F.restore();
  };
  // sign 1: words as bent glass (monoline letters)
  const word = (s, x, y, size, col) => {
    E.save(); E.textAlign = 'left'; E.font = `300 ${size}px Comfortaa`; E.fillStyle = col; E.fillText(s, x, y); E.restore();
    F.save(); F.textAlign = 'left'; F.font = `300 ${size}px Comfortaa`;
    F.strokeStyle = 'rgba(255,255,255,0.3)'; F.lineWidth = 6; F.strokeText(s, x, y);
    F.fillStyle = col; F.fillText(s, x, y);
    F.globalCompositeOperation = 'lighter'; F.fillStyle = 'rgba(255,255,255,0.35)'; F.fillText(s, x, y); F.restore();
  };
  word('СНОВА', 140, 430, 132, '#ff3d9e');
  word('ЗИМА', 250, 565, 132, '#ff3d9e');
  // sign 2: a snowflake in argon blue
  const sx = 285, sy = 825;
  glassTube('#3d75ff', 14, g => { for (let a = 0; a < 6; a++) { const A = a * Math.PI / 3 - Math.PI / 2; g.moveTo(sx, sy); g.lineTo(sx + 120 * Math.cos(A), sy + 120 * Math.sin(A)); const mx = sx + 75 * Math.cos(A), my = sy + 75 * Math.sin(A); for (const s of [-1, 1]) { g.moveTo(mx, my); g.lineTo(mx + 36 * Math.cos(A + s * 0.75), my + 36 * Math.sin(A + s * 0.75)); } } });
  // the hero: one outline tube (turquoise), pink eyes, shivering marks
  const hx = 330, hy = 1290;
  glassTube('#1ff2d9', 12, g => { g.moveTo(hx - 60, hy); g.bezierCurveTo(hx - 80, hy - 120, hx - 60, hy - 230, hx, hy - 232); g.bezierCurveTo(hx + 60, hy - 230, hx + 80, hy - 120, hx + 60, hy); g.closePath(); });
  glassTube('#ff3d9e', 8, g => { g.moveTo(hx - 22, hy - 150); g.lineTo(hx - 22, hy - 132); g.moveTo(hx + 22, hy - 150); g.lineTo(hx + 22, hy - 132); });
  glassTube('#1ff2d9', 6, g => { for (const s of [-1, 1]) for (let k = 0; k < 3; k++) { g.moveTo(hx + s * (100 + k * 12), hy - 160 + k * 30); g.lineTo(hx + s * (112 + k * 12), hy - 146 + k * 30); } });
  // compose: emission blurred = light on brick + bloom
  X.drawImage(fac, 0, 0);
  X.save(); X.globalCompositeOperation = 'lighter';
  for (const [b, a] of [[60, 0.55], [22, 0.6], [6, 0.5]]) { X.filter = `blur(${b}px)`; X.globalAlpha = a; X.drawImage(em, 0, 0); }
  X.restore(); X.filter = 'none';
  // falling snow, lit by the signs
  const s2 = rng(9);
  for (let i = 0; i < 140; i++) { const x = s2() * W, y = s2() * Hh, rr = 1.5 + s2() * 3; X.fillStyle = `rgba(255,235,250,${0.4 + s2() * 0.5})`; X.beginPath(); X.arc(x, y, rr, 0, Math.PI * 2); X.fill(); }
  // wet street: asphalt + smeared reflection + sharper puddles
  X.fillStyle = '#0b0b0f'; X.fillRect(0, Hh, W, H - Hh);
  const snap = mk(); snap.getContext('2d').drawImage(cv, 0, 0);
  X.save(); X.beginPath(); X.rect(0, Hh, W, H - Hh); X.clip();
  X.translate(0, Hh * 2); X.scale(1, -1);
  X.filter = 'blur(10px)'; X.globalAlpha = 0.35; X.drawImage(snap, 0, 0);
  X.restore(); X.filter = 'none';
  for (const [px, py, rx, ry] of [[300, 1420, 260, 50], [760, 1520, 220, 40]]) {
    X.save(); X.beginPath(); X.ellipse(px, py, rx, ry, 0, 0, Math.PI * 2); X.clip();
    X.translate(0, Hh * 2); X.scale(1, -1); X.filter = 'blur(2px)'; X.globalAlpha = 0.85; X.drawImage(snap, 0, 0); X.restore(); X.filter = 'none';
  }
  X.fillStyle = '#2a2a33'; X.fillRect(0, Hh, W, 8);
  // vignette
  const v = X.createRadialGradient(495, 900, 300, 495, 900, 1300); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.6)'); X.fillStyle = v; X.fillRect(0, 0, W, H);
}

// ============================================================ 4. CRAYON PICTURE BOOK — 07:00, snow, put everything on
function crayon() {
  const LINE = '#2E2A6B';
  const wax = mk(), G = wax.getContext('2d');
  const R = rng(5);
  const wob = (x, y, a = 1.5) => [x + (R() - 0.5) * a, y + (R() - 0.5) * a];
  // a crayon line: several thin passes with hand wobble
  const line = (pts, col, w = 7, p = 0.95) => {
    for (let k = 0; k < 3; k++) {
      G.save(); G.strokeStyle = col; G.globalAlpha = p * (k ? 0.6 : 1); G.lineWidth = w * (k ? 0.5 : 1); G.lineCap = 'round'; G.lineJoin = 'round'; G.beginPath();
      pts.forEach(([x, y], i) => { const [a, b] = wob(x, y, 3); i ? G.lineTo(a, b) : G.moveTo(a, b); }); G.stroke(); G.restore();
    }
  };
  const circlePts = (cx, cy, rx, ry, n = 40) => Array.from({ length: n + 2 }, (_, i) => [cx + rx * Math.cos(i / n * Math.PI * 2), cy + ry * Math.sin(i / n * Math.PI * 2)]);
  // zig-zag colouring inside a path, overshooting the outline a little
  const hatch = (path, col, p = 0.7, step = 9, ang = -0.5) => {
    G.save(); G.beginPath(); path(G); G.lineWidth = 16; G.strokeStyle = 'transparent'; G.clip();
    G.strokeStyle = col; G.globalAlpha = p; G.lineWidth = 11; G.lineCap = 'round';
    const ca = Math.cos(ang), sa = Math.sin(ang);
    G.beginPath(); let up = true;
    for (let t = -2200; t < 2200; t += step) { const x1 = 540 + t * ca - 2000 * sa, y1 = 960 + t * sa + 2000 * ca, x2 = 540 + t * ca + 2000 * sa, y2 = 960 + t * sa - 2000 * ca; up ? (G.moveTo(x1, y1), G.lineTo(x2, y2)) : (G.moveTo(x2, y2), G.lineTo(x1, y1)); up = !up; }
    G.stroke(); G.restore();
    G.save(); G.translate(4, 3); G.beginPath(); path(G); G.globalAlpha = p * 0.25; G.fillStyle = col; G.fill(); G.restore();   // overshoot
  };
  // sky (light pressure), sleepy sun in a hat
  hatch(g => g.rect(0, 250, W, 820), '#8EC5F2', 0.45, 12, -0.4);
  hatch(g => g.arc(820, 420, 90, 0, Math.PI * 2), '#FFC93C', 0.9);
  line(circlePts(820, 420, 90, 90), '#E89A1E', 6);
  hatch(g => { g.moveTo(730, 360); g.quadraticCurveTo(820, 260, 910, 360); g.closePath(); }, '#E2504B', 0.95);
  line([[722, 362], [820, 262], [918, 362], [722, 362]], LINE, 6);
  line([[790, 430], [805, 436]], LINE, 6); line([[835, 436], [850, 430]], LINE, 6); line([[800, 470], [840, 470]], LINE, 5);
  // child-perspective house: gable front + slanted side
  hatch(g => g.rect(110, 760, 260, 300), '#E2504B', 0.85);
  hatch(g => { g.moveTo(370, 760); g.lineTo(560, 700); g.lineTo(560, 1000); g.lineTo(370, 1060); g.closePath(); }, '#B8383A', 0.85);
  hatch(g => { g.moveTo(90, 770); g.lineTo(240, 600); g.lineTo(390, 770); g.closePath(); }, '#7A4A2A', 0.9);
  line([[110, 760], [110, 1060], [370, 1060], [370, 760], [110, 760]], LINE); line([[370, 760], [560, 700], [560, 1000], [370, 1060]], LINE);
  line([[90, 770], [240, 600], [390, 770]], LINE); line([[240, 600], [440, 560], [560, 700]], LINE);
  hatch(g => g.rect(180, 830, 80, 80), '#FFC93C', 0.9); line([[180, 830], [260, 830], [260, 910], [180, 910], [180, 830], [220, 830], [220, 910]], LINE, 5);
  // snow on the ground and roof: paper white kept, a little blue shading
  hatch(g => g.rect(0, 1060, W, 520), '#BFE0F7', 0.3, 14, 0.3);
  line([[0, 1060], [300, 1050], [600, 1068], [1080, 1050]], LINE, 6);
  for (let i = 0; i < 70; i++) { const x = R() * W, y = 260 + R() * 1250; line([[x - 7, y], [x + 7, y]], '#FFFFFF', 5, 1); line([[x, y - 7], [x, y + 7]], '#FFFFFF', 5, 1); }
  // the kid: 2.5 heads tall, a huge orange puffer zipped up to the eyes, hat with a pompom
  const kx = 760, ky = 1330;
  hatch(g => { g.moveTo(kx - 150, ky); g.bezierCurveTo(kx - 190, ky - 200, kx - 150, ky - 330, kx, ky - 340); g.bezierCurveTo(kx + 150, ky - 330, kx + 190, ky - 200, kx + 150, ky); g.closePath(); }, '#F2802E', 0.95, 8);
  for (let k = 1; k < 5; k++) line([[kx - 165 + k * 4, ky - k * 66], [kx + 165 - k * 4, ky - k * 66]], '#C85E1C', 5);
  line([[kx - 150, ky], [kx - 190, ky - 200], [kx - 150, ky - 330], [kx, ky - 340], [kx + 150, ky - 330], [kx + 190, ky - 200], [kx + 150, ky]], LINE, 8);
  hatch(g => g.arc(kx, ky - 400, 95, 0, Math.PI * 2), '#F7CFA8', 0.6);
  line(circlePts(kx, ky - 400, 95, 95), LINE, 7);
  hatch(g => { g.moveTo(kx - 100, ky - 420); g.quadraticCurveTo(kx, ky - 560, kx + 100, ky - 420); g.closePath(); }, '#3F7FD9', 0.95);
  line([[kx - 104, ky - 420], [kx, ky - 530], [kx + 104, ky - 420], [kx - 104, ky - 420]], LINE, 7);
  hatch(g => g.arc(kx, ky - 540, 26, 0, Math.PI * 2), '#FFFFFF', 1); line(circlePts(kx, ky - 540, 26, 26), LINE, 5);
  hatch(g => g.rect(kx - 110, ky - 370, 220, 70), '#2FA36B', 0.95);             // scarf up to the nose
  line([[kx - 110, ky - 370], [kx + 110, ky - 370]], LINE, 5);
  G.fillStyle = LINE; for (const s of [-1, 1]) { G.beginPath(); G.arc(kx + s * 32, ky - 405, 9, 0, Math.PI * 2); G.fill(); }
  G.fillStyle = '#FFFFFF'; for (const s of [-1, 1]) { G.beginPath(); G.arc(kx + s * 32 + 3, ky - 408, 3, 0, Math.PI * 2); G.fill(); }
  // --- composite: wax sticks to the peaks of the paper tooth, pressure = alpha
  const wd = G.getImageData(0, 0, W, H).data;
  const out = X.createImageData(W, H), o = out.data;
  const paper = [0xf4, 0xef, 0xe3];
  // one watercolour (ultramarine), sky only, resisted by wax
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = (y * W + x) * 4;
    const tooth = 0.55 * vnoise(x * 0.35, y * 0.35) + 0.3 * vnoise(x * 0.9, y * 0.9) + 0.15 * vnoise(x * 0.08, y * 2.0);
    let r = paper[0], g = paper[1], b = paper[2];
    const mot = 1 + (vnoise(x * 0.004, y * 0.004) - 0.5) * 0.04; r *= mot; g *= mot; b *= mot;
    const a = wd[i + 3] / 255;
    let cov = 0;
    if (a > 0.01) { const thr = 1 - 0.95 * a; cov = clamp((tooth - thr) / 0.08 + 0.5); }
    if (y > 250 && y < 1060) {                                // the wash, resisted by wax, pooling at the bottom edge
      const dens = 0.22 + 0.1 * vnoise(x * 0.01, y * 0.01) + (y > 1000 ? (y - 1000) / 60 * 0.12 : 0);
      const resist = 1 - 0.9 * cov; const k = dens * resist;
      r *= 1 - k * 0.75; g *= 1 - k * 0.45; b *= 1 - k * 0.05;
    }
    if (cov > 0) { r = r * (1 - cov) + wd[i] * 0.95 * cov; g = g * (1 - cov) + wd[i + 1] * 0.95 * cov; b = b * (1 - cov) + wd[i + 2] * 0.95 * cov; }
    const emb = (vnoise((x - 1) * 0.35, (y - 1) * 0.35) - vnoise(x * 0.35, y * 0.35)) * 18 * (1 - cov);
    o[i] = r + emb; o[i + 1] = g + emb; o[i + 2] = b + emb; o[i + 3] = 255;
  }
  X.putImageData(out, 0, 0);
  // the book's words: hand-lettered title + subtitle on a ragged paper patch
  X.save(); X.fillStyle = LINE; X.font = '700 118px Caveat'; X.translate(70, 230); X.rotate(-0.03); X.fillText('Утро в Бишкеке', 0, 0); X.restore();
  X.save(); X.fillStyle = '#f4efe3'; X.beginPath();
  const pr = rng(12); X.moveTo(90, 1430); for (let x = 90; x <= 900; x += 30) X.lineTo(x, 1425 + pr() * 12); for (let x = 900; x >= 90; x -= 30) X.lineTo(x, 1535 + pr() * 12); X.closePath(); X.fill(); X.restore();
  const words = 'Утром — зима. Надеваешь всё сразу.';
  X.save(); X.fillStyle = LINE; X.font = '400 52px Neucha'; X.textAlign = 'left';
  let x = 120; const wr = rng(3);
  for (const ch of words) { X.save(); X.translate(x, 1500 + (wr() - 0.5) * 6); X.rotate((wr() - 0.5) * 0.08); X.fillText(ch, 0, 0); X.restore(); x += X.measureText(ch).width; }
  X.restore();
}

(async () => {
  const sample = 'АБВабвёйщЫ ABCabc 0123456789';
  for (const f of ['900 40px Rubik', '700 40px Jost', '600 40px Jost', '700 40px Oswald', '700 40px Caveat', '400 40px Neucha', '300 40px Comfortaa']) await document.fonts.load(f, sample);
  ({ riso, pop, neon, crayon })[style]();
  window.DUR = 1; window.render = () => {}; window.READY = true;
})();
