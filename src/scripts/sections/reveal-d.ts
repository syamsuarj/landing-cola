// Util reveal bersama untuk section Programmer D (kemitraan, karir, berita, keterbukaan).
// Hanya y/opacity/scale; tanpa JS konten terlihat (gsap.from dijalankan dari JS saja);
// reduced-motion = tidak ada animasi; elemen yang menerima fokus langsung ditampilkan (bug W2).
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export const reducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// X4 (T5/T6): dulu tiap elemen = gsap.from 0,9 s + delay WAKTU (stagger × (i % 4)) — saat scroll cepat elemen
// baru melewati opacity 0,1 ±0,3–0,5 s setelah trigger, ketika ia sudah tergulir lewat (pola sama dgn V0 kemitraan).
// Kini: setiap elemen dipicu posisinya sendiri (ScrollTrigger.batch, start saat elemen itu masuk viewport),
// durasi pendek ≤0,5 s, stagger hanya antar-elemen yang masuk BERSAMAAN (maks. 0,05 s × urutan, dibatasi).
export function revealEach(els: HTMLElement[], opts: { y?: number; scale?: number; duration?: number; stagger?: number } = {}) {
  if (!els.length) return els;
  const from: gsap.TweenVars = { y: opts.y ?? 28, opacity: 0 };
  if (opts.scale != null) from.scale = opts.scale;
  gsap.set(els, from);
  ScrollTrigger.batch(els, {
    start: 'top bottom-=24',
    once: true,
    onEnter: (batch) => gsap.to(batch, {
      y: 0, opacity: 1, scale: 1, duration: opts.duration ?? 0.5, ease: 'power2.out', overwrite: true,
      stagger: { each: Math.min(opts.stagger ?? 0.05, 0.05), from: 'start' },
    }),
  });
  return els;
}

export function revealAll(section: HTMLElement, selector: string, opts: { y?: number; stagger?: number } = {}) {
  const els = Array.from(section.querySelectorAll<HTMLElement>(selector));
  return revealEach(els, { y: Math.min(opts.y ?? 28, 32), stagger: opts.stagger });
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
