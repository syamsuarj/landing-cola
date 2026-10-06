// T1c-2 (Programmer D): screenshot section kemitraan/karir/berita/keterbukaan pada 1280 & 375 (+ no-JS 1280).
// Pakai (dari root repo): node qa/t1d-shots.mjs [url] [outdir]. Bukan kode produksi.
import { chromium } from 'playwright-core';
import fs from 'node:fs';

const url = process.argv[2] || 'http://127.0.0.1:3001/';
const out = process.argv[3] || 'qa/out-t1d-shots';
fs.mkdirSync(out, { recursive: true });
const ids = ['kemitraan', 'karir', 'berita', 'keterbukaan'];
const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
const errors = [];
const modes = [[1280, 800, true], [375, 812, true], [1280, 800, false]];
for (const [w, h, js] of modes) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, javaScriptEnabled: js });
  const page = await ctx.newPage();
  page.on('console', (m) => { if (m.type() === 'error') errors.push(`${w}: ${m.text()}`); });
  page.on('pageerror', (e) => errors.push(`${w}: ${e.message}`));
  await page.goto(url, { waitUntil: 'load', timeout: 60000 });
  // gulir bertahap agar semua reveal (once) terpicu & gambar lazy termuat
  console.log('loaded', w, js);
  const H = await page.evaluate(() => document.documentElement.scrollHeight);
  console.log('H', H);
  for (let y = 0; y < H; y += 500) { await page.evaluate((yy) => window.scrollTo({ top: yy, behavior: 'instant' }), y); await page.waitForTimeout(60); }
  console.log('scrolled');
  await page.waitForTimeout(1500);
  if (js) await page.addStyleTag({ content: '.site-head { display: none !important; }' });
  const ow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  console.log(`${w}${js ? '' : ' noJS'} overflow-x: ${ow}`);
  for (const id of ids) {
    const el = page.locator(`#${id}`);
    await el.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1200);
    const f = `${out}/${id}-${w}${js ? '' : '-nojs'}.png`;
    await el.screenshot({ path: f });
    console.log(f);
  }
  await ctx.close();
}
console.log('errors:', errors.length ? errors : 'none');
await browser.close();
