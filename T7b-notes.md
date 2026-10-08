# T7b — Kit sawit prosedural (Programmer B) — READY 2026-10-08

File: `src/scripts/hero3d/palm.ts` (Three r186). Preview dev (bukan produksi): `qa/t7b-preview/`.

## API (persis kontrak TASKS.md)
```ts
export interface PalmKit { tree(seed:number): Group; ffb(seed:number): Group; update(t:number, wind?:number): void; dispose(): void; }
export function createPalmKit(opts?: { quality?: 'high'|'low' }): PalmKit;
```

## Desain
- Batang: grid lathe, radius ~0.074 (mentah) + flare pangkal; sisik = kisi belah-ketupat 2 keluarga spiral (5/−8 parastichy, 9 sel), sawtooth → tepi potongan pangkal pelepah menghadap atas; vertex color (celah gelap, tonjolan terang, bercak lumut, atas lebih segar); flatShading.
- Mahkota: filotaksis sudut emas, 18/21/23/26 pelepah (varian di-cache); pelepah tua bawah melengkung turun, muda tegak. Rakis = prisma segitiga meruncing; anak daun sempit 6-vert, 2 sisi, kelompok 3 sudut (naik/turun/datar) + jitter → tampak "berbulu" khas sawit.
- TBS: buah lonjong (Sphere low-poly diskala) di permukaan ovoid berlapis + duri gelap + tangkai; gradasi pangkal merah-oranye → ujung hitam/ungu; bagian atas tandan lebih gelap. 2–4 tandan di ketiak pelepah.
- ffb: tandan rebah (sumbu ~horizontal), diameter ~0.146, panjang ~0.18, 2 varian geometri.
- Angin: material pelepah MeshStandardMaterial + onBeforeCompile (attr `aSway` vec2 = bobot, fase; uniform uTime/uWind bersama; fase per pohon dari modelMatrix posisi). customProgramCacheKey 'palm-frond-sway-v1'.
- Normalisasi: grup dalam diskala sehingga tinggi total ≈ 1.0 × (0.94–1.06). Rasio batang ≈ 46–48% tinggi.

## Angka terukur (preview, Chrome headless)
- Draw call per pohon: 3 (palm-trunk, palm-fronds, palm-ffb); ffb terpanen: 1.
- Vertex per pohon HIGH: 25.7k–34.6k (batang 5.5k; pelepah 13.4k–19.4k; buah 6.7k (2 TBS)–13.4k (4 TBS)). LOW: 12.0k–16.1k (batang 2.2k; pelepah 6.9k–10k; buah 2.9k–5.9k). ffb: 7.0k high / 3.1k low.
- Geometri DIBAGI: maksimal 1 batang + 4 mahkota + 3 buah + 2 ffb = 10 geometri per kit, berapa pun jumlah pohon. Material: 3 total.
- dispose(): jumlah geometri renderer 21 → 14 (sisa milik scene preview). 0 console error. Sway: frame t=0 vs t=2.1 berbeda (shader jalan).
- tsc strict (typescript@5 via npx, skipLibCheck) atas palm.ts + preview: 0 error. (Repo tidak punya typescript lokal → `npx tsc` proyek tidak bisa dijalankan tanpa install.)

## Catatan integrasi untuk Programmer A
- `import { createPalmKit } from './hero3d/palm';` — buat 1 kit, panggil `kit.update(t, wind)` tiap frame (murah: hanya set 2 uniform). reduced-motion: panggil sekali `update(0, 0)`.
- `tree()` mengembalikan Group root (posisi/rotasi bebas diatur A); di dalamnya grup `inner` sudah berotasi/miring/diskala per seed — jangan reset `children[0]`.
- Shadow: pelepah bergoyang via vertex shader; bayangan (depth material default) TIDAK ikut bergoyang — tak terlihat pada amplitudo kecil. Set castShadow/receiveShadow sendiri di traverse.
- Material DoubleSide di pelepah; transparan tidak dipakai (tak ada sorting).
- Untuk perf: anak daun ~1.4k verteks/pelepah high. 6 pohon high ≈ 180k verteks / 18 draw call. Mobile pakai `quality:'low'` (~50%).
- compileAsync: material shader ter-patch saat kompilasi pertama; panggil renderer.compileAsync(scene, camera) setelah pohon ditambah.
- `userData` root: `{ palm:true, fronds, tbs, height }` (berguna untuk QA).

## Belum terverifikasi
- Belum dilihat di scene hero asli (cahaya/kamera A, latar foto) — hanya di preview latar gelap + matahari hangat.
- Lighthouse/fps mobile belum diukur (tanggung jawab A/QA).
- Bayangan tidak ikut goyang (lihat di atas).

## Preview
`npx esbuild qa/t7b-preview/main.ts --bundle --outfile=qa/t7b-preview/out.js && node qa/t7b-preview/shot.mjs` → `qa/t7b-preview/shots/{wide,tree,trunk,ffb}-high.png`, `wide-low.png`. `node qa/t7b-preview/sway.mjs` cek goyang. Tanpa server (file://).
