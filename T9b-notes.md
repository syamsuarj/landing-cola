# T9b — V-1 & V-7 palm.ts (Programmer B) — READY 2026-10-08

Hanya `src/scripts/hero3d/palm.ts` (+ preview `qa/t7b-preview/`, shots `qa/out-t9b/`). API/kontrak tidak berubah.

## Perubahan
- `addBunch()` ditulis ulang: ovoid memanjang (R, H terpisah) + ~9–16 **benjolan spikelet** (buah dikelompokkan, sumbu buah condong keluar dari pusat benjolan) + **inti gelap** (SphereGeometry kecil, dibagi) yang mengisi celah → siluet berbenjol padat, bukan bola halus / rangka.
- Warna buah: pangkal **oranye terang 0xff7d1a → merah 0xc0240f → ujung hitam 0x170810 / hitam-ungu 0x2e0c26**; buah di puncak benjolan (terpapar) ujungnya lebih gelap, di celah lebih oranye → benjolan terbaca dari jauh.
- V-1 TBS pohon: R 0.038→0.064–0.074 (×1,7), panjang H=1,3R, buah 0.015→0.032, 110→124 buah (low 55→62); pusat digeser keluar (trunkR + 1,25R) & turun 0.015 → tak tertutup pangkal pelepah.
- V-7 ffb: R 0.051, H 1,45R, 270 buah (low 135) ukuran 0.021, 12/14 benjolan per varian. Bbox (termasuk tangkai) ≈ 0.19–0.20 × 0.145–0.155.

## Angka sebelum → sesudah (preview, seed 1/2/3)
| | sebelum | sesudah | Δ |
|---|---|---|---|
| pohon HIGH (2 TBS / 4 TBS / 2 TBS) | 31 659 / 34 594 / 25 671 | 32 507 / 36 290 / 26 519 | +2,7…+4,9 % |
| pohon LOW | 15 111 / 16 130 / 12 039 | 15 495 / 16 898 / 12 423 | +2,5…+4,8 % |
| ffb HIGH / LOW | 7 010 / 3 058 | 8 130 / 3 290 | +16 % / +8 % |
| draw call | 3/pohon, 1/ffb | 3/pohon, 1/ffb | 0 |
| geometri kit (preview) | 21 → dispose 14 | 21 → dispose 14 | sama (+1 sumber `coreSrc`, di-dispose) |
Hero dev :3000 babak 1: 21 draw call (sama spt T8), 0 console error, is-3d true.

## Verifikasi
- tsc strict (typescript@5 via npx) palm.ts: 0 error.
- Preview: `qa/t7b-preview/shots/{wide,tree,ffb}-high.png`, `wide-low.png`, `ffb-low.png`; sebelum: `shots/before/`.
- Hero: `qa/out-t9b/1280-b1-art.png`, `375-b1-art.png` (script `qa/out-t9b/t9b-shots.mjs`). 1280: TBS jelas terbaca sbg tandan merah-oranye di ketiak; ffb di jalan lonjong berbenjol.

## Belum terverifikasi / catatan
- 375: TBS kecil (diorama kecil & di balik teks — layout milik A/T9a, sedang diubah paralel).
- ffb HIGH +16 % vertex (tak ada batas eksplisit untuk ffb; batas 15 % hanya per pohon — terpenuhi).
- Belum diuji di build produksi (A yang menjalankan build); tidak dilihat di 768/1440.
