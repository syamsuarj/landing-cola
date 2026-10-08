// QA T10 (QA-C): landscape ≤500px — apakah tombol hero bisa dijangkau saat scroll (pin?) dan bayangan lantai yatim. Bukan kode produksi.
import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
for (const [w, h] of [[812, 375], [667, 375]]) {
  const p = await (await b.newContext({ viewport: { width: w, height: h }, isMobile: true, hasTouch: true, deviceScaleFactor: 1 })).newPage();
  await p.goto(process.env.URL || 'http://localhost:3000/', { waitUntil: 'load' }); await p.mouse.move(40, 40); await p.waitForTimeout(3000);
  const pin = await p.evaluate(() => { const s = document.querySelector('#beranda'); const ps = s.parentElement?.classList.contains('pin-spacer') ? s.parentElement : null; return { pinned: !!ps, spacerH: ps?.offsetHeight, secH: s.offsetHeight }; });
  const rows = [];
  for (const y of [0, 120, 240, 400]) {
    await p.evaluate((y) => { document.documentElement.style.scrollBehavior = 'auto'; scrollTo(0, y); }, y); await p.waitForTimeout(1200);
    rows.push(await p.evaluate((y) => { const vis = (e) => { const r = e.getBoundingClientRect(); let o = 1; for (let n = e; n; n = n.parentElement) o *= +getComputedStyle(n).opacity; return { top: Math.round(r.top), bottom: Math.round(r.bottom), op: +o.toFixed(2) }; };
      const btns = [...document.querySelectorAll('#beranda .btn')].slice(0, 2).map(vis); const fl = document.querySelector('[data-hero-backdrop] .floor').getBoundingClientRect(); const sp = document.querySelector('[data-hero-backdrop] .spot').getBoundingClientRect();
      return { y, btns, floor: [Math.round(fl.x), Math.round(fl.y), Math.round(fl.width), Math.round(fl.height)], spotC: [Math.round(sp.x + sp.width / 2), Math.round(sp.y + sp.height / 2)], floorOp: getComputedStyle(document.querySelector('[data-hero-backdrop] .floor')).opacity }; }, y));
    await p.screenshot({ path: `qa/out-t10c/land-${w}-y${y}.png` });
  }
  console.log(w, h, JSON.stringify(pin), JSON.stringify(rows));
}
await b.close();
