// Kepemimpinan (#kepemimpinan): reveal judul, foto Direktur Utama (scale/opacity), kartu direksi bertahap.
// Tanpa JS / reduced-motion: semua tampil statis. Hanya y/opacity/scale (tanpa geser x).
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const section = document.getElementById('kepemimpinan');
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (section && !reduced) {
  const tweens: gsap.core.Tween[] = [];
  const q = (s: string) => Array.from(section.querySelectorAll<HTMLElement>(s));

  tweens.push(gsap.from(q('.kp-head [data-kp-reveal]'), {
    y: 48, opacity: 0, duration: 1, ease: 'power3.out', stagger: 0.1,
    scrollTrigger: { trigger: section, start: 'top 75%', once: true },
  }));

  const photo = section.querySelector('[data-kp-photo]');
  if (photo) {
    tweens.push(gsap.from(photo, {
      scale: 0.9, opacity: 0, duration: 1.2, ease: 'power3.out',
      scrollTrigger: { trigger: photo, start: 'top 80%', once: true },
    }));
    const img = photo.querySelector('img');
    if (img) {
      gsap.fromTo(img, { scale: 1.12 }, {
        scale: 1, ease: 'none',
        scrollTrigger: { trigger: photo, start: 'top bottom', end: 'bottom top', scrub: 0.6 },
      });
    }
  }
  tweens.push(gsap.from(q('.kp-lead-copy [data-kp-reveal]'), {
    y: 40, opacity: 0, duration: 0.9, ease: 'power3.out', stagger: 0.08,
    scrollTrigger: { trigger: section.querySelector('.kp-lead-copy'), start: 'top 85%', once: true },
  }));

  ScrollTrigger.batch(q('[data-kp-card]'), {
    start: 'top 90%', once: true,
    onEnter: (els) => { tweens.push(gsap.from(els, { y: 56, opacity: 0, duration: 0.9, ease: 'power3.out', stagger: 0.08 })); },
  });

  // W2: elemen yang bisa difokus tidak boleh tersembunyi — selesaikan semua reveal saat fokus masuk section.
  section.addEventListener('focusin', () => tweens.forEach((t) => t.progress(1)));
}
