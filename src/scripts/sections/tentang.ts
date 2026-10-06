// Tentang (#tentang): reveal teks + parallax/zoom-out halus pada foto.
// Tanpa JS / reduced-motion: konten statis penuh.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const section = document.getElementById('tentang');
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (section && !reduced) {
  const q = (s: string) => Array.from(section.querySelectorAll<HTMLElement>(s));

  q('[data-tt-reveal]').forEach((el) => {
    gsap.from(el, {
      y: 36, opacity: 0, duration: 0.9, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 90%', once: true },
    });
  });

  const main = section.querySelector<HTMLElement>('[data-tt-photo] img');
  if (main) {
    gsap.fromTo(main, { scale: 1.16 }, {
      scale: 1, ease: 'none',
      scrollTrigger: { trigger: main, start: 'top bottom', end: 'bottom top', scrub: true },
    });
  }

  const mm = gsap.matchMedia();
  mm.add('(min-width: 900px)', () => {
    const sub = section.querySelector<HTMLElement>('[data-tt-photo2]');
    if (sub) {
      gsap.fromTo(sub, { y: 80 }, {
        y: -40, ease: 'none',
        scrollTrigger: { trigger: sub, start: 'top bottom', end: 'bottom top', scrub: true },
      });
    }
  });

  q('[data-tt-block]').forEach((el, i) => {
    gsap.from(el, {
      y: 48, opacity: 0, duration: 0.9, ease: 'power3.out', delay: i * 0.08,
      scrollTrigger: { trigger: el, start: 'top 88%', once: true },
    });
  });
}
