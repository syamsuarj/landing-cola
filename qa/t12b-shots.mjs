// T12b: glow/bayangan HeroBackdrop di landscape pendek + 1280 b1/b2. Bukan kode produksi.
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
const QA=path.dirname(fileURLToPath(import.meta.url)); const OUT=path.join(QA,'out-t12b'); fs.mkdirSync(OUT,{recursive:true});
const URL='http://localhost:3000/'; const CHROME='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
setTimeout(()=>{console.error('timeout');process.exit(2)},150e3).unref();
const b=await chromium.launch({executablePath:CHROME,args:['--use-angle=metal','--enable-gpu','--ignore-gpu-blocklist']});
const info=(page)=>page.evaluate(()=>{const r=(s)=>{const e=document.querySelector(s);if(!e)return null;const q=e.getBoundingClientRect();const c=getComputedStyle(e);return {x:Math.round(q.x),y:Math.round(q.y),w:Math.round(q.width),h:Math.round(q.height),d:c.display,v:c.visibility};};return {art:r('#hero-art'),spot:r('[data-hero-backdrop] .spot'),floor:r('[data-hero-backdrop] .floor'),noobj:document.querySelector('[data-hero-backdrop]')?.hasAttribute('data-no-object')};});
for (const [w,h,mob] of [[812,375,true],[667,375,true],[1280,800,false]]) {
  const ctx=await b.newContext({viewport:{width:w,height:h},deviceScaleFactor:1,isMobile:mob,hasTouch:mob}); const page=await ctx.newPage();
  await page.goto(URL,{waitUntil:'load',timeout:45e3}); await page.waitForTimeout(2500);
  if (w===1280) {
    const p=await page.evaluate(()=>{const s=document.querySelector('[data-hero-scene]')||document.getElementById('beranda');const sp=s.closest('.pin-spacer');const t=(sp||s).getBoundingClientRect().top+scrollY;return {s:t,e:t+(sp?sp.offsetHeight-innerHeight:0)}});
    for (const [n,f] of [[1,0],[2,0.45]]) { await page.evaluate(y=>scrollTo({top:y,behavior:'instant'}),Math.round(p.s+f*(p.e-p.s))); await page.waitForTimeout(1800);
      await page.screenshot({path:path.join(OUT,`1280-b${n}.png`)}); console.log(`1280-b${n}`,JSON.stringify(await info(page))); }
  } else { await page.screenshot({path:path.join(OUT,`${w}x${h}.png`)}); console.log(`${w}x${h}`,JSON.stringify(await info(page))); }
  await ctx.close();
}
await b.close();
