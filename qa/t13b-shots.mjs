#!/usr/bin/env node
// QA-F T13 visual (putaran 3). Bukan kode produksi. Usage: node qa/t13b-shots.mjs [main|orbit|land|alt]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
const QA = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(QA, 'out-t13b'); fs.mkdirSync(OUT, { recursive: true });
const MODE = process.argv[2] || 'main';
const URL = 'http://localhost:3000/';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BABAK = [[1, 0], [2, 0.45], [3, 0.9]];
const log = [];
const flush = () => fs.appendFileSync(path.join(OUT, `log-${MODE}.txt`), log.splice(0).join('\n') + '\n');
setTimeout(() => { console.error('timeout'); flush(); process.exit(2); }, 170e3).unref();
const GPU = ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'];

async function pin(page) {
  return page.evaluate(() => {
    const s = document.querySelector('[data-hero-scene]') || document.getElementById('beranda');
    const sp = s?.closest('.pin-spacer');
    const top = (sp || s).getBoundingClientRect().top + scrollY;
    return { start: top, end: top + (sp ? sp.offsetHeight - innerHeight : 0), heroBottom: (sp || s).getBoundingClientRect().bottom + scrollY };
  });
}
const geo = (page) => page.evaluate(() => { const c = (sel) => { const e = document.querySelector(sel); if (!e) return null; const b = e.getBoundingClientRect(); const cs = getComputedStyle(e); return [Math.round(b.x), Math.round(b.y), Math.round(b.width), Math.round(b.height), cs.display === 'none' || cs.visibility === 'hidden' ? 'hidden' : cs.opacity]; }; return { art: c('#hero-art'), obj: c('[data-hero-object]'), cv: c('#hero-art canvas'), fb: c('#hero-art .fallback, .fallback'), spot: c('[data-hero-backdrop] .spot'), floor: c('[data-hero-backdrop] .floor'), h1: c('#beranda h1, [data-hero-scene] h1') }; });

async function ctxPage(browser, w, h, extra = {}) {
  const mobile = w < 900 && h > w || w < 760;
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: extra.dpr || 1, isMobile: mobile, hasTouch: mobile, reducedMotion: extra.reducedMotion });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => log.push(`[${w}] pageerror ${e.message}`));
  await page.goto(URL, { waitUntil: 'load', timeout: 45e3 });
  const is3d = await page.waitForFunction(() => document.getElementById('hero-art')?.classList.contains('is-3d'), null, { timeout: 8e3 }).then(() => true, () => false);
  await page.waitForTimeout(800);
  return { ctx, page, is3d };
}
async function babaks(browser, tag, w, h, extra = {}, list = BABAK) {
  const { ctx, page, is3d } = await ctxPage(browser, w, h, extra);
  const p = await pin(page);
  for (const [n, f] of list) {
    await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), Math.round(p.start + f * (p.end - p.start)));
    await page.waitForTimeout(1600);
    const base = `${tag}${w}x${h}-b${n}`;
    await page.screenshot({ path: path.join(OUT, base + '.png') });
    log.push(`${base} is3d=${is3d} ${JSON.stringify(await geo(page))}`);
  }
  await ctx.close(); flush();
}
async function scrollSeq(browser, w, h, ys) {
  const { ctx, page, is3d } = await ctxPage(browser, w, h);
  const p = await pin(page);
  for (const y of ys) {
    const yy = y === 'end' ? Math.round(p.heroBottom - h * 0.6) : y;
    await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), yy);
    await page.waitForTimeout(1100);
    const base = `land-${w}x${h}-s${y}`;
    await page.screenshot({ path: path.join(OUT, base + '.png') });
    log.push(`${base} y=${yy} pin=${JSON.stringify(p)} is3d=${is3d} ${JSON.stringify(await geo(page))}`);
  }
  // full hero section
  await page.evaluate(() => window.scrollTo(0, 0)); await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(OUT, `land-${w}x${h}-full.png`), clip: { x: 0, y: 0, width: w, height: Math.min(p.heroBottom + h * 0.8, 3000) }, fullPage: true });
  await ctx.close(); flush();
}
async function orbit(browser, w, h) {
  const { ctx, page } = await ctxPage(browser, w, h);
  for (let i = 0; i < 6; i++) {
    const g = await geo(page);
    await page.screenshot({ path: path.join(OUT, `orbit-${w}-${i}.png`) });
    const cv = g.cv || g.art;
    if (cv) {
      const x = Math.max(0, cv[0] + cv[2] - 260);
      await page.screenshot({ path: path.join(OUT, `orbit-${w}-${i}-edgeR.png`), clip: { x, y: Math.max(0, cv[1]), width: Math.min(w - x, 300), height: Math.min(h - Math.max(0, cv[1]), cv[3]) } });
      // pixel scan: non-background brightness in last 6px columns of canvas
      const edge = await page.evaluate(() => { const c = document.querySelector('#hero-art canvas'); if (!c) return null; try { const t = document.createElement('canvas'); t.width = c.width; t.height = c.height; const x = t.getContext('2d'); x.drawImage(c, 0, 0); const cols = (x0) => { const d = x.getImageData(x0, 0, 4, c.height).data; let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 20) n++; return n; }; return { right: cols(c.width - 4), left: cols(0), top: (() => { const d = x.getImageData(0, 0, c.width, 3).data; let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 20) n++; return n; })(), bottom: (() => { const d = x.getImageData(0, c.height - 3, c.width, 3).data; let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 20) n++; return n; })() }; } catch (e) { return 'err ' + e.message; } });
      log.push(`orbit-${w}-${i} cv=${JSON.stringify(cv)} edgeAlphaPx=${JSON.stringify(edge)}`);
    }
    await page.waitForTimeout(1500);
  }
  await ctx.close(); flush();
}

if (MODE === 'main') {
  const b = await chromium.launch({ executablePath: CHROME, args: GPU });
  for (const [w, h] of [[1920, 1080], [1440, 900], [1280, 800], [768, 1024], [375, 812]]) await babaks(b, '', w, h);
  await b.close();
} else if (MODE === 'orbit') {
  const b = await chromium.launch({ executablePath: CHROME, args: GPU });
  await orbit(b, 1280, 800); await orbit(b, 1440, 900);
  await b.close();
} else if (MODE === 'land') {
  const b = await chromium.launch({ executablePath: CHROME, args: GPU });
  await scrollSeq(b, 812, 375, [0, 200, 400, 'end']);
  await scrollSeq(b, 667, 375, [0, 200, 400, 'end']);
  await b.close();
} else if (MODE === 'alt') {
  const b = await chromium.launch({ executablePath: CHROME, args: GPU });
  for (const [w, h] of [[1280, 800], [375, 812]]) await babaks(b, 'rm-', w, h, { reducedMotion: 'reduce' }, [[1, 0], [2, 0.45]]);
  await b.close();
  const n = await chromium.launch({ executablePath: CHROME, args: ['--disable-webgl', '--disable-3d-apis'] });
  for (const [w, h] of [[1280, 800], [375, 812]]) await babaks(n, 'nogl-', w, h, {}, [[1, 0], [2, 0.45]]);
  await n.close();
}
flush(); console.log('done', MODE);
