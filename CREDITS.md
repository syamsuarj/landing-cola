# Kredit Foto

Semua foto diunduh dari Unsplash dan disimpan lokal di `src/assets/photos/` (tidak di-hotlink), dirender lewat `astro:assets`.
Lisensi: **Unsplash License** — boleh dipakai gratis untuk komersial/non-komersial, tanpa wajib atribusi (atribusi tetap dicantumkan sebagai etika). Foto berlabel Unsplash+ TIDAK dipakai.

Cara verifikasi lisensi (T5a, 2026-10-05): halaman foto Unsplash diblokir bot-wall, jadi tiap foto dicek via endpoint `https://unsplash.com/photos/<id>/download` — foto gratis (Unsplash License) mengembalikan HTTP 302 ke `images.unsplash.com` dengan nama file `<nama-fotografer>-<id>-unsplash.jpg`; foto Unsplash+ mengembalikan 403. Nama fotografer di bawah diambil dari nama file tersebut (slug → kapital), belum dicocokkan manual ke halaman profil.

Format baris (append dengan `>>`): `| <section> | <file> | <url> | <fotografer> | <lisensi> |`

| Section | File | URL | Fotografer | Lisensi |
|---|---|---|---|---|
| indonesia | src/assets/photos/indonesia-jalanan-malam.jpg | https://unsplash.com/photos/hihEmRwRKK4 | Reyhan Aviseno (Unsplash) | Unsplash License (https://unsplash.com/license) |
| cta | src/assets/photos/cta-tuang-cola.jpg | https://unsplash.com/photos/uurg0rkdNjE | Brandee Taylor (Unsplash) | Unsplash License (https://unsplash.com/license) |
| keberlanjutan | src/assets/photos/keberlanjutan-kaleng-daur-ulang.jpg | https://unsplash.com/photos/XMIU9IUV0n4 | Engin Akyurt (Unsplash) | Unsplash License (https://unsplash.com/license) |
| galeri | src/assets/photos/galeri-piknik.jpg | https://unsplash.com/photos/eIW_KhBzYbA | Vitaly Gariev (Unsplash) | Unsplash License (https://unsplash.com/license) |
| galeri | src/assets/photos/galeri-nonton-bareng.jpg | https://unsplash.com/photos/3LoYOG7Z6mA | Ahmet Kurt (Unsplash) | Unsplash License (https://unsplash.com/license) |
| galeri | src/assets/photos/galeri-ulang-tahun.jpg | https://unsplash.com/photos/A2ejcvPWygA | Waldemar Brandt (Unsplash) | Unsplash License (https://unsplash.com/license) |
| galeri | src/assets/photos/galeri-perjalanan.jpg | https://unsplash.com/photos/B579sdYlf6U | Odile (Unsplash) | Unsplash License (https://unsplash.com/license) |
| galeri | src/assets/photos/galeri-olahraga.jpg | https://unsplash.com/photos/r9q73gs2xMg | Lamina Amedo (Unsplash) | Unsplash License (https://unsplash.com/license) |
| sejarah | src/assets/photos/sejarah-apotek.jpg | https://unsplash.com/photos/v1SLkdKQoxA | Fabian Kleiser (Unsplash) | Unsplash License (https://unsplash.com/license) |
| produk | src/assets/photos/produk-gelembung.jpg | https://unsplash.com/photos/eEbkC6R1NBU | Alex He (Unsplash) | Unsplash License (https://unsplash.com/license) |
| botol | src/assets/photos/botol-kontur-gelap.jpg | https://unsplash.com/photos/kOdRTCqPZj4 | Alexandr Popadin (Unsplash) | Unsplash License (https://unsplash.com/license) |
| fakta | src/assets/photos/fakta-es.jpg | https://unsplash.com/photos/FSsNvNHuRLk | Jens Riesenberg (Unsplash) | Unsplash License (https://unsplash.com/license) |
| indonesia | src/assets/photos/indonesia-warung-malam.jpg | https://unsplash.com/photos/VJNQY4eViwk | Luthfian Alfajr (Unsplash) | Unsplash License (https://unsplash.com/license) |
| keberlanjutan | src/assets/photos/keberlanjutan-botol.jpg | https://unsplash.com/photos/esEbfQBKaEI | Muki Pan (Unsplash) | Unsplash License (https://unsplash.com/license) |
| galeri | src/assets/photos/galeri-makan-keluarga.jpg | https://unsplash.com/photos/gorbBYbo6KM | Tyson (Unsplash; nama dari slug) | Unsplash License (https://unsplash.com/license) |
