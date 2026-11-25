// No Candles — Ordinary Lives Short (2.5D pixel diorama, 9:16)
import * as THREE from 'three';
import { makePost } from './post_ts.js';
import { DUR, shotAt } from './story.js';
import { buildShop } from './shop.js';
import { drawOverlay, overlayReady } from './ui.js';

const W = 1080, H = 1920, Q = new URLSearchParams(location.search);
const SS = +(Q.get('ss') ?? 1.5);
const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(W, H);
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.2;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.getElementById('stage').appendChild(renderer.domElement);
const camera = new THREE.PerspectiveCamera(40, W / H, .3, 2000);
const sets = { shop: buildShop() };
const post = makePost(renderer, sets.shop.scene, camera, W, H, { ssaa: SS });
const V = post.vig.uniforms;
renderer.domElement.style.width = W + 'px'; renderer.domElement.style.height = H + 'px';
await overlayReady();

const _v = new THREE.Vector3();
window.DUR = DUR;
window.render = t => {
  const shot = shotAt(t), S = sets.shop;
  post.dof.scene = S.scene;
  post.bloom.strength = .5; post.bloom.radius = .7; post.bloom.threshold = .85;
  V.amt.value = .45; V.warm.value = .08; V.contrast.value = .24; V.sat.value = 1.12; V.fade.value = 1;
  S.update(t, shot, camera, post, renderer);
  V.warm.value = .1;
  if (shot.id === 'reason') V.sat.value = .9;
  let c = post.tiltBand;
  if (c == null && post.tiltTarget) { camera.updateMatrixWorld(); _v.copy(post.tiltTarget).project(camera); c = Math.min(.8, Math.max(.2, _v.y * .5 + .5)); }
  post.dof.tiltAmt = Q.has('notilt') ? 0 : 12; post.dof.tiltC = c ?? .5; post.dof.tiltW = .09; post.dof.tiltF = .3; post.dof.maxCoc = Math.max(post.dof.maxCoc, 20);
  if (Q.has('nodof')) { post.dof.maxCoc = 0; post.dof.tiltAmt = 0; }
  post.composer.render();
  if (!Q.has('noui')) drawOverlay(t); else document.getElementById('ov')?.getContext?.('2d')?.clearRect(0,0,1080,1920);
};
window.READY = true;
