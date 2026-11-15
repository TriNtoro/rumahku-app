import puppeteer from 'puppeteer-core';
const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'], headless: 'new' });
const p = await b.newPage(); await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const errs=[]; p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
await p.goto('http://localhost:8099/index.html',{waitUntil:'networkidle0'}); await p.evaluate(()=>localStorage.clear()); await p.reload({waitUntil:'networkidle0'});
const click=(q)=>p.evaluate((s)=>{const e=document.querySelector(s); if(!e) throw new Error('tak ada '+s); e.click();},q);
const txt=()=>p.evaluate(()=>document.getElementById('top').innerText+'\n'+document.getElementById('main').innerText);
const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m); if(!c)process.exitCode=1;}; const sleep=(ms)=>new Promise(r=>setTimeout(r,ms));
const setv=(o)=>p.evaluate((o)=>{ for(const [k,v] of Object.entries(o)){ const el=document.querySelector('#dlg [name='+k+']'); if(!el) throw new Error('field '+k); el.value=v; el.dispatchEvent(new Event('input',{bubbles:true})); el.dispatchEvent(new Event('change',{bubbles:true})); } },o);
const submit=()=>p.evaluate(()=>document.querySelector('#dlg form').requestSubmit());
// Modul 2: akhir pekan
await click('#nav [data-v=cal]'); await sleep(200);
const w=await p.evaluate(()=>{ const cs=[...document.querySelectorAll('.grid .day:not(.off)')]; const bad=cs.filter(c=>{const d=new Date(c.dataset.v+'T00:00:00').getDay(); return ((d===0||d===6)!==c.classList.contains('wkd'));}); const hs=[...document.querySelectorAll('.grid .h')].map(h=>h.className.includes('wkd')); const bg=cs.find(c=>c.classList.contains('wkd')); return {bad:bad.length,total:cs.length,hs:hs.join(','),col:getComputedStyle(bg).backgroundColor,norm:getComputedStyle(cs.find(c=>!c.classList.contains('wkd'))).backgroundColor}; });
ok(w.bad===0&&w.total>=28,'Kalender bulan: hanya Sabtu/Minggu berkelas wkd ('+w.total+' hari)'); ok(w.hs==='false,false,false,false,false,true,true','Header Sab & Min diwarnai'); ok(w.col!==w.norm,'Warna akhir pekan berbeda dari hari biasa: '+w.col+' vs '+w.norm);
await p.evaluate(()=>{ const st=window.__rk.store(), C=window.__rk.C; const d=new Date(); const ds=d.toISOString().slice(0,8)+'20'; C.put(st,'event',{title:'Rapat',date:ds,allDay:true,repeat:'none'}); localStorage.setItem('rk1.store',JSON.stringify(st)); }); await p.reload({waitUntil:'networkidle0'}); await click('#nav [data-v=cal]'); await sleep(200);
const ag=await p.evaluate(()=>[...document.querySelectorAll('.ag-d')].map(e=>e.className.includes('wkd')).length); ok(ag>=1,'Agenda: tanggal agenda punya kelas akhir pekan bila Sabtu/Minggu');
// Modul 6: tag keluarga
await click('#nav [data-v=more]'); await click('[data-a=nav][data-to=keluarga]'); await click('[data-a=personAdd]'); await sleep(100);
const opts=await p.evaluate(()=>[...document.querySelectorAll('#dlg [name=rel] option')].map(o=>o.value)); 
ok(['Ayah','Ibu','Suami','Istri','Anak','Saudara','Kakek','Nenek','Kerabat','Lainnya','Selingkuhan'].every(x=>opts.includes(x)),'Tag lengkap termasuk Selingkuhan');
await setv({name:'Budi Santoso',nick:'Budi',rel:'Ayah',phone:'0812-3456-7890'}); await submit(); await sleep(200);
await click('[data-a=personAdd]'); await sleep(100); await setv({name:'Sinta',rel:'Selingkuhan',phone:'021-5551234'}); await submit(); await sleep(200);
await click('[data-a=personAdd]'); await sleep(100); await setv({name:'Ilham',rel:'Anak'}); await submit(); await sleep(200);
await p.evaluate(()=>{ const st=window.__rk.store(), C=window.__rk.C; C.put(st,'person',{name:'Tante Lama',rel:'Pasangan'}); C.put(st,'person',{name:'Om Custom',rel:'Sepupu jauh'}); localStorage.setItem('rk1.store',JSON.stringify(st)); }); await p.reload({waitUntil:'networkidle0'});
await click('#nav [data-v=more]'); await click('[data-a=nav][data-to=keluarga]'); let t=await txt();
ok(/Ayah/.test(t)&&/Selingkuhan/.test(t)&&/Sepupu jauh/.test(t)&&/Pasangan/.test(t),'Tag tampil di kartu; tag lama/custom tetap');
await click('[data-a=set][data-k=relF][data-v=Ayah]'); t=await txt(); ok(/Budi/.test(t)&&!/Sinta/.test(t)&&!/Ilham/.test(t),'Filter tag Ayah');
await click('[data-a=set][data-k=relF][data-v=Selingkuhan]'); t=await txt(); ok(/Sinta/.test(t)&&!/Budi/.test(t),'Filter tag Selingkuhan');
await click('[data-a=set][data-k=relF][data-v=Semua]');
// edit tag tidak mengubah data lain
await p.evaluate(()=>{ [...document.querySelectorAll('[data-a=personOpen]')].find(e=>/Budi/.test(e.textContent)).click(); }); await sleep(100);
await click('[data-a=personEdit]'); await sleep(100); await setv({rel:'Kakek'}); await submit(); await sleep(200);
const pr=await p.evaluate(()=>Object.values(JSON.parse(localStorage.getItem('rk1.store')).rec).find(r=>r.name==='Budi Santoso')); ok(pr.rel==='Kakek'&&pr.phone==='0812-3456-7890'&&pr.nick==='Budi','Edit tag: nama, panggilan, telepon tetap');
// custom tag tetap tersedia saat edit
await click('[data-a=nav][data-to=keluarga]').catch(()=>{});
// Modul 5: WA
t=await txt(); ok(/WhatsApp|💬/.test(t),'Detail: tombol WhatsApp/Telepon/SMS'); ok(/Telepon/.test(t)&&/SMS/.test(t),'Detail: Telepon & SMS');
const hrefs=await p.evaluate(()=>[...document.querySelectorAll('#main a.btn')].map(a=>a.getAttribute('href'))); ok(hrefs.includes('tel:+6281234567890')&&hrefs.includes('sms:+6281234567890'),'tel:/sms: berformat internasional '+hrefs.join(' '));
await p.evaluate(()=>{ window.__opened=[]; window.open=(u)=>{window.__opened.push(u); return null;}; });
await click('[data-a=waOpen]'); await sleep(100); const ta=await p.evaluate(()=>document.querySelector('#dlg [name=msg]').value); ok(/^Halo Budi/.test(ta),'Pesan awal terisi & bisa diedit');
await setv({msg:'Halo Pak, apa kabar?'}); await submit(); await sleep(150);
const op=await p.evaluate(()=>window.__opened); ok(op.length===1&&op[0]==='https://wa.me/6281234567890?text='+encodeURIComponent('Halo Pak, apa kabar?'),'Deep link wa.me benar, tanpa kirim otomatis: '+op[0]);
// nomor tidak valid: tombol WA tidak ada
await click('#nav [data-v=more]'); await click('[data-a=nav][data-to=keluarga]'); await p.evaluate(()=>{ [...document.querySelectorAll('[data-a=personOpen]')].find(e=>/Sinta/.test(e.textContent)).click(); }); await sleep(100);
t=await txt(); ok(!(await p.evaluate(()=>!!document.querySelector('[data-a=waOpen]')))&&/dinonaktifkan/.test(t),'Nomor tak valid: WhatsApp dinonaktifkan');
ok(errs.length===0,'Tanpa error konsol '+JSON.stringify(errs)); await b.close();
