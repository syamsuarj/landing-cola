// T9a (Programmer A) — turunan qa/t8a-extra.mjs: overlap & jarak tepi/tombol di banyak viewport. node qa/t9a-layout.mjs [WxH,...]
// QA T8 (QA-A) cek tambahan T7 di luar t7-check: lebar 768/1440/rotasi, resize lintas 760, leak/dispose+bfcache,
// CPU 4×, anchor nav. Target dev :3000 (hook window.__hero3d). node qa/t8a-extra.mjs [--only a,b,c,d,e]. Bukan kode produksi.
import { chromium } from 'playwright-core';
import fs from 'node:fs';
const URL = process.env.URL || 'http://localhost:3000/';
const OUT = process.env.OUT || 'qa/out-t9a-layout'; fs.mkdirSync(OUT, { recursive: true });
const only = (process.argv.includes('--only') ? process.argv[process.argv.indexOf('--only') + 1] : 'a,b,c,d,e').split(',');
const b = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, args: process.env.GPU ? [] : ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const R = {}; const errors = [];
const diffPage = await (await b.newContext()).newPage();
const kill = setTimeout(() => { console.log('GLOBAL TIMEOUT'); fs.writeFileSync(`${OUT}/result.json`, JSON.stringify({ R, errors }, null, 1)); process.exit(2); }, 400000);

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


const sizes = (process.argv[2] || '768x1024,820x1180,900x1200,1024x1366,1024x768,812x375,1280x800,1440x900,375x812').split(',').map((s) => s.split('x').map(Number));
const fr = (process.env.FR || '0,0.45,0.9').split(',').map(Number);
const rows = [];
for (const [w, h] of sizes) {
  const mob = w <= 760;
  const { ctx, p } = await mk(w, h, mob ? { isMobile: true, hasTouch: true, deviceScaleFactor: 1 } : {}); await boot(p);
  for (const f of fr) {
    await scrollHero(p, f); await p.waitForTimeout(1600);
    const r = await objectCheck(p, `${w}x${h}-${f}`);
    const btns = await p.evaluate(() => [...document.querySelectorAll('#beranda .btn, #beranda .btn-ghost')].filter((e) => { const s = getComputedStyle(e); return +s.opacity > 0.1 && s.visibility !== 'hidden'; }).map((e) => { const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, r: r.right, b: r.bottom }; }));
    const c = r.content, scale = 1;
    let edge = null, btn = null;
    if (c) { const x = c.x / scale, y = c.y / scale, R = (c.x + c.w) / scale, B = (c.y + c.h) / scale;
      edge = Math.round(Math.min(x, y, w - R, h - B));
      btn = btns.length ? Math.round(Math.min(...btns.map((q) => { const dx = Math.max(q.x - R, x - q.r, 0), dy = Math.max(q.y - B, y - q.b, 0); return Math.hypot(dx, dy); }))) : null; }
    const maxOv = r.overlap.reduce((m, o) => Math.max(m, o.pct), 0);
    rows.push({ vp: `${w}x${h}`, f, is3d: r.is3d, canvas: r.rect, content: c, maxOv, overlap: r.overlap, edge, btn, quality: await p.evaluate(() => window.__hero3d?.stats?.quality) });
    console.log(JSON.stringify(rows.at(-1)));
  }
  await ctx.close();
}
fs.writeFileSync(`${OUT}/result.json`, JSON.stringify({ rows, errors }, null, 1));
console.log('errors', errors.length, errors.slice(0, 5));
clearTimeout(kill); await b.close();
