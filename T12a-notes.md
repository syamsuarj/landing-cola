# T12a-notes — Programmer A (hero3d.ts, <style> Hero.astro, blok hero animations.ts)

- 10:45 kode: W-1 hero3d.ts RAD dihitung dari verteks nyata (measureRad, ×1,06+0,05), fitDist(filmOffset) per frame (sisi frustum tersempit), partikel lahir/hidup di dalam bola fit; taste: exposure 0,95→1,03, rimGold 40→45, rimGreen 28→32, + DirectionalLight kicker tajuk 0,55 atas-belakang. R-1: matchMedia kondisi short (max-height:500) tanpa timeline + CSS statis babak 1–3. W-3: data-step pada .object, CSS babak 2 desktop .fallback translateX(-28px) scale(.9).
- 10:54 bukti: qa/t12a-fit.mjs (proyeksi NDC verteks, dev, GPU) maks |ndc| 0,915 (1280 b1 0,91; 1440/1920 0,915; 768 0,80; 375 0,89) semua babak 1–3 ×5 frame → 0 frame terpotong. clip-probe/clip-full ulang: clipfull-1280-2 utuh (vision). t10c-land: 812/667 tombol op 1 di y 0/120/240/400, tak di-pin, babak statis berurutan. t12a-nogl: celah piksel SVG→teks b2 1280 49 px, 1440 40 px. build exit 0.
- 11:00 regresi: t7-check → qa/out-t12a Overall PASS (overlap teks 0 di 1280/375 b1–b3; calls 21; 0 error). t8a-extra --only a,c (OUT qa/out-t12a-extra): 768 b0/.45/.9 overlap 0 & tak terpotong; 1440 b2 0,02%; geo 12/tex 3/prog 6 konstan ×6; rotasi 812×375 objek tersembunyi; 0 error. (Flag `clipped R` 1440-b0/375 dari harness = bias R-4: bbox diff melebar ke glow latar, content x+w > tepi kanvas → bukan piksel kanvas; bukti otoritatif = t12a-fit NDC.)
- qa/t12a-rot.mjs: 375×812 ↔ 812×375 ×2 → 1280: pin true/false/true/false/true, layar pendek babak 2/3 opacity 1 statis, portrait babak 2/3 opacity 0 (timeline pulih); fokus tombol babak 3 di 812×375 terlihat (top 297); 0 pageerror.
- LH mobile (port 4420, berurutan): run1 93 (LCP 3,0 s TBT 30 ms CLS 0), run2 93.
- Vision: 1280 b1 (qa/out-t10b/clipfull-1280-2.png) pulau utuh, jauh dari tepi, tajuk terbaca, laterit tak jenuh; 812×375 y0/y400 teks & CTA utuh, babak 2 di bawah garis; nogl 1280 b2 (qa/out-t12a/nogl-1280-b2.png) celah jelas.
## Belum terverifikasi
- bfcache restore nyata (headless: marker false → reload → 3D boot lagi; sama seperti T9a).
- Pulau 3D ~8–10% lebih kecil di desktop (harga fit bola + margin 8%); 667×375 rotasi tidak diuji di t12a-rot (t10c-land 667 PASS).
