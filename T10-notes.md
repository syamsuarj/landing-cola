# T10 — catatan Programmer D (W3 / W1 / W2)

## W3 (major) — scroll kembali ke 0 saat lintas breakpoint matchMedia
**Repro (merah sebelum fix):** `node qa/out/t9-visual/f-rotate.mjs` → `375x812 y=9000 -> 812x375 y=0`, `800x900 -> 740x900 y=0`, `1024x768 -> 768x1024 -> 1024x768 y=0`.

**Hipotesis yang diuji**
1. `html{scroll-behavior:smooth}` → **DITOLAK**: `qa/out/t9-visual/f2-rotate-nosmooth.mjs --nosmooth` (inject `scroll-behavior:auto!important`) tetap y=0.
2. Revert matchMedia + refresh ScrollTrigger → **TERKONFIRMASI** dengan trace event ScrollTrigger (`f2-rotate-nosmooth.mjs --trace`, hook debug sementara sudah dihapus):
   ```
   resize 740 y=9000 h=24190
   ST:revert       y=4301 h=19492   ← pin-spacer hero dilepas, dokumen memendek, browser menjepit scrollY
   ST:refreshInit  y=4301
   scrollTo [0,0]  (_refreshAll: obj(0) untuk mengukur)
   ST:refresh      y=0              ← posisi TIDAK dipulihkan
   ST:matchMedia   y=0
   … siklus revert/refresh berikutnya (tiap gsap.matchMedia: hero 760/761, about 768, products 900×700, internal orientation) mulai dari 0
   ```

**Akar masalah:** saat `change` media query, GSAP me-revert konteks matchMedia lama dulu (pin-spacer hero/about dilepas → tinggi dokumen turun, scrollY terjepit 9000→4301), lalu `ScrollTrigger._refreshAll()` menggulir ke 0 untuk mengukur. Pada siklus yang dipicu matchMedia ini nilai scroll yang direkam ScrollTrigger (`_recordScrollPositions` hanya saat `matchMediaInit`, dilewati di `_refreshAll` karena `_isReverted`) tidak lagi dipulihkan, sehingga event `refresh` selesai di y=0; siklus matchMedia berikutnya merekam 0. Resize dalam satu rentang tidak me-revert apa pun → `_refreshAll` biasa merekam & memulihkan y (karena itu aman).

**Fix:** `src/scripts/keep-scroll.ts` (di-import dari `animations.ts`):
- Selama pengguna menggulir, simpan jangkar relatif = anak langsung `<main>`/footer yang berada di garis bawah header + progres (0–1) di dalamnya (pin-spacer adalah anak langsung `<main>`, jadi progres adegan ter-pin ikut terjaga).
- Event `resize` (terjadi sebelum `change` matchMedia) dengan lebar berubah → jangkar dibekukan; setelah tiap `ScrollTrigger 'refresh'` (rAF) dan sekali lagi setelah tenang 700 ms, posisi dipulihkan dari jangkar dengan `scroll-behavior:auto` sementara, lalu `ScrollTrigger.update()`.
- Perubahan tinggi saja di perangkat sentuh (address bar) diabaikan; posisi y<2 (di atas) tidak dijangkar.

## W1 (minor) — focus trap menu mobile
`animations.ts` `setOpen`: saat terbuka semua anak `<body>` selain header (skip link, main, footer) + `.brand` diberi `inert`; dilepas saat tutup. Tab/Shift+Tab di-loop di [tombol Tutup, 5 link]. Esc → tutup + fokus ke tombol (tetap).

## W2 (minor) — FAQ opacity 0 saat difokus
`sections/faq.ts`: `focusin` pertama di section FAQ → tween reveal head+item `progress(1)` lalu ScrollTrigger-nya di-kill. Tambahan `global.css`: `scroll-margin-bottom:12px` untuk a/button/summary/input/select/textarea agar focus ring (offset 3px) tidak terpotong di tepi bawah saat browser menggulir elemen terfokus (sebelumnya FAQ 02 @1280 bot=800.02 > 800).

## Hasil uji (build produksi `dist/`, disajikan `python3 -m http.server 4410`)
- `npm run build` ✓
- `node qa/out/t9-visual/f-rotate.mjs`: `375x812 y=9000 -> 812x375 y=8966 -> 375x812 y=9000`; `800x900 -> 740x900 y=7531 -> 9000`; `1024x768 -> 768x1024 y=10709 -> 1024x768 y=9000`; kontrol `375->414 y=9251 -> 9000`.
- `node qa/out/t10/f-rotate-section.mjs` (baru; section di bawah header sebelum == sesudah): **10/10 PASS** — termasuk 1280→375→1280 dari 9000/#produk/#indonesia, di dalam pin hero (y=1200, progres 0.49 terjaga), di dalam pin horizontal Sejarah (1280→1024), kontrol 1280→1100.
- `node qa/out/t10/w1-w2.mjs` (baru): **ALL PASS** — Tab×13 & Shift+Tab×7 berputar di panel, main/footer/skip/brand inert, Esc menutup + inert dilepas + fokus ke tombol, Enter "04 FAQ" → #faq top 65; W2 375x812 FAQ 01 difokus opacity 1, outline solid 2px, di viewport.
- `node qa/out/t9-visual/c-kbd.mjs`: 0 `<<< CHECK` (1280 & 375); 375 Tab 9 "01 Siapa…" op=1 inView.
- `node qa/out/t9-visual/d-scroll-resize.mjs`: RESIZE produk 1280 y=8614 → 375 y=6882 (produk) → 1280 y=8614; indonesia 13844 → 12783 → 13844; overflowX 0; PAGEERRORS [].
- `node qa/v1-anchor-nav.mjs`: **14/14 PASS**.
- `node qa/run.mjs --prod --out qa/out-t10`: **SELESAI PASS (277 dtk, EXIT=0)** — build, overflow 375/768/1280, console 0 error/0 warning, screenshots 36/36, variants (reduced-motion/no-js/no-webgl) 0 masalah, Lighthouse mobile P98 A100 BP100 SEO100 / desktop P100 A100 BP100 SEO100, credits. Log: `qa/out/t10/run-prod.log`, laporan `qa/out-t10/report.md`.

File diubah: `src/scripts/keep-scroll.ts` (baru), `src/scripts/animations.ts`, `src/scripts/sections/faq.ts`, `src/styles/global.css`. Skrip uji baru: `qa/out/t10/{f-rotate-section,w1-w2,probe-faq-1280}.mjs`, `qa/out/t9-visual/f2-rotate-nosmooth.mjs`.

Catatan: c-kbd @1280 kadang melompati tombol babak 3 hero (visibility:hidden sebelum scrub sampai) — perilaku lama yang tergantung timing (sudah dicatat QA T9), bukan regresi.
