# QA-T2 — teknis + visual + interaksi (QA-A) — 2026-10-06

Build prod (dist/) disajikan `python3 -m http.server 4410 --directory dist`; harness `node qa/run.mjs --prod --out qa/out-t2`.
Skrip QA sendiri: qa/t2-*.mjs. Screenshot: qa/out/t2-visual/.
Pemilik: A = global/Layout/Header/Hero/Footer/animations/hero3d/keep-scroll; B = Apresiasi/Tentang/FilosofiLogo/Milestones/VisiMisi; C = Kepemimpinan/Bisnis/Angka; D = Kemitraan/Karir/Berita/Keterbukaan/reveal-d.ts.

## Temuan

### V1 — MAJOR — #karir, #berita (anchor nav) — 375x812
- Langkah: konteks baru (cache kosong) per klik, buka menu → klik "Karir"/"Berita", tunggu scroll berhenti (`node qa/t2v-interact.mjs anchor 375`, ulang terisolasi `node qa/t2v-anchor1.mjs 375 812 '#karir'`).
- Ekspektasi: top section ≈ tinggi header (73) ±10px.
- Aktual: top = 101 (diff +28) untuk #karir (reproducible 2×) dan #berita; 1280 mendarat benar (72). Bagian bawah section sebelumnya terlihat 28px di bawah header.
- Bukti: qa/out/t2v-anchor375.log, qa/out/t2-visual/anchor-375-karir.png
- Pemilik: D (Karir/Berita, cek scroll-margin/padding atas section mobile) + A (anchor/keep-scroll bila offset dihitung global).

### V2 — MAJOR — footer #kontak (nav "Kontak") — 1280x800 & 375x812
- Langkah: sama dengan V1, link "Kontak" (`node qa/t2v-anchor1.mjs 1280 800 '#kontak'`).
- Ekspektasi: footer top ≈ 73 (di bawah header) atau mentok scroll bawah.
- Aktual: 1280 top = 0 (y 32432 < max 32566 → 73px atas footer tertutup header); 375 top = 29 (-44). Sekali (batch) di 1280 berhenti di top 1097 (belum sampai footer).
- Bukti: qa/out/t2v-anchor1280.log, qa/out/t2v-anchor375.log, qa/out/t2-visual/anchor-1280-kontak.png
- Pemilik: A (Footer: scroll-margin-top seperti section lain).

### V3 — MINOR (perlu verifikasi) — Bisnis, chip lompat "#bisnis-tbs"/"#bisnis-cpo" — 375 & 1280
- Langkah: Tab penuh dari atas (`node qa/t2v-interact.mjs tab`).
- Ekspektasi: elemen terfokus masuk viewport.
- Aktual: chip pertama di intro Bisnis terfokus tetapi di luar viewport setelah 900 ms (ring ada, opacity 1). Link lain yang sempat ter-flag (IPS vendor) lolos saat diuji terisolasi → mungkin efek smooth-scroll jarak jauh; chip bisnis belum sempat diuji terisolasi.
- Bukti: qa/out/t2v-tab.json
- Pemilik: C (Bisnis).

### Catatan (bukan bug produk)
- Shot batch (qa/out/t2-visual/<WxH>/, sheet*.png) dijalankan paralel → `python3 -m http.server` me-reset koneksi (ERR_CONNECTION_RESET) → di sebagian shot logo header pecah / header tanpa latar / menu sempat tak terbuka. Dicek terisolasi (qa/t2v-probe.mjs, qa/t2v-headbg.mjs, qa/t2v-menuopen.mjs): logo termuat (160/152px), header `.scrolled` rgba(7,21,14,.9), menu terbuka 5/5. Satu 404 di run 1280x650 tidak terulang.

### Lolos
- Visual 5 ukuran (375x812, 768x1024, 1280x800, 1440x900, 1280x650; posisi a/m33/m66/z): tidak ada teks terpotong/tumpang tindih, tidak ada area kosong, tidak ada overflow horizontal (scrollWidth = innerWidth semua ukuran); gaya antar section (A–D) konsisten (eyebrow + judul serif dengan aksen italic hijau, stripe 4 warna, kartu gelap/terang).
- Anchor 1280: Beranda/Tentang/Bisnis/Karir/Procurement/Berita PASS (top 72); 375: Beranda/Tentang/Bisnis PASS.
- Menu mobile 375: Enter/Space buka, skip/brand/main/footer `inert`, Tab & Shift+Tab berputar di dalam header, Esc tutup + fokus kembali ke tombol, inert dilepas (0).
- Resize/rotasi di tengah filosofi/milestones/bisnis/kepemimpinan: 375x812↔812x375, 1024x768↔768x1024, 1280→375→1280 — 20/20 tetap di section yang sama.
- Tab penuh: semua elemen terfokus opacity 1 + focus ring, tidak ada fokus ke elemen aria-hidden/inert.

Skrip: qa/t2v-interact.mjs, qa/t2v-anchor1.mjs, qa/t2v-focus1.mjs, qa/t2v-probe.mjs, qa/t2v-headbg.mjs, qa/t2v-menuopen.mjs, qa/t2-shots.mjs, qa/t2-montage.py.

VERDICT: FAIL — V1, V2 (major); V3 minor.
