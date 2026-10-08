#!/usr/bin/env node
// QA-D T10 visual: screenshot babak 1/2/3 + crop #hero-art (DPR2) + no-webgl / reduced-motion. Bukan kode produksi.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
const QA = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(QA, 'out-t10b'); fs.mkdirSync(OUT, { recursive: true });
const URL = process.argv[2] || 'http://localhost:3000/';
const CHROME = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const VPS = [[1440, 900], [1280, 800], [1024, 768], [768, 1024], [375, 812], [812, 375]];
const BABAK = [[1, 0], [2, 0.45], [3, 0.9]];
const log = [];
setTimeout(() => { console.error('timeout'); fs.writeFileSync(path.join(OUT, 'log.txt'), log.join('\n')); process.exit(2); }, 175e3).unref();

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
    const g = await page.evaluate(() => { const c = (sel) => { const e = document.querySelector(sel); if (!e) return null; const b = e.getBoundingClientRect(); return [Math.round(b.x + b.width / 2), Math.round(b.y + b.height / 2), Math.round(b.width), Math.round(b.height), getComputedStyle(e).display === 'none' ? 'hidden' : getComputedStyle(e).opacity]; }; return { obj: c('[data-hero-object]'), cv: c('#hero-art canvas'), spot: c('[data-hero-backdrop] .spot'), floor: c('[data-hero-backdrop] .floor') }; });
    log.push(`${base} centers ${JSON.stringify(g)}`);
    log.push(`${base}: is3d=${is3d} art=${r && JSON.stringify({ x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.w), h: Math.round(r.h), op: r.op })}`);
  }
  if (extra.edge) {
    await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), Math.round(p.end + h * 0.55));
    await page.waitForTimeout(1200);
    await page.screenshot({ path: path.join(OUT, `${tag}${w}-edge.png`) });
  }
  await ctx.close();
}
const browser = await chromium.launch({ executablePath: CHROME, args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });
for (const [w, h] of VPS) await runVariant(browser, '', w, h, w === 1440 || w === 375 ? { edge: 1 } : {});
// crossfade frames 1280
{ const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 }); const page = await ctx.newPage(); await page.goto(URL, { waitUntil: 'commit' }); const t0 = Date.now(); let i = 0; while (Date.now() - t0 < 6000 && i < 30) { await page.screenshot({ path: path.join(OUT, `xf-${String(i).padStart(2, '0')}.png`), clip: { x: 640, y: 80, width: 640, height: 720 } }).catch(() => {}); const st = await page.evaluate(() => document.getElementById('hero-art')?.className).catch(() => '?'); log.push(`xf-${i} t=${Date.now() - t0} ${st}`); i++; await page.waitForTimeout(150); } await ctx.close(); }
for (const [w, h] of [[1280, 800], [375, 812]]) await runVariant(browser, 'rm-', w, h, { reducedMotion: 'reduce' }, [[1, 0]]);
await browser.close();
const nogl = await chromium.launch({ executablePath: CHROME, args: ['--disable-webgl', '--disable-3d-apis'] });
for (const [w, h] of [[1280, 800], [375, 812], [768, 1024]]) await runVariant(nogl, 'nogl-', w, h, {}, [[1, 0], [2, 0.45], [3, 0.9]]);
await nogl.close();
fs.writeFileSync(path.join(OUT, 'log.txt'), log.join('\n'));
console.log(log.join('\n'));
