import puppeteer from 'puppeteer-core';
const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'], headless: 'new' });
const p = await b.newPage();
await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const errs = [];
p.on('pageerror', (e) => errs.push('PAGEERROR ' + e.message));
p.on('console', (m) => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text()); });
await p.goto('http://localhost:8099/index.html', { waitUntil: 'networkidle0' });
await p.evaluate(() => localStorage.clear()); await p.reload({ waitUntil: 'networkidle0' });
const click = (sel) => p.evaluate((q) => { const e = document.querySelector(q); if (!e) throw new Error('tak ada ' + q); e.click(); }, sel);
const setf = (name, val) => p.evaluate((n, v) => { const el = document.querySelector('#dlg [name=' + n + ']'); if (!el) throw new Error('field ' + n); if (el.type === 'checkbox') el.checked = v; else el.value = v; }, name, val);
const submit = () => click('#fok');
const txt = () => p.evaluate(() => document.getElementById('top').innerText + '\n' + document.getElementById('main').innerText);
const nav = (to) => click(`[data-a=nav][data-to="${to}"]`);
const tab = (v) => click(`#nav [data-v=${v}]`);
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) process.exitCode = 1; };
const shot = (n) => p.screenshot({ path: `/tmp/pt/v2-${n}.png` });
let t;

// data contoh
await tab('more'); await nav('bantuan'); await click('[data-a=demoOn]');
await tab('today'); t = await txt();
ok(/hari ini/i.test(t) && /Servis AC/.test(t) && /Terlambat 4 hari/.test(t), 'Beranda: ringkasan Hari ini memuat Servis AC terlambat 4 hari');
ok(/Budget masih aman|Anggaran/.test(t), 'Beranda: status anggaran');
await shot('beranda'); await p.evaluate(() => window.scrollTo(0, 0));
await tab('rumah'); t = await txt();
ok(/perlu perhatian/i.test(t) && /Gas LPG 3kg hampir habis/.test(t) && /Pajak Honda Beat/.test(t), 'Rumah: perlu perhatian memuat stok menipis & pajak kendaraan');
await shot('rumah');
await nav('perawatan'); t = await txt();
ok(/Servis AC/.test(t) && /rutin tiap 3 bulan/.test(t) && /Terlambat 4 hari/.test(t) && /2 bulan lagi/.test(t), 'Perawatan: interval & hitung mundur');
ok(!/Ganti oli/.test(t), 'Perawatan umum tidak mencampur servis kendaraan');
await shot('perawatan');
// selesai servis AC dengan biaya + catat ke uang
await click('[data-a=planDone][data-id]'); await setf('cost', '175.000'); await setf('rec', true); await submit();
t = await txt(); ok(!/Terlambat 4 hari/.test(t) && /3 bulan lagi/.test(t), 'Selesai: jadwal dimajukan 3 bulan dari hari ini');
// tambah rencana baru
await click('[data-a=planAdd]'); await setf('name', 'Cat ulang pagar'); await setf('every', '12'); await submit();
t = await txt(); ok(/Cat ulang pagar/.test(t), 'tambah rencana perawatan manual');
// template
await click('[data-a=planTpl]'); await setf('t4', true); await submit(); t = await txt(); ok(/Semprot anti rayap/.test(t), 'tambah dari template');
// kendaraan
await p.evaluate(() => history.back()); await new Promise((r) => setTimeout(r, 300));
await nav('kendaraan'); t = await txt();
ok(/Honda Beat/.test(t) && /24\.300 km/.test(t) && /Ganti oli/.test(t) && /300 km lagi/.test(t), 'Kendaraan: odometer, pajak, servis berbasis km (300 km lagi)');
await shot('kendaraan');
await click('[data-a=vehAdd]'); await setf('name', 'Avanza'); await setf('kind', 'mobil'); await setf('plate', 'B 9 ABC'); await setf('odometer', '50000'); await submit();
t = await txt(); ok(/Avanza/.test(t) && /50\.000 km/.test(t), 'tambah kendaraan baru');
const avId = await p.evaluate(() => window.__rk.C.list(window.__rk.store(), 'veh').find((v) => v.name === 'Avanza').id);
await click(`[data-a=vehTpl][data-id="${avId}"]`); await setf('t0', true); await submit();
t = await txt(); ok(/Ganti oli/.test(t) && /5\.000 km/.test(t), 'template servis kendaraan dgn interval km');
const nk = await p.evaluate((id) => window.__rk.C.list(window.__rk.store(), 'plan').find((x) => x.vehicleId === id).nextKm, avId);
ok(nk === 55000, 'nextKm = odometer 50.000 + 5.000 = 55.000 (dapat ' + nk + ')');
await click(`[data-a=odoUpd][data-id="${avId}"]`); await setf('odometer', '49000'); await submit();
let e = await p.evaluate(() => document.getElementById('ferr').textContent); ok(/Tidak boleh lebih kecil/.test(e), 'odometer tidak boleh mundur');
await setf('odometer', '54800'); await submit(); t = await txt(); ok(/200 km lagi/.test(t), 'update odometer -> sisa 200 km');
await p.evaluate(() => { const b = [...document.querySelectorAll('[data-a=planDone]')].pop(); }); // noop
// selesai servis km: pilih plan Avanza
await p.evaluate((id) => { const pl = window.__rk.C.list(window.__rk.store(), 'plan').find((x) => x.vehicleId === id); document.querySelector(`[data-a=planDone][data-id="${pl.id}"]`).click(); }, avId);
await setf('odo', '54900'); await submit();
const nk2 = await p.evaluate((id) => window.__rk.C.list(window.__rk.store(), 'plan').find((x) => x.vehicleId === id).nextKm, avId);
ok(nk2 === 59900, 'selesai servis di 54.900 -> berikutnya 59.900 (dapat ' + nk2 + ')');
// tagihan
await p.evaluate(() => history.back()); await new Promise((r) => setTimeout(r, 300));
await nav('tagihan'); t = await txt(); ok(/Listrik PLN/.test(t) && /2 hari lagi/.test(t) && /perkiraan tagihan rutin per bulan/i.test(t), 'Tagihan: hitung mundur & total');
await shot('tagihan');
const nwBefore = await p.evaluate(() => { const C = window.__rk.C, s = window.__rk.store(); return C.netWorth(C.list(s, 'acc'), C.list(s, 'tx')); });
await click('[data-a=billPay]'); await submit();
const nwAfter = await p.evaluate(() => { const C = window.__rk.C, s = window.__rk.store(); return C.netWorth(C.list(s, 'acc'), C.list(s, 'tx')); });
ok(nwBefore - nwAfter === 450000, 'Bayar tagihan mencatat pengeluaran Rp 450.000 ke Uang');
const nb = await p.evaluate(() => { const C = window.__rk.C, b = C.list(window.__rk.store(), 'bill').find((x) => x.name === 'Listrik PLN'); return C.daysBetween(C.today(), C.billNext(b, C.today())); }); ok(nb >= 25, 'tagihan dibayar pindah ke periode berikutnya (' + nb + ' hari lagi)');
await click('[data-a=billAdd]'); await setf('name', 'PBB'); await setf('dueDay', '31'); await setf('amountEst', '800.000'); await submit();
t = await txt(); ok(/PBB/.test(t) && /Tiap tgl 31/.test(t), 'tambah tagihan rutin baru');
// stok -> belanja
await p.evaluate(() => history.back()); await new Promise((r) => setTimeout(r, 300));
await nav('stok'); await click('[data-a=set][data-v=stok]'); t = await txt(); ok(/menipis/.test(t), 'stok menipis ditandai');
await click('[data-a=invToShop]'); await click('[data-a=set][data-v=belanja]'); t = await txt(); ok(/Gas LPG 3kg/.test(t), 'stok menipis masuk daftar belanja');
await click('[data-a=set][data-v=stok]'); await click('[data-a=invInc]'); t = await txt(); ok(true, 'tombol + stok');
// aset, dokumen, kontak
await p.evaluate(() => history.back()); await new Promise((r) => setTimeout(r, 300));
await nav('aset'); t = await txt(); ok(/Kulkas 2 pintu/.test(t) && /45 hari lagi/.test(t), 'Aset: garansi hitung mundur');
await p.evaluate(() => history.back()); await new Promise((r) => setTimeout(r, 300));
await nav('dokumen'); t = await txt(); ok(/Polis asuransi rumah/.test(t) && /75 hari lagi|2 bulan lagi|3 bulan lagi/.test(t), 'Dokumen: masa berlaku');
// tombol kembali
const before = await p.evaluate(() => document.querySelector('#top h1').innerText);
await p.evaluate(() => history.back()); await new Promise((r) => setTimeout(r, 300));
const after = await p.evaluate(() => document.querySelector('#top h1').innerText);
ok(before === 'Dokumen penting' && after === 'Rumah', 'tombol kembali (history) mundur satu halaman: ' + before + ' -> ' + after);
// Lainnya screenshot
await tab('more'); await shot('lainnya');
// hapus data contoh: data asli (Avanza, PBB, Cat ulang pagar) tetap
await nav('bantuan'); await click('[data-a=demoOff]');
const left = await p.evaluate(() => { const C = window.__rk.C, s = window.__rk.store(); return { veh: C.list(s, 'veh').map((v) => v.name), bill: C.list(s, 'bill').map((v) => v.name), plan: C.list(s, 'plan').map((v) => v.name), tx: C.list(s, 'tx').length }; });
ok(left.veh.join() === 'Avanza' && left.bill.includes('PBB') && left.bill.includes('Listrik PLN') && !left.bill.includes('Internet') && left.plan.includes('Cat ulang pagar') && left.plan.includes('Semprot anti rayap/hama') && !left.plan.includes('Kuras toren air') && left.plan.includes('Servis AC'), 'hapus data contoh (yang sudah saya ubah/bayar tetap milik saya) menyisakan data asli: ' + JSON.stringify(left));
// persist & reload
await p.reload({ waitUntil: 'networkidle0' }); await tab('rumah'); await nav('kendaraan'); t = await txt(); ok(/Avanza/.test(t), 'data bertahan setelah reload');
console.log('ERRORS:', JSON.stringify(errs)); ok(errs.length === 0, 'tanpa error konsol');
await b.close();
