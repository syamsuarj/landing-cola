// Fakta (#fakta): counter raksasa + reveal (y/opacity). Nilai akhir sudah ada di HTML.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const section = document.getElementById('fakta');
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (section && !reduced) {
  gsap.from(section.querySelectorAll('[data-fk-reveal]'), {
    y: 40, opacity: 0, duration: 0.9, ease: 'power3.out', stagger: 0.1,
    scrollTrigger: { trigger: section, start: 'top 75%', once: true },
  });

  section.querySelectorAll<HTMLElement>('[data-fk-item]').forEach((item, i) => {
    gsap.from(item.children, {
      y: 60, opacity: 0, duration: 1, ease: 'power3.out', stagger: 0.08, delay: (i % 2) * 0.1,
      scrollTrigger: { trigger: item, start: 'top 85%', once: true },
    });
  });

  section.querySelectorAll<HTMLElement>('[data-fk-to]').forEach((el) => {
    const end = Number(el.dataset.fkTo);
    const start = Number(el.dataset.fkFrom ?? 0);
    const suffix = el.dataset.fkSuffix ?? '';
    if (!Number.isFinite(end)) return;
    const final = el.textContent ?? `${end}${suffix}`;
    const obj = { v: start };
    ScrollTrigger.create({
      trigger: el, start: 'top 85%', once: true,
      onEnter: () => {
        el.textContent = `${start}${suffix}`;
        gsap.to(obj, {
          v: end, duration: 1.8, ease: 'power3.out',
          onUpdate: () => { el.textContent = `${Math.round(obj.v)}${suffix}`; },
          onComplete: () => { el.textContent = final; },
        });
      },
    });
  });
}
