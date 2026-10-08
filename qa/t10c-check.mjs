// QA T10 (QA-C) cek 4/5/7/8: landscape ≤500px, 375 b1 overlap tombol/baris teks, resize quality/memory, HeroBackdrop.
// node qa/t10c-check.mjs [--only 4,5,7,8]  (dev :3000). Bukan kode produksi.
import { chromium } from 'playwright-core';
import fs from 'node:fs';
const URL = process.env.URL || 'http://localhost:3000/';
const OUT = process.env.OUT || 'qa/out-t10c'; fs.mkdirSync(OUT, { recursive: true });
const only = (process.argv.includes('--only') ? process.argv[process.argv.indexOf('--only') + 1] : '4,5,7,8').split(',');
const CH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const b = await chromium.launch({ executablePath: CH, headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const R = {}; const errors = [];
const kill = setTimeout(() => { console.log('GLOBAL TIMEOUT'); fs.writeFileSync(`${OUT}/result.json`, JSON.stringify({ R, errors }, null, 1)); process.exit(2); }, 175000);
const COUNTER = () => {
  window.__cnt = { place: 0, frame: 0, other: 0, gbcrObj: 0 };
  const raf = window.requestAnimationFrame.bind(window);
  window.requestAnimationFrame = (cb) => raf((t) => { const n = cb.name; if (n === 'place') __cnt.place++; else if (n === 'frame') __cnt.frame++; else __cnt.other++; return cb(t); });
  const g = Element.prototype.getBoundingClientRect;
  Element.prototype.getBoundingClientRect = function () { if (this.hasAttribute && this.hasAttribute('data-hero-object')) __cnt.gbcrObj++; return g.call(this); };
};
async function mk(vw, vh, extra = {}, b2 = b) {
  const ctx = await b2.newContext({ viewport: { width: vw, height: vh }, ...extra });
  await ctx.addInitScript(COUNTER);
  const p = await ctx.newPage(); const tag = `${vw}x${vh}`;
  p.on('console', (m) => { if (m.type() === 'error') errors.push(`[${tag}] console: ${m.text().slice(0, 200)}`); });
  p.on('pageerror', (e) => errors.push(`[${tag}] pageerror: ${e.message.slice(0, 200)}`));
  return { ctx, p };
}
async function boot(p, wait3d = true) {
  await p.goto(URL, { waitUntil: 'load' });
  await p.mouse.move(50, 50); await p.mouse.move(60, 60);
  if (wait3d) await p.waitForFunction(() => document.getElementById('hero-art')?.classList.contains('is-3d') && window.__hero3d, null, { timeout: 15000 }).catch(() => {});
  await p.waitForTimeout(1500);
}
const scrollHero = (p, f) => p.evaluate((f) => { const s = document.querySelector('#beranda'); const box = s.parentElement?.classList.contains('pin-spacer') ? s.parentElement : s;
  document.documentElement.style.scrollBehavior = 'auto'; scrollTo(0, box.offsetTop + Math.max(0, box.offsetHeight - innerHeight) * f); }, f);
const st = (p) => p.evaluate(() => { const s = window.__hero3dStats || window.__hero3d?.stats; const h = window.__hero3d; const c = document.querySelector('#hero-art canvas'); const r = c?.getBoundingClientRect();
  const o = document.querySelector('.object'); const os = o && getComputedStyle(o);
  return { frames: s?.frames, quality: s?.quality, rebuilds: s?.rebuilds, throttled: s?.throttled, dpr: s?.dpr, mem: h ? { ...h.renderer.info.memory } : null, programs: h?.renderer.info.programs?.length,
    is3d: document.getElementById('hero-art')?.classList.contains('is-3d'), canvas: r && { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }, objDisplay: os?.display,
    cnt: { ...window.__cnt }, y: Math.round(scrollY), vw: innerWidth, vh: innerHeight }; });
// teks: kotak per baris (Range client rects) + tombol
const textBoxes = (p) => p.evaluate(() => {
  const out = []; const vis = (e) => { const s = getComputedStyle(e); return +s.opacity > 0.1 && s.visibility !== 'hidden'; };
  for (const e of document.querySelectorAll('#beranda h1, #beranda h2, #beranda p, #beranda .eyebrow')) {
    if (!vis(e)) continue; const rg = document.createRange(); rg.selectNodeContents(e);
    [...rg.getClientRects()].forEach((r, i) => { if (r.width > 2 && r.bottom > 0 && r.top < innerHeight) out.push({ sel: e.tagName.toLowerCase() + '.' + (String(e.className).split(' ')[0] || '') + '#L' + i, x: r.x, y: r.y, w: r.width, h: r.height }); });
  }
  for (const e of document.querySelectorAll('#beranda a.btn, #beranda .btn, #beranda .btn-ghost')) { if (!vis(e)) continue; const r = e.getBoundingClientRect(); if (r.width > 4) out.push({ sel: 'btn:' + e.textContent.trim().slice(0, 20), x: r.x, y: r.y, w: r.width, h: r.height }); }
  return out;
});
async function diffCount(p, A, B, rects) {
  return p.evaluate(async ({ a, b, rects }) => {
    const load = async (s) => createImageBitmap(await (await fetch('data:image/png;base64,' + s)).blob());
    const [ia, ib] = await Promise.all([load(a), load(b)]); const w = Math.min(ia.width, ib.width), h = Math.min(ia.height, ib.height);
    const get = (img) => { const c = new OffscreenCanvas(w, h); const x = c.getContext('2d'); x.drawImage(img, 0, 0); return x.getImageData(0, 0, w, h).data; };
    const da = get(ia), db = get(ib); const inR = rects.map(() => 0); let minX = w, minY = h, maxX = -1, maxY = -1;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = (y * w + x) * 4;
      if (Math.abs(da[i] - db[i]) + Math.abs(da[i + 1] - db[i + 1]) + Math.abs(da[i + 2] - db[i + 2]) > 30) {
        if (x < minX) minX = x; if (y < minY) minY = y; if (x > maxX) maxX = x; if (y > maxY) maxY = y;
        rects.forEach((r, k) => { if (x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h) inR[k]++; }); } }
    return { bbox: maxX < 0 ? null : { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 }, inR: rects.map((r, k) => ({ sel: r.sel, px: inR[k], pct: +(100 * inR[k] / (r.w * r.h)).toFixed(2) })).filter((x) => x.px > 0) };
  }, { a: A.toString('base64'), b: B.toString('base64'), rects });
}
const rectOverlap = (a, r) => { const w = Math.max(0, Math.min(a.x + a.w, r.x + r.w) - Math.max(a.x, r.x)), h = Math.max(0, Math.min(a.y + a.h, r.y + r.h) - Math.max(a.y, r.y)); return +(100 * w * h / (r.w * r.h)).toFixed(2); };

// 4: tinggi ≤500 (landscape)
if (only.includes('4')) {
  R.c4 = {};
  for (const [w, h] of [[812, 375], [667, 375]]) {
    const { ctx, p } = await mk(w, h, { isMobile: true, hasTouch: true, deviceScaleFactor: 2 }); await boot(p, false); await p.waitForTimeout(2500);
    const s0 = await st(p); await p.waitForTimeout(1000); const s1 = await st(p);
    const txt = await p.evaluate(() => [...document.querySelectorAll('#beranda h1, #beranda p, #beranda .btn')].map((e) => { const r = e.getBoundingClientRect(); return { t: e.tagName + ':' + e.textContent.trim().slice(0, 18), r: [Math.round(r.x), Math.round(r.y), Math.round(r.right), Math.round(r.bottom)], sw: e.scrollWidth > e.clientWidth + 1 }; }));
    const ovx = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    await p.screenshot({ path: `${OUT}/c4-${w}x${h}-b1.png` });
    await scrollHero(p, 0.45); await p.waitForTimeout(1500); await p.screenshot({ path: `${OUT}/c4-${w}x${h}-b2.png` });
    R.c4[`${w}x${h}`] = { s0, s1, framesAdv: (s1.frames ?? 0) - (s0.frames ?? 0), placeAdv: s1.cnt.place - s0.cnt.place, frameRafAdv: s1.cnt.frame - s0.cnt.frame, ovx, txt };
    // rotasi dari portrait → landscape → portrait di konteks yang sama
    await ctx.close();
  }
  const { ctx, p } = await mk(375, 812, { isMobile: true, hasTouch: true, deviceScaleFactor: 2 }); await boot(p);
  const a = await st(p); await p.setViewportSize({ width: 812, height: 375 }); await p.waitForTimeout(1500); const l0 = await st(p); await p.waitForTimeout(1000); const l1 = await st(p);
  await p.screenshot({ path: `${OUT}/c4-rot-812x375.png` });
  await p.setViewportSize({ width: 375, height: 812 }); await p.waitForTimeout(2000); const back = await st(p);
  await p.screenshot({ path: `${OUT}/c4-rot-back-375.png` });
  R.c4.rot = { portrait: a, land: l1, landFramesAdv: (l1.frames ?? 0) - (l0.frames ?? 0), landFrameRaf: l1.cnt.frame - l0.cnt.frame, back };
  await ctx.close(); console.log('4 done');
}
// 5: 375×812 babak 1 — kanvas & SVG vs tombol/baris teks
if (only.includes('5')) {
  R.c5 = {};
  const { ctx, p } = await mk(375, 812, { isMobile: true, hasTouch: true, deviceScaleFactor: 1 }); await boot(p); await scrollHero(p, 0); await p.waitForTimeout(2000);
  await p.evaluate(() => { const s = window.__hero3dStats; s && (s.__freeze = 1); });
  const rects = await textBoxes(p); const s = await st(p);
  const A = await p.screenshot({ path: `${OUT}/c5-375-b1.png` });
  await p.evaluate(() => { document.querySelector('#hero-art canvas').style.visibility = 'hidden'; }); await p.waitForTimeout(100);
  const B = await p.screenshot(); await p.evaluate(() => { document.querySelector('#hero-art canvas').style.visibility = ''; });
  R.c5.canvas = { canvasRect: s.canvas, rectOverlapBtn: rects.filter((r) => r.sel.startsWith('btn')).map((r) => ({ sel: r.sel, pct: rectOverlap(s.canvas, r) })), pixel: await diffCount(p, A, B, rects), rects };
  await ctx.close();
  // SVG fallback (tanpa WebGL)
  const b2 = await chromium.launch({ executablePath: CH, headless: true, args: ['--disable-webgl', '--disable-3d-apis'] });
  const c2 = await mk(375, 812, { isMobile: true, hasTouch: true, deviceScaleFactor: 1 }, b2); await boot(c2.p, false); await scrollHero(c2.p, 0); await c2.p.waitForTimeout(2500);
  const rr = await textBoxes(c2.p);
  const sv = await c2.p.evaluate(() => { const f = document.querySelector('#hero-art .fallback'); const svg = f?.querySelector('svg'); const r = svg?.getBoundingClientRect(); const op = (e) => { let o = 1; for (; e; e = e.parentElement) o *= +getComputedStyle(e).opacity; return o; };
    return { rect: r && { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }, opacity: svg ? +op(svg).toFixed(2) : null }; });
  const A2 = await c2.p.screenshot({ path: `${OUT}/c5-375-b1-svg.png` });
  await c2.p.evaluate(() => { document.querySelector('#hero-art .fallback').style.visibility = 'hidden'; }); await c2.p.waitForTimeout(100);
  const B2 = await c2.p.screenshot();
  R.c5.svg = { ...sv, pixel: await diffCount(c2.p, A2, B2, rr) };
  // SVG saat first paint di browser ber-WebGL (sebelum crossfade ke kanvas)
  await b2.close();
  const c3 = await mk(375, 812, { isMobile: true, hasTouch: true, deviceScaleFactor: 1 }); await c3.p.goto(URL, { waitUntil: 'domcontentloaded' }); await c3.p.waitForTimeout(600);
  const pre = await c3.p.evaluate(() => ({ is3d: document.getElementById('hero-art')?.classList.contains('is-3d') }));
  const rr3 = await textBoxes(c3.p); const A3 = await c3.p.screenshot({ path: `${OUT}/c5-375-b1-svg-prepaint.png` });
  await c3.p.evaluate(() => { const f = document.querySelector('#hero-art .fallback'); f && (f.style.visibility = 'hidden'); }); await c3.p.waitForTimeout(80);
  const B3 = await c3.p.screenshot(); R.c5.svgPre = { ...pre, pixel: await diffCount(c3.p, A3, B3, rr3) };
  await c3.ctx.close(); console.log('5 done');
}
// 7: resize 1280→375→1280: quality, memory, errors
if (only.includes('7')) {
  const { ctx, p } = await mk(1280, 800); await boot(p); const seq = [];
  for (const w of [1280, 375, 1280, 375, 1280]) { await p.setViewportSize({ width: w, height: 800 }); await p.waitForTimeout(2500); const a = await st(p); await p.waitForTimeout(700); const c = await st(p); delete c.cnt; seq.push({ w, ...c, framesAdv: (c.frames ?? 0) - (a.frames ?? 0) }); }
  R.c7 = seq; await ctx.close(); console.log('7 done');
}
// 8: backdrop — spot/floor ikut diorama, rAF berhenti di luar hero, tanpa JS
if (only.includes('8')) {
  R.c8 = {};
  for (const [w, h] of [[1280, 800], [375, 812]]) {
    const { ctx, p } = await mk(w, h); await boot(p); const rows = [];
    for (const f of [0, 0.45, 0.9]) { await scrollHero(p, f); await p.waitForTimeout(2000);
      rows.push(await p.evaluate((f) => { const c = (e) => { const r = e.getBoundingClientRect(); return { cx: Math.round(r.x + r.width / 2), cy: Math.round(r.y + r.height / 2), w: Math.round(r.width), bottom: Math.round(r.bottom) }; };
        const o = document.querySelector('[data-hero-object]'), sp = document.querySelector('[data-hero-backdrop] .spot'), fl = document.querySelector('[data-hero-backdrop] .floor');
        return { f, obj: c(o), spot: c(sp), floor: c(fl) }; }, f)); }
    await p.screenshot({ path: `${OUT}/c8-${w}-b3.png` });
    // rAF/ layout read di luar hero
    await p.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; scrollTo(0, document.body.scrollHeight * 0.6); }); await p.waitForTimeout(2500);
    const s0 = await st(p); await p.waitForTimeout(3000); const s1 = await st(p);
    // scroll aktif di luar hero (event scroll) → place tidak boleh jalan
    for (let i = 0; i < 10; i++) { await p.mouse.wheel(0, 120); await p.waitForTimeout(60); } await p.waitForTimeout(800); const s2 = await st(p);
    // di dalam hero diam: harus berhenti juga setelah stabil
    await scrollHero(p, 0); await p.waitForTimeout(3000); const h0 = await st(p); await p.waitForTimeout(2000); const h1 = await st(p);
    R.c8[w] = { rows, outside3s: { place: s1.cnt.place - s0.cnt.place, gbcrObj: s1.cnt.gbcrObj - s0.cnt.gbcrObj, frame: s1.cnt.frame - s0.cnt.frame, other: s1.cnt.other - s0.cnt.other },
      outsideWheel: { place: s2.cnt.place - s1.cnt.place, gbcrObj: s2.cnt.gbcrObj - s1.cnt.gbcrObj }, heroIdle2s: { place: h1.cnt.place - h0.cnt.place, gbcrObj: h1.cnt.gbcrObj - h0.cnt.gbcrObj, frame: h1.cnt.frame - h0.cnt.frame } };
    await ctx.close();
  }
  for (const [w, h] of [[1280, 800], [375, 812]]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, javaScriptEnabled: false }); const p = await ctx.newPage();
    await p.goto(URL, { waitUntil: 'load' }); await p.waitForTimeout(800);
    R.c8[`nojs-${w}`] = await p.evaluate(() => { const bg = document.querySelector('[data-hero-bg]'); const r = bg?.getBoundingClientRect(); const sp = document.querySelector('[data-hero-backdrop] .spot')?.getBoundingClientRect();
      const ob = document.querySelector('[data-hero-object]')?.getBoundingClientRect();
      return { hasBg: !!bg, bgCount: document.querySelectorAll('[data-hero-bg]').length, bgRect: r && [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)], spotC: sp && [Math.round(sp.x + sp.width / 2), Math.round(sp.y + sp.height / 2)], objC: ob && [Math.round(ob.x + ob.width / 2), Math.round(ob.y + ob.height / 2)], ovx: document.documentElement.scrollWidth - innerWidth }; });
    await p.screenshot({ path: `${OUT}/c8-nojs-${w}.png` }); await ctx.close();
  }
  console.log('8 done');
}
clearTimeout(kill);
fs.writeFileSync(`${OUT}/result.json`, JSON.stringify({ R, errors }, null, 1));
console.log(JSON.stringify({ R, errors }).slice(0, 200));
await b.close();
