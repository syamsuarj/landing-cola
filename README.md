# landing-cola

Landing page **demo non-resmi** untuk memperkenalkan Coca-Cola, dibuat dengan [Astro](https://astro.build), [GSAP](https://gsap.com) (ScrollTrigger), dan [Three.js](https://threejs.org).

> **Disclaimer:** Proyek ini adalah demo desain/edukasi dan **tidak berafiliasi, disponsori, atau disetujui oleh The Coca-Cola Company**. "Coca-Cola" dan merek terkait adalah merek dagang milik The Coca-Cola Company. Tidak ada logo resmi yang digunakan; objek 3D dibuat secara prosedural.

> **Status:** work in progress (redesign "Premium sinematik" sedang dikerjakan dan belum lulus QA).

## Menjalankan

```bash
npm install
npm run dev      # http://localhost:4321  (atau: npm run dev -- --port 3000)
npm run build    # output statis di dist/
npm run preview
```

## Struktur

- `src/components/` — satu komponen per section (Hero, Sejarah, Produk, Botol, Indonesia, Fakta, Keberlanjutan, Galeri, Kutipan, FAQ, CTA, Footer)
- `src/scripts/animations.ts` — inti GSAP (navbar, pin hero, lazy-load 3D)
- `src/scripts/hero3d.ts` — scene Three.js botol prosedural
- `src/scripts/sections/` — animasi per section
- `qa/` — harness QA otomatis (overflow, console, screenshot, Lighthouse)

Aksesibilitas: menghormati `prefers-reduced-motion`, konten tetap terbaca tanpa JavaScript/WebGL.

## Kredit foto

Foto dari Unsplash (Unsplash License). Daftar lengkap di [CREDITS.md](./CREDITS.md).
