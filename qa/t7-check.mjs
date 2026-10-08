#!/usr/bin/env node
// QA T7/T8 — harness objek 3D hero (diorama kebun sawit). Bukan kode produksi.
// Pakai (dari root proyek):
//   node qa/t7-check.mjs [URL]                 # default http://localhost:3000 — cek browser (~60-90 s)
//   node qa/t7-check.mjs [URL] --lh            # + Lighthouse mobile pada build preview :4420 (build+preview dimatikan otomatis)
//   node qa/t7-check.mjs --lh --only lh        # hanya Lighthouse (build → astro preview :4420 → LH → kill)
//   node qa/t7-check.mjs --preview             # semua cek browser terhadap build preview :4420 (tanpa hook __hero3d)
// Opsi: --out qa/out-t7 · --widths 1280,375 · --skip-build (pakai dist/ yang ada) · --max-calls 60 · --lh-min 90
// Exit 0 bila tidak ada FAIL.
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const QA_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(QA_DIR, '..');
const CHROME_PATH = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const argv = process.argv.slice(2);
const flag = (n) => argv.includes(n);
const opt = (n, d) => { const i = argv.indexOf(n); return i >= 0 && argv[i + 1] ? argv[i + 1] : d; };
const optNames = new Set(['--out', '--widths', '--only', '--max-calls', '--lh-min']);
const positional = argv.filter((a, i) => !a.startsWith('--') && !optNames.has(argv[i - 1]));
const PORT = 4420;
const PREVIEW_URL = `http://localhost:${PORT}/`;
const USE_PREVIEW = flag('--preview');
let URL = positional[0] || (USE_PREVIEW ? PREVIEW_URL : 'http://localhost:3000/');
const OUT = path.resolve(ROOT, opt('--out', 'qa/out-t7'));
const WIDTHS = opt('--widths', '1280,375').split(',').map(Number);
const ONLY = opt('--only', '');
const RUN_BROWSER = ONLY !== 'lh';
const RUN_LH = flag('--lh') || ONLY === 'lh';
const MAX_CALLS = +opt('--max-calls', 60);
const LH_MIN = +opt('--lh-min', 90);
const BABAK = [[1, 0], [2, 0.45], [3, 0.9]]; // [babak, fraksi panjang pin]
fs.mkdirSync(OUT, { recursive: true });

const checks = {}; // id -> {status, summary, data}
const set = (id, status, summary, data) => { checks[id] = { status, summary, data }; console.log(`[${status}] ${id}: ${summary}`); };
const errors = []; const warnings = [];
const children = [];
const killAll = () => { for (const c of children) { try { process.kill(-c.pid, 'SIGTERM'); } catch {} } };
process.on('SIGINT', () => { killAll(); process.exit(130); });
const globalTimer = setTimeout(() => { console.error('global timeout 6 mnt'); killAll(); process.exit(2); }, 6 * 60e3); globalTimer.unref();

function run(cmd, args, { timeout = 240e3, env = {}, detached = false } = {}) {
  return new Promise((res) => {
    const c = spawn(cmd, args, { cwd: ROOT, env: { ...process.env, ...env }, detached });
    let out = ''; c.stdout.on('data', (d) => (out += d)); c.stderr.on('data', (d) => (out += d));
    const t = setTimeout(() => { try { process.kill(detached ? -c.pid : c.pid, 'SIGKILL'); } catch {} }, timeout);
    c.on('close', (code) => { clearTimeout(t); res({ code, out }); });
  });
}
async function portUp(url, ms) {
  const end = Date.now() + ms;
  while (Date.now() < end) { try { const r = await fetch(url); if (r.ok) return true; } catch {} await new Promise((r) => setTimeout(r, 400)); }
  return false;
}
async function startPreview() {
  if (await portUp(PREVIEW_URL, 500)) throw new Error(`port ${PORT} sudah dipakai proses lain — tidak dimatikan`);
  if (!flag('--skip-build')) {
    const b = await run('npm', ['run', 'build'], { timeout: 150e3 });
    fs.writeFileSync(path.join(OUT, 'build.log'), b.out);
    if (b.code !== 0) throw new Error('npm run build gagal (lihat build.log)');
  }
  const c = spawn('npx', ['astro', 'preview', '--port', String(PORT), '--host', '127.0.0.1'], { cwd: ROOT, detached: true, stdio: ['ignore', 'pipe', 'pipe'] });
  let log = ''; c.stdout.on('data', (d) => (log += d)); c.stderr.on('data', (d) => (log += d));
  children.push(c);
  if (!(await portUp(PREVIEW_URL, 30e3))) { killAll(); throw new Error('astro preview tidak naik: ' + log.slice(-400)); }
  return c;
}

// ---------- util piksel (decode/diff di halaman about:blank terpisah) ----------
let diffPage;
async function pixelDiff(bufA, bufB, rects = []) {
  return diffPage.evaluate(async ({ a, b, rects }) => {
    const load = async (s) => createImageBitmap(await (await fetch('data:image/png;base64,' + s)).blob());
    const [ia, ib] = await Promise.all([load(a), load(b)]);
    const w = Math.min(ia.width, ib.width), h = Math.min(ia.height, ib.height);
    const get = (img) => { const c = new OffscreenCanvas(w, h); const x = c.getContext('2d'); x.drawImage(img, 0, 0); return x.getImageData(0, 0, w, h).data; };
    const da = get(ia), db = get(ib);
    let n = 0, minX = w, minY = h, maxX = -1, maxY = -1; const inRect = rects.map(() => 0);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      if (Math.abs(da[i] - db[i]) + Math.abs(da[i + 1] - db[i + 1]) + Math.abs(da[i + 2] - db[i + 2]) > 30) {
        n++; if (x < minX) minX = x; if (y < minY) minY = y; if (x > maxX) maxX = x; if (y > maxY) maxY = y;
        rects.forEach((r, k) => { if (x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h) inRect[k]++; });
      }
    }
    return { w, h, changed: n, ratio: n / (w * h), bbox: maxX < 0 ? null : { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 }, inRect };
  }, { a: bufA.toString('base64'), b: bufB.toString('base64'), rects });
}

// page.evaluate tahan HMR reload dev server (konteks hancur → tunggu load lalu ulang, maks 3×)
async function ev(page, fn, arg) {
  for (let i = 0; ; i++) {
    try { return await page.evaluate(fn, arg); } catch (e) {
      if (i >= 3 || !/context was destroyed|navigation|Target closed/i.test(e.message)) throw e;
      warnings.push(`[harness] evaluate diulang setelah navigasi (HMR?): ${e.message.slice(0, 80)}`);
      await page.waitForLoadState('load').catch(() => {}); await page.waitForTimeout(1500);
    }
  }
}
const r0 = (r) => r && ({ x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.w ?? r.width), h: Math.round(r.h ?? r.height) });
function attach(page, tag) {
  page.on('console', (m) => {
    const t = m.type(); const txt = m.text();
    if (t === 'error') errors.push(`[${tag}] console.error: ${txt}`);
    else if (t === 'warning') warnings.push(`[${tag}] console.warn${/GL Driver Message|KHR_parallel_shader_compile/.test(txt) ? ' (noise GPU headless)' : ''}: ${txt}`);
  });
  page.on('pageerror', (e) => errors.push(`[${tag}] pageerror: ${e.message}`));
  page.on('requestfailed', (r) => {
    const f = r.failure()?.errorText || '';
    // HMR/navigasi dibatalkan saat dev server reload → warning
    (/ERR_ABORTED/.test(f) ? warnings : errors).push(`[${tag}] requestfailed ${f}: ${r.url()}`);
  });
  page.on('response', (r) => { if (r.status() >= 400) errors.push(`[${tag}] HTTP ${r.status()}: ${r.url()}`); });
}
async function newPage(browser, w, extra = {}) {
  const mobile = w < 760;
  const ctx = await browser.newContext({ viewport: { width: w, height: mobile ? 812 : 800 }, deviceScaleFactor: 1, isMobile: mobile, hasTouch: mobile, ...extra });
  const page = await ctx.newPage();
  return { ctx, page };
}
async function gotoHero(page) {
  await page.goto(URL, { waitUntil: 'load', timeout: 45e3 });
  await ev(page, () => window.scrollTo({ top: 0, behavior: 'instant' }));
  // init 3D bertahap (requestIdleCallback + compileAsync) → tunggu is-3d s.d. 10 s
  const is3d = await page.waitForFunction(() => document.getElementById('hero-art')?.classList.contains('is-3d'), null, { timeout: 10e3 }).then(() => true, () => false);
  await page.waitForTimeout(800);
  return is3d;
}
async function pinInfo(page) {
  return ev(page, () => {
    const scene = document.querySelector('[data-hero-scene]') || document.getElementById('beranda');
    const sp = scene?.closest('.pin-spacer');
    const st = (window.ScrollTrigger?.getAll?.() || []).find((t) => t.pin === scene || t.trigger === scene);
    if (st) return { src: 'ScrollTrigger', start: st.start, end: st.end };
    if (sp) { const top = sp.getBoundingClientRect().top + scrollY; return { src: '.pin-spacer', start: top, end: top + sp.offsetHeight - innerHeight }; }
    const top = scene ? scene.getBoundingClientRect().top + scrollY : 0;
    return { src: 'fallback(scene height)', start: top, end: top + Math.max(0, (scene?.offsetHeight || innerHeight) - innerHeight), pinned: false };
  });
}
async function hero3dInfo(page) {
  return ev(page, async () => {
    const h = window.__hero3d;
    if (!h) return { hook: false };
    const r = h.renderer;
    if (!r?.info) return { hook: true, shape: Object.keys(h), note: 'window.__hero3d ada tetapi tanpa renderer (hook belum sesuai kontrak T7)', stats: JSON.parse(JSON.stringify(h)) };
    for (let i = 0; i < 8; i++) await new Promise((res) => requestAnimationFrame(res)); // beberapa frame
    const i = r.info;
    let meshes = 0, instanced = 0, objs = 0;
    h.scene?.traverse?.((o) => { objs++; if (o.isMesh || o.isPoints || o.isLine) { meshes++; if (o.isInstancedMesh) instanced++; } });
    return { hook: true, calls: i.render.calls, triangles: i.render.triangles, points: i.render.points, frame: i.render.frame, geometries: i.memory.geometries, textures: i.memory.textures, programs: i.programs?.length, autoReset: i.autoReset, sceneObjects: objs, meshes, instanced, pixelRatio: r.getPixelRatio?.(), camera: h.camera ? h.camera.position.toArray().map((v) => +v.toFixed(3)) : null };
  });
}
async function layout(page) {
  return ev(page, () => {
    const vis = (el) => { let e = el; let o = 1; while (e && e.nodeType === 1) { const cs = getComputedStyle(e); if (cs.display === 'none' || cs.visibility === 'hidden') return 0; o *= +cs.opacity; e = e.parentElement; } return o; };
    const R = (el) => { const r = el.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; };
    const art = document.getElementById('hero-art');
    const canvas = art?.querySelector('canvas');
    const scene = document.querySelector('[data-hero-scene]') || document.getElementById('beranda');
    const texts = [...(scene?.querySelectorAll('h1, h2, p') || [])].filter((el) => !art?.contains(el))
      .map((el) => {
        // kotak glyph nyata per baris (Range.getClientRects), bukan kotak blok elemen yang bisa selebar kolom
        const rg = document.createRange(); rg.selectNodeContents(el);
        const lines = [...rg.getClientRects()].filter((r) => r.width > 1 && r.height > 1).map((r) => ({ x: r.x, y: r.y, w: r.width, h: r.height }));
        let rect = R(el);
        if (lines.length) { const x = Math.min(...lines.map((l) => l.x)), y = Math.min(...lines.map((l) => l.y)); rect = { x, y, w: Math.max(...lines.map((l) => l.x + l.w)) - x, h: Math.max(...lines.map((l) => l.y + l.h)) - y }; }
        return { sel: el.tagName.toLowerCase() + (el.id ? '#' + el.id : el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/)[0] : ''), text: el.textContent.trim().slice(0, 40), rect, lines: lines.length ? lines : [rect], opacity: +vis(el).toFixed(2) };
      })
      .filter((t) => t.opacity > 0.1 && t.rect.w > 0 && t.rect.h > 0 && t.rect.y < innerHeight && t.rect.y + t.rect.h > 0);
    return { is3d: !!art?.classList.contains('is-3d'), art: art && R(art), canvas: canvas && R(canvas), canvasVisible: canvas ? vis(canvas) > 0.1 : false, texts, vw: innerWidth, vh: innerHeight, scrollY };
  });
}
const clipToVp = (r, vw, vh) => { const x = Math.max(0, Math.floor(r.x)), y = Math.max(0, Math.floor(r.y)); const w = Math.min(vw, Math.ceil(r.x + r.w)) - x, h = Math.min(vh, Math.ceil(r.y + r.h)) - y; return w > 1 && h > 1 ? { x, y, width: w, height: h } : null; };

async function mainRuns(browser) {
  const per = {}; let maxCalls = null; const overlapRows = []; let overlapFail = false; const visRows = []; let visFail = false; let shotFail = false;
  for (const w of WIDTHS) {
    const { ctx, page } = await newPage(browser, w); attach(page, `${w}`);
    const is3d = await gotoHero(page);
    const pin = await pinInfo(page);
    const len = Math.max(0, pin.end - pin.start);
    per[w] = { is3dAfterLoad: is3d, pin, babak: {} };
    for (const [n, f] of BABAK) {
      const y = Math.round(pin.start + f * len);
      await ev(page, (y) => window.scrollTo({ top: y, behavior: 'instant' }), y);
      await page.waitForTimeout(1800); // scrub 0.6 + lerp kamera
      const shot = path.join(OUT, `${w}-b${n}.png`);
      try { await page.screenshot({ path: shot }); } catch (e) { shotFail = true; }
      const L = await layout(page);
      const rec = { scrollY: L.scrollY, targetY: y, is3d: L.is3d, artRect: r0(L.art), canvasRect: r0(L.canvas), texts: L.texts.map((t) => ({ sel: t.sel, text: t.text, opacity: t.opacity, rect: r0(t.rect), lines: t.lines.length })) };
      // crop #hero-art
      const artClip = L.art && clipToVp(L.art, L.vw, L.vh);
      if (artClip) { try { await page.screenshot({ path: path.join(OUT, `${w}-b${n}-art.png`), clip: artClip }); } catch { shotFail = true; } }
      // konten kanvas nyata: diff kanvas tampil vs disembunyikan (di area kanvas ∩ viewport)
      if (L.is3d && L.canvas && L.canvasVisible) {
        const clip = clipToVp(L.canvas, L.vw, L.vh);
        if (clip) {
          const a = await page.screenshot({ clip });
          await ev(page, () => { document.querySelector('#hero-art canvas').style.visibility = 'hidden'; });
          const b = await page.screenshot({ clip });
          await ev(page, () => { document.querySelector('#hero-art canvas').style.visibility = ''; });
          const owner = []; const rel = [];
          L.texts.forEach((t, k) => t.lines.forEach((l) => { owner.push(k); rel.push({ x: Math.round(l.x - clip.x), y: Math.round(l.y - clip.y), w: Math.round(l.w), h: Math.round(l.h) }); }));
          const d0 = await pixelDiff(a, b, rel);
          const d = { ...d0, inRect: L.texts.map((_, k) => d0.inRect.reduce((s, v, j) => s + (owner[j] === k ? v : 0), 0)) };
          const area = L.texts.map((t) => t.lines.reduce((s, l) => s + l.w * l.h, 0));
          rec.contentRect = d.bbox ? { x: d.bbox.x + clip.x, y: d.bbox.y + clip.y, w: d.bbox.w, h: d.bbox.h } : null;
          rec.contentPixels = d.changed;
          rec.overlap = L.texts.map((t, k) => ({ sel: t.sel, text: t.text, pixels: d.inRect[k], pctOfText: +(100 * d.inRect[k] / Math.max(1, area[k])).toFixed(2) })).filter((o) => o.pixels > 0);
          // kanvas terpotong tepi viewport / tepi kanvas? (AC8)
          if (rec.contentRect) {
            const c = rec.contentRect;
            rec.touchesEdge = { left: c.x <= clip.x + 1, top: c.y <= clip.y + 1, right: c.x + c.w >= clip.x + clip.width - 1, bottom: c.y + c.h >= clip.y + clip.height - 1 };
          }
          for (const o of rec.overlap) { if (o.pctOfText > 2) overlapFail = true; }
          overlapRows.push(`${w}-b${n}: konten ${rec.contentRect ? `${rec.contentRect.x},${rec.contentRect.y} ${rec.contentRect.w}×${rec.contentRect.h}` : '—'}; overlap teks: ${rec.overlap.length ? rec.overlap.map((o) => `${o.sel} ${o.pctOfText}%`).join(', ') : 'tidak ada'}`);
        }
      } else overlapRows.push(`${w}-b${n}: kanvas tidak tampil (is3d=${L.is3d}) — hanya rect: art ${JSON.stringify(rec.artRect)}`);
      const h3 = await hero3dInfo(page);
      rec.hero3d = h3;
      if (h3.calls != null) maxCalls = Math.max(maxCalls ?? 0, h3.calls);
      per[w].babak[n] = rec;
    }
    if (!per[w].babak[1].is3d) visFail = true;
    visRows.push(`${w}: is-3d=${per[w].babak[1].is3d}, kanvas ${JSON.stringify(per[w].babak[1].canvasRect)}, pin ${pin.src} ${Math.round(pin.start)}→${Math.round(pin.end)}`);
    await ctx.close();
  }
  set('screenshots', shotFail ? 'FAIL' : 'PASS', `${WIDTHS.length * 3} screenshot babak + crop #hero-art → ${path.relative(ROOT, OUT)}/<vw>-b<n>[-art].png`, null);
  set('canvas-visible', visFail ? 'FAIL' : 'PASS', visRows.join('; '), null);
  set('overlap-text', overlapFail ? 'FAIL' : 'PASS', overlapRows.join(' | ') + ' (FAIL bila piksel objek >2% area kotak-baris teks yang terlihat)', null);
  const hooks = Object.values(per).flatMap((p) => Object.values(p.babak).map((b) => b.hero3d));
  if (maxCalls == null) {
    const h = hooks.find((x) => x?.hook);
    set('draw-calls', 'SKIP', h ? `window.__hero3d ada tapi tanpa renderer (kunci: ${h.shape?.join(',')}) — hook DEV {renderer,scene,camera} belum terpasang` : 'window.__hero3d tidak ada (bukan DEV / hook belum ada)', hooks);
  } else {
    const rows = Object.entries(per).map(([w, p]) => `${w}: ` + Object.entries(p.babak).map(([n, b]) => `b${n} calls=${b.hero3d.calls} tri=${b.hero3d.triangles}`).join(', '));
    set('draw-calls', maxCalls > MAX_CALLS ? 'FAIL' : 'PASS', `maks calls=${maxCalls} (batas ${MAX_CALLS}); ${rows.join('; ')}`, null);
  }
  return per;
}

async function variants(chromium) {
  const out = {};
  // --- no-WebGL ---
  const b = await chromium.launch({ executablePath: CHROME_PATH, headless: true, args: ['--disable-webgl', '--disable-3d-apis'] });
  let fail = false; const rows = [];
  try {
    for (const w of WIDTHS) {
      const { ctx, page } = await newPage(b, w); attach(page, `noWebGL-${w}`);
      await page.goto(URL, { waitUntil: 'load', timeout: 45e3 }); await page.waitForTimeout(3000);
      const r = await ev(page, () => {
        const art = document.getElementById('hero-art'); const fb = art?.querySelector('.fallback'); const svg = fb?.querySelector('svg');
        const vis = (el) => { let e = el, o = 1; while (e && e.nodeType === 1) { const cs = getComputedStyle(e); if (cs.display === 'none' || cs.visibility === 'hidden') return 0; o *= +cs.opacity; e = e.parentElement; } return o; };
        const rr = svg?.getBoundingClientRect();
        const labels = [...(art?.querySelectorAll('[aria-label]') || [])].map((e) => e.getAttribute('aria-label'));
        const webgl = (() => { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch { return false; } })();
        return { webgl, is3d: !!art?.classList.contains('is-3d'), svgOpacity: svg ? +vis(svg).toFixed(2) : null, svgRect: rr && { x: Math.round(rr.x), y: Math.round(rr.y), w: Math.round(rr.width), h: Math.round(rr.height) }, labels };
      });
      if (r.svgRect) { const c = clipToVp(r.svgRect, w, w < 760 ? 812 : 800); if (c) await page.screenshot({ path: path.join(OUT, `nowebgl-${w}-art.png`), clip: c }).catch(() => {}); }
      await page.screenshot({ path: path.join(OUT, `nowebgl-${w}.png`) }).catch(() => {});
      const bad = r.labels.some((l) => /tetes\s+minyak/i.test(l || ''));
      const ok = !r.is3d && r.svgOpacity > 0.5 && r.svgRect?.w > 20 && r.svgRect?.h > 20 && !bad;
      if (!ok) fail = true;
      rows.push(`${w}: webgl=${r.webgl} is-3d=${r.is3d} svg opacity=${r.svgOpacity} rect=${JSON.stringify(r.svgRect)} aria-label=${JSON.stringify(r.labels)}${bad ? " ← mengandung 'tetes minyak'" : ''}`);
      out[`noWebGL-${w}`] = r; await ctx.close();
    }
  } finally { await b.close(); }
  set('no-webgl', fail ? 'FAIL' : 'PASS', rows.join('; '), null);

  // --- reduced motion ---
  const b2 = await chromium.launch({ executablePath: CHROME_PATH, headless: true });
  let fail2 = false; const rows2 = [];
  try {
    for (const w of WIDTHS) {
      const { ctx, page } = await newPage(b2, w, { reducedMotion: 'reduce' }); attach(page, `reduced-${w}`);
      await page.goto(URL, { waitUntil: 'load', timeout: 45e3 }); await page.waitForTimeout(3000);
      const L = await layout(page);
      const clip = L.art && clipToVp(L.art, L.vw, L.vh);
      if (!clip) { fail2 = true; rows2.push(`${w}: #hero-art tidak di viewport`); await ctx.close(); continue; }
      const a = await page.screenshot({ clip, path: path.join(OUT, `reduced-${w}-a.png`), animations: 'allow' });
      await page.waitForTimeout(1000);
      const bb = await page.screenshot({ clip, path: path.join(OUT, `reduced-${w}-b.png`), animations: 'allow' });
      await page.screenshot({ path: path.join(OUT, `reduced-${w}.png`) }).catch(() => {});
      const d = await pixelDiff(a, bb);
      const same = d.ratio <= 0.0005; // toleransi 0,05% piksel (noise anti-alias)
      if (!same) fail2 = true;
      const labels = await ev(page, () => [...document.querySelectorAll('#hero-art [aria-label]')].map((e) => e.getAttribute('aria-label')));
      rows2.push(`${w}: is-3d=${L.is3d}, piksel berubah dalam 1 s = ${d.changed} (${(d.ratio * 100).toFixed(3)}%)${same ? ' → statis' : ' → BERGERAK'}, aria-label=${JSON.stringify(labels)}`);
      out[`reduced-${w}`] = { is3d: L.is3d, diff: d, labels }; await ctx.close();
    }
  } finally { await b2.close(); }
  set('reduced-motion', fail2 ? 'FAIL' : 'PASS', rows2.join('; '), null);
  return out;
}

async function lighthouse() {
  const s = Date.now(); let preview;
  try {
    preview = await startPreview();
    const bin = path.join(QA_DIR, 'node_modules', '.bin', 'lighthouse');
    const base = path.join(OUT, 'lighthouse-mobile');
    const r = await run(bin, [PREVIEW_URL, '--output=json', '--output=html', `--output-path=${base}`, '--quiet', '--chrome-flags=--headless=new --no-first-run', '--only-categories=performance'], { timeout: 150e3, env: { CHROME_PATH } });
    const jf = `${base}.report.json`;
    if (r.code !== 0 || !fs.existsSync(jf)) return set('lighthouse-mobile', 'FAIL', 'Lighthouse error: ' + r.out.slice(-300), null);
    const lhr = JSON.parse(fs.readFileSync(jf, 'utf8'));
    const p = Math.round((lhr.categories.performance.score ?? 0) * 100);
    const m = ['largest-contentful-paint', 'total-blocking-time', 'cumulative-layout-shift', 'first-contentful-paint', 'speed-index'].map((k) => `${k.split('-').map((x) => x[0].toUpperCase()).join('')}=${lhr.audits[k]?.displayValue}`).join(' ');
    set('lighthouse-mobile', p >= LH_MIN ? 'PASS' : 'FAIL', `Performance ${p} (batas ≥${LH_MIN}); ${m}; ${Math.round((Date.now() - s) / 1000)} s; ${path.relative(ROOT, base)}.report.html`, { performance: p });
  } catch (e) {
    set('lighthouse-mobile', 'FAIL', 'harness: ' + e.message, null);
  } finally { killAll(); if (preview) await new Promise((r) => setTimeout(r, 500)); }
}

const t0 = Date.now();
let detail = {};
try {
  if (USE_PREVIEW && RUN_BROWSER) { await startPreview(); URL = PREVIEW_URL; }
  if (RUN_BROWSER) {
    if (!(await portUp(URL, 5000))) throw new Error(`URL ${URL} tidak merespons`);
    const { chromium } = await import('playwright-core');
    const browser = await chromium.launch({ executablePath: CHROME_PATH, headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
    try {
      diffPage = await (await browser.newContext()).newPage();
      detail.main = await mainRuns(browser);
      detail.variants = await variants(chromium);
    } finally { await browser.close(); }
    const ue = [...new Set(errors)], uw = [...new Set(warnings)];
    set('console', ue.length ? 'FAIL' : uw.length ? 'WARN' : 'PASS', `${ue.length} error unik, ${uw.length} warning unik (console/pageerror/requestfailed/HTTP≥400, semua konteks)`, { errors: ue, warnings: uw });
  }
  if (USE_PREVIEW) killAll();
  if (RUN_LH) await lighthouse();
} catch (e) {
  set('harness', 'FAIL', e.message, null);
} finally { killAll(); }

const overall = Object.values(checks).some((c) => c.status === 'FAIL') ? 'FAIL' : 'PASS';
const report = { overall, url: URL, date: new Date().toISOString(), durationS: Math.round((Date.now() - t0) / 1000), checks, detail };
fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2));
const md = [`# QA T7 — hero 3D diorama sawit`, '', `- URL: ${URL}`, `- Waktu: ${report.date} (${report.durationS} s)`, `- **Overall: ${overall}**`, '', '| Cek | Status | Ringkasan |', '|---|---|---|',
  ...Object.entries(checks).map(([k, c]) => `| ${k} | ${c.status} | ${String(c.summary).replace(/\|/g, '\\|')} |`), '',
  '## Console error', ...(checks.console?.data?.errors?.length ? checks.console.data.errors.map((e) => `- ${e.slice(0, 300)}`) : ['- (tidak ada)']),
  '', '## Console warning', ...(checks.console?.data?.warnings?.length ? checks.console.data.warnings.slice(0, 20).map((e) => `- ${e.slice(0, 300)}`) : ['- (tidak ada)']),
  '', 'Detail (rect kanvas/konten/teks per babak, info renderer): `report.json` → `detail`.', ''];
fs.writeFileSync(path.join(OUT, 'report.md'), md.join('\n'));
console.log(`\nOverall ${overall} — ${path.relative(ROOT, OUT)}/report.md (${report.durationS} s)`);
process.exit(overall === 'FAIL' ? 1 : 0);
