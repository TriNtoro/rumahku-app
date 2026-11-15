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
// kendaraan EV
await tab('more'); await nav('kendaraan'); await click('[data-a=tpl][data-k=veh]');
let t=await p.evaluate(()=>document.getElementById('dlg').innerText); ok(/Motor listrik/.test(t)&&/Mobil listrik/.test(t),'Template kendaraan: EV tersedia');
await setf('t2',true); await setf('t3',true); await click('#fok'); t=await txt();
ok(/⚡ EV/.test(t),'Kendaraan EV bertanda');
await tab('more'); await nav('kendaraan'); t=await txt(); console.log(t.slice(0,700));
ok(/kesehatan baterai|Cek kondisi baterai/i.test(t),'Jadwal EV per jenis di detail kendaraan');
await click('[data-a=planEdit]'); await setf('name','Servis khusus'); await click('#fok'); t=await txt(); ok(/Servis khusus/.test(t),'Jadwal kendaraan bisa diedit dari kartu');
// template rutinitas
await tab('more'); await nav('harian'); await click('[data-a=rtTpl]'); t=await p.evaluate(()=>document.getElementById('dlg').innerText);
ok(/Antar anak sekolah/.test(t)&&/Temani anak belajar/.test(t)&&/Belanja sayur/.test(t),'Template rutinitas ibu tersedia');
const n=await p.evaluate(()=>document.querySelectorAll('#dlg input[type=checkbox]').length); ok(n>=25,'Template rutinitas banyak ('+n+')');
await setf('t7',true); await setf('t14',true); await click('#fok'); t=await txt(); ok(/Antar anak sekolah/.test(t)&&/Temani anak belajar/.test(t),'Rutinitas ibu ditambahkan');
// profil + berat
await tab('more'); await click('[data-a=nav][data-to=profil]'); await click('[data-a=profilEdit]');
await setf('name','Illa'); await setf('sex','L'); await setf('height','170'); await click('#fok');
await tab('more'); await nav('berat'); t=await txt(); ok(/Catat minimal 2 kali/.test(t)||/Belum ada catatan/.test(t),'Halaman berat: kosong');
const d=(o)=>p.evaluate((o)=>Core.addDays(Core.today(),o),o);
for (const [o,kg] of [[-14,88],[-7,86,],[-1,84.5]]) { await click('[data-a=wtAdd]'); await setf('date',await d(o)); await setf('kg',String(kg).replace('.',',')); await click('#fok'); }
t=await txt(); ok(/Obesitas/.test(t),'IMT 29,2 -> Obesitas'); ok(/29,2/.test(t),'IMT terhitung 29,2');
ok(/150–300 menit/.test(t)&&/dokter/.test(t),'Saran olahraga & konsultasi muncul');
ok(await p.evaluate(()=>!!document.querySelector('#main svg polyline')),'Grafik tergambar');
ok(/kg\/minggu/.test(t),'Tren mingguan tampil');
await click('[data-a=wtAdd]'); await setf('kg','abc'); await click('#fok'); t=await p.evaluate(()=>document.getElementById('dlg').innerText); ok(/antara 20–300/.test(t),'Validasi berat'); await click('#fcancel');
await tab('more'); t=await txt(); ok(/trintoro@gmail.com/.test(t)&&/Illusix/.test(t),'Notice Illusix + email di Lainnya');
await nav('bantuan'); t=await p.evaluate(()=>document.getElementById('main').textContent); ok(/dilarang diperjualbelikan/.test(t),'Notice di Bantuan');
await tab('more'); await nav('berat'); await p.screenshot({path:'/tmp/berat.png'}); console.log('ERRS',errs); await b.close();
