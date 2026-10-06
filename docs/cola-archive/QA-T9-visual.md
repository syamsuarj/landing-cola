# QA-T9 — Visual & Interaksi (QA-B), re-test setelah T8

Tanggal: 2026-10-06. Build produksi (`npm run build` OK), disajikan statis dari `dist/` di :4410 (`astro preview --port 4410` ditolak karena preview lama :4400 PID 88417 masih jalan — bukan milik QA-B, tidak dimatikan; dipakai `python3 -m http.server 4410 --directory dist`). Chrome headless via playwright-core (qa/node_modules). Screenshot & skrip: `qa/out/t9-visual/`.

## V1 — FIXED (sebelumnya MAJOR)
- `node qa/v1-anchor-nav.mjs`: **14/14 PASS** (1280x800 + 375x812; nav/hero/footer; galeri 6 foto pending saat klik; scrollTo terintersep = 0; diff -1..0 px).
- Uji manual sendiri (`qa/out/t9-visual/a-v1v2.mjs`): konteks baru (cache kosong) per klik, klik dari y=0, tunggu scroll diam. 1280: 01 Sejarah/02 Produk/03 Indonesia/04 FAQ/05 Penutup → top 64 px, header 65 px (PASS ×5). 375 (via tombol Menu): 01–05 → top 64–65 px, menu tertutup setelah klik (PASS ×5). Label "05 Penutup" terkonfirmasi.
- Screenshot: `v1-1280-faq.png`, `v1-1280-cta.png`, `v1-375-faq.png`, `v1-375-cta.png`.

## V2 — FIXED (sebelumnya MINOR)
- bbox `.scroll-cue` vs elemen babak 1 (h1, lead, btn, .act1-foot *): 768x1024, 1024x768, 375x812 → cue `display:none` (0 overlap); 1280x800 → cue x617–663 y733–784, 0 overlap (lead berakhir x≈510, tombol mulai x≈1083). Dicek visual: "GULIR" berdiri sendiri di tengah bawah.
- Screenshot: `v2-hero-768x1024.png`, `v2-hero-1024x768.png`, `v2-hero-1280x800.png`, `v2-hero-375x812.png`.
- V3 (selera, botol menutupi "DIKENAL") masih seperti T6 — keputusan PM: tidak dikerjakan.

## Uji interaksi (skrip `qa/out/t9-visual/b-interact.mjs`, 24 dtk)

### Menu mobile 375x812 — sebagian PASS
- PASS: Tab → skip link → brand → tombol Menu; Enter/Space membuka (aria-expanded=true, label "Tutup", body overflow hidden); klik tombol menutup; Esc menutup + fokus kembali ke tombol MENU; Enter pada link "04 FAQ" menutup menu dan mendarat di #faq (top 65); menu terbuka lalu resize ke 1280 → otomatis tertutup, overflow dipulihkan. Focus ring 2 px krem di link menu. Screenshot `menu-375-open.png`.

### W1 — MINOR (bug a11y, bukan selera) — Menu mobile tanpa focus trap — ≤760 px
- Langkah: 375x812, Tab ke tombol Menu, Enter, tekan Tab 6×.
- Ekspektasi: fokus berputar di dalam panel menu (tombol Tutup ↔ 5 link) selama panel layar penuh terbuka, atau konten di belakang `inert`.
- Aktual: setelah "05 PENUTUP", fokus pindah ke "Lihat Produk" (hero) lalu "01 Original", "02 Zero Sugar"… di BELAKANG panel menu (panel `100svh` menutupi semuanya) → fokus tak terlihat (WCAG 2.2 SC 2.4.11 Focus Not Obscured). Esc tetap berfungsi, jadi tidak menjebak pengguna → minor.
- Screenshot: `menu-375-tab9.png` (fokus ada di link produk, layar hanya menampilkan panel menu tanpa ring).
- Saran: saat `open`, set `inert` pada `main`/`footer` (dan lepas saat tutup), atau loop Tab di header.
- Dugaan file: `src/scripts/animations.ts` (blok "Navbar: state scrolled + menu mobile", `setOpen`) — pemilik T5a.

### FAQ keyboard — PASS
- Fokus `summary` pertama: Enter → open=true; Space → open=false; Space → open=true; fokus tetap di summary, ring 2 px terlihat. Screenshot `faq-1280-enter-open.png`.

### Tombol "Jeda gerakan" marquee — PASS
- Sebelum: track bergerak. Enter → aria-pressed=true, label "Putar gerakan", track berhenti (diukur setelah blur agar jeda bukan karena fokus). Space → aria-pressed=false, "Jeda gerakan", bergerak lagi. Screenshot `marquee-1280-paused.png`.

### Navigasi keyboard penuh (skrip `c-kbd.mjs`, tunggu scroll diam + 0,7 dtk per Tab) — PASS dengan 1 temuan (W2)
- Urutan 1280: skip link → brand → nav 01–05 → hero "Lihat Produk" (babak 1) → "Lihat Produk"/"Telusuri Sejarah" (babak 3, ter-scroll ke y≈1204 di dalam pin) → produk 01–04 → "Jeda gerakan" → FAQ 01–06 → "Pilih Varian Favoritmu" → input email → "Berlangganan" → footer (navigasi, "Kembali ke atas", kredit foto) → keluar halaman. Urutan logis, mengikuti visual.
- Focus ring 2 px krem/putih di semua elemen; tidak ada fokus ke clone marquee (`aria-hidden`+`inert`), tidak ada fokus ke elemen `hidden`/`display:none`. Semua elemen terfokus berada di viewport, opacity 1, tidak tertutup header (1280: 0 masalah dari 22 Tab).
- Catatan: Tab cepat (≤120 ms, skrip `b-interact.mjs`) melewati tombol babak 3 hero (masih `visibility:hidden` sebelum scroll pin sampai) — perilaku wajar, bukan bug.

### W2 — MINOR (bug a11y) — Elemen terfokus masih opacity 0 (reveal GSAP belum terpicu) — 375x812, terlihat di FAQ
- Langkah: 375x812, Tab dari atas sampai "01 Siapa penemu Coca-Cola?" (Tab ke-10), tunggu scroll selesai + 0,7 dtk.
- Ekspektasi: pertanyaan + focus ring terlihat.
- Aktual: browser menggulir summary ke tepi bawah (top 725 / bawah 812 = 89 % tinggi viewport), di bawah titik picu reveal `top 88%` → item tetap `opacity:0`; area FAQ kosong, ring tak terlihat. Muncul setelah Tab berikutnya. Screenshot `kbd2-375-09.png`.
- Saran: picu reveal pada `focusin` (mis. `section.addEventListener('focusin', () => tl.progress(1))`) atau `start: 'top bottom'` untuk item yang bisa difokus. Pola sama mungkin berlaku di section lain ber-reveal `once` yang berisi elemen fokus (CTA).
- Dugaan file: `src/scripts/sections/faq.ts` (`gsap.from(items … start: 'top 88%')`) — pemilik T5c/T5b sesuai pembagian file.

### Scroll cepat naik-turun (skrip `d-scroll-resize.mjs`, wheel burst 16 ms) — PASS
- 1280x800 & 768x1024: hero ter-pin (turun 12×400, naik, osilasi 3×), timeline Sejarah, Produk sticky; screenshot di tengah animasi (`scroll-{1280,768}-{hero-mid,hero-back,hero-osc,sejarah-mid-down,sejarah-mid-up,produk-mid-down,produk-mid-up,…-settled}.png`) dicek vision: tidak ada konten tertimpa/rusak; area kosong sesaat hanya karena reveal sedang fade-in dan terisi setelah settle. overflowX = 0 di semua titik; 0 pageerror.
- Observasi (tidak tereproduksi, bukan temuan): satu screenshot `scroll-1280-hero-osc.png` menangkap header transparan dengan teks section tembus di belakang nav; diulang (`g-header.mjs`, 3 sampel 0,1–2 dtk) header `.scrolled` bg rgba(10,10,11,.92) normal (`header-after-osc.png`). Kemungkinan frame transisi 0,4 s saat refresh ScrollTrigger.

### W3 — MAJOR — Melintasi breakpoint gsap.matchMedia saat di tengah halaman → posisi scroll kembali ke 0 (atas) — semua lebar
- Langkah: buka 375x812, gulir ke y=9000, putar ke 812x375 (rotasi ponsel) — atau 1280→375, 800→740, 1024x768→768x1024→1024x768 — tunggu 1,5 dtk.
- Ekspektasi: tetap di section yang sama (posisi kira-kira dipertahankan).
- Aktual: scrollY = 0, pengguna dilempar ke hero. Hasil `f-rotate.mjs`: `375x812 y=9000 → 812x375 y=0`; `800x900 y=9000 → 740x900 y=0`; `1024x768 → 768x1024 y=9000 → 1024x768 y=0`. Kontrol tanpa lintas breakpoint aman: `375x812 → 414x896 y=8975`, `1280→1100` y 9000→8827 (ok). `d-scroll-resize.mjs`: 1280 di #produk/#indonesia → 375 → 1280 berakhir y=0 (`resize-produk-back1280.png`, `resize-indonesia-back1280.png`). Tidak ada overflow horizontal (overflowX 0) dan pin/hero berfungsi lagi setelahnya (`resize-hero-after.png`) — masalahnya hanya posisi hilang.
- Bukti trace (`e-resize-probe.mjs`): saat lintas breakpoint, rangkaian `window.scrollTo` dari `ScrollTrigger.*.js` (refresh: [0,0] → [0,y] berulang) diakhiri `[0,0]`, berbeda dengan resize dalam rentang yang sama yang diakhiri `[0,y]`. Diduga revert `gsap.matchMedia()` (hapus pin-spacer → tinggi dokumen berubah) + `html{scroll-behavior:smooth}` membuat restore posisi oleh ScrollTrigger hilang. (Uji hipotesis `scroll-behavior:auto` belum sempat dijalankan — skrip `f2-rotate-nosmooth.mjs` disiapkan.)
- Dampak: rotasi ponsel (375↔812 melintasi 760/761) dan rotasi tablet (1024↔768 melintasi 900px produk/768 about) adalah skenario nyata → major, bukan selera.
- Saran: simpan `scrollY`/section aktif pada `ScrollTrigger.addEventListener('refreshInit')` dan pulihkan di `'refresh'` (atau `ScrollTrigger.config({autoRefreshEvents:…})` + restore manual); set `scroll-behavior:auto` sementara selama refresh.
- Dugaan file: `src/scripts/animations.ts:62-64` (mm desk/mob 761/760, hero), `src/scripts/sections/about.ts:44-90` (768), `src/scripts/sections/products.ts:47-48` (900×700), `src/styles/global.css` (`scroll-behavior: smooth`).

## Ringkasan
| ID | Status/Severity | Bagian |
|---|---|---|
| V1 | FIXED | anchor nav (14/14 + 10/10 manual) |
| V2 | FIXED | scroll-cue hero |
| W1 | minor (bug a11y) | menu mobile tanpa focus trap |
| W2 | minor (bug a11y) | fokus ke FAQ yg masih opacity 0 (375) |
| W3 | **major** | lintas breakpoint/rotasi → scroll reset ke atas |

Lulus: FAQ keyboard, tombol Jeda gerakan, urutan Tab + focus ring, tidak fokus ke clone marquee, Esc/klik/link menutup menu + fokus kembali, scroll cepat hero/Sejarah/Produk, overflow-x 0 setelah resize, 0 pageerror.
Belum diuji: `node qa/run.mjs --prod` (bagian T9 di TASKS, di luar penugasan QA-B ini); reduced-motion; Safari/Firefox.

VERDICT: FAIL — W3 (major). Minor non-blocking: W1, W2.
