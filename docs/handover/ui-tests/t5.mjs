import puppeteer from 'puppeteer-core';
const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'], headless: 'new' });
const p = await b.newPage(); await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const errs=[]; p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
await p.goto('http://localhost:8099/index.html',{waitUntil:'networkidle0'});
const click=(q)=>p.evaluate((s)=>document.querySelector(s).click(),q);
await click('#nav [data-v=more]'); await click('[data-a=nav][data-to=bantuan]');
const t=await p.evaluate(()=>document.getElementById('main').textContent);
console.log(/Mulai cepat/.test(t)&&/Authorized JavaScript origins/i.test(t)&&/localhost:8099/.test(t)?'PASS':'FAIL','bantuan memuat panduan + origin dinamis');
await p.evaluate(()=>document.querySelectorAll('details.hlp').forEach(d=>d.open=true));
await p.screenshot({path:'/tmp/pt/v3-bantuan.png',fullPage:false});
// installability: manifest + sw
const m=await p.evaluate(async()=>{const r=await fetch('manifest.webmanifest');const j=await r.json();const reg=await navigator.serviceWorker.getRegistration();return {name:j.name,disp:j.display,icons:j.icons.map(i=>i.sizes),start:j.start_url,sw:!!reg}});
console.log(JSON.stringify(m)); console.log('ERR',JSON.stringify(errs)); await b.close();
