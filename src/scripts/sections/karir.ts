// Karir (#karir): parallax/zoom latar foto, reveal judul, kartu pilar muncul berurutan.
import { gsap, reducedMotion, revealAll, unhideOnFocus } from './reveal-d';

const section = document.getElementById('karir');

if (section && !reducedMotion()) {
  unhideOnFocus(section);
  revealAll(section, '[data-kr-reveal]');
  revealAll(section, '[data-kr-card]', { y: 48, stagger: 0.08 });

  const bg = section.querySelector<HTMLElement>('[data-kr-bg]');
  if (bg) {
    gsap.fromTo(bg, { scale: 1.18, yPercent: -4 }, {
      scale: 1, yPercent: 4, ease: 'none',
      scrollTrigger: { trigger: section, start: 'top bottom', end: 'bottom top', scrub: true },
    });
  }
}
