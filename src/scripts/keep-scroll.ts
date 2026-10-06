/**
 * W3 (T10): pertahankan posisi baca saat lebar viewport berubah (rotasi ponsel/tablet, resize jendela).
 *
 * Akar masalah: saat lebar melintasi breakpoint gsap.matchMedia (hero 760/761, about 768, products 900×700),
 * GSAP me-revert konteks lama dulu — pin-spacer hero/about dilepas sehingga dokumen memendek dan browser
 * menjepit scrollY (mis. 9000 → 4301) — lalu ScrollTrigger._refreshAll() menggulir ke 0 untuk mengukur.
 * Pada siklus refresh yang dipicu matchMedia ini nilai scroll yang direkam ScrollTrigger tidak dipulihkan
 * (event 'refresh' sudah terjadi di y=0), dan setiap breakpoint berikutnya (ada beberapa matchMedia) mulai
 * dari 0 → pengguna dilempar ke hero. scroll-behavior:smooth BUKAN penyebab (dengan auto pun tetap 0).
 *
 * Solusi: simpan "jangkar" relatif (anak langsung <main>/footer yang sedang di bawah header + progres di
 * dalamnya) selama pengguna menggulir. Begitu lebar berubah, jangkar dibekukan; setiap ScrollTrigger
 * 'refresh' (dan sekali lagi setelah tenang) posisi dipulihkan dari jangkar dengan scroll-behavior:auto.
 * Section ter-pin ikut benar karena pin-spacer adalah anak langsung <main> → progres pin ikut dipertahankan.
 */
import { ScrollTrigger } from 'gsap/ScrollTrigger';

type Anchor = { el: HTMLElement; p: number };

const docEl = document.documentElement;
const headerH = () => document.getElementById('top')?.offsetHeight ?? 64;
const blocks = (): HTMLElement[] => {
  const main = document.querySelector('main');
  const list = main ? (Array.from(main.children) as HTMLElement[]) : [];
  const foot = document.querySelector<HTMLElement>('body > footer');
  if (foot) list.push(foot);
  return list.filter((el) => el.offsetHeight > 0);
};
const docTop = (el: HTMLElement) => el.getBoundingClientRect().top + window.scrollY;

let anchor: Anchor | null = null;
let frozen = false;
let lastW = window.innerWidth;
let lastH = window.innerHeight;
let quietTimer = 0;
let raf = 0;

function capture() {
  const y = window.scrollY;
  if (y < 2) { anchor = null; return; } // di paling atas: biarkan tetap di atas
  const line = y + headerH();
  let best: Anchor | null = null;
  for (const el of blocks()) {
    const top = docTop(el);
    const h = el.offsetHeight;
    if (line >= top && line < top + h) { best = { el, p: (line - top) / h }; break; }
  }
  anchor = best;
}

function restore() {
  if (!anchor || !anchor.el.isConnected) return;
  const target = Math.round(docTop(anchor.el) + anchor.p * anchor.el.offsetHeight - headerH());
  const max = docEl.scrollHeight - window.innerHeight;
  const y = Math.max(0, Math.min(max, target));
  if (Math.abs(window.scrollY - y) < 2) return;
  const prev = docEl.style.scrollBehavior;
  docEl.style.scrollBehavior = 'auto'; // jangan animasikan pemulihan (global.css: smooth)
  window.scrollTo(0, y);
  docEl.style.scrollBehavior = prev;
  ScrollTrigger.update();
}

function scheduleRestore() {
  cancelAnimationFrame(raf);
  raf = requestAnimationFrame(restore);
}

function settleLater() {
  clearTimeout(quietTimer);
  quietTimer = window.setTimeout(() => {
    restore();
    frozen = false;
    capture();
  }, 700);
}

window.addEventListener('scroll', () => {
  if (!frozen && !ScrollTrigger.isRefreshing) capture();
}, { passive: true });

// 'resize' terjadi sebelum event 'change' matchMedia → jangkar dibekukan sebelum GSAP me-revert pin.
window.addEventListener('resize', () => {
  const w = window.innerWidth;
  const h = window.innerHeight;
  // Hanya-tinggi berubah di perangkat sentuh = address bar muncul/hilang → jangan ikut campur.
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  const relevant = w !== lastW || (h !== lastH && !coarse);
  lastW = w; lastH = h;
  if (!relevant) return;
  frozen = true;
  scheduleRestore();
  settleLater();
});

ScrollTrigger.addEventListener('refresh', () => {
  if (frozen) { scheduleRestore(); settleLater(); }
  else if (!anchor) capture();
});
