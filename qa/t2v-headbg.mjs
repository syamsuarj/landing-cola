// QA T2 visual: state latar header di posisi tengah section (meniru t2-shots). Bukan kode produksi.
import { chromium } from 'playwright-core';
const [W,H]=[+process.argv[2],+process.argv[3]];
const b = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
const p=await (await b.newContext({viewport:{width:W,height:H}})).newPage(); await p.goto('http://127.0.0.1:4410/',{waitUntil:'load'}); await p.waitForTimeout(1200);
for (const [id,f] of [['apresiasi',0.66],['milestones',0.66],['karir',0.33],['keterbukaan',0.66]]) {
  const y=await p.evaluate(([id,f])=>{const r=document.getElementById(id).getBoundingClientRect(); return Math.round(r.top+scrollY+(r.height-innerHeight)*f)},[id,f]);
  await p.evaluate(y=>scrollTo(0,y),y-300); await p.waitForTimeout(150); await p.evaluate(y=>scrollTo(0,y),y); await p.waitForTimeout(900);
  const s=await p.evaluate(()=>{const h=document.querySelector('.site-head'); const cs=getComputedStyle(h); const bf=getComputedStyle(h,'::before'); return {cls:h.className,bg:cs.backgroundColor,bd:cs.backdropFilter,before:bf.backgroundColor+'/'+bf.opacity}});
  await p.screenshot({path:`qa/out/t2-visual/headbg-${W}-${id}.png`,clip:{x:0,y:0,width:W,height:160}}); console.log(id,JSON.stringify(s));
}
await b.close();
