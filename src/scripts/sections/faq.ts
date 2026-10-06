// Section FAQ: <details> native (keyboard Enter/Space bawaan browser). Script hanya reveal y/opacity.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const section = document.getElementById('faq');
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (section && !reduced) {
  const tweens: gsap.core.Tween[] = [];
  const head = section.querySelector<HTMLElement>('[data-faq-head]');
  if (head) {
    tweens.push(gsap.from(head.children, {
      y: 50, opacity: 0, duration: 1, ease: 'power3.out', stagger: 0.12,
      scrollTrigger: { trigger: head, start: 'top 85%', once: true },
    }));
  }
  const items = section.querySelectorAll<HTMLElement>('[data-faq-item]');
  if (items.length) {
    tweens.push(gsap.from(items, {
      y: 30, opacity: 0, duration: 0.8, ease: 'power3.out', stagger: 0.08,
      scrollTrigger: { trigger: items[0], start: 'top 88%', once: true },
    }));
  }
  // W2: fokus keyboard bisa mendarat di item yang belum ter-reveal (browser menggulirnya ke tepi bawah,
  // di bawah titik picu) → selesaikan reveal seketika agar pertanyaan + focus ring terlihat.
  section.addEventListener('focusin', () => {
    tweens.forEach((t) => { t.progress(1); t.scrollTrigger?.kill(); });
  }, { once: true });
  // Tinggi berubah saat accordion dibuka -> segarkan posisi trigger section di bawahnya
  section.querySelectorAll('details').forEach((d) =>
    d.addEventListener('toggle', () => ScrollTrigger.refresh()));
}
