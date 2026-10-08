# QA-T10 teknis (QA-C) — re-test T9 + T11

Mulai 2026-10-08. Dev :3000 (milik user, tidak disentuh), preview :4420 (QA-C).

## Cek 1 — `npm run build`: PASS
- exit 0, `1 page(s) built in 658ms`, real 1,99 s, 0 baris "error"; hanya [WARN] vite chunk size (three.js lazy). Log: `qa/out-t10a-build.log`.

## Cek 2 — harness regresi dev :3000 (`node qa/t7-check.mjs --out qa/out-t10a`, 55 s): Overall PASS
- canvas-visible PASS (1280 kanvas 538×624 @653,88; 375 210×276 @165,416) · overlap-text PASS (maks 1280-b1 h1 0,4%, 1280-b2 h2 0,01%, 375 0) · draw-calls PASS 21 (tri 179 212 @1280 / 81 876 @375) · no-webgl PASS · reduced-motion PASS (0 piksel berubah) · console WARN 0 error / 5 warning (GPU headless).
- Bukti: `qa/out-t10a/report.md`, `qa/out-t10a.log`.

## Cek 3 — `OUT=qa/out-t10a-extra node qa/t8a-extra.mjs --only a,b,c,d,e` (2 m 01 s, 0 error): PASS
| ukuran/babak | kanvas | overlap teks (diff piksel) | vs T8 |
|---|---|---|---|
| 768 b1 | 399×311 @345,611 (di bawah tombol) | 0 | T8: p.lead 11,77% → **0** |
| 768 b2 | 474×393 @-15,570 | 0 | T8: p.body 3,69% → 0 |
| 768 b3 | 413×337 @323,598 | 0 | — |
| 1440 b1/b2/b3 | 560×700 @757,100 / 704×833 @80,34 / 605×725 | b2 h2 0,98%, p.body 0,72% (<2%) | T8 0,01 → naik tapi <2% |
| 375×812 sebelum/sesudah rotasi | 210×276 @165,416 | 0 | sama |
| 812×375 | rect 0×0 (disembunyikan) | 0 | T8 terpotong → disembunyikan (lihat cek 4) |
- Resize 1280→700→1280→500→900→375→1280: kanvas = stage = buffer tiap langkah, mem geo 12/tex 3/prog 6 konstan, frames maju.
- Leak scroll ×5: geo 12 / tex 3 / prog 6 konstan. Back (dev, bukan bfcache): reload → is-3d kembali.
- CPU 4× @375 (SwiftShader): rAF/render 30,3→29→30,3 fps, throttled=false.
- Anchor nav: di luar hero framesAdv 0; kembali #beranda is-3d, render jalan (3/4).
- Catatan harness: flag `clipped`/`content` bbox kini terganggu oleh lapisan latar T11 yang ikut berubah (bbox diff melebar ke luar kanvas, mis. 1440-b1 R=true, 375 bbox y=924 > vh) → klip dinilai lewat screenshot, bukan flag.
- Bukti: `qa/out-t10a-extra/result.json`, `a-768-0.png`, `a-1440-0.45.png`, `qa/out-t10a-extra.log`.

## Cek 11 — grep sisa: PASS (catatan minor)
- `src/pages` = hanya `index.astro`; `dist` = 1 HTML (`dist/index.html`), 0 string "t11" di dist → route /t11-preview tidak ada.
- `hero-sawit1.webp` tidak diimpor di src mana pun (grep hanya `hero-sawit1-blur.webp` di HeroBackdrop.astro:11, di-inline base64); tidak ada `*sawit*` di `dist/_astro`. File asli `src/assets/agrinas/hero-sawit1.webp` kini yatim (tidak di-bundle → tanpa dampak runtime) → R-x minor/kebersihan.

## Cek 4 — T-4 tinggi ≤500px (812×375, 667×375; `qa/t10c-check.mjs --only 4`, `qa/t10c-land.mjs`): **FAIL (teks), objek OK**
- Objek: `.object` display:none (`Hero.astro:235 @media (max-height:500px)`), kanvas rect 0×0 → tak ada kanvas terpotong. ✔
- Render berhenti: `stats.frames` 1→1 dalam 1 s, callback rAF `frame` +0, `place` (backdrop) +0 (load langsung landscape). Rotasi 375×812→812×375: frames +0, rAF frame +0; kembali ke 375×812 → kanvas 210×276 @165,416, render lanjut, quality low→high→low (rebuilds 2), mem 12/3/6. ✔ overflow-x 0. 0 error.
- Teks **tidak utuh**: hero tidak di-pin pada ≤500px (no pin-spacer, section 1429 px) tetapi crossfade babak tetap terikat scroll. 812×375 y=0: p.lead 323–449 & tombol "Tentang Agrinas" 481–529 (di bawah lipatan 375); y=120: tombol opacity 0,06, babak 1 sudah memudar & bertumpuk dengan babak 2 ("Energi hijau untuk negeri.") → CTA & akhir lead tak pernah terbaca. 667×375 sama (tombol 396–444, op 0,06 di y=120). Bukti `qa/out-t10c/land-812-y0.png`, `land-812-y120.png`, `land-667-y*.png`. → **R-1**.
- Ruang kosong: kanan kosong tetapi ada **bayangan lantai/sorotan yatim** (elips gelap 325×77 @471,235 di 812; 320×76 @320,191 di 667) tanpa objek di atasnya → **R-2**. Bukti `qa/out-t10c/c4-812x375-b1.png`, `c4-667x375-b1.png`.

## Cek 5 — 375×812 babak 1 (`--only 5`, DPR 1): PASS
- Kanvas 210×276 @165,416; kotak kanvas vs kotak tombol (geometri) 32,52% "Tentang Agrinas" / 5,09% "Lini Bisnis" — tetapi itu area transparan. **Piksel objek** (diff kanvas tampil vs hidden, ambang 30): bbox 181×177 @183,474; piksel di kotak tombol/ baris teks = **0** (semua baris h1/p.lead/eyebrow + 2 tombol). Jarak: baris terakhir "…dan strategis." bawah y=407 → objek mulai y=474 (**67 px**); tombol "Lini Bisnis" kanan x=173 → objek x≥183 (**10 px**). Angka 3,89% programmer = overlap kotak, bukan piksel.
- SVG fallback (tanpa WebGL): opacity 0,75, rect 160×139 @215,485, piksel bbox 147×124 @224,489, piksel di teks/tombol = **0**; jarak ke "strategis." 82 px. SVG pra-crossfade (browser WebGL, 600 ms setelah DOMContentLoaded) identik, 0 piksel. Tidak mereproduksi "SVG menyentuh 'strategis.'".
- Bukti: `qa/out-t10c/c5-375-b1.png`, `c5-375-b1-svg.png`, `c5-375-b1-svg-prepaint.png`, `qa/out-t10c/result.json` (R.c5).

## Cek 7 — T-2 resize 1280→375→1280→375→1280 (`--only 7`): PASS
| vw | quality | rebuilds | mem geo/tex/prog | kanvas | framesAdv/0,7 s |
|---|---|---|---|---|---|
| 1280 | high | 0 | 12/3/6 | 538×624 | 5 |
| 375 | low | 1 | 12/3/6 | 210×272 | 5 |
| 1280 | high | 2 | 12/3/6 | 538×624 | 5 |
| 375 | low | 3 | 12/3/6 | 210×272 | 6 |
| 1280 | high | 4 | 12/3/6 | 538×624 | 5 |
- 0 error/pageerror. `throttled` tetap true di SwiftShader (lambat sungguhan) — pemulihan tak bisa dibuktikan headless; jalur kode ada (`hero3d.ts:412-415`). Cek 3-d (GPU lebih cepat) throttled=false.

## Cek 8 — HeroBackdrop (`--only 8`): PASS
- Pusat `.spot` = pusat `[data-hero-object]` tepat (0 px) di semua babak: 1280 b1 (922,400) b2 (384,400) b3 (896,400); 375 b1 (270,554) b2 (203,262) b3 (158,213). `.floor` di bawah pusat (+162/+195/+169 px @1280), lebar 0,86× objek.
- rAF berhenti: hero di luar layar 3 s → callback `place` 0, getBoundingClientRect objek 0, rAF `frame` (3D) 0; scroll roda ×10 di luar hero → place 0. Di dalam hero diam 2 s → place 0 (berhenti setelah 12 frame stabil); 3D frame tetap jalan (60/2 s, wajar).
- Tanpa JS: `[data-hero-bg]` ada (1×, rect 0,0 1280×1897), spot default = pusat objek (922,400 @1280; 270,737 @375), overflow-x 0. Bukti `qa/out-t10c2/c8-nojs-1280.png`, `c8-nojs-375.png`, `qa/out-t10c2/result.json`.

## Cek 6 — T-5 bfcache: PASS (diverifikasi runtime ASLI)
- `qa/t8a-bfcache.mjs` (Playwright launch, preview :4420): marker hilang → bukan restore bfcache (Playwright mematikan bfcache lewat flag default); setelah reload 3D boot ulang (is-3d, kanvas). 1 error = 404 halaman `/404-qa` buatan skrip.
- `qa/t9a-pagehide.mjs` (event sintetis, dev): pagehide persisted → framesAdv 0, kanvas tetap; pageshow persisted → framesAdv 36, is-3d; pagehide !persisted → dispose, SVG opacity 1 visible; 0 error.
- **Baru `qa/t10c-bfcache.mjs`** (Chrome diluncurkan manual + connectOverCDP, tanpa flag Playwright; navigasi ke /favicon-192.png lalu back): **headless=new dan headed** → `pageshow.persisted=true`, marker window bertahan (restore bfcache asli), `Page.backForwardCacheNotUsed` = tidak ada; setelah back: is-3d, kanvas terhubung 538 px, SVG opacity 0, 0 error. Screenshot headed: diorama tampil utuh (`qa/out-t10c/bfcache-headed-after-back.png`). (Catatan: `page.goBack()` default menunggu `load` → timeout 30 s pada restore bfcache; pakai `waitUntil:'commit'`.)

## Cek 9 — kontras teks hero (`qa/t10c-contrast.mjs`, teks dibuat transparan → piksel latar di kotak elemen; rata-rata & persentil-90 terang): PASS
| vp/babak | elemen | warna | latar rata2 | CR rata2 | CR terburuk (p90) |
|---|---|---|---|---|---|
| 1280 b1 | eyebrow | #A1DBB3 | (6,18,11) | 12,1 | 12,0 |
| 1280 b1 | h1 | #F4F5F0 | (14,33,22) | 15,4 | 13,1 |
| 1280 b1 | p.lead | F4F5F0 α.88 | (16,39,27) | 11,4 | 10,8 |
| 1280 b1 | tombol outline "Lini Bisnis" | #F4F5F0 | (19,39,28) | 14,4 | 13,9 |
| 1280 b1 | tombol solid | #07150E on (234,235,231) | — | 15,6 | — |
| 1280 b2 | h2 / p.body | | (16,38,26)/(17,40,27) | 14,6 / 11,3 | 13,2 / 10,5 |
| 1280 b3 | tombol solid hijau (putih) | #FFF on (25,119,52) | — | 5,63 | 5,21 |
| 375 b1 | eyebrow / h1 / p.lead / outline | | | 12,2 / 16,7 / 11,8 / 13,2 | 12,0 / 15,8 / 10,6 / 12,8 |
| 375 b2/b3 | eyebrow/h2/p.body | | | ≥9,9 | ≥9,0 |
| 375 b3 | tombol solid hijau | | | 5,85 | 5,28 |
- Minimum keseluruhan 5,21:1 (tombol solid hijau babak 3, teks 13 px) ≥ 4,5. Baris "p.ctas <<FAIL" di log = artefak (kotak wadah memuat tombol putih solid), bukan teks. Bukti `qa/out-t10c/contrast.json`, `contrast-bg-*.png`.

## Cek 10 — Lighthouse mobile (`node qa/t7-check.mjs --lh --only lh --out qa/out-t10a-lh{1..4}`, berurutan, port 4420): PASS (median 92)
| run | Perf | LCP | TBT | FCP | catatan |
|---|---|---|---|---|---|
| 1 | **62** | 4,0 s | 1 170 ms | 1,8 s | long task 1 641 ms `ScrollTrigger.*.js`, bootup 3 843 ms (run pertama setelah build; pola sama dgn T-1) |
| 2 | 92 | 3,1 s | 70 ms | 2,1 s | |
| 3 | 92 | 3,1 s | 80 ms | 2,1 s | |
| 4 (tambahan) | 92 | 3,1 s | 80 ms | 2,1 s | |
- Median 3 run wajib = 92 (≥90). Elemen LCP (semua run): `<img class="field" src="data:image/webp;base64,…" width="480" height="147">` (foto blur inline HeroBackdrop) — LCP 3,1 s ≈ masih jauh dari FCP 2,1 s. Outlier run 1 = T-1 (variansi cold start, mungkin beban QA-D paralel), bukan regresi.
- Bukti `qa/out-t10a-lh{1,2,3,4}/lighthouse-mobile.report.json`, `.log`.

## Proses
- Preview :4420 yang saya mulai sudah dimatikan; Chrome CDP :9333/9334 milik skrip bfcache dimatikan. Dev :3000 tidak disentuh.
- Skrip baru (qa/ saja): `qa/t10c-check.mjs` (cek 4/5/7/8), `qa/t10c-land.mjs`, `qa/t10c-bfcache.mjs`, `qa/t10c-contrast.mjs`.

## Bug
- **R-1 major (sudah ada sejak sebelum T9 — juga terlihat di `qa/out-t8a-extra/a-rot-812x375.png`)** — landscape tinggi ≤500 px (812×375, 667×375): hero tidak di-pin tetapi crossfade babak tetap terikat scroll; tombol CTA (812: y 481–529; 667: y 396–444) di bawah lipatan dan sudah memudar (opacity 0,06) saat scroll 120 px, babak 1 bertumpuk dengan babak 2 → CTA & akhir paragraf lead tak pernah terbaca. Repro: `node qa/t10c-land.mjs` → `qa/out-t10c/land-812-y0.png`, `land-812-y120.png`. Keputusan "sembunyikan objek" sendiri rapi; masalahnya tata letak/animasi teks (animations.ts/Hero.astro, bukan lingkup T9a).
- **R-2 minor (baru, T11)** — pada tinggi ≤500 px, `.spot`/`.floor` HeroBackdrop tetap tampil di posisi default (elips bayangan gelap 325×77 @471,235 pada 812×375) padahal objek disembunyikan → "bayangan tanpa objek". Skrip `place()` keluar saat `o.width===0` tanpa menyembunyikan. Saran: sembunyikan `.spot,.floor` di `@media (max-height:500px)`. Bukti `qa/out-t10c/c4-812x375-b1.png`, `c4-667x375-b1.png`.
- **R-3 minor (kebersihan)** — `src/assets/agrinas/hero-sawit1.webp` tak lagi diimpor di mana pun (hanya `hero-sawit1-blur.webp`); tidak masuk dist, tanpa dampak runtime.
- R-4 info — harness `t8a-extra.mjs` flag `clipped`/bbox kini bias karena latar T11 ikut berubah saat kanvas disembunyikan; perlu disesuaikan bila dipakai lagi.

## Status temuan lama (QA-T8)
| ID | status | bukti |
|---|---|---|
| T-1 LH outlier | **tetap muncul** (run1 62, cold start ScrollTrigger) — median 92; tidak diperbaiki sesuai keputusan PM | cek 10 |
| T-2 quality/throttle | **fixed** — quality high↔low tiap lintas 760 (rebuilds 4), mem konstan, 0 error | cek 7 |
| T-3 768 tabrak teks | **fixed** — 11,77% → 0 (b1), 3,69% → 0 (b2) | cek 3 |
| T-4 812×375 terpotong | **fixed** (objek disembunyikan, render berhenti) — tetapi lihat R-1 (teks) & R-2 | cek 4 |
| T-5 bfcache | **fixed** — restore bfcache asli (persisted=true) headless & headed: diorama tampil, 0 error | cek 6 |

## Ringkasan
| Cek | Hasil | Angka |
|---|---|---|
| 1 build | PASS | exit 0, 1 page, 1,99 s |
| 2 harness t7-check | PASS | overlap maks 0,4%, 21 calls, 0 error |
| 3 t8a-extra a–e | PASS | 768 overlap 0 (T8 11,77%); 1440 maks 0,98%; mem konstan; CPU4× 29–30 fps |
| 4 tinggi ≤500 | **FAIL (teks, R-1)** / objek PASS | frames +0, kanvas 0×0; CTA tak terjangkau; bayangan yatim (R-2) |
| 5 375 b1 overlap | PASS | piksel 0 di teks/tombol; jarak 67 px ke "strategis.", 10 px ke tombol; SVG 0 piksel, 82 px |
| 6 bfcache | PASS | persisted=true, is-3d, kanvas tampil (headless & headed) |
| 7 T-2 resize | PASS | quality berganti ×4, geo12/tex3/prog6, 0 error |
| 8 HeroBackdrop | PASS | spot = pusat objek (0 px) b1/b2/b3; place 0 cb di luar hero & saat diam; no-JS [data-hero-bg] ada |
| 9 kontras | PASS | min 5,21:1 (tombol hijau b3); teks hero ≥10,5:1 |
| 10 LH mobile | PASS | 62 / 92 / 92 (+92); median 92; LCP = img.field inline 3,1 s |
| 11 grep sisa | PASS | pages=index.astro, dist 1 HTML, 0 "t11"; hero-sawit1.webp yatim (R-3) |

VERDICT: FAILED — satu-satunya penyebab R-1 (major, sudah ada sejak T1/T8, di luar perubahan T9/T11: CTA hero tak terjangkau pada landscape tinggi ≤500 px). Semua perbaikan T9 (T-2..T-5) dan T11 lulus; bila PM menerima R-1 sebagai tiket terpisah, hasil T9+T11 = PASSED dengan R-2/R-3 minor.
