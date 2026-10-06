// Milestones (#milestones): timeline horizontal ter-pin (>= 768px, tanpa reduced-motion).
// Tanpa JS / reduced-motion / mobile: daftar vertikal statis (CSS default di Milestones.astro).
// Catatan V1: TIDAK ada ScrollTrigger.refresh() per gambar load — ukuran kartu tetap (aspect-ratio) sehingga
// gambar lazy tidak menggeser layout.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const section = document.getElementById('milestones');
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Script section dieksekusi SEBELUM animations.ts (pin hero) → urutkan trigger sesuai posisi DOM lalu refresh
// sekali (bukan per gambar), supaya start/end section ter-pin di bawah hero memperhitungkan pin-spacer hero.
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
  const q = (s: string) => Array.from(section.querySelectorAll<HTMLElement>(s));
  const pin = section.querySelector<HTMLElement>('[data-ms-pin]');
  const viewport = section.querySelector<HTMLElement>('[data-ms-viewport]');
  const track = section.querySelector<HTMLElement>('[data-ms-track]');
  const progress = section.querySelector<HTMLElement>('[data-ms-progress]');
  const items = q('[data-ms-item]');

  gsap.from(q('[data-ms-reveal]'), {
    y: 48, opacity: 0, duration: 1, ease: 'power3.out', stagger: 0.12,
    scrollTrigger: { trigger: section, start: 'top 78%', once: true },
  });

  const mm = gsap.matchMedia();

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

    // Tiap kartu: foto sedikit zoom-out & teks naik saat masuk dari kanan
    items.forEach((item) => {
      const img = item.querySelector('img');
      const body = item.querySelector('.ms-body');
      if (img) {
        gsap.fromTo(img, { scale: 1.15 }, {
          scale: 1, ease: 'none',
          scrollTrigger: { trigger: item, containerAnimation: tween, start: 'left right', end: 'left 40%', scrub: true },
        });
      }
      if (body) {
        gsap.from(body, {
          y: 32, opacity: 0.2, ease: 'power2.out',
          scrollTrigger: { trigger: item, containerAnimation: tween, start: 'left 95%', end: 'left 60%', scrub: true },
        });
      }
    });

    requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => {
      section.classList.remove('is-h');
      if (progress) progress.style.transform = '';
      requestAnimationFrame(() => ScrollTrigger.refresh());
    };
  });

  mm.add('(max-width: 767.98px)', () => {
    items.forEach((item) => {
      gsap.from(item.children, {
        y: 36, opacity: 0, duration: 0.8, ease: 'power2.out', stagger: 0.08,
        scrollTrigger: { trigger: item, start: 'top 88%', once: true },
      });
    });
    if (progress && track) {
      gsap.fromTo(progress, { scaleX: 0 }, {
        scaleX: 1, ease: 'none',
        scrollTrigger: { trigger: track, start: 'top 70%', end: 'bottom 70%', scrub: true },
      });
    }
  });
}
