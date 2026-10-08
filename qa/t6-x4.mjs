// Probe X4 (T6): meniru scanVisibility harness (langkah 0.5vh / 350 ms, effOpacity berantai) PERSIS,
// untuk mode webgl & no-webgl × 375 & 1280, diulang REPS kali. Melaporkan semua elemen tak pernah terlihat
// + jejak h4.kt-m-h (top, effOpacity per probe saat di viewport).
// URL env (default http://127.0.0.1:4460/), REPS (5), MODES, WIDTHS.
import { chromium } from 'playwright-core';
const URL = process.env.URL || 'http://127.0.0.1:4460/';
const REPS = +(process.env.REPS || 5);
const modes = (process.env.MODES || 'webgl,no-webgl').split(',');
const widths = (process.env.WIDTHS || '375,1280').split(',').map(Number);
const TRACE = process.env.TRACE || '.kt-m-h';
const noGL = () => {
  const orig = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (t, ...r) { if (/webgl|experimental-webgl|webgpu/i.test(String(t))) return null; return orig.call(this, t, ...r); };
  try { Object.defineProperty(window, 'WebGLRenderingContext', { value: undefined }); Object.defineProperty(window, 'WebGL2RenderingContext', { value: undefined }); } catch {}
  try { Object.defineProperty(navigator, 'gpu', { value: undefined }); } catch {}
};
const b = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
const FROM = process.env.FROM || ''; // mis. '#berita' → mulai scroll 1,5 vh sebelum section ini (lebih cepat)
const PAR = process.env.PAR !== '0'; // jalankan 4 konfigurasi paralel dalam 1 browser
let fails = 0, total = 0;
async function runOne(rep, m, w) {
  const ctx = await b.newContext({ viewport: { width: w, height: w < 800 ? 812 : 900 } });
  if (m === 'no-webgl') await ctx.addInitScript(noGL);
  const p = await ctx.newPage();
  if (+process.env.THROTTLE > 1) { const c = await ctx.newCDPSession(p); await c.send('Emulation.setCPUThrottlingRate', { rate: +process.env.THROTTLE }); }
  await p.goto(URL, { waitUntil: 'load', timeout: 60000 });
  await p.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});
  await p.waitForTimeout(800);
  await p.evaluate((TRACE) => {
    const cands = [];
    for (const el of document.body.querySelectorAll('*')) {
      if (el.closest('[aria-hidden="true"],script,style,noscript,template,.sr-only,astro-dev-toolbar')) continue;
      const ownText = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim().length > 1);
      const media = /^(IMG|VIDEO|SVG)$/i.test(el.tagName) && !el.parentElement.closest('svg');
      if (ownText || media) cands.push(el);
    }
    const st = cands.map(() => ({ seen: false, visible: false, minOp: 1 }));
    const effOpacity = (el) => { let o = 1; for (let a = el; a && a.nodeType === 1; a = a.parentElement) { const cs = getComputedStyle(a); if (cs.display === 'none') return -1; if (cs.visibility === 'hidden') return 0; o *= parseFloat(cs.opacity); } return o; };
    const tr = document.querySelector(TRACE); const trace = [];
    window.__qaScan = {
      probe() {
        const vh = innerHeight, vw = innerWidth;
        if (tr) { const r = tr.getBoundingClientRect(); if (r.bottom > 0 && r.top < vh) trace.push(`${Math.round(r.top)}:${effOpacity(tr).toFixed(2)}`); }
        cands.forEach((el, i) => {
          if (st[i].visible) return;
          const r = el.getBoundingClientRect();
          if (r.width < 2 || r.height < 2 || r.bottom <= 0 || r.top >= vh || r.right <= 0 || r.left >= vw) return;
          const o = effOpacity(el); if (o < 0) return;
          st[i].seen = true; st[i].minOp = Math.min(st[i].minOp, o);
          if (o >= 0.1) st[i].visible = true;
        });
      },
      result() {
        const hidden = [];
        cands.forEach((el, i) => { if (!st[i].seen || st[i].visible) return; const sec = el.closest('section,footer,header'); hidden.push(`${sec ? sec.id : '-'} ${el.tagName.toLowerCase()}.${[...el.classList].slice(0, 2).join('.')} "${(el.textContent || '').trim().slice(0, 30)}" op${st[i].minOp.toFixed(2)}`); });
        return { considered: st.filter((x) => x.seen).length, hidden, trace };
      },
    };
    scrollTo(0, 0);
  }, TRACE);
  if (FROM) await p.evaluate((sel) => { const el = document.querySelector(sel); const st = Math.max(100, Math.round(innerHeight * 0.5)); const y = el.getBoundingClientRect().top + scrollY - innerHeight * 1.5; scrollTo(0, Math.max(0, Math.floor(y / st) * st)); }, FROM);
  await p.waitForTimeout(750);
  await p.evaluate(() => window.__qaScan.probe());
  let last = -1;
  for (let i = 0; i < 600; i++) {
    const { y, atEnd } = await p.evaluate(() => { scrollBy(0, Math.max(100, Math.round(innerHeight * 0.5))); return { y: scrollY, atEnd: scrollY + innerHeight >= document.documentElement.scrollHeight - 2 }; });
    await p.waitForTimeout(350);
    await p.evaluate(() => window.__qaScan.probe());
    if (y === last && atEnd) break;
    last = y;
  }
  await p.waitForTimeout(1000);
  const r = await p.evaluate(() => { window.__qaScan.probe(); return window.__qaScan.result(); });
  total++; if (r.hidden.length) fails++;
  console.log(`rep${rep} ${m}@${w}: considered ${r.considered}, hidden ${r.hidden.length}${r.hidden.length ? ' → ' + r.hidden.join(' | ') : ''}\n    trace ${TRACE}: ${r.trace.join(' ')}`);
  await ctx.close();
}
for (let rep = 1; rep <= REPS; rep++) {
  const jobs = []; for (const m of modes) for (const w of widths) jobs.push([rep, m, w]);
  if (PAR) await Promise.all(jobs.map((j) => runOne(...j))); else for (const j of jobs) await runOne(...j);
}
await b.close();
console.log(`TOTAL runs ${total}, runs with hidden>0: ${fails}`);
process.exit(fails ? 1 : 0);
