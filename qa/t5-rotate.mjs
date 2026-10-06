// QA T5 regresi (c): resize/rotasi di TENGAH pin (hero, filosofi, milestones) + section biasa.
// Skenario 1: 375x812 → 812x375 → 375x812. Skenario 2: 1280x800 → 375x812 → 1280x800.
// Cek: section di tengah viewport (elementFromPoint) tetap sama setelah tiap resize.
// node qa/t5-rotate.mjs   PORT env (default 4450). Bukan kode produksi.
import { chromium } from 'playwright-core';
const PORT = process.env.PORT || 4450;
const b = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
const scen = [[[375, 812], [812, 375], [375, 812]], [[1280, 800], [375, 812], [1280, 800]]];
let fails = 0;
for (const seq of scen) {
  const ctx = await b.newContext({ viewport: { width: seq[0][0], height: seq[0][1] } });
  const p = await ctx.newPage();
  await p.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'load' }); await p.waitForTimeout(1500);
  for (const [id, frac] of [['filosofi', 0.3], ['filosofi', 0.7], ['kepemimpinan', 0.5]]) {
    await p.setViewportSize({ width: seq[0][0], height: seq[0][1] }); await p.waitForTimeout(1200);
    const ok0 = await p.evaluate(({ id, frac }) => {
      const el = document.getElementById(id); if (!el) return null;
      // pin-spacer (jika ada) menentukan rentang scroll
      const box = (el.parentElement?.classList.contains('pin-spacer') ? el.parentElement : el);
      const top = box.getBoundingClientRect().top + scrollY; const h = box.offsetHeight;
      document.documentElement.style.scrollBehavior = 'auto';
      scrollTo(0, top + Math.max(0, h - innerHeight) * frac); document.documentElement.style.scrollBehavior = '';
      return { top: Math.round(top), h };
    }, { id, frac });
    if (!ok0) { console.log('NO SECTION', id); continue; }
    await p.waitForTimeout(1000);
    const where = () => p.evaluate(() => {
      const e = document.elementFromPoint(innerWidth / 2, innerHeight / 2); const s = e?.closest('main > section, body > footer, section[id]');
      return { sec: s?.id || e?.tagName, y: Math.round(scrollY) };
    });
    const res = [await where()];
    for (const [w, h] of seq.slice(1)) { await p.setViewportSize({ width: w, height: h }); await p.waitForTimeout(1500); res.push(await where()); }
    const ok = res.every((r) => r.sec === res[0].sec) && res[0].sec === id;
    if (!ok) fails++;
    console.log(ok ? 'PASS' : 'FAIL', seq.map((v) => v.join('x')).join('→'), `${id}@${frac}`, JSON.stringify(ok0), res.map((r) => `${r.sec}(y${r.y})`).join(' → '));
  }
  await ctx.close();
}
await b.close();
console.log(fails ? `FAILS ${fails}` : 'ALL PASS');
