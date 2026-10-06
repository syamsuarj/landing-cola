// Apresiasi (#apresiasi): reveal judul/kartu + surat "menyala" kata demi kata saat digulir.
// Tanpa JS / reduced-motion: semua teks tampil penuh (tidak ada CSS yang menyembunyikan).
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const section = document.getElementById('apresiasi');
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (section && !reduced) {
  const q = (s: string) => Array.from(section.querySelectorAll<HTMLElement>(s));

  q('[data-ap-reveal]').forEach((el) => {
    gsap.from(el, {
      y: 36, opacity: 0, duration: 0.9, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 88%', once: true },
    });
  });

  // Kata-kata surat: dari redup ke penuh mengikuti scroll (opacity saja, tidak mengubah layout)
  const words = q('[data-ap-words] .ap-w');
  const body = section.querySelector('[data-ap-words]');
  if (words.length && body) {
    gsap.fromTo(words, { opacity: 0.16 }, {
      opacity: 1, ease: 'none', stagger: 0.1,
      scrollTrigger: { trigger: body, start: 'top 82%', end: 'bottom 52%', scrub: 0.4 },
    });
  }

  gsap.from(q('[data-ap-card]'), {
    y: 48, opacity: 0, duration: 0.9, ease: 'power3.out', stagger: 0.12,
    scrollTrigger: { trigger: section.querySelector('.ap-cards'), start: 'top 85%', once: true },
  });
}
