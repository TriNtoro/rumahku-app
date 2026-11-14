/* RUMAHKU-ONE Lite — logika murni (tanpa DOM) agar bisa diuji di Node. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Core = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // ---------- util ----------
  function uid() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
    return 'id-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
  }
  const pad = (n) => String(n).padStart(2, '0');
  function dstr(d) {
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }
  function today(now) {
    return dstr(now || new Date());
  }
  function parseD(s) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
    if (!m) throw new Error('bad date ' + s);
    return new Date(+m[1], +m[2] - 1, +m[3], 12, 0, 0); // jam 12: aman dari pergeseran DST
  }
  function addDays(s, n) {
    const d = parseD(s);
    d.setDate(d.getDate() + n);
    return dstr(d);
  }
  function daysInMonth(y, m0) {
    return new Date(y, m0 + 1, 0).getDate();
  }
  // anchorDay menjaga tanggal 31 tetap "akhir bulan" di bulan pendek, lalu kembali ke 31.
  function addMonths(s, n, anchorDay) {
    const d = parseD(s);
    const anchor = anchorDay || d.getDate();
    const total = d.getFullYear() * 12 + d.getMonth() + n;
    const y = Math.floor(total / 12);
    const m0 = total % 12;
    return y + '-' + pad(m0 + 1) + '-' + pad(Math.min(anchor, daysInMonth(y, m0)));
  }
  function nextDate(s, repeat, anchorDay) {
    switch (repeat) {
      case 'daily': return addDays(s, 1);
      case 'weekly': return addDays(s, 7);
      case 'monthly': return addMonths(s, 1, anchorDay);
      case 'yearly': return addMonths(s, 12, anchorDay);
      default: return null;
    }
  }
  function cmp(a, b) { return a < b ? -1 : a > b ? 1 : 0; }

  // ---------- tugas ----------
  // Tugas berulang = SATU baris yang majukan due-nya (bukan banyak baris), riwayat di doneLog.
  function completeTask(t, todayS) {
    const log = (t.doneLog || []).concat([todayS]).slice(-100);
    if (!t.repeat || t.repeat === 'none' || !t.due) {
      return Object.assign({}, t, { done: true, doneAt: todayS, doneLog: log });
    }
    const anchor = t.anchorDay || parseD(t.due).getDate();
    let n = nextDate(t.due, t.repeat, anchor);
    let guard = 0;
    while (n <= todayS && guard++ < 3660) n = nextDate(n, t.repeat, anchor); // lewati yang terlewat
    return Object.assign({}, t, { due: n, anchorDay: anchor, done: false, doneLog: log });
  }

  // ---------- kalender ----------
  // Rentang half-open [from,to). Batas 1000 instans (aturan spesifikasi).
  function expandEvent(ev, from, to) {
    const out = [];
    const base = ev.date;
    const endDate = ev.until || null;
    if (!ev.repeat || ev.repeat === 'none') {
      if (base >= from && base < to && !(ev.skip || []).includes(base)) out.push(base);
      return out;
    }
    const anchor = parseD(base).getDate();
    let cur = base, guard = 0;
    while (cur < to && guard++ < 5000 && out.length < 1000) {
      if (endDate && cur > endDate) break;
      if (cur >= from && !(ev.skip || []).includes(cur)) out.push(cur);
      cur = nextDate(cur, ev.repeat, anchor);
    }
    return out;
  }

  // ---------- uang ----------
  // Tampilan rupiah ditulis manual, TIDAK memakai Intl (data ICU berbeda antar versi Node/browser).
  function fmtIDR(n) {
    if (!Number.isSafeInteger(n)) throw new Error('amount must be a safe integer');
    const neg = n < 0;
    const s = String(Math.abs(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return (neg ? '-' : '') + 'Rp ' + s;
  }
  // Menerima "1.500.000", "1500000", "Rp 25.000". Menolak desimal & non-angka -> null.
  function parseAmount(str) {
    if (typeof str === 'number') return Number.isSafeInteger(str) ? str : null;
    let s = String(str == null ? '' : str).trim().replace(/^rp\.?\s*/i, '');
    if (!s) return null;
    if (/[,]\d{1,2}$/.test(s)) return null; // "12,50" = desimal -> ditolak (rupiah utuh)
    s = s.replace(/[.,\s]/g, '');
    if (!/^\d+$/.test(s)) return null;
    const n = Number(s);
    return Number.isSafeInteger(n) ? n : null;
  }

  // Transaksi: income | expense | transfer. void=true -> dianggap tidak ada, barisnya tetap.
  function liveTx(txs) { return txs.filter((t) => !t.void); }
  function balances(accounts, txs) {
    const b = {};
    accounts.forEach((a) => { b[a.id] = a.opening || 0; });
    liveTx(txs).forEach((t) => {
      if (t.kind === 'income') b[t.acc] = (b[t.acc] || 0) + t.amount;
      else if (t.kind === 'expense') b[t.acc] = (b[t.acc] || 0) - t.amount;
      else if (t.kind === 'transfer') {
        b[t.acc] = (b[t.acc] || 0) - t.amount;
        b[t.to] = (b[t.to] || 0) + t.amount;
      }
    });
    return b;
  }
  function netWorth(accounts, txs) {
    const b = balances(accounts, txs);
    return accounts.reduce((s, a) => s + (b[a.id] || 0), 0);
  }
  // Laporan bulanan: transfer dikecualikan dari pemasukan/pengeluaran.
  function monthReport(txs, ym) {
    const r = { income: 0, expense: 0, byCat: {} };
    liveTx(txs).forEach((t) => {
      if (!t.date || t.date.slice(0, 7) !== ym) return;
      if (t.kind === 'income') r.income += t.amount;
      else if (t.kind === 'expense') {
        r.expense += t.amount;
        const c = t.cat || 'Lainnya';
        r.byCat[c] = (r.byCat[c] || 0) + t.amount;
      }
    });
    return r;
  }
  function budgetStatus(budgets, report) {
    return budgets.map((b) => {
      const spent = report.byCat[b.cat] || 0;
      const pct = b.limit > 0 ? Math.floor((spent * 100) / b.limit) : 0;
      return { id: b.id, cat: b.cat, limit: b.limit, spent, pct, level: pct >= 100 ? 'over' : pct >= 80 ? 'warn' : 'ok' };
    });
  }

  // ---------- kebiasaan ----------
  function streak(dates, todayS) {
    const set = new Set(dates);
    let cur = set.has(todayS) ? todayS : addDays(todayS, -1); // hari ini belum dicentang tidak memutus
    let n = 0;
    while (set.has(cur)) { n++; cur = addDays(cur, -1); }
    return n;
  }

  // ---------- ringkasan "Hari ini" ----------
  function warrantySoon(assets, todayS, days) {
    const lim = addDays(todayS, days);
    return assets
      .filter((a) => a.warrantyUntil && a.warrantyUntil >= todayS && a.warrantyUntil <= lim)
      .sort((x, y) => cmp(x.warrantyUntil, y.warrantyUntil));
  }
  function serviceDue(assets, todayS) {
    return assets.filter((a) => a.nextService && a.nextService <= todayS);
  }

  // ---------- penyimpanan & sinkron ----------
  // Store = { v:1, rec:{ [id]: {_t:tipe, _u:ISO-waktu-ubah, _d:true bila dihapus, ...data} } }
  function emptyStore() { return { v: 1, rec: {} }; }
  function put(store, type, data, nowISO) {
    const id = data.id || uid();
    const prev = store.rec[id] || {};
    store.rec[id] = Object.assign({}, prev, data, { id, _t: type, _u: nowISO || new Date().toISOString() });
    delete store.rec[id]._d;
    return store.rec[id];
  }
  function remove(store, id, nowISO) {
    const r = store.rec[id];
    if (!r) return;
    if (r._t === 'tx') throw new Error('Transaksi tidak boleh dihapus; gunakan void');
    store.rec[id] = { id, _t: r._t, _u: nowISO || new Date().toISOString(), _d: true };
  }
  function list(store, type) {
    return Object.values(store.rec).filter((r) => r._t === type && !r._d);
  }
  // Per rekaman: yang _u lebih baru menang. Seri -> bandingkan string agar hasil sama di kedua sisi.
  function mergeStores(a, b) {
    const out = emptyStore();
    const ids = new Set(Object.keys(a.rec).concat(Object.keys(b.rec)));
    ids.forEach((id) => {
      const x = a.rec[id], y = b.rec[id];
      if (!x) out.rec[id] = y;
      else if (!y) out.rec[id] = x;
      else if (x._u !== y._u) out.rec[id] = x._u > y._u ? x : y;
      else out.rec[id] = JSON.stringify(x) >= JSON.stringify(y) ? x : y;
      // Transaksi yang sudah void tidak boleh "hidup lagi" karena merge.
      if (x && y && x._t === 'tx' && (x.void || y.void)) out.rec[id] = Object.assign({}, out.rec[id], { void: true });
    });
    return out;
  }
  function validStore(s) {
    return !!s && s.v === 1 && s.rec && typeof s.rec === 'object' && !Array.isArray(s.rec);
  }

  return {
    uid, dstr, today, parseD, addDays, addMonths, nextDate, cmp,
    completeTask, expandEvent, fmtIDR, parseAmount, liveTx, balances, netWorth,
    monthReport, budgetStatus, streak, warrantySoon, serviceDue,
    emptyStore, put, remove, list, mergeStores, validStore,
  };
});
