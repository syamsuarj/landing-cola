// T1c: scrape detail (annual report, keterbukaan, berita detail)
import { chromium } from 'playwright-core';
import fs from 'node:fs';
const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const out = {};
const page = await ctx.newPage();
await page.goto('https://agrinaspalma.co.id/', { waitUntil: 'networkidle', timeout: 60000 });
for (let y = 0; y < 20000; y += 700) { await page.evaluate(y => window.scrollTo(0, y), y); await page.waitForTimeout(100); }
await page.waitForTimeout(1500);
out.home = await page.evaluate(() => {
  const g = id => { const e = document.getElementById(id); return e ? { text: e.innerText, html: e.outerHTML.slice(0, 30000) } : null; };
  return { ar: g('annual-report'), ki: g('keterbukaan-informasi'), kem: g('kemitraan'), biz: g('business') };
});
const news = [
  'https://agrinaspalma.co.id/news/Dukung%20E20,%20Agrinas%20Palma%20dan%20IPB%20University%20Kembangkan%20Bioetanol%20Multifeedstock',
  'https://agrinaspalma.co.id/news/Agrinas%20Palma%20Perkuat%20Tata%20Kelola%20dan%20Integritas%20Pengambilan%20Keputusan%20Bersama%20KPK',
  'https://agrinaspalma.co.id/news/agrinas-palma-dan-ombudsman-ri-bahas-pencegahan-maladministrasi-dan-tata-kelola-perusahaan',
  'https://agrinaspalma.co.id/news/agrinas-palma-dan-pertamina-bahas-pengembangan-bioenergi-bersama-wakil-menteri-investasi-dan-hilirisasi',
];
out.news = [];
for (const u of news) {
  await page.goto(u, { waitUntil: 'networkidle', timeout: 60000 }).catch(e => console.log(e.message));
  await page.waitForTimeout(1000);
  out.news.push(await page.evaluate(() => ({ url: location.href, text: document.querySelector('main')?.innerText || document.body.innerText, og: document.querySelector('meta[property="og:image"]')?.content, desc: document.querySelector('meta[name="description"]')?.content })));
}
fs.writeFileSync(process.argv[2], JSON.stringify(out, null, 1));
await browser.close();
console.log('ok');
