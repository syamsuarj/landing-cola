# QA-T13 Visual & UX (QA-F, independen) — putaran 3, 2026-10-08

Skrip: `qa/t13b-shots.mjs` (mode main|orbit|land|alt), output `qa/out-t13b/` (log-*.txt + montase `m-*.png`). Dev server :3000 (tidak di-restart). Chrome GPU (metal); no-WebGL via `--disable-webgl --disable-3d-apis`.
Catatan: dock bulat di tengah bawah tiap screenshot = Astro dev toolbar (hanya dev) → bukan temuan.

## 1. W-1 terpotong tepi kanvas — **FIXED**
- 12 frame orbit babak 1 (1280×6, 1440×6, jeda 1,5 s) + crop tepi kanan kanvas: `qa/out-t13b/m-orbit-edge.png`. Tidak ada satu pun frame dengan pulau/pelepah/partikel terpotong garis lurus; tepi pulau berjarak ±60–100 px dari tepi kanan kanvas di semua sudut. Babak 2/3 1280/1440/1920 juga bersih (`m-desk23.png`).
- Ukuran: 1280 (`orbit-1280-2.png`) tetap proporsional & menonjol (pulau ≈ 30% lebar viewport, seimbang dengan judul). 1440 masih baik. 1920 lihat X-1.
- (Pemindaian alpha piksel kanvas mengembalikan 0 — WebGL tanpa preserveDrawingBuffer; penilaian murni visual.)

## 2. Tajuk lebih terang — **OK**
- Tajuk sawit kini terbaca jelas (pelepah kuning-hijau dengan rim, tandan merah terlihat) — `1280x800-b3.png` (crop), `orbit-1280-2.png`. Tanah laterit: sisi pulau coklat-merah gelap, tidak overexposed. Jalan setapak oranye agak "menyala" di babak 2/3 sudut atas → X-3 (taste).

## 3. Landscape 812×375 & 667×375 — **OK (R-1 FIXED)**
- Hero tanpa pin; babak 1→2→3 statis berurutan dengan pemisah garis, label nomor (02/03 emas), judul serif, CTA terlihat & terbaca. Objek 3D, glow & bayangan tersembunyi → tak ada noda (W-2 FIXED). `land-812x375-full.png`, `m-land812.png`, `m-land667.png`.
- Transisi ke section berikut: hero gelap → garis 4 warna → section terang; mulus, tidak ada celah/tumpuk.
- X-4 (taste): CTA babak 1 (putih/outline) vs babak 3 (hijau solid) tampil berdekatan di urutan statis → dua pasang CTA identik isi di satu layar-gulir.

## 4. W-3 SVG no-WebGL babak 2 — **FIXED**
- `nogl-1280x800-b2.png` / `m-alt1280.png`: tepi kanan SVG (≈x 583) ke awal judul "Energi hijau" (≈x 643) ≈ 55–60 px (≥24 px). Komposisi wajar, tidak janggal; bayangan tepat di bawah lempeng. ReducedMotion 1280/375 & no-WebGL 375 bersih (`m-alt375.png`). W-4 (gaya SVG lebih kartun vs 3D) masih ada — backlog, tidak dinilai.

## 5. Regresi — tidak ada
- 1920/1440/1280 b1–b3, 768 b1–b3, 375 b1–b3: tidak ada tumpuk objek-teks, glow/bayangan elips tepat di bawah diorama tiap babak, kontur emas/mint halus tetap, latar profesional. `m-desk23.png`, `m-768.png`, `m-375.png`, `1920x1080-b1.png`.

## Temuan baru
| ID | Severity | Lokasi | Screenshot | Saran |
|---|---|---|---|---|
| X-1 | taste | 1920×1080 babak 1 — kanvas tetap 560 px sehingga pulau ≈19% lebar layar; sisi kanan terasa agak kosong dibanding 1280 | `qa/out-t13b/1920x1080-b1.png` | Hero.astro: skala `#hero-art` dengan clamp (mis. `width: clamp(560px, 36vw, 720px)`) ≥1600 px; framing kamera tak perlu diubah |
| X-2 | taste | 768×1024 b2/b3 — diorama kecil di sepertiga bawah, area atas-kiri kosong | `qa/out-t13b/m-768.png` | opsional: naikkan skala objek tablet ±10% |
| X-3 | taste | jalan setapak oranye di permukaan pulau (b2/b3) sedikit terlalu jenuh/terang dibanding tajuk | `qa/out-t13b/1280x800-b3.png` | hero3d.ts: turunkan saturasi/emissive material jalan ±10–15% |
| X-4 | taste | landscape ≤500px: CTA babak 1 & 3 dobel | `qa/out-t13b/land-812x375-full.png` | sembunyikan CTA babak 3 di mode statis |

## Status
- W-1 FIXED · W-2 FIXED · W-3 FIXED · R-1 FIXED · W-4 backlog (taste)

## 6. Penilaian akhir keluhan klien
- (a) Objek 3D relevan: ya — pulau kebun sawit dengan pohon bertandan merah, jalan panen, tanah laterit; terbaca "kebun sawit" di semua lebar.
- (b) Background profesional & diorama terpisah jelas: ya — studio gelap berkontur + spot glow + bayangan lantai memisahkan objek; tanpa potongan kotak lagi, kesan premium-korporat konsisten.

## 3 screenshot terbaik
1. /Users/ilhamsyamsuar/workspace/projects/agrinas-landing/qa/out-t13b/orbit-1280-2.png
2. /Users/ilhamsyamsuar/workspace/projects/agrinas-landing/qa/out-t13b/m-orbit-edge.png
3. /Users/ilhamsyamsuar/workspace/projects/agrinas-landing/qa/out-t13b/land-812x375-full.png

VERDICT: PASSED
