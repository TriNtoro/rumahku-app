import puppeteer from 'puppeteer-core';
const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'], headless: 'new' });
const p = await b.newPage();
await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const errs = [];
p.on('pageerror', (e) => errs.push('PAGEERROR ' + e.message));
p.on('console', (m) => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text()); });
await p.goto('http://localhost:8099/index.html', { waitUntil: 'networkidle0' });
await p.evaluate(() => { localStorage.clear(); return indexedDB.deleteDatabase('rumahku-files'); }); await p.reload({ waitUntil: 'networkidle0' });
const click = (sel) => p.evaluate((q) => { const e = document.querySelector(q); if (!e) throw new Error('tak ada ' + q); e.click(); }, sel);
const realClick = async (sel) => { await p.evaluate((q) => document.querySelector(q).scrollIntoView({ block: 'center' }), sel); const r = await p.evaluate((q) => { const e = document.querySelector(q).getBoundingClientRect(); return [e.x + e.width / 2, e.y + e.height / 2]; }, sel); await p.mouse.click(r[0], r[1]); };
const setf = (name, val) => p.evaluate((n, v) => { const el = document.querySelector('#dlg [name=' + n + ']'); if (!el) throw new Error('field ' + n); if (el.type === 'checkbox') el.checked = v; else el.value = v; }, name, val);
const submit = () => click('#fok');
const txt = () => p.evaluate(() => document.getElementById('top').innerText + '\n' + document.getElementById('main').innerText);
const nav = (to) => click(`[data-a=nav][data-to="${to}"]`);
const tab = (v) => click(`#nav [data-v=${v}]`);
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) process.exitCode = 1; };
const shot = (n) => p.screenshot({ path: `/tmp/pt/v3-${n}.png` });
const nlog = () => p.evaluate(() => JSON.parse(localStorage.getItem('rk1.nlog') || '[]'));
const hm = (off) => p.evaluate((o) => { const d = new Date(Date.now() + o * 60000); return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); }, off);
let t;

// 1. sapaan tanpa nama -> isi profil
t = await txt(); ok(/Selamat (pagi|siang|sore|malam)/.test(t) && /Siapa nama Anda/.test(t), 'Beranda: sapaan + ajakan isi nama bila kosong');
await click('[data-a=profilEdit]'); await setf('name', 'Illa Contoh'); await setf('nick', 'Illa'); await setf('callKid', 'Papa'); await submit();
t = await txt(); ok(/Selamat (pagi|siang|sore|malam), Illa/.test(t) && !/Siapa nama Anda/.test(t), 'Sapaan memakai nama dari Profil: "Selamat …, Illa"');
await tab('more'); t = await txt(); ok(/Profil saya/.test(t) && /Keluarga & hati/i.test(t) && /Kabar & afeksi/.test(t), 'Lainnya: menu Profil, Keluarga, Kabar & afeksi, Notifikasi');

// 2. rutinitas dari template
await nav('harian'); await click('[data-a=rtTpl]'); await setf('t0', true); await setf('t1', true); await submit();
t = await txt(); ok(/Minum air 2 liter/.test(t) && /0\s*\/8/.test(t.replace(/\n/g, '')) , 'Rutinitas: template Minum air 2 liter (0/8)');
const water = await p.evaluate(() => Object.values(__rk.store().rec).find((r) => r._t === 'rt' && /Minum air/.test(r.name)).id);
for (let i = 0; i < 3; i++) await click(`[data-a=rtInc][data-id="${water}"]`);
await click(`[data-a=rtDec][data-id="${water}"]`);
t = await txt(); ok(/2\s*\/8/.test(t.replace(/\n/g, '')), 'Rutinitas: +1 tiga kali, −1 sekali = 2/8');
await p.reload({ waitUntil: 'networkidle0' }); await tab('today'); t = await txt();
ok(/Rutinitas hari ini/i.test(t) && /Minum air 2 liter/.test(t), 'Beranda memuat Rutinitas hari ini setelah reload (tersimpan)');
await shot('beranda');

// 3. tick: rutinitas custom jatuh tempo sekarang -> notifikasi sekali
await tab('more'); await nav('harian'); await click('[data-a=rtAdd]');
await setf('name', 'Cek email kerja'); await setf('target', '1'); await setf('unit', 'kali'); await setf('from', await hm(-1)); await submit();
await p.evaluate(() => __rk.tick()); let n1 = (await nlog()).filter((x) => /Cek email kerja/.test(x.body)).length;
await p.evaluate(() => __rk.tick()); let n2 = (await nlog()).filter((x) => /Cek email kerja/.test(x.body)).length;
ok(n1 === 1 && n2 === 1, 'Pengingat rutinitas berbunyi tepat sekali (tick dua kali)');
await p.reload({ waitUntil: 'networkidle0' }); await p.evaluate(() => __rk.tick());
ok((await nlog()).filter((x) => /Cek email kerja/.test(x.body)).length === 1, 'Tidak berbunyi lagi setelah reload (kunci tersimpan)');

// 4. tugas kerja ber-jam + pengingat
await tab('more'); await nav('tugas'); await click('[data-a=taskAdd]'); await setf('title', 'Kirim laporan ke bos'); await setf('due', await p.evaluate(() => Core.today())); await setf('remind', '10'); await submit();
t = await p.evaluate(() => document.querySelector('#dlg #ferr') && document.querySelector('#dlg #ferr').textContent);
ok(/butuh jam/i.test(t || ''), 'Validasi: pengingat tanpa jam ditolak');
await setf('time', await hm(-1)); await setf('remind', '0'); await setf('label', 'Pekerjaan'); await submit();
t = await txt(); ok(/Kirim laporan ke bos/.test(t) && /🔔/.test(t), 'Tugas ber-jam tampil dengan ikon lonceng');
await p.evaluate(() => __rk.tick()); ok((await nlog()).some((x) => /Kirim laporan ke bos/.test(x.body) && /sekarang/.test(x.body)), 'Tugas ber-jam: pengingat berbunyi pada jamnya');

// 5. keluarga
await tab('more'); await nav('keluarga'); await click('[data-a=personAdd]');
const bd = await p.evaluate(() => Core.addDays(Core.today(), 3).replace(/^\d{4}/, '1990'));
await setf('name', 'Siti Aminah'); await setf('nick', 'Siti'); await setf('rel', 'Istri'); await setf('birth', bd); await setf('phone', '0812-3456-7890'); await submit();
await click('[data-a=personAdd]'); await setf('name', 'Budi Illa'); await setf('nick', 'Budi'); await setf('rel', 'Anak'); await submit();
t = await txt(); ok(/Siti Aminah/.test(t) && /Budi Illa/.test(t) && /🎂/.test(t), 'Keluarga: 2 anggota, badge ulang tahun 3 hari');
const sid = await p.evaluate(() => Object.values(__rk.store().rec).find((r) => r._t === 'person' && r.name === 'Siti Aminah').id);
await click(`[data-a=personOpen][data-id="${sid}"]`); t = await txt();
ok(/Siti Aminah/.test(t) && /Data identitas/i.test(t) && /Foto & berkas/i.test(t), 'Detail anggota: Data identitas + Foto & berkas');
await click('[data-a=idAdd]'); await setf('kind', 'KTP'); await setf('no', '3201010101900001'); await submit();
await click('[data-a=idAdd]'); await setf('kind', 'NPWP'); await setf('no', '09.254.294.3-407.000'); await submit();
t = await txt(); ok(/3201••••••••0001/.test(t) && !/3201010101900001/.test(t), 'Nomor KTP disamarkan di layar');
await click('[data-a=idShow]'); t = await txt(); ok(/3201010101900001/.test(t), 'Tampilkan membuka nomor');
await click('[data-a=idShow]'); t = await txt(); ok(!/3201010101900001/.test(t), 'Sembunyikan menutup lagi');
// foto profil (file chooser nyata)
let [fc] = await Promise.all([p.waitForFileChooser(), realClick('[data-a=personPhoto]').then(()=>p.evaluate(()=>[...document.querySelectorAll('#dlg .menu button')].find(x=>/galeri/.test(x.textContent)).click()))]); await fc.accept(['/tmp/pt/ktp.png']);
await p.waitForFunction((id) => (window.__rk.store().rec[id].photo || '').startsWith('data:image/jpeg'), { timeout: 8000 }, sid);
const phLen = await p.evaluate((id) => __rk.store().rec[id].photo.length, sid);
ok(phLen > 500 && phLen < 40000, 'Foto profil dikecilkan ke JPEG kecil (' + phLen + ' karakter)');
// berkas foto (IndexedDB)
[fc] = await Promise.all([p.waitForFileChooser(), realClick('[data-a=fileAdd]').then(()=>p.evaluate(()=>[...document.querySelectorAll('#dlg .menu button')].find(x=>/galeri/.test(x.textContent)).click()))]); await fc.accept(['/tmp/pt/ktp.png']);
await p.waitForSelector('#dlg [name=label]', { timeout: 8000 }); await setf('label', 'KTP depan'); await submit();
await p.waitForFunction(() => /KTP depan/.test(document.getElementById('main').innerText), { timeout: 8000 });
const inIdb = await p.evaluate(() => new Promise((res) => { const q = indexedDB.open('rumahku-files'); q.onsuccess = () => { const r = q.result.transaction('f').objectStore('f').getAll(); r.onsuccess = () => res(r.result.length && r.result[0].size); }; }));
ok(inIdb > 1000, 'Berkas KTP tersimpan di IndexedDB perangkat (' + inIdb + ' byte)');
const inStore = await p.evaluate(() => JSON.stringify(__rk.store()));
ok(!/base64,.{3000}/.test(inStore) && /pfile/.test(inStore), 'Store hanya memuat metadata berkas, bukan isi foto besar');
await click('[data-a=fileOpen]'); await p.waitForSelector('#dlg img', { timeout: 5000 }); ok(true, 'Berkas dapat dibuka/dilihat'); await click('#dlg [data-i=x]');
await shot('orang');

// 6. afeksi
await p.evaluate(() => { window.__u = null; window.open = (u) => { window.__u = u; }; });
await tab('more'); await nav('afeksi'); t = await txt();
ok(/Kabar/.test(t) && /Siti/.test(t) && !/\{nama\}|\{saya\}|\{sebutan\}/.test(t), 'Kabar & afeksi: draf terisi nama, tidak ada placeholder mentah');
await click(`[data-a=afWho][data-id="${sid}"]`); await click('[data-a=afWa]'); const u = await p.evaluate(() => window.__u);
ok(/^https:\/\/wa\.me\/6281234567890\?text=/.test(u || '') && /Siti|sayang|kamu/i.test(decodeURIComponent(u || '')), 'Tombol WhatsApp membuka wa.me dengan nomor 62… dan pesan terisi');
ok(await p.evaluate((id) => __rk.store().rec[id].lastContact === Core.today(), sid), 'Terakhir dikabari tercatat');
await shot('afeksi');
const budi = await p.evaluate(() => Object.values(__rk.store().rec).find((r) => r._t === 'person' && r.name === 'Budi Illa').id);
await click(`[data-a=afWho][data-id="${budi}"]`); t = await txt(); ok(/Papa/.test(t) && /Budi/.test(t), 'Draf anak memakai sebutan "Papa" dan nama Budi');
await click('[data-a=draftAdd]'); await setf('text', 'Halo {nama}, ayo main bola sore ini!'); await setf('grp', 'anak'); await submit();
t = await txt(); ok(/Halo Budi, ayo main bola sore ini/.test(t), 'Draf buatan sendiri muncul untuk anak');
await click('[data-a=set][data-v=kartu]'); t = await txt(); const c1 = await p.evaluate(() => document.querySelector('.cc-in p').textContent);
await click('[data-a=cardNext]'); const c2 = await p.evaluate(() => document.querySelector('.cc-in p').textContent);
ok(c1 && c2 && c1 !== c2, 'Kartu obrolan: "Kartu lain" mengganti pertanyaan');
await click('[data-a=cardDone]'); await click('[data-a=set][data-v=riwayat]'); t = await txt(); ok(t.includes(c2), 'Riwayat memuat kartu yang sudah dibahas');
await click('[data-a=set][data-v=kartu]'); await shot('kartu');

// 7. notifikasi & ICS
await p.evaluate(() => { window.__ics = null; const o = URL.createObjectURL.bind(URL); URL.createObjectURL = (bl) => { if (bl.type === 'text/calendar') bl.text().then((x) => { window.__ics = x; }); return o(bl); }; });
await tab('more'); await nav('notif'); t = await txt(); ok(/Izin notifikasi/.test(t) && /Riwayat notifikasi/i.test(t) && /Cek email kerja/.test(t), 'Halaman Notifikasi: izin + riwayat berisi pengingat yang berbunyi');
await click('[data-a=icsAll]'); await p.waitForFunction(() => window.__ics, { timeout: 4000 });
const ics = await p.evaluate(() => window.__ics);
ok(/BEGIN:VCALENDAR/.test(ics) && /Minum air 2 liter/.test(ics) && /Kirim laporan ke bos/.test(ics) && /TRIGGER:-PT0M/.test(ics) && /RRULE:FREQ=DAILY/.test(ics), 'Ekspor .ics memuat rutinitas (RRULE harian) dan tugas (alarm)');
await shot('notif');
await tab('more'); await nav('harian'); await shot('harian');
await tab('more'); await nav('keluarga'); await shot('keluarga');

// 8. backup/impor tetap utuh
const exp = await p.evaluate(() => JSON.stringify(__rk.store()));
await p.evaluate(() => localStorage.clear()); await p.reload({ waitUntil: 'networkidle0' });
await p.evaluate((s) => { localStorage.setItem('rk1.store', s); }, exp); await p.reload({ waitUntil: 'networkidle0' });
t = await txt(); ok(/, Illa/.test(t) && /Minum air 2 liter/.test(t), 'Data (profil, rutinitas) pulih dari backup JSON');

console.log('ERRORS:', JSON.stringify(errs));
await b.close();
