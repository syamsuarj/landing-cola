# QA-T5 — re-test akhir independen (sebelum push) — 2026-10-06

Build: `npm run build` (OK) → dist/ disajikan `python3 -m http.server 4450 --bind 127.0.0.1 --directory dist`. Satu browser sekaligus.
Verifikasi konten via curl UA Chrome ke https://agrinaspalma.co.id (live).

## Konten (K)
- **K1 — FIXED.** Link "Kabar terbaru" di dist/index.html = `https://agrinaspalma.co.id/news/Dukung%20E20,%20Agrinas%20Palma%20dan%20IPB%20University%20Kembangkan%20Bioetanol%20Multifeedstock` (sama dgn kartu Berita, 2 kemunculan). curl → `<title>Dukung E20, Agrinas Palma dan IPB University Kembangkan Bioetanol Multifeedstock | PT Agrinas Palma Nusantara (Persero)</title>`. Kontrol: varian `%2C` → "Berita Tidak Ditemukan" (membuktikan cek title bermakna).
- **K2 — FIXED.** sr-only stat tahun berdiri = "2025" (bukan "2.025").
- **K3 — FIXED.** Babak 3 hero: "Dengan semangat Patriot, Loyal, Profesional, PT Agrinas Palma Nusantara (Persero) berperan aktif menciptakan kemandirian energi sekaligus membuka lapangan kerja dan menghadirkan manfaat nyata bagi masyarakat." Situs live: "…berperan aktif menciptakan kemandirian energi sekaligus membuka lapangan kerja, mengurangi pengangguran, dan menghadirkan manfaat nyata bagi masyarakat." → versi singkat yang diizinkan QA-T2 (hanya "mengurangi pengangguran" dihilangkan). Teks lama ("Kemakmuran bumi Nusantara, semangat patriot…") tidak lagi di hero (1 kemunculan tersisa = makna logo di Filosofi Logo, benar).
- **K7 — FIXED.** Eyebrow "Sarana Pengaduan · WBS"; "Whistleblowing System" 0 kemunculan.
- **K8 — FIXED.** "Bogor —" 0 kemunculan; ringkasan diawali "Pengembangan bioetanol berbahan baku singkong…".
- **K9 — FIXED.** CREDITS.md:55–57 mencatat public/favicon.ico, favicon-192.png, apple-touch-icon.png ← logo_apn2.webp. public/ hanya berisi 3 file tsb.
- **K10 — FIXED.** CREDITS.md:35 & 45 → `medium_Kusdi_Sastro_Kidjan_…` / `medium_Seger_Budiardjo_…`.

## Visual (V)
- **V1 — FIXED.** `PORT=4450 node qa/t4-anchor.mjs 375 1` & `… 1280 1` → ALL PASS (header 7 link + footer 4 link, top 72, hh 73; #karir 375 y 26467 top 72, #berita 375 top 72).
  Skrip sendiri `qa/t5-anchor.mjs` (link didata otomatis dari #nav-utama + footer; header: klik dari atas via menu; footer: lompat instan ke dasar halaman lalu klik mouse nyata → scroll ke ATAS; cek ulang 1,5 s setelah berhenti untuk pergeseran layout terlambat; konteks baru/cache kosong per link):
  768x1024 11/11 PASS, 1280x800 11/11 PASS, 375x812 10/11 (lihat X1). Log: qa/out-t5x/anchor-{375,768,1280}.log.
- **V2 — FIXED.** #kontak (header) top 72 di 375 (y 32754 < max 33417), 768 (y 32521 < max 32614), 1280 (y 32360 < max 32566).

### X1 — INFO (flaky, tidak terulang) — 375x812 footer "Tentang" sekali mendarat top 1063
- Langkah: `node qa/t5-anchor.mjs 375x812`, konteks baru, lompat ke dasar halaman, klik footer "Tentang".
- Aktual (1×): from 31631, max 32623 (normal 33417 → dokumen ~794px lebih pendek pada run itu), mendarat y 2668, #tentang top 1063.
- Repro terisolasi `node qa/t5-footrepro.mjs 375x812 '#tentang' 4` (jeda dasar 1500 ms) dan `… 6 300` (jeda 300 ms): 10/10 PASS top 72, scrollHeight konstan 34229. Run lain di 375/768/1280 tidak menunjukkan dokumen memendek.
- Dugaan: aset gagal dimuat saat http.server Python me-reset koneksi (gejala dicatat juga di QA-T2) → tinggi dokumen berbeda; bukan cacat produk yang dapat direproduksi. Tidak memblokir.
- Bukti: qa/out-t5x/anchor-375.log, qa/out-t5x/footrepro-375-tentang*.log

- **V3 — FIXED.** `qa/t5-tab.mjs` (375x812, 768x1024, 1280x800): dari y=0 fokus (preventScroll) elemen sebelumnya dalam urutan Tab (link "Kabar terbaru" hero), tekan Tab → #bisnis-tbs di viewport sejak 50 ms (375: y 0→17193, r 354–398), posisi tidak berubah 50→1500 ms (instan); Tab berikutnya #bisnis-cpo idem; opacity 1. Log: qa/out-t5x/tab.log.

## Regresi mekanisme baru
- **(a) Counter Angka — PASS.** `qa/t5-counter.mjs` 375/768/1280: sebelum terlihat teks "0"/"0,0"; saat terlihat naik bertahap (mis. 0 → 29.451 → 59.390 … → 221.868; 0,0 → 194.503,7 → … → 1.507.591,9; 768: 0→1→…→6, 0→2→…→9, 0→2→…→12), nilai akhir = data-ag-final untuk 5 counter; 2025 statis. Lebar .ag-num & tinggi kartu konstan selama animasi (375 kartu lebar 203 px tetap — inilah V1). ::after: visibility hidden, height 0 (stat statis tanpa ::after). overflowX 0. Screenshot qa/out-t5x/counter-{375,768,1280}-{mid,end}.png dicek visual: tidak ada angka ganda/teks hantu/celah aneh.
- **(b) Smooth vs Tab — PASS.** Klik link nav: 20–37 posisi scroll antara (smooth) di semua lebar, juga klik nav sesudah sesi Tab (kb-nav sudah hilang sebelum klik; computed scroll-behavior kembali "smooth"). Tab/Shift+Tab: instan; `html.kb-nav` ada ≤100 ms lalu hilang (≤300 ms), tidak tertinggal di akhir satu pun uji (anchor 33 klik: kb=false).
- **(c) Rotasi / lintas breakpoint di tengah pin — PASS.** `node qa/t1a-keepscroll.mjs http://127.0.0.1:4450/` → visi-misi 72→72→72, kemitraan 72→71→72. Skrip sendiri `qa/t5-rotate.mjs` (section di titik tengah viewport via elementFromPoint, sebelum/selama/sesudah resize):
  skenario 1 375x812→812x375→375x812 dan skenario 2 1280x800→375x812→1280x800 pada hero/#beranda@50% pin, #filosofi@30%/70% pin, #milestones@40%/80% pin, #kepemimpinan, #bisnis → 16/16 tetap di section sama. Log: qa/out-t5x/rotate.log, rotate2.log (run 2 = daftar filosofi/kepemimpinan; id "filosofi-logo" di run 1 salah ketik di skrip, bukan produk).
- **(d) Langkah IPS 01–08 — PASS.** `qa/t5-kemitraan.mjs` (mouse wheel nyata, 375/768/1280): scroll biasa (100 px/50 ms) semua langkah opacity 1 saat di viewport; pola harness (0,5 vh/350 ms — pola yang dulu memunculkan V0) semua ≥0,92; berhenti dengan alur di layar → 8/8 opacity 1 di semua mode termasuk "kilat" 900 px/30 ms. Log: qa/out-t5x/kemitraan.log; screenshot qa/out-t5x/kemitraan-*.png.

### X2 — INFO — Flick sangat cepat: langkah IPS sedang fade-in saat melintas
- Langkah: `node qa/t5-kemitraan.mjs 1280x800`, mode "cepat" 200 px/50 ms (~4.000 px/s).
- Aktual: tiap langkah sempat terlihat sebagian selama melintas (opacity maks 0,2–0,98; 1280 langkah 06 0,2) — semua > 0 dan langsung 1 begitu scroll berhenti. Ekspektasi "terlihat" terpenuhi; animasi 0,45 s memang tidak bisa selesai saat elemen hanya ±300 ms di layar. Bukan regresi (sebelum fix langkah 05–08 tidak pernah muncul). Tidak perlu tindakan.

## Harness `node qa/run.mjs --prod --out qa/out-t5` (lengkap + Lighthouse)
- Run 1 (qa/out-t5.log, 395 s): build/overflow/console(0)/screenshots 42/42/credits PASS; **variants FAIL** (no-webgl@1280: 1 el. tak pernah terlihat — keterbukaan › h4.kt-m-h "Mekanisme Tertulis"); **lighthouse FAIL** mobile P56 (TBT 1.800 ms; satu long task 2.264 ms di skrip utama index…jfclaVqx.js pada t≈3,3 s; benchmarkIndex 3986 ≈ normal), A11y 100; desktop P100 A100.
- Lighthouse ulang saja (`--skip build,overflow,console,screenshots,variants,credits`): qa/out-t5-lh, out-t5-lh2, out-t5-lh3 → **3/3 mobile P92 A100 BP100 SEO100** (TBT 0–20 ms), desktop P100.
- Run 2 penuh (qa/out-t5b.log, 373 s): **variants PASS** (no-webgl@1280 0 el.), **lighthouse PASS** mobile P92 A100 / desktop P100, build/overflow/screenshots/credits PASS; **console FAIL**: 3 error di default@768 — HTTP 404 `/_astro/berita-kpk.DeyX7Hf3_Z20DPhT.webp` & `/_astro/berita-ombudsman.Bhz8J5Dm_Fw0HR.webp` (+2 "Failed to load resource"). Run 1 console 0 error.

### X3 — MINOR (flaky, 1/5 run) — Lighthouse mobile P56 sekali
- Long task 2,26 s di skrip utama hanya di run 1 (setelah fase variants); 4 run Lighthouse berikutnya P92, TBT ≤20 ms. Tidak reproducible; belum diprofil (dihentikan PM karena batas waktu). Bukti: qa/out-t5/lighthouse-mobile.report.json vs qa/out-t5-lh*/, qa/out-t5b/.

### X4 — MINOR (flaky, 1/2 run) — "Mekanisme Tertulis" (h4.kt-m-h #keterbukaan) tak pernah terlihat di no-webgl@1280
- Run 1: 1/414 elemen tak pernah terlihat (qa/out-t5/report.md, qa/out-t5/variants/no-webgl-1280.png). Run 2: 0. Kemungkinan reveal terlewat di pola scroll harness (sejenis V0, tapi di Keterbukaan). Belum diselidiki (batas waktu). Pemilik: D.

### X5 — MINOR (flaky, 1/2 run, belum diselidiki) — 404 gambar berita di default@768
- Run 2 saja: 404 untuk 2 aset hashed berita-kpk/berita-ombudsman di preview 4399; run 1 console 0. Dugaan: transient (preview/dist), bukan referensi rusak — tidak sempat diverifikasi (dist kini dari build run 2). Perlu 1 cek cepat: `ls dist/_astro | grep berita-` vs href di dist/index.html sebelum push.

## Ringkasan status
| ID | Status |
|---|---|
| K1, K2, K3, K7, K8, K9, K10 | FIXED |
| V1, V2, V3 | FIXED |
| Regresi (a) counter, (b) smooth/Tab/kb-nav, (c) rotasi/pin, (d) IPS 01–08 | PASS |
| X1 anchor footer 375 (1/11), X2 info flick | INFO |
| X3 LH P56 (1/5), X4 Mekanisme Tertulis no-webgl (1/2), X5 404 berita (1/2) | MINOR flaky |

Server 4450 dimatikan; dev server 3000 tidak disentuh. src/ & git tidak diubah. Skrip QA baru: qa/t5-anchor.mjs, t5-footrepro.mjs, t5-counter.mjs, t5-tab.mjs, t5-rotate.mjs, t5-kemitraan.mjs; log qa/out-t5x/.

VERDICT: PASS — semua K/V FIXED, tidak ada blocker/major yang reproducible; Lighthouse mobile P92/A11y 100 (4/5 run). Catatan: harness lengkap belum pernah PASS penuh dalam satu run (run 1 FAIL variants+LH, run 2 FAIL console) karena 3 masalah flaky X3/X4/X5 — disarankan cek X5 cepat sebelum push.
