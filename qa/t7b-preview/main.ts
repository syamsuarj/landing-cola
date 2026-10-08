// Preview dev T7b (bukan produksi): 3 pohon + 2 TBS terpanen. Build: esbuild → out.js, buka index.html?view=wide|tree|ffb&q=high|low
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { createPalmKit } from '../../src/scripts/hero3d/palm';

const params = new URLSearchParams(location.search);
const view = params.get('view') ?? 'wide';
const quality = (params.get('q') ?? 'high') as 'high' | 'low';
const W = 1200, H = 800;
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setSize(W, H);
renderer.setPixelRatio(1);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0e130c);
const pm = new THREE.PMREMGenerator(renderer);
scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.35;
scene.add(new THREE.HemisphereLight(0xcfe0a8, 0x2a1f12, 0.9));
const sun = new THREE.DirectionalLight(0xffd9a0, 2.6);
sun.position.set(2, 3, 1.5);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
sun.shadow.camera.left = sun.shadow.camera.bottom = -2;
sun.shadow.camera.right = sun.shadow.camera.top = 2;
scene.add(sun);
const rim = new THREE.DirectionalLight(0xe8b84a, 1.2);
rim.position.set(-2, 1.5, -2);
scene.add(rim);

const ground = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 1.8, 0.1, 48), new THREE.MeshStandardMaterial({ color: 0x4a3a22, roughness: 1 }));
ground.position.y = -0.05;
ground.receiveShadow = true;
scene.add(ground);

const kit = createPalmKit({ quality });
const t0 = performance.now();
const trees = [1, 2, 3].map((s, i) => {
  const t = kit.tree(s);
  t.position.set((i - 1) * 0.9, 0, (i % 2) * 0.35 - 0.1);
  t.traverse((o) => { if ((o as THREE.Mesh).isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  scene.add(t);
  return t;
});
const ffbs = [5, 6].map((s, i) => {
  const f = kit.ffb(s);
  f.position.set(-0.25 + i * 0.25, 0, 0.55 + i * 0.06);
  f.traverse((o) => { if ((o as THREE.Mesh).isMesh) o.castShadow = true; });
  scene.add(f);
  return f;
});
const buildMs = performance.now() - t0;

const cam = new THREE.PerspectiveCamera(35, W / H, 0.01, 50);
if (view === 'tree') { cam.position.set(0.15, 0.75, 1.25); cam.lookAt(0, 0.5, 0); }
else if (view === 'ffb') { cam.position.set(-0.1, 0.32, 1.05); cam.lookAt(-0.12, 0.05, 0.58); cam.fov = 25; cam.updateProjectionMatrix(); }
else if (view === 'trunk') { cam.position.set(0.05, 0.45, 0.75); cam.lookAt(0, 0.42, 0); }
else { cam.position.set(0.4, 1.35, 3.3); cam.lookAt(0, 0.45, 0); }

kit.update(Number(params.get('t') ?? 1.3), Number(params.get('wind') ?? 1));
renderer.render(scene, cam);
const stats: Record<string, unknown> = { buildMs: Math.round(buildMs), calls: renderer.info.render.calls, triangles: renderer.info.render.triangles, quality };
stats.trees = trees.map((t) => {
  let verts = 0, calls = 0; const parts: Record<string, number> = {};
  t.traverse((o) => { const m = o as THREE.Mesh; if (m.isMesh) { calls++; const n = m.geometry.getAttribute('position').count; verts += n; parts[m.name] = n; } });
  const box = new THREE.Box3().setFromObject(t);
  return { ...t.userData, calls, verts, parts, bboxH: +box.max.y.toFixed(3) };
});
stats.ffb = ffbs.map((f) => { const b = new THREE.Box3().setFromObject(f); const s = b.getSize(new THREE.Vector3()); return { verts: (f.children[0] as THREE.Mesh).geometry.getAttribute('position').count, size: s.toArray().map((v) => +v.toFixed(3)) }; });
stats.geometries = renderer.info.memory.geometries;
(window as any).__stats = stats;
(window as any).__dispose = () => { kit.dispose(); return renderer.info.memory.geometries; };
document.title = 'ready';
