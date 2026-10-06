// Kemitraan (#kemitraan): reveal teks, zoom-out halus foto IPS, langkah alur muncul berurutan.
import { gsap, ScrollTrigger, reducedMotion, revealAll, unhideOnFocus } from './reveal-d';

const section = document.getElementById('kemitraan');

if (section && !reducedMotion()) {
  unhideOnFocus(section);
  revealAll(section, '[data-km-reveal]');

  const img = section.querySelector<HTMLElement>('[data-km-photo] img');
  if (img) {
    gsap.fromTo(img, { scale: 1.14 }, {
      scale: 1, ease: 'none',
      scrollTrigger: { trigger: img, start: 'top bottom', end: 'bottom top', scrub: true },
    });
  }

  const flow = section.querySelector<HTMLElement>('[data-km-flow]');
  const steps = section.querySelectorAll<HTMLElement>('[data-km-step]');
  // V0 (T2): dulu satu timeline dipicu oleh puncak kartu (top 85%) lalu 8 langkah menyusul berbasis WAKTU
  // (kartu 0,9 s → langkah mulai 0,4 s + stagger) — langkah bawah (05–08) baru muncul ±1–1,3 s setelah
  // trigger, padahal saat itu kartu sudah tergulir lewat (scroll cepat / harness: langkah tak pernah terlihat
  // di semua mode, tidak khusus no-webgl). Kini kartu dan tiap langkah punya trigger posisi sendiri:
  // langkah muncul saat langkah itu sendiri masuk viewport, dan durasi kartu dipendekkan.
  if (flow) {
    gsap.from(flow, {
      y: 32, opacity: 0, duration: 0.6, ease: 'power3.out',
      scrollTrigger: { trigger: flow, start: 'top 92%', once: true },
    });
  }
  if (steps.length) {
    gsap.set(steps, { y: 14, opacity: 0 });
    ScrollTrigger.batch(steps, {
      start: 'top bottom-=24',
      once: true,
      onEnter: (batch) => gsap.to(batch, { y: 0, opacity: 1, duration: 0.45, ease: 'power2.out', stagger: 0.05, overwrite: true }),
    });
  }
}
