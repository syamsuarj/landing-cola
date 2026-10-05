# Project: coca-cola-landing (Astro)
Repo: ~/workspace/projects/coca-cola-landing

## Asumsi (belum dikonfirmasi user)
- Landing page statis satu halaman, Bahasa Indonesia, tujuan: memperkenalkan Coca-Cola (sejarah, produk, fakta).
- Tanpa backend/form. Tanpa aset berhak cipta resmi: logo/gambar pakai placeholder/CSS/SVG sendiri.
- Warna merah #F40009 + putih.

## T1 - Scaffold Astro + landing page [P1, est 3 jam] — Status: Ready for QA (Programmer)
AC:
- Project Astro (npm create astro, template minimal) jalan dengan `npm run dev` dan `npm run build` tanpa error.
- Section: Hero, Tentang/Sejarah (1886, Atlanta, John Pemberton), Produk (Coca-Cola Original, Zero Sugar, Light/Diet, Cherry), Fakta singkat, CTA, Footer (disclaimer: situs demo non-resmi).
- Responsif (mobile 375px, desktop 1280px), semantik HTML, alt text, kontras cukup.
- Komponen Astro terpisah per section di src/components.
- Lighthouse Performance/Accessibility >= 90.

## T2 - Verifikasi QA [P1, est 1 jam] — Status: PASSED (dengan 1 bug minor, lihat di bawah)
AC: build lulus, cek responsif 375/768/1280, link anchor jalan, tidak ada console error, Lighthouse >= 90. Lapor bug ke Programmer.
Hasil QA T2 (build lulus; tanpa overflow horizontal di 375/768/1280; semua anchor valid; 0 console error; Lighthouse Perf 100/A11y 96 mobile & desktop):
- BUG-1 [Minor/a11y]: kontras teks putih di atas #F40009 = 4.32:1 (<4.5:1). Repro: Lighthouse audit color-contrast pada Hero `.eyebrow`, `.lead`, dan `<p>` di CTA. Saran: gelapkan merah (mis. #D6000A) atau pertebal/besarkan teks. Tidak memblokir (A11y tetap 96).
- BUG-1 FIXED di T3: latar Hero/CTA kini --red-bg #D6000A (kontras putih 5.4:1); Lighthouse a11y 100 (build produksi).
- Catatan: warning npm 'allow-scripts fsevents' saat install (tidak berdampak).

## T3 - Animasi GSAP + Three.js & perpanjang konten [P1, est 5 jam] — Status: Ready for QA (Programmer)
AC:
- Install `gsap` dan `three` via npm (versi stabil terbaru). Script animasi dimuat client-side (Astro <script>/island), tidak merusak build statis.
- GSAP + ScrollTrigger: animasi reveal tiap section, parallax hero, timeline sejarah beranimasi saat scroll, counter angka di Fakta, stagger kartu produk, animasi navbar saat scroll.
- Three.js: scene 3D di Hero (botol/kaleng prosedural dari geometri sendiri, mis. LatheGeometry; tanpa model/logo berhak cipta) dengan lighting, rotasi halus, respons ke mouse/scroll; partikel gelembung (bubbles) melayang. Canvas pause saat di luar viewport, dispose resource, pixel ratio dibatasi (maks 2).
- Fallback: hormati `prefers-reduced-motion` (animasi minimal/nonaktif), fallback statis (SVG Bottle lama) bila WebGL tidak tersedia; konten tetap terbaca tanpa JS.
- Konten lebih panjang (tambah section, bahasa Indonesia, tiap section substansial): Sejarah timeline lebih lengkap (1886, 1892, 1915 botol kontur, 1941, 1971, dst. — hanya fakta yang yakin benar), Varian produk detail, Kisah botol ikonik, Coca-Cola di Indonesia (hanya fakta yang yakin benar; bila ragu, tulis umum), Keberlanjutan/komitmen, Galeri momen (SVG/CSS), Testimoni/kutipan generik berlabel ilustrasi, FAQ (accordion aksesibel), Newsletter CTA (statis, tanpa backend), Footer.
- Tidak ada klaim kesehatan menyesatkan; disclaimer non-resmi tetap ada.
- `npm run build` sukses; Lighthouse Performance >= 85 (mobile) dan Accessibility >= 95; kontras teks lolos 4.5:1 (sekalian perbaiki BUG-1).
- Tidak ada console error; tidak ada overflow horizontal di 375/768/1280.

## T4 - Verifikasi QA T3 [P1, est 1.5 jam] — Status: STOPPED (digantikan T5 redesign). Hasil parsial: QA-T4A.md (teknis; BUG-A overflow mobile) & QA-T4B.md (fakta; 6 klaim perlu koreksi)
AC: semua AC T3 diuji nyata (build, console log browser langsung, WebGL render via screenshot, scroll animasi, reduced-motion, Lighthouse, responsif, aksesibilitas FAQ keyboard).

Catatan implementasi T3 (Programmer): gsap 3.15 + three 0.186 (lazy-load hero3d, chunk ~540kB, dimuat setelah load+4dtk atau interaksi pertama). Fallback SVG bila reduced-motion/WebGL tidak ada. FAQ memakai <details> native. Lihat ringkasan laporan untuk hasil verifikasi & hal belum terverifikasi.

## T5 - Redesign total "Premium sinematik" [P1, est 8 jam] — Status: IN PROGRESS, dipecah ke T5a/T5b/T5c (paralel)
Keputusan user (2026-10-05): visual & layout dirombak total; konten/teks tetap + koreksi fakta dari QA-T4B.md; aset boleh foto stok bebas lisensi (Unsplash/Pexels) + 3D/SVG sendiri. Arah visual dipilih PM: Premium sinematik (gelap hitam–merah, tipografi raksasa, 3D jadi bintang, gaya halaman produk Apple).
AC:
- Palet: dasar hampir hitam (mis. #0A0A0B), merah utama #F40009 tetap dipakai sebagai aksen/blok, merah gelap untuk kedalaman, krem/putih untuk teks. Grain/noise halus, glow/gradien radial. Kontras teks >= 4.5:1.
- Tipografi: font display tegas + font body rapi, self-host via @fontsource (tanpa request ke Google Fonts). Judul raksasa (clamp, mis. hingga 9–12vw di hero), hierarki jelas.
- Hero: full viewport gelap, objek 3D Three.js di tengah dengan tipografi raksasa di belakang; adegan di-pin dengan ScrollTrigger: objek berputar/bergeser melintasi 2–3 "babak" teks. Judul hero harus langsung terbaca saat load (jangan tertahan opacity 0).
- Tiap section punya layout berbeda (bukan pola judul + grid 3 kartu berulang): Sejarah = timeline horizontal ter-pin dengan angka tahun besar; Produk = showcase per varian dengan warna identitas (Original merah, Zero hitam, Light perak, Cherry merah tua); Botol ikonik = split layout foto/3D + teks besar; Fakta = counter raksasa di blok merah; Indonesia = foto full-bleed + overlay; Keberlanjutan = layout editorial; Galeri = masonry foto stok (ganti ikon garis lama); Kutipan = marquee/kartu di latar gelap (tetap berlabel ilustrasi); FAQ = accordion elegan (<details> native); CTA/newsletter + footer.
- Foto: hanya dari Unsplash/Pexels (lisensi bebas), diunduh ke src/assets, dirender via astro:assets <Image>/<Picture> (AVIF/WebP, width/height, lazy di bawah fold). Utamakan foto suasana (es, gelembung, kebersamaan, botol kaca generik); foto dengan merek terlihat boleh dipakai seperlunya. Catat setiap foto di CREDITS.md (URL, fotografer, lisensi) dan tampilkan kredit singkat di footer.
- Koreksi konten dari QA-T4B.md (ringkasan #1–#6): 1894 sebut Biedenharn/Vicksburg + 1899 pembotolan skala luas; Diet/Light "tanpa/rendah kalori"; "200+ negara dan wilayah"; Cherry "ketersediaan berbeda di tiap negara"; Original "cita rasa klasik sejak 1886"; klaim Indonesia diberi label "gambaran umum". Opsional: Zero (2005) jadi Zero Sugar (2017).
- Perbaiki BUG-A (overflow horizontal di 375/768 karena reveal x): tidak boleh ada scroll horizontal di 375/768/1280, baik saat load maupun setelah scroll.
- Tetap: prefers-reduced-motion (tanpa pin/animasi berat, konten statis rapi), fallback tanpa WebGL & tanpa JS (konten terbaca), disclaimer non-resmi, tanpa logo resmi, 3D prosedural, lazy-load Three.js, pause saat offscreen, dispose, DPR maks 2.
- npm run build sukses; console 0 error/warn; Lighthouse mobile Perf >= 85 & A11y >= 95 (build produksi).
- Programmer wajib cek visual sendiri: screenshot tiap section di 1280 dan 375, nilai kritis (tidak kosong, tidak tumpang tindih, tidak terlihat seperti template), perbaiki sebelum lapor.

## T6 - Verifikasi QA T5 [P1, est 2 jam] — Status: BLOCKED by T5 (QA)
AC: semua AC T5 diuji nyata, termasuk review visual tiap section (screenshot 375/768/1280), pin & scroll animation, lisensi foto di CREDITS.md, koreksi konten diterapkan, BUG-A hilang.

### Pembagian paralel T5 (diputuskan PM 18:30 atas permintaan user) — AC T5 di atas tetap berlaku untuk semua
KONTRAK DESAIN (wajib dipakai semua Programmer; T5a yang mengimplementasikan di src/styles/global.css):
- CSS variables: --c-ink #0A0A0B (latar utama), --c-ink-2 #141416 (latar sekunder), --c-red #F40009, --c-red-deep #8E0010, --c-cream #F5EFE6 (teks utama di gelap), --c-muted #B8B2AA (teks sekunder, kontras >=4.5 di ink), --c-silver #C9CDD2, --font-display, --font-body, --container 1280px, --gutter clamp(20px,4vw,48px), --radius 20px, --ease cubic-bezier(.2,.7,.1,1).
- Class global: .container (max-width var(--container), padding var(--gutter)), .eyebrow (label kecil uppercase letter-spacing), .display-xl/.display-l/.display-m (judul raksasa), .btn/.btn-ghost, .sr-only, .grain (overlay noise). Section komponen pakai <style> scoped sendiri; JANGAN edit global.css kecuali T5a.
- Animasi per section: tiap komponen punya script sendiri src/scripts/sections/<nama>.ts yang di-import dari <script> di dalam komponennya. Wajib: cek prefers-reduced-motion (tanpa animasi/pin), tanpa JS konten tetap terlihat (sembunyikan elemen hanya via class yang ditambah JS, mis. html.js), reveal hanya pakai y/opacity/scale (BUKAN x besar) supaya tidak overflow, section diberi overflow-x: clip bila perlu. Panggil ScrollTrigger.refresh() bila mengubah layout.
- Foto: Unsplash/Pexels lisensi bebas, simpan di src/assets/photos/<section>-<slug>.jpg, render via astro:assets; tambahkan baris kredit ke CREDITS.md dengan satu perintah append (>>), format: `| <section> | <file> | <url> | <fotografer> | <lisensi> |`.

## T5a - Fondasi + Hero 3D [P1] — Programmer A (subagent T5 awal) — Status: Ready for QA
Milik file: src/styles/global.css, src/layouts/Layout.astro, src/pages/index.astro, src/components/Header.astro, Hero.astro, Bottle.astro, Footer.astro, src/scripts/animations.ts (dijadikan inti saja: gsap register, navbar, lenis/none, lazy hero3d), src/scripts/hero3d.ts, package.json (font @fontsource), CREDITS.md (header tabel). Kerjakan kontrak desain DULUAN (target <10 menit) agar T5b/T5c bisa memakainya. Hapus logika section lama dari animations.ts yang dipindah ke T5b/T5c (cek keberadaan elemen sebelum memakai). Footer: kredit foto singkat + disclaimer.
Catatan Programmer A:
- Font: @fontsource/anton (display), @fontsource-variable/manrope (body), @fontsource/instrument-serif italic (aksen); woff2 Anton+Manrope di-preload dari Layout. global.css = kontrak (var --c-*, .container/.eyebrow/.display-*/.btn/.btn-ghost/.serif/.grain/.sr-only); alias & class legacy sudah dihapus; html/body/main/section/footer `overflow-x: clip` (BUG-A).
- Layout: inline script pasang `html.js` + `html.motion` (bukan reduced-motion); pengaman: `.motion` dicabut bila animations.ts tak memasang `html.hero-ready` dalam 3 dtk.
- Hero: judul raksasa ("Rasa yang / DIKENAL / di Seluruh Dunia") langsung terlihat (tanpa opacity 0), objek 3D di depan. html.motion: adegan di-pin 220% (3 babak: judul → "Lahir di Atlanta" → "200+ negara & wilayah"), botol bergeser kanan/kiri (desktop) atau naik+mengecil (mobile), indikator 01/03. Reduced-motion/tanpa JS: 3 babak tampil statis berurutan, SVG botol fallback. refreshPriority 10 pada pin hero (permintaan T5b dipenuhi; blok `resort` di about.ts boleh dihapus T5b).
- hero3d: botol prosedural Lathe + alur flute, kaca transparan, label merah + gelombang krem (generik), env RoomEnvironment, gelembung; lazy (load+3.5 dtk / interaksi pertama), pause offscreen/tab hidden, dispose saat pagehide, DPR maks 2 + kualitas adaptif (turun DPR 1 lalu ~15 fps bila interval frame >45 ms).
- Header: fixed, transparan → gelap saat scroll; mobile: tombol Menu (aria-expanded, Esc menutup) panel layar penuh; tanpa JS: baris link biasa.
- Footer: disclaimer non-resmi (+ "milik The Coca-Cola Company"), navigasi, kredit foto otomatis dibaca dari CREDITS.md saat build (dikelompokkan per fotografer), wordmark outline.
- CREDITS.md: hapus botol-kaca-es.jpg & galeri-makan-malam.jpg (tidak dipakai) beserta barisnya.
- Diverifikasi (build produksi, preview :4399): `npm run build` sukses (hanya WARN chunk hero3d >500 kB, lazy); console 0 error/warn di 375 & 1280 setelah scroll penuh + 3D termuat; scrollWidth = viewport di 375/768/1280 saat load & selama scroll penuh; Lighthouse mobile Perf 97/98 A11y 100 BP 100 SEO 100, desktop 100/100/100/100. Screenshot: qa-shots-t5a/ (boleh dihapus setelah QA).
- Belum terverifikasi: GPU nyata (Chrome headless pakai SwiftShader → 3D jalan ~15 fps mode adaptif), Safari/Firefox, sentuh nyata; nama fotografer diambil dari slug nama file unduhan Unsplash (halaman foto diblokir bot-wall).

## T5b - Section cerita & produk [P1] — Programmer B — Status: Ready for QA
Milik file: src/components/About.astro (Sejarah: timeline horizontal ter-pin, angka tahun besar), Products.astro (showcase per varian warna identitas), IconBottle.astro (#botol: split layout foto/3D-SVG + teks besar), Facts.astro (counter raksasa di blok merah), src/scripts/sections/{about,products,botol,facts}.ts, foto src/assets/photos/{sejarah,produk,botol,fakta}-*.
Catatan Programmer B:
- Sejarah: intro split (judul raksasa + foto apotek) + 10 tonggak. >=768px & tanpa reduced-motion: JS pasang `.is-h` → track horizontal ter-pin (scrub, progress bar). <768px / reduced-motion / tanpa JS: daftar vertikal statis dgn tahun raksasa.
- Produk: header foto gelembung + 4 slide warna identitas (Original merah, Zero hitam, Light perak, Cherry merah tua), botol SVG buatan sendiri tanpa logo; >=900x700 slide `position: sticky` (efek tumpuk, CSS) + redup/scale saat tertutup (JS).
- Botol: split foto full-height / teks + kutipan serif besar. Fakta: blok merah, 2x2 angka raksasa, counter (nilai final sudah di HTML).
- Koreksi QA-T4B diterapkan: 1894 Biedenharn/Vicksburg + 1899; 1982 & Light "tanpa/rendah kalori"; "negara dan wilayah"; Cherry "ketersediaan berbeda"; Original "cita rasa klasik ... sejak 1886"; Zero → Zero Sugar 2017.
- Selector lama di animations.ts (.timeline, .card, .fact, [data-count], [data-reveal-side], .sec-title) TIDAK dipakai lagi di komponen T5b → aman dihapus oleh T5a.
- Diverifikasi: overflow 0 di 375/768/1280 (load + setelah scroll penuh), console 0 error/warn (dev), reduced-motion & tanpa JS: konten terlihat, `npm run build` sukses. Screenshot: qa-t5b-shots/ (boleh dihapus setelah QA).
PERMINTAAN ke T5a (animations.ts): script section dieksekusi SEBELUM pin hero dibuat, sehingga saat ScrollTrigger.refresh() start/end trigger section di bawah hero dihitung tanpa pin-spacer hero (terbukti: start #sejarah 176 vs seharusnya 1936). Sementara ini about.ts memanggil `ScrollTrigger.sort(<urutan DOM>)` + refresh saat load. Solusi bersih: beri `refreshPriority: 1` pada ScrollTrigger pin hero (atau panggil `ScrollTrigger.sort()` setelah membuatnya); setelah itu blok `resort` di about.ts boleh dihapus.

## T5c - Section komunitas & penutup [P1] — Programmer C — Status: Ready for QA
Milik file: src/components/Indonesia.astro (foto full-bleed + overlay, label "gambaran umum"), Sustainability.astro (editorial), Gallery.astro (masonry foto), Testimonials.astro (marquee/kartu gelap, label ilustrasi), FAQ.astro (accordion elegan <details>), CTA.astro (newsletter demo), src/scripts/sections/{indonesia,sustainability,gallery,testimonials,faq,cta}.ts, foto src/assets/photos/{indonesia,keberlanjutan,galeri}-*.
Catatan Programmer C:
- Indonesia: foto warung malam full-bleed + overlay gelap/merah, judul "Coca-Cola di / INDONESIA" raksasa, badge "Gambaran umum · bukan data resmi" (koreksi QA-T4B #6), foto inset, 3 poin bernomor. Keberlanjutan: editorial 5/7 kolom, judul sticky, pilar serif besar bernomor, blok kutipan "Peran kita" merah gelap. Galeri: masonry CSS columns (2 kol mobile, 3 kol desktop) 6 foto stok + kredit per foto (ikon garis lama dihapus). Kutipan: marquee kartu gelap, label "Ilustrasi … fiktif" + "(ilustrasi)" tiap kartu; tombol "Jeda gerakan" (aria-pressed), jeda saat hover/fokus/offscreen, klon aria-hidden+inert; reduced-motion/tanpa JS = grid statis 3 kartu. FAQ: <details> native + ikon +/× , judul FAQ sticky. CTA: panel merah #D6000A (putih 5.4:1) + foto tuang; newsletter dipindah ke cta.ts (pesan demo, tidak kirim data).
- Teks konten dipertahankan; intro galeri diubah dari "Ilustrasi sederhana (SVG/CSS)" menjadi "Foto stok suasana (Unsplash, lisensi bebas)… Bukan foto atau materi resmi" karena kini foto.
- Animasi hanya y/opacity/scale; semua section overflow-x: clip.
- Foto baru (CREDITS.md di-append): indonesia-warung-malam (Luthfian Alfajr), keberlanjutan-botol (Muki Pan), galeri-makan-keluarga (Tyson). Foto lain dipakai dari unduhan T5a (indonesia-jalanan-malam, keberlanjutan-kaleng-daur-ulang, galeri-*, cta-tuang-cola). galeri-makan-malam.jpg TIDAK dipakai lagi (diganti foto keluarga yang lebih sesuai tema "makan malam keluarga") — boleh dihapus beserta barisnya di CREDITS.md oleh pemilik CREDITS (T5a).
- Diverifikasi (dev :3000, Chrome headless via playwright-core qa/): scrollWidth = viewport di 375/768/1280 saat load & setelah scroll penuh; 0 elemen tersembunyi di section T5c (normal, reduced-motion, tanpa JS); marquee mati saat reduced-motion (3 kartu, transform none, tombol tersembunyi); FAQ Enter/Space/Tab OK; newsletter valid/invalid OK tanpa navigasi; `npm run build` sukses. Screenshot: ~/workspace/projects/t5c-screens/.
- Console dev: satu-satunya error adalah 504 "Outdated Optimize Dep" pada astro dev-toolbar (artefak Vite dev server, bukan dari kode T5c; hilang setelah restart dev server — tidak saya restart).

## T6-prep - Siapkan harness QA otomatis [P1] — QA-1 — Status: IN PROGRESS
Buat qa/ (bukan kode produksi): script yang bisa dijalankan ulang untuk build, cek overflow 375/768/1280 (saat load & setelah scroll), console error/warn, screenshot per section per lebar, reduced-motion/no-JS/no-WebGL, Lighthouse mobile+desktop, cek CREDITS.md vs file foto. Output ringkasan JSON/MD. Uji harness pada versi saat ini.

## T6 - QA paralel setelah T5a/b/c selesai: QA-1 teknis (pakai harness), QA-2 visual/UX review per section, QA-3 konten + lisensi foto.

## T7 - Publish ke GitHub [P2] — PM — Status: WAITING (jalan setelah T6 PASSED)
Repo: https://github.com/syamsuarj/landing-cola (PUBLIC, dibuat 2026-10-05 atas persetujuan user, masih kosong).
Langkah setelah QA lulus: git init; .gitignore (node_modules, dist, .astro, qa/out*, qa/node_modules, screenshot/scratch QA & programmer); scan secret sebelum commit; commit awal TANPA trailer Co-authored-by; branch main; push. Jangan deploy.
