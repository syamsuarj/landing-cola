// Util reveal bersama untuk section Programmer D (kemitraan, karir, berita, keterbukaan).
// Hanya y/opacity/scale; tanpa JS konten terlihat (gsap.from dijalankan dari JS saja);
// reduced-motion = tidak ada animasi; elemen yang menerima fokus langsung ditampilkan (bug W2).
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export const reducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function revealAll(section: HTMLElement, selector: string, opts: { y?: number; stagger?: number } = {}) {
  const els = Array.from(section.querySelectorAll<HTMLElement>(selector));
  els.forEach((el, i) => {
    gsap.from(el, {
      y: opts.y ?? 36,
      opacity: 0,
      duration: 0.9,
      ease: 'power3.out',
      delay: (opts.stagger ?? 0) * (i % 4),
      scrollTrigger: { trigger: el, start: 'top 90%', once: true },
    });
  });
  return els;
}

/** Bila fokus keyboard masuk ke elemen yang masih tersembunyi, tampilkan seketika. */
export function unhideOnFocus(section: HTMLElement) {
  section.addEventListener('focusin', (e) => {
    let el = e.target as HTMLElement | null;
    while (el && el !== section) {
      if (getComputedStyle(el).opacity !== '1') gsap.set(el, { opacity: 1, y: 0, scale: 1 });
      el = el.parentElement;
    }
  });
}

export { gsap, ScrollTrigger };
