// T1a: screenshot Header/Hero (3 babak)/Footer pada 1280 & 375. Bukan kode produksi.
// Pakai: node qa/t1a-shots.mjs [url] [outdir]
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
// Tanpa argumen URL: sajikan dist/ sendiri (server sementara, mati di akhir skrip) di port 4410.
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.ico': 'image/x-icon', '.svg': 'image/svg+xml' };
let server;
if (!process.argv[2]) {
  const dist = path.resolve('dist');
  server = http.createServer((q, r) => {
    let p = decodeURIComponent(q.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html';
    const f = path.join(dist, p);
    if (!f.startsWith(dist) || !fs.existsSync(f)) { r.writeHead(404); return r.end(); }
    r.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r);
  }).listen(4410, '127.0.0.1');
}
const url = process.argv[2] || 'http://127.0.0.1:4410/';
const out = process.argv[3] || 'qa/out-t1a-shots';
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
const errors = [];
for (const [w, h] of [[1280, 800], [375, 812]]) {
  for (const reduced of [false, true]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, reducedMotion: reduced ? 'reduce' : 'no-preference' });
    const page = await ctx.newPage();
    page.on('console', (m) => { if (m.type() === 'error') errors.push(`${w}${reduced ? 'R' : ''}: ${m.text()}`); });
    page.on('pageerror', (e) => errors.push(`${w}${reduced ? 'R' : ''}: ${e.message}`));
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    const tag = `${w}${reduced ? '-reduced' : ''}`;
    if (!reduced) {
      await page.mouse.move(w / 2, h / 2); // boot 3D
      await page.waitForTimeout(1800);
      await page.screenshot({ path: `${out}/hero-act1-${tag}.png` });
      const st = await page.evaluate(() => { const s = window.ScrollTrigger; return document.documentElement.scrollHeight; });
      for (const [p, n] of [[0.5, 'act2'], [0.97, 'act3']]) {
        await page.evaluate((p) => window.scrollTo(0, window.innerHeight * 2.2 * p), p);
        await page.waitForTimeout(1500);
        await page.screenshot({ path: `${out}/hero-${n}-${tag}.png` });
      }
      const ov = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      console.log(tag, 'overflowX', ov, '3d', await page.evaluate(() => document.getElementById('hero-art')?.classList.contains('is-3d')));
      // menu mobile
      if (w < 1024) {
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.waitForTimeout(400);
        await page.click('.menu-btn');
        await page.waitForTimeout(500);
        await page.screenshot({ path: `${out}/menu-open-${tag}.png` });
        // focus trap: 10x Tab tetap di header
        let outside = 0;
        for (let i = 0; i < 10; i++) { await page.keyboard.press('Tab'); if (!(await page.evaluate(() => !!document.activeElement?.closest('#top')))) outside++; }
        console.log(tag, 'focus outside header during menu:', outside);
        await page.keyboard.press('Escape');
      }
    } else {
      await page.screenshot({ path: `${out}/hero-${tag}.png`, fullPage: false });
      const hero = await page.$('#beranda');
      await hero.screenshot({ path: `${out}/hero-full-${tag}.png` });
    }
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await page.waitForTimeout(800);
    const foot = await page.$('footer');
    await foot.screenshot({ path: `${out}/footer-${tag}.png` });
    await ctx.close();
  }
}
console.log('errors:', errors.length ? errors : 'none');
await browser.close();
server?.close();
