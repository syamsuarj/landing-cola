// Filosofi Logo (#filosofi): >= 900px & tanpa reduced-motion → panggung ter-pin, 5 makna menyala satu per satu
// mengikuti scroll (garis penunjuk tumbuh ke arah logo). Mobile: reveal per item. Tanpa JS / reduced-motion: statis penuh.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const section = document.getElementById('filosofi');
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (section && !reduced) {
  const q = (s: string) => Array.from(section.querySelectorAll<HTMLElement>(s));
  const pin = section.querySelector<HTMLElement>('[data-fl-pin]');
  const logo = section.querySelector<HTMLElement>('[data-fl-logo]');
  const ring = section.querySelector<HTMLElement>('.fl-ring');
  // Urutan bacaan: 01..05 (kiri 3, kanan 2) = urutan DOM
  const items = q('[data-fl-item]');

  q('[data-fl-reveal]').forEach((el) => {
    gsap.from(el, {
      y: 36, opacity: 0, duration: 0.9, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 88%', once: true },
    });
  });

  const mm = gsap.matchMedia();

  mm.add('(min-width: 900px)', () => {
    if (!pin) return;
    section.classList.add('is-steps');
    let current = -1;
    const setStep = (n: number) => {
      if (n === current) return;
      current = n;
      items.forEach((it, i) => it.classList.toggle('is-on', i <= n));
    };
    setStep(-1);

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: pin,
        start: 'top top',
        end: () => '+=' + Math.round(window.innerHeight * 2.4),
        pin: true,
        scrub: 0.5,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        // 5 langkah di 4%..90% progres; langkah terakhir menyala sebelum pin lepas agar sempat terbaca
        onUpdate: (self) => setStep(self.progress < 0.04 ? -1 : Math.min(items.length - 1, Math.floor(((self.progress - 0.04) / 0.86) * items.length))),
        onLeaveBack: () => setStep(-1),
      },
    });
    if (logo) tl.fromTo(logo, { scale: 0.86 }, { scale: 1, ease: 'none', duration: 1 }, 0);
    if (ring) tl.fromTo(ring, { rotate: -90 }, { rotate: 90, ease: 'none', duration: 1 }, 0);

    return () => {
      section.classList.remove('is-steps');
      items.forEach((it) => it.classList.remove('is-on'));
    };
  });

  mm.add('(max-width: 899.98px)', () => {
    if (logo) {
      gsap.from(logo, {
        scale: 0.8, opacity: 0, duration: 1, ease: 'power3.out',
        scrollTrigger: { trigger: logo, start: 'top 85%', once: true },
      });
    }
    items.forEach((it) => {
      gsap.from(it, {
        y: 36, opacity: 0, duration: 0.8, ease: 'power2.out',
        scrollTrigger: { trigger: it, start: 'top 88%', once: true },
      });
    });
  });
}
