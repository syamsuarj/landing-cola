// Section Galeri (masonry foto). Reveal per foto: y/opacity/scale, dibatch agar ringan.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const section = document.getElementById('galeri');
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (section && !reduced) {
  const head = section.querySelector<HTMLElement>('[data-gal-head]');
  if (head) {
    gsap.from(head.children, {
      y: 40, opacity: 0, duration: 1, ease: 'power3.out', stagger: 0.1,
      scrollTrigger: { trigger: head, start: 'top 85%', once: true },
    });
  }

  const items = Array.from(section.querySelectorAll<HTMLElement>('[data-gal-item]'));
  if (items.length) {
    gsap.set(items, { y: 60, opacity: 0, scale: 0.96 });
    ScrollTrigger.batch(items, {
      start: 'top 92%',
      once: true,
      onEnter: (batch) => gsap.to(batch, {
        y: 0, opacity: 1, scale: 1, duration: 1, ease: 'power3.out', stagger: 0.1, overwrite: true,
      }),
    });
    // Sengaja TIDAK ada ScrollTrigger.refresh() per gambar: foto astro:assets sudah punya
    // width/height sehingga tinggi masonry tidak berubah saat foto termuat. Refresh di tengah
    // smooth scroll (anchor nav) memanggil scrollTo dan membatalkan scroll tersebut (QA V1).
  }
}
