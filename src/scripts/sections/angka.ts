// Angka (#angka): reveal judul & kartu, counter 0 → nilai resmi saat kartu masuk layar (sekali).
// Tanpa JS: HTML sudah berisi nilai akhir. Reduced-motion: tidak ada animasi sama sekali (nilai akhir tetap).
// Angka untuk pembaca layar ada di .sr-only (nilai akhir), elemen animasi aria-hidden.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const section = document.getElementById('angka');
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (section && !reduced) {
  const q = (s: string) => Array.from(section.querySelectorAll<HTMLElement>(s));
  const fmt = (v: number, d: number) => v.toLocaleString('id-ID', { minimumFractionDigits: d, maximumFractionDigits: d });

  gsap.from(q('[data-ag-reveal]'), {
    y: 48, opacity: 0, duration: 1, ease: 'power3.out', stagger: 0.1,
    scrollTrigger: { trigger: section, start: 'top 75%', once: true },
  });

  ScrollTrigger.batch(q('[data-ag-card]'), {
    start: 'top 88%', once: true,
    onEnter: (els) => gsap.from(els, { y: 40, opacity: 0, duration: 0.8, ease: 'power3.out', stagger: 0.08 }),
  });

  q('[data-ag-count]').forEach((el) => {
    const target = Number(el.dataset.agCount);
    const d = Number(el.dataset.agDecimals || 0);
    if (!Number.isFinite(target)) return;
    const st = { v: 0 };
    el.textContent = fmt(0, d);
    gsap.to(st, {
      v: target, duration: target > 1000 ? 2.2 : 1.4, ease: 'power2.out',
      onUpdate: () => { el.textContent = fmt(st.v, d); },
      onComplete: () => { el.textContent = fmt(target, d); },
      scrollTrigger: { trigger: el, start: 'top 90%', once: true },
    });
  });
}
