// QA T2 visual: reliabilitas buka menu mobile segera setelah load (cache kosong). Bukan kode produksi.
import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
for (let i=0;i<5;i++){ const ctx=await b.newContext({viewport:{width:375,height:812}}); const p=await ctx.newPage();
await p.goto('http://127.0.0.1:4410/',{waitUntil:'load'}); await p.waitForTimeout(1200); await p.locator('.menu-btn').click(); await p.waitForTimeout(700);
const r=await p.evaluate(()=>{const a=document.querySelector('#nav-utama a[href="#berita"]'); const rc=a.getBoundingClientRect(); const n=document.getElementById('nav-utama'); return {exp:document.querySelector('.menu-btn').getAttribute('aria-expanded'), html:document.documentElement.className, rc:[Math.round(rc.top),Math.round(rc.height)], vis:getComputedStyle(n).visibility, op:getComputedStyle(n).opacity, disp:getComputedStyle(n).display}});
console.log(i, JSON.stringify(r)); if(r.exp!=='true') await p.screenshot({path:`qa/out/t2-visual/menu-fail-${i}.png`}); await ctx.close(); }
await b.close();
