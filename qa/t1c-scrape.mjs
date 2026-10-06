// T1c: scrape teks mentah halaman resmi agrinaspalma.co.id (career, procurement, news, beranda bagian bisnis/keterbukaan)
import { chromium } from 'playwright-core';
import fs from 'node:fs';
const pages = ['/', '/career', '/procurement', '/news'];
const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const out = {};
for (const p of pages) {
  const page = await ctx.newPage();
  await page.goto('https://agrinaspalma.co.id' + p, { waitUntil: 'networkidle', timeout: 60000 }).catch(e => console.log('goto', p, e.message));
  // scroll to trigger lazy content
  for (let y = 0; y < 20000; y += 700) { await page.evaluate(y => window.scrollTo(0, y), y); await page.waitForTimeout(120); }
  await page.waitForTimeout(1500);
  const data = await page.evaluate(() => {
    const links = [...document.querySelectorAll('a[href]')].map(a => [a.innerText.trim().replace(/\s+/g, ' '), a.href]).filter(x => x[0] || x[1]);
    const imgs = [...document.querySelectorAll('img')].map(i => [i.currentSrc || i.src, i.alt]);
    return { text: document.body.innerText, links, imgs };
  });
  out[p] = data;
  await page.close();
}
fs.writeFileSync(process.argv[2] || 'scrape.json', JSON.stringify(out, null, 1));
await browser.close();
console.log('ok');
