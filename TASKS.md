# Project: agrinas-landing — branch `agrinas-palma` (repo github.com/syamsuarj/landing-cola)
Worktree: ~/workspace/projects/agrinas-landing (git worktree dari ~/workspace/projects/coca-cola-landing, branch agrinas-palma; main = landing Coca-Cola, JANGAN disentuh)
Dev server: port 3001 (port 3000 = landing Coca-Cola, jangan dimatikan)

## Requirement user (2026-10-06)
"Pelajari website https://agrinaspalma.co.id lalu buatkan landing page baru dengan dasar dan feel design yang tadi (landing Coca-Cola 'Premium sinematik') agar bisa diterapkan dari dasar agrinaspalma.co.id" + "buatkan di branch baru".

## Asumsi / keputusan PM (default, belum dikonfirmasi user)
- Ini konsep REDESIGN situs resmi PT Agrinas Palma Nusantara (Persero): struktur & konten dari agrinaspalma.co.id, kemasan visual & motion dari landing Coca-Cola (gelap sinematik, tipografi raksasa, hero 3D ter-pin, timeline horizontal ter-pin, slide sticky, counter, marquee).
- Aset resmi (logo APN, logo Danantara, foto dari agrinaspalma.co.id & cms.agrinaspalma.app, foto direksi) BOLEH dipakai karena user terafiliasi Agrinas; diunduh lokal ke src/assets/agrinas/ (tanpa hotlink), sumber dicatat di CREDITS.md. README memuat catatan "konsep redesign, bukan situs produksi".
- Konten HANYA dari agrinaspalma.co.id (beranda + subhalaman /career, /procurement, /news). Dilarang mengarang angka/fakta/kutipan. Teks yang dipersingkat tetap harus setia makna. Data yang tidak ada di situs → jangan dibuat.
- Bahasa Indonesia. Satu halaman statis (Astro), tanpa backend. Link "Karir", "Procurement", "Berita", "Annual Report", WBS → tautan ke halaman resmi agrinaspalma.co.id (target _blank, rel noopener).
- Popup "Waspadai email palsu" situs asli tidak direplikasi sebagai modal; cukup sebagai pita/info kecil di section Keterbukaan Informasi.
- Kode Coca-Cola dipakai sebagai fondasi: Astro + GSAP/ScrollTrigger + Three.js, keep-scroll.ts, harness qa/run.mjs, pola file-ownership. Semua komponen/konten/foto Coca-Cola DIHAPUS dari branch ini.

## Referensi
- docs/reference/home-text.txt (teks beranda), docs/reference/images.json (URL gambar), docs/reference/shots/y*.png (screenshot 1280x800 situs asli per posisi scroll).
- Situs asli: font Lora (serif, judul + italic hijau aksen) + Montserrat (body); hijau #1A7F37, hijau gelap #15251C/#102C20/#07150E, krem #F4F5F0/#FAFAF7, mint #A1DBB3; warna logo: hijau, kuning, biru, merah.
- Arsip proyek Coca-Cola: docs/cola-archive/ (TASKS-cola.md berisi pelajaran: kontrak desain, aturan animasi, bug W1–W3/V1).

## KONTRAK DESAIN (wajib semua Programmer; T1a mengimplementasikan di src/styles/global.css dalam 10 menit pertama)
- Feel: "Premium sinematik" versi Agrinas — mayoritas section gelap hijau-hitam dengan beberapa jeda section terang krem; tipografi raksasa; foto full-bleed dengan overlay gelap; grain halus; aksen italic serif hijau mint seperti situs asli ("Energi Hijau *Nusantara*").
- CSS variables: --c-ink #07150E (latar utama), --c-ink-2 #0E2218 (latar sekunder), --c-forest #15251C, --c-green #1A7F37, --c-mint #A1DBB3 (aksen di gelap), --c-cream #F4F5F0 (teks utama di gelap / latar section terang), --c-paper #FAFAF7, --c-muted #A9B8AE (teks sekunder di gelap, kontras >=4.5), --c-muted-dark #4B5A50 (teks sekunder di terang), --c-yellow #F2C230, --c-blue #1E6FB8, --c-red #D7262E (warna logo, hanya aksen kecil/garis 4 warna), --font-display "Lora Variable", --font-body "Montserrat Variable", --container 1280px, --gutter clamp(20px,4vw,48px), --radius 20px, --ease cubic-bezier(.2,.7,.1,1).
- Class global: .container, .eyebrow (uppercase kecil, letter-spacing, warna mint/green), .display-xl/.display-l/.display-m (Lora, raksasa), .accent (Lora italic warna mint di gelap / green di terang), .btn/.btn-ghost (pill), .section-light (latar cream, teks forest), .sr-only, .grain, .logo-stripe (garis 4 warna logo).
- Font via @fontsource-variable/lora dan @fontsource-variable/montserrat (hapus Anton/Manrope/Instrument Serif).
- Animasi per section: script sendiri src/scripts/sections/<nama>.ts diimport dari <script> komponennya. Wajib: prefers-reduced-motion (tanpa animasi/pin), tanpa JS konten tetap terlihat (sembunyikan hanya via class html.js), reveal hanya y/opacity/scale, overflow-x: clip, JANGAN ScrollTrigger.refresh() per gambar load (bug V1), elemen yang bisa difokus tidak boleh tersembunyi saat difokus (bug W2), pin pakai gsap.matchMedia dan biarkan keep-scroll.ts menangani lintas breakpoint (bug W3).
- Aset: src/assets/agrinas/<section>-<slug>.(webp|jpg|png) via astro:assets; baris CREDITS.md satu append (>>): `| <section> | <file> | <url sumber> | PT Agrinas Palma Nusantara | aset resmi |`.
- Responsif 375/768/1280 tanpa overflow horizontal; Lighthouse mobile Performance >=90, A11y >=95.

## T1 - Landing Agrinas (paralel) [P1, est 3 jam] — Status: Ready for QA
### T1a - Fondasi + Header + Hero 3D + Footer — Programmer A — Status: Ready for QA (2026-10-06 13:45). Hero/Header/Footer di-review 1280/375 (+reduced-motion) via screenshot+vision (qa/out-t1a-shots/): objek 3D mobile tak terpotong lagi, judul babak 3 patah baris disengaja, pita & progress tak bertabrakan; focus trap menu 0 bocor; keep-scroll lintas 1280↔375 OK. Sisa Coca-Cola dibersihkan (README baru port 3001, CREDITS pembuka aset resmi + 15 baris Unsplash dihapus, 5 aset header/hero tak terpakai dihapus). qa/run.mjs: id section Agrinas, cek kredit src/assets/agrinas↔CREDITS, gzip server fallback, LH mobile ≥90. Harness prod: build/overflow/screenshots/credits PASS, LH mobile P92 A100, desktop P100. Belum: console+variants run akhir (Chrome harness crash); run 1 variants FAIL hanya #kemitraan li 05–08 (milik C) di no-webgl. Detail: T1a-notes.md.
Milik file: global.css, Layout.astro, pages/index.astro, Header.astro, Hero.astro, Footer.astro, animations.ts, hero3d.ts, hero-state.ts, keep-scroll.ts, package.json, public/favicon*, README.md, CREDITS.md (header tabel), astro.config.mjs. Hapus komponen/script/foto Coca-Cola yang bukan milik B/C (Bottle, IconBottle, dsb) dan semua src/assets/photos.
- index.astro urutan section: Hero, Apresiasi, Tentang, FilosofiLogo, Milestones, VisiMisi, Kepemimpinan, Bisnis, Angka, Kemitraan, Karir, Berita, Keterbukaan, Footer. Import komponen B/C; jika file belum ada, buat stub kosong <section id> agar build jalan (B/C akan menimpa).
- Header: logo Danantara | logo APN (aset resmi), nav: Beranda, Tentang Kami, Bisnis, Karir, Procurement, Berita, Kontak; menu mobile dgn focus trap (pertahankan perbaikan W1).
- Hero ter-pin 3 babak: babak 1 "Mengelola Energi Hijau *Nusantara*" + lead resmi + tombol Tentang Agrinas / Lini Bisnis; babak 2-3 dari konten situs (Energi hijau untuk negeri; Patriot · Loyal · Profesional). Objek 3D Three.js prosedural: tetes minyak keemasan / buah sawit (BUKAN logo 3D), fallback SVG; latar foto/video kebun sawit resmi gelap. Pita "Kabar terbaru" (judul berita terbaru, link ke /news resmi).
- Footer: logo, tagline, tautan cepat, kontak (021-819-2636, agrinaspalma@agrinaspalma.co.id, alamat Rasuna Said), ikuti kami (sosmed resmi bila ada di situs), © 2026, catatan konsep redesign.
### T1b - Section cerita perusahaan — Programmer B — Status: Ready for QA (2026-10-06 12:56). id: #apresiasi #tentang #filosofi #milestones #visi-misi. Konten disalin dari beranda resmi (teks mentah: docs/reference/t1b-content.md; 6 tahap milestone dari JSON island). 10 foto resmi di src/assets/agrinas/{filosofi,tentang,milestones,visimisi}-*.webp (4 diperkecil ke 2200px), 10 baris CREDITS.md. Pin: Filosofi (>=900px, 5 makna menyala bergiliran + garis penunjuk) & Milestones (>=768px horizontal); <bp / reduced-motion / tanpa JS = daftar statis penuh. Build OK; screenshot 1280/375 + no-JS 1280 + reduced-motion 375/1280 di-review vision; tanpa overflow-x, 0 console error; anchor nav top=72 (header). Detail: T1b-notes.md.
Milik file: Apresiasi.astro, Tentang.astro, FilosofiLogo.astro, Milestones.astro, VisiMisi.astro + sections/{apresiasi,tentang,filosofi,milestones,visimisi}.ts + aset terkait.
- Apresiasi: surat "Kepada seluruh pemangku kepentingan..." (kutipan besar serif), 2 kartu Keterbukaan Informasi & Sinergi Tumbuh Bersama.
- Tentang: BUMN Persero · Berdiri Februari 2025, Semangat Patriot, Mandat Swasembada Nasional (teks resmi).
- Filosofi Logo: logo APN di tengah + 5 makna (Hijau Ekosistem, Kuning Produktivitas, Biru Energi Bersih, Merah Semangat, Teks Nusantara) dengan garis penunjuk; animasi scroll satu per satu.
- Milestones: timeline horizontal ter-pin (>=768) Penyerahan Lahan Tahap I–VI dengan tanggal, kutipan, foto resmi (ambil teks semua tahap dari situs).
- Visi & Misi: teks resmi lengkap (ambil dari situs), misi bernomor 01..0n.
### T1c - Section bisnis & publik — Programmer C+D — Status: Ready for QA
- T1c-1 (Kepemimpinan, Bisnis, Angka): Ready for QA — #kepemimpinan 12 orang sesuai situs (Dirut kartu besar + 11 direktur, foto resmi lokal); #bisnis 9 slide sticky ala Products (≥900px & h≥700, efek tumpuk via gsap.matchMedia; tanpa deskripsi per item karena situs tidak memuatnya); #angka counter 221.868 ha (Tahap I), 1.507.591,9 ha (Tahap IV), 6 tahap, 9 produk & layanan, 12 direksi, 2025 (tanpa total ha karangan). 21 baris CREDITS. Build OK, overflow-x 0, 0 console error, no-JS & reduced-motion OK; shots qa/out-t1c1-shots/ (qa/t1c1-shots.mjs). Detail: T1c-notes.md.
Milik file: Kepemimpinan.astro, Bisnis.astro, Angka.astro, Kemitraan.astro, Karir.astro, Berita.astro, Keterbukaan.astro + sections/{kepemimpinan,bisnis,angka,kemitraan,karir,berita,keterbukaan}.ts + aset terkait. Hapus komponen/script Coca-Cola: About, Products, Facts, Indonesia, Sustainability, Gallery, Testimonials, FAQ, CTA (+ sections ts lama) yang tidak dipakai — HANYA setelah A membuat index.astro baru (koordinasi: cek index.astro tidak lagi mengimpornya).
- Kepemimpinan: 11 direksi (nama, jabatan, foto resmi), Direktur Utama menonjol.
- Bisnis: 9 produk/layanan (TBS, CPO, CPKO, PK, PKM, PKS, Engineering, GeoResources, Laboratorium Geoteknik) — slide sticky gaya "Produk" Coca-Cola atau marquee; deskripsi hanya bila ada di situs.
- Angka: counter hanya dari angka resmi di situs (mis. 221.868 ha lahan Tahap I, 11 direksi, 9 lini produk/layanan, berdiri 2025) — jangan mengarang.
- Kemitraan: Integrated Procurement System (link /procurement resmi).
- Karir: "Bangun karir, *bangun negeri*." + nilai (Budaya Inovatif, Kolaborasi Tim, dst dari situs) + link /career.
- Berita: 3–4 berita terbaru (judul, tanggal, ringkasan, link) diambil dari /news resmi saat build-time statis (hardcode hasil scrape, bukan fetch runtime).
- Keterbukaan: Annual Report (link), Sarana Pengaduan WBS (mekanisme tertulis & lisan), pita kecil peringatan email palsu.
- T1c-2 (Kemitraan, Karir, Berita, Keterbukaan) Programmer D: Ready for QA — #kemitraan (IPS + 8 alur dari /procurement, link IPS Vendor//procurement/alur registrasi), #karir (latar foto resmi, 'Bangun karir, bangun negeri.', 5 pilar /career + AKHLAK, link /career & portal Talentics), #berita (section-light, sorotan E20 + 3 berita, link /news), #keterbukaan (pita email palsu, 4 laporan PDF resmi, WBS tertulis/lisan). Build OK, overflow-x 0, 0 console error, shots qa/out-t1d-shots/. Detail: T1d-notes.md.

## T2 - QA [P1] — Status: QA passed (retest QA-T5b.md 2026-10-07; M1 minor) — sebelumnya IN PROGRESS (QA-A teknis+visual → QA-T2-visual.md; QA-B konten vs situs resmi → QA-T2-konten.md) (track teknis+visual, track konten-vs-situs-resmi)
- T2-fix (K1,V0,K2,K3,K7–K10): Ready for QA — K1 href berita hero = Berita.astro (title artikel benar); V0 akar: reveal langkah IPS berbasis waktu setelah trigger kartu → kini trigger posisi per langkah (ScrollTrigger.batch); K2 sr-only "2025"; K3 teks resmi Semangat Patriot; K7 "Sarana Pengaduan · WBS"; K8 tanpa dateline; K9 3 favicon di CREDITS; K10 URL medium_. Harness prod qa/out-t3 PASS, variants 0 tak terlihat. Detail: T3-notes.md.
- T2-fix2 (V1–V3): Ready for QA — V1 akar: counter #angka 0→1.507.591,9 membuat 'ha' pindah baris di 375 (+29px) saat smooth scroll lewat → kini lebar nilai akhir dicadangkan (data-ag-final ::after); V2 footer#kontak dapat scroll-margin-top header (top 72); V3 scroll fokus Tab instan (html.kb-nav, scroll-behavior auto !important). qa/t4-anchor.mjs semua link header+footer 375/1280 2× PASS, qa/t4-focus2.mjs PASS, keep-scroll OK, harness qa/out-t4 PASS. Detail: T3-notes.md.
## T3 - Commit & push branch agrinas-palma — PM — Status: PARTIAL — snapshot WIP di-push atas permintaan user saat T2 FAIL (K1 major, variant no-webgl #kemitraan); push final setelah QA PASS

## T7 - Ganti objek 3D hero → diorama mini kebun sawit [P1, est 2 jam] — Programmer — Status: Ready for QA (2026-10-08) — T7a: hero3d.ts = pulau melayang (rumput + laterit berlapis), jalan panen + parit + piringan, 5 sawit pola segitiga (kit palm.ts T7b, quality low <760px/≤4 core), 2 TBS terpanen + brondolan, rumput bergoyang, bayangan palsu, partikel emas, kamera orbit idle + scroll (babak 2 menjauh), tanpa PMREM, init bertahap + compileAsync, hook DEV window.__hero3d. Build OK; qa/t7-check.mjs Overall PASS (overlap, 21 draw call, no-webgl, reduced-motion, 0 console error); LH mobile 92/92. Detail: T7-notes.md
Koreksi user 2026-10-08: tetes minyak + butiran mengorbit terlihat aneh (butir mirip ceri/apel). Pilihan user: **diorama mini kebun**, gaya **semi-realistis stylized, prosedural Three.js** (tanpa model/HDR eksternal).
File milik: src/scripts/hero3d.ts, fallback SVG di src/components/Hero.astro (blok .object/.fallback saja), T7-notes.md.
AC:
1. Pulau tanah melayang (potongan tanah berlapis: rumput/tanah lateks kemerahan di sisi), 4–7 pohon kelapa sawit tertata berbaris (pola tanam), jalan/parit kecil antar baris boleh.
2. Pohon sawit dikenali sebagai SAWIT (bukan kelapa/palem generik): batang pendek-tebal bertekstur pangkal pelepah (bersisik), mahkota 16–30 pelepah melengkung dengan anak daun (bukan bilah datar), tandan buah segar (TBS) di ketiak pelepah: gerombol buah lonjong merah-oranye-kehitaman.
3. Minimal 1–2 TBS dipanen di tanah/ dekat jalan (detail cerita kebun). Opsional: partikel keemasan halus dipertahankan.
4. Kamera mengorbit pelan (idle) dan orbit/zoom terikat progress scroll 3 babak hero (state.progress yang sudah ada); pelepah bergoyang halus (angin).
5. Warna & cahaya serasi latar foto kebun gelap + aksen emas brand (kontrak desain TASKS.md); bayangan lembut/AO palsu boleh; tone mapping tetap.
6. Fallback SVG diperbarui jadi ilustrasi diorama/pohon sawit (aria-label diperbarui); prefers-reduced-motion = statis; no-WebGL = SVG.
7. Performa: pertahankan pola init bertahap (requestIdleCallback + compileAsync) & throttle; geometri di-merge/instanced; draw calls < ~60; Lighthouse mobile tetap ≥90; dispose semua resource.
8. Mobile 375: diorama utuh tak terpotong & tak menabrak teks; desktop 1280 seperti posisi objek sekarang.
9. `npm run build` lulus; 0 console error; screenshot 1280 & 375 tiap babak (3) + reduced-motion, direview sendiri dengan vision.

### T7 — pembagian tim (2026-10-08, permintaan user: tambah Programmer & QA). Pemilik file DISJOINT:
- **T7a Programmer A** (sa-0, sudah jalan): src/scripts/hero3d.ts — scene, pulau tanah, jalan/parit, tata letak pohon, kamera+scroll, cahaya, partikel, integrasi kit sawit, dispose, perf. Notes: T7-notes.md.
- **T7b Programmer B**: src/scripts/hero3d/palm.ts (BARU) — kit pohon kelapa sawit + TBS. Notes: T7b-notes.md. — **T7b Ready (2026-10-08)**
- **T7c Programmer C**: src/components/Hero.astro HANYA blok `.fallback` SVG + CSS-nya — ilustrasi SVG diorama sawit. Notes: T7c-notes.md. — **T7c Ready (2026-10-08)**: SVG isometrik 6 sawit + 2 TBS panen, 7 475 B (symbol/use, id agd-*), aria-label baru; shots qa/out-t7c/v2-*.png; build exit 0.
- **T8-prep QA-A**: qa/t7-check.mjs (harness, tanpa kode produksi). Notes: QA-T7-prep.md.

KONTRAK palm.ts (B mengimplementasi, A memakai; A boleh pakai stub sementara):
```ts
import type { Group } from 'three';
export interface PalmKit {
  tree(seed: number): Group;      // pohon sawit, origin = pangkal batang di tanah, tinggi total ±1.0 unit (skala 1), menghadap +Y
  ffb(seed: number): Group;       // 1 tandan buah segar terpanen (rebah di tanah), diameter ±0.14 unit
  update(t: number, wind?: number): void; // goyang pelepah semua pohon yang dibuat kit (t detik)
  dispose(): void;                // dispose semua geometri/material/tekstur milik kit
}
export function createPalmKit(opts?: { quality?: 'high' | 'low' }): PalmKit; // 'low' untuk mobile/throttled
```
Aturan kit: geometri & material DIBAGI antar pohon; maks 3 draw call per pohon (batang, pelepah, buah) — pakai merge/InstancedMesh; variasi per seed (rotasi, jumlah pelepah 18–26, kemiringan, jumlah TBS 2–4). Material MeshStandardMaterial/Physical, tanpa tekstur file (CanvasTexture boleh).
HOOK QA (A menambah): saat `import.meta.env.DEV`, set `window.__hero3d = { renderer, scene, camera }` setelah init.

- 2026-10-08 ~09:42 PM: T7b & T7c Ready; harness qa/t7-check.mjs siap (QA-T7-prep.md). Run percobaan: overlap-text FAIL 1280 b2 (p.body 7,17%) & b1 (h1 3%), LH mobile 87 (LCP 3,4s, TBT 210ms), draw calls 21, triangles 190k@1280 → di-steer ke A (T7a).

## T8 - QA T7 — QA-A (teknis: build, console, draw calls, no-webgl, reduced-motion, LH mobile) + QA-B (visual & botani: sawit terbaca sebagai sawit, 1280/375, tak menabrak teks) — Status: FAILED (2026-10-08 09:54) — QA-A FAILED (T-3 major 768 tabrak teks 11,77%; T-4 major landscape 812×375 diorama keluar layar; T-5 bfcache; T-2 quality/throttle tak dievaluasi ulang; T-1 LH 79 outlier), QA-B PASSED (V-1,V-2,V-4 minor; V-3,V-5,V-6,V-7 taste). Detail QA-T8-teknis.md, QA-T8-visual.mdnis.md, QA-B → QA-T8-visual.md)

## T9 - Perbaikan putaran 1 dari T8 [P1, est 30 mnt] — Status: Ready for QA (2026-10-08 10:13; T9a/b/c Ready — lihat T9a/b/c-notes.md)
Keputusan PM: semua minor + taste V-3/V-6/V-7 ikut diperbaiki (dampak kesan pertama klien). T-1 = variansi lingkungan, tidak diperbaiki (cukup diukur ulang).
- **T9a Programmer A** — **T9a Ready (2026-10-08)** (detail & bukti: T9a-notes.md) — hero3d.ts + aturan CSS `.object`/`#hero-art` (layout & crossfade) di Hero.astro (BUKAN markup SVG): T-3 + V-2 (768 tak menabrak teks/tombol, tak mepet tepi), T-4 (landscape 812×375 diorama utuh atau disembunyikan rapi), T-5 (pageshow persisted → re-init/ kembalikan fallback), T-2 (quality/throttle dievaluasi ulang saat resize/ fps pulih), V-3 (sisi laterit: saturasi −20%, bawah lebih gelap, tinggi −25%, faset lebih halus), V-6 (crossfade ±400 ms SVG→kanvas).
- **T9b Programmer B** — palm.ts: V-1 (TBS di pohon ×1,6–1,8, sedikit keluar dari batang, gradasi hitam→merah→oranye), V-7 (ffb panen = gerombol lonjong berbenjol, bukan bola halus). — **T9b Ready (2026-10-08)**: TBS pohon ×1,7 + gradasi oranye→merah→hitam-ungu, ffb oval berbenjol; vertex pohon +≤4,9 %, draw call tetap; notes T9b-notes.md, shots qa/out-t9b/.
- **T9c Programmer C** — markup SVG di dalam `.fallback` saja: V-4 (TBS panen jangan mirip kepik → gerombol elips lonjong), V-5 (bayangan wedge → elips blur/ hapus), opsional siluet pulau lebih bulat mendekati 3D (bantu V-6). — T9c Ready (2026-10-08)
## T10 - Re-test QA (QA baru, independen) — Status: SUPERSEDED → lihat "T10 (diperluas)" di bawah

## T11 - Background hero baru: studio gelap + kontur topografi + foto blur tipis [P1, est 45 mnt] — Status: Ready for QA (2026-10-08) — HeroBackdrop.astro (kontur SVG prosedural, foto pre-blur duotone 1,2 KB inline, glow/bayangan mengikuti diorama via skrip kecil, animations.ts tak diubah); build 0, t7-check PASS, LH mobile 92/93 (LCP 3,0 s); detail T11-notes.md
Koreksi user 2026-10-08: background hero kurang profesional; diorama 3D tidak terpisah dari foto (hijau di atas hijau, foto ramai: pabrik/atap di belakang judul babak 2, tanpa depth). Pilihan user: **A + sentuhan B** = studio gelap + garis kontur topografi emas/mint + foto kebun blur tipis di bagian bawah.
Pemilik file: **T11 Programmer D** — `src/components/HeroBackdrop.astro` (BARU, markup + style scoped), aset baru di `src/assets/agrinas/` bila perlu; integrasi ke Hero.astro (ganti blok .bg/.shade/.glow + hapus CSS lamanya) HANYA setelah T9a Ready (A sedang edit CSS Hero.astro).
AC:
1. Latar dasar: gradien radial hijau-hitam (var --c-ink / --c-ink-2), sedikit lebih terang di area objek 3D (\"panggung\"), vinyet ke tepi.
2. Kontur topografi: garis tipis (0,5–1 px), emas (--c-yellow) & mint (--c-mint) opacity rendah (≤ .12–.18), prosedural SVG inline (bukan file besar), tak menabrak keterbacaan teks (kontras teks tetap ≥ 4.5:1 / sekarang).
3. Foto kebun (hero-sawit1.webp, sudah ada) dipakai sebagai tekstur: blur berat (≥ 16 px atau di-pre-blur ke file kecil ≤ 40 KB), duotone hijau-emas, opacity ±15%, hanya di sepertiga bawah dengan mask gradien; pabrik/atap tidak terbaca.
4. Sorotan & kabut: glow emas lembut + bayangan elips di bawah posisi diorama; kabut tipis di bawah. Mengikuti posisi diorama per babak (babak 1 kanan, babak 2 kiri) — via CSS var/ class yang di-set animations.ts ATAU cukup glow lebar yang menutup kedua posisi; putuskan & catat.
5. Hook `[data-hero-bg]` (parallax/zoom di animations.ts:79) tetap ada & berfungsi pada elemen yang tepat.
6. Diorama 3D jelas terpisah dari latar di 1280/1440/768/375 babak 1–3 (cek vision); fallback SVG juga jelas.
7. LCP tidak memburuk (Lighthouse mobile ≥ 90); tanpa JS & reduced-motion tetap rapi; mobile pakai varian ringan.
8. Build exit 0, 0 console error, screenshot sebelum/sesudah di qa/out-t11/.
## T10 (diperluas) - Re-test QA mencakup T9 + T11 — Status: FAILED (2026-10-08 10:42) — QA-C: T-2..T-5 FIXED, build/kontras ≥5,21:1/bfcache asli/LH median 92 PASS; R-1 major (landscape ≤500px: CTA tak terlihat, babak bertumpuk — bug lama), R-2 minor glow tanpa objek, R-3 aset tak terpakai. QA-D: W-1 major (diorama terpotong tepi kanan kanvas saat orbit babak 1 desktop), W-2=R-2, W-3 minor SVG menyentuh judul babak 2 no-WebGL, W-4 taste. V-1,2,3,5,7 fixed; V-4/V-6 sebagian (taste).nis → QA-T10-teknis.md, QA-D visual → QA-T10-visual.md)
- PM 10:13 catatan untuk T10: (a) 375 babak 1 — A mengukur 3,89% overlap kanvas vs area tombol (t7-check bilang 0) & C melihat pelepah SVG menyentuh akhir baris "strategis." → verifikasi visual wajib; (b) objek DISEMBUNYIKAN di tinggi ≤500px (keputusan A untuk T-4) — nilai apakah dapat diterima; (c) bfcache asli belum teruji; (d) landscape 761–1199 belum dicek visual; (e) LH 89 lalu 91 — ukur ≥3 run.

## T12 - Perbaikan putaran 2 dari T10 [P1, est 25 mnt] — Status: Ready for QA (2026-10-08 10:58; T12a/T12b Ready)
Keputusan PM: R-1 (bug lama) tetap dikerjakan sekarang karena landscape HP rusak. Taste W-4, sisa V-4/V-6 (SVG vs 3D beda gaya) → BACKLOG (tidak menggagalkan). T-1 (LH run pertama dingin setelah build 62–79) tetap dianggap variansi lingkungan; median 92.
- **T12a Programmer A** — hero3d.ts, <style> Hero.astro, dan src/scripts/animations.ts (blok hero): W-1 (diorama tak boleh terpotong tepi kanvas di orbit idle/scroll babak 1–3, 1280/1440/1920), R-1 (tinggi ≤500px: hero tanpa pin → semua teks babak 1 + CTA terlihat & terbaca, babak tidak bertumpuk; mis. matikan animasi babak & tampilkan babak statis berurutan), W-3 (SVG fallback no-WebGL babak 2 1280 tidak menyentuh judul, jarak ≥24px), taste: eksposur/rim tajuk +10–15%. — **T12a Ready (2026-10-08)** → T12a-notes.md
- **T12b Programmer D** — HeroBackdrop.astro: R-2/W-2 (.spot/.floor disembunyikan bila objek tersembunyi: @media (max-height:500px) + bila #hero-art tak terlihat), R-3 (hapus src/assets/agrinas/hero-sawit1.webp bila tak dipakai di mana pun + rapikan CREDITS.md agar mencatat versi blur). — **T12b Ready (2026-10-08)**, lihat T12b-notes.md.
## T13 - Re-test QA putaran 3 — Status: IN PROGRESS (2026-10-08 10:59; QA-E teknis → QA-T13-teknis.md, QA-F visual → QA-T13-visual.md)
