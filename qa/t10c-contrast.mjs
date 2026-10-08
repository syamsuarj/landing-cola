// QA T10 (QA-C) cek 9: kontras teks hero vs piksel latar di belakangnya (teks dibuat transparan, ambil piksel area teks).
// Rata-rata & persentil-90 luminans latar (terburuk). node qa/t10c-contrast.mjs (dev :3000). Bukan kode produksi.
import { chromium } from 'playwright-core';
import fs from 'node:fs';
const OUT = 'qa/out-t10c'; fs.mkdirSync(OUT, { recursive: true });
const b = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const lum = ([r, g, bb]) => { const f = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(bb); };
const cr = (a, c) => { const [x, y] = [lum(a), lum(c)].sort((m, n) => n - m); return +((x + 0.05) / (y + 0.05)).toFixed(2); };
const rows = [];
for (const [w, h, f] of [[1280, 800, 0], [1280, 800, 0.45], [1280, 800, 0.9], [375, 812, 0], [375, 812, 0.45], [375, 812, 0.9]]) {
  const p = await (await b.newContext({ viewport: { width: w, height: h } })).newPage();
  await p.goto('http://localhost:3000/', { waitUntil: 'load' }); await p.mouse.move(40, 40);
  await p.waitForFunction(() => document.getElementById('hero-art')?.classList.contains('is-3d'), null, { timeout: 15000 }).catch(() => {});
  await p.evaluate((f) => { const s = document.querySelector('#beranda'); const box = s.parentElement?.classList.contains('pin-spacer') ? s.parentElement : s; document.documentElement.style.scrollBehavior = 'auto'; scrollTo(0, box.offsetTop + Math.max(0, box.offsetHeight - innerHeight) * f); }, f);
  await p.waitForTimeout(2500);
  await p.evaluate(() => { const s = window.__hero3d?.stats; s && (s.__freeze = 1); });
  const els = await p.evaluate(() => {
    const vis = (e) => { let o = 1; for (let n = e; n; n = n.parentElement) o *= +getComputedStyle(n).opacity; return o; };
    const sel = [...document.querySelectorAll('#beranda .eyebrow, #beranda p, #beranda h1, #beranda h2, #beranda h1 em, #beranda h2 em, #beranda .btn, #beranda .ctas a')];
    return sel.map((e, i) => { e.dataset.qaC = i; const r = e.getBoundingClientRect(); const cs = getComputedStyle(e);
      return { i, tag: e.tagName.toLowerCase() + '.' + (String(e.className).split(' ')[0] || ''), text: e.textContent.trim().slice(0, 24), color: cs.color, bg: cs.backgroundColor, op: +vis(e).toFixed(2), r: { x: Math.max(0, r.x), y: Math.max(0, r.y), w: Math.min(r.width, innerWidth - Math.max(0, r.x)), h: Math.min(r.height, innerHeight - Math.max(0, r.y)) }, fs: parseFloat(cs.fontSize), fw: +cs.fontWeight }; })
      .filter((e) => e.op > 0.9 && e.r.w > 4 && e.r.h > 4 && e.r.y < innerHeight);
  });
  await p.addStyleTag({ content: '[data-qa-c], [data-qa-c] * { color: transparent !important; -webkit-text-fill-color: transparent !important; text-shadow: none !important; } [data-qa-c] svg { visibility: hidden !important; }' });
  await p.waitForTimeout(150);
  const shot = await p.screenshot({ path: `${OUT}/contrast-bg-${w}-b${f}.png` });
  const stats = await p.evaluate(async ({ s, els }) => {
    const img = await createImageBitmap(await (await fetch('data:image/png;base64,' + s)).blob()); const c = new OffscreenCanvas(img.width, img.height); const x = c.getContext('2d'); x.drawImage(img, 0, 0);
    const k = img.width / innerWidth;
    return els.map((e) => { const d = x.getImageData(Math.round(e.r.x * k), Math.round(e.r.y * k), Math.max(1, Math.round(e.r.w * k)), Math.max(1, Math.round(e.r.h * k))).data; const px = [];
      for (let i = 0; i < d.length; i += 4) px.push([d[i], d[i + 1], d[i + 2]]);
      const L = (q) => 0.2126 * q[0] + 0.7152 * q[1] + 0.0722 * q[2]; px.sort((a, b) => L(a) - L(b));
      const avg = [0, 1, 2].map((j) => Math.round(px.reduce((a, q) => a + q[j], 0) / px.length));
      return { avg, p10: px[Math.floor(px.length * 0.1)], p90: px[Math.floor(px.length * 0.9)], max: px[px.length - 1] }; });
  }, { s: shot.toString('base64'), els });
  els.forEach((e, k) => { const rgba = e.color.match(/[\d.]+/g).map(Number); const a = rgba[3] ?? 1; const S = stats[k];
    const fg = (bg) => rgba.slice(0, 3).map((c, j) => Math.round(c * a + bg[j] * (1 - a)));
    const bgFill = e.bg.match(/[\d.]+/g).map(Number); const solid = (bgFill[3] ?? 1) > 0.5;
    const large = e.fs >= 24 || (e.fs >= 18.66 && e.fw >= 700);
    rows.push({ vp: `${w}-b${f}`, el: e.tag, text: e.text, fs: e.fs, color: e.color, bgAvg: S.avg, bgP90: S.p90, solidBtn: solid, crAvg: cr(fg(S.avg), S.avg), crWorstP90: cr(fg(S.p90), S.p90), need: large ? 3 : 4.5 }); });
  await p.context().close();
}
fs.writeFileSync(`${OUT}/contrast.json`, JSON.stringify(rows, null, 1));
for (const r of rows) console.log(r.vp.padEnd(10), (r.el + ' ' + r.text).padEnd(42), String(r.fs).padEnd(5), r.color.padEnd(24), 'bg', JSON.stringify(r.bgAvg), 'cr', r.crAvg, 'p90', r.crWorstP90, r.solidBtn ? '(btn solid)' : '', r.crWorstP90 < r.need ? '<<FAIL' : '');
await b.close();
