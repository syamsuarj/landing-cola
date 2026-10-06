// QA T2 visual: ulang satu anchor (cache kosong). node qa/t2v-anchor1.mjs W H #id. Bukan kode produksi.
import { chromium } from 'playwright-core';
const [W,H]=[+process.argv[2],+process.argv[3]], href=process.argv[4];
const b = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
const ctx = await b.newContext({ viewport:{width:W,height:H} }); const p=await ctx.newPage();
await p.goto('http://127.0.0.1:4410/',{waitUntil:'load'}); await p.waitForTimeout(1200);
const mb=p.locator('.menu-btn'); if (await mb.isVisible()) { await mb.click(); await p.waitForTimeout(600); await p.locator(`#nav-utama a[href="${href}"]`).click(); } else await p.evaluate(h=>document.querySelector(`#nav-utama a[href="${h}"]`).click(), href);
const tl=[]; let last=-1,st=Date.now(),t0=Date.now(); while(Date.now()-t0<12000){const y=await p.evaluate(()=>Math.round(scrollY)); tl.push(y); if(y!==last){last=y;st=Date.now();} else if(Date.now()-st>1000) break; await p.waitForTimeout(100);}
const m=await p.evaluate(h=>({top:Math.round(document.querySelector(h).getBoundingClientRect().top), sh:document.documentElement.scrollHeight, y:Math.round(scrollY), max:document.documentElement.scrollHeight-innerHeight}),href);
await p.screenshot({path:`qa/out/t2-visual/anchor-${W}-${href.slice(1)}.png`});
console.log(W,href,JSON.stringify(m),'tl',tl.filter((v,i)=>i%5==0).join(','));
await b.close();
