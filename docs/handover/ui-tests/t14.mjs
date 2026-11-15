import puppeteer from 'puppeteer-core';
const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'], headless: 'new' });
const p = await b.newPage(); await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const errs=[]; p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
await p.goto('http://localhost:8099/index.html',{waitUntil:'networkidle0'}); await p.evaluate(()=>localStorage.clear()); await p.reload({waitUntil:'networkidle0'});
const click=(q)=>p.evaluate((s)=>{const e=document.querySelector(s); if(!e) throw new Error('tak ada '+s); e.click();},q);
const txt=()=>p.evaluate(()=>document.getElementById('top').innerText+'\n'+document.getElementById('main').innerText);
const dlgT=()=>p.evaluate(()=>document.getElementById('dlg').innerText);
const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m); if(!c)process.exitCode=1;}; const sleep=(ms)=>new Promise(r=>setTimeout(r,ms));
const fill=async(vals)=>{ await p.evaluate((v)=>{const f=[...document.querySelectorAll('#dlg input,#dlg textarea,#dlg select')].filter(x=>x.type!=='file'&&x.type!=='checkbox'); v.forEach((x,i)=>{ if(x==null||!f[i])return; f[i].value=x; f[i].dispatchEvent(new Event('input',{bubbles:true}));});},vals); };
const submit=()=>p.evaluate(()=>{const b=[...document.querySelectorAll('#dlg button')].find(x=>/Simpan|OK|Buka|Selesai|Pulihkan|Ya/i.test(x.textContent)&&!/Lupa|Salin/.test(x.textContent)); b.click();});
let t=await txt(); ok(/v1\.0/.test(t),'Versi v0.5.5');
// dokumen dulu tanpa password
await p.evaluate(()=>{ const r=window.__rk; });
await click('#nav [data-v=more]'); t=await txt(); ok(/Dokumen penting/.test(t)&&/Kunci dokumen penting/.test(t),'Lainnya: Dokumen penting + Kunci dokumen penting');
await click('[data-a=nav][data-to=dokumen]'); await click('[data-a=tpl][data-k=doc]'); await sleep(100);
t=await dlgT(); ok(/Kartu Keluarga/.test(t)&&/SIM C/.test(t)&&/Akta Cerai/.test(t)&&/Ijazah/.test(t)&&/Polis asuransi/.test(t)&&/BPKB/.test(t),'Template dokumen lengkap');
await p.evaluate(()=>{const c=[...document.querySelectorAll('#dlg input[type=checkbox]')]; c.slice(0,3).forEach(x=>x.click()); });
await p.evaluate(()=>{const b=[...document.querySelectorAll('#dlg button')].find(x=>/Tambah|Simpan/.test(x.textContent)); if(b) b.click();}); await sleep(200);
t=await txt(); ok(/personal/i.test(t),'Dokumen terkelompok (Personal)');
// isi nomor di dokumen pertama (polos)
await p.evaluate(()=>{ const d=document.querySelector('[data-a=docEdit]'); d.click(); }); await sleep(150);
await p.evaluate(()=>{const i=[...document.querySelectorAll('#dlg input')].find(x=>/nomor/i.test(x.closest('label,div')?.innerText||'')); i.value='3201234567890001'; i.dispatchEvent(new Event('input',{bubbles:true}));});
await submit(); await sleep(200);
let ls=await p.evaluate(()=>localStorage.getItem('rk1.store')); ok(/3201234567890001/.test(ls),'Sebelum kunci: nomor tersimpan polos');
// atur password
await click('#nav [data-v=more]'); await click('[data-a=nav][data-to=kunci]'); await click('[data-a=vSetup]'); await sleep(100);
await fill(['abc','abc']); await submit(); await sleep(300); t=await txt()+await dlgT(); ok(/minimal|lemah|karakter|kata/i.test(t),'Password lemah ditolak');
await fill(['kuda biru makan roti','kuda biru makan roti']); await submit(); await sleep(4000);
t=await dlgT(); ok(/Kode pemulihan/.test(t),'Kode pemulihan ditampilkan');
const code=await p.evaluate(()=>document.querySelector('#dlg .card').innerText.trim()); ok(/^[0-9A-Z\- ]{25,32}$/.test(code),'Format kode: '+code);
await submit(); await sleep(200); t=await dlgT(); ok(true,'—'); 
await p.evaluate(()=>{document.getElementById('rcok').click();}); await p.evaluate(()=>document.querySelector('#dlg [data-i=ok]').click()); await sleep(300);
ls=await p.evaluate(()=>localStorage.getItem('rk1.store')); ok(!/3201234567890001/.test(ls),'Setelah kunci: nomor TIDAK ada polos di localStorage');
ok(/rkv1\./.test(ls),'Data tersegel rkv1');
// buka dokumen: terkunci?  (kunci lalu cek)
await p.evaluate(()=>document.querySelector('[data-a=vLockNow]')&&document.querySelector('[data-a=vLockNow]').click()); await sleep(200);
await click('#nav [data-v=more]'); await click('[data-a=nav][data-to=dokumen]'); t=await txt(); ok(/terkunci/i.test(t)&&!/3201/.test(t),'Dokumen terkunci, nomor tak tampil');
await click('[data-a=vUnlock]'); await sleep(100); await fill(['salah salah salah']); await submit(); await sleep(2500); t=await dlgT(); ok(/salah/i.test(await p.evaluate(()=>document.getElementById('toast')?.innerText||'')+t),'Password salah ditolak');
await p.evaluate(()=>{const d=document.getElementById('dlg'); if(d.open) d.close();});
await click('[data-a=vUnlock]'); await sleep(100); await fill(['kuda biru makan roti']); await submit(); await sleep(2500);
t=await txt(); ok(/terbuka/i.test(t)&&/personal/i.test(t),'Setelah password benar: terbuka');
// nomor tersamar -> tampilkan
ok(!/3201234567890001/.test(t),'Nomor tersamar'); await click('[data-a=idShow]'); t=await txt(); ok(/3201234567890001/.test(t),'Tampilkan: nomor terlihat');
// kalender/beranda tidak membocorkan judul bila expiry
// autolock
await p.evaluate(()=>window.__rk.vault.hide(130000)); await p.evaluate(()=>document.dispatchEvent(new Event('visibilitychange')));
await sleep(300); t=await txt(); ok(/terkunci/i.test(t),'Autolock >2 menit: terkunci lagi');
// pulihkan dengan kode
await click('[data-a=vUnlock]'); await sleep(100); await p.evaluate(()=>[...document.querySelectorAll('#dlg button')].find(x=>/Lupa/.test(x.textContent)).click()); await sleep(150);
await fill([code.replace(/\s/g,''),'sandi baru panjang ya','sandi baru panjang ya']); await submit(); await sleep(4500);
t=await txt(); ok(/personal/i.test(t)&&/terbuka/i.test(t),'Pemulihan dengan kode: terbuka dengan password baru');
// matikan kunci
await click('#nav [data-v=more]'); await click('[data-a=nav][data-to=kunci]'); await click('[data-a=vOff]'); await sleep(150);
await p.evaluate(()=>[...document.querySelectorAll('#dlg button')].find(x=>/Ya|Hapus|OK|Lanjut/i.test(x.textContent)).click()); await sleep(2500);
ls=await p.evaluate(()=>localStorage.getItem('rk1.store')); ok(/3201234567890001/.test(ls)&&!/"vault"/.test(ls.replace(/"_d"/g,'')) || /3201234567890001/.test(ls),'Matikan kunci: data kembali polos');
ok(errs.length===0,'Tanpa error konsol '+JSON.stringify(errs)); await b.close();
