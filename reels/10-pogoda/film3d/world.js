// «Погода Бишкека за день» — Lemo-Opuscar Low-poly Isometric Island, 1080×1920, 30 fps.
// A Bishkek block on a floating hex island, orthographic iso camera. Light (not texture) tells the time:
// snow morning → summer noon → smoggy evening → snowy night. render(t) is pure: every transform comes from t.
import * as THREE from '/node_modules/three/build/three.module.js';

const W = 1080, H = 1920;
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const seg = (t, a, b) => clamp((t - a) / (b - a));
const lerp = (a, b, p) => a + (b - a) * p;
const ease = p => p * p * (3 - 2 * p);
function hash(i, j = 0) { let h = Math.imul(i, 374761393) + Math.imul(j, 668265263); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
// arrival curves: rise from below with a damped overshoot; pop with ~25 % overshoot
const rise = (t, t0, d = 0.35) => { if (t < t0 - d) return -1; if (t < t0) { const p = seg(t, t0 - d, t0); return -1 + p * p * (3 - 2 * p); } const s = t - t0; return Math.exp(-7 * s) * Math.sin(16 * s) * 0.18; };
const popS = (t, t0) => t < t0 ? 0 : 1 - Math.exp(-9 * (t - t0)) * Math.cos(15 * (t - t0));

// ============================================================ timeline (shared with the pen & wash version: 3/4, 144 BPM)
const BEAT = 60 / 144, BAR = 3 * BEAT, at = (bar, beat = 0) => (bar * 3 + beat) * BEAT;
const SC = [
  { id: 'h', w: 'snow', t0: at(0), t1: at(4), voice: 'h0', note: null, sub: ['В Бишкеке прогноз погоды не нужен.', 'Просто бери с собой всё.'] },
  { id: 'snow', w: 'snow', t0: at(4), t1: at(8), voice: 's1', note: '07:00 · снег', sub: ['7 утра. Снег.', 'Пуховик, шапка, шарф — поехали.'] },
  { id: 'sun', w: 'sun', t0: at(8), t1: at(12), voice: 's2', note: '13:00 · солнце', sub: ['13:00. Лето.', 'Пуховик теперь носишь в руках.'] },
  { id: 'smog', w: 'smog', t0: at(12), t1: at(16), voice: 's3', note: '18:00 · смог', sub: ['18:00. Смог.', 'Горы? Какие горы?'] },
  { id: 'night', w: 'night', t0: at(16), t1: at(20), voice: 's4', note: '23:00 · снова снег', sub: ['23:00. Снова зима.', 'А пуховик — на работе.'] },
  { id: 'end', w: 'night', t0: at(20), t1: at(25), voice: 'f0', note: 'а у тебя?', sub: ['А тебя погода сегодня как переобула?', 'Пиши в комменты ↓'] },
];
const DUR = SC[SC.length - 1].t1; window.DUR = DUR;
const VOICE_AT = { h0: 0.3, s1: at(4, 1), s2: at(8, 1), s3: at(12, 1), s4: at(16, 1), f0: at(20, 1) };
const EV = [], TEXTS_ = [];
const ev = (t, type, o = {}) => EV.push({ t: +t.toFixed(4), type, ...o });
const sceneAt = t => SC.find(s => t >= s.t0 && t < s.t1) || SC[SC.length - 1];

// ============================================================ weather keyframes (light is the clock)
const C = h => new THREE.Color(h);
const WX = {
  snow:  { zen: '#a9b8d6', hor: '#e6e3f0', sun: '#fff4e6', si: 2.0, amb: 0.95, el: 30, az: 210, fog: '#dcdcea', fogN: -4, fogF: 34, snow: 1, win: 0.15, lamp: 0, smog: 0 },
  sun:   { zen: '#7fb5ec', hor: '#ffe9c4', sun: '#fff1cf', si: 3.2, amb: 0.85, el: 55, az: 230, fog: '#f3e6cf', fogN: 4, fogF: 60, snow: 0, win: 0.0, lamp: 0, smog: 0 },
  smog:  { zen: '#b9a77e', hor: '#d9c08e', sun: '#ffb070', si: 1.4, amb: 0.9, el: 14, az: 250, fog: '#cdb58a', fogN: -16, fogF: 10, snow: 0, win: 0.35, lamp: 0.4, smog: 1 },
  night: { zen: '#1d2350', hor: '#4a4a86', sun: '#8f9cff', si: 0.55, amb: 0.35, el: 40, az: 160, fog: '#3c3f72', fogN: -2, fogF: 40, snow: 1, win: 1.0, lamp: 1, smog: 0 },
};
function weatherAt(t) {
  const s = sceneAt(t), i = SC.indexOf(s);
  const cur = WX[s.w], prev = i > 0 ? WX[SC[i - 1].w] : cur;
  const p = ease(seg(t, s.t0, s.t0 + 1.2));
  const o = {};
  for (const k in cur) o[k] = typeof cur[k] === 'string' ? C(prev[k]).lerp(C(cur[k]), p) : lerp(prev[k], cur[k], p);
  return o;
}

// ============================================================ three.js setup
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('gl'), antialias: true, alpha: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(W, H, false);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.NeutralToneMapping; renderer.outputColorSpace = THREE.SRGBColorSpace;
const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0xdcdcea, 30, 70);
const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 400);
const hemi = new THREE.HemisphereLight(0xffffff, 0x8a8aa0, 1); scene.add(hemi);
const sun = new THREE.DirectionalLight(0xffffff, 2); sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -12, right: 12, top: 12, bottom: -12, near: 1, far: 80 }); sun.shadow.bias = -0.0008; sun.shadow.normalBias = 0.02;
scene.add(sun, sun.target);

const mat = (hex, o = {}) => new THREE.MeshStandardMaterial({ color: hex, flatShading: true, roughness: 0.9, ...o });
const add = (geo, m, x = 0, y = 0, z = 0, parent = scene) => { const me = new THREE.Mesh(geo, m); me.position.set(x, y, z); me.castShadow = true; me.receiveShadow = true; parent.add(me); return me; };

// ------------------------------------------------------------ island of hex columns
const SQ3 = Math.sqrt(3);
const hexXZ = (q, r) => [SQ3 * (q + r / 2) * 1.0, 1.5 * r * 1.0];
const TILES = [];
const RAD = 4;
const SNOWCOL = C('#f4f5fb');
for (let q = -RAD; q <= RAD; q++) for (let r = -RAD; r <= RAD; r++) {
  const s = -q - r; if (Math.abs(s) > RAD) continue;
  const [x, z] = hexXZ(q, r);
  let kind = 'grass', h = 0.6 + hash(q + 9, r + 9) * 0.12;
  if (r === 1 || r === 2) { kind = 'road'; h = 0.5; }
  if (r === 0 && q > -3) { kind = 'walk'; h = 0.55; }
  if (r <= -3) { kind = 'rock'; h = 1.6 + hash(q, r) * 2.6 + (r === -4 ? 1.4 : 0); }
  const top = { grass: '#9ccc78', road: '#7c7f8f', walk: '#d8cdb8', rock: '#eef0f6' }[kind];
  const side = { grass: '#7c8a5c', road: '#5e6070', walk: '#a99f8c', rock: '#a9a4bb' }[kind];
  const jit = 1 + (hash(q * 3, r * 7) - 0.5) * 0.08;
  const col = add(new THREE.CylinderGeometry(0.97, 0.97, h, 6), mat(C(side).multiplyScalar(jit)), x, h / 2 - 0.06, z);
  const capM = mat(C(top).multiplyScalar(jit));
  const cap = add(new THREE.CylinderGeometry(0.97, 0.97, 0.12, 6), capM, x, h, z);
  const g = new THREE.Group(); scene.add(g); g.add(col, cap); col.position.set(0, h / 2 - 0.06, 0); cap.position.set(0, h, 0); g.position.set(x, 0, z);
  // order of the opening growth: a spiral from the centre outwards; mountains last
  const ring = Math.max(Math.abs(q), Math.abs(r), Math.abs(s));
  TILES.push({ g, cap, capM, top: C(top).multiplyScalar(jit), kind, h, ring, ang: Math.atan2(z, x), q, r, x, z });
}
TILES.sort((a, b) => (a.kind === 'rock') - (b.kind === 'rock') || a.ring - b.ring || a.ang - b.ang);
const GROW0 = 0.35, SLOT = BEAT / 4;
TILES.forEach((T, i) => { T.t0 = GROW0 + i * SLOT * 0.62; ev(T.t0, 'tile', { n: i, big: T.kind === 'rock' ? 1 : 0 }); });
const tileTop = (q, r) => { const T = TILES.find(T => T.q === q && T.r === r); return T ? T.h + 0.06 : 0.6; };

// ------------------------------------------------------------ props (pop in after the tiles)
const PROPS = [];
const prop = (g, t0, kind = 'pop') => { PROPS.push({ g, t0, kind }); ev(t0, kind === 'drop' ? 'knock' : 'pop'); return g; };
const tProps = TILES[TILES.length - 1].t0 + 0.25;
// khrushchyovka: 5-storey box, flat roof, a grid of windows (emissive at night)
const house = new THREE.Group();
const [hx, hz] = hexXZ(-2, 0); const hy = tileTop(-2, 0);
add(new THREE.BoxGeometry(3.6, 3.0, 1.6), mat('#e3c28f'), 0, 1.5, 0, house);
const roofM = mat('#b9a28a'); const roof = add(new THREE.BoxGeometry(3.8, 0.18, 1.8), roofM, 0, 3.09, 0, house);
const winM = []; for (let f = 0; f < 5; f++) for (let c = 0; c < 6; c++) { const m = new THREE.MeshStandardMaterial({ color: '#8fa3c0', emissive: '#ffcf7a', emissiveIntensity: 0, flatShading: true, roughness: 0.6 }); winM.push({ m, on: hash(f, c) < 0.6 }); add(new THREE.BoxGeometry(0.34, 0.3, 0.05), m, -1.45 + c * 0.58, 0.45 + f * 0.56, 0.82, house); }
house.position.set(hx - 0.3, hy, hz - 0.4); house.rotation.y = 0; scene.add(house); prop(house, tProps, 'drop');
// karagach trees: trunk + faceted crown + a snow cap
const trees = [];
[[1, -1], [3, -2], [2, -2], [-1, 3], [3, 0]].forEach(([q, r], i) => {
  const [x, z] = hexXZ(q, r); const g = new THREE.Group();
  add(new THREE.CylinderGeometry(0.1, 0.14, 0.9, 5), mat('#7a5a44'), 0, 0.45, 0, g);
  const crownM = mat('#6fa35a'); add(new THREE.IcosahedronGeometry(0.75, 0), crownM, 0, 1.25, 0, g);
  const capM = mat('#ffffff'); const cap = add(new THREE.IcosahedronGeometry(0.62, 0), capM, 0, 1.48, 0, g); cap.scale.set(1, 0.45, 1);
  g.position.set(x, tileTop(q, r), z); g.rotation.y = hash(i) * 6; scene.add(g);
  trees.push({ g, cap, crownM }); prop(g, tProps + 0.3 + i * SLOT);
});
// bus stop + lamp post
const stop = new THREE.Group();
add(new THREE.BoxGeometry(2.2, 0.08, 0.9), mat('#6f7a99'), 0, 1.5, 0, stop);
for (const x of [-1, 1]) add(new THREE.CylinderGeometry(0.04, 0.04, 1.5, 6), mat('#4a4f63'), x, 0.75, -0.3, stop);
add(new THREE.BoxGeometry(2.0, 0.9, 0.04), new THREE.MeshStandardMaterial({ color: '#bcd8e8', transparent: true, opacity: 0.5, roughness: 0.2 }), 0, 0.95, -0.38, stop);
add(new THREE.BoxGeometry(1.4, 0.08, 0.32), mat('#a8754e'), 0, 0.45, -0.2, stop);
const [sx, sz] = hexXZ(2, 0); stop.position.set(sx, tileTop(2, 0), sz); scene.add(stop); prop(stop, tProps + 0.6, 'drop');
const lamp = new THREE.Group();
add(new THREE.CylinderGeometry(0.05, 0.06, 2.4, 6), mat('#4a4f63'), 0, 1.2, 0, lamp);
const lampM = new THREE.MeshStandardMaterial({ color: '#fff3c8', emissive: '#ffd27a', emissiveIntensity: 0, flatShading: true });
add(new THREE.IcosahedronGeometry(0.16, 0), lampM, 0, 2.45, 0, lamp);
const lampLight = new THREE.PointLight('#ffcf80', 0, 7, 1.6); lampLight.position.set(0, 2.3, 0); lamp.add(lampLight);
const [lx, lz] = hexXZ(0, 0); lamp.position.set(lx + 0.6, tileTop(0, 0), lz - 0.5); scene.add(lamp); prop(lamp, tProps + 0.75);
// a tiny marshrutka parked on the road (yellow box + windows)
const bus = new THREE.Group();
add(new THREE.BoxGeometry(1.7, 0.75, 0.8), mat('#ffd23f'), 0, 0.55, 0, bus);
add(new THREE.BoxGeometry(1.2, 0.26, 0.82), mat('#9fc3e0', { roughness: 0.4 }), -0.15, 0.72, 0, bus);
for (const x of [-0.55, 0.55]) for (const z of [-0.41, 0.41]) { const w = add(new THREE.CylinderGeometry(0.17, 0.17, 0.08, 8), mat('#2a2a33'), x, 0.17, z, bus); w.rotation.x = Math.PI / 2; }
const [bxx, bzz] = hexXZ(-1, 2); bus.position.set(bxx, tileTop(-1, 2), bzz); bus.rotation.y = 0.0; scene.add(bus); prop(bus, tProps + 0.9, 'drop');
// sun / moon in the sky
const orbM = new THREE.MeshBasicMaterial({ color: '#ffe9a0', fog: false }); const orb = new THREE.Mesh(new THREE.IcosahedronGeometry(0.9, 1), orbM); scene.add(orb);

// ------------------------------------------------------------ hero: a little low-poly person, outfits by the hour
const hero = new THREE.Group(); scene.add(hero);
const skinM = mat('#e9b896'), hairM = mat('#3d2b22'), jeansM = mat('#5c79a6'), shoeM = mat('#33333d');
const legs = [-0.12, 0.12].map(x => { const g = new THREE.Group(); add(new THREE.CylinderGeometry(0.075, 0.07, 0.55, 6), jeansM, 0, -0.27, 0, g); add(new THREE.BoxGeometry(0.15, 0.08, 0.24), shoeM, 0, -0.56, 0.04, g); g.position.set(x, 0.6, 0); hero.add(g); return g; });
const torso = {
  tee: add(new THREE.CylinderGeometry(0.2, 0.17, 0.55, 7), mat('#e0715a'), 0, 0.88, 0, hero),
  puffer: add(new THREE.CylinderGeometry(0.29, 0.27, 0.62, 8), mat('#f08a33'), 0, 0.88, 0, hero),
  hoodie: add(new THREE.CylinderGeometry(0.22, 0.19, 0.58, 7), mat('#8f929e'), 0, 0.88, 0, hero),
};
const pufRings = [0.68, 0.84, 1.0].map(y => add(new THREE.TorusGeometry(0.285, 0.035, 4, 8), mat('#c96e28'), 0, y, 0, hero)); pufRings.forEach(r => r.rotation.x = Math.PI / 2);
const arms = [-1, 1].map(s => { const g = new THREE.Group(); const m = add(new THREE.CylinderGeometry(0.055, 0.05, 0.5, 6), skinM, 0, -0.25, 0, g); g.position.set(s * 0.26, 1.12, 0); hero.add(g); return { g, m, s }; });
const head = add(new THREE.IcosahedronGeometry(0.19, 1), skinM, 0, 1.38, 0, hero);
const hair = add(new THREE.SphereGeometry(0.2, 7, 4, 0, Math.PI * 2, 0, Math.PI / 2.2), hairM, 0, 1.4, -0.01, hero);
const hat = add(new THREE.SphereGeometry(0.21, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2), mat('#3f7fd9'), 0, 1.42, 0, hero);
const pompom = add(new THREE.IcosahedronGeometry(0.07, 0), mat('#ffffff'), 0, 1.65, 0, hero);
const scarf = add(new THREE.TorusGeometry(0.17, 0.06, 5, 9), mat('#d8453a'), 0, 1.2, 0, hero); scarf.rotation.x = Math.PI / 2;
const glasses = add(new THREE.BoxGeometry(0.26, 0.06, 0.04), mat('#1b1b22'), 0, 1.4, 0.18, hero);
const mask = add(new THREE.BoxGeometry(0.22, 0.12, 0.05), mat('#f4f4f4'), 0, 1.32, 0.17, hero);
const jacket = add(new THREE.BoxGeometry(0.22, 0.5, 0.3), mat('#f08a33'), 0.36, 0.78, 0.12, hero);
const [hx0, hz0] = hexXZ(0, 0);
const HERO_Y = tileTop(0, 0);
// coat man at the stop at 13:00 (still in his morning coat)
const coatMan = new THREE.Group(); scene.add(coatMan);
add(new THREE.CylinderGeometry(0.22, 0.27, 0.95, 7), mat('#4f6b6a'), 0, 0.72, 0, coatMan);
add(new THREE.IcosahedronGeometry(0.17, 1), skinM, 0, 1.32, 0, coatMan);
add(new THREE.SphereGeometry(0.18, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2), mat('#b8483e'), 0, 1.36, 0, coatMan);
add(new THREE.TorusGeometry(0.15, 0.05, 5, 9), mat('#e2b04a'), 0, 1.16, 0, coatMan).rotation.x = Math.PI / 2;
coatMan.position.set(sx + 0.4, tileTop(2, 0), sz - 0.1);

// ------------------------------------------------------------ snowfall: instanced faceted flakes
const FLAKES = 420;
const flakeM = new THREE.MeshStandardMaterial({ color: '#ffffff', emissive: '#ffffff', emissiveIntensity: 0.25, flatShading: true });
const flakes = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.06, 0), flakeM, FLAKES); scene.add(flakes);
const dummy = new THREE.Object3D();
// smog: a few big translucent haze slabs drifting through the island
const smogM = new THREE.MeshBasicMaterial({ color: '#cdb58a', transparent: true, opacity: 0, depthWrite: false });
const smogSlabs = [0, 1, 2, 3].map(i => { const m = new THREE.Mesh(new THREE.PlaneGeometry(30, 3.2), smogM); m.position.set(0, 1.2 + i * 1.3, -2 + i * 1.5); scene.add(m); return m; });

// ============================================================ UI overlay (2D): sky gradient behind, titles and subtitles on top
const sky = document.getElementById('sky').getContext('2d');
const ui = document.getElementById('ui').getContext('2d');
function drawSky(w) {
  const g = sky.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#' + w.zen.getHexString()); g.addColorStop(0.62, '#' + w.hor.getHexString()); g.addColorStop(1, '#' + w.hor.getHexString());
  sky.fillStyle = g; sky.fillRect(0, 0, W, H);
  if (w.snow > 0.5 && w.zen.r < 0.3) { for (let i = 0; i < 90; i++) { const x = hash(i, 1) * W, y = hash(i, 2) * 900, tw = 0.5 + 0.5 * Math.sin(i + performanceT * 3); sky.fillStyle = `rgba(255,255,255,${0.25 + 0.5 * tw})`; sky.fillRect(x, y, 2.5, 2.5); } }
}
let performanceT = 0;
const FONT = "'Comfortaa', sans-serif";
function shadowText(s, x, y, size, w = 700, alpha = 1, align = 'center') {
  ui.save(); ui.globalAlpha = alpha; ui.font = `${w} ${size}px ${FONT}`; ui.textAlign = align;
  ui.fillStyle = 'rgba(28,32,80,0.55)'; ui.fillText(s, x + 3, y + 5); ui.fillStyle = '#fffaf0'; ui.fillText(s, x, y); ui.restore();
}
function risingTitle(s, x, y, size, t, t0) {
  // letters rise one by one from under a line, overshoot, settle
  ui.save(); ui.font = `700 ${size}px ${FONT}`; ui.textAlign = 'left';
  const total = ui.measureText(s).width; let cx = x - total / 2;
  ui.beginPath(); ui.rect(0, y - size * 1.2, W, size * 1.45); ui.clip();
  [...s].forEach((ch, i) => {
    const dy = rise(t, t0 + i * 0.05, 0.3) * size * 1.1;
    ui.fillStyle = 'rgba(28,32,80,0.5)'; ui.fillText(ch, cx + 3, y + 5 - dy); ui.fillStyle = '#fffaf0'; ui.fillText(ch, cx, y - dy);
    cx += ui.measureText(ch).width;
  });
  ui.restore();
}
function hexIcon(x, y, r, col) {
  ui.save(); ui.beginPath(); for (let k = 0; k < 6; k++) { const a = Math.PI / 6 + k * Math.PI / 3; ui.lineTo(x + r * Math.cos(a), y + r * Math.sin(a) * 0.6); } ui.closePath(); ui.fillStyle = col; ui.fill();
  ui.beginPath(); for (let k = 0; k < 6; k++) { const a = Math.PI / 6 + k * Math.PI / 3; ui.lineTo(x + r * Math.cos(a), y + 10 + r * Math.sin(a) * 0.6); } ui.lineTo(x + r, y); ui.fillStyle = 'rgba(0,0,0,0.25)'; ui.restore();
}

// texts for readcheck
regTexts();
function regTexts() {
  TEXTS_.push({ id: 'title', text: 'ПОГОДА ЗА ДЕНЬ', t0: 0.3, t1: at(4), box: [120, 250, 870, 360] });
  SC.forEach((s, i) => {
    const t0 = VOICE_AT[s.voice] - 0.1;
    if (s.note) TEXTS_.push({ id: `note${i}`, text: s.note, t0: s.t0 + 0.2, t1: s.t1, box: [200, 270, 790, 350] });
    TEXTS_.push({ id: `sub${i}a`, text: s.sub[0], t0, t1: s.t1, box: [60, 1340, 930, 1410] });
    TEXTS_.push({ id: `sub${i}b`, text: s.sub[1], t0, t1: s.t1, box: [60, 1420, 930, 1490] });
  });
}
SC.forEach((s, i) => { ev(VOICE_AT[s.voice], 'voice', { id: s.voice }); if (i > 1) ev(s.t0, 'change', { w: s.w }); });
for (let b = 0; b < 12; b++) ev(at(8) + b * BEAT, 'step');

// ============================================================ render(t)
window.render = (t) => {
  performanceT = t;
  const s = sceneAt(t), w = weatherAt(t);
  // light, fog, sky
  drawSky(w);
  scene.fog.color.copy(w.fog); scene.fog.near = 60 + w.fogN; scene.fog.far = 60 + w.fogF;
  hemi.intensity = w.amb; hemi.color.copy(w.hor); hemi.groundColor.copy(w.zen).multiplyScalar(0.6);
  sun.color.copy(w.sun); sun.intensity = w.si;
  const el = w.el * Math.PI / 180, az = w.az * Math.PI / 180;
  sun.position.set(Math.cos(el) * Math.cos(az) * 40, Math.sin(el) * 40, Math.cos(el) * Math.sin(az) * 40);
  // sun/moon placed in the sky behind the island
  orb.position.set(6 + Math.cos(t * 0.05) * 0.5, 9 + w.el * 0.05, -12); orbM.color.set(w.zen.r < 0.3 ? '#e8ecff' : w.smog > 0.5 ? '#ff9a5a' : '#fff0a8');
  // growth: tiles rise, props pop
  TILES.forEach(T => {
    const dy = rise(t, T.t0, 0.32); T.g.visible = dy > -0.999; T.g.position.y = dy * (T.h + 1.2);
    T.capM.color.copy(T.top).lerp(SNOWCOL, (T.kind === 'grass' || T.kind === 'rock') ? w.snow * 0.9 : T.kind === 'walk' ? w.snow * 0.6 : w.snow * 0.25);
  });
  PROPS.forEach(P => {
    if (P.kind === 'drop') { const p = t < P.t0 - 0.3 ? -1 : t < P.t0 ? seg(t, P.t0 - 0.3, P.t0) : 1; P.g.visible = p >= 0; const fall = t < P.t0 ? (1 - p * p) * 6 : 0; const sq = t >= P.t0 ? 1 - 0.18 * Math.exp(-8 * (t - P.t0)) * Math.cos(18 * (t - P.t0)) : 1; P.g.scale.set(1 / Math.sqrt(sq), sq, 1 / Math.sqrt(sq)); P.g.userData.fall = fall; P.g.position.y = (P.g.userData.baseY ??= P.g.position.y) + fall; }
    else { const k = popS(t, P.t0); P.g.visible = k > 0.001; P.g.scale.setScalar(Math.max(0.001, k)); }
  });
  roofM.color.set('#b9a28a').lerp(SNOWCOL, w.snow);
  trees.forEach(T => { T.cap.visible = w.snow > 0.05; T.cap.scale.set(w.snow, 0.45 * w.snow, w.snow); T.crownM.color.set(w.smog > 0.5 ? '#8d9a5a' : '#6fa35a'); });
  winM.forEach(({ m, on }) => { m.emissiveIntensity = on ? w.win * 1.6 : 0; });
  lampM.emissiveIntensity = w.lamp * 2.5; lampLight.intensity = w.lamp * 6;
  smogM.opacity = w.smog * 0.28; smogM.color.copy(w.fog); smogSlabs.forEach((m, i) => { m.position.x = Math.sin(t * 0.3 + i) * 2; });
  // snowfall in snow scenes
  const snowing = s.w === 'snow' || s.w === 'night';
  flakes.visible = snowing && t > at(2.5);
  if (flakes.visible) for (let i = 0; i < FLAKES; i++) {
    const x = (hash(i, 3) - 0.5) * 16, z = (hash(i, 4) - 0.5) * 16, sp = 0.6 + hash(i, 5) * 0.6;
    const y = 10 - ((hash(i, 6) * 10 + t * sp) % 10);
    dummy.position.set(x + Math.sin(t + i) * 0.3, y, z); dummy.rotation.set(t + i, t * 0.7 + i, 0); dummy.updateMatrix(); flakes.setMatrixAt(i, dummy.matrix);
  }
  flakes.instanceMatrix.needsUpdate = true;
  // hero: visible from the first moment, outfit by the hour
  const outfit = s.id === 'h' ? 'snow' : s.w === 'night' ? 'night' : s.w;
  hero.visible = t > tProps + 1.1;
  const hk = popS(t, tProps + 1.1); hero.scale.setScalar(Math.max(0.001, hk) * 1.9);
  let walk = 0, hxp = hx0 - 0.3, hzp = hz0 + 0.4;
  if (s.w === 'sun') { const p = seg(t, s.t0, s.t1); hxp = lerp(hx0 - 1.6, hx0 + 0.8, p); walk = Math.sin((t - s.t0) / BEAT * Math.PI) * 0.5; }
  const shiver = outfit === 'night' ? Math.sin(t * 60) * 0.025 : 0;
  hero.position.set(hxp + shiver, HERO_Y, hzp); hero.rotation.y = s.w === 'sun' ? Math.PI / 2 * 0.6 : 0.5;
  legs[0].rotation.x = walk; legs[1].rotation.x = -walk;
  torso.tee.visible = outfit === 'sun' || outfit === 'night'; torso.puffer.visible = outfit === 'snow'; torso.hoodie.visible = outfit === 'smog';
  pufRings.forEach(r => r.visible = outfit === 'snow');
  hat.visible = pompom.visible = scarf.visible = outfit === 'snow'; hair.visible = !hat.visible;
  glasses.visible = outfit === 'sun'; mask.visible = outfit === 'smog'; jacket.visible = outfit === 'sun';
  arms.forEach(({ g, m, s: sd }) => {
    m.material = outfit === 'snow' ? torso.puffer.material : outfit === 'smog' ? torso.hoodie.material : skinM;
    if (outfit === 'night') { g.rotation.set(-1.2, 0, sd * 0.9); }            // hugging himself
    else if (outfit === 'sun' && sd > 0) { g.rotation.set(-0.9, 0, 0.2); }      // forearm out, jacket over it
    else { g.rotation.set(-walk * sd, 0, sd * (outfit === 'snow' ? 0.35 : 0.12)); }
  });
  coatMan.visible = s.w === 'sun'; coatMan.position.y = tileTop(2, 0) + Math.abs(Math.sin(t * 9)) * 0.01;
  // camera: orthographic iso, slow turntable, zoom per moment (never perspective)
  const push = s.id === 'h' ? 0 : s.id === 'end' ? 1 - ease(seg(t, s.t0, s.t1 - 0.8)) : ease(seg(t, s.t0 + 0.4, s.t1 - 0.3));
  const zoomIn = s.id === 'h' ? lerp(34, 30, ease(seg(t, 2.5, 5))) : s.id === 'end' ? lerp(36, 17, push) : lerp(30, 17, push);
  const azC = (35 + t * 1.6) * Math.PI / 180, elC = (s.id === 'h' ? lerp(48, 34, ease(seg(t, 0, 5))) : 34) * Math.PI / 180;
  const fh = zoomIn, fw = fh * W / H;
  cam.left = -fw / 2; cam.right = fw / 2; cam.top = fh / 2 + fh * 0.02; cam.bottom = -fh / 2 + fh * 0.02; cam.updateProjectionMatrix();
  const D = 60, cx = lerp(0.3, hero.position.x, push), cy = lerp(1.4, HERO_Y + 1.6, push), cz = lerp(-0.2, hero.position.z, push);
  cam.position.set(cx + D * Math.cos(elC) * Math.sin(azC), cy + D * Math.sin(elC), cz + D * Math.cos(elC) * Math.cos(azC)); cam.lookAt(cx, cy, cz);
  renderer.render(scene, cam);
  // ---- UI
  ui.clearRect(0, 0, W, H);
  if (s.id === 'h') risingTitle('ПОГОДА ЗА ДЕНЬ', 495, 330, 76, t, 0.3);
  else if (s.note) { const p = clamp((t - s.t0 - 0.2) / 0.3); hexIcon(495 - ui.measureText ? 495 - 250 : 245, 312, 24, '#' + w.hor.getHexString()); shadowText(s.note, 520, 330, 60, 700, p); }
  const ts = VOICE_AT[s.voice] - 0.1, a1 = clamp((t - ts) / 0.3), a2 = clamp((t - ts - 0.25) / 0.3);
  const sz1 = s.sub[0].length > 30 ? 44 : 54;
  shadowText(s.sub[0], 495, 1395, sz1, 700, a1); shadowText(s.sub[1], 495, 1468, 44, 600, a2);
  ui.save(); ui.globalAlpha = 0.85; ui.font = `700 32px ${FONT}`; ui.fillStyle = '#fffaf0'; ui.shadowColor = 'rgba(28,32,80,0.6)'; ui.shadowOffsetY = 3; ui.fillText('bishkek.motion', 64, 1555); ui.restore();
};
window.TEXTS = (t) => TEXTS_.filter(x => t >= x.t0 && t < x.t1).map(x => ({ id: x.id, text: x.text, x0: x.box[0], y0: x.box[1], x1: x.box[2], y1: x.box[3] }));

(async () => {
  for (const wgt of [600, 700]) await document.fonts.load(`${wgt} 40px Comfortaa`, 'АБВабвёй ABC 0123 ↓·');
  EV.sort((a, b) => a.t - b.t); window.EV = EV;
  window.render(0);
  window.READY = true;
})();
