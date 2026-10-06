# T1c notes (Programmer C)

- [mulai] Baca TASKS.md, home-text, images.json. Scrape /, /career, /procurement, /news + 4 detail berita + slide annual report via Playwright (qa/t1c-scrape*.mjs; web_extract kena 403).
- index.astro buatan A sudah final (tidak mengimpor komponen Coca-Cola) → komponen lama boleh dihapus.
- [T1c-1 lanjutan, 13:20] Kepemimpinan/Bisnis/Angka selesai.
  - Kepemimpinan: situs menampilkan 12 orang (Direktur Utama + 11 direktur) — semua dipakai, Dirut kartu besar (foto 4:5 + nomor 01 + nama display). 3 foto thumbnail (Sucipto, Gagah, Cucu ~150px) diganti versi asli CMS (≈340–495px). Foto Erry Herman berlatar putih (memang begitu di situs).
  - Bisnis: 9 slide sticky (≥900px & tinggi ≥700px, CSS sticky + efek tumpuk gsap.matchMedia), gambar cutout resmi /images/business/*.webp. Situs TIDAK punya deskripsi per produk → hanya nama resmi + label "Produk & Layanan Agrinas"; paragraf pengantar resmi. Label kelompok "Industri Kelapa Sawit"/"Jasa Konsultansi Teknis" diturunkan dari kalimat pengantar resmi (perlu cek QA konten).
  - Angka: 221.868 ha (Tahap I), 1.507.591,9 ha (Tahap IV), 6 tahap, 9 produk & layanan, 12 direksi, 2025 (berdiri Feb 2025; statis). Total hektare gabungan TIDAK ditampilkan (tidak tertulis di situs). Counter: HTML berisi nilai akhir, JS (non-reduced) mulai dari 0; sr-only nilai akhir.
  - QA: qa/t1c1-shots.mjs → qa/out-t1c1-shots/ (1280 & 375 + no-JS & reduced-motion 1280). overflow-x 0, 0 console error, no-JS/reduced opacity min 1, reduced → slide position relative. Vision review: perbaiki "Engineerin/g" terpotong (font .bs-word diperkecil). Build OK.
