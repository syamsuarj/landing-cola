#!/usr/bin/env node
// QA harness T6 — coca-cola-landing.  Bukan kode produksi.
//
// Pakai (dari root proyek):
//   node qa/run.mjs                              # dev server http://localhost:3000 (cek 2,3,4,5,7)
//   node qa/run.mjs --url http://localhost:3000  # idem, URL eksplisit
//   node qa/run.mjs --prod                       # npm run build + astro preview :4399 + SEMUA cek (incl. Lighthouse)
//   node qa/run.mjs --selftest                   # uji harness pada qa/fixtures (sengaja rusak); exit 0 = detektor bekerja
// Opsi: --widths 375,768,1280  --out qa/out  --no-lighthouse  --lighthouse (paksa LH di mode dev)
//       --skip <cek,...>  (build,overflow,console,screenshots,variants,lighthouse,credits)
// Exit code: 0 bila tidak ada FAIL, 1 bila ada FAIL.
// Setup sekali: (cd qa && npm install)   — dependency hanya di qa/package.json.

import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const QA_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(QA_DIR, '..');

// ---------- argumen ----------
const argv = process.argv.slice(2);
const flag = (n) => argv.includes(`--${n}`);
const opt = (n, d) => { const i = argv.indexOf(`--${n}`); return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : d; };
const PROD = flag('prod');
const SELFTEST = flag('selftest'); // fixture sengaja rusak → overflow/console/variants WAJIB FAIL
const PREVIEW_PORT = Number(opt('port', 4399));
let BASE_URL = SELFTEST ? 'http://127.0.0.1:4398/' : PROD ? `http://127.0.0.1:${PREVIEW_PORT}/` : opt('url', 'http://localhost:3000/');
const WIDTHS = opt('widths', '375,768,1280').split(',').map(Number);
const OUT = path.resolve(ROOT, opt('out', SELFTEST ? 'qa/out-selftest' : 'qa/out'));
const SKIP = new Set(opt('skip', '').split(',').filter(Boolean));
if (SELFTEST) SKIP.add('credits');
const RUN_LH = !flag('no-lighthouse') && (PROD || flag('lighthouse')) && !SKIP.has('lighthouse');
const RUN_BUILD = (PROD || flag('build')) && !SKIP.has('build');
const CHROME_PATH = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const EXPECTED_IDS = ['utama|hero', 'sejarah', 'produk', 'botol', 'indonesia', 'fakta', 'keberlanjutan', 'galeri', 'kutipan', 'faq', 'cta', 'footer'];
// Ambang Lighthouse (skor 0-100). Ubah di sini bila PM menetapkan target lain.
const LH_THRESHOLDS = {
  mobile: { performance: 80, accessibility: 95, 'best-practices': 95, seo: 95 },
  desktop: { performance: 90, accessibility: 95, 'best-practices': 95, seo: 95 },
};
const VARIANT_WIDTHS = [375, 1280];

const t0 = Date.now();
const log = (...a) => console.log(`[qa +${((Date.now() - t0) / 1000).toFixed(1)}s]`, ...a);
const results = {}; // id -> {status, summary, details, ms}
const setResult = (id, status, summary, details = {}, ms = 0) => { results[id] = { status, summary, ms, details }; log(`${id}: ${status} — ${summary}`); };

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

// ---------- util proses ----------
function run(cmd, args, opts = {}) {
  return new Promise((resolve) => {
    const p = spawn(cmd, args, { cwd: ROOT, env: { ...process.env, ...opts.env }, shell: false });
    let out = '';
    p.stdout.on('data', (d) => (out += d));
    p.stderr.on('data', (d) => (out += d));
    const to = opts.timeout ? setTimeout(() => { p.kill('SIGKILL'); out += '\n[qa] TIMEOUT'; }, opts.timeout) : null;
    p.on('close', (code) => { if (to) clearTimeout(to); resolve({ code, out }); });
    p.on('error', (e) => { out += String(e); resolve({ code: -1, out }); });
  });
}
async function waitHttp(url, ms = 30000) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    try { const r = await fetch(url); if (r.status < 500) return true; } catch {}
    await new Promise((r) => setTimeout(r, 300));
  }
  return false;
}
let previewProc = null;
// Port 4399 bisa sedang dipakai agent/QA lain → jangan "menumpang" server orang lain; pilih port bebas.
async function freePort(preferred) {
  const net = await import('node:net');
  const tryPort = (p) => new Promise((res) => { const srv = net.createServer(); srv.once('error', () => res(null)); srv.listen(p, '127.0.0.1', () => { const got = srv.address().port; srv.close(() => res(got)); }); });
  return (await tryPort(preferred)) ?? (await tryPort(0));
}
let staticServer = null;
// Fallback: Astro 7 hanya mengizinkan 1 `astro preview` per proyek ("Another astro preview server is already running").
// Bila preview milik agent lain sudah jalan, harness TIDAK mematikannya; dist/ disajikan dengan server statis in-process.
async function startStaticDist(port) {
  const http = await import('node:http');
  const DIST = path.join(ROOT, 'dist');
  const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.avif': 'image/avif', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.woff': 'font/woff', '.json': 'application/json', '.txt': 'text/plain', '.xml': 'application/xml', '.glb': 'model/gltf-binary', '.hdr': 'application/octet-stream' };
  staticServer = http.createServer((q, r) => {
    let p = decodeURIComponent(new URL(q.url, 'http://x').pathname);
    let f = path.join(DIST, p);
    if (!f.startsWith(DIST)) { r.writeHead(403); return r.end(); }
    if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
    if (!fs.existsSync(f)) { const nf = path.join(DIST, '404.html'); r.writeHead(404, { 'content-type': MIME['.html'] }); return r.end(fs.existsSync(nf) ? fs.readFileSync(nf) : 'Not found'); }
    const ext = path.extname(f).toLowerCase();
    r.writeHead(200, { 'content-type': MIME[ext] || 'application/octet-stream', 'cache-control': p.startsWith('/_astro/') ? 'public, max-age=31536000, immutable' : 'no-cache' });
    fs.createReadStream(f).pipe(r);
  });
  await new Promise((res) => staticServer.listen(port, '127.0.0.1', res));
  log(`fallback: dist/ disajikan server statis QA di port ${port}`);
}
async function startPreview() {
  const port = await freePort(PREVIEW_PORT);
  if (port !== PREVIEW_PORT) log(`port ${PREVIEW_PORT} sedang dipakai proses lain → memakai port ${port}`);
  BASE_URL = `http://127.0.0.1:${port}/`;
  const plog = fs.openSync(path.join(OUT, 'preview.log'), 'w');
  previewProc = spawn('npx', ['astro', 'preview', '--port', String(port), '--host', '127.0.0.1'], { cwd: ROOT, detached: true, stdio: ['ignore', plog, plog] });
  log(`astro preview pid ${previewProc.pid} di port ${port}`);
  const end = Date.now() + 30000;
  while (Date.now() < end) {
    if (previewProc.exitCode !== null) break;
    try { const r = await fetch(BASE_URL); if (r.status < 500) { results.__server = 'astro preview'; return true; } } catch {}
    await new Promise((r) => setTimeout(r, 300));
  }
  const why = fs.readFileSync(path.join(OUT, 'preview.log'), 'utf8').split('\n').find((l) => l.trim()) || 'tidak merespons';
  log(`astro preview gagal (${why.trim()})`);
  stopPreview();
  await startStaticDist(port);
  results.__server = `server statis QA (astro preview gagal: ${why.trim()})`;
  return waitHttp(BASE_URL, 5000);
}
function stopPreview() {
  if (previewProc && previewProc.exitCode === null) {
    try { process.kill(-previewProc.pid, 'SIGTERM'); } catch { try { previewProc.kill('SIGTERM'); } catch {} }
    log(`preview (pid ${previewProc.pid}) dimatikan`);
  }
  previewProc = null;
  if (staticServer) { staticServer.closeAllConnections?.(); staticServer.close(); staticServer = null; }
}
process.on('SIGINT', () => { stopPreview(); process.exit(130); });
process.on('exit', stopPreview);
setTimeout(() => { console.error('[qa] GLOBAL TIMEOUT 25 menit — dihentikan'); stopPreview(); process.exit(3); }, 25 * 60e3).unref();

// ---------- (1) build ----------
async function checkBuild() {
  const s = Date.now();
  const r = await run('npm', ['run', 'build'], { timeout: 300000 });
  fs.writeFileSync(path.join(OUT, 'build.log'), r.out);
  const tail = r.out.trim().split('\n').slice(-15).join('\n');
  setResult('build', r.code === 0 ? 'PASS' : 'FAIL', r.code === 0 ? 'npm run build sukses' : `npm run build exit ${r.code} (lihat qa/out/build.log)`, { exitCode: r.code, tail }, Date.now() - s);
  return r.code === 0;
}

// ---------- kode yang dievaluasi di halaman ----------
const PAGE_OVERFLOW = `(() => {
  const iw = window.innerWidth;
  const de = document.documentElement, b = document.body;
  const sw = Math.max(de.scrollWidth, b ? b.scrollWidth : 0);
  const before = window.scrollX; window.scrollTo(99999, window.scrollY); const canScrollX = window.scrollX > 0; window.scrollTo(before, window.scrollY);
  const sel = (el) => { let s = el.tagName.toLowerCase(); if (el.id) s += '#' + el.id; else if (el.classList.length) s += '.' + [...el.classList].slice(0, 3).join('.'); const sec = el.closest('section,footer,header'); if (sec && sec !== el) s = (sec.id ? '#' + sec.id : sec.tagName.toLowerCase()) + ' ' + s; return s; };
  const off = [];
  for (const el of document.body.querySelectorAll('*')) {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.position === 'fixed') continue;
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    if (r.right <= iw + 1) continue; // hanya sisi kanan yang menambah scrollWidth (skip-link di left:-999 diabaikan)
    // terpotong oleh ancestor yang clip & masih di dalam viewport?
    let clipped = false;
    for (let a = el.parentElement; a && a !== document.body && a !== de; a = a.parentElement) {
      const ox = getComputedStyle(a).overflowX;
      if (ox !== 'visible') { const ar = a.getBoundingClientRect(); if (ar.right <= iw + 1 && ar.left >= -1) { clipped = true; break; } }
    }
    if (!clipped) off.push(el);
  }
  const set = new Set(off);
  const top = off.filter((el) => !set.has(el.parentElement)).slice(0, 15).map((el) => { const r = el.getBoundingClientRect(); return { sel: sel(el), left: Math.round(r.left), right: Math.round(r.right), width: Math.round(r.width) }; });
  return { innerWidth: iw, scrollWidth: sw, canScrollX, overflow: sw > iw || canScrollX, offenderCount: off.length, offenders: top };
})()`;

const PAGE_SECTIONS = `(() => [...document.querySelectorAll('section, footer')].filter((el) => !el.parentElement.closest('section, footer')).map((el, i) => {
  const lab = el.getAttribute('aria-labelledby');
  const id = el.id || (lab ? lab.replace(/^judul-/, '') : '') || (el.tagName.toLowerCase() === 'footer' ? 'footer' : 'section-' + i);
  return { id, realId: el.id || null, tag: el.tagName.toLowerCase(), index: i, h: Math.round(el.getBoundingClientRect().height) };
}))()`;

// Scroll bertahap atas→bawah; di tiap langkah catat elemen konten yang ada di viewport dan apakah terlihat
// (opacity efektif ≥ 0.1, visibility bukan hidden). "Tersembunyi" = pernah di viewport tapi TIDAK PERNAH terlihat.
// Dengan begitu fade-out yang di-scrub saat discroll lewat tidak dihitung sebagai bug.
async function scanVisibility(page, stepFrac = 0.5, waitMs = 350) {
  // Catatan: jeda dilakukan dari Node (page.waitForTimeout), bukan setTimeout di halaman —
  // timer halaman tidak berjalan saat javaScriptEnabled=false (varian no-js).
  await page.evaluate(() => {
    const cands = [];
    for (const el of document.body.querySelectorAll('*')) {
      if (el.closest('[aria-hidden="true"],script,style,noscript,template,.sr-only,astro-dev-toolbar')) continue;
      const ownText = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim().length > 1);
      const media = /^(IMG|VIDEO|SVG)$/i.test(el.tagName) && !el.parentElement.closest('svg');
      if (ownText || media) cands.push(el);
    }
    const st = cands.map(() => ({ seen: false, visible: false, minOp: 1 }));
    const effOpacity = (el) => { let o = 1; for (let a = el; a && a.nodeType === 1; a = a.parentElement) { const cs = getComputedStyle(a); if (cs.display === 'none') return -1; if (cs.visibility === 'hidden') return 0; o *= parseFloat(cs.opacity); } return o; };
    window.__qaScan = {
      probe() {
        const vh = window.innerHeight, vw = window.innerWidth;
        cands.forEach((el, i) => {
          if (st[i].visible) return;
          const r = el.getBoundingClientRect();
          if (r.width < 2 || r.height < 2 || r.bottom <= 0 || r.top >= vh || r.right <= 0 || r.left >= vw) return;
          const o = effOpacity(el);
          if (o < 0) return; // display:none (mis. isi <details> tertutup)
          st[i].seen = true; st[i].minOp = Math.min(st[i].minOp, o);
          if (o >= 0.1) st[i].visible = true;
        });
      },
      result() {
        const hidden = [];
        cands.forEach((el, i) => {
          if (!st[i].seen || st[i].visible) return;
          const sec = el.closest('section,footer,header');
          hidden.push({ sec: sec ? (sec.id || sec.getAttribute('aria-labelledby') || sec.tagName.toLowerCase()) : '-', tag: el.tagName.toLowerCase(), cls: [...el.classList].slice(0, 3).join('.'), text: (el.textContent || el.getAttribute('alt') || '').trim().replace(/\s+/g, ' ').slice(0, 60), opacity: Number(st[i].minOp.toFixed(2)) });
        });
        return { considered: st.filter((x) => x.seen).length, hiddenCount: hidden.length, samples: hidden.slice(0, 25) };
      },
    };
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(waitMs + 400);
  await page.evaluate(() => window.__qaScan.probe());
  let last = -1;
  for (let i = 0; i < 600; i++) {
    const { y, atEnd } = await page.evaluate((f) => { window.scrollBy(0, Math.max(100, Math.round(window.innerHeight * f))); return { y: window.scrollY, atEnd: window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2 }; }, stepFrac);
    await page.waitForTimeout(waitMs);
    await page.evaluate(() => window.__qaScan.probe());
    if (y === last && atEnd) break;
    last = y;
  }
  await page.waitForTimeout(1000);
  return page.evaluate(() => { window.__qaScan.probe(); return window.__qaScan.result(); });
}

function attachCollectors(page, bucket, label) {
  page.on('console', (m) => { const t = m.type(); if (t === 'error' || t === 'warning') bucket.push({ ctx: label, kind: t === 'warning' ? 'warn' : 'error', text: m.text().slice(0, 400), loc: m.location()?.url || '' }); });
  page.on('pageerror', (e) => bucket.push({ ctx: label, kind: 'pageerror', text: String(e.message || e).slice(0, 400) }));
  page.on('requestfailed', (r) => { const f = r.failure()?.errorText || ''; if (/ERR_ABORTED/.test(f) && /\/@vite|hmr|__astro/.test(r.url())) return; if (/ERR_ABORTED/.test(f) && r.resourceType() === 'document') { bucket.push({ ctx: label, kind: 'warn', text: `navigasi dokumen dibatalkan (kemungkinan HMR reload karena file berubah): ${r.url()}` }); return; } bucket.push({ ctx: label, kind: 'requestfailed', text: `${r.method()} ${r.url()} — ${f}` }); });
  page.on('response', (r) => { if (r.status() >= 400) bucket.push({ ctx: label, kind: 'http' + r.status(), text: r.url() }); });
}

async function gotoSettled(page) {
  await page.goto(BASE_URL, { waitUntil: 'load', timeout: 60000 });
  await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});
  await page.waitForTimeout(800);
}

// ---------- (2)(3)(4)(5) browser ----------
async function browserChecks() {
  const { chromium } = await import('playwright-core');
  const browser = await chromium.launch({ executablePath: CHROME_PATH, headless: true });
  const consoleBucket = [];
  const overflow = {}; const shots = {}; const variants = {}; let sectionsSeen = null;
  const sOverflow = Date.now();
  try {
    if (!SKIP.has('overflow') || !SKIP.has('screenshots') || !SKIP.has('console')) {
      for (const w of WIDTHS) {
        const ctx = await browser.newContext({ viewport: { width: w, height: w < 800 ? 812 : 900 }, deviceScaleFactor: 1 });
        const page = await ctx.newPage();
        attachCollectors(page, consoleBucket, `default@${w}`);
        try {
          await gotoSettled(page);
          const onLoad = await page.evaluate(PAGE_OVERFLOW);
          const hiddenAfterScroll = await scanVisibility(page);
          const afterScroll = await page.evaluate(PAGE_OVERFLOW);
          overflow[w] = { onLoad, afterScroll, hiddenAfterScroll: { hiddenCount: hiddenAfterScroll.hiddenCount, samples: hiddenAfterScroll.samples.slice(0, 10) } };
          if (!SKIP.has('screenshots')) {
            const secs = await page.evaluate(PAGE_SECTIONS);
            sectionsSeen = sectionsSeen || secs.map((s) => s.id);
            const dir = path.join(OUT, String(w)); fs.mkdirSync(dir, { recursive: true });
            shots[w] = [];
            const used = new Set();
            for (const s of secs) {
              let name = s.id.replace(/[^\w-]/g, '_'); while (used.has(name)) name += '_'; used.add(name);
              const loc = page.locator('section, footer').nth(s.index);
              const file = path.join(dir, `${name}.png`);
              try {
                await loc.scrollIntoViewIfNeeded({ timeout: 5000 });
                await page.waitForTimeout(500);
                await loc.screenshot({ path: file, timeout: 15000, animations: 'disabled' });
                shots[w].push({ id: s.id, file: path.relative(ROOT, file), height: s.h });
              } catch (e) { shots[w].push({ id: s.id, error: String(e.message).split('\n')[0] }); }
            }
          }
        } catch (e) { overflow[w] = { error: String(e.message).split('\n')[0] }; }
        await ctx.close();
      }
      if (!SKIP.has('overflow')) {
        const bad = Object.entries(overflow).filter(([, v]) => v.error || v.onLoad.overflow || v.afterScroll.overflow);
        const summary = Object.entries(overflow).map(([w, v]) => v.error ? `${w}: ERROR` : `${w}: load ${v.onLoad.scrollWidth}/${v.onLoad.innerWidth}${v.onLoad.overflow ? '✗' : '✓'}, scroll ${v.afterScroll.scrollWidth}/${v.afterScroll.innerWidth}${v.afterScroll.overflow ? '✗' : '✓'} (${v.afterScroll.offenderCount} el. keluar viewport)`).join('; ');
        setResult('overflow', bad.length ? 'FAIL' : 'PASS', summary, overflow, Date.now() - sOverflow);
      }
      if (!SKIP.has('screenshots')) {
        const errs = Object.values(shots).flat().filter((s) => s.error);
        const total = Object.values(shots).flat().length;
        const missing = EXPECTED_IDS.filter((e) => !(sectionsSeen || []).some((id) => e.split('|').includes(id)));
        const noRealId = []; // section tanpa atribut id asli
        setResult('screenshots', errs.length || !total ? 'FAIL' : (missing.length ? 'WARN' : 'PASS'),
          `${total - errs.length}/${total} screenshot tersimpan di ${path.relative(ROOT, OUT)}/<lebar>/; section di DOM: [${(sectionsSeen || []).join(', ')}]` + (missing.length ? `; id yang diharapkan tapi tidak ada: ${missing.join(', ')}` : ''),
          { sections: sectionsSeen, missingExpected: missing, shots, noRealId });
      }
    }

    // (5) varian
    if (!SKIP.has('variants')) {
      const sV = Date.now();
      const defs = {
        'reduced-motion': { ctx: { reducedMotion: 'reduce' } },
        'no-js': { ctx: { javaScriptEnabled: false } },
        'no-webgl': { ctx: {}, init: () => {
          const orig = HTMLCanvasElement.prototype.getContext;
          HTMLCanvasElement.prototype.getContext = function (t, ...r) { if (/webgl|experimental-webgl|webgpu/i.test(String(t))) return null; return orig.call(this, t, ...r); };
          try { Object.defineProperty(window, 'WebGLRenderingContext', { value: undefined }); Object.defineProperty(window, 'WebGL2RenderingContext', { value: undefined }); } catch {}
          try { Object.defineProperty(navigator, 'gpu', { value: undefined }); } catch {}
        } },
      };
      const vdir = path.join(OUT, 'variants'); fs.mkdirSync(vdir, { recursive: true });
      for (const [name, def] of Object.entries(defs)) {
        variants[name] = {};
        for (const w of VARIANT_WIDTHS) {
          const ctx = await browser.newContext({ viewport: { width: w, height: w < 800 ? 812 : 900 }, ...def.ctx });
          if (def.init) await ctx.addInitScript(def.init);
          const page = await ctx.newPage();
          const bucket = [];
          attachCollectors(page, bucket, `${name}@${w}`);
          try {
            await gotoSettled(page);
            // scanVisibility memakai page.evaluate (CDP) → tetap jalan walau JS halaman dimatikan
            const hidden = await scanVisibility(page);
            const ov = await page.evaluate(PAGE_OVERFLOW);
            const file = path.join(vdir, `${name}-${w}.png`);
            await page.evaluate(() => window.scrollTo(0, 0));
            await page.screenshot({ path: file, fullPage: true, timeout: 30000 }).catch(() => {});
            variants[name][w] = { hiddenCount: hidden.hiddenCount, considered: hidden.considered, hiddenSamples: hidden.samples, overflow: ov.overflow, overflowOffenders: ov.offenders.slice(0, 5), scrollWidth: ov.scrollWidth, errors: bucket.filter((b) => b.kind !== 'warn'), warnings: bucket.filter((b) => b.kind === 'warn').length, screenshot: path.relative(ROOT, file) };
          } catch (e) { variants[name][w] = { error: String(e.message).split('\n')[0] }; }
          consoleBucket.push(...bucket);
          await ctx.close();
        }
      }
      const rows = [];
      let fail = false;
      for (const [n, byW] of Object.entries(variants)) for (const [w, v] of Object.entries(byW)) {
        if (v.error) { fail = true; rows.push(`${n}@${w}: ERROR`); continue; }
        if (v.hiddenCount > 0 || v.errors.length || v.overflow) fail = true;
        rows.push(`${n}@${w}: ${v.hiddenCount} el. tak pernah terlihat, ${v.errors.length} error${v.overflow ? `, OVERFLOW-X ${v.scrollWidth}px` : ''}`);
      }
      setResult('variants', fail ? 'FAIL' : 'PASS', rows.join('; '), variants, Date.now() - sV);
    }

    // (3) console
    if (!SKIP.has('console')) {
      const errs = consoleBucket.filter((b) => b.kind !== 'warn');
      const warns = consoleBucket.filter((b) => b.kind === 'warn');
      const uniq = (arr) => { const m = new Map(); for (const b of arr) { const k = b.kind + '|' + b.text; if (!m.has(k)) m.set(k, { ...b, count: 0, contexts: [] }); const e = m.get(k); e.count++; if (e.contexts.length < 6) e.contexts.push(b.ctx); } return [...m.values()]; };
      const ue = uniq(errs), uw = uniq(warns);
      setResult('console', ue.length ? 'FAIL' : uw.length ? 'WARN' : 'PASS',
        `${ue.length} error unik (console error/pageerror/request gagal/HTTP>=400), ${uw.length} warning unik — semua lebar + varian`,
        { errors: ue, warnings: uw });
    }
  } finally {
    await browser.close();
  }
}

// ---------- (6) Lighthouse ----------
async function lighthouse() {
  const s = Date.now();
  const bin = path.join(QA_DIR, 'node_modules', '.bin', 'lighthouse');
  const out = {}; let fail = false; const rows = [];
  for (const formFactor of ['mobile', 'desktop']) {
    const json = path.join(OUT, `lighthouse-${formFactor}.json`);
    const args = [BASE_URL, '--output=json', '--output=html', `--output-path=${path.join(OUT, `lighthouse-${formFactor}`)}`, '--quiet',
      '--chrome-flags=--headless=new --no-first-run', '--only-categories=performance,accessibility,best-practices,seo'];
    if (formFactor === 'desktop') args.push('--preset=desktop');
    const r = await run(bin, args, { timeout: 240000, env: { CHROME_PATH } });
    const jf = path.join(OUT, `lighthouse-${formFactor}.report.json`);
    if (r.code !== 0 || !fs.existsSync(jf)) { fail = true; out[formFactor] = { error: r.out.slice(-800) }; rows.push(`${formFactor}: ERROR`); continue; }
    const lhr = JSON.parse(fs.readFileSync(jf, 'utf8'));
    const scores = Object.fromEntries(Object.entries(lhr.categories).map(([k, c]) => [k, Math.round((c.score ?? 0) * 100)]));
    const cc = lhr.audits['color-contrast'];
    const ccItems = (cc?.details?.items || []).map((i) => ({ selector: i.node?.selector, snippet: i.node?.snippet?.slice(0, 120), explanation: (i.node?.explanation || '').split('\n').slice(0, 2).join(' ').slice(0, 200) }));
    const failedA11y = Object.values(lhr.audits).filter((a) => a.score === 0 && lhr.categories.accessibility.auditRefs.some((r) => r.id === a.id)).map((a) => a.id);
    const below = Object.entries(LH_THRESHOLDS[formFactor]).filter(([k, t]) => (scores[k] ?? 0) < t).map(([k, t]) => `${k} ${scores[k]}<${t}`);
    if (below.length || (cc && cc.score === 0)) fail = true;
    out[formFactor] = { scores, thresholds: LH_THRESHOLDS[formFactor], belowThreshold: below, colorContrastPass: cc ? cc.score !== 0 : null, colorContrastFailures: ccItems, failedA11yAudits: failedA11y,
      metrics: { LCP: lhr.audits['largest-contentful-paint']?.displayValue, CLS: lhr.audits['cumulative-layout-shift']?.displayValue, TBT: lhr.audits['total-blocking-time']?.displayValue, FCP: lhr.audits['first-contentful-paint']?.displayValue },
      report: path.relative(ROOT, path.join(OUT, `lighthouse-${formFactor}.report.html`)) };
    rows.push(`${formFactor}: P${scores.performance} A${scores.accessibility} BP${scores['best-practices']} SEO${scores.seo}, color-contrast ${ccItems.length ? ccItems.length + ' gagal' : 'ok'}`);
  }
  setResult('lighthouse', fail ? 'FAIL' : 'PASS', rows.join('; '), out, Date.now() - s);
}

// ---------- (7) CREDITS ----------
function checkCredits() {
  const photosDir = path.join(ROOT, 'src/assets/photos');
  const files = fs.existsSync(photosDir) ? fs.readdirSync(photosDir).filter((f) => !f.startsWith('.') && /\.(jpe?g|png|webp|avif|gif|svg)$/i.test(f)) : [];
  const candidates = ['CREDITS.md', 'src/assets/photos/CREDITS.md', 'public/CREDITS.md'].map((p) => path.join(ROOT, p));
  const credits = candidates.find((p) => fs.existsSync(p));
  if (!credits) return setResult('credits', 'FAIL', `CREDITS.md tidak ditemukan (dicari: ${candidates.map((p) => path.relative(ROOT, p)).join(', ')}); ${files.length} foto tidak tercatat`, { photos: files, missingInCredits: files });
  const txt = fs.readFileSync(credits, 'utf8');
  const missingInCredits = files.filter((f) => !txt.includes(f));
  const mentioned = [...new Set([...txt.matchAll(/(?:^|[\s`|(\/])([A-Za-z0-9][\w.-]*\.(?:jpe?g|png|webp|avif|gif|svg))\b/gim)].map((m) => m[1]))];
  const orphanInCredits = mentioned.filter((m) => !files.includes(m));
  const ok = !missingInCredits.length && !orphanInCredits.length && files.length > 0;
  setResult('credits', ok ? 'PASS' : 'FAIL', `${files.length} foto, ${missingInCredits.length} tak tercatat di ${path.relative(ROOT, credits)}, ${orphanInCredits.length} entri CREDITS tanpa file`, { creditsFile: path.relative(ROOT, credits), photos: files, missingInCredits, orphanInCredits });
}

// ---------- (8) laporan ----------
function writeReport() {
  const order = ['build', 'overflow', 'console', 'screenshots', 'variants', 'lighthouse', 'credits'];
  const overall = Object.values(results).some((r) => r && r.status === 'FAIL') ? 'FAIL' : 'PASS';
  const report = { generatedAt: new Date().toISOString(), mode: PROD ? 'prod' : 'dev', url: BASE_URL, server: results.__server || (PROD ? null : 'dev server eksternal'), widths: WIDTHS, durationSec: +((Date.now() - t0) / 1000).toFixed(1), overall,
    checks: Object.fromEntries(order.map((k) => [k, results[k] || { status: 'SKIP', summary: skipReason(k) }])) };
  fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2));
  const L = [];
  L.push(`# QA report — ${report.mode} (${report.url})`, '', `Server: ${report.server || '-'}  `, `Dibuat: ${report.generatedAt} · Durasi: ${report.durationSec}s · **Overall: ${overall}**`, '');
  L.push('| Cek | Status | Ringkasan |', '|---|---|---|');
  for (const k of order) { const r = report.checks[k]; L.push(`| ${k} | **${r.status}** | ${String(r.summary).replace(/\|/g, '\\|')} |`); }
  const c = report.checks;
  if (c.build?.details?.tail && c.build.status === 'FAIL') L.push('', '## Build (tail)', '```', c.build.details.tail, '```');
  if (c.overflow?.details) {
    L.push('', '## Overflow — elemen pelanggar (setelah scroll)');
    for (const [w, v] of Object.entries(c.overflow.details)) {
      if (v.error) { L.push(`- **${w}px**: error ${v.error}`); continue; }
      L.push(`- **${w}px** load scrollWidth=${v.onLoad.scrollWidth} / scroll scrollWidth=${v.afterScroll.scrollWidth} (innerWidth ${v.afterScroll.innerWidth}, bisa scroll-x: ${v.afterScroll.canScrollX})`);
      for (const o of v.afterScroll.offenders.slice(0, 8)) L.push(`  - \`${o.sel}\` left ${o.left} right ${o.right} (w ${o.width})`);
      if (v.hiddenAfterScroll?.hiddenCount) { L.push(`  - ⚠ ${v.hiddenAfterScroll.hiddenCount} elemen konten tidak pernah terlihat selama scroll (mode normal):`); for (const h of v.hiddenAfterScroll.samples.slice(0, 5)) L.push(`    - ${h.sec} › ${h.tag}${h.cls ? '.' + h.cls : ''} "${h.text}"`); }
    }
  }
  if (c.console?.details) {
    L.push('', '## Console / jaringan');
    for (const e of c.console.details.errors.slice(0, 20)) L.push(`- [${e.kind}] ×${e.count} (${e.contexts.join(', ')}): ${e.text}`);
    for (const e of c.console.details.warnings.slice(0, 10)) L.push(`- [warn] ×${e.count}: ${e.text}`);
  }
  if (c.variants?.details) {
    L.push('', '## Varian (reduced-motion / no-js / no-webgl)');
    for (const [n, byW] of Object.entries(c.variants.details)) for (const [w, v] of Object.entries(byW)) {
      if (v.error) { L.push(`- ${n}@${w}: ERROR ${v.error}`); continue; }
      L.push(`- **${n}@${w}**: ${v.hiddenCount}/${v.considered} elemen konten tak pernah terlihat, ${v.errors.length} error, overflow ${v.overflow} — \`${v.screenshot}\``);
      for (const o of v.overflowOffenders || []) L.push(`  - overflow: \`${o.sel}\` right ${o.right} (w ${o.width})`);
      for (const h of v.hiddenSamples.slice(0, 5)) L.push(`  - ${h.sec} › ${h.tag}${h.cls ? '.' + h.cls : ''} "${h.text}"`);
    }
  }
  if (c.lighthouse?.details) {
    L.push('', '## Lighthouse');
    for (const [ff, v] of Object.entries(c.lighthouse.details)) {
      if (v.error) { L.push(`- ${ff}: ERROR`); continue; }
      L.push(`- **${ff}**: ${JSON.stringify(v.scores)} metrik ${JSON.stringify(v.metrics)} — \`${v.report}\``);
      if (v.belowThreshold.length) L.push(`  - di bawah ambang: ${v.belowThreshold.join(', ')}`);
      if (v.failedA11yAudits.length) L.push(`  - audit a11y gagal: ${v.failedA11yAudits.join(', ')}`);
      const ccMap = new Map();
      for (const i of v.colorContrastFailures) { const m = /contrast of ([\d.]+) \(foreground color: (#\w+), background color: (#\w+)/.exec(i.explanation || ''); const k = `${i.selector} — ${m ? `rasio ${m[1]} (${m[2]} di ${m[3]})` : i.explanation}`; ccMap.set(k, (ccMap.get(k) || 0) + 1); }
      if (ccMap.size) L.push(`  - color-contrast gagal: ${v.colorContrastFailures.length} node (${ccMap.size} pola unik):`);
      for (const [k, n] of [...ccMap].slice(0, 15)) L.push(`    - ×${n} \`${k.split(' — ')[0]}\` ${k.split(' — ')[1]}`);
    }
  }
  if (c.credits?.details) {
    const d = c.credits.details;
    L.push('', '## CREDITS', `- Foto tidak tercatat: ${d.missingInCredits?.join(', ') || '-'}`, `- Entri CREDITS tanpa file: ${d.orphanInCredits?.join(', ') || '-'}`);
  }
  if (c.screenshots?.details?.shots) L.push('', '## Screenshot', ...Object.entries(c.screenshots.details.shots).map(([w, s]) => `- ${w}px: ${s.length} file → ${path.relative(ROOT, OUT)}/${w}/ (${s.map((x) => x.id + (x.error ? '✗' : '')).join(', ')})`));
  fs.writeFileSync(path.join(OUT, 'report.md'), L.join('\n') + '\n');
  return report;
}
function skipReason(k) {
  if (k === 'build') return 'hanya dengan --prod / --build';
  if (k === 'lighthouse') return 'hanya dengan --prod (atau --lighthouse)';
  return SKIP.has(k) ? 'di-skip via --skip' : 'tidak dijalankan (lihat cek lain)';
}

// ---------- main ----------
(async () => {
  log(`mode=${PROD ? 'prod' : 'dev'} url=${BASE_URL} widths=${WIDTHS.join(',')} out=${path.relative(ROOT, OUT)}`);
  if (!fs.existsSync(path.join(QA_DIR, 'node_modules', 'playwright-core'))) { console.error('Jalankan dulu: (cd qa && npm install)'); process.exit(2); }
  let fixtureServer = null;
  if (SELFTEST) {
    const http = await import('node:http');
    const html = fs.readFileSync(path.join(QA_DIR, 'fixtures', 'index.html'));
    fixtureServer = http.createServer((q, r) => { if (q.url === '/' || q.url.startsWith('/?')) { r.writeHead(200, { 'content-type': 'text/html' }); r.end(html); } else { r.writeHead(404); r.end(); } });
    await new Promise((res) => fixtureServer.listen(4398, '127.0.0.1', res));
  }
  if (!SKIP.has('credits')) checkCredits();
  let serverOk = true;
  if (RUN_BUILD) {
    const ok = await checkBuild();
    if (PROD) {
      if (!ok) { serverOk = false; for (const k of ['overflow', 'console', 'screenshots', 'variants', 'lighthouse']) results[k] = { status: 'SKIP', summary: 'build gagal — preview prod tidak dijalankan' }; }
      else {
        serverOk = await startPreview();
      }
    }
  } else if (PROD) { // --prod --skip build: pakai dist/ yang ada
    serverOk = await startPreview();
  } else serverOk = await waitHttp(BASE_URL, 10000);
  if (serverOk === false && !results.overflow) for (const k of ['overflow', 'console', 'screenshots', 'variants', ...(RUN_LH ? ['lighthouse'] : [])].filter((k) => !SKIP.has(k))) results[k] = { status: 'FAIL', summary: `server ${BASE_URL} tidak merespons` };
  if (serverOk) {
    try { await browserChecks(); } catch (e) { setResult('browser', 'FAIL', 'harness error: ' + e.message); }
    if (RUN_LH) { try { await lighthouse(); } catch (e) { setResult('lighthouse', 'FAIL', 'harness error: ' + e.message); } }
  }
  stopPreview();
  if (fixtureServer) fixtureServer.close();
  const rep = writeReport();
  log(`SELESAI ${rep.overall} dalam ${rep.durationSec}s → ${path.relative(ROOT, path.join(OUT, 'report.md'))}`);
  for (const [k, v] of Object.entries(rep.checks)) console.log(`  ${v.status.padEnd(4)}  ${k.padEnd(11)} ${v.summary}`);
  if (SELFTEST) {
    const must = ['overflow', 'console', 'variants'];
    const ok = must.every((k) => rep.checks[k].status === 'FAIL') && rep.checks.screenshots.status !== 'FAIL';
    console.log(ok ? 'SELFTEST OK — detektor menangkap semua kerusakan yang disengaja' : 'SELFTEST GAGAL — ada detektor yang tidak menangkap kerusakan fixture');
    process.exit(ok ? 0 : 1);
  }
  process.exit(rep.overall === 'FAIL' ? 1 : 0);
})();
