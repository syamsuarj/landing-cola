#!/usr/bin/env node
// QA-B T8 visual: screenshot babak 1/2/3 + crop #hero-art (DPR2) + no-webgl / reduced-motion. Bukan kode produksi.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
const QA = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(QA, 'out-t8b'); fs.mkdirSync(OUT, { recursive: true });
const URL = process.argv[2] || 'http://localhost:3000/';
const CHROME = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const VPS = [[1280, 800], [1440, 900], [375, 812], [768, 1024]];
const BABAK = [[1, 0], [2, 0.45], [3, 0.9]];
const log = [];
setTimeout(() => { console.error('timeout'); process.exit(2); }, 170e3).unref();

async function pin(page) {
  return page.evaluate(() => {
    const s = document.querySelector('[data-hero-scene]') || document.getElementById('beranda');
    const sp = s?.closest('.pin-spacer');
    const top = (sp || s).getBoundingClientRect().top + scrollY;
    return { start: top, end: top + (sp ? sp.offsetHeight - innerHeight : 0) };
  });
}
async function runVariant(browser, tag, w, h, extra = {}, babaks = BABAK) {
  const mobile = w < 760;
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2, isMobile: mobile, hasTouch: mobile, ...extra });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => log.push(`[${tag}${w}] pageerror ${e.message}`));
  page.on('console', (m) => m.type() === 'error' && log.push(`[${tag}${w}] console.error ${m.text()}`));
  await page.goto(URL, { waitUntil: 'load', timeout: 45e3 });
  const is3d = await page.waitForFunction(() => document.getElementById('hero-art')?.classList.contains('is-3d'), null, { timeout: 9e3 }).then(() => true, () => false);
  await page.waitForTimeout(900);
  const p = await pin(page);
  for (const [n, f] of babaks) {
    const y = Math.round(p.start + f * (p.end - p.start));
    await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), y);
    await page.waitForTimeout(1700);
    const base = `${tag}${w}-b${n}`;
    await page.screenshot({ path: path.join(OUT, base + '.png') });
    const r = await page.evaluate(() => { const a = document.getElementById('hero-art'); if (!a) return null; const b = a.getBoundingClientRect(); return { x: b.x, y: b.y, w: b.width, h: b.height, op: getComputedStyle(a).opacity }; });
    if (r) {
      const x = Math.max(0, r.x), yy = Math.max(0, r.y), cw = Math.min(w, r.x + r.w) - x, ch = Math.min(h, r.y + r.h) - yy;
      if (cw > 2 && ch > 2) await page.screenshot({ path: path.join(OUT, base + '-art.png'), clip: { x, y: yy, width: cw, height: ch } });
    }
    log.push(`${base}: is3d=${is3d} art=${r && JSON.stringify({ x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.w), h: Math.round(r.h), op: r.op })}`);
  }
  await ctx.close();
}
const browser = await chromium.launch({ executablePath: CHROME, args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });
for (const [w, h] of VPS) await runVariant(browser, '', w, h);
for (const [w, h] of [[1280, 800], [375, 812]]) await runVariant(browser, 'rm-', w, h, { reducedMotion: 'reduce' }, [[1, 0]]);
await browser.close();
const nogl = await chromium.launch({ executablePath: CHROME, args: ['--disable-webgl', '--disable-3d-apis'] });
for (const [w, h] of [[1280, 800], [375, 812]]) await runVariant(nogl, 'nogl-', w, h, {}, [[1, 0], [3, 0.9]]);
await nogl.close();
fs.writeFileSync(path.join(OUT, 'log.txt'), log.join('\n'));
console.log(log.join('\n'));
