// Visi & Misi (#visi-misi): visi menyala kata demi kata (scrub opacity) di atas foto parallax;
// misi 01..05 muncul berurutan. Tanpa JS / reduced-motion: semua teks tampil penuh.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const section = document.getElementById('visi-misi');
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (section && !reduced) {
  const q = (s: string) => Array.from(section.querySelectorAll<HTMLElement>(s));

  q('[data-vm-reveal]').forEach((el) => {
    gsap.from(el, {
      y: 36, opacity: 0, duration: 0.9, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 88%', once: true },
    });
  });

  const bg = section.querySelector<HTMLElement>('[data-vm-bg]');
  const visi = section.querySelector<HTMLElement>('.vm-visi');
  if (bg && visi) {
    gsap.fromTo(bg, { scale: 1.2, yPercent: -6 }, {
      scale: 1.05, yPercent: 6, ease: 'none',
      scrollTrigger: { trigger: visi, start: 'top bottom', end: 'bottom top', scrub: true },
    });
  }

  const words = q('[data-vm-words] .vm-w');
  const text = section.querySelector('[data-vm-words]');
  if (words.length && text) {
    gsap.fromTo(words, { opacity: 0.14 }, {
      opacity: 1, ease: 'none', stagger: 0.1,
      scrollTrigger: { trigger: text, start: 'top 80%', end: 'bottom 45%', scrub: 0.4 },
    });
  }

  q('[data-vm-item]').forEach((el) => {
    gsap.from(el.children, {
      y: 32, opacity: 0, duration: 0.8, ease: 'power3.out', stagger: 0.08,
      scrollTrigger: { trigger: el, start: 'top 90%', once: true },
    });
  });
}
