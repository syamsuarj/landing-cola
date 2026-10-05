// Sejarah (#sejarah): reveal intro + timeline horizontal ter-pin (>= 768px, tanpa reduced-motion).
// Tanpa JS / reduced-motion / mobile: daftar vertikal statis (lihat CSS default di About.astro).
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const section = document.getElementById('sejarah');
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Script section dieksekusi SEBELUM animations.ts (pin hero) → urutkan ulang trigger sesuai posisi
// halaman lalu refresh, supaya start/end section di bawah hero memperhitungkan pin-spacer hero.
const domOrder = (a: ScrollTrigger, b: ScrollTrigger) => {
  const ea = a.trigger as Element | undefined, eb = b.trigger as Element | undefined;
  if (!ea || !eb || ea === eb) return (ea ? 1 : 0) - (eb ? 1 : 0);
  return ea.compareDocumentPosition(eb) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
};
const resort = () => { ScrollTrigger.sort(domOrder); ScrollTrigger.refresh(); };
setTimeout(resort, 0);
if (document.readyState === 'complete') requestAnimationFrame(resort);
else window.addEventListener('load', resort, { once: true });

if (section && !reduced) {
  const q = <T extends Element = HTMLElement>(s: string) => Array.from(section.querySelectorAll<T>(s));
  const pin = section.querySelector<HTMLElement>('[data-sj-pin]');
  const viewport = section.querySelector<HTMLElement>('[data-sj-viewport]');
  const track = section.querySelector<HTMLElement>('[data-sj-track]');
  const progress = section.querySelector<HTMLElement>('[data-sj-progress]');
  const items = q('[data-sj-item]');

  // Reveal intro (y/opacity saja → tidak memicu overflow horizontal)
  gsap.from(q('[data-sj-reveal]'), {
    y: 48, opacity: 0, duration: 1, ease: 'power3.out', stagger: 0.12,
    scrollTrigger: { trigger: section, start: 'top 78%', once: true },
  });
  const photo = section.querySelector<HTMLElement>('[data-sj-photo] img');
  if (photo) {
    gsap.fromTo(photo, { scale: 1.18 }, {
      scale: 1, ease: 'none',
      scrollTrigger: { trigger: photo, start: 'top bottom', end: 'bottom top', scrub: true },
    });
  }

  const mm = gsap.matchMedia();

  // Desktop/tablet: pin + geser track horizontal (translate di dalam viewport ber-overflow hidden)
  mm.add('(min-width: 768px)', () => {
    if (!pin || !viewport || !track) return;
    section.classList.add('is-h');
    const distance = () => Math.max(0, track.scrollWidth - viewport.clientWidth);

    const tween = gsap.to(track, {
      x: () => -distance(),
      ease: 'none',
      scrollTrigger: {
        trigger: pin,
        start: 'top top',
        end: () => '+=' + distance(),
        pin: true,
        scrub: 0.6,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => { if (progress) progress.style.transform = `scaleX(${self.progress})`; },
      },
    });
    if (progress) progress.style.transform = 'scaleX(0)';

    // Tiap panel: tahun "menyala" saat masuk area tengah
    items.forEach((item) => {
      const year = item.querySelector('.sj-year');
      const text = item.querySelector('.sj-text');
      gsap.from([year, text], {
        y: 40, opacity: 0.15, ease: 'power2.out', stagger: 0.08,
        scrollTrigger: {
          trigger: item, containerAnimation: tween,
          start: 'left 92%', end: 'left 55%', scrub: true,
        },
      });
    });

    requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => {
      section.classList.remove('is-h');
      if (progress) progress.style.transform = '';
      requestAnimationFrame(() => ScrollTrigger.refresh());
    };
  });

  // Mobile: daftar vertikal, reveal per item
  mm.add('(max-width: 767.98px)', () => {
    items.forEach((item) => {
      gsap.from(item.children, {
        y: 36, opacity: 0, duration: 0.8, ease: 'power2.out', stagger: 0.08,
        scrollTrigger: { trigger: item, start: 'top 88%', once: true },
      });
    });
    if (progress) {
      gsap.fromTo(progress, { scaleX: 0 }, {
        scaleX: 1, ease: 'none',
        scrollTrigger: { trigger: track, start: 'top 70%', end: 'bottom 70%', scrub: true },
      });
    }
  });
}
