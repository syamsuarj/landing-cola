// Probe V0: meniru scanVisibility harness (langkah 0.5vh / 350ms) dan mencatat opacity + posisi langkah #kemitraan.
import { chromium as C } from 'playwright-core';
const chromium = { launch: () => C.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true }) };
const URL = process.env.URL || 'http://127.0.0.1:4430/';
const noGL = () => {
  const orig = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (t, ...r) { if (/webgl|webgpu/i.test(String(t))) return null; return orig.call(this, t, ...r); };
  try { Object.defineProperty(window, 'WebGLRenderingContext', { value: undefined }); Object.defineProperty(window, 'WebGL2RenderingContext', { value: undefined }); } catch {}
};
const modes = (process.env.MODES || 'webgl,no-webgl').split(',');
const widths = (process.env.WIDTHS || '375,1280').split(',').map(Number);
const b = await chromium.launch();
for (const m of modes) for (const w of widths) {
  const ctx = await b.newContext({ viewport: { width: w, height: w < 800 ? 812 : 900 } });
  if (m === 'no-webgl') await ctx.addInitScript(noGL);
  const p = await ctx.newPage();
  await p.goto(URL, { waitUntil: 'load' });
  await p.waitForTimeout(1200);
  await p.evaluate(() => scrollTo(0, 0));
  await p.waitForTimeout(750);
  const log = [];
  const seen = new Set();
  for (let i = 0; i < 600; i++) {
    const s = await p.evaluate(() => { scrollBy(0, Math.max(100, Math.round(innerHeight * .5))); return { y: scrollY, end: scrollY + innerHeight >= document.documentElement.scrollHeight - 2 }; });
    await p.waitForTimeout(350);
    const r = await p.evaluate(() => {
      const fl = document.querySelector('[data-km-flow]');
      const st = [...document.querySelectorAll('[data-km-step]')].map((li) => { const r = li.getBoundingClientRect(); return [Math.round(r.top), +getComputedStyle(li).opacity.slice(0, 4)]; });
      const fr = fl.getBoundingClientRect();
      return { y: scrollY, vh: innerHeight, flowTop: Math.round(fr.top), flowOp: getComputedStyle(fl).opacity, st };
    });
    if (r.flowTop < r.vh + 300 && r.flowTop + 600 > 0) log.push(r);
    r.st.forEach(([t, o], k) => { if (t > 0 && t < r.vh && o >= .1) seen.add(k + 1); });
    if (s.end) break;
  }
  console.log(`== ${m}@${w} steps seen visible: [${[...seen].sort((a, b) => a - b)}]`);
  for (const r of log) console.log(`  y=${r.y} flowTop=${r.flowTop} flowOp=${r.flowOp} ` + r.st.map(([t, o]) => `${t}:${o}`).join(' '));
  await ctx.close();
}
await b.close();
