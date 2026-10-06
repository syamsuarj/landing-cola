# T1b notes — Programmer B (Ready for QA 2026-10-06 12:56)

## Selesai
- Scrape konten resmi (`curl` beranda agrinaspalma.co.id; data milestone dari JSON island di HTML) → `docs/reference/t1b-content.md`. Tidak ada teks karangan; tanggal ditulis "10 Maret 2025" + CSS uppercase (situs: "10 MARET 2025").
- 10 foto resmi → `src/assets/agrinas/` (filosofi-logo-apn2, tentang-gedung, tentang-pabrik, milestones-tahap1..6, visimisi-asset5). tahap3/4/6 & pabrik diperkecil ke 2200px (asli s/d 6192px). 10 baris di CREDITS.md (append).
- Komponen + script:
  - `Apresiasi.astro` / `apresiasi.ts` — section terang, surat kutipan serif besar, kata "menyala" via scrub opacity; 2 kartu dengan logo-stripe.
  - `Tentang.astro` / `tentang.ts` — foto gedung (zoom-out scrub) + badge "BUMN Persero · Berdiri Februari 2025", foto pabrik melayang (>=900), 2 blok teks resmi.
  - `FilosofiLogo.astro` / `filosofi.ts` — logo di cakram krem + cincin 4 warna; 5 makna kiri(3)/kanan(2) dengan garis penunjuk; >=900px ter-pin (2,4×vh), makna menyala satu per satu (kelas `.is-on`, kumulatif). <900px: tumpuk + reveal.
  - `Milestones.astro` / `milestones.ts` — pola about.ts Cola: >=768px pin + track horizontal, bar progres 4 warna; kartu foto + angka romawi + tanggal + kutipan. <768 / reduced / no-JS: daftar (2 kolom >=640px).
  - `VisiMisi.astro` / `visimisi.ts` — visi di atas foto asset5 gelap (parallax) dengan kata menyala; misi 01–05 di blok terang, judul sticky >=900px.
- Aturan kontrak: semua animasi dicek `prefers-reduced-motion`; tidak ada CSS yang menyembunyikan konten (gsap.from saja; mode langkah Filosofi hanya di `html.js .fl.is-steps`); pin via `gsap.matchMedia`; tanpa refresh per gambar (gambar punya aspect-ratio); tidak ada elemen fokus di section ini (W2 n/a); overflow-x: clip tiap section.

## Verifikasi (dev server sendiri port 3002, sudah dimatikan)
- `npm run build` ✓ (1 page, Complete).
- Screenshot (Playwright via qa/node_modules/playwright-core + Chrome): `~/.hermes/profiles/pm/cache/t1b-shots/` — d1280-* (filosofi 6 frame, milestones 6 frame), m375-*, nojs1280-*, rm375-*, rm1280-milestones. Skrip: shots.mjs, checks.mjs di folder yang sama.
- scrollWidth == clientWidth di 1280 & 375 (motion, no-JS, reduced); 0 console error.
- Anchor `#visi-misi` saat load: section top=72 (pas header), Filosofi 5/5 `.is-on`, Milestones `.is-h`. scrollIntoView tiap section top=72.
- Resize 1280→375 di tengah pin Filosofi: `.is-steps` dilepas, tanpa overflow; kembali ke 1280: pin & langkah pulih.

## Belum diverifikasi
- 768–899px (tablet) & 1440+ tidak di-screenshot; Lighthouse belum dijalankan; keyboard/screen reader manual belum.
- Pin Filosofi pada layar pendek (<700px tinggi, mis. 1280×650) — tinggi panggung ~560px, bisa mepet.
- Foto `tentang-pabrik` & `tahap*` diperkecil (kualitas webp 82) — cek visual QA.
- Screenshot terakhir diambil sebelum 3 perbaikan kecil (spasi kutip penutup visi, kolom nomor misi dipersempit, daftar Milestones 2 kolom >=640px) — rm1280-milestones sudah memuat perbaikan ketiga; build setelahnya ✓.
