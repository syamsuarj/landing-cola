// QA T8 (QA-A) cek tambahan T7 di luar t7-check: lebar 768/1440/rotasi, resize lintas 760, leak/dispose+bfcache,
// CPU 4×, anchor nav. Target dev :3000 (hook window.__hero3d). node qa/t8a-extra.mjs [--only a,b,c,d,e]. Bukan kode produksi.
import { chromium } from 'playwright-core';
import fs from 'node:fs';
const URL = process.env.URL || 'http://localhost:3000/';
const OUT = process.env.OUT || 'qa/out-t8a-extra'; fs.mkdirSync(OUT, { recursive: true });
const only = (process.argv.includes('--only') ? process.argv[process.argv.indexOf('--only') + 1] : 'a,b,c,d,e').split(',');
const b = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, args: process.env.GPU ? [] : ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const R = {}; const errors = [];
const diffPage = await (await b.newContext()).newPage();
const kill = setTimeout(() => { console.log('GLOBAL TIMEOUT'); fs.writeFileSync(`${OUT}/result.json`, JSON.stringify({ R, errors }, null, 1)); process.exit(2); }, 170000);

async function mk(vw, vh, extra = {}) {
  const ctx = await b.newContext({ viewport: { width: vw, height: vh }, ...extra });
  const p = await ctx.newPage(); const tag = `${vw}x${vh}`;
  p.on('console', (m) => { if (m.type() === 'error') errors.push(`[${tag}] console: ${m.text().slice(0, 200)}`); });
  p.on('pageerror', (e) => errors.push(`[${tag}] pageerror: ${e.message.slice(0, 200)}`));
  p.on('requestfailed', (r) => { const f = r.failure()?.errorText || ''; if (!/ABORTED/.test(f)) errors.push(`[${tag}] reqfail ${r.url()} ${f}`); });
  return { ctx, p };
}
async function boot(p) {
  await p.goto(URL, { waitUntil: 'load' });
  await p.mouse.move(50, 50); await p.mouse.move(60, 60);
  await p.waitForFunction(() => document.getElementById('hero-art')?.classList.contains('is-3d') && window.__hero3d, null, { timeout: 15000 }).catch(() => {});
  await p.waitForTimeout(1200);
}
const info = (p) => p.evaluate(() => {
  const h = window.__hero3d; const art = document.getElementById('hero-art'); const c = art?.querySelector('canvas');
  const r = c?.getBoundingClientRect(); const st = document.getElementById('hero-3d')?.getBoundingClientRect();
  return { is3d: art?.classList.contains('is-3d'), canvas: !!c, connected: !!c?.isConnected, rect: r && { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) },
    stage: st && { w: Math.round(st.width), h: Math.round(st.height) }, buf: c && { w: c.width, h: c.height },
    mem: h ? { ...h.renderer.info.memory } : null, programs: h?.renderer.info.programs?.length, frames: h?.stats?.frames, dpr: h?.stats?.dpr, throttled: h?.stats?.throttled,
    ovx: document.documentElement.scrollWidth - document.documentElement.clientWidth, y: Math.round(scrollY), vw: innerWidth };
});
async function diff(a, bb, rects) {
  return diffPage.evaluate(async ({ a, b, rects }) => {
    const load = async (s) => createImageBitmap(await (await fetch('data:image/png;base64,' + s)).blob());
    const [ia, ib] = await Promise.all([load(a), load(b)]); const w = Math.min(ia.width, ib.width), h = Math.min(ia.height, ib.height);
    const get = (img) => { const c = new OffscreenCanvas(w, h); const x = c.getContext('2d'); x.drawImage(img, 0, 0); return x.getImageData(0, 0, w, h).data; };
    const da = get(ia), db = get(ib); let minX = w, minY = h, maxX = -1, maxY = -1; const inR = rects.map(() => 0);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = (y * w + x) * 4;
      if (Math.abs(da[i] - db[i]) + Math.abs(da[i + 1] - db[i + 1]) + Math.abs(da[i + 2] - db[i + 2]) > 30) {
        if (x < minX) minX = x; if (y < minY) minY = y; if (x > maxX) maxX = x; if (y > maxY) maxY = y;
        rects.forEach((r, k) => { if (x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h) inR[k]++; }); } }
    return { bbox: maxX < 0 ? null : { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 }, inR: inR.map((n, k) => ({ sel: rects[k].sel, pct: +(100 * n / (rects[k].w * rects[k].h)).toFixed(2) })) };
  }, { a: a.toString('base64'), b: bb.toString('base64'), rects });
}
// objek: bbox konten vs kanvas (terpotong?) & piksel di kotak teks/tombol yang terlihat
async function objectCheck(p, name) {
  await p.evaluate(() => { const h = window.__hero3d; h && (h.stats.__freeze = 1); });
  const rects = await p.evaluate(() => [...document.querySelectorAll('#beranda h1, #beranda h2, #beranda p, #beranda .btn, #beranda .btn-ghost, .site-head a')]
    .filter((e) => { const s = getComputedStyle(e); const r = e.getBoundingClientRect(); return +s.opacity > 0.1 && s.visibility !== 'hidden' && r.width > 4 && r.height > 4 && r.bottom > 0 && r.top < innerHeight; })
    .map((e) => { const r = e.getBoundingClientRect(); return { sel: e.tagName.toLowerCase() + (e.className ? '.' + String(e.className).split(' ')[0] : ''), x: r.x, y: r.y, w: r.width, h: r.height }; }));
  const A = await p.screenshot({ path: `${OUT}/${name}.png` });
  await p.evaluate(() => { document.querySelector('#hero-art canvas').style.visibility = 'hidden'; });
  await p.waitForTimeout(80); const B = await p.screenshot();
  await p.evaluate(() => { document.querySelector('#hero-art canvas').style.visibility = ''; });
  const d = await diff(A, B, rects); const i = await info(p);
  const r = i.rect; const bb = d.bbox;
  const clipped = bb && r ? { L: bb.x <= Math.max(0, r.x) + 1, T: bb.y <= Math.max(0, r.y) + 1, R: bb.x + bb.w >= Math.min(i.vw, r.x + r.w) - 1, B: bb.y + bb.h >= r.y + r.h - 1 } : null;
  return { ...i, content: bb, clipped, overlap: d.inR.filter((x) => x.pct > 0) };
}
const scrollHero = (p, f) => p.evaluate((f) => { const s = document.querySelector('#beranda'); const box = s.parentElement?.classList.contains('pin-spacer') ? s.parentElement : s;
  document.documentElement.style.scrollBehavior = 'auto'; scrollTo(0, box.offsetTop + Math.max(0, box.offsetHeight - innerHeight) * f); }, f);

// A: lebar 768/1440 + rotasi 375↔812
if (only.includes('a')) {
  R.a = {};
  for (const [w, h] of [[768, 1024], [1440, 900]]) {
    const { ctx, p } = await mk(w, h); await boot(p);
    for (const f of [0, 0.45, 0.9]) { await scrollHero(p, f); await p.waitForTimeout(1500); R.a[`${w}-b${f}`] = await objectCheck(p, `a-${w}-${f}`); }
    await ctx.close();
  }
  const { ctx, p } = await mk(375, 812, { isMobile: true, hasTouch: true, deviceScaleFactor: 2 }); await boot(p);
  for (const [w, h] of [[375, 812], [812, 375], [375, 812]]) { await p.setViewportSize({ width: w, height: h }); await p.waitForTimeout(1500); await scrollHero(p, 0); await p.waitForTimeout(1200); R.a[`rot-${w}x${h}-${Object.keys(R.a).length}`] = await objectCheck(p, `a-rot-${w}x${h}`); }
  await ctx.close();
  console.log('A done');
}
// B: resize lintas 760
if (only.includes('b')) {
  const { ctx, p } = await mk(1280, 800); await boot(p); const seq = [];
  seq.push({ vw: 1280, ...(await info(p)) });
  for (const w of [700, 1280, 500, 900, 375, 1280]) { await p.setViewportSize({ width: w, height: 800 }); await p.waitForTimeout(900); const i0 = await info(p); await p.waitForTimeout(600); const i1 = await info(p); seq.push({ vw: w, ...i1, framesAdv: (i1.frames ?? 0) - (i0.frames ?? 0) }); }
  await objectCheck(p, 'b-final-1280'); R.b = seq; await ctx.close(); console.log('B done');
}
// C: leak scroll + pagehide/bfcache
if (only.includes('c')) {
  const { ctx, p } = await mk(1280, 800); await boot(p); const mem = [await info(p)];
  for (let k = 0; k < 5; k++) {
    await p.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; scrollTo(0, document.body.scrollHeight); }); await p.waitForTimeout(700);
    await p.evaluate(() => scrollTo(0, 0)); await p.waitForTimeout(900); mem.push(await info(p));
  }
  await p.evaluate(() => { window.__qaMarker = 1; });
  await p.goto('about:blank'); await p.waitForTimeout(500); await p.goBack({ waitUntil: 'load' }); await p.waitForTimeout(2500);
  const back = await p.evaluate(() => ({ marker: window.__qaMarker === 1, nav: performance.getEntriesByType('navigation')[0]?.type }));
  const after = await info(p); await p.screenshot({ path: `${OUT}/c-after-back.png` });
  await p.mouse.move(200, 200); await p.waitForTimeout(3000); const after2 = await info(p);
  R.c = { mem: mem.map((m) => ({ ...m.mem, programs: m.programs, frames: m.frames })), back, after, after2 }; await ctx.close(); console.log('C done');
}
// D: CPU 4× @375
if (only.includes('d')) {
  const { ctx, p } = await mk(375, 812, { isMobile: true, hasTouch: true, deviceScaleFactor: 2 }); await boot(p);
  const cdp = await ctx.newCDPSession(p); const meas = async () => { const f0 = (await info(p)).frames;
    const raf = await p.evaluate(() => new Promise((res) => { let n = 0; const t0 = performance.now(); const f = () => { n++; if (performance.now() - t0 < 3000) requestAnimationFrame(f); else res(n / 3); }; requestAnimationFrame(f); }));
    const i = await info(p); return { rafFps: +raf.toFixed(1), renderFps: +(((i.frames - f0) / 3)).toFixed(1), throttled: i.throttled, dpr: i.dpr }; };
  const base = await meas(); await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 }); await p.waitForTimeout(1500);
  const x4 = await meas(); await p.waitForTimeout(2000); const x4b = await meas();
  R.d = { base, x4, x4b }; await ctx.close(); console.log('D done');
}
// E: anchor nav
if (only.includes('e')) {
  const { ctx, p } = await mk(1280, 800); await boot(p); const seq = [];
  for (const h of ['#tentang', '#berita', '#kontak', '#beranda', '#bisnis', '#beranda']) {
    await p.click(`.site-head a[href="${h}"]`).catch(async (e) => { seq.push({ h, clickErr: e.message.slice(0, 80) }); });
    await p.waitForTimeout(2200); const i0 = await info(p); await p.waitForTimeout(500); const i1 = await info(p);
    const vis = await p.evaluate(() => { const r = document.getElementById('hero-art').getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight; });
    seq.push({ h, y: i1.y, is3d: i1.is3d, canvas: i1.canvas, heroInView: vis, framesAdv: i1.frames - i0.frames, rect: i1.rect });
  }
  R.e = seq; R.e_final = await objectCheck(p, 'e-final-beranda'); await ctx.close(); console.log('E done');
}
clearTimeout(kill);
fs.writeFileSync(`${OUT}/result.json`, JSON.stringify({ R, errors }, null, 1));
console.log(JSON.stringify({ R, errors }));
await b.close();
