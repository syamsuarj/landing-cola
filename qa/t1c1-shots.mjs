// T1c-1: screenshot Kepemimpinan / Bisnis / Angka di 1280 & 375 + cek overflow-x, console error, no-JS, reduced-motion.
import { chromium } from 'playwright-core';
import fs from 'node:fs';
const BASE = process.env.BASE || 'http://127.0.0.1:3003/';
const OUT = new URL('./out-t1c1-shots/', import.meta.url).pathname;
fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
const report = {};
for (const [w, h] of [[1280, 800], [375, 812]]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const errs = [];
  page.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
  page.on('pageerror', (e) => errs.push(String(e)));
  await page.goto(BASE, { waitUntil: 'networkidle' });
  const total = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < total; y += 500) { await page.evaluate((y) => window.scrollTo(0, y), y); await page.waitForTimeout(60); }
  await page.waitForTimeout(800);
  const shot = async (name, sel, offset = 0) => {
    await page.evaluate(([s, o]) => { const el = document.querySelector(s); window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY + o); }, [sel, offset]);
    await page.waitForTimeout(1600);
    await page.screenshot({ path: `${OUT}${name}-${w}.png` });
  };
  await shot('kepemimpinan-a', '#kepemimpinan');
  await shot('kepemimpinan-b', '#kepemimpinan .kp-grid');
  await page.locator('#kepemimpinan').screenshot({ path: `${OUT}kepemimpinan-full-${w}.png` });
  await shot('bisnis-head', '#bisnis');
  await shot('bisnis-tbs', '#bisnis-tbs');
  await shot('bisnis-pkm', '#bisnis-pkm');
  await shot('bisnis-engineering', '#bisnis-engineering');
  await shot('bisnis-lab', '#bisnis-laboratorium-geoteknik');
  await shot('angka', '#angka', 40);
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${OUT}angka-${w}.png` });
  await page.locator('#angka').screenshot({ path: `${OUT}angka-full-${w}.png` });
  report[w] = await page.evaluate(() => ({
    overflowX: document.documentElement.scrollWidth - window.innerWidth,
    kpCount: document.querySelectorAll('#kepemimpinan .kp-card').length + document.querySelectorAll('#kepemimpinan .kp-lead-card').length,
    bsCount: document.querySelectorAll('#bisnis [data-bs-slide]').length,
    nums: [...document.querySelectorAll('#angka .ag-num')].map((e) => e.textContent),
    wide: [...document.querySelectorAll('#kepemimpinan, #bisnis, #angka, #bisnis *, #angka *')].filter((e) => e.getBoundingClientRect().right > window.innerWidth + 1 && getComputedStyle(e).position !== 'fixed').slice(0, 5).map((e) => e.className),
    hiddenFocusable: [...document.querySelectorAll('#bisnis a')].filter((a) => +getComputedStyle(a.closest('li')).opacity < 1).length,
  }));
  report[w].errors = errs;
  await ctx.close();
}
// no-JS & reduced-motion: angka langsung nilai akhir, slide tampil
for (const [label, opts] of [['nojs', { javaScriptEnabled: false }], ['reduced', { reducedMotion: 'reduce' }]]) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, ...opts });
  const page = await ctx.newPage();
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.querySelector('#angka').scrollIntoView());
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${OUT}angka-${label}-1280.png` });
  await page.evaluate(() => document.querySelector('#bisnis-cpo').scrollIntoView());
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${OUT}bisnis-cpo-${label}-1280.png` });
  report[label] = await page.evaluate(() => ({
    nums: [...document.querySelectorAll('#angka .ag-num')].map((e) => e.textContent),
    minOpacity: Math.min(...[...document.querySelectorAll('#kepemimpinan *, #bisnis *, #angka *')].map((e) => +getComputedStyle(e).opacity)),
    sticky: getComputedStyle(document.querySelector('.bs-slide')).position,
  }));
  await ctx.close();
}
await browser.close();
console.log(JSON.stringify(report, null, 1));
