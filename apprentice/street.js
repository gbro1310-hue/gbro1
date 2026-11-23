// Set A: a Paris street, 1303 — the embroiderer's workshop (with its sign), your father's walk, the city of trades from above,
// dark workshops at night, the vespers bell from the church tower, the jurés' knock, a journeyman walking out.
import * as THREE from 'three';
import { PX, ramp, hex, h2, texOf, cobbles, ground, woodPlanks, glow, mulberry } from './px.js';
import { mats, mat, mesh, box, house, crate, barrel, windowMat } from './kit.js';
import { sky, stars, sea, flick } from './fx.js';
import { makePerson } from './chars.js';
import { T } from './story.js';
import { clamp, seg, ss, eio, lerp, track } from '/core/lib.js';

const C3 = c => new THREE.Color(c), V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const TOD = {
  night: { top: '#060a1e', mid: '#14244a', hor: '#34507a', fog: '#1c2a46', fogD: .0065, dir: '#9ab4ec', dirI: 1.9, hs: '#7084c0', hg: '#1a1a26', hI: 2.3, sunCol: '#dfe8ff', sunI: 1, exp: 1.55 },
  dawn: { top: '#1c2c5c', mid: '#6c6aa2', hor: '#f2a676', fog: '#6e6478', fogD: .006, dir: '#ff9a58', dirI: 2.8, hs: '#c0a4b8', hg: '#3a2c2c', hI: 1.6, sunCol: '#ffd2a0', sunI: .9, exp: 1.2 },
  day: { top: '#3672c4', mid: '#78ace0', hor: '#e2ecf2', fog: '#b4c6d8', fogD: .004, dir: '#fff0d6', dirI: 3.6, hs: '#c4d8f4', hg: '#5a5040', hI: 2.0, sunCol: '#fff4dc', sunI: .5, exp: 1.3 },
  eve: { top: '#24345e', mid: '#9a7488', hor: '#ffb070', fog: '#8a6a6a', fogD: .005, dir: '#ff9248', dirI: 3.0, hs: '#c8a0a0', hg: '#3a2a26', hI: 1.6, sunCol: '#ffc890', sunI: 1, exp: 1.25 },
};
function mixTod(a, b, k) { const o = {}; for (const key in a) o[key] = typeof a[key] === 'number' ? lerp(a[key], b[key], k) : C3(a[key]).lerp(C3(b[key]), k); return o; }

// —— 16×16 trade icons on round parchment plaques ——
function icon(kind) {
  const P = new PX(20, 20), PA = ramp(['#8a7a5a', '#c8b48a', '#efe0b8']), INK = hex('#2a1a12'), GO = hex('#e0b040'), BR = hex('#a8642c'), GR = hex('#8a8e96'), RD = hex('#a82a24'), WH = hex('#f4f0e4'), BL = hex('#3a5a9a');
  P.ellipse(10, 10, 9.6, 9.6, (x, y, dx, dy) => Math.hypot(dx, dy) > .86 ? INK : PA(.6 - dy * .3, x, y));
  const R = (x, y, w, h, c) => P.rect(x, y, w, h, c);
  if (kind === 'bread') { P.ellipse(10, 11, 6, 3.4, BR); R(7, 10, 1, 2, INK); R(10, 9, 1, 2, INK); R(13, 10, 1, 2, INK); }
  if (kind === 'hammer') { R(9, 8, 2, 8, BR); R(6, 5, 8, 3, GR); }
  if (kind === 'knife') { R(5, 12, 5, 2, BR); P.poly([[10, 11], [16, 9], [15, 12], [10, 14]], GR); }
  if (kind === 'hat') { R(5, 13, 10, 2, INK); R(7, 8, 6, 5, RD); }
  if (kind === 'shoe') { P.poly([[5, 9], [8, 9], [9, 12], [15, 12], [15, 15], [5, 15]], BR); R(5, 15, 10, 1, INK); }
  if (kind === 'needle') { R(5, 14, 1, 1, GR); for (let i = 0; i < 9; i++) R(5 + i, 14 - i, 1, 1, GR); R(13, 5, 2, 1, INK); for (let i = 0; i < 6; i++) R(14 - (i % 2), 6 + i, 1, 1, GO); }
  if (kind === 'barrel') { P.ellipse(10, 10, 4.6, 6, BR); R(5, 7, 10, 1, INK); R(5, 12, 10, 1, INK); }
  if (kind === 'key') { P.ellipse(7, 8, 2.6, 2.6, GO); R(7, 8, 1, 1, PA(.6, 0, 0)); R(9, 8, 6, 1, GO); R(13, 9, 1, 2, GO); R(11, 9, 1, 2, GO); }
  if (kind === 'fish') { P.ellipse(10, 10, 5, 2.6, BL); P.poly([[14, 10], [16, 7], [16, 13]], BL); R(7, 9, 1, 1, WH); }
  if (kind === 'pot') { P.ellipse(10, 11, 5, 4, GR); R(6, 6, 8, 2, INK); }
  if (kind === 'scissors') { P.ellipse(7, 14, 2, 2, GR); P.ellipse(13, 14, 2, 2, GR); for (let i = 0; i < 8; i++) { R(8 + i * .5 | 0, 12 - i, 1, 1, GR); R(12 - i * .5 | 0, 12 - i, 1, 1, GR); } }
  if (kind === 'horseshoe') { P.ellipse(10, 9, 5, 5, GR); P.ellipse(10, 9, 2.6, 2.6, PA(.6, 0, 0)); R(5, 9, 10, 6, PA(.6, 0, 0)); R(5, 9, 2, 6, GR); R(13, 9, 2, 6, GR); }
  return texOf(P.done());
}
const KINDS = ['bread', 'hammer', 'knife', 'hat', 'shoe', 'barrel', 'key', 'fish', 'pot', 'scissors', 'horseshoe', 'needle'];

export function buildStreet() {
  const scene = new THREE.Scene(), MM = mats();
  scene.fog = new THREE.FogExp2('#16223a', .008);
  const SK = sky({ moonDir: V3(.6, .32, -1) }); scene.add(SK.mesh);
  const ST = stars(700, 7); scene.add(ST);
  const sunL = new THREE.DirectionalLight('#8fa8e0', 1.1); sunL.position.set(30, 38, -30);
  sunL.castShadow = true; sunL.shadow.mapSize.set(2048, 2048); Object.assign(sunL.shadow.camera, { left: -45, right: 45, top: 45, bottom: -45, near: 1, far: 160 }); sunL.shadow.bias = -.0006; sunL.shadow.normalBias = .02;
  scene.add(sunL, sunL.target);
  const hemi = new THREE.HemisphereLight('#3a4c7a', '#0a0a12', 1); scene.add(hemi);

  const cob = mat(cobbles(96, 96, { seed: 6, cols: ['#1d1b20', '#38343a', '#524c50', '#6c6566', '#878079'] }));
  const dirt = mat(ground(128, 128, { seed: 4, mask: () => 0, dirt: ['#1d1611', '#33271c', '#4a3a28', '#5e4a33'] }));
  scene.add(mesh(new THREE.BoxGeometry(140, .4, 120).translate(0, -.21, 0), dirt));
  scene.add(mesh(new THREE.BoxGeometry(140, .06, 5.2), cob));
  scene.add(mesh(new THREE.BoxGeometry(2.2, .05, 30).translate(-.6, 0, -19), cob));
  const RIV = sea(60, { ppm: 8, deep: '#0a1a2c', shallow: '#1a3450', crest: '#4a7090' }); RIV.mesh.scale.set(2.4, .22, 1); RIV.mesh.position.set(0, -.25, 33); scene.add(RIV.mesh);
  const bankM = mat(woodPlanks(64, 64, { pw: 64, seed: 9, nails: false, cols: ['#1e1a16', '#3a322a', '#58483a'] }));
  scene.add(mesh(new THREE.BoxGeometry(140, .7, .5).translate(0, -.2, 26.6), bankM));

  // —— Houses ——
  const R = mulberry(37), WALLS = ['wall', 'wall2', 'wall3'], ROOFS = ['roof', 'roof2', 'roof3'];
  const darkWin = new THREE.MeshStandardMaterial({ color: '#141218', roughness: .7 });
  const allHouses = [];
  function addHouse(o, role) { const hh = house(o); scene.add(hh); allHouses.push(hh); hh.userData.windows.forEach(w => w.material = darkWin); hh.userData.role = role; return hh; }
  addHouse({ x: -4.2, z: -5.6, w: 5, d: 5, h: 4.4, wall: 'wall', roof: 'roof', door: 1.4, windows: [[-1.2, 2.0]], upper: [[0, 3.6]] }, 'row');
  const shop = addHouse({ x: 4.6, z: -6.1, w: 8, d: 6, h: 4.8, wall: 'wall3', roof: 'roof3', door: -2.6, windows: [[-.6, 2.0], [1.4, 2.0], [3.2, 2.0]], upper: [[-.8, 3.8], [1.6, 3.8]] }, 'shop');
  [[-10.4, 5.2], [-16.2, 5.6], [-22, 5], [12.4, 5.4], [18.4, 5.2], [24, 5]].forEach(([x, w], i) => addHouse({ x, z: -5.6, w, d: 5, h: 3.8 + R() * 1.6, wall: WALLS[i % 3], roof: ROOFS[(i + 1) % 3], door: (R() - .5) * 2, windows: [[(R() - .5) * 2, 2]], upper: [[(R() - .5) * 2, 3.4]] }, 'row'));
  [-21, -15, -9, -3, 3, 9, 15, 21].forEach((x, i) => addHouse({ x, z: 6.4, w: 5.2, d: 4.6, h: 3.6 + R() * 1.2, wall: WALLS[(i + 2) % 3], roof: ROOFS[i % 3], ry: Math.PI, windows: [[0, 2]], chimney: i % 2 === 0 }, 'near'));
  for (const z of [-15, -23, -31, 14.5, 21]) for (let x = -24; x <= 24; x += 5.6 + R() * 1.2) {
    if (Math.abs(x + .6) < 1.6 && z < 0) continue;
    addHouse({ x: x + (R() - .5) * .8, z: z + (R() - .5) * 1.2, w: 4.4 + R() * 1.4, d: 4.4 + R() * .8, h: 3.4 + R() * 2.6, wall: WALLS[(R() * 3) | 0], roof: ROOFS[(R() * 3) | 0], ry: z > 0 ? Math.PI : 0, windows: [[0, 2]], chimney: R() > .3 }, 'city');
  }
  const TW = V3(-14, 0, -27);
  const tower = box(3.2, 13, 3.2, MM.wall2); tower.position.copy(TW); scene.add(tower);
  const spire = new THREE.Mesh(new THREE.ConeGeometry(2.6, 6, 4), MM.roof2); spire.rotation.y = Math.PI / 4; spire.position.set(TW.x, 16, TW.z); spire.castShadow = true; scene.add(spire);
  // belfry opening + bell rings (sound made visible)
  const belfry = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.6), new THREE.MeshBasicMaterial({ color: '#0a0806' })); belfry.position.set(TW.x, 11.4, TW.z + 1.62); scene.add(belfry);
  const rings = [0, 1, 2, 3].map(() => { const m = new THREE.Mesh(new THREE.TorusGeometry(1, .06, 6, 48), new THREE.MeshBasicMaterial({ color: '#ffe6a8', transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })); m.position.set(TW.x, 11.4, TW.z + 1.8); scene.add(m); return m; });

  // —— Signs: the embroiderer's (a frame with a gold needle) + other trades' boards ——
  function signBoard(kind, x, z, y = 3.15) {
    const P = new PX(24, 24), B = ramp(['#2a1a10', '#4a2e1a', '#6e4626', '#8c6034']);
    P.fill((xx, yy) => B(xx === 0 || yy === 0 || xx === 23 || yy === 23 ? .15 : .5 + (h2(xx >> 2, yy, 4) - .5) * .3, xx, yy));
    const ic = icon(kind).image, c2 = document.createElement('canvas'); c2.width = c2.height = 24; const x2 = c2.getContext('2d'); x2.drawImage(P.done(), 0, 0); x2.imageSmoothingEnabled = false; x2.drawImage(ic, 2, 2, 20, 20);
    const sm = new THREE.MeshStandardMaterial({ map: texOf(c2), roughness: .8, side: THREE.DoubleSide });
    const board = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 1.0), sm); board.rotation.y = Math.PI / 2; board.position.set(x, y, z + .55); board.castShadow = true; scene.add(board);
    const br = box(.9, .07, .07, MM.beam); br.position.set(x, y + .5, z + .15); br.rotation.y = Math.PI / 2; scene.add(br);
    return board;
  }
  const shopSign = signBoard('needle', .75, -3.1);
  const otherSigns = [['bread', -6.4, -3.1], ['shoe', -12.4, -3.1], ['knife', -18.6, -3.1], ['hat', 10.4, -3.1], ['key', 16.6, -3.1], ['pot', 22.0, -3.1]].map(([k, x, z]) => signBoard(k, x, z));
  [[-6.2, -2.6], [9.8, -2.7]].forEach(([x, z]) => { const b = barrel(); b.position.set(x, 0, z); scene.add(b); });
  [[8.6, -2.7], [-12, -2.8]].forEach(([x, z]) => { const c = crate(.7); c.position.set(x, 0, z); c.rotation.y = .3; scene.add(c); });

  // the workshop's window glows warm by day (seen from the street)
  const shopWin = windowMat().clone(); shopWin.emissiveIntensity = 0; shop.userData.windows.forEach(w => w.material = shopWin);

  // —— Trade icons over the city (the "hundred trades") ——
  const iconHouses = allHouses.filter(h => h.userData.role !== 'near').sort((a, b) => h2(Math.round(a.position.x * 7), Math.round(a.position.z * 7), 5) - h2(Math.round(b.position.x * 7), Math.round(b.position.z * 7), 5)).slice(0, 34);
  const icons = iconHouses.map((h, i) => {
    const bb = new THREE.Box3().setFromObject(h); const kind = h.userData.role === 'shop' ? 'needle' : KINDS[i % (KINDS.length - 1)];
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: icon(kind), transparent: true, alphaTest: .5, fog: false })); s.position.set(h.position.x, bb.max.y + 2.2, h.position.z); scene.add(s); s.userData.k = i; return s;
  });

  // —— People ——
  const you = makePerson('you'), father = makePerson('father'), j1 = makePerson('jure'), j2 = makePerson('jure2');
  const extras = ['m1', 'm2', 'm3', 'm1'].map(p => makePerson(p));
  scene.add(you.root, father.root, j1.root, j2.root, ...extras.map(e => e.root));
  const DOOR = V3(2.0, 0, -2.75);
  const walk = (t, k = 9) => ['w0', 'w1', 'w2', 'w3'][Math.floor(t * k) % 4];
  const idle = (t, s = 0) => Math.floor(t * 8 + s * 7) % 29 === 0 ? 'blink' : (Math.floor(t * 1.2 + s) % 2 ? 'idle1' : 'idle0');
  const fillL = new THREE.PointLight('#ffd8b0', 0, 7, 2); scene.add(fillL);

  const cams = {
    open: { p: track([[0, [-18, 24, 26]], [5, [-10, 12, 17]], [11.1, [-2.6, 4.8, 10.6]]]), l: track([[0, [-6, 0, -4]], [5, [-3, .6, -3]], [11.1, [1.2, 1.1, -2.8]]]), fov: 32, aper: 300, band: null },
    trades: { p: track([[40.2, [-8, 40, 44]], [48, [-2, 70, 20]], [56, [0, 86, 6]], [62.6, [0, 84, 7]], [66.6, [5, 14, 18]], [69.6, [4.6, 7, 13]]]), l: track([[40.2, [-2, 0, -6]], [56, [0, 0, -3]], [62.6, [0, 0, -3]], [66.6, [3.4, 0, -2]], [69.6, [3.2, 1, -2.6]]]), fov: 36, aper: 260, band: .5 },
    night: { p: track([[187, [-15, 5.2, 11.5]], [199.4, [7, 5.6, 11.5]]]), l: track([[187, [-11, 1.6, -4]], [199.4, [10, 1.6, -4]]]), fov: 34, aper: 300 },
    week: { p: track([[214.3, [8, 24, 32]], [228, [2, 20, 26]], [232, [-6, 15, 6]], [240.9, [-8, 14, 2]]]), l: track([[214.3, [-4, 3, -10]], [228, [-6, 4, -14]], [232, [-13, 10, -25]], [240.9, [-13.5, 10.5, -26]]]), fov: 34, aper: 320, band: .45 },
    knock: { p: track([[240.9, [7.2, 3.0, 6.4]], [244.5, [5.6, 2.6, 4.8]]]), l: track([[240.9, [2.6, 1.3, -2.8]], [244.5, [2.2, 1.3, -3.0]]]), fov: 32, aper: 220 },
    signs: { p: track([[265.8, [-14, 3.6, 7.6]], [272, [-4, 5.0, 10]], [279.6, [8, 9, 15]]]), l: track([[265.8, [-9, 2.6, -3.4]], [272, [-1, 2.4, -3.4]], [279.6, [6, 2, -3.4]]]), fov: 34, aper: 300 },
    leave: { p: track([[306.2, [6.4, 2.6, 6.2]], [311, [3.6, 2.6, 6.8]], [316.5, [-1.4, 3.2, 8.4]]]), l: track([[306.2, [2.2, 1.2, -2.6]], [311, [1.2, 1.2, -1.8]], [316.5, [-2.6, 1.1, -.8]]]), fov: 32, aper: 220 },
    mastery: { p: track([[316.5, [2.6, 2.6, 6.0]], [330, [-3.6, 3.8, 5.4]], [342.6, [-1.5, 15, 15]]]), l: track([[316.5, [-1.5, 1.2, -.8]], [330, [-1.5, 1.2, -.8]], [342.6, [0, .5, -4]]]), fov: 32, aper: 240, band: null },
  };

  function update(t, shot, cam, post, renderer) {
    const id = shot.id, C = cams[id] || cams.open, p = C.p(t), l = C.l(t);
    cam.position.set(...p); cam.fov = C.fov; cam.up.set(0, 1, 0);
    if (id === 'trades' && t > 50 && t < 64) cam.up.set(0, 0, -1).lerp(V3(0, 1, 0), ss(seg(t, 62.6, 64)));
    cam.updateProjectionMatrix(); cam.lookAt(...l);

    let D, sunK = 0;   // sunK: −1 low east (dawn), 0 high, +1 low west (eve)
    if (id === 'open') { D = mixTod(TOD.dawn, TOD.day, ss(seg(t, 4, 11))); sunK = -1 + ss(seg(t, 4, 11)) * .6; }
    else if (id === 'night') D = TOD.night;
    else if (id === 'week') { D = mixTod(TOD.day, TOD.eve, ss(seg(t, 224, 231))); sunK = ss(seg(t, 224, 231)); }
    else if (id === 'mastery') { D = TOD.eve; sunK = 1; }
    else D = TOD.day;
    D = mixTod(D, D, 0);
    SK.u.top.value.copy(D.top); SK.u.mid.value.copy(D.mid); SK.u.hor.value.copy(D.hor); SK.u.moonCol.value.copy(D.sunCol); SK.u.moonI.value = D.sunI;
    scene.fog.color.copy(D.fog); scene.fog.density = D.fogD;
    sunL.color.copy(D.dir); sunL.intensity = D.dirI; hemi.color.copy(D.hs); hemi.groundColor.copy(D.hg); hemi.intensity = D.hI;
    const nightK = id === 'night' ? 1 : 0;
    ST.material.uniforms.t.value = t; ST.material.uniforms.k.value = nightK;
    if (id === 'night') { sunL.position.set(30, 38, -30); SK.u.moonDir.value.set(.6, .32, -1).normalize(); }
    else { const ax = sunK * 40, ay = lerp(44, 16, Math.abs(sunK)); sunL.position.set(ax, ay, 20); SK.u.moonDir.value.set(sunK * .9, lerp(.7, .12, Math.abs(sunK)), -.6).normalize(); }
    renderer.toneMappingExposure = D.exp;
    RIV.u.t.value = t; RIV.u.camPos.value.copy(cam.position); RIV.u.fogColor.value.copy(scene.fog.color); RIV.u.fogDensity.value = scene.fog.density; RIV.setLights([]);
    const wide = id === 'trades' || id === 'week';
    allHouses.forEach(h => { if (h.userData.role === 'near') h.visible = wide; });
    if (id === 'trades') scene.fog.density *= .45;
    if (id === 'week') scene.fog.density *= .7;
    shopWin.emissiveIntensity = id === 'night' ? 0 : (id === 'mastery' || id === 'week' ? .9 : .35) * flick(t, 2);

    // trade icons
    icons.forEach(s => { const k = s.userData.k, a = id === 'trades' ? ss(seg(t, T.trades0 + k * .12, T.trades0 + k * .12 + .35)) * (1 - ss(seg(t, 63.4, 64.4))) : 0; s.visible = a > .01; const pop = 1 + .25 * Math.sin(Math.PI * clamp((t - T.trades0 - k * .12) / .35)); s.scale.setScalar(8.5 * a * pop); });
    // bell rings
    rings.forEach((r, i) => { let a = 0, sc = 1; for (const b0 of [T.bell, T.bell + 3.0]) { const u = (t - b0 - i * .45) / 2.4; if (id === 'week' && u > 0 && u < 1) { a = Math.max(a, (1 - u) * .9); sc = 1 + u * 9; } } r.material.opacity = a; r.scale.setScalar(sc); r.lookAt(cam.position); });

    // —— people ——
    [you, father, j1, j2, ...extras].forEach(q => { q.root.visible = false; q.root.scale.setScalar(1); });
    const show = (q, x, z, f, flip = false, sc = 1) => { q.root.visible = true; q.root.position.set(x, 0, z); q.root.scale.setScalar(sc); q.frame(f); q.face(cam, flip); };
    let focus = null;
    if (id === 'open') {
      const u = clamp((t - .8) / 9.4), x = lerp(-14, DOOR.x - .9, eio(u));
      show(father, x, -.8, u < 1 ? walk(t) : idle(t, 2)); show(you, x - .8, -.3, u < 1 ? walk(t, 10) : idle(t, 1), false, .8);
      focus = t > 5 ? father.root.position.clone().setY(1.0) : null;
    }
    if (id === 'trades' && t > 63) {
      const u = clamp((t - 63.2) / 6.2);
      show(j1, lerp(12, 4.6, u), -.6, walk(t), true); show(j2, lerp(12.9, 5.5, u), -.1, walk(t + .3), true);
      focus = j1.root.position.clone().setY(1.0);
    }
    if (id === 'knock') {
      const u = clamp((t - 240.9) / 1.5);
      show(j1, lerp(5.4, DOOR.x + .5, eio(u)), lerp(-1.6, -2.55, u), u < 1 ? walk(t) : (t > T.knock && t < T.knock + 1.2 && Math.floor(t * 6) % 2 ? 'cry0' : 'idle0'), true);
      show(j2, lerp(6.4, DOOR.x + 1.5, eio(u)), lerp(-1.2, -2.1, u), u < 1 ? walk(t) : idle(t, 5), true);
      focus = j1.root.position.clone().setY(1.1);
    }
    if (id === 'signs' || (id === 'week' && t < 226)) {
      extras.forEach((e, i) => { const u = (t * .8 + i * 3.7) % 26; show(e, -14 + u * (i % 2 ? 1 : 1.1) + i * 2, i === 1 ? .8 : -.5 + i * .3, walk(t + i)); });
    }
    if (id === 'leave') {
      const u = clamp((t - (T.leaveDoor - 5.2)) / 9);
      show(you, lerp(DOOR.x, -5.0, eio(u)), lerp(-2.6, -.4, u), u > 0 && u < 1 ? walk(t) : idle(t, 1), true);
      focus = you.root.position.clone().setY(1.0);
    }
    if (id === 'mastery') { show(you, -1.5, -.8, idle(t, 1)); focus = t < 334 ? you.root.position.clone().setY(1.0) : null; }
    fillL.position.copy(focus || V3(...l)).add(V3(.4, 1.6, 2.2)); fillL.intensity = focus ? 1.2 : 0;

    const look = V3(...l);
    post.dof.focus = cam.position.distanceTo(focus || look); post.dof.aper = C.aper; post.dof.maxCoc = 20;
    post.tiltBand = C.band ?? null; post.tiltTarget = focus || look;
  }
  return { scene, update };
}
