// QA T8: bfcache restore setelah pagehide-dispose (preview :4420). Bukan kode produksi.
import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, args: ['--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
const p = await (await b.newContext({ viewport: { width: 1280, height: 800 } })).newPage(); const errs = [];
p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
await p.goto('http://localhost:4420/', { waitUntil: 'load' }); await p.mouse.move(40, 40);
await p.waitForFunction(() => document.querySelector('#hero-art canvas'), null, { timeout: 15000 }); await p.waitForTimeout(1000);
const st = () => p.evaluate(() => ({ marker: window.__m === 1, is3d: document.getElementById('hero-art').classList.contains('is-3d'), canvas: !!document.querySelector('#hero-art canvas'), svgOpacity: getComputedStyle(document.querySelector('#hero-art .fallback')).opacity }));
await p.evaluate(() => { window.__m = 1; addEventListener('pageshow', (e) => { window.__persisted = e.persisted; }); });
console.log('before', JSON.stringify(await st()));
await p.goto('http://localhost:4420/404-qa'); await p.waitForTimeout(500); await p.goBack(); await p.waitForTimeout(2000);
console.log('after-back', JSON.stringify({ ...(await st()), persisted: await p.evaluate(() => window.__persisted) }));
await p.screenshot({ path: 'qa/out-t8a-extra/bfcache-after-back.png' }); await p.mouse.move(300, 300); await p.evaluate(() => scrollBy(0, 50)); await p.waitForTimeout(2500);
console.log('after-interact', JSON.stringify(await st()), 'errors', JSON.stringify(errs.slice(0,5)));
await b.close();
