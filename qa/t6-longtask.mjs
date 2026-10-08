// Probe X3 (T6): muat halaman seperti Lighthouse mobile (412x823, CPU throttle 4×), catat long task
// (PerformanceObserver) + CPU profile 10 s pertama; agregasi self-time per fungsi. URL env (default :4460), REPS (3).
import { chromium } from 'playwright-core';
const URL = process.env.URL || 'http://127.0.0.1:4460/';
const REPS = +(process.env.REPS || 3);
const WAIT = +(process.env.WAIT || 10000);
const b = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
for (let rep = 1; rep <= REPS; rep++) {
  const ctx = await b.newContext({ viewport: { width: 412, height: 823 }, deviceScaleFactor: 1.75, isMobile: true, hasTouch: true });
  await ctx.addInitScript(() => {
    window.__lt = [];
    new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__lt.push([Math.round(e.startTime), Math.round(e.duration), (e.attribution?.[0]?.containerSrc) || '']); }).observe({ type: 'longtask', buffered: true });
  });
  const p = await ctx.newPage();
  const c = await ctx.newCDPSession(p);
  await c.send('Emulation.setCPUThrottlingRate', { rate: +(process.env.THROTTLE || 4) });
  await c.send('Profiler.enable');
  await c.send('Profiler.setSamplingInterval', { interval: 500 });
  await c.send('Profiler.start');
  await p.goto(URL, { waitUntil: 'load', timeout: 60000 });
  await p.waitForTimeout(WAIT);
  const { profile } = await c.send('Profiler.stop');
  const lt = await p.evaluate(() => window.__lt);
  const marks = await p.evaluate(() => ({ is3d: document.getElementById('hero-art')?.classList.contains('is-3d'), st: (window.ScrollTrigger?.getAll?.() || []).length }));
  // self time per node
  const byId = new Map(profile.nodes.map((n) => [n.id, n]));
  const self = new Map();
  const dts = profile.timeDeltas;
  profile.samples.forEach((id, i) => { const n = byId.get(id); const f = n.callFrame; const k = `${f.functionName || '(anon)'} ${f.url.split('/').pop()}:${f.lineNumber}`; self.set(k, (self.get(k) || 0) + (dts[i] || 0) / 1000); });
  // total per script url
  const byUrl = new Map();
  profile.samples.forEach((id, i) => { const u = byId.get(id).callFrame.url.split('/').pop() || byId.get(id).callFrame.functionName; byUrl.set(u, (byUrl.get(u) || 0) + (dts[i] || 0) / 1000); });
  const mk = await p.evaluate(() => performance.getEntriesByType('mark').map((m) => m.name.replace('[DEBUG-x3] ', '') + '@' + Math.round(m.startTime)).join(' ')); console.log('  marks', mk);
  console.log(`== rep${rep} hero3d=${marks.is3d} longtasks(ms @start:dur): ${lt.map((x) => x[0] + ':' + x[1]).join(' ')}`);
  console.log('  self-time by url:', [...byUrl].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k, v]) => `${k}=${Math.round(v)}`).join(', '));
  console.log('  top fns:', [...self].sort((a, b) => b[1] - a[1]).filter(([k]) => !/^\((idle|program|garbage)/.test(k)).slice(0, 12).map(([k, v]) => `${k}=${Math.round(v)}`).join(' | '));
  await ctx.close();
}
await b.close();
