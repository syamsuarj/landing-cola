# QA-T8 teknis (QA-A) — T7 diorama sawit

Mulai 2026-10-08. Dev :3000 (milik user), preview :4420 (QA-A).

## Cek 1 — `npm run build`: PASS
- exit 0, 1 page, real 2,57 s. Log: `qa/out-t8a-build.log`. Hanya [WARN] vite chunk size (chunk `hero3d.*.js` 553 659 B = three.js, lazy — bukan blocker).

## Harness dev :3000 (`node qa/t7-check.mjs --out qa/out-t8a`, 55 s): Overall PASS
- screenshots PASS · canvas-visible PASS (1280 kanvas 538×624 @653,88; 375 kanvas 210×276 @165,416)
- overlap-text PASS: maks 1280-b1 h1#judul-hero 1,48% (<2%); lainnya 0
- draw-calls PASS: 21 calls semua babak; triangles 171 172 @1280 / 78 376 @375 (catatan: tinggi utk mobile, tapi lulus)
- no-webgl PASS (SVG opacity 1 / 0,75; aria-label "Ilustrasi diorama kebun kelapa sawit: …")
- reduced-motion PASS (0 piksel berubah, is-3d=false)
- console WARN: 0 error, 5 warning (GPU headless ReadPixels + KHR_parallel_shader_compile)
- Bukti: `qa/out-t8a/report.md`, `qa/out-t8a.log`

## Cek 7 — referensi lama 'tetes minyak' / geometri mati: PASS
- `grep -rniE 'tetes|droplet|bead|cherry' src` → 0 hit relevan (hanya "minyak CPO"/"minyak nabati" konten FilosofiLogo & CSS drop-shadow). hero3d.ts 379 baris, palm.ts 556 baris.

## AC7 Lighthouse mobile (build + preview :4420): PASS (3/4 run), 1 outlier
| run | Perf | LCP | TBT | bukti |
|---|---|---|---|---|
| 1 (dgn build) | **79** | 3,6 s | 420 ms | qa/out-t8a-lh/ |
| 2 | 92 | 3,2 s | 20 ms | qa/out-t8a-lh2/ |
| 3 | 92 | 3,2 s | 20 ms | qa/out-t8a-lh3/ |
| 4 | 92 | 3,2 s | 20 ms | qa/out-t8a-lh4/ |
- Run 1: long task 887 ms di `ScrollTrigger.*.js` (bootup 1 894 ms vs 252 ms run lain) — cold start segera setelah build / beban mesin (QA-B paralel); chunk hero3d tidak muncul di jendela LH (lazy, boot load+3,5 s+idle). Dianggap variansi lingkungan, bukan regresi T7 → **T-1 minor** (catat; median 92).

## Cek 3 — resize lintas 760 px (1280→700→1280→500→900→375→1280, dev): PASS
- 0 error. Kanvas selalu = ukuran stage & buffer (mis. 700: 392×272; 500: 280×272; 375: 210×272; 1280: 538×624). Render terus jalan (frames maju tiap langkah). memory tetap geometries 12 / textures 3 / programs 6.
- Catatan (T-2 minor): `quality` low/high diputuskan sekali saat init (`hero3d.ts:183`), tidak berubah setelah resize — tidak crash, hanya desktop→mobile tetap 'high' (171k tri). Juga `stats.throttled` sekali true tidak pernah pulih (`hero3d.ts:345-347`) — di headless jadi true setelah resize pertama → render ~¼ rAF selamanya di sesi itu.
- Bukti: `qa/out-t8a-extra/result.json` → R.b, `qa/t8a-extra.mjs`

## Cek 4 — leak/dispose: PASS (scroll) · bfcache lihat di bawah
- Scroll ke dasar ↔ atas 5×: geometries 12→12→12→12→12→12, textures 3 konstan, programs 6 konstan; 0 error.
- about:blank → back (dev): nav type `back_forward` tetapi **bukan** restore bfcache (marker window hilang; dev server ber-WebSocket HMR mencegah bfcache) → halaman di-load ulang, 3D boot ulang normal (is-3d, mem 12/3).

## Cek 6 — anchor nav header (#tentang, #berita, #kontak, #beranda, #bisnis, #beranda @1280): PASS
- Di luar hero: render berhenti (framesAdv 0, IntersectionObserver). Kembali ke #beranda: y=0, is-3d, kanvas 538×624 @653,88, render lanjut (framesAdv 5/3), overlap h1 1,86% (<2%), 0 error. Bukti: `qa/out-t8a-extra/e-final-beranda.png`.

## Cek 5 — CPU 4× @375 (isMobile, DPR 2), rAF 3 s: PASS (dgn catatan)
| GPU | base rAF/render fps | 4× rAF/render fps |
|---|---|---|
| headless default (GPU) | 30,3 / 30,3 | 30,3 / 30,3 (throttled=false, dpr 2) |
| SwiftShader (software) | 25 / 25 | 30,3 / **7,7** (throttled=true, dpr→1) |
- Main thread tetap ≥25 fps. Render 7,7 fps hanya di SwiftShader (mode throttled = render 1 dari 4 frame, `hero3d.ts:322`) — tidak representatif GPU nyata. Bukti: `qa/out-t8a-extra/result.json` R.d, `qa/out-t8a-extra-gpu/result.json`.

## Cek 2 — 768 / 1440 / rotasi 375↔812: **FAIL**
Metode: diff piksel screenshot kanvas tampil vs hidden, dihitung di kotak h1/h2/p/.btn hero (`qa/t8a-extra.mjs`, R.a). overflow-x = 0 di semua ukuran.
| ukuran/babak | kanvas | piksel objek di kotak teks | visual |
|---|---|---|---|
| 1440 b1/b2/b3 | 560×700 @757,100 | h1 0,01% / 0 / 0 | OK, utuh (`a-1440-0.png`) |
| 768 b1 | 353×700 @422,162 | **p.lead 11,77%**, p.ctas 36,03% (kotak p, bukan tombol) | mahkota sawit tepat di belakang "melalui"/"berkelanjutan"; pulau ±10 px dari tombol LINI BISNIS (`a-768-0.png`) |
| 768 b2 | 483×802 @35,111 | p.body 3,69%, h2 0,13% | tepi kanan pulau masuk ke baris "PT Agrinas…" (`a-768-0.45.png`) |
| 768 b3 | — | 0 | OK |
| 375×812 (sebelum/sesudah rotasi) | 210×276 @165,416 | 0 | OK |
| 812×375 landscape | 374×293 @633,188 (melewati viewport kanan 812 & bawah 375) | 0 | **diorama hampir seluruhnya di luar layar** — hanya sudut kecil di pojok kanan bawah (`a-rot-812x375.png`) |

## Cek 4b — bfcache (preview :4420, `qa/t8a-bfcache.mjs`): TIDAK TERVERIFIKASI
- Headless Chrome tidak me-restore dari bfcache (marker hilang → reload penuh); setelah reload 3D boot ulang normal, 0 error JS (satu 404 = halaman `/404-qa` buatan QA).
- Analisis kode: `pagehide` → dispose + `forceContextLoss` + `canvas.remove()` (`hero3d.ts:361-369`), tanpa handler `pageshow` (grep `pageshow|persisted` src = 0) dan `#hero-art.is-3d` tidak dilepas → bila browser nyata me-restore dari bfcache, area objek kemungkinan kosong (SVG tersembunyi oleh is-3d, kanvas sudah hilang). → **T-5 minor (risiko)**.

## Bug
- **T-1 minor** — LH mobile variansi: 1 dari 4 run = 79 (TBT 420 ms, long task 887 ms ScrollTrigger chunk, tepat setelah build); 3 run lain 92. Repro: `node qa/t7-check.mjs --lh --only lh`. Bukti qa/out-t8a-lh{,2,3,4}/.
- **T-2 minor** — quality low/high & `throttled` diputuskan sekali, tak pernah dievaluasi ulang setelah resize/beban turun (`hero3d.ts:183, 345-347`).
- **T-3 major** — 768×1024: objek menabrak teks hero babak 1 (p.lead 11,77%) dan babak 2 (p.body 3,69%). Repro: `node qa/t8a-extra.mjs --only a` → `qa/out-t8a-extra/a-768-0.png`, `a-768-0.45.png`.
- **T-4 major** — 812×375 landscape: kanvas @633,188 374×293 keluar viewport; diorama tidak terlihat utuh (hanya pojok). Repro sama → `a-rot-812x375.png`. (Kemungkinan tata letak `.object` lama, tapi cek 2 meminta utuh.)
- **T-5 minor** — bfcache restore setelah dispose pagehide tidak ditangani (tak terverifikasi runtime, lihat 4b).

## Ringkasan
| Cek | Hasil | Angka |
|---|---|---|
| 1 build | PASS | exit 0, 2,57 s |
| harness dev (AC 6/7/8/9 sebagian) | PASS | 21 calls, overlap maks 1,48%, 0 error |
| LH mobile ×4 | PASS (median) | 79 / 92 / 92 / 92 |
| 2 768/1440/rotasi | **FAIL** | 768 p.lead 11,77%; 812×375 terpotong |
| 3 resize lintas 760 | PASS | 0 error, kanvas = stage |
| 4 leak scroll ×5 | PASS | geo 12 / tex 3 / prog 6 konstan |
| 4b bfcache | tak terverifikasi | risiko T-5 |
| 5 CPU 4× | PASS | GPU 30 fps; SwiftShader render 7,7 fps |
| 6 anchor nav | PASS | kembali #beranda: is-3d, render jalan |
| 7 grep sisa | PASS | 0 hit |

VERDICT: FAILED (T-3, T-4 major — layout 768 & landscape; inti teknis 3D lulus)
