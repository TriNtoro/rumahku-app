import puppeteer from 'puppeteer-core';
const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'], headless: 'new' });
const p = await b.newPage(); await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const errs=[]; p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
await p.goto('http://localhost:8099/index.html',{waitUntil:'networkidle0'}); await p.evaluate(()=>localStorage.clear()); await p.reload({waitUntil:'networkidle0'});
const click=(q)=>p.evaluate((s)=>{const e=document.querySelector(s); if(!e) throw new Error('tak ada '+s); e.click();},q);
const txt=()=>p.evaluate(()=>document.getElementById('top').innerText+'\n'+document.getElementById('main').innerText);
const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m); if(!c)process.exitCode=1;}; const sleep=(ms)=>new Promise(r=>setTimeout(r,ms));
const setv=(o)=>p.evaluate((o)=>{ for(const [k,v] of Object.entries(o)){ const el=document.querySelector('#dlg [name='+k+']'); if(!el) throw new Error('field '+k); if(el.type==='checkbox') el.checked=!!v; else el.value=v; el.dispatchEvent(new Event('input',{bubbles:true})); } },o);
const submit=()=>p.evaluate(()=>document.querySelector('#dlg form').requestSubmit());
await click('#nav [data-v=more]'); let t=await txt(); ok(/Minum air/.test(t),'Lainnya: Minum air'); await click('[data-a=nav][data-to=air]');
t=await txt(); ok(/0 ml/.test(t)&&/target 8 gelas \(2000 ml\)/.test(t),'Awal: 0 ml, target 8 gelas 2000 ml');
let gl=await p.evaluate(()=>document.querySelectorAll('.gl').length); ok(gl===8,'8 ikon gelas');
await click('[data-a=waterAdd1]'); await click('[data-a=waterAdd1]'); await sleep(50); // klik ganda cepat
t=await txt(); ok(/250 ml/.test(t)&&/1 gelas/.test(t),'Klik ganda cepat dihitung sekali (250 ml)');
await sleep(800); await click('[data-a=waterAdd1]'); await sleep(800); await click('[data-a=waterAdd1]'); t=await txt(); ok(/750 ml/.test(t)&&/3 gelas/.test(t)&&/38%/.test(t),'3 gelas = 750 ml, 38%');
let on=await p.evaluate(()=>document.querySelectorAll('.gl.on').length); ok(on===3,'3 gelas terisi');
await click('[data-a=waterMore]'); await sleep(100); await setv({ml:'500'}); await submit(); await sleep(150); t=await txt(); ok(/1250 ml/.test(t)&&/5 gelas/.test(t),'+500 ml → 1250 ml');
await click('[data-a=waterUndo]'); t=await txt(); ok(/750 ml/.test(t),'Koreksi: batalkan terakhir → 750 ml');
// reload: tersimpan permanen
await p.reload({waitUntil:'networkidle0'}); await click('#nav [data-v=more]'); await click('[data-a=nav][data-to=air]'); t=await txt(); ok(/750 ml/.test(t),'Data tetap setelah aplikasi dimuat ulang');
// ubah target tidak mengubah riwayat
await p.evaluate(()=>{ const st=window.__rk.store(), C=window.__rk.C; const y=C.addDays(C.today(),-1); C.waterAdd(st,2000,y,'20:00'); localStorage.setItem('rk1.store',JSON.stringify(st)); }); await p.reload({waitUntil:'networkidle0'}); await click('#nav [data-v=more]'); await click('[data-a=nav][data-to=air]');
await click('[data-a=waterCfg]'); await sleep(100); await setv({goal:'10',glassMl:'300',quietFrom:'12:00',quietTo:'13:00'}); await submit(); await sleep(200);
t=await txt(); ok(/target 10 gelas \(3000 ml\)/.test(t),'Target baru 10×300 = 3000 ml'); ok(/2000 ml · 100%/.test(t),'Riwayat kemarin tetap 2000 ml · 100%'); ok(/tenang 12:00–13:00/.test(t),'Jam tenang tampil');
await click('[data-a=waterCfg]'); await sleep(100); await setv({goal:'0'}); await submit(); t=await p.evaluate(()=>document.querySelector('#dlg #ferr').textContent); ok(/Target 1–40/.test(t),'Validasi target');
ok(errs.length===0,'Tanpa error konsol '+JSON.stringify(errs)); await b.close();
