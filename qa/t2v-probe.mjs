// QA T2 visual: probe logo header + state header di beberapa posisi. Bukan kode produksi.
import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
const ctx = await b.newContext({ viewport: { width: 1280, height: 800 } });
const p = await ctx.newPage();
const fails=[]; p.on('requestfailed', r=>fails.push(r.url()+' '+r.failure()?.errorText));
p.on('response', r=>{ if(r.status()>=400) fails.push(r.status()+' '+r.url()); });
await p.goto('http://127.0.0.1:4410/', { waitUntil: 'load' }); await p.waitForTimeout(1500);
console.log(await p.evaluate(()=>[...document.querySelectorAll('.site-head img, header img')].map(i=>({src:i.currentSrc||i.src, nw:i.naturalWidth, c:i.complete}))));
for (const id of ['apresiasi','kepemimpinan','visi-misi']) {
  const y = await p.evaluate(id=>document.getElementById(id).getBoundingClientRect().top+scrollY-70,id);
  await p.evaluate(y=>scrollTo(0,y),y-300); await p.waitForTimeout(150); await p.evaluate(y=>scrollTo(0,y),y); await p.waitForTimeout(1000);
  console.log(id, await p.evaluate(()=>{const h=document.querySelector('.site-head');const cs=getComputedStyle(h);return {cls:h.className, bg:cs.backgroundColor, tr:cs.transform, op:cs.opacity, navVis:[...h.querySelectorAll('nav a')].map(a=>getComputedStyle(a).opacity+'/'+getComputedStyle(a).color).slice(0,2), imgs:[...h.querySelectorAll('img')].map(i=>i.naturalWidth)}}));
  await p.screenshot({path:`qa/out/t2-visual/probe-${id}.png`, clip:{x:0,y:0,width:1280,height:120}});
}
console.log('fails', fails);
await b.close();
