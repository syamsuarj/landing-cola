# QA-T13 teknis (QA-E) — re-test putaran 3 (T12a/T12b)

Mulai 2026-10-08. Dev :3000 (milik user, tidak disentuh), preview :4420 (QA-E).

## Cek 1 — npm run build: PASS — exit 0, real 2,23 s, 0 baris error. Log qa/out-t13a-build.log

## Cek 2 — `node qa/t7-check.mjs --out qa/out-t13a` (dev :3000, 87 s): PASS
- Overall PASS, exit 0. Kanvas 1280 538×624 @653,88; 375 210×276 @165,416; overlap-text: tidak ada di 6 babak; draw calls 21 (tri 179 212/81 876); no-webgl PASS; reduced-motion 0 piksel; console 0 error / 5 warning (GPU headless). Bukti `qa/out-t13a/report.md`, `qa/out-t13a.log`.

## Cek 4 — R-1 lanskap ≤500 px (`node qa/t13e-land.mjs --only 4`; skrip baru, opasitas diukur pada h1/h2/p tiap babak, scroll langkah 150 px melewati hero): PASS
| vp | pin | tinggi section | babak 1 / 2 / 3 (top..bottom dok.) | opasitas teks | tumpang tindih (semua langkah scroll) | 5 link hero: op1 & penuh dalam viewport saat scroll | .spot/.floor |
|---|---|---|---|---|---|---|---|
| 812×375 | tidak | 1468 | 96–625 / 665–977 / 977–1424 | 1/1/1 | 0 baris | ya ×5 | display none |
| 667×375 | tidak | 1263 | 96–528 / 568–849 / 849–1219 | 1/1/1 | 0 baris | ya ×5 | display none |
- Urutan babak 1→2→3 menurun tanpa tumpang tindih (babak 2 bottom = babak 3 top, 0 px tumpang; jarak visual → QA-F).
- Tab keyboard (812×375 & 667×375): 5 fokus di #beranda ("Tentang Agrinas ↗", "Lini Bisnis ↘", "Kabar terbaru…", "Tentang Agrinas", "Lini Bisnis") — semua tergulir ke layar (top 157–230, bottom ≤295 < 375), opasitas 1, tidak visibility:hidden, `elementFromPoint` di pusat = elemen itu (tidak tertutup header). focusFail 0. 0 error.
- Bukti `qa/out-t13e/c4-812-y*.png`, `c4-667-y*.png`, `qa/out-t13e/result.json` (c4). Vs T10: CTA op 0,06 & bertumpuk → kini op 1, statis. **R-1 FIXED.**

## Cek 5 — rotasi/resize di halaman sama (`--only 5`, satu page, 375×812 → 812×375 → 375×812 → 1280×800 → 667×375 → 1280×800 → 1280×480 → 1280×800): PASS
| vp | pin | is-3d | kanvas | data-no-object | spot/floor | babak di p=0 / 0,53 / 0,92 (opasitas h1/h2 b1,b2,b3) | step | frames +0,7 s |
|---|---|---|---|---|---|---|---|---|
| 375×812 | ya | ya | 210×276 | tidak | block | [1,0,0] / [0,1,0] / [0,0,1] | 02 / 03 | 10 |
| 812×375 | tidak | (kelas tetap) | 0×0 | ya | none | statis [1,1,1], 0 tumpang | — | — |
| 375×812 | ya | ya | 210×276 | tidak | block | [1,0,0] / [0,1,0] / [0,0,1] | 02 / 03 | 10 |
| 1280×800 | ya | ya | 538×624 | tidak | block | [1,0,0] / [0,1,0] / [0,0,1] | 02 / 03 | 7 |
| 667×375 | tidak | — | 0×0 | ya | none | statis [1,1,1] | — | — |
| 1280×800 | ya | ya | 538×624 | tidak | block | idem | 02 / 03 | 7 |
| 1280×480 | tidak | — | 0×0 | ya | none | statis [1,1,1] (96–655/695–1110/1110–1617) | — | — |
| 1280×800 | ya | ya | 538×624 | tidak | block | idem | 02 / 03 | 7 |
- data-step di [data-hero-object] = 2 di babak 2. 0 console error/pageerror. Bukti `qa/out-t13e/c5-*.png`, result.json (c5).
- Catatan harness: deteksi pin harus `[data-hero-scene].closest('.pin-spacer')` (bukan parent #beranda); opasitas babak 1 harus diukur di anak (`main`), wadah [data-act=1] tetap op 1.

## Cek 3 — `OUT=qa/out-t13a-extra node qa/t8a-extra.mjs --only a,b,c,d,e`: PASS
- Run penuh: A–D selesai lalu GLOBAL TIMEOUT 170 s di E (dijalankan paralel dgn t7-check/t13e → kontensi CPU); E diulang sendiri `OUT=qa/out-t13a-extra-e … --only e` → selesai, exit 0. 0 error di kedua run.
| ukuran/babak | kanvas | overlap teks (diff piksel) |
|---|---|---|
| 768 p0 / 0,45 / 0,9 | 399×311 @345,611 / 474×393 @-15,570 / 413×337 @323,598 | 0 / 0 / 0 |
| 1440 p0 / 0,45 / 0,9 | 560×700 @757,100 / 704×833 @80,34 / 605×725 @706,88 | 0 / h2 0,07% / 0 (T10: 0,98%) |
| 375×812 → 812×375 → 375×812 | 210×276 → 0×0 → 210×276 | 0 |
- Resize lintas 760 (1280→700→1280→500→900→375→1280): kanvas = stage = buffer tiap langkah, geo 12/tex 3/prog 6 konstan.
- Leak scroll ×5: geo 12/tex 3/prog 6 konstan. Back (Playwright, bukan bfcache): is-3d kembali (after2). CPU 4× @375: rAF 32→29,3→28 fps, throttled=false. Anchor nav: di luar hero framesAdv 0 (#tentang/#berita/#kontak/#bisnis), kembali #beranda framesAdv 2–3, is-3d.
- Flag `clipped.R=true` di 1440-p0 & e_final 1280 (content bbox x 760+454=1214 > tepi kanvas 1191) = bias R-4 (bbox diff seluruh adegan termasuk glow/latar) → dinilai ulang dengan diff piksel khusus kanvas di cek 6.
- Bukti `qa/out-t13a-extra/result.json`, `qa/out-t13a-extra-e/result.json`, logs `qa/out-t13a-extra*.log`.

## Cek 6 — W-1 diorama vs tepi kanvas (GPU metal, orbit idle, babak 1/2/3): PASS
- **Skrip baru `qa/t13e-clip.mjs`** — diff piksel area kanvas: tampil vs `canvas{visibility:hidden}` (hanya kanvas berubah → glow/latar tak membiaskan, menjawab R-4), 6 sampel × 1,3 s per babak; piksel objek di 2 px tepi kanvas = **0** di semua 9 kombinasi. Jarak minimum objek→tepi (px):
| vp | babak 1 R/L/T/B | babak 2 | babak 3 |
|---|---|---|---|
| 1280×800 | **25**/125/112/158 | 145/140/145/143 | 85/112/99/141 |
| 1440×900 | **24**/144/140/190 | 154/149/171/188 | 92/118/131/161 |
| 1920×1080 | **24**/144/142/186 | 155/148/172/199 | 93/117/128/152 |
- `qa/t12a-fit.mjs` (proyeksi NDC verteks, programmer) diulang sendiri: maks |ndc| 0,910 (1280) / 0,915 (1440, 1920) → margin ≈ (1−0,915)/2×538 ≈ 23 px — konsisten dgn ukuran piksel saya (24 px). WORST 0,915 PASS.
- `clip-probe` (salinan `qa/t13e-clip-probe.mjs` → `qa/out-t13e/probe-clip-{1280,1440,1920}-{0..5}.png`): vision 3 crop tepi kanan (1280-2, 1440-4, 1920-5): ujung pulau & pelepah berakhir ±25 px sebelum tepi, tidak ada potongan lurus. clip-full tidak dijalankan ulang (redundan dgn t13e-clip semua babak).
- Vs T10 (W-1: terpotong di babak 1) → **W-1 FIXED**. Catatan: margin kanan babak 1 hanya ~24 px (tipis tapi tidak terpotong; nilai estetika → QA-F).

## Cek 7 — bfcache asli (preview :4420, Chrome manual + CDP): PASS (dengan catatan harness)
- `qa/t10c-bfcache.mjs` apa adanya: headless & headed → `Page.backForwardCacheNotUsed = CacheFlushed` (alasan sisi-browser, bukan pemblokir halaman), after: is-3d false → after2 (reload) is-3d true, kanvas 538, 0 error.
- Diagnosa: salinan `qa/t13e-bfcache.mjs` tanpa `p.setViewportSize()` (override Emulation CDP memicu flush) → **headless: pageshow.persisted=true, marker bertahan, is-3d true, kanvas 538 terhubung, SVG op 0, notUsed [], 0 error** (2 run, localhost & 127.0.0.1). Headed tetap CacheFlushed (2 run, juga skrip T10 yang dulu lulus) → kondisi browser/mesin (flush cache global), bukan alasan halaman; bila halaman tidak eligible, headless juga akan gagal dengan alasan halaman. Hero selalu kembali (restore atau reload). Bukti `qa/out-t13e/bfcache-headless-after-back.png`.

## Cek 8 — kontras (`node qa/t10c-contrast.mjs`, dev :3000): PASS
- Minimum teks nyata: tombol solid hijau babak 3 putih/(25,119,52) **5,63 rata2 / 5,21 p90** (1280), 5,85/5,28 (375). Teks hero lain ≥8,14 (scroll-cue), h1/h2 ≥13,1, p.lead/p.body ≥10,5, eyebrow ≥9,01 (p90). Baris `p.ctas <<FAIL` = artefak wadah (kotak memuat tombol putih solid), sama seperti T10. Log `qa/out-t13e/contrast.log`.

## Cek 9 — Lighthouse mobile 3× berurutan (`node qa/t7-check.mjs --lh --only lh --out qa/out-t13a-lh{1,2,3}`, :4420, build+preview otomatis): PASS
| run | Perf | LCP | TBT | FCP | CLS |
|---|---|---|---|---|---|
| 1 (pertama) | **92** | 3,0 s | 50 ms | 2,1 s | 0 |
| 2 | 92 | 3,0 s | 30 ms | 2,1 s | 0 |
| 3 | 93 | 3,0 s | 50 ms | 2,1 s | 0 |
- Median 92. Run pertama kali ini tidak outlier (T10: 62). Port 4420 bebas setelahnya. Bukti `qa/out-t13a-lh{1,2,3}/lighthouse-mobile.report.json`, `.log`.

## Cek 10 — kredit & aset terhapus: PASS
- Logika `checkCredits()` qa/run.mjs dijalankan terisolasi (`qa/t13e-credits.mjs`, salinan baris 399–414): **PASS — 44 aset di src/assets/agrinas, 44 baris CREDITS, 0 tak tercatat, 0 baris tanpa file, 0 tanpa sumber**.
- `grep -rn hero-sawit1 src` → hanya `HeroBackdrop.astro:11 …hero-sawit1-blur.webp`; `src/assets/agrinas` hanya `hero-sawit1-blur.webp`; CREDITS.md:23 mencatat versi blur (turunan). 0 import ke file terhapus; build exit 0 (cek 1) setelah penghapusan; 0 string "sawit1" di dist. **R-3 FIXED.**

## Proses
- Preview :4420 & Chrome CDP :9333/9334 yang saya mulai dimatikan (lsof 0). Dev :3000 tidak disentuh. src/** tidak diubah.
- Skrip baru (qa/ saja): `qa/t13e-land.mjs` (cek 4/5), `qa/t13e-clip.mjs` (cek 6, diff piksel khusus kanvas), `qa/t13e-clip-probe.mjs`, `qa/t13e-bfcache.mjs`, `qa/t13e-credits.mjs`; keluaran `qa/out-t13e/`.

## Bug / catatan
- Tidak ada bug baru severity major/minor.
- S-1 info (harness) — `t10c-bfcache.mjs`: `p.setViewportSize()` lewat CDP memicu `CacheFlushed`; mode headed di mesin ini kini selalu `CacheFlushed` (juga skrip T10 yang dulu lulus) → gunakan `qa/t13e-bfcache.mjs` headless untuk bukti restore asli.
- S-2 info (harness, R-4 lanjutan) — `t8a-extra.mjs` flag `clipped.R` masih true (1440-p0, e_final 1280) karena bbox diff seluruh adegan; ukuran benar = `qa/t13e-clip.mjs` (0 piksel objek di tepi, celah ≥24 px).
- S-3 info — margin kanan diorama babak 1 desktop hanya 24–25 px (NDC 0,915); tidak terpotong, tetapi sisa ruang tipis bila orbit/aset berubah lagi.
- S-4 info — `t8a-extra --only a,b,c,d,e` sekali jalan menyentuh GLOBAL TIMEOUT 170 s bila dijalankan paralel dgn harness lain; E sendiri lulus.

## Status temuan T10
| ID | status | bukti |
|---|---|---|
| R-1 lanskap ≤500 px CTA/babak bertumpuk | **FIXED** — tanpa pin, babak 1–3 statis op 1, 0 tumpang, 5 link hero fokus terlihat | cek 4, 5 |
| R-2 / W-2 glow tanpa objek | **FIXED** — `.spot/.floor` display:none + data-no-object di 812×375, 667×375, 1280×480; kembali block di tinggi normal | cek 4, 5 |
| R-3 aset yatim | **FIXED** | cek 10 |
| W-1 diorama terpotong tepi kanan | **FIXED** — 0 piksel di tepi, celah ≥24 px, NDC ≤0,915 | cek 6 |
| W-3 SVG no-WebGL vs judul babak 2 | tidak diukur ulang di sini (visual, QA-F); data-step=2 terpasang di babak 2 (cek 5) | — |

## Ringkasan
| Cek | Hasil | Angka |
|---|---|---|
| 1 build | PASS | exit 0, 2,23 s |
| 2 t7-check | PASS | overlap tidak ada ×6, 21 calls, 0 error |
| 3 t8a-extra a–e | PASS | 768 overlap 0/0/0; 1440 maks 0,07%; geo12/tex3/prog6 konstan; CPU4× 28–32 fps; anchor framesAdv 0 di luar hero |
| 4 R-1 lanskap + Tab | PASS | 812/667×375 tanpa pin, op 1/1/1, 0 tumpang, CTA terlihat, 5/5 fokus terlihat |
| 5 rotasi/resize | PASS | 8 langkah: pin kembali, b2/b3 [0,1,0]/[0,0,1], kanvas 210×276/538×624, no-object hilang, 0 error |
| 6 W-1 klip | PASS | 0 piksel di tepi; celah kanan min 24 px; NDC 0,915 |
| 7 bfcache | PASS* | headless persisted=true, is-3d; headed CacheFlushed (browser) → reload is-3d |
| 8 kontras | PASS | min 5,21:1 |
| 9 LH mobile | PASS | 92 / 92 / 93, median 92 |
| 10 kredit | PASS | 44/44, 0 sisa hero-sawit1.webp |

VERDICT: PASSED
