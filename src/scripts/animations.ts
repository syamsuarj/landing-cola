/**
 * Inti animasi global (T1a): registrasi GSAP, navbar, menu mobile, adegan hero ter-pin, lazy Three.js.
 * Animasi per section ada di src/scripts/sections/<nama>.ts (milik T1b/T1c) dan di-import dari komponennya.
 * Semua kode di sini aman bila elemen tidak ada.
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { heroState } from './hero-state';
import './keep-scroll';

gsap.registerPlugin(ScrollTrigger);

const root = document.documentElement;
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const MENU_MQ = '(min-width: 1024px)';

/* ---------- Navbar: state "scrolled" + menu mobile ---------- */
const header = document.getElementById('top');
if (header) {
  const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 12);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  const btn = header.querySelector<HTMLButtonElement>('.menu-btn');
  const brand = header.querySelector<HTMLElement>('.brand');
  const navLinks = Array.from(header.querySelectorAll<HTMLAnchorElement>('.nav a'));
  // W1: saat panel layar penuh terbuka, semua di luar header (skip link, main, footer) + logo dibuat inert
  // agar fokus tidak bisa pindah ke konten yang tertutup panel.
  const outside = () => [
    ...Array.from(document.body.children).filter((el) => el !== header && el.tagName !== 'SCRIPT'),
    ...(brand ? [brand] : []),
  ] as HTMLElement[];
  const setOpen = (open: boolean) => {
    header.classList.toggle('open', open);
    btn?.setAttribute('aria-expanded', String(open));
    const label = btn?.querySelector('.menu-label');
    if (label) label.textContent = open ? 'Tutup' : 'Menu';
    btn?.setAttribute('aria-label', open ? 'Tutup menu' : 'Buka menu');
    document.body.style.overflow = open ? 'hidden' : '';
    outside().forEach((el) => el.toggleAttribute('inert', open));
  };
  btn?.setAttribute('aria-label', 'Buka menu');
  btn?.addEventListener('click', () => setOpen(!header.classList.contains('open')));
  navLinks.forEach((a) => a.addEventListener('click', () => { if (header.classList.contains('open')) setOpen(false); }));
  document.addEventListener('keydown', (e) => {
    if (!header.classList.contains('open')) return;
    if (e.key === 'Escape') { setOpen(false); btn?.focus(); return; }
    // W1: Tab / Shift+Tab berputar di dalam panel (tombol Tutup + link)
    if (e.key === 'Tab' && btn) {
      const ring: HTMLElement[] = [btn, ...navLinks];
      const i = ring.indexOf(document.activeElement as HTMLElement);
      const next = i === -1 ? (e.shiftKey ? ring.length - 1 : 0) : (i + (e.shiftKey ? -1 : 1) + ring.length) % ring.length;
      e.preventDefault();
      ring[next].focus();
    }
  });
  window.matchMedia(MENU_MQ).addEventListener('change', (e) => { if (e.matches) setOpen(false); });
}

/* ---------- Hero: adegan ter-pin 3 babak ---------- */
const scene = document.querySelector<HTMLElement>('[data-hero-scene]');
if (scene && !reduced && root.classList.contains('motion')) {
  const obj = scene.querySelector<HTMLElement>('[data-hero-object]');
  const a1 = scene.querySelector<HTMLElement>('[data-act="1"]');
  const a2 = scene.querySelector<HTMLElement>('[data-act="2"]');
  const a3 = scene.querySelector<HTMLElement>('[data-act="3"]');
  const bgImg = scene.querySelector<HTMLElement>('[data-hero-bg]');
  const stepEl = scene.querySelector<HTMLElement>('[data-hero-step]');
  const bars = Array.from(scene.querySelectorAll<HTMLElement>('[data-bar]'));
  let lastStep = 0;
  const setStep = (p: number) => {
    const step = p < 0.36 ? 1 : p < 0.7 ? 2 : 3;
    if (step === lastStep) return;
    lastStep = step;
    if (stepEl) stepEl.textContent = `0${step}`;
    bars.forEach((b, i) => b.classList.toggle('on', i < step));
  };
  setStep(0);

  // W2: elemen yang bisa difokus di babak tersembunyi tidak boleh fokus saat tersembunyi.
  // autoAlpha → visibility:hidden membuat link di babak 2/3 otomatis tidak bisa difokus;
  // link di babak 1 yang tersembunyi juga visibility:hidden. Bila keyboard memfokus link di babak lain,
  // gulir ke posisi babak itu agar terlihat.
  if (obj && a1 && a2 && a3) {
    const main = a1.querySelector('.act1-main');
    const news = a1.querySelector('.news');
    const cue = scene.querySelector('.scroll-cue');
    const mm = gsap.matchMedia();
    mm.add(
      { desk: '(min-width: 761px)', mob: '(max-width: 760px)' },
      (ctx) => {
        const desk = Boolean(ctx.conditions?.desk);
        gsap.set([a2, a3], { autoAlpha: 0, y: 48 });
        const tl = gsap.timeline({
          defaults: { ease: 'none' },
          scrollTrigger: {
            trigger: scene,
            start: 'top top',
            end: '+=220%',
            pin: true,
            scrub: 0.6,
            anticipatePin: 1,
            // Pin hero paling atas: hitung duluan agar posisi trigger section lain ikut benar
            refreshPriority: 10,
            invalidateOnRefresh: true,
            onUpdate: (self) => { heroState.progress = self.progress; setStep(self.progress); },
          },
        });
        if (bgImg) tl.fromTo(bgImg, { scale: 1.02 }, { scale: 1.14, duration: 3.05 }, 0);
        // Babak 1 -> 2
        tl.to(main, { yPercent: -12, autoAlpha: 0, duration: 0.8 }, 0)
          .to([news, cue].filter(Boolean), { y: 24, autoAlpha: 0, duration: 0.5 }, 0)
          .to(obj, desk
            ? { x: () => -window.innerWidth * 0.42, rotation: -8, scale: 1.08, duration: 1 }
            : { x: () => -window.innerWidth * 0.18, y: () => -window.innerHeight * 0.36, scale: 1.25, opacity: 1, duration: 1 }, 0)
          .to(a2, { autoAlpha: 1, y: 0, duration: 0.6 }, 0.5)
          .to({}, { duration: 0.5 })
          // Babak 2 -> 3
          .to(a2, { autoAlpha: 0, y: -40, duration: 0.5 })
          .to(obj, desk
            ? { x: () => -window.innerWidth * 0.02, rotation: 6, scale: 0.96, duration: 1 }
            : { x: () => -window.innerWidth * 0.3, y: () => -window.innerHeight * 0.42, scale: 1, rotation: 8, duration: 1 }, '<')
          .to(a3, { autoAlpha: 1, y: 0, duration: 0.6 }, '-=0.45')
          .to({}, { duration: 0.45 });

        // Fokus keyboard ke link di babak yang sedang tersembunyi → gulir ke babaknya (W2)
        const st = tl.scrollTrigger!;
        const goTo = (p: number) => () => {
          if (Math.abs(st.progress - p) < 0.08) return;
          const y = st.start + (st.end - st.start) * p;
          root.style.scrollBehavior = 'auto';
          window.scrollTo(0, y);
          root.style.scrollBehavior = '';
          st.update();
        };
        const pairs: [Element, number][] = [[a1, 0], [a3, 1]];
        const handlers = pairs.map(([el, p]) => {
          const h = goTo(p);
          el.addEventListener('focusin', h);
          return () => el.removeEventListener('focusin', h);
        });
        return () => { heroState.progress = 0; handlers.forEach((off) => off()); };
      },
    );
  }
}
root.classList.add('hero-ready');

/* ---------- Three.js di Hero: lazy-load, hanya bila WebGL ada & tidak reduced-motion ---------- */
function hasWebGL(): boolean {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch { return false; }
}
const art = document.getElementById('hero-art');
const stage = document.getElementById('hero-3d');
if (art && stage && !reduced && hasWebGL()) {
  // Tunda sampai halaman selesai dimuat (+jeda) atau ada interaksi pertama, agar tidak membebani load awal.
  const events = ['pointerdown', 'pointermove', 'keydown', 'touchstart', 'wheel', 'scroll'] as const;
  let started = false;
  const boot = () => {
    if (started) return;
    started = true;
    events.forEach((ev) => window.removeEventListener(ev, boot));
    import('./hero3d')
      .then(({ initHero3D }) => {
        // tampilkan stage dulu agar canvas punya ukuran nyata; kembalikan ke SVG bila gagal
        art.classList.add('is-3d');
        if (!initHero3D(stage, heroState)) art.classList.remove('is-3d');
      })
      .catch(() => { art.classList.remove('is-3d'); /* fallback SVG tetap tampil */ });
  };
  events.forEach((ev) => window.addEventListener(ev, boot, { once: true, passive: true }));
  const later = () => window.setTimeout(boot, 3500);
  if (document.readyState === 'complete') later(); else window.addEventListener('load', later, { once: true });
}

/* ---------- Posisi ScrollTrigger benar setelah font selesai (ScrollTrigger sudah auto-refresh saat 'load') ---------- */
if (document.fonts && document.fonts.status !== 'loaded') {
  document.fonts.ready.then(() => ScrollTrigger.refresh());
}
