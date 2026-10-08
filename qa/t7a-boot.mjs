import { chromium } from 'playwright-core';
const url = process.argv[2] || 'http://localhost:3000/';
const b = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
for (const [w,h] of [[1280,800],[375,812]]) {
const p = await (await b.newContext({ viewport: { width: w, height: h } })).newPage();
await p.goto(url, { waitUntil: 'networkidle' });
await p.evaluate(() => { window.__lt = []; new PerformanceObserver((l) => l.getEntries().forEach((e) => window.__lt.push(Math.round(e.duration)))).observe({ type: 'longtask', buffered: true }); });
const t0 = Date.now();
await p.mouse.move(w/2, h/2);
await p.waitForFunction(() => document.getElementById('hero-art')?.classList.contains('is-3d'), null, { timeout: 60000 });
console.log(w, 'boot→is-3d ms', Date.now() - t0, 'longtasks after boot', await p.evaluate(() => window.__lt));
}
await b.close();
