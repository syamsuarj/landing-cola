// Section Keberlanjutan (editorial). Reveal y/opacity, zoom-out foto (scale) saat scroll.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const section = document.getElementById('keberlanjutan');
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (section && !reduced) {
  const img = section.querySelector<HTMLElement>('[data-sus-zoom]');
  if (img) {
    gsap.fromTo(img, { scale: 1.18 }, {
      scale: 1, ease: 'none',
      scrollTrigger: { trigger: img, start: 'top bottom', end: 'bottom 40%', scrub: true },
    });
  }

  section.querySelectorAll<HTMLElement>('[data-sus-reveal]').forEach((el) => {
    gsap.from(el, {
      y: 40, opacity: 0, duration: 1, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 88%', once: true },
    });
  });
}
