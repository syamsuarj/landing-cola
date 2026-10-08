import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', args: ['--use-angle=metal','--enable-gpu','--ignore-gpu-blocklist'] });
for (const [w,h] of [[1440,900],[1280,800],[1920,1080]]) {
const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
const p = await ctx.newPage(); await p.goto('http://localhost:3000/', { waitUntil: 'load' });
await p.waitForFunction(() => document.getElementById('hero-art')?.classList.contains('is-3d'), null, { timeout: 9e3 }).catch(()=>{});
await p.waitForTimeout(1000);
const r = await p.evaluate(() => { const b = document.querySelector('#hero-art').getBoundingClientRect(); return { x: b.x, y: b.y, w: b.width, h: b.height }; });
for (let i = 0; i < 6; i++) { await p.screenshot({ path: `out-t13e/probe-clip-${w}-${i}.png`, clip: { x: r.x + r.w - 160, y: r.y, width: 160, height: r.h } }); await p.waitForTimeout(1500); }
await ctx.close(); }
await b.close();
