# QA-T5b — retest final agrinas-landing (branch agrinas-palma, 7 file uncommitted) — 2026-10-07

Build: `npm run build` OK (1 page). Disajikan `astro preview --port 3001` (3000 tidak disentuh). Bukti: qa/out-t5b-retest/.

| ID | Hasil | Bukti |
|---|---|---|
| K1 link berita hero | PASS | dist/index.html: 2× href `/news/Dukung%20E20,%20…Multifeedstock`; curl live → title "Dukung E20, Agrinas Palma dan IPB University…" |
| V1/V2 anchor header+footer | PASS | t5-anchor 375/768/1280: ALL PASS, top 72; 375 diulang 3× → 11/11 PASS tiap run (anchor375-r{1,2,3}.log) |
| V3 Tab instan / smooth nav | PASS | t5-tab 3 lebar ALL PASS (tab.log) |
| Counter #angka | PASS | t5-counter 375 & 1280 PASS, lebar konstan, overflowX 0 |
| X1 (375px footer landing salah) | TIDAK TERBUKTI | 4 run 375 + 3 lebar, 0 kejadian; tidak ada repro → bukan bug |
| X5 (404 gambar berita) | TIDAK TERBUKTI | 13 aset `_astro/berita-*` yang dirujuk ada semua; console 0 error |
| Harness (preview prod): overflow | PASS | 0 el. keluar viewport 375/768/1280 |
| Variants (reduced-motion, no-js, no-webgl) | PASS | 0 el. tak terlihat, 0 error — X4 tidak muncul lagi (no-webgl@1280 0 el.) |
| Console | PASS | 0 error/warning unik |
| Credits | PASS | 44 aset = 44 baris CREDITS |
| Lighthouse (4 run) | PASS | mobile P89, P92, P92, P92 (A100 BP100 SEO100); desktop P100. Run pertama P89 (<90) sekali, tidak berulang (X3 sejenis) |

## Catatan (MINOR, tidak memblokir)
- **M1 — langkah IPS 01–08 saat flick ekstrem (200px/50ms ≈ 4000px/s):** t5-kemitraan mode "cepat" FAIL pada kriteria ketat (opacity maks saat di viewport 0,2–0,89; 1280 langkah 06 = 0,2). Semua langkah opacity 1 begitu scroll berhenti (endOp 8/8 di semua mode). Mode scroll biasa, pola harness, dan kilat PASS. Sama dengan X2 di QA-T5; bukan regresi. Repro: `PORT=3001 node qa/t5-kemitraan.mjs 1280x800`.

## Belum teruji
- Browser selain Chrome (Safari/Firefox), perangkat sungguhan (hanya emulasi viewport), jaringan lambat, konten vs situs live selain K1 (K2/K3/K7–K10 tidak diulang; hanya mengandalkan QA-T5 sebelumnya).

## Verdict: LULUS (dengan catatan M1 minor)
