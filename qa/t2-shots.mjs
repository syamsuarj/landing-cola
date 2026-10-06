// QA T2 (QA-A): screenshot viewport tiap section (+ posisi tengah pin) pada satu ukuran. Bukan kode produksi.
// node qa/t2-shots.mjs 1280x800 [url] [--rm]
import { chromium } from 'playwright-core';
import fs from 'node:fs';
const [W, H] = process.argv[2].split('x').map(Number);
const url = process.argv[3] && !process.argv[3].startsWith('--') ? process.argv[3] : 'http://127.0.0.1:4410/';
const RM = process.argv.includes('--rm');
const OUT = `qa/out/t2-visual/${W}x${H}${RM ? '-rm' : ''}`;
fs.mkdirSync(OUT, { recursive: true });
const IDS = ['beranda', 'apresiasi', 'tentang', 'filosofi', 'milestones', 'visi-misi', 'kepemimpinan', 'bisnis', 'angka', 'kemitraan', 'karir', 'berita', 'keterbukaan', 'kontak'];
const b = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
const ctx = await b.newContext({ viewport: { width: W, height: H }, reducedMotion: RM ? 'reduce' : 'no-preference' });
const page = await ctx.newPage();
const errs = [];
page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
page.on('pageerror', (e) => errs.push(String(e)));
await page.goto(url, { waitUntil: 'load' });
await page.waitForTimeout(1200);
// scroll bertahap ke bawah lalu ke atas (memicu reveal + lazy img)
const total = await page.evaluate(() => document.documentElement.scrollHeight);
for (let y = 0; y < total; y += Math.round(H * 0.8)) { await page.evaluate((y) => window.scrollTo(0, y), y); await page.waitForTimeout(90); }
await page.waitForTimeout(600);
const info = [];
for (const id of IDS) {
  const g = await page.evaluate((id) => {
    const el = document.getElementById(id); if (!el) return null;
    const c = el.parentElement.classList.contains('pin-spacer') ? el.parentElement : el;
    const r = c.getBoundingClientRect();
    const hh = document.querySelector('.site-head')?.getBoundingClientRect().height || 0;
    return { top: Math.round(r.top + scrollY), h: Math.round(r.height), pinned: c !== el, hh: Math.round(hh) };
  }, id);
  if (!g) { info.push({ id, missing: true }); continue; }
  const pos = [['a', Math.max(0, g.top - (id === 'beranda' ? 0 : g.hh))]];
  if (g.h > H * 1.6) { for (const f of [0.33, 0.66]) pos.push([`m${Math.round(f * 100)}`, Math.round(g.top + (g.h - H) * f)]); pos.push(['z', g.top + g.h - H]); }
  for (const [tag, y] of pos) {
    await page.evaluate((y) => window.scrollTo(0, y), y - 300);
    await page.waitForTimeout(150);
    await page.evaluate((y) => window.scrollTo(0, y), y);
    await page.waitForTimeout(900);
    await page.screenshot({ path: `${OUT}/${id}-${tag}.png` });
  }
  info.push({ id, ...g, shots: pos.map((p) => p[0]) });
}
const ov = await page.evaluate(() => ({ sw: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth), iw: innerWidth }));
console.log(JSON.stringify({ W, H, RM, ov, errs, info }));
await b.close();
