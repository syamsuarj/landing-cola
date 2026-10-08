// Keterbukaan (#keterbukaan): reveal judul & pita, sampul laporan naik berurutan, blok WBS.
import { reducedMotion, revealAll, revealEach, unhideOnFocus } from './reveal-d';

const section = document.getElementById('keterbukaan');

if (section && !reducedMotion()) {
  unhideOnFocus(section);
  revealAll(section, '[data-kt-reveal]');
  revealAll(section, '[data-kt-rep]', { y: 56, stagger: 0.09 });

  // X4: dulu satu timeline (blok WBS 1 s, lalu kartu mekanisme mulai +0,4 s, stagger 0,12) — h4 "Mekanisme
  // Tertulis" baru terlihat ±0,5 s setelah puncak blok lewat 85% → terlewat saat scroll cepat. Kini blok dan tiap
  // kartu mekanisme punya trigger posisi sendiri, durasi pendek.
  const wbs = section.querySelector<HTMLElement>('[data-kt-wbs]');
  if (wbs) {
    revealEach([wbs], { y: 32, scale: 0.98, duration: 0.5 });
    revealEach(Array.from(wbs.querySelectorAll<HTMLElement>('[data-kt-m]')), { y: 20, duration: 0.45 });
  }
}
