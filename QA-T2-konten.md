# QA-T2 — Konten vs situs resmi (QA-B)

Tanggal: 2026-10-06 · Penguji: QA-B · Sumber verifikasi: situs live diambil ulang via curl (UA browser) —
https://agrinaspalma.co.id/ (termasuk props JSON astro-island: About/Milestones, Leadership, NewsSection, AnnualReport),
/career, /procurement, /news, 4 halaman artikel, API popup CMS (`cms.agrinaspalma.app/api/popups/active?includeExpired=true`).
Halaman lokal: http://localhost:3001/ (SSR HTML dibandingkan baris-per-baris dengan teks situs).
Lingkup: src/components/*.astro, CREDITS.md, README.md, public/, src/assets/agrinas/. Tidak ada file src/ yang diubah.

## Ringkasan pemeriksaan (LULUS)
- **Hero babak 1**: kicker, judul "Mengelola Energi Hijau *Nusantara*", lead, tombol Tentang Agrinas / Lini Bisnis — sama persis dengan beranda.
- **Apresiasi**: salam, isi surat, "Terima Kasih", 2 kartu (Keterbukaan Informasi, Sinergi Tumbuh Bersama) — verbatim.
- **Tentang**: "BUMN Persero · Berdiri Februari 2025", "Kemandirian Energi & Pangan", Patriot, Loyal, Profesional, mandat Presiden Prabowo Subianto / Asta Cita — verbatim.
- **Filosofi Logo**: paragraf konstruksi + 5 makna (Hijau Ekosistem, Kuning Produktivitas, Biru Energi Bersih, Merah Semangat, Teks "Nusantara" Kedaulatan) + tagline penutup — verbatim.
- **Milestones I–VI**: tanggal (10 Mar, 26 Mar, 9 Jul, 12 Sep, 24 Des 2025; 10 Apr 2026), hektare (221.868; 216.990,25; 394.547,29; 1.507.591,9; 204.575,383; 30,5 ribu) dan kutipan — cocok 100% dengan JSON island About.
- **Visi & Misi 01–05**: verbatim.
- **Kepemimpinan**: 12 nama + jabatan sesuai urutan situs. Foto: tiap file lokal dibandingkan secara perseptual dengan URL CMS per nama orang (diff 0,0–0,1) → semua foto tepat orangnya.
- **Bisnis**: 9 produk/layanan + paragraf pengantar verbatim; gambar = /images/business/* resmi (diff 0,0).
- **Angka**: 221.868 ha (Tahap I) dan 1.507.591,9 ha (Tahap IV) tertulis di situs; 2025/Februari 2025 tertulis; tidak ada total hektare karangan. (lihat K4 untuk 6/9/12.)
- **Kemitraan**: lead IPS verbatim; 8 langkah = urutan proses di paragraf IPS /procurement (manajemen vendor → HPS → … → SPPBJ → kontrak → pemantauan) — setia makna; tautan IPS Vendor & PDF/Drive alur registrasi sama dengan situs.
- **Karir**: judul, sub, lead beranda verbatim; 5 pilar + AKHLAK (6 nilai) verbatim dari /career; tautan /career & Talentics sama dengan situs.
- **Berita**: 4 judul, tanggal (6 Okt, 2 Okt, 22 Sep, 13 Sep 2026), ringkasan dicek ke artikel (E20 = kalimat pembuka lengkap; KPK verbatim; Ombudsman & Pertamina diringkas setia makna; alt KPK "Menara Agrinas Palma, Jakarta" & Ombudsman "audiensi … delegasi" sesuai artikel). Slug/tautan kartu berita membuka artikel yang benar (judul `<title>` dicek, bukan sekadar HTTP 200 — situs mengembalikan 200 juga untuk "Berita Tidak Ditemukan").
- **Keterbukaan**: 4 laporan (AR 2025, SR 2025, AR 2024 Indra Karya, SR 2024 Indra Karya) judul + subjudul sesuai JSON AnnualReport; 4 URL PDF hidup (206 application/pdf). WBS tertulis/lisan verbatim. Pita email palsu = parafrase setia dari poster popup resmi (pop_up.jpg CMS).
- **Footer**: tagline, telepon 021-819-2636 (href tel:+62218192636), email, alamat lengkap, © 2026 … All rights reserved — verbatim; 5 sosmed (IG, LinkedIn, YouTube, X, TikTok) = href "Ikuti Kami" situs; catatan "Konsep redesign — bukan situs produksi" ada.
- **Link eksternal**: 22 URL unik di halaman lokal — semua 200/206, semuanya `target="_blank" rel="noopener"`; semua anchor internal (#…) punya target id.
- **Aset**: 44/44 file src/assets/agrinas tercatat di CREDITS.md; URL sumber hidup (200) dan isi gambar cocok (diff perseptual ≤0,3 kecuali 2 logo varian terang yang memang dicatat sebagai varian). Tidak ada import/aset Coca-Cola/Unsplash di src/ (src/assets/photos sudah dihapus di working tree). README & footer memuat catatan konsep redesign.

## Temuan

### K1 — MAJOR — Tautan "Kabar terbaru" di Hero membuka halaman "Berita Tidak Ditemukan"
- File: src/components/Hero.astro:7
- Sekarang: `const newsHref = 'https://agrinaspalma.co.id/news/' + encodeURIComponent(newsTitle);` → koma menjadi `%2C` → `/news/Dukung%20E20%2C%20Agrinas…` → situs menampilkan `<title>Berita Tidak Ditemukan</title>` (HTTP tetap 200, jadi cek status saja tidak menangkapnya).
- Resmi/usulan: pakai href yang sama dengan situs/Berita.astro: `https://agrinaspalma.co.id/news/Dukung%20E20,%20Agrinas%20Palma%20dan%20IPB%20University%20Kembangkan%20Bioetanol%20Multifeedstock` (mis. `encodeURI(...)` atau hardcode). Tautan versi ini terverifikasi membuka artikel yang benar.
- Sumber: https://agrinaspalma.co.id/ (href `/news/Dukung E20, Agrinas Palma dan IPB University Kembangkan Bioetanol Multifeedstock`)
- Pemilik: **A**

### K2 — MINOR — Teks sr-only tahun berdiri terbaca "2.025"
- File: src/components/Angka.astro:32 (untuk stat `static: true`, baris 16)
- Sekarang: `<span class="sr-only">{fmt(s.value, s.decimals)}…</span>` → HTML: "2.025" (pemisah ribuan id-ID pada tahun). Tampilan visual sudah "2025", tetapi pembaca layar mendapat "2.025".
- Usulan: untuk `s.static` keluarkan `String(s.value)` juga di sr-only → "2025".
- Sumber: https://agrinaspalma.co.id/ ("Berdiri Februari 2025")
- Pemilik: **C**

### K3 — MINOR — Teks babak 3 Hero dipinjam dari makna logo, konteks bergeser
- File: src/components/Hero.astro:72–74
- Sekarang: eyebrow "Semangat Patriot", judul "Patriot · Loyal · Profesional", isi "Kemakmuran bumi Nusantara, semangat patriot, loyalitas kepada nusa, dan dedikasi profesional dalam setiap langkah bisnis."
- Catatan: kalimat isi di situs adalah makna **Teks "Nusantara" (Kedaulatan) pada logo**, bukan penjelasan semboyan Patriot/Loyal/Profesional. Tidak mengarang, tetapi pembaca mengira itu deskripsi semboyan.
- Usulan (teks resmi blok "Semangat Patriot"): "Dengan semangat Patriot, Loyal, Profesional, PT Agrinas Palma Nusantara (Persero) berperan aktif menciptakan kemandirian energi sekaligus membuka lapangan kerja, mengurangi pengangguran, dan menghadirkan manfaat nyata bagi masyarakat." (boleh dipersingkat: "…berperan aktif menciptakan kemandirian energi sekaligus membuka lapangan kerja dan menghadirkan manfaat nyata bagi masyarakat.")
- Sumber: https://agrinaspalma.co.id/ (#about "Semangat Patriot")
- Pemilik: **A**
- Babak 2 ("02 Mandat Swasembada Nasional" + "Energi hijau untuk negeri." + teks mandat Presiden) — semua frasa ada di situs (tagline header + blok Mandat). **Setia makna, OK.**

### K4 — MINOR (info) — Angka 6 / 9 / 12 adalah hitungan, bukan angka yang tertulis di situs
- File: src/components/Angka.astro:13–15
- Situs tidak menuliskan "6 tahap", "9 produk & layanan", atau "12 direksi" sebagai angka; ketiganya hasil menghitung item yang tercantum (Tahap I–VI, 9 kartu Bisnis, 12 kartu Direksi). Faktanya benar dan dapat diverifikasi; tidak dijumlahkan dari data lain. Baris "Sumber:" di bawah grid sudah menjelaskan asal.
- Usulan: boleh dipertahankan (PM putuskan). Jika aturan "angka harus tertulis" dibaca ketat, ganti catatan menjadi eksplisit, mis. "Penyerahan Lahan Tahap I–VI" / "9 produk & layanan tercantum di Bisnis Kami" / "12 nama di Jajaran Direksi". Note "Dipimpin Direktur Utama" (baris 15) adalah label turunan — netral, OK.
- Sumber: https://agrinaspalma.co.id/ (#milestones, #business, #leadership)
- Pemilik: **C**

### K5 — MINOR (info) — Label grup Bisnis "Industri Kelapa Sawit" / "Jasa Konsultansi Teknis" adalah turunan
- File: src/components/Bisnis.astro:18–19, 22–30
- Situs hanya memberi label "Produk & Layanan Agrinas" per item; pengelompokan diturunkan dari kalimat pengantar resmi ("fokus pada industri kelapa sawit … diperkuat dengan layanan jasa konsultansi teknis sebagai lini bisnis pendukung"). Penempatan TBS–PKS di sawit dan Engineering/GeoResources/Laboratorium Geoteknik di jasa konsultansi konsisten dengan pengantar dan dengan "konsultan konstruksi" di surat Apresiasi. **Setia makna — tidak perlu diganti.** (Huruf kapital "Industri Kelapa Sawit" vs huruf kecil di Angka:14 "Industri kelapa sawit & jasa konsultansi teknis" — wajar karena label vs kalimat.)
- Pemilik: **C**

### K6 — MINOR — Pita "Waspadai email palsu" berasal dari popup yang sudah kedaluwarsa
- File: src/components/Keterbukaan.astro:40–46
- Popup resmi (CMS id 60, "PENGUMUMAN!") ber-`endDate` 2026-07-31; endpoint aktif kini `{"data":[]}` → tidak tampil lagi di situs live. Isi parafrase setia dengan poster (contoh palsu agrinasspalma.co.id; domain resmi @agrinaspalma.co.id & @agrinaspalma.id; jangan beri data pribadi/bertransaksi tanpa konfirmasi resmi). Kata "hanya" ("Domain resmi hanya …") sedikit lebih tegas dari poster ("Domain Resmi: …") — masih setia makna.
- Usulan: pertahankan (konten resmi, memang diminta TASKS), atau opsional ganti "hanya" → hapus kata tersebut. Tidak blocker.
- Sumber: https://cms.agrinaspalma.app/uploads/large_pop_up_7c0c1b4e90/large_pop_up_7c0c1b4e90.jpg
- Pemilik: **D**

### K7 — MINOR — Eyebrow "Whistleblowing System" tidak ada di situs
- File: src/components/Keterbukaan.astro:76
- Situs memakai "Sarana Pengaduan" (di bawah "Transparansi / Keterbukaan Informasi") dan menyebut "WBS" di teks. Ekspansi "Whistleblowing System" benar secara makna, tetapi teks Inggris tambahan.
- Usulan: "Sarana Pengaduan · WBS" atau "Transparansi". Juga eyebrow baris 49 "Transparansi · Laporan Tahunan" berada di atas judul "Keterbukaan Informasi" sementara lead-nya adalah lead "Annual Report" — kombinasi dua blok situs; dapat diterima.
- Sumber: https://agrinaspalma.co.id/ (#keterbukaan)
- Pemilik: **D**

### K8 — MINOR — Ringkasan berita E20 diawali "Bogor —" (dateline diubah)
- File: src/components/Berita.astro:14
- Sekarang: "Bogor — Pengembangan bioetanol …"; resmi: "BOGOR, 4 OKTOBER 2026 - Pengembangan bioetanol …". Isi setelahnya verbatim (kalimat lengkap dari artikel). Setia makna; hanya catatan konsistensi: tiga kartu lain tidak memakai dateline. Usulan: hapus "Bogor — " agar seragam, atau biarkan.
- Sumber: https://agrinaspalma.co.id/news/Dukung%20E20,%20Agrinas%20Palma%20dan%20IPB%20University%20Kembangkan%20Bioetanol%20Multifeedstock
- Pemilik: **D**

### K9 — MINOR — Favicon di public/ tidak tercatat di CREDITS.md
- File: public/favicon.ico, public/favicon-192.png, public/apple-touch-icon.png (dipakai di src/layouts/Layout.astro:15–17)
- Ketiganya turunan logo APN, tetapi CREDITS.md tidak mencantumkannya (harness qa/run.mjs hanya mengecek src/assets/agrinas).
- Usulan baris: `| favicon | public/favicon.ico, public/favicon-192.png, public/apple-touch-icon.png | https://agrinaspalma.co.id/images/branding/logo_apn2.webp | PT Agrinas Palma Nusantara | aset resmi (diperkecil/dikonversi) |` (situs memakai logo_apn2.webp sebagai icon).
- Pemilik: **A** (CREDITS header/public)

### K10 — MINOR — URL sumber 2 foto direksi di CREDITS menunjuk varian `small_`, padahal file lokal = varian `medium_`
- File: CREDITS.md:35 (kusdi), CREDITS.md:45 (seger)
- File lokal 750×741 identik byte-per-byte dengan `medium_Kusdi_Sastro_Kidjan_c7abb3ec59.webp` / `medium_Seger_Budiardjo_eb4bebfcb2.webp`; CREDITS menulis `small_…` (500×494). Orangnya benar, hanya URL varian.
- Usulan: ganti `small_` → `medium_` pada dua baris tsb.
- Pemilik: **C**

### K11 — INFO — Logo header/footer adalah varian terang hasil olahan
- header-logo-agrinas-light.webp & header-logo-danantara-light.webp berbeda dari sumber (diff 19,8 & 77,3) karena diwarnai ulang untuk latar gelap; CREDITS sudah mencatat "varian terang". Situs resmi sendiri tidak menyediakan varian terang. Pastikan pemilik merek setuju (sudah diasumsikan PM: user terafiliasi). Tidak perlu tindakan.
- Pemilik: **A**

### K12 — INFO — Arsip Coca-Cola ikut di repo publik
- docs/cola-archive/*.md (9 file catatan QA/TASKS Coca-Cola) tetap ter-track di branch agrinas-palma; bukan aset/visual, tetapi "sisa Coca-Cola" di repo publik. Juga komentar Bisnis.astro:6 menyebut Products.astro landing Coca-Cola (atribusi kode — wajar). src/assets/photos (foto Coca-Cola) berstatus D di working tree — pastikan ikut ter-commit sebagai penghapusan di T3.
- Pemilik: PM

## Bahasa
- Tidak ditemukan typo/EYD bermasalah pada teks turunan (dicek semua baris HTML lokal yang tidak verbatim situs). Istilah konsisten: "hektare", "Satgas PKH", "Produk & Layanan", "Direksi".
- Teks Inggris yang tidak ada di situs: "Whistleblowing System" (K7), "Satu sistem end-to-end" (frasa *end-to-end* ada di situs — OK). "Engineering", "GeoResources", "Annual Report", "Sustainability Report", "All rights reserved", "Integrated Procurement System" = istilah asli situs — OK.

## VERDICT: FAIL — K1 (major: tautan "Kabar terbaru" Hero ke halaman "Berita Tidak Ditemukan"). Minor/info lainnya: K2–K12 (tidak memblokir).
