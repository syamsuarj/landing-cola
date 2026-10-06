// Diagnosa V1: elemen mana yang berubah tinggi selama smooth scroll ke #karir di 375. Bukan kode produksi.
import { chromium } from 'playwright-core';
const W = +(process.argv[2] || 375), Hh = +(process.argv[3] || 812), href = process.argv[4] || '#karir';
const b = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
const p = await (await b.newContext({ viewport: { width: W, height: Hh } })).newPage();
p.on('console', (m) => console.log('[page]', m.text()));
await p.goto(`http://127.0.0.1:${process.env.PORT || 4440}/`, { waitUntil: 'load' }); await p.waitForTimeout(1200);
const snap = () => p.evaluate(() => {
  const o = {};
  const walk = (el, d, path) => { if (d > 3) return; [...el.children].forEach((c, i) => { const k = path + '>' + (c.id || c.className?.toString().split(' ')[0] || c.tagName) + i; o[k] = c.offsetHeight; walk(c, d + 1, k); }); };
  walk(document.querySelector('main'), 0, 'main');
  return o;
});
await p.evaluate(() => {
  window.__ro = [];
  const ro = new ResizeObserver((es) => es.forEach((e) => { const t = e.target; window.__ro.push([Math.round(scrollY), (t.id || t.className?.toString().slice(0, 40) || t.tagName), Math.round(e.contentRect.height)]); }));
  document.querySelectorAll('main *').forEach((el) => { if (el.offsetHeight > 0 && !['SPAN', 'A', 'EM', 'STRONG', 'BR', 'path'].includes(el.tagName)) ro.observe(el); });
  setTimeout(() => (window.__ro = []), 300);
});
await p.waitForTimeout(500);
const s0 = await snap();
const mb = p.locator('.menu-btn');
if (await mb.isVisible()) { await mb.click(); await p.waitForTimeout(600); }
await p.locator(`#nav-utama a[href="${href}"]`).click();
await p.waitForTimeout(5000);
const s1 = await snap();
for (const k of Object.keys(s1)) if (s0[k] !== s1[k]) console.log('changed', k, s0[k], '->', s1[k]);
const ro = await p.evaluate(() => window.__ro);
console.log('RO events', ro.length); console.log(ro.slice(0, 60).map((r) => r.join(' ')).join('\n'));
await b.close();
