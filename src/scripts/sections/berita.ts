// Berita (#berita): reveal judul, kartu sorotan naik + skala, daftar berita muncul berurutan.
import { gsap, reducedMotion, revealAll, unhideOnFocus } from './reveal-d';

const section = document.getElementById('berita');

if (section && !reducedMotion()) {
  unhideOnFocus(section);
  revealAll(section, '[data-br-reveal]');
  revealAll(section, '[data-br-item]', { y: 28, stagger: 0.1 });

  const feat = section.querySelector<HTMLElement>('[data-br-feat]');
  if (feat) {
    gsap.from(feat, {
      y: 60, opacity: 0, scale: 0.97, duration: 1.1, ease: 'power3.out',
      scrollTrigger: { trigger: feat, start: 'top 88%', once: true },
    });
  }
}
