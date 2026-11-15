import puppeteer from 'puppeteer-core';
const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'], headless: 'new' });
const p = await b.newPage(); await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const errs=[]; p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
p.on('dialog', async d => { if (d.type()==='prompt') await d.accept('Alam gaib'); else await d.accept(); });
await p.goto('http://localhost:8099/index.html',{waitUntil:'networkidle0'}); await p.evaluate(()=>localStorage.clear()); await p.reload({waitUntil:'networkidle0'});
const click=(q)=>p.evaluate((s)=>{const e=document.querySelector(s); if(!e) throw new Error('tak ada '+s); e.click();},q);
const setf=(n,v)=>p.evaluate((n,v)=>{const e=document.querySelector('#dlg [name='+n+']'); if(!e) throw new Error('field '+n); if(e.type==='checkbox')e.checked=v; else e.value=v; e.dispatchEvent(new Event('change',{bubbles:true}));},n,v);
const txt=()=>p.evaluate(()=>document.getElementById('top').innerText+'\n'+document.getElementById('main').innerText);
const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m); if(!c)process.exitCode=1;};
const nav=(to)=>click(`[data-a=nav][data-to="${to}"]`); const tab=(v)=>click(`#nav [data-v=${v}]`);
const sleep=(ms)=>new Promise(r=>setTimeout(r,ms));
// mode + profil
await tab('more'); await nav('profil'); await click('[data-a=profilEdit]');
await setf('name','Illa'); await setf('mode','keluarga'); await setf('sex','L'); await setf('height','170'); await click('#fok');
let t=await txt(); ok(/Berkeluarga/.test(t),'Profil menyimpan mode');
// akun dari template
await tab('money'); t=await txt(); ok(/Ringkasan/.test(t)&&/Transaksi/.test(t)&&/Statistik/.test(t)&&/Tracker/.test(t),'4 tab Uang');
await click('[data-a=tpl][data-k=acc]'); const nAcc=await p.evaluate(()=>document.querySelectorAll('#dlg input[type=checkbox]').length); ok(nAcc>=12,'template akun banyak ('+nAcc+')');
for (const k of ['t1','t2','t5','t7']) await setf(k,true); await click('#fok'); t=await txt(); ok(/BCA/.test(t)&&/Mandiri/.test(t)&&/SeaBank/.test(t)&&/darurat/.test(t),'3-4 rekening bank dibuat');
// set saldo awal via ubah akun
const ids=await p.evaluate(()=>window.__rk.C.list(window.__rk.store(),'acc').map(a=>[a.id,a.name]));
for (const [id,name] of ids){ await click(`[data-a=accEdit][data-id="${id}"]`); await setf('opening', name==='BCA'?'10000000':name==='SeaBank'?'3000000':'1000000'); await click('#fok'); }
// transaksi: kind income lalu tambah sumber baru
await click('[data-a=txAdd]'); await setf('kind','income'); let opts=await p.evaluate(()=>[...document.querySelectorAll('#dlg [name=cat] option')].map(o=>o.textContent)); ok(opts.includes('Gaji suami')&&!opts.includes('Uang dapur'),'Dropdown sumber dana untuk pemasukan (mode keluarga)');
await setf('cat','__new'); opts=await p.evaluate(()=>[...document.querySelectorAll('#dlg [name=cat] option')].map(o=>o.textContent)); ok(opts.includes('Alam gaib'),'Tambah sumber baru via dropdown');
await setf('amount','8000000'); await click('#fok'); await sleep(200);
await click('[data-a=txAdd]'); await setf('kind','expense'); opts=await p.evaluate(()=>[...document.querySelectorAll('#dlg [name=cat] option')].map(o=>o.textContent)); ok(opts.includes('Uang dapur')&&!opts.includes('Gaji suami'),'Dropdown kategori berubah mengikuti jenis');
await setf('cat','Uang dapur'); await setf('amount','350000'); await click('#fok');
await click('[data-a=txAdd]'); await setf('kind','expense'); await setf('cat','SPP & sekolah anak'); await setf('amount','900000'); await click('#fok');
// statistik
await click('[data-a=set][data-k=moneyTab][data-v=stat]'); t=await txt();
ok(/Alam gaib/.test(t)&&/Uang dapur/.test(t),'Statistik menampilkan sumber & kategori');
await p.screenshot({path:'/tmp/uang_stat.png',fullPage:true});
ok(await p.evaluate(()=>document.querySelectorAll('#main svg circle[stroke-dasharray]').length>=3),'Donat tergambar');
ok(await p.evaluate(()=>!!document.querySelector('#main svg polyline')),'Garis masuk vs keluar tergambar');
await p.evaluate(()=>document.querySelector('.cz').dispatchEvent(new MouseEvent('click',{bubbles:true}))); t=await txt(); ok(/Tgl \d+/.test(t),'Ketuk grafik menampilkan angka harian');
// transaksi tab + bukti
await click('[data-a=set][data-k=moneyTab][data-v=trx]'); t=await txt(); ok(/Uang dapur/.test(t)&&/Hari ini/.test(t),'Daftar transaksi per hari');
// tracker: anggaran + goal
await click('[data-a=set][data-k=moneyTab][data-v=track]'); await click('[data-a=budAdd]'); await setf('cat','Uang dapur'); await setf('limit','2000000'); await click('#fok'); t=await txt(); ok(/Uang dapur/.test(t)&&/jatah/.test(t),'Budget tracker + jatah per hari');
await click('[data-a=goalTpl]'); await p.evaluate(()=>document.querySelector('#dlg .menu button[data-i="0"]').click()); await setf('target','18000000'); await setf('date',await p.evaluate(()=>Core.addDays(Core.today(),365))); await click('#fok'); t=await txt(); ok(/Dana darurat keluarga/.test(t)&&/perlu/.test(t),'Goal tracker + butuh per bulan');
await click('[data-a=goalDep]'); await setf('amount','2000000'); await click('#fok'); t=await txt(); ok(/11,1%/.test(t),'Setoran menaikkan progres (11,1%)');
await p.screenshot({path:'/tmp/uang_track.png',fullPage:true});
// ringkasan: level + kekayaan
await click('[data-a=set][data-k=moneyTab][data-v=ringkas]'); t=await txt(); ok(/Level \d/.test(t)||/Belum cukup data/.test(t),'Kartu level tampil'); console.log(t.match(/Level \d · [^\n]+/)?.[0]);
ok(/Kekayaan bersih/i.test(t)&&/Bendahara keluarga/i.test(t),'Kekayaan & Bendahara keluarga (mode keluarga)');
await p.screenshot({path:'/tmp/uang1.png',fullPage:true});
// tagihan wajib template
await tab('more'); await nav('tagihan'); await click('[data-a=billTpl]'); let l=await p.evaluate(()=>document.getElementById('dlg').innerText); ok(/SPP anak/.test(l)&&/Kas desa/.test(l)&&/Arisan/.test(l),'Template kewajiban tetap keluarga');
console.log('ERRS',errs); await b.close();
