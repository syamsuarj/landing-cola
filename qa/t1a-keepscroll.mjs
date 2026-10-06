// T1a: cek keep-scroll lintas breakpoint (W3). Bukan kode produksi.
import { chromium } from 'playwright-core';
const url = process.argv[2] || 'http://127.0.0.1:3001/';
const b = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
const page = await b.newPage({ viewport: { width: 1280, height: 800 } });
await page.goto(url, { waitUntil: 'networkidle' });
const probe = (id) => page.evaluate((id) => Math.round(document.getElementById(id).getBoundingClientRect().top), id);
for (const id of ['visi-misi', 'kemitraan']) {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.evaluate((id) => document.getElementById(id).scrollIntoView({ behavior: 'instant' }), id); await page.waitForTimeout(2000);
  const before = await probe(id);
  await page.setViewportSize({ width: 375, height: 812 }); await page.waitForTimeout(1500);
  const after = await probe(id);
  await page.setViewportSize({ width: 1280, height: 800 }); await page.waitForTimeout(1500);
  const back = await probe(id);
  console.log(id, 'top 1280:', before, '→375:', after, '→1280:', back);
}
await b.close();
