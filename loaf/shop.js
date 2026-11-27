// The bakehouse, London c. 1300 — cut away (no front wall, no ceiling).
// A big window in the back wall lights the frame; shelves of thread; a table with the candle that may not be used; a door on the right.
import * as THREE from 'three';
import { PX, ramp, hex, h2, fbm, texOf, woodPlanks, plaster, rock, glow, mulberry } from './px.js';
import { mats, mat, mesh, box, barrel, crate, fire } from './kit.js';
import { particles, beamCard, flick } from './fx.js';
import { makePerson } from './chars.js';
import { T } from './story.js';
import { clamp, seg, ss, eio, lerp, track } from '/core/lib.js';

const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const C3 = c => new THREE.Color(c);
// light moods: window colour, spot (window light) colour/intensity, ambient
const MOOD = {
  dawn: { win: '#ffd6a8', winI: 1.6, spot: '#ffc890', spotI: 12, hs: '#b8a49a', hg: '#24160e', hI: .75, exp: 1.15 },
  day: { win: '#fff4dc', winI: 1.7, spot: '#fff0d2', spotI: 20, hs: '#d2c4b0', hg: '#2c1c12', hI: 1.0, exp: 1.2 },
  winter: { win: '#dfe8f4', winI: 1.6, spot: '#e4ecf8', spotI: 12, hs: '#a8b0bc', hg: '#1c1a1e', hI: .8, exp: 1.2 },
  dusk: { win: '#7a8aa8', winI: .55, spot: '#8ea0c4', spotI: 5, hs: '#6a7088', hg: '#141216', hI: .55, exp: 1.25 },
  night: { win: '#2c3a58', winI: .35, spot: '#40507a', spotI: 0, hs: '#4a5478', hg: '#10101a', hI: .7, exp: 1.45 },
};
function mixMood(a, b, k) { const o = {}; for (const key in a) o[key] = typeof a[key] === 'number' ? lerp(a[key], b[key], k) : C3(a[key]).lerp(C3(b[key]), k); return o; }

export function buildShop() {
  const scene = new THREE.Scene(), MM = mats();
  scene.background = new THREE.Color('#07060a');
  scene.fog = new THREE.FogExp2('#1c1612', .018);
  const hemi = new THREE.HemisphereLight('#c8b8a8', '#2a1a14', .9); scene.add(hemi);
  const key = new THREE.DirectionalLight('#ffe8c8', .5); key.position.set(6, 12, 8); scene.add(key);

  // —— Room shell ——
  const floorM = mat(woodPlanks(96, 96, { pw: 6, len: 48, seed: 14, cols: ['#20140e', '#3a2516', '#56371f', '#704a2a', '#8a5e36'] }));
  const wallM = mat(plaster(96, 96, { seed: 23, wall: ['#6a5c4c', '#86766a', '#a2907c', '#b9a68e'], beams: [{ t: 'h', y: 0 }, { t: 'v', x: 0 }, { t: 'v', x: 48 }] }));
  scene.add(mesh(new THREE.BoxGeometry(16, .3, 8).translate(0, -.15, 0), floorM));
  // back wall with a window opening (x −4.4..−2.4, y 1.7..3.3)
  const WX = -3.4, WY = 2.5, WW = 2.0, WH = 1.6;
  const backParts = [[-8, -4.4, 0, 4.4], [-2.4, 8, 0, 4.4], [-4.4, -2.4, 0, WY - WH / 2], [-4.4, -2.4, WY + WH / 2, 4.4]];
  backParts.forEach(([x0, x1, y0, y1]) => scene.add(mesh(new THREE.BoxGeometry(x1 - x0, y1 - y0, .4).translate((x0 + x1) / 2, (y0 + y1) / 2, -3.7), wallM)));
  scene.add(mesh(new THREE.BoxGeometry(.4, 4.4, 8).translate(-7.8, 2.2, 0), wallM));
  // right wall with a door opening (z −.2..1.4)
  scene.add(mesh(new THREE.BoxGeometry(.4, 4.4, 3.7).translate(7.8, 2.2, -2.05), wallM));
  scene.add(mesh(new THREE.BoxGeometry(.4, 4.4, 2.6).translate(7.8, 2.2, 2.7), wallM));
  scene.add(mesh(new THREE.BoxGeometry(.4, 2.2, 1.6).translate(7.8, 3.3, .6), wallM));
  const door = new THREE.Group(); const dp = box(.1, 2.2, 1.6, MM.plankDark); dp.position.set(0, 0, .8); door.add(dp); door.position.set(7.66, 0, -.2); scene.add(door);
  const outside = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 2.2), new THREE.MeshBasicMaterial({ color: '#c8d4e0' })); outside.rotation.y = -Math.PI / 2; outside.position.set(8.02, 1.1, .6); scene.add(outside);
  scene.add(mesh(new THREE.BoxGeometry(16, .5, .3).translate(0, .25, 3.85), wallM));   // cut-away front lip
  for (const x of [-5.4, -1.6, 2.2, 5.8]) { const b = box(.25, .25, 8, MM.beam); b.position.set(x, 4.3, 0); scene.add(b); }

  // —— The window: pixel mullions over a bright pane (the only real light) ——
  const wp = new PX(40, 32), WF = ramp(['#1a0f0b', '#33200f', '#4d3219']);
  wp.fill((x, y) => { const fr = x < 2 || x > 37 || y < 2 || y > 29 || x === 19 || x === 20 || y === 15 || y === 16; if (fr) return WF(x < 2 || y < 2 ? .9 : .4, x, y); const lead = (x + y) % 6 === 0 || (x - y + 60) % 6 === 0; return lead ? hex('#6a6a6a') : hex('#ffffff'); });
  const winM = new THREE.MeshBasicMaterial({ map: texOf(wp.done()), color: '#ffffff', fog: false });
  const winQ = new THREE.Mesh(new THREE.PlaneGeometry(WW, WH), winM); winQ.position.set(WX, WY, -3.55); scene.add(winQ);
  const sill = box(2.3, .1, .4, MM.beam); sill.position.set(WX, WY - WH / 2 - .1, -3.35); scene.add(sill);
  const winG = glow('#fff0d0', 3.2, .7); winG.position.set(WX, WY, -3.2); scene.add(winG);
  const spot = new THREE.SpotLight('#fff0d2', 40, 14, .62, .55, 1.6); spot.position.set(WX + .3, WY + .3, -3.3); spot.target.position.set(-2.2, .6, -.6);
  spot.castShadow = true; spot.shadow.mapSize.set(2048, 2048); spot.shadow.bias = -.0008; scene.add(spot, spot.target);
  const beam = beamCard(6.2, 1.7, 2.8, '#fff0d0', { k: .3, fall: 1.1 }); scene.add(beam);
  const beam2 = beamCard(5.2, 1.0, 2.0, '#fff0d0', { k: .2, fall: 1.0 }); scene.add(beam2);

  // —— The kneading trough on trestles, a floured board with dough and loaves ——
  const FX = -2.3, FZ = -1.0, FY = .72;
  for (const x of [FX - 2.0, FX + 2.0]) {
    for (const dz of [-.5, .5]) { const l = box(.09, FY, .09, MM.beam); l.position.set(x, 0, FZ + dz); scene.add(l); }
  }
  const trough = box(4.4, .22, 1.3, MM.plank); trough.position.set(FX, FY - .12, FZ); scene.add(trough);
  const SW = 96, SH = 28, sp = new PX(SW, SH), BOARD = ramp(['#6a4a2a', '#8a6438', '#a88048', '#c09a5c']), FLOUR = ramp(['#c8bca4', '#e0d6c0', '#f2ecdc', '#fffaf0']);
  sp.fill((x, y) => { const fl = fbm(x * .15, y * .2, 5) + (h2(x, y, 2) - .5) * .25; if (fl > .52) return FLOUR(.3 + (fl - .52) * 3, x, y); return BOARD(.4 + (h2(x >> 3, y, 1) - .5) * .4 + (y % 7 === 0 ? -.2 : 0), x, y); });
  const silk = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 1.14), new THREE.MeshStandardMaterial({ map: texOf(sp.done()), roughness: .95 })); silk.rotation.x = -Math.PI / 2; silk.position.set(FX, FY + .005, FZ); silk.receiveShadow = true; scene.add(silk);
  // loaf texture (crust), dough texture
  const LP = new PX(16, 16), CR = ramp(['#4a2410', '#7a3e18', '#a8602a', '#cc8a44', '#e8b06a']);
  LP.fill((x, y) => CR(.35 + (y < 6 ? .35 : 0) + (h2(x, y, 7) - .5) * .4 + ((x + y) % 5 === 0 ? -.2 : 0), x, y));
  const loafM = new THREE.MeshStandardMaterial({ map: texOf(LP.done()), roughness: .8 });
  const DP = new PX(16, 16), DG = ramp(['#c8b48c', '#e0cea6', '#f0e2c0', '#fff4dc']); DP.fill((x, y) => DG(.5 + (h2(x, y, 3) - .5) * .4, x, y));
  const doughM = new THREE.MeshStandardMaterial({ map: texOf(DP.done()), roughness: .9 });
  const loafGeo = new THREE.SphereGeometry(.16, 12, 8); loafGeo.scale(1, .55, 1); loafGeo.translate(0, .08, 0);
  const mkLoaf = (m = loafM, s = 1) => { const L = new THREE.Mesh(loafGeo, m); L.scale.setScalar(s); L.castShadow = true; return L; };
  for (const [dx, dz, m] of [[-1.6, .2, doughM], [-1.0, -.25, doughM], [.4, .25, loafM], [.8, -.2, loafM], [1.25, .15, loafM], [1.65, -.15, loafM]]) { const L = mkLoaf(m); L.position.set(FX + dx, FY + .01, FZ + dz); scene.add(L); }
  const stools = [[FX - 1.0, FZ - 1.05], [FX + 1.2, FZ - 1.05]].map(([x, z]) => { const s = box(.5, .36, .4, MM.plank); s.position.set(x, 0, z); scene.add(s); return s; });

  // —— Shelves of loaves (left of the oven) ——
  for (const y of [1.5, 2.3]) { const s = box(2.4, .08, .4, MM.plank); s.position.set(.6, y, -3.3); scene.add(s); }
  for (let i = 0; i < 12; i++) { const L = mkLoaf(loafM, .8); L.position.set(-.35 + (i % 6) * .38, (i < 6 ? 1.54 : 2.34), -3.25); scene.add(L); }

  // —— The oven: a brick dome against the back wall, fire in its mouth ——
  const OX = 3.6, OZ = -2.6;
  const BP = new PX(48, 24), BR = ramp(['#3a1a12', '#5e2a1a', '#843c24', '#a85434', '#c87048']);
  BP.fill((x, y) => { const row = y >> 1, off = row % 2 ? 3 : 0, mort = y % 2 === 0 || (x + off) % 6 === 0; return mort ? hex('#2a2018') : BR(.45 + (h2((x + off) / 6 | 0, row, 4) - .5) * .6 - y * .012, x, y); });
  const brickM = new THREE.MeshStandardMaterial({ map: texOf(BP.done()), roughness: .95 });
  const oven = new THREE.Group(); oven.position.set(OX, 0, OZ); scene.add(oven);
  const base = new THREE.Mesh(new THREE.BoxGeometry(2.4, .9, 1.9).translate(0, .45, 0), brickM); base.castShadow = base.receiveShadow = true; oven.add(base);
  const dome = new THREE.Mesh(new THREE.SphereGeometry(1.05, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), brickM); dome.scale.set(1.05, .8, .85); dome.position.y = .9; dome.castShadow = true; oven.add(dome);
  const mouth = new THREE.Mesh(new THREE.CircleGeometry(.32, 16, 0, Math.PI), new THREE.MeshBasicMaterial({ color: '#ff8a30' })); mouth.position.set(0, .92, .9); oven.add(mouth);
  const flame = fire(.42, { seed: 2, i: 3.2 }); flame.position.set(OX, .9, OZ + .78); scene.add(flame);
  const flame2 = fire(.32, { seed: 5, i: 3.0 }); flame2.position.set(OX + .15, .9, OZ + .74); scene.add(flame2);
  const ovenL = new THREE.PointLight('#ff9040', 6, 6, 2); ovenL.position.set(OX, 1.1, OZ + 1.4); scene.add(ovenL);
  const ovenG = glow('#ff9a40', 1.4, 1); ovenG.position.set(OX, 1.05, OZ + 1.0); scene.add(ovenG);
  const peel = box(.06, .06, 1.8, MM.beam); peel.rotation.x = -1.2; peel.position.set(OX + 1.5, 0, OZ + 1.0); scene.add(peel);
  // rubble that replaces the dome when it is pulled down
  const rubble = new THREE.Group(); scene.add(rubble);
  const RR0 = mulberry(9);
  for (let i = 0; i < 40; i++) { const b = new THREE.Mesh(new THREE.BoxGeometry(.18, .1, .12), brickM); b.position.set(OX + (RR0() - .5) * 2.2, .9 + RR0() * .25, OZ + (RR0() - .5) * 1.4); b.rotation.set(RR0() * 3, RR0() * 3, RR0() * 3); b.castShadow = true; rubble.add(b); }
  const smoke = particles(60, (i, t, o) => { const k = clamp((t - T.oven) / .3) * (1 - clamp((t - T.oven - 3.5) / 1.5)), ph = (t * .4 + h2(i, 5)) % 1; o.x = OX + (h2(i, 1) - .5) * 2.2 + Math.sin(ph * 6 + i) * .2; o.y = .9 + ph * 2.0; o.z = OZ + (h2(i, 2) - .5) * 1.4; o.a = k * (1 - ph) * .55; o.s = .3 + ph * .9; o.r = .62; o.g = .56; o.b = .5; }, { soft: 1, blend: THREE.NormalBlending });
  scene.add(smoke);

  // —— The table with the balance ——
  const tableTop = box(1.8, .08, .9, MM.plank); tableTop.position.set(3.7, .82, -.7 + .6); scene.add(tableTop);
  for (const [dx, dz] of [[-.8, -.38], [.8, -.38], [-.8, .38], [.8, .38]]) { const l = box(.08, .82, .08, MM.beam); l.position.set(3.7 + dx, 0, -.1 + dz); scene.add(l); }
  const metal = new THREE.MeshStandardMaterial({ color: '#8a7a5a', metalness: .6, roughness: .4 });
  const SX = 3.5, SY = .9, SZ = -.1;
  const post = new THREE.Mesh(new THREE.CylinderGeometry(.025, .04, .7, 8).translate(0, .35, 0), metal); post.position.set(SX, SY, SZ); scene.add(post);
  const sbase = new THREE.Mesh(new THREE.CylinderGeometry(.12, .14, .04, 10), metal); sbase.position.set(SX, SY + .02, SZ); scene.add(sbase);
  const sbeam = new THREE.Group(); sbeam.position.set(SX, SY + .7, SZ); scene.add(sbeam);
  sbeam.add(new THREE.Mesh(new THREE.BoxGeometry(.9, .025, .025), metal));
  const pans = [-1, 1].map(s => { const hang = new THREE.Group(); hang.position.set(s * .43, 0, 0); sbeam.add(hang); const pan = new THREE.Group(); scene.add(pan);
    const dish = new THREE.Mesh(new THREE.CylinderGeometry(.17, .12, .04, 14), metal); pan.add(dish); const str = new THREE.Mesh(new THREE.CylinderGeometry(.004, .004, .4, 4).translate(0, .2, 0), metal); pan.add(str); return { hang, pan }; });
  const scaleLoaf = mkLoaf(loafM, .9); pans[0].pan.add(scaleLoaf); scaleLoaf.position.y = .02;
  const weight = new THREE.Mesh(new THREE.CylinderGeometry(.07, .08, .12, 8).translate(0, .08, 0), new THREE.MeshStandardMaterial({ color: '#4a4440', metalness: .7, roughness: .4 })); pans[1].pan.add(weight);
  const lump = mkLoaf(doughM, .35); lump.position.set(0, .06, 0); scaleLoaf.add(lump);
  const chest = crate(.8); chest.scale.set(1.5, .8, .9); chest.position.set(-6.0, 0, -2.9); scene.add(chest);
  const basket = barrel(.25, .45); basket.position.set(5.0, 0, .9); scene.add(basket);

  // dust / flour in the window light
  const RR = mulberry(4), motes = [...Array(160)].map(() => [RR(), RR(), RR(), RR()]);
  let moteK = 1;
  const dust = particles(motes.length, (i, t, o) => { const m = motes[i], u = (m[0] + t * .01 * (m[3] + .3)) % 1; o.x = lerp(WX, -1.4, u) + Math.sin(t * .3 + i) * .3; o.y = lerp(WY, .7, u) + (m[1] - .5) * 1.2; o.z = lerp(-3.3, -.4, u) + (m[2] - .5) * 1.4; o.a = moteK * .55 * Math.sin(Math.PI * u); o.s = .02 + m[3] * .03; o.r = 1; o.g = .95; o.b = .85; });
  scene.add(dust);

  // —— People ——
  const you = makePerson('you'), master = makePerson('master'), j1 = makePerson('jure'), j2 = makePerson('jure2');
  [you, master, j1, j2].forEach(p => scene.add(p.root));
  const fill = new THREE.PointLight('#ffd8b0', 1.4, 7, 2); scene.add(fill);
  const faceL = new THREE.PointLight('#ffcf9a', 2.2, 4, 2); faceL.position.set(FX - 1.0, 1.9, FZ + .2); scene.add(faceL);
  const SEAT_M = V3(FX - 1.0, .36, FZ - 1.05);
  const walk = (t, k = 9) => ['w0', 'w1', 'w2', 'w3'][Math.floor(t * k) % 4];
  const idle = (t, s = 0) => Math.floor(t * 8 + s * 7) % 29 === 0 ? 'blink' : (Math.floor(t * 1.2 + s) % 2 ? 'idle1' : 'idle0');
  const sew = (t, s = 0) => Math.floor(t * 8 + s) % 37 === 0 ? 'sewB' : (Math.floor(t * 2.4 + s) % 2 ? 'sew1' : 'sew0');
  const KIDP = V3(2.75, 0, .5);   // you, at the scale table

  const cams = {
    open: { p: track([[0, [2.4, 3.4, 8.4]], [7.7, [2.7, 2.6, 6.2]]]), l: track([[0, [3.0, 1.5, -1.0]], [7.7, [3.1, 1.4, -.6]]]), fov: 40, aper: 160 },
    scale: { p: track([[7.7, [3.5, 1.9, 3.6]], [11, [3.5, 1.8, 3.1]]]), l: track([[7.7, [3.5, 1.55, -.1]], [11, [3.5, 1.5, -.1]]]), fov: 40, aper: 150 },
    check: { p: track([[11, [3.6, 2.6, 5.8]], [20.3, [4.6, 2.4, 4.6]]]), l: track([[11, [4.6, 1.1, -.2]], [20.3, [5.6, 1.1, 0]]]), fov: 40, aper: 200 },
    first: { p: track([[20.3, [5.0, 2.2, 5.2]], [32.8, [4.6, 2.1, 4.4]]]), l: track([[20.3, [5.8, 1.9, .2]], [32.8, [5.7, 1.9, .2]]]), fov: 40, aper: 160 },
    second: { p: track([[32.8, [-2.0, 1.9, 2.8]], [39, [-2.2, 1.85, 2.2]]]), l: track([[32.8, [-3.2, 1.75, -2.0]], [39, [-3.3, 1.75, -2.0]]]), fov: 40, aper: 160 },
    third: { p: track([[39, [1.5, 2.1, 2.2]], [44.4, [1.3, 2.4, 3.0]]]), l: track([[39, [3.6, 1.7, -2.6]], [44.4, [3.6, 1.7, -2.6]]]), fov: 40, aper: 160 },
    fix: { p: track([[44.4, [3.5, 1.85, 3.3]], [48.9, [3.5, 1.8, 2.9]]]), l: track([[44.4, [3.5, 1.5, -.1]], [48.9, [3.5, 1.5, -.1]]]), fov: 40, aper: 150 },
    end: { p: track([[48.9, [2.0, 2.3, 4.0]], [53, [1.4, 3.4, 6.8]], [59, [.8, 5.4, 11.0]]]), l: track([[48.9, [2.4, 1.0, -.6]], [59, [.8, 1.0, -1.2]]]), fov: 40, aper: 220 },
  };

  function update(t, shot, cam, post, renderer) {
    const id = shot.id, C = cams[id] || cams.end, p = C.p(t), l = C.l(t);
    cam.position.set(...p); cam.fov = C.fov; cam.up.set(0, 1, 0); cam.updateProjectionMatrix(); cam.lookAt(...l);

    // —— light mood: a bakehouse starts before dawn ——
    let M;
    if (id === 'open') M = mixMood(MOOD.dawn, MOOD.day, ss(seg(t, 0, 7.7)) * .6);
    else if (id === 'first' || id === 'second') M = mixMood(MOOD.day, MOOD.dusk, .35);
    else if (id === 'third') M = mixMood(MOOD.day, MOOD.dusk, .35 + .45 * ss(seg(t, T.oven, T.oven + 1.5)));
    else M = mixMood(MOOD.dawn, MOOD.day, .7);
    winM.color.copy(M.win).multiplyScalar(M.winI); winG.material.color.copy(M.win).multiplyScalar(.35 * M.winI / 2.4);
    spot.color.copy(M.spot); spot.intensity = M.spotI; hemi.color.copy(M.hs); hemi.groundColor.copy(M.hg); hemi.intensity = M.hI;
    key.intensity = .25 * M.hI; renderer.toneMappingExposure = M.exp;
    const beamK = M.spotI / 20; moteK = beamK;
    beam.material.uniforms.t.value = t; beam2.material.uniforms.t.value = t;
    beam.material.uniforms.col.value.copy(M.spot); beam2.material.uniforms.col.value.copy(M.spot);
    const s1 = beam.userData.aim(V3(WX, WY + .1, -3.4), V3(.25, -.62, .74), cam); beam.material.uniforms.k.value = .26 * s1 * beamK;
    const s2 = beam2.userData.aim(V3(WX - .5, WY - .2, -3.4), V3(.42, -.6, .68), cam); beam2.material.uniforms.k.value = .16 * s2 * beamK;
    dust.userData.update(t); smoke.userData.update(t);

    // —— the oven: alive, until it is pulled down in 'third' (then back for the rest: that was the warning, not you) ——
    const down = id === 'third' ? ss(seg(t, T.oven, T.oven + .8)) : 0, fk = flick(t, 4);
    dome.visible = down < .5; dome.scale.set(1.05, .8 * (1 - down * .8), .85); rubble.visible = down >= .5;
    const fireK = 1 - ss(seg(t, T.oven - .1, T.oven + .5)) * (id === 'third' ? 1 : 0);
    flame.visible = flame2.visible = fireK > .02; flame.userData.update(t, cam, fireK); flame2.userData.update(t + .3, cam, fireK);
    ovenL.intensity = 7 * fireK * fk; ovenG.material.opacity = .55 * fireK; mouth.material.color.set(fireK > .1 ? '#ff8a30' : '#120a08');

    // —— the balance: a light loaf lets the weight side sink; added dough levels it ——
    let tilt = .16;   // + = weight side down
    if (id === 'scale') tilt = .16 * ss(seg(t, 7.9, 8.6)) + .02 * Math.sin(t * 6) * (1 - seg(t, 8.6, 10));
    if (id === 'fix') tilt = .16 * (1 - ss(seg(t, T.dough + .1, T.dough + .9)));
    if (id === 'end') tilt = 0;
    sbeam.rotation.z = -tilt;
    pans.forEach(({ hang, pan }) => { hang.updateMatrixWorld(true); const w = new THREE.Vector3(); hang.getWorldPosition(w); pan.position.set(w.x, w.y - .42, w.z); });
    lump.visible = (id === 'fix' && t > T.dough) || id === 'end'; lump.scale.setScalar(.35 * ss(seg(t, T.dough, T.dough + .4)) + (id === 'end' ? .35 : 0));

    // —— people ——
    [you, master, j1, j2].forEach(q => { q.root.visible = false; q.root.scale.setScalar(1); q.shadowBlob.visible = true; });
    const show = (q, x, y, z, f, flip = false, sc = 1) => { q.root.visible = true; q.root.position.set(x, y, z); q.root.scale.setScalar(sc); q.frame(f); q.face(cam, flip); q.shadowBlob.visible = y < .05; };
    const KID = .8;
    let focus = null;
    const sitM = f => show(master, SEAT_M.x, SEAT_M.y, SEAT_M.z, f);
    const kid = (f = idle(t, 1)) => show(you, KIDP.x, 0, KIDP.z, f, false, KID);
    // officers: walk in through the door at T.men, stand by the door
    const offIn = (q, dx, dz, s) => { const k = ss(seg(t, T.men + s, T.men + s + 1.4)), x = lerp(7.4, 6.0 + dx, k), z = lerp(.6, .3 + dz, k); show(q, x, 0, z, k < 1 && k > 0 ? walk(t) : idle(t, s), true); };
    door.rotation.y = 0;
    if (id === 'open') { sitM(sew(t)); kid(); focus = V3(1.6, 1.0, -.6); }
    if (id === 'scale') { kid(); focus = V3(SX, SY + .5, SZ); }
    if (id === 'check') { sitM(sew(t)); kid(); if (t > T.men - .8) { door.rotation.y = -1.2 * ss(seg(t, T.men - .8, T.men)); offIn(j1, 0, 0, 0); offIn(j2, .2, .7, .4); } focus = V3(5.4, 1.0, .2); }
    if (id === 'first') { door.rotation.y = -1.2; show(j1, 6.0, 0, .3, idle(t), true); show(j2, 6.2, 0, 1.0, idle(t, 2), true); kid(); focus = V3(5.6, 1.0, .4); }
    if (id === 'second') { sitM(Math.floor(t * 8) % 23 === 0 ? 'sitB' : 'sit0'); focus = SEAT_M.clone().setY(1.1); }
    if (id === 'third') { sitM('sit0'); focus = V3(OX, 1.1, OZ); }
    if (id === 'fix') { kid(); focus = V3(SX, SY + .4, SZ); }
    if (id === 'end') { sitM(sew(t)); kid(); focus = V3(2.0, .9, -.8); }
    fill.position.set(cam.position.x * .3 + l[0] * .7, 1.9, l[2] + 2.6); fill.intensity = 1.3; faceL.intensity = 2.2 * (M.spotI / 20 * .6 + .4);

    const fp = focus || V3(...l);
    post.dof.focus = cam.position.distanceTo(fp); post.dof.aper = C.aper; post.dof.maxCoc = 20;
    post.tiltBand = null; post.tiltTarget = fp;
  }
  return { scene, update };
}
