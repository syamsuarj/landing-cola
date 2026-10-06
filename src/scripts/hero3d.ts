import {
  ACESFilmicToneMapping, AdditiveBlending, AmbientLight, BufferAttribute, BufferGeometry, CanvasTexture,
  Color, DirectionalLight, Group, IcosahedronGeometry, LatheGeometry, Material, MathUtils, Mesh, MeshPhysicalMaterial,
  MeshStandardMaterial, PerspectiveCamera, PMREMGenerator, PointLight, Points, PointsMaterial, Scene, Vector2,
  Vector3, WebGLRenderer,
} from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

type Disposable = { dispose(): void };

/**
 * Tetes minyak sawit keemasan + butir buah sawit yang mengorbit — geometri prosedural buatan sendiri
 * (BUKAN logo 3D). Profil tetes: x = sin(t)·sin(t/2)^0.9, y = cos(t) → ujung runcing di atas, dasar bulat.
 */
function dropProfile(scale = 1, inset = 0): Vector2[] {
  const pts: Vector2[] = [];
  const N = 64;
  for (let i = 0; i <= N; i++) {
    const t = (i / N) * Math.PI;
    const r = Math.sin(t) * Math.pow(Math.sin(t / 2), 0.9) * 1.18;
    pts.push(new Vector2(Math.max(r * scale - inset, 0), Math.cos(t) * 1.55 * scale));
  }
  return pts;
}

function buildDrop(d: Disposable[]) {
  const g = new Group();
  // Minyak keemasan pekat & mengilap (opak; kilau dari clearcoat + env map, warna dalam dari sheen/emissive)
  const shellGeo = new LatheGeometry(dropProfile(1), 128);
  const shellMat = new MeshPhysicalMaterial({
    color: new Color('#E39A12'), roughness: 0.14, metalness: 0.35,
    clearcoat: 1, clearcoatRoughness: 0.03, sheen: 0.8, sheenRoughness: 0.4, sheenColor: new Color('#FFD36B'),
    emissive: new Color('#7a3d00'), emissiveIntensity: 0.45, envMapIntensity: 1.2,
    iridescence: 0.25, iridescenceIOR: 1.4,
  });
  g.add(new Mesh(shellGeo, shellMat));
  d.push(shellGeo, shellMat);
  return g;
}

/** Satu butir buah sawit: elipsoid dengan gradasi hitam-ungu (atas) → oranye-merah (bawah) via vertex color. */
function buildFruitGeo() {
  const geo = new IcosahedronGeometry(0.22, 4);
  const p = geo.attributes.position as BufferAttribute;
  const cols = new Float32Array(p.count * 3);
  const dark = new Color('#2a0d0a'), mid = new Color('#b3261e'), light = new Color('#f28a1a');
  const v = new Vector3(); const c = new Color();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    p.setXYZ(i, v.x * 0.85, v.y * 1.18, v.z * 0.85);
    const k = MathUtils.clamp((v.y / 0.22 + 1) / 2, 0, 1); // 0 bawah .. 1 atas
    if (k > 0.5) c.copy(mid).lerp(dark, (k - 0.5) * 2); else c.copy(light).lerp(mid, k * 2);
    cols[i * 3] = c.r; cols[i * 3 + 1] = c.g; cols[i * 3 + 2] = c.b;
  }
  geo.setAttribute('color', new BufferAttribute(cols, 3));
  geo.computeVertexNormals();
  return geo;
}

function sparkTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const x = c.getContext('2d')!;
  const gr = x.createRadialGradient(32, 32, 1, 32, 32, 30);
  gr.addColorStop(0, 'rgba(255,240,190,1)'); gr.addColorStop(0.3, 'rgba(242,194,48,.55)');
  gr.addColorStop(1, 'rgba(242,194,48,0)');
  x.fillStyle = gr; x.beginPath(); x.arc(32, 32, 30, 0, Math.PI * 2); x.fill();
  return new CanvasTexture(c);
}

/**
 * Inisialisasi scene 3D hero. `state.progress` (0..1) berasal dari ScrollTrigger adegan ter-pin.
 * Pause saat di luar viewport/tab tersembunyi, DPR maks 2, kualitas adaptif, dispose saat pagehide.
 */
export function initHero3D(container: HTMLElement, state: { progress: number } = { progress: 0 }): boolean {
  let renderer: WebGLRenderer;
  try {
    renderer = new WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch { return false; }

  const d: Disposable[] = [];
  const stats = { frames: 0, avgMs: 0, dpr: Math.min(window.devicePixelRatio || 1, 2), throttled: false };
  (window as unknown as { __hero3d?: typeof stats }).__hero3d = stats;
  const scene = new Scene();
  const camera = new PerspectiveCamera(30, 1, 0.1, 60);
  camera.position.set(0, 0.1, 10);

  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  container.appendChild(renderer.domElement);

  // Lingkungan pantulan prosedural (tanpa file HDR)
  const pmrem = new PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const envRT = pmrem.fromScene(room, 0.04);
  scene.environment = envRT.texture;
  scene.environmentIntensity = 0.6;
  d.push(envRT, pmrem);
  room.traverse((o) => { const m = o as Mesh; m.geometry?.dispose(); (m.material as Material | undefined)?.dispose?.(); });

  scene.add(new AmbientLight(0xffffff, 0.2));
  const key = new DirectionalLight(0xfff1d6, 2.4); key.position.set(3, 5, 6); scene.add(key);
  const rimGreen = new PointLight(0x5fd38a, 60, 18); rimGreen.position.set(-3.4, 1.6, -2.4); scene.add(rimGreen);
  const rimGold = new PointLight(0xffb02e, 55, 16); rimGold.position.set(3.4, -1.4, -2); scene.add(rimGold);
  const top = new PointLight(0xffffff, 16, 14); top.position.set(0, 5, 2); scene.add(top);

  const holder = new Group();
  const drop = buildDrop(d);
  holder.add(drop);

  // Butir buah sawit yang mengorbit
  const fruitGeo = buildFruitGeo();
  const fruitMat = new MeshStandardMaterial({ vertexColors: true, roughness: 0.3, metalness: 0.05 });
  d.push(fruitGeo, fruitMat);
  const ring = new Group();
  const FR = 9;
  const fruits: { m: Mesh; a: number; r: number; y: number; s: number }[] = [];
  for (let i = 0; i < FR; i++) {
    const m = new Mesh(fruitGeo, fruitMat);
    const f = { m, a: (i / FR) * Math.PI * 2, r: 1.55 + (i % 3) * 0.18, y: -0.9 + ((i * 37) % 9) / 9 * 1.6, s: 0.75 + ((i * 53) % 7) / 7 * 0.5 };
    m.scale.setScalar(f.s);
    m.rotation.set(Math.random() * 0.6, Math.random() * Math.PI, Math.random() * 0.6);
    ring.add(m); fruits.push(f);
  }
  ring.rotation.x = 0.32;
  holder.add(ring);
  scene.add(holder);

  // Partikel keemasan (serbuk cahaya)
  const N = 90;
  const pos = new Float32Array(N * 3); const speed = new Float32Array(N); const drift = new Float32Array(N);
  const spawn = (i: number, anywhere: boolean) => {
    pos[i * 3] = (Math.random() - 0.5) * 5.5;
    pos[i * 3 + 1] = anywhere ? (Math.random() - 0.5) * 7 : -3.6;
    pos[i * 3 + 2] = (Math.random() - 0.5) * 3 - 0.4;
    speed[i] = 0.12 + Math.random() * 0.35; drift[i] = Math.random() * Math.PI * 2;
  };
  for (let i = 0; i < N; i++) spawn(i, true);
  const pGeo = new BufferGeometry(); pGeo.setAttribute('position', new BufferAttribute(pos, 3));
  const tex = sparkTexture();
  const pMat = new PointsMaterial({ map: tex, size: 0.16, transparent: true, depthWrite: false, blending: AdditiveBlending, opacity: 0.8 });
  scene.add(new Points(pGeo, pMat));
  d.push(pGeo, pMat, tex);

  const resize = () => {
    const w = container.clientWidth || 1, h = container.clientHeight || 1;
    renderer.setPixelRatio(stats.dpr);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // jaga objek + orbit utuh terlihat pada wadah sempit
    camera.position.z = w / h < 0.9 ? 11 * (0.9 / (w / h)) ** 0.85 : 11;
    camera.updateProjectionMatrix();
  };
  const ro = new ResizeObserver(resize); ro.observe(container); resize();

  const mouse = { x: 0, y: 0 };
  const onMove = (e: PointerEvent) => {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = (e.clientY / window.innerHeight) * 2 - 1;
  };
  window.addEventListener('pointermove', onMove, { passive: true });

  let raf = 0, last = performance.now(), t = 0, running = false, inView = true;
  let tiltX = 0, tiltY = 0, prog = 0;
  let skip = 0;
  const frame = (now: number) => {
    raf = requestAnimationFrame(frame);
    if (stats.throttled && (skip = (skip + 1) % 4) !== 0) return; // ~15 fps saat throttled
    const rawMs = now - last;
    const dt = Math.min(rawMs / 1000, 0.05); last = now; t += dt;
    prog = MathUtils.lerp(prog, state.progress, 0.1);
    tiltX = MathUtils.lerp(tiltX, mouse.y * 0.16, 0.05);
    tiltY = MathUtils.lerp(tiltY, mouse.x * 0.4, 0.05);
    drop.rotation.y = t * 0.4 + tiltY + prog * Math.PI * 2;
    // tetes "bernapas" sedikit
    const breathe = 1 + Math.sin(t * 1.6) * 0.015;
    drop.scale.set(breathe, 1 / breathe, breathe);
    holder.rotation.x = tiltX + Math.sin(prog * Math.PI) * 0.12;
    holder.rotation.z = Math.sin(prog * Math.PI * 2) * 0.08;
    holder.position.y = Math.sin(t * 1.1) * 0.07;
    ring.rotation.y = t * 0.25 + prog * Math.PI * 1.5;
    // orbit melebar saat scroll
    const spread = 1 + Math.sin(prog * Math.PI) * 0.12;
    fruits.forEach((f, i) => {
      f.m.position.set(Math.cos(f.a) * f.r * spread, f.y + Math.sin(t * 0.9 + i) * 0.08, Math.sin(f.a) * f.r * spread);
      f.m.rotation.y += dt * 0.3;
    });
    for (let i = 0; i < N; i++) {
      pos[i * 3 + 1] += speed[i] * dt;
      pos[i * 3] += Math.sin(t * 1.2 + drift[i]) * 0.002;
      if (pos[i * 3 + 1] > 3.6) spawn(i, false);
    }
    pGeo.attributes.position.needsUpdate = true;
    renderer.render(scene, camera);
    stats.frames++;
    stats.avgMs = stats.avgMs ? stats.avgMs * 0.9 + rawMs * 0.1 : rawMs;
    if (stats.frames > 20 && stats.avgMs > 45) {
      if (stats.dpr > 1) { stats.dpr = 1; renderer.setPixelRatio(1); resize(); stats.avgMs = 0; stats.frames = 0; }
      else if (!stats.throttled) { stats.throttled = true; }
    }
  };
  const start = () => { if (!running && inView && !document.hidden) { running = true; last = performance.now(); stats.frames = 0; stats.avgMs = 0; raf = requestAnimationFrame(frame); } };
  const stop = () => { running = false; cancelAnimationFrame(raf); };

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
