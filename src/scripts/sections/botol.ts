// Botol ikonik (#botol): foto zoom-out halus (scrub) + reveal teks (y/opacity).
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const section = document.getElementById('botol');
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (section && !reduced) {
  const img = section.querySelector<HTMLElement>('[data-bt-img]');
  if (img) {
    gsap.fromTo(img, { scale: 1.22, yPercent: -4 }, {
      scale: 1, yPercent: 4, ease: 'none',
      scrollTrigger: { trigger: section, start: 'top bottom', end: 'bottom top', scrub: true },
    });
  }
  const parts = Array.from(section.querySelectorAll<HTMLElement>('[data-bt-reveal]'));
  parts.forEach((el) => {
    gsap.from(el, {
      y: 44, opacity: 0, duration: 0.95, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 88%', once: true },
    });
  });
  const year = section.querySelector('.bt-cap-year');
  if (year) {
    gsap.from(year, {
      y: 30, opacity: 0, duration: 1, ease: 'power3.out',
      scrollTrigger: { trigger: year, start: 'top 95%', once: true },
    });
  }
}
