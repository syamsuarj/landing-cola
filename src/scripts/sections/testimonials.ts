// Section Kutipan (ilustrasi/fiktif): marquee kartu gelap.
// - Tanpa JS atau prefers-reduced-motion: grid statis 3 kartu (tidak bergerak).
// - Marquee: kloning kartu (aria-hidden + inert) agar loop mulus; jeda saat hover/fokus/di luar layar
//   dan lewat tombol "Jeda gerakan" (WCAG 2.2.2). Berhenti otomatis bila reduced-motion diaktifkan.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const section = document.getElementById('kutipan');
const viewport = section?.querySelector<HTMLElement>('[data-kut-viewport]');
const track = section?.querySelector<HTMLElement>('[data-kut-track]');
const toggle = section?.querySelector<HTMLButtonElement>('[data-kut-toggle]');
const label = toggle?.querySelector<HTMLElement>('[data-kut-label]');
const head = section?.querySelector<HTMLElement>('[data-kut-head]');
const mq = window.matchMedia('(prefers-reduced-motion: reduce)');

if (section && viewport && track && toggle) {
  const originals = Array.from(track.children) as HTMLElement[];
  const SPEED = 45; // px per detik
  let tween: gsap.core.Tween | null = null;
  let st: ScrollTrigger | null = null;
  let userPaused = false;
  let hover = false;
  let focusIn = false;
  let onScreen = false;
  let lastW = 0;

  const sync = () => {
    if (!tween) return;
    if (userPaused || hover || focusIn || !onScreen) tween.pause();
    else tween.resume();
  };

  const clear = () => {
    tween?.kill(); tween = null;
    st?.kill(); st = null;
    track.querySelectorAll('[data-kut-clone]').forEach((n) => n.remove());
    gsap.set(track, { clearProps: 'transform' });
    viewport.classList.remove('is-marquee');
    toggle.hidden = true;
  };

  const cloneOf = (el: HTMLElement) => {
    const c = el.cloneNode(true) as HTMLElement;
    c.setAttribute('aria-hidden', 'true');
    c.setAttribute('inert', '');
    c.dataset.kutClone = '';
    return c;
  };

  const build = () => {
    clear();
    if (mq.matches) return;
    viewport.classList.add('is-marquee');
    lastW = viewport.clientWidth;

    // Satu "grup" harus >= lebar viewport; lalu grup digandakan agar loop mulus.
    const gap = parseFloat(getComputedStyle(track).columnGap || '24') || 24;
    const groupWidth = () => originals.reduce((s, el) => s + el.offsetWidth + gap, 0);
    const oneSet = groupWidth();
    const reps = Math.max(1, Math.ceil(lastW / Math.max(oneSet, 1)));
    for (let r = 1; r < reps; r++) originals.forEach((el) => track.appendChild(cloneOf(el)));
    const group = Array.from(track.children) as HTMLElement[];
    group.forEach((el) => track.appendChild(cloneOf(el)));
    const distance = oneSet * reps;

    tween = gsap.to(track, {
      x: -distance, duration: distance / SPEED, ease: 'none', repeat: -1,
    });
    st = ScrollTrigger.create({
      trigger: section, start: 'top bottom', end: 'bottom top',
      onToggle: (self) => { onScreen = self.isActive; sync(); },
    });
    onScreen = st.isActive;
    toggle.hidden = false;
    sync();
  };

  toggle.addEventListener('click', () => {
    userPaused = !userPaused;
    toggle.setAttribute('aria-pressed', String(userPaused));
    if (label) label.textContent = userPaused ? 'Putar gerakan' : 'Jeda gerakan';
    sync();
  });
  viewport.addEventListener('pointerenter', () => { hover = true; sync(); });
  viewport.addEventListener('pointerleave', () => { hover = false; sync(); });
  viewport.addEventListener('focusin', () => { focusIn = true; sync(); });
  viewport.addEventListener('focusout', () => { focusIn = false; sync(); });

  let t = 0;
  window.addEventListener('resize', () => {
    window.clearTimeout(t);
    t = window.setTimeout(() => {
      if (tween && Math.abs(viewport.clientWidth - lastW) > 40) build();
    }, 200);
  });
  mq.addEventListener('change', () => { if (mq.matches) clear(); else build(); });

  const start = () => build();
  if (document.fonts && document.fonts.status !== 'loaded') document.fonts.ready.then(start);
  else start();

  if (head && !mq.matches) {
    gsap.from(head.children, {
      y: 40, opacity: 0, duration: 1, ease: 'power3.out', stagger: 0.1,
      scrollTrigger: { trigger: head, start: 'top 85%', once: true },
    });
  }
}
