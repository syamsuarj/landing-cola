import {
  ACESFilmicToneMapping, AdditiveBlending, AmbientLight, BufferAttribute, BufferGeometry, CanvasTexture, CatmullRomCurve3,
  Color, CylinderGeometry, DirectionalLight, DoubleSide, Group, LatheGeometry, Material, MathUtils, Mesh, MeshPhysicalMaterial,
  MeshStandardMaterial, PerspectiveCamera, PMREMGenerator, PointLight, Points, PointsMaterial, Scene, TubeGeometry, Vector2,
  Vector3, WebGLRenderer,
} from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

type Disposable = { dispose(): void };

/** Profil siluet botol berlekuk (radius, y) — dibuat sendiri, bukan model resmi. */
const PROFILE: [number, number][] = [
  [0, -1.6], [0.5, -1.6], [0.6, -1.57], [0.66, -1.48], [0.7, -1.3], [0.72, -1.05], [0.7, -0.75], [0.64, -0.45],
  [0.56, -0.2], [0.52, 0.0], [0.53, 0.2], [0.58, 0.45], [0.64, 0.75], [0.66, 1.0], [0.62, 1.25], [0.5, 1.55],
  [0.36, 1.85], [0.27, 2.1], [0.24, 2.3], [0.27, 2.36], [0.27, 2.42], [0, 2.42],
];

/** Alur vertikal (flute) halus pada bagian bawah & bahu botol. */
function flute(geo: LatheGeometry, amp: number) {
  const p = geo.attributes.position as BufferAttribute;
  const v = new Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const r = Math.hypot(v.x, v.z);
    if (r < 1e-4) continue;
    const zone = MathUtils.smoothstep(v.y, -1.5, -1.25) * (1 - MathUtils.smoothstep(v.y, -0.75, -0.5))
      + MathUtils.smoothstep(v.y, 0.95, 1.15) * (1 - MathUtils.smoothstep(v.y, 1.7, 1.95));
    if (zone <= 0) continue;
    const a = Math.atan2(v.z, v.x);
    const k = 1 + amp * zone * Math.pow(Math.abs(Math.cos(a * 7)), 0.6);
    p.setXYZ(i, v.x * k, v.y, v.z * k);
  }
  geo.computeVertexNormals();
}

function buildBottle(d: Disposable[]) {
  const g = new Group();
  const pts = PROFILE.map(([r, y]) => new Vector2(r, y));

  // Cairan gelap (inti) + cangkang kaca bening
  const liquidGeo = new LatheGeometry(PROFILE.filter(([, y]) => y < 1.95).map(([r, y]) => new Vector2(Math.max(r - 0.03, 0), y)).concat([new Vector2(0, 1.9)]), 96);
  flute(liquidGeo, 0.03);
  const liquidMat = new MeshStandardMaterial({ color: new Color('#1f0604'), roughness: 0.18, metalness: 0.1 });
  g.add(new Mesh(liquidGeo, liquidMat));

  const glassGeo = new LatheGeometry(pts, 96);
  flute(glassGeo, 0.035);
  const glassMat = new MeshPhysicalMaterial({
    color: new Color('#ffffff'), roughness: 0.04, metalness: 0, transparent: true, opacity: 0.14,
    clearcoat: 1, clearcoatRoughness: 0.03, envMapIntensity: 1.6, side: DoubleSide, depthWrite: false,
  });
  const glass = new Mesh(glassGeo, glassMat);
  glass.renderOrder = 2;
  g.add(glass);

  // Pita label merah di pinggang botol
  const labelGeo = new LatheGeometry([new Vector2(0.58, -0.38), new Vector2(0.535, -0.12), new Vector2(0.525, 0.05), new Vector2(0.54, 0.24), new Vector2(0.585, 0.44)], 96);
  const labelMat = new MeshStandardMaterial({ color: '#F40009', roughness: 0.42, metalness: 0.05, side: DoubleSide });
  const label = new Mesh(labelGeo, labelMat);
  label.scale.set(1.025, 1, 1.025);
  g.add(label);

  // Garis gelombang krem (generik) melingkar di label
  const wavePts: Vector3[] = [];
  for (let i = 0; i <= 128; i++) {
    const t = (i / 128) * Math.PI * 2;
    const y = 0.04 + Math.sin(t * 2) * 0.12;
    const r = 0.548 + Math.abs(y) * 0.12;
    wavePts.push(new Vector3(Math.cos(t) * r, y, Math.sin(t) * r));
  }
  const waveGeo = new TubeGeometry(new CatmullRomCurve3(wavePts, true), 256, 0.016, 8, true);
  const waveMat = new MeshStandardMaterial({ color: '#F5EFE6', roughness: 0.5 });
  g.add(new Mesh(waveGeo, waveMat));

  // Tutup logam bergerigi
  const capGeo = new CylinderGeometry(0.29, 0.3, 0.2, 24, 1);
  const capMat = new MeshStandardMaterial({ color: '#c9cdd2', metalness: 0.95, roughness: 0.22 });
  const cap = new Mesh(capGeo, capMat);
  cap.position.y = 2.5;
  g.add(cap);

  d.push(liquidGeo, liquidMat, glassGeo, glassMat, labelGeo, labelMat, waveGeo, waveMat, capGeo, capMat);
  g.position.y = -0.4;
  g.scale.set(0.84, 1, 0.84); // proporsi ramping
  return g;
}

function bubbleTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const x = c.getContext('2d')!;
  const gr = x.createRadialGradient(28, 26, 2, 32, 32, 30);
  gr.addColorStop(0, 'rgba(255,255,255,.95)'); gr.addColorStop(0.35, 'rgba(255,240,235,.35)');
  gr.addColorStop(0.8, 'rgba(255,255,255,.12)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = gr; x.beginPath(); x.arc(32, 32, 30, 0, Math.PI * 2); x.fill();
  return new CanvasTexture(c);
}

/**
 * Inisialisasi scene 3D hero. `state.progress` (0..1) berasal dari ScrollTrigger adegan ter-pin.
 * Pause saat di luar viewport/tab tersembunyi, DPR maks 2, dispose saat pagehide.
 */
export function initHero3D(container: HTMLElement, state: { progress: number } = { progress: 0 }): boolean {
  let renderer: WebGLRenderer;
  try {
    renderer = new WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch { return false; }

  const d: Disposable[] = [];
  // Kualitas adaptif: bila interval frame lambat (GPU lemah / renderer software), turunkan DPR lalu batasi FPS.
  const stats = { frames: 0, avgMs: 0, dpr: Math.min(window.devicePixelRatio || 1, 2), throttled: false };
  (window as unknown as { __hero3d?: typeof stats }).__hero3d = stats;
  const scene = new Scene();
  const camera = new PerspectiveCamera(30, 1, 0.1, 60);
  camera.position.set(0, 0.25, 10.2);

  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  container.appendChild(renderer.domElement);

  // Lingkungan pantulan (prosedural, tanpa file HDR)
  const pmrem = new PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const envRT = pmrem.fromScene(room, 0.04);
  scene.environment = envRT.texture;
  scene.environmentIntensity = 0.55;
  d.push(envRT, pmrem);
  room.traverse((o) => { const m = o as Mesh; m.geometry?.dispose(); (m.material as Material | undefined)?.dispose?.(); });

  scene.add(new AmbientLight(0xffffff, 0.15));
  const key = new DirectionalLight(0xfff4ec, 2.2); key.position.set(3, 5, 6); scene.add(key);
  const rimRed = new PointLight(0xf40009, 70, 18); rimRed.position.set(-3.2, 1.5, -2.5); scene.add(rimRed);
  const rimRed2 = new PointLight(0xff2a1a, 45, 16); rimRed2.position.set(3.4, -1.2, -2); scene.add(rimRed2);
  const top = new PointLight(0xffffff, 18, 14); top.position.set(0, 5, 2); scene.add(top);

  const bottle = buildBottle(d);
  const holder = new Group();
  holder.add(bottle);
  scene.add(holder);

  // Gelembung
  const N = 110;
  const pos = new Float32Array(N * 3); const speed = new Float32Array(N); const drift = new Float32Array(N);
  const spawn = (i: number, anywhere: boolean) => {
    pos[i * 3] = (Math.random() - 0.5) * 5;
    pos[i * 3 + 1] = anywhere ? (Math.random() - 0.5) * 7 : -3.6;
    pos[i * 3 + 2] = (Math.random() - 0.5) * 3 - 0.3;
    speed[i] = 0.25 + Math.random() * 0.7; drift[i] = Math.random() * Math.PI * 2;
  };
  for (let i = 0; i < N; i++) spawn(i, true);
  const bGeo = new BufferGeometry(); bGeo.setAttribute('position', new BufferAttribute(pos, 3));
  const tex = bubbleTexture();
  const bMat = new PointsMaterial({ map: tex, size: 0.2, transparent: true, depthWrite: false, blending: AdditiveBlending, opacity: 0.75 });
  scene.add(new Points(bGeo, bMat));
  d.push(bGeo, bMat, tex);

  // Ukuran & pixel ratio (maks 2)
  const resize = () => {
    const w = container.clientWidth || 1, h = container.clientHeight || 1;
    renderer.setPixelRatio(stats.dpr);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // jaga botol utuh terlihat pada wadah sempit
    camera.position.z = w / h < 0.6 ? 10.2 * (0.6 / (w / h)) ** 0.6 : 10.2;
    camera.updateProjectionMatrix();
  };
  const ro = new ResizeObserver(resize); ro.observe(container); resize();

  // Input pointer
  const mouse = { x: 0, y: 0 };
  const onMove = (e: PointerEvent) => {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = (e.clientY / window.innerHeight) * 2 - 1;
  };
  window.addEventListener('pointermove', onMove, { passive: true });

  let raf = 0, last = performance.now(), t = 0, running = false, inView = true;
  let spin = 0, tiltX = 0, tiltY = 0, prog = 0;
  let skip = 0;
  const frame = (now: number) => {
    raf = requestAnimationFrame(frame);
    if (stats.throttled && (skip = (skip + 1) % 4) !== 0) return; // ~15 fps saat throttled
    const rawMs = now - last;
    const dt = Math.min(rawMs / 1000, 0.05); last = now; t += dt;
    prog = MathUtils.lerp(prog, state.progress, 0.1);
    tiltX = MathUtils.lerp(tiltX, mouse.y * 0.18, 0.05);
    tiltY = MathUtils.lerp(tiltY, mouse.x * 0.5, 0.05);
    spin += dt * 0.35;
    bottle.rotation.y = spin + tiltY + prog * Math.PI * 2.5;
    holder.rotation.x = tiltX + Math.sin(prog * Math.PI) * 0.18;
    holder.rotation.z = -0.08 + Math.sin(prog * Math.PI * 2) * 0.1;
    holder.position.y = Math.sin(t * 1.1) * 0.06;
    for (let i = 0; i < N; i++) {
      pos[i * 3 + 1] += speed[i] * dt;
      pos[i * 3] += Math.sin(t * 1.4 + drift[i]) * 0.003;
      if (pos[i * 3 + 1] > 3.6) spawn(i, false);
    }
    bGeo.attributes.position.needsUpdate = true;
    renderer.render(scene, camera);
    const cost = rawMs; // interval antar frame (mencakup kerja GPU frame sebelumnya)
    stats.frames++;
    stats.avgMs = stats.avgMs ? stats.avgMs * 0.9 + cost * 0.1 : cost;
    if (stats.frames > 20 && stats.avgMs > 45) {
      if (stats.dpr > 1) { stats.dpr = 1; renderer.setPixelRatio(1); resize(); stats.avgMs = 0; stats.frames = 0; }
      else if (!stats.throttled) { stats.throttled = true; }
    }
  };
  const start = () => { if (!running && inView && !document.hidden) { running = true; last = performance.now(); stats.frames = 0; stats.avgMs = 0; raf = requestAnimationFrame(frame); } };
  const stop = () => { running = false; cancelAnimationFrame(raf); };

  // Pause saat di luar viewport / tab tersembunyi
  const io = new IntersectionObserver(([en]) => { inView = en.isIntersecting; if (inView) start(); else stop(); }, { threshold: 0.01 });
  io.observe(container);
  const onVis = () => (document.hidden ? stop() : start());
  document.addEventListener('visibilitychange', onVis);

  const dispose = () => {
    stop(); io.disconnect(); ro.disconnect();
    window.removeEventListener('pointermove', onMove);
    document.removeEventListener('visibilitychange', onVis);
    d.forEach((x) => x.dispose());
    renderer.dispose(); renderer.forceContextLoss();
    renderer.domElement.remove();
  };
  window.addEventListener('pagehide', dispose, { once: true });
  renderer.render(scene, camera);
  start();
  return true;
}
