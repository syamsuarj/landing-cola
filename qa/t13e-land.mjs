// QA T13 (QA-E): cek 4 (R-1 lanskap ≤500px + Tab keyboard) & cek 5 (rotasi/resize di halaman sama). Bukan kode produksi.
// node qa/t13e-land.mjs [--only 4,5]   URL default dev :3000
import { chromium } from 'playwright-core';
import fs from 'node:fs';
const URL = process.env.URL || 'http://localhost:3000/';
const OUT = 'qa/out-t13e'; fs.mkdirSync(OUT, { recursive: true });
const only = (process.argv.find((a) => a.startsWith('--only='))?.slice(7) || process.argv[process.argv.indexOf('--only') + 1] || '4,5').split(',');
const b = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const R = {};
const errs = [];
const hook = (p, tag) => { p.on('pageerror', (e) => errs.push(`${tag} pageerror ${e.message}`)); p.on('console', (m) => { if (m.type() === 'error') errs.push(`${tag} console ${m.text()}`); }); };

const acts = (p) => p.evaluate(() => {
  const vis = (e) => { const r = e.getBoundingClientRect(); let o = 1, hidden = false; for (let n = e; n; n = n.parentElement) { const cs = getComputedStyle(n); o *= +cs.opacity; if (cs.visibility === 'hidden' || cs.display === 'none') hidden = true; } return { top: Math.round(r.top), bottom: Math.round(r.bottom), left: Math.round(r.left), right: Math.round(r.right), op: +o.toFixed(2), hidden }; };
  const a = [1, 2, 3].map((i) => document.querySelector(`[data-hero-scene] [data-act="${i}"]`)).map((e) => (e ? { ...vis(e), op: vis(e.querySelector('h1,h2,p') || e).op, hidden: vis(e.querySelector('h1,h2,p') || e).hidden } : null));
  const btns = [...document.querySelectorAll('#beranda [data-act] .btn, #beranda [data-act] a')].map((e) => ({ t: e.textContent.trim().slice(0, 24), ...vis(e) }));
  const s = document.querySelector('#beranda'); const ps = document.querySelector('[data-hero-scene]')?.closest('.pin-spacer') || null;
  const art = document.querySelector('#hero-art'); const cv = art?.querySelector('canvas'); const cr = cv?.getBoundingClientRect();
  const bd = document.querySelector('[data-hero-backdrop]');
  const sp = bd?.querySelector('.spot'); const fl = bd?.querySelector('.floor');
  return { y: Math.round(scrollY), vh: innerHeight, vw: innerWidth, acts: a, btns, pinned: !!ps, spacerTop: ps ? Math.round(ps.getBoundingClientRect().top + scrollY) : null, spacerH: ps?.offsetHeight ?? null, secTop: Math.round(s.getBoundingClientRect().top + scrollY), secH: s.offsetHeight,
    is3d: art?.classList.contains('is-3d'), canvas: cr ? [Math.round(cr.width), Math.round(cr.height)] : null, step: document.querySelector('[data-hero-step]')?.textContent, dataStep: document.querySelector('[data-hero-object]')?.dataset.step,
    noObject: bd?.hasAttribute('data-no-object'), spotDisp: sp ? getComputedStyle(sp).display : null, floorDisp: fl ? getComputedStyle(fl).display : null, frames: window.__hero3dStats?.frames ?? null };
});
const overlapPairs = (A) => { const v = A.acts.map((a, i) => ({ ...a, i: i + 1 })).filter((a) => a && !a.hidden && a.op > 0.05); const o = []; for (let i = 0; i < v.length; i++) for (let j = i + 1; j < v.length; j++) { const h = Math.min(v[i].bottom, v[j].bottom) - Math.max(v[i].top, v[j].top); const w = Math.min(v[i].right, v[j].right) - Math.max(v[i].left, v[j].left); if (h > 2 && w > 2) o.push(`${v[i].i}x${v[j].i}:${h}px`); } return o; };
const to = async (p, y) => { await p.evaluate((y) => { document.documentElement.style.scrollBehavior = 'auto'; scrollTo(0, y); }, y); await p.waitForTimeout(1000); };

if (only.includes('4')) {
  R.c4 = {};
  for (const [w, h] of [[812, 375], [667, 375]]) {
    const p = await (await b.newContext({ viewport: { width: w, height: h }, isMobile: true, hasTouch: true, deviceScaleFactor: 1 })).newPage(); hook(p, `c4-${w}`);
    await p.goto(URL, { waitUntil: 'load' }); await p.waitForTimeout(3000);
    const a0 = await acts(p);
    const rows = [];
    // scroll wajar: langkah 150px sampai lewat akhir section hero
    const end = a0.secTop + a0.secH;
    for (let y = 0; y <= end; y += 150) { await to(p, y); const A = await acts(p); rows.push({ y: A.y, acts: A.acts.map((a) => a && `${a.top}..${a.bottom} op${a.op}${a.hidden ? ' H' : ''}`), btns: A.btns.map((x) => `${x.t}:${x.top}..${x.bottom} op${x.op}${x.hidden ? ' H' : ''}`), overlap: overlapPairs(A), spot: A.spotDisp, floor: A.floorDisp, noObject: A.noObject }); await p.screenshot({ path: `${OUT}/c4-${w}-y${y}.png` }); }
    // CTA terlihat: tiap tombol babak 1 pernah op1 & penuh di viewport
    const ctaSeen = a0.btns.map((bt, k) => rows.some((r) => { const m = r.btns[k].match(/:(-?\d+)\.\.(-?\d+) op([\d.]+)( H)?/); return m && +m[1] >= 0 && +m[2] <= h && +m[3] === 1 && !m[4]; }));
    // urutan teks
    const order = a0.acts.every((a, i) => i === 0 || (a && a0.acts[i - 1] && a.top >= a0.acts[i - 1].bottom - 2));
    const anyOverlap = rows.filter((r) => r.overlap.length);
    const allOp1 = a0.acts.every((a) => a && a.op === 1 && !a.hidden);
    // Tab keyboard
    await to(p, 0); await p.evaluate(() => document.activeElement?.blur());
    await p.locator('body').click({ position: { x: 2, y: 2 } }).catch(() => {});
    await to(p, 0);
    const foc = [];
    for (let k = 0; k < 25; k++) {
      await p.keyboard.press('Tab'); await p.waitForTimeout(350);
      const f = await p.evaluate(() => { const e = document.activeElement; if (!e || e === document.body) return null; const inHero = !!e.closest('#beranda'); const r = e.getBoundingClientRect(); let o = 1, hid = false; for (let n = e; n; n = n.parentElement) { const cs = getComputedStyle(n); o *= +cs.opacity; if (cs.visibility === 'hidden' || cs.display === 'none') hid = true; } const cx = (r.left + r.right) / 2, cy = (r.top + r.bottom) / 2; const hit = document.elementFromPoint(cx, cy); const covered = !(hit && (hit === e || e.contains(hit))); return { covered, hitTag: covered && hit ? hit.className?.toString().slice(0, 30) : null, t: (e.textContent || e.getAttribute('aria-label') || e.tagName).trim().slice(0, 28), inHero, top: Math.round(r.top), bottom: Math.round(r.bottom), left: Math.round(r.left), right: Math.round(r.right), op: +o.toFixed(2), hid, vh: innerHeight, vw: innerWidth }; });
      if (!f) continue; if (f.inHero) { f.ok = !f.covered && !f.hid && f.op >= 0.99 && f.top >= 0 && f.bottom <= f.vh && f.left >= 0 && f.right <= f.vw; foc.push(f); if (!f.ok) await p.screenshot({ path: `${OUT}/c4-${w}-tab-${k}.png` }); }
      else if (foc.length) break;
    }
    R.c4[`${w}x${h}`] = { pinned: a0.pinned, secH: a0.secH, acts0: a0.acts, ctaSeen, btnNames: a0.btns.map((x) => x.t), order, allOp1, overlapRows: anyOverlap.length, rows, focus: foc, focusFail: foc.filter((f) => !f.ok).length };
    console.log(`c4 ${w}x${h}`, JSON.stringify({ pinned: a0.pinned, secH: a0.secH, acts0: a0.acts, btns: a0.btns.map((x) => x.t), ctaSeen, order, allOp1, overlapRows: anyOverlap.length, spot: rows[0].spot, floor: rows[0].floor, focusN: foc.length, focusFail: foc.filter((f) => !f.ok) }));
    await p.context().close();
  }
}

if (only.includes('5')) {
  const ctx = await b.newContext({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 1 });
  const p = await ctx.newPage(); hook(p, 'c5');
  await p.goto(URL, { waitUntil: 'load' }); await p.mouse.move(40, 40); await p.waitForTimeout(6000);
  const seq = [[375, 812], [812, 375], [375, 812], [1280, 800], [667, 375], [1280, 800], [1280, 480], [1280, 800]];
  R.c5 = [];
  for (const [w, h] of seq) {
    await p.setViewportSize({ width: w, height: h }); await p.waitForTimeout(1800);
    await to(p, 0); await p.waitForTimeout(800);
    const A0 = await acts(p);
    const row = { vp: `${w}x${h}`, pinned: A0.pinned, is3d: A0.is3d, canvas: A0.canvas, noObject: A0.noObject, spot: A0.spotDisp, floor: A0.floorDisp, b1: A0.acts.map((a) => a.op), b1overlap: overlapPairs(A0) };
    if (h > 500) {
      for (const [lab, f] of [['b2', 0.53], ['b3', 0.92]]) {
        const y = Math.round(A0.spacerTop + (A0.spacerH - h) * f); await to(p, y); await p.waitForTimeout(600);
        const A = await acts(p); const ops = A.acts.map((a) => a.op);
        const want = lab === 'b2' ? 1 : 2; const top = ops.indexOf(Math.max(...ops));
        row[lab] = { y, ops, step: A.step, dataStep: A.dataStep, ok: top === want && ops[want] >= 0.9 && overlapPairs(A).length === 0, overlap: overlapPairs(A) };
        await p.screenshot({ path: `${OUT}/c5-${w}x${h}-${lab}-${R.c5.length}.png` });
      }
      await to(p, 0); await p.waitForTimeout(1500); const F0 = await acts(p); await p.waitForTimeout(700); const F1 = await acts(p);
      row.framesAdv = F0.frames != null ? F1.frames - F0.frames : null; row.is3dAfter = F1.is3d; row.canvasAfter = F1.canvas; row.noObjectAfter = F1.noObject; row.spotAfter = F1.spotDisp; row.floorAfter = F1.floorDisp;
      row.ok = row.b2.ok && row.b3.ok && F1.is3d && F1.canvas && F1.canvas[0] > 0 && F1.canvas[1] > 0 && !F1.noObject && F1.spotDisp !== 'none' && F1.floorDisp !== 'none' && A0.pinned;
    } else {
      row.static = A0.acts.map((a) => `${a.top}..${a.bottom} op${a.op}`);
      row.ok = !A0.pinned && A0.acts.every((a) => a.op === 1 && !a.hidden) && overlapPairs(A0).length === 0 && A0.spotDisp === 'none' && A0.floorDisp === 'none';
    }
    await p.screenshot({ path: `${OUT}/c5-${w}x${h}-b1-${R.c5.length}.png` });
    R.c5.push(row); console.log('c5', JSON.stringify(row));
  }
  await ctx.close();
}
R.errors = errs; console.log('errors', errs.length, JSON.stringify(errs.slice(0, 10)));
fs.writeFileSync(`${OUT}/result.json`, JSON.stringify(R, null, 2));
await b.close();
