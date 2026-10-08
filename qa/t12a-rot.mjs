// T12a R-1: rotasi 375×812 ↔ 812×375 — pin hilang/kembali, babak statis di layar pendek, tanpa error.
import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await (await b.newContext({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true })).newPage();
const errs = []; p.on('pageerror', (e) => errs.push(e.message));
await p.goto(process.env.URL || 'http://localhost:3000/', { waitUntil: 'load' }); await p.waitForTimeout(2000);
const st = () => p.evaluate(() => {
  const sc = document.querySelector('[data-hero-scene]'); const op = (s) => getComputedStyle(document.querySelector(s)).opacity;
  const btn = document.querySelector('[data-act="3"] .btn').getBoundingClientRect();
  return { pinned: sc.parentElement.classList.contains('pin-spacer'), sceneH: sc.offsetHeight, a2: op('[data-act="2"]'), a3: op('[data-act="3"]'), a1main: op('.act1-main'), b3top: Math.round(btn.top + scrollY) };
});
const out = [];
for (const [w, h] of [[375, 812], [812, 375], [375, 812], [812, 375], [1280, 800]]) {
  await p.setViewportSize({ width: w, height: h }); await p.waitForTimeout(1200);
  await p.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; scrollTo(0, 0); }); await p.waitForTimeout(500);
  out.push({ vp: `${w}x${h}`, ...(await st()) });
}
// fokus keyboard ke tombol babak 3 di layar pendek → terlihat
await p.setViewportSize({ width: 812, height: 375 }); await p.waitForTimeout(1000);
await p.focus('[data-act="3"] .btn'); await p.waitForTimeout(400);
const foc = await p.evaluate(() => { const r = document.activeElement.getBoundingClientRect(); return { inView: r.top >= 0 && r.bottom <= innerHeight, top: Math.round(r.top) }; });
console.log(JSON.stringify(out, null, 0)); console.log('focus b3 btn', JSON.stringify(foc), 'errors', errs.length, errs.slice(0, 3));
await b.close();
