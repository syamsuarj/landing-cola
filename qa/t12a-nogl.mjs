// T12a W-3: no-WebGL 1280 babak 2 — jarak kotak SVG fallback (bbox gambar nyata via getBBox) ke teks babak 2.
import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', args: ['--disable-webgl', '--disable-3d-apis'] });
for (const [w, h] of [[1280, 800], [1440, 900]]) {
  const p = await (await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 })).newPage();
  await p.goto(process.env.URL || 'http://localhost:3000/', { waitUntil: 'load' });
  await p.waitForTimeout(1500);
  await p.evaluate(() => { const s = document.querySelector('[data-hero-scene]').parentElement; document.documentElement.style.scrollBehavior = 'auto'; scrollTo(0, (s.offsetHeight - innerHeight) * 0.5); });
  await p.waitForTimeout(2200);
  const r = await p.evaluate(() => {
    const svg = document.querySelector('#hero-art .fallback svg');
    // bbox konten gambar (bukan viewBox) → koordinat layar via getScreenCTM
    const bb = svg.getBBox(), m = svg.getScreenCTM();
    const pts = [[bb.x, bb.y], [bb.x + bb.width, bb.y + bb.height], [bb.x + bb.width, bb.y], [bb.x, bb.y + bb.height]].map(([x, y]) => new DOMPoint(x, y).matrixTransform(m));
    const xs = pts.map((q) => q.x), ys = pts.map((q) => q.y); const art = { l: Math.min(...xs), r: Math.max(...xs), t: Math.min(...ys), b: Math.max(...ys) };
    const a2 = document.querySelector('[data-act="2"]');
    const rng = document.createRange(); rng.selectNodeContents(a2);
    const rects = [...rng.getClientRects()].filter((q) => q.width > 2 && q.bottom > art.t && q.top < art.b);
    const textL = Math.min(...rects.map((q) => q.left));
    let pr = -1e9; // tepi kanan GAMBAR nyata: sampel titik sepanjang setiap path (koordinat layar), hanya baris setinggi teks babak 2
    for (const el of svg.querySelectorAll('path,ellipse,circle,rect,polygon')) {
      if (el.closest('defs') && !el.closest('symbol')) continue;
      const uses = el.closest('symbol') ? [...svg.querySelectorAll(`use[href="#${el.closest('symbol').id}"]`)] : [null];
      for (const u of uses) {
        const M = (u ?? el).getScreenCTM(); if (!M) continue;
        const L = el.getTotalLength?.() ?? 0;
        for (let k = 0; k <= L; k += 2) { const q = el.getPointAtLength(k); const t = new DOMPoint(q.x, q.y).matrixTransform(M); if (rects.some((r) => t.y >= r.top && t.y <= r.bottom)) pr = Math.max(pr, t.x); }
      }
    }
    return { pixRight: Math.round(pr), pixGap: Math.round(textL - pr), fbT: getComputedStyle(document.querySelector('#hero-art .fallback')).transform, step: document.querySelector('#hero-art').dataset.step, is3d: document.querySelector('#hero-art').classList.contains('is-3d'), a2op: getComputedStyle(a2).opacity, art: Object.fromEntries(Object.entries(art).map(([k, v]) => [k, Math.round(v)])), textL: Math.round(textL), gap: Math.round(textL - art.r) };
  });
  await p.screenshot({ path: `qa/out-t12a/nogl-${w}-b2.png` });
  console.log(w, JSON.stringify(r), r.pixGap >= 24 ? 'PASS' : 'FAIL');
  await p.context().close();
}
await b.close();
