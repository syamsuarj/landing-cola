# QA harness (T6) — coca-cola-landing

Bukan kode produksi. Dependency hanya di `qa/package.json` (playwright-core + lighthouse), memakai Google Chrome yang terpasang
(`/Applications/Google Chrome.app`, override dengan env `CHROME_PATH`).

## Setup sekali
```sh
cd qa && npm install && cd ..
```

## Pakai (dari root proyek)
```sh
node qa/run.mjs --url http://localhost:3000   # dev server yang sudah jalan: cek 2,3,4,5,7  (~80 s)
node qa/run.mjs --prod                        # npm run build → astro preview :4399 (dimatikan otomatis) → SEMUA cek incl. Lighthouse (~3-4 mnt)
node qa/run.mjs --selftest                    # uji harness pada qa/fixtures/index.html (sengaja rusak); exit 0 = detektor bekerja
```
Opsi: `--widths 375,768,1280` · `--out qa/out` · `--skip build,overflow,console,screenshots,variants,lighthouse,credits`
· `--lighthouse` (paksa LH di mode dev) · `--no-lighthouse` · `--build` (jalankan build di mode dev) · `--port 4399`.
`--prod --skip build` memakai `dist/` yang sudah ada.

Preview prod: harness memakai port 4399; bila port dipakai proses lain, port bebas dipilih. Astro 7 hanya mengizinkan satu
`astro preview` per proyek — bila preview milik agent lain sudah jalan, harness TIDAK mematikannya dan menyajikan `dist/`
dengan server statis in-process (tercatat di `report.md` baris "Server:"). Preview milik harness selalu dimatikan di akhir
(juga saat Ctrl-C; ada global timeout 25 menit).

Konten tersembunyi (varian): halaman discroll bertahap atas→bawah; elemen konten dihitung "tersembunyi" bila pernah berada di
viewport tetapi TIDAK PERNAH terlihat (opacity efektif < 0.1 / visibility hidden). Fade-out ter-scrub saat discroll lewat tidak dihitung.

Exit code: 0 bila tidak ada FAIL, 1 bila ada FAIL (WARN/SKIP tidak menggagalkan).

## Cek
| id | Isi | FAIL bila |
|---|---|---|
| build | `npm run build` (log: `out/build.log`) | exit ≠ 0 (cek browser lalu SKIP di mode --prod) |
| overflow | 375/768/1280: `max(html,body).scrollWidth` vs `innerWidth` + uji `scrollTo(x)` saat load & setelah scroll penuh bertahap; daftar elemen pelanggar (yang tidak di-clip ancestor) | ada overflow-x |
| console | console error/warn, pageerror, requestfailed, HTTP ≥ 400 — dari semua lebar + varian, di-dedupe | ada error (warning saja → WARN) |
| screenshots | tiap `<section>`/`<footer>` top-level (id dinamis dari DOM: `id` → `aria-labelledby` tanpa `judul-` → index) → `out/<lebar>/<id>.png`; bandingkan dengan daftar id yang diharapkan | screenshot gagal (id yang hilang → WARN) |
| variants | reduced-motion, tanpa JS, tanpa WebGL (getContext webgl* → null) @375 & 1280: hitung elemen konten (punya teks/img) yang tampil tapi opacity efektif < 0.1 / visibility hidden; error; overflow. Full-page `out/variants/<varian>-<lebar>.png` | ada konten tersembunyi, error, atau overflow |
| lighthouse | mobile + desktop (Perf, A11y, BP, SEO, metrik LCP/CLS/TBT/FCP, audit color-contrast + audit a11y gagal); HTML di `out/lighthouse-*.report.html` | skor < ambang (`LH_THRESHOLDS` di run.mjs: mobile P80, desktop P90, lainnya 95) atau color-contrast gagal |
| credits | tiap file `src/assets/photos/*` disebut di `CREDITS.md` dan tiap nama file foto di CREDITS ada di folder | ada yang tidak cocok / CREDITS.md tidak ada |

Hasil: `qa/out/report.md` + `qa/out/report.json` (`overall` + `checks.<id>.status` PASS/FAIL/WARN/SKIP + detail).
Catatan: di mode dev, perubahan file oleh Programmer memicu HMR reload → dicatat sebagai warning "navigasi dokumen dibatalkan".

## T7/T8 — objek 3D hero (diorama sawit)
`node qa/t7-check.mjs [URL] [--lh] [--only lh] [--preview]` → `qa/out-t7/report.md|json`. Detail cek & keterbatasan: `QA-T7-prep.md`.
