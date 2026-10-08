# T11 — Background hero baru (Programmer D)

## Fase 1 (selesai)
- `src/components/HeroBackdrop.astro` (BARU): root `.backdrop` absolute inset 0, z 0, aria-hidden, overflow hidden.
  - Latar studio: 2 radial (panggung kanan-tengah + kiri) di atas linear ink → ink-2 → ink; vinyet `::after`.
  - `.far[data-hero-bg]` = lapisan yang di-zoom animations.ts (scale 1.02→1.14), berisi kontur + foto.
  - Kontur topografi: SVG inline prosedural di frontmatter (PRNG seeded → deterministik), 3 "bukit" (kanan-bawah 17 cincin,
    kiri-bawah 13, atas 9), 22 titik/cincin, kurva Q bilangan bulat. Mint .09 / emas .08, garis indeks tiap ke-5 emas .16;
    1px `vector-effect: non-scaling-stroke`; mask radial memudar ke tepi.
  - Foto kebun: `src/assets/agrinas/hero-sawit1-blur.webp` (BARU, 480×147, **1,2 KB**) — 55% bawah hero-sawit1 (tanpa pabrik),
    di-blur (σ5 di 480px ≈ 18px di 1720px) + duotone ink→hijau→emas, di-bake via sharp (tanpa CSS filter). Tampil 38% bawah, opacity .17, mask gradien ke atas.
  - `.spot` (glow emas lembut) + `.floor` (bayangan elips + rim emas tipis) + `.mist` (kabut mint tipis + fade ke --c-ink di bawah).

## Keputusan desain
- Glow mengikuti diorama TANPA edit animations.ts: skrip kecil di HeroBackdrop membaca `getBoundingClientRect()` dari
  `[data-hero-object]` (sudah ter-transform GSAP) di rAF saat scroll/resize/pageshow, hanya saat hero terlihat (IntersectionObserver),
  lalu menulis `translate` ke .spot/.floor (komposit saja). Default CSS = posisi babak 1 (tanpa JS / reduced-motion juga benar).
  Dipilih ketimbang "dua glow kiri-kanan" karena panggung tunggal lebih kuat memisahkan objek.
- Kepadatan kontur: ±39 cincin desktop; mobile (≤760) cincin minor disembunyikan (≈ separuh) dan mask radial dimatikan.
- Mobile ringan: tanpa CSS blur/backdrop-filter sama sekali; foto pre-blur 1,2 KB.
- LCP: foto hero 1720px (94 KB) dihapus dari hero. Foto pre-blur di-inline sebagai data URI (≈1,6 KB base64) karena versi `<img src fetchpriority=low>` menjadi elemen LCP yang terlambat.


## Fase 2: integrasi (setelah T9a Ready, ±10:13)
- Hero.astro (sempit): import `Image`+`hero-sawit1.webp` → `import HeroBackdrop`; 3 div .bg/.shade/.glow → `<HeroBackdrop />`;
  aturan CSS .bg/.bg-img/.shade/.glow dihapus (desktop, ≤1023 .shade, ≤760 .glow). animations.ts TIDAK diubah ([data-hero-bg] kini di `.far`).
- Skrip pelacak: mengikuti per frame sampai posisi stabil 12 frame (scrub GSAP 0,6 s masih bergerak setelah event scroll berhenti — versi awal tertinggal di babak 2).
- Ukuran kontur di HTML: 39 path, 17,2 KB mentah / 7,3 KB gzip.
- Pratinjau sementara `src/pages/t11-preview.astro` + `qa/t11-preview.mjs` sudah DIHAPUS.

## Verifikasi (hasil asli)
- `npm run build` → exit 0 (1 halaman; hanya warning chunk-size lama).
- `node qa/t7-check.mjs --out qa/out-t11-check` → **Overall PASS** (overlap 1280-b1 h1 0,38%, lainnya tidak ada; 0 console error, 5 warning noise GPU headless; no-webgl & reduced-motion PASS).
- Lighthouse mobile (`--lh --only lh`, :4420):
  - qa/out-t11-lh: **70 FAIL** — LCP 3,3 s (elemen LCP = img blur fetchpriority=low), TBT 930 ms (long task 1,1 s di chunk ScrollTrigger; variansi lingkungan, tak berulang).
  - qa/out-t11-lh2 (setelah data URI): **92 PASS** — LCP 3,0 s, TBT 50 ms, FCP 2,1 s.
  - qa/out-t11-lh3: **93 PASS** — LCP 3,0 s, TBT 30 ms. (Sebelumnya t9a-lh2: 91, LCP 3,2 s.)
- Screenshot sesudah: `qa/out-t11/` (qa/t11-shots.mjs, turunan t8b): 1280/1440/768/375 b1–b3, rm-1280/375, nogl-1280/375 b1–b3. Sebelum: `qa/out-t8b/`.
  Vision: diorama terpisah jelas dari latar gelap di semua lebar; glow+bayangan elips ikut babak 1 kanan / 2 kiri / 3 kanan; teks terbaca; fallback SVG jelas.

## Belum terverifikasi / catatan
- Foto kebun blur hampir tak terlihat (sengaja halus, opacity .17 di bawah kabut) — QA/klien mungkin minta sedikit lebih terang.
- Kontras numerik teks tidak diukur (latar lebih gelap dari sebelumnya, jadi ≥ kondisi lama).
- Lanskap 812×375 dan Safari/iOS tidak dicek; elemen LCP mobile masih img data-URI (3,0 s, ~0,9 s setelah FCP — sebab belum diselidiki).
