# T7c — Fallback SVG diorama mini kebun sawit (Programmer C) — Ready 2026-10-08

## Perubahan (hanya src/components/Hero.astro blok `.fallback` + CSS `.fallback`)
- SVG tetes minyak diganti ilustrasi isometrik 3/4: pulau tanah melayang (atas rumput, sisi laterit merah 2 nada + garis strata, bibir rumput, bagian bawah meruncing), jalan panen laterit + parit kecil antar baris, 6 pohon sawit (2 baris × 3), piringan tanah + bayangan tiap pohon, 2 TBS dipanen di tepi jalan, 6 partikel emas. Rim mint di tepi belakang, rim emas di tepi depan.
- Sawit (bukan kelapa): batang pendek-tebal dengan pangkal pelepah bersisik berselang-seling, roset 18 pelepah melengkung (3 lapis warna belakang/tengah/depan) dengan anak daun dua bidang, 3 TBS di ketiak pelepah (gradien oranye→merah→kehitaman + butir buah).
- Reuse: `<symbol>` agd-fr (pelepah), agd-tbs (tandan), agd-palm (pohon) + `<use>`. Semua id berawalan `agd-`. 7 475 bytes.
- `role="img"`, aria-label: "Ilustrasi diorama kebun kelapa sawit: pulau tanah dengan barisan pohon sawit berbuah dan tandan buah segar hasil panen". Komentar HTML di atas blok diperbarui.
- CSS: `.fallback svg` width 100% / height auto / max-height 86%, drop-shadow lebih lembut + kilau emas tipis; ≤760px: `justify-items:end` + width 76% agar tak menimpa tombol "Tentang Agrinas".
- Sumber dapat di-regenerate: `python3 qa/out-t7c/gen-svg.py && python3 qa/out-t7c/insert.py` (insert hanya mengganti blok fallback).

## Verifikasi
- animations.ts: 3D hanya bila `!reduced && hasWebGL()` → reduced-motion & no-WebGL memakai SVG ini (juga saat kanvas belum siap / gagal).
- `node qa/out-t7c/shots.mjs v2` (Chrome --disable-webgl, dev :3000): 1280 SVG 538×467, 375 SVG 160×139; is-3d=false, 0 console error. Screenshot qa/out-t7c/v2-{1280,375}-{nowebgl,rm,art}.png direview vision: utuh, tak menabrak teks.
- `npm run build` exit 0 (log qa/out-t7c/build.log).

## Belum
- Belum dibandingkan berdampingan dengan diorama Three.js final A/B (sudut kamera/warna bisa sedikit beda → lompatan transisi SVG→kanvas belum dicek).
- Viewport 768 dan babak 2/3 tidak di-screenshot.
