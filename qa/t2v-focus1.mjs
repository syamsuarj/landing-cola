// QA T2 visual: fokus keyboard ke elemen tertentu, cek terlihat. node qa/t2v-focus1.mjs W H selector. Bukan kode produksi.
import { chromium } from 'playwright-core';
const [W,H,sel]=[+process.argv[2],+process.argv[3],process.argv[4]];
const b = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
const p=await (await b.newContext({viewport:{width:W,height:H}})).newPage(); await p.goto('http://127.0.0.1:4410/',{waitUntil:'load'}); await p.waitForTimeout(1200);
// fokus elemen sebelumnya lalu Tab
await p.evaluate(s=>{const all=[...document.querySelectorAll('a,button,[tabindex]')].filter(e=>e.tabIndex>=0); const i=all.indexOf(document.querySelector(s)); all[i-1].focus();}, sel);
await p.waitForTimeout(800); await p.keyboard.press('Tab'); await p.waitForTimeout(1200);
console.log(JSON.stringify(await p.evaluate(()=>{const a=document.activeElement; const r=a.getBoundingClientRect(); return {href:a.getAttribute('href'), txt:a.textContent.trim().slice(0,30), r:[Math.round(r.top),Math.round(r.bottom)], y:Math.round(scrollY), ih:innerHeight}})));
await p.screenshot({path:`qa/out/t2-visual/focus-${W}-${sel.replace(/\W/g,'')}.png`}); await b.close();
