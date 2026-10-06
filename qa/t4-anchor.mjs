// QA T2-fix2 (V1/V2): klik semua link nav header + footer dari atas, cache kosong, cek top target ≈ tinggi header.
// node qa/t4-anchor.mjs [W,W..] [reps] [href,href..] [--trace]   PORT env (default 4440). Bukan kode produksi.
import { chromium } from 'playwright-core';
const args = process.argv.slice(2);
const trace = args.includes('--trace');
const pos = args.filter((a) => !a.startsWith('--'));
const widths = (pos[0] || '375,1280').split(',').map(Number);
const reps = +(pos[1] || 2);
const PORT = process.env.PORT || 4440;
const H = { 375: 812, 1280: 800 };
const allHrefs = ['#beranda', '#tentang', '#bisnis', '#karir', '#kemitraan', '#berita', '#kontak', '#visi-misi'];
const hrefs = pos[2] ? pos[2].split(',') : allHrefs;
const b = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
let fails = 0;
for (const W of widths) for (const where of ['header', 'footer']) for (const href of hrefs) for (let r = 0; r < reps; r++) {
  const ctx = await b.newContext({ viewport: { width: W, height: H[W] || 800 } });
  const p = await ctx.newPage();
  await p.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'load' }); await p.waitForTimeout(1200);
  const sel = where === 'header' ? `#nav-utama a[href="${href}"]` : `footer a[href="${href}"]`;
  if (!(await p.locator(sel).count())) { await ctx.close(); if (r === 0) console.log(W, where, href, 'NO LINK'); continue; }
  if (where === 'header') {
    const mb = p.locator('.menu-btn');
    if (await mb.isVisible()) { await mb.click(); await p.waitForTimeout(600); }
    await p.locator(sel).first().click();
  } else {
    // dari atas: klik via JS (link footer tidak terlihat di atas)
    await p.evaluate((s) => document.querySelector(s).click(), sel);
  }
  const tl = []; let last = -1, st = Date.now(), t0 = Date.now();
  while (Date.now() - t0 < 12000) {
    const s = await p.evaluate((h) => { const t = h === '#top' ? document.querySelector('main > *') : document.querySelector(h); return { y: Math.round(scrollY), dt: Math.round(t.getBoundingClientRect().top + scrollY), sh: document.documentElement.scrollHeight }; }, href);
    tl.push(s); if (s.y !== last) { last = s.y; st = Date.now(); } else if (Date.now() - st > 1000) break;
    await p.waitForTimeout(100);
  }
  const m = await p.evaluate((h) => {
    const hh = document.getElementById('top').offsetHeight;
    const t = h === '#top' ? null : document.querySelector(h);
    const max = document.documentElement.scrollHeight - innerHeight;
    if (!t) return { hh, top: null, y: Math.round(scrollY), max, ok: scrollY < 2 };
    const top = Math.round(t.getBoundingClientRect().top);
    const atBottom = Math.abs(scrollY - max) < 2;
    // footer pendek: boleh mentok dasar asal top >= tinggi header - 10
    const ok = (h === '#beranda' && scrollY < 2) || Math.abs(top - hh) <= 10 || (atBottom && top >= hh - 10);
    return { hh, top, y: Math.round(scrollY), max, ok };
  }, href);
  if (!m.ok) fails++;
  console.log(m.ok ? 'PASS' : 'FAIL', W, where, href, r + 1, JSON.stringify(m), trace ? 'tl ' + tl.map((s) => `${s.y}/${s.dt}/${s.sh}`).join(' ') : '');
  await ctx.close();
}
console.log(fails ? `FAILS: ${fails}` : 'ALL PASS');
await b.close();
