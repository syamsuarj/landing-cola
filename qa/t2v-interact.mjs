// QA T2 visual: interaksi (anchor nav cache kosong, menu mobile, Tab, rotasi/resize). Bukan kode produksi.
import { chromium } from 'playwright-core';
const URL = 'http://127.0.0.1:4410/';
const b = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
const out = { anchor: [], menu: {}, tab: {}, resize: [] };
async function settle(p){ let last=-1,st=Date.now(),t0=Date.now(); while(Date.now()-t0<9000){const y=await p.evaluate(()=>Math.round(scrollY)); if(y!==last){last=y;st=Date.now();} else if(Date.now()-st>700) break; await p.waitForTimeout(100);} }
const part = process.argv[2] || 'all';
// 1) anchor
if (part==='all'||part==='anchor') for (const [w,h] of (process.argv[3]==='375'?[[375,812]]:process.argv[3]==='1280'?[[1280,800]]:[[1280,800],[375,812]])) {
  const ctx0 = await b.newContext({ viewport:{width:w,height:h} }); const p0=await ctx0.newPage(); await p0.goto(URL,{waitUntil:'load'});
  const hrefs = await p0.evaluate(()=>[...document.querySelectorAll('#nav-utama a')].map(a=>a.getAttribute('href'))); await ctx0.close();
  for (const href of hrefs) {
    const ctx = await b.newContext({ viewport:{width:w,height:h} }); const p=await ctx.newPage();
    await p.goto(URL,{waitUntil:'load'}); await p.waitForTimeout(1200);
    const mb = p.locator('.menu-btn');
    try { if (await mb.isVisible()) { await mb.click(); await p.waitForTimeout(600); await p.locator(`#nav-utama a[href="${href}"]`).click({timeout:5000}); }
    else await p.evaluate(h=>document.querySelector(`#nav-utama a[href="${h}"]`).click(), href); } catch(e) { out.anchor.push({w,href,err:String(e).slice(0,120), exp: await p.evaluate(()=>document.querySelector('.menu-btn').getAttribute('aria-expanded'))}); await p.screenshot({path:`qa/out/t2-visual/anchor-err-${w}-${href.slice(1)}.png`}); await ctx.close(); continue; }
    await settle(p);
    const m = await p.evaluate(h=>{const t=document.querySelector(h); const hd=document.querySelector('.site-head'); return {top:Math.round(t.getBoundingClientRect().top), hh:Math.round(hd.getBoundingClientRect().height), y:Math.round(scrollY), inert:[...document.querySelectorAll('[inert]')].length, open:document.querySelector('.menu-btn').getAttribute('aria-expanded')}}, href);
    const ok = href==='#beranda' ? m.y<=10 : Math.abs(m.top-m.hh)<=10;
    out.anchor.push({w,href,...m,ok}); console.error(JSON.stringify({w,href,...m,ok})); await ctx.close();
  }
}
// 2) menu mobile
if (part==='all'||part==='menu') {
  const ctx = await b.newContext({ viewport:{width:375,height:812} }); const p=await ctx.newPage(); await p.goto(URL,{waitUntil:'load'}); await p.waitForTimeout(1000);
  await p.focus('.menu-btn'); await p.keyboard.press('Enter'); await p.waitForTimeout(500);
  const st = await p.evaluate(()=>({exp:document.querySelector('.menu-btn').getAttribute('aria-expanded'), inert:[...document.querySelectorAll('[inert]')].map(e=>e.tagName+'#'+e.id+'.'+e.className).slice(0,5), active:document.activeElement.outerHTML.slice(0,80)}));
  const seq=[]; for(let i=0;i<12;i++){ await p.keyboard.press('Tab'); seq.push(await p.evaluate(()=>{const a=document.activeElement; return (a.getAttribute('href')||a.className||a.tagName)+(a.closest('.site-head')?'':'!OUT')})); }
  const back=[]; for(let i=0;i<3;i++){ await p.keyboard.press('Shift+Tab'); back.push(await p.evaluate(()=>{const a=document.activeElement; return (a.getAttribute('href')||a.className||a.tagName)+(a.closest('.site-head')?'':'!OUT')})); }
  await p.keyboard.press('Escape'); await p.waitForTimeout(500);
  const after = await p.evaluate(()=>({exp:document.querySelector('.menu-btn').getAttribute('aria-expanded'), inert:[...document.querySelectorAll('[inert]')].length, focusBtn:document.activeElement===document.querySelector('.menu-btn')}));
  await p.keyboard.press('Space'); await p.waitForTimeout(400); const spaceOpen = await p.evaluate(()=>document.querySelector('.menu-btn').getAttribute('aria-expanded'));
  await p.screenshot({path:'qa/out/t2-visual/menu-375-open.png'});
  out.menu = {st,seq,back,after,spaceOpen}; await ctx.close();
}
// 3) Tab penuh
if (part==='all'||part==='tab') for (const [w,h] of [[1280,800],[375,812]]) {
  const ctx = await b.newContext({ viewport:{width:w,height:h} }); const p=await ctx.newPage(); await p.goto(URL,{waitUntil:'load'}); await p.waitForTimeout(1000);
  const bad=[]; let n=0; const seen=new Set();
  for (let i=0;i<220;i++) { await p.keyboard.press('Tab'); await p.waitForTimeout(i%10?40:200);
    const r = await p.evaluate(()=>{const a=document.activeElement; if(!a||a===document.body) return null; const rc=a.getBoundingClientRect(); let op=1,e=a; while(e&&e!==document){op*=+getComputedStyle(e).opacity; e=e.parentElement;} const cs=getComputedStyle(a); const sec=a.closest('section,footer,header')?.id||a.closest('section,footer,header')?.tagName; return {k:(a.getAttribute('href')||a.textContent.trim().slice(0,25)||a.tagName)+'@'+sec, op:+op.toFixed(2), vis:rc.width>0&&rc.height>0, inView: rc.bottom>0&&rc.top<innerHeight, ring: cs.outlineStyle!=='none'&&parseFloat(cs.outlineWidth)>0 || cs.boxShadow!=='none', hidden:!!a.closest('[aria-hidden="true"],[inert]')}});
    if(!r) continue; if(seen.has(r.k)&&i>20) { if (r.k.includes('beranda')) break; } seen.add(r.k); n++;
    // tunggu reveal sebentar lalu cek ulang opacity
    if (r.op<0.99) { await p.waitForTimeout(700); const op2=await p.evaluate(()=>{let op=1,e=document.activeElement; while(e&&e!==document){op*=+getComputedStyle(e).opacity; e=e.parentElement;} return +op.toFixed(2)}); r.op2=op2; }
    if (!r.inView) { await p.waitForTimeout(900); r.inView2 = await p.evaluate(()=>{const rc=document.activeElement.getBoundingClientRect(); return rc.bottom>0&&rc.top<innerHeight}); r.inView=r.inView2; }
    if ((r.op2??r.op)<0.99 || !r.vis || !r.inView || !r.ring || r.hidden) bad.push(r);
  }
  out.tab[w]={n,bad:bad.slice(0,25),nbad:bad.length}; await ctx.close();
}
// 4) resize/rotation
if (part==='all'||part==='resize') {
  const cases = [[[375,812],[812,375]],[[812,375],[375,812]],[[1024,768],[768,1024]],[[768,1024],[1024,768]],[[1280,800],[375,812],[1280,800]]];
  for (const c of cases) for (const target of ['filosofi','milestones','bisnis','kepemimpinan']) {
    const ctx = await b.newContext({ viewport:{width:c[0][0],height:c[0][1]} }); const p=await ctx.newPage(); await p.goto(URL,{waitUntil:'load'}); await p.waitForTimeout(1000);
    const y = await p.evaluate(id=>{const e=document.getElementById(id);const c=e.parentElement.classList.contains('pin-spacer')?e.parentElement:e; const r=c.getBoundingClientRect(); return Math.round(r.top+scrollY+Math.max(0,(r.height-innerHeight)*0.5));}, target);
    for (let yy=0; yy<y; yy+=1500) { await p.mouse.wheel(0,1500); await p.waitForTimeout(40);} await p.evaluate(y=>scrollTo(0,y),y); await p.waitForTimeout(800);
    const whereFn = ()=>{const ids=['beranda','apresiasi','tentang','filosofi','milestones','visi-misi','kepemimpinan','bisnis','angka','kemitraan','karir','berita','keterbukaan','kontak']; const yy=innerHeight/2; for(const id of ids){const r=document.getElementById(id).getBoundingClientRect(); if(r.top<=yy&&r.bottom>=yy) return id;} return '?'+Math.round(scrollY)};
    const before = await p.evaluate(whereFn); const path=[before];
    for (const vp of c.slice(1)) { await p.setViewportSize({width:vp[0],height:vp[1]}); await p.waitForTimeout(1500); path.push(await p.evaluate(whereFn)); }
    out.resize.push({c:c.map(v=>v.join('x')).join('→'), target, path, ok: path.every(x=>x===before)});
    await ctx.close();
  }
}
console.log(JSON.stringify(out,null,1));
await b.close();
