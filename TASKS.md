# Project: agrinas-landing — branch `agrinas-palma` (repo github.com/syamsuarj/landing-cola)
Worktree: ~/workspace/projects/agrinas-landing (git worktree dari ~/workspace/projects/coca-cola-landing, branch agrinas-palma; main = landing Coca-Cola, JANGAN disentuh)
Dev server: port 3001 (port 3000 = landing Coca-Cola, jangan dimatikan)

## Requirement user (2026-10-06)
"Pelajari website https://agrinaspalma.co.id lalu buatkan landing page baru dengan dasar dan feel design yang tadi (landing Coca-Cola 'Premium sinematik') agar bisa diterapkan dari dasar agrinaspalma.co.id" + "buatkan di branch baru".

## Asumsi / keputusan PM (default, belum dikonfirmasi user)
- Ini konsep REDESIGN situs resmi PT Agrinas Palma Nusantara (Persero): struktur & konten dari agrinaspalma.co.id, kemasan visual & motion dari landing Coca-Cola (gelap sinematik, tipografi raksasa, hero 3D ter-pin, timeline horizontal ter-pin, slide sticky, counter, marquee).
- Aset resmi (logo APN, logo Danantara, foto dari agrinaspalma.co.id & cms.agrinaspalma.app, foto direksi) BOLEH dipakai karena user terafiliasi Agrinas; diunduh lokal ke src/assets/agrinas/ (tanpa hotlink), sumber dicatat di CREDITS.md. README memuat catatan "konsep redesign, bukan situs produksi".
- Konten HANYA dari agrinaspalma.co.id (beranda + subhalaman /career, /procurement, /news). Dilarang mengarang angka/fakta/kutipan. Teks yang dipersingkat tetap harus setia makna. Data yang tidak ada di situs → jangan dibuat.
- Bahasa Indonesia. Satu halaman statis (Astro), tanpa backend. Link "Karir", "Procurement", "Berita", "Annual Report", WBS → tautan ke halaman resmi agrinaspalma.co.id (target _blank, rel noopener).
- Popup "Waspadai email palsu" situs asli tidak direplikasi sebagai modal; cukup sebagai pita/info kecil di section Keterbukaan Informasi.
- Kode Coca-Cola dipakai sebagai fondasi: Astro + GSAP/ScrollTrigger + Three.js, keep-scroll.ts, harness qa/run.mjs, pola file-ownership. Semua komponen/konten/foto Coca-Cola DIHAPUS dari branch ini.

## Referensi
- docs/reference/home-text.txt (teks beranda), docs/reference/images.json (URL gambar), docs/reference/shots/y*.png (screenshot 1280x800 situs asli per posisi scroll).
- Situs asli: font Lora (serif, judul + italic hijau aksen) + Montserrat (body); hijau #1A7F37, hijau gelap #15251C/#102C20/#07150E, krem #F4F5F0/#FAFAF7, mint #A1DBB3; warna logo: hijau, kuning, biru, merah.
- Arsip proyek Coca-Cola: docs/cola-archive/ (TASKS-cola.md berisi pelajaran: kontrak desain, aturan animasi, bug W1–W3/V1).

## KONTRAK DESAIN (wajib semua Programmer; T1a mengimplementasikan di src/styles/global.css dalam 10 menit pertama)
- Feel: "Premium sinematik" versi Agrinas — mayoritas section gelap hijau-hitam dengan beberapa jeda section terang krem; tipografi raksasa; foto full-bleed dengan overlay gelap; grain halus; aksen italic serif hijau mint seperti situs asli ("Energi Hijau *Nusantara*").
- CSS variables: --c-ink #07150E (latar utama), --c-ink-2 #0E2218 (latar sekunder), --c-forest #15251C, --c-green #1A7F37, --c-mint #A1DBB3 (aksen di gelap), --c-cream #F4F5F0 (teks utama di gelap / latar section terang), --c-paper #FAFAF7, --c-muted #A9B8AE (teks sekunder di gelap, kontras >=4.5), --c-muted-dark #4B5A50 (teks sekunder di terang), --c-yellow #F2C230, --c-blue #1E6FB8, --c-red #D7262E (warna logo, hanya aksen kecil/garis 4 warna), --font-display "Lora Variable", --font-body "Montserrat Variable", --container 1280px, --gutter clamp(20px,4vw,48px), --radius 20px, --ease cubic-bezier(.2,.7,.1,1).
- Class global: .container, .eyebrow (uppercase kecil, letter-spacing, warna mint/green), .display-xl/.display-l/.display-m (Lora, raksasa), .accent (Lora italic warna mint di gelap / green di terang), .btn/.btn-ghost (pill), .section-light (latar cream, teks forest), .sr-only, .grain, .logo-stripe (garis 4 warna logo).
- Font via @fontsource-variable/lora dan @fontsource-variable/montserrat (hapus Anton/Manrope/Instrument Serif).
- Animasi per section: script sendiri src/scripts/sections/<nama>.ts diimport dari <script> komponennya. Wajib: prefers-reduced-motion (tanpa animasi/pin), tanpa JS konten tetap terlihat (sembunyikan hanya via class html.js), reveal hanya y/opacity/scale, overflow-x: clip, JANGAN ScrollTrigger.refresh() per gambar load (bug V1), elemen yang bisa difokus tidak boleh tersembunyi saat difokus (bug W2), pin pakai gsap.matchMedia dan biarkan keep-scroll.ts menangani lintas breakpoint (bug W3).
- Aset: src/assets/agrinas/<section>-<slug>.(webp|jpg|png) via astro:assets; baris CREDITS.md satu append (>>): `| <section> | <file> | <url sumber> | PT Agrinas Palma Nusantara | aset resmi |`.
- Responsif 375/768/1280 tanpa overflow horizontal; Lighthouse mobile Performance >=90, A11y >=95.

## T1 - Landing Agrinas (paralel) [P1, est 3 jam] — Status: IN PROGRESS
### T1a - Fondasi + Header + Hero 3D + Footer — Programmer A — Status: IN PROGRESS
Milik file: global.css, Layout.astro, pages/index.astro, Header.astro, Hero.astro, Footer.astro, animations.ts, hero3d.ts, hero-state.ts, keep-scroll.ts, package.json, public/favicon*, README.md, CREDITS.md (header tabel), astro.config.mjs. Hapus komponen/script/foto Coca-Cola yang bukan milik B/C (Bottle, IconBottle, dsb) dan semua src/assets/photos.
- index.astro urutan section: Hero, Apresiasi, Tentang, FilosofiLogo, Milestones, VisiMisi, Kepemimpinan, Bisnis, Angka, Kemitraan, Karir, Berita, Keterbukaan, Footer. Import komponen B/C; jika file belum ada, buat stub kosong <section id> agar build jalan (B/C akan menimpa).
- Header: logo Danantara | logo APN (aset resmi), nav: Beranda, Tentang Kami, Bisnis, Karir, Procurement, Berita, Kontak; menu mobile dgn focus trap (pertahankan perbaikan W1).
- Hero ter-pin 3 babak: babak 1 "Mengelola Energi Hijau *Nusantara*" + lead resmi + tombol Tentang Agrinas / Lini Bisnis; babak 2-3 dari konten situs (Energi hijau untuk negeri; Patriot · Loyal · Profesional). Objek 3D Three.js prosedural: tetes minyak keemasan / buah sawit (BUKAN logo 3D), fallback SVG; latar foto/video kebun sawit resmi gelap. Pita "Kabar terbaru" (judul berita terbaru, link ke /news resmi).
- Footer: logo, tagline, tautan cepat, kontak (021-819-2636, agrinaspalma@agrinaspalma.co.id, alamat Rasuna Said), ikuti kami (sosmed resmi bila ada di situs), © 2026, catatan konsep redesign.
### T1b - Section cerita perusahaan — Programmer B — Status: IN PROGRESS
Milik file: Apresiasi.astro, Tentang.astro, FilosofiLogo.astro, Milestones.astro, VisiMisi.astro + sections/{apresiasi,tentang,filosofi,milestones,visimisi}.ts + aset terkait.
- Apresiasi: surat "Kepada seluruh pemangku kepentingan..." (kutipan besar serif), 2 kartu Keterbukaan Informasi & Sinergi Tumbuh Bersama.
- Tentang: BUMN Persero · Berdiri Februari 2025, Semangat Patriot, Mandat Swasembada Nasional (teks resmi).
- Filosofi Logo: logo APN di tengah + 5 makna (Hijau Ekosistem, Kuning Produktivitas, Biru Energi Bersih, Merah Semangat, Teks Nusantara) dengan garis penunjuk; animasi scroll satu per satu.
- Milestones: timeline horizontal ter-pin (>=768) Penyerahan Lahan Tahap I–VI dengan tanggal, kutipan, foto resmi (ambil teks semua tahap dari situs).
- Visi & Misi: teks resmi lengkap (ambil dari situs), misi bernomor 01..0n.
### T1c - Section bisnis & publik — Programmer C — Status: IN PROGRESS
Milik file: Kepemimpinan.astro, Bisnis.astro, Angka.astro, Kemitraan.astro, Karir.astro, Berita.astro, Keterbukaan.astro + sections/{kepemimpinan,bisnis,angka,kemitraan,karir,berita,keterbukaan}.ts + aset terkait. Hapus komponen/script Coca-Cola: About, Products, Facts, Indonesia, Sustainability, Gallery, Testimonials, FAQ, CTA (+ sections ts lama) yang tidak dipakai — HANYA setelah A membuat index.astro baru (koordinasi: cek index.astro tidak lagi mengimpornya).
- Kepemimpinan: 11 direksi (nama, jabatan, foto resmi), Direktur Utama menonjol.
- Bisnis: 9 produk/layanan (TBS, CPO, CPKO, PK, PKM, PKS, Engineering, GeoResources, Laboratorium Geoteknik) — slide sticky gaya "Produk" Coca-Cola atau marquee; deskripsi hanya bila ada di situs.
- Angka: counter hanya dari angka resmi di situs (mis. 221.868 ha lahan Tahap I, 11 direksi, 9 lini produk/layanan, berdiri 2025) — jangan mengarang.
- Kemitraan: Integrated Procurement System (link /procurement resmi).
- Karir: "Bangun karir, *bangun negeri*." + nilai (Budaya Inovatif, Kolaborasi Tim, dst dari situs) + link /career.
- Berita: 3–4 berita terbaru (judul, tanggal, ringkasan, link) diambil dari /news resmi saat build-time statis (hardcode hasil scrape, bukan fetch runtime).
- Keterbukaan: Annual Report (link), Sarana Pengaduan WBS (mekanisme tertulis & lisan), pita kecil peringatan email palsu.

## T2 - QA [P1] — Status: BLOCKED by T1 (track teknis+visual, track konten-vs-situs-resmi)
## T3 - Commit & push branch agrinas-palma — PM — Status: BLOCKED by T2
