# T9c — Fallback SVG diorama sawit (Programmer C) — Ready 2026-10-08

## Perubahan (Hero.astro: HANYA komentar + isi `<svg>` di `.fallback`; blok `<style>` tidak disentuh)
- V-4: symbol `agd-tbs` digambar ulang = gerombol oval lonjong (rx 5.4 × ry 8.6) dari ±40 butir elips memanjang dipak per baris, warna per jarak dari sorot oranye → merah → hitam-ungu di tepi, + tangkai. Tanpa titik hitam besar/“kaki”. Dipakai di pohon (3/pohon) dan 2 TBS panen rebah di tepi jalan (skala 1.2–1.35, terpisah).
- V-5: wedge batuan segitiga transparan dihapus → elips radial-gradient lembut (opacity .38→0) di bawah ujung pulau.
- V-6 (bantu): pulau melayang membulat (kontur elips bergelombang, Catmull-Rom), atas rumput + bibir rumput, sisi laterit desaturasi (#9a5a3e→#5e2f22) + 2 garis strata, bagian bawah meruncing gelap (#5a3022→#1c1210) dengan retakan. 5 sawit: 3 belakang + 2 depan, jalan panen laterit melintang di tengah (clipPath ke permukaan atas). Rim mint belakang / emas depan dipertahankan.
- `<symbol>`/`<use>`, id `agd-*` (baru: agd-soil, agd-rock, agd-shd, agd-clip), role=img, aria-label diperbarui (“pulau tanah melayang … di tepi jalan”).
- Ukuran SVG: 12 226 bytes (sebelumnya 7 475).
- Generator: `python3 qa/out-t7c/gen-svg.py` (direvisi; versi T7c: qa/out-t9c/gen-svg.t7c.bak.py). insert.py lama tidak diubah (regexnya masih cocok).

## Verifikasi
- `node qa/out-t9c/shots.mjs t9c` (Chrome --disable-webgl --disable-3d-apis, DPR 2, :3000): is-3d=false, SVG 1280 = 538×467, 375 = 160×139 (sama dgn T7c), 0 console error.
- Screenshot: qa/out-t9c/t9c-{1280,375}-{art,rm,nowebgl}.png; preview zoom: qa/out-t9c/p3.png, p3-tbs.png. Review vision: TBS terbaca tandan lonjong berbenjol + tangkai, bukan kepik/ceri.

## Belum / catatan
- Belum dibandingkan berdampingan dengan diorama 3D final A/B (warna/sudut).
- 375: ujung pelepah pohon kiri-belakang menyentuh ujung baris teks “strategis.” (posisi/ukuran SVG ditentukan CSS milik A — T9a V-2/T-3).
- TBS panen di 1280 kecil (±20 px CSS); jika klien ingin lebih menonjol, naikkan skala di `hs` gen-svg.py.
- 768 & landscape tidak di-screenshot; `npm run build` tidak dijalankan (tugas A).
