// Section CTA + newsletter demo (dipindah dari animations.ts). Tidak mengirim/menyimpan data apa pun.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// --- Newsletter statis (selalu aktif, juga untuk reduced-motion) ---
const form = document.getElementById('news-form') as HTMLFormElement | null;
const msg = document.getElementById('news-msg');
if (form && msg && !form.dataset.bound) {
  form.dataset.bound = '1';
  // Tombol dirender `disabled` (tanpa JS form tidak terkirim & email tidak masuk URL); aktifkan di sini.
  form.querySelector<HTMLButtonElement>('[data-news-btn]')?.removeAttribute('disabled');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = form.querySelector<HTMLInputElement>('input[type=email]');
    if (!email) return;
    const ok = email.checkValidity() && email.value.trim() !== '';
    email.setAttribute('aria-invalid', ok ? 'false' : 'true');
    msg.textContent = ok
      ? 'Terima kasih! Ini hanya demo, tidak ada data yang dikirim.'
      : 'Masukkan alamat email yang valid.';
    if (!ok) email.focus();
  });
}

// --- Animasi (y/opacity/scale saja) ---
const section = document.getElementById('cta');
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (section && !reduced) {
  const copy = section.querySelector<HTMLElement>('[data-cta-reveal]');
  if (copy) {
    gsap.from(copy.children, {
      y: 50, opacity: 0, duration: 1, ease: 'power3.out', stagger: 0.1,
      scrollTrigger: { trigger: copy, start: 'top 85%', once: true },
    });
  }
  const img = section.querySelector<HTMLElement>('[data-cta-img]');
  if (img) {
    gsap.fromTo(img, { scale: 1.15 }, {
      scale: 1, ease: 'none',
      scrollTrigger: { trigger: section, start: 'top bottom', end: 'center center', scrub: true },
    });
  }
}
