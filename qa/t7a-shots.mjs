// T7a: screenshot hero (babak 1/2/3) 1280 & 375 + reduced-motion + crop objek 3D. Bukan kode produksi.
// Pakai: node qa/t7a-shots.mjs [url] [outdir]
import { chromium } from 'playwright-core';
import fs from 'node:fs';
const url = process.argv[2] || 'http://localhost:3000/';
const out = process.argv[3] || 'qa/out-t7';
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, args: ['--use-angle=metal', '--enable-gpu'] });
const errors = [];
for (const [w, h] of [[1280, 800], [375, 812]]) {
  for (const reduced of [false, true]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, reducedMotion: reduced ? 'reduce' : 'no-preference' });
    const page = await ctx.newPage();
    const tag = `${w}${reduced ? '-reduced' : ''}`;
    page.on('console', (m) => { if (m.type() === 'error') errors.push(`${tag}: ${m.text()}`); });
    page.on('pageerror', (e) => errors.push(`${tag}: ${e.message}`));
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    if (reduced) {
      await page.waitForTimeout(800);
      await page.screenshot({ path: `${out}/hero-act1-${tag}.png` });
      console.log(tag, '3d', await page.evaluate(() => document.getElementById('hero-art')?.classList.contains('is-3d')));
      await ctx.close(); continue;
    }
    await page.mouse.move(w / 2, h / 2);
    await page.waitForFunction(() => document.getElementById('hero-art')?.classList.contains('is-3d'), null, { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(2500);
    for (const [p, n] of [[0, 'act1'], [0.5, 'act2'], [0.97, 'act3']]) {
      await page.evaluate((p) => window.scrollTo(0, window.innerHeight * 2.2 * p), p);
      await page.waitForTimeout(1800);
      await page.screenshot({ path: `${out}/hero-${n}-${tag}.png` });
      const box = await page.$eval('#hero-art', (e) => { const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }; });
      if (n === 'act1') await page.screenshot({ path: `${out}/obj-${n}-${tag}.png`, clip: { x: Math.max(0, box.x), y: Math.max(0, box.y), width: Math.min(box.width, w - Math.max(0, box.x)), height: Math.min(box.height, h - Math.max(0, box.y)) } });
    }
    const st = await page.evaluate(() => { const s = window.__hero3dStats; return s && { calls: s.calls, triangles: s.triangles, kit: s.kit, dpr: s.dpr, throttled: s.throttled, avgMs: Math.round(s.avgMs) }; });
    const hook = await page.evaluate(() => !!(window.__hero3d && window.__hero3d.renderer && window.__hero3d.scene && window.__hero3d.camera));
    const ov = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    console.log(tag, JSON.stringify({ stats: st, devHook: hook, overflowX: ov }));
    await ctx.close();
  }
}
console.log('errors:', errors.length ? errors : 'none');
await browser.close();
