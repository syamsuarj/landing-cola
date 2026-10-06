// Keterbukaan (#keterbukaan): reveal judul & pita, sampul laporan naik berurutan, blok WBS.
import { gsap, reducedMotion, revealAll, unhideOnFocus } from './reveal-d';

const section = document.getElementById('keterbukaan');

if (section && !reducedMotion()) {
  unhideOnFocus(section);
  revealAll(section, '[data-kt-reveal]');
  revealAll(section, '[data-kt-rep]', { y: 56, stagger: 0.09 });

  const wbs = section.querySelector<HTMLElement>('[data-kt-wbs]');
  if (wbs) {
    gsap.timeline({ scrollTrigger: { trigger: wbs, start: 'top 85%', once: true } })
      .from(wbs, { y: 50, opacity: 0, scale: 0.98, duration: 1, ease: 'power3.out' })
      .from(wbs.querySelectorAll('[data-kt-m]'), { y: 24, opacity: 0, duration: 0.7, ease: 'power2.out', stagger: 0.12 }, '-=0.6');
  }
}
