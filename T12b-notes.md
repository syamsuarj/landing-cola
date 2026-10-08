# T12b — HeroBackdrop: glow/bayangan saat diorama tersembunyi + bersih aset (Programmer D)

## Perubahan
- `src/components/HeroBackdrop.astro`
  - CSS: `@media (max-height: 500px) { .spot, .floor { display: none } }` (sejalan dengan `.object { display:none }` di Hero.astro).
  - CSS: `.backdrop[data-no-object] .spot/.floor { display: none }`.
  - Skrip `place()`: objek dianggap tersembunyi bila rect < 2px (display none), `visibility: hidden`, atau opacity 0 →
    set `data-no-object` di `.backdrop` lalu berhenti (tanpa rAF lanjutan; dicek ulang pada scroll/resize/pageshow/IO yang sudah ada).
    Hanya bergantung pada `[data-hero-object]` (#hero-art), tidak pada detail implementasi T12a.
- `src/assets/agrinas/hero-sawit1.webp` DIHAPUS (grep `hero-sawit1` di src & qa: hanya versi `-blur` yang dipakai).
- `CREDITS.md` baris hero → `src/assets/agrinas/hero-sawit1-blur.webp` (sumber resmi sama sawit1.webp; dicatat sebagai turunan blur/duotone 480px).

## Verifikasi (hasil asli)
- Logika kredit qa/run.mjs (direplikasi di `qa/out-t12b/credits-check.mjs`): PASS — 44 aset, 44 baris, 0 tak tercatat, 0 yatim.
- `qa/t12b-shots.mjs` → `qa/out-t12b/` (dev :3000):
  - 812x375 & 667x375: #hero-art display none; .spot/.floor display none; `data-no-object` = true. Vision: tidak ada noda elips.
  - 1280-b1: pusat spot x=922 = pusat art 922; 1280-b2: 384 = 384. Vision: glow + bayangan tepat di bawah diorama.
- `npm run build` → Complete, exit 0.

## Belum terverifikasi
- Transisi resize dari ≤500px ke tinggi normal (dicek lewat logika: event resize → req → atribut dilepas), Safari/iOS.
- Run lengkap `qa/run.mjs` tidak dijalankan (hanya bagian kredit).
