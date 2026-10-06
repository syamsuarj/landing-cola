// QA T5 repro: lompat ke bawah, klik link footer, catat timeline scrollY/target top/scrollHeight.
// node qa/t5-footrepro.mjs WxH href reps [waitBottomMs]   PORT env (default 4450). Bukan kode produksi.
import { chromium } from 'playwright-core';
const [W, H] = process.argv[2].split('x').map(Number);
const href = process.argv[3]; const reps = +(process.argv[4] || 3); const wb = +(process.argv[5] || 1500);
const PORT = process.env.PORT || 4450;
const b = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
for (let r = 0; r < reps; r++) {
  const ctx = await b.newContext({ viewport: { width: W, height: H } });
  const p = await ctx.newPage();
  await p.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'load' }); await p.waitForTimeout(1200);
  const pre = await p.evaluate(() => document.documentElement.scrollHeight);
  await p.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; scrollTo(0, 1e6); document.documentElement.style.scrollBehavior = ''; });
  await p.waitForTimeout(wb);
  const before = await p.evaluate((h) => ({ y: Math.round(scrollY), sh: document.documentElement.scrollHeight, dt: Math.round(document.querySelector(h).getBoundingClientRect().top + scrollY) }), href);
  await p.locator(`footer a[href="${href}"]`).first().click();
  const tl = []; const t0 = Date.now(); let last = -1, st = Date.now();
  while (Date.now() - t0 < 8000) {
    const s = await p.evaluate((h) => ({ t: 0, y: Math.round(scrollY), top: Math.round(document.querySelector(h).getBoundingClientRect().top), sh: document.documentElement.scrollHeight }), href);
    s.t = Date.now() - t0; tl.push(s);
    if (s.y !== last) { last = s.y; st = Date.now(); } else if (Date.now() - st > 1500) break;
    await p.waitForTimeout(100);
  }
  const end = tl[tl.length - 1];
  const shs = [...new Set(tl.map((s) => s.sh))];
  console.log(Math.abs(end.top - 72) <= 10 ? 'PASS' : 'FAIL', `${W}x${H}`, href, `r${r}`, JSON.stringify({ preSh: pre, before, end, shDuring: shs }));
  if (Math.abs(end.top - 72) > 10) console.log('  timeline', JSON.stringify(tl.filter((_, i) => i % 3 === 0)));
  await ctx.close();
}
await b.close();
