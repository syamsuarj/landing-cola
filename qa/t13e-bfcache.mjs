// QA T10 (QA-C) T-5: bfcache ASLI. Chrome diluncurkan manual (tanpa flag default Playwright yang mematikan bfcache),
// dihubungkan via CDP. MODE=headed|headless. Target preview :4420. Bukan kode produksi.
import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
const MODE = process.env.MODE || 'headed'; const PORT = 9333 + (MODE === 'headed' ? 0 : 1);
const dir = `${process.env.TMPDIR || '/tmp'}/t10c-bf-${MODE}-${Date.now()}`; fs.mkdirSync(dir, { recursive: true });
const args = [`--remote-debugging-port=${PORT}`, `--user-data-dir=${dir}`, '--no-first-run', '--no-default-browser-check', '--window-size=1280,860', 'about:blank'];
if (MODE !== 'headed') args.unshift('--headless=new');
const ch = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', args, { stdio: 'ignore' });
const kill = setTimeout(() => { ch.kill(); process.exit(2); }, 120000);
let b; for (let i = 0; i < 30; i++) { try { b = await chromium.connectOverCDP(`http://127.0.0.1:${PORT}`); break; } catch { await new Promise((r) => setTimeout(r, 300)); } }
const ctx = b.contexts()[0]; const p = ctx.pages()[0] || await ctx.newPage();
const errs = []; p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => m.type() === 'error' && errs.push(m.text().slice(0, 150)));
const cdp = await ctx.newCDPSession(p); await cdp.send('Page.enable'); const notUsed = [];
cdp.on('Page.backForwardCacheNotUsed', (e) => notUsed.push(e.notRestoredExplanations?.map((x) => x.reason)));

await p.goto('http://localhost:4420/', { waitUntil: 'load' }); await p.mouse.move(40, 40); await p.mouse.move(80, 90);
await p.waitForFunction(() => document.querySelector('#hero-art canvas'), null, { timeout: 20000 }).catch(() => {}); await p.waitForTimeout(1500);
const st = () => p.evaluate(async () => { const art = document.getElementById('hero-art'); const c = art.querySelector('canvas'); const f = art.querySelector('.fallback');
  // render berjalan? bandingkan 2 snapshot kanvas (preserveDrawingBuffer mungkin false → pakai pixel via drawImage)
  const snap = () => { try { const o = new OffscreenCanvas(64, 64); const x = o.getContext('2d'); x.drawImage(c, 0, 0, 64, 64); return x.getImageData(0, 0, 64, 64).data.reduce((a, v) => a + v, 0); } catch { return -1; } };
  const s0 = c ? snap() : null; await new Promise((r) => setTimeout(r, 700)); const s1 = c ? snap() : null;
  return { marker: window.__m === 1, persisted: window.__persisted ?? null, is3d: art.classList.contains('is-3d'), canvas: !!c, canvasConnected: !!c?.isConnected, canvasW: c?.width, svgOpacity: getComputedStyle(f).opacity, canvasOpacity: c ? getComputedStyle(c).opacity : null, snapChanged: s0 !== s1 && s0 !== -1 }; });
await p.evaluate(() => { window.__m = 1; addEventListener('pageshow', (e) => { window.__persisted = e.persisted; }); });
const before = await st();
await p.goto(process.env.NEXT||'http://localhost:4420/favicon-192.png'); await p.waitForTimeout(800); await p.goBack({ waitUntil: 'commit' }); await p.waitForTimeout(2500);
const after = await st(); await p.screenshot({ path: `qa/out-t13e/bfcache-${MODE}-after-back.png` });
await p.mouse.move(300, 300); await p.evaluate(() => scrollBy(0, 40)); await p.waitForTimeout(2000); const after2 = await st();
console.log(JSON.stringify({ MODE, before, after, after2, notUsed, errs: errs.slice(0, 5) }));
clearTimeout(kill); await b.close().catch(() => {}); ch.kill();
