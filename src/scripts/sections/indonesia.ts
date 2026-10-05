// Section Indonesia: foto full-bleed + overlay. Animasi hanya y/opacity/scale (tanpa x) — BUG-A.
// Tanpa JS / reduced-motion: tidak ada yang disembunyikan, konten statis.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const section = document.getElementById('indonesia');
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (section && !reduced) {
  // Parallax halus foto latar (gambar 112% tinggi wadah, wadah overflow hidden)
  const bg = section.querySelector<HTMLElement>('[data-ind-parallax]');
  if (bg) {
    gsap.fromTo(bg, { yPercent: -6, scale: 1.08 }, {
      yPercent: 4, scale: 1, ease: 'none',
      scrollTrigger: { trigger: section, start: 'top bottom', end: 'bottom top', scrub: true },
    });
  }

  section.querySelectorAll<HTMLElement>('[data-ind-reveal]').forEach((el) => {
    gsap.from(el, {
      y: 48, opacity: 0, duration: 1.1, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 85%', once: true },
    });
  });

  const items = section.querySelectorAll<HTMLElement>('[data-ind-item]');
  if (items.length) {
    gsap.from(items, {
      y: 40, opacity: 0, duration: 0.9, ease: 'power3.out', stagger: 0.12,
      scrollTrigger: { trigger: items[0], start: 'top 88%', once: true },
    });
  }
}
