// QA V1 (T8c): anchor nav harus mendarat tepat (top section ≈ tinggi header ±10px) walau foto galeri
// lazy belum termuat (cache kosong). Bukan kode produksi.
//
// Pakai (dari root proyek, setelah `npm run build`):
//   node qa/v1-anchor-nav.mjs                 # sajikan dist/ dengan server statis in-process
//   node qa/v1-anchor-nav.mjs --url http://localhost:3000
// Exit 0 = semua PASS.
import { createRequire } from 'node:module';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const QA_DIR = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(path.join(QA_DIR, 'package.json'));
const { chromium } = require('playwright-core');
const CHROME = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const TOL = 10;

const argUrl = (() => { const i = process.argv.indexOf('--url'); return i > -1 ? process.argv[i + 1] : null; })();

// --- server statis dist/ (tanpa cache) ---
let server = null;
let base = argUrl;
if (!base) {
  const DIST = path.resolve(QA_DIR, '..', 'dist');
  if (!fs.existsSync(path.join(DIST, 'index.html'))) { console.error('dist/ belum ada — jalankan npm run build'); process.exit(2); }
  const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.avif': 'image/avif', '.jpg': 'image/jpeg', '.png': 'image/png', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.json': 'application/json', '.glb': 'model/gltf-binary' };
  server = http.createServer((req, res) => {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (p.endsWith('/')) p += 'index.html';
    const f = path.join(DIST, p);
    if (!f.startsWith(DIST) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream', 'cache-control': 'no-store' });
    fs.createReadStream(f).pipe(res);
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  base = `http://127.0.0.1:${server.address().port}/`;
}

const VIEWPORTS = [{ w: 1280, h: 800 }, { w: 375, h: 812 }];
// [label, selector link, id target]
const LINKS = [
  ['nav Sejarah', '#nav-utama a[href="#sejarah"]', 'sejarah'],
  ['nav Produk', '#nav-utama a[href="#produk"]', 'produk'],
  ['nav Indonesia', '#nav-utama a[href="#indonesia"]', 'indonesia'],
  ['nav FAQ', '#nav-utama a[href="#faq"]', 'faq'],
  ['nav Penutup/Mulai', '#nav-utama a[href="#cta"]', 'cta'],
  ['hero Lihat Produk', '#utama a.btn[href="#produk"], main a.btn[href="#produk"]', 'produk'],
  ['footer FAQ', 'footer a[href="#faq"]', 'faq'],
];

const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const rows = [];
let fails = 0;
for (const vp of VIEWPORTS) {
  for (const [label, sel, id] of LINKS) {
    // konteks baru per klik = cache kosong, foto galeri lazy belum termuat
    const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h } });
    const page = await ctx.newPage();
    await page.addInitScript(() => {
      window.__scrollToCalls = 0;
      const o = window.scrollTo.bind(window);
      window.scrollTo = (...a) => { window.__scrollToCalls++; return o(...a); };
    });
    await page.goto(base, { waitUntil: 'load' });
    await page.waitForTimeout(1500);
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await page.waitForTimeout(300);
    const galPending = await page.evaluate(() => [...document.querySelectorAll('#galeri img')].filter((i) => !i.complete).length);
    await page.evaluate(() => { window.__scrollToCalls = 0; });

    const isNav = sel.startsWith('#nav-utama');
    const menuBtn = page.locator('.menu-btn');
    if (isNav && await menuBtn.isVisible()) {
      await menuBtn.click();
      await page.waitForTimeout(400);
      await page.locator(sel).first().click();
    } else {
      // klik DOM (tanpa auto-scroll Playwright) agar scroll benar-benar dimulai dari atas
      await page.evaluate((s) => document.querySelector(s).click(), sel);
    }
    // tunggu scroll berhenti: scrollY stabil 800 ms (maks 10 dtk)
    let last = -1, stableSince = Date.now();
    const t0 = Date.now();
    while (Date.now() - t0 < 10000) {
      const y = await page.evaluate(() => Math.round(scrollY));
      if (y !== last) { last = y; stableSince = Date.now(); }
      else if (Date.now() - stableSince > 800) break;
      await page.waitForTimeout(100);
    }
    const m = await page.evaluate((id) => {
      const head = document.querySelector('.site-head') || document.querySelector('header');
      return {
        top: Math.round(document.getElementById(id).getBoundingClientRect().top),
        header: Math.round(head.getBoundingClientRect().height),
        y: Math.round(scrollY),
        galLoaded: [...document.querySelectorAll('#galeri img')].filter((i) => i.complete).length,
        scrollToCalls: window.__scrollToCalls,
      };
    }, id);
    const ok = Math.abs(m.top - m.header) <= TOL;
    if (!ok) fails++;
    rows.push({ vp: `${vp.w}x${vp.h}`, link: label, target: '#' + id, top: m.top, header: m.header, diff: m.top - m.header, y: m.y, galPendingAtClick: galPending, galLoadedAfter: m.galLoaded, scrollToCalls: m.scrollToCalls, result: ok ? 'PASS' : 'FAIL' });
    await ctx.close();
  }
}
await browser.close();
if (server) server.close();

console.log(`base: ${base}  toleransi: ±${TOL}px\n`);
console.log('viewport  | link               | target      |  top | header | diff |      y | gal pending@klik | gal loaded | scrollTo | hasil');
for (const r of rows) {
  console.log(`${r.vp.padEnd(9)} | ${r.link.padEnd(18)} | ${r.target.padEnd(11)} | ${String(r.top).padStart(4)} | ${String(r.header).padStart(6)} | ${String(r.diff).padStart(4)} | ${String(r.y).padStart(6)} | ${String(r.galPendingAtClick).padStart(16)} | ${String(r.galLoadedAfter).padStart(10)} | ${String(r.scrollToCalls).padStart(8)} | ${r.result}`);
}
console.log(`\n${rows.length - fails}/${rows.length} PASS`);
process.exit(fails ? 1 : 0);
