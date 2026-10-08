// Berita (#berita): reveal judul, kartu sorotan naik + skala, daftar berita muncul berurutan.
import { reducedMotion, revealAll, revealEach, unhideOnFocus } from './reveal-d';

const section = document.getElementById('berita');

if (section && !reducedMotion()) {
  unhideOnFocus(section);
  revealAll(section, '[data-br-reveal]');
  revealAll(section, '[data-br-item]', { y: 28, stagger: 0.1 });

  const feat = section.querySelector<HTMLElement>('[data-br-feat]');
  if (feat) revealEach([feat], { y: 32, scale: 0.97, duration: 0.6 });
}
