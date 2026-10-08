// Shot preview T7b: node qa/t7b-preview/shot.mjs  (butuh out.js hasil esbuild)
import { chromium } from 'playwright-core';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const dir = path.dirname(fileURLToPath(import.meta.url));
const b = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, args: ['--use-angle=metal', '--enable-gpu'] });
const p = await b.newPage({ viewport: { width: 1200, height: 800 } });
const errs = [];
p.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
p.on('pageerror', (e) => errs.push(String(e)));
const views = process.argv.slice(2).length ? process.argv.slice(2) : ['wide:high', 'tree:high', 'trunk:high', 'ffb:high', 'wide:low'];
for (const v of views) {
  const [view, q] = v.split(':');
  await p.goto(`file://${dir}/index.html?view=${view}&q=${q}`);
  await p.waitForFunction(() => document.title === 'ready', null, { timeout: 30000 });
  const out = `${dir}/shots/${view}-${q}.png`;
  await p.locator('canvas').screenshot({ path: out });
  const stats = await p.evaluate(() => window.__stats);
  console.log(v, out, JSON.stringify(stats));
  if (v === views[0]) console.log('dispose->geometries', await p.evaluate(() => window.__dispose()));
}
console.log('errors', errs);
await b.close();
