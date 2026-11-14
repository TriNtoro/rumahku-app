/* RUMAHKU-ONE Lite — UI. Semua data: penyimpanan lokal + (opsional) file pribadi di Google Drive. */
(function () {
  'use strict';
  const C = Core;
  const LS = 'rk1.store', CFG = 'rk1.cfg';
  const SCOPE = 'https://www.googleapis.com/auth/drive.appdata';
  const DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const EXP_CATS = ['Makan', 'Transportasi', 'Belanja', 'Tagihan', 'Rumah', 'Kesehatan', 'Hiburan', 'Pendidikan', 'Lainnya'];
  const INC_CATS = ['Gaji', 'Bonus', 'Lainnya'];
  const MOODS = ['😞', '🙁', '😐', '🙂', '😄'];
  const REPEATS = [['none', 'Tidak berulang'], ['daily', 'Setiap hari'], ['weekly', 'Setiap minggu'], ['monthly', 'Setiap bulan'], ['yearly', 'Setiap tahun']];

  // ---------- state ----------
  function readJSON(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } }
  let store = readJSON(LS);
  if (!C.validStore(store)) store = C.emptyStore();
  let cfg = readJSON(CFG) || {};
  const ui = { tab: 'today', rumah: 'aset', pribadi: 'jurnal', taskFilter: 'aktif', calMonth: null, calSel: null, moneyMonth: null };
  let syncMsg = '';
  let syncing = false, syncAgain = false, syncTimer = null;

  function persist() { try { localStorage.setItem(LS, JSON.stringify(store)); } catch (e) { toast('Penyimpanan penuh/tidak tersedia: ekspor backup sekarang'); } }
  function saveCfg() { try { localStorage.setItem(CFG, JSON.stringify(cfg)); } catch (e) { /* abaikan */ } }
  function commit() { persist(); scheduleSync(); render(); }
  const list = (t) => C.list(store, t);
  const nowYM = () => C.today().slice(0, 7);

  // ---------- util tampilan ----------
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  function fmtDate(s) {
    if (!s) return '';
    const d = C.parseD(s);
    return DAYS[d.getDay()].slice(0, 3) + ', ' + d.getDate() + ' ' + MONTHS[d.getMonth()].slice(0, 3) + ' ' + d.getFullYear();
  }
  function ymLabel(ym) { const [y, m] = ym.split('-'); return MONTHS[+m - 1] + ' ' + y; }
  function ymShift(ym, n) { return C.addMonths(ym + '-01', n, 1).slice(0, 7); }
  function toast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg; t.style.display = 'block';
    clearTimeout(toast._t); toast._t = setTimeout(() => { t.style.display = 'none'; }, 3200);
  }
  const rp = (n) => C.fmtIDR(n);
  const sgn = (n) => (n < 0 ? 'neg' : '');

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
  function openForm(title, fields, init, onOk, extras) {
    init = init || {};
    dlg.innerHTML = `<form method="dialog" novalidate><h3>${esc(title)}</h3>${fields.map((f) => fieldHTML(f, init[f.k])).join('')}<div class="err" id="ferr"></div><div class="btns"><button type="button" class="btn alt" id="fcancel">Batal</button><button class="btn" id="fok" type="submit">Simpan</button></div>${(extras || []).length ? `<div class="btns">${extras.map((x, i) => `<button type="button" class="btn bad sm" data-x="${i}">${esc(x.label)}</button>`).join('')}</div>` : ''}</form>`;
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
  function confirmBox(msg, yes) {
    openMenu(msg, [{ label: 'Ya, lanjutkan', fn: yes }]);
  }

  // ---------- form per modul ----------
  function taskForm(t) {
    t = t || {};
    openForm(t.id ? 'Ubah tugas' : 'Tugas baru', [
      { k: 'title', label: 'Judul', req: true },
      { k: 'due', label: 'Tenggat', type: 'date' },
      { k: 'repeat', label: 'Pengulangan', type: 'select', opts: REPEATS },
      { k: 'prio', label: 'Prioritas', type: 'select', opts: [['0', 'Biasa'], ['1', 'Penting']] },
      { k: 'label', label: 'Label / proyek' },
      { k: 'notes', label: 'Catatan', type: 'textarea' },
    ], { title: t.title, due: t.due || '', repeat: t.repeat || 'none', prio: t.prio || '0', label: t.label, notes: t.notes }, (v) => {
      if (v.repeat !== 'none' && !v.due) return 'Tugas berulang perlu tenggat.';
      C.put(store, 'task', { id: t.id, title: v.title, due: v.due || '', repeat: v.repeat, prio: v.prio, label: v.label, notes: v.notes, anchorDay: v.due ? C.parseD(v.due).getDate() : undefined, done: t.done || false, doneLog: t.doneLog });
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
      { k: 'title', label: 'Judul', req: true },
      { k: 'date', label: 'Tanggal', type: 'date', req: true },
      { k: 'allDay', label: 'Sepanjang hari', type: 'check' },
      { k: 'time', label: 'Jam mulai', type: 'time' },
      { k: 'repeat', label: 'Pengulangan', type: 'select', opts: REPEATS },
      { k: 'until', label: 'Berulang sampai (opsional)', type: 'date' },
      { k: 'notes', label: 'Catatan', type: 'textarea' },
    ], { title: ev.title, date: ev.date || ui.calSel || C.today(), allDay: ev.allDay !== false && !ev.time, time: ev.time, repeat: ev.repeat || 'none', until: ev.until, notes: ev.notes }, (v) => {
      C.put(store, 'event', { id: ev.id, title: v.title, date: v.date, allDay: v.allDay, time: v.allDay ? '' : v.time, repeat: v.repeat, until: v.until || '', notes: v.notes, skip: ev.skip });
      commit();
    }, extras);
  }
  function accOpts() { return list('acc').map((a) => [a.id, a.name]); }
  function txForm(kind) {
    if (!list('acc').length) { toast('Buat akun dulu (mis. Dompet)'); return accForm(); }
    const opts = accOpts();
    openForm('Catat transaksi', [
      { k: 'kind', label: 'Jenis', type: 'select', opts: [['expense', 'Pengeluaran'], ['income', 'Pemasukan'], ['transfer', 'Transfer antar akun']] },
      { k: 'amount', label: 'Jumlah (Rp)', type: 'amount', req: true },
      { k: 'acc', label: 'Akun', type: 'select', opts },
      { k: 'to', label: 'Ke akun (hanya transfer)', type: 'select', opts: [['', '—']].concat(opts) },
      { k: 'cat', label: 'Kategori', list: EXP_CATS.concat(['Gaji', 'Bonus']) },
      { k: 'date', label: 'Tanggal', type: 'date', req: true },
      { k: 'note', label: 'Catatan' },
    ], { kind: kind || 'expense', date: C.today(), acc: opts[0][0] }, (v) => {
      const amount = C.parseAmount(v.amount);
      if (amount == null || amount <= 0) return 'Jumlah harus bilangan bulat rupiah lebih dari 0 (tanpa desimal).';
      if (v.kind === 'transfer') {
        if (!v.to || v.to === v.acc) return 'Transfer perlu akun tujuan yang berbeda.';
      }
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
      let n = raw === '' ? 0 : C.parseAmount(raw);
      if (n == null) return 'Saldo awal harus bilangan bulat rupiah.';
      C.put(store, 'acc', { id: a.id, name: v.name, type: v.type, opening: neg ? -n : n });
      commit();
    }, a.id ? [{ label: 'Hapus akun', fn: () => {
      if (list('tx').some((t) => t.acc === a.id || t.to === a.id)) { toast('Akun punya transaksi; tidak bisa dihapus'); return false; }
      C.remove(store, a.id); commit();
    } }] : null);
  }
  function budgetForm(b) {
    b = b || {};
    openForm(b.id ? 'Ubah anggaran' : 'Anggaran bulanan', [
      { k: 'cat', label: 'Kategori pengeluaran', req: true, list: EXP_CATS },
      { k: 'limit', label: 'Batas per bulan (Rp)', type: 'amount', req: true },
    ], { cat: b.cat, limit: b.limit || '' }, (v) => {
      const n = C.parseAmount(v.limit); if (n == null || n <= 0) return 'Batas harus bilangan bulat rupiah > 0.';
      C.put(store, 'budget', { id: b.id, cat: v.cat, limit: n }); commit();
    }, b.id ? [{ label: 'Hapus anggaran', fn: () => { C.remove(store, b.id); commit(); } }] : null);
  }
  function assetForm(a) {
    a = a || {};
    openForm(a.id ? 'Ubah aset' : 'Aset baru', [
      { k: 'name', label: 'Nama aset', req: true },
      { k: 'cat', label: 'Kategori', type: 'select', opts: ['Elektronik', 'Kendaraan', 'Perabot', 'Bangunan', 'Lainnya'].map((x) => [x, x]) },
      { k: 'bought', label: 'Tanggal beli', type: 'date' },
      { k: 'price', label: 'Harga beli (Rp, opsional)', type: 'amount' },
      { k: 'warrantyUntil', label: 'Garansi sampai', type: 'date' },
      { k: 'nextService', label: 'Servis/perawatan berikutnya', type: 'date' },
      { k: 'everyMonths', label: 'Ulangi servis tiap … bulan (opsional)', type: 'number' },
      { k: 'notes', label: 'Catatan (nomor seri, lokasi nota, dll.)', type: 'textarea' },
    ], { name: a.name, cat: a.cat || 'Elektronik', bought: a.bought, price: a.price || '', warrantyUntil: a.warrantyUntil, nextService: a.nextService, everyMonths: a.everyMonths, notes: a.notes }, (v) => {
      const price = v.price === '' ? 0 : C.parseAmount(v.price);
      if (price == null) return 'Harga harus bilangan bulat rupiah.';
      C.put(store, 'asset', { id: a.id, name: v.name, cat: v.cat, bought: v.bought, price, warrantyUntil: v.warrantyUntil, nextService: v.nextService, everyMonths: v.everyMonths ? +v.everyMonths : 0, notes: v.notes, lastService: a.lastService });
      commit();
    }, a.id ? [{ label: 'Hapus aset', fn: () => { C.remove(store, a.id); commit(); } }] : null);
  }
  function contactForm(c) {
    c = c || {};
    openForm(c.id ? 'Ubah kontak' : 'Kontak baru', [
      { k: 'name', label: 'Nama', req: true },
      { k: 'role', label: 'Peran (tukang, dokter, RT, …)' },
      { k: 'phone', label: 'Telepon', type: 'tel' },
      { k: 'emergency', label: 'Kontak darurat', type: 'check' },
      { k: 'notes', label: 'Catatan', type: 'textarea' },
    ], c, (v) => { C.put(store, 'contact', { id: c.id, name: v.name, role: v.role, phone: v.phone, emergency: v.emergency, notes: v.notes }); commit(); },
    c.id ? [{ label: 'Hapus kontak', fn: () => { C.remove(store, c.id); commit(); } }] : null);
  }
  function journalForm(j) {
    j = j || {};
    openForm(j.id ? 'Ubah jurnal' : 'Jurnal baru', [
      { k: 'date', label: 'Tanggal', type: 'date', req: true },
      { k: 'mood', label: 'Suasana hati', type: 'select', opts: MOODS.map((m, i) => [String(i + 1), m + ' ' + (i + 1) + '/5']) },
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

  // ---------- tampilan ----------
  const byDue = (a, b) => C.cmp(a.due || '9999', b.due || '9999') || C.cmp(b.prio || '0', a.prio || '0');
  function taskRow(t, today) {
    const late = t.due && t.due < today && !t.done;
    const rep = t.repeat && t.repeat !== 'none' ? ' ↻' : '';
    return `<div class="row ${t.done ? 'done' : ''}"><button class="chk ${t.done ? 'on' : ''}" data-a="${t.done ? 'taskUndo' : 'taskDone'}" data-id="${t.id}" aria-label="${t.done ? 'Batalkan selesai' : 'Tandai selesai'}: ${esc(t.title)}">${t.done ? '✓' : ''}</button><div class="grow" data-a="taskEdit" data-id="${t.id}"><div class="t">${t.prio === '1' ? '⭐ ' : ''}${esc(t.title)}${rep}</div><div class="s">${t.due ? (late ? '<span class="neg">Terlambat · </span>' : '') + fmtDate(t.due) : 'Tanpa tenggat'}${t.label ? ' · ' + esc(t.label) : ''}</div></div></div>`;
  }
  function evOccurrences(from, to) {
    const out = [];
    list('event').forEach((ev) => C.expandEvent(ev, from, to).forEach((d) => out.push({ ev, date: d })));
    return out.sort((a, b) => C.cmp(a.date, b.date) || C.cmp(a.ev.time || '', b.ev.time || ''));
  }
  function evRow(o) {
    return `<div class="row" data-a="evEdit" data-id="${o.ev.id}" data-occ="${o.date}"><div style="min-width:54px;color:var(--acc);font-weight:600">${o.ev.allDay || !o.ev.time ? 'Seharian' : esc(o.ev.time)}</div><div class="grow"><div class="t">${esc(o.ev.title)}${o.ev.repeat && o.ev.repeat !== 'none' ? ' ↻' : ''}</div>${o.ev.notes ? `<div class="s">${esc(o.ev.notes)}</div>` : ''}</div></div>`;
  }

  function vToday() {
    const t = C.today(), d = C.parseD(t);
    const tasks = list('task').filter((x) => !x.done && x.due && x.due <= t).sort(byDue);
    const evs = evOccurrences(t, C.addDays(t, 1));
    const rep = C.monthReport(list('tx'), nowYM());
    const alerts = C.budgetStatus(list('budget'), rep).filter((b) => b.level !== 'ok');
    const warr = C.warrantySoon(list('asset'), t, 30);
    const svc = C.serviceDue(list('asset'), t);
    const habits = list('habit');
    const accs = list('acc');
    const nw = C.netWorth(accs, list('tx'));
    const empty = !list('task').length && !list('event').length && !accs.length;
    let h = `<div class="card pad"><div class="mute" style="font-size:.85rem">Kekayaan bersih</div><div class="big ${sgn(nw)}">${accs.length ? rp(nw) : '—'}</div><div class="s mute">${accs.length ? 'Bulan ini: +' + rp(rep.income) + ' / −' + rp(rep.expense) : 'Tambahkan akun di tab Uang'}</div></div>`;
    if (empty) h += `<div class="card pad"><b>Selamat datang 👋</b><p class="mute" style="margin:6px 0 0">Mulai dengan tombol <b>+</b> di kanan bawah: catat tugas, acara, atau pengeluaran pertama Anda. Data tersimpan di perangkat ini; hubungkan Google Drive di <b>Lainnya → Pengaturan</b> agar HP dan PC sama.</p></div>`;
    h += `<h2>Tugas hari ini &amp; terlambat</h2><div class="card">${tasks.length ? tasks.map((x) => taskRow(x, t)).join('') : '<div class="empty">Tidak ada tugas jatuh tempo 🎉</div>'}</div>`;
    h += `<h2>Acara hari ini</h2><div class="card">${evs.length ? evs.map(evRow).join('') : '<div class="empty">Tidak ada acara.</div>'}</div>`;
    if (alerts.length) h += `<h2>Anggaran perlu perhatian</h2><div class="card">${alerts.map((b) => `<div class="row"><div class="grow"><div class="t">${esc(b.cat)} <span class="tag ${b.level === 'over' ? 'bad' : 'warn'}">${b.pct}%</span></div><div class="s">${rp(b.spent)} dari ${rp(b.limit)}</div></div></div>`).join('')}</div>`;
    if (svc.length || warr.length) h += `<h2>Rumah</h2><div class="card">${svc.map((a) => `<div class="row"><div class="grow" data-a="assetEdit" data-id="${a.id}"><div class="t">🔧 Servis: ${esc(a.name)}</div><div class="s">Jatuh tempo ${fmtDate(a.nextService)}</div></div><button class="btn sm" data-a="serviced" data-id="${a.id}">Sudah</button></div>`).join('')}${warr.map((a) => `<div class="row" data-a="assetEdit" data-id="${a.id}"><div class="grow"><div class="t">🛡️ Garansi: ${esc(a.name)}</div><div class="s">Berakhir ${fmtDate(a.warrantyUntil)}</div></div></div>`).join('')}</div>`;
    if (habits.length) h += `<h2>Kebiasaan</h2><div class="card">${habits.map((x) => habitRow(x, t)).join('')}</div>`;
    return { title: DAYS[d.getDay()] + ', ' + d.getDate() + ' ' + MONTHS[d.getMonth()], sub: d.getFullYear() + '', html: h };
  }

  function vTasks() {
    const t = C.today(), all = list('task');
    const act = all.filter((x) => !x.done).sort(byDue), done = all.filter((x) => x.done).sort((a, b) => C.cmp(b.doneAt || '', a.doneAt || ''));
    const f = ui.taskFilter, shown = f === 'aktif' ? act : done;
    const h = `<div class="chips"><button class="chip ${f === 'aktif' ? 'on' : ''}" data-a="taskFilter" data-v="aktif">Aktif (${act.length})</button><button class="chip ${f === 'selesai' ? 'on' : ''}" data-a="taskFilter" data-v="selesai">Selesai (${done.length})</button></div><div class="card">${shown.length ? shown.map((x) => taskRow(x, t)).join('') : `<div class="empty">${f === 'aktif' ? 'Belum ada tugas. Ketuk + untuk menambah.' : 'Belum ada tugas selesai.'}</div>`}</div><button class="btn" data-a="taskAdd">+ Tugas baru</button>`;
    return { title: 'Tugas', sub: act.length + ' aktif', html: h };
  }

  function vCal() {
    if (!ui.calMonth) ui.calMonth = nowYM();
    const ym = ui.calMonth, t = C.today();
    const first = C.parseD(ym + '-01'), lead = (first.getDay() + 6) % 7;
    const nDays = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
    const next = ymShift(ym, 1) + '-01';
    const evMap = {}, tkMap = {};
    evOccurrences(ym + '-01', next).forEach((o) => { (evMap[o.date] = evMap[o.date] || []).push(o); });
    list('task').filter((x) => !x.done && x.due).forEach((x) => { (tkMap[x.due] = tkMap[x.due] || []).push(x); });
    let cells = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].map((x) => `<div class="h">${x}</div>`).join('');
    for (let i = 0; i < lead; i++) cells += '<div class="day off"></div>';
    for (let d = 1; d <= nDays; d++) {
      const ds = ym + '-' + String(d).padStart(2, '0');
      cells += `<button class="day ${ds === t ? 'today' : ''} ${ds === ui.calSel ? 'sel' : ''}" data-a="calSel" data-v="${ds}" aria-label="${fmtDate(ds)}">${d}<div class="dots">${evMap[ds] ? '<i></i>' : ''}${tkMap[ds] ? '<i class="t"></i>' : ''}</div></button>`;
    }
    let h = `<div class="inl" style="justify-content:space-between;align-items:center"><button class="btn alt sm" data-a="calPrev" aria-label="Bulan sebelumnya">‹</button><b>${ymLabel(ym)}</b><button class="btn alt sm" data-a="calNext" aria-label="Bulan berikutnya">›</button></div><div class="grid">${cells}</div>`;
    const sel = ui.calSel;
    if (sel) {
      const es = evOccurrences(sel, C.addDays(sel, 1)), ts = (tkMap[sel] || []);
      h += `<h2>${fmtDate(sel)}</h2><div class="card">${es.map(evRow).join('')}${ts.map((x) => taskRow(x, t)).join('')}${es.length + ts.length ? '' : '<div class="empty">Kosong.</div>'}</div><button class="btn" data-a="evAdd">+ Acara di tanggal ini</button>`;
    } else h += '<p class="note">Ketuk tanggal untuk melihat agenda. Titik hijau = acara, kuning = tugas.</p><button class="btn" data-a="evAdd">+ Acara baru</button>';
    return { title: 'Kalender', sub: '', html: h };
  }

  function vMoney() {
    if (!ui.moneyMonth) ui.moneyMonth = nowYM();
    const ym = ui.moneyMonth, accs = list('acc'), txs = list('tx');
    const bal = C.balances(accs, txs), nw = C.netWorth(accs, txs), rep = C.monthReport(txs, ym);
    const bud = C.budgetStatus(list('budget'), rep);
    const accName = (id) => (accs.find((a) => a.id === id) || { name: '?' }).name;
    let h = `<div class="card pad"><div class="mute" style="font-size:.85rem">Kekayaan bersih (semua akun)</div><div class="big ${sgn(nw)}">${rp(nw)}</div></div>`;
    h += `<h2>Akun</h2><div class="card">${accs.length ? accs.map((a) => `<div class="row" data-a="accEdit" data-id="${a.id}"><div class="grow"><div class="t">${esc(a.name)}</div><div class="s">${esc(a.type)}</div></div><div class="${sgn(bal[a.id] || 0)}"><b>${rp(bal[a.id] || 0)}</b></div></div>`).join('') : '<div class="empty">Belum ada akun. Buat satu (mis. Dompet, BCA).</div>'}</div><button class="btn alt sm" data-a="accAdd">+ Akun</button><p class="note">Membayar kartu kredit = <b>transfer</b> dari akun bank ke akun kartu, bukan pengeluaran.</p>`;
    h += `<div class="inl" style="justify-content:space-between;align-items:center;margin-top:14px"><button class="btn alt sm" data-a="mPrev" aria-label="Bulan sebelumnya">‹</button><b>${ymLabel(ym)}</b><button class="btn alt sm" data-a="mNext" aria-label="Bulan berikutnya">›</button></div>`;
    h += `<div class="card pad"><div class="row" style="border:0;padding:0"><div class="grow">Pemasukan<div class="pos"><b>${rp(rep.income)}</b></div></div><div class="grow">Pengeluaran<div class="neg"><b>${rp(rep.expense)}</b></div></div><div class="grow">Selisih<div class="${sgn(rep.income - rep.expense)}"><b>${rp(rep.income - rep.expense)}</b></div></div></div></div>`;
    h += `<h2>Anggaran</h2><div class="card">${bud.length ? bud.map((b) => `<div class="row" data-a="budEdit" data-id="${b.id}" style="display:block"><div style="display:flex;justify-content:space-between"><span class="t">${esc(b.cat)}</span><span class="s">${rp(b.spent)} / ${rp(b.limit)} · ${b.pct}%</span></div><div class="bar"><i class="${b.level === 'ok' ? '' : b.level}" style="width:${Math.min(100, b.pct)}%"></i></div></div>`).join('') : '<div class="empty">Belum ada anggaran.</div>'}</div><button class="btn alt sm" data-a="budAdd">+ Anggaran</button>`;
    const month = txs.filter((t) => t.date && t.date.slice(0, 7) === ym).sort((a, b) => C.cmp(b.date, a.date) || C.cmp(b._u, a._u));
    h += `<h2>Transaksi</h2><div class="card">${month.length ? month.map((t) => {
      const lbl = t.kind === 'transfer' ? `${esc(accName(t.acc))} → ${esc(accName(t.to))}` : esc(t.cat || '') + ' · ' + esc(accName(t.acc));
      const col = t.kind === 'income' ? 'pos' : t.kind === 'expense' ? 'neg' : '';
      const sign = t.kind === 'income' ? '+' : t.kind === 'expense' ? '−' : '⇄ ';
      return `<div class="row" ${t.void ? 'style="opacity:.5;text-decoration:line-through"' : ''}><div class="grow"><div class="t">${lbl}${t.void ? ' <span class="tag">void</span>' : ''}</div><div class="s">${fmtDate(t.date)}${t.note ? ' · ' + esc(t.note) : ''}</div></div><div class="${col}"><b>${sign}${rp(t.amount)}</b></div>${t.void ? '' : `<button class="link" data-a="txVoid" data-id="${t.id}" aria-label="Void transaksi">void</button>`}</div>`;
    }).join('') : '<div class="empty">Belum ada transaksi bulan ini.</div>'}</div><button class="btn" data-a="txAdd">+ Catat transaksi</button><p class="note">Transaksi tidak pernah dihapus: "void" membuatnya dianggap tidak ada, riwayatnya tetap tersimpan.</p>`;
    return { title: 'Uang', sub: '', html: h };
  }

  function habitRow(x, t) {
    const log = x.log || [], on = log.includes(t);
    let dots = '';
    for (let i = 6; i >= 0; i--) dots += `<span style="color:${log.includes(C.addDays(t, -i)) ? 'var(--acc)' : 'var(--line)'}">●</span>`;
    return `<div class="row"><button class="chk ${on ? 'on' : ''}" data-a="habitTog" data-id="${x.id}" aria-label="Centang ${esc(x.name)} hari ini">${on ? '✓' : ''}</button><div class="grow" data-a="habitEdit" data-id="${x.id}"><div class="t">${esc(x.name)}</div><div class="s">${dots} · beruntun ${C.streak(log, t)} hari</div></div></div>`;
  }

  function vMore() {
    const sub = (k, items) => `<div class="chips">${items.map((i) => `<button class="chip ${ui[k] === i[0] ? 'on' : ''}" data-a="sub" data-k="${k}" data-v="${i[0]}">${i[1]}</button>`).join('')}</div>`;
    const sec = ui.section || 'rumah';
    let h = `<div class="chips">${[['rumah', '🏡 Rumah'], ['pribadi', '📓 Pribadi'], ['set', '⚙️ Pengaturan']].map((i) => `<button class="chip ${sec === i[0] ? 'on' : ''}" data-a="section" data-v="${i[0]}">${i[1]}</button>`).join('')}</div>`;
    if (sec === 'rumah') {
      h += sub('rumah', [['aset', 'Aset'], ['belanja', 'Belanja'], ['kontak', 'Kontak']]);
      if (ui.rumah === 'aset') {
        const as = list('asset').sort((a, b) => C.cmp(a.name, b.name));
        h += `<div class="card">${as.length ? as.map((a) => `<div class="row" data-a="assetEdit" data-id="${a.id}"><div class="grow"><div class="t">${esc(a.name)} <span class="tag">${esc(a.cat || '')}</span></div><div class="s">${a.warrantyUntil ? 'Garansi s/d ' + fmtDate(a.warrantyUntil) : 'Tanpa garansi'}${a.nextService ? ' · servis ' + fmtDate(a.nextService) : ''}</div></div></div>`).join('') : '<div class="empty">Belum ada aset. Catat barang berharga, kendaraan, dan masa garansinya.</div>'}</div><button class="btn" data-a="assetAdd">+ Aset</button>`;
      } else if (ui.rumah === 'belanja') {
        const it = list('shop').sort((a, b) => C.cmp(!!a.done, !!b.done) || C.cmp(a.name, b.name));
        h += `<form class="inl" data-form="shop"><input name="n" placeholder="Tambah barang…" aria-label="Nama barang" autocomplete="off"><button class="btn">Tambah</button></form><div class="card">${it.length ? it.map((x) => `<div class="row ${x.done ? 'done' : ''}"><button class="chk ${x.done ? 'on' : ''}" data-a="shopTog" data-id="${x.id}" aria-label="Centang ${esc(x.name)}">${x.done ? '✓' : ''}</button><div class="grow t">${esc(x.name)}</div></div>`).join('') : '<div class="empty">Daftar belanja kosong.</div>'}</div>${it.some((x) => x.done) ? '<button class="btn alt sm" data-a="shopClear">Bersihkan yang sudah dicentang</button>' : ''}`;
      } else {
        const cs = list('contact').sort((a, b) => C.cmp(!!b.emergency, !!a.emergency) || C.cmp(a.name, b.name));
        h += `<div class="card">${cs.length ? cs.map((c) => `<div class="row"><div class="grow" data-a="contactEdit" data-id="${c.id}"><div class="t">${c.emergency ? '🚨 ' : ''}${esc(c.name)}</div><div class="s">${esc(c.role || '')}</div></div>${c.phone ? `<a class="btn sm" href="tel:${esc(c.phone.replace(/[^\d+]/g, ''))}">📞 ${esc(c.phone)}</a>` : ''}</div>`).join('') : '<div class="empty">Belum ada kontak penting (tukang, dokter, RT, PLN…).</div>'}</div><button class="btn" data-a="contactAdd">+ Kontak</button>`;
      }
    } else if (sec === 'pribadi') {
      h += sub('pribadi', [['jurnal', 'Jurnal'], ['habit', 'Kebiasaan']]);
      if (ui.pribadi === 'jurnal') {
        const js = list('journal').sort((a, b) => C.cmp(b.date, a.date) || C.cmp(b._u, a._u));
        h += `<div class="card">${js.length ? js.map((j) => `<div class="row" data-a="journalEdit" data-id="${j.id}"><div style="font-size:1.5rem">${MOODS[(+j.mood || 3) - 1]}</div><div class="grow"><div class="s">${fmtDate(j.date)}</div><div class="t">${esc(j.text.length > 140 ? j.text.slice(0, 140) + '…' : j.text)}</div></div></div>`).join('') : '<div class="empty">Belum ada jurnal.</div>'}</div><button class="btn" data-a="journalAdd">+ Tulis jurnal</button><p class="note">Jurnal tersimpan polos (belum dienkripsi ujung-ke-ujung); di Drive ia berada di folder privat aplikasi milik akun Google Anda.</p>`;
      } else {
        const t = C.today(), hs = list('habit');
        h += `<div class="card">${hs.length ? hs.map((x) => habitRow(x, t)).join('') : '<div class="empty">Belum ada kebiasaan.</div>'}</div><button class="btn" data-a="habitAdd">+ Kebiasaan</button>`;
      }
    } else h += vSettings();
    return { title: 'Lainnya', sub: '', html: h };
  }

  function vSettings() {
    const last = cfg.lastSync ? new Date(cfg.lastSync).toLocaleString('id-ID') : 'belum pernah';
    const notif = 'Notification' in window ? Notification.permission : 'tidak didukung';
    return `<h2>Sinkron Google Drive</h2><div class="card pad"><label class="f">Google OAuth Client ID<input id="cid" value="${esc(cfg.clientId || '')}" placeholder="xxxx.apps.googleusercontent.com" autocomplete="off"></label>
<div class="btns" style="margin-top:10px"><button class="btn alt" data-a="saveCid">Simpan ID</button><button class="btn" data-a="syncNow">${cfg.connected ? 'Sinkron sekarang' : 'Hubungkan &amp; sinkron'}</button></div>
<p class="note">Status: ${esc(syncMsg || (cfg.connected ? 'terhubung' : 'belum terhubung'))} · terakhir sinkron: ${esc(last)}</p>
<p class="note">Data disimpan di folder tersembunyi aplikasi di Drive Anda (bukan di file Drive biasa). Tanpa Client ID, data hanya di perangkat ini.</p></div>
<h2>Backup</h2><div class="card pad"><div class="btns"><button class="btn alt" data-a="export">Ekspor JSON</button><button class="btn alt" data-a="import">Impor / gabung JSON</button></div><input type="file" id="impf" accept="application/json,.json" hidden></div>
<h2>Pengingat</h2><div class="card pad"><p class="note" style="margin-top:0">Notifikasi berjalan saat aplikasi terbuka (judul generik, tanpa isi). Pengingat saat aplikasi tertutup butuh server/Google Calendar (rencana berikutnya).</p><button class="btn alt" data-a="notif">Izinkan notifikasi (status: ${esc(notif)})</button></div>
<h2>Data</h2><div class="card pad"><button class="btn bad" data-a="wipe">Hapus data di perangkat ini</button><p class="note">Salinan di Drive (jika terhubung) tidak ikut terhapus.</p></div>
<p class="note">RUMAHKU-ONE Lite v0.1 · ${list('task').length} tugas · ${list('tx').length} transaksi</p>`;
  }

  const views = { today: vToday, tasks: vTasks, cal: vCal, money: vMoney, more: vMore };
  function render() {
    const v = views[ui.tab]();
    document.getElementById('top').innerHTML = `<h1>${esc(v.title)}</h1>${v.sub ? `<p>${esc(v.sub)}</p>` : ''}`;
    const main = document.getElementById('main'), y = window.scrollY;
    main.innerHTML = v.html;
    window.scrollTo(0, y);
    document.querySelectorAll('#nav button').forEach((b) => b.classList.toggle('on', b.dataset.v === ui.tab));
  }

  // ---------- aksi ----------
  const get = (type, id) => store.rec[id] && !store.rec[id]._d ? store.rec[id] : null;
  const A = {
    tab(d) { ui.tab = d.v; window.scrollTo(0, 0); render(); },
    quick() {
      openMenu('Tambah cepat', [
        { label: '✅ Tugas', fn: () => taskForm() }, { label: '💸 Pengeluaran', fn: () => txForm('expense') }, { label: '💰 Pemasukan', fn: () => txForm('income') },
        { label: '📅 Acara', fn: () => eventForm() }, { label: '🛒 Barang belanja', fn: () => { ui.tab = 'more'; ui.section = 'rumah'; ui.rumah = 'belanja'; render(); const i = document.querySelector('[name=n]'); if (i) i.focus(); } },
        { label: '📓 Jurnal', fn: () => journalForm() },
      ]);
    },
    taskDone(d) { const t = get('task', d.id); if (!t) return; C.put(store, 'task', C.completeTask(t, C.today())); commit(); toast(t.repeat && t.repeat !== 'none' ? 'Selesai · jadwal berikutnya dimajukan' : 'Selesai ✓'); },
    taskUndo(d) { const t = get('task', d.id); if (!t) return; C.put(store, 'task', { id: t.id, done: false, doneAt: '' }); commit(); },
    taskEdit(d) { taskForm(get('task', d.id)); }, taskAdd() { taskForm(); },
    taskFilter(d) { ui.taskFilter = d.v; render(); },
    calPrev() { ui.calMonth = ymShift(ui.calMonth, -1); ui.calSel = null; render(); },
    calNext() { ui.calMonth = ymShift(ui.calMonth, 1); ui.calSel = null; render(); },
    calSel(d) { ui.calSel = d.v; render(); },
    evAdd() { eventForm(); }, evEdit(d) { eventForm(get('event', d.id), d.occ); },
    mPrev() { ui.moneyMonth = ymShift(ui.moneyMonth, -1); render(); }, mNext() { ui.moneyMonth = ymShift(ui.moneyMonth, 1); render(); },
    txAdd() { txForm(); }, accAdd() { accForm(); }, accEdit(d) { accForm(get('acc', d.id)); },
    budAdd() { budgetForm(); }, budEdit(d) { budgetForm(get('budget', d.id)); },
    txVoid(d) { const t = get('tx', d.id); if (!t) return; confirmBox('Void transaksi ' + rp(t.amount) + '? Dianggap tidak ada, riwayat tetap tersimpan.', () => { C.put(store, 'tx', { id: t.id, void: true, voidAt: C.today() }); commit(); }); },
    section(d) { ui.section = d.v; render(); }, sub(d) { ui[d.k] = d.v; render(); },
    assetAdd() { assetForm(); }, assetEdit(d) { assetForm(get('asset', d.id)); },
    serviced(d) { const a = get('asset', d.id); if (!a) return; const t = C.today(); C.put(store, 'asset', { id: a.id, lastService: t, nextService: a.everyMonths ? C.addMonths(t, a.everyMonths) : '' }); commit(); toast(a.everyMonths ? 'Servis berikutnya dijadwalkan' : 'Ditandai sudah diservis'); },
    shopTog(d) { const x = get('shop', d.id); if (x) { C.put(store, 'shop', { id: x.id, done: !x.done }); commit(); } },
    shopClear() { list('shop').filter((x) => x.done).forEach((x) => C.remove(store, x.id)); commit(); },
    contactAdd() { contactForm(); }, contactEdit(d) { contactForm(get('contact', d.id)); },
    journalAdd() { journalForm(); }, journalEdit(d) { journalForm(get('journal', d.id)); },
    habitAdd() { habitForm(); }, habitEdit(d) { habitForm(get('habit', d.id)); },
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
  };
  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-a]'); if (!t || !A[t.dataset.a]) return;
    if (t.dataset.a === 'quick' || t.closest('dialog') == null) A[t.dataset.a](t.dataset, e);
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
    syncing = true; syncMsg = 'menyinkronkan…'; if (ui.tab === 'more') render();
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
      syncMsg = 'gagal: ' + e.message; if (e.status === 401) { token = null; }
      if (interactive) toast('Sinkron gagal: ' + e.message);
    } finally {
      syncing = false; render();
      if (syncAgain) { syncAgain = false; scheduleSync(); }
    }
  }
  function scheduleSync() {
    if (!cfg.connected || !cfg.clientId) return;
    clearTimeout(syncTimer);
    // Otomatis hanya bila token masih berlaku (tanpa popup); selain itu tombol "Sinkron sekarang".
    syncTimer = setTimeout(() => { if (token && Date.now() < tokenExp - 60000) runSync(false); else { syncMsg = 'perubahan belum disinkron (ketuk Sinkron sekarang)'; } }, 4000);
  }

  // ---------- pengingat (hanya saat aplikasi terbuka; judul generik) ----------
  const fired = new Set();
  function tick() {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    const n = new Date(), t = C.today(n), mins = n.getHours() * 60 + n.getMinutes();
    evOccurrences(t, C.addDays(t, 1)).forEach((o) => {
      if (!o.ev.time || o.ev.allDay) return;
      const [h, m] = o.ev.time.split(':').map(Number), diff = h * 60 + m - mins, key = o.ev.id + t;
      if (diff >= 0 && diff <= 10 && !fired.has(key)) { fired.add(key); try { new Notification('RUMAHKU', { body: 'Ada acara sebentar lagi', tag: key }); } catch (e) { /* abaikan */ } }
    });
  }
  setInterval(tick, 60000);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') { render(); tick(); } });

  // ---------- mulai ----------
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
    navigator.serviceWorker.register('sw.js').catch(() => { /* PWA opsional */ });
  }
  window.__rk = { store: () => store, C }; // untuk uji
  render(); tick();
})();
