import puppeteer from 'puppeteer-core';
const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'], headless: 'new' });
const p = await b.newPage(); await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const errs=[]; p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
await p.goto('http://localhost:8099/index.html',{waitUntil:'networkidle0'}); await p.evaluate(()=>localStorage.clear()); await p.reload({waitUntil:'networkidle0'});
await p.evaluate(()=>{ const st=window.__rk.store(); window.__rk.C.put(st,'acc',{name:'Kas utama',type:'cash',opening:50000000}); localStorage.setItem('rk1.store',JSON.stringify(st)); });
await p.reload({waitUntil:'networkidle0'});
const click=(q)=>p.evaluate((s)=>{const e=document.querySelector(s); if(!e) throw new Error('tak ada '+s); e.click();},q);
const clickT=(sel,re)=>p.evaluate((s,r)=>{const e=[...document.querySelectorAll(s)].find(x=>new RegExp(r,'i').test(x.textContent)); if(!e) throw new Error('tak ada '+s+' '+r); e.click();},sel,re);
const txt=()=>p.evaluate(()=>document.getElementById('top').innerText+'\n'+document.getElementById('main').innerText);
const dlgT=()=>p.evaluate(()=>document.getElementById('dlg').innerText);
const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m); if(!c)process.exitCode=1;}; const sleep=(ms)=>new Promise(r=>setTimeout(r,ms));
const setv=(o)=>p.evaluate((o)=>{ for(const [k,v] of Object.entries(o)){ const el=document.querySelector('#dlg [name='+k+']'); if(!el) throw new Error('field '+k); if(el.type==='checkbox') el.checked=!!v; else el.value=v; el.dispatchEvent(new Event('input',{bubbles:true})); el.dispatchEvent(new Event('change',{bubbles:true})); } },o);
const submit=()=>p.evaluate(()=>{const f=document.querySelector('#dlg form'); f.requestSubmit();});
const store=()=>p.evaluate(()=>JSON.parse(localStorage.getItem('rk1.store')));
const recs=async(t)=>Object.values((await store()).rec).filter(r=>r._t===t&&!r._d);
let t=await txt(); ok(/v1\.0/.test(t),'Versi v0.5.7');
await click('#nav [data-v=more]'); t=await txt(); ok(/Tagihan & angsuran/.test(t),'Lainnya: Tagihan & angsuran');
await click('[data-a=nav][data-to=tagihan]'); t=await txt(); ok(/Tagihan/i.test(t)&&/Sisa kewajiban|Isi total/.test(t),'Halaman tagihan: dashboard');
// 14 jenis
await click('[data-a=billAdd]'); t=await dlgT(); ok(/KPR/.test(t)&&/Haji/.test(t)&&/Umrah/.test(t)&&/Arisan/.test(t)&&/Cicilan elektronik/.test(t)&&/Cicilan pinjaman/.test(t)&&/Asuransi/.test(t)&&/pendidikan/i.test(t)&&/Internet dan telepon/.test(t)&&/Listrik dan air/.test(t)&&/Iuran lingkungan/.test(t)&&/Langganan/.test(t)&&/lainnya/i.test(t)&&/kendaraan/i.test(t),'Menu: semua kategori bawaan');
// KPR
await clickT('#dlg button','KPR'); await sleep(100);
await setv({amountEst:'5000000',dueDay:'10',total:'500000000',tenor:'180',startDate:'2026-01-10',instNow:'11',creditor:'BTN',ref:'KPR-998877'});
await submit(); await sleep(200);
let bl=await recs('bill'); ok(bl.length===1&&bl[0].tenor===180&&bl[0].total===500000000&&bl[0].instBefore===10&&bl[0].cat==='kpr','KPR tersimpan dengan field angsuran');
t=await txt(); ok(/angsuran 11\/180/.test(t)&&/sisa Rp ?850\.000\.000/.test(t),'Daftar: angsuran 11/180, sisa Rp850.000.000 → '+(t.match(/angsuran[^\n]*/)||[''])[0]);
// buka detail & bayar
await click('[data-a=billOpen]'); await sleep(100); t=await txt(); ok(/Sisa tenor/.test(t)&&/170 kali/.test(t)&&/Riwayat pembayaran/i.test(t),'Detail KPR: sisa tenor 170');
await click('[data-a=billPay]'); await sleep(100); t=await dlgT(); ok(/angsuran ke-11/.test(t),'Konfirmasi bayar menyebut angsuran ke-11');
await submit(); await sleep(200);
let bp=await recs('bpay'), tx=await recs('tx'); ok(bp.length===1&&bp[0].instNo===11&&tx.length===1&&tx[0].amount===5000000&&tx[0].kind==='expense','Bayar: riwayat angsuran ke-11 + 1 transaksi');
t=await txt(); ok(/ke-12 dari 180/.test(t)||/Angsuran\s*ke-12/.test(t),'Detail: berikutnya angsuran ke-12');
// bayar lagi (maju) tidak ganda: periode berikut
await click('[data-a=billPay]'); await sleep(100); await submit(); await sleep(200);
bp=await recs('bpay'); ok(bp.length===2&&new Set(bp.map(x=>x.occ)).size===2,'Pembayaran kedua = periode lain (tidak ganda)');
// ubah template tidak ubah riwayat
await click('[data-a=billEdit]'); await sleep(100); await setv({amountEst:'5500000'}); await submit(); await sleep(300);
t=await dlgT(); ok(/hanya berlaku untuk tagihan MENDATANG/i.test(t),'Konfirmasi: perubahan hanya untuk jadwal mendatang');
await clickT('#dlg button','Ya, lanjutkan'); await sleep(200);
bp=await recs('bpay'); ok(bp.every(x=>x.amount===5000000),'Riwayat tidak berubah setelah edit nominal'); bl=await recs('bill'); ok(bl[0].amountEst===5500000,'Template terbarui');
// batalkan pembayaran
await clickT('[data-a=billVoid]','Batalkan'); await sleep(100); await clickT('#dlg button','Ya, lanjutkan'); await sleep(200);
bp=await recs('bpay'); tx=await recs('tx'); ok(bp.filter(x=>x.void).length===1&&tx.filter(x=>x.void).length===1,'Batalkan: riwayat & transaksi di-void, tidak dihapus');
// arisan mingguan
await click('#nav [data-v=more]'); await click('[data-a=nav][data-to=tagihan]');
await click('[data-a=billAdd]'); await clickT('#dlg button','Arisan'); await sleep(100);
await setv({name:'Arisan RT',amountEst:'50000',freq:'weekly',dueWeekday:'6',tenor:'10',startDate:'2026-11-07'}); await submit(); await sleep(200);
t=await txt(); ok(/Arisan RT/.test(t)&&/tiap sabtu/.test(t),'Arisan mingguan tampil: tiap sabtu');
// kalender memuat jadwal
await click('#nav [data-v=cal]'); await sleep(200); t=await txt(); ok(/Arisan RT|KPR/.test(t),'Jadwal tagihan masuk kalender');
// haji: target tanpa tenor
await click('#nav [data-v=more]'); await click('[data-a=nav][data-to=tagihan]'); await click('[data-a=billAdd]'); await clickT('#dlg button','Haji'); await sleep(100);
await setv({amountEst:'2500000',dueDay:'1',total:'35000000',paidBefore:'5000000',endDate:'2028-12-01'}); await submit(); await sleep(200);
t=await txt(); ok(/sisa Rp ?30\.000\.000/.test(t),'Haji: sisa Rp30.000.000');
// pelunasan arisan? lunasi KPR lebih awal
await clickT('[data-a=billOpen]','KPR'); await sleep(100); await click('[data-a=billPayoff]'); await sleep(100); t=await dlgT(); ok(/menutup template/.test(t),'Pelunasan: peringatan menutup template');
await submit(); await sleep(200); bl=await recs('bill'); ok(bl.find(x=>x.cat==='kpr').closed===true,'Pelunasan: template ditutup');
t=await txt(); ok(/Lunas/.test(t),'Status Lunas tampil');
// hapus template: riwayat tetap
await click('[data-a=billDel]'); await sleep(100); await clickT('#dlg button','Ya, lanjutkan'); await sleep(200);
bl=await recs('bill'); bp=await recs('bpay'); tx=await recs('tx'); ok(!bl.find(x=>x.cat==='kpr')&&bp.length>=3&&tx.filter(x=>!x.void).length>=2,'Hapus template: riwayat & transaksi tetap');
await click('#nav [data-v=more]'); await click('[data-a=nav][data-to=tagihan]'); await click('[data-a=nav][data-to=riwayatbayar]'); t=await txt(); ok(/template dihapus/.test(t)&&/KPR/.test(t),'Riwayat: pembayaran template terhapus tetap terlihat');
// kunci: nomor kontrak
await click('#nav [data-v=more]'); await click('[data-a=nav][data-to=kunci]'); await click('[data-a=vSetup]'); await sleep(100);
ok(true,'—');
ok(errs.length===0,'Tanpa error konsol '+JSON.stringify(errs)); await b.close();
