// Bisnis (#bisnis): reveal header & indeks, reveal isi tiap slide, gambar produk melayang (scrub, y/scale saja),
// dan efek "tumpuk" (slide sebelumnya meredup/mengecil saat tertutup) hanya bila mode sticky aktif.
// Tanpa JS / reduced-motion: semua slide statis berurutan (sticky dimatikan via CSS).
// Tanpa ScrollTrigger.refresh() per gambar: kotak gambar ber-aspect-ratio tetap (bug V1).
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const section = document.getElementById('bisnis');
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (section && !reduced) {
  const q = (s: string, root: ParentNode = section) => Array.from(root.querySelectorAll<HTMLElement>(s));
  const reveals: gsap.core.Tween[] = [];

  reveals.push(gsap.from(q('[data-bs-reveal]'), {
    y: 56, opacity: 0, duration: 1, ease: 'power3.out', stagger: 0.12,
    scrollTrigger: { trigger: section, start: 'top 75%', once: true },
  }));
  reveals.push(gsap.from(q('.bs-index li'), {
    y: 24, opacity: 0, duration: 0.6, ease: 'power2.out', stagger: 0.05,
    scrollTrigger: { trigger: section.querySelector('.bs-index'), start: 'top 92%', once: true },
  }));

  const slides = q('[data-bs-slide]');
  slides.forEach((slide) => {
    reveals.push(gsap.from(q('.bs-num, .bs-group, .bs-name > span, .bs-tag', slide), {
      y: 48, opacity: 0, duration: 0.9, ease: 'power3.out', stagger: 0.07,
      scrollTrigger: { trigger: slide, start: 'top 65%', once: true },
    }));
    const img = slide.querySelector('[data-bs-img]');
    const glow = slide.querySelector('.bs-glow');
    if (img) {
      gsap.fromTo(img, { y: 80, scale: 0.88 }, {
        y: -20, scale: 1, ease: 'none',
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

  // Efek tumpuk hanya saat .bs-slide sticky (media query sama dengan Bisnis.astro). keep-scroll.ts menangani lintas breakpoint (W3).
  const mm = gsap.matchMedia();
  mm.add('(min-width: 900px) and (min-height: 700px)', () => {
    slides.forEach((slide, i) => {
      const next = slides[i + 1];
      const inner = slide.querySelector('[data-bs-inner]');
      if (!next || !inner) return;
      gsap.to(inner, {
        scale: 0.92, opacity: 0.35, ease: 'none', transformOrigin: '50% 0%',
        scrollTrigger: { trigger: next, start: 'top bottom', end: 'top top', scrub: true },
      });
    });
  });

  // W2: tautan indeks yang difokus tidak boleh tersembunyi — tuntaskan reveal saat fokus masuk section.
  section.addEventListener('focusin', () => reveals.forEach((t) => t.progress(1)));
}
