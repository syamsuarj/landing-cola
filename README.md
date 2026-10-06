# Agrinas Palma — konsep redesign landing page

Konsep **redesign** beranda situs resmi [PT Agrinas Palma Nusantara (Persero)](https://agrinaspalma.co.id) dalam gaya "premium sinematik": mayoritas section gelap hijau-hitam dengan jeda krem, tipografi serif raksasa (Lora) dengan aksen italic mint, foto kebun sawit full-bleed berlapis overlay gelap, dan motion berbasis scroll. Dibuat dengan [Astro](https://astro.build), [GSAP](https://gsap.com) (ScrollTrigger) dan [Three.js](https://threejs.org).

> **Catatan:** ini konsep redesign, **bukan situs produksi**. Struktur dan konten (teks, angka, berita, direksi) diambil dari agrinaspalma.co.id tanpa menambah fakta baru. Logo dan foto adalah aset resmi PT Agrinas Palma Nusantara (Persero), disimpan lokal di `src/assets/agrinas/`; sumber tiap file tercatat di [CREDITS.md](./CREDITS.md). Halaman Karir, Procurement, Berita, Annual Report dan WBS ditautkan ke situs resmi.

## Konsep

- **Hero ter-pin 3 babak**: "Mengelola Energi Hijau *Nusantara*" → "Energi hijau untuk *negeri*" → "Patriot · Loyal · *Profesional*", dengan objek 3D prosedural (tetes minyak sawit keemasan + butir buah sawit yang mengorbit; bukan logo 3D) di atas foto kebun resmi, serta pita "Kabar terbaru".
- **Cerita perusahaan**: Apresiasi, Tentang, Filosofi Logo (5 makna warna menyala bergiliran), Milestones (timeline horizontal ter-pin, Penyerahan Lahan Tahap I–VI), Visi & Misi.
- **Bisnis & publik**: Kepemimpinan, Lini Bisnis, Angka, Kemitraan (Integrated Procurement System), Karir, Berita, Keterbukaan Informasi.
- Warna & tipografi mengikuti situs resmi (hijau #1A7F37, mint #A1DBB3, krem #F4F5F0; Lora + Montserrat); garis empat warna logo sebagai aksen.
- Aksesibilitas: menghormati `prefers-reduced-motion` (tanpa pin/animasi), konten tetap utuh tanpa JavaScript/WebGL (fallback SVG), menu mobile dengan focus trap.

## Menjalankan

```bash
npm install
npm run dev -- --port 3001   # http://localhost:3001
npm run build                # output statis di dist/
npm run preview
```

## Struktur

- `src/components/` — satu komponen per section (Header, Hero, Apresiasi, Tentang, FilosofiLogo, Milestones, VisiMisi, Kepemimpinan, Bisnis, Angka, Kemitraan, Karir, Berita, Keterbukaan, Footer)
- `src/styles/global.css` — kontrak desain (variabel warna/tipografi, class global)
- `src/scripts/animations.ts` — inti GSAP (navbar, menu mobile, pin hero, lazy-load 3D); `hero3d.ts` scene Three.js; `keep-scroll.ts` menjaga posisi scroll lintas breakpoint
- `src/scripts/sections/` — animasi per section
- `qa/` — harness QA otomatis (`node qa/run.mjs --prod`: build, overflow, console, screenshot, varian no-JS/reduced-motion/no-WebGL, Lighthouse, kredit aset). Setup sekali: `(cd qa && npm install)`.
