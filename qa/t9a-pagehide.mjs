// T9a (Programmer A): T-5 — simulasi pagehide/pageshow (persisted) via PageTransitionEvent sintetis (dev :3000).
// Headless Chrome tidak me-restore bfcache (qa/t8a-bfcache.mjs → marker hilang), jadi jalur kode diuji langsung.
import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
const p = await (await b.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
const errs = []; p.on('pageerror', (e) => errs.push(e.message));
await p.goto(process.env.URL || 'http://localhost:3000/', { waitUntil: 'load' }); await p.mouse.move(40, 40);
await p.waitForFunction(() => window.__hero3d, null, { timeout: 15000 }); await p.waitForTimeout(800);
const st = () => p.evaluate(async () => { const f0 = window.__hero3d.stats.frames; await new Promise((r) => setTimeout(r, 600)); const art = document.getElementById('hero-art');
  return { is3d: art.classList.contains('is-3d'), canvas: !!art.querySelector('canvas'), framesAdv: window.__hero3d.stats.frames - f0, svgOpacity: getComputedStyle(art.querySelector('.fallback')).opacity, svgVis: getComputedStyle(art.querySelector('.fallback')).visibility }; });
const fire = (type, persisted) => p.evaluate(([t, ps]) => window.dispatchEvent(new PageTransitionEvent(t, { persisted: ps })), [type, persisted]);
console.log('awal               ', JSON.stringify(await st()));
await fire('pagehide', true); console.log('pagehide persisted ', JSON.stringify(await st()));
await fire('pageshow', true); console.log('pageshow persisted ', JSON.stringify(await st()));
await fire('pagehide', false); console.log('pagehide !persisted', JSON.stringify(await st()));
await fire('pageshow', true); console.log('pageshow stlh dispose', JSON.stringify(await st()));
console.log('errors', errs); await b.close();
