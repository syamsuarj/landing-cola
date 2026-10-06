# QA-T6 — Visual & Interaksi (QA-2)

Tanggal: 2026-10-05. Build produksi (`npm run build`, `astro preview --port 4400`), Chrome (headless, playwright-core dari qa/node_modules).
Viewport: 375x812, 768x1024, 1280x800. Screenshot: `qa/out/t6-visual/`. Script uji: `qa/out/t6-visual/*.mjs`.

Severity: blocker / major / minor / saran. "Selera" = bukan bug, saran desain.

## Temuan

### V1 — MAJOR — Galeri (efek ke anchor nav FAQ/Mulai) — semua lebar (terukur di 1280)
- Langkah: buka halaman (cache kosong), tunggu load, klik nav "04 FAQ" atau "05 Mulai" (atau "Lihat Produk" dst. yang melewati Galeri).
- Ekspektasi: smooth scroll mendarat di #faq / #cta (top section = 64 px di bawah header).
- Aktual: scroll berhenti di ~y=15 999 (tengah #keberlanjutan); #faq masih 3 500 px di bawah viewport, #cta 4 354 px. Klik ulang dari atas juga berhenti lagi (16 392) selama masih ada foto galeri yang belum termuat. Setelah semua gambar termuat, semua anchor mendarat benar (top 64).
- Akar masalah (terbukti via trace `qa/out/t6-visual/trace.mjs`): `src/scripts/sections/gallery.ts:31` memanggil `ScrollTrigger.refresh()` pada event `load` tiap foto galeri lazy. Refresh ScrollTrigger memanggil `window.scrollTo(0,0)` lalu kembali ke posisi semula → membatalkan smooth scroll (CSS `scroll-behavior: smooth`) yang sedang berjalan. Foto galeri mulai termuat persis saat scroll melewati Keberlanjutan. Efek samping lain: scroll roda/trackpad yang sedang beranimasi juga terpotong saat foto galeri termuat (tersendat).
- Saran: hapus refresh per-gambar (foto astro:assets sudah punya width/height → layout tidak berubah), atau debounce + tunda sampai `scrollend`.
- Screenshot: `qa/out/t6-visual/nav-1280-faq.png`, `nav-1280-cta.png`.
- Pemilik: T5c (`sections/gallery.ts`).

### V2 — MINOR — Hero — 761–1100 px (terukur 768x1024, 820x1180, 1024x768)
- Langkah: buka halaman di 768x1024 atau 1024x768, lihat bagian bawah hero (babak 1).
- Ekspektasi: indikator "GULIR" + garisnya berdiri sendiri, tidak menempel ke paragraf lead.
- Aktual: kotak `.scroll-cue` (center, bottom 1rem) tumpang tindih dengan kotak `.act1-foot .lead` (lead lebar 480 px, berakhir di x≈511–521, cue di x≈360–410). Di 768 "GULIR" terselip tepat di bawah baris ke-2 lead dan garisnya menembus area teks; di 1024x768 "GULIR" terbaca seperti lanjutan paragraf ("dan wilayah.  GULIR"). Tidak terjadi di 375–414 (cue disembunyikan) maupun ≥1280.
- Saran: sembunyikan `.scroll-cue` < 1200 px, atau beri lead `max-width` yang berakhir sebelum 50% lebar.
- Screenshot: `qa/out/t6-visual/hero-768x1024.png`, `hero-1024x768.png`.
- Pemilik: T5a (`Hero.astro`).

### V3 — SARAN (selera) — Hero — 768–1280 px
- Botol (3D maupun SVG fallback) menutupi tengah kata "DIKENAL" ("DIK▮AL" di 768/1024; huruf "NA" tertutup sebagian di 1280). Ini sesuai konsep "objek di depan tipografi", h1 tetap utuh untuk pembaca layar, dan kata masih bisa ditebak. Namun AC "judul hero langsung terbaca" paling lemah di 768–1024. Opsional: botol sedikit lebih kecil / judul sedikit lebih lebar di tablet.
- Screenshot: `qa/out/t6-visual/sweep-768/000-y0.png`, `hero-1024x768.png`.
- Pemilik: T5a (`Hero.astro`).

