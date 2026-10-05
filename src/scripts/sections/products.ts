// Produk (#produk): reveal header, reveal isi tiap varian, botol melayang (scrub),
// dan efek "tumpuk" (slide sebelumnya meredup/mengecil saat tertutup) bila mode sticky aktif.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const section = document.getElementById('produk');
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (section && !reduced) {
  const q = <T extends Element = HTMLElement>(s: string, root: ParentNode = section) => Array.from(root.querySelectorAll<T>(s));

  gsap.from(q('[data-pr-reveal]'), {
    y: 56, opacity: 0, duration: 1, ease: 'power3.out', stagger: 0.12,
    scrollTrigger: { trigger: section, start: 'top 75%', once: true },
  });
  gsap.from(q('.pr-index li'), {
    y: 24, opacity: 0, duration: 0.6, ease: 'power2.out', stagger: 0.06,
    scrollTrigger: { trigger: section.querySelector('.pr-index'), start: 'top 90%', once: true },
  });

  const slides = q('[data-pr-slide]');
  slides.forEach((slide) => {
    const copy = q('.pr-num, .pr-name, .pr-desc, .pr-pts li', slide);
    gsap.from(copy, {
      y: 48, opacity: 0, duration: 0.9, ease: 'power3.out', stagger: 0.07,
      scrollTrigger: { trigger: slide, start: 'top 65%', once: true },
    });
    const bottle = slide.querySelector('[data-pr-bottle]');
    const glow = slide.querySelector('.pr-glow');
    if (bottle) {
      gsap.fromTo(bottle, { y: 90, rotate: -7, scale: 0.9 }, {
        y: -20, rotate: 3, scale: 1, ease: 'none',
        scrollTrigger: { trigger: slide, start: 'top bottom', end: 'bottom top', scrub: 0.8 },
      });
    }
    if (glow) {
      gsap.fromTo(glow, { scale: 0.6, opacity: 0.3 }, {
        scale: 1.1, opacity: 1, ease: 'none',
        scrollTrigger: { trigger: slide, start: 'top 80%', end: 'top 10%', scrub: true },
      });
    }
  });

  // Efek tumpuk hanya saat .pr-slide sticky (lihat media query di Products.astro)
  const mm = gsap.matchMedia();
  mm.add('(min-width: 900px) and (min-height: 700px)', () => {
    slides.forEach((slide, i) => {
      const next = slides[i + 1];
      const inner = slide.querySelector('[data-pr-inner]');
      if (!next || !inner) return;
      gsap.to(inner, {
        scale: 0.92, opacity: 0.35, ease: 'none', transformOrigin: '50% 0%',
        scrollTrigger: { trigger: next, start: 'top bottom', end: 'top top', scrub: true },
      });
    });
  });
}
