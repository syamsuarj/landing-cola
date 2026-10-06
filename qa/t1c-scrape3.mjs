// T1c: ambil judul + link tiap slide annual report
import { chromium } from 'playwright-core';
const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await page.goto('https://agrinaspalma.co.id/#annual-report', { waitUntil: 'networkidle', timeout: 60000 });
await page.locator('#annual-report').scrollIntoViewIfNeeded();
await page.waitForTimeout(1500);
// tutup popup bila ada
await page.keyboard.press('Escape');
for (const i of [3,4,3]) {
  await page.locator(`#annual-report [role=tab]:nth-child(${i})`).click({ force: true });
  await page.waitForTimeout(3500);
  const r = await page.evaluate(() => {
    const s = document.querySelector('#annual-report');
    const h3 = [...s.querySelectorAll('h3')].map(h => h.closest('div').parentElement.innerText);
    const a = [...s.querySelectorAll('a[href]')].map(a => a.href);
    return { h3, a };
  });
  console.log(i, JSON.stringify(r));
}
await browser.close();
