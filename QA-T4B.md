# QA-T4B — Verifikasi Fakta & Klaim (hanya laporan, kode tidak diubah)

Tanggal: 2026-10-05. Lingkup: Hero, About, Products, Indonesia, Facts, Sustainability, Gallery, Testimonials, FAQ, CTA, Footer, index.astro.

Sumber utama:
- [S1] Coca-Cola Co., "A Short History of Coca-Cola" (125 tahun): https://www.coca-colacompany.com/content/dam/corporate/us/en/about-us/history/coca-cola-a-short-history-125-years-booklet.pdf
- [S2] Coca-Cola Co., Contour bottle: https://www.coca-colacompany.com/about-us/history/the-history-of-the-coca-cola-contour-bottle
- [S3] Coca-Cola Co. 10-K/SEC ("more than 200 countries and territories"): https://investors.coca-colacompany.com/filings-reports/all-sec-filings/content/0000021344-25-000047/ko-20250626_d2.htm ; https://investors.coca-colacompany.com/about
- [S4] Coca-Cola Nigeria FAQ (Pemberton, 8 Mei 1886): https://www.coca-cola.com/ng/en/about-us/faq/who-invented-coca-cola
- [S5] IOC: https://olympics.com/ioc/news/a-raft-of-olympic-innovations
- [S6] NYT 11 Jul 1985 (Classic kembali): https://nytimes.com/1985/07/11/business/old-coke-coming-back-after-outcry-by-faithful.html ; Coca-Cola Co. New Coke: https://coca-colacompany.com/about-us/history/new-coke-the-most-memorable-marketing-blunder-ever
- [S7] Coca-Cola Co. Zero Sugar PR 2017: https://investors.coca-colacompany.com/news-events/press-releases/detail/900/coca-cola-zero-sugar-launches-in-u-s-with-new-and-improved-real-coca-cola-taste ; PR 2005 (arsip): https://web.archive.org/web/20070109090926/http:/www2.coca-cola.com/presscenter/nr_20050321_americas_cocacola_zero.html
- [S8] Wikipedia Diet Coke (unveiled 8 Jul 1982, US 9 Aug 1982): https://en.wikipedia.org/wiki/Diet_Coke
- [S9] Candler 1888/1892: https://www.coca-colacompany.com/about-us/history/the-asa-candler-era ; Wikipedia The Coca-Cola Company (didirikan Jan 1892)
- [S10] Biedenharn, 12 Mar 1894: http://www.biedenharncoca-colamuseum.com/bottle.htm
- [S11] Cherry 1985: https://en.wikipedia.org/wiki/Coca-Cola_Cherry
- [S12] Indonesia (sekunder): https://id.wikipedia.org/wiki/Coca-Cola_Europacific_Partners_Indonesia

## About.astro (timeline) + intro
| Klaim di halaman | Status | Catatan / sumber | Saran |
|---|---|---|---|
| "1886 … Pemberton meracik … di Atlanta … dijual sebagai minuman tonik di apotek" | BENAR | 8 Mei 1886, Jacobs' Pharmacy [S1][S4] | Opsional: tambah "(8 Mei)" dan "Jacobs' Pharmacy" |
| "1888 Asa Candler mulai mengambil alih hak…" | BENAR | Mulai 1888, kendali penuh ±1891 [S1][S9] | Tidak perlu diubah |
| "1892 Candler mendirikan The Coca-Cola Company di Georgia" | BENAR | Diinkorporasi sbg perusahaan Georgia, 29 Jan 1892 [S1][S9] | Lebih presisi: "Candler mendirikan/mengincorporasi…" |
| "1894 Coca-Cola mulai dibotolkan untuk pertama kalinya" | BENAR dengan catatan (menyesatkan bila tanpa konteks) | Pembotolan pertama oleh Joseph Biedenharn, Vicksburg, Mississippi, 12 Mar 1894 [S10]; tetapi Coca-Cola Co. menandai pembotolan komersial/franchise mulai 1899 (Chattanooga) [S1][S2] | "1894: Joseph Biedenharn di Vicksburg, Mississippi, pertama kali membotolkan Coca-Cola. Pembotolan berskala luas dimulai 1899." |
| "1915 Desain botol kontur dibuat oleh Root Glass Company…" | BENAR | Prototipe didesain Alexander Samuelson (Root Glass), dipatenkan 16 Nov 1915; produksi luas 1916 [S1][S2] | Opsional tambah "dipatenkan 1915, produksi luas 1916" |
| "1928 sponsor Olimpiade Amsterdam" | BENAR | Awal kemitraan Olimpiade 1928 [S1][S5] | OK |
| "1971 iklan 'I'd Like to Buy the World a Coke'" | BENAR | [S1] | OK |
| "1982 Diet Coke … rendah kalori" | BENAR (tahun) / kata "rendah kalori" kurang tepat | Diumumkan 8 Jul, rilis AS 9 Aug 1982 [S8]. Diet Coke dipasarkan sbg tanpa kalori (zero-calorie), bukan sekadar "rendah" | "varian tanpa gula/tanpa kalori" |
| "1985 New Coke lalu Classic kembali" | BENAR | New Coke 23 Apr 1985; Classic diumumkan 10–11 Jul 1985 [S6] | OK |
| "2005 Coca-Cola Zero … di AS" | BENAR | Juni 2005 AS [S7]; menjadi Zero Sugar 2017 [S7] | Opsional: "(menjadi Zero Sugar pada 2017)" |
| Intro "tahun 1886 di Atlanta … John Pemberton … apoteker" | BENAR | [S1][S4] | OK |

## Facts.astro
| Klaim | Status | Sumber | Saran |
|---|---|---|---|
| "1886 Tahun pertama kali diracik" | BENAR | [S1] | OK |
| "200+ Negara tempat produknya dijual" | BENAR | 10-K: "more than 200 countries and territories" [S3] | Presisi: "Negara dan wilayah" |
| "1915 Tahun desain botol kontur dibuat" | BENAR | [S1][S2] | OK |
| "Atlanta kota kelahiran" | BENAR | [S1] | OK |

## Hero.astro
| Klaim | Status | Saran |
|---|---|---|
| "Sejak 1886" / "lahir di Atlanta" | BENAR | OK |
| "dinikmati di lebih dari 200 negara" | BENAR [S3] | Ganti "negara dan wilayah" (sesuai sumber) |
| "Rasa yang Dikenal di Seluruh Dunia" | Opini/marketing, tidak berbahaya | OK |

## Products.astro
| Klaim | Status | Catatan | Saran |
|---|---|---|---|
| Original: "resep yang dikenal sejak lebih dari satu abad lalu" | BENAR dengan catatan | Merek sejak 1886, tetapi formula pernah berubah (mis. komposisi awal; New Coke 1985 sempat) | "cita rasa klasik yang sudah ada sejak 1886" |
| Original "mengandung gula" | BENAR | | OK |
| Zero Sugar: "tanpa gula, pemanis pengganti, berkafein, bukan produk kesehatan" | BENAR | Zero Sugar tanpa gula/kalori, berpemanis buatan, mengandung kafein [S7] | OK (disclaimer bagus) |
| Light/Diet: "Rendah kalori" | BENAR tapi kurang tepat | Diet Coke/Light umumnya tanpa kalori [S8]; "Light" di Indonesia bisa beda | "Tanpa/rendah kalori — cek label" |
| Light/Diet "Di tiap negara namanya bisa Light atau Diet" | BENAR | [S8] | OK |
| Cherry: "Ketersediaan terbatas di beberapa negara" | TIDAK TERVERIFIKASI (masuk akal) | Cherry diluncurkan 1985 di AS, ada di AS & sebagian pasar internasional [S11]; tak ada sumber resmi soal "terbatas" | "Ketersediaan berbeda di tiap negara" |
| "Mengandung gula"/komposisi tiap negara bisa berbeda | BENAR (disclaimer baik) | | OK |

## Indonesia.astro
| Klaim | Status | Catatan | Saran |
|---|---|---|---|
| "Minuman bersoda sering hadir di momen kumpul…" | TIDAK TERVERIFIKASI (generalisasi sosial, risiko rendah) | | Boleh tetap; atau dilabeli "gambaran umum" |
| "Produk … umumnya diproduksi dan didistribusikan melalui mitra pembotolan setempat" | BENAR | Model sistem bottler Coca-Cola [S1][S3] | OK |
| "Tersedia … minimarket, supermarket, restoran, warung" | TIDAK TERVERIFIKASI (umum, risiko rendah) | | OK |
| Tidak ada angka/tanggal Indonesia | — | Tidak ada klaim berisiko. Opsi: Coca-Cola hadir di Hindia Belanda 1927 (sumber sekunder, [S12]; konfirmasi di coca-cola.co.id sebelum dipakai; situs resmi tak bisa diverifikasi langsung) | Jika ingin konten lokal, tambahkan 1927 dgn sumber resmi |

## Sustainability.astro
| Klaim | Status | Saran |
|---|---|---|
| Botol PET & kaleng aluminium "dapat didaur ulang jika dikumpulkan dan dipilah" | BENAR, bersyarat memadai | OK |
| "Coca-Cola secara publik menyatakan upaya efisiensi dan pengelolaan air" | BENAR (klaim 'menyatakan', bukan hasil) — tidak diverifikasi ke laporan spesifik | Tambah tautan ke laporan keberlanjutan resmi |
| "Pengurangan emisi … topik … industri" | BENAR (netral) | OK |
| Tidak ada klaim "ramah lingkungan", angka, atau target | Tidak menyesatkan (tidak ada greenwashing) | OK |

## FAQ.astro
| Klaim | Status | Saran |
|---|---|---|
| "Penemu: Pemberton, 1886, Atlanta" | BENAR [S4] | OK (nama lain: Frank Robinson memberi nama/logo, bukan penemu) |
| "Formula rahasia dagang, tidak dipublikasikan" | BENAR (formula disimpan di brankas bank sejak 1925 [S1]) | OK |
| Zero Sugar vs Original | BENAR | OK |
| "Varian cola umumnya mengandung kafein" | BENAR (ada varian bebas kafein) | OK |
| Penyimpanan | BENAR (umum), tak ada klaim kesehatan | OK |
| "Bukan situs resmi" | Pernyataan situs sendiri, tepat | OK |

## Gallery / Testimonials / CTA / Footer / index
- Gallery: berlabel "Ilustrasi sederhana … bukan foto atau materi resmi" → OK.
- Testimonials: badge "Ilustrasi: kutipan fiktif…" + tiap figcaption "(ilustrasi)" + nama "Contoh pengunjung A/B/C" → JELAS berlabel. Tidak ada klaim kesehatan. OK.
- CTA: form dinyatakan demo/tidak mengirim data → OK. Footer: disclaimer non-resmi & merek dagang → OK. Catatan kecil: kalimat "merek dagang terdaftar milik pemiliknya masing-masing" bisa diperjelas jadi "…milik The Coca-Cola Company".
- index.astro description: "sejarah sejak 1886 di Atlanta" → BENAR.

## RINGKASAN — Klaim bermasalah
| # | Lokasi | Klaim | Masalah | Tingkat | Perbaikan |
|---|---|---|---|---|---|
| 1 | About 1894 | "Coca-Cola mulai dibotolkan untuk pertama kalinya" | Benar (Biedenharn, Vicksburg), tetapi pembotolan komersial resmi menurut Coca-Cola Co. mulai 1899; tanpa konteks bisa terbaca keliru | Sedang | Sebut Biedenharn/Vicksburg 1894 dan 1899 untuk skala luas |
| 2 | About 1982 / Products | Diet/Light "rendah kalori" | Produk dipasarkan tanpa kalori; kata kurang presisi | Rendah | "tanpa/rendah kalori" |
| 3 | Hero & Facts | "200+ negara" | Sumber: "countries and territories" | Rendah | "negara dan wilayah" |
| 4 | Products Cherry | "Ketersediaan terbatas" | Tidak terverifikasi | Rendah | "Ketersediaan berbeda di tiap negara" |
| 5 | Products Original | "resep … lebih dari satu abad" | Formula berubah sepanjang sejarah | Rendah | "cita rasa klasik sejak 1886" |
| 6 | Indonesia | Generalisasi pasar (momen/outlet) | Tidak terverifikasi, risiko rendah | Rendah | Beri label "gambaran umum" atau hapus |
| 7 | About 2005 | Zero (2005) vs "kini Zero Sugar" | Benar, tapi bisa tambah tahun 2017 | Info | opsional |

Tidak ditemukan: tahun yang SALAH, klaim kesehatan menyesatkan, greenwashing, atau testimoni tanpa label.

## Klaim yang BENAR (terverifikasi)
1886 Pemberton/Atlanta/Jacobs'; 1888 Candler; 1892 perusahaan Georgia; 1915 botol kontur (Root Glass); 1928 Olimpiade Amsterdam; 1971 iklan Hilltop; 1982 Diet Coke; 1985 New Coke→Classic; 2005 Coca-Cola Zero di AS; 200+ negara; formula rahasia dagang; Zero Sugar tanpa gula+pemanis+kafein; sistem mitra pembotolan; daur ulang PET/aluminium; label ilustrasi pada galeri & testimoni.

Batasan: coca-cola.co.id tidak diakses langsung (hanya sumber sekunder untuk Indonesia); halaman resmi "Our First Bottle" gagal dimuat, sehingga 1894 diverifikasi lewat museum Biedenharn + halaman resmi yang menyebut 1899.
