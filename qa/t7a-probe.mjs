import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
const p = await (await b.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
await p.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
await p.mouse.move(600, 400);
await p.waitForFunction(() => window.__hero3d?.scene, null, { timeout: 20000 });
console.log(await p.evaluate(async () => {
  const { scene } = window.__hero3d; const THREE = await import('/node_modules/.vite/deps/three.js').catch(() => null);
  const isl = scene.children.find((c) => c.type === 'Group');
  return isl.children.filter((c) => c.type === 'Group').map((g) => {
    const s = g.scale.x; const m = { min: [1e9, 1e9, 1e9], max: [-1e9, -1e9, -1e9] };
    g.traverse((o) => { if (o.geometry) { o.geometry.computeBoundingBox(); const bb = o.geometry.boundingBox; for (let i = 0; i < 3; i++) { m.min[i] = Math.min(m.min[i], bb.min.getComponent(i)); m.max[i] = Math.max(m.max[i], bb.max.getComponent(i)); } } });
    return { s: s.toFixed(2), min: m.min.map((v) => v.toFixed(2)), max: m.max.map((v) => v.toFixed(2)) };
  });
}));
await b.close();
