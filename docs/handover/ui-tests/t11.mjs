import puppeteer from 'puppeteer-core';
const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'], headless: 'new' });
const p = await b.newPage(); await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const errs=[]; p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
await p.goto('http://localhost:8099/index.html',{waitUntil:'networkidle0'}); await p.evaluate(()=>localStorage.clear()); await p.reload({waitUntil:'networkidle0'});
const click=(q)=>p.evaluate((s)=>{const e=document.querySelector(s); if(!e) throw new Error('tak ada '+s); e.click();},q);
const setf=(n,v)=>p.evaluate((n,v)=>{const e=document.querySelector('#dlg [name='+n+']'); if(!e) throw new Error('field '+n); if(e.type==='checkbox')e.checked=v; else e.value=v;},n,v);
const txt=()=>p.evaluate(()=>document.getElementById('top').innerText+'\n'+document.getElementById('main').innerText);
const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m); if(!c)process.exitCode=1;};
const tab=(v)=>click(`#nav [data-v=${v}]`); const sleep=(ms)=>new Promise(r=>setTimeout(r,ms));
let t=await txt(); ok(/v1\.0/.test(t),'Versi v0.5.2 terlihat di Beranda');
await tab('cal');
const add=async(title,date,extra={})=>{ await click('[data-a=evAdd]'); await setf('title',title); await setf('date',date); for(const k in extra) await setf(k,extra[k]); await click('#fok'); await sleep(100); };
// form: opsi pengingat
await click('[data-a=evAdd]'); let l=await p.evaluate(()=>document.getElementById('dlg').innerText);
ok(/3 jam sebelumnya/.test(l)&&/3 hari sebelumnya/.test(l)&&/1 minggu sebelumnya/.test(l),'Form acara: opsi 3 jam / 3 hari / 1 minggu');
ok(/Pengingat kedua/.test(l),'Form acara: pengingat kedua');
const def=await p.evaluate(()=>document.querySelector('#dlg [name=remind]').value); ok(def==='1440','Default pengingat acara baru = 1 hari sebelumnya');
await click('#dlg .btns button:not(#fok)').catch(()=>{}); await p.evaluate(()=>{const d=document.getElementById('dlg'); if(d.open) d.close();});
await add('Ultah Ilham anak','2026-11-12'); await add('Ultah tri ayah','2026-11-13'); await add('Bayar STNK','2026-11-14'); await add('Ultah Mama','2026-11-24',{remind:'4320',remind2:'0'});
t=await txt(); ok(/Agenda November 2026/i.test(t),'Agenda bulan tampil di bawah kalender');
const rows=await p.evaluate(()=>[...document.querySelectorAll('.row.ag')].map(r=>({d:r.classList.contains('done'),t:r.innerText.replace(/\n/g,' ')})));
console.log(rows.map(r=>(r.d?'[coret] ':'[aktif] ')+r.t).join('\n'));
ok(rows.length>=4,'4 agenda terdaftar');
ok(rows.filter(r=>/Ultah Ilham|Ultah tri|Bayar STNK/.test(r.t)).every(r=>r.d),'12,13,14 Nov sudah lewat -> dicoret');
ok(rows.some(r=>/Ultah Mama/.test(r.t)&&!r.d),'24 Nov belum lewat -> tidak dicoret');
ok(rows.some(r=>/🎂 Ultah Ilham/.test(r.t)),'Ikon kue 🎂 pada ultah');
ok(rows.some(r=>/📅 Bayar STNK/.test(r.t)),'Ikon 📅 pada acara biasa');
const strike=await p.evaluate(()=>getComputedStyle(document.querySelector('.row.ag.done .t')).textDecorationLine); ok(/line-through/.test(strike),'Teks agenda lewat tercoret (CSS)');
await p.screenshot({path:'/tmp/cal2.png',fullPage:true});
// edit acara: nilai pengingat tersimpan
const rec=await p.evaluate(()=>Object.values(window.__rk.store().rec).find(r=>r.title==='Ultah Mama')); ok(rec.remind==='4320'&&rec.remind2==='0','Pengingat 3 hari + tepat waktu tersimpan');
// tick: set jam palsu -> notifikasi
const fired=await p.evaluate(()=>{ const out=[]; const R=window.__rk; const real=Date.now; const mk=(iso)=>{ const t=new Date(iso).getTime(); Date.now=()=>t; return t; };
  localStorage.removeItem('rk1.fired'); const OrigDate=Date; 
  class FD extends OrigDate{ constructor(...a){ if(a.length===0){ super(FD.fake); } else super(...a);} static now(){return FD.fake;} }
  window.Date=FD; FD.fake=new OrigDate(2026,10,21,8,10).getTime(); // 21 Nov 08:10 = 3 hari sebelum 24 Nov
  R.tick(); const k1=localStorage.getItem('rk1.fired');
  FD.fake=new OrigDate(2026,10,24,8,10).getTime(); R.tick(); const k2=localStorage.getItem('rk1.fired');
  window.Date=OrigDate; return {k1,k2}; });
ok(/ev\|[^|]+\|2026-11-24\|08:00\|4320/.test(fired.k1),'tick: 3 hari sebelum (21 Nov 08.10) -> pengingat tercatat berbunyi');
ok(/2026-11-24\|08:00\|0/.test(fired.k2),'tick: hari H 08.10 -> pengingat "tepat waktu" tercatat');
// kamera
await tab('more'); await p.evaluate(()=>document.querySelector('[data-a=nav][data-to=dokumen]').click());
t=await txt(); ok(/Foto cepat dengan kamera/.test(t),'Tombol Foto cepat kamera ada di Dokumen penting (walau daftar kosong)');
const capture=await p.evaluate(()=>{ let cap=null; const orig=HTMLInputElement.prototype.click; HTMLInputElement.prototype.click=function(){ if(this.type==='file') cap=this.getAttribute('capture'); }; document.querySelector('[data-a=docQuick]').click(); HTMLInputElement.prototype.click=orig; return cap; });
ok(capture==='environment','Foto cepat membuka kamera belakang (capture=environment)');
const [fc]=await Promise.all([p.waitForFileChooser(), click('[data-a=docQuick]')]); await fc.accept(['/tmp/pt/test.png']); await sleep(600);
l=await p.evaluate(()=>document.getElementById('dlg').innerText); ok(/Simpan foto sebagai/.test(l),'Setelah foto: diminta nama dokumen');
await setf('title','NPWP'); await click('#fok'); await sleep(700); t=await txt(); ok(/NPWP/.test(t)&&/📷 1/.test(t),'Dokumen NPWP dibuat otomatis + 1 foto');
await click('[data-a=docFiles]'); l=await p.evaluate(()=>document.getElementById('dlg').innerText); ok(/Ambil foto \(kamera\)/.test(l)&&/galeri/.test(l),'Menu 📷: kamera & galeri');
// ICS
await p.evaluate(()=>{const d=document.getElementById('dlg'); if(d.open) d.close();});
ok(errs.length===0,'Tanpa error konsol '+JSON.stringify(errs));
await b.close();
