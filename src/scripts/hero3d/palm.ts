/**
 * palm.ts — kit 3D prosedural pohon KELAPA SAWIT (Elaeis guineensis) + tandan buah segar (TBS).
 * Kontrak: TASKS.md § T7 (T7b). Tanpa aset eksternal; semua geometri prosedural + vertex color.
 *
 * - tree(seed): Group berisi 3 Mesh (batang, pelepah, buah) → maks 3 draw call / pohon.
 *   Geometri dibagi antar pohon (cache per varian jumlah pelepah / jumlah TBS); material dibagi semua.
 *   Origin = pangkal batang, +Y ke atas, tinggi total ≈ 1.0 (×0.94–1.06 per seed).
 * - ffb(seed): Group 1 Mesh, TBS terpanen rebah di tanah, oval berbenjol ≈ 0.18 × 0.14.
 * - update(t, wind): goyang pelepah via vertex shader (onBeforeCompile, uniform uTime/uWind bersama).
 * - dispose(): bebaskan semua geometri & material milik kit.
 */
import {
  BufferGeometry,
  Color,
  ConeGeometry,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  Matrix3,
  Matrix4,
  Mesh,
  MeshStandardMaterial,
  Quaternion,
  SphereGeometry,
  Vector3,
} from 'three';
import type { Material } from 'three';

export interface PalmKit {
  tree(seed: number): Group;
  ffb(seed: number): Group;
  update(t: number, wind?: number): void;
  dispose(): void;
}

type Quality = 'high' | 'low';

/* ------------------------------------------------------------------ util */

function mulberry32(seed: number): () => number {
  let a = (seed | 0) ^ 0x9e3779b9;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const smooth = (e0: number, e1: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};

/** Penampung array geometri (posisi, normal, warna, sway opsional, index). */
class Builder {
  pos: number[] = [];
  nor: number[] = [];
  col: number[] = [];
  sway: number[] = [];
  idx: number[] = [];
  constructor(private withSway = false) {}
  get count() {
    return this.pos.length / 3;
  }
  v(p: Vector3, n: Vector3, c: Color, swayAmt = 0, swayPh = 0): number {
    this.pos.push(p.x, p.y, p.z);
    this.nor.push(n.x, n.y, n.z);
    this.col.push(c.r, c.g, c.b);
    if (this.withSway) this.sway.push(swayAmt, swayPh);
    return this.count - 1;
  }
  /** Segitiga dengan winding disesuaikan agar searah normal verteks a (penting untuk DoubleSide). */
  tri(a: number, b: number, c: number) {
    const P = this.pos;
    const ax = P[a * 3], ay = P[a * 3 + 1], az = P[a * 3 + 2];
    const e1x = P[b * 3] - ax, e1y = P[b * 3 + 1] - ay, e1z = P[b * 3 + 2] - az;
    const e2x = P[c * 3] - ax, e2y = P[c * 3 + 1] - ay, e2z = P[c * 3 + 2] - az;
    const cx = e1y * e2z - e1z * e2y, cy = e1z * e2x - e1x * e2z, cz = e1x * e2y - e1y * e2x;
    const N = this.nor;
    const d = cx * N[a * 3] + cy * N[a * 3 + 1] + cz * N[a * 3 + 2];
    if (d >= 0) this.idx.push(a, b, c);
    else this.idx.push(a, c, b);
  }
  /** Tambah geometri indexed (mis. SphereGeometry) dengan transform + pewarna per verteks. */
  addGeo(
    g: BufferGeometry,
    m: Matrix4,
    color: (lx: number, ly: number, lz: number, out: Color) => void,
  ) {
    const p = g.getAttribute('position');
    const n = g.getAttribute('normal');
    const nm = new Matrix3().getNormalMatrix(m);
    const base = this.count;
    const vp = new Vector3(), vn = new Vector3(), c = new Color();
    for (let i = 0; i < p.count; i++) {
      vp.fromBufferAttribute(p, i);
      color(vp.x, vp.y, vp.z, c);
      vp.applyMatrix4(m);
      vn.fromBufferAttribute(n, i).applyMatrix3(nm).normalize();
      this.pos.push(vp.x, vp.y, vp.z);
      this.nor.push(vn.x, vn.y, vn.z);
      this.col.push(c.r, c.g, c.b);
      if (this.withSway) this.sway.push(0, 0);
    }
    const ix = g.getIndex()!;
    for (let i = 0; i < ix.count; i++) this.idx.push(base + ix.getX(i));
  }
  build(): BufferGeometry {
    const g = new BufferGeometry();
    g.setAttribute('position', new Float32BufferAttribute(this.pos, 3));
    g.setAttribute('normal', new Float32BufferAttribute(this.nor, 3));
    g.setAttribute('color', new Float32BufferAttribute(this.col, 3));
    if (this.withSway) g.setAttribute('aSway', new Float32BufferAttribute(this.sway, 2));
    g.setIndex(this.idx);
    g.computeBoundingBox();
    g.computeBoundingSphere();
    return g;
  }
}

/* ------------------------------------------------------- dimensi dasar */
// Satuan "mentah" sebelum normalisasi tinggi total → 1.0.
const TRUNK_H = 0.46;
const TRUNK_R = 0.074;
const FROND_VARIANTS = [18, 21, 23, 26];

const C = {
  barkDark: new Color(0x231a12),
  bark: new Color(0x5b4934),
  barkLight: new Color(0x8c7350),
  barkMoss: new Color(0x3f4a24),
  barkFresh: new Color(0x6a6232),
  leafYoung: new Color(0x6f8d2e),
  leaf: new Color(0x3a5320),
  leafOld: new Color(0x5a5a26),
  leafDry: new Color(0x8a6a2c),
  rachis: new Color(0x76703c),
  fruitBase: new Color(0xff7d1a), // oranye terang (pangkal buah)
  fruitMid: new Color(0xc0240f), // merah
  fruitTip: new Color(0x170810), // hitam
  fruitPurple: new Color(0x2e0c26), // hitam-ungu
  stalk: new Color(0x6b5a30),
};

/* --------------------------------------------------------------- batang */
function trunkRadius(v: number): number {
  // v = 0..1 sepanjang batang. Pangkal melebar (akar banir kecil), atas sedikit membesar (pangkal pelepah baru).
  const flare = 0.035 * Math.pow(1 - smooth(0, 0.16, v), 2);
  const top = 0.012 * smooth(0.7, 1, v);
  return TRUNK_R + flare + top;
}

function buildTrunk(q: Quality): BufferGeometry {
  const b = new Builder(false);
  const radial = q === 'high' ? 64 : 40;
  const rows = q === 'high' ? 84 : 52;
  const ROWS = 9; // jumlah sel per keluarga spiral sepanjang batang
  const amp = 0.026;
  const p = new Vector3(), n = new Vector3(), c = new Color();
  const noise = mulberry32(77);
  const moss: number[] = [];
  for (let i = 0; i < 64; i++) moss.push(noise());
  for (let j = 0; j <= rows; j++) {
    const v = j / rows;
    for (let i = 0; i <= radial; i++) {
      const u = i / radial;
      const th = u * Math.PI * 2;
      // kisi belah-ketupat 2 keluarga spiral (parastichy) — koef u bulat → wrap mulus
      const A = 5 * u + ROWS * v;
      const B = -8 * u + ROWS * v;
      const fa = A - Math.floor(A), fb = B - Math.floor(B);
      const cc = (fa + fb) * 0.5; // 0 bawah sel → 1 atas sel (tepi potongan pangkal pelepah)
      const ri = Math.floor(A) * 31 + Math.floor(B);
      const across = Math.pow(Math.max(0, 1 - Math.abs(fa - fb)), 0.7);
      const shown = 0.35 + 0.65 * smooth(0.05, 0.3, v);
      const bump = Math.pow(cc, 1.4) * across;
      const r = trunkRadius(v) + amp * shown * bump;
      p.set(Math.cos(th) * r, v * TRUNK_H, Math.sin(th) * r);
      n.set(Math.cos(th), 0, Math.sin(th));
      // warna: celah gelap, tonjolan terang, lumut acak, bagian atas lebih segar
      const crevice = 1 - Math.min(1, cc * 1.6) * across;
      c.copy(C.bark).lerp(C.barkLight, bump * 0.75).lerp(C.barkDark, crevice * 0.65);
      const m = moss[(ri * 7) & 63];
      if (m > 0.72 && v > 0.12 && v < 0.85) c.lerp(C.barkMoss, 0.55);
      c.lerp(C.barkFresh, smooth(0.78, 1, v) * 0.5);
      c.multiplyScalar(0.85 + 0.15 * smooth(0, 0.2, v));
      b.v(p, n, c);
    }
  }
  const W = radial + 1;
  for (let j = 0; j < rows; j++)
    for (let i = 0; i < radial; i++) {
      const a = j * W + i, bb = a + 1, cI = a + W, d = cI + 1;
      b.idx.push(a, cI, bb, bb, cI, d);
    }
  const g = b.build();
  g.computeVertexNormals();
  return g;
}

/* --------------------------------------------------------------- pelepah */
interface CrownInfo {
  geo: BufferGeometry;
  maxY: number;
  fronds: number;
}

function buildCrown(nFronds: number, q: Quality, seed: number): CrownInfo {
  const rng = mulberry32(seed * 131 + nFronds);
  const b = new Builder(true);
  const perSide = q === 'high' ? 58 : 29;
  const SEG = q === 'high' ? 14 : 10;
  const GOLD = 2.39996; // sudut emas → filotaksis spiral
  const up = new Vector3(0, 1, 0);
  const tmp = new Vector3(), tmp2 = new Vector3(), Nn = new Vector3(), c = new Color();
  let maxY = 0;

  const pts: Vector3[] = [];
  const tans: Vector3[] = [];
  for (let k = 0; k <= SEG; k++) {
    pts.push(new Vector3());
    tans.push(new Vector3());
  }

  for (let f = 0; f < nFronds; f++) {
    const age = 1 - f / (nFronds - 1); // 1 = tertua (bawah), 0 = termuda (pucuk)
    const phi = f * GOLD + rng() * 0.25;
    const dirH = new Vector3(Math.cos(phi), 0, Math.sin(phi));
    const S = new Vector3(-Math.sin(phi), 0, Math.cos(phi));
    const e0 = (1 - age) * 1.28 + age * 0.1 + (rng() - 0.5) * 0.18; // elevasi awal (rad)
    const bend = 0.3 + age * 0.85 + rng() * 0.2; // lengkung gravitasi
    const len = (0.46 + 0.1 * Math.sin(Math.PI * Math.min(1, age * 1.3 + 0.15)) + rng() * 0.06) * (f > nFronds - 3 ? 0.8 : 1);
    const baseY = TRUNK_H - 0.065 * age + 0.015;
    const baseR = trunkRadius(1) * 0.5;
    const swayPh = rng() * Math.PI * 2;
    // warna per pelepah
    const fc = new Color().copy(C.leaf);
    if (age < 0.3) fc.lerp(C.leafYoung, (0.3 - age) / 0.3);
    if (age > 0.7) fc.lerp(C.leafOld, (age - 0.7) / 0.3 * 0.8);
    fc.multiplyScalar(0.9 + rng() * 0.2);
    const dry = age > 0.92 && rng() < 0.5;

    // kurva rakis
    pts[0].copy(dirH).multiplyScalar(baseR).setY(baseY);
    for (let k = 0; k <= SEG; k++) {
      const s = k / SEG;
      const e = e0 - bend * Math.pow(s, 1.4);
      tans[k].copy(dirH).multiplyScalar(Math.cos(e)).addScaledVector(up, Math.sin(e)).normalize();
      if (k > 0) pts[k].copy(pts[k - 1]).addScaledVector(tans[k - 1], len / SEG);
      maxY = Math.max(maxY, pts[k].y);
    }
    const sample = (s: number, outP: Vector3, outT: Vector3) => {
      const x = s * SEG;
      const k = Math.min(SEG - 1, Math.floor(x));
      const t = x - k;
      outP.lerpVectors(pts[k], pts[k + 1], t);
      outT.lerpVectors(tans[k], tans[k + 1], t).normalize();
    };
    const swayOf = (s: number) => Math.pow(s, 1.3) * (0.6 + 0.4 * (1 - age * 0.5));

    // rakis: prisma segitiga meruncing
    const ringStart: number[] = [];
    for (let k = 0; k <= SEG; k++) {
      const s = k / SEG;
      const r = 0.0085 * (1 - s) + 0.0015;
      const T = tans[k];
      const Nf = tmp.crossVectors(S, T).normalize();
      ringStart.push(b.count);
      const cr = c.copy(C.rachis).lerp(fc, s * 0.6);
      for (let m = 0; m < 3; m++) {
        const a = (m / 3) * Math.PI * 2;
        Nn.copy(Nf).multiplyScalar(Math.cos(a)).addScaledVector(S, Math.sin(a));
        tmp2.copy(pts[k]).addScaledVector(Nn, r);
        b.v(tmp2, Nn, cr, swayOf(s), swayPh);
      }
    }
    for (let k = 0; k < SEG; k++)
      for (let m = 0; m < 3; m++) {
        const a = ringStart[k] + m, bb = ringStart[k] + ((m + 1) % 3);
        const a2 = ringStart[k + 1] + m, b2 = ringStart[k + 1] + ((m + 1) % 3);
        b.tri(a, a2, bb);
        b.tri(bb, a2, b2);
      }

    // anak daun: dua sisi, sudut tak rata (ciri sawit: sebagian naik, sebagian turun, berkelompok)
    const n = Math.round(perSide * (0.85 + len * 0.3));
    const P = new Vector3(), T = new Vector3(), D = new Vector3(), Wv = new Vector3(), LN = new Vector3();
    const q0 = new Vector3(), q1 = new Vector3();
    const leafLenMax = len * 0.27;
    for (const side of [-1, 1]) {
      for (let j = 0; j < n; j++) {
        const s = 0.14 + (0.84 * (j + rng() * 0.7)) / n;
        if (s > 0.995) continue;
        sample(s, P, T);
        const Nf = tmp.crossVectors(S, T).normalize();
        const grp = j % 3;
        const elev = (grp === 0 ? 0.78 : grp === 1 ? -0.42 : 0.16) + (rng() - 0.5) * 0.3;
        const ll = leafLenMax * Math.pow(Math.sin(Math.PI * Math.min(1, (s - 0.06) / 0.98)), 0.55) * (0.8 + rng() * 0.35);
        if (ll < 0.012) continue;
        D.copy(S).multiplyScalar(side * Math.cos(elev)).addScaledVector(Nf, Math.sin(elev)).addScaledVector(T, 0.5 + rng() * 0.25).normalize();
        Wv.copy(T).addScaledVector(D, -T.dot(D)).normalize();
        LN.crossVectors(Wv, D).normalize();
        if (LN.dot(up) < 0) LN.negate();
        const w = ll * 0.06;
        const droop = 0.4 + age * 0.3;
        const lcBase = new Color().copy(fc).multiplyScalar(0.7);
        const lcTip = new Color().copy(dry && rng() < 0.7 ? C.leafDry : fc).multiplyScalar(1.12 + rng() * 0.1);
        const swA = swayOf(s);
        const at = (u: number, off: number, out: Vector3) =>
          out.copy(P).addScaledVector(D, u * ll).addScaledVector(Wv, off).setY(out.y - droop * u * u * ll);
        const i0 = b.v(at(0, 0, q0), LN, lcBase, swA, swayPh);
        c.copy(lcBase).lerp(lcTip, 0.3);
        const i1 = b.v(at(0.28, w * 0.5, q0), LN, c, swA + 0.04, swayPh);
        const i2 = b.v(at(0.28, -w * 0.5, q1), LN, c, swA + 0.04, swayPh);
        c.copy(lcBase).lerp(lcTip, 0.7);
        const i3 = b.v(at(0.66, w * 0.38, q0), LN, c, swA + 0.08, swayPh);
        const i4 = b.v(at(0.66, -w * 0.38, q1), LN, c, swA + 0.08, swayPh);
        const i5 = b.v(at(1, 0, q0), LN, lcTip, swA + 0.12, swayPh);
        b.tri(i0, i1, i2);
        b.tri(i1, i3, i2);
        b.tri(i2, i3, i4);
        b.tri(i3, i5, i4);
      }
    }
  }
  return { geo: b.build(), maxY, fronds: nFronds };
}

/* ------------------------------------------------------------ TBS / buah */
/**
 * Tandan: buah lonjong kecil di permukaan ovoid memanjang (radius R, setengah-panjang H) yang
 * BERBENJOL — buah dikelompokkan ke ~nLump spikelet (benjolan) seperti TBS asli, sumbu panjang buah
 * menghadap keluar. Lokal: sumbu tandan = +Y (pangkal tangkai di -Y).
 * Warna per buah: pangkal oranye terang → merah → ujung hitam-ungu; buah di puncak benjolan
 * (terpapar) ujungnya lebih gelap, buah di celah lebih oranye → benjolan terbaca dari jauh.
 */
function addBunch(
  b: Builder,
  m: Matrix4,
  rng: () => number,
  R: number,
  H: number,
  nFruit: number,
  fruitLen: number,
  nLump: number,
  fruitGeo: BufferGeometry,
  stalkGeo: BufferGeometry,
  stalkLen: number,
  spikeGeo: BufferGeometry,
  coreGeo: BufferGeometry,
) {
  const golden = Math.PI * (3 - Math.sqrt(5));
  const nrm = new Vector3(), pos = new Vector3(), yAxis = new Vector3(0, 1, 0), out = new Vector3();
  const qq = new Quaternion(), sc = new Vector3(), fm = new Matrix4();
  // pusat benjolan (spikelet) di bola satuan, ujung atas/bawah dihindari
  const lumps: { c: Vector3; a: number }[] = [];
  for (let k = 0; k < nLump; k++) {
    const y = 0.86 - (1.72 * (k + 0.5)) / nLump;
    const rr = Math.sqrt(1 - y * y);
    const th = k * golden + rng() * 0.5;
    lumps.push({ c: new Vector3(Math.cos(th) * rr, y, Math.sin(th) * rr), a: 0.7 + rng() * 0.3 });
  }
  const W = 0.085; // lebar sudut benjolan (1 - cos)
  const lumpAt = (d: Vector3, tilt: Vector3 | null) => {
    let best = 0;
    for (const L of lumps) {
      const v = L.a * Math.exp(-(1 - d.dot(L.c)) / W);
      if (v > best) {
        best = v;
        // condongkan sumbu buah menjauhi pusat benjolan → benjolan membulat
        if (tilt) tilt.copy(d).addScaledVector(L.c, -d.dot(L.c)).multiplyScalar(1.6 * v);
      }
    }
    return best;
  };
  const tilt = new Vector3();
  for (let i = 0; i < nFruit; i++) {
    const y = 1 - (2 * (i + 0.5)) / nFruit;
    const rr = Math.sqrt(1 - y * y);
    const th = i * golden + rng() * 0.3;
    nrm.set(Math.cos(th) * rr, y, Math.sin(th) * rr);
    tilt.set(0, 0, 0);
    const bump = lumpAt(nrm, tilt);
    const layer = 0.78 + 0.3 * bump + rng() * 0.06;
    pos.set(nrm.x * R * layer, nrm.y * H * layer, nrm.z * R * layer);
    out.set(nrm.x / R, nrm.y / H, nrm.z / R).normalize().add(tilt);
    out.x += (rng() - 0.5) * 0.3;
    out.z += (rng() - 0.5) * 0.3;
    out.normalize();
    qq.setFromUnitVectors(yAxis, out);
    const fl = fruitLen * (0.85 + rng() * 0.3);
    sc.set(fl * 0.42, fl * 0.5, fl * 0.42);
    pos.addScaledVector(out, fl * 0.3);
    fm.compose(pos, qq, sc).premultiply(m);
    // paparan: puncak benjolan & sisi atas tandan lebih gelap; celah oranye terang
    const expo = Math.min(1, Math.max(0, bump * 0.85 + 0.25 * (y + 0.3) + (rng() - 0.5) * 0.3));
    const tipDark = 0.22 + 0.5 * expo; // porsi ujung yang hitam-ungu
    const redSpan = 0.35 + 0.25 * expo;
    const purple = rng() < 0.45;
    const shade = 0.82 + 0.18 * bump + rng() * 0.08;
    b.addGeo(fruitGeo, fm, (_x, ly, _z, o) => {
      const t = (ly + 1) / 2; // 0 pangkal → 1 ujung
      o.copy(C.fruitBase).lerp(C.fruitMid, smooth(0.12, 0.12 + redSpan, t));
      o.lerp(purple ? C.fruitPurple : C.fruitTip, smooth(1 - tipDark, 1.0, t));
      o.multiplyScalar(shade);
    });
  }
  // inti tandan gelap (terbaca sbg bayangan celah) menutup lubang antar buah → siluet padat
  fm.compose(new Vector3(), new Quaternion(), new Vector3(R * 0.82, H * 0.82, R * 0.82)).premultiply(m);
  b.addGeo(coreGeo, fm, (x, ly, z, o) => {
    o.copy(C.fruitTip).lerp(C.fruitMid, 0.3 + 0.15 * Math.sin(x * 9 + ly * 7 + z * 5));
  });
  // duri/brakteola gelap di celah antar benjolan (ciri TBS sawit)
  const nSp = Math.round(nFruit * 0.22);
  for (let i = 0; i < nSp; i++) {
    const y = 0.9 - (1.8 * (i + 0.5)) / nSp;
    const rr = Math.sqrt(1 - y * y);
    const th = i * golden * 1.618 + 1.3;
    nrm.set(Math.cos(th) * rr, y, Math.sin(th) * rr).normalize();
    const bump = lumpAt(nrm, null);
    const layer = 0.78 + 0.25 * bump;
    pos.set(nrm.x * R * layer, nrm.y * H * layer, nrm.z * R * layer);
    qq.setFromUnitVectors(yAxis, nrm);
    const L = fruitLen * (0.8 + rng() * 0.5);
    pos.addScaledVector(nrm, L * 0.5);
    fm.compose(pos, qq, sc.set(fruitLen * 0.08, L, fruitLen * 0.08)).premultiply(m);
    b.addGeo(spikeGeo, fm, (_x, ly, _z, o) => o.copy(C.stalk).lerp(C.barkDark, 0.4 + ly * 0.6));
  }
  // tangkai tandan (pendek, coklat-hijau) di sisi -Y
  fm.compose(new Vector3(0, -H * 0.8 - stalkLen * 0.5, 0), new Quaternion(), new Vector3(R * 0.3, stalkLen, R * 0.3)).premultiply(m);
  b.addGeo(stalkGeo, fm, (_x, ly, _z, o) => o.copy(C.stalk).multiplyScalar(0.8 + 0.3 * (ly + 0.5)));
}

/* -------------------------------------------------------------- shader */
function makeSwayMaterial(uniforms: { uTime: { value: number }; uWind: { value: number } }) {
  const mat = new MeshStandardMaterial({
    vertexColors: true,
    side: DoubleSide,
    roughness: 0.78,
    metalness: 0,
  });
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = uniforms.uTime;
    shader.uniforms.uWind = uniforms.uWind;
    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        '#include <common>\nattribute vec2 aSway;\nuniform float uTime;\nuniform float uWind;',
      )
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        {
          float ph = aSway.y + modelMatrix[3].x * 1.7 + modelMatrix[3].z * 1.3;
          float sw = aSway.x * uWind;
          transformed.x += (sin(uTime * 1.15 + ph) * 0.022 + 0.008) * sw;
          transformed.z += cos(uTime * 0.93 + ph * 1.31) * 0.018 * sw;
          transformed.y += (sin(uTime * 1.6 + ph) * 0.012
                         + sin(uTime * 5.3 + position.x * 41.0 + position.z * 37.0) * 0.004) * sw;
        }`,
      );
  };
  mat.customProgramCacheKey = () => 'palm-frond-sway-v1';
  return mat;
}

/* ------------------------------------------------------------------ kit */
export function createPalmKit(opts?: { quality?: 'high' | 'low' }): PalmKit {
  const q: Quality = opts?.quality ?? 'high';
  const uniforms = { uTime: { value: 0 }, uWind: { value: 1 } };

  const matTrunk = new MeshStandardMaterial({ vertexColors: true, roughness: 0.95, metalness: 0, flatShading: true });
  const matFrond = makeSwayMaterial(uniforms);
  const matFruit = new MeshStandardMaterial({ vertexColors: true, roughness: 0.42, metalness: 0 });
  const materials: Material[] = [matTrunk, matFrond, matFruit];

  const geos: BufferGeometry[] = [];
  const track = <T extends BufferGeometry>(g: T) => (geos.push(g), g);

  // geometri primitif sumber (tidak dirender langsung)
  const fruitSrc = new SphereGeometry(1, q === 'high' ? 6 : 5, 3);
  const spikeSrc = new ConeGeometry(1, 1, 3, 1, true);
  const stalkSrc = new SphereGeometry(1, 5, 2); // dipakai skala memanjang sbg tangkai
  stalkSrc.scale(1, 0.5, 1);
  const coreSrc = new SphereGeometry(1, q === 'high' ? 9 : 7, q === 'high' ? 7 : 5); // inti tandan

  let trunkGeo: BufferGeometry | null = null;
  const crowns = new Map<number, CrownInfo>();
  const fruits = new Map<number, BufferGeometry>();
  const ffbs = new Map<number, BufferGeometry>();

  const getTrunk = () => (trunkGeo ??= track(buildTrunk(q)));
  const getCrown = (n: number) => {
    let c = crowns.get(n);
    if (!c) {
      c = buildCrown(n, q, n);
      track(c.geo);
      crowns.set(n, c);
    }
    return c;
  };
  const getFruit = (count: number) => {
    let g = fruits.get(count);
    if (!g) {
      const rng = mulberry32(900 + count);
      const b = new Builder(false);
      const nF = q === 'high' ? 124 : 62;
      const m = new Matrix4(), qq = new Quaternion(), dir = new Vector3();
      for (let i = 0; i < count; i++) {
        const az = (i / count) * Math.PI * 2 + 0.6 + (rng() - 0.5) * 0.5;
        dir.set(Math.cos(az), 0, Math.sin(az));
        // sumbu tandan: keluar & sedikit naik, terselip di ketiak pelepah
        const axis = dir.clone().multiplyScalar(0.8).add(new Vector3(0, 0.45 + rng() * 0.2, 0)).normalize();
        qq.setFromUnitVectors(new Vector3(0, 1, 0), axis);
        // T9b V-1: ×1,7 dari ukuran T7b, digeser keluar agar tak tertutup pangkal pelepah
        const R = 0.064 + rng() * 0.01;
        const center = dir.clone().multiplyScalar(trunkRadius(1) + R * 1.25).setY(TRUNK_H - 0.05 - rng() * 0.02);
        m.compose(center, qq, new Vector3(1, 1, 1));
        addBunch(b, m, rng, R, R * 1.3, nF, 0.032, 9, fruitSrc, stalkSrc, 0.03, spikeSrc, coreSrc);
      }
      g = track(b.build());
      fruits.set(count, g);
    }
    return g;
  };
  const getFfb = (v: number) => {
    let g = ffbs.get(v);
    if (!g) {
      const rng = mulberry32(4242 + v * 17);
      const b = new Builder(false);
      // T9b V-7: tandan oval memanjang berbenjol (±0,18 × 0,14), bukan bola halus
      const R = 0.051;
      const m = new Matrix4().compose(
        new Vector3(0, R * 0.95, 0),
        new Quaternion().setFromAxisAngle(new Vector3(0, 0, 1), Math.PI / 2 - 0.16),
        new Vector3(1, 1, 1),
      );
      addBunch(b, m, rng, R, R * 1.45, q === 'high' ? 270 : 135, 0.021, 12 + v * 2, fruitSrc, stalkSrc, 0.035, spikeSrc, coreSrc);
      g = track(b.build());
      ffbs.set(v, g);
    }
    return g;
  };

  return {
    tree(seed: number): Group {
      const rng = mulberry32(seed * 7919 + 13);
      const nFronds = FROND_VARIANTS[Math.floor(rng() * FROND_VARIANTS.length)];
      const nTbs = 2 + Math.floor(rng() * 3);
      const crown = getCrown(nFronds);
      const root = new Group();
      root.name = `palm-tree-${seed}`;
      const inner = new Group();
      const trunk = new Mesh(getTrunk(), matTrunk);
      trunk.name = 'palm-trunk';
      const fronds = new Mesh(crown.geo, matFrond);
      fronds.name = 'palm-fronds';
      const fruit = new Mesh(getFruit(nTbs), matFruit);
      fruit.name = 'palm-ffb';
      inner.add(trunk, fronds, fruit);
      const s = (1 / crown.maxY) * (0.94 + rng() * 0.12);
      inner.scale.setScalar(s);
      inner.rotation.set((rng() - 0.5) * 0.09, rng() * Math.PI * 2, (rng() - 0.5) * 0.09);
      root.add(inner);
      root.userData = { palm: true, fronds: nFronds, tbs: nTbs, height: crown.maxY * s };
      return root;
    },
    ffb(seed: number): Group {
      const rng = mulberry32(seed * 104729 + 7);
      const g = new Group();
      g.name = `palm-ffb-${seed}`;
      const mesh = new Mesh(getFfb(Math.floor(rng() * 2)), matFruit);
      mesh.name = 'palm-ffb-harvested';
      mesh.rotation.y = rng() * Math.PI * 2;
      mesh.scale.setScalar(0.95 + rng() * 0.1);
      g.add(mesh);
      return g;
    },
    update(t: number, wind = 1) {
      uniforms.uTime.value = t;
      uniforms.uWind.value = wind;
    },
    dispose() {
      for (const g of geos) g.dispose();
      geos.length = 0;
      crowns.clear();
      fruits.clear();
      ffbs.clear();
      trunkGeo = null;
      fruitSrc.dispose();
      stalkSrc.dispose();
      spikeSrc.dispose();
      coreSrc.dispose();
      for (const m of materials) m.dispose();
    },
  };
}
