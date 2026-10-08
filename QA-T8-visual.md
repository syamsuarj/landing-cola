# QA-T8 visual & botani (QA-B) — 2026-10-08

Skrip: `node qa/t8b-shots.mjs` (dev :3000, DPR 2, GPU metal) → `qa/out-t8b/` (`<w>-b<n>.png`, `-art.png` crop, `rm-*` reducedMotion, `nogl-*` --disable-webgl --disable-3d-apis). Log: `qa/out-t8b/log.txt`.
Semua 4 viewport: `is3d=true`; rm & nogl: `is3d=false` (SVG). 0 pageerror.

## 1. Botani (1280 b1 — `qa/out-t8b/1280-b1-art.png`)
- Batang: tebal, bertekstur sisik pangkal pelepah (pola belah ketupat) — **terbaca sawit**, terlihat jelas dari jarak hero (bukan tertutup penuh). OK.
- Mahkota: roset lebat, pelepah melengkung dengan anak daun menyirip halus — bukan bilah datar, bukan pakis. OK. Mahkota agak "bulat-meledak" (pelepah ke segala arah, sedikit yg menjuntai ke bawah) → sedikit mirip palem hias, tapi masih sawit.
- TBS di ketiak: ada (titik merah) tapi **sangat kecil** di 1280 — nyaris tak terbaca. → V-1.
- TBS panen di jalan: 2–3 bola merah gelap — terbaca sebagai buah, tapi bulat-halus seperti bola/raspberry, bukan gerombol lonjong kehitaman-oranye.
- Tata tanam: 5 pohon pola segitiga + jalan panen laterit — OK.
- Tanah laterit: sisi pulau merah-oranye low-poly — OK secara cerita.
- Sudut babak 2 (`1280-b2-art.png`) memperlihatkan batang bersisik paling jelas; klaim programmer "batang pendek & tertutup pelepah" **bukan masalah** — batang sawit memang pendek di tanaman muda-menghasilkan, dan sisik tetap terbaca di 1280/1440. Di 375 (`375-b1.png`) detail hilang, tapi siluet roset + batang tebal tetap "palem kebun", tidak terbaca kelapa (kelapa = batang ramping tinggi melengkung, tajuk jarang).
- Kesimpulan botani 3D: **terbaca kelapa sawit** (cukup meyakinkan untuk non-ahli); kelemahan utama = TBS di pohon terlalu kecil.

## 2. Estetika & komposisi
- Warna mahkota hijau-kuning keemasan (rim light emas) serasi dengan foto gelap & aksen emas. Tidak terlalu kusam.
- Sisi bawah pulau: merah-oranye jenuh, faset low-poly besar, ±40% tinggi objek di babak 1 → paling "berteriak" di komposisi dan gayanya lebih kasar dari pohon yang halus (V-3).
- Tidak ada z-fighting, garis seam, pohon melayang, kliping kamera, atau pohon terpotong tepi kanvas di 1280/1440/375 (dicek crop DPR2).
- 1280 b1/b2/b3, 1440 b1–b3, 375 b1–b3: tidak menabrak teks/tombol (375 b1: pulau di kanan bawah samping "LINI BISNIS", utuh).
- 768 b1: mahkota pohon berada DI BELAKANG baris paragraf ("nasional melalui", "berkelanjutan") dan pulau ±5 px dari tepi kanan viewport (V-2).

## 3. SVG fallback (rm-*, nogl-*)
- Isometrik 6 sawit + 2 TBS panen; TBS di ketiak besar & jelas → terbaca sawit, bahkan lebih jelas dari 3D. Rapi; pas di 375 (utuh di samping tombol, tak tabrak teks).
- TBS panen SVG: bola oranye bertitik hitam → mirip **kepik/ladybug** (V-4) — risiko keluhan "mirip ceri" terulang.
- Bayangan segitiga transparan di bawah lempeng (rm-1280-b1-art.png) terlihat seperti wedge aneh (V-5).
- Transisi SVG→3D: swap instan (`display:none/block`), bentuk berubah dari lempeng persegi isometrik → pulau bulat berbatu, 6→5 pohon. Posisi/ukuran mirip, jadi loncatan sedang (V-6).

## 4. Banding objek lama
- Lama (git HEAD): tetes minyak + butir mengorbit (abstrak, butir mirip ceri). Baru: diorama kebun yang langsung bercerita "perkebunan sawit". Keluhan "bentuk aneh" **terjawab**.

## Temuan
| ID | Sev | Lokasi | Screenshot | Saran |
|---|---|---|---|---|
| V-1 | minor | semua lebar, b1 terutama 1280/375 | `qa/out-t8b/1280-b1-art.png` | TBS di ketiak terlalu kecil (titik merah). palm.ts: skala TBS ×1.6–1.8, geser sedikit keluar dari batang, tambah warna oranye-terang di ujung buah (gradien hitam→merah→oranye). |
| V-2 | minor (nyaris major; di luar lebar AC8) | 768×1024 b1 | `qa/out-t8b/768-b1.png` | Mahkota di belakang paragraf + pulau mepet kanan. hero3d.ts/CSS: di 761–1023px turunkan #hero-art ±120px (di bawah tombol) atau kecilkan 80% & geser kiri 24px. |
| V-3 | taste | b1 semua lebar | `qa/out-t8b/1440-b1.png` | Sisi laterit terlalu jenuh/besar: turunkan saturasi ±20% & gelapkan bagian bawah (gradien vertex ke cokelat tua), tinggi bagian bawah pulau −25%, faset lebih halus. |
| V-4 | minor | SVG, semua lebar | `qa/out-t8b/rm-1280-b1-art.png` | TBS panen SVG mirip kepik: ganti jadi gerombol lonjong (beberapa elips kecil hitam-merah-oranye) tanpa "kaki"/titik hitam besar. |
| V-5 | taste | SVG 1280 | `qa/out-t8b/rm-1280-b1-art.png` | Bayangan wedge segitiga di bawah lempeng → ganti elips blur di bawah atau hapus. |
| V-6 | taste | load, semua lebar | `nogl-1280-b1.png` vs `1280-b1.png` | Swap instan persegi→bulat. Crossfade opacity 400 ms saat is-3d, dan/atau ubah siluet SVG jadi pulau bulat-berbatu agar mirip 3D. |
| V-7 | taste | b1 1280 | `qa/out-t8b/1280-b1-art.png` | TBS panen 3D bulat halus seperti bola; buat sedikit lonjong/berbenjol (cluster instanced) agar konsisten dengan "gerombol". |

## Screenshot representatif
1. `qa/out-t8b/1280-b1-art.png` — 3D babak 1 (crop DPR2)
2. `qa/out-t8b/1280-b2-art.png` — batang bersisik paling jelas
3. `qa/out-t8b/rm-1280-b1-art.png` — SVG fallback

## VERDICT: PASSED
AC 1,2,3,5,6,8 terpenuhi secara visual (375 & 1280 tak tabrak teks, utuh; terbaca sawit; TBS panen ada; warna serasi; SVG sawit untuk no-WebGL/reduced-motion). Tidak ada blocker/major. Disarankan perbaiki V-1, V-2, V-4 sebelum demo klien (klien sensitif pada bentuk buah "mirip ceri").
