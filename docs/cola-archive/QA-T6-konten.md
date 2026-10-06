# QA-T6 — Konten, Legal/Merek, Lisensi Foto, Bahasa (laporan saja; src/CREDITS/README tidak diubah)

Tanggal: 2026-10-05. Track: konten & lisensi (repo PUBLIC github.com/syamsuarj/landing-cola).
Format temuan: ID | severity | lokasi | teks sekarang | usulan | sumber.

## Temuan (ditulis sambil jalan)

### Metode verifikasi foto
Halaman unsplash.com dilindungi bot-wall Anubis (`/.within.website`, proof-of-work difficulty 1). QA menyelesaikan challenge secara skrip (sha256(randomData+nonce), lalu `/.within.website/x/cmd/anubis/api/pass-challenge`) dan membaca JSON resmi `https://unsplash.com/napi/photos/<ID>` (user.name, user.username, premium, plus, sponsorship, alt, lokasi). Skrip: `~/.hermes/profiles/pm/cache/qa-t6/unsplash_fetch.py`, hasil: `~/.hermes/profiles/pm/cache/qa-t6/unsplash_meta.json`. Isi visual tiap file di `src/assets/photos` dicek dengan vision.

### K1 — BLOCKER — logo resmi Coca-Cola + cincin Olimpiade tampil di foto section Botol
- Lokasi: `src/components/IconBottle.astro` baris 3 & 9 (foto `src/assets/photos/botol-kontur-gelap.jpg`, Unsplash kOdRTCqPZj4); terlihat jelas di render (`qa-t5b-shots/1280-botol-1.png`).
- Teks/aset sekarang: foto botol dengan label merah bertuliskan logo skrip **"Coca-Cola" (Spencerian)** dan **cincin Olimpiade** (+ teks Kiril "Официальный партнёр"), ditampilkan besar setengah layar. Deskripsi resmi Unsplash: "A Coca-Cola glass bottle on a black table in shallow focus, Moscow, Russia."
- Masalah: (a) melanggar aturan proyek "tidak ada logo resmi Coca-Cola dipakai sebagai aset"; (b) membuat klaim di footer ("Bukan materi resmi · **Tanpa logo resmi**", Footer.astro baris 69) dan README baris 5 ("Tidak ada logo resmi yang digunakan") menjadi TIDAK BENAR; (c) cincin Olimpiade adalah merek IOC yang dilindungi ketat; (d) Unsplash License tidak memberi hak atas merek dagang yang tampak di foto. (e) Botol di foto bukan botol kontur 1915 (sisi lurus, bukan flute), padahal caption "1915 Foto ilustrasi botol kaca berlekuk" & alt "Botol kaca berlekuk" mengesankan itu botol kontur.
- Usulan: ganti dengan foto botol kaca generik TANPA label/logo (atau render 3D/SVG prosedural sendiri); perbarui baris CREDITS.md terkait. Jika PM/user sengaja mempertahankan (AC T5 mengizinkan "merek terlihat seperlunya"), minimal: crop/blur label, dan hapus klaim "Tanpa logo resmi"/"Tidak ada logo resmi" di footer & README — tetapi cincin Olimpiade tetap sebaiknya dihilangkan.
- Sumber: https://unsplash.com/photos/kOdRTCqPZj4 (napi: description di atas); Unsplash License "doesn't include trademarks, logos, or brands": https://unsplash.com/license ; IOC Olympic Charter Rule 7–14 (perlindungan simbol Olimpiade): https://olympics.com/ioc/olympic-charter

### Lisensi foto — hasil per foto (sumber: `https://unsplash.com/napi/photos/<ID>`, diambil 2026-10-05)
Semua 15 foto: `premium=false`, `plus=false`, `sponsorship=false` → **tidak ada Unsplash+**, semua di bawah Unsplash License. Rasio dimensi file lokal = rasio asli di Unsplash (cocok untuk ke-15 ID), dan isi visual cocok dengan alt_description resmi.

| File | ID | Nama di CREDITS | Nama di Unsplash (username) | Status | Isi visual / catatan |
|---|---|---|---|---|---|
| indonesia-jalanan-malam.jpg | hihEmRwRKK4 | Reyhan Aviseno | Reyhan Aviseno (@aavisenoo) | TERVERIFIKASI | Jalan ramai Jakarta, papan "Biggies BBQ Coffee Bar" mencolok (lihat K13) |
| cta-tuang-cola.jpg | uurg0rkdNjE | Brandee Taylor | Brandee Taylor (@brandee35) | TERVERIFIKASI | Cola dituang ke gelas, tanpa logo — OK |
| keberlanjutan-kaleng-daur-ulang.jpg | XMIU9IUV0n4 | Engin Akyurt | engin akyurt (@enginakyurt) | TERVERIFIKASI | Kaleng dipres; potongan merek tak terbaca jelas — OK |
| galeri-piknik.jpg | eIW_KhBzYbA | Vitaly Gariev | Vitaly Gariev (@silverkblack) | TERVERIFIKASI | 4 perempuan dewasa piknik, minum teh — OK |
| galeri-nonton-bareng.jpg | 3LoYOG7Z6mA | Ahmet Kurt | Ahmet Kurt (@ahmetkurt) | TERVERIFIKASI | Tribun Galatasaray, spanduk klub/sponsor terbaca (K2) |
| galeri-ulang-tahun.jpg | A2ejcvPWygA | Waldemar Brandt | Waldemar Brandt (@waldemarbrandt67w) | TERVERIFIKASI | Kue + lilin "HAPPY BIRTHDAY" — OK |
| galeri-perjalanan.jpg | B579sdYlf6U | Odile | Odile (@odile__) | TERVERIFIKASI | Foto H/P 4 orang di/dekat mobil (alt salah, K4) |
| galeri-olahraga.jpg | r9q73gs2xMg | Lamina Amedo | Lamina Amedo (@aldes12) | TERVERIFIKASI | Pertandingan sepak bola, Suita Osaka — OK |
| sejarah-apotek.jpg | v1SLkdKQoxA | Fabian Kleiser | Fabian Kleiser (@fabiankleiser) | TERVERIFIKASI | Label: TINCT AURANT, PULV CAPSICI, TINCT ARNICA, TINCT TOLUTAN, INF SENEGAE — **tidak ada label narkotika** — OK |
| produk-gelembung.jpg | eEbkC6R1NBU | Alex He | Alex He (@helium325) | TERVERIFIKASI | Gelembung cairan merah, tanpa teks — OK |
| botol-kontur-gelap.jpg | kOdRTCqPZj4 | Alexandr Popadin | Alexandr Popadin (@irrabagon) | TERVERIFIKASI (lisensi) / **KONTEN BERMASALAH** | Logo Coca-Cola + cincin Olimpiade (K1) |
| fakta-es.jpg | FSsNvNHuRLk | Jens Riesenberg | Jens Riesenberg (@infernisvox) | TERVERIFIKASI | Es batu, cahaya merah — OK |
| indonesia-warung-malam.jpg | VJNQY4eViwk | Luthfian Alfajr | luthfian alfajr (@panasgaram) | TERVERIFIKASI | Penjual gorengan di Garut, papan "GEHU COMRO" — OK |
| keberlanjutan-botol.jpg | esEbfQBKaEI | Muki Pan | Muki Pan (@mukkkkki) | TERVERIFIKASI | Krat botol PET Koto-ku (Jepang), tanpa merek — OK |
| galeri-makan-keluarga.jpg | gorbBYbo6KM | Tyson | Tyson (@tysonbrand) | TERVERIFIKASI | Akun merek Tyson; anak balita (K3) |

Pemakaian: 15 file di `src/assets/photos` = 15 baris CREDITS.md = 15 import di komponen (About, Products, IconBottle, Facts, Indonesia×2, Sustainability×2, Gallery×6, CTA) — tidak ada file yatim/baris yatim. Footer (dev :3000) merender 15 nama dari CREDITS.md otomatis + "via Unsplash (Unsplash License)" — OK.

### K2 — minor — foto "Nonton bareng" menampilkan branding klub Galatasaray
- Lokasi: `src/components/Gallery.astro` baris 4 & 13 (`galeri-nonton-bareng.jpg`, 3LoYOG7Z6mA).
- Sekarang: alt "Tribun stadion penuh penonton dengan bendera merah"; foto berisi spanduk besar "GALATASARAY", bendera merah-kuning klub, spanduk sponsor (tag Unsplash: "galatasaray").
- Usulan: ganti dengan foto kerumunan/nobar netral; atau minimal perbaiki alt: "Tribun stadion penuh suporter dengan bendera merah-kuning" (jangan sebut "merah" saja).
- Sumber: https://unsplash.com/photos/3LoYOG7Z6mA

### K3 — minor — foto keluarga: akun merek Tyson + anak balita di halaman bertema merek minuman
- Lokasi: `src/components/Gallery.astro` baris 5 & 11 (`galeri-makan-keluarga.jpg`, gorbBYbo6KM); CREDITS.md baris 26.
- Sekarang: foto diunggah akun merek @tysonbrand (Tyson), menampilkan 2 anak yang tampak berusia di bawah 5 tahun (tidak minum soda — aman dari sisi hukum). Kebijakan Responsible Marketing The Coca-Cola Company: "We will not feature any children who are, or appear to be, under five." Situs ini memang non-resmi, tetapi meniru gaya promosi merek; lebih aman mengikuti standar itu.
- Usulan: ganti dengan foto makan bersama orang dewasa (tanpa balita). Bila dipertahankan: hapus catatan "(Unsplash; nama dari slug)" di CREDITS.md baris 26 karena nama "Tyson" sudah terverifikasi.
- Sumber: https://unsplash.com/photos/gorbBYbo6KM ; https://www.coca-colacompany.com/policies-and-practices/responsible-marketing-policy

### K4 — minor — alt foto perjalanan tidak akurat
- Lokasi: `src/components/Gallery.astro` baris 16.
- Sekarang: "Foto hitam putih dua orang di dalam mobil saat perjalanan".
- Fakta foto: 4 orang — dua di kursi belakang mobil, dua berpelukan di samping pintu depan yang terbuka, latar pegunungan.
- Usulan: "Foto hitam-putih empat sahabat di dalam dan di samping mobil dengan latar pegunungan".
- Sumber: https://unsplash.com/photos/B579sdYlf6U (alt resmi: "Friends are enjoying a scenic drive in a car")

### K5 — minor (fakta) — inspirasi botol kontur: "biji kakao" keliru
- Lokasi: `src/components/IconBottle.astro` baris 22.
- Sekarang: "Bentuknya terinspirasi dari tampilan biji kakao dalam salah satu referensi ensiklopedia, meskipun bentuk akhirnya tidak persis seperti buah kakao." (kontradiktif: biji vs buah).
- Fakta: tim Root Glass (Earl R. Dean) melihat ilustrasi **buah/polong kakao (cocoa pod)** di Encyclopædia Britannica. Paten atas nama Alexander Samuelson terbit 16 Nov 1915; produksi mulai awal 1916.
- Usulan: "Bentuknya terinspirasi ilustrasi buah (polong) kakao di Encyclopædia Britannica. Desain ini dipatenkan pada 16 November 1915 dan mulai diproduksi pada 1916."
- Sumber: https://high.org/exhibition/the-coca-cola-bottle-an-american-icon-at-100/ ; https://www.coca-colacompany.com/about-us/history/the-history-of-the-coca-cola-contour-bottle

### K6 — minor (fakta + bahasa) — paragraf pembuka Botol menyesatkan & terpotong
- Lokasi: `src/components/IconBottle.astro` baris 17–20.
- Sekarang: "Pada awal abad ke-20 banyak minuman kola ditiru. Untuk membedakan diri, Coca-Cola mengadakan sayembara desain botol yang" → lalu blockquote "“Begitu khas sehingga …”".
- Masalah: (a) yang ditiru adalah **Coca-Cola** oleh pesaing (Koka-Nola, Toka-Cola, Koke), bukan "banyak minuman kola ditiru"; (b) sayembara diputuskan para trustee Coca-Cola Bottling Association (26 Apr 1915) dengan mengundang 8–10 perusahaan kaca; (c) paragraf berakhir dengan kata "yang" lalu kutipan berhuruf kapital — terbaca sebagai kalimat terputus (terutama di pembaca layar), dan kutipan tanpa atribusi.
- Usulan: "Pada awal abad ke-20 Coca-Cola banyak ditiru pesaing seperti Koka-Nola dan Toka-Cola. Pada 1915, para pembotol Coca-Cola menantang sejumlah perusahaan kaca untuk membuat botol yang:" + blockquote "…di lantai.”" + `<cite>— brief desain 1915</cite>`. Konsisten pakai "cola" (bukan "kola") seperti bagian lain.
- Sumber: https://www.coca-colacompany.com/about-us/history/the-history-of-the-coca-cola-contour-bottle

### K7 — minor (fakta) — tahun ganti nama Zero Sugar
- Lokasi: `src/components/About.astro` baris 16.
- Sekarang: "… dan menjadi Coca-Cola Zero Sugar pada 2017."
- Fakta: diluncurkan ulang sebagai Zero Sugar mulai Juni 2016 (Eropa Barat/Inggris) dan 2017 di AS; nama berbeda di sebagian pasar (mis. "No Sugar").
- Usulan: "… dan sejak 2016–2017 berganti nama menjadi Coca-Cola Zero Sugar di banyak negara (di AS pada 2017)."
- Sumber: https://en.wikipedia.org/wiki/Coca-Cola_Zero_Sugar ; PR 2017: https://investors.coca-colacompany.com/news-events/press-releases/detail/900/coca-cola-zero-sugar-launches-in-u-s-with-new-and-improved-real-coca-cola-taste

### K8 — minor (legal/privasi) — newsletter tanpa JS tetap mengirim email lewat URL
- Lokasi: `src/components/CTA.astro` baris 14–23; `src/scripts/sections/cta.ts` baris 8–21.
- Sekarang: `<form id="news-form" novalidate>` tanpa `action`/`method`; teks "Tidak ada data yang dikirim atau disimpan." Dengan JS aktif benar (preventDefault, tanpa fetch — terverifikasi: tidak ada fetch/XHR/sendBeacon di src/). **Tanpa JS**, submit native melakukan GET ke `/?email=<alamat>` → email masuk ke URL, riwayat browser, dan log server hosting.
- Usulan: tombol `disabled` secara default lalu diaktifkan oleh cta.ts, atau `onsubmit="return false"`/sembunyikan form dan tampilkan `<noscript>` "Formulir demo memerlukan JavaScript".
- Sumber: perilaku standar HTML form (method default GET, action default URL dokumen): https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#form-submission-algorithm

### K9 — saran (merek) — favicon & botol ilustrasi meniru trade dress Coca-Cola
- Lokasi: `public/favicon.svg` (lingkaran merah + gelombang putih ≈ "Red Disc" + "Dynamic Ribbon"); `src/components/Bottle.astro` baris 33–37 & `Products.astro` baris 27, 81–82 (siluet botol berlekuk + label merah + pita gelombang); hero3d (label merah + gelombang krem).
- Masalah: bentuk botol kontur adalah merek dagang terdaftar (diberikan status trademark pada 1960 setelah paten habis) dan pita gelombang putih adalah elemen merek. Bukan logo Spencerian, dan disclaimer sudah ada, jadi risiko rendah untuk demo non-komersial.
- Usulan: favicon netral (mis. gelembung/monogram "DC"), hilangkan pita gelombang di label botol SVG/3D atau ubah jadi garis lurus.
- Sumber: https://www.coca-colacompany.com/about-us/history/the-history-of-the-coca-cola-contour-bottle (bagian status Trademark)

### K10 — saran — tautan footer
- Lokasi: `src/components/Footer.astro` baris 31 dan 58.
- Sekarang: "Untuk informasi resmi, kunjungi situs resmi Coca-Cola." (tanpa tautan) dan "Daftar lengkap ada di CREDITS.md." (pengunjung situs yang di-deploy tidak bisa membuka file ini).
- Usulan: tautkan ke https://www.coca-colacompany.com dan ke https://github.com/syamsuarj/landing-cola/blob/main/CREDITS.md .

### K11 — saran — CREDITS.md perlu diperbarui setelah verifikasi
- Lokasi: `CREDITS.md` baris 6 & 26.
- Sekarang: "Nama fotografer … belum dicocokkan manual ke halaman profil"; baris Tyson "(Unsplash; nama dari slug)".
- Usulan: "Nama fotografer & status non-Unsplash+ diverifikasi QA-T6 (2026-10-05) lewat data foto Unsplash"; hapus catatan slug; opsional tambah tautan profil `https://unsplash.com/@<username>` (lihat tabel di atas) sesuai pedoman atribusi Unsplash ("Photo by X on Unsplash").
- Sumber: https://help.unsplash.com/en/articles/2511315-guideline-attribution

### K12 — saran — klaim README harus diselaraskan sebelum push final
- Lokasi: `README.md` baris 5 ("Tidak ada logo resmi yang digunakan") → salah selama K1 belum diperbaiki; baris 7 status "work in progress … belum lulus QA" perlu diperbarui saat rilis.

### K13 — saran — merek pihak ketiga & orang yang dapat dikenali di foto Indonesia
- Lokasi: `src/components/Indonesia.astro` baris 4 & 39 (`indonesia-jalanan-malam.jpg`).
- Papan "Biggies BBQ Coffee Bar" (usaha nyata di Jakarta) sangat mencolok dan wajah pengunjung jelas. Unsplash License mengizinkan, tetapi tidak mencakup hak merek/model release. Caption "foto stok ilustratif, bukan materi resmi" sudah ada → risiko rendah. Opsional: crop agar papan nama tidak dominan.
- Sumber: https://unsplash.com/license

## Akurasi fakta — rekap
| Klaim | Lokasi | Status | Sumber |
|---|---|---|---|
| 1886, John Pemberton (apoteker), Atlanta, Georgia, dijual sbg tonik di apotek | Hero 11,18,33; About 7,27; FAQ 3; Facts 8,11; index.astro 17 | BENAR | S1/S4 di QA-T4B; https://www.coca-colacompany.com/about-us/history |
| 1888 Candler mulai mengambil alih; 1892 The Coca-Cola Company di Georgia | About 8–9 | BENAR | https://www.coca-colacompany.com/about-us/history/the-asa-candler-era |
| 1894 Biedenharn, Vicksburg, Mississippi; skala luas 1899 | About 10 | BENAR (koreksi QA-T4B #1 diterapkan) | http://www.biedenharncoca-colamuseum.com/bottle.htm ; halaman contour bottle (1899 Whitehead & Thomas) |
| 1915 botol kontur, Root Glass Co., Terre Haute | About 11; IconBottle 22; Facts 10 | BENAR (detail kakao: K5) | halaman contour bottle resmi |
| Kutipan brief "dikenali dalam gelap / dari pecahannya" | About 11; IconBottle 19 | BENAR (terjemahan brief 1915) | idem |
| 1928 Olimpiade Amsterdam; 1971 "I'd Like to Buy the World a Coke"; 1985 New Coke→Classic | About 12,13,15 | BENAR | QA-T4B S1/S5/S6 |
| 1982 Diet Coke "tanpa/rendah kalori"; Light/Diet "tanpa/rendah kalori — cek label" | About 14; Products 17–18 | BENAR (koreksi #2 diterapkan) | https://en.wikipedia.org/wiki/Diet_Coke |
| 2005 Coca-Cola Zero di AS; Zero Sugar 2017 | About 16 | BENAR sebagian (K7) | Wikipedia Zero Sugar |
| "200+ negara dan wilayah" | Hero 18,39; Facts 9 | BENAR (koreksi #3 diterapkan) | 10-K: "more than 200 countries and territories" |
| Cherry "ketersediaan berbeda di tiap negara" | Products 22 | BENAR/aman (koreksi #4 diterapkan) | — |
| Original "cita rasa klasik … sejak 1886" | Products 9 | BENAR (koreksi #5 diterapkan) | — |
| Indonesia: badge "Gambaran umum · bukan data resmi"; tanpa angka/tanggal | Indonesia 29, 34 | OK (koreksi #6 diterapkan) | — |
| Zero Sugar: tanpa gula, pemanis pengganti, berkafein, "bukan produk kesehatan"; FAQ kafein & konsultasi tenaga kesehatan | Products 13–14; FAQ 5–6 | BENAR, tidak ada klaim kesehatan menyesatkan | QA-T4B S7 |
| Formula rahasia dagang | FAQ 4 | BENAR | QA-T4B S1 |
| Keberlanjutan: daur ulang bersyarat; "menyatakan upaya" air; tanpa angka/target | Sustainability 7–9, 20 | OK, tidak greenwashing | — |
Semua 7 koreksi QA-T4B (#1–#7) terverifikasi sudah diterapkan di kode.

## Legal/merek — rekap
- Disclaimer non-resmi: Footer baris 30–31 (+ "milik The Coca-Cola Company"), legal baris 69, FAQ baris 7, Header tag "demo", `<title>` "Situs Demo Non-Resmi", README baris 5 — ADA.
- Logo resmi Spencerian sebagai aset: **ADA di foto Botol → K1 (BLOCKER)**. Tidak ada file logo/SVG resmi di src/ atau public/ (favicon = desain sendiri, lihat K9).
- Testimoni: badge "Ilustrasi: kutipan fiktif …" (Testimonials 11) + "(ilustrasi)" di SETIAP kartu (baris 21, map) + nama "Contoh pengunjung A/B/C" — OK. Klon marquee dibuat oleh JS dari kartu yang sama (label ikut tersalin).
- Klaim kesehatan menyesatkan: tidak ditemukan.
- Newsletter: tidak mengirim data saat JS aktif (terverifikasi kode); celah tanpa JS → K8.

## Bahasa (EYD / konsistensi / sisa Inggris)
### K14 — saran — perbaikan bahasa kecil
| Lokasi | Sekarang | Usulan |
|---|---|---|
| About.astro 8 | "di tahun-tahun berikutnya" | "pada tahun-tahun berikutnya" (kata depan waktu = "pada") |
| Products.astro 9 | "Cita rasa cola yang menyegarkan — cita rasa klasik yang sudah ada sejak 1886." (pengulangan) | "Cola yang menyegarkan dengan cita rasa klasik yang sudah ada sejak 1886." |
| IconBottle.astro 17 | "minuman kola" | "cola" (konsisten dengan seluruh situs) — lihat K6 |
| Indonesia.astro 9 | "Tersedia umumnya di minimarket…" | "Umumnya tersedia di minimarket…" |
| FAQ.astro 8 | "Bagaimana cara menyimpan sebaiknya?" | "Bagaimana cara terbaik menyimpannya?" |
| Footer.astro 29 | eyebrow "Disclaimer" (Inggris) | "Penafian" atau "Pernyataan" |
| Gallery.astro 23 | "(Unsplash, lisensi bebas)" | "(Unsplash, Unsplash License)" — "lisensi bebas" bisa disalahartikan sebagai lisensi terbuka/CC |
| Sustainability.astro 15 | eyebrow "Bab · Lingkungan" | sejajarkan dengan pola bernomor "01 · …", "02 · …" di section lain (atau hapus nomor di semua) |
| Header.astro 7 | menu "Mulai" → #cta (section penutup) | "Gabung" / "Buletin" / "Penutup" |
Tidak ditemukan typo ejaan. Register "kamu/-mu" konsisten. Istilah Inggris tersisa hanya nama produk (Original, Zero Sugar, Light/Diet, Cherry), "FAQ", judul iklan 1971 — wajar.

### K15 — saran — favicon.ico masih logo default Astro
- Lokasi: `public/favicon.ico` (655 B, logo Astro hitam-pink bawaan template). Layout hanya menautkan favicon.svg, tetapi browser tetap bisa meminta /favicon.ico (mis. tab bookmark, Safari lama).
- Usulan: ganti dengan versi .ico dari favicon sendiri (setelah K9) atau hapus.

## VERDICT: FAIL
Harus diperbaiki sebelum push final ke repo public:
- **K1 (BLOCKER)** — foto `botol-kontur-gelap.jpg` menampilkan logo resmi Coca-Cola + cincin Olimpiade; membuat klaim "Tanpa logo resmi" (footer) & "Tidak ada logo resmi" (README) salah. Ganti foto (dan baris CREDITS) atau crop/blur + perbaiki klaim.

Tidak ada temuan major lain. Disarankan ikut diperbaiki dalam putaran yang sama (minor): K2, K3, K4, K5, K6, K7, K8. Saran: K9–K15.
Lisensi: 15/15 foto TERVERIFIKASI (nama fotografer + ID cocok, semua Unsplash License, 0 Unsplash+). Koreksi QA-T4B #1–#7: semua sudah diterapkan.
