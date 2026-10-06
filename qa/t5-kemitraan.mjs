// QA T5 regresi (d): langkah IPS 01–08 #kemitraan terlihat saat scroll biasa & cepat (mouse wheel nyata).
// Per langkah: opacity maks yang tercapai SELAMA langkah berada di viewport (di bawah header). Lulus jika ≥0,9 semua.
// Plus status akhir setelah berhenti. node qa/t5-kemitraan.mjs WxH   PORT env (default 4450). Bukan kode produksi.
import { chromium } from 'playwright-core';
const [W, H] = process.argv[2].split('x').map(Number);
const PORT = process.env.PORT || 4450;
const b = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
let fails = 0;
for (const [mode, dy, dt] of [['biasa', 100, 50], ['harness-0.5vh/350ms', 0, 350], ['cepat', 200, 50], ['kilat(hanya cek akhir)', 900, 30]]) {
  const ctx = await b.newContext({ viewport: { width: W, height: H } });
  const p = await ctx.newPage();
  await p.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'load' }); await p.waitForTimeout(1200);
  const range = await p.evaluate(() => {
    const s = document.getElementById('kemitraan'); const top = s.getBoundingClientRect().top + scrollY;
    document.documentElement.style.scrollBehavior = 'auto'; scrollTo(0, top - innerHeight * 1.2); document.documentElement.style.scrollBehavior = '';
    return { start: Math.round(top - innerHeight * 1.2), end: Math.round(top + s.offsetHeight) };
  });
  await p.waitForTimeout(800);
  await p.mouse.move(W / 2, H / 2);
  const best = Array(8).fill(0), seen = Array(8).fill(0);
  const sample = async () => {
    const r = await p.evaluate(() => { const hh = document.getElementById('top').offsetHeight;
      return [...document.querySelectorAll('#kemitraan [data-km-step]')].map((e) => { const b = e.getBoundingClientRect(); return { inV: b.bottom > hh && b.top < innerHeight, op: +getComputedStyle(e).opacity * +getComputedStyle(e.closest('[data-km-flow]')).opacity }; }); });
    r.forEach((x, i) => { if (x.inV) { seen[i]++; best[i] = Math.max(best[i], x.op); } });
  };
  let y = range.start;
  while (y < range.end) { await p.mouse.wheel(0, dy || Math.round(H / 2)); await p.waitForTimeout(dt); await sample(); y = await p.evaluate(() => scrollY); }
  // berhenti dengan langkah di tengah layar
  await p.evaluate(() => { const st = document.querySelectorAll('#kemitraan [data-km-step]'); document.documentElement.style.scrollBehavior = 'auto'; st[4].scrollIntoView({ block: 'center' }); });
  await p.waitForTimeout(1200);
  const endOp = await p.evaluate(() => [...document.querySelectorAll('#kemitraan [data-km-step]')].map((e) => +(+getComputedStyle(e).opacity).toFixed(2)));
  const ok = (mode.startsWith('kilat') || best.every((o, i) => seen[i] === 0 ? false : o >= 0.9)) && endOp.every((o) => o === 1);
  if (!ok) fails++;
  console.log(ok ? 'PASS' : 'FAIL', `${W}x${H}`, mode, `${dy}px/${dt}ms`, JSON.stringify({ bestWhileInView: best.map((o) => +o.toFixed(2)), samplesInView: seen, endOp }));
  if (mode === 'cepat') await p.locator('#kemitraan [data-km-flow]').screenshot({ path: `qa/out-t5x/kemitraan-${W}.png` });
  await ctx.close();
}
await b.close();
console.log(fails ? `FAILS ${fails}` : 'ALL PASS');
