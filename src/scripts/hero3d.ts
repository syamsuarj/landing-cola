import {
  ACESFilmicToneMapping, AdditiveBlending, AmbientLight, BufferAttribute, BufferGeometry, CanvasTexture, Color,
  DirectionalLight, DoubleSide, Float32BufferAttribute, Group, HemisphereLight,
  InstancedMesh, Matrix4, MathUtils, Mesh, MeshBasicMaterial, MeshStandardMaterial, Object3D, PerspectiveCamera,
  PointLight, Points, PointsMaterial, Scene, Vector3, WebGLRenderer,
} from 'three';
// Kit sawit (Programmer B, kontrak PalmKit di TASKS.md): pohon & TBS, geometri/material dibagi, ≤3 draw call/pohon.
import { createPalmKit, type PalmKit } from './hero3d/palm';

type Disposable = { dispose(): void };

/**
 * T7a: Diorama mini kebun kelapa sawit — 100% prosedural, tanpa aset/HDR/logo.
 * File ini: pulau tanah melayang (rumput + lapisan laterit), jalan panen + parit, piringan (lingkaran bersih) di
 * pangkal pohon, tata letak 5 pohon pola segitiga, 2 TBS terpanen di tepi jalan, kamera orbit + scroll, cahaya,
 * partikel emas, dispose, perf. Model POHON SAWIT & TBS = kit Programmer B (src/scripts/hero3d/palm.ts, kontrak
 * PalmKit di TASKS.md ### T7 — pembagian tim).
 */

// ---------- util ----------
const rng = (seed: number) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const UP = new Vector3(0, 1, 0);
const col = (hex: string) => new Color(hex);

/** Penampung geometri non-indexed: posisi, normal, warna vertex, bobot angin (`sway`). */
class Buf {
  p: number[] = []; n: number[] = []; c: number[] = []; w: number[] = [];
  private e2 = new Vector3(); private nn = new Vector3();
  private v(p: Vector3, n: Vector3, c: Color, w: number) {
    this.p.push(p.x, p.y, p.z); this.n.push(n.x, n.y, n.z); this.c.push(c.r, c.g, c.b); this.w.push(w);
  }
  tri(a: Vector3, b: Vector3, c: Vector3, ca: Color, cb = ca, cc = ca, wa = 0, wb = wa, wc = wa, nrm?: Vector3) {
    const n = nrm ?? this.nn.subVectors(b, a).cross(this.e2.subVectors(c, a)).normalize();
    this.v(a, n, ca, wa); this.v(b, n, cb, wb); this.v(c, n, cc, wc);
  }
  /** segitiga dengan normal per-vertex (sisi pulau halus, V-3) */
  triN(a: Vector3, b: Vector3, c: Vector3, ca: Color, cb: Color, cc: Color, na: Vector3, nb: Vector3, nc: Vector3) {
    this.v(a, na, ca, 0); this.v(b, nb, cb, 0); this.v(c, nc, cc, 0);
  }
  build() {
    const g = new BufferGeometry();
    g.setAttribute('position', new Float32BufferAttribute(this.p, 3));
    g.setAttribute('normal', new Float32BufferAttribute(this.n, 3));
    g.setAttribute('color', new Float32BufferAttribute(this.c, 3));
    g.setAttribute('sway', new Float32BufferAttribute(this.w, 1));
    g.computeBoundingSphere();
    return g;
  }
}

// ---------- tata letak kebun ----------
const RX = 2.2, RZ = 1.75;
const ROAD_Z = 0.1, ROAD_W = 0.17, DITCH_Z = 0.4, DITCH_W = 0.05;
const TREE_S = 1.2; // skala kit (pohon kit ±1,0 unit, tajuk r±0,6 → tinggi ±1,2; tajuk bertetangga hampir bersentuhan)
// pola tanam segitiga: baris belakang 3 pohon, baris depan 2 pohon (berselang), jalan panen di antaranya
const TREES: [number, number, number][] = [ // x, z, variasi skala
  [-1.28, -0.66, 0.96], [0.02, -0.78, 1.06], [1.3, -0.6, 0.92], [-0.66, 0.9, 0.9], [0.7, 0.94, 1.0],
];
const HARVESTED: [number, number, number][] = [[0.3, 0.29, 0.6], [0.6, 0.25, -0.5]]; // x, z, rotasi
const rimR = (th: number) => 1 + 0.05 * Math.sin(3 * th + 0.4) + 0.035 * Math.sin(5 * th + 1.7) + 0.02 * Math.sin(9 * th + 2.2);
const roadDist = (x: number, z: number) => Math.abs(z - ROAD_Z - 0.03 * Math.sin(x * 1.6));
function heightAt(x: number, z: number) {
  let y = 0.025 * Math.sin(x * 2.1 + 0.5) * Math.cos(z * 1.7) + 0.015 * Math.sin(x * 4.3 - z * 3.1);
  const dr = roadDist(x, z);
  if (dr < ROAD_W) y -= 0.012 * (1 - dr / ROAD_W);
  const dd = Math.abs(z - DITCH_Z);
  if (dd < DITCH_W) y -= 0.04 * (1 - dd / DITCH_W);
  return y;
}
function groundColor(x: number, z: number, rnd: number) {
  const nz = 0.5 + 0.5 * Math.sin(x * 3.1 + z * 2.3) * Math.cos(x * 1.3 - z * 4.1);
  const c = col('#1f3b14').lerp(col('#37591e'), nz * 0.8 + rnd * 0.2);
  // piringan: lingkaran bersih berserasah di pangkal pohon + AO palsu di bawah tajuk
  let ao = 1;
  for (const [tx, tz] of TREES) {
    const d = Math.hypot(x - tx, z - tz);
    if (d < 0.36) c.lerp(col('#5a3a1f').lerp(col('#6e4a27'), rnd), MathUtils.smoothstep(0.36 - d, 0, 0.08));
    if (d < 0.9) ao = Math.min(ao, 0.55 + 0.45 * MathUtils.smoothstep(d, 0.15, 0.9));
  }
  const dr = roadDist(x, z);
  if (dr < ROAD_W + 0.03) {
    const road = col('#8a4220').lerp(col('#a5582f'), rnd * 0.6);
    if (Math.abs(dr - ROAD_W * 0.5) < 0.025) road.multiplyScalar(0.78); // bekas roda
    c.lerp(road, MathUtils.smoothstep(ROAD_W + 0.03 - dr, 0, 0.04));
  }
  const dd = Math.abs(z - DITCH_Z);
  if (dd < DITCH_W + 0.02) c.lerp(dd < DITCH_W * 0.6 ? col('#1c3a3a') : col('#4a2a18'), MathUtils.smoothstep(DITCH_W + 0.02 - dd, 0, 0.03));
  return c.multiplyScalar(ao);
}

function buildIsland(b: Buf, R: () => number, low: boolean) {
  const SEG = low ? 80 : 112, RINGS = low ? 11 : 14;
  const grid: Vector3[][] = [], cols: Color[][] = [];
  for (let k = 0; k <= RINGS; k++) {
    grid[k] = []; cols[k] = [];
    for (let s = 0; s < SEG; s++) {
      const th = (s / SEG) * Math.PI * 2, r = rimR(th) * (k / RINGS);
      const x = Math.cos(th) * RX * r, z = Math.sin(th) * RZ * r;
      grid[k][s] = new Vector3(x, heightAt(x, z), z); cols[k][s] = groundColor(x, z, R());
    }
  }
  for (let k = 0; k < RINGS; k++) for (let s = 0; s < SEG; s++) {
    const s2 = (s + 1) % SEG;
    b.tri(grid[k][s], grid[k + 1][s2], grid[k + 1][s], cols[k][s], cols[k + 1][s2], cols[k + 1][s], 0, 0, 0, UP);
    if (k > 0) b.tri(grid[k][s], grid[k][s2], grid[k + 1][s2], cols[k][s], cols[k][s2], cols[k + 1][s2], 0, 0, 0, UP);
  }
  // sisi: lapisan rumput tipis → laterit kemerahan berlapis → meruncing (pulau melayang)
  // T9a V-3: bagian bawah (di bawah lapis rumput) −25% tinggi, saturasi laterit ×0,8, gradien ke cokelat tua di
  // bawah, faset lebih halus (jag/acak lebih kecil + normal per-vertex).
  const LV: [number, number, string][] = [
    [0, 1, '#2f5219'], [-0.07, 1.012, '#223f14'], [-0.11, 0.995, '#6e3419'], [-0.3, 0.97, '#8e4021'],
    [-0.5, 0.93, '#76311a'], [-0.74, 0.85, '#9a4a26'], [-1.0, 0.71, '#682b18'], [-1.26, 0.53, '#5e2915'],
    [-1.52, 0.33, '#47200f'], [-1.74, 0.14, '#36180c'], [-1.86, 0.02, '#2a130a'],
  ];
  const DEEP = col('#24160d'), hsl = { h: 0, s: 0, l: 0 };
  const ring: Vector3[][] = [], rc: Color[][] = [];
  LV.forEach(([y0, s0, hex], l) => {
    ring[l] = []; rc[l] = [];
    const y = y0 < -0.11 ? -0.11 + (y0 + 0.11) * 0.75 : y0;
    const base = col(hex);
    if (l > 1) {
      base.getHSL(hsl); base.setHSL(hsl.h, hsl.s * 0.8, hsl.l);
      base.lerp(DEEP, MathUtils.smoothstep(l, 2, LV.length - 1) * 0.7);
    }
    for (let s = 0; s < SEG; s++) {
      const th = (s / SEG) * Math.PI * 2, top = grid[RINGS][s];
      if (l === 0) { ring[l][s] = top; rc[l][s] = base.clone().multiplyScalar(0.85); continue; }
      const jag = l > 1 ? 1 + 0.04 * Math.sin(th * 7 + l * 1.9) * Math.sin(th * 3 - l) + (R() - 0.5) * 0.02 : 1;
      ring[l][s] = new Vector3(top.x * s0 * jag, l > 1 ? y + (R() - 0.5) * 0.02 : top.y + y, top.z * s0 * jag);
      rc[l][s] = base.clone().multiplyScalar(0.9 + R() * 0.16);
    }
  });
  // normal per-vertex: tangen keliling × tangen vertikal (beda pusat), arah keluar
  const nrm: Vector3[][] = [], tA = new Vector3(), tB = new Vector3();
  for (let l = 0; l < LV.length; l++) {
    nrm[l] = [];
    for (let s = 0; s < SEG; s++) {
      tA.subVectors(ring[l][(s + 1) % SEG], ring[l][(s + SEG - 1) % SEG]);
      tB.subVectors(ring[Math.max(0, l - 1)][s], ring[Math.min(LV.length - 1, l + 1)][s]);
      const n = new Vector3().crossVectors(tA, tB).normalize();
      if (n.x * ring[l][s].x + n.z * ring[l][s].z < 0) n.negate();
      nrm[l][s] = l === 0 ? n.lerp(UP, 0.5).normalize() : n;
    }
  }
  for (let l = 0; l < LV.length - 1; l++) for (let s = 0; s < SEG; s++) {
    const s2 = (s + 1) % SEG;
    if (l === 0) { // lapis rumput: tetap berfaset tegas (tepi tanah)
      b.tri(ring[l][s], ring[l][s2], ring[l + 1][s2], rc[l][s], rc[l][s2], rc[l + 1][s2]);
      b.tri(ring[l][s], ring[l + 1][s2], ring[l + 1][s], rc[l][s], rc[l + 1][s2], rc[l + 1][s]);
      continue;
    }
    b.triN(ring[l][s], ring[l][s2], ring[l + 1][s2], rc[l][s], rc[l][s2], rc[l + 1][s2], nrm[l][s], nrm[l][s2], nrm[l + 1][s2]);
    b.triN(ring[l][s], ring[l + 1][s2], ring[l + 1][s], rc[l][s], rc[l + 1][s2], rc[l + 1][s], nrm[l][s], nrm[l + 1][s2], nrm[l + 1][s]);
  }
}

/** Rumput / penutup tanah (kacangan): rumpun bilah kecil, bergoyang via atribut sway. */
function buildTufts(b: Buf, R: () => number, max: number) {
  for (let i = 0, n = 0; i < max * 4 && n < max; i++) {
    const th = R() * Math.PI * 2, rho = Math.sqrt(R()) * 0.94;
    const x = Math.cos(th) * RX * rimR(th) * rho, z = Math.sin(th) * RZ * rimR(th) * rho;
    if (roadDist(x, z) < ROAD_W + 0.05 || Math.abs(z - DITCH_Z) < DITCH_W + 0.03) continue;
    if (TREES.some(([tx, tz]) => Math.hypot(x - tx, z - tz) < 0.42)) continue;
    n++;
    const y = heightAt(x, z), g = col('#28481a').lerp(col('#4f7a28'), R()), gd = g.clone().multiplyScalar(0.55);
    for (let k = 0; k < 3; k++) {
      const a = R() * Math.PI * 2, h = 0.06 + R() * 0.07, w = 0.018;
      const o = new Vector3(x + Math.cos(a) * 0.02, y, z + Math.sin(a) * 0.02);
      const tip = o.clone().add(new Vector3(Math.cos(a) * 0.03, h, Math.sin(a) * 0.03));
      b.tri(o.clone().add(new Vector3(-Math.sin(a) * w, 0, Math.cos(a) * w)), o.clone().add(new Vector3(Math.sin(a) * w, 0, -Math.cos(a) * w)), tip, gd, gd, g, 0, 0, 1);
    }
  }
}

function spotTexture(inner: string, mid: string, outer: string) {
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const x = c.getContext('2d')!;
  const gr = x.createRadialGradient(32, 32, 1, 32, 32, 31);
  gr.addColorStop(0, inner); gr.addColorStop(0.45, mid); gr.addColorStop(1, outer);
  x.fillStyle = gr; x.fillRect(0, 0, 64, 64);
  return new CanvasTexture(c);
}

/**
 * Inisialisasi scene 3D hero. `state.progress` (0..1) berasal dari ScrollTrigger adegan ter-pin.
 * Pause saat di luar viewport/tab tersembunyi, DPR maks 2, kualitas adaptif, dispose saat pagehide.
 */
// X3 (T6): init dipecah per tahap, diselingi yield (requestIdleCallback), shader via compileAsync; kanvas baru
// ditempel/ditampilkan setelah siap (fallback SVG tetap tampil). T7a: tanpa PMREM/RoomEnvironment (material kasar;
// hemisphere + directional cukup) → tahap init terberat hilang.
const yieldTask = () => new Promise<void>((r) => {
  const ric = (window as unknown as { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number }).requestIdleCallback;
  if (ric) ric(() => r(), { timeout: 400 }); else setTimeout(r, 16);
});

export async function initHero3D(container: HTMLElement, state: { progress: number } = { progress: 0 }, reveal?: () => void): Promise<boolean> {
  let renderer: WebGLRenderer;
  try {
    renderer = new WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch { return false; }
  await yieldTask();

  const d: Disposable[] = [];
  const stats = { frames: 0, avgMs: 0, dpr: Math.min(window.devicePixelRatio || 1, 2), throttled: false, calls: 0, triangles: 0, fitR: 0, kit: 'palm', quality: 'high', rebuilds: 0, recovered: 0 };
  const W = window as unknown as { __hero3d?: unknown; __hero3dStats?: typeof stats };
  W.__hero3dStats = stats;
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  // T9a T-2: kualitas dievaluasi ulang saat resize lintas 760 px (lihat applyQuality / rebuildFlora di bawah)
  const fewCores = (navigator.hardwareConcurrency || 8) <= 4;
  const isLow = () => window.innerWidth < 760 || fewCores;
  let low = isLow();
  const dprMax = () => Math.min(window.devicePixelRatio || 1, low ? 1.5 : 2);
  stats.dpr = dprMax();
  const scene = new Scene();
  const camera = new PerspectiveCamera(30, 1, 0.1, 80);
  const target = new Vector3(0, 0.15, 0);

  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = ACESFilmicToneMapping;
  // T12a taste: eksposur +~8% (0,95→1,03) + lampu kicker tajuk (atas-belakang) agar tajuk tak 'butek' di latar gelap;
  // sisi laterit menghadap kamera/bawah tak kena kicker → tanah tak jenuh lagi.
  renderer.toneMappingExposure = 1.03;

  // Cahaya: langit hijau temaram (latar foto kebun gelap) + matahari sore keemasan + rim emas/hijau
  scene.add(new HemisphereLight(0xb9d6b4, 0x2a1a0e, 0.65));
  scene.add(new AmbientLight(0xffffff, 0.12));
  const sun = new DirectionalLight(0xffd59a, 1.8); sun.position.set(4, 6, 5); scene.add(sun);
  const rimGold = new PointLight(0xffb02e, 45, 16); rimGold.position.set(3.2, 1.6, -3); scene.add(rimGold);
  const rimGreen = new PointLight(0x5fd38a, 32, 16); rimGreen.position.set(-3.6, 2.2, -2.4); scene.add(rimGreen);
  const crownKick = new DirectionalLight(0xe8f5c8, 0.55); crownKick.position.set(-1.5, 6, -4); scene.add(crownKick);
  const under = new PointLight(0xf2c230, 6, 8); under.position.set(0.5, -2.6, 2); scene.add(under);

  // --- kit sawit (palm.ts) --- (tidak masuk `d`: bisa diganti saat kualitas berubah, di-dispose terpisah)
  let kit: PalmKit = createPalmKit({ quality: low ? 'low' : 'high' });
  stats.quality = low ? 'low' : 'high';
  await yieldTask();

  // --- tanah ---
  const R = rng(7);
  const ground = new Buf();
  buildIsland(ground, R, low);
  const tufts = new Buf();
  buildTufts(tufts, R, low ? 90 : 170);
  const island = new Group();
  const groundMat = new MeshStandardMaterial({ vertexColors: true, roughness: 0.95, metalness: 0 });
  const wind = { value: 0 };
  const tuftMat = new MeshStandardMaterial({ vertexColors: true, roughness: 0.8, metalness: 0, side: DoubleSide });
  tuftMat.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = wind;
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nattribute float sway;\nuniform float uTime;')
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        float ph = position.x * 2.3 + position.z * 1.9;
        transformed.x += sin(uTime * 1.6 + ph) * 0.015 * sway;
        transformed.z += cos(uTime * 1.3 + ph) * 0.012 * sway;`);
  };
  const gGeo = ground.build(), tGeo = tufts.build();
  island.add(new Mesh(gGeo, groundMat), new Mesh(tGeo, tuftMat));
  d.push(gGeo, tGeo, groundMat, tuftMat);
  await yieldTask();

  // --- pohon (berbaris, pola segitiga) + TBS terpanen --- (satu Group `flora` per kit agar bisa ditukar utuh)
  const buildFlora = async (k: PalmKit, alive: () => boolean) => {
    const g = new Group();
    for (let i = 0; i < TREES.length; i++) {
      const [x, z, s] = TREES[i];
      const t = k.tree(101 + i * 17);
      t.position.set(x, heightAt(x, z) - 0.01, z);
      t.rotation.y = i * 1.9;
      t.scale.setScalar(TREE_S * s);
      g.add(t);
      await yieldTask(); // pohon pertama membangun geometri kit → pecah agar tak jadi long task
      if (!alive()) return g;
    }
    HARVESTED.forEach(([x, z, a], i) => {
      const f = k.ffb(500 + i * 31);
      f.position.set(x, heightAt(x, z), z);
      f.rotation.y = a;
      f.scale.setScalar(TREE_S * 1.1);
      g.add(f);
    });
    return g;
  };
  let disposed = false;
  let flora = await buildFlora(kit, () => true);
  island.add(flora);

  // bayangan lembut palsu (satu draw call): bercak gelap di bawah tajuk, condong menjauhi matahari
  const shTex = spotTexture('rgba(0,0,0,0.75)', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0)');
  const shB = new Buf();
  const white = new Color(1, 1, 1);
  const quad = (cx: number, cz: number, rx: number, rz: number) => {
    const y = heightAt(cx, cz) + 0.015;
    const a = new Vector3(cx - rx, y, cz - rz), b = new Vector3(cx + rx, y, cz - rz), c = new Vector3(cx + rx, y, cz + rz), e = new Vector3(cx - rx, y, cz + rz);
    shB.tri(a, e, c, white, white, white, 0, 0, 0, UP); shB.tri(a, c, b, white, white, white, 0, 0, 0, UP);
  };
  TREES.forEach(([x, z, s]) => quad(x - 0.18, z - 0.15, 0.68 * TREE_S * s, 0.58 * TREE_S * s));
  HARVESTED.forEach(([x, z]) => quad(x, z, 0.16, 0.12));
  const shGeo = shB.build();
  const uv: number[] = [];
  for (let i = 0; i < shGeo.attributes.position.count / 6; i++) uv.push(0, 0, 0, 1, 1, 1, 0, 0, 1, 1, 1, 0);
  shGeo.setAttribute('uv', new Float32BufferAttribute(uv, 2));
  const shMat = new MeshBasicMaterial({ map: shTex, color: 0x050a03, transparent: true, opacity: 0.55, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 });
  island.add(new Mesh(shGeo, shMat));
  d.push(shGeo, shMat, shTex);
  scene.add(island);

  // Partikel keemasan halus (serbuk cahaya)
  const N = 60; // T9a: alokasi penuh; mode low hanya menggambar 36 (setDrawRange) → bisa pulih tanpa realokasi
  const pos = new Float32Array(N * 3); const speed = new Float32Array(N); const drift = new Float32Array(N);
  const spawn = (i: number, anywhere: boolean) => {
    // T12a W-1: lahir di dalam bola fit kamera (lihat measureRad) → tak ada serbuk terpotong tepi kanvas
    pos[i * 3] = (Math.random() - 0.5) * 3.2;
    pos[i * 3 + 1] = anywhere ? -1.4 + Math.random() * 3.4 : -1.5;
    pos[i * 3 + 2] = (Math.random() - 0.5) * 2.4;
    speed[i] = 0.08 + Math.random() * 0.22; drift[i] = Math.random() * Math.PI * 2;
  };
  for (let i = 0; i < N; i++) spawn(i, true);
  const pGeo = new BufferGeometry(); pGeo.setAttribute('position', new BufferAttribute(pos, 3));
  const tex = spotTexture('rgba(255,240,190,1)', 'rgba(242,194,48,.5)', 'rgba(242,194,48,0)');
  const pMat = new PointsMaterial({ map: tex, size: 0.11, transparent: true, depthWrite: false, blending: AdditiveBlending, opacity: 0.75 });
  pGeo.setDrawRange(0, low ? 36 : N);
  scene.add(new Points(pGeo, pMat));
  d.push(pGeo, pMat, tex);

  // Kamera: orbit di sekitar target; jarak dihitung agar bola pembatas diorama selalu utuh di wadah.
  // T12a W-1: RAD = jarak verteks terjauh dari target (dihitung dari geometri nyata, termasuk instance & skala pohon)
  // + margin goyang/bob 6%. Bola invarian terhadap sudut orbit → fit untuk sudut terburuk. Dulu konstanta 2,6 <
  // jarak nyata tajuk, ditambah filmOffset desktop → pulau terpotong tepi kanan kanvas.
  const AZ0 = -0.35, EL0 = 0.36;
  const vtx = new Vector3(), mtx = new Matrix4(), imtx = new Matrix4();
  const measureRad = () => {
    island.position.y = 0; island.updateMatrixWorld(true);
    let r2 = 0;
    island.traverse((o: Object3D) => {
      const m = o as Mesh;
      if (!m.isMesh || !m.geometry?.attributes.position || m.material === shMat) return;
      const pa = m.geometry.attributes.position, inst = (o as InstancedMesh).isInstancedMesh ? (o as InstancedMesh) : null;
      const n = inst ? inst.count : 1, step = pa.count > 6000 ? 3 : 1;
      for (let k = 0; k < n; k++) {
        if (inst) { inst.getMatrixAt(k, imtx); mtx.multiplyMatrices(m.matrixWorld, imtx); } else mtx.copy(m.matrixWorld);
        for (let i = 0; i < pa.count; i += step) {
          vtx.fromBufferAttribute(pa, i).applyMatrix4(mtx);
          r2 = Math.max(r2, vtx.distanceToSquared(target));
        }
      }
    });
    return Math.sqrt(r2) * 1.08 + 0.05; // 8%: goyang pelepah (vertex shader) + subsampling; 0,05: bob pulau
  };
  let RAD = measureRad();
  let baseDist = 13;
  // jarak minimum agar bola RAD utuh dengan filmOffset `fo` (sisi tersempit frustum: tan(hh) − |fo|/filmWidth)
  const fitDist = (fo: number) => {
    const tv = Math.tan(MathUtils.degToRad(camera.fov / 2)), th = tv * camera.aspect - Math.abs(fo) / camera.getFilmWidth();
    return RAD / Math.sin(Math.atan(Math.max(0.05, Math.min(tv, th))));
  };
  const placeCamera = (az: number, el: number, dd: number) => {
    camera.position.set(target.x + dd * Math.cos(el) * Math.sin(az), target.y + dd * Math.sin(el), target.z + dd * Math.cos(el) * Math.cos(az));
    camera.lookAt(target);
  };
  placeCamera(AZ0, EL0, baseDist);

  await yieldTask();
  try { await renderer.compileAsync(scene, camera); } catch { /* kompilasi terjadi saat render pertama */ }
  await yieldTask();

  const art = container.closest<HTMLElement>('[data-hero-object]') ?? container.parentElement;
  reveal?.();
  container.appendChild(renderer.domElement);
  let raf = 0, last = performance.now(), t = 0, running = false, inView = true;
  // T9a: tablet potret (761–1023) — pada babak 2 objek digeser GSAP ke kiri di bawah teks babak 2 → kamera sedikit
  // menjauh & gambar digeser ke kiri (filmOffset) agar tepi kanan pulau tak masuk ke paragraf.
  let tabletPortrait = false, deskWide = false;
  const resize = () => {
    const w = container.clientWidth || 1, h = container.clientHeight || 1;
    tabletPortrait = window.innerWidth > 760 && window.innerWidth < 1200 && window.innerHeight > window.innerWidth;
    deskWide = window.innerWidth >= 1200;
    applyQuality();
    renderer.setPixelRatio(stats.dpr);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    baseDist = fitDist(0);
    camera.updateProjectionMatrix();
    if (!running) { placeCamera(AZ0, EL0, baseDist); renderer.render(scene, camera); }
  };

  // T9a T-2: kualitas low/high mengikuti lebar saat ini. Murah & langsung: DPR maks + jumlah partikel. Pohon (kit
  // palm.ts low/high) dibangun ulang bertahap saat idle setelah resize tenang 700 ms, lalu ditukar utuh & kit lama
  // di-dispose (jumlah geometri kembali sama, tanpa leak).
  let rebuildTimer = 0, rebuilding = false;
  const applyQuality = () => {
    const l = isLow();
    if (l === low) return;
    low = l;
    stats.dpr = dprCut ? 1 : dprMax();
    pGeo.setDrawRange(0, low ? 36 : N);
    clearTimeout(rebuildTimer);
    rebuildTimer = window.setTimeout(rebuildFlora, 700);
  };
  const rebuildFlora = async () => {
    const q = low ? 'low' : 'high';
    if (disposed || rebuilding || q === stats.quality) return;
    rebuilding = true;
    const k2 = createPalmKit({ quality: q });
    const f2 = await buildFlora(k2, () => !disposed);
    rebuilding = false;
    if (disposed) { k2.dispose(); return; }
    island.remove(flora); kit.dispose();
    kit = k2; flora = f2; island.add(flora);
    RAD = measureRad(); stats.fitR = RAD; resize();
    stats.quality = q; stats.rebuilds++;
    try { await renderer.compileAsync(scene, camera); } catch { /* render berikut */ }
    if (!running && !disposed) renderer.render(scene, camera);
    if ((low ? 'low' : 'high') !== stats.quality) rebuildFlora(); // lebar berubah lagi selama membangun
  };
  const ro = new ResizeObserver(resize); ro.observe(container);

  const mouse = { x: 0, y: 0 };
  const onMove = (e: PointerEvent) => {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = (e.clientY / window.innerHeight) * 2 - 1;
  };
  window.addEventListener('pointermove', onMove, { passive: true });

  let tiltX = 0, tiltY = 0, prog = 0, shift = 0, zoom = 0;
  let skip = 0;
  // T9a T-2: throttle berbasis interval rAF (semua frame, bukan hanya yang dirender) + pemulihan berhisteresis:
  // lambat (>45 ms rata-rata) → DPR 1 → throttled (render 1/4 frame); cepat (<24 ms) selama `okNeed` ms → pulih.
  let rafMs = 0, rafN = 0, okSince = 0, okNeed = 3000, prevRaf = 0, dprCut = false;
  const frame = (now: number) => {
    raf = requestAnimationFrame(frame);
    const iv = now - prevRaf; prevRaf = now;
    if (iv < 250) { rafMs = rafMs ? rafMs * 0.9 + iv * 0.1 : iv; rafN++; }
    if (rafN > 30) {
      if (rafMs > 45) {
        okSince = 0;
        if (stats.dpr > 1) { stats.dpr = 1; dprCut = true; renderer.setPixelRatio(1); resize(); rafN = 0; rafMs = 0; }
        else if (!stats.throttled) { stats.throttled = true; rafN = 0; rafMs = 0; }
      } else if (rafMs < 24 && (stats.throttled || stats.dpr < dprMax())) {
        if (!okSince) okSince = now;
        else if (now - okSince > okNeed) {
          if (stats.throttled) stats.throttled = false; else { dprCut = false; stats.dpr = dprMax(); renderer.setPixelRatio(stats.dpr); resize(); }
          stats.recovered++; okSince = 0; rafN = 0; rafMs = 0; okNeed = Math.min(okNeed * 2, 60000); // hindari osilasi
        }
      } else okSince = 0;
    }
    if (stats.throttled && (skip = (skip + 1) % 4) !== 0) return; // ~15 fps saat throttled
    const rawMs = now - last;
    const dt = Math.min(rawMs / 1000, 0.05); last = now; t += dt;
    prog = MathUtils.lerp(prog, state.progress, 0.08);
    tiltX = MathUtils.lerp(tiltX, mouse.y * 0.06, 0.05);
    tiltY = MathUtils.lerp(tiltY, mouse.x * 0.25, 0.05);
    wind.value = t;
    kit.update(t, 0.8 + 0.2 * Math.sin(t * 0.37));
    // babak 1: tampak depan agak tinggi · babak 2: memutar & mendekat · babak 3: berputar ke sisi lain, sedikit menjauh
    const az = AZ0 + t * 0.07 + prog * Math.PI * 0.85 + tiltY;
    const el = EL0 + Math.sin(prog * Math.PI) * 0.1 + prog * 0.06 + tiltX;
    const mid = Math.sin(prog * Math.PI);
    // filmOffset (mm, filmGauge 35): + = gambar bergeser ke kiri. Tablet potret: babak 2 kiri, babak 3 kanan
    // (menjauh dari teks babak 3 di kiri). Desktop lebar: babak 1 sedikit ke kanan (ruang dari tepi h1).
    const late = MathUtils.smoothstep(prog, 0.55, 0.9);
    const sh = tabletPortrait ? 2.4 * mid - 3.6 * late : deskWide ? -1.2 * (1 - Math.min(1, prog * 3)) : 0;
    const zo = tabletPortrait ? 0.14 * mid + 0.18 * late : 0;
    shift = MathUtils.lerp(shift, sh, 0.1); zoom = MathUtils.lerp(zoom, zo, 0.1);
    camera.filmOffset = shift;
    camera.updateProjectionMatrix();
    // W-1: jarak = fit bola utuh untuk filmOffset saat ini (sisi tersempit), lalu faktor babak 2 / tablet
    placeCamera(az, el, fitDist(shift) * (1 + 0.12 * mid + zoom)); // babak 2: sedikit menjauh (objek bergeser ke kiri, jangan menabrak teks)
    island.position.y = Math.sin(t * 0.9) * 0.05;
    for (let i = 0; i < N; i++) {
      pos[i * 3 + 1] += speed[i] * dt;
      pos[i * 3] += Math.sin(t * 1.2 + drift[i]) * 0.002;
      const px = pos[i * 3], py = pos[i * 3 + 1] - target.y, pz = pos[i * 3 + 2];
      if (pos[i * 3 + 1] > 2.6 || px * px + py * py + pz * pz > RAD * RAD * 0.9) spawn(i, false); // W-1: partikel tak terpotong tepi

    }
    pGeo.attributes.position.needsUpdate = true;
    renderer.render(scene, camera);
    stats.calls = renderer.info.render.calls; stats.triangles = renderer.info.render.triangles;
    stats.frames++;
    stats.avgMs = stats.avgMs ? stats.avgMs * 0.9 + rawMs * 0.1 : rawMs;
  };
  const start = () => {
    if (reduce || disposed) return; // reduced-motion: satu render statis (normalnya animations.ts tak memuat 3D sama sekali)
    if (!running && inView && !document.hidden) { running = true; last = performance.now(); prevRaf = last; rafN = 0; rafMs = 0; stats.frames = 0; stats.avgMs = 0; raf = requestAnimationFrame(frame); }
  };
  const stop = () => { running = false; cancelAnimationFrame(raf); };

  const io = new IntersectionObserver(([en]) => { inView = en.isIntersecting; if (inView) start(); else stop(); }, { threshold: 0.01 });
  io.observe(container);
  const onVis = () => (document.hidden ? stop() : start());
  document.addEventListener('visibilitychange', onVis);

  // T9a T-5: konteks WebGL hilang (GPU reset / bfcache) → kembali ke SVG; pulih → kanvas lagi
  const cv = renderer.domElement;
  const onLost = (e: Event) => { e.preventDefault(); stop(); art?.classList.remove('is-3d'); };
  const onRestored = () => { if (disposed) return; art?.classList.add('is-3d'); resize(); start(); };
  cv.addEventListener('webglcontextlost', onLost);
  cv.addEventListener('webglcontextrestored', onRestored);

  const dispose = () => {
    if (disposed) return;
    disposed = true;
    stop(); io.disconnect(); ro.disconnect(); clearTimeout(rebuildTimer);
    window.removeEventListener('pointermove', onMove);
    document.removeEventListener('visibilitychange', onVis);
    window.removeEventListener('pagehide', onHide); window.removeEventListener('pageshow', onShow);
    cv.removeEventListener('webglcontextlost', onLost); cv.removeEventListener('webglcontextrestored', onRestored);
    d.forEach((x) => x.dispose()); kit.dispose();
    renderer.dispose(); renderer.forceContextLoss();
    cv.remove();
    art?.classList.remove('is-3d'); // tanpa kanvas → fallback SVG tampil lagi
  };
  // T9a T-5: halaman masuk bfcache (persisted) → cukup jeda; dispose hanya bila benar-benar dibongkar.
  // Kembali dari bfcache → lanjutkan; bila kanvas/konteks sudah hilang → SVG.
  const onHide = (e: PageTransitionEvent) => { if (e.persisted) stop(); else dispose(); };
  const onShow = (e: PageTransitionEvent) => {
    if (!e.persisted) return;
    if (disposed || !cv.isConnected || renderer.getContext().isContextLost()) { art?.classList.remove('is-3d'); return; }
    art?.classList.add('is-3d'); resize(); start();
  };
  window.addEventListener('pagehide', onHide);
  window.addEventListener('pageshow', onShow);
  stats.fitR = RAD;
  resize();
  placeCamera(AZ0, EL0, baseDist);
  kit.update(0, 0.8);
  renderer.render(scene, camera);
  stats.calls = renderer.info.render.calls; stats.triangles = renderer.info.render.triangles;
  // HOOK QA (kontrak T7): hanya di dev
  if (import.meta.env.DEV) W.__hero3d = { renderer, scene, camera, stats };
  start();
  return true;
}
