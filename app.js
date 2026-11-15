/* Rumahku v0.3 — UI. Data: penyimpanan lokal + (opsional) file pribadi di Google Drive. */
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
    { g: 'rumah', name: 'Servis AC rumah (cuci indoor & outdoor)', every: 3, unit: 'month' }, { g: 'kendaraan', name: 'Servis AC mobil (cek freon & evaporator)', every: 12, unit: 'month' }, { g: 'kendaraan', name: 'Ganti filter kabin AC mobil', every: 12, unit: 'month' }, { g: 'rumah', name: 'Kuras toren/tandon air', every: 6, unit: 'month' },
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
  const VEH_PLANS = {
    motor: [{ name: 'Ganti oli mesin', every: 2, unit: 'month', kmEvery: 2500 }, { name: 'Servis berkala', every: 6, unit: 'month', kmEvery: 10000 }, { name: 'Cek tekanan & kondisi ban', every: 1, unit: 'month', kmEvery: 0 }, { name: 'Cek rem & kampas', every: 6, unit: 'month', kmEvery: 8000 }, { name: 'Ganti busi & filter udara', every: 12, unit: 'month', kmEvery: 10000 }, { name: 'Cek aki', every: 12, unit: 'month', kmEvery: 0 }],
    mobil: [{ name: 'Ganti oli mesin', every: 6, unit: 'month', kmEvery: 5000 }, { name: 'Servis berkala', every: 6, unit: 'month', kmEvery: 10000 }, { name: 'Rotasi & cek ban', every: 6, unit: 'month', kmEvery: 10000 }, { name: 'Cek rem & minyak rem', every: 12, unit: 'month', kmEvery: 20000 }, { name: 'Ganti filter udara & filter AC', every: 12, unit: 'month', kmEvery: 20000 }, { name: 'Servis AC mobil (cek freon & evaporator)', every: 12, unit: 'month', kmEvery: 0 }, { name: 'Cek aki', every: 12, unit: 'month', kmEvery: 0 }, { name: 'Ganti air radiator / coolant', every: 24, unit: 'month', kmEvery: 0 }],
    motor_ev: [{ name: 'Cek kondisi baterai & charger', every: 6, unit: 'month', kmEvery: 0 }, { name: 'Servis berkala (ikuti buku servis)', every: 6, unit: 'month', kmEvery: 5000 }, { name: 'Cek rem & kampas', every: 6, unit: 'month', kmEvery: 5000 }, { name: 'Cek tekanan & kondisi ban', every: 1, unit: 'month', kmEvery: 0 }, { name: 'Cek kelistrikan & pembaruan software', every: 12, unit: 'month', kmEvery: 0 }],
    mobil_ev: [{ name: 'Cek kesehatan baterai & sistem pengisian', every: 6, unit: 'month', kmEvery: 0 }, { name: 'Servis berkala (ikuti buku servis)', every: 12, unit: 'month', kmEvery: 15000 }, { name: 'Rotasi & cek ban', every: 6, unit: 'month', kmEvery: 10000 }, { name: 'Servis AC mobil (cek freon & evaporator)', every: 12, unit: 'month', kmEvery: 0 }, { name: 'Ganti filter kabin AC', every: 12, unit: 'month', kmEvery: 0 }, { name: 'Ganti cairan rem', every: 24, unit: 'month', kmEvery: 0 }, { name: 'Cek sistem pendingin baterai', every: 24, unit: 'month', kmEvery: 0 }],
  };
  const vehPlansFor = (kind) => VEH_PLANS[kind] || VEH_PLANS.mobil;
  const VEH_KINDS = [['motor', 'Motor'], ['mobil', 'Mobil'], ['motor_ev', 'Motor listrik (EV)'], ['mobil_ev', 'Mobil listrik (EV)'], ['lain', 'Lainnya']];
  const BILL_NAMES = ['Listrik PLN', 'Internet', 'PDAM / air', 'PBB', 'Iuran RT / sampah', 'Gas', 'Langganan streaming'];
  const BILL_KINDS = [['tagihan', 'Tagihan (nominal berubah-ubah, mis. listrik)'], ['wajib', 'Kewajiban tetap (nominal pasti: asuransi, SPP, kas desa, arisan)'], ['cicilan', 'Cicilan / utang']];
  const WAJIB_BY_MODE = {
    pelajar: [['Uang kuliah / SPP', 'wajib'], ['Kos / kontrakan', 'wajib'], ['Kuota internet', 'tagihan'], ['Cicilan HP / laptop', 'cicilan']],
    pekerja: [['Kos / kontrakan', 'wajib'], ['Asuransi', 'wajib'], ['BPJS Kesehatan', 'wajib'], ['Cicilan', 'cicilan'], ['Kirim orang tua', 'wajib']],
    keluarga: [['SPP anak', 'wajib'], ['Les / kegiatan anak', 'wajib'], ['Asuransi', 'wajib'], ['BPJS Kesehatan', 'wajib'], ['Kas desa / iuran RT', 'wajib'], ['Arisan', 'wajib'], ['Iuran keamanan & kebersihan', 'wajib'], ['Cicilan KPR', 'cicilan'], ['Cicilan kendaraan', 'cicilan']],
  };
  const billItems = () => BILL_NAMES.map((n) => ({ name: n, kind: 'tagihan' })).concat((WAJIB_BY_MODE[modeOf() || 'pekerja']).map((x) => ({ name: x[0], kind: x[1] })));
  const BILL_CAT = { tagihan: 'Tagihan', wajib: 'Kewajiban tetap', cicilan: 'Cicilan' };
  // [kunci, ikon, nama, jenis, kelompok isian, nama bawaan]. KPR dan "angsuran rumah" digabung (isinya sama); kelompok: angsuran | arisan | simple
  const BILL_CATS = [
    ['kpr', '🏠', 'KPR / Angsuran rumah', 'cicilan', 'angsuran', 'KPR Rumah'], ['kendaraan', '🚗', 'Cicilan kendaraan (mobil/motor)', 'cicilan', 'angsuran', 'Cicilan Kendaraan'],
    ['haji', '🕋', 'Angsuran Haji', 'cicilan', 'angsuran', 'Angsuran Haji'], ['umrah', '🕌', 'Angsuran Umrah', 'cicilan', 'angsuran', 'Angsuran Umrah'],
    ['arisan', '🤝', 'Arisan', 'wajib', 'arisan', 'Arisan'], ['elektronik', '📺', 'Cicilan elektronik', 'cicilan', 'angsuran', 'Cicilan Elektronik'],
    ['pinjaman', '💳', 'Cicilan pinjaman', 'cicilan', 'angsuran', 'Cicilan Pinjaman'], ['asuransi', '🛡️', 'Asuransi', 'wajib', 'simple', 'Asuransi'],
    ['sekolah', '🎓', 'Biaya pendidikan / sekolah', 'wajib', 'simple', 'Biaya Sekolah'], ['internet', '🌐', 'Internet dan telepon', 'tagihan', 'simple', 'Internet'],
    ['listrik', '💡', 'Listrik dan air', 'tagihan', 'simple', 'Listrik PLN'], ['iuran', '🏘️', 'Iuran lingkungan', 'wajib', 'simple', 'Iuran Lingkungan'],
    ['langganan', '🔁', 'Langganan bulanan', 'tagihan', 'simple', 'Langganan'], ['lain', '🧾', 'Tagihan rutin lainnya', 'tagihan', 'simple', ''],
  ];
  const billCatOf = (b) => BILL_CATS.find((c) => c[0] === b.cat) || null;
  const WEEKDAYS = [['0', 'Minggu'], ['1', 'Senin'], ['2', 'Selasa'], ['3', 'Rabu'], ['4', 'Kamis'], ['5', 'Jumat'], ['6', 'Sabtu']];
  const BILL_STATUS = { terlambat: ['Terlambat', 'late'], sebagian: ['Dibayar sebagian', ''], belum: ['Belum dibayar', ''], sudah: ['Sudah dibayar', ''], upcoming: ['Akan datang', ''], lunas: ['Lunas ✓', ''], nonaktif: ['Nonaktif', ''] };
  const billStates = () => { const t = C.today(), pays = list('bpay'); return list('bill').map((b) => ({ b, st: C.billState(b, pays, t) })); };

  // ---------- state ----------
  function readJSON(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } }
  let store = readJSON(LS);
  if (!C.validStore(store)) store = C.emptyStore();
  let cfg = readJSON(CFG) || {};
  const ui = { tab: 'today', stack: [], planGroup: 'semua', assetCat: 'Semua', stokTab: 'belanja', taskFilter: 'aktif', calMonth: null, calSel: null, moneyMonth: null, addFn: null, section: null, reveal: {}, afTab: 'kabar', afWho: null, afCat: 'Semua', cardCat: null, cardShift: 0, billCat: 'Semua', billSt: 'Semua', relF: 'Semua', famQ: '' };
  let persistMsg = 'memeriksa…';
  if (navigator.storage && navigator.storage.persist) navigator.storage.persist().then((g) => { persistMsg = g ? 'aktif ✓' : 'belum diberikan browser'; }).catch(() => { persistMsg = 'tidak tersedia'; }); else persistMsg = 'tidak didukung';
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
  // Pemisah ribuan otomatis saat mengetik (format Indonesia: 500.000). Nilai dibaca ulang lewat C.parseAmount yang menerima titik/koma.
  const fmtThousands = (v) => { const s = String(v == null ? '' : v); const d = s.replace(/\D/g, ''); return /^\d+$/.test(s.replace(/[.,\s]/g, '')) && d ? d.replace(/\B(?=(\d{3})+(?!\d))/g, '.') : s; };
  function fieldHTML(f, v) {
    const val = v == null ? '' : v;
    if (f.type === 'check') return `<label class="f c"><input type="checkbox" name="${f.k}" ${val ? 'checked' : ''}> ${esc(f.label)}</label>`;
    if (f.type === 'photo') return `<div class="f"><span>${esc(f.label)}</span><div class="inl" style="gap:8px;margin-top:6px"><button type="button" class="btn alt grow" data-cam="${f.k}">📷 Ambil foto</button><button type="button" class="btn alt grow" data-gal="${f.k}">🖼️ Galeri</button></div><input name="${f.k}" type="file" accept="image/*" hidden><div class="s" id="pv-${f.k}" style="margin-top:6px">Belum ada foto</div></div>`;
    let inner;
    if (f.type === 'select') inner = `<select name="${f.k}" ${f.addList ? 'data-add="' + f.addList + '"' : ''}>${f.opts.map((o) => `<option value="${esc(o[0])}" ${String(o[0]) === String(val) ? 'selected' : ''}>${esc(o[1])}</option>`).join('')}${f.addList ? '<option value="__new">➕ Tambah baru…</option>' : ''}</select>`;
    else if (f.type === 'textarea') inner = `<textarea name="${f.k}" rows="3">${esc(val)}</textarea>`;
    else if (f.type === 'amount') inner = `<input name="${f.k}" inputmode="numeric" autocomplete="off" data-amt="1" placeholder="mis. 25.000" value="${esc(fmtThousands(val))}">`;
    else if (f.type === 'dec') inner = `<input name="${f.k}" inputmode="decimal" autocomplete="off" placeholder="${esc(f.ph || '')}" value="${esc(val)}">`;
    else if (f.type === 'number') inner = `<input name="${f.k}" type="number" inputmode="numeric" min="0" value="${esc(val)}">`;
    else inner = `<input name="${f.k}" type="${f.type || 'text'}" value="${esc(val)}" ${f.list ? 'list="dl-' + f.k + '"' : ''} autocomplete="off">` + (f.list ? `<datalist id="dl-${f.k}">${f.list.map((x) => `<option value="${esc(x)}">`).join('')}</datalist>` : '');
    return `<label class="f">${esc(f.label)}${f.req ? ' *' : ''}${inner}</label>`;
  }
  // fields: [{k,label,type,req,opts,list}], onOk(values) -> pesan error (string) atau undefined
  function openForm(title, fields, init, onOk, extras, note, onChange) {
    init = init || {};
    dlg.innerHTML = `<form method="dialog" novalidate><h3>${esc(title)}</h3>${note ? `<p class="note" style="margin:0">${esc(note)}</p>` : ''}${fields.map((f) => fieldHTML(f, init[f.k])).join('')}<div class="err" id="ferr"></div><div class="btns"><button type="button" class="btn alt" id="fcancel">Batal</button><button class="btn" id="fok" type="submit">Simpan</button></div>${(extras || []).length ? `<div class="btns">${extras.map((x, i) => `<button type="button" class="btn bad sm" data-x="${i}">${esc(x.label)}</button>`).join('')}</div>` : ''}</form>`;
    const form = dlg.querySelector('form');
    // tombol foto: kamera belakang langsung (capture) atau galeri; tampilkan nama berkas terpilih
    form.querySelectorAll('[data-cam],[data-gal]').forEach((b) => b.addEventListener('click', () => {
      const inp = form.elements[b.dataset.cam || b.dataset.gal]; if (!inp) return;
      if (b.dataset.cam) inp.setAttribute('capture', 'environment'); else inp.removeAttribute('capture');
      inp.click();
    }));
    form.addEventListener('input', (e) => {
      const el = e.target; if (!el || !el.dataset || !el.dataset.amt) return;
      const raw = el.value, pos = el.selectionStart == null ? raw.length : el.selectionStart, digitsBefore = raw.slice(0, pos).replace(/\D/g, '').length;
      if (/[^\d.,\s]/.test(raw.replace(/^\s*rp\.?\s*/i, ''))) { el.value = raw.replace(/[^\d.,\s]/g, ''); }
      const f = fmtThousands(el.value); if (f === el.value) return; el.value = f;
      let n = 0, i = 0; for (; i < f.length && n < digitsBefore; i++) if (/\d/.test(f[i])) n++;
      try { el.setSelectionRange(i, i); } catch (x) { /* abaikan */ }
    });
    form.addEventListener('change', (e) => {
      const t = e.target; if (!t || t.type !== 'file') return;
      const pv = form.querySelector('#pv-' + t.name), f0 = t.files && t.files[0];
      if (pv) pv.textContent = f0 ? '✔ Foto dipilih: ' + (f0.name || 'foto') + ' (' + Math.max(1, Math.round(f0.size / 1024)) + ' KB) — tersimpan saat menekan Simpan' : 'Belum ada foto';
    });
    form.addEventListener('change', (e) => {
      const el = e.target;
      if (el.tagName === 'SELECT' && el.value === '__new' && el.dataset.add) {
        const nm = (window.prompt('Nama baru (mis. ' + (el.dataset.add === 'inc' ? 'Dari orang tua' : 'Arisan') + '):') || '').trim().slice(0, 40);
        const nw = el.querySelector('option[value="__new"]');
        if (nm) { saveOpt(el.dataset.add, nm); let o = [...el.options].find((x) => x.value === nm); if (!o) { o = document.createElement('option'); o.value = nm; o.textContent = nm; el.insertBefore(o, nw); } el.value = nm; }
        else el.selectedIndex = 0;
      }
      if (onChange) onChange(form, e);
    });
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
        v[f.k] = f.type === 'check' ? el.checked : f.type === 'photo' ? ((el.files && el.files[0]) || null) : String(el.value || '').trim();
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
  const BANKS = ['BCA', 'Mandiri', 'BRI', 'BNI', 'BSI', 'CIMB Niaga', 'Permata', 'Danamon', 'BTN', 'SeaBank', 'Jago', 'blu by BCA', 'Allo Bank', 'Jenius', 'GoPay', 'OVO', 'DANA', 'ShopeePay', 'LinkAja', 'Dompet tunai'];
  const accOpts = () => list('acc').map((a) => [a.id, a.name]);

  // ---------- mode pengguna & daftar sumber dana / kategori (bisa ditambah sendiri) ----------
  const MODES = [['pelajar', '🎓 Pelajar / mahasiswa'], ['pekerja', '💼 Pekerja (belum punya pasangan resmi)'], ['keluarga', '🏡 Berkeluarga (pasangan resmi, rumah, anak)']];
  const modeOf = () => ((get('profile', 'profile') || {}).mode) || '';
  const INC_BASE = {
    pelajar: ['Uang saku orang tua', 'Beasiswa', 'Kerja paruh waktu', 'Hadiah / angpao', 'Jual barang', 'Investasi'],
    pekerja: ['Gaji', 'Lembur', 'Freelance / sampingan', 'Bonus / THR', 'Investasi', 'Dari orang tua', 'Hadiah / angpao', 'Jual barang'],
    keluarga: ['Gaji suami', 'Gaji istri', 'Bisnis / usaha', 'Bonus / THR', 'Investasi', 'Sewa', 'Dari orang tua', 'Hadiah / angpao', 'Jual barang'],
  };
  const EXP_BASE = {
    pelajar: ['Makan & minum', 'Kos / kontrakan', 'Transport', 'Kuota & pulsa', 'Uang kuliah / SPP', 'Buku & alat kuliah', 'Nongkrong & hiburan', 'Kesehatan', 'Belanja', 'Kewajiban tetap', 'Lainnya'],
    pekerja: ['Makan & minum', 'Kos / kontrakan', 'Transport', 'Tagihan', 'Kewajiban tetap', 'Cicilan', 'Belanja', 'Hiburan', 'Kencan & hadiah', 'Kirim orang tua', 'Kesehatan', 'Asuransi', 'Lainnya'],
    keluarga: ['Uang dapur', 'Makan & minum', 'Transport', 'Tagihan', 'Kewajiban tetap', 'Cicilan', 'SPP & sekolah anak', 'Jajan anak', 'Belanja', 'Kesehatan', 'Asuransi', 'Kas desa / RT', 'Arisan', 'Kondangan & sosial', 'Zakat / sedekah / qurban', 'Rumah', 'Hiburan', 'Lainnya'],
  };
  const dedupe = (a) => a.filter((x, i) => x && a.indexOf(x) === i);
  function optNames(kind) { // 'inc' | 'exp'
    const base = (kind === 'inc' ? INC_BASE : EXP_BASE)[modeOf() || 'pekerja'];
    const custom = list('opt').filter((o) => o.list === kind).sort((a, b) => C.cmp(a._u, b._u)).map((o) => o.name);
    const used = list('tx').filter((t) => t.kind === (kind === 'inc' ? 'income' : 'expense')).map((t) => t.cat);
    return dedupe(base.concat(custom, used));
  }
  function saveOpt(kind, name) {
    name = String(name || '').trim(); if (!name) return;
    if (list('opt').some((o) => o.list === kind && o.name.toLowerCase() === name.toLowerCase())) return;
    C.put(store, 'opt', { list: kind, name }); persist(); scheduleSync();
  }
  const optSelect = (kind) => optNames(kind).map((n) => [n, n]);

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
      { k: 'title', label: 'Judul', req: true, list: ['Ulang tahun ', 'Bayar STNK', 'Bayar pajak kendaraan', 'Servis kendaraan', 'Kontrol dokter', 'Arisan', 'Rapat'] }, { k: 'date', label: 'Tanggal', type: 'date', req: true },
      { k: 'allDay', label: 'Sepanjang hari', type: 'check' }, { k: 'time', label: 'Jam mulai', type: 'time' },
      { k: 'remind', label: 'Pengingat', type: 'select', opts: EV_REMIND }, { k: 'remind2', label: 'Pengingat kedua (opsional)', type: 'select', opts: EV_REMIND },
      { k: 'repeat', label: 'Pengulangan', type: 'select', opts: REPEATS }, { k: 'until', label: 'Berulang sampai (opsional)', type: 'date' },
      { k: 'notes', label: 'Catatan', type: 'textarea' },
    ], { title: ev.title, date: ev.date || ui.calSel || C.today(), allDay: ev.allDay !== false && !ev.time, time: ev.time, remind: ev.id ? (ev.remind == null ? (ev.time && !ev.allDay ? '10' : '') : ev.remind) : '1440', remind2: ev.remind2 || '', repeat: ev.repeat || 'none', until: ev.until, notes: ev.notes }, (v) => {
      C.put(store, 'event', { id: ev.id, title: v.title, date: v.date, allDay: v.allDay, time: v.allDay ? '' : v.time, remind: v.remind, remind2: v.remind2, repeat: v.repeat, until: v.until || '', notes: v.notes, skip: ev.skip });
      commit();
    }, extras, EV_NOTE);
  }
  async function attachProof(txId, file) {
    let fr = null;
    try {
      const blob = await resizeBlob(file, 1400, 0.72), old = get('tx', txId);
      fr = C.put(store, 'pfile', { personId: '', txId, label: 'Bukti transaksi', size: blob.size });
      await IDB.put(fr.id, blob);
      if (old && old.proof) { IDB.del(old.proof); C.remove(store, old.proof); }
      C.put(store, 'tx', { id: txId, proof: fr.id }); commit(); toast('Bukti tersimpan di perangkat ini');
    } catch (e) { if (fr) C.remove(store, fr.id); commit(); toast('Bukti gagal disimpan: ' + (e.message || 'penyimpanan penuh/dibatasi')); }
  }
  function txForm(kind, pre) {
    if (!list('acc').length) { toast('Buat akun dulu (mis. Dompet)'); return accForm(); }
    pre = pre || {}; kind = kind || 'expense';
    const opts = accOpts(), catList = (k) => { const l = optSelect(k === 'income' ? 'inc' : 'exp'); if (pre.cat && !l.some((x) => x[0] === pre.cat)) l.unshift([pre.cat, pre.cat]); return l; };
    openForm('Catat transaksi', [
      { k: 'kind', label: 'Jenis', type: 'select', opts: [['expense', 'Pengeluaran'], ['income', 'Pemasukan'], ['transfer', 'Transfer antar akun (pindah uang, bukan pengeluaran)']] },
      { k: 'amount', label: 'Jumlah (Rp)', type: 'amount', req: true }, { k: 'acc', label: 'Akun / rekening (sumber dana)', type: 'select', opts },
      { k: 'to', label: 'Ke akun (hanya transfer)', type: 'select', opts: [['', '—']].concat(opts) },
      { k: 'cat', label: 'Sumber pemasukan / kategori pengeluaran', type: 'select', opts: catList(kind), addList: kind === 'income' ? 'inc' : 'exp' },
      { k: 'date', label: 'Tanggal', type: 'date', req: true }, { k: 'note', label: 'Catatan' }, { k: 'proof', label: '📷 Foto bukti / struk (opsional)', type: 'photo' },
    ], { kind, date: C.today(), acc: opts[0][0], amount: pre.amount, cat: pre.cat, note: pre.note }, (v) => {
      const amount = C.parseAmount(v.amount);
      if (amount == null || amount <= 0) return 'Jumlah harus bilangan bulat rupiah lebih dari 0 (tanpa desimal).';
      if (v.kind === 'transfer' && (!v.to || v.to === v.acc)) return 'Transfer perlu akun tujuan yang berbeda.';
      const rec = C.put(store, 'tx', { kind: v.kind, amount, acc: v.acc, to: v.kind === 'transfer' ? v.to : '', cat: v.kind === 'transfer' ? '' : (v.cat && v.cat !== '__new' ? v.cat : 'Lainnya'), date: v.date, note: v.note, cid: C.uid() });
      commit(); toast('Tercatat: ' + rp(amount));
      if (v.proof) attachProof(rec.id, v.proof);
    }, null, null, (form, e) => {
      if (e.target.name !== 'kind') return;
      const k = e.target.value === 'income' ? 'inc' : 'exp', sel = form.elements.cat; sel.dataset.add = k;
      sel.innerHTML = optSelect(k).map((o) => `<option value="${esc(o[0])}">${esc(o[1])}</option>`).join('') + '<option value="__new">➕ Tambah baru…</option>';
    });
  }
  function accForm(a) {
    a = a || {};
    openForm(a.id ? 'Ubah akun' : 'Akun baru', [
      { k: 'name', label: 'Nama akun / bank', req: true, list: BANKS },
      { k: 'type', label: 'Jenis', type: 'select', opts: [['kas', 'Kas / dompet'], ['bank', 'Bank'], ['ewallet', 'E-wallet'], ['kartu', 'Kartu kredit (saldo negatif = utang)'], ['invest', 'Investasi']] },
      { k: 'opening', label: 'Saldo awal (Rp; boleh minus untuk utang)', type: 'amount' },
      { k: 'emergency', label: 'Akun ini dana darurat (dipakai menghitung level kesehatan keuangan)', type: 'check' },
    ], { name: a.name, type: a.type || 'kas', opening: a.opening || '', emergency: !!a.emergency }, (v) => {
      let neg = false, raw = v.opening;
      if (raw.startsWith('-')) { neg = true; raw = raw.slice(1); }
      const n = raw === '' ? 0 : C.parseAmount(raw);
      if (n == null) return 'Saldo awal harus bilangan bulat rupiah.';
      C.put(store, 'acc', { id: a.id, name: v.name, type: v.type, opening: neg ? -n : n, emergency: v.emergency }); commit();
    }, a.id ? [{ label: 'Hapus akun', fn: () => {
      if (list('tx').some((t) => t.acc === a.id || t.to === a.id)) { toast('Akun punya transaksi; tidak bisa dihapus'); return false; }
      C.remove(store, a.id); commit();
    } }] : null);
  }
  function budgetForm(b) {
    b = b || {};
    openForm(b.id ? 'Ubah anggaran' : 'Anggaran bulanan', [
      { k: 'cat', label: 'Kategori pengeluaran', req: true, type: 'select', opts: (() => { const l = optSelect('exp'); if (b.cat && !l.some((x) => x[0] === b.cat)) l.unshift([b.cat, b.cat]); return l; })(), addList: 'exp' }, { k: 'limit', label: 'Batas per bulan (Rp)', type: 'amount', req: true },
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
    const tpls = vehId ? vehPlansFor((get('veh', vehId) || {}).kind).map((t) => Object.assign({ g: 'kendaraan' }, t)) : TEMPLATES;
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
      { k: 'kind', label: 'Jenis', type: 'select', opts: VEH_KINDS },
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
  function billCatMenu() { openMenu('Jenis tagihan / angsuran', BILL_CATS.map((c) => ({ label: c[1] + ' ' + c[2], fn: () => billForm({}, c[0]) }))); }
  function billForm(b, catKey) {
    b = b || {};
    const cat = BILL_CATS.find((c) => c[0] === (b.cat || catKey)) || null, grp = cat ? cat[4] : 'simple';
    if (grp === 'angsuran' && vOn() && !vOpen()) return vPrompt(() => billForm(b.id ? get('bill', b.id) : b, catKey));
    const ref = b.refSec ? ((VAULT.cache.bills || {})[b.id] || '') : (b.ref || '');
    const F = [{ k: 'name', label: 'Nama tagihan / kewajiban', req: true, list: cat && cat[5] ? [cat[5]] : billItems().map((x) => x.name) }];
    if (!cat || cat[0] === 'lain') F.push({ k: 'kind', label: 'Jenis', type: 'select', opts: BILL_KINDS });
    F.push({ k: 'amountEst', label: grp === 'angsuran' ? 'Nominal angsuran per periode (Rp)' : grp === 'arisan' ? 'Nominal iuran (Rp)' : 'Nominal (Rp; perkiraan bila berubah-ubah)', type: 'amount' });
    if (grp === 'arisan') F.push({ k: 'freq', label: 'Frekuensi', type: 'select', opts: [['monthly', 'Bulanan'], ['weekly', 'Mingguan']] }, { k: 'dueWeekday', label: 'Bila mingguan: hari pembayaran', type: 'select', opts: WEEKDAYS });
    F.push({ k: 'dueDay', label: grp === 'arisan' ? 'Bila bulanan: tanggal pembayaran (1–31)' : 'Jatuh tempo tiap tanggal (1–31)', type: 'number', req: grp !== 'arisan' });
    if (grp === 'angsuran') F.push(
      { k: 'creditor', label: 'Kreditur / lembaga (opsional)' }, { k: 'bank', label: 'Bank / penyedia pembiayaan (opsional)', list: BANKS }, { k: 'ref', label: 'Nomor kontrak / referensi (opsional, sensitif' + (vOn() ? ' — dienkripsi)' : ')') },
      { k: 'total', label: cat && (cat[0] === 'haji' || cat[0] === 'umrah') ? 'Total target biaya (Rp)' : 'Total pinjaman / pembiayaan (Rp)', type: 'amount' }, { k: 'dp', label: 'Uang muka (Rp, opsional)', type: 'amount' },
      { k: 'tenor', label: 'Jumlah angsuran / tenor (mis. 15 tahun = 180)', type: 'number' },
      { k: 'instNow', label: 'SUDAH BAYAR BERAPA KALI? Isi angsuran ke-berapa yang AKAN dibayar berikutnya (sudah 30 kali → isi 31)', type: 'number' }, { k: 'startDate', label: 'Tanggal mulai (angsuran pertama)', type: 'date' },
      { k: 'endDate', label: cat && (cat[0] === 'haji' || cat[0] === 'umrah') ? 'Target pelunasan / tanggal selesai' : 'Tanggal selesai (kosongkan: dihitung dari tenor)', type: 'date' },
      { k: 'paidBefore', label: 'Total yang sudah dibayar sebelumnya (Rp, bila tanpa tenor mis. Haji)', type: 'amount' },
      { k: 'extra', label: 'Bunga / biaya tambahan (opsional, catatan)' });
    if (grp === 'arisan') F.push({ k: 'tenor', label: 'Jumlah periode arisan (opsional)', type: 'number' }, { k: 'instNow', label: 'SUDAH BAYAR BERAPA KALI? Isi periode ke-berapa yang AKAN dibayar berikutnya (sudah 5 kali → isi 6)', type: 'number' }, { k: 'startDate', label: 'Mulai (pembayaran pertama)', type: 'date' });
    if (grp === 'simple') F.push({ k: 'startDate', label: 'Mulai berlaku (opsional)', type: 'date' }, { k: 'endDate', label: 'Berakhir (opsional)', type: 'date' });
    if (b.id) F.push({ k: 'active', label: 'Template aktif (hasilkan jadwal berikutnya)', type: 'check' }); else F.push({ k: 'paidThis', label: 'Periode ini sudah dibayar (tanpa mencatat transaksi)', type: 'check' });
    F.push({ k: 'notes', label: grp === 'arisan' ? 'Catatan (giliran / penerimaan)' : 'Catatan', type: 'textarea' });
    const init = { name: b.name || (cat ? cat[5] : ''), kind: b.kind || 'tagihan', amountEst: b.amountEst || '', freq: b.freq || 'monthly', dueWeekday: String(b.dueWeekday == null ? 6 : b.dueWeekday), dueDay: b.dueDay, creditor: b.creditor, bank: b.bank, ref, total: b.total || '', dp: b.dp || '', tenor: b.tenor || '', startDate: b.startDate, endDate: b.endDate, instNow: (+b.instBefore || 0) > 0 ? (+b.instBefore) + 1 : '', paidBefore: b.paidBefore || '', extra: b.extra, active: b.active !== false, notes: b.notes };
    openForm((b.id ? 'Ubah: ' : 'Baru: ') + (cat ? cat[2] : 'tagihan rutin'), F, init, (v) => {
      const num = (x) => (x === '' || x == null ? 0 : C.parseAmount(x)), int = (x) => (x === '' || x == null ? 0 : /^\d{1,4}$/.test(String(x)) ? +x : null);
      const weekly = grp === 'arisan' && v.freq === 'weekly', day = +v.dueDay;
      if (!weekly && !(day >= 1 && day <= 31)) return 'Tanggal harus 1–31.';
      const amt = num(v.amountEst); if (amt == null) return 'Nominal harus bilangan bulat rupiah.';
      const data = { id: b.id, name: v.name, cat: cat ? cat[0] : (b.cat || ''), kind: cat && cat[0] !== 'lain' ? cat[3] : (v.kind || b.kind || 'tagihan'), amountEst: amt, notes: v.notes };
      if (grp === 'arisan') { data.freq = v.freq; data.dueWeekday = +v.dueWeekday; } else if (!b.freq) data.freq = 'monthly';
      if (!weekly) data.dueDay = day; else if (b.dueDay) data.dueDay = b.dueDay;
      for (const k of ['startDate', 'endDate']) if (k in v) { if (v[k] && !/^\d{4}-\d{2}-\d{2}$/.test(v[k])) return 'Format tanggal tidak valid.'; data[k] = v[k]; }
      if (data.startDate && data.endDate && data.endDate < data.startDate) return 'Tanggal selesai tidak boleh sebelum tanggal mulai.';
      if ('tenor' in v) { const t = int(v.tenor); if (t == null) return 'Tenor harus bilangan bulat.'; data.tenor = t; }
      if ('instNow' in v) { const t = int(v.instNow); if (t == null) return 'Angsuran ke-berapa harus bilangan bulat.'; if (data.tenor && t > data.tenor) return 'Angsuran ke-' + t + ' melebihi tenor (' + data.tenor + ').'; data.instBefore = Math.max(0, t - 1); }
      for (const k of ['total', 'dp', 'paidBefore']) if (k in v) { const n = num(v[k]); if (n == null) return 'Nominal harus bilangan bulat rupiah.'; data[k] = n; }
      for (const k of ['creditor', 'bank', 'extra']) if (k in v) data[k] = v[k];
      if (b.id) data.active = !!v.active; else { data.active = true; if (v.paidThis) data.paidYM = nowYM(); }
      const sched = b.id && ['amountEst', 'dueDay', 'freq', 'dueWeekday', 'startDate', 'endDate', 'tenor'].some((k) => k in data && String(data[k] == null ? '' : data[k]) !== String(b[k] == null ? '' : b[k]));
      const hasHist = b.id && list('bpay').some((x) => x.billId === b.id && !x.void);
      const save = () => {
        if (!('ref' in v)) { C.put(store, 'bill', data); commit(); return; }
        if (!vOn()) { C.put(store, 'bill', Object.assign(data, { ref: v.ref })); commit(); return; }
        if (!v.ref && !b.refSec) { C.put(store, 'bill', data); commit(); return; }
        if (!VAULT.key) return toast('Terkunci lagi. Buka dengan password lalu ulangi.');
        const rec = C.put(store, 'bill', Object.assign(data, { ref: '' }));
        Vault.seal(VAULT.key, { ref: v.ref }).then((sc) => { C.put(store, 'bill', { id: rec.id, refSec: sc }); VAULT.cache.bills[rec.id] = v.ref; commit(); });
      };
      if (sched && hasHist) setTimeout(() => confirmBox('Perubahan jadwal/nominal hanya berlaku untuk tagihan MENDATANG. Riwayat pembayaran yang sudah tercatat tidak berubah.', save), 0); else save();
    }, b.id ? [{ label: 'Hapus template (riwayat tetap)', fn: () => { billDeleteConfirm(b); return false; } }] : null,
    cat && cat[0] === 'arisan' ? 'Arisan mingguan: pilih Frekuensi Mingguan dan harinya. Sisa kewajiban dihitung dari sisa periode × iuran.' : grp === 'angsuran' ? 'Sisa kewajiban: bila ada tenor = sisa angsuran × nominal; bila tidak ada tenor = total − uang muka − yang sudah dibayar. Isi hanya yang Anda tahu.' : '');
  }
  function billDeleteConfirm(b) { setTimeout(() => confirmBox('Hapus template "' + b.name + '"? Riwayat pembayaran dan transaksi keuangan yang sudah tercatat TIDAK dihapus; hanya jadwal ke depan yang berhenti.', () => { C.remove(store, b.id); commit(); ui.stack = ui.stack.filter((x) => !(x.n === 'tagihandetail' && x.p.id === b.id)); render(); toast('Template dihapus; riwayat tetap tersimpan'); }), 0); }
  // mode: 'full' | 'part' | 'payoff'
  function billPayForm(b, mode) {
    mode = mode || 'full'; const t = C.today(), pays = list('bpay'), st = C.billState(b, pays, t);
    if (!st.next) return toast('Tidak ada tagihan yang perlu dibayar.');
    const accs = [['', 'Jangan catat ke Uang']].concat(accOpts()), left = st.partial > 0 ? Math.max(0, (+b.amountEst || 0) - st.partial) : (+b.amountEst || 0);
    const initAmt = mode === 'payoff' ? (st.remaining != null ? st.remaining : '') : mode === 'part' ? '' : (left || '');
    const title = mode === 'payoff' ? 'Lunasi sekarang: ' : mode === 'part' ? 'Bayar sebagian: ' : 'Bayar: ';
    const info = 'Membayar ' + (st.instNext ? 'angsuran ke-' + st.instNext + ' ' : 'tagihan ') + 'jatuh tempo ' + fmtDate(st.next) + (mode === 'payoff' ? '. Pelunasan menutup template ini (tidak ada jadwal berikutnya).' : '.') + (st.partial > 0 ? ' Sudah dibayar sebagian ' + rp(st.partial) + '.' : '');
    openForm(title + b.name, [
      { k: 'date', label: 'Tanggal bayar sebenarnya', type: 'date', req: true }, { k: 'amount', label: mode === 'part' ? 'Nominal yang dibayar sekarang (Rp)' : 'Nominal (Rp)', type: 'amount', req: mode !== 'full' }, { k: 'acc', label: 'Catat ke akun', type: 'select', opts: accs },
    ], { date: t, amount: initAmt, acc: accs.length > 1 ? accs[1][0] : '' }, (v) => {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(v.date)) return 'Tanggal tidak valid.';
      const amt = v.amount === '' ? 0 : C.parseAmount(v.amount); if (amt == null) return 'Nominal harus bilangan bulat rupiah.';
      if (mode !== 'full' && !(amt > 0)) return 'Isi nominal pembayaran.';
      const cur = get('bill', b.id); if (!cur) return 'Template sudah tidak ada.';
      const plan = C.billPayPlan(cur, list('bpay'), { date: v.date, amount: amt, part: mode === 'part', payoff: mode === 'payoff', today: C.today() });
      if (plan.error) return plan.error;
      C.applyBillPay(store, cur, plan, { date: v.date, accId: v.acc, cat: BILL_CAT[cur.kind] || 'Tagihan', nowISO: new Date().toISOString() });
      commit(); toast(mode === 'payoff' ? 'Lunas ✓ — template ditutup' : plan.part ? 'Pembayaran sebagian dicatat ✓' : 'Tagihan dibayar ✓' + (plan.late ? ' (terlambat)' : ''));
    }, null, info);
  }
  function billVoidConfirm(payId) { const p = get('bpay', payId); if (!p) return; confirmBox('Batalkan pembayaran ' + rp(p.amount) + ' (' + fmtDate(p.date) + ')? Riwayat dan transaksinya ditandai batal (tidak dihapus), tagihannya kembali belum dibayar.', () => { C.voidBillPay(store, payId, C.today(), new Date().toISOString()); commit(); toast('Pembayaran dibatalkan'); }); }
  function billTemplateForm() {
    const items = billItems();
    openForm('Pilih tagihan & kewajiban tetap', items.map((x, i) => ({ k: 'b' + i, label: x.name + (x.kind === 'tagihan' ? '' : x.kind === 'wajib' ? ' (kewajiban tetap)' : ' (cicilan)'), type: 'check' })).concat([{ k: 'dueDay', label: 'Tanggal jatuh tempo sementara (1–31, ubah nanti per item)', type: 'number', req: true }]), { dueDay: 20 }, (v) => {
      const d = +v.dueDay; if (!(d >= 1 && d <= 31)) return 'Tanggal harus 1–31.';
      let n = 0; items.forEach((x, i) => { if (v['b' + i]) { n++; C.put(store, 'bill', { name: x.name, kind: x.kind, amountEst: 0, dueDay: d }); } });
      if (!n) return 'Centang minimal satu.';
      commit(); toast(n + ' item ditambahkan; isi nominal & tanggal asli lewat ketuk namanya');
    }, null, modeOf() ? '' : 'Pilih mode di Profil saya agar daftar sesuai kebutuhan Anda.');
  }
  // ---------- template cepat untuk semua modul (centang, tambah; semuanya bisa diubah lagi) ----------
  function pickTemplates(title, items, labelFn, makeFn, note, extraFields, extraInit) {
    const fields = items.map((t, i) => ({ k: 't' + i, label: labelFn(t), type: 'check' })).concat(extraFields || []);
    openForm(title, fields, extraInit || {}, (v) => {
      let n = 0; const err = items.reduce((e, t, i) => { if (e || !v['t' + i]) return e; n++; const r = makeFn(t, v); return typeof r === 'string' ? r : e; }, '');
      if (err) return err;
      if (!n) return 'Centang minimal satu.';
      commit(); toast(n + ' ditambahkan. Ketuk item untuk mengisi data aslinya.');
    }, null, note);
  }
  const DOC_CATS = [['personal', '👤 Personal'], ['aset', '🏠 Properti, kendaraan & asuransi'], ['karier', '🎓 Pendidikan & karier'], ['lain', '📄 Lainnya']];
  const DOC_CAT_NAME = { personal: 'Personal', aset: 'Properti/Aset', karier: 'Pendidikan/Karier', lain: 'Lainnya' };
  const TPL = {
    veh: [{ name: 'Motor', kind: 'motor' }, { name: 'Mobil', kind: 'mobil' }, { name: 'Motor listrik (EV)', kind: 'motor_ev' }, { name: 'Mobil listrik (EV)', kind: 'mobil_ev' }],
    asset: [['Kulkas', 'Elektronik'], ['Mesin cuci', 'Elektronik'], ['AC', 'Elektronik'], ['TV', 'Elektronik'], ['Laptop', 'Elektronik'], ['HP keluarga', 'Elektronik'], ['Rice cooker', 'Elektronik'], ['Dispenser air', 'Elektronik'], ['Water heater', 'Elektronik'], ['Kompor', 'Elektronik'], ['Sofa', 'Perabot'], ['Kasur', 'Perabot'], ['Lemari', 'Perabot'], ['Meja makan', 'Perabot'], ['Atap/genteng', 'Bangunan'], ['Pagar', 'Bangunan']],
    inv: [['Beras', 'kg', 2], ['Gas LPG 3 kg', 'tabung', 1], ['Galon air minum', 'galon', 1], ['Minyak goreng', 'liter', 1], ['Telur', 'kg', 1], ['Gula', 'kg', 1], ['Garam', 'bungkus', 1], ['Sabun mandi', 'pcs', 2], ['Sabun cuci piring', 'pcs', 1], ['Deterjen', 'pcs', 1], ['Tisu', 'pak', 2], ['Obat P3K (plester, antiseptik)', 'set', 1], ['Obat demam', 'strip', 1], ['Lampu cadangan', 'pcs', 1]],
    contact: [['Polisi', 'Darurat', '110', true], ['Ambulans', 'Darurat', '118', true], ['Pemadam kebakaran', 'Darurat', '113', true], ['SAR / Basarnas', 'Darurat', '115', true], ['Nomor darurat umum', 'Darurat', '112', true], ['PLN (gangguan listrik)', 'Layanan', '123', false], ['Ketua RT', 'Lingkungan', '', false], ['Satpam / keamanan', 'Lingkungan', '', false], ['Tukang listrik', 'Tukang', '', false], ['Tukang ledeng', 'Tukang', '', false], ['Tukang AC', 'Tukang', '', false], ['Dokter keluarga', 'Kesehatan', '', false], ['Bengkel langganan', 'Kendaraan', '', false], ['Sekolah anak', 'Keluarga', '', false]],
    doc: [['Kartu Keluarga (KK)', 'personal'], ['KTP', 'personal'], ['NPWP', 'personal'], ['Akta Kelahiran', 'personal'], ['Akta Nikah', 'personal'], ['Akta Cerai', 'personal'], ['SIM A', 'personal'], ['SIM C', 'personal'], ['BPJS Kesehatan', 'personal'], ['BPJS Ketenagakerjaan', 'personal'], ['Paspor', 'personal'],
      ['Sertifikat tanah / rumah (SHM/HGB)', 'aset'], ['PBB (bukti bayar tahunan)', 'aset'], ['BPKB kendaraan', 'aset'], ['STNK kendaraan', 'aset'], ['Polis asuransi kesehatan', 'aset'], ['Polis asuransi jiwa', 'aset'], ['Polis asuransi properti', 'aset'], ['Polis asuransi kendaraan', 'aset'],
      ['Ijazah', 'karier'], ['Transkrip nilai', 'karier'], ['Sertifikat keahlian / pelatihan', 'karier'], ['Kontrak kerja', 'karier'], ['Surat wasiat / dokumen waris', 'lain']],
    acc: [['Dompet tunai', 'kas'], ['BCA', 'bank'], ['Mandiri', 'bank'], ['BRI', 'bank'], ['BNI', 'bank'], ['SeaBank', 'bank'], ['Jago', 'bank'], ['Dana darurat (rekening terpisah)', 'bank', true], ['GoPay', 'ewallet'], ['OVO', 'ewallet'], ['DANA', 'ewallet'], ['ShopeePay', 'ewallet'], ['Kartu kredit', 'kartu'], ['Investasi (saham/reksa dana)', 'invest']],
    habit: ['Olahraga 30 menit', 'Baca buku', 'Tidur sebelum jam 10 malam', 'Jalan pagi', 'Tanpa gula/minuman manis', 'Tulis syukur hari ini', 'Waktu berkualitas dengan keluarga'],
    task: [['Belanja bulanan', 'monthly', 'Rumah'], ['Bersih-bersih rumah', 'weekly', 'Rumah'], ['Ganti sprei', 'weekly', 'Rumah'], ['Cek tabung gas & galon', 'monthly', 'Rumah'], ['Review keuangan bulanan', 'monthly', 'Pribadi'], ['Laporan kerja mingguan', 'weekly', 'Pekerjaan'], ['Backup data penting', 'monthly', 'Pribadi'], ['Telepon orang tua', 'weekly', 'Keluarga']],
  };
  const tplForms = {
    veh() {
      pickTemplates('Tambah kendaraan', TPL.veh, (t) => t.name + ' (lengkap dengan jadwal servis standar)', (t) => {
        const v = C.put(store, 'veh', { name: t.name, kind: t.kind, plate: '', odometer: '' });
        vehPlansFor(t.kind).forEach((tp) => C.put(store, 'plan', { name: tp.name, group: 'kendaraan', every: tp.every, unit: tp.unit, nextDue: C.planNext(tp, C.today()), vehicleId: v.id, kmEvery: tp.kmEvery || 0, nextKm: 0, cost: 0 }));
      }, 'Isi plat, odometer, pajak, dan STNK dengan mengetuk nama kendaraan. Jadwal servis ikut dibuat dari hari ini dengan interval umum; sesuaikan dengan buku servis kendaraan Anda (ketuk Ubah di tiap jadwal).');
    },
    asset() { pickTemplates('Pilih aset', TPL.asset, (t) => t[0] + ' · ' + t[1], (t) => C.put(store, 'asset', { name: t[0], cat: t[1], price: 0 }), 'Isi tanggal beli, harga, dan garansi setelahnya.'); },
    inv() { pickTemplates('Pilih barang stok', TPL.inv, (t) => t[0] + ' (min ' + t[2] + ' ' + t[1] + ')', (t) => C.put(store, 'inv', { name: t[0], qty: 0, unit: t[1], min: t[2] }), 'Jumlah awal 0; atur stok sebenarnya dengan tombol + / −.'); },
    contact() { pickTemplates('Pilih kontak', TPL.contact, (t) => t[0] + (t[2] ? ' · ' + t[2] : ''), (t) => C.put(store, 'contact', { name: t[0], role: t[1], phone: t[2], emergency: t[3] }), 'Nomor darurat Indonesia sudah terisi. Kontak tanpa nomor: isi sendiri.'); },
    doc() { pickTemplates('Pilih dokumen', TPL.doc, (t) => '[' + DOC_CAT_NAME[t[1]] + '] ' + t[0], (t) => C.put(store, 'doc', { title: t[0], cat: t[1], expiry: '', place: '', notes: '', num: '' }), 'Isi nomor, lokasi simpan, dan masa berlaku setelah ditambahkan (ketuk dokumennya).'); },
    acc() { pickTemplates('Pilih akun', TPL.acc, (t) => t[0], (t) => C.put(store, 'acc', { name: t[0], type: t[1], opening: 0, emergency: !!t[2] }), 'Saldo awal 0. Ketuk akun untuk mengisi saldo sebenarnya.'); },
    habit() { pickTemplates('Pilih kebiasaan', TPL.habit, (t) => t, (t) => C.put(store, 'habit', { name: t, log: [] })); },
    task() { pickTemplates('Pilih tugas berulang', TPL.task, (t) => t[0] + ' · ' + (t[1] === 'weekly' ? 'tiap minggu' : 'tiap bulan'), (t, v) => { C.put(store, 'task', { title: t[0], due: C.today(), repeat: t[1], label: t[2], anchorDay: C.parseD(C.today()).getDate(), done: false, prio: '0' }); }, 'Tenggat pertama hari ini; ubah lewat ketuk tugas.'); },
    budget() {
      pickTemplates('Pilih kategori anggaran', optNames('exp').filter((x) => !/^(Lainnya|Kewajiban tetap|Cicilan)$/.test(x)), (t) => t, (t, v) => { const n = C.parseAmount(v.limit); if (n == null || n <= 0) return 'Batas harus bilangan bulat rupiah > 0.'; C.put(store, 'budget', { cat: t, limit: n }); }, 'Batas sama untuk semua yang dicentang; ubah per kategori setelahnya.', [{ k: 'limit', label: 'Batas per bulan (Rp)', type: 'amount', req: true }], { limit: '500.000' });
    },
  };
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
    if (vOn() && !vOpen()) return vPrompt(() => docForm(d.id ? get('doc', d.id) : d));
    const sec = docSecret(d.id ? d : null);
    openForm(d.id ? 'Ubah dokumen' : 'Dokumen penting', [
      { k: 'title', label: 'Nama dokumen', req: true, list: TPL.doc.map((t) => t[0]) },
      { k: 'cat', label: 'Kelompok', type: 'select', opts: DOC_CATS.map((c) => [c[0], c[1]]) },
      { k: 'num', label: 'Nomor dokumen (opsional)' },
      { k: 'photo', label: '📷 Foto / scan dokumen (opsional)', type: 'photo' },
      { k: 'expiry', label: 'Berlaku sampai / kedaluwarsa', type: 'date' }, { k: 'place', label: 'Disimpan di mana (laci, brankas, folder…)' }, { k: 'notes', label: 'Catatan', type: 'textarea' },
    ], { title: d.title, cat: d.cat || 'personal', num: sec.num, expiry: d.expiry, place: sec.place, notes: sec.notes }, (v) => {
      const base = { id: d.id, title: v.title, cat: v.cat, expiry: v.expiry }, secret = { num: v.num, notes: v.notes, place: v.place };
      if (!vOn()) { const rec = C.put(store, 'doc', Object.assign(base, secret)); commit(); if (v.photo) saveDocPhoto(rec, v.photo); return; }
      if (!VAULT.key) return 'Dokumen terkunci lagi. Tutup, buka dengan password, lalu ulangi.';
      const rec = C.put(store, 'doc', Object.assign(base, { num: '', notes: '', place: '' }));
      Vault.seal(VAULT.key, secret).then((sc) => { C.put(store, 'doc', { id: rec.id, sec: sc }); VAULT.cache.docs[rec.id] = secret; commit(); if (v.photo) saveDocPhoto(rec, v.photo); });
    },
    d.id ? [{ label: 'Hapus dokumen', fn: () => { list('pfile').filter((f) => f.docId === d.id).forEach((f) => { IDB.del(f.id); C.remove(store, f.id); }); C.remove(store, d.id); commit(); } }] : null,
    vOn() ? '🔐 Nomor, lokasi, catatan, dan foto dokumen ini disimpan terenkripsi.' : 'Ketuk 📷 Ambil foto untuk memotret dokumen, atau 🖼️ Galeri. Foto tersimpan hanya di HP ini. Disarankan atur password dulu di Lainnya → Kunci dokumen penting.');
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
  // Tag hubungan. Nilai lama (Pasangan, Pacar, Tunangan, Orang tua, Mertua, atau isian bebas) tetap valid dan tidak diubah.
  const REL_TAGS = ['Ayah', 'Ibu', 'Suami', 'Istri', 'Anak', 'Saudara', 'Kakek', 'Nenek', 'Kerabat', 'Lainnya', 'Selingkuhan'];
  const REL_LEGACY = ['Pasangan', 'Pacar', 'Tunangan', 'Orang tua', 'Mertua'];
  const REL = REL_TAGS.concat(REL_LEGACY);
  const relOpts = (cur) => REL.concat(cur && !REL.includes(cur) ? [cur] : []).map((x) => [x, x]);
  const ID_KINDS = ['KTP', 'KK', 'NPWP', 'SIM', 'Paspor', 'BPJS Kesehatan', 'BPJS Ketenagakerjaan', 'Akta lahir', 'Lainnya'];
  const FILE_LABELS = ['KTP', 'KK', 'NPWP', 'SIM', 'Paspor', 'Akta lahir', 'Foto', 'Lainnya'];
  const RT_EMOJI = ['💧', '💊', '🏃', '👀', '💌', '📖', '🧘', '🍎', '😴', '⭐'];
  const T = (g, emoji, name, target, unit, from, to, everyMin, days) => ({ g, emoji, name, target, unit, from, to: to || '', everyMin: everyMin || 0, days: days || [] });
  const WK = [1, 2, 3, 4, 5];
  const RT_TEMPLATES = [
    T('Kesehatan', '💧', 'Minum air 2 liter', 8, 'gelas (250 ml)', '08:00', '20:00', 60),
    T('Kesehatan', '💊', 'Vitamin / obat pagi', 1, 'kali', '07:00'),
    T('Kesehatan', '🏃', 'Olahraga ringan 30 menit', 1, 'sesi', '17:00'),
    T('Kesehatan', '🚶', 'Jalan kaki / senam pagi', 1, 'sesi', '05:30'),
    T('Kesehatan', '⚖️', 'Timbang berat badan', 1, 'kali', '06:30'),
    T('Kesehatan', '😴', 'Bersiap tidur (HP dimatikan)', 1, 'kali', '21:30'),
    T('Ibu & rumah', '🍳', 'Siapkan sarapan keluarga', 1, 'kali', '05:30'),
    T('Ibu & rumah', '🎒', 'Antar anak sekolah', 1, 'kali', '06:30', '', 0, WK),
    T('Ibu & rumah', '🛒', 'Belanja sayur / ke pasar', 1, 'kali', '07:00', '', 0, [1, 2, 3, 4, 5, 6]),
    T('Ibu & rumah', '🍲', 'Masak makan siang', 1, 'kali', '10:30'),
    T('Ibu & rumah', '🧺', 'Cuci & setrika pakaian', 1, 'kali', '09:00'),
    T('Ibu & rumah', '🧹', 'Bersih-bersih rumah', 1, 'kali', '08:00'),
    T('Ibu & rumah', '🚸', 'Jemput anak sekolah', 1, 'kali', '12:30', '', 0, WK),
    T('Ibu & rumah', '🧸', 'Main bareng anak', 1, 'sesi', '16:30'),
    T('Ibu & rumah', '📚', 'Temani anak belajar', 1, 'sesi', '19:00'),
    T('Ibu & rumah', '📝', 'Cek PR & tas sekolah anak', 1, 'kali', '20:00', '', 0, WK),
    T('Ibu & rumah', '📖', 'Baca cerita sebelum tidur', 1, 'sesi', '20:30'),
    T('Ibu & rumah', '👕', 'Siapkan seragam & bekal besok', 1, 'kali', '21:00', '', 0, [0, 1, 2, 3, 4]),
    T('Ibu & rumah', '🍽️', 'Beres dapur & cuci piring malam', 1, 'kali', '20:30'),
    T('Keluarga', '💌', 'Kabari keluarga', 1, 'kabar', '12:30'),
    T('Keluarga', '💑', 'Ngobrol berdua tanpa HP', 1, 'sesi', '21:00'),
    T('Keluarga', '👵', 'Telepon orang tua', 1, 'kali', '18:30', '', 0, [0, 6]),
    T('Kerja', '📧', 'Cek email & pesan kerja', 1, 'kali', '08:30', '', 0, WK),
    T('Kerja', '🎯', 'Tentukan 3 prioritas hari ini', 1, 'kali', '08:00', '', 0, WK),
    T('Kerja', '👀', 'Istirahat mata & regangkan badan', 6, 'kali', '09:00', '16:00', 60, WK),
    T('Kerja', '✅', 'Tutup hari kerja & catat besok', 1, 'kali', '17:00', '', 0, WK),
    T('Pribadi', '📖', 'Baca buku 15 menit', 1, 'sesi', '20:30'),
    T('Pribadi', '🙏', 'Tulis 3 hal yang disyukuri', 1, 'kali', '21:00'),
    T('Pribadi', '💰', 'Catat pengeluaran hari ini', 1, 'kali', '20:00'),
  ];
  // Draf kabar: bahasa sehari-hari yang hangat (bukan baku). {nama}=panggilan penerima, {saya}=nama Anda, {sebutan}=sebutan Anda untuk anak.
  const DRAFTS = {
    pasangan: [
      ['Pagi', 'Pagi sayang ❤️ Udah bangun belum? Semoga hari ini lancar ya. Jangan lupa sarapan, aku sayang kamu.'],
      ['Pagi', 'Selamat pagi, {nama}. Semalem mimpiin aku nggak? 😄 Semangat ya hari ini, aku di sini terus buat kamu.'],
      ['Siang', 'Udah makan siang belum, sayang? Jangan telat makan ya, nanti sakit. Aku khawatir loh.'],
      ['Siang', 'Lagi ngapain, {nama}? Tiba-tiba kepikiran kamu, jadi pengen nyapa aja. Muach 😘'],
      ['Sore', 'Aku udah otw pulang ya yang. Mau dibawain apa? Bilang aja, nanti aku mampir.'],
      ['Sore', 'Bentar lagi sampai rumah nih. Siap-siap ya, aku bawa kangen seharian 😁'],
      ['Malam', 'Selamat tidur sayang. Makasih ya buat hari ini. Mimpi indah, besok kita ketemu lagi ❤️'],
      ['Malam', 'Capek ya hari ini? Istirahat gih, biar aku yang beresin sisanya. Sini peluk dulu 🤗'],
      ['Malam', 'Malam ini ngobrol berdua yuk, tanpa HP. Aku kangen dengerin cerita kamu.'],
      ['Kangen', 'Kangen banget sama kamu. Pengen cepet-cepet pulang terus peluk kamu erat-erat.'],
      ['Kangen', 'Hari ini rasanya lama banget nggak ketemu kamu. Aku kangen, sayang.'],
      ['Kangen', 'Tiap lihat hal lucu, aku pasti langsung kepikiran kamu. Kamu tuh bikin hariku lengkap.'],
      ['Maaf', 'Maaf ya yang, tadi aku kebawa emosi. Aku nggak bermaksud nyakitin kamu. Kita ngobrol baik-baik yuk, aku sayang kamu.'],
      ['Maaf', 'Maaf hari ini aku pulang telat lagi. Makasih ya udah sabar nungguin aku. Besok aku ganti waktunya buat kamu ❤️'],
      ['Terima kasih', 'Makasih ya sayang udah ngurusin rumah dan keluarga kita dengan sabar. Aku bersyukur banget punya kamu.'],
      ['Terima kasih', 'Makasih udah selalu ada, pas aku lagi seneng maupun lagi capek. Buat aku, kamu itu rumah.'],
      ['Semangat', 'Semangat ya sayang! Kamu hebat banget, aku bangga sama kamu. Kalau capek, inget ada aku di sini.'],
      ['Semangat', 'Apa pun yang terjadi hari ini, kita hadapi bareng ya. Aku selalu di pihak kamu.'],
      ['Kabar', 'Hari ini aku lagi padet banget, tapi kamu tetap yang pertama kuingat. Nanti aku telepon ya begitu longgar ❤️'],
      ['Kabar', 'Aku baik-baik aja ya, jangan khawatir. Kamu sama anak-anak di rumah gimana?'],
      ['Romantis', 'Aku jatuh cinta sama kamu lagi hari ini. Nggak tau kenapa, tapi rasanya masih sama kayak dulu.'],
      ['Romantis', 'Makasih udah milih aku jadi teman hidup kamu. Aku janji bakal terus berusaha jadi yang terbaik buat kamu.'],
      ['Romantis', 'Weekend ini kita jalan berdua yuk, kayak pacaran dulu. Kamu yang pilih tempatnya, aku yang traktir 😘'],
      ['Spesial', 'Selamat ulang tahun, sayangku! 🎂 Semoga panjang umur, sehat terus, dan semua mimpimu kesampaian. Aku sayang kamu banget.'],
      ['Spesial', 'Selamat anniversary, yang! Makasih udah bertahan dan tumbuh bareng aku sampai sekarang. Cintaku nggak pernah berkurang ❤️'],
    ],
    anak: [
      ['Pagi', 'Pagi, {nama}! {sebutan} sayang kamu. Semangat sekolahnya ya, jangan lupa sarapan sama bawa bekal.'],
      ['Siang', 'Udah makan belum, nak? Minum air putih yang banyak ya. {sebutan} kangen nih.'],
      ['Siang', 'Hari ini sekolahnya gimana? Nanti cerita ya ke {sebutan}, pengen denger semuanya.'],
      ['Semangat', '{nama}, {sebutan} bangga banget sama usaha kamu hari ini, apa pun hasilnya. Kamu hebat!'],
      ['Semangat', 'Semangat ya ujiannya! Yang penting udah belajar dan berdoa. Tenang aja, {sebutan} percaya sama kamu 💪'],
      ['Malam', '{sebutan} pulang agak telat ya. PR-nya dikerjain dulu, terus sikat gigi sebelum tidur ya sayang.'],
      ['Malam', 'Selamat tidur, {nama}. Mimpi indah ya. {sebutan} sayang kamu banget, besok kita main lagi.'],
      ['Maaf', 'Maaf ya nak, tadi {sebutan} sempat marah. {sebutan} sayang banget sama {nama}. Peluk dulu yuk 🤗'],
      ['Ajak', 'Weekend ini mau ke mana, {nama}? Kamu yang pilih, kita jalan bareng sekeluarga ya.'],
      ['Spesial', 'Selamat ulang tahun, {nama}! 🎉 Makin pinter, makin baik, makin sehat ya. {sebutan} sayang kamu selalu.'],
    ],
    ortu: [
      ['Kabar', 'Apa kabar, {nama}? Semoga sehat-sehat terus ya. Aku kangen, nanti malam aku telepon ya.'],
      ['Kabar', 'Kami di sini sehat semua kok, {nama}, jangan khawatir. Salam dari kami semua, cucu-cucunya juga kangen.'],
      ['Perhatian', '{nama} udah makan sama minum obat belum? Jaga kesehatan ya, kalau butuh apa-apa kabarin aku.'],
      ['Terima kasih', 'Makasih ya {nama} udah selalu doain dan sayang sama kami. Aku nggak bakal lupa semuanya.'],
      ['Ajak', 'Minggu ini aku mau mampir ya. {nama} mau dibawain apa? Bilang aja.'],
      ['Spesial', 'Selamat ulang tahun, {nama}. Semoga sehat, panjang umur, dan selalu bahagia. Aku sayang {nama}.'],
    ],
    umum: [
      ['Kabar', 'Halo {nama}, apa kabar? Udah lama kita nggak ngobrol, semoga sehat dan lancar terus ya.'],
      ['Terima kasih', 'Makasih banyak ya {nama} bantuannya. Berarti banget buat aku.'],
      ['Ajak', 'Kapan-kapan ketemuan yuk, {nama}. Aku kangen ngobrol.'],
      ['Spesial', 'Selamat ulang tahun, {nama}! Sehat terus dan makin sukses ya 🎉'],
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
  const relGroup = (rel) => (['Istri', 'Suami', 'Pasangan'].includes(rel) ? 'pasangan' : rel === 'Anak' ? 'anak' : ['Orang tua', 'Mertua', 'Ayah', 'Ibu', 'Kakek', 'Nenek'].includes(rel) ? 'ortu' : 'umum');
  const fillT = (s, p) => String(s).replace(/\{nama\}/g, p ? (p.nick || p.name) : 'kamu').replace(/\{saya\}/g, ownerName() || 'aku').replace(/\{sebutan\}/g, profile().callKid || 'Papa');
  const safePhoto = (s) => (typeof s === 'string' && /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(s) ? s : '');
  const avHTML = (p, cls) => (safePhoto(p.photo) ? `<img class="av ${cls || ''}" src="${safePhoto(p.photo)}" alt="">` : `<span class="av ${cls || ''}" aria-hidden="true">${esc((p.name || '?').trim().charAt(0).toUpperCase())}</span>`);

  function profilForm() {
    const p = profile();
    openForm('Profil saya', [
      { k: 'name', label: 'Nama lengkap', req: true }, { k: 'nick', label: 'Nama panggilan (dipakai di sapaan)' }, { k: 'birth', label: 'Tanggal lahir saya (muncul di kalender)', type: 'date' },
      { k: 'callKid', label: 'Sebutan Anda untuk anak (mis. Papa, Ayah, Bunda)' },
      { k: 'mode', label: 'Saya adalah… (menentukan kategori, tujuan, dan target keuangan)', type: 'select', opts: [['', '— pilih —']].concat(MODES) },
      { k: 'sex', label: 'Jenis kelamin (untuk fitur berat badan)', type: 'select', opts: [['', '— pilih —'], ['L', 'Laki-laki'], ['P', 'Perempuan']] }, { k: 'height', label: 'Tinggi badan (cm)', type: 'dec', ph: 'mis. 165' },
    ], { name: p.name, nick: p.nick, birth: p.birth || '', callKid: p.callKid || '', sex: p.sex || '', height: p.height || '', mode: p.mode || '' }, (v) => { const h = parseDec(v.height); if (v.height && (!h || h < 80 || h > 250)) return 'Tinggi badan harus antara 80–250 cm.'; C.put(store, 'profile', { id: 'profile', name: v.name, nick: v.nick, birth: v.birth, callKid: v.callKid, sex: v.sex, height: h || '', mode: v.mode }); commit(); toast('Profil disimpan'); },
    null, 'Nama ini dipakai untuk sapaan "Selamat pagi, …" dan draf kabar. Tersimpan di perangkat Anda (dan di Drive bila sinkron aktif).');
  }

  // --- berat badan & IMT ---
  const parseDec = (x) => { const n = parseFloat(String(x == null ? '' : x).replace(',', '.')); return isFinite(n) ? n : 0; };
  const fmtKg = (n) => String(Math.round(n * 10) / 10).replace('.', ',');
  function wtForm(w) {
    const p = profile();
    openForm(w ? 'Ubah berat badan' : 'Catat berat badan', [
      { k: 'date', label: 'Tanggal', type: 'date', req: true }, { k: 'kg', label: 'Berat badan (kg)', type: 'dec', ph: 'mis. 62,5', req: true },
      { k: 'waist', label: 'Lingkar perut (cm, opsional)', type: 'dec', ph: 'diukur di sejajar pusar' },
    ], w ? { date: w.date, kg: String(w.kg).replace('.', ','), waist: w.waist || '' } : { date: C.today(), kg: '', waist: '' }, (v) => {
      const kg = parseDec(v.kg), wa = parseDec(v.waist);
      if (!(kg >= 20 && kg <= 300)) return 'Berat badan harus antara 20–300 kg.';
      if (v.waist && !(wa >= 30 && wa <= 250)) return 'Lingkar perut harus antara 30–250 cm.';
      if (v.date > C.today()) return 'Tanggal tidak boleh di masa depan.';
      C.put(store, 'wt', { id: 'wt|' + v.date, date: v.date, kg: Math.round(kg * 10) / 10, waist: wa || '' });
      if (w && w.date !== v.date) C.remove(store, w.id);
      commit(); toast('Tercatat');
    }, w ? [{ label: 'Hapus catatan', fn: () => { C.remove(store, w.id); commit(); } }] : null, p.height ? '' : 'Isi tinggi badan & jenis kelamin di Profil saya agar IMT dihitung.');
  }
  function weightChart(ser, hr) {
    if (ser.length < 2) return '<div class="empty">Catat minimal 2 kali untuk melihat grafik.</div>';
    const pts = ser.slice(-60), W = 320, H = 170, L = 34, R = 10, T = 10, B = 24;
    let lo = Math.min.apply(null, pts.map((p) => p.kg)), hi = Math.max.apply(null, pts.map((p) => p.kg));
    if (hr) { lo = Math.min(lo, hr.min); hi = Math.max(hi, hr.max); }
    lo = Math.floor(lo - 1); hi = Math.ceil(hi + 1);
    const t0 = C.parseD(pts[0].date).getTime(), t1 = C.parseD(pts[pts.length - 1].date).getTime() || t0 + 1;
    const X = (d) => L + (t1 === t0 ? 0 : (C.parseD(d).getTime() - t0) / (t1 - t0)) * (W - L - R), Y = (k) => T + (1 - (k - lo) / (hi - lo)) * (H - T - B);
    let g = '';
    for (let i = 0; i <= 3; i++) { const v = lo + (hi - lo) * i / 3; g += `<line x1="${L}" x2="${W - R}" y1="${Y(v)}" y2="${Y(v)}" stroke="#e4e4e7" stroke-width="1"/><text x="${L - 4}" y="${Y(v) + 3}" font-size="9" text-anchor="end" fill="#71717a">${Math.round(v)}</text>`; }
    const band = hr ? `<rect x="${L}" y="${Y(hr.max)}" width="${W - L - R}" height="${Math.max(2, Y(hr.min) - Y(hr.max))}" fill="#10b981" opacity=".13"/>` : '';
    const line = pts.map((p) => X(p.date).toFixed(1) + ',' + Y(p.kg).toFixed(1)).join(' ');
    const dots = pts.length <= 40 ? pts.map((p) => `<circle cx="${X(p.date).toFixed(1)}" cy="${Y(p.kg).toFixed(1)}" r="2.8" fill="#2563eb"/>`).join('') : '';
    const fd = (d) => d.slice(8) + '/' + d.slice(5, 7);
    return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Grafik berat badan ${fd(pts[0].date)} sampai ${fd(pts[pts.length - 1].date)}" style="width:100%;height:auto">${band}${g}<polyline points="${line}" fill="none" stroke="#2563eb" stroke-width="2" stroke-linejoin="round"/>${dots}<text x="${L}" y="${H - 6}" font-size="9" fill="#71717a">${fd(pts[0].date)}</text><text x="${W - R}" y="${H - 6}" font-size="9" text-anchor="end" fill="#71717a">${fd(pts[pts.length - 1].date)}</text></svg>${hr ? '<div class="s" style="text-align:center">Pita hijau = rentang berat normal untuk tinggi Anda</div>' : ''}`;
  }
  // Saran umum berdasarkan kategori IMT Kemenkes + pedoman aktivitas fisik WHO 2020. Bukan diagnosis.
  function weightAdvice(cat, rate) {
    const act = '<li><b>Aktivitas fisik</b> (WHO 2020, dewasa 18–64 th): 150–300 menit/minggu intensitas sedang (jalan cepat, bersepeda santai, senam) atau 75–150 menit intensitas berat, ditambah latihan penguat otot (angkat beban ringan, push-up, squat) minimal 2 hari/minggu. Mulai dari sedikit lalu naikkan bertahap; bergerak sedikit tetap lebih baik daripada tidak sama sekali.</li>';
    if (cat.key === 'normal') return `<ul>${act}<li>Pertahankan: makan beragam (sayur, buah, protein, biji-bijian), cukup tidur, dan timbang rutin untuk memantau tren, bukan angka harian.</li></ul>`;
    if (cat.key === 'gemuk' || cat.key === 'obesitas') return `<ul>${act}<li><b>Target turun</b>: pelan dan stabil sekitar 0,5–1 kg per minggu (bukan lebih cepat). Fokus pada porsi, kurangi minuman manis, gorengan, dan makanan olahan; perbanyak sayur, buah, dan protein.</li><li>Timbang di waktu yang sama (mis. pagi setelah buang air); lihat tren mingguan, naik-turun harian itu wajar.</li>${cat.key === 'obesitas' ? '<li><b>Disarankan konsultasi ke dokter/puskesmas atau ahli gizi</b> untuk rencana yang aman, terutama bila ada diabetes, hipertensi, sakit sendi, atau Anda sedang hamil/menyusui.</li>' : ''}</ul>`;
    return `<ul><li>IMT di bawah normal. <b>Disarankan periksa ke dokter atau ahli gizi</b> untuk memastikan penyebabnya (pola makan, penyakit, stres).</li><li>Tambah asupan bergizi bertahap: porsi kecil tapi sering, sumber protein (telur, ikan, tempe, tahu, daging), dan karbohidrat kompleks.</li>${act.replace('Aktivitas fisik', 'Latihan penguat otot membantu menambah massa otot; aktivitas fisik')}</ul>`;
  }
  const WT_SRC = '<details class="hlp"><summary>📚 Sumber & catatan</summary><div class="hb"><ul><li>Klasifikasi IMT Indonesia: Kemenkes RI (P2PTM, 2018): &lt;17 sangat kurus, 17–18,4 kurus, 18,5–25 normal, 25,1–27 gemuk, &gt;27 obesitas. Lingkar perut berisiko: pria ≥ 90 cm, wanita ≥ 80 cm.</li><li>Aktivitas fisik: WHO Guidelines on Physical Activity and Sedentary Behaviour (2020).</li><li>Batas WHO global memakai &ge;25 (overweight) dan &ge;30 (obesitas); untuk populasi Asia-Pasifik WHO/IASO/IOTF memakai &ge;23 sebagai berisiko dan &ge;25 sebagai obesitas I, sehingga hasil bisa sedikit berbeda antar acuan.</li><li>IMT hanya untuk dewasa ≥ 18 th. Tidak membedakan otot dan lemak (atlet, lansia, ibu hamil bisa tidak tepat). Anak/remaja dinilai dengan kurva pertumbuhan (posyandu/dokter).</li><li><b>Ini informasi umum, bukan diagnosis.</b> Konsultasikan ke tenaga kesehatan sebelum mengubah pola makan/olahraga secara drastis.</li></ul></div></details>';
  function weightPage() {
    const p = profile(), t = C.today(), logs = list('wt'), ser = C.weightSeries(logs), last = ser[ser.length - 1];
    const age = p.birth ? C.ageOn(p.birth, t) : null, ready = p.sex && p.height;
    let h = '';
    if (!ready) h += '<div class="card pad" data-a="profilEdit" style="cursor:pointer"><div class="t">📏 Lengkapi profil dulu</div><div class="s">Isi jenis kelamin dan tinggi badan (dan tanggal lahir) di Profil saya agar IMT dihitung. Ketuk di sini.</div></div>';
    if (age != null && age < 18) h += '<div class="card pad"><div class="t">👶 Di bawah 18 tahun</div><div class="s">IMT dewasa tidak cocok untuk anak/remaja. Gunakan kurva pertumbuhan di buku KIA/posyandu atau tanyakan ke dokter. Grafik berat tetap bisa dicatat.</div></div>';
    const hr = p.height ? C.healthyRange(p.height) : null;
    if (last && p.height && (age == null || age >= 18)) {
      const b = C.bmi(last.kg, p.height), cat = C.bmiCategory(b), rate = C.weeklyRate(ser, t, 28);
      const lw = logs.filter((x) => x.waist).sort((a, c) => C.cmp(c.date, a.date))[0], wr = lw ? C.waistRisk(p.sex, lw.waist) : null;
      h += `<div class="card hero pad"><div class="s">IMT terakhir (${fmtDate(last.date)})</div><div class="big">${String(b).replace('.', ',')} · ${esc(cat.label)}</div><div class="s">Berat ${fmtKg(last.kg)} kg · tinggi ${esc(p.height)} cm${hr ? ' · rentang normal ' + fmtKg(hr.min) + '–' + fmtKg(hr.max) + ' kg' : ''}</div>${rate != null ? `<div class="s">Tren 4 minggu: ${rate > 0 ? '+' : ''}${fmtKg(rate)} kg/minggu</div>` : ''}${wr != null ? `<div class="s">Lingkar perut ${fmtKg(lw.waist)} cm: ${wr ? '⚠️ di atas batas berisiko (obesitas sentral)' : '✓ di bawah batas berisiko'}</div>` : ''}</div>`;
      if (rate != null && cat.key !== 'kurus' && cat.key !== 'sangat-kurus' && Math.abs(rate) > 1) h += '<div class="card pad"><div class="t">⚠️ Perubahan terlalu cepat</div><div class="s">Berat berubah lebih dari 1 kg per minggu. Bila tidak disengaja, periksakan ke dokter; bila sengaja, perlambat agar aman.</div></div>';
      h += `<h2>Saran untuk Anda</h2><div class="card pad hlpl">${weightAdvice(cat, rate)}</div>`;
    }
    h += `<h2>Grafik</h2><div class="card pad">${weightChart(ser, hr)}</div>`;
    h += '<button class="btn full" data-a="wtAdd">+ Catat berat hari ini</button><div style="height:10px"></div>';
    h += `<h2>Riwayat</h2><div class="card">${ser.length ? logs.slice().sort((a, c) => C.cmp(c.date, a.date)).slice(0, 60).map((x) => `<div class="row" data-a="wtEdit" data-id="${x.id}" style="cursor:pointer"><div class="grow"><div class="t">${fmtKg(x.kg)} kg</div><div class="s">${fmtDate(x.date)}${x.waist ? ' · perut ' + fmtKg(x.waist) + ' cm' : ''}${p.height ? ' · IMT ' + String(C.bmi(x.kg, p.height)).replace('.', ',') : ''}</div></div><span class="chev">›</span></div>`).join('') : '<div class="empty">Belum ada catatan.<br>Timbang pagi hari, lalu catat di sini.</div>'}</div>`;
    return { title: 'Berat badan', sub: ser.length + ' catatan', html: h + WT_SRC, add: () => wtForm() };
  }

  // --- rutinitas ---
  const DAYSETS = [['all', 'Setiap hari'], ['work', 'Senin–Jumat'], ['weekend', 'Sabtu–Minggu']];
  const daySetOf = (d) => (!d || !d.length ? 'all' : d.length === 5 && d.indexOf(1) >= 0 && d.indexOf(0) < 0 ? 'work' : 'weekend');
  const daysFromSet = (k) => (k === 'work' ? [1, 2, 3, 4, 5] : k === 'weekend' ? [0, 6] : []);
  function downloadText(name, text, type) {
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: type || 'text/plain' })); a.download = name;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }
  // ---------- kunci dokumen penting: enkripsi nyata (vault.js = WebCrypto PBKDF2 + AES-GCM) ----------
  // Yang dienkripsi: nomor/catatan/lokasi dokumen, nomor identitas anggota, foto scan dokumen & brankas.
  // Judul dokumen & tanggal berlaku TIDAK dienkripsi agar pengingat tetap jalan (di Beranda/kalender judulnya disamarkan).
  const VAULT = { key: null, cache: { docs: {}, ids: {}, bills: {} }, hiddenAt: 0, fails: 0, until: 0 };
  const AUTOLOCK_MS = 120000;
  const vMeta = () => { const m = store.rec.vault; return m && !m._d ? m : null; };
  const vOn = () => !!vMeta(), vOpen = () => !!VAULT.key;
  const docSecret = (d) => (!d ? {} : d.sec ? (VAULT.cache.docs[d.id] || {}) : { num: d.num || '', notes: d.notes || '', place: d.place || '' });
  const idsOf = (p) => (p.idsSec ? (VAULT.cache.ids[p.id] || []) : (p.ids || []));
  const lockCard = (what) => `<div class="card pad" style="text-align:center"><div style="font-size:2rem">🔒</div><div class="t">${esc(what)} terkunci</div><div class="s">Masukkan password untuk melihat atau menyalin.</div><button class="btn full" data-a="vUnlock" style="margin-top:10px">🔓 Buka dengan password</button></div>`;
  async function vLoadCache() {
    const c = { docs: {}, ids: {}, bills: {} };
    for (const d of list('doc')) if (d.sec) { const o = await Vault.open(VAULT.key, d.sec); if (o) c.docs[d.id] = o; }
    for (const p of list('person')) if (p.idsSec) { const o = await Vault.open(VAULT.key, p.idsSec); if (o) c.ids[p.id] = o; }
    for (const b of list('bill')) if (b.refSec) { const o = await Vault.open(VAULT.key, b.refSec); if (o) c.bills[b.id] = o.ref || ''; }
    VAULT.cache = c;
  }
  function vLock(msg) { VAULT.key = null; VAULT.cache = { docs: {}, ids: {}, bills: {} }; ui.reveal = {}; closeDlg(); render(); if (msg !== false) toast(msg || '🔒 Dokumen terkunci'); }
  // jalankan `then` setelah brankas terbuka (langsung bila kunci belum diaktifkan)
  function vGate(then) { if (!vOn() || vOpen()) return then(); vPrompt(then); }
  function vPrompt(then) {
    const wait = VAULT.until - Date.now();
    if (wait > 0) return toast('Terlalu banyak percobaan. Coba lagi ' + Math.ceil(wait / 1000) + ' detik.');
    openForm('🔒 Buka dokumen penting', [{ k: 'pw', label: 'Password', req: true, type: 'password' }], {}, (v) => {
      toast('Memeriksa password…');
      Vault.unlock(vMeta(), v.pw).then(async (key) => {
        if (!key) { VAULT.fails++; if (VAULT.fails >= 5) VAULT.until = Date.now() + Math.min(300, 15 * Math.pow(2, VAULT.fails - 5)) * 1000; toast('Password salah'); return vPrompt(then); }
        VAULT.fails = 0; VAULT.key = key; await vLoadCache(); toast('🔓 Terbuka · terkunci lagi otomatis 2 menit setelah aplikasi ditinggalkan'); render(); if (then) then();
      });
    }, [{ label: 'Lupa password? Pakai kode pemulihan', fn: () => { closeDlg(); vRecoveryPrompt(then); return false; } }], 'Nomor, catatan, dan foto dokumen terkunci. Terkunci lagi otomatis 2 menit setelah aplikasi ditinggalkan.');
  }
  function vRecoveryPrompt(then) {
    openForm('Pulihkan dengan kode', [{ k: 'code', label: 'Kode pemulihan (25 karakter)', req: true }, { k: 'pw', label: 'Password baru', type: 'password', req: true }, { k: 'pw2', label: 'Ulangi password baru', type: 'password', req: true }], {}, (v) => {
      if (v.pw !== v.pw2) return 'Password baru tidak sama.';
      const st = Vault.strength(v.pw); if (!st.ok) return st.msg;
      toast('Memeriksa kode…');
      Vault.setPassword(vMeta(), 'rec', v.code, v.pw).then(async (r) => {
        if (!r) { toast('Kode pemulihan salah'); return vRecoveryPrompt(then); }
        C.put(store, 'vault', Object.assign({ id: 'vault' }, r.meta)); VAULT.key = r.key; await vLoadCache(); commit(); toast('Password diganti & dokumen terbuka'); if (then) then();
      });
    }, null, 'Masukkan kode pemulihan yang Anda simpan saat mengatur kunci, lalu buat password baru.');
  }
  function vShowRecovery(code) {
    dlg.innerHTML = `<div class="menu"><h3>🔑 Kode pemulihan Anda</h3><p class="note" style="margin:0">Ini <b>satu-satunya cara</b> membuka dokumen bila Anda lupa password. Tulis di kertas atau simpan di tempat aman <b>di luar HP ini</b>. Kode tidak akan ditampilkan lagi.</p><div class="card pad" style="text-align:center;font-family:monospace;font-size:1.1rem;letter-spacing:1px;user-select:all;word-break:break-all">${esc(code)}</div><button class="btn alt" data-i="c">Salin kode</button><label class="f c" style="margin:8px 0"><input type="checkbox" id="rcok"> Saya sudah menyimpannya di tempat aman</label><button class="btn" data-i="ok">Selesai</button></div>`;
    dlg.oncancel = (e) => e.preventDefault();
    dlg.querySelector('.menu').addEventListener('click', async (e) => {
      const i = e.target.dataset && e.target.dataset.i; if (!i) return;
      if (i === 'c') { try { await navigator.clipboard.writeText(code); toast('Kode disalin — tempel ke tempat aman lalu hapus dari papan klip'); } catch (x) { toast('Salin manual dari layar'); } return; }
      if (!dlg.querySelector('#rcok').checked) return toast('Centang dulu bahwa kode sudah Anda simpan');
      dlg.oncancel = null; closeDlg(); toast('🔐 Dokumen penting kini terenkripsi'); render();
    });
    dlg.showModal();
  }
  function vSetupForm() {
    openForm('🔐 Atur password dokumen penting', [{ k: 'pw', label: 'Password', type: 'password', req: true }, { k: 'pw2', label: 'Ulangi password', type: 'password', req: true }], {}, (v) => {
      if (v.pw !== v.pw2) return 'Password tidak sama.';
      const st = Vault.strength(v.pw); if (!st.ok) return st.msg;
      toast('Mengenkripsi… tunggu sebentar');
      (async () => {
        try {
          const r = await Vault.setup(v.pw); C.put(store, 'vault', Object.assign({ id: 'vault' }, r.meta)); VAULT.key = r.key;
          const n = await vMigrate(true); await vLoadCache(); commit(); vShowRecovery(r.recovery); if (n) toast(n + ' data dienkripsi');
        } catch (e) { toast('Gagal mengatur kunci: ' + e.message); }
      })();
    }, null, 'Password ini diminta setiap membuka dokumen penting. Pakai kalimat panjang yang mudah diingat (mis. 4 kata acak). Password TIDAK bisa dilihat atau dipulihkan siapa pun; cadangannya hanya kode pemulihan yang ditampilkan setelah ini.');
  }
  // enkripsi (toEnc=true) atau buka kembali (false) semua data dokumen/identitas yang sudah ada
  async function vMigrate(toEnc) {
    const key = VAULT.key; let n = 0;
    for (const d of list('doc')) {
      if (toEnc && !d.sec) { const sec = await Vault.seal(key, { num: d.num || '', notes: d.notes || '', place: d.place || '' }); C.put(store, 'doc', { id: d.id, sec, num: '', notes: '', place: '' }); n++; }
      else if (!toEnc && d.sec) { const o = await Vault.open(key, d.sec); if (o) { C.put(store, 'doc', { id: d.id, sec: '', num: o.num || '', notes: o.notes || '', place: o.place || '' }); n++; } }
    }
    for (const p of list('person')) {
      if (toEnc && !p.idsSec && (p.ids || []).length) { const idsSec = await Vault.seal(key, p.ids); C.put(store, 'person', { id: p.id, idsSec, ids: [] }); n++; }
      else if (!toEnc && p.idsSec) { const o = await Vault.open(key, p.idsSec); if (o) { C.put(store, 'person', { id: p.id, idsSec: '', ids: o }); n++; } }
    }
    for (const b of list('bill')) {
      if (toEnc && !b.refSec && b.ref) { const refSec = await Vault.seal(key, { ref: b.ref }); C.put(store, 'bill', { id: b.id, refSec, ref: '' }); n++; }
      else if (!toEnc && b.refSec) { const o = await Vault.open(key, b.refSec); if (o) { C.put(store, 'bill', { id: b.id, refSec: '', ref: o.ref || '' }); n++; } }
    }
    for (const f of list('pfile').filter((x) => x.docId || x.personId)) {
      let blob = null; try { blob = await IDB.get(f.id); } catch (e) { /* lewati */ }
      if (!blob) continue;
      if (toEnc && !f.enc) { const c = await Vault.sealBytes(key, new Uint8Array(await blob.arrayBuffer())); await IDB.put(f.id, new Blob([c], { type: 'application/octet-stream' })); C.put(store, 'pfile', { id: f.id, enc: 1, mime: blob.type || 'image/jpeg' }); n++; }
      else if (!toEnc && f.enc) { const u = await Vault.openBytes(key, new Uint8Array(await blob.arrayBuffer())); if (u) { await IDB.put(f.id, new Blob([u], { type: f.mime || 'image/jpeg' })); C.put(store, 'pfile', { id: f.id, enc: 0 }); n++; } }
    }
    return n;
  }
  function vChangeForm() {
    openForm('Ganti password', [{ k: 'old', label: 'Password sekarang', type: 'password', req: true }, { k: 'pw', label: 'Password baru', type: 'password', req: true }, { k: 'pw2', label: 'Ulangi password baru', type: 'password', req: true }], {}, (v) => {
      if (v.pw !== v.pw2) return 'Password baru tidak sama.';
      const st = Vault.strength(v.pw); if (!st.ok) return st.msg;
      toast('Memeriksa…');
      Vault.setPassword(vMeta(), 'pw', v.old, v.pw).then(async (r) => { if (!r) return toast('Password sekarang salah'); C.put(store, 'vault', Object.assign({ id: 'vault' }, r.meta)); VAULT.key = r.key; await vLoadCache(); commit(); toast('Password diganti'); });
    }, null, 'Data tidak perlu dienkripsi ulang; kode pemulihan lama tetap berlaku.');
  }
  function vNewRecoveryForm() {
    openForm('Buat kode pemulihan baru', [{ k: 'pw', label: 'Password sekarang', type: 'password', req: true }], {}, (v) => {
      toast('Memeriksa…');
      Vault.newRecovery(vMeta(), v.pw).then((r) => { if (!r) return toast('Password salah'); C.put(store, 'vault', Object.assign({ id: 'vault' }, r.meta)); commit(); vShowRecovery(r.recovery); });
    }, null, 'Kode pemulihan LAMA tidak berlaku lagi setelah ini.');
  }
  function vOff() {
    vGate(() => confirmBox('Matikan kunci? Semua nomor, catatan, dan foto dokumen akan disimpan POLOS lagi di HP ini.', async () => {
      try { toast('Membuka enkripsi…'); await vMigrate(false); C.remove(store, 'vault'); VAULT.key = null; VAULT.cache = { docs: {}, ids: {}, bills: {} }; commit(); toast('Kunci dimatikan'); } catch (e) { toast('Gagal: ' + e.message); }
    }));
  }
  // kunci otomatis 2 menit setelah aplikasi ditinggalkan (tab disembunyikan / pindah aplikasi)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') VAULT.hiddenAt = Date.now();
    else { if (vOpen() && VAULT.hiddenAt && Date.now() - VAULT.hiddenAt > AUTOLOCK_MS) vLock(); VAULT.hiddenAt = 0; }
  });
  // hasil ekspor: tawarkan Unduh atau Bagikan (menu = ketukan baru, jadi izin berbagi tetap sah)
  function deliverFile(name, bytes, mime) {
    const blob = new Blob([bytes], { type: mime }), file = new File([blob], name, { type: mime });
    const items = [{ label: '⬇️ Unduh ke HP', fn: () => { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); toast('Mengunduh ' + name); } }];
    if (navigator.canShare && navigator.canShare({ files: [file] })) items.push({ label: '📤 Bagikan (WhatsApp, email, Drive…)', fn: () => navigator.share({ files: [file], title: name }).catch(() => { /* dibatalkan */ }) });
    openMenu('✅ ' + name + ' siap (' + Math.max(1, Math.round(bytes.length / 1024)) + ' KB)', items);
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
    openForm('Pilih rutinitas', RT_TEMPLATES.map((t, i) => ({ k: 't' + i, label: '[' + t.g + '] ' + t.emoji + ' ' + t.name + ' · ' + t.from + (t.everyMin ? '–' + t.to + ' tiap ' + (t.everyMin >= 60 ? t.everyMin / 60 + ' jam' : t.everyMin + ' mnt') : '') , type: 'check' })), {}, (v) => {
      let n = 0;
      RT_TEMPLATES.forEach((t, i) => { if (v['t' + i]) { n++; const o = Object.assign({}, t); delete o.g; C.put(store, 'rt', o); } });
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
      { k: 'rel', label: 'Hubungan dengan Anda', type: 'select', opts: relOpts(p.rel) },
      { k: 'birth', label: 'Tanggal lahir', type: 'date' }, { k: 'phone', label: 'Nomor WhatsApp / telepon', type: 'tel' }, { k: 'notes', label: 'Catatan', type: 'textarea' },
    ], { name: p.name, nick: p.nick, rel: p.rel || 'Anak', birth: p.birth, phone: p.phone, notes: p.notes }, (v) => {
      C.put(store, 'person', { id: p.id, name: v.name, nick: v.nick, rel: v.rel, birth: v.birth, phone: v.phone, notes: v.notes, ids: vOn() ? [] : (p.ids || []), photo: p.photo || '' }); commit();
    }, p.id ? [{ label: 'Hapus anggota & berkasnya', fn: () => {
      list('pfile').filter((f) => f.personId === p.id).forEach((f) => { IDB.del(f.id); C.remove(store, f.id); });
      C.remove(store, p.id); ui.stack = []; commit();
    } }] : null);
  }
  function idForm(p, i) {
    const all = idsOf(p), cur = i != null ? (all[i] || {}) : {};
    const save = (ids) => {
      if (!vOn()) { C.put(store, 'person', { id: p.id, ids }); commit(); return; }
      if (!VAULT.key) return toast('Dokumen terkunci lagi. Buka dengan password, lalu ulangi.');
      Vault.seal(VAULT.key, ids).then((idsSec) => { C.put(store, 'person', { id: p.id, idsSec, ids: [] }); VAULT.cache.ids[p.id] = ids; commit(); });
    };
    openForm(i != null ? 'Ubah data identitas' : 'Tambah data identitas', [
      { k: 'kind', label: 'Jenis', req: true, list: ID_KINDS }, { k: 'no', label: 'Nomor', req: true }, { k: 'exp', label: 'Berlaku sampai (bila ada)', type: 'date' }, { k: 'note', label: 'Catatan' },
    ], { kind: cur.kind, no: cur.no, exp: cur.exp, note: cur.note }, (v) => {
      const ids = all.slice(); const e = { kind: v.kind, no: v.no, exp: v.exp, note: v.note };
      if (i != null) ids[i] = e; else ids.push(e);
      save(ids);
    }, i != null ? [{ label: 'Hapus data ini', fn: () => { const ids = all.slice(); ids.splice(i, 1); save(ids); } }] : null,
    vOn() ? '🔐 Disimpan terenkripsi dan hanya terlihat setelah password dimasukkan. Jangan simpan PIN atau kata sandi di sini.' : 'Nomor disimpan polos (belum terenkripsi) dan tersembunyi di layar sampai Anda ketuk Tampilkan. Atur password di Lainnya → Kunci dokumen penting agar terenkripsi.');
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
  // cam=true -> langsung buka kamera belakang (Android/iOS); false -> galeri/berkas
  function pickImage(cb, cam) {
    const i = document.createElement('input'); i.type = 'file'; i.accept = 'image/*'; if (cam) i.setAttribute('capture', 'environment');
    i.onchange = () => { if (i.files && i.files[0]) cb(i.files[0]); };
    i.click();
  }
  // pilihan sumber foto: kamera langsung atau galeri
  function photoSource(title, cb) {
    openMenu(title, [{ label: '📷 Ambil foto (kamera)', fn: () => pickImage(cb, true) }, { label: '🖼️ Pilih dari galeri / berkas', fn: () => pickImage(cb, false) }]);
  }
  // simpan foto sebagai lampiran dokumen (blob di IndexedDB, metadata di rekaman pfile)
  async function saveDocPhoto(doc, file) {
    let blob; try { blob = await resizeBlob(file, 1600, 0.78); } catch (e) { return toast(e.message); }
    const enc = vOn(); let store1 = blob, meta = { personId: '', docId: doc.id, label: doc.title, size: blob.size };
    if (enc) {
      if (!VAULT.key) return toast('Dokumen terkunci. Buka dulu dengan password, lalu ulangi.');
      store1 = new Blob([await Vault.sealBytes(VAULT.key, new Uint8Array(await blob.arrayBuffer()))], { type: 'application/octet-stream' }); meta = Object.assign(meta, { enc: 1, mime: blob.type || 'image/jpeg' });
    }
    const rec = C.put(store, 'pfile', meta);
    IDB.put(rec.id, store1).then(() => { commit(); toast(enc ? 'Foto tersimpan (terenkripsi) di HP ini' : 'Foto tersimpan di HP ini'); }).catch(() => { C.remove(store, rec.id); commit(); toast('Gagal menyimpan foto (penyimpanan penuh/dibatasi)'); });
  }
  async function viewFile(f) {
    let blob = null; try { blob = await IDB.get(f.id); } catch (e) { /* abaikan */ }
    if (!blob) return toast('Berkas ini tersimpan di perangkat lain / belum ada di sini');
    if (f.enc) {
      if (!VAULT.key) return vPrompt(() => viewFile(f));
      const u = await Vault.openBytes(VAULT.key, new Uint8Array(await blob.arrayBuffer()));
      if (!u) return toast('Foto tidak bisa dibuka (rusak atau kunci berbeda)');
      blob = new Blob([u], { type: f.mime || 'image/jpeg' });
    }
    const url = URL.createObjectURL(blob);
    dlg.innerHTML = `<div class="menu"><h3>${esc(f.label)}</h3><img src="${url}" alt="${esc(f.label)}" style="width:100%;border-radius:12px"><button class="btn" data-i="sh">Kirim / bagikan</button><button class="btn alt" data-i="s">Simpan ke galeri/unduhan</button><button class="btn bad sm" data-i="d">Hapus berkas</button><button class="btn alt sm" data-i="x">Tutup</button></div>`;
    dlg.querySelector('.menu').addEventListener('click', (e) => {
      const i = e.target.dataset && e.target.dataset.i; if (!i) return;
      if (i === 's') { const a = document.createElement('a'); a.href = url; a.download = (f.label || 'berkas') + '.jpg'; document.body.appendChild(a); a.click(); a.remove(); return; }
      if (i === 'sh') {
        const file = new File([blob], (f.label || 'berkas') + '.jpg', { type: blob.type || 'image/jpeg' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) navigator.share({ files: [file], title: f.label }).catch(() => {}); else toast('Perangkat ini belum mendukung kirim langsung; pakai Simpan lalu kirim dari galeri.');
        return;
      }
      if (i === 'd') { IDB.del(f.id); C.remove(store, f.id); if (f.txId && get('tx', f.txId)) C.put(store, 'tx', { id: f.txId, proof: '' }); commit(); }
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
  const EV_REMIND = [['', 'Tanpa pengingat'], ['0', 'Tepat waktu'], ['10', '10 menit sebelumnya'], ['30', '30 menit sebelumnya'], ['60', '1 jam sebelumnya'], ['180', '3 jam sebelumnya'], ['1440', '1 hari sebelumnya'], ['4320', '3 hari sebelumnya'], ['10080', '1 minggu sebelumnya']];
  const EV_NOTE = 'Pengingat gaya Google Calendar: pilih berapa lama sebelum acara (boleh dua). Acara tanpa jam dihitung dari pukul 08.00 hari H. Berbunyi saat aplikasi terbuka; agar bunyi saat HP terkunci, ekspor .ics di Lainnya → Notifikasi.';
  function icsItems() {
    const t = C.today(), out = [], RR = { daily: 'FREQ=DAILY', weekly: 'FREQ=WEEKLY', monthly: 'FREQ=MONTHLY', yearly: 'FREQ=YEARLY' };
    list('rt').filter((r) => !r.paused).forEach((r) => C.routineICS(r, C.addDays(t, 1)).forEach((x) => out.push(x)));
    list('task').filter((x) => !x.done && x.due && x.due >= t && x.time && x.remind !== '' && x.remind != null).forEach((x) => out.push({ uid: x.id, title: x.title, date: x.due, time: x.time, rrule: RR[x.repeat], alarmMin: +x.remind || 0 }));
    list('event').forEach((e) => { const al = C.remindList(e), timed = !!(e.time && !e.allDay); if (!timed && !al.length) return; out.push({ uid: e.id, title: (C.isBirthdayTitle(e.title) ? '🎂 ' : '') + e.title, date: e.date, time: e.time, allDay: !timed, rrule: RR[e.repeat], alarms: al.length ? al : [0] }); });
    return out;
  }
  function waLink(phone, text) { const n = C.waNumber(phone); return 'https://wa.me/' + (n || '') + '?text=' + encodeURIComponent(text); }
  function afDrafts(p) {
    const g = relGroup(p.rel), custom = list('draft').filter((d) => d.grp === g).map((d) => ({ text: d.text, id: d.id, cat: 'Punyaku' }));
    return DRAFTS[g].map((x) => ({ cat: x[0], text: x[1] })).concat(custom);
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
    return `<div class="row" data-a="evEdit" data-id="${o.ev.id}" data-occ="${o.date}"><div style="min-width:58px;color:var(--acc);font-weight:700">${o.ev.allDay || !o.ev.time ? 'Seharian' : esc(o.ev.time)}</div><div class="grow"><div class="t">${C.isBirthdayTitle(o.ev.title) ? '🎂 ' : ''}${esc(o.ev.title)}${o.ev.repeat && o.ev.repeat !== 'none' ? ' ↻' : ''}</div>${o.ev.notes ? `<div class="s">${esc(o.ev.notes)}</div>` : ''}</div></div>`;
  }
  const seg = (key, items, cur) => `<div class="seg" role="tablist">${items.map((i) => `<button class="${cur === i[0] ? 'on' : ''}" data-a="set" data-k="${key}" data-v="${i[0]}" role="tab" aria-selected="${cur === i[0]}">${i[1]}</button>`).join('')}</div>`;
const APP_VERSION = '0.5.8', APP_DATE = '15 Nov 2026';
  const ABOUT_HTML = '<div class="card pad" style="text-align:center"><div class="t">Rumahku <span class="bd">v' + APP_VERSION + '</span></div><div class="s">Dibuat oleh <b>Illusix</b> · versi ' + APP_VERSION + ' (' + APP_DATE + '). Aplikasi ini <b>gratis</b> dan <b>dilarang diperjualbelikan</b> dalam bentuk apa pun.</div><div class="s" style="margin-top:6px">Saran &amp; masukan: <a href="mailto:trintoro@gmail.com?subject=Masukan%20Rumahku">trintoro@gmail.com</a></div></div>';
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
    return `<div class="card pc ${st.lvl === 'late' ? 'late' : ''}"><div class="pt" data-a="planOpen" data-id="${p.id}" style="cursor:pointer">${ic(g[2], g[1])}<div class="grow"><div class="t">${esc(p.name)}</div><div class="s">rutin ${esc(planInterval(p))}${showVeh && v ? ' · ' + esc(v.name) : ''}${p.lastDone ? ' · terakhir ' + fmtDate(p.lastDone) : ''}</div></div></div><div class="pa"><span class="bd ${st.lvl === 'ok' ? '' : st.lvl}">${esc(st.text)}</span><span class="inl" style="gap:8px"><button class="btn alt sm" data-a="planEdit" data-id="${p.id}" aria-label="Ubah jadwal ${esc(p.name)}">✎ Ubah</button><button class="btn sm" data-a="planDone" data-id="${p.id}">✓ Selesai</button></span></div></div>`;
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
    C.calendarItems(store, t, C.addDays(t, 8)).filter((x) => x.kind === 'birthday').forEach((x) => rows.push(['c6', '🎂', esc(x.title) + (x.date === t ? ' hari ini' : ' — ' + C.daysBetween(t, x.date) + ' hari lagi'), 'tab:cal']));
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
    let h = `<div class="card" style="padding:0;overflow:hidden">${HOUSE_SVG}</div>${modeOf() ? '' : '<div class="card pad" data-a="profilEdit" style="cursor:pointer"><div class="t">🧭 Pilih mode Anda</div><div class="s">Pelajar, pekerja, atau berkeluarga: kategori, target, dan tujuan keuangan menyesuaikan. Ketuk untuk memilih.</div></div>'}${ownerName() ? '' : '<div class="card pad" data-a="profilEdit" style="cursor:pointer"><div class="t">👋 Siapa nama Anda?</div><div class="s">Ketuk untuk mengisi, supaya sapaan jadi personal.</div></div>'}<div class="card hero pad" data-a="tab" data-v="money" style="cursor:pointer"><div class="s">Kekayaan bersih</div><div class="big">${accs.length ? rp(nw) : 'Mulai catat uang'}</div><div class="s">${accs.length ? 'Bulan ini +' + rp(rep.income) + ' · −' + rp(rep.expense) : 'Ketuk untuk menambah akun pertama'}</div></div>`;
    if (!list('rt').length) h += '<div class="card pad" data-a="nav" data-to="harian" style="cursor:pointer"><div class="t">💧 Atur target minum air &amp; rutinitas harian</div><div class="s">Ketuk, lalu pilih template "Minum air 2 liter" (8 gelas, diingatkan tiap jam).</div></div>';
    if (rts.length) h += `<h2>Rutinitas hari ini</h2>${rts.slice(0, 4).map((r) => rtCard(r)).join('')}${rts.length > 4 ? `<button class="btn alt full" data-a="nav" data-to="harian">Lihat semua (${rts.length})</button>` : ''}`;
    h += `<h2>Hari ini</h2><div class="card">${items.length ? items.map((r) => `<div class="hr" data-a="nav" data-to="${r[3]}">${ic(r[0], r[1])}<div class="grow t" style="font-weight:600">${r[2]}</div><span class="chev">›</span></div>`).join('') : '<div class="empty">Belum ada yang perlu diperhatikan. Mulai dengan tombol + atau isi data contoh di Lainnya → Bantuan.</div>'}</div>`;
    if (tasks.length) h += `<h2>Agenda tugas</h2><div class="card">${tasks.map((x) => taskRow(x, t)).join('')}</div>`;
    h += `<h2>Menu</h2><div class="tiles">${[['🛠️', 'Rumah', 'tab:rumah'], ['🔧', 'Perawatan', 'perawatan'], ['🧾', 'Tagihan', 'tagihan'], ['🚗', 'Kendaraan', 'kendaraan'], ['🛒', 'Belanja', 'stok'], ['✅', 'Tugas', 'tugas'], ['📓', 'Jurnal', 'jurnal'], ['🌱', 'Kebiasaan', 'habit'], ['💧', 'Rutinitas', 'harian'], ['👨‍👩‍👧', 'Keluarga', 'keluarga'], ['💌', 'Kabar & afeksi', 'afeksi'], ['🔔', 'Notifikasi', 'notif']].map((m) => `<div class="tile" data-a="nav" data-to="${m[2]}" role="button" tabindex="0"><span class="em">${m[0]}</span>${m[1]}</div>`).join('')}</div>`;
    return { title: greet, sub: DAYS[d.getDay()] + ', ' + d.getDate() + ' ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear() + ' · v' + APP_VERSION, html: h + '<p class="note" style="text-align:center">Rumahku v' + APP_VERSION + ' · Dibuat oleh Illusix</p>' };
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
    const items = C.calendarItems(store, ym + '-01', next), by = {};
    items.forEach((x) => { (by[x.date] = by[x.date] || []).push(x); });
    const dotCls = { event: '', task: 't', birthday: 'b' }, dk = (x) => (x.bday ? 'birthday' : x.kind);
    let cells = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].map((x, i) => `<div class="h ${i >= 5 ? 'wkd' : ''}">${x}</div>`).join('');
    for (let i = 0; i < lead; i++) cells += '<div class="day off"></div>';
    for (let d = 1; d <= nDays; d++) {
      const ds = ym + '-' + String(d).padStart(2, '0'), kinds = Array.from(new Set((by[ds] || []).map((x) => (dk(x) in dotCls ? dk(x) : 'other')))).slice(0, 4);
      cells += `<button class="day ${C.isWeekend(ds) ? 'wkd' : ''} ${ds === t ? 'today' : ''} ${ds === ui.calSel ? 'sel' : ''}" data-a="calSel" data-v="${ds}" aria-label="${fmtDate(ds)}">${d}<div class="dots">${kinds.map((k) => `<i class="${k === 'other' ? 'o' : dotCls[k]}"></i>`).join('')}</div></button>`;
    }
    let h = `<div class="inl" style="justify-content:space-between;align-items:center"><button class="btn alt sm" data-a="calPrev" aria-label="Bulan sebelumnya">‹</button><b>${ymLabel(ym)}</b><button class="btn alt sm" data-a="calNext" aria-label="Bulan berikutnya">›</button></div><div class="card pad"><div class="grid">${cells}</div></div><p class="note" style="margin:0 0 10px"><span class="lg"><i></i>acara</span> <span class="lg"><i class="t"></i>tugas</span> <span class="lg"><i class="b"></i>🎂 ulang tahun</span> <span class="lg"><i class="o"></i>tagihan, perawatan, pajak, garansi, dokumen</span></p>`;
    const sel = ui.calSel;
    const row = (x) => {
      if (x.kind === 'event') { const ev = get('event', x.id); return ev ? evRow({ ev, date: x.occ }) : ''; }
      if (x.kind === 'task') { const tk = get('task', x.id); return tk ? taskRow(tk, t) : ''; }
      return `<div class="row" data-a="nav" data-to="${x.go}" style="cursor:pointer">${ic(x.kind === 'birthday' ? 'c3' : 'c6', x.icon)}<div class="grow"><div class="t">${esc(x.title)}</div>${x.sub ? `<div class="s">${esc(x.sub)}</div>` : ''}</div><span class="chev">›</span></div>`;
    };
    if (sel) {
      const rows = (by[sel] || []).map(row).join('');
      h += `<h2>${fmtDate(sel)}</h2><div class="card">${rows || '<div class="empty">Kosong.</div>'}</div><button class="btn full" data-a="evAdd">+ Acara di tanggal ini</button>`;
    }
    // Agenda sebulan penuh di bawah kalender: yang sudah lewat dicoret (gaya daftar tugas)
    const nowD = new Date(), nowHM = C.fmtHM(nowD.getHours() * 60 + nowD.getMinutes());
    const isPast = (x) => x.date < t || (x.date === t && ((x.time && x.time < nowHM) || x.paid));
    const DS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    const agRow = (x) => {
      const past = isPast(x), act = x.kind === 'event' ? `data-a="evEdit" data-id="${x.id}" data-occ="${x.occ}"` : x.kind === 'task' ? 'data-a="nav" data-to="tugas"' : x.go ? `data-a="nav" data-to="${x.go}"` : `data-a="calSel" data-v="${x.date}"`;
      const sub = [x.time || (x.kind === 'event' ? 'Seharian' : ''), x.sub && x.sub !== x.time && x.sub !== 'Seharian' ? x.sub : '', past ? 'sudah lewat' : ''].filter(Boolean).map(esc).join(' · ');
      return `<div class="row ag ${past ? 'done' : ''} ${x.date === t ? 'tdy' : ''}" ${act} style="cursor:pointer"><div class="ag-d ${C.isWeekend(x.date) ? 'wkd' : ''}"><b>${+x.date.slice(8)}</b><span>${DS[C.parseD(x.date).getDay()]}</span></div><div class="grow"><div class="t">${x.icon} ${esc(x.title)}</div><div class="s">${sub}</div></div></div>`;
    };
    const left = items.filter((x) => !isPast(x)).length;
    h += `<h2>Agenda ${ymLabel(ym)}</h2><div class="card">${items.length ? items.map(agRow).join('') : '<div class="empty">Belum ada agenda bulan ini. Tambahkan ulang tahun, STNK, kontrol dokter, dll.</div>'}</div><p class="note" style="margin:6px 0 10px">${items.length} agenda · ${left} belum lewat. Yang sudah lewat dicoret.</p><button class="btn full" data-a="evAdd">+ Acara baru</button>`;
    return { title: 'Kalender', sub: '', html: h };
  }

  // ---------- grafik SVG (warna lewat variabel CSS --s1..--s8; teks selalu memakai token teks) ----------
  const SC = (i) => 'var(--s' + ((i % 8) + 1) + ')';
  const cj = (n) => { const a = Math.abs(n), sg = n < 0 ? '−' : ''; if (a >= 1e9) return sg + (a / 1e9).toFixed(1).replace('.', ',') + ' M'; if (a >= 1e6) return sg + (a / 1e6).toFixed(1).replace('.', ',') + ' jt'; if (a >= 1e3) return sg + Math.round(a / 1e3) + ' rb'; return sg + a; };
  const nice = (v) => { const p = Math.pow(10, Math.floor(Math.log10(v))), m = v / p; return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 5 ? 5 : 10) * p; };
  const pc = (n) => String(n).replace('.', ',') + '%';
  function donutSVG(slices, top, sub, aria) {
    const R = 68, W = 22, c = 2 * Math.PI * R; let off = 0;
    const segs = slices.map((s, i) => {
      const len = Math.max(0, (s.pct / 100) * c - (slices.length > 1 ? 2 : 0));
      const el = `<circle cx="100" cy="100" r="${R}" fill="none" style="stroke:${SC(i)}" stroke-width="${W}" stroke-dasharray="${len.toFixed(2)} ${(c - len).toFixed(2)}" stroke-dashoffset="${(-off).toFixed(2)}"><title>${esc(s.name)}: ${rp(s.amount)} (${pc(s.pct)})</title></circle>`;
      off += (s.pct / 100) * c; return el;
    }).join('');
    return `<svg viewBox="0 0 200 200" role="img" aria-label="${esc(aria)}" style="width:min(230px,68%);display:block;margin:4px auto 8px"><g transform="rotate(-90 100 100)"><circle cx="100" cy="100" r="${R}" fill="none" style="stroke:var(--line)" stroke-width="${W}"/>${segs}</g><text x="100" y="99" text-anchor="middle" font-size="22" font-weight="700" style="fill:var(--ink)">${esc(top)}</text><text x="100" y="118" text-anchor="middle" font-size="11" style="fill:var(--mute)">${esc(sub)}</text></svg>`;
  }
  const legendList = (slices, cls) => slices.map((s, i) => `<div class="row" style="min-height:44px;padding:8px 0"><span class="dot" style="background:${SC(i)}"></span><div class="grow t" style="font-weight:600">${esc(s.name)}</div><span class="s">${pc(s.pct)}</span><b class="${cls}" style="min-width:92px;text-align:right">${rp(s.amount)}</b></div>`).join('');
  function cumChart(cum, ym) {
    const n = cum.inc.length; if (!n) return '';
    const W = 320, H = 190, L = 40, R = 14, T = 16, B = 26, mx = Math.max(1, cum.inc[n - 1], cum.exp[n - 1]), yMax = nice(mx);
    const X = (i) => L + (n === 1 ? (W - L - R) / 2 : (i / (n - 1)) * (W - L - R)), Y = (v) => T + (1 - v / yMax) * (H - T - B);
    let g = ''; for (let k = 0; k <= 3; k++) { const v = (yMax * k) / 3; g += `<line x1="${L}" x2="${W - R}" y1="${Y(v).toFixed(1)}" y2="${Y(v).toFixed(1)}" style="stroke:var(--line)" stroke-width="1"/><text x="${L - 5}" y="${(Y(v) + 3).toFixed(1)}" font-size="9" text-anchor="end" style="fill:var(--mute)">${cj(v)}</text>`; }
    const pl = (arr, i) => `<polyline points="${arr.map((v, j) => X(j).toFixed(1) + ',' + Y(v).toFixed(1)).join(' ')}" fill="none" style="stroke:${SC(i)}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>`;
    const lastI = cum.inc[n - 1] >= cum.exp[n - 1];
    const end = (arr, i, above, label) => `<circle cx="${X(n - 1).toFixed(1)}" cy="${Y(arr[n - 1]).toFixed(1)}" r="4" style="fill:${SC(i)};stroke:var(--card)" stroke-width="2"/><text x="${(W - R).toFixed(1)}" y="${(Y(arr[n - 1]) + (above ? -9 : 15)).toFixed(1)}" font-size="10" font-weight="700" text-anchor="end" style="fill:var(--ink)">${label} ${cj(arr[n - 1])}</text>`;
    const hit = cum.inc.map((_, j) => { const w = (W - L - R) / n; return `<rect class="cz" data-a="chartDay" data-t="${esc('Tgl ' + (j + 1) + ' ' + MONTHS[+ym.slice(5, 7) - 1] + ' · Masuk ' + rp(cum.inc[j]) + ' · Keluar ' + rp(cum.exp[j]) + ' (akumulasi)')}" x="${(X(j) - w / 2).toFixed(1)}" y="${T}" width="${w.toFixed(1)}" height="${H - T - B}" fill="transparent"><title>Tgl ${j + 1}: Masuk ${rp(cum.inc[j])} · Keluar ${rp(cum.exp[j])}</title></rect>`; }).join('');
    const xl = [0, Math.floor((n - 1) / 2), n - 1].filter((v, i, a) => a.indexOf(v) === i).map((j) => `<text x="${X(j).toFixed(1)}" y="${H - 8}" font-size="9" text-anchor="${j === 0 ? 'start' : j === n - 1 ? 'end' : 'middle'}" style="fill:var(--mute)">${j + 1}</text>`).join('');
    return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Grafik akumulasi masuk dan keluar harian" style="width:100%;height:auto">${g}${pl(cum.inc, 0)}${pl(cum.exp, 1)}${end(cum.inc, 0, lastI, 'Masuk')}${end(cum.exp, 1, !lastI, 'Keluar')}${xl}${hit}</svg><div class="inl" style="gap:14px;margin-top:2px"><span class="s"><span class="dot" style="background:${SC(0)}"></span> Masuk</span><span class="s"><span class="dot" style="background:${SC(1)}"></span> Keluar</span><span class="s" style="margin-left:auto">akumulasi harian</span></div><div class="s" id="rd" style="min-height:20px;margin-top:4px">Ketuk grafik untuk melihat angka tiap hari.</div>`;
  }
  function nwBars(pts) {
    const W = 320, H = 160, L = 8, R = 8, T = 22, B = 22, vals = pts.map((p) => p.v), mx = Math.max(1, ...vals), mn = Math.min(0, ...vals), span = mx - mn || 1;
    const Y = (v) => T + (1 - (v - mn) / span) * (H - T - B), bw = Math.min(34, (W - L - R) / pts.length - 10), step = (W - L - R) / pts.length;
    return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Kekayaan bersih akhir bulan, ${pts.length} bulan terakhir" style="width:100%;height:auto"><line x1="${L}" x2="${W - R}" y1="${Y(0).toFixed(1)}" y2="${Y(0).toFixed(1)}" style="stroke:var(--line)"/>${pts.map((p, i) => { const x = L + step * i + (step - bw) / 2, y0 = Y(0), y1 = Y(p.v), top = Math.min(y0, y1), h = Math.max(2, Math.abs(y1 - y0)); return `<rect x="${x.toFixed(1)}" y="${top.toFixed(1)}" width="${bw.toFixed(1)}" height="${h.toFixed(1)}" rx="4" style="fill:${p.v < 0 ? SC(1) : SC(0)}"><title>${esc(p.label)}: ${rp(p.v)}</title></rect><text x="${(x + bw / 2).toFixed(1)}" y="${(top - 5).toFixed(1)}" font-size="9" text-anchor="middle" style="fill:var(--ink)">${cj(p.v)}</text><text x="${(x + bw / 2).toFixed(1)}" y="${H - 7}" font-size="9" text-anchor="middle" style="fill:var(--mute)">${esc(p.label)}</text>`; }).join('')}</svg>`;
  }

  // ---------- level kesehatan keuangan, tujuan, rekap ----------
  function healthInfo() {
    const accs = list('acc'), txs = list('tx'), cur = nowYM(), bal = C.balances(accs, txs);
    const flagged = accs.filter((a) => a.emergency), pool = flagged.length ? flagged : accs.filter((a) => a.type === 'kas' || a.type === 'bank' || a.type === 'ewallet');
    const emergency = pool.reduce((s, a) => s + Math.max(0, bal[a.id] || 0), 0);
    let avg = C.avgMonthly(txs, ymShift(cur, -1), 3); if (!avg.months) avg = C.avgMonthly(txs, cur, 1);
    const debtPay = list('bill').filter((b) => C.billLive(b) && b.kind === 'cicilan').reduce((s, b) => s + (b.amountEst || 0), 0);
    const r = C.healthLevel({ mode: modeOf() || 'pekerja', netWorth: C.netWorth(accs, txs), avgIncome: avg.income, avgExpense: avg.expense, emergency, debtPay, hasData: avg.months > 0 });
    return Object.assign(r, { flagged: flagged.length > 0, emergency, avg });
  }
  const LEVEL_DESC = (M) => [['Defisit aset', 'Utang lebih besar dari seluruh aset'], ['Boncos', 'Rata-rata pengeluaran lebih besar dari pemasukan'], ['Tipis', 'Dana darurat < ' + M[0] + ' bulan pengeluaran, atau cicilan > 30% pemasukan'], ['Ada bantalan', 'Dana darurat ≥ ' + M[0] + ' bulan pengeluaran'], ['Aman', 'Dana darurat ≥ ' + M[1] + ' bulan, menabung/investasi ≥ 10% pemasukan'], ['Bertumbuh', 'Dana darurat ≥ ' + M[2] + ' bulan, menabung/investasi ≥ 20% pemasukan']];
  function healthCard() {
    const h = healthInfo(), M = h.target, mode = modeOf();
    const seg6 = '<div class="lv">' + [0, 1, 2, 3, 4, 5].map((i) => `<i class="${h.level != null && i <= h.level ? 'on l' + h.level : ''}"></i>`).join('') + '</div>';
    const desc = LEVEL_DESC(M).map((d, i) => `<div class="kv"><span><b>${i}</b> · ${esc(d[0])}</span><span style="white-space:normal;text-align:right">${esc(d[1])}</span></div>`).join('');
    let b = `<div class="card pad"><div class="s">Level kesehatan keuangan</div>`;
    if (h.level == null) b += `<div class="big" style="font-size:1.2rem;font-weight:700">Belum cukup data</div>${seg6}<div class="s">Catat pemasukan & pengeluaran beberapa hari dulu.</div>`;
    else b += `<div class="big" style="font-size:1.35rem;font-weight:800">Level ${h.level} · ${esc(h.name)}</div>${seg6}<div class="s">${esc(h.why)}</div>${h.level < 5 ? `<div class="s" style="margin-top:4px">➜ <b>Berikutnya:</b> ${esc(h.next)}</div>` : `<div class="s" style="margin-top:4px">✓ ${esc(h.next)}</div>`}<div class="kv" style="margin-top:8px"><span>Dana darurat</span><b>${String(h.efMonths).replace('.', ',')} bulan pengeluaran</b></div><div class="kv"><span>Cicilan / pemasukan</span><b>${pc(h.debtRatio)}</b></div><div class="kv"><span>Ditabung / pemasukan</span><b>${pc(h.saveRate)}</b></div>`;
    b += `<details class="hlp" style="margin-top:8px"><summary>Cara menghitung & semua level</summary><div class="hb">${desc}<p class="note" style="margin:8px 0 0">Mode: <b>${esc((MODES.find((m) => m[0] === (mode || 'pekerja')) || [0, ''])[1])}</b>. Target dana darurat berbeda per mode (${M.join(' / ')} bulan). ${h.flagged ? 'Dana darurat = akun yang Anda tandai.' : 'Belum ada akun ditandai "dana darurat", jadi dihitung dari semua kas, bank, dan e-wallet. Tandai satu rekening agar lebih akurat.'} Rata-rata 3 bulan terakhir. Ini pedoman umum, bukan nasihat keuangan.${mode ? '' : ' <a href="#" data-a="profilEdit">Pilih mode di Profil</a> agar target sesuai.'}</p></div></details></div>`;
    return b;
  }
  const goalSaved = (g, bal) => (g.accId ? Math.max(0, (bal || C.balances(list('acc'), list('tx')))[g.accId] || 0) : 0) + list('gc').filter((x) => x.goalId === g.id).reduce((s, x) => s + (x.amount || 0), 0);
  function goalCard(g, bal) {
    const saved = goalSaved(g, bal), p = C.goalProgress(g, saved, C.today()), acc = g.accId ? get('acc', g.accId) : null;
    const badge = p.status === 'tercapai' ? '<span class="bd">Tercapai 🎉</span>' : p.status === 'terlambat' ? '<span class="bd late">Lewat tanggal</span>' : g.primary ? '<span class="bd">Utama</span>' : '<span class="bd" style="background:var(--line);color:var(--mute)">Sampingan</span>';
    return `<div class="card pad"><div class="inl" style="justify-content:space-between;align-items:flex-start"><div><div class="t">${esc(g.name)}</div><div class="s">${g.date ? 'Target ' + fmtDate(g.date) : 'Tanpa tanggal'}${acc ? ' · 🔗 ' + esc(acc.name) : ''}</div></div>${badge}</div><div class="pb"><i style="width:${p.pct}%"></i></div><div class="inl" style="justify-content:space-between"><b>${pc(p.pct)}</b><span class="s">${rp(saved)} / ${rp(g.target)}</span></div>${p.status === 'tercapai' ? '' : `<div class="s" style="margin-top:6px">Sisa <b>${rp(p.left)}</b>${p.perMonth ? ' · perlu <b>' + rp(p.perMonth) + '</b>/bulan · ' + p.months + ' bulan lagi' : ''}</div>`}<div class="btns" style="margin-top:10px"><button class="btn sm" data-a="goalDep" data-id="${g.id}">+ Setor</button><button class="btn alt sm" data-a="goalEdit" data-id="${g.id}">Ubah</button></div></div>`;
  }
  const GOAL_TPL = {
    pelajar: ['Laptop / HP baru', 'Dana darurat mini', 'Liburan', 'Biaya wisuda / KKN', 'Modal usaha kecil'],
    pekerja: ['Dana darurat 6 bulan', 'Dana nikah / lamaran', 'DP rumah', 'Kendaraan', 'Liburan', 'Dana pendidikan lanjutan', 'Investasi awal'],
    keluarga: ['Dana darurat keluarga', 'Pendidikan anak', 'Qurban', 'Renovasi rumah', 'Liburan keluarga', 'Dana pensiun', 'Ganti kendaraan'],
  };
  function goalForm(g, pre) {
    g = g || {}; pre = pre || {};
    const accs = [['', 'Tidak dikaitkan (setor manual)']].concat(accOpts());
    openForm(g.id ? 'Ubah tujuan' : 'Tujuan tabungan baru', [
      { k: 'name', label: 'Nama tujuan', req: true, list: GOAL_TPL[modeOf() || 'pekerja'] }, { k: 'target', label: 'Target (Rp)', type: 'amount', req: true },
      { k: 'date', label: 'Tanggal target (opsional)', type: 'date' }, { k: 'accId', label: 'Hitung dari saldo akun (opsional, mis. rekening tabungan khusus)', type: 'select', opts: accs },
      { k: 'primary', label: 'Tujuan utama', type: 'check' },
    ], { name: g.name || pre.name || '', target: g.target || '', date: g.date || '', accId: g.accId || '', primary: !!g.primary }, (v) => {
      const t = C.parseAmount(v.target); if (t == null || t <= 0) return 'Target harus bilangan bulat rupiah lebih dari 0.';
      C.put(store, 'goal', { id: g.id, name: v.name, target: t, date: v.date, accId: v.accId, primary: v.primary }); commit();
    }, g.id ? [{ label: 'Hapus tujuan', fn: () => { list('gc').filter((x) => x.goalId === g.id).forEach((x) => C.remove(store, x.id)); C.remove(store, g.id); commit(); } }] : null,
    'Dua cara menghitung terkumpul: setor manual lewat tombol + Setor, atau kaitkan ke satu akun sehingga saldonya otomatis ikut. Keduanya bisa dipakai bersamaan.');
  }
  function goalTplMenu() { openMenu('Pilih tujuan', GOAL_TPL[modeOf() || 'pekerja'].map((n) => ({ label: n, fn: () => goalForm(null, { name: n }) }))); }
  function goalDepForm(g) {
    openForm('Setor ke: ' + g.name, [{ k: 'amount', label: 'Jumlah (Rp)', type: 'amount', req: true }, { k: 'out', label: 'Ini penarikan (mengurangi)', type: 'check' }, { k: 'date', label: 'Tanggal', type: 'date', req: true }], { date: C.today() }, (v) => {
      const n = C.parseAmount(v.amount); if (n == null || n <= 0) return 'Jumlah harus bilangan bulat rupiah lebih dari 0.';
      C.put(store, 'gc', { goalId: g.id, amount: v.out ? -n : n, date: v.date }); commit(); toast(v.out ? 'Penarikan tercatat' : 'Setoran tercatat ✓');
    }, null, 'Setoran manual tidak memindahkan uang di akun. Untuk memindahkan uang sungguhan, catat Transfer antar akun lalu kaitkan tujuan ke akun tabungannya.');
  }
  const lastDay = (ym) => new Date(+ym.slice(0, 4), +ym.slice(5, 7), 0).getDate();
  function recapText(ym) {
    const txs = list('tx'), rep = C.monthReport(txs, ym), top = C.topSlices(rep.byCat, 5), h = healthInfo(), pend = billStates().filter((x) => ['terlambat', 'belum', 'sebagian'].includes(x.st.status)).map((x) => x.b);
    let t = `📊 Rekap keuangan ${ymLabel(ym)}${ownerName() ? ' — ' + ownerName() : ''}\n\nMasuk: ${rp(rep.income)}\nKeluar: ${rp(rep.expense)}\nSisa: ${rp(rep.income - rep.expense)}\n`;
    if (top.length) t += '\nPengeluaran terbesar:\n' + top.map((s, i) => `${i + 1}. ${s.name} ${rp(s.amount)} (${pc(s.pct)})`).join('\n') + '\n';
    if (pend.length) t += '\nBelum dibayar bulan ini:\n' + pend.slice(0, 8).map((b) => `• ${b.name}${b.amountEst ? ' ' + rp(b.amountEst) : ''} (tgl ${b.dueDay})`).join('\n') + '\n';
    if (h.level != null) t += `\nLevel kesehatan keuangan: ${h.level}/5 · ${h.name}\n`;
    return t + '\n— dicatat dengan Rumahku';
  }
  const catIcon = (c) => { c = (c || '').toLowerCase(); return /makan|dapur|jajan/.test(c) ? '🍽️' : /transport|bensin/.test(c) ? '🚗' : /tagihan|listrik|kewajiban/.test(c) ? '🧾' : /cicil|utang/.test(c) ? '🏦' : /belanja/.test(c) ? '🛒' : /sehat|obat|bpjs/.test(c) ? '💊' : /hibur|nongkrong|kencan/.test(c) ? '🎉' : /sekolah|spp|kuliah|buku|pendidikan/.test(c) ? '🎓' : /asuransi/.test(c) ? '🛡️' : /rumah|kos/.test(c) ? '🏠' : /gaji|bonus|thr|uang saku|beasiswa|lembur|freelance|bisnis/.test(c) ? '💼' : /invest/.test(c) ? '📈' : /orang tua|hadiah|angpao/.test(c) ? '🎁' : '💸'; };

  function vMoney() {
    if (!ui.moneyMonth) ui.moneyMonth = nowYM();
    if (!ui.moneyTab) ui.moneyTab = 'ringkas';
    const ym = ui.moneyMonth, today = C.today(), accs = list('acc'), txs = list('tx');
    const bal = C.balances(accs, txs), rep = C.monthReport(txs, ym), accName = (id) => (accs.find((a) => a.id === id) || { name: '?' }).name;
    let h = seg('moneyTab', [['ringkas', 'Ringkasan'], ['trx', 'Transaksi'], ['stat', 'Statistik'], ['track', 'Tracker']], ui.moneyTab);
    h += `<div class="inl" style="justify-content:space-between;align-items:center;margin:4px 0 8px"><button class="btn alt sm" data-a="mPrev" aria-label="Bulan sebelumnya">‹</button><b>${ymLabel(ym)}</b><button class="btn alt sm" data-a="mNext" aria-label="Bulan berikutnya">›</button></div>`;
    const tab = ui.moneyTab;
    if (tab === 'ringkas') {
      const nw = C.netWorth(accs, txs), ad = C.assetsDebt(accs, txs), prevEnd = ymShift(nowYM(), -1) + '-' + String(lastDay(ymShift(nowYM(), -1))).padStart(2, '0'), prev = C.netWorthAt(accs, txs, prevEnd), diff = nw - prev;
      h += `<div class="card hero pad"><div class="s">Kekayaan bersih · ${accs.length} rekening/akun</div><div class="big">${rp(nw)}</div><div class="inl" style="justify-content:space-between;margin-top:6px"><span class="s">Aset ${rp(ad.assets)}</span><span class="s">Utang ${rp(ad.debt)}</span></div><div class="pb" style="background:rgba(255,255,255,.25)"><i style="width:${ad.assets + ad.debt ? Math.round((ad.assets * 100) / (ad.assets + ad.debt)) : 100}%;background:#fff"></i></div>${accs.length && prev !== 0 ? `<div class="s" style="margin-top:6px">${diff >= 0 ? '▲ +' : '▼ −'}${rp(Math.abs(diff))} dibanding akhir bulan lalu</div>` : ''}</div>`;
      h += healthCard();
      const totAsset = Math.max(1, ad.assets);
      h += `<h2>Rekening & sumber dana</h2><div class="card">${accs.length ? accs.map((a) => { const v = bal[a.id] || 0; return `<div class="row" data-a="accEdit" data-id="${a.id}">${ic('c2', a.type === 'bank' ? '🏦' : a.type === 'ewallet' ? '📱' : a.type === 'kartu' ? '💳' : a.type === 'invest' ? '📈' : '👛')}<div class="grow"><div class="t">${esc(a.name)}${a.emergency ? ' <span class="tag">🛟 darurat</span>' : ''}</div><div class="s">${esc(({ kas: 'Kas', bank: 'Bank', ewallet: 'E-wallet', kartu: 'Kartu kredit', invest: 'Investasi' })[a.type] || a.type)}</div>${v > 0 ? `<div class="pb" style="margin-top:4px;height:5px"><i style="width:${Math.min(100, Math.round((v * 100) / totAsset))}%"></i></div>` : ''}</div><b class="${v < 0 ? 'neg' : ''}">${rp(v)}</b></div>`; }).join('') : '<div class="empty">Belum ada rekening.<br>Tambahkan 3–4 rekening/e-wallet yang Anda pakai.</div>'}</div><div class="btns"><button class="btn" data-a="accAdd">+ Rekening</button><button class="btn alt" data-a="tpl" data-k="acc">✨ Dari template</button></div>`;
      h += `<h2>Bulan ini</h2><div class="card pad"><div class="row" style="border:0;padding:0"><div class="grow s">Masuk<div class="t" style="color:var(--ok)">${rp(rep.income)}</div></div><div class="grow s">Keluar<div class="neg t">${rp(rep.expense)}</div></div><div class="grow s">Sisa<div class="t ${sgn(rep.income - rep.expense)}">${rp(rep.income - rep.expense)}</div></div></div></div>`;
      const bills = list('bill').filter((b) => C.billLive(b)).sort((a, b) => (+a.dueDay || 0) - (+b.dueDay || 0)), fixed = bills.filter((b) => b.kind === 'wajib' || b.kind === 'cicilan'), fsum = fixed.reduce((s, b) => s + (b.amountEst || 0), 0), unpaidSet = new Set(billStates().filter((x) => ['terlambat', 'belum', 'sebagian'].includes(x.st.status)).map((x) => x.b.id)), unpaid = bills.filter((b) => unpaidSet.has(b.id));
      h += `<h2>Kewajiban & tagihan</h2><div class="card pad"><div class="kv"><span>Kewajiban tetap / bulan</span><b>${rp(fsum)}</b></div><div class="kv"><span>Belum dibayar bulan ini</span><b>${unpaid.length} dari ${bills.length}</b></div>${unpaid.slice(0, 4).map((b) => `<div class="kv"><span>${esc(b.name)} <span class="s">${b.freq === 'weekly' ? 'tiap ' + WEEKDAYS[+b.dueWeekday || 0][1].toLowerCase() : 'tgl ' + b.dueDay}</span></span><span>${b.amountEst ? rp(b.amountEst) : '—'}</span></div>`).join('')}<div style="margin-top:8px"><button class="btn alt full" data-a="nav" data-to="tagihan">Kelola tagihan & kewajiban ›</button></div></div>`;
      const pts = []; for (let i = 5; i >= 0; i--) { const m = ymShift(nowYM(), -i), end = m === nowYM() ? today : m + '-' + String(lastDay(m)).padStart(2, '0'); pts.push({ label: MONTHS[+m.slice(5, 7) - 1].slice(0, 3), v: C.netWorthAt(accs, txs, end) }); }
      if (accs.length) h += `<h2>Kekayaan 6 bulan terakhir</h2><div class="card pad">${nwBars(pts)}</div>`;
      if (modeOf() === 'keluarga') {
        const bs = list('budget'), tot = bs.reduce((s, b) => s + b.limit, 0), spent = bs.reduce((s, b) => s + (rep.byCat[b.cat] || 0), 0), pace = C.budgetPace(tot, spent, ym, today);
        h += `<h2>Bendahara keluarga</h2><div class="card pad"><div class="kv"><span>Jatah belanja / hari</span><b>${tot ? rp(pace.perDay) : 'Atur anggaran dulu'}</b></div><div class="kv"><span>Tujuan tabungan</span><b>${list('goal').length} tujuan</b></div><div class="btns" style="margin-top:10px"><button class="btn" data-a="recapWa">📲 Kirim rekap ke WhatsApp</button><button class="btn alt" data-a="recapCopy">Salin rekap</button></div><p class="note">Rekap berisi masuk, keluar, pengeluaran terbesar, dan tagihan belum dibayar. Anda pilih sendiri penerimanya di WhatsApp.</p></div>`;
      }
      h += '<button class="btn full" data-a="txAdd">+ Catat transaksi</button>';
    } else if (tab === 'trx') {
      const kf = ui.trxKind || 'semua';
      h += seg('trxKind', [['semua', 'Semua'], ['income', 'Masuk'], ['expense', 'Keluar']], kf);
      const month = txs.filter((t) => t.date && t.date.slice(0, 7) === ym && (kf === 'semua' || t.kind === kf)).sort((a, b) => C.cmp(b.date, a.date) || C.cmp(b._u, a._u));
      const days = []; month.forEach((t) => { let d = days.find((x) => x.date === t.date); if (!d) { d = { date: t.date, items: [] }; days.push(d); } d.items.push(t); });
      h += days.length ? days.map((d) => { const net = d.items.reduce((s, t) => s + (t.void ? 0 : t.kind === 'income' ? t.amount : t.kind === 'expense' ? -t.amount : 0), 0); return `<div class="card"><div class="kv" style="font-weight:700"><span style="color:var(--ink)">${d.date === today ? 'Hari ini · ' : ''}${fmtDate(d.date)}</span><span class="${net < 0 ? 'neg' : ''}">${net < 0 ? '−' : net > 0 ? '+' : ''}${rp(Math.abs(net))}</span></div>${d.items.map((t) => {
        const lbl = t.kind === 'transfer' ? `${esc(accName(t.acc))} → ${esc(accName(t.to))}` : esc(t.cat || ''), col = t.kind === 'income' ? 'pos' : t.kind === 'expense' ? 'neg' : '', sign = t.kind === 'income' ? '+' : t.kind === 'expense' ? '−' : '⇄ ';
        return `<div class="row" data-a="txOpen" data-id="${t.id}" style="cursor:pointer;${t.void ? 'opacity:.5;text-decoration:line-through' : ''}">${ic('c2', t.kind === 'transfer' ? '⇄' : catIcon(t.cat))}<div class="grow"><div class="t">${lbl}${t.void ? ' <span class="tag">void</span>' : ''}${t.proof ? ' <span title="Ada bukti foto">📎</span>' : ''}</div><div class="s">${t.kind === 'transfer' ? '' : esc(accName(t.acc))}${t.note ? ' · ' + esc(t.note) : ''}</div></div><b class="${col}">${sign}${rp(t.amount)}</b></div>`;
      }).join('')}</div>`; }).join('') : '<div class="card"><div class="empty">Belum ada transaksi.</div></div>';
      h += '<button class="btn full" data-a="txAdd">+ Catat transaksi</button><p class="note">Ketuk transaksi untuk melihat/menambah foto bukti atau membatalkan (void). Transaksi tidak pernah dihapus: void membuatnya dianggap tidak ada, riwayat tetap tersimpan.</p>';
    } else if (tab === 'stat') {
      const isNow = ym === nowYM(), endDay = isNow ? +today.slice(8, 10) : lastDay(ym), cum = C.dailyCum(txs, ym, endDay), sav = rep.income > 0 ? Math.round(((rep.income - rep.expense) * 1000) / rep.income) / 10 : 0;
      h += `<h2>Masuk vs keluar</h2><div class="card pad"><div class="s">Sisa periode ini</div><div class="big" style="font-size:1.7rem;font-weight:800">${rp(rep.income - rep.expense)}</div>${cumChart(cum, ym)}<div class="grid2" style="margin-top:10px"><div class="card pad" style="margin:0"><div class="s">Masuk</div><b>${rp(rep.income)}</b></div><div class="card pad" style="margin:0"><div class="s">Keluar</div><b>${rp(rep.expense)}</b></div><div class="card pad" style="margin:0"><div class="s">Sisa</div><b>${rp(rep.income - rep.expense)}</b></div><div class="card pad" style="margin:0"><div class="s">Ditabung</div><b>${pc(sav)}</b></div></div></div>`;
      const si = C.topSlices(rep.bySrc, 8), se = C.topSlices(rep.byCat, 8);
      h += `<h2>Pemasukan per sumber dana</h2><div class="card pad">${si.length ? donutSVG(si, cj(rep.income), 'total pemasukan', 'Diagram pemasukan per sumber') + legendList(si, 'pos') : '<div class="empty">Belum ada pemasukan bulan ini.</div>'}</div>`;
      h += `<h2>Pengeluaran per kategori</h2><div class="card pad">${se.length ? donutSVG(se, cj(rep.expense), 'total pengeluaran', 'Diagram pengeluaran per kategori') + legendList(se, 'neg') : '<div class="empty">Belum ada pengeluaran bulan ini.</div>'}</div>`;
      const withProof = txs.filter((t) => !t.void && t.kind === 'expense' && t.date && t.date.slice(0, 7) === ym), np = withProof.filter((t) => t.proof).length;
      h += `<div class="card pad"><div class="kv"><span>Pengeluaran dgn bukti foto</span><b>${np} dari ${withProof.length}</b></div><div class="btns" style="margin-top:8px"><button class="btn" data-a="recapWa">📲 Kirim rekap ke WhatsApp</button><button class="btn alt" data-a="recapCopy">Salin rekap</button></div></div>`;
    } else {
      const bs = C.budgetStatus(list('budget'), rep), tot = bs.reduce((s, b) => s + b.limit, 0), spent = bs.reduce((s, b) => s + b.spent, 0), pace = C.budgetPace(tot, spent, ym, today);
      h += '<h2>Budget tracker</h2>';
      h += tot ? `<div class="card pad"><div class="inl" style="justify-content:space-between;align-items:baseline"><b style="font-size:1.4rem">${rp(spent)}</b><span class="bd ${pace.ahead ? 'late' : ''}">${pace.pct}% terpakai</span></div><div class="s">dari ${rp(tot)}</div><div class="pb"><i class="${pace.pct >= 100 ? 'over' : pace.ahead ? 'warn' : ''}" style="width:${Math.min(100, pace.pct)}%"></i><u class="pm" style="left:${pace.expectedPct}%"></u></div><div class="s" style="margin-top:6px">Sisa <b>${rp(Math.max(0, tot - spent))}</b>${ym === nowYM() ? ' untuk ' + pace.daysLeft + ' hari lagi · jatah ±<b>' + rp(pace.perDay) + '</b>/hari' : ''}</div><div class="s">┃ garis = batas wajar hari ini (${pace.expectedPct}%)</div></div>` : '';
      h += bs.length ? bs.map((b) => { const p = C.budgetPace(b.limit, b.spent, ym, today); return `<div class="card pad" data-a="budEdit" data-id="${b.id}" style="cursor:pointer"><div class="inl" style="justify-content:space-between"><span class="t">${catIcon(b.cat)} ${esc(b.cat)}</span><span class="bd ${b.level === 'over' ? 'late' : b.level === 'warn' || p.ahead ? 'soon' : ''}">${b.level === 'over' ? 'Lewat batas' : b.level === 'warn' ? 'Waspada' : p.ahead ? 'Agak cepat' : 'Aman'}</span></div><div class="pb"><i class="${b.level === 'over' ? 'over' : b.level === 'warn' || p.ahead ? 'warn' : ''}" style="width:${Math.min(100, b.pct)}%"></i><u class="pm" style="left:${p.expectedPct}%"></u></div><div class="inl" style="justify-content:space-between"><span class="s">${b.pct}%${ym === nowYM() && b.limit > b.spent ? ' · jatah ±' + rp(p.perDay) + '/hari' : ''}</span><span class="s">${rp(b.spent)} / ${rp(b.limit)}</span></div></div>`; }).join('') : '<div class="card"><div class="empty">Belum ada anggaran.<br>Atur batas per kategori agar pengeluaran terkendali.</div></div>';
      h += '<div class="btns"><button class="btn" data-a="budAdd">+ Anggaran</button><button class="btn alt" data-a="tpl" data-k="budget">✨ Dari template</button></div>';
      const gs = list('goal').sort((a, b) => (b.primary ? 1 : 0) - (a.primary ? 1 : 0) || C.cmp(a.date || '9999', b.date || '9999'));
      h += '<h2>Goal tracker</h2>' + (gs.length ? gs.map((g) => goalCard(g, bal)).join('') : '<div class="card"><div class="empty">Belum ada tujuan.<br>Mulai dari dana darurat.</div></div>');
      h += '<div class="btns"><button class="btn" data-a="goalAdd">+ Tujuan</button><button class="btn alt" data-a="goalTpl">✨ Dari template</button></div>';
    }
    if (tab === 'trx' || tab === 'stat') h += '<button class="btn alt full" style="margin-top:10px" data-a="nav" data-to="ekspor">📤 Ekspor ke Excel / PDF</button>';
    return { title: 'Uang', sub: '', html: h };
  }

  function vMore() {
    const g = (title, rows) => `<h2>${title}</h2><div class="card">${rows.join('')}</div>`;
    const h = g('Rumah & catatan', [
      mrow('c2', '🔧', 'Perawatan', 'Servis AC, kuras toren, dll.', 'perawatan'), mrow('c6', '🧾', 'Tagihan & angsuran', 'Listrik, internet, air, PBB', 'tagihan'),
      mrow('c4', '🚗', 'Kendaraan', 'Pajak, STNK, odometer, servis', 'kendaraan'), mrow('c1', '🛡️', 'Aset & garansi', 'Barang berharga dan masa garansi', 'aset'),
      mrow('c3', '🛒', 'Stok & belanja', 'Persediaan rumah dan daftar belanja', 'stok'), mrow('c5', '📞', 'Kontak penting', 'Tukang, dokter, darurat', 'kontak'),
      mrow('c4', '📄', 'Dokumen penting', 'KK, akta, SIM, BPJS, sertifikat, polis, ijazah', 'dokumen', vOn() ? '<span class="bd">🔒</span>' : '')])
      + g('Keluarga & hati', [mrow('c5', '👨‍👩‍👧', 'Keluarga', 'Anggota, data identitas, foto', 'keluarga'), mrow('c4', '🗂️', 'Brankas identitas', 'Foto KTP, NPWP, KK siap dikirim', 'brankas'), mrow('c3', '💌', 'Kabar & afeksi', 'Draf pesan sayang & kartu obrolan', 'afeksi'), mrow('c2', '💧', 'Rutinitas harian', 'Minum air, vitamin, dll. dengan pengingat', 'harian'), mrow('c6', '⚖️', 'Berat badan & IMT', 'Catat harian, grafik, saran sehat', 'berat')])
      + g('Pribadi', [mrow('c1', '💧', 'Minum air', 'Target harian, gelas, pengingat', 'air'), mrow('c4', '🗂️', 'Dokumen penting', 'KK, akta, SIM, BPJS, ijazah, sertifikat', 'dokumen', vOn() ? '<span class="bd">🔒</span>' : ''), mrow('c2', '✅', 'Tugas', 'Daftar tugas dan pengulangan', 'tugas'), mrow('c5', '📓', 'Jurnal', 'Catatan harian & suasana hati', 'jurnal'), mrow('c6', '🌱', 'Kebiasaan', 'Centang harian dan beruntun', 'habit')])
      + g('Pengaturan', [mrow('c5', '🙂', 'Profil saya', ownerName() || 'Isi nama untuk sapaan', 'profil'), mrow('c3', '🔐', 'Kunci dokumen penting', vOn() ? (vOpen() ? 'Aktif · terbuka' : 'Aktif · terkunci') : 'Atur password agar dokumen terenkripsi', 'kunci'), mrow('c6', '🔔', 'Notifikasi', 'Izin, riwayat, ekspor ke Kalender HP', 'notif'), mrow('c3', '📤', 'Ekspor data (Excel / PDF)', 'Laporan uang & rumah untuk dicetak atau diolah', 'ekspor'), mrow('c4', '☁️', 'Sinkron & backup', 'Google Drive, ekspor/impor, notifikasi', 'setelan'), mrow('c1', '❓', 'Bantuan & data contoh', 'Cara pasang di HP, isi data contoh', 'bantuan')]);
    return { title: 'Lainnya', sub: 'v' + APP_VERSION + ' · oleh Illusix', html: h + ABOUT_HTML };
  }

  // ---------- subhalaman ----------
  const pages = {
    ekspor() {
      const ym = ui.moneyMonth || nowYM(); if (!ui.expTx) ui.expTx = 'month';
      const btn = (fmt, scope, label) => `<button class="btn ${fmt === 'xlsx' ? '' : 'alt'} full" data-a="expRun" data-fmt="${fmt}" data-scope="${scope}" style="margin-bottom:8px">${label}</button>`;
      return { title: 'Ekspor data', sub: ymLabel(ym), html: `<p class="note" style="margin:0 0 8px">Pilih isi transaksi, lalu ekspor. Excel (.xlsx) bisa dibuka di Excel, Google Sheets, atau LibreOffice. PDF siap dicetak atau dikirim.</p>${seg('expTx', [['month', 'Transaksi ' + ymLabel(ym)], ['all', 'Semua transaksi']], ui.expTx)}<h2>📗 Excel (.xlsx)</h2><div class="card pad">${btn('xlsx', 'all', 'Semua data (satu file, banyak sheet)')}${btn('xlsx', 'uang', 'Uang saja (transaksi, akun, anggaran, tagihan, tujuan)')}${btn('xlsx', 'rumah', 'Rumah saja (perawatan, kendaraan, aset, stok, dokumen, kontak)')}</div><h2>📕 PDF</h2><div class="card pad">${btn('pdf', 'uang', 'Laporan Uang')}${btn('pdf', 'rumah', 'Laporan Rumah')}${btn('pdf', 'all', 'Laporan lengkap')}</div><p class="note">Yang ikut: daftar dan angka. <b>Tidak ikut:</b> nomor KTP/NPWP/KK/SIM dan semua foto (jaga privasi). Bulan di judul mengikuti bulan yang sedang dibuka di tab Uang. Teks emoji tidak tampil di PDF.</p>` };
    },
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
        h += `<div class="card pad"><div style="display:flex;gap:12px;align-items:center" data-a="vehEdit" data-id="${v.id}">${ic('c4', /^mobil/.test(v.kind) ? '🚗' : /^motor/.test(v.kind) ? '🛵' : '🚙')}<div class="grow"><div class="t">${esc(v.name)}${/_ev$/.test(v.kind || '') ? ' <span class="bd">⚡ EV</span>' : ''}</div><div class="s">${v.plate ? esc(v.plate) + ' · ' : ''}${v.odometer !== '' && v.odometer != null ? num(v.odometer) + ' km' : 'odometer belum diisi'}</div></div><span class="chev">✎</span></div>
        ${v.pajakDue ? `<div class="kv"><span>Pajak tahunan</span><span>${fmtDate(v.pajakDue)} ${badge(v.pajakDue)}</span></div>` : ''}${v.stnkDue ? `<div class="kv"><span>STNK 5 tahunan</span><span>${fmtDate(v.stnkDue)} ${badge(v.stnkDue)}</span></div>` : ''}
        <div class="btns" style="margin-top:10px"><button class="btn alt sm" data-a="odoUpd" data-id="${v.id}">Update odometer</button><button class="btn alt sm" data-a="vehPlan" data-id="${v.id}">+ Perawatan</button><button class="btn alt sm" data-a="vehTpl" data-id="${v.id}">✨ Template</button></div></div>`;
        h += plans.length ? plans.map((p) => planCard(p)).join('') : '<p class="note">Belum ada rencana servis untuk kendaraan ini. Coba "Template" (ganti oli, servis berkala).</p>';
      });
      if (!vs.length) h = '<div class="card"><div class="empty">Belum ada kendaraan.<br>Tambahkan motor/mobil untuk melacak pajak, STNK, odometer, dan jadwal servis.</div></div>';
      h += '<button class="btn full" data-a="vehAdd">+ Tambah kendaraan</button><div style="height:10px"></div><button class="btn alt full" data-a="tpl" data-k="veh">✨ Tambah dari template: Motor / Mobil</button>';
      return { title: 'Kendaraan', sub: vs.length + ' kendaraan', html: h, add: () => vehForm() };
    },
    tagihan() {
      const t = C.today(), ym = nowYM(), all = billStates(), m = C.billMonthSummary(list('bill'), list('bpay'), ym, t);
      const cats = ['Semua'].concat(BILL_CATS.filter((c) => all.some((x) => x.b.cat === c[0])).map((c) => c[0]));
      const stF = [['Semua', 'Semua'], ['terlambat', 'Terlambat'], ['belum', 'Belum dibayar'], ['sebagian', 'Sebagian'], ['sudah', 'Sudah dibayar'], ['lunas', 'Lunas'], ['nonaktif', 'Nonaktif']];
      const shown = all.filter((x) => (ui.billCat === 'Semua' || x.b.cat === ui.billCat) && (ui.billSt === 'Semua' || x.st.status === ui.billSt || (ui.billSt === 'belum' && x.st.status === 'upcoming'))).sort((x, y) => C.cmp(x.st.next || '9999', y.st.next || '9999'));
      const soon = all.filter((x) => x.st.next && C.daysBetween(t, x.st.next) >= 0 && C.daysBetween(t, x.st.next) <= 7 && C.billLive(x.b)), active = all.filter((x) => C.billLive(x.b) && x.st.status !== 'lunas');
      const rem = active.filter((x) => x.st.remaining != null), remSum = rem.reduce((s, x) => s + x.st.remaining, 0);
      let h = `<div class="card hero pad"><div class="s">Tagihan ${ymLabel(ym)}</div><div class="big">${rp(m.total)}</div><div class="kv"><span>Sudah dibayar</span><b>${rp(m.paid)}</b></div><div class="kv"><span>Belum dibayar</span><b>${rp(m.unpaid)}</b></div>${m.late ? `<div class="kv"><span>Terlambat</span><b style="color:var(--bad,#c0392b)">${rp(m.late)}</b></div>` : ''}</div>`;
      if (soon.length) h += `<h2>Jatuh tempo 7 hari ke depan</h2><div class="card">${soon.map(({ b, st }) => `<div class="row" data-a="billOpen" data-id="${b.id}">${ic('c6', (billCatOf(b) || ['', '🧾'])[1])}<div class="grow"><div class="t">${esc(b.name)}</div><div class="s">${st.instNext ? 'Angsuran ke-' + st.instNext + ' · ' : ''}${rp(b.amountEst || 0)}</div></div>${badge(st.next)}</div>`).join('')}</div>`;
      h += `<div class="card pad"><div class="kv"><span>Kewajiban aktif</span><b>${active.length}</b></div>${rem.length ? `<div class="kv"><span>Sisa kewajiban keseluruhan</span><b>${rp(remSum)}</b></div><div class="s">Dari ${rem.length} kewajiban yang datanya cukup untuk dihitung${active.length > rem.length ? ' (' + (active.length - rem.length) + ' lainnya tanpa total/tenor tidak dihitung)' : ''}.</div>` : '<div class="s">Isi total/tenor pada angsuran agar sisa kewajiban terhitung.</div>'}</div>`;
      h += `<div class="chips">${cats.map((c) => `<button class="chip ${ui.billCat === c ? 'on' : ''}" data-a="set" data-k="billCat" data-v="${c}">${c === 'Semua' ? 'Semua jenis' : esc((BILL_CATS.find((x) => x[0] === c) || [0, '', c])[2])}</button>`).join('')}</div><div class="chips">${stF.map((x) => `<button class="chip ${ui.billSt === x[0] ? 'on' : ''}" data-a="set" data-k="billSt" data-v="${x[0]}">${x[1]}</button>`).join('')}</div>`;
      h += `<div class="card">${shown.length ? shown.map(({ b, st }) => {
        const c = billCatOf(b), sm = BILL_STATUS[st.status] || ['', ''], tail = [];
        if (b.freq === 'weekly') tail.push('tiap ' + WEEKDAYS[+b.dueWeekday || 0][1].toLowerCase()); else tail.push('tgl ' + b.dueDay);
        if (b.amountEst) tail.push((!b.kind || b.kind === 'tagihan' ? '±' : '') + rp(b.amountEst));
        if (+b.tenor > 0 && st.instNext) tail.push('angsuran ' + st.instNext + '/' + b.tenor); else if (+b.tenor > 0) tail.push('selesai ' + b.tenor + '/' + b.tenor); else if (st.instDone > 0 && st.instNext) tail.push('cicilan ke-' + st.instNext);
        if (st.remaining != null && st.remaining > 0) tail.push('sisa ' + rp(st.remaining));
        const right = st.status === 'lunas' || st.status === 'nonaktif' ? `<span class="bd">${sm[0]}</span>` : `${st.status === 'terlambat' || st.status === 'sebagian' ? `<span class="bd ${sm[1]}">${sm[0]}</span>` : st.status === 'sudah' ? `<span class="bd">${sm[0]}</span>` : badge(st.next)}<button class="btn sm" data-a="billPay" data-id="${b.id}">Bayar</button>`;
        return `<div class="row">${ic(st.status === 'terlambat' ? 'c3' : 'c6', c ? c[1] : '🧾')}<div class="grow" data-a="billOpen" data-id="${b.id}"><div class="t">${esc(b.name)}</div><div class="s">${tail.join(' · ')}</div></div><div style="text-align:right;display:flex;flex-direction:column;gap:6px;align-items:flex-end">${right}</div></div>`;
      }).join('') : '<div class="empty">' + (all.length ? 'Tidak ada tagihan dengan filter ini.' : 'Belum ada tagihan rutin.<br>Tambahkan KPR, cicilan, arisan, listrik, internet, dan lainnya.') + '</div>'}</div><button class="btn full" data-a="billAdd">+ Tagihan / angsuran baru</button><div style="height:10px"></div><button class="btn alt full" data-a="billTpl">✨ Tambah cepat dari daftar</button><div style="height:10px"></div><button class="btn alt full" data-a="nav" data-to="riwayatbayar">🧾 Riwayat pembayaran</button><p class="note">Setiap jadwal otomatis tampil di Kalender. "Bayar" mencatat riwayat dan, bila Anda pilih akun, pengeluaran di tab Uang. Mengubah template hanya memengaruhi tagihan mendatang.</p>`;
      return { title: 'Tagihan & angsuran', sub: active.length + ' aktif', html: h, add: () => billCatMenu() };
    },
    tagihandetail(pp) {
      const b = get('bill', pp.id); if (!b) return null;
      const t = C.today(), pays = list('bpay'), st = C.billState(b, pays, t), c = billCatOf(b), sm = BILL_STATUS[st.status] || ['', ''];
      const mine = pays.filter((x) => x.billId === b.id).sort((x, y) => C.cmp(y.date || '', x.date || '') || C.cmp(y._u, x._u));
      const key = 'bref' + b.id, ref = b.refSec ? (VAULT.cache.bills[b.id] || '') : (b.ref || ''), shown = ui.reveal[key];
      const kv = (k, v) => v === '' || v == null ? '' : `<div class="kv"><span>${k}</span><b>${v}</b></div>`;
      const tenor = +b.tenor || 0, pct = tenor > 0 ? Math.min(100, Math.round((st.instDone / tenor) * 100)) : null;
      const up = []; { let d = st.next, g = 0; while (d && g++ < 3) { up.push(d); d = C.billOccAfter(b, d); const e = C.billEndDate(b); if (e && d > e) break; if (tenor && st.instDone + up.length >= tenor) break; } }
      let h = `<div class="card hero pad"><div class="s">${c ? esc(c[2]) : 'Tagihan rutin'} · <span class="bd ${sm[1]}">${sm[0]}</span></div><div class="big">${esc(b.name)}</div>${kv('Nominal', b.amountEst ? rp(b.amountEst) : '')}${kv('Jatuh tempo berikut', st.next ? fmtDate(st.next) + ' (' + C.countdown(C.daysBetween(t, st.next)) + ')' : '—')}${tenor > 0 ? kv('Angsuran', (st.instNext ? 'ke-' + st.instNext : 'selesai') + ' dari ' + tenor) + kv('Sisa tenor', st.remainingInst + ' kali') : st.instDone > 0 ? kv('Sudah dibayar', st.instDone + ' kali') + kv('Berikutnya', 'ke-' + st.instNext) : ''}${st.remaining != null ? kv('Sisa kewajiban', rp(st.remaining)) : ''}${+b.total > 0 ? kv('Total pinjaman / target', rp(b.total)) : ''}${+b.dp > 0 ? kv('Uang muka', rp(b.dp)) : ''}${kv('Dibayar lewat aplikasi', st.paidTotal ? rp(st.paidTotal) : '')}${+b.paidBefore > 0 ? kv('Dibayar sebelumnya', rp(b.paidBefore)) : ''}${pct != null ? `<div class="prog" style="height:8px;background:var(--soft);border-radius:99px;margin:8px 0"><div style="width:${pct}%;height:100%;background:var(--acc);border-radius:99px"></div></div><div class="s">${pct}% selesai</div>` : ''}${st.end ? kv('Selesai', fmtDate(st.end)) : ''}${kv('Kreditur', esc(b.creditor || ''))}${kv('Bank / penyedia', esc(b.bank || ''))}${b.extra ? kv('Bunga / biaya', esc(b.extra)) : ''}</div>`;
      if (ref) h += `<div class="card pad inl" style="justify-content:space-between;align-items:center;gap:8px"><div><div class="s">Nomor kontrak / referensi</div><div class="t idn">${shown ? esc(ref) : esc(C.maskId(ref))}</div></div><button class="btn alt sm" data-a="idShow" data-key="${key}">${shown ? 'Sembunyikan' : 'Tampilkan'}</button></div>`;
      else if (b.refSec) h += lockCard('Nomor kontrak');
      if (C.billLive(b) && st.next) h += `<div class="card pad"><button class="btn full" data-a="billPay" data-id="${b.id}">Bayar ${st.instNext ? 'angsuran ke-' + st.instNext : 'sekarang'}</button><div style="height:8px"></div><button class="btn alt full" data-a="billPayPart" data-id="${b.id}">Bayar sebagian</button>${(tenor > 0 || +b.total > 0) ? `<div style="height:8px"></div><button class="btn alt full" data-a="billPayoff" data-id="${b.id}">Lunasi lebih awal</button>` : ''}</div>`;
      if (up.length && C.billLive(b)) h += `<h2>Jadwal berikutnya</h2><div class="card">${up.map((d, i) => `<div class="row"><div class="grow"><div class="t">${fmtDate(d)}</div><div class="s">${st.instNext ? 'Angsuran ke-' + (st.instNext + i) : 'Jatuh tempo'}</div></div>${badge(d)}</div>`).join('')}</div>`;
      h += `<h2>Riwayat pembayaran</h2><div class="card">${mine.length ? mine.map((x) => `<div class="row"><div class="grow"><div class="t">${rp(x.amount)}${x.void ? ' · dibatalkan' : ''}</div><div class="s">${fmtDate(x.date)}${x.instNo ? ' · angsuran ke-' + x.instNo : ''}${x.part ? ' · sebagian' : ''}${x.payoff ? ' · pelunasan' : ''}${x.late && !x.void ? ' · terlambat' : ''} · untuk ${fmtDate(x.occ)}</div></div>${x.void ? '' : `<button class="btn alt sm" data-a="billVoid" data-id="${x.id}">Batalkan</button>`}</div>`).join('') : '<div class="empty">Belum ada pembayaran tercatat.</div>'}</div>`;
      h += `<div class="card pad">${C.billLive(b) ? `<button class="btn alt full" data-a="billShift" data-id="${b.id}" data-n="1">Geser +1 angsuran (tanpa catat bayar)</button><div style="height:8px"></div><button class="btn alt full" data-a="billShift" data-id="${b.id}" data-n="-1">Geser −1 angsuran</button><div style="height:8px"></div>` : ''}<button class="btn alt full" data-a="billEdit" data-id="${b.id}">Ubah template</button><div style="height:8px"></div><button class="btn alt full" data-a="billToggle" data-id="${b.id}">${b.active === false ? 'Aktifkan lagi' : 'Hentikan template (nonaktif)'}</button><div style="height:8px"></div><button class="btn bad full" data-a="billDel" data-id="${b.id}">Hapus template…</button></div>`;
      return { title: b.name, sub: sm[0], html: h };
    },
    riwayatbayar() {
      const mine = list('bpay').sort((x, y) => C.cmp(y.date || '', x.date || '') || C.cmp(y._u, x._u)), tot = mine.filter((x) => !x.void).reduce((s, x) => s + (x.amount || 0), 0);
      return { title: 'Riwayat pembayaran tagihan', sub: mine.length + ' catatan', html: `<div class="card hero pad"><div class="s">Total dibayar (tidak termasuk yang dibatalkan)</div><div class="big">${rp(tot)}</div></div><div class="card">${mine.length ? mine.map((x) => { const b = get('bill', x.billId); return `<div class="row"><div class="grow"${b ? ` data-a="billOpen" data-id="${b.id}"` : ''}><div class="t">${esc(x.name || 'Tagihan')}${b ? '' : ' <span class="s">(template dihapus)</span>'}</div><div class="s">${fmtDate(x.date)} · ${rp(x.amount)}${x.instNo ? ' · angsuran ke-' + x.instNo : ''}${x.part ? ' · sebagian' : ''}${x.payoff ? ' · pelunasan' : ''}${x.void ? ' · dibatalkan' : ''}</div></div></div>`; }).join('') : '<div class="empty">Belum ada pembayaran.</div>'}</div>` };
    },
    aset() {
      const cats = ['Semua'].concat(Object.keys(ASSET_EMOJI));
      const as = list('asset').filter((a) => ui.assetCat === 'Semua' || a.cat === ui.assetCat).sort((a, b) => C.cmp(a.name, b.name));
      let h = seg('assetCat', cats.map((c) => [c, c]), ui.assetCat);
      h += `<div class="card">${as.length ? as.map((a) => `<div class="row" data-a="assetEdit" data-id="${a.id}">${ic('c1', ASSET_EMOJI[a.cat] || '📦')}<div class="grow"><div class="t">${esc(a.name)}</div><div class="s">${a.place ? esc(a.place) + ' · ' : ''}${a.price ? rp(a.price) : ''}</div></div>${a.warrantyUntil ? (a.warrantyUntil >= C.today() ? `<div style="text-align:right"><div class="s">Garansi</div>${badge(a.warrantyUntil)}</div>` : '<span class="bd">garansi habis</span>') : ''}</div>`).join('') : '<div class="empty">Belum ada aset. Catat barang berharga, nomor seri, dan masa garansinya.</div>'}</div><button class="btn full" data-a="assetAdd">+ Aset</button><div style="height:10px"></div><button class="btn alt full" data-a="tpl" data-k="asset">✨ Tambah dari template: kulkas, AC, TV, dll</button><p class="note">Kendaraan dicatat di halaman Kendaraan.</p>`;
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
        h += `${low.length ? `<button class="btn alt full" data-a="invToShop" style="margin-bottom:12px">📥 Masukkan ${low.length} barang menipis ke daftar belanja</button>` : ''}<div class="card">${inv.length ? inv.map((i) => `<div class="row">${ic('c3', '📦')}<div class="grow" data-a="invEdit" data-id="${i.id}"><div class="t">${esc(i.name)}${C.lowStock([i]).length ? ' <span class="bd late">menipis</span>' : ''}</div><div class="s">${i.min ? 'min ' + i.min + ' · ' : ''}${i.place ? esc(i.place) + ' · ' : ''}${i.expiry ? 'exp ' + fmtDate(i.expiry) : ''}</div></div><button class="qb" data-a="invDec" data-id="${i.id}" aria-label="Kurangi ${esc(i.name)}">−</button><div class="qty">${i.qty} ${esc(i.unit || '')}</div><button class="qb" data-a="invInc" data-id="${i.id}" aria-label="Tambah ${esc(i.name)}">+</button></div>`).join('') : '<div class="empty">Belum ada stok. Catat gas, beras, obat, dll. dengan batas minimum.</div>'}</div><button class="btn full" data-a="invAdd">+ Barang stok</button><div style="height:10px"></div><button class="btn alt full" data-a="tpl" data-k="inv">✨ Tambah dari template: beras, gas, galon, dll</button>`;
      }
      return { title: 'Stok & belanja', sub: '', html: h, add: tab === 'stok' ? () => invForm() : null };
    },
    kontak() {
      const cs = list('contact').sort((a, b) => C.cmp(!!b.emergency, !!a.emergency) || C.cmp(a.name, b.name));
      return { title: 'Kontak penting', sub: '', add: () => contactForm(), html: `<div class="card">${cs.length ? cs.map((c) => `<div class="row">${ic(c.emergency ? 'c3' : 'c5', c.emergency ? '🚨' : '👤')}<div class="grow" data-a="contactEdit" data-id="${c.id}"><div class="t">${esc(c.name)}</div><div class="s">${esc(c.role || '')}</div></div>${c.phone ? `<a class="btn sm" href="tel:${esc(c.phone.replace(/[^\d+]/g, ''))}">📞 ${esc(c.phone)}</a>` : ''}</div>`).join('') : '<div class="empty">Belum ada kontak (tukang, dokter, RT, PLN…).</div>'}</div><button class="btn full" data-a="contactAdd">+ Kontak</button><div style="height:10px"></div><button class="btn alt full" data-a="tpl" data-k="contact">✨ Tambah dari template: nomor darurat, tukang, dll</button>` };
    },
    dokumen() {
      const on = vOn(), open = vOpen();
      if (on && !open) return { title: 'Dokumen penting', sub: 'terkunci', html: lockCard('Dokumen penting') + '<p class="note">Isi dokumen disembunyikan sampai password dimasukkan. Lupa password? Ketuk Buka lalu pilih kode pemulihan.</p>' };
      const ds = list('doc').sort((a, b) => C.cmp(a.expiry || '9999', b.expiry || '9999'));
      const banner = on ? `<div class="card pad inl" style="justify-content:space-between;align-items:center"><span class="s">🔓 Terbuka · terkunci otomatis 2 menit setelah aplikasi ditinggalkan</span><button class="btn alt sm" data-a="vLockNow">Kunci</button></div>` : `<div class="card pad" data-a="nav" data-to="kunci" style="cursor:pointer"><div class="t">🔐 Beri password pada dokumen</div><div class="s">Nomor, catatan, dan foto scan bisa dikunci terenkripsi. Ketuk untuk mengatur.</div></div>`;
      const row = (d) => {
        const sec = docSecret(d), nf = list('pfile').filter((f) => f.docId === d.id).length, key = 'd' + d.id, shown = ui.reveal[key];
        return `<div class="row" style="align-items:flex-start"><div class="grow"><div data-a="docEdit" data-id="${d.id}" style="display:flex;gap:12px;align-items:center">${ic('c4', '📄')}<div class="grow"><div class="t">${esc(d.title)}</div><div class="s">${sec.place ? 'Disimpan: ' + esc(sec.place) : 'Lokasi belum diisi'}</div></div>${d.expiry ? badge(d.expiry) : ''}</div>${sec.num ? `<div class="inl" style="gap:6px;margin:6px 0 0 4px"><span class="t idn">${shown ? esc(sec.num) : esc(C.maskId(sec.num))}</span><button class="btn alt sm" data-a="idShow" data-key="${key}">${shown ? 'Sembunyikan' : 'Tampilkan'}</button>${shown ? `<button class="btn alt sm" data-a="docCopy" data-id="${d.id}">Salin</button>` : ''}</div>` : ''}</div><button class="btn alt sm" data-a="docFiles" data-id="${d.id}" aria-label="Foto scan ${esc(d.title)}">📷${nf ? ' ' + nf : ''}</button></div>`;
      };
      const groups = DOC_CATS.map((c) => { const items = ds.filter((d) => (d.cat || 'lain') === c[0]); return items.length ? `<h2>${c[1]} · ${items.length}</h2><div class="card">${items.map(row).join('')}</div>` : ''; }).join('');
      return { title: 'Dokumen penting', sub: ds.length + ' dokumen' + (on ? ' · 🔓 terbuka' : ''), add: () => docForm(), html: `<button class="btn full" data-a="docQuick">📷 Foto cepat dengan kamera (KTP, NPWP, KK, SIM…)</button><div style="height:10px"></div>${banner}<div class="card pad" data-a="nav" data-to="brankas" style="cursor:pointer"><div class="t">🪪 Brankas KTP, NPWP, KK, SIM</div><div class="s">Foto scan identitas per anggota keluarga, siap dikirim saat diminta. Ketuk di sini.</div></div>${groups || '<div class="card"><div class="empty">Belum ada dokumen.<br>Tambahkan dari template: KK, akta, SIM, BPJS, sertifikat, polis, ijazah.</div></div>'}<button class="btn full" data-a="docAdd">+ Dokumen</button><div style="height:10px"></div><button class="btn alt full" data-a="tpl" data-k="doc">✨ Tambah dari template: KK, akta, SIM, BPJS, sertifikat, polis, ijazah</button><p class="note">Ketuk 📷 di tiap dokumen untuk menyimpan foto/scan-nya (hanya di HP ini). ${on ? 'Nomor, lokasi, catatan, dan foto terenkripsi dengan password Anda.' : 'Belum ada password: isi dokumen tersimpan polos.'}</p>` };
    },
    kunci() {
      const on = vOn(), open = vOpen();
      const nDoc = list('doc').length, nId = list('person').filter((p) => p.idsSec || (p.ids || []).length).length, nFile = list('pfile').filter((f) => f.docId || f.personId).length;
      let h = `<div class="card pad"><div class="t">${on ? (open ? '🔓 Terbuka' : '🔒 Terkunci') : '🔓 Belum diberi password'}</div><div class="s">${on ? 'Terkunci otomatis 2 menit setelah aplikasi ditinggalkan.' : 'Dokumen penting tersimpan polos di HP ini.'} · ${nDoc} dokumen · ${nId} anggota ber-identitas · ${nFile} foto berkas</div></div>`;
      if (!on) h += '<button class="btn full" data-a="vSetup">🔐 Atur password</button>';
      else h += `<div class="card pad"><button class="btn full" data-a="${open ? 'vLockNow' : 'vUnlock'}">${open ? '🔒 Kunci sekarang' : '🔓 Buka dengan password'}</button><div style="height:8px"></div><button class="btn alt full" data-a="vChange">Ganti password</button><div style="height:8px"></div><button class="btn alt full" data-a="vNewRec">Buat kode pemulihan baru</button><div style="height:8px"></div><button class="btn bad full" data-a="vOff">Matikan kunci…</button></div>`;
      h += `<h2>Cara kerjanya</h2><div class="card pad"><p class="s" style="margin:0 0 8px"><b>Terenkripsi (AES-256 dengan kunci dari password Anda):</b> nomor dokumen, lokasi simpan, catatan, nomor identitas (KTP, NPWP, KK, SIM, BPJS), dan foto scan di Dokumen penting dan Brankas.</p><p class="s" style="margin:0 0 8px"><b>Tidak terenkripsi:</b> judul dokumen dan tanggal berlaku, supaya pengingat tetap berjalan. Di Beranda dan kalender judulnya disamarkan menjadi “Dokumen penting”.</p><p class="s" style="margin:0 0 8px"><b>Penting:</b> password dan kode pemulihan tidak bisa dilihat atau dipulihkan oleh siapa pun, termasuk pembuat aplikasi. Jika keduanya hilang, isi dokumen tidak dapat dibuka lagi. Simpan kode pemulihan di tempat aman di luar HP.</p><p class="s" style="margin:0"><b>Batas perlindungan:</b> selama terbuka (maks. 2 menit setelah Anda meninggalkan aplikasi), isi dokumen terlihat oleh siapa pun yang memegang HP. Backup JSON dan Drive hanya berisi data terenkripsi. Pakai juga kunci layar HP.</p></div>`;
      return { title: 'Kunci dokumen penting', sub: on ? (open ? 'terbuka' : 'terkunci') : 'belum aktif', html: h };
    },
    tugas() {
      const t = C.today(), all = list('task'), f = ui.taskFilter;
      const act = all.filter((x) => !x.done).sort(byDue), done = all.filter((x) => x.done).sort((a, b) => C.cmp(b.doneAt || '', a.doneAt || ''));
      const shown = f === 'aktif' ? act : done;
      return { title: 'Tugas', sub: act.length + ' aktif', add: () => taskForm(), html: seg('taskFilter', [['aktif', 'Aktif (' + act.length + ')'], ['selesai', 'Selesai (' + done.length + ')']], f) + `<div class="card">${shown.length ? shown.map((x) => taskRow(x, t)).join('') : `<div class="empty">${f === 'aktif' ? 'Belum ada tugas.' : 'Belum ada tugas selesai.'}</div>`}</div><button class="btn full" data-a="taskAdd">+ Tugas baru</button><div style="height:10px"></div><button class="btn alt full" data-a="tpl" data-k="task">✨ Tambah dari template: belanja bulanan, bersih-bersih, dll</button>` };
    },
    jurnal() {
      const js = list('journal').sort((a, b) => C.cmp(b.date, a.date) || C.cmp(b._u, a._u));
      return { title: 'Jurnal', sub: '', add: () => journalForm(), html: `<div class="card">${js.length ? js.map((j) => `<div class="row" data-a="journalEdit" data-id="${j.id}"><div style="font-size:1.6rem">${MOODS[(+j.mood || 3) - 1]}</div><div class="grow"><div class="s">${fmtDate(j.date)}</div><div class="t" style="font-weight:500">${esc(j.text.length > 140 ? j.text.slice(0, 140) + '…' : j.text)}</div></div></div>`).join('') : '<div class="empty">Belum ada jurnal.</div>'}</div><button class="btn full" data-a="journalAdd">+ Tulis jurnal</button><p class="note">Jurnal tersimpan polos (belum dienkripsi ujung-ke-ujung); di Drive ia berada di folder privat aplikasi milik akun Google Anda.</p>` };
    },
    habit() {
      const t = C.today(), hs = list('habit');
      return { title: 'Kebiasaan', sub: '', add: () => habitForm(), html: `<div class="card">${hs.length ? hs.map((x) => habitRow(x, t)).join('') : '<div class="empty">Belum ada kebiasaan.</div>'}</div><button class="btn full" data-a="habitAdd">+ Kebiasaan</button><div style="height:10px"></div><button class="btn alt full" data-a="tpl" data-k="habit">✨ Tambah dari template: olahraga, baca buku, dll</button>` };
    },
    air() {
      const t = C.today(), cfg = C.waterCfg(store), day = C.waterDay(store, t), hist = C.waterHistory(store, t, 7);
      const full = Math.floor(day.ml / cfg.glassMl), n = Math.max(cfg.goal, full), extra = day.ml - full * cfg.glassMl;
      const glasses = Array.from({ length: n }, (_, i) => `<button class="gl ${i < full ? 'on' : ''} ${i >= cfg.goal ? 'over' : ''}" data-a="waterAdd1" aria-label="Gelas ${i + 1}${i < full ? ' sudah diminum' : ' belum'}"></button>`).join('');
      const hm = (l) => l.time || '';
      let h = `<div class="card hero pad"><div class="s">Hari ini · target ${cfg.goal} gelas (${cfg.goalMl} ml)</div><div class="big">${day.ml} ml</div><div class="s">${full} gelas${extra > 0 ? ' + ' + extra + ' ml' : ''} · ${day.pct}%${day.reached ? ' 🎉 target tercapai' : ''}</div><div class="wbar" style="margin-top:8px"><i style="width:${Math.min(100, day.pct)}%"></i></div></div>`;
      h += `<div class="card pad"><div class="gls">${glasses}</div><div class="btns"><button class="btn" data-a="waterAdd1">+ 1 gelas (${cfg.glassMl} ml)</button><button class="btn alt" data-a="waterMore">+ Jumlah lain</button></div><div style="height:8px"></div><button class="btn alt full" data-a="waterUndo" ${day.count ? '' : 'disabled'}>− Koreksi: batalkan catatan terakhir</button></div>`;
      h += `<h2>Catatan hari ini</h2><div class="card">${day.logs.length ? day.logs.slice().reverse().map((l) => `<div class="row"><div class="grow"><div class="t">${l.ml} ml</div><div class="s">${esc(hm(l))}</div></div><button class="btn alt sm" data-a="waterDel" data-id="${l.id}">Batalkan</button></div>`).join('') : '<div class="empty">Belum ada catatan. Ketuk gelas untuk menambah.</div>'}</div>`;
      h += `<h2>7 hari terakhir</h2><div class="card pad">${hist.map((x) => `<div class="kv"><span>${fmtDate(x.date)}</span><b>${x.ml} ml · ${x.pct}%</b></div><div class="wbar" style="margin:0 0 8px"><i style="width:${Math.min(100, x.pct)}%"></i></div>`).join('')}</div>`;
      h += `<button class="btn alt full" data-a="waterCfg">⚙️ Target & pengingat</button><p class="note">Pengingat: ${cfg.on ? 'aktif ' + cfg.from + '–' + cfg.to + ' tiap ' + cfg.every + ' menit' + (cfg.quietFrom ? ', tenang ' + cfg.quietFrom + '–' + cfg.quietTo : '') : 'mati'}. Pengingat tidak dikirim setelah target tercapai. Pengingat muncul saat aplikasi terbuka/di latar; untuk pengingat saat tertutup, ekspor ke Kalender HP.</p>`;
      return { title: 'Minum air', sub: day.ml + '/' + cfg.goalMl + ' ml', html: h };
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
    berat() { return weightPage(); },
    profil() {
      const p = profile();
      return { title: 'Profil saya', sub: '', html: `<div class="card pad"><div class="kv"><span>Nama</span><b>${esc(p.name || '—')}</b></div><div class="kv"><span>Panggilan (sapaan)</span><b>${esc(p.nick || '—')}</b></div><div class="kv"><span>Tanggal lahir</span><b>${p.birth ? fmtDate(p.birth) : '—'}</b></div><div class="kv"><span>Sebutan untuk anak</span><b>${esc(p.callKid || '—')}</b></div><div class="kv"><span>Mode</span><b>${p.mode ? esc((MODES.find((m) => m[0] === p.mode) || [0, '—'])[1]) : '—'}</b></div><div class="kv"><span>Jenis kelamin · tinggi</span><b>${p.sex ? (p.sex === 'L' ? 'Laki-laki' : 'Perempuan') : '—'} · ${p.height ? esc(p.height) + ' cm' : '—'}</b></div><div style="margin-top:12px"><button class="btn full" data-a="profilEdit">${p.name ? 'Ubah profil' : 'Isi nama saya'}</button></div></div><p class="note">Sapaan di Beranda: "${esc(C.greeting(new Date().getHours()))}${ownerName() ? ', ' + esc(ownerName()) : ''}".</p>` };
    },
    brankas() {
      if (vOn() && !vOpen()) return { title: 'Brankas identitas', sub: 'terkunci', html: lockCard('Brankas identitas') };
      const fs = list('pfile').filter((f) => f.personId && get('person', f.personId)), f0 = ui.vaultF || 'Semua';
      const labels = ['Semua'].concat(FILE_LABELS.filter((l) => fs.some((f) => f.label === l)));
      const shown = fs.filter((f) => f0 === 'Semua' || f.label === f0).sort((a, b) => C.cmp(a.label, b.label) || C.cmp(a._u, b._u));
      let h = `<div class="card pad"><div class="t">🗂️ Brankas identitas</div><div class="s">Simpan foto KTP, NPWP, KK, SIM, dll. Saat ada yang minta, buka lalu ketuk <b>Kirim / bagikan</b>. Berkas hanya ada di HP ini dan tidak ikut sinkron Drive.</div></div>`;
      h += `<div class="chips">${labels.map((l) => `<button class="chip ${f0 === l ? 'on' : ''}" data-a="set" data-k="vaultF" data-v="${esc(l)}">${esc(l)}</button>`).join('')}</div>`;
      h += `<div class="card">${shown.length ? shown.map((f) => { const p = get('person', f.personId); return `<div class="row" data-a="fileOpen" data-id="${f.id}" style="cursor:pointer">${ic('c4', '🪪')}<div class="grow"><div class="t">${esc(f.label)}</div><div class="s">${esc(p.name)}${f.size ? ' · ' + Math.round(f.size / 1024) + ' KB' : ''}</div></div><span class="chev">›</span></div>`; }).join('') : '<div class="empty">Belum ada berkas.<br>Tambahkan foto KTP/NPWP milik Anda atau anggota keluarga.</div>'}</div>`;
      h += '<button class="btn full" data-a="vaultAdd">+ Simpan foto berkas</button><p class="note">Tips: foto di tempat terang, seluruh sisi kartu terlihat. Foto otomatis dikecilkan agar hemat memori. Hapus berkas dari layar lihat bila sudah tidak perlu.</p>';
      return { title: 'Brankas identitas', sub: fs.length + ' berkas', html: h };
    },
    keluarga() {
      const all = list('person').sort((x, y) => C.cmp(x.name, y.name)), t = C.today();
      const tags = ['Semua'].concat(Array.from(new Set(all.map((p) => p.rel).filter(Boolean))));
      const q = (ui.famQ || '').trim().toLowerCase(), ps = all.filter((p) => (ui.relF === 'Semua' || p.rel === ui.relF) && (!q || (p.name || '').toLowerCase().includes(q) || (p.nick || '').toLowerCase().includes(q) || (p.rel || '').toLowerCase().includes(q)));
      let h = all.length > 3 ? `<label class="f" style="margin-bottom:8px"><input type="search" id="famq" placeholder="Cari nama atau hubungan…" value="${esc(ui.famQ || '')}" autocomplete="off"></label>` : '';
      if (tags.length > 2) h += `<div class="chips">${tags.map((x) => `<button class="chip ${ui.relF === x ? 'on' : ''}" data-a="set" data-k="relF" data-v="${esc(x)}">${x === 'Semua' ? 'Semua' : esc(x)}</button>`).join('')}</div>`;
      h += `<div class="card">${ps.length ? ps.map((p) => {
        const age = C.ageOn(p.birth, t), bd = p.birth ? C.daysBetween(t, nextBirthday(p.birth, t)) : null, pa = C.phoneActions(p.phone);
        return `<div class="row" data-a="personOpen" data-id="${p.id}">${avHTML(p)}<div class="grow"><div class="t">${esc(p.name)}</div><div class="s"><span class="bd" style="margin-right:4px">${esc(p.rel || 'Tanpa tag')}</span>${age != null ? age + ' th' : ''}${p.lastContact ? ' · dikabari ' + C.countdown(C.daysBetween(t, p.lastContact)) : ''}</div></div>${bd != null && bd <= 14 ? `<span class="bd soon">🎂 ${bd === 0 ? 'hari ini' : bd + ' hari'}</span>` : ''}${pa.ok ? `<button class="btn alt sm" data-a="waOpen" data-id="${p.id}" aria-label="WhatsApp ${esc(p.name)}">💬</button>` : ''}<span class="chev">›</span></div>`;
      }).join('') : '<div class="empty">' + (all.length ? 'Tidak ada anggota dengan filter ini.' : 'Belum ada anggota keluarga.<br>Tambahkan pasangan, anak, atau orang tua, lalu isi data pribadi masing-masing.') + '</div>'}</div><button class="btn full" data-a="personAdd">+ Anggota keluarga</button><div style="height:10px"></div><button class="btn alt full" data-a="nav" data-to="afeksi">💌 Kirim kabar &amp; kata sayang</button>`;
      return { title: 'Keluarga', sub: ps.length + ' anggota', html: h, add: () => personForm() };
    },
    orang(pp) {
      const p = get('person', pp.id); if (!p) return null;
      const t = C.today(), files = list('pfile').filter((f) => f.personId === p.id).sort((a, b) => C.cmp(a._u, b._u)), age = C.ageOn(p.birth, t);
      let h = `<div class="card pad"><div style="display:flex;gap:14px;align-items:center">${avHTML(p, 'lg')}<div class="grow"><div class="t" style="font-size:1.15rem">${esc(p.name)}</div><div class="s">${esc(p.rel || '')}${p.nick ? ' · "' + esc(p.nick) + '"' : ''}${age != null ? ' · ' + age + ' tahun' : ''}</div></div></div>
        ${p.birth ? `<div class="kv"><span>Lahir</span><b>${fmtDate(p.birth)}</b></div>` : ''}${p.phone ? `<div class="kv"><span>Telepon</span><a href="tel:${esc(p.phone.replace(/[^\d+]/g, ''))}"><b>${esc(p.phone)}</b></a></div>` : ''}${p.notes ? `<div class="kv"><span>Catatan</span><span>${esc(p.notes)}</span></div>` : ''}
        ${C.phoneActions(p.phone).tel ? `<div class="btns" style="margin-top:12px">${C.phoneActions(p.phone).ok ? `<button class="btn" data-a="waOpen" data-id="${p.id}">💬 WhatsApp</button>` : ''}<a class="btn alt" href="tel:${C.phoneActions(p.phone).tel}">📞 Telepon</a><a class="btn alt" href="sms:${C.phoneActions(p.phone).tel}">✉️ SMS</a></div>${C.phoneActions(p.phone).ok ? '' : '<div class="s" style="margin-top:6px">Nomor ini tidak dikenali sebagai ponsel: WhatsApp dinonaktifkan.</div>'}` : ''}<div class="btns" style="margin-top:12px"><button class="btn" data-a="personKabar" data-id="${p.id}">💌 Kabari</button><button class="btn alt" data-a="personEdit" data-id="${p.id}">Ubah</button><button class="btn alt" data-a="personPhoto" data-id="${p.id}">📷 Foto profil</button></div></div>`;
      const locked = vOn() && !vOpen(), ids = idsOf(p);
      if (locked) h += '<h2>Data identitas &amp; berkas</h2>' + lockCard('Data identitas dan foto berkas');
      else h += `<h2>Data identitas</h2><div class="card">${ids.length ? ids.map((e, i) => {
        const key = p.id + ':' + i, shown = ui.reveal[key];
        return `<div class="row"><div class="grow"><div class="s">${esc(e.kind)}${e.exp ? ' · berlaku s.d. ' + fmtDate(e.exp) : ''}</div><div class="t idn">${shown ? esc(e.no) : esc(C.maskId(e.no))}</div>${e.note ? `<div class="s">${esc(e.note)}</div>` : ''}</div><div class="inl" style="gap:6px"><button class="btn alt sm" data-a="idShow" data-key="${key}">${shown ? 'Sembunyikan' : 'Tampilkan'}</button>${shown ? `<button class="btn alt sm" data-a="idCopy" data-id="${p.id}" data-i="${i}">Salin</button>` : ''}<button class="link" data-a="idEdit" data-id="${p.id}" data-i="${i}" aria-label="Ubah">✎</button></div></div>`;
      }).join('') : '<div class="empty">Belum ada data. Tambahkan KTP, NPWP, KK, SIM, BPJS, dll.</div>'}</div><button class="btn full" data-a="idAdd" data-id="${p.id}">+ Data identitas</button>`;
      if (!locked) h += `<h2>Foto &amp; berkas</h2><div class="card">${files.length ? files.map((f) => `<div class="row" data-a="fileOpen" data-id="${f.id}">${ic('c4', '🖼️')}<div class="grow"><div class="t">${esc(f.label)}</div><div class="s">${fmtDate((f._u || '').slice(0, 10))}${f.size ? ' · ' + Math.round(f.size / 1024) + ' KB' : ''}</div></div><span class="chev">›</span></div>`).join('') : '<div class="empty">Belum ada foto KTP/NPWP/dokumen.</div>'}</div><button class="btn full" data-a="fileAdd" data-id="${p.id}">+ Foto / berkas</button>`;
      h += vOn() ? '<p class="note">🔐 Nomor identitas dan foto berkas terenkripsi dengan password Anda. Foto hanya ada di perangkat ini (tidak ikut sinkron Drive).</p>' : '<p class="note">⚠️ Nomor identitas disimpan polos dan hanya disembunyikan di layar. Atur password di <b>Lainnya → Kunci dokumen penting</b> agar terenkripsi. Foto berkas hanya di perangkat ini (tidak ikut sinkron Drive); ganti HP = unggah ulang.</p>';
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
        const all = afDrafts(sel), cats = ['Semua'].concat(all.map((d) => d.cat).filter((c, i, a) => a.indexOf(c) === i)), cat = cats.includes(ui.afCat) ? ui.afCat : 'Semua';
        h += `<div class="chips">${cats.map((c) => `<button class="chip ${c === cat ? 'on' : ''}" data-a="afCat" data-v="${esc(c)}">${esc(c)}</button>`).join('')}</div>`;
        h += all.map((d, i) => (cat !== 'Semua' && d.cat !== cat ? '' : `<div class="card pad draft"><p style="margin:0 0 10px;line-height:1.5">${esc(fillT(d.text, sel))}</p><div class="btns"><button class="btn sm" data-a="afWa" data-id="${sel.id}" data-i="${i}">${sel.phone ? 'WhatsApp' : 'WhatsApp (pilih kontak)'}</button>${navigator.share ? `<button class="btn alt sm" data-a="afShare" data-id="${sel.id}" data-i="${i}">Bagikan</button>` : ''}<button class="btn alt sm" data-a="afCopy" data-id="${sel.id}" data-i="${i}">Salin</button>${d.id ? `<button class="btn alt sm" data-a="draftEdit" data-id="${d.id}">Ubah</button>` : ''}</div></div>`)).join('');
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
      const demo = list('task').concat(list('plan')).some((x) => x.demo), origin = location.origin, url = origin + location.pathname.replace(/index\.html$/, '');
      const D = (title, body, open) => `<details class="hlp" ${open ? 'open' : ''}><summary>${title}</summary><div class="hb">${body}</div></details>`;
      return { title: 'Bantuan', sub: 'Panduan singkat', html:
        D('🚀 Mulai cepat (5 menit)', '<ol><li><b>Lainnya → Profil saya</b>: isi nama, sapaan di Beranda jadi personal.</li><li><b>Rumah → Perawatan → Tambah dari template</b>: pilih servis AC, kuras toren, dst.</li><li><b>Tagihan rutin → Tambah dari template</b>, lalu ketuk tiap tagihan untuk mengisi nominal dan tanggal aslinya.</li><li><b>Kendaraan → Tambah</b>: plat, odometer, pajak, STNK.</li><li><b>Rutinitas harian</b>: template minum air, vitamin, dll.</li><li><b>Keluarga</b>: tambah anggota, lalu isi data identitas dan foto masing-masing.</li></ol><p class="s">Semua template bisa diubah. Tombol + di kanan bawah = tambah cepat.</p>', true)
        + D('📱 Pasang di layar utama HP', '<p><b>Android (Chrome):</b> buka alamat aplikasi, menu ⋮ → <b>Instal aplikasi</b> atau <b>Tambahkan ke layar utama</b>. Ikon Rumahku muncul seperti aplikasi biasa dan bisa dibuka tanpa bilah alamat.</p><p><b>iPhone (Safari):</b> tombol Bagikan → <b>Tambah ke Layar Utama</b>.</p><p class="s">Setelah dibuka sekali dengan internet, aplikasi tetap terbuka saat offline.</p>')
        + D('☁️ Hubungkan Google Drive (sekali saja)', `<p><b>Tidak wajib.</b> Tanpa Drive, data tetap tersimpan di HP Anda. Cukup rutin ketuk <b>Lainnya → Sinkron &amp; backup → Bagikan backup</b> dan simpan ke Files/Drive/WhatsApp. Langkah di bawah hanya bila ingin data otomatis sama di beberapa perangkat.</p><ol><li>Buka <b>console.cloud.google.com</b> dan masuk dengan akun Google Anda.</li><li>Buat <b>Project baru</b> (nama bebas, mis. "rumahku").</li><li><b>APIs &amp; Services → Library</b>, cari <b>Google Drive API</b>, klik <b>Enable</b>.</li><li><b>OAuth consent screen</b> (atau "Google Auth Platform"): pilih <b>External</b>, isi nama aplikasi dan email Anda. Di <b>Audience / Test users</b>, tambahkan email Google Anda sendiri.</li><li><b>Credentials → Create credentials → OAuth client ID</b>, jenis <b>Web application</b>.</li><li>Pada <b>Authorized JavaScript origins</b> isi persis: <code>${esc(origin)}</code> (tanpa garis miring di akhir dan tanpa nama folder).</li><li>Salin <b>Client ID</b> (berakhiran .apps.googleusercontent.com).</li><li>Di aplikasi: <b>Lainnya → Sinkron &amp; backup</b>, tempel Client ID, ketuk <b>Simpan ID</b>, lalu <b>Hubungkan &amp; sinkron</b>.</li></ol><p class="s">Layar "Google belum memverifikasi aplikasi ini" muncul untuk aplikasi pribadi: pilih <b>Lanjutan → Lanjutkan</b>. Aplikasi hanya meminta akses ke folder tersembunyi miliknya sendiri di Drive, bukan seluruh file Anda. Tampilan menu Google Cloud kadang berubah nama; ikuti padanan terdekat.</p>`)
        + D('📅 Kalender & pengingat acara', '<p>Di bawah kalender ada <b>Agenda bulan ini</b>: semua acara, ulang tahun 🎂, tagihan, STNK/pajak, dst. urut tanggal. Yang <b>sudah lewat dicoret</b>.</p><p>Saat membuat acara, pilih <b>Pengingat</b> (tepat waktu, 10 menit, 30 menit, 1 jam, <b>3 jam</b>, <b>1 hari</b>, <b>3 hari</b>, 1 minggu sebelumnya) dan boleh menambah <b>pengingat kedua</b>. Acara tanpa jam dihitung dari pukul 08.00 hari H. Judul yang memuat "ulang tahun/ultah" otomatis diberi 🎂. Ulang tahun anggota keluarga diingatkan otomatis H-1 dan hari H pukul 08.00.</p><p class="note">Pengingat berbunyi selama aplikasi terbuka/berjalan di latar. Agar berbunyi saat HP terkunci, ekspor .ics di Lainnya → Notifikasi.</p>')
        + D('🔐 Kunci dokumen penting (password)', '<p><b>Lainnya → Kunci dokumen penting → Atur password.</b> Nomor dokumen, lokasi, catatan, nomor KTP/NPWP/KK/SIM/BPJS, dan foto scan dienkripsi (AES-256) dengan kunci dari password Anda. Tanpa password tidak bisa dilihat atau disalin. Terkunci lagi otomatis 2 menit setelah aplikasi ditinggalkan.</p><p><b>Simpan kode pemulihan</b> (25 karakter) di luar HP. Lupa password <i>dan</i> kode = dokumen tidak bisa dibuka lagi oleh siapa pun.</p><p class="note">Judul dokumen dan tanggal berlaku tidak dienkripsi supaya pengingat jalan.</p>')
        + D('📤 Ekspor ke Excel / PDF', '<p><b>Lainnya → Ekspor data</b> (atau tombol 📤 di tab Uang → Transaksi/Statistik). Pilih Excel (.xlsx) untuk diolah di Excel/Google Sheets, atau PDF untuk dicetak/dikirim. Pilih transaksi bulan ini atau semua periode.</p><p class="note">Nomor identitas dan foto tidak pernah ikut diekspor.</p>')
        + D('🔔 Pengingat & notifikasi', '<p>Ketuk <b>Lainnya → Notifikasi → Izinkan notifikasi</b>. Pengingat berbunyi selama aplikasi terbuka atau berjalan di latar.</p><p>Agar <b>pasti berbunyi saat HP terkunci</b>, ekspor ke Kalender HP (.ics) dari halaman Notifikasi, lalu buka berkasnya dan pilih Google Calendar.</p>')
        + D('👪 Dipakai bersama / dites orang lain', '<p>Bagikan alamat aplikasi. <b>Setiap orang mendapat aplikasi kosong dan datanya terpisah di HP masing-masing</b>; tidak ada data yang bercampur dan tidak ada server pusat.</p><p>Untuk sinkron Drive, orang lain memakai Client ID mereka sendiri (langkah di atas), atau Anda menambahkan email mereka sebagai <b>Test users</b> di project Anda. Untuk berbagi data keluarga yang sama antar HP, pakai satu akun Google yang sama atau ekspor/impor JSON.</p><button class="btn alt" data-a="shareApp">Bagikan alamat aplikasi</button><p class="s">' + esc(url) + '</p>')
        + D('🧪 Data contoh', `<p class="s">Isi contoh perawatan, tagihan, kendaraan, dan transaksi untuk melihat cara kerja. Yang belum Anda ubah bisa dihapus sekaligus; yang sudah Anda edit otomatis menjadi milik Anda.</p>${demo ? '<button class="btn bad" data-a="demoOff">Hapus data contoh</button>' : '<button class="btn" data-a="demoOn">Isi data contoh</button>'}`)
        + D('🔒 Privasi & keamanan', '<p>Data ada di perangkat Anda (dan folder privat Drive Anda bila terhubung). Tidak ada server pengembang. Nomor KTP/NPWP disimpan <b>belum terenkripsi</b>: pakai kunci layar HP yang kuat. Foto berkas hanya di perangkat itu. Backup rutin: <b>Sinkron &amp; backup → Ekspor JSON</b>.</p><p class="s">Aturan: uang = rupiah bulat; transaksi tidak dihapus, hanya di-void; transfer bukan pemasukan/pengeluaran.</p>')
        + D('💰 Uang: rekening, sumber dana, bukti', '<p><b>Mode:</b> pilih di Profil saya (Pelajar / Pekerja / Berkeluarga). Kategori, tujuan, dan target dana darurat ikut menyesuaikan.</p><p><b>Rekening:</b> tab Ringkasan → + Rekening atau Dari template (BCA, Mandiri, SeaBank, GoPay, dll). Tandai satu rekening sebagai <i>dana darurat</i>.</p><p><b>Sumber dana & kategori:</b> saat mencatat, pilih dari daftar. Butuh yang belum ada? Pilih <b>➕ Tambah baru…</b> di paling bawah daftar, lalu ketik namanya.</p><p><b>Bukti:</b> saat mencatat ada kolom foto bukti/struk. Atau ketuk transaksi → Tambah foto bukti. Foto tersimpan di HP ini saja.</p><p><b>Kewajiban tetap</b> (asuransi, SPP, kas desa, arisan) dan <b>cicilan</b> ada di Lainnya → Tagihan rutin (pilih Jenis). Level kesehatan keuangan, grafik, budget, dan goal ada di halaman Uang.</p>')
        + D('🗂️ Brankas identitas', '<p>Lainnya → Brankas identitas. Simpan foto KTP, NPWP, KK, SIM. Saat diminta, buka lalu ketuk <b>Kirim / bagikan</b>. Berkas tidak ikut sinkron Drive; pindah HP berarti foto perlu disimpan ulang.</p>')
        + D('⚖️ Berat badan & IMT', '<p>Isi jenis kelamin &amp; tinggi badan di <b>Profil saya</b>, lalu <b>Lainnya → Berat badan &amp; IMT → Catat</b>. Grafik dan saran muncul otomatis. Klasifikasi mengikuti Kemenkes RI dan saran olahraga mengikuti WHO. Hanya untuk dewasa; ini bukan diagnosis.</p>')
        + D('ℹ️ Tentang aplikasi', '<p>Rumahku v' + APP_VERSION + ' dibuat oleh <b>Illusix</b>. Gratis dan <b>dilarang diperjualbelikan</b>. Saran &amp; masukan: <a href="mailto:trintoro@gmail.com?subject=Masukan%20Rumahku">trintoro@gmail.com</a>.</p>', false)
        + '<p class="note">Rumahku v' + APP_VERSION + ' · oleh Illusix</p>' };
    },
  };

  function vSettings() {
    const last = cfg.lastSync ? new Date(cfg.lastSync).toLocaleString('id-ID') : 'belum pernah';
    const notif = 'Notification' in window ? Notification.permission : 'tidak didukung';
    return `<h2>Google Drive</h2><div class="card pad"><label class="f">Google OAuth Client ID<input id="cid" value="${esc(cfg.clientId || '')}" placeholder="xxxx.apps.googleusercontent.com" autocomplete="off"></label>
<div class="btns" style="margin-top:10px"><button class="btn alt" data-a="saveCid">Simpan ID</button><button class="btn" data-a="syncNow">${cfg.connected ? 'Sinkron sekarang' : 'Hubungkan &amp; sinkron'}</button></div>
<p class="note">Status: ${esc(syncMsg || (cfg.connected ? 'terhubung' : 'belum terhubung'))} · terakhir sinkron: ${esc(last)}</p>
<p class="note">Data disimpan di folder tersembunyi aplikasi di Drive Anda. Tanpa Client ID, data hanya di perangkat ini.</p></div>
<h2>Simpan di HP (tanpa Google Drive)</h2><div class="card pad"><p class="s" style="margin:0 0 10px">Data <b>sudah tersimpan di HP ini</b> otomatis. Untuk jaga-jaga (ganti HP, hapus data browser), buat salinan berkala: ketuk <b>Bagikan backup</b>, lalu pilih <b>Simpan ke Files</b>, Drive, WhatsApp, atau email ke diri sendiri.</p><div class="kv"><span>Backup terakhir</span><b>${cfg.lastBackup ? esc(new Date(cfg.lastBackup).toLocaleDateString('id-ID')) : 'belum pernah'}</b></div><div class="kv"><span>Penyimpanan permanen</span><b>${esc(persistMsg)}</b></div><div class="btns" style="margin-top:10px"><button class="btn" data-a="shareBackup">Bagikan backup</button><button class="btn alt" data-a="export">Unduh JSON</button><button class="btn alt" data-a="import">Impor / gabung JSON</button></div><input type="file" id="impf" accept="application/json,.json" hidden></div>
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
    expRun(d) {
      try {
        const ym = ui.moneyMonth || nowYM(), today = C.today(), allTx = ui.expTx === 'all';
        const shs = Exp.sets(C, store, { ym, allTx, scope: d.scope, today });
        if (!shs.length) return toast('Belum ada data untuk diekspor');
        const label = { all: 'lengkap', uang: 'uang', rumah: 'rumah' }[d.scope], base = 'rumahku-' + label + '-' + (d.scope === 'rumah' ? today : (allTx ? 'semua' : ym)) + (d.fmt === 'pdf' ? '' : '');
        if (d.fmt === 'xlsx') deliverFile(base + '.xlsx', Exp.xlsx(shs), 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        else deliverFile(base + '.pdf', Exp.pdf('Laporan ' + label + ' — Rumahku', 'Periode ' + ymLabel(ym) + ' · dibuat ' + fmtDate(today) + ' · v' + APP_VERSION, shs), 'application/pdf');
      } catch (e) { toast('Gagal membuat berkas: ' + e.message); }
    },
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
    txOpen(d) {
      const t = get('tx', d.id); if (!t) return; const items = [];
      if (t.proof) items.push({ label: '📎 Lihat / kirim bukti', fn: () => { const f = get('pfile', t.proof); if (f) viewFile(f); else toast('Bukti tidak ada di perangkat ini'); } });
      if (!t.void) { items.push({ label: t.proof ? '📷 Ganti foto bukti' : '📷 Tambah foto bukti', fn: () => photoSource('Foto bukti', (f) => attachProof(t.id, f)) }); items.push({ label: 'Void transaksi (batalkan)', fn: () => A.txVoid({ id: t.id }) }); }
      openMenu(rp(t.amount) + ' · ' + (t.cat || 'Transfer') + (t.note ? ' · ' + t.note : ''), items);
    },
    chartDay(d) { const el = document.getElementById('rd'); if (el) el.textContent = d.t; },
    vaultAdd() {
      const ps = list('person').sort((a, b) => C.cmp(a.name, b.name));
      const items = ps.map((p) => ({ label: p.name + (p.rel ? ' (' + p.rel + ')' : ''), fn: () => A.fileAdd({ id: p.id }) })); items.push({ label: '➕ Anggota baru (mis. diri sendiri)', fn: () => personForm() });
      openMenu('Berkas milik siapa?', items);
    },
    docFiles(d) {
      vGate(() => {
        const doc = get('doc', d.id); if (!doc) return; const fs = list('pfile').filter((f) => f.docId === doc.id);
        const items = fs.map((f, i) => ({ label: '🖼️ Lihat / kirim foto ' + (i + 1) + (f.size ? ' (' + Math.round(f.size / 1024) + ' KB)' : '') + (f.enc ? ' 🔐' : ''), fn: () => viewFile(f) }));
        items.push({ label: '📷 Ambil foto (kamera)', fn: () => pickImage((file) => saveDocPhoto(doc, file), true) });
        items.push({ label: '🖼️ Tambah dari galeri / berkas', fn: () => pickImage((file) => saveDocPhoto(doc, file), false) });
        openMenu(doc.title, items);
      });
    },
    // jalan pintas: foto dulu, lalu beri nama; dokumen dibuat otomatis bila belum ada
    docQuick() {
      pickImage((file) => {
        openForm('Simpan foto sebagai…', [{ k: 'title', label: 'Nama dokumen', req: true, list: ['KTP', 'NPWP', 'Kartu Keluarga (KK)', 'SIM A', 'SIM C', 'Paspor', 'BPJS Kesehatan', 'STNK kendaraan', 'Ijazah'] }], { title: 'KTP' }, (v) => {
          vGate(() => {
            const nm = v.title.trim().toLowerCase(), tp = TPL.doc.find((t) => t[0].toLowerCase() === nm);
            const doc = list('doc').find((x) => (x.title || '').toLowerCase() === nm) || C.put(store, 'doc', { title: v.title.trim(), cat: tp ? tp[1] : 'personal', expiry: '', place: '', notes: '', num: '' });
            saveDocPhoto(doc, file);
          });
        }, null, 'Foto sudah diambil. Beri nama; jika dokumen dengan nama itu sudah ada, foto ditambahkan ke sana.' + (vOn() ? ' Foto akan dienkripsi.' : ''));
      }, true);
    },
    docCopy(d) { const doc = get('doc', d.id), n = docSecret(doc).num; if (!n) return; navigator.clipboard.writeText(n).then(() => toast('Nomor disalin — tempel lalu hapus dari papan klip'), () => toast('Salin manual dari layar')); },
    vSetup() { vSetupForm(); }, vUnlock() { vPrompt(() => render()); }, vLockNow() { vLock(); }, vChange() { vChangeForm(); }, vNewRec() { vNewRecoveryForm(); }, vOff() { vOff(); },
    goalAdd() { goalForm(); }, goalTpl() { goalTplMenu(); }, goalEdit(d) { const g = get('goal', d.id); if (g) goalForm(g); }, goalDep(d) { const g = get('goal', d.id); if (g) goalDepForm(g); },
    recapWa() { window.open('https://wa.me/?text=' + encodeURIComponent(recapText(ui.moneyMonth || nowYM())), '_blank', 'noopener'); },
    async recapCopy() { try { await navigator.clipboard.writeText(recapText(ui.moneyMonth || nowYM())); toast('Rekap disalin'); } catch (e) { toast('Gagal menyalin'); } },
    txVoid(d) { const t = get('tx', d.id); if (!t) return; confirmBox('Void transaksi ' + rp(t.amount) + '? Dianggap tidak ada, riwayat tetap tersimpan.', () => { C.put(store, 'tx', { id: t.id, void: true, voidAt: C.today() }); commit(); }); },
    planAdd() { planForm(null, { group: ui.planGroup === 'semua' ? 'rumah' : ui.planGroup }); }, planTpl() { templateForm(); },
    planOpen(d) { go('planDetail', { id: d.id }); }, planEdit(d) { planForm(get('plan', d.id)); }, planDone(d) { const p = get('plan', d.id); if (p) planDoneForm(p); },
    vehAdd() { vehForm(); }, vehEdit(d) { vehForm(get('veh', d.id)); }, odoUpd(d) { odoForm(get('veh', d.id)); },
    vehPlan(d) { planForm(null, { vehicleId: d.id, group: 'kendaraan', every: 6, unit: 'month' }); }, vehTpl(d) { templateForm(d.id); },
    billAdd() { billCatMenu(); }, billTpl() { billTemplateForm(); }, billEdit(d) { billForm(get('bill', d.id)); }, billPay(d) { const b = get('bill', d.id); if (b) billPayForm(b, 'full'); },
    billPayPart(d) { const b = get('bill', d.id); if (b) billPayForm(b, 'part'); }, billPayoff(d) { const b = get('bill', d.id); if (b) billPayForm(b, 'payoff'); },
    billOpen(d) { go('tagihandetail', { id: d.id }); }, billVoid(d) { billVoidConfirm(d.id); }, billDel(d) { const b = get('bill', d.id); if (b) billDeleteConfirm(b); },
    billShift(d) { const b = get('bill', d.id); if (!b) return; const n = +d.n || 1, tenor = +b.tenor || 0; const cur = +b.instBefore || 0, nx = cur + n;
      if (nx < 0) return toast('Sudah di angsuran paling awal.');
      const pays = list('bpay').filter((p) => p.billId === b.id && !p.void).length;
      if (tenor && nx + pays > tenor) return toast('Sudah mencapai tenor (' + tenor + ').');
      setTimeout(() => confirmBox((n > 0 ? 'Geser maju 1 angsuran' : 'Geser mundur 1 angsuran') + ' untuk "' + b.name + '"? Ini hanya mengubah hitungan angsuran, TIDAK mencatat pembayaran/transaksi.', () => { C.put(store, 'bill', { id: b.id, instBefore: nx }); commit(); toast('Angsuran digeser: sekarang ke-' + (nx + pays + 1)); }), 0); },
    billToggle(d) { const b = get('bill', d.id); if (!b) return; C.put(store, 'bill', { id: b.id, active: b.active === false }); commit(); toast(b.active === false ? 'Template aktif lagi' : 'Template dihentikan; tidak ada jadwal baru'); },
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
    contactAdd() { contactForm(); }, contactEdit(d) { contactForm(get('contact', d.id)); }, docAdd() { vGate(() => docForm()); }, docEdit(d) { vGate(() => docForm(get('doc', d.id))); },
    journalAdd() { journalForm(); }, journalEdit(d) { journalForm(get('journal', d.id)); }, habitAdd() { habitForm(); }, habitEdit(d) { habitForm(get('habit', d.id)); },
    habitTog(d) { const h = get('habit', d.id); if (!h) return; const t = C.today(), log = h.log || []; C.put(store, 'habit', { id: h.id, log: log.includes(t) ? log.filter((x) => x !== t) : log.concat([t]).slice(-400) }); commit(); },
    saveCid() { cfg.clientId = (document.getElementById('cid').value || '').trim(); cfg.connected = false; saveCfg(); syncMsg = ''; toast('Client ID disimpan'); render(); },
    syncNow() { const el = document.getElementById('cid'); if (el && el.value.trim() !== (cfg.clientId || '')) { cfg.clientId = el.value.trim(); cfg.connected = false; saveCfg(); } runSync(true); },
    export() {
      const blob = new Blob([JSON.stringify(store)], { type: 'application/json' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'rumahku-backup-' + C.today() + '.json'; cfg.lastBackup = Date.now(); saveCfg();
      document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    },
    async shareBackup() {
      const name = 'rumahku-backup-' + C.today() + '.json', file = new File([JSON.stringify(store)], name, { type: 'application/json' });
      try {
        if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: 'Backup Rumahku' }); toast('Pilih Drive / Files / WhatsApp untuk menyimpan'); cfg.lastBackup = Date.now(); saveCfg(); render(); }
        else A.export();
      } catch (e) { if (e && e.name !== 'AbortError') A.export(); }
    },
    import() { document.getElementById('impf').click(); },
    notif() { if (!('Notification' in window)) return toast('Browser tidak mendukung notifikasi'); Notification.requestPermission().then(() => render()); },
    wipe() { confirmBox('Hapus SEMUA data di perangkat ini? (Ekspor backup dulu bila perlu)', () => { store = C.emptyStore(); persist(); render(); toast('Data lokal dihapus'); }); },
    demoOn() { demoOn(); }, demoOff() { demoOff(); },
    shareApp() { const u = location.origin + location.pathname.replace(/index\.html$/, ''); if (navigator.share) navigator.share({ title: 'Rumahku', url: u }).catch(() => {}); else if (navigator.clipboard) navigator.clipboard.writeText(u).then(() => toast('Alamat disalin'), () => toast(u)); else toast(u); },
    tpl(d) { if (tplForms[d.k]) tplForms[d.k](); },
    wtAdd() { wtForm(); }, wtEdit(d) { wtForm(get('wt', d.id)); },
    rtAdd() { routineForm(); }, rtTpl() { rtTemplateForm(); }, rtEdit(d) { routineForm(get('rt', d.id)); },
    rtInc(d) { rtBump(d.id, 1); }, rtDec(d) { rtBump(d.id, -1); },
    profilEdit() { profilForm(); },
    // WhatsApp: pesan awal bisa diedit; tidak dikirim otomatis (pengguna tetap menekan Kirim di WhatsApp). Nomor tidak dicatat/dikirim ke server.
    waOpen(d) {
      const p = get('person', d.id); if (!p || !C.phoneActions(p.phone).ok) return toast('Nomor WhatsApp tidak valid');
      openForm('WhatsApp ke ' + (p.nick || p.name), [{ k: 'msg', label: 'Pesan awal (boleh dikosongkan / diubah)', type: 'textarea' }], { msg: 'Halo ' + (p.nick || p.name) + ', ' }, (v) => {
        const url = C.waUrl(p.phone, v.msg); if (!url) return 'Nomor tidak valid.';
        window.open(url, '_blank', 'noopener'); toast('Membuka WhatsApp… tekan Kirim di sana');
      }, null, 'Pesan tidak terkirim otomatis. WhatsApp akan terbuka dan Anda yang menekan Kirim.');
    },
    waterAdd1() { const n = Date.now(); if (n - (ui.waterLast || 0) < 700) return; ui.waterLast = n; const d = new Date(); C.waterAdd(store, C.waterCfg(store).glassMl, C.today(d), C.fmtHM(d.getHours() * 60 + d.getMinutes())); commit(); },
    waterMore() { openForm('Tambah air', [{ k: 'ml', label: 'Jumlah (ml)', type: 'number', req: true }], { ml: C.waterCfg(store).glassMl }, (v) => { const d = new Date(); if (!C.waterAdd(store, +v.ml, C.today(d), C.fmtHM(d.getHours() * 60 + d.getMinutes()))) return 'Isi 1–5000 ml.'; commit(); }); },
    waterUndo() { if (C.waterUndoLast(store, C.today())) { commit(); toast('Catatan terakhir dibatalkan'); } },
    waterDel(d) { const l = get('wlog', d.id); if (l) { C.put(store, 'wlog', { id: l.id, void: true }); commit(); } },
    waterCfg() {
      const c = C.waterCfg(store);
      openForm('Target & pengingat minum air', [
        { k: 'goal', label: 'Target harian (gelas)', type: 'number', req: true }, { k: 'glassMl', label: 'Volume per gelas (ml)', type: 'number', req: true },
        { k: 'on', label: 'Aktifkan pengingat', type: 'check' }, { k: 'from', label: 'Mulai mengingatkan', type: 'time' }, { k: 'to', label: 'Selesai mengingatkan', type: 'time' },
        { k: 'every', label: 'Interval (menit, min. 15)', type: 'number' }, { k: 'quietFrom', label: 'Jam tenang mulai (opsional)', type: 'time' }, { k: 'quietTo', label: 'Jam tenang selesai', type: 'time' },
      ], { goal: c.goal, glassMl: c.glassMl, on: c.on, from: c.from, to: c.to, every: c.every, quietFrom: c.quietFrom, quietTo: c.quietTo }, (v) => {
        const g = +v.goal, gm = +v.glassMl, ev = +v.every || 60;
        if (!(g >= 1 && g <= 40)) return 'Target 1–40 gelas.'; if (!(gm >= 50 && gm <= 2000)) return 'Volume gelas 50–2000 ml.'; if (ev < 15) return 'Interval minimal 15 menit.';
        if (v.from && v.to && v.to < v.from) return 'Jam selesai harus sesudah jam mulai.'; if ((v.quietFrom && !v.quietTo) || (!v.quietFrom && v.quietTo)) return 'Isi kedua jam tenang atau kosongkan keduanya.';
        C.put(store, 'wcfg', { id: 'wcfg', goal: g, glassMl: gm, on: !!v.on, from: v.from || '08:00', to: v.to || '20:00', every: ev, quietFrom: v.quietFrom || '', quietTo: v.quietTo || '' }); commit(); toast('Disimpan. Riwayat lama tidak berubah.');
      });
    },
    personAdd() { personForm(); }, personEdit(d) { personForm(get('person', d.id)); }, personOpen(d) { go('orang', { id: d.id }); },
    personKabar(d) { ui.afTab = 'kabar'; ui.afWho = d.id; go('afeksi'); },
    personPhoto(d) {
      const p = get('person', d.id); if (!p) return;
      photoSource('Foto profil', async (f) => { try { const url = await avatarFrom(f); C.put(store, 'person', { id: p.id, photo: url }); commit(); toast('Foto profil diperbarui'); } catch (e) { toast(e.message); } });
    },
    idAdd(d) { vGate(() => { const p = get('person', d.id); if (p) idForm(p); }); }, idEdit(d) { vGate(() => { const p = get('person', d.id); if (p) idForm(p, +d.i); }); },
    idShow(d) { ui.reveal[d.key] = !ui.reveal[d.key]; render(); },
    async idCopy(d) { const p = get('person', d.id), e = p && idsOf(p)[+d.i]; if (!e) return; try { await navigator.clipboard.writeText(e.no); toast('Nomor disalin'); } catch (x) { toast('Salin manual dari layar'); } },
    fileAdd(d) {
      vGate(() => {
        const p = get('person', d.id); if (!p) return;
        photoSource('Foto berkas ' + (p.nick || p.name), async (f) => {
          let blob; try { blob = await resizeBlob(f, 1400, 0.75); } catch (e) { return toast(e.message); }
          openForm('Label berkas', [{ k: 'label', label: 'Jenis berkas', req: true, list: FILE_LABELS }], { label: 'KTP' }, (v) => {
            (async () => {
              const enc = vOn(); let data = blob, meta = { personId: p.id, label: v.label, size: blob.size };
              if (enc) { if (!VAULT.key) return toast('Dokumen terkunci lagi. Buka dulu dengan password, lalu ulangi.'); data = new Blob([await Vault.sealBytes(VAULT.key, new Uint8Array(await blob.arrayBuffer()))], { type: 'application/octet-stream' }); meta = Object.assign(meta, { enc: 1, mime: blob.type || 'image/jpeg' }); }
              const rec = C.put(store, 'pfile', meta);
              IDB.put(rec.id, data).then(() => { commit(); toast(enc ? 'Berkas tersimpan (terenkripsi) di perangkat ini' : 'Berkas tersimpan di perangkat ini'); }).catch(() => { C.remove(store, rec.id); commit(); toast('Gagal menyimpan berkas (penyimpanan penuh/dibatasi)'); });
            })();
          });
        });
      });
    },
    fileOpen(d) { const f = get('pfile', d.id); if (f) viewFile(f); },
    afWho(d) { ui.afWho = d.id; ui.afCat = 'Semua'; render(); }, afCat(d) { ui.afCat = d.v; render(); }, afWa(d) { afSend('wa', d.id, d.i); }, afShare(d) { afSend('share', d.id, d.i); }, afCopy(d) { afSend('copy', d.id, d.i); },
    draftAdd() { draftForm(); }, draftEdit(d) { draftForm(get('draft', d.id)); },
    cardCat(d) { ui.cardCat = d.v; ui.cardShift = 0; render(); }, cardNext() { ui.cardShift++; render(); },
    cardDone(d) { if (!list('ccard').some((c) => c.q === d.q)) C.put(store, 'ccard', { q: d.q, cat: d.cat, date: C.today() }); commit(); toast('Tersimpan di Riwayat'); },
    notifTest() { if (!('Notification' in window) || Notification.permission !== 'granted') toast('Izinkan notifikasi dulu'); notify('Rumahku', detailOn() ? '💧 Uji pengingat: waktunya minum' : 'Ada pengingat', 'test'); render(); },
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
    C.put(store, 'plan', D({ name: 'Servis AC rumah', group: 'rumah', every: 3, unit: 'month', nextDue: add(-4), cost: 150000, lastDone: add(-94) }));
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
  ['change', 'search'].forEach((ev) => document.addEventListener(ev, (e) => { if (e.target && e.target.id === 'famq') { ui.famQ = e.target.value; render(); const i = document.getElementById('famq'); if (i) { i.focus(); i.setSelectionRange(i.value.length, i.value.length); } } }));
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
        if (!C.validStore(data)) return toast('Berkas bukan backup Rumahku yang valid');
        store = C.mergeStores(store, data); commit(); toast('Backup digabung'); if (vOpen()) vLoadCache().then(render);
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
        if (C.validStore(remote)) { store = C.mergeStores(store, remote); persist(); if (vOpen()) vLoadCache().then(render); }
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
    const fire = (key, body) => { if (fired.has(key)) return; fired.add(key); changed = true; notify('Rumahku', detailOn() ? body : 'Ada pengingat', key); };
    const logs = list('rtlog').filter((l) => l.date === t);
    list('rt').forEach((r) => { const d = C.routineDue(r, t, mins, C.routineDone(logs, r.id, t), fired); if (d) fire(d.key, (r.emoji || '🔔') + ' ' + r.name + ' — ' + d.done + '/' + d.target + (r.unit ? ' ' + r.unit : '')); });
    const wd = C.waterDue(store, t, mins, fired); if (wd) fire(wd.key, '💧 Waktunya minum — ' + Math.round(wd.glasses) + '/' + wd.goal + ' gelas');
    list('task').forEach((x) => {
      if (x.done || x.due !== t || !x.time || x.remind === '' || x.remind == null) return;
      if (C.inWindow(nowMs, C.fireAt(t, x.time, x.remind))) fire('tk|' + x.id + '|' + t + '|' + x.time + '|' + x.remind, '✅ ' + x.title + (+x.remind > 0 ? ' — ' + x.remind + ' menit lagi' : ' — sekarang'));
    });
    // acara: pengingat bisa 3 jam / 1-3 hari / 1 minggu sebelumnya, jadi cek kemunculan sampai 8 hari ke depan
    evOccurrences(t, C.addDays(t, 8)).forEach((o) => {
      C.eventDue(o.ev, o.date, nowMs).forEach((r) => fire(r.key, (C.isBirthdayTitle(o.ev.title) ? '🎂 ' : '📅 ') + o.ev.title + ' — ' + r.label));
    });
    C.birthdayDue(C.calendarItems(store, t, C.addDays(t, 2)), t, nowMs).forEach((b) => fire(b.key, '🎂 ' + b.title + ' ' + (b.dd === 0 ? 'hari ini' : 'besok')));
    if (changed) saveFired(t, fired);
  }
  setInterval(tick, 30000);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') { render(); tick(); } });

  // ---------- mulai ----------
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
    navigator.serviceWorker.register('sw.js').catch(() => { /* PWA opsional */ });
  }
  window.__rk = { store: () => store, C, tick, vault: { on: vOn, open: vOpen, hide: (ms) => { VAULT.hiddenAt = Date.now() - ms; } } };
  render(); tick();
})();
