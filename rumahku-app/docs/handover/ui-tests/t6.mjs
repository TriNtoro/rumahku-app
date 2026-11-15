import puppeteer from 'puppeteer-core';
const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'], headless: 'new' });
const p = await b.newPage(); await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const errs=[]; p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
await p.goto('http://localhost:8099/index.html',{waitUntil:'networkidle0'}); await p.evaluate(()=>localStorage.clear()); await p.reload({waitUntil:'networkidle0'});
const click=(q)=>p.evaluate((s)=>{const e=document.querySelector(s); if(!e) throw new Error('tak ada '+s); e.click();},q);
const setf=(n,v)=>p.evaluate((n,v)=>{const e=document.querySelector('#dlg [name='+n+']'); if(!e) throw new Error('field '+n); if(e.type==='checkbox')e.checked=v; else e.value=v;},n,v);
const txt=()=>p.evaluate(()=>document.getElementById('top').innerText+'\n'+document.getElementById('main').innerText);
const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m); if(!c)process.exitCode=1;};
const nav=(to)=>click(`[data-a=nav][data-to="${to}"]`); const tab=(v)=>click(`#nav [data-v=${v}]`);
let t=await txt();
ok(/Atur target minum air/.test(t),'Beranda kosong: ada ajakan atur target minum air');
// profil dengan tgl lahir hari ini+2
const bd=await p.evaluate(()=>Core.addDays(Core.today(),2).replace(/^\d{4}/,'1988'));
await click('[data-a=profilEdit]'); await setf('name','Illa'); await setf('birth',bd); await click('#fok');
t=await txt(); ok(/Ulang tahun Illa — 2 hari lagi/.test(t),'Beranda: ulang tahun saya (dari Profil) muncul');
await tab('cal'); const d2=await p.evaluate(()=>Core.addDays(Core.today(),2));
await click(`[data-a=calSel][data-v="${d2}"]`); t=await txt();
ok(/Ulang tahun Illa/.test(t)&&/ke-38/.test(t),'Kalender: ulang tahun saya tampil di tanggalnya (ke-38)');
const dots=await p.evaluate((d)=>document.querySelector(`[data-a=calSel][data-v="${d}"] .dots i.b`)!==null,d2); ok(dots,'Kalender: titik merah muda untuk ulang tahun');
// tagihan via template -> kalender
await tab('more'); await nav('tagihan'); await click('[data-a=billTpl]'); await setf('b0',true); await setf('dueDay','20'); await click('#fok');
await tab('cal'); await click(`[data-a=calSel][data-v="${await p.evaluate(()=>Core.today().slice(0,7)+'-20')}"]`); t=await txt(); ok(/Listrik PLN/.test(t),'Kalender: tagihan muncul di tanggal jatuh tempo');
// template semua modul
const tpls=[['kendaraan','veh','t0',/Motor/],['aset','asset','t0',/Kulkas/],['stok','inv','t0',/Beras/],['kontak','contact','t0',/Polisi/],['dokumen','doc','t0',/KTP/],['tugas','task','t0',/Belanja bulanan/],['habit','habit','t0',/Olahraga/]];
for (const [page,k,f,re] of tpls) {
  await tab('more'); await nav(page);
  if (page==='stok') await click('[data-a=set][data-v=stok]');
  await click(`[data-a=tpl][data-k=${k}]`); await setf(f,true); await click('#fok');
  t=await txt(); ok(re.test(t),'Template '+page+' menambah item');
}
await tab('more'); await nav('kendaraan'); t=await txt(); ok(/Ganti oli/.test(t)&&/Servis berkala/.test(t),'Template kendaraan ikut membuat jadwal servis');
await tab('money'); await click('[data-a=tpl][data-k=acc]'); await setf('t0',true); await click('#fok'); t=await txt(); ok(/Dompet/.test(t),'Template akun');
await click('[data-a=set][data-k=moneyTab][data-v=track]'); await click('[data-a=tpl][data-k=budget]'); await setf('t0',true); await setf('limit','750.000'); await click('#fok'); t=await txt(); ok(/Makan/.test(t)&&/750\.000/.test(t),'Template anggaran dengan batas');
// pesan pasangan
await tab('more'); await nav('keluarga'); await click('[data-a=personAdd]'); await setf('name','Siti'); await setf('rel','Istri'); await click('#fok');
await tab('more'); await nav('afeksi'); t=await txt();
const n=await p.evaluate(()=>document.querySelectorAll('.draft').length); ok(n>=20,'Draf pasangan lengkap ('+n+' pesan)');
ok(/Kangen|Romantis|Maaf/i.test(t)&&/nggak|yang|sayang/.test(t),'Ada kategori & bahasa sehari-hari');
await click('[data-a=afCat][data-v=Kangen]'); const n2=await p.evaluate(()=>document.querySelectorAll('.draft').length); ok(n2>=3&&n2<n,'Filter kategori Kangen ('+n2+')');
await p.screenshot({path:'/tmp/pt/v3-pesan.png'});
await tab('cal'); await p.screenshot({path:'/tmp/pt/v3-kal.png'});
console.log('ERR',JSON.stringify(errs)); await b.close();
