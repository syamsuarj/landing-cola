# QA-T10 visual & UX (QA-D) — 2026-10-08

Skrip: `node qa/t10b-shots.mjs` (dev :3000, DPR 2, GPU metal; 2m50s) → `qa/out-t10b/`. Viewport 1440×900, 1280×800, 1024×768, 768×1024, 375×812, 812×375 × babak 1/2/3 + crop `-art.png`; `rm-*` reducedMotion, `nogl-*` no-WebGL (1280/375/768 × b1–b3); `*-edge.png` transisi hero→section; `xf-*.png` frame load 1280 (crossfade). Tambahan: `qa/out-t10b/clip-probe.mjs` (strip 160 px kanan kanvas, 6 frame × 1280/1440/1920) & `clip-full.mjs` (`clipfull-1280-*.png`). Montase: `m-<w>.png`, `m-nogl*.png`, `m-xf.png`, `m-clip-zoom.png`. Log + pusat obj/spot/floor: `log.txt`.
Log: semua 3D `is3d=true`; rm/nogl `is3d=false`. Pusat `.spot`/`.floor` = pusat `[data-hero-object]` (x identik) di semua viewport & babak.

## 1. Pemisahan diorama vs latar
- 1440/1280/1024/768/375, babak 1–3: diorama **jelas terpisah** — latar studio gelap, pulau hijau-laterit kontras, glow emas lembut di belakang, bayangan elips gelap tepat di bawah pulau di tiap babak (ikut pindah kanan→kiri→kanan; tak tertinggal). `m-1280.png`, `m-1024.png`, `m-768.png`, `m-375.png`.
- **W-1 (major)**: di babak 1 desktop, saat orbit idle kamera, pulau **terpotong garis vertikal lurus di tepi kanan kanvas** (x≈1190 di 1280, sebelum tepi viewport) — 4 dari 6 frame 1280, juga 1440 & 1920. `qa/out-t10b/clipfull-1280-2.png`, `m-clip-zoom.png`. Di latar foto lama potongan ini tersamar; di latar gelap polos kini sangat terlihat → langsung terbaca "kotak". Saran (src/scripts/hero3d.ts / CSS `#hero-art` di Hero.astro): perbesar margin framing — mundurkan kamera/ kurangi radius orbit idle ±10–15% di babak 1, atau perlebar kanvas (#hero-art) ke kanan hingga tepi viewport (overflow visible, pusat objek tetap) + uji bounding box proyeksi pulau ≤ 92% lebar kanvas di semua sudut orbit.

## 2. Kesan profesional background
- Kontur topografi rapi, garis halus kontinu, tanpa moiré/ garis patah/ potongan kotak; opacity rendah — di belakang judul & paragraf tidak mengganggu baca (`1440-b1.png`, `1280-b1.png`). Kesan korporat/ "peta perkebunan" — **naik jauh** dibanding foto lama.
- Foto blur bawah: hampir tak terbaca sebagai foto; tidak ada noda/ banding yang terlihat. Pabrik/atap hilang total.
- Transisi hero→section (`1440-edge.png`): hero memudar ke hijau-hitam lalu strip 4 warna brand + section terang "Sambutan" — tepi tegas tapi disengaja (strip brand), tak ada loncatan aneh. OK.
- Bayangan di 375/768 sedikit tampak sebagai "pita" horizontal gelap-terang di bawah pulau (`375-b1-art.png`) — wajar, taste.

## 3. Status temuan lama
| ID | Status | Bukti |
|---|---|---|
| V-1 TBS di pohon | **Fixed** — gerombol merah-oranye jelas di ketiak di 1280/1440/375 | `1280-b2-art.png`, `375-b1-art.png` |
| V-2 768 tak tertutup teks | **Fixed** — pulau di bawah tombol, utuh, tak mepet tepi | `m-768.png` |
| V-3 laterit kalem | **Fixed** — sisi lebih tipis, cokelat-merah gelap, faset halus | `1440-b1-art.png` vs `qa/out-t8b/1440-b1-art.png` |
| V-4 TBS SVG bukan kepik | **Sebagian** — kini oval bergaris merah-oranye-ungu; masih terbaca "biji/ kumbang pipih" di 1280 SVG, tapi tidak lagi kepik bertitik | `nogl-1280-b2.png` |
| V-5 wedge bayangan SVG | **Fixed** — diganti elips blur/ floor dari backdrop | `nogl-1280-b1.png` |
| V-6 transisi SVG→kanvas | **Fixed sebagian** — crossfade halus (`xf-12`→`xf-13`, ±400 ms, tak berkedip); bentuk tetap beda (SVG lempeng isometrik bulat-kerucut, 6 sawit cerah vs 3D pulau rata, 5 sawit lebih gelap) → "morph" terlihat, taste | `m-xf.png` |
| V-7 TBS panen berbenjol | **Fixed** — di 3D panen terbaca gerombol merah berbenjol | `1280-b2-art.png` |

## 4. 375 babak 1
- Pulau & pelepah **tidak menyentuh** "strategis." (jarak ±100 px CSS) maupun tombol "LINI BISNIS" (pelepah kiri ±15–20 px di kanan/bawah tepi tombol; kanvas transparan memang menumpuk area tombol, tapi tak ada piksel objek di atas tombol). `375-b1.png`, `375-b1-art.png`. SVG (`nogl-375-b1.png`) sama: tak menyentuh. → PASS.

## 5. 812×375 landscape
- Teks & tombol muat; hero terlihat sebagai layar teks yang rapi — tidak terasa kosong (kontur mengisi).
- **W-2 (minor)**: objek disembunyikan, tapi `.spot`/`.floor` backdrop **tetap tampil** → elips bayangan gelap + glow "yatim" melayang di kanan tanpa objek (b1/b2 tengah-kanan; b3 kanan atas) — terbaca seperti noda. `qa/out-t10b/m-812.png`, `812-b1.png`. Saran: `src/components/HeroBackdrop.astro` — sembunyikan `.floor` (dan redupkan `.spot`) pada `@media (max-height: 500px)` atau saat `[data-hero-object]` `display:none` (skrip pelacak sudah ada: set `hidden` bila rect 0×0).

## 6. Konsistensi SVG fallback
- SVG (nogl/rm) duduk baik di latar baru, glow+floor tepat di bawahnya; tak ada wedge. `m-nogl1280.png`.
- **W-3 (minor)**: 1280 no-WebGL babak 2, tepi kanan lempeng SVG + TBS panen menyentuh/ berada tepat di belakang huruf awal "Energi"/"untuk" (celah ≈0–8 px). `qa/out-t10b/nogl-1280-b2.png`, `z-nogl1280b2-overlap.png`. 3D di posisi sama aman. Saran: Hero.astro blok `.fallback` — `viewBox` beri padding kanan ±6% / skala SVG 0,92 di babak 2, atau geser `.fallback` −24 px.
- **W-4 (taste)**: gaya SVG (flat vektor cerah, hijau jenuh, lempeng kerucut) vs 3D (semi-realistis gelap) + latar studio yang kalem — SVG terasa lebih "kartun". Turunkan kecerahan hijau ±15%, tambahkan gradien gelap ke bawah lempeng (Hero.astro `.fallback`).

## 7. Sebelum vs sesudah
- Sebelum (`qa/out-t8b/1280-b1.png`): pulau di atas foto kebun+pabrik ramai, hijau-di-atas-hijau, laterit merah jenuh dominan. Sesudah (`1280-b1.png`): panggung gelap bersih, kontur emas/mint halus, glow + bayangan → objek "pop", kesan premium-korporat. **Keluhan klien (latar kurang profesional, 3D tak jelas) terjawab** — dengan catatan W-1 kini justru lebih kentara karena latar bersih.
- Rekomendasi taste (maks 3, paling berdampak):
  1. Perbaiki W-1 dulu (framing kanvas) — satu-satunya hal yang merusak kesan "premium" di layar utama desktop.
  2. Naikkan sedikit exposure/ rim light mahkota 3D (+10–15%) — di latar gelap baru pohon 3D agak "berlumpur" dibanding SVG (`375-b1-art.png`).
  3. Samakan siluet SVG ke pulau 3D (lebih rata, sisi tipis, 5 pohon, warna lebih kalem) agar crossfade tak terlihat seperti ganti objek.

## Temuan baru
| ID | Sev | Lokasi | Screenshot | Saran |
|---|---|---|---|---|
| W-1 | **major** | 3D babak 1, 1280/1440/1920 (orbit idle) | `qa/out-t10b/clipfull-1280-2.png`, `m-clip-zoom.png` | hero3d.ts: kurangi zoom/ radius orbit di babak 1 atau perlebar `#hero-art` ke kanan (Hero.astro CSS); verifikasi proyeksi bbox pulau di semua sudut orbit |
| W-2 | minor | 812×375 semua babak | `qa/out-t10b/m-812.png` | HeroBackdrop.astro: sembunyikan `.floor`/`.spot` saat objek disembunyikan |
| W-3 | minor | no-WebGL 1280 b2 | `qa/out-t10b/nogl-1280-b2.png` | Hero.astro `.fallback`: padding/skala SVG |
| W-4 | taste | SVG semua lebar | `qa/out-t10b/m-nogl1280.png` | redupkan & selaraskan gaya SVG |

## Screenshot terbaik
1. `qa/out-t10b/1280-b2-art.png` — diorama 3D terpisah jelas, TBS & bayangan
2. `qa/out-t10b/clipfull-1280-2.png` — W-1 potongan kanvas
3. `qa/out-t10b/m-812.png` — W-2 bayangan yatim di landscape

## VERDICT: FAILED
Background baru & perbaikan V-1..V-7 berhasil (keluhan klien terjawab), tapi W-1 (major): diorama terpotong garis lurus di tepi kanvas pada babak 1 desktop saat orbit idle — sangat terlihat di latar gelap baru, tepat di layar pertama klien. Setelah W-1 diperbaiki (+ W-2/W-3 disarankan), cukup retest 1280/1440 babak 1 × 6 frame orbit (`qa/out-t10b/clip-probe.mjs`) + 812×375.
