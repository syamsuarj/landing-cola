
import { chromium } from 'playwright-core';
const dir=process.cwd()+'/qa/t7b-preview';
const b=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
const p=await b.newPage({viewport:{width:1200,height:800}});
const h=[];
for (const t of [0,2.1]) { await p.goto(`file://${dir}/index.html?view=wide&q=high&t=${t}`); await p.waitForFunction(()=>document.title==='ready');
 h.push(await p.evaluate(()=>{const c=document.querySelector('canvas');return c.toDataURL().length+':'+c.toDataURL().slice(-200);})); }
console.log('sway differs:', h[0]!==h[1]); await b.close();
