// QA T13 (QA-E) cek 6 / W-1: apakah piksel diorama menyentuh tepi kanvas? Diff piksel screenshot area kanvas: tampil vs
// kanvas visibility:hidden (hanya kanvas yang berubah → glow/latar tidak membiaskan, beda dgn flag `clipped` t8a-extra).
// Kolom/baris tepi kanvas (2 px) dengan piksel beda >40 → "menyentuh tepi". GPU metal. node qa/t13e-clip.mjs. Bukan kode produksi.
import { chromium } from 'playwright-core';
import sharp from 'sharp';
import fs from 'node:fs';
const OUT = 'qa/out-t13e'; fs.mkdirSync(OUT, { recursive: true });
const b = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });
const raw = async (buf) => sharp(buf).raw().toBuffer({ resolveWithObject: true });
const res = [];
for (const [w, h] of [[1280, 800], [1440, 900], [1920, 1080]]) {
  const p = await (await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 })).newPage();
  await p.goto(process.env.URL || 'http://localhost:3000/', { waitUntil: 'load' }); await p.mouse.move(w / 2, h / 2);
  await p.waitForFunction(() => document.getElementById('hero-art')?.classList.contains('is-3d'), null, { timeout: 15e3 });
  await p.waitForTimeout(1500);
  for (const f of [0, 0.45, 0.9]) {
    await p.evaluate((f) => { const sp = document.querySelector('[data-hero-scene]').closest('.pin-spacer'); const t = sp.getBoundingClientRect().top + scrollY; document.documentElement.style.scrollBehavior = 'auto'; scrollTo(0, t + (sp.offsetHeight - innerHeight) * f); }, f);
    await p.waitForTimeout(1800);
    let worst = { R: 0, L: 0, T: 0, B: 0 }; let minGap = { R: 1e9, L: 1e9, T: 1e9, B: 1e9 };
    for (let i = 0; i < 6; i++) {
      const r = await p.evaluate(() => { const c = document.querySelector('#hero-art canvas').getBoundingClientRect(); return { x: Math.round(c.x), y: Math.round(c.y), w: Math.floor(c.width), h: Math.floor(c.height) }; });
      const clip = { x: Math.max(0, r.x), y: Math.max(0, r.y), width: Math.min(r.w, w - Math.max(0, r.x)), height: Math.min(r.h, h - Math.max(0, r.y)) };
      const s1 = await p.screenshot({ clip });
      await p.evaluate(() => { document.querySelector('#hero-art canvas').style.visibility = 'hidden'; });
      const s0 = await p.screenshot({ clip });
      await p.evaluate(() => { document.querySelector('#hero-art canvas').style.visibility = ''; });
      const A = await raw(s1), B = await raw(s0); const W = A.info.width, H = A.info.height, ch = A.info.channels;
      let minX = W, maxX = -1, minY = H, maxY = -1; const edge = { R: 0, L: 0, T: 0, B: 0 };
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const k = (y * W + x) * ch; const d = Math.abs(A.data[k] - B.data[k]) + Math.abs(A.data[k + 1] - B.data[k + 1]) + Math.abs(A.data[k + 2] - B.data[k + 2]); if (d > 40) { if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y; if (x >= W - 2) edge.R++; if (x < 2) edge.L++; if (y < 2) edge.T++; if (y >= H - 2) edge.B++; } }
      for (const k of ['R', 'L', 'T', 'B']) worst[k] = Math.max(worst[k], edge[k]);
      minGap.R = Math.min(minGap.R, W - 1 - maxX); minGap.L = Math.min(minGap.L, minX); minGap.T = Math.min(minGap.T, minY); minGap.B = Math.min(minGap.B, H - 1 - maxY);
      if (i === 0 || i === 3) { fs.writeFileSync(`${OUT}/clip-${w}-p${f}-${i}.png`, s1); }
      await p.waitForTimeout(1300);
    }
    const row = { vp: `${w}x${h}`, p: f, edgePx: worst, minGapPx: minGap };
    res.push(row); console.log(JSON.stringify(row));
  }
  await p.context().close();
}
fs.writeFileSync(`${OUT}/clip.json`, JSON.stringify(res, null, 2));
await b.close();
