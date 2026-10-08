# QA-T7-prep (T8-prep, QA-A) — harness `qa/t7-check.mjs`

Status: SIAP. Harness sudah dicoba pada dev :3000 (kode T7 masih setengah jadi) dan `--lh` pada build preview :4420. Belum ada verdict T8.

## Menjalankan (dari root proyek; dependensi = `qa/node_modules` yang sudah ada, Chrome sistem)
```sh
node qa/t7-check.mjs                              # cek browser vs http://localhost:3000 → qa/out-t7/ (~60 s)
node qa/t7-check.mjs http://localhost:3000 --lh   # + Lighthouse mobile pada build preview :4420
node qa/t7-check.mjs --lh --only lh --out qa/out-t7-lh   # hanya build + preview :4420 + LH (~25-60 s)
node qa/t7-check.mjs --preview                    # cek browser vs build preview :4420 (hook __hero3d tidak ada → draw-calls SKIP)
```
Opsi: `--widths 1280,375` · `--out <dir>` · `--skip-build` · `--max-calls 60` · `--lh-min 90`. Exit 1 bila ada FAIL.
Preview :4420 dijalankan dengan process group dan dimatikan di akhir (juga Ctrl-C / timeout global 6 mnt); bila :4420 sudah dipakai, tidak dibunuh → FAIL "port dipakai".

## Cek (report.md + report.json di folder out)
| id | Isi | FAIL bila |
|---|---|---|
| screenshots | 1280×800 & 375×812, babak 1/2/3 = scroll ke start + 0 / 0,45 / 0,9 × panjang pin (ScrollTrigger bila di window, kalau tidak `.pin-spacer` dari `[data-hero-scene]` = `section#beranda`), tunggu 1,8 s → `<vw>-b<n>.png` + crop `#hero-art` → `<vw>-b<n>-art.png` | screenshot gagal |
| canvas-visible | `#hero-art.is-3d` (tunggu s.d. 10 s, init bertahap) + rect kanvas | tidak is-3d di babak 1 |
| overlap-text | Konten kanvas nyata = diff piksel screenshot kanvas tampil vs `visibility:hidden` → bbox; dihitung piksel objek di dalam kotak baris teks (Range.getClientRects) h1/h2/p yang terlihat (opacity>0,1) | piksel objek > 2% area baris teks mana pun |
| draw-calls | `window.__hero3d.renderer.info.render` calls/triangles setelah 8 frame, tiap babak; + memory/programs/jumlah mesh/instanced | calls > 60 (SKIP bila hook tak ada/tanpa renderer) |
| no-webgl | Chrome `--disable-webgl --disable-3d-apis`: tidak is-3d, SVG `.fallback` terlihat (opacity>0,5, ≥20px), aria-label `#hero-art` tidak memuat "tetes minyak" | salah satu gagal |
| reduced-motion | `reducedMotion:'reduce'`: 2 screenshot area `#hero-art` berjeda 1 s | > 0,05% piksel berubah |
| console | console.error/pageerror/requestfailed/HTTP≥400 semua konteks (ERR_ABORTED & warning GPU headless → warning) | ada error (warning saja → WARN) |
| lighthouse-mobile | (`--lh`) `npm run build` → `astro preview --port 4420` → LH mobile performance | Performance < 90 |

## Hasil percobaan (2026-10-08, kode T7 sedang dikerjakan — bukan verdict)
- Run dev :3000 (59 s): screenshots PASS · canvas-visible PASS · overlap-text FAIL (1280-b1 h1 3%, 1280-b2 p.body 7% — dicek visual: pulau memang menabrak paragraf babak 2) · draw-calls PASS (21 calls, tetapi triangles 190k @1280 / 77k @375 — patut dicatat) · no-webgl PASS · reduced-motion PASS · console WARN (hanya warning GPU headless).
- Run sebelumnya menangkap fallback 1280 masih ber-aria-label "tetes minyak" (HMR di tengah edit C) → detektor bekerja.
- `--lh --only lh` (25 s): Performance 87 (LCP 3,4 s, TBT 210 ms) → FAIL; preview dimatikan.

## Keterbatasan
- Dev mode: HMR reload saat Programmer menyimpan file → `evaluate` diulang (tercatat warning); hasil bisa campuran versi.
- WebGL headless = SwiftShader/ANGLE: fps/kualitas ≠ GPU nyata; calls/triangles tetap valid.
- Diff overlap ikut menghitung partikel emas & bayangan/AA; ambang 2% untuk meredam. Teks di atas kanvas (z-index) tetap dihitung bila objek di belakangnya.
- Babak dipilih via fraksi scroll + scrub 0,6 s; bila panjang pin/`end` berubah, fraksi tetap relatif.
- LH satu kali run (variansi ±3–5 poin); build `dist/` ditimpa saat `--lh`/`--preview`.
