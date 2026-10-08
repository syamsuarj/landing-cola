// T9a (Programmer A): T-2 — throttle pulih & kualitas low/high dievaluasi ulang saat resize lintas 760 (dev :3000, GPU).
import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
const p = await (await b.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
const errs = []; p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
await p.goto(process.env.URL || 'http://localhost:3000/', { waitUntil: 'load' }); await p.mouse.move(40, 40);
await p.waitForFunction(() => window.__hero3d, null, { timeout: 15000 });
const st = () => p.evaluate(() => { const h = window.__hero3d; const s = h.stats; return { q: s.quality, rebuilds: s.rebuilds, throttled: s.throttled, recovered: s.recovered, dpr: s.dpr, tri: s.triangles, geo: h.renderer.info.memory.geometries, tex: h.renderer.info.memory.textures, prog: h.renderer.info.programs.length }; });
const log = (k, v) => console.log(k.padEnd(28), JSON.stringify(v));
await p.waitForTimeout(1500); log('1280 awal', await st());
await p.evaluate(() => { window.__hero3d.stats.throttled = true; }); await p.waitForTimeout(500); log('paksa throttled', await st());
await p.waitForTimeout(5000); log('+5 s (harus pulih)', await st());
for (const w of [700, 1280, 500, 1280, 375]) { await p.setViewportSize({ width: w, height: 800 }); await p.waitForTimeout(3500); log(`resize ${w}`, await st()); }
const t0 = Date.now(); await p.setViewportSize({ width: 700, height: 800 }); await p.waitForTimeout(150); await p.setViewportSize({ width: 1280, height: 800 }); await p.waitForTimeout(3500); log('bolak-balik cepat 700↔1280', await st());
console.log('errors', errs.length, errs.slice(0, 3)); await b.close();
