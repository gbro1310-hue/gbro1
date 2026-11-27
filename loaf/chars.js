// Pixel people for Paris, 1303: drawn pixel by pixel (3/4 view facing right), one frame per pose, packed into an atlas.
// Billboards take the scene light. Palettes per person; poses are data.
import * as THREE from 'three';
import { PX, ramp, hex, texOf, billboard, blob } from './px.js';

export const SPX = 1 / 30;      // pixel → metres (≈1.65 m tall)
const FW = 34, FH = 50, DZ = .22;
const INK = hex('#1a1016');
const R = cols => ramp(cols, DZ);

export const PAL = {
  you: { hood: R(['#0c2414', '#163a20', '#22572e', '#30763b', '#4a9a4e']), tunic: R(['#4e3f2c', '#7a6446', '#a08660', '#c4ab80']), skin: R(['#b87a62', '#dea282', '#f3c9a6', '#ffe2c8']), hair: R(['#2e1712', '#4f2a1c', '#74412a', '#95603c']), leg: R(['#1e1a18', '#33291f', '#4a3b2b']), boot: R(['#140d0a', '#2a1b13', '#432c1e']), cloth: R(['#163a20', '#22572e', '#30763b', '#4a9a4e']) },
  crier: { cap: R(['#3a0e10', '#6a1a1a', '#9a2a24', '#c24a34']), tunic: R(['#1a2a44', '#2a4066', '#3e5a8a', '#5a7aaa']), skin: R(['#a86c54', '#cf9274', '#e9b896', '#f8d6b8']), hair: R(['#2a2420', '#4a3e34', '#6a5a4a']), leg: R(['#2a1e16', '#4a3626', '#6a5038']), boot: R(['#140d0a', '#2a1b13', '#432c1e']) },
  lurk: { hood: R(['#07070c', '#0e0e16', '#181824', '#242434']), tunic: R(['#07070c', '#0e0e16', '#181824']), skin: R(['#07070c', '#0e0e16']), hair: R(['#07070c', '#0e0e16']), leg: R(['#07070c', '#0e0e16', '#181824']), boot: R(['#050508', '#0c0c12']), noface: 1 },
  m1: { tunic: R(['#5a3a14', '#8a5a22', '#b47e34', '#d8a24a']), skin: R(['#a86c54', '#cf9274', '#e9b896', '#f8d6b8']), hair: R(['#1a1210', '#33231a', '#4e3626']), leg: R(['#2a2018', '#44342a']), boot: R(['#140d0a', '#2a1b13']) },
  m2: { tunic: R(['#3a2a3e', '#5e4664', '#82648a', '#a688ac']), skin: R(['#b87a62', '#dea282', '#f3c9a6', '#ffe2c8']), hair: R(['#6d6a70', '#9c99a0', '#c8c6cc']), leg: R(['#2a2018', '#44342a']), boot: R(['#140d0a', '#2a1b13']), coif: R(['#a8a49a', '#d2cec2', '#efebe0']) },
  m3: { tunic: R(['#4a2a1a', '#6e3e24', '#945634', '#b8744a']), skin: R(['#946048', '#b98064', '#d6a284', '#ecc4a6']), hair: R(['#5a2a12', '#82401c', '#a85a2a']), leg: R(['#2a2018', '#44342a']), boot: R(['#140d0a', '#2a1b13']) },
  master: { cap: R(['#a8a296', '#d4cec0', '#efe9dc', '#fffaf0']), tunic: R(['#8a8270', '#b4ab94', '#d6ceb8', '#ece6d4']), skin: R(['#a86c54', '#cf9274', '#e9b896', '#f8d6b8']), hair: R(['#3e3a36', '#625c56', '#8a847c']), leg: R(['#1e1a18', '#33291f', '#4a3b2b']), boot: R(['#140d0a', '#2a1b13', '#432c1e']) },
  father: { tunic: R(['#2a3036', '#454e56', '#626c74', '#808a90']), skin: R(['#a0644c', '#c8886a', '#e2ae8e', '#f2ccae']), hair: R(['#2a1a10', '#46301e', '#62462c']), leg: R(['#2a2018', '#44342a', '#5a4836']), boot: R(['#140d0a', '#2a1b13', '#432c1e']) },
  jure: { hood: R(['#2a0608', '#4e0e12', '#78181c', '#a02a28', '#c24a3c']), tunic: R(['#0e0c10', '#1c181e', '#2c2630']), skin: R(['#a86c54', '#cf9274', '#e9b896', '#f8d6b8']), hair: R(['#2e2a26', '#4a443e']), leg: R(['#0e0c10', '#1c181e', '#2c2630']), boot: R(['#0a0808', '#1a1414']) },
  jure2: { hood: R(['#20060a', '#40101a', '#681c2a', '#8c2c38', '#ae4a52']), tunic: R(['#0e0c10', '#1c181e', '#2c2630']), skin: R(['#946048', '#b98064', '#d6a284', '#ecc4a6']), hair: R(['#2e2a26', '#4a443e']), leg: R(['#0e0c10', '#1c181e', '#2c2630']), boot: R(['#0a0808', '#1a1414']) },
};
const LINEN = R(['#8c8678', '#b8b2a2', '#dcd6c6', '#f2eee2']);

// p: { step: 0..3 | undefined, bob, arm: 'low'|'cry'|'lap', sit, bare, blink, closed, mouth }
function drawPerson(P, E, p, C) {
  const sit = p.sit ? 9 : 0, by = (p.bob || 0) + sit;
  const top = 18 + by, bot = p.sit ? 41 : 41;
  // —— legs ——
  if (p.sit) {
    // thighs forward, shins down (seated on a bench)
    for (let y = 37; y < 41; y++) for (let x = 13; x < 25; x++) P.set(x, y, (p.bare ? (C.cloth || LINEN) : C.leg)(.55 - (y - 37) * .1, x, y));
    for (let y = 41; y < 48; y++) for (let x = 22; x < 26; x++) P.set(x, y, (p.bare ? C.skin : C.leg)(x === 22 ? .3 : .55, x, y));
    P.rect(22, 47, 5, 1, p.bare ? C.skin(.25, 0, 0) : C.boot(.3, 0, 0));
  } else {
    const st = p.step ?? -1;
    const legs = st < 0 ? [[13, 0], [18, 0]] : [[[11, 0], [20, -1]], [[14, -1], [17, 0]], [[20, -1], [11, 0]], [[17, 0], [14, -1]]][st];
    legs.forEach(([lx, ly], i) => {
      for (let y = 40; y < 48 + ly; y++) for (let x = lx; x < lx + 4; x++) P.set(x, y, (y > 44 + ly ? C.boot : C.leg)((i ? .55 : .85) - (x === lx ? .3 : 0), x, y));
      P.rect(lx, 47 + ly, 5, 1, C.boot(.1, 0, 0));
    });
  }
  // —— body ——
  const shL = 10, shR = 22, hmL = p.sit ? 9 : 8, hmR = p.sit ? 24 : 24, b2 = p.sit ? 39 : bot;
  if (p.bare) {
    // bare shoulders and chest, a linen cloth round the waist
    P.poly([[shL + 1, top], [shR - 1, top], [hmR - 2, top + 11], [hmL + 2, top + 11]], (x, y) => C.skin(.62 - (x - shL) / 14 * .35 + (y - top < 2 ? .1 : 0), x, y));
    P.poly([[hmL + 1, top + 10], [hmR - 1, top + 10], [hmR, b2], [hmL, b2]], (x, y) => (C.cloth || LINEN)(.7 - (x - hmL) / 16 * .4 + ((x + y) % 5 === 0 ? -.15 : 0), x, y));
  } else {
    const body = C.hood && !p.noCloak ? C.hood : C.tunic;
    P.poly([[shL, top], [shR, top], [hmR, b2], [hmL + 1, b2], [hmL, b2 - 1]], (x, y) => {
      const u = (y - top) / Math.max(1, b2 - top), l = hmL * u + shL * (1 - u), r = hmR * u + shR * (1 - u), s = (x - l) / Math.max(1, r - l);
      let v = .64 - s * .45 + (1 - u) * .12; if ((x + (y >> 2)) % 5 === 0 && u > .25) v -= .16; if (s < .12) v += .1;
      return body(v, x, y);
    });
    if (C.hood) for (let y = top + 2; y < b2 - 3; y++) for (let x = 19; x < 21; x++) P.set(x, y, C.tunic(.75 - (x - 19) * .3, x, y));
    P.rect(12, top + 11, 11, 1, C.boot(.6, 0, 0));   // belt
  }
  // —— head ——
  const hx = 16, hy = 12 + by, fx = hx + 2, fy = hy + 1.2;
  if (C.hood && !p.bare) P.ellipse(hx - .5, hy - .5, 7.5, 7.5, (x, y, dx, dy) => C.hood(.74 - dx * .35 - dy * .25, x, y));
  if (!C.noface) {
    P.ellipse(fx, fy, 4.6, 4.6, (x, y, dx, dy) => C.skin(.62 - dx * .1 - dy * .3 + (dx > .55 ? -.2 : 0), x, y));
    if (!C.hood || p.bare) {   // hair (or coif / cap)
      const H = C.coif || C.cap || C.hair;
      for (let x = Math.floor(fx - 5); x <= fx + 3; x++) for (let y = Math.floor(fy - 5.5); y < fy - 2.5 + (x < fx - 2 ? 4 : 0); y++) P.set(x, y, H(.6 + (x - fx) * .04 - (y - fy + 5) * .05, x, y));
      if (C.cap) { P.rect(Math.floor(fx - 5), Math.floor(fy - 4), 10, 1, C.cap(.25, 0, 0)); }
    } else {
      for (let x = Math.floor(fx - 4); x <= fx + 3; x++) P.set(x, Math.floor(fy - 4.2), C.hair(.5, x, 0));
    }
    const ey = Math.round(fy);
    if (p.blink || p.closed) { P.set(Math.round(fx + 2), ey, INK); P.set(Math.round(fx - 1), ey, INK); }
    else { P.set(Math.round(fx + 2), ey, INK); P.set(Math.round(fx + 2), ey - 1, INK); P.set(Math.round(fx - 1), ey, INK); P.set(Math.round(fx - 1), ey - 1, INK); }
    P.set(Math.round(fx + 4), ey + 1, C.skin(.4, 0, 0));
    if (p.mouth) { P.rect(Math.round(fx + 2), ey + 3, 2, 2, INK); } else P.set(Math.round(fx + 2), ey + 3, C.skin(.25, 0, 0));
    P.set(Math.round(fx + 3), ey + 2, hex('#e0907a'));
  } else {
    P.ellipse(fx + 1, fy, 3.6, 4, (x, y) => hex('#020204'));   // empty hood
  }
  // —— arms ——
  const arm = p.arm || 'low', sk = C.skin, sl = p.bare ? C.skin : (C.hood && !p.bare ? C.hood : C.tunic);
  const sleeve = pts => pts.forEach(([x, y]) => { P.set(x, y, sl(.6, x, y)); P.set(x, y + 1, sl(.32, x, y)); });
  if (arm === 'low') { sleeve([[21, top + 2], [22, top + 3], [23, top + 4], [23, top + 5], [23, top + 6], [23, top + 7]]); P.rect(23, top + 8, 2, 2, sk(.6, 0, 0)); }
  if (arm === 'cry') { sleeve([[21, top + 1], [23, top], [24, top - 1], [25, top - 2], [25, top - 3]]); P.rect(24, top - 6, 2, 3, sk(.6, 0, 0)); }
  if (arm === 'lap') { sleeve([[21, top + 2], [22, top + 4], [23, top + 6], [24, top + 8]]); P.rect(24, top + 9, 3, 2, sk(.55, 0, 0)); }
  if (arm === 'sew') { sleeve([[21, top + 2], [22, top + 3], [23, top + 3], [24, top + 3]]); P.rect(25, top + 2, 2, 2, sk(.6, 0, 0)); }
  if (arm === 'sewU') { sleeve([[21, top + 2], [22, top + 2], [23, top + 1], [24, top]]); P.rect(25, top - 2, 2, 2, sk(.6, 0, 0)); P.set(26, top - 4, hex('#ffe08a')); P.set(26, top - 5, hex('#ffe08a')); }
  if (arm === 'hold') { sleeve([[21, top + 2], [22, top + 3], [23, top + 4], [24, top + 5]]); P.rect(24, top + 5, 3, 3, hex('#d8b25a')); P.set(25, top + 6, hex('#fff0b8')); }
  if (!p.bare && arm !== 'cry') P.set(9, top + 9, sk(.35, 0, 0));
}

export const POSES = {
  idle0: { arm: 'low' }, idle1: { arm: 'low', bob: 1 }, blink: { arm: 'low', blink: 1 },
  w0: { step: 0 }, w1: { step: 1, bob: -1 }, w2: { step: 2 }, w3: { step: 3, bob: -1 },
  cry0: { arm: 'cry', mouth: 1 }, cry1: { arm: 'cry', mouth: 1, bob: 1 },
  sit0: { sit: 1, arm: 'lap' }, sit1: { sit: 1, arm: 'lap', bob: 1 }, sitB: { sit: 1, arm: 'lap', blink: 1 },
  sew0: { sit: 1, arm: 'sew' }, sew1: { sit: 1, arm: 'sewU' }, sewB: { sit: 1, arm: 'sew', blink: 1 },
  hold0: { arm: 'hold' }, hold1: { arm: 'hold', bob: 1 },
  hw0: { step: 0, arm: 'hold' }, hw1: { step: 1, bob: -1, arm: 'hold' }, hw2: { step: 2, arm: 'hold' }, hw3: { step: 3, bob: -1, arm: 'hold' },
  bare0: { sit: 1, bare: 1, arm: 'lap', closed: 1 }, bare1: { sit: 1, bare: 1, arm: 'lap', closed: 1, bob: 1 }, bareO: { sit: 1, bare: 1, arm: 'lap' },
};

function atlas(C) {
  const names = Object.keys(POSES), n = names.length, P = new PX(FW * n, FH);
  names.forEach((k, i) => {
    const p1 = new PX(FW, FH); drawPerson(p1, null, POSES[k], C); p1.outline(.3);
    for (let y = 0; y < FH; y++) for (let x = 0; x < FW; x++) { const c = p1.get(x, y); if (c) P.set(i * FW + x, y, c); }
  });
  const tex = texOf(P.done()); tex.repeat.set(1 / n, 1);
  return { tex, names, n };
}

export function makePerson(pal, o = {}) {
  const A = atlas(PAL[pal]);
  const mesh = billboard(A.tex, FW * SPX, FH * SPX, { shadow: o.shadow ?? true });
  const root = new THREE.Group(); root.add(mesh); root.userData.char = pal;
  const sh = blob(.42, .5); sh.position.y = .015; root.add(sh);
  return {
    root, mesh, shadowBlob: sh,
    frame(name) { const i = A.names.indexOf(name); if (i < 0) throw new Error('frame ' + name); A.tex.offset.x = i / A.n; },
    face(cam, flip = false) { root.rotation.y = Math.atan2(cam.position.x - root.position.x, cam.position.z - root.position.z); mesh.scale.x = flip ? -1 : 1; },
  };
}
