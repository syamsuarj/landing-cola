// Tentang (#tentang): reveal teks + parallax/zoom-out halus pada foto.
// Tanpa JS / reduced-motion: konten statis penuh.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import { revealEach } from './reveal-d';

gsap.registerPlugin(ScrollTrigger);

const section = document.getElementById('tentang');
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (section && !reduced) {
  const q = (s: string) => Array.from(section.querySelectorAll<HTMLElement>(s));

  // X4/T6: reveal dipicu posisi tiap elemen (batch), durasi pendek — tanpa delay waktu berjenjang.
  revealEach(q('[data-tt-reveal]'), { y: 28 });

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

  // dulu: delay i × 0,08 s (tak terbatas) + 0,9 s → blok bawah terlambat muncul saat scroll cepat.
  revealEach(q('[data-tt-block]'), { y: 32 });
}
