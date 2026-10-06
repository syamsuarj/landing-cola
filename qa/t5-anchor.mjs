// QA T5 (independen): semua link in-page header + footer, cache kosong, per viewport.
// Header: klik dari atas (menu dibuka bila perlu). Footer: lompat instan ke bawah dulu lalu klik mouse nyata (scroll ke ATAS).
// Cek: top target = tinggi header ±10 (atau mentok max scroll), scroll smooth (>=4 posisi antara), html.kb-nav tidak tertinggal,
// dan posisi stabil 1,5 s setelah berhenti (tidak ada pergeseran layout terlambat).
// node qa/t5-anchor.mjs WxH   PORT env (default 4450). Bukan kode produksi.
import { chromium } from 'playwright-core';
const [W, H] = (process.argv[2] || '375x812').split('x').map(Number);
const PORT = process.env.PORT || 4450;
const URL = `http://127.0.0.1:${PORT}/`;
const b = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
let fails = 0;
// daftar link
let ctx = await b.newContext({ viewport: { width: W, height: H } });
let p = await ctx.newPage();
await p.goto(URL, { waitUntil: 'load' });
const links = await p.evaluate(() => ({
  header: [...new Set([...document.querySelectorAll('#nav-utama a[href^="#"]')].map((a) => a.getAttribute('href')))].filter((h) => h.length > 1),
  footer: [...new Set([...document.querySelectorAll('footer a[href^="#"]')].map((a) => a.getAttribute('href')))].filter((h) => h.length > 1),
}));
await ctx.close();
console.log(`${W}x${H} links`, JSON.stringify(links));
for (const where of ['header', 'footer']) for (const href of links[where]) {
  ctx = await b.newContext({ viewport: { width: W, height: H } });
  p = await ctx.newPage();
  await p.goto(URL, { waitUntil: 'load' }); await p.waitForTimeout(1200);
  const sel = where === 'header' ? `#nav-utama a[href="${href}"]` : `footer a[href="${href}"]`;
  if (where === 'header') {
    const mb = p.locator('.menu-btn');
    if (await mb.isVisible()) { await mb.click(); await p.waitForTimeout(600); }
  } else {
    await p.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; scrollTo(0, document.documentElement.scrollHeight); document.documentElement.style.scrollBehavior = ''; });
    await p.waitForTimeout(1500);
  }
  const loc = p.locator(sel).first();
  if (!(await loc.isVisible())) { console.log('SKIP (tidak terlihat)', where, href); await ctx.close(); continue; }
  const y0 = await p.evaluate(() => scrollY);
  try { await loc.click({ timeout: 5000 }); } catch (e) { fails++; console.log('FAIL klik', where, href, e.message.split('\n')[0]); await ctx.close(); continue; }
  const ys = new Set(); let last = -1, st = Date.now(); const t0 = Date.now();
  while (Date.now() - t0 < 12000) {
    const y = await p.evaluate(() => Math.round(scrollY)); ys.add(y);
    if (y !== last) { last = y; st = Date.now(); } else if (Date.now() - st > 1000) break;
    await p.waitForTimeout(50);
  }
  const m1 = await p.evaluate((h) => { const t = document.querySelector(h); return { top: Math.round(t.getBoundingClientRect().top), y: Math.round(scrollY) }; }, href);
  await p.waitForTimeout(1500);
  const m = await p.evaluate((h) => {
    const t = document.querySelector(h); const hh = document.getElementById('top').offsetHeight;
    const max = document.documentElement.scrollHeight - innerHeight;
    return { hh, top: Math.round(t.getBoundingClientRect().top), y: Math.round(scrollY), max, kb: document.documentElement.classList.contains('kb-nav'), hash: location.hash };
  }, href);
  const isTop = href === '#beranda' || href === '#top';
  const posOk = isTop ? m.y < 2 : (Math.abs(m.top - m.hh) <= 10 || (m.y >= m.max - 1 && m.top >= 0 && m.top <= m.hh + 10));
  const smooth = Math.abs(y0 - m.y) < 50 || ys.size >= 4;
  const stable = Math.abs(m1.top - m.top) <= 2;
  const ok = posOk && smooth && stable && !m.kb;
  if (!ok) fails++;
  console.log(ok ? 'PASS' : 'FAIL', `${W}x${H}`, where, href, JSON.stringify({ ...m, from: Math.round(y0), steps: ys.size, smooth, stable, top1: m1.top }));
  await ctx.close();
}
await b.close();
console.log(fails ? `FAILS ${fails}` : 'ALL PASS');
