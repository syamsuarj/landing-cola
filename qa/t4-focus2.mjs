// QA T4 (V3): fokus elemen tepat sebelum `sel` dalam urutan Tab nyata, Tab, lalu cek elemen terfokus di viewport
// (sampel 0–2 s). node qa/t4-focus2.mjs W H sel. PORT env (default 4440). Bukan kode produksi.
import { chromium } from 'playwright-core';
const [W, H, sel] = [+process.argv[2], +process.argv[3], process.argv[4]];
const b = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
const p = await (await b.newContext({ viewport: { width: W, height: H } })).newPage();
await p.goto(`http://127.0.0.1:${process.env.PORT || 4440}/`, { waitUntil: 'load' }); await p.waitForTimeout(1200);
const prev = await p.evaluate((s) => {
  const vis = (e) => e.tabIndex >= 0 && !e.closest('[inert],[aria-hidden="true"]') && e.getClientRects().length && getComputedStyle(e).visibility !== 'hidden';
  const all = [...document.querySelectorAll('a[href],button,[tabindex],input,summary')].filter(vis);
  const i = all.indexOf(document.querySelector(s)); const e = all[i - 1]; e.focus();
  return { i, prev: e.outerHTML.slice(0, 90), focused: document.activeElement === e };
}, sel);
console.log('prev', JSON.stringify(prev));
await p.waitForTimeout(800); await p.keyboard.press('Tab');
const samples = [];
for (const t of [100, 400, 900, 1500, 2200]) {
  await p.waitForTimeout(t - (samples.at(-1)?.t || 0));
  samples.push({ t, ...(await p.evaluate(() => { const a = document.activeElement; const r = a.getBoundingClientRect(); const hh = document.getElementById('top').offsetHeight; return { href: a.getAttribute('href'), r: [Math.round(r.top), Math.round(r.bottom)], y: Math.round(scrollY), inView: r.top >= hh - 2 && r.bottom <= innerHeight, op: getComputedStyle(a).opacity }; })) });
}
const last = samples.at(-1);
console.log(last.inView && last.href === sel.match(/"(.*)"/)?.[1] ? 'PASS' : 'FAIL', W, sel, samples.map((s) => `${s.t}ms:${s.href} r${s.r} y${s.y} ${s.inView ? 'in' : 'OUT'}`).join(' | '));
await p.screenshot({ path: `qa/out/t2-visual/t4-focus-${W}-${sel.replace(/\W/g, '')}.png` });
await b.close();
