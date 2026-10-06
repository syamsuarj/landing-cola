# QA-T11 — verifikasi independen W1/W2/W3 + regresi keep-scroll (build produksi)

Lingkungan: `npm run build` → salinan dist disajikan `python3 -m http.server 4410` (127.0.0.1), Chrome headless via playwright-core (qa/node_modules). Skrip baru: `qa/out/t11/`.

## W3 — scroll melompat saat rotasi / lintas breakpoint → **FIXED** (lebar berubah)
- `node qa/out/t9-visual/f-rotate.mjs`: 375x812 y=9000 → 812x375 y=8966 → 9000; 800→740 y=7531 → 9000; 1024x768→768x1024 y=10709 → 9000; kontrol 375→414 OK. Tidak ada y=0.
- `node qa/out/t10/f-rotate-section.mjs`: 10/10 PASS (dijalankan sendiri).
- `node qa/out/t9-visual/d-scroll-resize.mjs`: produk 1280 y=8614 → 375 y=6882 (produk) → 1280 y=8614; indonesia 13844 → 12783 → 13844; overflowX 0; PAGEERRORS [].
- `node qa/out/t11/w3-extra.mjs` (skrip QA sendiri; kriteria: section di bawah header + progres ±0.06 sama sebelum/sesudah):
  - rotasi di dalam section 8/8 PASS: fakta/faq/galeri @375x812↔812x375, fakta/galeri @1024x768↔768x1024, faq 1280→375→1280, keberlanjutan 1280→760→1280, botol 1280→899→1280.
  - resize beruntun cepat (16 ms antar-langkah) 3/3 PASS: produk & fakta 1280→900→375→768, indonesia 1280→700→1100→375→1280 (section & progres sama, baik +250 ms maupun settled).
  - rotasi di tengah pin hero 4/4 PASS: 1280 y=900 (p .38) → 1024x768 → 1280; y=1600 (p .65) → 760x1024 → 1280; 1024x768 y=1100 → 768x1024 → back; 812x375 y=700 → 375x812 → back — progres hero terjaga.

## Regresi keep-scroll.ts (`node qa/out/t11/reg.mjs`, `qa/out/t11/x2-probe.mjs`)
- Anchor nav: `node qa/v1-anchor-nav.mjs --url http://127.0.0.1:4410/` → **14/14 PASS**.
- Klik nav setelah resize yang sudah tenang (≥1,2 dtk): #sejarah/#indonesia top=64, 375 menu → #faq top=64, menu tertutup, 0 elemen inert → PASS.
- Wheel / PageDown / End / Home tanpa resize baru-baru ini: tidak ditarik balik (wheel 9000→11400 stabil; PageDown 11400→12160 stabil; End=max stabil; Home=0 stabil; 375 PageDown 5000→5772 stabil) → PASS.
- Reload di tengah (1280 & 375; produk, faq, di dalam pin hero y=1100): posisi restore browser identik (y & section sama) → PASS.
- Address bar 375 (375x812→375x700, touch/isMobile & non-touch): tidak ada lompatan ke atas; y bergeser ≤ ~110–360 px karena emulasi Playwright ikut mengubah `svh` (di perangkat nyata `svh` tetap) — section tetap sama (produk/faq) pada 2 dari 3 kasus; pada touch produk+300 garis header pindah ke ujung sejarah (p .85) karena About `100svh` mengecil di emulasi → artefak emulasi, bukan defek.

### X2 — Minor — input pengguna dibuang/ditarik balik selama ~1 dtk setelah lebar viewport berubah
- Langkah: 1280x800, scroll y=9000 → resize ke 1100x800 (atau 1024x768) → dalam ≤ ~1 dtk klik nav "FAQ" atau gulir wheel 8×400.
- Ekspektasi: mendarat di #faq (top≈65) / halaman bergulir ~3200 px.
- Aktual (x2-probe.mjs): klik #faq 100/400/800 ms setelah resize → faq top = 9181 / 943 / 9869 (ditarik kembali ke jangkar produk); 1200 ms → 66 OK. Wheel 100 ms & 400 ms setelah resize → scrollY tidak berubah sama sekali (8867 / 8328 selama 1,6 dtk); 900 ms → 11128 OK. Sama untuk 1280→1024.
- Akar: `keep-scroll.ts` membekukan jangkar (`frozen=true`) dan `restore()` dijalankan pada tiap `ScrollTrigger 'refresh'` + timer 700 ms (diperpanjang tiap refresh); event scroll pengguna selama frozen tidak memperbarui/membatalkan jangkar. Saran: batalkan freeze bila ada input pengguna (wheel/touchmove/keydown/pointerdown pada link, atau `hashchange`/klik anchor) sebelum timer selesai.
- Dampak: sementara (self-heal setelah ~1 dtk), skenario butuh input tepat setelah resize/drag jendela; tap menu mobile setelah rotasi (≥300 ms + buka menu) tetap benar (#faq top=65). Bukan blocker.

### X1 — Minor — perangkat sentuh, perubahan TINGGI saja melintasi breakpoint products (min-width:900 & min-height:700) → kembali ke y=0
- Langkah (reg.mjs --only x1): context `hasTouch` (pointer: coarse) 1024x768, scroll ke indonesia+100 (y=11974) → 1024x690 → kembali 1024x768. Juga 1180x740→1180x690 (isMobile).
- Ekspektasi: section tetap indonesia.
- Aktual: 1024x690 → konten bergeser (indonesia p .09→.48, y tetap 11974); kembali ke 1024x768 → **hero y=0** (simptom W3 asli). Non-touch (pointer fine) kasus sama → PASS (indonesia .09 → .09 → .09).
- Akar: `keep-scroll.ts` sengaja mengabaikan resize tinggi-saja bila `(pointer: coarse)` (address bar), padahal `products.ts` memakai `(min-height: 700px)` di gsap.matchMedia → revert+refresh tanpa pemulihan.
- Dampak: kemungkinan kecil di dunia nyata (media query tinggi di Chrome/Safari mobile umumnya tidak berubah saat address bar; bisa terjadi di split-screen/multitasking tablet landscape ~700px). Saran: tetap bekukan/pulihkan bila perubahan tinggi melintasi 700px (atau saat event `change` matchMedia mana pun).

## W1 — focus trap menu mobile 375 → **FIXED** (`node qa/out/t11/w1w2.mjs`, `node qa/out/t10/w1-w2.mjs` ALL PASS)
- Tab dari awal → tombol MENU → Enter: aria-expanded=true; skip-link, `main#utama`, footer + `.brand` inert; `focus()` programatik ke link main ditolak.
- Tab×15 & Shift+Tab×9 berputar hanya di [Tutup, 01–05]; tidak ada fokus keluar panel.
- Esc → menu tertutup, fokus ke tombol, inert dilepas; Tab berikutnya sampai ke main ("Lihat Produk"); Shift+Tab dari tombol → brand.
- Klik link menu #indonesia/#sejarah (mouse) & Enter #faq (keyboard): menu tertutup, top=64/65, tidak ada inert tersisa. Menu terbuka lalu resize ke 1280 → tertutup, inert dilepas.
- Catatan: satu-satunya `[inert]` tersisa = 3 `li.kut-card` (slide kutipan non-aktif) yang sudah inert SEBELUM menu dibuka — desain carousel, bukan sisa menu (FAIL "inert=3" di log skrip = false positive kriteria saya). Info: setelah Enter link menu, `document.activeElement` = BODY (link jadi display:none); titik awal navigasi berurutan Chrome tetap di target anchor → tidak dicatat sebagai defek.
- Bukti: `qa/out/t11/w1-open.png`.

## W2 — FAQ opacity 0 saat difokus → **FIXED**
- 375x812 Tab ke FAQ 01 (tanpa scroll sebelumnya): SUMMARY "01 Siapa penemu Coca-Cola?", opacity efektif 1, outline solid 2px rgb(245,239,230), :focus-visible, top 647 / bot 734 (< 812). 1280x800: op 1, top 661 / bot 745 (< 800). Bukti: `qa/out/t11/w2-375-faq1.png` (ring terlihat jelas), `w2-1280-faq1.png`.
- `node qa/out/t9-visual/c-kbd.mjs` (1280 & 375): 0 `<<< CHECK`; semua elemen terfokus op=1, inView=true, tidak tertutup; FAQ 01–06 @1280 bot ≤ 788 (< 800), @375 bot ≤ 800 (< 812). Log: `qa/out/t11/c-kbd.log`.

## Runner produksi
- `node qa/run.mjs --prod --out qa/out-t11` → **SELESAI PASS 266,6 dtk, EXIT=0**: build, overflow 375/768/1280, console 0 error/0 warning, screenshots 36/36, variants 0 masalah, Lighthouse mobile P99 A100 BP100 SEO100 / desktop P100 A100 BP100 SEO100, credits. Log `qa/out-t11.log`, laporan `qa/out-t11/report.md`.

## Ringkasan
| ID | Status / Severity |
|---|---|
| W3 | FIXED (rotasi/lintas breakpoint lebar: 10/10 + 15/15 skenario QA sendiri) |
| W1 | FIXED |
| W2 | FIXED |
| X1 | Minor — sentuh + tinggi-saja melintasi min-height:700 (≥900 lebar) → y=0 |
| X2 | Minor — wheel/klik nav ≤ ~1 dtk setelah resize dibuang/ditarik balik oleh keep-scroll |

VERDICT: PASS (tidak ada blocker/major; X1 & X2 minor untuk backlog)
