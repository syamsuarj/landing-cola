# QA T4-A (teknis) — log per AC
## AC1 Build — PASS
- `npm run build`: sukses, 1 page, dist/ dihasilkan. hero3d chunk 542 kB (warning vite >500kB, non-blocking; lazy-loaded). 
- `astro check`: TIDAK DIJALANKAN — butuh install @astrojs/check+typescript (akan mengubah package.json; dilarang). Belum terverifikasi.

## AC2 Console (build produksi, preview :4399) — PASS
- Hook console via CDP Page.addScriptToEvaluateOnNewDocument sebelum load; reload; tunggu 8 dtk (hero3d chunk 200 termuat, canvas ada). console.error/warn/uncaught/unhandledrejection = 0 di 375/768/1280, juga setelah Three.js termuat dan setelah scroll penuh + mouse move.
- Catatan: pesan browser-native (mis. 404 resource) tidak tertangkap hook; semua resource 200.

## AC3 Hero 3D — PASS
- 1280: canvas 464x440, botol 3D + gelembung ter-render (screenshot). 375: canvas 343px lebar, botol render.
- Mouse nyata (CDP Input.dispatchMouseEvent): pojok kiri-atas vs kanan-bawah: piksel silhouette botol 11888 -> 14101, tepi bawah y 508 -> 520, kembali ke 11919/510 saat mouse balik ke kiri-atas => scene merespons mouse & reversibel.

## AC7 Responsif — FAIL minor (BUG-A)
- 1280: sw=1280 OK. 
- BUG-A [Minor/Medium]: 375 & 768 (viewport desktop-emulasi) document.scrollWidth = 419 / 812 (>viewport, +44px) pada load awal; window.scrollTo(200,0) benar-benar menggeser scrollX=44 (user bisa geser horizontal). Penyebab: elemen reveal di section #botol (`.art` -44..299 dan DIV 76..419) punya offset awal x (gsap.from(el,{x:dir}) animations.ts:59) sebelum ter-reveal. Hilang (sw=375) setelah halaman di-scroll penuh. Fix: `overflow-x: clip` pada section/body, atau reveal pakai y/opacity saja di mobile.
- Mobile emulation (mobile=true) memperlihatkan layout viewport melebar 419 (efek bug yang sama).

## AC4 Animasi scroll GSAP — PASS (diukur via computed style, 1280)
- Navbar: scrollY=0 class "top" tanpa shadow; scrollY=300 -> "top scrolled", shadow + bg rgba(255,255,255,.96).
- Parallax hero: translateY 0 -> -23/-42 (scroll 300) -> -60/-110 (akhir hero); hero .copy opacity 1 -> 0.4.
- Reveal: judul section opacity 0 -> 1 saat masuk viewport; stagger kartu produk 0 -> 1 (4 kartu); reveal samping (±60px) -> 0 saat tiba.
- Timeline: .tl-line scaleY 0 -> 0.82 -> 1 mengikuti scroll (scrub); 10 item li muncul bertahap (opacity 0 -> 1).
- Counter: 478 / 51+ / 485 saat berjalan -> 1886 / 200+ / 1915 akhir. Console 0 error.
- Catatan: nilai awal counter di HTML sudah final (baik untuk no-JS), tapi GSAP.from membuat konten opacity 0 sebelum di-scroll (normal).

## AC5 reduced-motion / no-WebGL / no-JS — PASS
- prefers-reduced-motion: reduce (CDP emulate): 0 canvas, SVG Bottle fallback tampil (254px), 0 elemen tersembunyi opacity<1 (tanpa animasi), counter langsung final, 0 console log, tanpa overflow.
- Tanpa WebGL (getContext webgl/webgl2 -> null, WebGLRenderingContext dihapus): 0 canvas, SVG fallback tampil, 0 console error/warn.
- Tanpa JS (Emulation.setScriptExecutionDisabled): semua konten terlihat (0 elemen opacity<1), 6 <details> FAQ, 6252 karakter teks, counter nilai final, tanpa overflow.

## AC6 Lighthouse 13.5.0 (build produksi, preview :4399, headless Chrome) — PASS (dengan caveat)
- Desktop: Perf 100 / A11y 100 / BP 100 / SEO 100. FCP 0.3s LCP 0.3s TBT 0 CLS 0.
- Mobile (default throttling): Perf 100 / A11y 100 / BP 100 / SEO 100. FCP 1.2s LCP 1.2s TBT 0 CLS 0. color-contrast audit lulus (BUG-1 dari T2 terbukti fixed). errors-in-console lulus.
- CAVEAT: load Lighthouse hanya 55 KiB; chunk Three.js (542 kB) belum dimuat (lazy +4 dtk), jadi skor TIDAK mencakup biaya 3D. Biaya setelah-load tidak diukur.

## AC8 FAQ keyboard & SVG — PASS
- FAQ = <details>/<summary> native. Tab fokus ke summary pertama (outline solid 3px), Enter buka/tutup, Space buka/tutup, Tab ke summary kedua + Enter membuka. Diuji dengan CDP Input.dispatchKeyEvent nyata.
- 12 <svg> semua role="img" + aria-label deskriptif (hero, 4 produk, botol, 6 galeri). Tidak ada SVG tanpa label.

## AC9 Konten — PASS (1 catatan minor)
- Disclaimer non-resmi: footer ("Situs demo non-resmi ... tidak berafiliasi...") + badge "demo" di navbar + FAQ "Apakah ini situs resmi?" + deskripsi botol 3D bukan model resmi.
- Testimoni: judul "Ilustrasi: kutipan berikut fiktif..." + tiap kutipan berlabel "(ilustrasi)". Galeri berlabel ilustrasi. Newsletter berlabel demo.
- Klaim kesehatan: tidak ada klaim menyesatkan; Zero Sugar eksplisit "bukan produk kesehatan"; FAQ kafein menyarankan konsultasi tenaga kesehatan.
- Fakta sejarah (1886/1888/1892/1894/1915/1928/1971/1982/1985/2005) konsisten dengan pengetahuan umum; bagian Indonesia sengaja generik. Counter akhir 1886 / 200+ / 1915 benar.
- Catatan minor: "Coca-Cola Light/Diet: Rendah kalori" - Diet Coke/Light sebenarnya ~nol kalori; "rendah kalori" aman tapi tidak tepat. Tidak blocking.

## Belum terverifikasi
- `astro check` (butuh install @astrojs/check+typescript, mengubah package.json).
- Pause canvas saat di luar viewport/dispose (hanya baca kode: IntersectionObserver + dispose ada); pixel ratio cap kode `Math.min(dpr,2)`.
- Interaksi sentuh/mobile nyata pada 3D; Safari/Firefox; Lighthouse setelah Three termuat.

## DAFTAR BUG
- BUG-A [Minor-Medium, responsif] Horizontal scroll +44px pada load awal di 375 & 768 (scrollWidth 419/812), hilang setelah halaman di-scroll. Repro: lebar 375, load, `scrollTo(200,0)` -> scrollX=44. Penyebab: gsap.from reveal-samping x:±60 pada #botol (animations.ts:59). Saran: overflow-x:clip pada section/body.
- NOTE-B [Info] chunk hero3d 542 kB memicu warning vite >500kB (lazy, tidak blocking).
- NOTE-C [Info/Minor] Gerak hero kembali ke normal tergantung tab foreground: counter/rAF berhenti di tab background (perilaku standar).
