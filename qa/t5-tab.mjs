// QA T5: V3 + regresi kb-nav. Dari y=0, fokus (preventScroll) elemen sebelum chip dalam urutan Tab, tekan Tab:
// chip harus di viewport ≤100 ms & scroll instan; html.kb-nav ada sesaat lalu hilang; Shift+Tab balik juga instan.
// Lalu klik link nav (#tentang) → harus smooth (≥4 posisi antara), kb-nav tidak tertinggal.
// node qa/t5-tab.mjs WxH   PORT env (default 4450). Bukan kode produksi.
import { chromium } from 'playwright-core';
const [W, H] = process.argv[2].split('x').map(Number);
const PORT = process.env.PORT || 4450;
const b = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
let fails = 0;
const st = (p) => p.evaluate(() => { const a = document.activeElement; const r = a.getBoundingClientRect(); const hh = document.getElementById('top').offsetHeight;
  return { href: a.getAttribute('href'), y: Math.round(scrollY), r: [Math.round(r.top), Math.round(r.bottom)], inView: r.top >= hh - 2 && r.bottom <= innerHeight + 1, kb: document.documentElement.classList.contains('kb-nav'), op: getComputedStyle(a).opacity }; });
for (const target of ['#bisnis-tbs', '#bisnis-cpo']) {
  const ctx = await b.newContext({ viewport: { width: W, height: H } });
  const p = await ctx.newPage();
  await p.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'load' }); await p.waitForTimeout(1200);
  const prev = await p.evaluate((h) => {
    const vis = (e) => e.tabIndex >= 0 && !e.closest('[inert],[aria-hidden="true"]') && e.getClientRects().length && getComputedStyle(e).visibility !== 'hidden';
    const all = [...document.querySelectorAll('a[href],button,[tabindex],input,summary,select,textarea')].filter(vis);
    const t = document.querySelector(`a[href="${h}"]`); const i = all.indexOf(t); const e = all[i - 1]; e.focus({ preventScroll: true });
    return { i, prev: e.getAttribute('href') || e.textContent.trim().slice(0, 30), y: scrollY };
  }, target);
  await p.keyboard.press('Tab');
  const s = [];
  for (const t of [50, 100, 300, 700, 1500]) { await p.waitForTimeout(t - (s.at(-1)?.t || 0)); s.push({ t, ...(await st(p)) }); }
  const instant = s[1].y === s.at(-1).y;
  const ok = s.at(-1).href === target && s[1].inView && s.at(-1).inView && instant && !s.at(-1).kb && s.at(-1).op === '1';
  if (!ok) fails++;
  console.log(ok ? 'PASS' : 'FAIL', `${W}x${H}`, 'Tab→', target, JSON.stringify({ prev }), s.map((x) => `${x.t}ms:${x.href} y${x.y} r${x.r} ${x.inView ? 'in' : 'OUT'} kb${+x.kb}`).join(' | '));
  if (target === '#bisnis-cpo') {
    // Shift+Tab balik ke chip sebelumnya
    await p.keyboard.press('Shift+Tab'); await p.waitForTimeout(100); const a = await st(p); await p.waitForTimeout(600); const c = await st(p);
    const ok2 = a.inView && a.y === c.y && !c.kb; if (!ok2) fails++;
    console.log(ok2 ? 'PASS' : 'FAIL', `${W}x${H}`, 'Shift+Tab', JSON.stringify({ a, c }));
    // klik link nav setelah Tab → harus smooth lagi
    await p.waitForTimeout(400);
    const mb = p.locator('.menu-btn'); if (await mb.isVisible()) { await mb.click(); await p.waitForTimeout(600); }
    const kbBefore = await p.evaluate(() => document.documentElement.classList.contains('kb-nav'));
    await p.locator('#nav-utama a[href="#tentang"]').click();
    const ys = new Set(); const t0 = Date.now(); let last = -1, stt = Date.now();
    while (Date.now() - t0 < 8000) { const y = await p.evaluate(() => Math.round(scrollY)); ys.add(y); if (y !== last) { last = y; stt = Date.now(); } else if (Date.now() - stt > 800) break; await p.waitForTimeout(40); }
    const m = await p.evaluate(() => ({ top: Math.round(document.getElementById('tentang').getBoundingClientRect().top), kb: document.documentElement.classList.contains('kb-nav'), sb: getComputedStyle(document.documentElement).scrollBehavior }));
    const ok3 = !kbBefore && ys.size >= 4 && Math.abs(m.top - 72) <= 10 && !m.kb; if (!ok3) fails++;
    console.log(ok3 ? 'PASS' : 'FAIL', `${W}x${H}`, 'klik nav setelah Tab', JSON.stringify({ kbBefore, steps: ys.size, ...m }));
  }
  await ctx.close();
}
await b.close();
console.log(fails ? `FAILS ${fails}` : 'ALL PASS');
