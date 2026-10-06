import { chromium } from 'playwright-core';
const URL = process.argv[2] || 'http://localhost:3000/';
const out = 'out-t9-konten/';
const b = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
const res = {};
// JS OFF
{
  const ctx = await b.newContext({ javaScriptEnabled: false, viewport: { width: 1280, height: 800 } });
  const p = await ctx.newPage(); const reqs = [];
  await p.goto(URL, { waitUntil: 'load' });
  p.on('request', r => reqs.push(r.method() + ' ' + r.url()));
  const nav = []; p.on('framenavigated', f => { if (f === p.mainFrame()) nav.push(f.url()); });
  const btnDisabled = await p.$eval('#news-form button[type=submit]', e => e.disabled);
  const inputName = await p.$eval('#email', e => e.getAttribute('name'));
  const noscriptVisible = await p.evaluate(() => { const n=[...document.querySelectorAll('#news-form noscript, #news-form .news-msg')].map(e=>e.textContent.trim()).filter(Boolean); return n; });
  await p.fill('#email', 'tes@contoh.com');
  await p.press('#email', 'Enter'); await p.waitForTimeout(800);
  try { await p.click('#news-form button[type=submit]', { force: true, timeout: 1500 }); } catch (e) {}
  await p.waitForTimeout(800);
  // force submit via requestSubmit impossible w/o JS; try form.submit through CDP? JS disabled -> skip
  res.jsOff = { btnDisabled, inputName, noscriptVisible, urlAfter: p.url(), navs: nav, reqsAfter: reqs };
  await p.locator('#news-form').screenshot({ path: out + 'k8-nojs.png' });
  await ctx.close();
}
// JS ON
{
  const ctx = await b.newContext({ viewport: { width: 1280, height: 800 } });
  const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', e => errs.push(e.message)); p.on('console', m => m.type()==='error' && errs.push(m.text()));
  await p.goto(URL, { waitUntil: 'networkidle' });
  await p.locator('#news-form').scrollIntoViewIfNeeded(); await p.waitForTimeout(1500);
  const btnDisabled = await p.$eval('#news-form button[type=submit]', e => e.disabled);
  const nav = []; p.on('framenavigated', f => { if (f === p.mainFrame()) nav.push(f.url()); });
  const reqs = []; p.on('request', r => { if (r.method() !== 'GET' || r.url().includes('@')) reqs.push(r.method()+' '+r.url()); });
  await p.fill('#email', 'bukan-email'); await p.click('#news-form button[type=submit]'); await p.waitForTimeout(500);
  const msgInvalid = await p.textContent('#news-msg'); const ariaInv = await p.getAttribute('#email','aria-invalid');
  await p.fill('#email', ''); await p.click('#news-form button[type=submit]'); await p.waitForTimeout(500);
  const msgEmpty = await p.textContent('#news-msg');
  await p.fill('#email', 'tes@contoh.com'); await p.press('#email', 'Enter'); await p.waitForTimeout(500);
  const msgValid = await p.textContent('#news-msg');
  await p.locator('#news-form').screenshot({ path: out + 'k8-js-valid.png' });
  res.jsOn = { btnDisabledInitially: btnDisabled, msgInvalid, ariaInv, msgEmpty, msgValid, urlAfter: p.url(), navs: nav, nonGetOrEmailReqs: reqs, errs };
  // footer + botol screenshots
  for (const w of [1280, 375]) {
    await p.setViewportSize({ width: w, height: w === 375 ? 812 : 800 });
    const s = p.locator('#botol'); await s.scrollIntoViewIfNeeded(); await p.waitForTimeout(1500);
    const fig = p.locator('#botol figure').first(); await fig.scrollIntoViewIfNeeded(); await p.waitForTimeout(1200);
    await p.screenshot({ path: out + `botol-${w}.png` });
    res['botolImg'+w] = await p.$eval('#botol figure img', i => ({ src: i.currentSrc.split('/').pop(), w: i.naturalWidth, complete: i.complete, box: i.getBoundingClientRect().toJSON() }));
  }
  res.footerCredits = await p.$eval('footer', f => (f.innerText.match(/Foto oleh[\s\S]*?CREDITS\.md\./) || [''])[0]);
  res.footerLinks = await p.$$eval('footer a[href*="unsplash.com/photos"]', as => as.map(a => a.href.split('/').pop()));
  await ctx.close();
}
await b.close();
console.log(JSON.stringify(res, null, 1));
