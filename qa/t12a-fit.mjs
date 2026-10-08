// T12a (Programmer A): proyeksi NDC verteks diorama 3D per frame (orbit idle) babak 1–3 → |ndc| maks harus < 1 (tak terpotong).
// Butuh dev server (hook window.__hero3d). URL=http://localhost:3000/ node qa/t12a-fit.mjs
import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });
const sizes = (process.env.SIZES || '1280x800,1440x900,1920x1080,768x1024,375x812').split(',').map((s) => s.split('x').map(Number));
let worst = 0;
for (const [w, h] of sizes) {
  const p = await (await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 })).newPage();
  await p.goto(process.env.URL || 'http://localhost:3000/', { waitUntil: 'load' });
  await p.mouse.move(w / 2, h / 2);
  await p.waitForFunction(() => window.__hero3d && document.getElementById('hero-art')?.classList.contains('is-3d'), null, { timeout: 15e3 });
  const out = [];
  for (const [act, frac] of [[1, 0], [2, 0.5], [3, 1]]) {
    await p.evaluate((f) => { const s = document.querySelector('[data-hero-scene]').parentElement; const tot = s.classList.contains('pin-spacer') ? s.offsetHeight - innerHeight : 0; document.documentElement.style.scrollBehavior = 'auto'; scrollTo(0, Math.round(tot * f)); }, frac);
    await p.waitForTimeout(1800);
    for (let i = 0; i < 5; i++) {
      out.push(await p.evaluate((act) => {
        const { scene, camera, stats } = window.__hero3d; let mx = 0, my = 0;
        const v = new camera.position.constructor();
        scene.traverse((o) => {
          if (!o.isMesh || !o.geometry?.attributes.position || o.material?.transparent) return;
          const pa = o.geometry.attributes.position; const n = o.isInstancedMesh ? o.count : 1;
          const m = o.matrixWorld.clone(), im = o.matrixWorld.clone();
          for (let k = 0; k < n; k++) {
            if (o.isInstancedMesh) { o.getMatrixAt(k, im); m.multiplyMatrices(o.matrixWorld, im); }
            for (let j = 0; j < pa.count; j += 4) { v.fromBufferAttribute(pa, j).applyMatrix4(m).project(camera); mx = Math.max(mx, Math.abs(v.x)); my = Math.max(my, Math.abs(v.y)); }
          }
        });
        return { act, mx: +mx.toFixed(3), my: +my.toFixed(3), R: +stats.fitR.toFixed(2), calls: stats.calls };
      }, act));
      await p.waitForTimeout(1100);
    }
  }
  const m = Math.max(...out.map((o) => Math.max(o.mx, o.my))); worst = Math.max(worst, m);
  console.log(`${w}x${h}`, 'maxNDC', m, 'R', out[0].R, 'calls', Math.max(...out.map((o) => o.calls)), JSON.stringify(out.map((o) => `${o.act}:${o.mx}/${o.my}`)));
  await p.context().close();
}
console.log('WORST', worst, worst < 0.97 ? 'PASS' : 'FAIL');
await b.close();
