import puppeteer from 'puppeteer-core';
const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'], headless: 'new' });
const p = await b.newPage(); await p.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
const errs=[]; p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
await p.goto('http://localhost:8099/index.html',{waitUntil:'networkidle0'}); await p.evaluate(()=>localStorage.clear()); await p.reload({waitUntil:'networkidle0'});
const click=(q)=>p.evaluate((s)=>{const e=document.querySelector(s); if(!e) throw new Error('tak ada '+s); e.click();},q);
const clickT=(sel,re)=>p.evaluate((s,r)=>{const e=[...document.querySelectorAll(s)].find(x=>new RegExp(r,'i').test(x.textContent)); if(!e) throw new Error('tak ada '+r); e.click();},sel,re);
const txt=()=>p.evaluate(()=>document.getElementById('top').innerText+'\n'+document.getElementById('main').innerText);
const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m); if(!c)process.exitCode=1;}; const sleep=(ms)=>new Promise(r=>setTimeout(r,ms));
const store=()=>p.evaluate(()=>JSON.parse(localStorage.getItem('rk1.store')));
const submit=()=>p.evaluate(()=>document.querySelector('#dlg form').requestSubmit());
await click('#nav [data-v=more]'); await click('[data-a=nav][data-to=tagihan]'); await click('[data-a=billAdd]'); await clickT('#dlg button','Haji'); await sleep(100);
// ketik angka per karakter di kolom nominal
const el=await p.$('#dlg [name=amountEst]'); await el.focus(); await p.keyboard.type('2500000'); let v=await p.evaluate(()=>document.querySelector('#dlg [name=amountEst]').value); ok(v==='2.500.000','Ketik 2500000 → '+v);
await p.keyboard.press('Backspace'); v=await p.evaluate(()=>document.querySelector('#dlg [name=amountEst]').value); ok(v==='250.000','Backspace → '+v);
const t2=await p.$('#dlg [name=total]'); await t2.focus(); await p.keyboard.type('35000000'); v=await p.evaluate(()=>document.querySelector('#dlg [name=total]').value); ok(v==='35.000.000','Total 35.000.000');
// sisip di tengah: kursor tetap benar
await p.evaluate(()=>{const e=document.querySelector('#dlg [name=total]'); e.setSelectionRange(2,2);}); await p.keyboard.type('9'); v=await p.evaluate(()=>{const e=document.querySelector('#dlg [name=total]'); return e.value+'|'+e.selectionStart;}); ok(v.startsWith('359.000.000')&&/\|3$/.test(v),'Sisip di tengah, kursor tepat → '+v);
await p.evaluate(()=>{const e=document.querySelector('#dlg [name=total]'); e.value='35.000.000'; e.dispatchEvent(new Event('input',{bubbles:true}));});
await p.evaluate(()=>{const s=(k,v)=>{const e=document.querySelector('#dlg [name='+k+']'); e.value=v; e.dispatchEvent(new Event('input',{bubbles:true}));}; s('dueDay','1'); s('instNow','31'); s('paidBefore','5000000');});
v=await p.evaluate(()=>document.querySelector('#dlg [name=paidBefore]').value); ok(v==='5.000.000','Isi via skrip juga diformat: '+v);
await submit(); await sleep(200);
const bl=Object.values((await store()).rec).filter(r=>r._t==='bill'&&!r._d)[0]; ok(bl.amountEst===250000&&bl.total===35000000&&bl.paidBefore===5000000&&bl.instBefore===30,'Tersimpan sebagai bilangan bulat: '+JSON.stringify([bl.amountEst,bl.total,bl.paidBefore,bl.instBefore]));
let t=await txt(); ok(/cicilan ke-31/.test(t),'Haji tanpa tenor menampilkan "cicilan ke-31"');
// buka form lagi: nilai ber-pemisah
await click('[data-a=billOpen]'); await click('[data-a=billEdit]'); await sleep(100); v=await p.evaluate(()=>document.querySelector('#dlg [name=total]').value); ok(v==='35.000.000','Edit: nilai lama tampil dengan pemisah');
await p.evaluate(()=>document.getElementById('dlg').close());
// arisan: ada kolom ke-berapa
await click('#nav [data-v=more]'); await click('[data-a=nav][data-to=tagihan]'); await click('[data-a=billAdd]'); await clickT('#dlg button','Arisan'); await sleep(100);
ok(await p.evaluate(()=>!!document.querySelector('#dlg [name=instNow]')),'Arisan: kolom "sekarang ke-berapa" ada');
await p.evaluate(()=>{const s=(k,v)=>{const e=document.querySelector('#dlg [name='+k+']'); e.value=v; e.dispatchEvent(new Event('input',{bubbles:true}));}; s('name','Arisan Kantor'); s('amountEst','200000'); s('dueDay','15'); s('tenor','12'); s('instNow','6');});
await submit(); await sleep(200); t=await txt(); ok(/angsuran 6\/12/.test(t),'Arisan: periode 6/12 tampil');
ok(errs.length===0,'Tanpa error konsol '+JSON.stringify(errs)); await b.close();
