// T9a probe (Programmer A): rect teks hero babak 1/2 + objek di beberapa viewport. node qa/t9a-probe.mjs [w x h ...]
import { chromium } from 'playwright-core';
const URL = process.env.URL || 'http://localhost:3000/';
const sizes = (process.argv.slice(2).length ? process.argv.slice(2) : ['768x1024', '820x1180', '900x1200', '1024x768', '1024x1366', '812x375', '1280x800', '375x812']).map((s) => s.split('x').map(Number));
const b = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
for (const [w, h] of sizes) {
  const ctx = await b.newContext({ viewport: { width: w, height: h } }); const p = await ctx.newPage();
  await p.goto(URL, { waitUntil: 'load' }); await p.mouse.move(40, 40);
  await p.waitForFunction(() => document.getElementById('hero-art')?.classList.contains('is-3d'), null, { timeout: 15000 }).catch(() => {});
  await p.waitForTimeout(600);
  const r = await p.evaluate(() => { const q = (s) => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); return [Math.round(r.x), Math.round(r.y), Math.round(r.right), Math.round(r.bottom)]; };
    return { h1: q('#judul-hero'), lead: q('.act-1 .lead'), ctas: q('.act-1 .ctas'), btn2: q('.act-1 .btn-ghost'), news: q('.act-1 .news'), obj: q('#hero-art'), canvas: q('#hero-art canvas'), a2: q('.act-2'), a2body: q('.act-2 .body'), tf: getComputedStyle(document.getElementById('hero-art')).transform, tr: getComputedStyle(document.getElementById('hero-art')).translate }; });
  console.log(`${w}x${h}`, JSON.stringify(r));
  await ctx.close();
}
await b.close();
