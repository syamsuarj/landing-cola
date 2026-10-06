# landing-cola

Landing page **demo non-resmi** untuk memperkenalkan Coca-Cola, dibuat dengan [Astro](https://astro.build), [GSAP](https://gsap.com) (ScrollTrigger), dan [Three.js](https://threejs.org).

> **Penafian:** Proyek ini adalah demo desain/edukasi **non-resmi** dan **tidak berafiliasi, disponsori, atau disetujui oleh The Coca-Cola Company**. "Coca-Cola" dan merek terkait adalah merek dagang milik The Coca-Cola Company. Tidak ada logo resmi yang dipakai sebagai aset: ilustrasi botol (SVG) dan objek 3D dibuat sendiri secara prosedural, favicon adalah monogram "D" buatan sendiri, dan foto stok berasal dari Unsplash (Unsplash License) — lihat [CREDITS.md](./CREDITS.md).

> **Status:** lulus QA (konten, lisensi foto, visual & interaksi, Lighthouse). Catatan minor yang masih terbuka ada di `TASKS.md` (X1, X2).

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

Semua foto stok diunduh dari Unsplash dan dipakai di bawah [Unsplash License](https://unsplash.com/license); disimpan lokal (tanpa hotlink). Nama fotografer dan tautan tiap foto ada di [CREDITS.md](./CREDITS.md). Unsplash License tidak mencakup hak atas merek dagang yang mungkin tampak di foto.
