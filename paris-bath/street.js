// Set A: a Paris street, 1292 — your house, an alley, the bathhouse with its sign; the city around it for the overhead map.
// One set lit four ways: pre-dawn night, dawn, overcast Sunday, full morning.
import * as THREE from 'three';
import { PX, ramp, hex, h2, fbm, texOf, cobbles, ground, woodPlanks, billboard, glow, blob, mulberry } from './px.js';
import { mats, mat, mesh, box, house, crate, barrel, fire, windowMat } from './kit.js';
import { sky, stars, sea, particles, beamCard, flick } from './fx.js';
import { makePerson } from './chars.js';
import { T } from './story.js';
import { clamp, seg, ss, eio, lerp, track } from '/core/lib.js';

const C3 = c => new THREE.Color(c);
// Time-of-day keys: night → dawn → day; 'sun' = Sunday overcast
const TOD = {
  night: { top: '#060a1e', mid: '#14244a', hor: '#34507a', fog: '#1c2a46', fogD: .0065, dir: '#9ab4ec', dirI: 1.9, hs: '#7084c0', hg: '#1a1a26', hI: 2.3, sunCol: '#dfe8ff', sunI: 1, exp: 1.55 },
  dawn: { top: '#1c2c5c', mid: '#6c6aa2', hor: '#f2a676', fog: '#6e6478', fogD: .006, dir: '#ff9a58', dirI: 2.8, hs: '#c0a4b8', hg: '#3a2c2c', hI: 1.6, sunCol: '#ffd2a0', sunI: .9, exp: 1.2 },
  day: { top: '#3672c4', mid: '#78ace0', hor: '#e2ecf2', fog: '#b4c6d8', fogD: .004, dir: '#fff0d6', dirI: 3.6, hs: '#c4d8f4', hg: '#5a5040', hI: 2.0, sunCol: '#fff4dc', sunI: .5, exp: 1.3 },
  sun: { top: '#5c6672', mid: '#8a929c', hor: '#bfc4ca', fog: '#9298a2', fogD: .006, dir: '#c8d0da', dirI: 1.6, hs: '#b0b8c6', hg: '#44444c', hI: 2.2, sunCol: '#ffffff', sunI: 0, exp: 1.35 },
};
function mixTod(a, b, k) {
  const o = {}; for (const key in a) o[key] = typeof a[key] === 'number' ? lerp(a[key], b[key], k) : C3(a[key]).lerp(C3(b[key]), k); return o;
}

export function buildStreet() {
  const scene = new THREE.Scene(), MM = mats();
  scene.fog = new THREE.FogExp2('#16223a', .008);
  const SK = sky({ moonDir: new THREE.Vector3(.6, .32, -1) }); scene.add(SK.mesh);
  const ST = stars(700, 7); scene.add(ST);

  const sunL = new THREE.DirectionalLight('#8fa8e0', 1.1); sunL.position.set(30, 38, -30);
  sunL.castShadow = true; sunL.shadow.mapSize.set(2048, 2048); Object.assign(sunL.shadow.camera, { left: -45, right: 45, top: 45, bottom: -45, near: 1, far: 160 }); sunL.shadow.bias = -.0006; sunL.shadow.normalBias = .02;
  scene.add(sunL, sunL.target);
  const hemi = new THREE.HemisphereLight('#3a4c7a', '#0a0a12', 1); scene.add(hemi);

  // —— Ground: the street (cobbles), packed earth everywhere else ——
  const cob = mat(cobbles(96, 96, { seed: 6, cols: ['#1d1b20', '#38343a', '#524c50', '#6c6566', '#878079'] }));
  const dirt = mat(ground(128, 128, { seed: 4, mask: () => 0, dirt: ['#1d1611', '#33271c', '#4a3a28', '#5e4a33'] }));
  const G = mesh(new THREE.BoxGeometry(140, .4, 120).translate(0, -.21, 0), dirt); scene.add(G);
  const street = mesh(new THREE.BoxGeometry(140, .06, 5.2).translate(0, .0, 0), cob); scene.add(street);
  const lane = mesh(new THREE.BoxGeometry(2.2, .05, 30).translate(-.6, 0, -19), cob); scene.add(lane);   // the alley running back
  // —— River (the Seine) along the bottom of the map ——
  const RIV = sea(60, { ppm: 8, deep: '#0a1a2c', shallow: '#1a3450', crest: '#4a7090' }); RIV.mesh.scale.set(2.4, .22, 1); RIV.mesh.position.set(0, -.25, 33); scene.add(RIV.mesh);
  const bankM = mat(woodPlanks(64, 64, { pw: 64, seed: 9, nails: false, cols: ['#1e1a16', '#3a322a', '#58483a'] }));
  const bank = mesh(new THREE.BoxGeometry(140, .7, .5).translate(0, -.2, 26.6), bankM); scene.add(bank);

  // —— Houses ——
  const R = mulberry(31), WALLS = ['wall', 'wall2', 'wall3'], ROOFS = ['roof', 'roof2', 'roof3'];
  const darkWin = new THREE.MeshStandardMaterial({ color: '#141218', roughness: .7 });
  const allHouses = [], plumes = [];
  function addHouse(o, role) {
    const hh = house(o); scene.add(hh); allHouses.push(hh);
    hh.userData.windows.forEach(w => w.material = darkWin);
    hh.userData.role = role; return hh;
  }
  // the street's own row (far side, facing the street)
  const hero = addHouse({ x: -4.2, z: -5.6, w: 5, d: 5, h: 4.4, wall: 'wall', roof: 'roof', door: 1.4, windows: [[-1.2, 2.0]], upper: [[0, 3.6]] }, 'hero');
  const bath = addHouse({ x: 4.6, z: -6.1, w: 8, d: 6, h: 4.8, wall: 'wall3', roof: 'roof3', door: -2.6, windows: [[-.6, 2.0], [1.4, 2.0], [3.2, 2.0]], upper: [[-.8, 3.8], [1.6, 3.8]] }, 'bath');
  // a second chimney on the bathhouse (the furnace)
  const ch2 = box(.9, 3.6, .9, MM.wall2); ch2.position.set(4.6 - 2.6, 4.6, -6.1 - 1.2); scene.add(ch2);
  [[-10.4, 5.2], [-16.2, 5.6], [-22, 5], [12.4, 5.4], [18.4, 5.2], [24, 5]].forEach(([x, w], i) => addHouse({ x, z: -5.6, w: w, d: 5, h: 3.8 + R() * 1.6, wall: WALLS[i % 3], roof: ROOFS[(i + 1) % 3], door: (R() - .5) * 2, windows: [[(R() - .5) * 2, 2]], upper: [[(R() - .5) * 2, 3.4]] }, 'row'));
  // near side of the street: rear walls toward the camera, only seen from high up
  [-21, -15, -9, -3, 3, 9, 15, 21].forEach((x, i) => addHouse({ x, z: 6.4, w: 5.2, d: 4.6, h: 3.6 + R() * 1.2, wall: WALLS[(i + 2) % 3], roof: ROOFS[i % 3], ry: Math.PI, windows: [[0, 2]], chimney: i % 2 === 0 }, 'near'));
  // the rest of the city (rows behind / in front)
  for (const z of [-15, -23, -31, 14.5, 21]) for (let x = -24; x <= 24; x += 5.6 + R() * 1.2) {
    if (Math.abs(x + .6) < 1.6 && z < 0) continue;   // keep the alley open
    addHouse({ x: x + (R() - .5) * .8, z: z + (R() - .5) * 1.2, w: 4.4 + R() * 1.4, d: 4.4 + R() * .8, h: 3.4 + R() * 2.6, wall: WALLS[(R() * 3) | 0], roof: ROOFS[(R() * 3) | 0], ry: z > 0 ? Math.PI : 0, windows: [[0, 2]], chimney: R() > .3 }, 'city');
  }
  // a church tower on the map (landmark)
  const tower = box(3.2, 13, 3.2, MM.wall2); tower.position.set(-14, 0, -27); scene.add(tower);
  const spire = new THREE.Mesh(new THREE.ConeGeometry(2.6, 6, 4), MM.roof2); spire.rotation.y = Math.PI / 4; spire.position.set(-14, 16, -27); spire.castShadow = true; scene.add(spire);

  // —— Bathhouse sign: a board on a bracket, a pixel tub painted on it ——
  {
    const P = new PX(28, 18), B = ramp(['#2a1a10', '#4a2e1a', '#6e4626', '#8c6034']), Wt = ramp(['#24508a', '#3a78b8', '#6aa8dc']);
    P.fill((x, y) => { const e = x === 0 || y === 0 || x === 27 || y === 17; return B(e ? .15 : .5 + (h2(x >> 2, y, 4) - .5) * .3, x, y); });
    P.poly([[6, 9], [22, 9], [20, 15], [8, 15]], (x, y) => B(.95 - (x % 3 === 0 ? .3 : 0), x, y));   // tub
    P.rect(7, 8, 14, 1, Wt(.6, 0, 0));                                                           // water
    for (const sx of [10, 14, 18]) { P.set(sx, 6, hex('#e8e4dc')); P.set(sx + 1, 4, hex('#e8e4dc')); P.set(sx, 2, hex('#e8e4dc')); }   // steam squiggles
    const sm = new THREE.MeshStandardMaterial({ map: texOf(P.done()), roughness: .8, side: THREE.DoubleSide });
    const board = new THREE.Mesh(new THREE.PlaneGeometry(1.4, .9), sm); board.rotation.y = Math.PI / 2; board.position.set(.75, 3.15, -2.55); board.castShadow = true; scene.add(board);
    const br = box(.9, .07, .07, MM.beam); br.position.set(.75, 3.62, -2.95); br.rotation.y = Math.PI / 2; scene.add(br);
  }
  // Props
  [[-6.2, -2.6], [9.8, -2.7]].forEach(([x, z]) => { const b = barrel(); b.position.set(x, 0, z); scene.add(b); });
  [[8.6, -2.7], [-12, -2.8]].forEach(([x, z]) => { const c = crate(.7); c.position.set(x, 0, z); c.rotation.y = .3; scene.add(c); });
  // wood pile by the bathhouse
  for (let i = 0; i < 9; i++) { const l = mesh(new THREE.CylinderGeometry(.11, .11, 1.3, 6).rotateZ(Math.PI / 2).translate(0, 0, 0), MM.beam); l.position.set(-.1 + (i % 3) * .0, .12 + Math.floor(i / 3) * .2, -3.0 + (i % 3) * .22); l.rotation.y = Math.PI / 2; scene.add(l); }

  // —— Lights: your candle window; bathhouse windows + door glow at first light ——
  const heroWin = windowMat().clone(); heroWin.emissiveIntensity = 1.6; hero.userData.windows[0].material = heroWin;
  const candleL = new THREE.PointLight('#ffa050', 7, 9, 2); candleL.position.set(-5.4, 2.0, -2.6); scene.add(candleL);
  const candleG = glow('#ffb060', 1.3, 1); candleG.position.set(-5.4, 2.0, -3.0); scene.add(candleG);
  const bathWin = windowMat().clone(); bathWin.emissiveIntensity = 0;
  bath.userData.windows.forEach(w => w.material = bathWin);
  const bathL = [[2.0, 2.2, -1.4], [6.4, 2.2, -1.4]].map(p => { const L = new THREE.PointLight('#ff9d4a', 0, 8, 2); L.position.set(...p); scene.add(L); return L; });
  const fillL = new THREE.PointLight('#9fb2e8', 0, 7, 2); scene.add(fillL);

  // —— Steam plumes: the bathhouse's own chimney + two dozen across the city ——
  const bathHouses = allHouses.filter(h => h.userData.role === 'city' || h.userData.role === 'row' || h.userData.role === 'near');
  const pick = [...bathHouses].sort((a, b) => h2(Math.round(a.position.x * 10), Math.round(a.position.z * 10), 2) - h2(Math.round(b.position.x * 10), Math.round(b.position.z * 10), 2)).slice(0, 23);
  const srcs = [new THREE.Vector3(4.6 - 2.6, 8.2, -7.3), ...pick.map(h => { const bb = new THREE.Box3().setFromObject(h); return new THREE.Vector3(h.position.x + (h.rotation.y ? -1 : 1) * 1.1, bb.max.y + .6, h.position.z); })];
  srcs.sort((a, b) => (a.x - b.x) * .2 + (a.z - b.z));
  const PPL = 16, plumeOn = new Float32Array(srcs.length);
  const Pl = particles(srcs.length * PPL, (i, t, o) => {
    const k = Math.floor(i / PPL), j = i % PPL, s = srcs[k], on = plumeOn[k];
    const ph = (t * .18 + j / PPL + h2(k, j, 3) * .1) % 1;
    o.x = s.x + Math.sin(ph * 5 + k) * .5 + ph * 2.2; o.y = s.y + ph * 7; o.z = s.z + Math.cos(ph * 4 + j) * .3;
    o.a = on * Math.sin(Math.PI * ph) * .5; o.s = 1.0 + ph * 3.0; o.r = o.g = o.b = 1;
  }, { soft: 1, blend: THREE.NormalBlending });
  scene.add(Pl);

  // —— People ——
  const you = makePerson('you'), crier = makePerson('crier'), lurk = makePerson('lurk', { shadow: false });
  const extras = ['m1', 'm2', 'm3'].map(p => makePerson(p));
  scene.add(you.root, crier.root, lurk.root, ...extras.map(e => e.root));
  const YOU = new THREE.Vector3(-2.8, 0, -2.5), LURK = new THREE.Vector3(-.55, 0, -4.4);

  // —— Cameras ——
  const cams = {
    map: { p: track([[0, [-7, 44, 50]], [5.1, [-5.5, 36, 40]]]), l: track([[0, [-2, 0, -5]], [5.1, [-2.5, 0, -4]]]), fov: 34, aper: 420, band: .42 },
    dozen: { p: track([[5.1, [-3, 38, 34]], [7.6, [-1, 72, 14]], [10.1, [0, 92, 4]]]), l: track([[5.1, [-2.5, 0, -4]], [10.1, [0, 0, -2]]]), fov: 40, aper: 260, band: .5 },
    law: { p: track([[10.1, [-5.4, 8.2, 13.4]], [15.6, [-4.2, 7.6, 12.2]], [21.8, [-2.0, 6.6, 10.4]]]), l: track([[10.1, [-3.0, 1.2, -3.2]], [15.6, [-2.4, 1.2, -3.4]], [21.8, [-1.0, 1.1, -4.0]]]), fov: 32, aper: 260 },
    light: { p: track([[22.2, [7.5, 9.5, 15]], [26.4, [2.6, 6.6, 10.6]], [28.4, [1.2, 6.0, 9.6]]]), l: track([[22.2, [7.2, 1.4, -2.6]], [26.4, [1.6, 1.0, -1.6]], [28.4, [.6, 1.0, -1.8]]]), fov: 32, aper: 240 },
    sunday: { p: track([[37.2, [0, 92, 4]], [42.6, [0, 84, 6]]]), l: track([[37.2, [0, 0, -2]], [42.6, [0, 0, -2.5]]]), fov: 40, aper: 260, band: .5 },
    day: { p: track([[50.3, [-1, 4.8, 9.2]], [53.0, [1, 12, 20]], [56.4, [3, 28, 36]]]), l: track([[50.3, [1.2, 1.1, -2.2]], [56.4, [2.5, 0, -6]]]), fov: 34, aper: 300, band: .48 },
  };
  const tmpV = new THREE.Vector3();

  function update(t, shot, cam, post, renderer) {
    const C = cams[shot.id] || cams.day; const p = C.p(t), l = C.l(t);
    cam.position.set(...p); cam.fov = C.fov; cam.updateProjectionMatrix(); cam.up.set(0, 1, 0);
    if (shot.id === 'dozen' || shot.id === 'sunday') cam.up.set(0, 0, -1);
    cam.lookAt(...l);

    // —— time of day ——
    let D;
    if (shot.id === 'sunday') D = mixTod(TOD.sun, TOD.sun, 0);
    else if (shot.id === 'light') { const k = ss(seg(t, T.dawn0, T.dawn1)); D = mixTod(TOD.night, TOD.dawn, k); }
    else if (shot.id === 'day') D = mixTod(TOD.dawn, TOD.day, ss(seg(t, 49.5, 50.6)));
    else D = mixTod(TOD.night, TOD.night, 0);
    SK.u.top.value.copy(D.top); SK.u.mid.value.copy(D.mid); SK.u.hor.value.copy(D.hor); SK.u.moonCol.value.copy(D.sunCol); SK.u.moonI.value = D.sunI;
    scene.fog.color.copy(D.fog); scene.fog.density = D.fogD;
    sunL.color.copy(D.dir); sunL.intensity = D.dirI; hemi.color.copy(D.hs); hemi.groundColor.copy(D.hg); hemi.intensity = D.hI;
    const nightK = shot.id === 'light' ? 1 - ss(seg(t, T.dawn0, T.dawn1)) : (shot.id === 'map' || shot.id === 'dozen' || shot.id === 'law') ? 1 : 0;
    ST.material.uniforms.t.value = t; ST.material.uniforms.k.value = nightK;
    if (shot.id === 'day' || (shot.id === 'light' && t > T.dawn0)) { const k = shot.id === 'day' ? 1 : ss(seg(t, T.dawn0, T.dawn1)); sunL.position.set(lerp(30, 40, k), lerp(38, 30, k), lerp(-30, 10, k)); SK.u.moonDir.value.set(lerp(.6, .9, k), lerp(.32, .12, k), lerp(-1, -.6, k)).normalize(); }
    else { sunL.position.set(30, 38, -30); SK.u.moonDir.value.set(.6, .32, -1).normalize(); }
    renderer.toneMappingExposure = D.exp;
    RIV.u.t.value = t; RIV.u.camPos.value.copy(cam.position); RIV.u.fogColor.value.copy(scene.fog.color); RIV.u.fogDensity.value = scene.fog.density; RIV.setLights([]);

    // candle in your window (night only), bathhouse comes alive at first light
    const fk = flick(t, 3), candle = nightK > .02 && shot.id !== 'day' && shot.id !== 'sunday' ? nightK : 0;
    heroWin.emissiveIntensity = 1.8 * candle * fk; candleL.intensity = 7 * candle * fk; candleG.material.opacity = .7 * candle;
    const bathOn = shot.id === 'light' ? ss(seg(t, T.bathLit, T.bathLit + .6)) : shot.id === 'day' ? 1 : 0;
    bathWin.emissiveIntensity = 2.2 * bathOn * fk; bathL.forEach((L, i) => L.intensity = 3.5 * bathOn * flick(t, 6 + i));
    // plumes
    for (let k = 0; k < srcs.length; k++) {
      let on = 0;
      if (shot.id === 'dozen' || shot.id === 'map') on = ss(seg(t, T.plume0 - 1.2 + k * .085, T.plume0 - .9 + k * .085));
      if (shot.id === 'light') on = srcs[k].z < -6.5 && Math.abs(srcs[k].x - 2) < .2 ? ss(seg(t, T.bathLit - .4, T.bathLit + 1)) : .0;
      if (shot.id === 'day') on = 1;
      if (shot.id === 'law') on = 0;
      plumeOn[k] = on * (shot.id === 'dozen' || shot.id === 'map' ? .8 : 1);
    }
    // the bathhouse plume (index of the first source) also smokes before dawn in the map? no — it starts with the others
    const plumeBright = shot.id === 'day' ? .95 : shot.id === 'light' ? lerp(.7, .9, ss(seg(t, T.dawn0, T.dawn1))) : .78;
    Pl.material.uniforms.scale.value = (shot.id === 'dozen' || shot.id === 'map') ? 7 : 2.6; Pl.userData.update(t);
    const ca = Pl.geometry.attributes.col.array; for (let i = 0; i < ca.length; i++) ca[i] = plumeBright * (i % 3 === 2 ? 1.06 : 1);

    const wide = shot.id === 'map' || shot.id === 'dozen' || shot.id === 'sunday' || (shot.id === 'day' && t > 51.6);
    allHouses.forEach(h => { if (h.userData.role === 'near') h.visible = wide; });
    if (shot.id === 'dozen' || shot.id === 'sunday') scene.fog.density *= .45;
    // —— people ——
    const step = Math.floor(t * 8);
    you.root.visible = shot.id === 'law' || shot.id === 'light' || shot.id === 'map' || shot.id === 'day';
    you.root.position.copy(YOU); let yf = step % 26 === 0 ? 'blink' : (Math.floor(t * 1.3) % 2 ? 'idle1' : 'idle0'), yflip = false;
    if (shot.id === 'day') {   // you walk out of the bathhouse door into the morning
      const u = clamp((t - 50.4) / 5.6); you.root.position.set(lerp(2.0, -3.2, u), 0, -2.6); yf = ['w0', 'w1', 'w2', 'w3'][Math.floor(t * 9) % 4]; yflip = true;
    }
    you.frame(yf); you.face(cam, yflip);

    crier.root.visible = shot.id === 'light';
    if (shot.id === 'light') {
      const u = clamp((t - T.crierWalk) / (T.cryIn - .15 - T.crierWalk)), x = lerp(10.5, 1.2, eio(u));
      crier.root.position.set(x, 0, -.4);
      const cf = t >= T.cryIn - .1 ? (Math.floor(t * 3) % 2 ? 'cry1' : 'cry0') : u < 1 ? ['w0', 'w1', 'w2', 'w3'][Math.floor(t * 9) % 4] : 'idle0';
      crier.frame(cf); crier.face(cam, true);
      if (t > T.cryIn - .1) crier.face(cam, false);   // turns to the houses to call
    }
    lurk.root.visible = shot.id === 'law';
    if (shot.id === 'law') { const u = ss(seg(t, 19.1, 19.9)); lurk.root.position.set(LURK.x, 0, LURK.z + u * .7); lurk.frame(u > 0 && u < 1 ? ['w0', 'w1', 'w2', 'w3'][Math.floor(t * 8) % 4] : 'idle0'); lurk.face(cam, true); }
    extras.forEach((e, i) => {
      e.root.visible = shot.id === 'day';
      const u = (t * .8 + i * 3.1) % 14; e.root.position.set(-10 + u * (i % 2 ? 1 : 1.1) + i * 2, 0, i === 1 ? .8 : -.5 + i * .4); e.frame(['w0', 'w1', 'w2', 'w3'][Math.floor(t * 8 + i) % 4]); e.face(cam, false);
    });

    // front fill near the subject so billboards read
    const subj = shot.id === 'light' ? crier.root.position : YOU;
    fillL.position.copy(subj).add(tmpV.set(.4, 1.6, 2.2)); fillL.intensity = (shot.id === 'law' || shot.id === 'light') ? 1.6 : 0;

    // —— focus ——
    let focusP = null;
    if (shot.id === 'law') focusP = tmpV.set(lerp(-2.8, -1.2, ss(seg(t, 15.6, 20.5))), .9, lerp(-2.5, -4.0, ss(seg(t, 15.6, 20.5)))).clone();
    else if (shot.id === 'light') focusP = crier.root.position.clone().setY(.9);
    else if (shot.id === 'day' && t < 52.5) focusP = you.root.position.clone().setY(.9);
    const look = new THREE.Vector3(...l);
    post.dof.focus = cam.position.distanceTo(focusP || look); post.dof.aper = C.aper; post.dof.maxCoc = 20;
    post.tiltBand = C.band ?? null; post.tiltTarget = focusP;
  }
  return { scene, update };
}
