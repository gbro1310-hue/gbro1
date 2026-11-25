// Set B: the embroiderer's workshop, Paris 1303 — cut away (no front wall, no ceiling).
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

  // —— The embroidery frame: two trestles, two rollers, the silk stretched between, gold work in progress ——
  const FX = -2.3, FZ = -1.0, FY = .72;
  for (const x of [FX - 2.0, FX + 2.0]) {
    for (const dz of [-.5, .5]) { const l = box(.09, FY, .09, MM.beam); l.position.set(x, 0, FZ + dz); scene.add(l); }
    const tb = box(.14, .1, 1.3, MM.beam); tb.position.set(x, FY - .1, FZ); scene.add(tb);
  }
  for (const dz of [-.6, .6]) { const r = mesh(new THREE.CylinderGeometry(.07, .07, 4.6, 10).rotateZ(Math.PI / 2), MM.beam); r.position.set(FX, FY + .04, FZ + dz); scene.add(r); }
  const SW = 96, SH = 26, sp = new PX(SW, SH), se = new PX(SW, SH), SILK = ramp(['#b8aa90', '#d6caae', '#ece2c8', '#fbf4e0']), GOLDR = ramp(['#7a5212', '#b88424', '#e8bc48', '#fff0a0'], .3), RED = ramp(['#5a0e14', '#8a1c22', '#b4302c']);
  sp.fill((x, y) => {
    let v = .5 + (h2(x, y, 3) - .5) * .25 + ((x + y) % 2 ? .05 : 0);
    // design: a vine scroll along the band with leaves, and a red medallion
    const vy = 13 + Math.sin(x * .2) * 6, onVine = Math.abs(y - vy) < 1.1 && x > 6 && x < 82;
    const leaf = x > 6 && x < 82 && x % 12 < 4 && Math.abs(y - vy + (x % 24 < 12 ? 3 : -3)) < 1.6;
    const md = Math.hypot(x - 48, y - 13), med = md < 6.5, ring = md >= 6.5 && md < 8;
    const done = x < 70;   // the gold is only worked as far as here
    if ((onVine || leaf || ring) && done) { const c = GOLDR(.55 + (h2(x, y, 9) - .5) * .5 + (y % 2 ? .1 : 0), x, y); se.set(x, y, c.map(q => q * .35 | 0)); return c; }
    if ((onVine || leaf || ring) && !done) return SILK(.2, x, y);   // drawn lines not yet stitched
    if (med && done) return RED(.45 + (h2(x >> 1, y >> 1, 4) - .5) * .5, x, y);
    return SILK(v, x, y);
  });
  const silkM = new THREE.MeshStandardMaterial({ map: texOf(sp.done()), emissiveMap: texOf(se.done()), emissive: '#ffffff', emissiveIntensity: .7, roughness: .85, metalness: 0, side: THREE.DoubleSide });
  const silk = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 1.14), silkM); silk.rotation.x = -Math.PI / 2; silk.position.set(FX, FY + .07, FZ); silk.receiveShadow = true; scene.add(silk);
  // stools behind the frame
  const stools = [[FX - 1.0, FZ - 1.05], [FX + 1.2, FZ - 1.05]].map(([x, z]) => { const s = box(.5, .36, .4, MM.plank); s.position.set(x, 0, z); scene.add(s); return s; });

  // —— Shelves of thread, a hanging finished piece, the table + candle, chest, winder ——
  for (const y of [1.5, 2.3]) { const s = box(3.4, .08, .4, MM.plank); s.position.set(3.4, y, -3.3); scene.add(s); }
  const SPC = ['#e8bc48', '#c8a040', '#8a1c22', '#2a4a8a', '#2e6a3a', '#ece2c8', '#6a2a6a', '#d8d0c0'];
  for (let i = 0; i < 18; i++) { const y = i < 9 ? 1.54 : 2.34, x = 1.9 + (i % 9) * .36; const c = new THREE.Mesh(new THREE.CylinderGeometry(.09, .09, .22, 8), new THREE.MeshStandardMaterial({ color: SPC[(i * 5) % SPC.length], roughness: .5, metalness: (i * 5) % SPC.length < 2 ? .5 : 0 })); c.position.set(x, y + .11, -3.25); c.castShadow = true; scene.add(c); }
  {
    const P = new PX(30, 40), E = new PX(30, 40), R = ramp(['#3a0a10', '#5e1418', '#8a1e22', '#a83030']), G = ramp(['#8a5c14', '#c8942c', '#f0c850', '#fff0a0'], .3);
    P.fill((x, y) => { const cx = x - 15, cy = y - 18, fig = (Math.abs(cx) < 3 && y > 12 && y < 32) || Math.hypot(cx, y - 9) < 3.4 || (Math.abs(cx) < 8 && Math.abs(y - 17) < 1.2), halo = Math.abs(Math.hypot(cx, y - 9) - 5) < .8, bord = x < 2 || x > 27 || y > 37; if (fig || halo || bord) { const c = G(.5 + (h2(x, y, 2) - .5) * .5, x, y); E.set(x, y, c.map(q => q * .3 | 0)); return c; } return R(.5 + (h2(x >> 1, y >> 1, 3) - .5) * .4, x, y); });
    const m = new THREE.MeshStandardMaterial({ map: texOf(P.done()), emissiveMap: texOf(E.done()), emissive: '#ffffff', roughness: .6, metalness: .15 });
    const hang = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.47), m); hang.position.set(.4, 2.45, -3.48); hang.castShadow = true; scene.add(hang);
    const rod = box(1.4, .06, .06, MM.beam); rod.position.set(.4, 3.2, -3.45); scene.add(rod);
  }
  const tableTop = box(1.8, .08, .9, MM.plank); tableTop.position.set(3.7, .82, -.7); scene.add(tableTop);
  for (const [dx, dz] of [[-.8, -.38], [.8, -.38], [-.8, .38], [.8, .38]]) { const l = box(.08, .82, .08, MM.beam); l.position.set(3.7 + dx, 0, -.7 + dz); scene.add(l); }
  const holder = new THREE.Mesh(new THREE.CylinderGeometry(.11, .14, .05, 10), new THREE.MeshStandardMaterial({ color: '#4a4440', metalness: .5, roughness: .5 })); holder.position.set(3.3, .885, -.7); scene.add(holder);
  const candle = new THREE.Mesh(new THREE.CylinderGeometry(.035, .04, .3, 8), new THREE.MeshStandardMaterial({ color: '#e8dcc0', roughness: .7 })); candle.position.set(3.3, 1.06, -.7); candle.castShadow = true; scene.add(candle);
  const flame = fire(.16, { seed: 2, i: 3.5 }); flame.position.set(3.3, 1.2, -.7); scene.add(flame);
  const candleL = new THREE.PointLight('#ffa050', 0, 7, 2); candleL.position.set(3.3, 1.35, -.6); scene.add(candleL);
  const candleG = glow('#ffb060', 1.1, 1); candleG.position.set(3.3, 1.28, -.6); scene.add(candleG);
  const smoke = particles(30, (i, t, o) => { const k = clamp((t - T.snuff) / .3) * (1 - clamp((t - T.snuff - 4.5) / 1.5)), ph = (t * .5 + h2(i, 5)) % 1; o.x = 3.3 + Math.sin(ph * 6 + i) * .06 * ph * 3; o.y = 1.22 + ph * 1.4; o.z = -.7; o.a = k * (1 - ph) * .7; o.s = .15 + ph * .5; o.r = o.g = o.b = .7; }, { soft: 1, blend: THREE.NormalBlending });
  scene.add(smoke);
  const basket = barrel(.2, .25); basket.position.set(4.2, .86, -.6); scene.add(basket);
  const chest = crate(.8); chest.scale.set(1.5, .8, .9); chest.position.set(6.0, 0, -2.9); scene.add(chest);
  // thread winder on a stool
  const wst = box(.4, .5, .4, MM.plank); wst.position.set(1.4, 0, .1); scene.add(wst);
  const wheel = new THREE.Mesh(new THREE.TorusGeometry(.26, .03, 6, 16), new THREE.MeshStandardMaterial({ color: '#5a3a22', roughness: .8 })); wheel.position.set(1.4, .82, .1); wheel.castShadow = true; scene.add(wheel);
  const spokes = new THREE.Mesh(new THREE.BoxGeometry(.5, .03, .03), wheel.material); wheel.add(spokes); const sp2 = spokes.clone(); sp2.rotation.z = Math.PI / 2; wheel.add(sp2);

  // dust in the window light
  const RR = mulberry(4), motes = [...Array(160)].map(() => [RR(), RR(), RR(), RR()]);
  let moteK = 1;
  const dust = particles(motes.length, (i, t, o) => { const m = motes[i], u = (m[0] + t * .01 * (m[3] + .3)) % 1; o.x = lerp(WX, -1.4, u) + Math.sin(t * .3 + i) * .3; o.y = lerp(WY, .7, u) + (m[1] - .5) * 1.2; o.z = lerp(-3.3, -.4, u) + (m[2] - .5) * 1.4; o.a = moteK * .55 * Math.sin(Math.PI * u); o.s = .02 + m[3] * .03; o.r = 1; o.g = .95; o.b = .85; });
  scene.add(dust);
  // gold glint on the needle
  const glint = glow('#fff0b0', .5, 1.6); scene.add(glint);

  // —— People ——
  const you = makePerson('you'), master = makePerson('master'), father = makePerson('father'), j1 = makePerson('jure'), j2 = makePerson('jure2');
  const wit = ['m1', 'm3', 'm2'].map(p => makePerson(p));
  [you, master, father, j1, j2, ...wit].forEach(p => scene.add(p.root));
  const fill = new THREE.PointLight('#ffd8b0', 1.4, 7, 2); scene.add(fill);
  const faceL = new THREE.PointLight('#ffcf9a', 2.2, 4, 2); faceL.position.set(FX - 1.0, 1.9, FZ + .2); scene.add(faceL);
  const SEAT_M = V3(FX - 1.0, .36, FZ - 1.05), SEAT_Y = V3(FX + 1.2, .36, FZ - 1.05);
  const walk = (t, k = 9) => ['w0', 'w1', 'w2', 'w3'][Math.floor(t * k) % 4];
  const hwalk = (t, k = 9) => ['hw0', 'hw1', 'hw2', 'hw3'][Math.floor(t * k) % 4];
  const idle = (t, s = 0) => Math.floor(t * 8 + s * 7) % 29 === 0 ? 'blink' : (Math.floor(t * 1.2 + s) % 2 ? 'idle1' : 'idle0');
  const sew = (t, s = 0) => Math.floor(t * 8 + s) % 37 === 0 ? 'sewB' : (Math.floor(t * 2.4 + s) % 2 ? 'sew1' : 'sew0');

  const cams = {
    open: { p: track([[0, [-1.0, 3.6, 8.2]], [5.9, [-1.5, 2.9, 6.4]]]), l: track([[0, [-2.0, 1.2, -1.6]], [5.9, [-2.1, 1.0, -1.6]]]), fov: 40, aper: 200 },
    silk: { p: track([[5.9, [-.9, 2.7, 1.4]], [10, [-1.1, 2.4, .9]]]), l: track([[5.9, [-1.3, .8, -1.3]], [10, [-1.3, .8, -1.4]]]), fov: 40, aper: 260 },
    table: { p: track([[10, [2.9, 1.9, 3.3]], [14.3, [2.95, 1.7, 2.7]]]), l: track([[10, [3.0, .95, -.4]], [14.3, [3.05, .95, -.4]]]), fov: 40, aper: 220 },
    master: { p: track([[14.3, [-2.5, 1.55, .9]], [18.3, [-2.7, 1.5, .4]]]), l: track([[14.3, [-3.2, 1.0, -2.0]], [18.3, [-3.3, 1.05, -2.0]]]), fov: 40, aper: 200 },
    statute: { p: track([[18.3, [-3.0, 2.0, 3.0]], [24.4, [-3.3, 2.3, 2.0]]]), l: track([[18.3, [-3.2, 2.0, -3.4]], [24.4, [-3.4, 2.3, -3.6]]]), fov: 40, aper: 200 },
    reason: { p: track([[24.4, [3.3, 1.7, 3.2]], [30, [3.2, 1.6, 2.8]], [36.1, [3.1, 1.5, 2.4]]]), l: track([[24.4, [3.05, .95, -.4]], [36.1, [3.1, 1.0, -.5]]]), fov: 40, aper: 220 },
    down: { p: track([[36.1, [-1.3, 2.3, 3.6]], [45, [-1.6, 2.6, 4.8]]]), l: track([[36.1, [-1.8, .9, -1.6]], [45, [-1.9, .9, -1.6]]]), fov: 40, aper: 220 },
    years: { p: track([[45, [-1.2, 2.5, 4.4]], [47.9, [-1.3, 2.4, 4.0]]]), l: track([[45, [-1.7, 1.0, -1.6]], [47.9, [-1.7, 1.0, -1.7]]]), fov: 40, aper: 220 },
    end: { p: track([[47.9, [-1.5, 2.3, 4.0]], [52, [-1.3, 3.4, 6.6]], [57, [-1.0, 5.4, 10.8]]]), l: track([[47.9, [-1.8, .9, -1.6]], [57, [-1.5, .9, -1.2]]]), fov: 40, aper: 220 },
  };
  const tmp = V3(0, 0, 0);

  function update(t, shot, cam, post, renderer) {
    const id = shot.id, C = cams[id] || cams.end, p = C.p(t), l = C.l(t);
    cam.position.set(...p); cam.fov = C.fov; cam.up.set(0, 1, 0); cam.updateProjectionMatrix(); cam.lookAt(...l);

    // —— light mood ——
    let M;
    if (id === 'open') M = mixMood(MOOD.day, MOOD.dusk, ss(seg(t, 0, 6)) * .85);
    else if (id === 'statute') M = mixMood(MOOD.dusk, MOOD.night, ss(seg(t, 19, 24)));
    else if (id === 'reason') M = mixMood(MOOD.night, MOOD.night, 0);
    else if (id === 'down') M = mixMood(MOOD.dusk, MOOD.night, ss(seg(t, 36.6, 44)) * .8);
    else if (id === 'years') { const k = .5 + .5 * Math.cos((t - T.grow0) / (T.grow1 - T.grow0) * 7 * Math.PI); M = mixMood(MOOD.day, MOOD.winter, k); }
    else if (id === 'end') M = mixMood(MOOD.day, MOOD.dusk, .2 + .8 * ss(seg(t, 48, 54)));
    else M = mixMood(MOOD.day, MOOD.dusk, .85);
    winM.color.copy(M.win).multiplyScalar(M.winI); winG.material.color.copy(M.win).multiplyScalar(.35 * M.winI / 2.4);
    spot.color.copy(M.spot); spot.intensity = M.spotI; hemi.color.copy(M.hs); hemi.groundColor.copy(M.hg); hemi.intensity = M.hI;
    key.intensity = .25 * M.hI; renderer.toneMappingExposure = M.exp;
    const beamK = M.spotI / 20; moteK = beamK;
    beam.material.uniforms.t.value = t; beam2.material.uniforms.t.value = t;
    beam.material.uniforms.col.value.copy(M.spot); beam2.material.uniforms.col.value.copy(M.spot);
    const s1 = beam.userData.aim(V3(WX, WY + .1, -3.4), V3(.25, -.62, .74), cam); beam.material.uniforms.k.value = .26 * s1 * beamK;
    const s2 = beam2.userData.aim(V3(WX - .5, WY - .2, -3.4), V3(.42, -.6, .68), cam); beam2.material.uniforms.k.value = .16 * s2 * beamK;
    dust.userData.update(t); smoke.userData.update(t);
    // candle: lit only in 'reason' (what a candle would do to the work)
    const cOn = id === 'reason' ? ss(seg(t, T.candleLit + .15, T.candleLit + .6)) : 0, fk = flick(t, 4);
    flame.visible = cOn > .01; flame.userData.update(t, cam, cOn); candleL.intensity = 4 * cOn * fk; candleG.material.opacity = .3 * cOn;
    wheel.rotation.z = 0;
    // door swings open for the jurés
    door.rotation.y = 0;

    // —— people: visibility, places, frames ——
    [you, master, father, j1, j2, ...wit].forEach(q => { q.root.visible = false; q.root.scale.setScalar(1); q.shadowBlob.visible = true; });
    const show = (q, x, y, z, f, flip = false, sc = 1) => { q.root.visible = true; q.root.position.set(x, y, z); q.root.scale.setScalar(sc); q.frame(f); q.face(cam, flip); q.shadowBlob.visible = y < .05; };
    const KID = .8;
    let focus = null;
    const sitYou = (f, sc = KID) => show(you, SEAT_Y.x, SEAT_Y.y, SEAT_Y.z, f, true, sc);
    const sitM = f => show(master, SEAT_M.x, SEAT_M.y, SEAT_M.z, f);
    glint.visible = false;
    if (id === 'open') { sitM(sew(t)); sitYou(sew(t, 3)); focus = V3(-1.6, 1.0, -1.6); }
    if (id === 'silk') {
      sitM(sew(t)); sitYou(sew(t, 3)); focus = V3(FX + .6, FY, FZ);
      if (t > T.gold - .8 && t < T.gold + 1.6) { glint.visible = true; glint.position.set(SEAT_Y.x - .35, FY + .22, SEAT_Y.z + .55); glint.material.opacity = Math.sin(Math.PI * seg(t, T.gold - .8, T.gold + 1.6)); }
    }
    if (id === 'table' || id === 'reason') { show(you, 2.75, 0, .2, idle(t, 1), false, KID); focus = V3(3.1, 1.0, -.5); }
    if (id === 'master') { sitM(t < T.cheap - .6 ? sew(t) : (Math.floor(t * 8) % 23 === 0 ? 'sitB' : 'sit0')); focus = SEAT_M.clone().setY(1.1); }
    if (id === 'statute') { sitM(sew(t)); sitYou(sew(t, 3)); focus = V3(WX, WY, -3.5); }
    if (id === 'down') { const dn = t > T.needleDown; sitM(t < T.needleDown + .5 ? sew(t) : 'sit0'); sitYou(dn ? (Math.floor(t * 8) % 31 === 0 ? 'sitB' : 'sit0') : sew(t, 3)); focus = SEAT_Y.clone().setY(1.0); }
    if (id === 'years') { sitM(sew(t)); sitYou(sew(t, 3), lerp(KID, 1.0, ss(seg(t, T.grow0, T.grow1)))); focus = V3(FX + .2, 1.0, FZ - 1.0); }
    if (id === 'end') { sitM('sit0'); sitYou(Math.floor(t * 8) % 31 === 0 ? 'sitB' : 'sit0', 1.0); focus = V3(FX, .9, FZ - .8); }
    // front fill so billboards read
    fill.position.set(cam.position.x * .3 + l[0] * .7, 1.9, l[2] + 2.6); fill.intensity = id === 'reason' ? .5 : 1.3; faceL.intensity = id === 'reason' ? .3 : 2.2 * (M.spotI / 20 * .6 + .4);

    const fp = focus || V3(...l);
    post.dof.focus = cam.position.distanceTo(fp); post.dof.aper = C.aper; post.dof.maxCoc = 20;
    post.tiltBand = null; post.tiltTarget = fp;
  }
  return { scene, update };
}
