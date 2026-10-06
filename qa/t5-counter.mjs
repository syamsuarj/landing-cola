// QA T5 regresi (a): counter #angka — mulai dari 0, naik, nilai akhir = data-ag-final, tinggi kartu & lebar angka
// konstan selama animasi, ::after tak terlihat/tak menambah tinggi, tidak ada overflow horizontal. + screenshot.
// node qa/t5-counter.mjs WxH   PORT env (default 4450). Bukan kode produksi.
import { chromium } from 'playwright-core';
const [W, H] = process.argv[2].split('x').map(Number);
const PORT = process.env.PORT || 4450;
const b = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
const ctx = await b.newContext({ viewport: { width: W, height: H } });
const p = await ctx.newPage();
await p.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'load' }); await p.waitForTimeout(1200);
const snap = () => p.evaluate(() => [...document.querySelectorAll('#angka .ag-num')].map((n) => {
  const li = n.closest('li'); const r = n.getBoundingClientRect(); const a = getComputedStyle(n, '::after');
  return { t: n.textContent.trim(), fin: n.dataset.agFinal ?? null, w: Math.round(r.width), h: Math.round(r.height), li: Math.round(li.getBoundingClientRect().height),
    disp: getComputedStyle(n).display, aVis: a.visibility, aH: a.height, aC: a.content };
}));
// sebelum terlihat: lompat ke 1,5 layar di atas #angka
await p.evaluate(() => { const y = document.getElementById('angka').getBoundingClientRect().top + scrollY - innerHeight * 1.5; document.documentElement.style.scrollBehavior = 'auto'; scrollTo(0, y); });
await p.waitForTimeout(600);
const pre = await snap();
// per kartu: scroll kartu ke tengah (instan) lalu sampel 0–2,5 s kartu tsb
const n = pre.length; const samples = Array.from({ length: n }, () => []); let fin = [];
for (let i = 0; i < n; i++) {
  await p.evaluate((i) => { const li = document.querySelectorAll('#angka .ag-num')[i].closest('li'); scrollTo(0, li.getBoundingClientRect().top + scrollY - innerHeight / 2 + li.offsetHeight / 2); }, i);
  for (let k = 0; k < 25; k++) { samples[i].push((await snap())[i]); await p.waitForTimeout(100); if (i === 1 && k === 3) await p.screenshot({ path: `qa/out-t5x/counter-${W}-mid.png` }); }
}
await p.waitForTimeout(800);
fin = await snap();
await p.locator('#angka').screenshot({ path: `qa/out-t5x/counter-${W}-end.png` });
const ov = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
let fails = 0;
fin.forEach((f, i) => {
  const seq = samples[i].map((s) => s.t);
  const uniq = [...new Set(seq)];
  const ws = [...new Set(samples[i].map((s) => s.w))], lis = [...new Set(samples[i].map((s) => s.li).concat(fin[i].li))];
  const animated = f.fin === null ? true : (uniq.length >= 3 || /^0([.,]0+)?$/.test(pre[i].t));
  const startsZero = f.fin === null ? 'static' : /^0([.,]0+)?$/.test(pre[i].t) || /^0/.test(seq[0]);
  const ok = (f.fin === null || f.t === f.fin) && animated && lis.length === 1 && ws.length === 1 && (f.fin === null ? f.aC === 'none' : (f.aVis === 'hidden' && f.aH === '0px'));
  if (!ok) fails++;
  console.log(ok ? 'PASS' : 'FAIL', `${W}x${H}`, `#${i}`, JSON.stringify({ pre: pre[i].t, startsZero, seq: uniq.slice(0, 8), n: uniq.length, end: f.t, fin: f.fin, widths: ws, liH: lis, disp: f.disp, after: [f.aVis, f.aH, f.aC] }));
});
console.log('overflowX', ov, fails ? `FAILS ${fails}` : 'ALL PASS');
await b.close();
