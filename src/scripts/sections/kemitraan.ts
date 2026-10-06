// Kemitraan (#kemitraan): reveal teks, zoom-out halus foto IPS, langkah alur muncul berurutan.
import { gsap, reducedMotion, revealAll, unhideOnFocus } from './reveal-d';

const section = document.getElementById('kemitraan');

if (section && !reducedMotion()) {
  unhideOnFocus(section);
  revealAll(section, '[data-km-reveal]');

  const img = section.querySelector<HTMLElement>('[data-km-photo] img');
  if (img) {
    gsap.fromTo(img, { scale: 1.14 }, {
      scale: 1, ease: 'none',
      scrollTrigger: { trigger: img, start: 'top bottom', end: 'bottom top', scrub: true },
    });
  }

  const flow = section.querySelector<HTMLElement>('[data-km-flow]');
  const steps = section.querySelectorAll<HTMLElement>('[data-km-step]');
  if (flow) {
    gsap.timeline({ scrollTrigger: { trigger: flow, start: 'top 85%', once: true } })
      .from(flow, { y: 48, opacity: 0, duration: 0.9, ease: 'power3.out' })
      .from(steps, { y: 14, opacity: 0, duration: 0.5, ease: 'power2.out', stagger: 0.06 }, '-=0.5');
  }
}
