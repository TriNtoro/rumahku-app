import puppeteer from 'puppeteer-core'; import fs from 'node:fs';
const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'], headless: 'new' });
const p = await b.newPage(); await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const errs=[]; p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
await p.goto('http://localhost:8099/index.html',{waitUntil:'networkidle0'}); await p.evaluate(()=>localStorage.clear()); await p.reload({waitUntil:'networkidle0'});
const click=(q)=>p.evaluate((s)=>{const e=document.querySelector(s); if(!e) throw new Error('tak ada '+s); e.click();},q);
const txt=()=>p.evaluate(()=>document.getElementById('top').innerText+'\n'+document.getElementById('main').innerText);
const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m); if(!c)process.exitCode=1;}; const sleep=(ms)=>new Promise(r=>setTimeout(r,ms));
let t=await txt(); ok(/v0\.5\.4/.test(t),'Versi v0.5.4');
// data contoh
await click('#nav [data-v=more]'); await click('[data-a=nav][data-to=bantuan]'); await sleep(100);
await p.evaluate(()=>{const b=[...document.querySelectorAll('button')].find(x=>/data contoh/i.test(x.textContent)&&/Isi|Tambah/i.test(x.textContent)); if(b) b.click(); });
await sleep(300);
await p.evaluate(()=>{ window.__blobs=[]; const o=URL.createObjectURL; URL.createObjectURL=(bl)=>{window.__blobs.push(bl); return o(bl);}; HTMLAnchorElement.prototype.click=function(){ window.__dl=this.download; }; });
// masuk lewat Lainnya
await click('#nav [data-v=more]'); t=await txt(); ok(/Ekspor data \(Excel \/ PDF\)/.test(t),'Lainnya: ada menu Ekspor data');
await click('[data-a=nav][data-to=ekspor]'); t=await txt(); ok(/Excel \(\.xlsx\)/.test(t)&&/PDF/.test(t),'Halaman Ekspor: Excel & PDF');
const grab=async(fmt,scope)=>{ await click(`[data-a=expRun][data-fmt=${fmt}][data-scope=${scope}]`); await sleep(300);
  const l=await p.evaluate(()=>document.getElementById('dlg').innerText); await p.evaluate(()=>[...document.querySelectorAll('#dlg .menu button')].find(x=>/Unduh/.test(x.textContent)).click()); await sleep(300);
  return {l, name:await p.evaluate(()=>window.__dl), b64:await p.evaluate(async()=>{const bl=window.__blobs[window.__blobs.length-1]; const u=new Uint8Array(await bl.arrayBuffer()); let s=''; for(let i=0;i<u.length;i+=8192) s+=String.fromCharCode.apply(null,u.subarray(i,i+8192)); return btoa(s);})}; };
let r=await grab('xlsx','all'); ok(/siap/.test(r.l)&&/\.xlsx$/.test(r.name),'Excel semua data: menu Unduh + nama '+r.name); fs.writeFileSync('/tmp/ui.xlsx',Buffer.from(r.b64,'base64'));
r=await grab('pdf','uang'); ok(/\.pdf$/.test(r.name),'PDF Uang: '+r.name); fs.writeFileSync('/tmp/ui.pdf',Buffer.from(r.b64,'base64'));
r=await grab('pdf','rumah'); ok(/rumah/.test(r.name),'PDF Rumah: '+r.name); fs.writeFileSync('/tmp/ui_rumah.pdf',Buffer.from(r.b64,'base64'));
// seg semua transaksi
await click('[data-a=set][data-k=expTx][data-v=all]'); r=await grab('xlsx','uang'); ok(/semua/.test(r.name),'Transaksi "semua" tercermin di nama berkas'); 
// tombol di tab Uang
await click('#nav [data-v=money]'); await click('[data-a=set][data-k=moneyTab][data-v=trx]'); t=await txt(); ok(/Ekspor ke Excel \/ PDF/.test(t),'Tab Uang → Transaksi: tombol Ekspor');
// template AC
await click('#nav [data-v=more]'); await click('[data-a=nav][data-to=perawatan]'); await click('[data-a=planTpl]');
const l=await p.evaluate(()=>document.getElementById('dlg').innerText); ok(/Servis AC rumah/.test(l)&&/Servis AC mobil/.test(l),'Template perawatan: Servis AC rumah & Servis AC mobil');
ok(errs.length===0,'Tanpa error konsol '+JSON.stringify(errs)); await b.close();
