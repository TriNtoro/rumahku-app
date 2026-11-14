/* RUMAHKU-ONE Lite v0.3 — UI. Data: penyimpanan lokal + (opsional) file pribadi di Google Drive. */
(function () {
  'use strict';
  const C = Core;
  const LS = 'rk1.store', CFG = 'rk1.cfg';
  const SCOPE = 'https://www.googleapis.com/auth/drive.appdata';
  const DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const EXP_CATS = ['Makan', 'Transportasi', 'Belanja', 'Tagihan', 'Rumah', 'Kesehatan', 'Hiburan', 'Pendidikan', 'Lainnya'];
  const MOODS = ['😞', '🙁', '😐', '🙂', '😄'];
  const REPEATS = [['none', 'Tidak berulang'], ['daily', 'Setiap hari'], ['weekly', 'Setiap minggu'], ['monthly', 'Setiap bulan'], ['yearly', 'Setiap tahun']];
  const GROUPS = { rumah: ['Rumah', '🏠', 'c2'], kendaraan: ['Kendaraan', '🚗', 'c4'], elektronik: ['Elektronik', '🔌', 'c6'] };
  const ASSET_EMOJI = { Elektronik: '🔌', Perabot: '🛋️', Bangunan: '🏗️', Lainnya: '📦' };
  const TEMPLATES = [
    { g: 'rumah', name: 'Servis AC', every: 3, unit: 'month' }, { g: 'rumah', name: 'Kuras toren/tandon air', every: 6, unit: 'month' },
    { g: 'rumah', name: 'Bersihkan talang & cek atap', every: 6, unit: 'month' }, { g: 'rumah', name: 'Cek instalasi listrik & MCB', every: 12, unit: 'month' },
    { g: 'rumah', name: 'Semprot anti rayap/hama', every: 12, unit: 'month' }, { g: 'rumah', name: 'Ganti filter air', every: 3, unit: 'month' },
    { g: 'rumah', name: 'Kuras septic tank', every: 36, unit: 'month' }, { g: 'rumah', name: 'Cek tabung pemadam & detektor asap', every: 12, unit: 'month' },
    { g: 'elektronik', name: 'Bersihkan kulkas & cek karet pintu', every: 6, unit: 'month' }, { g: 'elektronik', name: 'Servis mesin cuci', every: 12, unit: 'month' },
    { g: 'elektronik', name: 'Backup foto & data HP/laptop', every: 3, unit: 'month' },
  ];
  const VEH_TEMPLATES = [
    { name: 'Ganti oli', every: 2, unit: 'month', kmEvery: 2500 }, { name: 'Servis berkala', every: 6, unit: 'month', kmEvery: 10000 },
    { name: 'Cek tekanan & kondisi ban', every: 1, unit: 'month', kmEvery: 0 }, { name: 'Cek aki', every: 12, unit: 'month', kmEvery: 0 },
  ];
  const BILL_NAMES = ['Listrik PLN', 'Internet', 'PDAM / air', 'PBB', 'Iuran RT / sampah', 'Gas', 'Asuransi', 'Cicilan', 'Langganan streaming'];

  // ---------- state ----------
  function readJSON(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } }
  let store = readJSON(LS);
  if (!C.validStore(store)) store = C.emptyStore();
  let cfg = readJSON(CFG) || {};
  const ui = { tab: 'today', stack: [], planGroup: 'semua', assetCat: 'Semua', stokTab: 'belanja', taskFilter: 'aktif', calMonth: null, calSel: null, moneyMonth: null, addFn: null, section: null, reveal: {}, afTab: 'kabar', afWho: null, cardCat: null, cardShift: 0 };
  let syncMsg = '', syncing = false, syncAgain = false, syncTimer = null, ignorePop = false;

  function persist() { try { localStorage.setItem(LS, JSON.stringify(store)); } catch (e) { toast('Penyimpanan penuh/tidak tersedia: ekspor backup sekarang'); } }
  function saveCfg() { try { localStorage.setItem(CFG, JSON.stringify(cfg)); } catch (e) { /* abaikan */ } }
  function commit() { persist(); scheduleSync(); render(); }
  const list = (t) => C.list(store, t);
  const get = (type, id) => (store.rec[id] && !store.rec[id]._d && store.rec[id]._t === type ? store.rec[id] : null);
  const nowYM = () => C.today().slice(0, 7);

  // ---------- util tampilan ----------
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const num = (n) => String(Math.round(+n || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  function fmtDate(s) {
    if (!s) return '';
    const d = C.parseD(s);
    return DAYS[d.getDay()].slice(0, 3) + ', ' + d.getDate() + ' ' + MONTHS[d.getMonth()].slice(0, 3) + ' ' + d.getFullYear();
  }
  const ymLabel = (ym) => MONTHS[+ym.slice(5, 7) - 1] + ' ' + ym.slice(0, 4);
  const ymShift = (ym, n) => C.addMonths(ym + '-01', n, 1).slice(0, 7);
  function toast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg; t.style.display = 'block';
    clearTimeout(toast._t); toast._t = setTimeout(() => { t.style.display = 'none'; }, 3200);
  }
  const rp = (n) => C.fmtIDR(n);
  const sgn = (n) => (n < 0 ? 'neg' : '');
  const ic = (cls, em) => `<span class="ic ${cls || ''}" aria-hidden="true">${em}</span>`;
  function badge(date) {
    const n = C.daysBetween(C.today(), date);
    return `<span class="bd ${C.urgency(n, 7) === 'ok' ? '' : C.urgency(n, 7)}">${C.countdown(n)}</span>`;
  }

  // ---------- dialog & form ----------
  const dlg = document.getElementById('dlg');
  function closeDlg() { if (dlg.open) dlg.close(); }
  function fieldHTML(f, v) {
    const val = v == null ? '' : v;
    if (f.type === 'check') return `<label class="f c"><input type="checkbox" name="${f.k}" ${val ? 'checked' : ''}> ${esc(f.label)}</label>`;
    let inner;
    if (f.type === 'select') inner = `<select name="${f.k}">${f.opts.map((o) => `<option value="${esc(o[0])}" ${String(o[0]) === String(val) ? 'selected' : ''}>${esc(o[1])}</option>`).join('')}</select>`;
    else if (f.type === 'textarea') inner = `<textarea name="${f.k}" rows="3">${esc(val)}</textarea>`;
    else if (f.type === 'amount') inner = `<input name="${f.k}" inputmode="numeric" autocomplete="off" placeholder="mis. 25.000" value="${esc(val)}">`;
    else if (f.type === 'number') inner = `<input name="${f.k}" type="number" inputmode="numeric" min="0" value="${esc(val)}">`;
    else inner = `<input name="${f.k}" type="${f.type || 'text'}" value="${esc(val)}" ${f.list ? 'list="dl-' + f.k + '"' : ''} autocomplete="off">` + (f.list ? `<datalist id="dl-${f.k}">${f.list.map((x) => `<option value="${esc(x)}">`).join('')}</datalist>` : '');
    return `<label class="f">${esc(f.label)}${f.req ? ' *' : ''}${inner}</label>`;
  }
  // fields: [{k,label,type,req,opts,list}], onOk(values) -> pesan error (string) atau undefined
  function openForm(title, fields, init, onOk, extras, note) {
    init = init || {};
    dlg.innerHTML = `<form method="dialog" novalidate><h3>${esc(title)}</h3>${note ? `<p class="note" style="margin:0">${esc(note)}</p>` : ''}${fields.map((f) => fieldHTML(f, init[f.k])).join('')}<div class="err" id="ferr"></div><div class="btns"><button type="button" class="btn alt" id="fcancel">Batal</button><button class="btn" id="fok" type="submit">Simpan</button></div>${(extras || []).length ? `<div class="btns">${extras.map((x, i) => `<button type="button" class="btn bad sm" data-x="${i}">${esc(x.label)}</button>`).join('')}</div>` : ''}</form>`;
    const form = dlg.querySelector('form');
    form.addEventListener('click', (e) => {
      if (e.target.id === 'fcancel') closeDlg();
      const xi = e.target.dataset && e.target.dataset.x;
      if (xi != null) { if (extras[xi].fn() !== false) closeDlg(); }
    });
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const v = {};
      for (const f of fields) {
        const el = form.elements[f.k];
        v[f.k] = f.type === 'check' ? el.checked : String(el.value || '').trim();
        if (f.req && !v[f.k]) { form.querySelector('#ferr').textContent = `"${f.label}" wajib diisi.`; return; }
      }
      const err = onOk(v);
      if (err) { form.querySelector('#ferr').textContent = err; return; }
      closeDlg();
    });
    dlg.showModal();
    const first = form.querySelector('input,select,textarea'); if (first && first.type !== 'checkbox') first.focus();
  }
  function openMenu(title, items) {
    dlg.innerHTML = `<div class="menu"><h3>${esc(title)}</h3>${items.map((it, i) => `<button class="btn alt" data-i="${i}">${esc(it.label)}</button>`).join('')}<button class="btn bad sm" data-i="x">Tutup</button></div>`;
    dlg.querySelector('.menu').addEventListener('click', (e) => {
      const i = e.target.dataset && e.target.dataset.i; if (i == null) return;
      closeDlg(); if (i !== 'x') items[i].fn();
    });
    dlg.showModal();
  }
  const confirmBox = (msg, yes) => openMenu(msg, [{ label: 'Ya, lanjutkan', fn: yes }]);
  const accOpts = () => list('acc').map((a) => [a.id, a.name]);

  // ---------- form per modul ----------
  function taskForm(t) {
    t = t || {};
    openForm(t.id ? 'Ubah tugas' : 'Tugas baru', [
      { k: 'title', label: 'Judul', req: true }, { k: 'due', label: 'Tenggat', type: 'date' },
      { k: 'repeat', label: 'Pengulangan', type: 'select', opts: REPEATS },
      { k: 'prio', label: 'Prioritas', type: 'select', opts: [['0', 'Biasa'], ['1', 'Penting']] },
      { k: 'time', label: 'Jam (opsional, untuk pengingat)', type: 'time' }, { k: 'remind', label: 'Pengingat', type: 'select', opts: REMIND_OPTS },
      { k: 'label', label: 'Label / proyek (mis. Pekerjaan)', list: ['Pekerjaan', 'Rumah', 'Keluarga', 'Pribadi'] }, { k: 'notes', label: 'Catatan', type: 'textarea' },
    ], { title: t.title, due: t.due || '', time: t.time || '', remind: t.remind == null ? '' : t.remind, repeat: t.repeat || 'none', prio: t.prio || '0', label: t.label, notes: t.notes }, (v) => {
      if (v.repeat !== 'none' && !v.due) return 'Tugas berulang perlu tenggat.';
      if (v.time && !v.due) return 'Jam butuh tanggal tenggat.';
      if (v.remind !== '' && !v.time) return 'Pengingat butuh jam. Isi jam, atau pilih "Tanpa pengingat".';
      C.put(store, 'task', { id: t.id, title: v.title, due: v.due || '', time: v.time, remind: v.remind, repeat: v.repeat, prio: v.prio, label: v.label, notes: v.notes, anchorDay: v.due ? C.parseD(v.due).getDate() : undefined, done: t.done || false, doneLog: t.doneLog });
      commit();
    }, t.id ? [{ label: 'Hapus tugas', fn: () => { C.remove(store, t.id); commit(); } }] : null);
  }
  function eventForm(ev, occ) {
    ev = ev || {};
    const extras = [];
    if (ev.id) {
      if (occ && ev.repeat && ev.repeat !== 'none') extras.push({ label: 'Lewati tanggal ini saja', fn: () => { C.put(store, 'event', { id: ev.id, skip: (ev.skip || []).concat([occ]) }); commit(); } });
      extras.push({ label: 'Hapus acara', fn: () => { C.remove(store, ev.id); commit(); } });
    }
    openForm(ev.id ? 'Ubah acara' : 'Acara baru', [
      { k: 'title', label: 'Judul', req: true }, { k: 'date', label: 'Tanggal', type: 'date', req: true },
      { k: 'allDay', label: 'Sepanjang hari', type: 'check' }, { k: 'time', label: 'Jam mulai', type: 'time' },
      { k: 'remind', label: 'Pengingat (acara ber-jam)', type: 'select', opts: REMIND_OPTS },
      { k: 'repeat', label: 'Pengulangan', type: 'select', opts: REPEATS }, { k: 'until', label: 'Berulang sampai (opsional)', type: 'date' },
      { k: 'notes', label: 'Catatan', type: 'textarea' },
    ], { title: ev.title, date: ev.date || ui.calSel || C.today(), allDay: ev.allDay !== false && !ev.time, time: ev.time, remind: ev.remind == null ? '10' : ev.remind, repeat: ev.repeat || 'none', until: ev.until, notes: ev.notes }, (v) => {
      C.put(store, 'event', { id: ev.id, title: v.title, date: v.date, allDay: v.allDay, time: v.allDay ? '' : v.time, remind: v.remind, repeat: v.repeat, until: v.until || '', notes: v.notes, skip: ev.skip });
      commit();
    }, extras);
  }
  function txForm(kind, pre) {
    if (!list('acc').length) { toast('Buat akun dulu (mis. Dompet)'); return accForm(); }
    pre = pre || {};
    const opts = accOpts();
    openForm('Catat transaksi', [
      { k: 'kind', label: 'Jenis', type: 'select', opts: [['expense', 'Pengeluaran'], ['income', 'Pemasukan'], ['transfer', 'Transfer antar akun']] },
      { k: 'amount', label: 'Jumlah (Rp)', type: 'amount', req: true }, { k: 'acc', label: 'Akun', type: 'select', opts },
      { k: 'to', label: 'Ke akun (hanya transfer)', type: 'select', opts: [['', '—']].concat(opts) },
      { k: 'cat', label: 'Kategori', list: EXP_CATS.concat(['Gaji', 'Bonus']) }, { k: 'date', label: 'Tanggal', type: 'date', req: true }, { k: 'note', label: 'Catatan' },
    ], { kind: kind || 'expense', date: C.today(), acc: opts[0][0], amount: pre.amount, cat: pre.cat, note: pre.note }, (v) => {
      const amount = C.parseAmount(v.amount);
      if (amount == null || amount <= 0) return 'Jumlah harus bilangan bulat rupiah lebih dari 0 (tanpa desimal).';
      if (v.kind === 'transfer' && (!v.to || v.to === v.acc)) return 'Transfer perlu akun tujuan yang berbeda.';
      C.put(store, 'tx', { kind: v.kind, amount, acc: v.acc, to: v.kind === 'transfer' ? v.to : '', cat: v.kind === 'transfer' ? '' : (v.cat || 'Lainnya'), date: v.date, note: v.note, cid: C.uid() });
      commit(); toast('Tercatat: ' + rp(amount));
    });
  }
  function accForm(a) {
    a = a || {};
    openForm(a.id ? 'Ubah akun' : 'Akun baru', [
      { k: 'name', label: 'Nama akun', req: true },
      { k: 'type', label: 'Jenis', type: 'select', opts: [['kas', 'Kas / dompet'], ['bank', 'Bank'], ['ewallet', 'E-wallet'], ['kartu', 'Kartu kredit (saldo negatif = utang)'], ['invest', 'Investasi']] },
      { k: 'opening', label: 'Saldo awal (Rp; boleh minus untuk utang)', type: 'amount' },
    ], { name: a.name, type: a.type || 'kas', opening: a.opening || '' }, (v) => {
      let neg = false, raw = v.opening;
      if (raw.startsWith('-')) { neg = true; raw = raw.slice(1); }
      const n = raw === '' ? 0 : C.parseAmount(raw);
      if (n == null) return 'Saldo awal harus bilangan bulat rupiah.';
      C.put(store, 'acc', { id: a.id, name: v.name, type: v.type, opening: neg ? -n : n }); commit();
    }, a.id ? [{ label: 'Hapus akun', fn: () => {
      if (list('tx').some((t) => t.acc === a.id || t.to === a.id)) { toast('Akun punya transaksi; tidak bisa dihapus'); return false; }
      C.remove(store, a.id); commit();
    } }] : null);
  }
  function budgetForm(b) {
    b = b || {};
    openForm(b.id ? 'Ubah anggaran' : 'Anggaran bulanan', [
      { k: 'cat', label: 'Kategori pengeluaran', req: true, list: EXP_CATS }, { k: 'limit', label: 'Batas per bulan (Rp)', type: 'amount', req: true },
    ], { cat: b.cat, limit: b.limit || '' }, (v) => {
      const n = C.parseAmount(v.limit); if (n == null || n <= 0) return 'Batas harus bilangan bulat rupiah > 0.';
      C.put(store, 'budget', { id: b.id, cat: v.cat, limit: n }); commit();
    }, b.id ? [{ label: 'Hapus anggaran', fn: () => { C.remove(store, b.id); commit(); } }] : null);
  }
  // --- Rumah: perawatan ---
  function planForm(p, pre) {
    p = Object.assign({}, pre || {}, p || {});
    const assets = [['', '— tanpa —']].concat(list('asset').map((a) => [a.id, a.name]));
    const vehs = [['', '— tanpa —']].concat(list('veh').map((v) => [v.id, v.name]));
    const every = p.every || '', unit = p.unit || 'month';
    openForm(p.id ? 'Ubah rencana perawatan' : 'Rencana perawatan baru', [
      { k: 'name', label: 'Nama perawatan', req: true },
      { k: 'group', label: 'Kelompok', type: 'select', opts: Object.keys(GROUPS).map((k) => [k, GROUPS[k][0]]) },
      { k: 'every', label: 'Ulangi setiap … (angka)', type: 'number' },
      { k: 'unit', label: 'Satuan', type: 'select', opts: [['month', 'bulan'], ['day', 'hari']] },
      { k: 'nextDue', label: 'Jatuh tempo berikutnya (kosong = hari ini + interval)', type: 'date' },
      { k: 'vehicleId', label: 'Kendaraan (opsional)', type: 'select', opts: vehs },
      { k: 'kmEvery', label: 'Atau tiap … km (khusus kendaraan)', type: 'number' },
      { k: 'nextKm', label: 'Pada odometer … km berikutnya (opsional)', type: 'number' },
      { k: 'assetId', label: 'Aset terkait (opsional)', type: 'select', opts: assets },
      { k: 'cost', label: 'Perkiraan biaya (Rp, opsional)', type: 'amount' }, { k: 'notes', label: 'Catatan', type: 'textarea' },
    ], { name: p.name, group: p.group || (p.vehicleId ? 'kendaraan' : 'rumah'), every, unit, nextDue: p.nextDue || (every ? C.planNext({ every, unit }, C.today()) : ''), vehicleId: p.vehicleId || '', kmEvery: p.kmEvery || '', nextKm: p.nextKm || '', assetId: p.assetId || '', cost: p.cost || '', notes: p.notes }, (v) => {
      const ev = v.every === '' ? 0 : +v.every, km = v.kmEvery === '' ? 0 : +v.kmEvery;
      if (!(ev > 0) && !(km > 0)) return 'Isi interval waktu (bulan/hari) dan/atau interval kilometer.';
      if (ev > 600 || km > 1000000) return 'Interval terlalu besar.';
      if (ev > 0 && !v.nextDue) v.nextDue = C.planNext({ every: ev, unit: v.unit }, C.today()); // otomatis: hari ini + interval
      if (km > 0 && !v.vehicleId) return 'Interval km butuh kendaraan (tambahkan di halaman Kendaraan).';
      const cost = v.cost === '' ? 0 : C.parseAmount(v.cost);
      if (cost == null) return 'Biaya harus bilangan bulat rupiah.';
      let nextKm = v.nextKm === '' ? 0 : +v.nextKm;
      const veh = v.vehicleId ? get('veh', v.vehicleId) : null;
      if (km > 0 && !nextKm && veh && veh.odometer) nextKm = +veh.odometer + km;
      C.put(store, 'plan', { id: p.id, name: v.name, group: v.group, every: ev, unit: v.unit, nextDue: ev > 0 ? v.nextDue : '', vehicleId: v.vehicleId, kmEvery: km, nextKm, assetId: v.assetId, cost, notes: v.notes, lastDone: p.lastDone });
      commit();
    }, p.id ? [{ label: 'Hapus rencana', fn: () => { C.remove(store, p.id); ui.stack = ui.stack.filter((x) => !(x.n === 'planDetail' && x.p.id === p.id)); commit(); } }] : null);
  }
  function planDoneForm(p) {
    const veh = p.vehicleId ? get('veh', p.vehicleId) : null;
    const fields = [{ k: 'date', label: 'Tanggal dikerjakan', type: 'date', req: true }];
    if (veh) fields.push({ k: 'odo', label: 'Odometer saat ini (km)', type: 'number' });
    fields.push({ k: 'cost', label: 'Biaya (Rp, opsional)', type: 'amount' }, { k: 'note', label: 'Catatan (bengkel/teknisi, dll.)' });
    if (accOpts().length) fields.push({ k: 'rec', label: 'Catat biaya sebagai pengeluaran', type: 'check' }, { k: 'acc', label: 'Dari akun', type: 'select', opts: accOpts() });
    openForm('Selesai: ' + p.name, fields, { date: C.today(), odo: veh ? veh.odometer || '' : '', cost: p.cost || '' }, (v) => {
      const cost = v.cost === '' ? 0 : C.parseAmount(v.cost);
      if (cost == null) return 'Biaya harus bilangan bulat rupiah.';
      let odo = null;
      if (veh && v.odo !== '') {
        odo = +v.odo;
        if (veh.odometer && odo < +veh.odometer) return 'Odometer tidak boleh lebih kecil dari catatan sebelumnya (' + num(veh.odometer) + ' km).';
        C.put(store, 'veh', { id: veh.id, odometer: odo });
      }
      const upd = { id: p.id, lastDone: v.date };
      if (p.every > 0) upd.nextDue = C.planNext(p, v.date);
      if (p.kmEvery > 0 && odo != null) upd.nextKm = odo + +p.kmEvery;
      C.put(store, 'plan', upd);
      C.put(store, 'plog', { planId: p.id, date: v.date, cost, note: v.note, odo: odo == null ? '' : odo });
      if (v.rec && cost > 0 && v.acc) C.put(store, 'tx', { kind: 'expense', amount: cost, acc: v.acc, to: '', cat: 'Rumah', date: v.date, note: p.name, cid: C.uid() });
      commit(); toast('Perawatan dicatat ✓');
    });
  }
  function templateForm(vehId) {
    const tpls = vehId ? VEH_TEMPLATES.map((t) => Object.assign({ g: 'kendaraan' }, t)) : TEMPLATES;
    openForm('Pilih template', tpls.map((t, i) => ({ k: 't' + i, label: t.name + ' · ' + C.intervalLabel(t) + (t.kmEvery ? ' / ' + num(t.kmEvery) + ' km' : ''), type: 'check' })), {}, (v) => {
      let n = 0; const today = C.today(); const veh = vehId ? get('veh', vehId) : null;
      tpls.forEach((t, i) => {
        if (!v['t' + i]) return;
        n++;
        C.put(store, 'plan', { name: t.name, group: t.g, every: t.every, unit: t.unit, nextDue: C.planNext(t, today), vehicleId: vehId || '', kmEvery: t.kmEvery || 0, nextKm: veh && veh.odometer && t.kmEvery ? +veh.odometer + t.kmEvery : 0, cost: 0 });
      });
      if (!n) return 'Centang minimal satu.';
      commit(); toast(n + ' rencana ditambahkan');
    }, null, 'Jatuh tempo pertama dihitung dari hari ini. Ubah tanggalnya setelah ditambahkan bila perlu.');
  }
  // --- Rumah: kendaraan ---
  function vehForm(v0) {
    v0 = v0 || {};
    openForm(v0.id ? 'Ubah kendaraan' : 'Kendaraan baru', [
      { k: 'name', label: 'Nama (mis. Honda Beat, Avanza)', req: true },
      { k: 'kind', label: 'Jenis', type: 'select', opts: [['motor', 'Motor'], ['mobil', 'Mobil'], ['lain', 'Lainnya']] },
      { k: 'plate', label: 'Plat nomor (opsional)' }, { k: 'year', label: 'Tahun', type: 'number' },
      { k: 'odometer', label: 'Odometer sekarang (km)', type: 'number' },
      { k: 'pajakDue', label: 'Pajak tahunan jatuh tempo', type: 'date' }, { k: 'stnkDue', label: 'Ganti plat/STNK 5 tahunan', type: 'date' },
      { k: 'notes', label: 'Catatan', type: 'textarea' },
    ], { name: v0.name, kind: v0.kind || 'motor', plate: v0.plate, year: v0.year, odometer: v0.odometer, pajakDue: v0.pajakDue, stnkDue: v0.stnkDue, notes: v0.notes }, (v) => {
      C.put(store, 'veh', { id: v0.id, name: v.name, kind: v.kind, plate: v.plate, year: v.year, odometer: v.odometer === '' ? '' : +v.odometer, pajakDue: v.pajakDue, stnkDue: v.stnkDue, notes: v.notes }); commit();
    }, v0.id ? [{ label: 'Hapus kendaraan', fn: () => { C.remove(store, v0.id); commit(); } }] : null);
  }
  function odoForm(v0) {
    openForm('Update odometer', [{ k: 'odometer', label: 'Odometer sekarang (km)', type: 'number', req: true }], { odometer: v0.odometer }, (v) => {
      if (v0.odometer && +v.odometer < +v0.odometer) return 'Tidak boleh lebih kecil dari ' + num(v0.odometer) + ' km.';
      C.put(store, 'veh', { id: v0.id, odometer: +v.odometer }); commit();
    });
  }
  // --- Rumah: tagihan ---
  function billForm(b) {
    b = b || {};
    openForm(b.id ? 'Ubah tagihan' : 'Tagihan rutin baru', [
      { k: 'name', label: 'Nama tagihan', req: true, list: BILL_NAMES }, { k: 'amountEst', label: 'Perkiraan nominal (Rp)', type: 'amount' },
      { k: 'dueDay', label: 'Jatuh tempo tiap tanggal (1–31)', type: 'number', req: true },
      { k: 'paidThis', label: 'Sudah dibayar bulan ini', type: 'check' }, { k: 'notes', label: 'Catatan (nomor pelanggan tidak disarankan)', type: 'textarea' },
    ], { name: b.name, amountEst: b.amountEst || '', dueDay: b.dueDay, notes: b.notes }, (v) => {
      const d = +v.dueDay; if (!(d >= 1 && d <= 31)) return 'Tanggal harus 1–31.';
      const amt = v.amountEst === '' ? 0 : C.parseAmount(v.amountEst); if (amt == null) return 'Nominal harus bilangan bulat rupiah.';
      C.put(store, 'bill', { id: b.id, name: v.name, amountEst: amt, dueDay: d, notes: v.notes, paidYM: v.paidThis ? nowYM() : b.paidYM, lastPaid: b.lastPaid }); commit();
    }, b.id ? [{ label: 'Hapus tagihan', fn: () => { C.remove(store, b.id); commit(); } }] : null);
  }
  function billPayForm(b) {
    const accs = [['', 'Jangan catat ke Uang']].concat(accOpts());
    openForm('Bayar: ' + b.name, [
      { k: 'date', label: 'Tanggal bayar', type: 'date', req: true }, { k: 'amount', label: 'Nominal (Rp)', type: 'amount' }, { k: 'acc', label: 'Catat ke akun', type: 'select', opts: accs },
    ], { date: C.today(), amount: b.amountEst || '', acc: accs.length > 1 ? accs[1][0] : '' }, (v) => {
      const amt = v.amount === '' ? 0 : C.parseAmount(v.amount); if (amt == null) return 'Nominal harus bilangan bulat rupiah.';
      const period = C.billNext(b, C.today()).slice(0, 7);
      C.put(store, 'bill', { id: b.id, paidYM: period, lastPaid: v.date, lastAmount: amt });
      if (v.acc && amt > 0) C.put(store, 'tx', { kind: 'expense', amount: amt, acc: v.acc, to: '', cat: 'Tagihan', date: v.date, note: b.name, cid: C.uid() });
      commit(); toast('Tagihan dibayar ✓');
    });
  }
  function billTemplateForm() {
    openForm('Pilih tagihan rutin', BILL_NAMES.map((n, i) => ({ k: 'b' + i, label: n, type: 'check' })).concat([{ k: 'dueDay', label: 'Tanggal jatuh tempo sementara (1–31, ubah nanti per tagihan)', type: 'number', req: true }]), { dueDay: 20 }, (v) => {
      const d = +v.dueDay; if (!(d >= 1 && d <= 31)) return 'Tanggal harus 1–31.';
      let n = 0; BILL_NAMES.forEach((name, i) => { if (v['b' + i]) { n++; C.put(store, 'bill', { name, amountEst: 0, dueDay: d }); } });
      if (!n) return 'Centang minimal satu.';
      commit(); toast(n + ' tagihan ditambahkan; isi nominal & tanggal asli lewat ketuk nama tagihan');
    });
  }
  // --- Rumah: aset, stok, kontak, dokumen ---
  function assetForm(a) {
    a = a || {};
    openForm(a.id ? 'Ubah aset' : 'Aset baru', [
      { k: 'name', label: 'Nama aset', req: true }, { k: 'cat', label: 'Kategori', type: 'select', opts: Object.keys(ASSET_EMOJI).map((x) => [x, x]) },
      { k: 'bought', label: 'Tanggal beli', type: 'date' }, { k: 'price', label: 'Harga beli (Rp, opsional)', type: 'amount' },
      { k: 'warrantyUntil', label: 'Garansi sampai', type: 'date' }, { k: 'place', label: 'Lokasi di rumah' },
      { k: 'notes', label: 'Catatan (lokasi nota/kartu garansi, dll.)', type: 'textarea' },
    ], { name: a.name, cat: a.cat || 'Elektronik', bought: a.bought, price: a.price || '', warrantyUntil: a.warrantyUntil, place: a.place, notes: a.notes }, (v) => {
      const price = v.price === '' ? 0 : C.parseAmount(v.price); if (price == null) return 'Harga harus bilangan bulat rupiah.';
      C.put(store, 'asset', { id: a.id, name: v.name, cat: v.cat, bought: v.bought, price, warrantyUntil: v.warrantyUntil, place: v.place, notes: v.notes }); commit();
    }, a.id ? [{ label: 'Hapus aset', fn: () => { C.remove(store, a.id); commit(); } }] : null);
  }
  function invForm(i) {
    i = i || {};
    openForm(i.id ? 'Ubah stok' : 'Barang stok baru', [
      { k: 'name', label: 'Nama barang', req: true }, { k: 'qty', label: 'Jumlah sekarang', type: 'number', req: true }, { k: 'unit', label: 'Satuan (pcs, kg, liter…)' },
      { k: 'min', label: 'Batas minimum (ingatkan bila ≤)', type: 'number' }, { k: 'expiry', label: 'Kedaluwarsa (opsional)', type: 'date' }, { k: 'place', label: 'Lokasi simpan' },
    ], { name: i.name, qty: i.qty == null ? 1 : i.qty, unit: i.unit || 'pcs', min: i.min || '', expiry: i.expiry, place: i.place }, (v) => {
      C.put(store, 'inv', { id: i.id, name: v.name, qty: +v.qty, unit: v.unit, min: v.min === '' ? 0 : +v.min, expiry: v.expiry, place: v.place }); commit();
    }, i.id ? [{ label: 'Hapus barang', fn: () => { C.remove(store, i.id); commit(); } }] : null);
  }
  function contactForm(c) {
    c = c || {};
    openForm(c.id ? 'Ubah kontak' : 'Kontak baru', [
      { k: 'name', label: 'Nama', req: true }, { k: 'role', label: 'Peran (tukang, dokter, RT, …)' }, { k: 'phone', label: 'Telepon', type: 'tel' },
      { k: 'emergency', label: 'Kontak darurat', type: 'check' }, { k: 'notes', label: 'Catatan', type: 'textarea' },
    ], c, (v) => { C.put(store, 'contact', { id: c.id, name: v.name, role: v.role, phone: v.phone, emergency: v.emergency, notes: v.notes }); commit(); },
    c.id ? [{ label: 'Hapus kontak', fn: () => { C.remove(store, c.id); commit(); } }] : null);
  }
  function docForm(d) {
    d = d || {};
    openForm(d.id ? 'Ubah dokumen' : 'Dokumen penting', [
      { k: 'title', label: 'Nama dokumen', req: true, list: ['Sertifikat rumah', 'Polis asuransi', 'Kartu keluarga', 'Paspor', 'SIM', 'Kontrak kerja', 'Perjanjian sewa'] },
      { k: 'expiry', label: 'Berlaku sampai / kedaluwarsa', type: 'date' }, { k: 'place', label: 'Disimpan di mana (laci, brankas, folder…)' }, { k: 'notes', label: 'Catatan', type: 'textarea' },
    ], d, (v) => { C.put(store, 'doc', { id: d.id, title: v.title, expiry: v.expiry, place: v.place, notes: v.notes }); commit(); },
    d.id ? [{ label: 'Hapus dokumen', fn: () => { C.remove(store, d.id); commit(); } }] : null,
    'Catat lokasi & masa berlaku saja. Nomor KTP/NPWP anggota keluarga disimpan di menu Keluarga (tersembunyi di layar, belum terenkripsi).');
  }
  function journalForm(j) {
    j = j || {};
    openForm(j.id ? 'Ubah jurnal' : 'Jurnal baru', [
      { k: 'date', label: 'Tanggal', type: 'date', req: true }, { k: 'mood', label: 'Suasana hati', type: 'select', opts: MOODS.map((m, i) => [String(i + 1), m + ' ' + (i + 1) + '/5']) },
      { k: 'text', label: 'Tulisan', type: 'textarea', req: true },
    ], { date: j.date || C.today(), mood: j.mood || '3', text: j.text }, (v) => { C.put(store, 'journal', { id: j.id, date: v.date, mood: v.mood, text: v.text }); commit(); },
    j.id ? [{ label: 'Hapus jurnal', fn: () => { C.remove(store, j.id); commit(); } }] : null);
  }
  function habitForm(h) {
    h = h || {};
    openForm(h.id ? 'Ubah kebiasaan' : 'Kebiasaan baru', [{ k: 'name', label: 'Nama kebiasaan', req: true }], h,
      (v) => { C.put(store, 'habit', { id: h.id, name: v.name, log: h.log || [] }); commit(); },
      h.id ? [{ label: 'Hapus kebiasaan', fn: () => { C.remove(store, h.id); commit(); } }] : null);
  }

  // ---------- v0.3: profil, rutinitas, keluarga, afeksi ----------
  const REL = ['Istri', 'Suami', 'Pasangan', 'Anak', 'Orang tua', 'Mertua', 'Saudara', 'Lainnya'];
  const ID_KINDS = ['KTP', 'KK', 'NPWP', 'SIM', 'Paspor', 'BPJS Kesehatan', 'BPJS Ketenagakerjaan', 'Akta lahir', 'Lainnya'];
  const FILE_LABELS = ['KTP', 'KK', 'NPWP', 'SIM', 'Paspor', 'Akta lahir', 'Foto', 'Lainnya'];
  const RT_EMOJI = ['💧', '💊', '🏃', '👀', '💌', '📖', '🧘', '🍎', '😴', '⭐'];
  const RT_TEMPLATES = [
    { name: 'Minum air 2 liter', emoji: '💧', target: 8, unit: 'gelas (250 ml)', from: '08:00', to: '20:00', everyMin: 60, days: [] },
    { name: 'Vitamin / obat pagi', emoji: '💊', target: 1, unit: 'kali', from: '07:00', to: '', everyMin: 0, days: [] },
    { name: 'Olahraga ringan', emoji: '🏃', target: 1, unit: 'sesi', from: '17:00', to: '', everyMin: 0, days: [] },
    { name: 'Istirahat mata & regangkan badan', emoji: '👀', target: 6, unit: 'kali', from: '09:00', to: '16:00', everyMin: 60, days: [1, 2, 3, 4, 5] },
    { name: 'Kabari keluarga', emoji: '💌', target: 1, unit: 'kabar', from: '12:30', to: '', everyMin: 0, days: [] },
    { name: 'Baca buku 15 menit', emoji: '📖', target: 1, unit: 'sesi', from: '20:30', to: '', everyMin: 0, days: [] },
  ];
  const DRAFTS = {
    pasangan: [
      'Sayang, aku sudah di jalan pulang ya. Mau dibawakan sesuatu, {nama}? 😊',
      'Hari ini lagi padat, tapi kamu tetap yang pertama kuingat. Nanti kutelepon begitu longgar ya ❤️',
      'Sudah makan siang belum, {nama}? Jangan telat makan ya, aku peduli sama kamu.',
      'Terima kasih sudah mengurus rumah dan keluarga kita dengan sabar. Aku bersyukur punya kamu.',
      'Semangat hari ini, {nama}. Kamu hebat. Kalau capek, ingat ada aku di sini.',
      'Maaf, hari ini aku pulang agak malam. Kamu istirahat duluan, jangan menungguku ya.',
      'Malam ini ngobrol berdua yuk, tanpa HP. Aku kangen ceritamu.',
      'Selamat istirahat, {nama}. Terima kasih untuk hari ini. Sampai besok ❤️',
    ],
    anak: [
      'Hai {nama}, {sebutan} kangen. Hari ini sekolahnya seru? Nanti cerita ya.',
      'Jangan lupa makan dan minum air putih ya, {nama}. {sebutan} sayang kamu.',
      '{nama}, {sebutan} bangga sama usahamu hari ini, apa pun hasilnya.',
      'Semangat ya, {nama}! Kamu sudah belajar, tinggal percaya diri.',
      '{sebutan} pulang agak telat. Kerjakan PR dan sikat gigi dulu ya, {nama}.',
      'Selamat tidur, {nama}. Mimpi indah ya. {sebutan} sayang kamu.',
    ],
    ortu: [
      'Apa kabar, {nama}? Semoga sehat selalu. Aku kangen, akhir pekan ini aku telepon ya.',
      'Terima kasih atas doa dan didikan {nama} selama ini. Aku selalu ingat.',
      'Sudah makan dan minum obat, {nama}? Jaga kesehatan ya, kabari kalau butuh apa-apa.',
      'Kami di sini sehat semua, {nama}. Jangan khawatir ya. Salam dari kami semua.',
    ],
    umum: [
      'Halo {nama}, apa kabar? Sudah lama kita tidak ngobrol, semoga sehat dan lancar selalu.',
      'Terima kasih atas bantuannya, {nama}. Sangat berarti buatku.',
      'Kapan-kapan kita ketemu ya, {nama}. Aku kangen ngobrol.',
    ],
  };
  const CARDS = {
    Hubungan: ['Momen kecil apa minggu ini yang membuatmu merasa disayang?', 'Hal apa yang ingin kamu lebih sering kita lakukan berdua?', 'Apa yang bisa kulakukan supaya bebanmu terasa lebih ringan minggu ini?', 'Kapan terakhir kali kamu merasa benar-benar kudengarkan?', 'Kenangan awal kita yang paling kamu sukai apa?', 'Satu hal yang kamu syukuri dari kita hari ini?'],
    'Obrolan dalam': ['Apa yang paling kamu khawatirkan saat ini, dan bagaimana aku bisa menemanimu?', 'Mimpi apa yang belum sempat kita bicarakan?', 'Nilai apa yang ingin kita wariskan ke keluarga?', 'Kapan kamu merasa paling menjadi dirimu sendiri?', 'Apa yang ingin kamu lepaskan dari masa lalu?', 'Jika uang bukan masalah, hidup seperti apa yang ingin kita bangun?'],
    Seru: ['Kalau besok libur penuh, kita ke mana dan makan apa?', 'Lagu apa yang mengingatkanmu pada kita?', 'Masakan apa yang ingin kita coba masak bareng?', 'Kalau pindah kota selama setahun, kota mana yang kamu pilih?', 'Film apa yang ingin kita tonton ulang?', 'Julukan paling lucu apa yang cocok untukku?'],
    Anak: ['Apa yang ingin diingat anak-anak tentang masa kecil mereka di rumah ini?', 'Aturan rumah mana yang perlu kita longgarkan atau kencangkan?', 'Apa kekuatan terbesar tiap anak, dan bagaimana kita mendukungnya?', 'Bagaimana kita membagi tugas pengasuhan agar tidak ada yang kelelahan?', 'Kebiasaan keluarga apa yang ingin kita mulai (makan malam bersama, akhir pekan tanpa gawai)?', 'Apa dari cara orang tua kita membesarkan kita yang ingin kita tiru atau ubah?'],
  };
  const profile = () => get('profile', 'profile') || {};
  const ownerName = () => { const p = profile(); return (p.nick || p.name || '').trim(); };
  const relGroup = (rel) => (['Istri', 'Suami', 'Pasangan'].includes(rel) ? 'pasangan' : rel === 'Anak' ? 'anak' : ['Orang tua', 'Mertua'].includes(rel) ? 'ortu' : 'umum');
  const fillT = (s, p) => String(s).replace(/\{nama\}/g, p ? (p.nick || p.name) : 'kamu').replace(/\{saya\}/g, ownerName() || 'aku').replace(/\{sebutan\}/g, profile().callKid || 'Papa');
  const safePhoto = (s) => (typeof s === 'string' && /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(s) ? s : '');
  const avHTML = (p, cls) => (safePhoto(p.photo) ? `<img class="av ${cls || ''}" src="${safePhoto(p.photo)}" alt="">` : `<span class="av ${cls || ''}" aria-hidden="true">${esc((p.name || '?').trim().charAt(0).toUpperCase())}</span>`);

  function profilForm() {
    const p = profile();
    openForm('Profil saya', [
      { k: 'name', label: 'Nama lengkap', req: true }, { k: 'nick', label: 'Nama panggilan (dipakai di sapaan)' },
      { k: 'callKid', label: 'Sebutan Anda untuk anak (mis. Papa, Ayah, Bunda)' },
    ], { name: p.name, nick: p.nick, callKid: p.callKid || '' }, (v) => { C.put(store, 'profile', { id: 'profile', name: v.name, nick: v.nick, callKid: v.callKid }); commit(); toast('Profil disimpan'); },
    null, 'Nama ini dipakai untuk sapaan "Selamat pagi, …" dan draf kabar. Tersimpan di perangkat Anda (dan di Drive bila sinkron aktif).');
  }

  // --- rutinitas ---
  const DAYSETS = [['all', 'Setiap hari'], ['work', 'Senin–Jumat'], ['weekend', 'Sabtu–Minggu']];
  const daySetOf = (d) => (!d || !d.length ? 'all' : d.length === 5 && d.indexOf(1) >= 0 && d.indexOf(0) < 0 ? 'work' : 'weekend');
  const daysFromSet = (k) => (k === 'work' ? [1, 2, 3, 4, 5] : k === 'weekend' ? [0, 6] : []);
  function downloadText(name, text, type) {
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: type || 'text/plain' })); a.download = name;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }
  function routineForm(r) {
    r = r || {};
    const extras = [];
    if (r.id) {
      extras.push({ label: r.paused ? '▶ Aktifkan lagi' : '⏸ Jeda pengingat', fn: () => { C.put(store, 'rt', { id: r.id, paused: !r.paused }); commit(); } });
      extras.push({ label: '📅 Ekspor ke Kalender HP (.ics)', fn: () => { downloadText('rutinitas-' + r.name.replace(/[^\w]+/g, '-').toLowerCase() + '.ics', C.buildICS(C.routineICS(r, C.addDays(C.today(), 1))), 'text/calendar'); toast('Buka berkas .ics untuk menambah ke Google Calendar'); return false; } });
      extras.push({ label: 'Hapus rutinitas', fn: () => { C.remove(store, r.id); list('rtlog').filter((l) => l.routineId === r.id).forEach((l) => C.remove(store, l.id)); ui.stack = []; commit(); } });
    }
    openForm(r.id ? 'Ubah rutinitas' : 'Rutinitas baru', [
      { k: 'name', label: 'Nama (mis. Minum air 2 liter)', req: true }, { k: 'emoji', label: 'Ikon', type: 'select', opts: RT_EMOJI.map((e) => [e, e]) },
      { k: 'target', label: 'Target per hari (angka)', type: 'number', req: true }, { k: 'unit', label: 'Satuan (gelas, kali, sesi…)' },
      { k: 'from', label: 'Jam mulai pengingat', type: 'time', req: true },
      { k: 'everyMin', label: 'Ulangi pengingat', type: 'select', opts: [['0', 'Sekali saja pada jam mulai'], ['30', 'Tiap 30 menit'], ['60', 'Tiap 1 jam'], ['90', 'Tiap 1,5 jam'], ['120', 'Tiap 2 jam'], ['180', 'Tiap 3 jam']] },
      { k: 'to', label: 'Sampai jam (bila berulang)', type: 'time' },
      { k: 'dayset', label: 'Hari aktif', type: 'select', opts: DAYSETS },
    ], { name: r.name, emoji: r.emoji || '💧', target: r.target || 1, unit: r.unit || '', from: r.from || '08:00', everyMin: String(r.everyMin || 0), to: r.to || '', dayset: daySetOf(r.days) }, (v) => {
      const target = Math.round(+v.target);
      if (!(target >= 1 && target <= 99)) return 'Target harus 1–99.';
      const every = +v.everyMin;
      if (every > 0) { const a = C.toMin(v.from), b = C.toMin(v.to); if (b == null || b <= a) return 'Isi "Sampai jam" yang lebih besar dari jam mulai.'; }
      C.put(store, 'rt', { id: r.id, name: v.name, emoji: v.emoji, target, unit: v.unit, from: v.from, to: every > 0 ? v.to : '', everyMin: every, days: daysFromSet(v.dayset), paused: !!r.paused });
      commit();
    }, extras, 'Pengingat otomatis berhenti bila target hari ini tercapai atau Anda sudah sesuai laju.');
  }
  function rtTemplateForm() {
    openForm('Pilih rutinitas', RT_TEMPLATES.map((t, i) => ({ k: 't' + i, label: t.emoji + ' ' + t.name + ' · ' + t.target + ' ' + t.unit, type: 'check' })), {}, (v) => {
      let n = 0;
      RT_TEMPLATES.forEach((t, i) => { if (v['t' + i]) { n++; C.put(store, 'rt', Object.assign({}, t)); } });
      if (!n) return 'Centang minimal satu.';
      commit(); toast(n + ' rutinitas ditambahkan');
    });
  }
  function rtCard(r, compact) {
    const t = C.today(), n = new Date(), mins = n.getHours() * 60 + n.getMinutes();
    const done = C.routineDone(list('rtlog'), r.id, t), target = C.routineTarget(r), act = C.routineActiveOn(r, t) && !r.paused;
    const exp = act ? C.routineExpected(r, mins) : 0, behind = act && done < exp && done < target;
    const times = C.routineTimes(r), nxt = times.find((x) => C.toMin(x) > mins);
    const sub = r.paused ? 'dijeda' : !C.routineActiveOn(r, t) ? 'tidak aktif hari ini' : done >= target ? 'target tercapai 🎉' : (nxt ? 'berikutnya ' + nxt : 'pengingat hari ini selesai') + (times.length > 1 ? ' · ' + times[0] + '–' + times[times.length - 1] : '');
    const pct = Math.min(100, Math.round(done / target * 100));
    return `<div class="card pc rt ${r.paused ? 'off' : ''}"><div class="pt" ${compact ? '' : `data-a="rtEdit" data-id="${r.id}" style="cursor:pointer"`}>${ic('c5', r.emoji || '⭐')}<div class="grow"><div class="t">${esc(r.name)}</div><div class="s">${esc(sub)}</div></div><div class="rn"><b>${done}</b>/${target}<small>${esc(r.unit || '')}</small></div></div><div class="bar"><i class="${done >= target ? '' : behind ? 'warn' : ''}" style="width:${pct}%"></i></div><div class="pa">${behind ? `<span class="bd soon">seharusnya ${exp}</span>` : done >= target ? '<span class="bd">selesai</span>' : '<span class="s">sesuai laju</span>'}<span class="inl" style="gap:8px"><button class="qb" data-a="rtDec" data-id="${r.id}" aria-label="Kurangi ${esc(r.name)}">−</button><button class="btn sm" data-a="rtInc" data-id="${r.id}" aria-label="Tambah ${esc(r.name)}">+1</button></span></div></div>`;
  }

  // --- keluarga ---
  function personForm(p) {
    p = p || {};
    openForm(p.id ? 'Ubah anggota' : 'Anggota keluarga baru', [
      { k: 'name', label: 'Nama lengkap', req: true }, { k: 'nick', label: 'Panggilan' },
      { k: 'rel', label: 'Hubungan dengan Anda', type: 'select', opts: REL.map((x) => [x, x]) },
      { k: 'birth', label: 'Tanggal lahir', type: 'date' }, { k: 'phone', label: 'Nomor WhatsApp / telepon', type: 'tel' }, { k: 'notes', label: 'Catatan', type: 'textarea' },
    ], { name: p.name, nick: p.nick, rel: p.rel || 'Istri', birth: p.birth, phone: p.phone, notes: p.notes }, (v) => {
      C.put(store, 'person', { id: p.id, name: v.name, nick: v.nick, rel: v.rel, birth: v.birth, phone: v.phone, notes: v.notes, ids: p.ids || [], photo: p.photo || '' }); commit();
    }, p.id ? [{ label: 'Hapus anggota & berkasnya', fn: () => {
      list('pfile').filter((f) => f.personId === p.id).forEach((f) => { IDB.del(f.id); C.remove(store, f.id); });
      C.remove(store, p.id); ui.stack = []; commit();
    } }] : null);
  }
  function idForm(p, i) {
    const cur = i != null ? (p.ids || [])[i] : {};
    openForm(i != null ? 'Ubah data identitas' : 'Tambah data identitas', [
      { k: 'kind', label: 'Jenis', req: true, list: ID_KINDS }, { k: 'no', label: 'Nomor', req: true }, { k: 'exp', label: 'Berlaku sampai (bila ada)', type: 'date' }, { k: 'note', label: 'Catatan' },
    ], { kind: cur.kind, no: cur.no, exp: cur.exp, note: cur.note }, (v) => {
      const ids = (p.ids || []).slice(); const e = { kind: v.kind, no: v.no, exp: v.exp, note: v.note };
      if (i != null) ids[i] = e; else ids.push(e);
      C.put(store, 'person', { id: p.id, ids }); commit();
    }, i != null ? [{ label: 'Hapus data ini', fn: () => { const ids = (p.ids || []).slice(); ids.splice(i, 1); C.put(store, 'person', { id: p.id, ids }); commit(); } }] : null,
    'Nomor disimpan polos (belum terenkripsi) dan tersembunyi di layar sampai Anda ketuk Tampilkan. Jangan simpan PIN atau kata sandi di sini.');
  }
  function draftForm(d) {
    d = d || {};
    openForm(d.id ? 'Ubah draf' : 'Draf sendiri', [
      { k: 'text', label: 'Isi pesan', type: 'textarea', req: true }, { k: 'grp', label: 'Untuk', type: 'select', opts: [['pasangan', 'Pasangan'], ['anak', 'Anak'], ['ortu', 'Orang tua'], ['umum', 'Lainnya']] },
    ], { text: d.text, grp: d.grp || 'pasangan' }, (v) => { C.put(store, 'draft', { id: d.id, text: v.text, grp: v.grp }); commit(); },
    d.id ? [{ label: 'Hapus draf', fn: () => { C.remove(store, d.id); commit(); } }] : null, 'Pakai {nama} untuk nama panggilan penerima dan {saya} untuk nama Anda.');
  }

  // ---------- penyimpanan berkas foto (hanya di perangkat ini; metadata ikut sinkron) ----------
  const IDB = {
    db: null,
    open() {
      if (this.db) return this.db;
      this.db = new Promise((res, rej) => {
        if (!window.indexedDB) return rej(new Error('IndexedDB tidak tersedia'));
        const q = indexedDB.open('rumahku-files', 1);
        q.onupgradeneeded = () => q.result.createObjectStore('f');
        q.onsuccess = () => res(q.result); q.onerror = () => rej(q.error);
      });
      return this.db;
    },
    async run(mode, fn) { const db = await this.open(); return new Promise((res, rej) => { const tx = db.transaction('f', mode), r = fn(tx.objectStore('f')); tx.oncomplete = () => res(r && r.result); tx.onerror = () => rej(tx.error); }); },
    put(id, blob) { return this.run('readwrite', (s) => s.put(blob, id)); },
    get(id) { return this.run('readonly', (s) => s.get(id)); },
    del(id) { return this.run('readwrite', (s) => s.delete(id)).catch(() => {}); },
  };
  function loadImage(file) {
    return new Promise((res, rej) => {
      const url = URL.createObjectURL(file), im = new Image();
      im.onload = () => res({ im, url }); im.onerror = () => { URL.revokeObjectURL(url); rej(new Error('Gambar tidak bisa dibaca')); }; im.src = url;
    });
  }
  async function resizeBlob(file, max, q) {
    const { im, url } = await loadImage(file);
    const s = Math.min(1, max / Math.max(im.naturalWidth, im.naturalHeight)), w = Math.round(im.naturalWidth * s), h = Math.round(im.naturalHeight * s);
    const c = document.createElement('canvas'); c.width = w; c.height = h; c.getContext('2d').drawImage(im, 0, 0, w, h); URL.revokeObjectURL(url);
    return new Promise((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error('Gagal memproses gambar'))), 'image/jpeg', q));
  }
  async function avatarFrom(file) {
    const { im, url } = await loadImage(file), S = 160, c = document.createElement('canvas'); c.width = S; c.height = S;
    const m = Math.min(im.naturalWidth, im.naturalHeight), sx = (im.naturalWidth - m) / 2, sy = (im.naturalHeight - m) / 2;
    c.getContext('2d').drawImage(im, sx, sy, m, m, 0, 0, S, S); URL.revokeObjectURL(url);
    return c.toDataURL('image/jpeg', 0.7);
  }
  function pickImage(cb) {
    const i = document.createElement('input'); i.type = 'file'; i.accept = 'image/*';
    i.onchange = () => { if (i.files && i.files[0]) cb(i.files[0]); };
    i.click();
  }
  async function viewFile(f) {
    let blob = null; try { blob = await IDB.get(f.id); } catch (e) { /* abaikan */ }
    if (!blob) return toast('Berkas ini tersimpan di perangkat lain / belum ada di sini');
    const url = URL.createObjectURL(blob);
    dlg.innerHTML = `<div class="menu"><h3>${esc(f.label)}</h3><img src="${url}" alt="${esc(f.label)}" style="width:100%;border-radius:12px"><button class="btn alt" data-i="s">Simpan ke galeri/unduhan</button><button class="btn bad sm" data-i="d">Hapus berkas</button><button class="btn alt sm" data-i="x">Tutup</button></div>`;
    dlg.querySelector('.menu').addEventListener('click', (e) => {
      const i = e.target.dataset && e.target.dataset.i; if (!i) return;
      if (i === 's') { const a = document.createElement('a'); a.href = url; a.download = (f.label || 'berkas') + '.jpg'; document.body.appendChild(a); a.click(); a.remove(); return; }
      if (i === 'd') { IDB.del(f.id); C.remove(store, f.id); commit(); }
      closeDlg();
    });
    dlg.addEventListener('close', () => URL.revokeObjectURL(url), { once: true });
    dlg.showModal();
  }

  // ---------- notifikasi ----------
  const getNLog = () => readJSON('rk1.nlog') || [];
  function notify(title, body, tag) {
    try { const l = getNLog(); l.unshift({ t: new Date().toISOString(), title, body }); localStorage.setItem('rk1.nlog', JSON.stringify(l.slice(0, 40))); } catch (e) { /* abaikan */ }
    if (document.visibilityState === 'visible') toast('🔔 ' + body);
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    const opt = { body, tag, icon: 'icon-192.png', badge: 'icon-192.png' };
    const fallback = () => { try { new Notification(title, opt); } catch (e) { /* abaikan */ } };
    if (navigator.serviceWorker && navigator.serviceWorker.getRegistration) navigator.serviceWorker.getRegistration().then((reg) => (reg && reg.showNotification ? reg.showNotification(title, opt) : fallback())).catch(fallback);
    else fallback();
  }
  const detailOn = () => cfg.notifDetail !== false;
  function loadFired(t) { const f = readJSON('rk1.fired'); return new Set(f && f.d === t ? f.k : []); }
  function saveFired(t, set) { try { localStorage.setItem('rk1.fired', JSON.stringify({ d: t, k: Array.from(set).slice(-300) })); } catch (e) { /* abaikan */ } }
  const REMIND_OPTS = [['', 'Tanpa pengingat'], ['0', 'Tepat waktu'], ['10', '10 menit sebelumnya'], ['30', '30 menit sebelumnya'], ['60', '1 jam sebelumnya']];
  function icsItems() {
    const t = C.today(), out = [], RR = { daily: 'FREQ=DAILY', weekly: 'FREQ=WEEKLY', monthly: 'FREQ=MONTHLY', yearly: 'FREQ=YEARLY' };
    list('rt').filter((r) => !r.paused).forEach((r) => C.routineICS(r, C.addDays(t, 1)).forEach((x) => out.push(x)));
    list('task').filter((x) => !x.done && x.due && x.due >= t && x.time && x.remind !== '' && x.remind != null).forEach((x) => out.push({ uid: x.id, title: x.title, date: x.due, time: x.time, rrule: RR[x.repeat], alarmMin: +x.remind || 0 }));
    list('event').filter((e) => e.time && !e.allDay).forEach((e) => out.push({ uid: e.id, title: e.title, date: e.date, time: e.time, rrule: RR[e.repeat], alarmMin: e.remind === '' ? 0 : e.remind == null ? 10 : +e.remind }));
    return out;
  }
  function waLink(phone, text) { const n = C.waNumber(phone); return 'https://wa.me/' + (n || '') + '?text=' + encodeURIComponent(text); }
  function afDrafts(p) {
    const g = relGroup(p.rel), custom = list('draft').filter((d) => d.grp === g).map((d) => ({ text: d.text, id: d.id }));
    return DRAFTS[g].map((x) => ({ text: x })).concat(custom);
  }
  async function afSend(how, pid, i) {
    const p = get('person', pid); if (!p) return; const d = afDrafts(p)[+i]; if (!d) return;
    const text = fillT(d.text, p);
    if (how === 'wa') window.open(waLink(p.phone, text), '_blank', 'noopener');
    else if (how === 'share' && navigator.share) { try { await navigator.share({ text }); } catch (e) { return; } }
    else {
      try { await navigator.clipboard.writeText(text); toast('Pesan disalin'); } catch (e) {
        const ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); toast('Pesan disalin'); } catch (e2) { toast('Salin manual: tekan lama pada teks'); } ta.remove();
      }
    }
    C.put(store, 'person', { id: p.id, lastContact: C.today() }); commit();
  }

  // ---------- komponen tampilan ----------
  const byDue = (a, b) => C.cmp(a.due || '9999', b.due || '9999') || C.cmp(a.time || '99:99', b.time || '99:99') || C.cmp(b.prio || '0', a.prio || '0');
  function taskRow(t, today) {
    const late = t.due && t.due < today && !t.done;
    return `<div class="row ${t.done ? 'done' : ''}"><button class="chk ${t.done ? 'on' : ''}" data-a="${t.done ? 'taskUndo' : 'taskDone'}" data-id="${t.id}" aria-label="${t.done ? 'Batalkan selesai' : 'Tandai selesai'}: ${esc(t.title)}">${t.done ? '✓' : ''}</button><div class="grow" data-a="taskEdit" data-id="${t.id}"><div class="t">${t.prio === '1' ? '⭐ ' : ''}${esc(t.title)}${t.repeat && t.repeat !== 'none' ? ' ↻' : ''}</div><div class="s">${t.due ? (late ? '<span class="neg">Terlambat · </span>' : '') + fmtDate(t.due) + (t.time ? ' · ' + esc(t.time) : '') : 'Tanpa tenggat'}${t.time && t.remind !== '' && t.remind != null ? ' 🔔' : ''}${t.label ? ' · ' + esc(t.label) : ''}</div></div></div>`;
  }
  function evOccurrences(from, to) {
    const out = [];
    list('event').forEach((ev) => C.expandEvent(ev, from, to).forEach((d) => out.push({ ev, date: d })));
    return out.sort((a, b) => C.cmp(a.date, b.date) || C.cmp(a.ev.time || '', b.ev.time || ''));
  }
  function evRow(o) {
    return `<div class="row" data-a="evEdit" data-id="${o.ev.id}" data-occ="${o.date}"><div style="min-width:58px;color:var(--acc);font-weight:700">${o.ev.allDay || !o.ev.time ? 'Seharian' : esc(o.ev.time)}</div><div class="grow"><div class="t">${esc(o.ev.title)}${o.ev.repeat && o.ev.repeat !== 'none' ? ' ↻' : ''}</div>${o.ev.notes ? `<div class="s">${esc(o.ev.notes)}</div>` : ''}</div></div>`;
  }
  const seg = (key, items, cur) => `<div class="seg" role="tablist">${items.map((i) => `<button class="${cur === i[0] ? 'on' : ''}" data-a="set" data-k="${key}" data-v="${i[0]}" role="tab" aria-selected="${cur === i[0]}">${i[1]}</button>`).join('')}</div>`;
  const mrow = (cls, em, title, sub, to, badgeHtml) => `<div class="row" data-a="nav" data-to="${to}" style="cursor:pointer">${ic(cls, em)}<div class="grow"><div class="t">${title}</div>${sub ? `<div class="s">${sub}</div>` : ''}</div>${badgeHtml || ''}<span class="chev">›</span></div>`;
  function habitRow(x, t) {
    const log = x.log || [], on = log.includes(t);
    let dots = '';
    for (let i = 6; i >= 0; i--) dots += `<span style="color:${log.includes(C.addDays(t, -i)) ? 'var(--acc)' : 'var(--line)'}">●</span>`;
    return `<div class="row"><button class="chk ${on ? 'on' : ''}" data-a="habitTog" data-id="${x.id}" aria-label="Centang ${esc(x.name)} hari ini">${on ? '✓' : ''}</button><div class="grow" data-a="habitEdit" data-id="${x.id}"><div class="t">${esc(x.name)}</div><div class="s">${dots} · beruntun ${C.streak(log, t)} hari</div></div></div>`;
  }
  function planStatus(p) {
    const t = C.today(), parts = [], rank = { ok: 0, soon: 1, late: 2 };
    let lvl = 'ok';
    if (p.nextDue) { const n = C.daysBetween(t, p.nextDue), l = C.urgency(n, 7); parts.push(C.countdown(n)); if (rank[l] > rank[lvl]) lvl = l; }
    const v = p.vehicleId ? get('veh', p.vehicleId) : null, left = v ? C.kmLeft(p, v.odometer) : null;
    if (left != null) { const l = left <= 0 ? 'late' : left <= 500 ? 'soon' : 'ok'; parts.push(left <= 0 ? 'lewat ' + num(-left) + ' km' : num(left) + ' km lagi'); if (rank[l] > rank[lvl]) lvl = l; }
    return { lvl, text: parts.join(' · ') || 'Atur jadwal' };
  }
  const planInterval = (p) => [p.every > 0 ? C.intervalLabel(p) : '', p.kmEvery > 0 ? 'tiap ' + num(p.kmEvery) + ' km' : ''].filter(Boolean).join(' / ');
  function planCard(p, showVeh) {
    const st = planStatus(p), g = GROUPS[p.group] || GROUPS.rumah, v = p.vehicleId ? get('veh', p.vehicleId) : null;
    return `<div class="card pc ${st.lvl === 'late' ? 'late' : ''}"><div class="pt" data-a="planOpen" data-id="${p.id}" style="cursor:pointer">${ic(g[2], g[1])}<div class="grow"><div class="t">${esc(p.name)}</div><div class="s">rutin ${esc(planInterval(p))}${showVeh && v ? ' · ' + esc(v.name) : ''}${p.lastDone ? ' · terakhir ' + fmtDate(p.lastDone) : ''}</div></div></div><div class="pa"><span class="bd ${st.lvl === 'ok' ? '' : st.lvl}">${esc(st.text)}</span><button class="btn sm" data-a="planDone" data-id="${p.id}">✓ Selesai</button></div></div>`;
  }
  const planSort = (a, b) => C.cmp(a.nextDue || '9999', b.nextDue || '9999');


  // Ilustrasi rumah (gambar orisinal buatan sendiri, SVG inline: ringan, tajam di semua layar, jalan offline).
  const HOUSE_SVG = `<svg viewBox="0 0 640 250" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Ilustrasi rumah keluarga dengan taman" preserveAspectRatio="xMidYMid slice" style="display:block;width:100%;height:auto">
<defs>
<linearGradient id="hs" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9fd3d6"/><stop offset=".6" stop-color="#f7e6c8"/><stop offset="1" stop-color="#fbd9b0"/></linearGradient>
<linearGradient id="hg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9ccb86"/><stop offset="1" stop-color="#6fa86e"/></linearGradient>
<linearGradient id="hr" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3d7a67"/><stop offset="1" stop-color="#2a5a4a"/></linearGradient>
<radialGradient id="hsun"><stop offset="0" stop-color="#fff3c4"/><stop offset="1" stop-color="#fff3c4" stop-opacity="0"/></radialGradient>
</defs>
<rect width="640" height="250" fill="url(#hs)"/>
<circle cx="520" cy="72" r="70" fill="url(#hsun)"/><circle cx="520" cy="72" r="30" fill="#ffd27a"/>
<g fill="#fff" opacity=".85"><ellipse cx="120" cy="58" rx="46" ry="13"/><ellipse cx="150" cy="48" rx="30" ry="12"/><ellipse cx="390" cy="40" rx="40" ry="11"/><ellipse cx="415" cy="33" rx="24" ry="10"/><ellipse cx="590" cy="130" rx="34" ry="9" opacity=".6"/></g>
<path d="M0 170 Q90 118 190 158 T380 150 T640 140 V250 H0Z" fill="#c9dfc8"/>
<path d="M0 185 Q120 148 250 178 T470 170 T640 168 V250 H0Z" fill="#b4d3b4"/>
<path d="M0 198 H640 V250 H0Z" fill="url(#hg)"/>
<path d="M300 250 L310 214 H334 L346 250Z" fill="#efe0c4"/><path d="M310 214 H334 L331 204 H313Z" fill="#e6d3b0"/>
<g id="hh">
<rect x="236" y="118" width="176" height="86" fill="#f6e8d0"/><rect x="236" y="196" width="176" height="8" fill="#d9c4a0"/>
<rect x="412" y="146" width="78" height="58" fill="#ecd9b9"/><rect x="412" y="196" width="78" height="8" fill="#d2bb94"/>
<path d="M404 148 L451 118 L498 148Z" fill="url(#hr)"/><rect x="402" y="146" width="98" height="6" rx="2" fill="#244b3d"/>
<rect x="372" y="62" width="20" height="40" fill="#b4553a"/><rect x="368" y="58" width="28" height="7" rx="2" fill="#8f3f29"/>
<path d="M220 122 L324 56 L428 122Z" fill="url(#hr)"/><path d="M220 122 L324 56 L428 122" fill="none" stroke="#244b3d" stroke-width="5" stroke-linejoin="round"/>
<g stroke="#244b3d" stroke-width="1.5" opacity=".35"><path d="M246 112 L324 63 L402 112"/><path d="M262 119 L324 79 L386 119"/></g>
<circle cx="324" cy="97" r="12" fill="#ffe2a0" stroke="#5b4630" stroke-width="3"/><path d="M324 85v24M312 97h24" stroke="#5b4630" stroke-width="2"/>
<rect x="302" y="146" width="40" height="58" rx="3" fill="#c2693f"/><rect x="308" y="152" width="28" height="22" rx="2" fill="#d98a5f"/><circle cx="335" cy="178" r="2.6" fill="#ffe2a0"/>
<path d="M296 146 H348 L342 138 H302Z" fill="#244b3d"/>
<g><rect x="252" y="140" width="38" height="36" rx="3" fill="#ffe2a0" stroke="#5b4630" stroke-width="3.5"/><path d="M271 140v36M252 158h38" stroke="#5b4630" stroke-width="2.5"/>
<rect x="358" y="140" width="38" height="36" rx="3" fill="#ffe2a0" stroke="#5b4630" stroke-width="3.5"/><path d="M377 140v36M358 158h38" stroke="#5b4630" stroke-width="2.5"/>
<rect x="430" y="164" width="40" height="26" rx="3" fill="#ffe2a0" stroke="#5b4630" stroke-width="3.5"/><path d="M450 164v26" stroke="#5b4630" stroke-width="2.5"/></g>
<g fill="#c2693f"><rect x="248" y="176" width="46" height="6" rx="2"/><rect x="354" y="176" width="46" height="6" rx="2"/></g>
<g fill="#e07a9b"><circle cx="256" cy="175" r="3"/><circle cx="268" cy="173" r="3"/><circle cx="280" cy="175" r="3"/><circle cx="362" cy="175" r="3"/><circle cx="374" cy="173" r="3"/><circle cx="386" cy="175" r="3"/></g>
</g>
<g fill="#fff" opacity=".7"><circle cx="383" cy="46" r="5"/><circle cx="391" cy="34" r="7"/><circle cx="403" cy="22" r="9"/></g>
<g><rect x="168" y="150" width="9" height="58" fill="#7a5638"/><circle cx="172" cy="130" r="34" fill="#4f9a6a"/><circle cx="150" cy="150" r="24" fill="#5fae78"/><circle cx="196" cy="148" r="26" fill="#468a60"/><circle cx="166" cy="116" r="18" fill="#6bbd84" opacity=".8"/></g>
<g><rect x="556" y="164" width="7" height="44" fill="#7a5638"/><circle cx="560" cy="150" r="26" fill="#4f9a6a"/><circle cx="578" cy="164" r="18" fill="#5fae78"/><circle cx="544" cy="166" r="16" fill="#468a60"/></g>
<g fill="#4a9060"><ellipse cx="238" cy="204" rx="22" ry="12"/><ellipse cx="402" cy="204" rx="20" ry="11"/><ellipse cx="496" cy="204" rx="16" ry="9"/></g>
<g fill="#f2c14e"><circle cx="228" cy="200" r="2.6"/><circle cx="240" cy="206" r="2.6"/><circle cx="398" cy="202" r="2.6"/><circle cx="410" cy="207" r="2.6"/></g>
<g stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".92"><path d="M20 216h78M104 216h60M470 224h84M560 224h70"/></g>
<g fill="none" stroke="#5b4630" stroke-width="2" stroke-linecap="round" opacity=".7"><path d="M90 88q5-6 10 0q5-6 10 0"/><path d="M130 100q4-5 8 0q4-5 8 0"/></g>
</svg>`;

  // ---------- ringkasan hari ini ----------
  function todayItems() {
    const t = C.today(), rows = [];
    const tasks = list('task').filter((x) => !x.done && x.due && x.due <= t);
    const late = tasks.filter((x) => x.due < t).length, now = tasks.length - late;
    if (late) rows.push(['c3', '⏰', late + ' tugas terlambat', 'tugas']);
    if (now) rows.push(['c2', '✅', now + ' tugas untuk hari ini', 'tugas']);
    evOccurrences(t, C.addDays(t, 1)).forEach((o) => rows.push(['c4', '📅', esc(o.ev.title) + (o.ev.time && !o.ev.allDay ? ' pukul ' + esc(o.ev.time) : ''), 'tab:cal']));
    const bs = C.budgetStatus(list('budget'), C.monthReport(list('tx'), nowYM()));
    const bad = bs.filter((b) => b.level !== 'ok');
    if (bad.length) bad.forEach((b) => rows.push(['c6', b.level === 'over' ? '🚨' : '⚠️', 'Anggaran ' + esc(b.cat) + ' ' + b.pct + '%', 'tab:money']));
    else if (bs.length) rows.push(['c2', '✅', 'Budget masih aman', 'tab:money']);
    C.homeAttention(store, t).slice(0, 5).forEach((a) => rows.push([a.level === 'late' ? 'c3' : 'c1', a.icon, esc(a.text) + (a.kind === 'plankm' || a.kind === 'low' ? '' : ' — ' + C.countdown(a.n)), a.go]));
    list('person').forEach((p) => { if (!p.birth) return; const n = C.daysBetween(t, nextBirthday(p.birth, t)); if (n <= 7) rows.push(['c6', '🎂', 'Ulang tahun ' + esc(p.nick || p.name) + (n === 0 ? ' hari ini' : ' — ' + n + ' hari lagi'), 'keluarga']); });
    const hp = list('habit').filter((h) => !(h.log || []).includes(t)).length;
    if (hp) rows.push(['c5', '🌱', hp + ' kebiasaan belum dicentang', 'habit']);
    return rows;
  }

  // ---------- halaman utama (tab) ----------
  function vToday() {
    const t = C.today(), d = C.parseD(t), hr = new Date().getHours();
    const greet = C.greeting(hr) + (ownerName() ? ', ' + ownerName() : '');
    const accs = list('acc'), nw = C.netWorth(accs, list('tx')), rep = C.monthReport(list('tx'), nowYM());
    const items = todayItems();
    const tasks = list('task').filter((x) => !x.done && x.due && x.due <= t).sort(byDue);
    const rts = list('rt').filter((r) => !r.paused && C.routineActiveOn(r, t)).sort((a, b) => C.cmp(a.from || '', b.from || ''));
    let h = `<div class="card" style="padding:0;overflow:hidden">${HOUSE_SVG}</div>${ownerName() ? '' : '<div class="card pad" data-a="profilEdit" style="cursor:pointer"><div class="t">👋 Siapa nama Anda?</div><div class="s">Ketuk untuk mengisi, supaya sapaan jadi personal.</div></div>'}<div class="card hero pad" data-a="tab" data-v="money" style="cursor:pointer"><div class="s">Kekayaan bersih</div><div class="big">${accs.length ? rp(nw) : 'Mulai catat uang'}</div><div class="s">${accs.length ? 'Bulan ini +' + rp(rep.income) + ' · −' + rp(rep.expense) : 'Ketuk untuk menambah akun pertama'}</div></div>`;
    if (rts.length) h += `<h2>Rutinitas hari ini</h2>${rts.slice(0, 4).map((r) => rtCard(r)).join('')}${rts.length > 4 ? `<button class="btn alt full" data-a="nav" data-to="harian">Lihat semua (${rts.length})</button>` : ''}`;
    h += `<h2>Hari ini</h2><div class="card">${items.length ? items.map((r) => `<div class="hr" data-a="nav" data-to="${r[3]}">${ic(r[0], r[1])}<div class="grow t" style="font-weight:600">${r[2]}</div><span class="chev">›</span></div>`).join('') : '<div class="empty">Belum ada yang perlu diperhatikan. Mulai dengan tombol + atau isi data contoh di Lainnya → Bantuan.</div>'}</div>`;
    if (tasks.length) h += `<h2>Agenda tugas</h2><div class="card">${tasks.map((x) => taskRow(x, t)).join('')}</div>`;
    h += `<h2>Menu</h2><div class="tiles">${[['🛠️', 'Rumah', 'tab:rumah'], ['🔧', 'Perawatan', 'perawatan'], ['🧾', 'Tagihan', 'tagihan'], ['🚗', 'Kendaraan', 'kendaraan'], ['🛒', 'Belanja', 'stok'], ['✅', 'Tugas', 'tugas'], ['📓', 'Jurnal', 'jurnal'], ['🌱', 'Kebiasaan', 'habit'], ['💧', 'Rutinitas', 'harian'], ['👨‍👩‍👧', 'Keluarga', 'keluarga'], ['💌', 'Kabar & afeksi', 'afeksi'], ['🔔', 'Notifikasi', 'notif']].map((m) => `<div class="tile" data-a="nav" data-to="${m[2]}" role="button" tabindex="0"><span class="em">${m[0]}</span>${m[1]}</div>`).join('')}</div>`;
    return { title: greet, sub: DAYS[d.getDay()] + ', ' + d.getDate() + ' ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear(), html: h };
  }

  function vRumah() {
    const t = C.today(), att = C.homeAttention(store, t);
    const cnt = (kinds) => att.filter((a) => kinds.includes(a.kind)).length;
    const tile = (em, name, to, n, sub) => `<div class="tile" data-a="nav" data-to="${to}" role="button" tabindex="0">${n ? `<span class="n">${n}</span>` : ''}<span class="em">${em}</span>${name}<small>${esc(sub)}</small></div>`;
    let h = `<h2>Perlu perhatian</h2><div class="card">${att.length ? att.slice(0, 6).map((a) => `<div class="hr" data-a="nav" data-to="${a.go}">${ic(a.level === 'late' ? 'c3' : 'c6', a.icon)}<div class="grow"><div class="t">${esc(a.text)}</div></div>${a.kind === 'plankm' || a.kind === 'low' ? `<span class="bd ${a.level === 'late' ? 'late' : 'soon'}">${a.kind === 'low' ? 'menipis' : a.level === 'late' ? 'lewat' : 'segera'}</span>` : badge(a.date)}</div>`).join('') : '<div class="empty">Semua beres 🎉 Tidak ada perawatan, tagihan, atau dokumen yang mendesak.</div>'}</div>`;
    h += `<h2>Kelola</h2><div class="tiles">`
      + tile('🔧', 'Perawatan', 'perawatan', cnt(['plan']), list('plan').filter((p) => !p.vehicleId).length + ' rencana')
      + tile('🧾', 'Tagihan rutin', 'tagihan', cnt(['bill']), list('bill').length + ' tagihan')
      + tile('🚗', 'Kendaraan', 'kendaraan', cnt(['pajak', 'stnk', 'plankm']), list('veh').length + ' kendaraan')
      + tile('🛡️', 'Aset & garansi', 'aset', cnt(['warranty']), list('asset').length + ' aset')
      + tile('🛒', 'Stok & belanja', 'stok', cnt(['low', 'invexp']), list('inv').length + ' barang stok')
      + tile('📄', 'Dokumen', 'dokumen', cnt(['doc']), list('doc').length + ' dokumen')
      + tile('📞', 'Kontak', 'kontak', 0, list('contact').length + ' kontak') + '</div>';
    return { title: 'Rumah', sub: att.length ? att.length + ' hal perlu perhatian' : 'Semuanya terkendali', html: h };
  }

  function vCal() {
    if (!ui.calMonth) ui.calMonth = nowYM();
    const ym = ui.calMonth, t = C.today();
    const first = C.parseD(ym + '-01'), lead = (first.getDay() + 6) % 7;
    const nDays = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate(), next = ymShift(ym, 1) + '-01';
    const evMap = {}, tkMap = {};
    evOccurrences(ym + '-01', next).forEach((o) => { (evMap[o.date] = evMap[o.date] || []).push(o); });
    list('task').filter((x) => !x.done && x.due).forEach((x) => { (tkMap[x.due] = tkMap[x.due] || []).push(x); });
    let cells = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].map((x) => `<div class="h">${x}</div>`).join('');
    for (let i = 0; i < lead; i++) cells += '<div class="day off"></div>';
    for (let d = 1; d <= nDays; d++) {
      const ds = ym + '-' + String(d).padStart(2, '0');
      cells += `<button class="day ${ds === t ? 'today' : ''} ${ds === ui.calSel ? 'sel' : ''}" data-a="calSel" data-v="${ds}" aria-label="${fmtDate(ds)}">${d}<div class="dots">${evMap[ds] ? '<i></i>' : ''}${tkMap[ds] ? '<i class="t"></i>' : ''}</div></button>`;
    }
    let h = `<div class="inl" style="justify-content:space-between;align-items:center"><button class="btn alt sm" data-a="calPrev" aria-label="Bulan sebelumnya">‹</button><b>${ymLabel(ym)}</b><button class="btn alt sm" data-a="calNext" aria-label="Bulan berikutnya">›</button></div><div class="card pad"><div class="grid">${cells}</div></div>`;
    const sel = ui.calSel;
    if (sel) {
      const es = evOccurrences(sel, C.addDays(sel, 1)), ts = tkMap[sel] || [];
      h += `<h2>${fmtDate(sel)}</h2><div class="card">${es.map(evRow).join('')}${ts.map((x) => taskRow(x, t)).join('')}${es.length + ts.length ? '' : '<div class="empty">Kosong.</div>'}</div><button class="btn full" data-a="evAdd">+ Acara di tanggal ini</button>`;
    } else h += '<p class="note">Ketuk tanggal untuk melihat agenda. Titik hijau = acara, kuning = tugas.</p><button class="btn full" data-a="evAdd">+ Acara baru</button>';
    return { title: 'Kalender', sub: '', html: h };
  }

  function vMoney() {
    if (!ui.moneyMonth) ui.moneyMonth = nowYM();
    const ym = ui.moneyMonth, accs = list('acc'), txs = list('tx');
    const bal = C.balances(accs, txs), nw = C.netWorth(accs, txs), rep = C.monthReport(txs, ym), bud = C.budgetStatus(list('budget'), rep);
    const accName = (id) => (accs.find((a) => a.id === id) || { name: '?' }).name;
    let h = `<div class="card hero pad"><div class="s">Kekayaan bersih (semua akun)</div><div class="big">${rp(nw)}</div></div>`;
    h += `<h2>Akun</h2><div class="card">${accs.length ? accs.map((a) => `<div class="row" data-a="accEdit" data-id="${a.id}">${ic('c2', a.type === 'bank' ? '🏦' : a.type === 'ewallet' ? '📱' : a.type === 'kartu' ? '💳' : a.type === 'invest' ? '📈' : '👛')}<div class="grow"><div class="t">${esc(a.name)}</div><div class="s">${esc(a.type)}</div></div><div class="${sgn(bal[a.id] || 0)}"><b>${rp(bal[a.id] || 0)}</b></div></div>`).join('') : '<div class="empty">Belum ada akun. Buat satu (mis. Dompet, BCA).</div>'}</div><button class="btn alt sm" data-a="accAdd">+ Akun</button><p class="note">Membayar kartu kredit = <b>transfer</b> dari akun bank ke akun kartu, bukan pengeluaran.</p>`;
    h += `<div class="inl" style="justify-content:space-between;align-items:center;margin-top:14px"><button class="btn alt sm" data-a="mPrev" aria-label="Bulan sebelumnya">‹</button><b>${ymLabel(ym)}</b><button class="btn alt sm" data-a="mNext" aria-label="Bulan berikutnya">›</button></div>`;
    h += `<div class="card pad"><div class="row" style="border:0;padding:0"><div class="grow s">Pemasukan<div class="pos t">${rp(rep.income)}</div></div><div class="grow s">Pengeluaran<div class="neg t">${rp(rep.expense)}</div></div><div class="grow s">Selisih<div class="t ${sgn(rep.income - rep.expense)}">${rp(rep.income - rep.expense)}</div></div></div></div>`;
    h += `<h2>Anggaran</h2><div class="card">${bud.length ? bud.map((b) => `<div class="row" data-a="budEdit" data-id="${b.id}" style="display:block"><div style="display:flex;justify-content:space-between;gap:8px"><span class="t">${esc(b.cat)}</span><span class="s">${rp(b.spent)} / ${rp(b.limit)} · ${b.pct}%</span></div><div class="bar"><i class="${b.level === 'ok' ? '' : b.level}" style="width:${Math.min(100, b.pct)}%"></i></div></div>`).join('') : '<div class="empty">Belum ada anggaran.</div>'}</div><button class="btn alt sm" data-a="budAdd">+ Anggaran</button>`;
    const month = txs.filter((t) => t.date && t.date.slice(0, 7) === ym).sort((a, b) => C.cmp(b.date, a.date) || C.cmp(b._u, a._u));
    h += `<h2>Transaksi</h2><div class="card">${month.length ? month.map((t) => {
      const lbl = t.kind === 'transfer' ? `${esc(accName(t.acc))} → ${esc(accName(t.to))}` : esc(t.cat || '') + ' · ' + esc(accName(t.acc));
      const col = t.kind === 'income' ? 'pos' : t.kind === 'expense' ? 'neg' : '', sign = t.kind === 'income' ? '+' : t.kind === 'expense' ? '−' : '⇄ ';
      return `<div class="row" ${t.void ? 'style="opacity:.5;text-decoration:line-through"' : ''}><div class="grow"><div class="t">${lbl}${t.void ? ' <span class="tag">void</span>' : ''}</div><div class="s">${fmtDate(t.date)}${t.note ? ' · ' + esc(t.note) : ''}</div></div><div class="${col}"><b>${sign}${rp(t.amount)}</b></div>${t.void ? '' : `<button class="link" data-a="txVoid" data-id="${t.id}" aria-label="Void transaksi">void</button>`}</div>`;
    }).join('') : '<div class="empty">Belum ada transaksi bulan ini.</div>'}</div><button class="btn full" data-a="txAdd">+ Catat transaksi</button><p class="note">Transaksi tidak pernah dihapus: "void" membuatnya dianggap tidak ada, riwayatnya tetap tersimpan.</p>`;
    return { title: 'Uang', sub: '', html: h };
  }

  function vMore() {
    const g = (title, rows) => `<h2>${title}</h2><div class="card">${rows.join('')}</div>`;
    const h = g('Rumah & catatan', [
      mrow('c2', '🔧', 'Perawatan', 'Servis AC, kuras toren, dll.', 'perawatan'), mrow('c6', '🧾', 'Tagihan rutin', 'Listrik, internet, air, PBB', 'tagihan'),
      mrow('c4', '🚗', 'Kendaraan', 'Pajak, STNK, odometer, servis', 'kendaraan'), mrow('c1', '🛡️', 'Aset & garansi', 'Barang berharga dan masa garansi', 'aset'),
      mrow('c3', '🛒', 'Stok & belanja', 'Persediaan rumah dan daftar belanja', 'stok'), mrow('c5', '📞', 'Kontak penting', 'Tukang, dokter, darurat', 'kontak'),
      mrow('c4', '📄', 'Dokumen penting', 'Lokasi simpan & masa berlaku', 'dokumen')])
      + g('Keluarga & hati', [mrow('c5', '👨‍👩‍👧', 'Keluarga', 'Anggota, data identitas, foto', 'keluarga'), mrow('c3', '💌', 'Kabar & afeksi', 'Draf pesan sayang & kartu obrolan', 'afeksi'), mrow('c2', '💧', 'Rutinitas harian', 'Minum air, vitamin, dll. dengan pengingat', 'harian')])
      + g('Pribadi', [mrow('c2', '✅', 'Tugas', 'Daftar tugas dan pengulangan', 'tugas'), mrow('c5', '📓', 'Jurnal', 'Catatan harian & suasana hati', 'jurnal'), mrow('c6', '🌱', 'Kebiasaan', 'Centang harian dan beruntun', 'habit')])
      + g('Pengaturan', [mrow('c5', '🙂', 'Profil saya', ownerName() || 'Isi nama untuk sapaan', 'profil'), mrow('c6', '🔔', 'Notifikasi', 'Izin, riwayat, ekspor ke Kalender HP', 'notif'), mrow('c4', '☁️', 'Sinkron & backup', 'Google Drive, ekspor/impor, notifikasi', 'setelan'), mrow('c1', '❓', 'Bantuan & data contoh', 'Cara pasang di HP, isi data contoh', 'bantuan')]);
    return { title: 'Lainnya', sub: '', html: h };
  }

  // ---------- subhalaman ----------
  const pages = {
    perawatan() {
      const gSel = ui.planGroup, all = list('plan').filter((p) => !p.vehicleId);
      const shown = all.filter((p) => gSel === 'semua' || p.group === gSel).sort(planSort);
      let h = seg('planGroup', [['semua', 'Semua'], ['rumah', 'Rumah'], ['elektronik', 'Elektronik']], gSel === 'kendaraan' ? 'semua' : gSel);
      h += shown.length ? shown.map((p) => planCard(p)).join('') : '<div class="card"><div class="empty">Belum ada rencana perawatan.<br>Mulai cepat dengan template di bawah.</div></div>';
      h += '<button class="btn full" data-a="planAdd">+ Rencana perawatan</button><div style="height:10px"></div><button class="btn alt full" data-a="planTpl">✨ Tambah dari template</button><p class="note">Perawatan kendaraan (servis, ganti oli) diatur di halaman Kendaraan agar bisa memakai interval kilometer.</p>';
      return { title: 'Perawatan', sub: all.length + ' rencana', html: h, add: () => planForm() };
    },
    planDetail(p) {
      const pl = get('plan', p.id); if (!pl) return null;
      const st = planStatus(pl), g = GROUPS[pl.group] || GROUPS.rumah, v = pl.vehicleId ? get('veh', pl.vehicleId) : null;
      const logs = list('plog').filter((l) => l.planId === pl.id).sort((a, b) => C.cmp(b.date, a.date) || C.cmp(b._u, a._u));
      let h = `<div class="card pad"><div style="display:flex;gap:12px;align-items:center">${ic(g[2], g[1])}<div class="grow"><div class="t">${esc(pl.name)}</div><div class="s">${esc(g[0])} · rutin ${esc(planInterval(pl))}</div></div><span class="bd ${st.lvl === 'ok' ? '' : st.lvl}">${esc(st.text)}</span></div></div>`;
      h += `<div class="card">${pl.nextDue ? `<div class="kv"><span>Jatuh tempo</span><b>${fmtDate(pl.nextDue)}</b></div>` : ''}${pl.nextKm ? `<div class="kv"><span>Pada odometer</span><b>${num(pl.nextKm)} km</b></div>` : ''}${v ? `<div class="kv"><span>Kendaraan</span><b>${esc(v.name)}${v.odometer ? ' · ' + num(v.odometer) + ' km' : ''}</b></div>` : ''}<div class="kv"><span>Terakhir dikerjakan</span><b>${pl.lastDone ? fmtDate(pl.lastDone) : '—'}</b></div>${pl.cost ? `<div class="kv"><span>Perkiraan biaya</span><b>${rp(pl.cost)}</b></div>` : ''}${pl.notes ? `<div class="kv"><span>Catatan</span><span>${esc(pl.notes)}</span></div>` : ''}</div>`;
      h += `<div class="btns"><button class="btn" data-a="planDone" data-id="${pl.id}">✓ Selesai</button><button class="btn alt" data-a="planEdit" data-id="${pl.id}">Ubah</button></div>`;
      h += `<h2>Riwayat</h2><div class="card">${logs.length ? logs.map((l) => `<div class="row"><div class="grow"><div class="t">${fmtDate(l.date)}</div><div class="s">${l.note ? esc(l.note) : ''}${l.odo ? ' · ' + num(l.odo) + ' km' : ''}</div></div>${l.cost ? `<b>${rp(l.cost)}</b>` : ''}</div>`).join('') : '<div class="empty">Belum ada riwayat.</div>'}</div>`;
      return { title: 'Detail perawatan', sub: '', html: h };
    },
    kendaraan() {
      const vs = list('veh').sort((a, b) => C.cmp(a.name, b.name));
      let h = '';
      vs.forEach((v) => {
        const plans = list('plan').filter((p) => p.vehicleId === v.id).sort(planSort);
        h += `<div class="card pad"><div style="display:flex;gap:12px;align-items:center" data-a="vehEdit" data-id="${v.id}">${ic('c4', v.kind === 'mobil' ? '🚗' : v.kind === 'motor' ? '🛵' : '🚙')}<div class="grow"><div class="t">${esc(v.name)}</div><div class="s">${v.plate ? esc(v.plate) + ' · ' : ''}${v.odometer !== '' && v.odometer != null ? num(v.odometer) + ' km' : 'odometer belum diisi'}</div></div><span class="chev">✎</span></div>
        ${v.pajakDue ? `<div class="kv"><span>Pajak tahunan</span><span>${fmtDate(v.pajakDue)} ${badge(v.pajakDue)}</span></div>` : ''}${v.stnkDue ? `<div class="kv"><span>STNK 5 tahunan</span><span>${fmtDate(v.stnkDue)} ${badge(v.stnkDue)}</span></div>` : ''}
        <div class="btns" style="margin-top:10px"><button class="btn alt sm" data-a="odoUpd" data-id="${v.id}">Update odometer</button><button class="btn alt sm" data-a="vehPlan" data-id="${v.id}">+ Perawatan</button><button class="btn alt sm" data-a="vehTpl" data-id="${v.id}">✨ Template</button></div></div>`;
        h += plans.length ? plans.map((p) => planCard(p)).join('') : '<p class="note">Belum ada rencana servis untuk kendaraan ini. Coba "Template" (ganti oli, servis berkala).</p>';
      });
      if (!vs.length) h = '<div class="card"><div class="empty">Belum ada kendaraan.<br>Tambahkan motor/mobil untuk melacak pajak, STNK, odometer, dan jadwal servis.</div></div>';
      h += '<button class="btn full" data-a="vehAdd">+ Tambah kendaraan</button>';
      return { title: 'Kendaraan', sub: vs.length + ' kendaraan', html: h, add: () => vehForm() };
    },
    tagihan() {
      const t = C.today(), bs = list('bill').map((b) => ({ b, due: C.billNext(b, t) })).sort((x, y) => C.cmp(x.due, y.due));
      const total = list('bill').reduce((s, b) => s + (b.amountEst || 0), 0);
      let h = `<div class="card hero pad"><div class="s">Perkiraan tagihan rutin per bulan</div><div class="big">${rp(total)}</div><div class="s">${list('bill').length} tagihan</div></div>`;
      h += `<div class="card">${bs.length ? bs.map(({ b, due }) => {
        const n = C.daysBetween(t, due), lvl = C.urgency(n, 5);
        return `<div class="row">${ic(lvl === 'late' ? 'c3' : 'c6', '🧾')}<div class="grow" data-a="billEdit" data-id="${b.id}"><div class="t">${esc(b.name)}</div><div class="s">Tiap tgl ${b.dueDay}${b.amountEst ? ' · ±' + rp(b.amountEst) : ''}${b.lastPaid ? ' · terakhir ' + fmtDate(b.lastPaid) : ''}</div></div><div style="text-align:right;display:flex;flex-direction:column;gap:6px;align-items:flex-end">${badge(due)}<button class="btn sm" data-a="billPay" data-id="${b.id}">Bayar</button></div></div>`;
      }).join('') : '<div class="empty">Belum ada tagihan rutin.<br>Tambahkan listrik, internet, air, PBB, dan lainnya.</div>'}</div><button class="btn full" data-a="billAdd">+ Tagihan rutin</button><div style="height:10px"></div><button class="btn alt full" data-a="billTpl">✨ Tambah dari template</button><p class="note">"Bayar" menandai periode ini lunas dan, bila Anda pilih akun, langsung mencatat pengeluaran di tab Uang.</p>`;
      return { title: 'Tagihan rutin', sub: '', html: h, add: () => billForm() };
    },
    aset() {
      const cats = ['Semua'].concat(Object.keys(ASSET_EMOJI));
      const as = list('asset').filter((a) => ui.assetCat === 'Semua' || a.cat === ui.assetCat).sort((a, b) => C.cmp(a.name, b.name));
      let h = seg('assetCat', cats.map((c) => [c, c]), ui.assetCat);
      h += `<div class="card">${as.length ? as.map((a) => `<div class="row" data-a="assetEdit" data-id="${a.id}">${ic('c1', ASSET_EMOJI[a.cat] || '📦')}<div class="grow"><div class="t">${esc(a.name)}</div><div class="s">${a.place ? esc(a.place) + ' · ' : ''}${a.price ? rp(a.price) : ''}</div></div>${a.warrantyUntil ? (a.warrantyUntil >= C.today() ? `<div style="text-align:right"><div class="s">Garansi</div>${badge(a.warrantyUntil)}</div>` : '<span class="bd">garansi habis</span>') : ''}</div>`).join('') : '<div class="empty">Belum ada aset. Catat barang berharga, nomor seri, dan masa garansinya.</div>'}</div><button class="btn full" data-a="assetAdd">+ Aset</button><p class="note">Kendaraan dicatat di halaman Kendaraan.</p>`;
      return { title: 'Aset & garansi', sub: list('asset').length + ' aset', html: h, add: () => assetForm() };
    },
    stok() {
      const tab = ui.stokTab;
      let h = seg('stokTab', [['belanja', '🛒 Belanja'], ['stok', '📦 Stok']], tab);
      if (tab === 'belanja') {
        const it = list('shop').sort((a, b) => C.cmp(!!a.done, !!b.done) || C.cmp(a.name, b.name));
        h += `<form class="inl" data-form="shop"><input name="n" placeholder="Tambah barang…" aria-label="Nama barang" autocomplete="off"><button class="btn">Tambah</button></form><div class="card">${it.length ? it.map((x) => `<div class="row ${x.done ? 'done' : ''}"><button class="chk ${x.done ? 'on' : ''}" data-a="shopTog" data-id="${x.id}" aria-label="Centang ${esc(x.name)}">${x.done ? '✓' : ''}</button><div class="grow t">${esc(x.name)}</div></div>`).join('') : '<div class="empty">Daftar belanja kosong.</div>'}</div>${it.some((x) => x.done) ? '<button class="btn alt sm" data-a="shopClear">Bersihkan yang sudah dicentang</button>' : ''}`;
      } else {
        const inv = list('inv').sort((a, b) => C.cmp(a.name, b.name)), low = C.lowStock(inv);
        h += `${low.length ? `<button class="btn alt full" data-a="invToShop" style="margin-bottom:12px">📥 Masukkan ${low.length} barang menipis ke daftar belanja</button>` : ''}<div class="card">${inv.length ? inv.map((i) => `<div class="row">${ic('c3', '📦')}<div class="grow" data-a="invEdit" data-id="${i.id}"><div class="t">${esc(i.name)}${C.lowStock([i]).length ? ' <span class="bd late">menipis</span>' : ''}</div><div class="s">${i.min ? 'min ' + i.min + ' · ' : ''}${i.place ? esc(i.place) + ' · ' : ''}${i.expiry ? 'exp ' + fmtDate(i.expiry) : ''}</div></div><button class="qb" data-a="invDec" data-id="${i.id}" aria-label="Kurangi ${esc(i.name)}">−</button><div class="qty">${i.qty} ${esc(i.unit || '')}</div><button class="qb" data-a="invInc" data-id="${i.id}" aria-label="Tambah ${esc(i.name)}">+</button></div>`).join('') : '<div class="empty">Belum ada stok. Catat gas, beras, obat, dll. dengan batas minimum.</div>'}</div><button class="btn full" data-a="invAdd">+ Barang stok</button>`;
      }
      return { title: 'Stok & belanja', sub: '', html: h, add: tab === 'stok' ? () => invForm() : null };
    },
    kontak() {
      const cs = list('contact').sort((a, b) => C.cmp(!!b.emergency, !!a.emergency) || C.cmp(a.name, b.name));
      return { title: 'Kontak penting', sub: '', add: () => contactForm(), html: `<div class="card">${cs.length ? cs.map((c) => `<div class="row">${ic(c.emergency ? 'c3' : 'c5', c.emergency ? '🚨' : '👤')}<div class="grow" data-a="contactEdit" data-id="${c.id}"><div class="t">${esc(c.name)}</div><div class="s">${esc(c.role || '')}</div></div>${c.phone ? `<a class="btn sm" href="tel:${esc(c.phone.replace(/[^\d+]/g, ''))}">📞 ${esc(c.phone)}</a>` : ''}</div>`).join('') : '<div class="empty">Belum ada kontak (tukang, dokter, RT, PLN…).</div>'}</div><button class="btn full" data-a="contactAdd">+ Kontak</button>` };
    },
    dokumen() {
      const ds = list('doc').sort((a, b) => C.cmp(a.expiry || '9999', b.expiry || '9999'));
      return { title: 'Dokumen penting', sub: '', add: () => docForm(), html: `<div class="card">${ds.length ? ds.map((d) => `<div class="row" data-a="docEdit" data-id="${d.id}">${ic('c4', '📄')}<div class="grow"><div class="t">${esc(d.title)}</div><div class="s">${d.place ? 'Disimpan: ' + esc(d.place) : 'Lokasi belum diisi'}</div></div>${d.expiry ? badge(d.expiry) : ''}</div>`).join('') : '<div class="empty">Belum ada dokumen. Catat lokasi simpan dan masa berlaku (sertifikat, polis, paspor, SIM).</div>'}</div><button class="btn full" data-a="docAdd">+ Dokumen</button><p class="note">Hanya lokasi & masa berlaku. Jangan simpan nomor identitas di sini (belum terenkripsi ujung-ke-ujung).</p>` };
    },
    tugas() {
      const t = C.today(), all = list('task'), f = ui.taskFilter;
      const act = all.filter((x) => !x.done).sort(byDue), done = all.filter((x) => x.done).sort((a, b) => C.cmp(b.doneAt || '', a.doneAt || ''));
      const shown = f === 'aktif' ? act : done;
      return { title: 'Tugas', sub: act.length + ' aktif', add: () => taskForm(), html: seg('taskFilter', [['aktif', 'Aktif (' + act.length + ')'], ['selesai', 'Selesai (' + done.length + ')']], f) + `<div class="card">${shown.length ? shown.map((x) => taskRow(x, t)).join('') : `<div class="empty">${f === 'aktif' ? 'Belum ada tugas.' : 'Belum ada tugas selesai.'}</div>`}</div><button class="btn full" data-a="taskAdd">+ Tugas baru</button>` };
    },
    jurnal() {
      const js = list('journal').sort((a, b) => C.cmp(b.date, a.date) || C.cmp(b._u, a._u));
      return { title: 'Jurnal', sub: '', add: () => journalForm(), html: `<div class="card">${js.length ? js.map((j) => `<div class="row" data-a="journalEdit" data-id="${j.id}"><div style="font-size:1.6rem">${MOODS[(+j.mood || 3) - 1]}</div><div class="grow"><div class="s">${fmtDate(j.date)}</div><div class="t" style="font-weight:500">${esc(j.text.length > 140 ? j.text.slice(0, 140) + '…' : j.text)}</div></div></div>`).join('') : '<div class="empty">Belum ada jurnal.</div>'}</div><button class="btn full" data-a="journalAdd">+ Tulis jurnal</button><p class="note">Jurnal tersimpan polos (belum dienkripsi ujung-ke-ujung); di Drive ia berada di folder privat aplikasi milik akun Google Anda.</p>` };
    },
    habit() {
      const t = C.today(), hs = list('habit');
      return { title: 'Kebiasaan', sub: '', add: () => habitForm(), html: `<div class="card">${hs.length ? hs.map((x) => habitRow(x, t)).join('') : '<div class="empty">Belum ada kebiasaan.</div>'}</div><button class="btn full" data-a="habitAdd">+ Kebiasaan</button>` };
    },
    harian() {
      const rs = list('rt').sort((a, b) => C.cmp(a.from || '', b.from || '') || C.cmp(a.name, b.name));
      let h = rs.length ? rs.map((r) => rtCard(r)).join('') : '<div class="card"><div class="empty">Belum ada rutinitas harian.<br>Mulai dari template: minum air 2 liter, vitamin, olahraga, kabari keluarga.</div></div>';
      h += '<button class="btn full" data-a="rtAdd">+ Rutinitas baru</button><div style="height:10px"></div><button class="btn alt full" data-a="rtTpl">✨ Tambah dari template</button><p class="note">Pengingat berhenti sendiri bila Anda sudah sesuai laju atau target tercapai. Ketuk nama rutinitas untuk mengubah, menjeda, atau mengekspor ke Kalender HP.</p>';
      return { title: 'Rutinitas harian', sub: rs.length + ' rutinitas', html: h, add: () => routineForm() };
    },
    notif() {
      const perm = 'Notification' in window ? Notification.permission : 'tidak didukung', log = getNLog();
      const permTxt = { granted: 'aktif ✓', denied: 'diblokir (ubah di pengaturan browser)', default: 'belum diizinkan', 'tidak didukung': 'tidak didukung browser ini' }[perm] || perm;
      let h = `<div class="card pad"><div class="kv"><span>Izin notifikasi</span><b>${esc(permTxt)}</b></div><div class="btns" style="margin-top:10px"><button class="btn" data-a="notif">Izinkan notifikasi</button><button class="btn alt" data-a="notifTest">Uji sekarang</button></div><div class="kv" style="margin-top:10px"><span>Tampilkan nama rutinitas/tugas di notifikasi</span><button class="btn alt sm" data-a="notifDetail">${detailOn() ? 'Ya' : 'Tidak'}</button></div></div>`;
      h += `<h2>Agar tetap berbunyi saat aplikasi tertutup</h2><div class="card pad"><p class="s" style="margin:0 0 10px">Aplikasi web murni (tanpa server) hanya bisa menyalakan pengingat selagi aplikasi terbuka. Untuk pengingat yang pasti berbunyi, ekspor ke Kalender HP: alarm dijalankan oleh aplikasi Kalender, bukan oleh aplikasi ini.</p><button class="btn full" data-a="icsAll">📅 Ekspor pengingat ke Kalender HP (.ics)</button><p class="note">Berisi rutinitas aktif, tugas ber-jam yang punya pengingat, dan acara ber-jam. Buka berkas .ics di HP lalu pilih Google Calendar. Ekspor ulang bila jadwal berubah (jangan impor dua kali agar tidak dobel).</p></div>`;
      h += `<h2>Riwayat notifikasi</h2><div class="card">${log.length ? log.map((x) => `<div class="row"><div class="grow"><div class="t" style="font-weight:600">${esc(x.body)}</div><div class="s">${esc(new Date(x.t).toLocaleString('id-ID'))}</div></div></div>`).join('') : '<div class="empty">Belum ada notifikasi yang berbunyi.</div>'}</div>`;
      return { title: 'Notifikasi', sub: '', html: h };
    },
    profil() {
      const p = profile();
      return { title: 'Profil saya', sub: '', html: `<div class="card pad"><div class="kv"><span>Nama</span><b>${esc(p.name || '—')}</b></div><div class="kv"><span>Panggilan (sapaan)</span><b>${esc(p.nick || '—')}</b></div><div class="kv"><span>Sebutan untuk anak</span><b>${esc(p.callKid || '—')}</b></div><div style="margin-top:12px"><button class="btn full" data-a="profilEdit">${p.name ? 'Ubah profil' : 'Isi nama saya'}</button></div></div><p class="note">Sapaan di Beranda: "${esc(C.greeting(new Date().getHours()))}${ownerName() ? ', ' + esc(ownerName()) : ''}".</p>` };
    },
    keluarga() {
      const ps = list('person').sort((a, b) => C.cmp(a.name, b.name)), t = C.today();
      const h = `<div class="card">${ps.length ? ps.map((p) => {
        const age = C.ageOn(p.birth, t), bd = p.birth ? C.daysBetween(t, nextBirthday(p.birth, t)) : null;
        return `<div class="row" data-a="personOpen" data-id="${p.id}">${avHTML(p)}<div class="grow"><div class="t">${esc(p.name)}</div><div class="s">${esc(p.rel || '')}${age != null ? ' · ' + age + ' th' : ''}${p.lastContact ? ' · dikabari ' + C.countdown(C.daysBetween(t, p.lastContact)).replace('hari ini', 'hari ini') : ''}</div></div>${bd != null && bd <= 14 ? `<span class="bd soon">🎂 ${bd === 0 ? 'hari ini' : bd + ' hari'}</span>` : ''}<span class="chev">›</span></div>`;
      }).join('') : '<div class="empty">Belum ada anggota keluarga.<br>Tambahkan pasangan, anak, atau orang tua, lalu isi data pribadi masing-masing.</div>'}</div><button class="btn full" data-a="personAdd">+ Anggota keluarga</button><div style="height:10px"></div><button class="btn alt full" data-a="nav" data-to="afeksi">💌 Kirim kabar &amp; kata sayang</button>`;
      return { title: 'Keluarga', sub: ps.length + ' anggota', html: h, add: () => personForm() };
    },
    orang(pp) {
      const p = get('person', pp.id); if (!p) return null;
      const t = C.today(), files = list('pfile').filter((f) => f.personId === p.id).sort((a, b) => C.cmp(a._u, b._u)), age = C.ageOn(p.birth, t);
      let h = `<div class="card pad"><div style="display:flex;gap:14px;align-items:center">${avHTML(p, 'lg')}<div class="grow"><div class="t" style="font-size:1.15rem">${esc(p.name)}</div><div class="s">${esc(p.rel || '')}${p.nick ? ' · "' + esc(p.nick) + '"' : ''}${age != null ? ' · ' + age + ' tahun' : ''}</div></div></div>
        ${p.birth ? `<div class="kv"><span>Lahir</span><b>${fmtDate(p.birth)}</b></div>` : ''}${p.phone ? `<div class="kv"><span>Telepon</span><a href="tel:${esc(p.phone.replace(/[^\d+]/g, ''))}"><b>${esc(p.phone)}</b></a></div>` : ''}${p.notes ? `<div class="kv"><span>Catatan</span><span>${esc(p.notes)}</span></div>` : ''}
        <div class="btns" style="margin-top:12px"><button class="btn" data-a="personKabar" data-id="${p.id}">💌 Kabari</button><button class="btn alt" data-a="personEdit" data-id="${p.id}">Ubah</button><button class="btn alt" data-a="personPhoto" data-id="${p.id}">📷 Foto profil</button></div></div>`;
      h += `<h2>Data identitas</h2><div class="card">${(p.ids || []).length ? p.ids.map((e, i) => {
        const key = p.id + ':' + i, shown = ui.reveal[key];
        return `<div class="row"><div class="grow"><div class="s">${esc(e.kind)}${e.exp ? ' · berlaku s.d. ' + fmtDate(e.exp) : ''}</div><div class="t idn">${shown ? esc(e.no) : esc(C.maskId(e.no))}</div>${e.note ? `<div class="s">${esc(e.note)}</div>` : ''}</div><div class="inl" style="gap:6px"><button class="btn alt sm" data-a="idShow" data-key="${key}">${shown ? 'Sembunyikan' : 'Tampilkan'}</button>${shown ? `<button class="btn alt sm" data-a="idCopy" data-id="${p.id}" data-i="${i}">Salin</button>` : ''}<button class="link" data-a="idEdit" data-id="${p.id}" data-i="${i}" aria-label="Ubah">✎</button></div></div>`;
      }).join('') : '<div class="empty">Belum ada data. Tambahkan KTP, NPWP, KK, SIM, BPJS, dll.</div>'}</div><button class="btn full" data-a="idAdd" data-id="${p.id}">+ Data identitas</button>`;
      h += `<h2>Foto &amp; berkas</h2><div class="card">${files.length ? files.map((f) => `<div class="row" data-a="fileOpen" data-id="${f.id}">${ic('c4', '🖼️')}<div class="grow"><div class="t">${esc(f.label)}</div><div class="s">${fmtDate((f._u || '').slice(0, 10))}${f.size ? ' · ' + Math.round(f.size / 1024) + ' KB' : ''}</div></div><span class="chev">›</span></div>`).join('') : '<div class="empty">Belum ada foto KTP/NPWP/dokumen.</div>'}</div><button class="btn full" data-a="fileAdd" data-id="${p.id}">+ Foto / berkas</button>`;
      h += '<p class="note">⚠️ Nomor identitas disimpan polos dan hanya disembunyikan di layar. Foto berkas disimpan hanya di perangkat ini (tidak ikut ekspor/sinkron Drive); ganti HP = unggah ulang. Enkripsi dengan kata sandi belum ada — gunakan kunci layar HP yang kuat.</p>';
      return { title: p.nick || p.name, sub: p.rel || '', html: h, add: () => personForm(p) };
    },
    afeksi() {
      const tab = ui.afTab, t = C.today();
      let h = seg('afTab', [['kabar', '💌 Kabar'], ['kartu', '🃏 Kartu'], ['riwayat', 'Riwayat']], tab);
      if (tab === 'kabar') {
        const ps = list('person').sort((a, b) => C.cmp(a.name, b.name));
        if (!ps.length) return { title: 'Kabar & afeksi', sub: '', html: h + '<div class="card"><div class="empty">Tambahkan anggota keluarga dulu, lalu draf kabar muncul sesuai hubungan (pasangan, anak, orang tua).</div></div><button class="btn full" data-a="nav" data-to="keluarga">Ke Keluarga</button>' };
        let sel = ps.find((x) => x.id === ui.afWho) || ps[0];
        h += `<div class="chips">${ps.map((x) => `<button class="chip ${x.id === sel.id ? 'on' : ''}" data-a="afWho" data-id="${x.id}">${esc(x.nick || x.name)}</button>`).join('')}</div>`;
        h += `<div class="card pad" style="display:flex;gap:12px;align-items:center">${avHTML(sel)}<div class="grow"><div class="t">${esc(sel.name)}</div><div class="s">${esc(sel.rel || '')} · ${sel.lastContact ? 'terakhir dikabari ' + (C.daysBetween(sel.lastContact, t) === 0 ? 'hari ini' : C.daysBetween(sel.lastContact, t) + ' hari lalu') : 'belum pernah dikabari lewat aplikasi'}</div></div></div>`;
        h += afDrafts(sel).map((d, i) => `<div class="card pad draft"><p style="margin:0 0 10px;line-height:1.5">${esc(fillT(d.text, sel))}</p><div class="btns"><button class="btn sm" data-a="afWa" data-id="${sel.id}" data-i="${i}">${sel.phone ? 'WhatsApp' : 'WhatsApp (pilih kontak)'}</button>${navigator.share ? `<button class="btn alt sm" data-a="afShare" data-id="${sel.id}" data-i="${i}">Bagikan</button>` : ''}<button class="btn alt sm" data-a="afCopy" data-id="${sel.id}" data-i="${i}">Salin</button>${d.id ? `<button class="btn alt sm" data-a="draftEdit" data-id="${d.id}">Ubah</button>` : ''}</div></div>`).join('');
        h += '<button class="btn alt full" data-a="draftAdd">+ Tulis draf sendiri</button><p class="note">Tombol WhatsApp membuka chat dengan pesan sudah terisi; Anda yang menekan kirim. Tidak ada pesan terkirim otomatis.</p>';
      } else if (tab === 'kartu') {
        const cats = Object.keys(CARDS), cat = cats.includes(ui.cardCat) ? ui.cardCat : cats[0], deck = CARDS[cat];
        const dayN = Math.floor(C.parseD(t).getTime() / 86400000), q = deck[(dayN + ui.cardShift) % deck.length];
        const seen = list('ccard').some((c) => c.q === q);
        h += `<div class="chips">${cats.map((c) => `<button class="chip ${c === cat ? 'on' : ''}" data-a="cardCat" data-v="${esc(c)}">${esc(c)}</button>`).join('')}</div>`;
        h += `<div class="cc"><div class="cc-in"><small>${esc(cat)}</small><p>${esc(q)}</p></div></div><div class="btns"><button class="btn alt" data-a="cardNext">Kartu lain</button><button class="btn" data-a="cardDone" data-q="${esc(q)}" data-cat="${esc(cat)}">${seen ? '✓ Sudah pernah dibahas' : 'Sudah kita bahas ✓'}</button></div><p class="note">Luangkan beberapa menit, matikan layar lain, dan gantian menjawab. Tidak ada jawaban salah.</p>`;
      } else {
        const hs = list('ccard').sort((a, b) => C.cmp(b.date, a.date) || C.cmp(b._u, a._u));
        h += `<div class="card">${hs.length ? hs.map((c) => `<div class="row"><div class="grow"><div class="s">${fmtDate(c.date)} · ${esc(c.cat)}</div><div class="t" style="font-weight:500">${esc(c.q)}</div></div></div>`).join('') : '<div class="empty">Belum ada kartu yang dibahas.</div>'}</div>`;
      }
      return { title: 'Kabar & afeksi', sub: '', html: h };
    },
    setelan() { return { title: 'Sinkron & backup', sub: '', html: vSettings() }; },
    bantuan() {
      const demo = list('task').concat(list('plan')).some((x) => x.demo);
      return { title: 'Bantuan', sub: '', html: `<div class="card pad"><div class="t">Pasang di layar utama HP</div><p class="s" style="margin:6px 0 0">Android (Chrome): menu ⋮ → <b>Tambahkan ke layar utama</b> / <b>Instal aplikasi</b>. iPhone (Safari): tombol Bagikan → <b>Tambah ke Layar Utama</b>.</p></div>
<div class="card pad"><div class="t">Data contoh</div><p class="s" style="margin:6px 0 10px">Isi contoh perawatan, tagihan, kendaraan, dan transaksi untuk melihat cara kerja aplikasi. Bisa dihapus kapan saja tanpa menyentuh data asli Anda.</p>${demo ? '<button class="btn bad" data-a="demoOff">Hapus data contoh</button>' : '<button class="btn" data-a="demoOn">Isi data contoh</button>'}</div>
<div class="card pad"><div class="t">Aturan yang dipegang</div><p class="s" style="margin:6px 0 0">Uang = bilangan bulat rupiah. Transaksi tidak dihapus, hanya di-void. Transfer bukan pemasukan/pengeluaran. Notifikasi berjudul generik.</p></div><p class="note">RUMAHKU-ONE Lite v0.3</p>` };
    },
  };

  function vSettings() {
    const last = cfg.lastSync ? new Date(cfg.lastSync).toLocaleString('id-ID') : 'belum pernah';
    const notif = 'Notification' in window ? Notification.permission : 'tidak didukung';
    return `<h2>Google Drive</h2><div class="card pad"><label class="f">Google OAuth Client ID<input id="cid" value="${esc(cfg.clientId || '')}" placeholder="xxxx.apps.googleusercontent.com" autocomplete="off"></label>
<div class="btns" style="margin-top:10px"><button class="btn alt" data-a="saveCid">Simpan ID</button><button class="btn" data-a="syncNow">${cfg.connected ? 'Sinkron sekarang' : 'Hubungkan &amp; sinkron'}</button></div>
<p class="note">Status: ${esc(syncMsg || (cfg.connected ? 'terhubung' : 'belum terhubung'))} · terakhir sinkron: ${esc(last)}</p>
<p class="note">Data disimpan di folder tersembunyi aplikasi di Drive Anda. Tanpa Client ID, data hanya di perangkat ini.</p></div>
<h2>Backup</h2><div class="card pad"><div class="btns"><button class="btn alt" data-a="export">Ekspor JSON</button><button class="btn alt" data-a="import">Impor / gabung JSON</button></div><input type="file" id="impf" accept="application/json,.json" hidden></div>
<h2>Pengingat</h2><div class="card pad"><p class="note" style="margin-top:0">Izin notifikasi, uji, riwayat, dan ekspor ke Kalender HP ada di halaman Notifikasi.</p><button class="btn alt" data-a="nav" data-to="notif">Buka Notifikasi</button></div>
<h2>Data</h2><div class="card pad"><button class="btn bad" data-a="wipe">Hapus data di perangkat ini</button><p class="note">Salinan di Drive (jika terhubung) tidak ikut terhapus.</p></div>`;
  }

  // ---------- render & navigasi ----------
  const views = { today: vToday, rumah: vRumah, money: vMoney, cal: vCal, more: vMore };
  function render() {
    const pg = ui.stack.length ? ui.stack[ui.stack.length - 1] : null;
    const v = pg ? pages[pg.n](pg.p) : views[ui.tab]();
    if (pg && !v) { ui.stack.pop(); return render(); }
    ui.addFn = v.add || null;
    document.getElementById('top').innerHTML = `${pg ? '<button class="bk" data-a="back" aria-label="Kembali">‹</button>' : ''}<div class="tt"><h1>${esc(v.title)}</h1>${v.sub ? `<p>${esc(v.sub)}</p>` : ''}</div>${v.add ? '<button class="btn sm" data-a="pageAdd">+ Tambah</button>' : ''}`;
    const main = document.getElementById('main'), y = window.scrollY;
    main.innerHTML = v.html;
    window.scrollTo(0, y);
    document.querySelectorAll('#nav button').forEach((b) => b.classList.toggle('on', !pg && b.dataset.v === ui.tab));
  }
  function go(name, p) {
    ui.stack.push({ n: name, p: p || {} });
    try { history.pushState({ d: ui.stack.length }, ''); } catch (e) { /* abaikan */ }
    window.scrollTo(0, 0); render();
  }
  function switchTab(v) {
    const n = ui.stack.length; ui.tab = v; ui.stack = [];
    if (n) { ignorePop = true; try { history.go(-n); } catch (e) { ignorePop = false; } }
    window.scrollTo(0, 0); render();
  }
  window.addEventListener('popstate', () => {
    if (ignorePop) { ignorePop = false; return; }
    if (ui.stack.length) { ui.stack.pop(); render(); }
  });

  // ---------- aksi ----------
  const A = {
    tab(d) { switchTab(d.v); },
    nav(d) { if (d.to.startsWith('tab:')) switchTab(d.to.slice(4)); else go(d.to); },
    back() { try { history.back(); } catch (e) { ui.stack.pop(); render(); } },
    pageAdd() { if (ui.addFn) ui.addFn(); },
    set(d) { ui[d.k] = d.v; render(); },
    quick() {
      openMenu('Tambah cepat', [
        { label: '✅ Tugas', fn: () => taskForm() }, { label: '💸 Pengeluaran', fn: () => txForm('expense') }, { label: '💰 Pemasukan', fn: () => txForm('income') },
        { label: '📅 Acara', fn: () => eventForm() }, { label: '🔧 Rencana perawatan', fn: () => planForm() }, { label: '🧾 Tagihan rutin', fn: () => billForm() },
        { label: '🛒 Barang belanja', fn: () => { ui.stokTab = 'belanja'; go('stok'); const i = document.querySelector('[name=n]'); if (i) i.focus(); } }, { label: '📓 Jurnal', fn: () => journalForm() },
      ]);
    },
    taskDone(d) { const t = get('task', d.id); if (!t) return; C.put(store, 'task', C.completeTask(t, C.today())); commit(); toast(t.repeat && t.repeat !== 'none' ? 'Selesai · jadwal berikutnya dimajukan' : 'Selesai ✓'); },
    taskUndo(d) { const t = get('task', d.id); if (t) { C.put(store, 'task', { id: t.id, done: false, doneAt: '' }); commit(); } },
    taskEdit(d) { taskForm(get('task', d.id)); }, taskAdd() { taskForm(); },
    calPrev() { ui.calMonth = ymShift(ui.calMonth, -1); ui.calSel = null; render(); }, calNext() { ui.calMonth = ymShift(ui.calMonth, 1); ui.calSel = null; render(); },
    calSel(d) { ui.calSel = d.v; render(); }, evAdd() { eventForm(); }, evEdit(d) { eventForm(get('event', d.id), d.occ); },
    mPrev() { ui.moneyMonth = ymShift(ui.moneyMonth, -1); render(); }, mNext() { ui.moneyMonth = ymShift(ui.moneyMonth, 1); render(); },
    txAdd() { txForm(); }, accAdd() { accForm(); }, accEdit(d) { accForm(get('acc', d.id)); }, budAdd() { budgetForm(); }, budEdit(d) { budgetForm(get('budget', d.id)); },
    txVoid(d) { const t = get('tx', d.id); if (!t) return; confirmBox('Void transaksi ' + rp(t.amount) + '? Dianggap tidak ada, riwayat tetap tersimpan.', () => { C.put(store, 'tx', { id: t.id, void: true, voidAt: C.today() }); commit(); }); },
    planAdd() { planForm(null, { group: ui.planGroup === 'semua' ? 'rumah' : ui.planGroup }); }, planTpl() { templateForm(); },
    planOpen(d) { go('planDetail', { id: d.id }); }, planEdit(d) { planForm(get('plan', d.id)); }, planDone(d) { const p = get('plan', d.id); if (p) planDoneForm(p); },
    vehAdd() { vehForm(); }, vehEdit(d) { vehForm(get('veh', d.id)); }, odoUpd(d) { odoForm(get('veh', d.id)); },
    vehPlan(d) { planForm(null, { vehicleId: d.id, group: 'kendaraan', every: 6, unit: 'month' }); }, vehTpl(d) { templateForm(d.id); },
    billAdd() { billForm(); }, billTpl() { billTemplateForm(); }, billEdit(d) { billForm(get('bill', d.id)); }, billPay(d) { const b = get('bill', d.id); if (b) billPayForm(b); },
    assetAdd() { assetForm(); }, assetEdit(d) { assetForm(get('asset', d.id)); },
    invAdd() { invForm(); }, invEdit(d) { invForm(get('inv', d.id)); },
    invInc(d) { const i = get('inv', d.id); if (i) { C.put(store, 'inv', { id: i.id, qty: (+i.qty || 0) + 1 }); commit(); } },
    invDec(d) { const i = get('inv', d.id); if (i) { C.put(store, 'inv', { id: i.id, qty: Math.max(0, (+i.qty || 0) - 1) }); commit(); } },
    invToShop() {
      const have = new Set(list('shop').filter((x) => !x.done).map((x) => x.name.toLowerCase()));
      let n = 0; C.lowStock(list('inv')).forEach((i) => { if (!have.has(i.name.toLowerCase())) { C.put(store, 'shop', { name: i.name, done: false }); n++; } });
      commit(); toast(n ? n + ' barang masuk daftar belanja' : 'Sudah ada di daftar belanja');
    },
    shopTog(d) { const x = get('shop', d.id); if (x) { C.put(store, 'shop', { id: x.id, done: !x.done }); commit(); } },
    shopClear() { list('shop').filter((x) => x.done).forEach((x) => C.remove(store, x.id)); commit(); },
    contactAdd() { contactForm(); }, contactEdit(d) { contactForm(get('contact', d.id)); }, docAdd() { docForm(); }, docEdit(d) { docForm(get('doc', d.id)); },
    journalAdd() { journalForm(); }, journalEdit(d) { journalForm(get('journal', d.id)); }, habitAdd() { habitForm(); }, habitEdit(d) { habitForm(get('habit', d.id)); },
    habitTog(d) { const h = get('habit', d.id); if (!h) return; const t = C.today(), log = h.log || []; C.put(store, 'habit', { id: h.id, log: log.includes(t) ? log.filter((x) => x !== t) : log.concat([t]).slice(-400) }); commit(); },
    saveCid() { cfg.clientId = (document.getElementById('cid').value || '').trim(); cfg.connected = false; saveCfg(); syncMsg = ''; toast('Client ID disimpan'); render(); },
    syncNow() { const el = document.getElementById('cid'); if (el && el.value.trim() !== (cfg.clientId || '')) { cfg.clientId = el.value.trim(); cfg.connected = false; saveCfg(); } runSync(true); },
    export() {
      const blob = new Blob([JSON.stringify(store)], { type: 'application/json' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'rumahku-backup-' + C.today() + '.json';
      document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    },
    import() { document.getElementById('impf').click(); },
    notif() { if (!('Notification' in window)) return toast('Browser tidak mendukung notifikasi'); Notification.requestPermission().then(() => render()); },
    wipe() { confirmBox('Hapus SEMUA data di perangkat ini? (Ekspor backup dulu bila perlu)', () => { store = C.emptyStore(); persist(); render(); toast('Data lokal dihapus'); }); },
    demoOn() { demoOn(); }, demoOff() { demoOff(); },
    rtAdd() { routineForm(); }, rtTpl() { rtTemplateForm(); }, rtEdit(d) { routineForm(get('rt', d.id)); },
    rtInc(d) { rtBump(d.id, 1); }, rtDec(d) { rtBump(d.id, -1); },
    profilEdit() { profilForm(); },
    personAdd() { personForm(); }, personEdit(d) { personForm(get('person', d.id)); }, personOpen(d) { go('orang', { id: d.id }); },
    personKabar(d) { ui.afTab = 'kabar'; ui.afWho = d.id; go('afeksi'); },
    personPhoto(d) {
      const p = get('person', d.id); if (!p) return;
      pickImage(async (f) => { try { const url = await avatarFrom(f); C.put(store, 'person', { id: p.id, photo: url }); commit(); toast('Foto profil diperbarui'); } catch (e) { toast(e.message); } });
    },
    idAdd(d) { const p = get('person', d.id); if (p) idForm(p); }, idEdit(d) { const p = get('person', d.id); if (p) idForm(p, +d.i); },
    idShow(d) { ui.reveal[d.key] = !ui.reveal[d.key]; render(); },
    async idCopy(d) { const p = get('person', d.id), e = p && (p.ids || [])[+d.i]; if (!e) return; try { await navigator.clipboard.writeText(e.no); toast('Nomor disalin'); } catch (x) { toast('Salin manual dari layar'); } },
    fileAdd(d) {
      const p = get('person', d.id); if (!p) return;
      pickImage(async (f) => {
        let blob; try { blob = await resizeBlob(f, 1400, 0.75); } catch (e) { return toast(e.message); }
        openForm('Label berkas', [{ k: 'label', label: 'Jenis berkas', req: true, list: FILE_LABELS }], { label: 'KTP' }, (v) => {
          const rec = C.put(store, 'pfile', { personId: p.id, label: v.label, size: blob.size });
          IDB.put(rec.id, blob).then(() => { commit(); toast('Berkas tersimpan di perangkat ini'); }).catch(() => { C.remove(store, rec.id); commit(); toast('Gagal menyimpan berkas (penyimpanan penuh/dibatasi)'); });
        });
      });
    },
    fileOpen(d) { const f = get('pfile', d.id); if (f) viewFile(f); },
    afWho(d) { ui.afWho = d.id; render(); }, afWa(d) { afSend('wa', d.id, d.i); }, afShare(d) { afSend('share', d.id, d.i); }, afCopy(d) { afSend('copy', d.id, d.i); },
    draftAdd() { draftForm(); }, draftEdit(d) { draftForm(get('draft', d.id)); },
    cardCat(d) { ui.cardCat = d.v; ui.cardShift = 0; render(); }, cardNext() { ui.cardShift++; render(); },
    cardDone(d) { if (!list('ccard').some((c) => c.q === d.q)) C.put(store, 'ccard', { q: d.q, cat: d.cat, date: C.today() }); commit(); toast('Tersimpan di Riwayat'); },
    notifTest() { if (!('Notification' in window) || Notification.permission !== 'granted') toast('Izinkan notifikasi dulu'); notify('RUMAHKU', detailOn() ? '💧 Uji pengingat: waktunya minum' : 'Ada pengingat', 'test'); render(); },
    notifDetail() { cfg.notifDetail = !detailOn(); saveCfg(); render(); },
    icsAll() { const items = icsItems(); if (!items.length) return toast('Belum ada pengingat ber-jam untuk diekspor'); downloadText('rumahku-pengingat.ics', C.buildICS(items), 'text/calendar'); toast(items.length + ' pengingat diekspor'); },
  };

  // ---------- data contoh (ditandai demo:true; dapat dihapus tanpa menyentuh data asli) ----------
  function demoOn() {
    const t = C.today(), D = (o) => Object.assign({ demo: true }, o), add = (n) => C.addDays(t, n);
    const acc1 = C.put(store, 'acc', D({ name: 'Dompet', type: 'kas', opening: 500000 })), acc2 = C.put(store, 'acc', D({ name: 'BCA', type: 'bank', opening: 7500000 }));
    C.put(store, 'tx', D({ kind: 'income', amount: 6000000, acc: acc2.id, to: '', cat: 'Gaji', date: t.slice(0, 7) + '-01', note: 'Gaji', cid: C.uid() }));
    C.put(store, 'tx', D({ kind: 'expense', amount: 450000, acc: acc1.id, to: '', cat: 'Makan', date: t, note: 'Belanja pasar', cid: C.uid() }));
    C.put(store, 'budget', D({ cat: 'Makan', limit: 1500000 }));
    const veh = C.put(store, 'veh', D({ name: 'Honda Beat', kind: 'motor', plate: 'B 1234 XYZ', year: 2021, odometer: 24300, pajakDue: add(21), stnkDue: '' }));
    C.put(store, 'plan', D({ name: 'Ganti oli', group: 'kendaraan', every: 2, unit: 'month', nextDue: add(12), vehicleId: veh.id, kmEvery: 2500, nextKm: 24600, cost: 60000 }));
    C.put(store, 'plan', D({ name: 'Servis berkala', group: 'kendaraan', every: 6, unit: 'month', nextDue: add(94), vehicleId: veh.id, kmEvery: 10000, nextKm: 30000, cost: 250000 }));
    C.put(store, 'plan', D({ name: 'Servis AC', group: 'rumah', every: 3, unit: 'month', nextDue: add(-4), cost: 150000, lastDone: add(-94) }));
    C.put(store, 'plan', D({ name: 'Kuras toren air', group: 'rumah', every: 6, unit: 'month', nextDue: add(61) }));
    C.put(store, 'plan', D({ name: 'Cek instalasi listrik & MCB', group: 'rumah', every: 12, unit: 'month', nextDue: add(200) }));
    C.put(store, 'bill', D({ name: 'Listrik PLN', amountEst: 450000, dueDay: C.parseD(add(2)).getDate(), paidYM: ymShift(nowYM(), -1) }));
    C.put(store, 'bill', D({ name: 'Internet', amountEst: 350000, dueDay: C.parseD(add(9)).getDate(), paidYM: ymShift(nowYM(), -1) }));
    C.put(store, 'bill', D({ name: 'PDAM / air', amountEst: 120000, dueDay: 25, paidYM: ymShift(nowYM(), -1) }));
    C.put(store, 'asset', D({ name: 'Kulkas 2 pintu', cat: 'Elektronik', price: 4200000, warrantyUntil: add(45), place: 'Dapur' }));
    C.put(store, 'asset', D({ name: 'Mesin cuci', cat: 'Elektronik', price: 3100000, warrantyUntil: add(400), place: 'Area cuci' }));
    C.put(store, 'inv', D({ name: 'Gas LPG 3kg', qty: 0, unit: 'tabung', min: 1, place: 'Dapur' }));
    C.put(store, 'inv', D({ name: 'Beras', qty: 8, unit: 'kg', min: 3 }));
    C.put(store, 'contact', D({ name: 'Pak Budi (tukang)', role: 'Tukang bangunan', phone: '0812 0000 0000' }));
    C.put(store, 'contact', D({ name: 'Puskesmas', role: 'Darurat kesehatan', phone: '119', emergency: true }));
    C.put(store, 'doc', D({ title: 'Polis asuransi rumah', expiry: add(75), place: 'Map biru, lemari kamar' }));
    C.put(store, 'task', D({ title: 'Bayar iuran RT', due: t, repeat: 'monthly', anchorDay: C.parseD(t).getDate() }));
    C.put(store, 'event', D({ title: 'Arisan keluarga', date: add(3), allDay: false, time: '16:00', repeat: 'monthly' }));
    C.put(store, 'habit', D({ name: 'Jalan pagi', log: [add(-1), add(-2)] }));
    commit(); toast('Data contoh ditambahkan');
  }
  function demoOff() {
    const now = new Date().toISOString();
    Object.keys(store.rec).forEach((id) => {
      const r = store.rec[id];
      // Data contoh bukan catatan keuangan nyata, jadi boleh dihapus (aturan "transaksi tak dihapus" untuk data asli).
      if (r.demo && !r._d) store.rec[id] = { id, _t: r._t, _u: now, _d: true };
    });
    commit(); toast('Data contoh dihapus');
  }

  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-a]'); if (!t || !A[t.dataset.a]) return;
    if (t.closest('dialog') == null) A[t.dataset.a](t.dataset, e);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const t = e.target.closest && e.target.closest('.tile[data-a]'); if (t) { e.preventDefault(); A[t.dataset.a](t.dataset); }
  });
  document.addEventListener('submit', (e) => {
    const f = e.target.closest('[data-form="shop"]'); if (!f) return;
    e.preventDefault(); const n = f.elements.n.value.trim(); if (!n) return;
    C.put(store, 'shop', { name: n, done: false }); commit(); const i = document.querySelector('[name=n]'); if (i) i.focus();
  });
  document.addEventListener('change', (e) => {
    if (e.target.id !== 'impf' || !e.target.files[0]) return;
    const rd = new FileReader();
    rd.onload = () => {
      try {
        const data = JSON.parse(String(rd.result));
        if (!C.validStore(data)) return toast('Berkas bukan backup RUMAHKU yang valid');
        store = C.mergeStores(store, data); commit(); toast('Backup digabung');
      } catch (err) { toast('Berkas tidak bisa dibaca'); }
    };
    rd.readAsText(e.target.files[0]); e.target.value = '';
  });

  // ---------- Google Drive ----------
  let token = null, tokenExp = 0;
  function loadGis() {
    return new Promise((res, rej) => {
      if (window.google && google.accounts && google.accounts.oauth2) return res();
      const s = document.createElement('script'); s.src = 'https://accounts.google.com/gsi/client'; s.async = true;
      s.onload = () => res(); s.onerror = () => rej(new Error('Gagal memuat layanan Google (cek koneksi)'));
      document.head.appendChild(s);
    });
  }
  async function getToken(interactive) {
    if (token && Date.now() < tokenExp - 60000) return token;
    if (!cfg.clientId) throw new Error('Isi Client ID dulu');
    await loadGis();
    return new Promise((res, rej) => {
      const tc = google.accounts.oauth2.initTokenClient({
        client_id: cfg.clientId, scope: SCOPE,
        callback: (r) => {
          if (r.error) return rej(new Error(r.error_description || r.error));
          token = r.access_token; tokenExp = Date.now() + (r.expires_in || 3600) * 1000; cfg.connected = true; saveCfg(); res(token);
        },
        error_callback: (e) => rej(new Error('Login Google dibatalkan/ditolak (' + (e && e.type ? e.type : 'error') + ')')),
      });
      tc.requestAccessToken({ prompt: interactive && !cfg.connected ? 'consent' : '' });
    });
  }
  async function dfetch(url, opt) {
    const r = await fetch(url, Object.assign({}, opt, { headers: Object.assign({ Authorization: 'Bearer ' + token }, (opt && opt.headers) || {}) }));
    if (!r.ok) { const e = new Error('Drive ' + r.status); e.status = r.status; throw e; }
    return r;
  }
  async function runSync(interactive) {
    if (syncing) { syncAgain = true; return; }
    syncing = true; syncMsg = 'menyinkronkan…'; render();
    try {
      await getToken(interactive);
      const q = encodeURIComponent("name='rumahku.json' and 'appDataFolder' in parents and trashed=false");
      const found = await (await dfetch('https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=' + q + '&fields=files(id)')).json();
      const id = found.files && found.files[0] && found.files[0].id;
      if (id) {
        const remote = await (await dfetch('https://www.googleapis.com/drive/v3/files/' + id + '?alt=media')).json();
        if (C.validStore(remote)) { store = C.mergeStores(store, remote); persist(); }
      }
      const body = JSON.stringify(store);
      if (id) await dfetch('https://www.googleapis.com/upload/drive/v3/files/' + id + '?uploadType=media', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body });
      else {
        const b = 'rk' + Date.now();
        const multi = '--' + b + '\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n' + JSON.stringify({ name: 'rumahku.json', parents: ['appDataFolder'] }) + '\r\n--' + b + '\r\nContent-Type: application/json\r\n\r\n' + body + '\r\n--' + b + '--';
        await dfetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', { method: 'POST', headers: { 'Content-Type': 'multipart/related; boundary=' + b }, body: multi });
      }
      cfg.lastSync = Date.now(); saveCfg(); syncMsg = 'tersinkron ✓';
      if (interactive) toast('Tersinkron dengan Google Drive');
    } catch (e) {
      syncMsg = 'gagal: ' + e.message; if (e.status === 401) token = null;
      if (interactive) toast('Sinkron gagal: ' + e.message);
    } finally {
      syncing = false; render();
      if (syncAgain) { syncAgain = false; scheduleSync(); }
    }
  }
  function scheduleSync() {
    if (!cfg.connected || !cfg.clientId) return;
    clearTimeout(syncTimer);
    syncTimer = setTimeout(() => { if (token && Date.now() < tokenExp - 60000) runSync(false); else syncMsg = 'perubahan belum disinkron (ketuk Sinkron sekarang)'; }, 4000);
  }

  function rtBump(id, d) {
    const r = get('rt', id); if (!r) return; const t = C.today(), lid = 'rl|' + id + '|' + t;
    const cur = C.routineDone(list('rtlog'), id, t), n = Math.max(0, cur + d);
    if (n === cur) return;
    C.put(store, 'rtlog', { id: lid, routineId: id, date: t, n }); commit();
    if (d > 0 && n === C.routineTarget(r)) toast('Target ' + r.name + ' tercapai 🎉');
  }
  function nextBirthday(birth, t) {
    const b = C.parseD(birth), y = +t.slice(0, 4);
    for (let yy = y; yy <= y + 1; yy++) { const m = String(b.getMonth() + 1).padStart(2, '0'), d = String(b.getDate()).padStart(2, '0'); const s = yy + '-' + m + '-' + d; if (s >= t) return s; }
    return t;
  }
  // ---------- pengingat (rutinitas, tugas ber-jam, acara; judul generik bila "nama" dimatikan) ----------
  function tick() {
    const n = new Date(), t = C.today(n), mins = n.getHours() * 60 + n.getMinutes(), nowMs = n.getTime();
    const fired = loadFired(t); let changed = false;
    const fire = (key, body) => { if (fired.has(key)) return; fired.add(key); changed = true; notify('RUMAHKU', detailOn() ? body : 'Ada pengingat', key); };
    const logs = list('rtlog').filter((l) => l.date === t);
    list('rt').forEach((r) => { const d = C.routineDue(r, t, mins, C.routineDone(logs, r.id, t), fired); if (d) fire(d.key, (r.emoji || '🔔') + ' ' + r.name + ' — ' + d.done + '/' + d.target + (r.unit ? ' ' + r.unit : '')); });
    list('task').forEach((x) => {
      if (x.done || x.due !== t || !x.time || x.remind === '' || x.remind == null) return;
      if (C.inWindow(nowMs, C.fireAt(t, x.time, x.remind))) fire('tk|' + x.id + '|' + t + '|' + x.time + '|' + x.remind, '✅ ' + x.title + (+x.remind > 0 ? ' — ' + x.remind + ' menit lagi' : ' — sekarang'));
    });
    evOccurrences(t, C.addDays(t, 1)).forEach((o) => {
      if (!o.ev.time || o.ev.allDay || o.ev.remind === '') return;
      const rm = o.ev.remind == null ? 10 : +o.ev.remind;
      if (C.inWindow(nowMs, C.fireAt(t, o.ev.time, rm))) fire('ev|' + o.ev.id + '|' + t + '|' + o.ev.time, '📅 ' + o.ev.title + (rm > 0 ? ' — ' + rm + ' menit lagi' : ' — sekarang'));
    });
    if (changed) saveFired(t, fired);
  }
  setInterval(tick, 30000);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') { render(); tick(); } });

  // ---------- mulai ----------
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
    navigator.serviceWorker.register('sw.js').catch(() => { /* PWA opsional */ });
  }
  window.__rk = { store: () => store, C, tick };
  render(); tick();
})();
