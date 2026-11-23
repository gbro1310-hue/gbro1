// Set B: inside the bathhouse, cut away (no front wall, no ceiling). Left: the steam room (benches, furnace behind a grate).
// Right, behind a low partition: wooden tubs, morning light through a high window.
import * as THREE from 'three';
import { PX, ramp, hex, h2, fbm, texOf, woodPlanks, plaster, rock, glow, mulberry } from './px.js';
import { mats, mat, mesh, box, barrel, fire } from './kit.js';
import { particles, beamCard, flick } from './fx.js';
import { makePerson } from './chars.js';
import { T } from './story.js';
import { clamp, seg, ss, eio, lerp, track } from '/core/lib.js';

export function buildBath() {
  const scene = new THREE.Scene(), MM = mats();
  scene.background = new THREE.Color('#07060a');
  scene.fog = new THREE.FogExp2('#2a2026', .02);
  const hemi = new THREE.HemisphereLight('#c8b8a8', '#2a1a14', .9); scene.add(hemi);
  const day = new THREE.DirectionalLight('#ffe8c8', 1.5); day.position.set(9, 12, -10); day.target.position.set(3, 0, 0); day.castShadow = true; day.shadow.mapSize.set(2048, 2048);
  Object.assign(day.shadow.camera, { left: -12, right: 12, top: 12, bottom: -12, near: 1, far: 40 }); day.shadow.bias = -.0006; scene.add(day, day.target);

  // —— Room shell ——
  const floorM = mat(woodPlanks(96, 96, { pw: 6, len: 48, seed: 12, cols: ['#20140e', '#3a2516', '#56371f', '#704a2a', '#8a5e36'] }));
  const wallM = mat(plaster(96, 96, { seed: 21, wall: ['#5e5246', '#7a6c5c', '#968670', '#ad9c84'], beams: [{ t: 'h', y: 0 }, { t: 'v', x: 0 }, { t: 'v', x: 48 }] }));
  const stoneM = mat(rock(96, 96, { seed: 4, cols: ['#1a1716', '#2c2724', '#3e3833', '#544b44', '#6a6058'] }));
  scene.add(mesh(new THREE.BoxGeometry(16, .3, 8).translate(0, -.15, 0), floorM));
  scene.add(mesh(new THREE.BoxGeometry(16, 4.4, .4).translate(0, 2.2, -3.7), wallM));          // back wall
  scene.add(mesh(new THREE.BoxGeometry(.4, 4.4, 8).translate(-7.8, 2.2, 0), wallM));           // left wall
  scene.add(mesh(new THREE.BoxGeometry(.4, 4.4, 8).translate(7.8, 2.2, 0), wallM));            // right wall
  scene.add(mesh(new THREE.BoxGeometry(.25, 1.3, 6.6).translate(.6, .65, -.3), MM.plankDark));  // low partition
  // near walls cut low (the cut-away)
  scene.add(mesh(new THREE.BoxGeometry(16, .5, .3).translate(0, .25, 3.85), wallM));
  // beams over the room (overhead, thin — the roof is lifted away)
  for (const x of [-5, -1.5, 2.5, 5.8]) { const b = box(.25, .25, 8, MM.beam); b.position.set(x, 4.3, 0); scene.add(b); }

  // —— Steam room: two tiers of benches along the back wall ——
  const bench1 = box(7, .48, .7, MM.plank); bench1.position.set(-3.6, 0, -2.75); scene.add(bench1);
  const bench2 = box(7, .9, .55, MM.plank); bench2.position.set(-3.6, 0, -3.25); scene.add(bench2);
  const benchL = box(.7, .48, 4.6, MM.plank); benchL.position.set(-7.1, 0, -.6); scene.add(benchL);
  // the furnace: a stone mass in the back-left corner with an iron grate; the fire burns behind it (stoked from outside)
  const furn = mesh(new THREE.BoxGeometry(1.9, 2.2, 1.2).translate(0, 1.1, 0), stoneM); furn.position.set(-6.3, 0, -3.0); scene.add(furn);
  const gP = new PX(20, 14), gE = new PX(20, 14), GR = ramp(['#7a1a08', '#d8501a', '#ff9a2a', '#ffd870'], .3);
  gP.fill((x, y) => { const bar = x % 4 === 0 || y === 0 || y === 13; if (bar) return hex('#141214'); const v = .45 + fbm(x * .3, y * .3, 5) * .6 - y / 28; const c = GR(v, x, y); gE.set(x, y, c); return c; });
  const grateM = new THREE.MeshStandardMaterial({ map: texOf(gP.done()), emissiveMap: texOf(gE.done()), emissive: '#ffffff', emissiveIntensity: 2.4 });
  const grate = new THREE.Mesh(new THREE.PlaneGeometry(1.1, .8), grateM); grate.position.set(-6.3, .75, -2.38); scene.add(grate);
  const ff = fire(.7, { seed: 3, i: 3 }); ff.position.set(-6.3, .38, -2.42); scene.add(ff);
  const furnL = new THREE.PointLight('#ff7a2a', 20, 11, 1.8); furnL.position.set(-6.1, 1.0, -1.7); furnL.castShadow = true; furnL.shadow.mapSize.set(1024, 1024); furnL.shadow.bias = -.004; scene.add(furnL);
  const furnG = glow('#ff8a3a', 2.6, 1.2); furnG.position.set(-6.3, .8, -2.2); scene.add(furnG);
  // heated stones on top + water bucket and ladle
  for (let i = 0; i < 7; i++) { const s = new THREE.Mesh(new THREE.DodecahedronGeometry(.17 + h2(i, 1) * .08, 0), new THREE.MeshStandardMaterial({ color: '#4a4440', roughness: .9, emissive: '#ff5a1a', emissiveIntensity: .25 })); s.position.set(-6.3 + (h2(i, 2) - .5) * 1.2, 2.3, -3.0 + (h2(i, 3) - .5) * .7); s.castShadow = true; scene.add(s); }
  const bucket = barrel(.25, .45); bucket.position.set(-5.0, 0, -2.1); scene.add(bucket);

  // —— Tub room ——
  const tubM = mat(woodPlanks(96, 96, { pw: 96, len: 6, seed: 5, nails: false, cols: ['#2a180e', '#4a2c18', '#6a4024', '#875632'] }));
  const waterM = new THREE.MeshStandardMaterial({ color: '#7aa6b8', roughness: .2, metalness: 0, emissive: '#3a5a66', emissiveIntensity: .4 });
  const tubs = [[2.2, -1.9], [4.4, -2.1], [6.4, -1.4]].map(([x, z]) => {
    const g = new THREE.Group();
    const wall = mesh(new THREE.CylinderGeometry(.82, .74, .85, 18, 1, true).translate(0, .425, 0), tubM); wall.material.side = THREE.DoubleSide; g.add(wall);
    for (const y of [.15, .7]) { const hoop = new THREE.Mesh(new THREE.TorusGeometry(.8, .025, 4, 24), new THREE.MeshStandardMaterial({ color: '#2a2a30', metalness: .4, roughness: .6 })); hoop.rotation.x = Math.PI / 2; hoop.position.y = y; g.add(hoop); }
    const water = new THREE.Mesh(new THREE.CircleGeometry(.78, 24), waterM); water.rotation.x = -Math.PI / 2; water.position.y = .66; g.add(water);
    const linen = new THREE.Mesh(new THREE.CylinderGeometry(.83, .83, .1, 18, 1, true), new THREE.MeshStandardMaterial({ color: '#d8d2c2', side: THREE.DoubleSide })); linen.position.y = .82; g.add(linen);
    g.position.set(x, 0, z); scene.add(g); return g;
  });
  const win = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.0), new THREE.MeshBasicMaterial({ color: new THREE.Color('#fff2d8').multiplyScalar(2.2) })); win.position.set(4.6, 3.3, -3.48); scene.add(win);
  const winG = glow('#fff0d0', 2.4, .8); winG.position.set(4.6, 3.3, -3.3); scene.add(winG);
  const beam = beamCard(6.5, 1.1, 2.6, '#fff0d0', { k: .32, fall: 1.0 }); scene.add(beam);
  const beam2 = beamCard(5.5, .8, 2.0, '#fff0d0', { k: .2, fall: 1.0 }); scene.add(beam2);
  const pegs = box(3, .12, .12, MM.beam); pegs.position.set(-3.6, 2.4, -3.45); scene.add(pegs);
  // linen hanging on the pegs
  for (let i = 0; i < 4; i++) { const c = new THREE.Mesh(new THREE.PlaneGeometry(.45, .8), new THREE.MeshStandardMaterial({ color: i === 2 ? '#3a7a44' : '#cfc8b8', side: THREE.DoubleSide })); c.position.set(-4.7 + i * .75, 2.05, -3.43); c.castShadow = true; scene.add(c); }

  // —— Steam: soft white puffs drifting up and sideways across both rooms ("air you can see") ——
  const RR = mulberry(5), puffs = [...Array(240)].map(() => [RR() * 14 - 7, RR(), RR() * 6 - 3.4, RR() * 10, .6 + RR() * .8]);
  const steam = particles(puffs.length, (i, t, o) => {
    const p = puffs[i], ph = (t * .07 * p[4] + p[1]) % 1, left = p[0] < .6;
    o.x = p[0] + Math.sin(t * .2 + p[3]) * .7 + ph * .8; o.y = .3 + ph * 4.2; o.z = p[2] + Math.cos(t * .15 + p[3]) * .4;
    o.a = Math.sin(Math.PI * ph) * (left ? .13 : .07) * steamK; o.s = 5 + ph * 9; o.r = 1; o.g = .97; o.b = .93;
  }, { soft: 1, blend: THREE.NormalBlending });
  let steamK = 1; scene.add(steam);
  // smoke wisps lifting off you (a week of smoke)
  const wisps = particles(46, (i, t, o) => {
    const k = clamp((t - T.smoke) / 2.6), ph = (t * .45 + h2(i, 4)) % 1;
    o.x = YOU.x + (h2(i, 1) - .5) * .5 + Math.sin(t * 2 + i) * .08 * ph; o.y = .9 + h2(i, 2) * .7 + ph * 1.6; o.z = YOU.z + .2 + (h2(i, 3) - .5) * .2;
    o.a = k * (1 - ph) * .85 * (1 - ss(seg(t, 49.6, 50.3))); o.s = .6 + ph * 1.6; o.r = .62; o.g = .58; o.b = .56;
  }, { soft: 1, blend: THREE.NormalBlending });
  scene.add(wisps);

  // —— People: market neighbours on the benches, two in tubs, and you ——
  const YOU = new THREE.Vector3(-2.3, .02, -2.55);
  const you = makePerson('you'), b1 = makePerson('m1'), b2 = makePerson('m2'), b3 = makePerson('m3'), t1 = makePerson('m1'), t2 = makePerson('m2');
  const seated = [[b1, -4.4, -2.55], [b2, -3.35, -2.6], [b3, -1.2, -2.5], [t1, 2.2, -1.9], [t2, 6.4, -1.4]];
  scene.add(you.root, ...seated.map(s => s[0].root));
  seated.forEach(([c, x, z], i) => { c.root.position.set(x, i >= 3 ? -.1 : .02, z); c.shadowBlob.visible = false; });
  you.shadowBlob.visible = false;
  const fill = new THREE.PointLight('#ffd8b0', 1.4, 7, 2); scene.add(fill);

  const cams = {
    price: { p: track([[28.4, [-4.6, 5.0, 7.6]], [31.0, [-3.6, 4.8, 7.4]], [34.9, [2.2, 5.0, 7.6]], [37.2, [3.4, 5.2, 8.0]]]), l: track([[28.4, [-4.4, 1.2, -2.4]], [31.0, [-4.0, 1.1, -2.4]], [34.9, [3.0, .9, -1.8]], [37.2, [3.6, .9, -1.8]]]), fov: 34, aper: 260 },
    steam: { p: track([[42.6, [-2.2, 5.6, 8.4]], [46.0, [-2.3, 3.6, 5.8]], [50.3, [-2.4, 2.5, 4.4]]]), l: track([[42.6, [-2.6, 1.0, -2.4]], [50.3, [-2.35, 1.05, -2.55]]]), fov: 32, aper: 200 },
  };

  function update(t, shot, cam, post, renderer) {
    const C = cams[shot.id] || cams.steam; const p = C.p(t), l = C.l(t);
    cam.position.set(...p); cam.fov = C.fov; cam.up.set(0, 1, 0); cam.updateProjectionMatrix(); cam.lookAt(...l);
    renderer.toneMappingExposure = 1.2;
    const fk = flick(t, 2); furnL.intensity = 20 * fk; furnG.material.opacity = .85 * fk; grateM.emissiveIntensity = 2.4 * fk; ff.userData.update(t, cam);
    beam.material.uniforms.t.value = t; beam2.material.uniforms.t.value = t;
    const s1 = beam.userData.aim(new THREE.Vector3(4.6, 3.3, -3.4), new THREE.Vector3(-.35, -.75, .55), cam); beam.material.uniforms.k.value = .3 * s1;
    const s2 = beam2.userData.aim(new THREE.Vector3(4.2, 3.1, -3.4), new THREE.Vector3(-.15, -.8, .6), cam); beam2.material.uniforms.k.value = .2 * s2;
    steamK = 1; steam.userData.update(t); wisps.userData.update(t);
    // people
    const b = Math.floor(t * 1.1);
    you.root.visible = shot.id === 'steam';
    you.root.position.copy(YOU); you.frame(Math.floor(t * 8) % 31 === 0 ? 'bareO' : (b % 2 ? 'bare1' : 'bare0')); you.face(cam, false);
    seated.forEach(([c], i) => { c.frame((b + i) % 2 ? 'bare1' : 'bare0'); c.face(cam, i === 1 || i === 4); });
    fill.position.set(cam.position.x * .3 + l[0] * .7, 1.8, l[2] + 2.4);
    const focusP = shot.id === 'steam' ? YOU.clone().setY(1.0) : new THREE.Vector3(...l);
    post.dof.focus = cam.position.distanceTo(focusP); post.dof.aper = C.aper; post.dof.maxCoc = 20;
    post.tiltBand = null; post.tiltTarget = focusP;
  }
  return { scene, update };
}
