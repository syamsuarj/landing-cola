# T7-notes — diorama kebun sawit hero 3D

- start 2026-10-08: baca TASKS T7, hero3d.ts, Hero.astro, animations.ts (initHero3D(stage, heroState, reveal) — signature dipertahankan).
- 2026-10-08: scope dipersempit → T7a (hero3d.ts saja). Pohon/TBS dari palm.ts (Programmer B); sementara stub lokal. Hero.astro tidak disentuh.
- hero3d.ts ditulis ulang: pulau (rumput+laterit 10 lapis), jalan panen+bekas roda, parit, piringan, rumput bergoyang (shader sway), bayangan palsu 1 DC, partikel emas, kamera orbit fit-bola + scroll, tanpa PMREM. Kit sawit via import.meta.glob('./hero3d/palm.ts') → stub bila belum ada. Hook DEV window.__hero3d={renderer,scene,camera,stats}; statistik di window.__hero3dStats (calls/triangles/kit). Stub: 16 draw call. Skrip qa/t7a-shots.mjs → qa/out-t7/. Warna diturunkan (terlalu jenuh di shot pertama).
- integrasi palm.ts asli (static import), stub dihapus; build exit 0; 21 DC, 172k tri@1280 / 82k@375. Perbaikan berikut: overlap babak 2 + LH.
- Perbaikan temuan QA-prep: babak 2 kamera kini MENJAUH (+12%) bukan mendekat → overlap teks hilang; partikel dipersempit (x ±2,1); pulau low: 80 seg/11 ring; yield per pohon (pohon pertama membangun geometri kit).
## Hasil harness asli (2026-10-08)
- `npm run build` exit 0 (1 page, Complete!). chunk hero3d ±554 KB (three + palm; lazy, setelah load+3,5 s/interaksi).
- `node qa/t7-check.mjs` (dev :3000): Overall PASS — screenshots PASS, canvas-visible PASS, overlap-text PASS (1280-b1 h1 1,45% < 2%; lainnya 0), draw-calls PASS (21; tri 171k@1280 high / 78k@375 low), no-webgl PASS (SVG baru T7c, aria-label diorama), reduced-motion PASS (statis, SVG), console 0 error (5 warning noise GPU headless).
- `node qa/t7-check.mjs --lh --only lh` 2×: Performance 92 / 92 (LCP 3,2 s, TBT 20 ms, CLS 0). Port 4420 dimatikan harness.
- Screenshot: qa/out-t7/ (hero-act{1,2,3}-{1280,375}.png, hero-act1-*-reduced.png, final-1280.png, iter3-375.png; harness: qa/out-t7/<vw>-b<n>.png), LH: qa/out-t7-lh{,2}/.
## Belum terverifikasi / catatan
- FPS di perangkat mobile nyata; 1280 tetap quality 'high' (171k tri) — turunkan ke 'low' bila QA melihat jank.
- h1 babak 1 1280 masih tersentuh 1,45% (di bawah ambang 2%) oleh tepi tajuk saat orbit.
- Trunk sawit tampak pendek & sebagian tertutup pelepah pada jarak hero (desain palm.ts/T7b); pohon tetap terbaca sawit (batang bersisik, TBS, anak daun) di babak 2.
