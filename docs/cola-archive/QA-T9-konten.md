# QA-T9 — Re-test konten/lisensi setelah T8 (QA-A, 2026-10-06)
Laporan saja; src/README/CREDITS tidak diubah. Format: ID — status — bukti — severity (bila NEW).

## Aset foto (vision, 15/15 file di src/assets/photos)
- **K1 — FIXED (aset)** — `botol-kaca-gelap.jpg` (1600×2400): dekanter kaca amber dengan tutup bola, latar gelap. Zoom badan botol (crop 420,1000–1200,2250): tidak ada logo/teks/emboss/label. Bukan botol kontur (sesuai caption "generik").
- Cek seluruh 15 foto: TIDAK ada logo Spencerian/red disc/dynamic ribbon Coca-Cola di mana pun. Teks pihak ketiga yang terlihat (sudah tercatat sebelumnya, bukan Coca-Cola): papan "Biggies BBQ Coffee Bar" (indonesia-jalanan-malam, K13 saran lama), "…MEDANG"/"COMRO" (warung), label apotek "TINCT: ARNICA…" (sejarah), huruf Jepang "ペットボトル 江東区" (krat PET), potongan merek tak lengkap di kaleng dipres ("BOR…", "SPECI…"), papan iklan kecil stadion (olahraga), lilin "HAPPY BIRTHDAY". Tak ada yang membuat klaim "tanpa logo resmi" salah.
- **K2 — FIXED** — `galeri-nobar-rumah.jpg`: 6 orang dewasa nonton di ruang tamu, mangkuk popcorn/keripik, 3 gelas minuman gelap (tinted glass, tanpa label), remote, busa jari. Tanpa merek terbaca, tanpa anak, tanpa alkohol.
- **K3 — FIXED** — `galeri-makan-bersama.jpg`: 4 orang dewasa berbagi pizza di kafe, cangkir kopi + french press teh. Tanpa anak, tanpa merek terbaca. Catatan: latar belakang buram ada meja bar/rak botol (tak dapat diidentifikasi sebagai alkohol, tidak di fokus) — dapat diterima.
- **K4 — FIXED** — `galeri-perjalanan.jpg`: foto hitam-putih, 2 orang di kursi belakang mobil putih + 2 orang berpelukan di depan pintu depan yang terbuka, latar pegunungan bersalju. Alt Gallery.astro:16 cocok persis.
- Alt K2/K3: nobar "Enam teman … popcorn dan keripik" — akurat. Makan bersama "Empat sahabat dewasa … piza … cangkir teh" — akurat (ada cangkir + french press; teh/kopi tak bisa dibedakan, nit, tidak perlu diubah).
- **K1 render** — Playwright (dev :3000) 1280×800 & 375×812: `#botol figure img` = botol-kaca-gelap.jpg, complete=true; screenshot `qa/out-t9-konten/botol-1280.png`, `botol-375.png` — botol amber gelap tampil penuh, caption 375 terbaca ("1915 Foto suasana: botol kaca generik tanpa merek, bukan botol kontur (Unsplash)"), tanpa layout rusak. Alt IconBottle akurat ("Botol kaca cokelat tanpa label bertutup bulat …"; napi alt: "A brown bottle sitting on top of a wooden table").
- **Klaim "tanpa logo resmi"** (Footer "Bukan materi resmi · Tanpa logo resmi", README penafian) — kini BENAR: 15/15 foto bebas logo Coca-Cola, favicon desain sendiri, tak ada file logo di src/public.

## Teks (K5/K6/K7/K14)
- **K5 — FIXED** — IconBottle: "terinspirasi ilustrasi buah (polong) kakao di Encyclopædia Britannica. Desain ini dipatenkan pada 16 November 1915 dan mulai diproduksi pada 1916." Sesuai sumber (Coca-Cola Co. history: paten 16 Nov 1915, cocoa pod di Britannica).
- **K6 — FIXED** — "Pada awal abad ke-20 Coca-Cola banyak ditiru pesaing seperti Koka-Nola dan Toka-Cola. Pada 1915, para pembotol … untuk membuat botol yang:" + kutipan + `— brief desain botol, 1915`. Arah peniruan benar, kalimat utuh (dicek render 1280).
- **K7 — FIXED** — About 2005: "…sejak 2016–2017 varian ini berganti nama menjadi Coca-Cola Zero Sugar di banyak negara (di AS pada 2017)." Benar (UK 2016, AS Agustus 2017).
- **K14 — FIXED** — About "pada tahun-tahun berikutnya"; Products Original "Cola yang menyegarkan dengan cita rasa klasik yang sudah ada sejak 1886."; tak ada lagi "kola" di src/components; Indonesia "Umumnya tersedia … antardaerah"; FAQ "Bagaimana cara terbaik menyimpannya?"; Sustainability "05 · Lingkungan"; Gallery "(Unsplash, Unsplash License)"; Footer "Penafian"; Header "05 Penutup". Tidak ditemukan kalimat terpotong/salah ejaan di About/Products/IconBottle/Indonesia/FAQ/Sustainability/Gallery/Footer/Header.

## K8 — newsletter (Playwright + Chrome nyata, `qa/t9-k8.mjs`, hasil `qa/out-t9-konten/k8.json`)
- **K8 — FIXED**
  - JS OFF (`javaScriptEnabled:false`): tombol `disabled=true`, input tanpa `name`; isi email + Enter + klik paksa → URL tetap `http://localhost:3000/`, 0 navigasi, 0 request selain favicon.svg (tak ada email di URL). Pesan noscript tampil: "Formulir demo ini memerlukan JavaScript. Tanpa JavaScript tombol tidak aktif dan tidak ada data yang dikirim." (screenshot `k8-nojs.png`). dist/index.html juga: input tanpa name, noscript ada.
  - JS ON: tombol aktif; "bukan-email" → "Masukkan alamat email yang valid." + aria-invalid=true; kosong → pesan sama; "tes@contoh.com" + Enter → "Terima kasih! Ini hanya demo, tidak ada data yang dikirim."; 0 navigasi, 0 request non-GET/berisi email.
  - Catatan (bukan bug produk): satu console error dev-server "504 Outdated Optimize Dep" (cache Vite dev :3000); build prod 0 console error (harness).

## K12 / K15
- **K12 — FIXED** — README: penafian non-resmi, "Tidak ada logo resmi yang dipakai sebagai aset …", favicon monogram "D", foto Unsplash → CREDITS.md, catatan Unsplash License tak mencakup merek dagang. Akurat terhadap kondisi sekarang. Nit: README menyebut `npm run dev` port 4321 (default Astro) — benar. Baris Status "putaran T8 sedang diverifikasi ulang" perlu diperbarui PM sebelum push publik (info).
- **K15 — FIXED** — favicon.svg & favicon.ico (16/32/48 PNG): monogram "D" krem + titik merah di kotak hitam membulat (vision). Bukan logo Astro, bukan disc/gelombang Coca-Cola.

## CREDITS.md / Footer
- **CREDITS — FIXED** — 15 baris = 15 file di src/assets/photos (harness `credits`: 0 tak tercatat, 0 entri tanpa file). Fotografer foto baru diverifikasi napi Unsplash (Anubis dilewati):
  - 3R6NdOhAMP8 → Sixteen Miles Out (@sixteenmilesout), premium/plus/sponsorship=false ✓
  - HHsq_3FF2W4 → Vitaly Gariev (@silverkblack), premium/plus/sponsorship=false ✓
  - YW8UShT0zg0 → Vitaly Gariev (@silverkblack), premium/plus/sponsorship=false ✓
- Footer (render): "Foto oleh … Vitaly Gariev (1, 2, 3 foto galeri) … Sixteen Miles Out (foto botol) … via Unsplash (Unsplash License)"; 15 tautan unsplash.com/photos/<id> cocok dengan 15 ID CREDITS (termasuk 3R6NdOhAMP8, HHsq_3FF2W4, YW8UShT0zg0). Nama lama (Popadin/Tyson) tidak ada lagi.

## Harness
- `node qa/run.mjs --prod --out qa/out-t9` → **SELESAI PASS (280 s)**: build PASS, overflow PASS (375/768/1280), console PASS (0 error/0 warning), screenshots 36/36, variants PASS (reduced-motion/no-js/no-webgl), Lighthouse mobile P91 A100 BP100 SEO100 / desktop P100 A100 BP100 SEO100, credits PASS. Laporan: `qa/out-t9/report.md`.

## Sisa saran lama (tidak dikerjakan sesuai keputusan PM, bukan blocker)
- K9 trade dress botol/favicon — selera; K10 tautan footer; K13 papan "Biggies BBQ" di foto Indonesia (risiko rendah, sudah berlabel foto stok).
- Info: angka "1915" besar di caption foto botol (375) bersebelahan dengan botol generik — caption sudah menjelaskan "bukan botol kontur", dapat diterima.

Berkas QA dibuat: `QA-T9-konten.md`, `qa/t9-k8.mjs`, `qa/out-t9-konten/` (k8.json, k8-nojs.png, k8-js-valid.png, botol-1280.png, botol-375.png), `qa/out-t9/`, `qa/out-t9.log`. src/README/CREDITS tidak diubah; tidak ada git.

**VERDICT: PASS** — K1–K8, K12, K14, K15, CREDITS semua FIXED; tidak ada temuan NEW blocker/major.
