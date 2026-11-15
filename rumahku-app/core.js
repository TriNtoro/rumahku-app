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
    const r = { income: 0, expense: 0, byCat: {}, bySrc: {} };
    liveTx(txs).forEach((t) => {
      if (!t.date || t.date.slice(0, 7) !== ym) return;
      if (t.kind === 'income') { r.income += t.amount; const sc = t.cat || 'Lainnya'; r.bySrc[sc] = (r.bySrc[sc] || 0) + t.amount; }
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

  // ---------- keuangan lanjutan (v0.5) ----------
  // Urutkan menurut nominal; sisa di atas `max` irisan digabung ke "Lainnya (gabungan)".
  function topSlices(map, max) {
    const e = Object.keys(map).filter((k) => map[k] > 0).map((k) => ({ name: k, amount: map[k] })).sort((a, b) => b.amount - a.amount || (a.name < b.name ? -1 : 1));
    const total = e.reduce((s, x) => s + x.amount, 0); if (!total) return [];
    let out = e;
    if (e.length > max) { const rest = e.slice(max - 1).reduce((s, x) => s + x.amount, 0); out = e.slice(0, max - 1).concat([{ name: 'Lainnya (gabungan)', amount: rest }]); }
    return out.map((x) => Object.assign(x, { pct: Math.round((x.amount * 1000) / total) / 10 }));
  }
  // Akumulasi harian pemasukan/pengeluaran untuk bulan `ym`, sampai hari `endDay` (transfer dikecualikan).
  function dailyCum(txs, ym, endDay) {
    const inc = new Array(endDay).fill(0), exp = new Array(endDay).fill(0);
    liveTx(txs).forEach((t) => {
      if (!t.date || t.date.slice(0, 7) !== ym) return;
      const d = +t.date.slice(8, 10); if (d < 1 || d > endDay) return;
      if (t.kind === 'income') inc[d - 1] += t.amount; else if (t.kind === 'expense') exp[d - 1] += t.amount;
    });
    for (let i = 1; i < endDay; i++) { inc[i] += inc[i - 1]; exp[i] += exp[i - 1]; }
    return { inc, exp };
  }
  // Kekayaan bersih per tanggal tertentu (transaksi bertanggal <= dateS; saldo awal selalu dihitung).
  function netWorthAt(accounts, txs, dateS) { return netWorth(accounts, txs.filter((t) => t.date && t.date <= dateS)); }
  function assetsDebt(accounts, txs) {
    const b = balances(accounts, txs); let assets = 0, debt = 0;
    accounts.forEach((a) => { const v = b[a.id] || 0; if (v >= 0) assets += v; else debt += -v; });
    return { assets, debt };
  }
  // Rata-rata pemasukan & pengeluaran bulanan dari paling banyak n bulan terakhir (sampai ym) yang punya data.
  function avgMonthly(txs, ym, n) {
    let inc = 0, exp = 0, m = 0, cur = ym;
    for (let i = 0; i < n; i++) {
      const r = monthReport(txs, cur);
      if (r.income > 0 || r.expense > 0) { inc += r.income; exp += r.expense; m++; }
      const y = +cur.slice(0, 4), mo = +cur.slice(5, 7); cur = mo === 1 ? (y - 1) + '-12' : y + '-' + pad(mo - 1);
    }
    return m ? { income: Math.round(inc / m), expense: Math.round(exp / m), months: m } : { income: 0, expense: 0, months: 0 };
  }
  // Batas dana darurat (bulan pengeluaran) per mode: [bantalan, aman, bertumbuh]. Pedoman umum perencana keuangan.
  const EF_MONTHS = { pelajar: [1, 2, 3], pekerja: [1, 3, 6], keluarga: [2, 6, 12] };
  // Tangga kesehatan keuangan 0-5. Hanya angka; hasil bukan nasihat keuangan.
  function healthLevel(i) {
    const mode = EF_MONTHS[i.mode] ? i.mode : 'pekerja', M = EF_MONTHS[mode];
    const names = ['Defisit aset', 'Boncos', 'Tipis', 'Ada bantalan', 'Aman', 'Bertumbuh'];
    const efm = i.avgExpense > 0 ? i.emergency / i.avgExpense : (i.emergency > 0 ? 99 : 0);
    const debtRatio = i.avgIncome > 0 ? (i.debtPay || 0) / i.avgIncome : ((i.debtPay || 0) > 0 ? 1 : 0);
    const saveRate = i.avgIncome > 0 ? (i.avgIncome - i.avgExpense) / i.avgIncome : 0;
    const out = (lv, why, next) => ({ level: lv, name: names[lv], efMonths: Math.round(efm * 10) / 10, debtRatio: Math.round(debtRatio * 1000) / 10, saveRate: Math.round(saveRate * 1000) / 10, why, next, target: M });
    if (!i.hasData) return { level: null, name: 'Belum cukup data', why: 'Catat pemasukan & pengeluaran dulu.', next: '', target: M, efMonths: 0, debtRatio: 0, saveRate: 0 };
    if (i.netWorth < 0) return out(0, 'Utang lebih besar dari seluruh aset.', 'Kurangi utang berbunga tinggi dulu.');
    if (i.avgExpense > i.avgIncome) return out(1, 'Rata-rata pengeluaran lebih besar dari pemasukan.', 'Tekan pengeluaran atau tambah pemasukan agar bulanan tidak minus.');
    if (efm < M[0] || debtRatio > 0.3) return out(2, efm < M[0] ? 'Dana darurat belum mencapai ' + M[0] + ' bulan pengeluaran.' : 'Cicilan lebih dari 30% pemasukan.', efm < M[0] ? 'Sisihkan sampai dana darurat ' + M[0] + ' bulan pengeluaran.' : 'Turunkan cicilan di bawah 30% pemasukan.');
    if (efm < M[1] || saveRate < 0.1) return out(3, 'Dana darurat sudah ' + M[0] + '+ bulan.', efm < M[1] ? 'Naikkan dana darurat ke ' + M[1] + ' bulan.' : 'Sisihkan minimal 10% pemasukan tiap bulan.');
    if (efm < M[2] || saveRate < 0.2) return out(4, 'Dana darurat ' + M[1] + '+ bulan dan menabung ≥ 10%.', efm < M[2] ? 'Naikkan dana darurat ke ' + M[2] + ' bulan.' : 'Naikkan tabungan/investasi ke 20% pemasukan.');
    return out(5, 'Dana darurat ' + M[2] + '+ bulan dan menabung ≥ 20%.', 'Pertahankan, lalu arahkan kelebihan ke tujuan jangka panjang.');
  }
  // Kemajuan tujuan tabungan. goal: {target, date?}; saved: nominal terkumpul.
  function goalProgress(goal, saved, todayS) {
    const target = goal.target || 0, left = Math.max(0, target - saved);
    const pct = target > 0 ? Math.min(100, Math.floor((saved * 1000) / target) / 10) : 0;
    let months = null, perMonth = null, status = left === 0 && target > 0 ? 'tercapai' : 'jalan';
    if (goal.date && left > 0) {
      const a = parseD(todayS), b = parseD(goal.date);
      months = (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth()) + (b.getDate() >= a.getDate() ? 0 : -1);
      if (goal.date <= todayS || months < 1) { months = 0; status = 'terlambat'; perMonth = left; }
      else perMonth = Math.ceil(left / months);
    }
    return { pct, left, months, perMonth, status };
  }
  // Laju belanja: seberapa jauh bulan berjalan vs pemakaian anggaran.
  function budgetPace(limit, spent, ym, todayS) {
    const y = +ym.slice(0, 4), m = +ym.slice(5, 7), dim = daysInMonth(y, m - 1), cur = todayS.slice(0, 7);
    const day = ym < cur ? dim : ym > cur ? 0 : +todayS.slice(8, 10);
    const expectedPct = Math.round((day * 100) / dim), left = limit - spent, daysLeft = Math.max(1, dim - day + (ym === cur ? 1 : 0));
    const pct = limit > 0 ? Math.floor((spent * 100) / limit) : 0;
    return { dim, day, expectedPct, pct, left, daysLeft, perDay: left > 0 ? Math.floor(left / daysLeft) : 0, ahead: pct > expectedPct + 5 };
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


  // ---------- Rumah: hitung mundur, perawatan, tagihan, stok ----------
  function daysBetween(a, b) { return Math.round((parseD(b) - parseD(a)) / 86400000); }
  function countdown(n) {
    if (n < 0) return 'Terlambat ' + -n + ' hari';
    if (n === 0) return 'Hari ini';
    if (n === 1) return 'Besok';
    if (n <= 60) return n + ' hari lagi';
    return Math.round(n / 30) + ' bulan lagi';
  }
  function urgency(n, soon) { return n < 0 ? 'late' : n <= (soon == null ? 7 : soon) ? 'soon' : 'ok'; }
  function intervalLabel(p) {
    const e = p.every;
    if (p.unit === 'day') return e % 7 === 0 ? (e === 7 ? 'tiap minggu' : 'tiap ' + e / 7 + ' minggu') : 'tiap ' + e + ' hari';
    return e % 12 === 0 ? (e === 12 ? 'tiap tahun' : 'tiap ' + e / 12 + ' tahun') : (e === 1 ? 'tiap bulan' : 'tiap ' + e + ' bulan');
  }
  // Jadwal dihitung dari tanggal SELESAI (mode after_completion), bukan dari jatuh tempo lama.
  function planNext(p, doneS) {
    const e = Math.max(1, +p.every || 1);
    return p.unit === 'day' ? addDays(doneS, e) : addMonths(doneS, e, parseD(doneS).getDate());
  }
  function completePlan(p, doneS) {
    return { lastDone: doneS, nextDue: planNext(p, doneS) };
  }
  function dueInMonth(ym, day) {
    const y = +ym.slice(0, 4), m = +ym.slice(5, 7);
    return ym + '-' + pad(Math.min(Math.max(1, +day || 1), daysInMonth(y, m - 1)));
  }
  // ---------- Tagihan & angsuran rutin ----------
  // Model: `bill` = TEMPLATE (jadwal, boleh diubah). `bpay` = RIWAYAT pembayaran (snapshot, tidak ikut berubah saat template diedit).
  // Kejadian (occurrence) diidentifikasi tanggal jatuh temponya (YYYY-MM-DD). Bulanan: tanggal dueDay (dipotong ke akhir bulan);
  // mingguan: hari dueWeekday (0=Min..6=Sab). paidYM/paidThru = penunjuk "lunas sampai" yang dipertahankan agar data lama tetap terbaca.
  const bFreq = (b) => (b && b.freq === 'weekly' ? 'weekly' : 'monthly');
  const billLive = (b) => !!b && !b._d && b.active !== false && !b.closed;
  function fnv(str) { let h = 0x811c9dc5; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 0x01000193); } return (h >>> 0).toString(36); }
  // id deterministik: dua perangkat yang membayar kejadian yang sama menghasilkan SATU catatan (tidak ganda setelah sinkron)
  const payKey = (billId, occ, tag) => fnv(billId + '|' + occ + '|' + tag);
  // kejadian pertama SETELAH afterS (tanggal, eksklusif); tidak memeriksa tanggal akhir/tenor
  function billOccAfter(b, afterS) {
    let from = addDays(afterS, 1);
    if (b.startDate && b.startDate > from) from = b.startDate;
    if (bFreq(b) === 'weekly') {
      const wd = Math.min(6, Math.max(0, +b.dueWeekday || 0));
      let d = from, g = 0; while (parseD(d).getDay() !== wd && g++ < 8) d = addDays(d, 1);
      return d;
    }
    let ym = from.slice(0, 7), d = dueInMonth(ym, b.dueDay), g = 0;
    while (d < from && g++ < 600) { ym = addMonths(ym + '-01', 1, 1).slice(0, 7); d = dueInMonth(ym, b.dueDay); }
    return d;
  }
  // tanggal jatuh tempo terakhir (dari tanggal selesai, atau tanggal mulai + tenor); null bila terbuka
  function billEndDate(b) {
    if (b.endDate) return b.endDate;
    const t = +b.tenor || 0;
    if (!(t > 0) || !b.startDate) return null;
    let d = billOccAfter(b, addDays(b.startDate, -1));
    for (let i = 1; i < t; i++) d = billOccAfter(b, d);
    return d;
  }
  // buku besar pembayaran satu template: per kejadian {paid, due, full}, jumlah angsuran lunas, total dibayar
  function billLedger(b, pays) {
    const byOcc = {}; let paidTotal = 0;
    (pays || []).forEach((p) => {
      if (p.void || p.billId !== b.id) return;
      const o = byOcc[p.occ] || (byOcc[p.occ] = { paid: 0, due: +p.due || 0, full: false });
      o.paid += +p.amount || 0; paidTotal += +p.amount || 0;
      if (!p.part) o.full = true;
    });
    let fullCount = 0;
    Object.keys(byOcc).forEach((k) => { const o = byOcc[k]; if (!o.full && o.due > 0 && o.paid >= o.due) o.full = true; if (o.full) fullCount++; });
    return { byOcc, fullCount, paidTotal };
  }
  // Kejadian berikutnya yang BELUM lunas (boleh sudah lewat = terlambat). null = tidak ada lagi (nonaktif, lunas, selesai).
  // Tanpa `pays` perilaku sama seperti versi lama (hanya paidYM/paidThru).
  function billNext(b, todayS, pays) {
    if (!b || !billLive(b)) return null;
    let n;
    if (bFreq(b) === 'weekly') {
      n = b.paidThru ? billOccAfter(b, b.paidThru) : billOccAfter(b, addDays(todayS, -1));
    } else {
      let ym = todayS.slice(0, 7), due = dueInMonth(ym, b.dueDay), g = 0;
      while (b.paidYM && due.slice(0, 7) <= b.paidYM && g++ < 36) { ym = addMonths(ym + '-01', 1, 1).slice(0, 7); due = dueInMonth(ym, b.dueDay); }
      n = due;
      if (b.paidYM && b.paidYM < todayS.slice(0, 7)) { // ada bulan terlewat: tampilkan yang paling lama belum dibayar
        const first = billOccAfter(b, dueInMonth(b.paidYM, 31)); if (first < n) n = first;
      }
      if (b.startDate && n < b.startDate) n = billOccAfter(b, addDays(b.startDate, -1));
    }
    if (pays) {
      const led = billLedger(b, pays); let g = 0;
      while (led.byOcc[n] && led.byOcc[n].full && g++ < 600) n = billOccAfter(b, n);
      const t = +b.tenor || 0;
      if (t > 0 && (+b.instBefore || 0) + led.fullCount >= t) return null;
    }
    const end = billEndDate(b); if (end && n > end) return null;
    return n;
  }
  // Ringkasan satu template: angsuran ke-n, sisa tenor, sisa kewajiban, status.
  // Sisa kewajiban: bila ada tenor & nominal = sisa angsuran × nominal; bila tidak = total − uang muka − dibayar sebelumnya − riwayat; selain itu null.
  function billState(b, pays, todayS) {
    const led = billLedger(b, pays), instDone = (+b.instBefore || 0) + led.fullCount, tenor = +b.tenor || 0, nominal = +b.amountEst || 0;
    const next = billNext(b, todayS, pays), open = next && led.byOcc[next] ? led.byOcc[next] : null, partial = open && !open.full ? open.paid : 0;
    let remaining = null, remInst = tenor > 0 ? Math.max(0, tenor - instDone) : null;
    if (b.closed) { remaining = 0; remInst = 0; }
    else if (tenor > 0 && nominal > 0) remaining = Math.max(0, remInst * nominal - partial);
    else if (+b.total > 0) remaining = Math.max(0, (+b.total || 0) - (+b.dp || 0) - (+b.paidBefore || 0) - led.paidTotal);
    let status;
    if (b.closed) status = 'lunas';
    else if (b.active === false) status = 'nonaktif';
    else if (!next) status = 'lunas';
    else if (next < todayS) status = 'terlambat';
    else if (partial > 0) status = 'sebagian';
    else if (bFreq(b) === 'weekly' ? daysBetween(todayS, next) <= 7 : next.slice(0, 7) === todayS.slice(0, 7)) status = 'belum';
    else status = b.paidYM === todayS.slice(0, 7) || (b.paidThru && daysBetween(b.paidThru, todayS) <= 7) || led.byOcc[dueInMonth(todayS.slice(0, 7), b.dueDay)] ? 'sudah' : 'upcoming';
    return { next, instDone, instNext: tenor > 0 && instDone >= tenor ? null : instDone + 1, remainingInst: remInst, remaining, status, partial, paidTotal: led.paidTotal, end: billEndDate(b), ledger: led };
  }
  // Rencana pembayaran (murni): menentukan kejadian yang dibayar, id deterministik, dan menolak pembayaran ganda.
  // o = {date, amount, part, payoff, today}. Hasil: {error} atau {occ, due, late, full, instNo, payId, txId, payoff}.
  function billPayPlan(b, pays, o) {
    if (!billLive(b)) return { error: 'Tagihan ini tidak aktif atau sudah lunas.' };
    const amount = Math.round(+o.amount || 0); if (!(amount >= 0) || !Number.isFinite(amount)) return { error: 'Nominal tidak valid.' };
    const st = billState(b, pays, o.today); const occ = st.next;
    if (!occ) return { error: 'Tidak ada tagihan yang perlu dibayar.' };
    const full = !o.part || !!o.payoff;
    const led = st.ledger.byOcc[occ]; if (led && led.full) return { error: 'Periode ini sudah lunas.' };
    const tag = full ? (o.payoff ? 'PAYOFF' : 'FULL') : 'P|' + o.date + '|' + amount;
    const payId = 'bp' + payKey(b.id, occ, tag);
    if ((pays || []).some((p) => p.id === payId && !p.void)) return { error: 'Pembayaran ini sudah tercatat.' };
    const tenor = +b.tenor || 0;
    return { occ, due: +b.amountEst || 0, late: o.date > occ, full, part: !full, payoff: !!o.payoff, instNo: o.payoff && tenor > 0 ? tenor : st.instDone + 1, payId, txId: 'tx' + payKey(b.id, occ, tag), amount };
  }
  // Terapkan rencana pembayaran ke store: riwayat (bpay) + pengeluaran (tx, bila akun dipilih) + penunjuk lunas. Idempoten (id deterministik).
  function applyBillPay(store, b, plan, o) {
    const now = o.nowISO;
    put(store, 'bpay', { id: plan.payId, billId: b.id, name: b.name, cat: b.cat || '', occ: plan.occ, date: o.date, amount: plan.amount, due: plan.due, part: plan.part, payoff: plan.payoff, late: plan.late, instNo: plan.instNo, txId: o.accId && plan.amount > 0 ? plan.txId : '', void: false }, now);
    if (o.accId && plan.amount > 0) {
      put(store, 'tx', { id: plan.txId, kind: 'expense', amount: plan.amount, acc: o.accId, to: '', cat: o.cat || 'Tagihan', date: o.date, note: b.name + (+b.tenor > 0 || +b.instBefore > 0 ? ' · angsuran ke-' + plan.instNo : '') + (plan.part ? ' (sebagian)' : ''), cid: plan.txId, void: false }, now);
    }
    if (plan.full) {
      const patch = { id: b.id, lastPaid: o.date, lastAmount: plan.amount, paidThru: b.paidThru && b.paidThru > plan.occ ? b.paidThru : plan.occ };
      const ym = plan.occ.slice(0, 7); if (bFreq(b) === 'monthly') patch.paidYM = b.paidYM && b.paidYM > ym ? b.paidYM : ym;
      if (plan.payoff) { patch.closed = true; patch.closedAt = o.date; }
      put(store, 'bill', patch, now);
    }
  }
  // Batalkan satu pembayaran: riwayat & transaksi di-void (tidak dihapus), penunjuk lunas mundur.
  function voidBillPay(store, payId, todayS, nowISO) {
    const p = store.rec[payId]; if (!p || p._t !== 'bpay' || p.void) return false;
    put(store, 'bpay', { id: payId, void: true, voidAt: todayS }, nowISO);
    if (p.txId && store.rec[p.txId] && !store.rec[p.txId].void) put(store, 'tx', { id: p.txId, void: true, voidAt: todayS }, nowISO);
    const b = store.rec[p.billId];
    if (b && !b._d && !p.part) {
      const patch = { id: b.id };
      if (bFreq(b) === 'monthly') { const prev = addMonths(p.occ.slice(0, 7) + '-01', -1, 1).slice(0, 7); if (b.paidYM && b.paidYM >= p.occ.slice(0, 7)) patch.paidYM = prev; }
      if (b.paidThru && b.paidThru >= p.occ) patch.paidThru = bFreq(b) === 'weekly' ? addDays(p.occ, -7) : addMonths(p.occ, -1, +b.dueDay || undefined);
      if (p.payoff) { patch.closed = false; patch.closedAt = ''; }
      put(store, 'bill', patch, nowISO);
    }
    return true;
  }
  // Ringkasan dashboard untuk satu bulan (YYYY-MM): total, sudah, belum, terlambat, daftar kejadian
  function billMonthSummary(bills, pays, ym, todayS) {
    const rows = []; let total = 0, paid = 0, late = 0;
    bills.filter((b) => !b._d && b.active !== false).forEach((b) => {
      const led = billLedger(b, pays), first = ym + '-01', end = billEndDate(b), stop = !!b.closed;
      const to = addMonths(first, 1, 1); const occs = [];
      let d = billOccAfter(b, addDays(first, -1)), g = 0;
      while (d < to && g++ < 10) { occs.push(d); d = billOccAfter(b, d); }
      occs.forEach((occ) => {
        const l = led.byOcc[occ]; if (!l && (stop || (end && occ > end))) return;
        if (!l && (+b.tenor > 0) && (+b.instBefore || 0) + led.fullCount >= +b.tenor) return;
        const legacy = !l && bFreq(b) === 'monthly' && b.paidYM && occ.slice(0, 7) <= b.paidYM;
        const due = l && l.due ? l.due : (+b.amountEst || 0), got = l ? Math.min(l.paid, Math.max(due, l.paid)) : legacy ? due : 0, full = !!(l && l.full) || legacy;
        const left = full ? 0 : Math.max(0, due - got);
        total += Math.max(due, got); paid += got; if (!full && occ < todayS) late += left;
        rows.push({ bill: b, occ, due, paid: got, full, late: !full && occ < todayS });
      });
    });
    return { total, paid, unpaid: Math.max(0, total - paid), late, rows };
  }
  // Sisa km sampai perawatan berikut (null bila rencana tidak berbasis km atau odometer belum diisi).
  function kmLeft(p, odo) { return p.nextKm && odo != null && odo !== '' ? p.nextKm - Number(odo) : null; }
  function lowStock(items) { return items.filter((i) => +i.min > 0 && +i.qty <= +i.min); }

  // Semua hal rumah yang butuh perhatian, terurut: terlambat dulu, lalu paling dekat.
  function homeAttention(store, todayS) {
    const L = (t) => list(store, t), out = [];
    const push = (kind, icon, text, date, go, soon) => {
      const n = daysBetween(todayS, date);
      if (n <= soon) out.push({ kind, icon, text, date, n, level: urgency(n, 7), go });
    };
    const vehs = {}; L('veh').forEach((v) => { vehs[v.id] = v; });
    L('plan').forEach((p) => {
      const ic = p.group === 'kendaraan' ? '🚗' : p.group === 'elektronik' ? '🔌' : '🔧';
      const vn = p.vehicleId && vehs[p.vehicleId] ? ' (' + vehs[p.vehicleId].name + ')' : '';
      if (p.nextDue) push('plan', ic, p.name + vn, p.nextDue, p.vehicleId ? 'kendaraan' : 'perawatan', 14);
      const left = kmLeft(p, p.vehicleId && vehs[p.vehicleId] ? vehs[p.vehicleId].odometer : null);
      if (left != null && left <= 500) out.push({ kind: 'plankm', icon: ic, text: p.name + vn + (left <= 0 ? ' lewat ' + -left + ' km' : ' ' + left + ' km lagi'), date: todayS, n: left <= 0 ? -1 : 0, level: left <= 0 ? 'late' : 'soon', go: 'kendaraan' });
    });
    L('veh').forEach((v) => {
      if (v.pajakDue) push('pajak', '🚗', 'Pajak ' + v.name, v.pajakDue, 'kendaraan', 30);
      if (v.stnkDue) push('stnk', '🪪', 'STNK ' + v.name, v.stnkDue, 'kendaraan', 30);
    });
    const bpays = L('bpay');
    L('bill').forEach((b) => { const nx = billNext(b, todayS, bpays); if (nx) push('bill', '🧾', 'Tagihan ' + b.name, nx, 'tagihan', 7); });
    L('asset').forEach((a) => {
      if (a.warrantyUntil && a.warrantyUntil >= todayS) push('warranty', '🛡️', 'Garansi ' + a.name + ' berakhir', a.warrantyUntil, 'aset', 30);
    });
    const vaultOn = !!(store.rec.vault && !store.rec.vault._d); // brankas aktif: judul dokumen disamarkan
    L('doc').forEach((d) => d.expiry && push('doc', '📄', (vaultOn ? 'Dokumen penting' : d.title) + ' kedaluwarsa', d.expiry, 'dokumen', 60));
    L('inv').forEach((i) => i.expiry && push('invexp', '🥫', i.name + ' kedaluwarsa', i.expiry, 'stok', 14));
    const low = lowStock(L('inv'));
    low.forEach((i) => out.push({ kind: 'low', icon: '📦', text: i.name + ' hampir habis', date: todayS, n: 0, level: 'soon', go: 'stok' }));
    return out.sort((a, b) => a.n - b.n);
  }

  // ---------- penyimpanan & sinkron ----------
  // Store = { v:1, rec:{ [id]: {_t:tipe, _u:ISO-waktu-ubah, _d:true bila dihapus, ...data} } }
  function emptyStore() { return { v: 1, rec: {} }; }
  function put(store, type, data, nowISO) {
    const id = data.id || uid();
    const prev = store.rec[id] || {};
    store.rec[id] = Object.assign({}, prev, data, { id, _t: type, _u: nowISO || new Date().toISOString() });
    delete store.rec[id]._d;
    // Data contoh yang diubah pengguna jadi milik pengguna: tidak ikut terhapus oleh "Hapus data contoh".
    if (prev.demo && !('demo' in data)) delete store.rec[id].demo;
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

  // ---------- v0.3: rutinitas harian, pengingat, profil ----------
  function greeting(hour) { return hour >= 4 && hour < 11 ? 'Selamat pagi' : hour >= 11 && hour < 15 ? 'Selamat siang' : hour >= 15 && hour < 18 ? 'Selamat sore' : 'Selamat malam'; }
  function toMin(hm) {
    const m = /^(\d{1,2}):(\d{2})$/.exec(String(hm || ''));
    if (!m || +m[1] > 23 || +m[2] > 59) return null;
    return +m[1] * 60 + +m[2];
  }
  const fmtHM = (min) => pad(Math.floor(min / 60)) + ':' + pad(min % 60);
  // Jam pengingat dalam sehari: tepat 1 jam bila everyMin kosong, selain itu dari 'from' sampai 'to' tiap everyMin (maks 48 slot).
  function routineTimes(r) {
    const a = toMin(r.from);
    if (a == null) return [];
    const step = +r.everyMin || 0;
    if (step < 5) return [fmtHM(a)];
    const b = toMin(r.to);
    const end = b == null || b < a ? a : b, out = [];
    for (let m = a; m <= end && out.length < 48; m += step) out.push(fmtHM(m));
    return out;
  }
  function routineActiveOn(r, dateS) {
    const d = r.days;
    if (!d || !d.length) return true;
    return d.indexOf(parseD(dateS).getDay()) >= 0;
  }
  const routineTarget = (r) => Math.max(1, Math.round(+r.target) || 1);
  function routineDone(logs, rid, dateS) {
    return logs.reduce((s, l) => (l.routineId === rid && l.date === dateS ? s + (+l.n || 0) : s), 0);
  }
  // Slot terakhir yang sudah lewat dan belum diingatkan; null bila sudah sesuai laju / terlalu lama lewat (graceMin).
  function routineDue(r, dateS, nowMin, done, firedKeys, graceMin) {
    if (!routineActiveOn(r, dateS) || r.paused) return null;
    const times = routineTimes(r), target = routineTarget(r);
    if (!times.length || done >= target) return null;
    let idx = -1;
    times.forEach((t, i) => { if (toMin(t) <= nowMin) idx = i; });
    if (idx < 0) return null;
    const at = toMin(times[idx]);
    if (nowMin - at > (graceMin == null ? 20 : graceMin)) return null;
    const expected = Math.ceil(target * (idx + 1) / times.length);
    if (done >= expected) return null;
    const key = r.id + '|' + dateS + '|' + times[idx];
    if (firedKeys && firedKeys.has(key)) return null;
    return { key, time: times[idx], expected, done, target };
  }
  // Target yang seharusnya sudah tercapai pada menit tertentu (untuk indikator laju).
  function routineExpected(r, nowMin) {
    const times = routineTimes(r), target = routineTarget(r);
    let n = 0; times.forEach((t) => { if (toMin(t) <= nowMin) n++; });
    return times.length ? Math.ceil(target * n / times.length) : 0;
  }
  // Saat pengingat (epoch ms, jam lokal) untuk item bertanggal+jam; remindMin = berapa menit sebelumnya.
  function fireAt(dateS, hm, remindMin) {
    const m = toMin(hm); if (m == null) return null;
    const d = parseD(dateS); d.setHours(0, 0, 0, 0);
    return d.getTime() + (m - (+remindMin || 0)) * 60000;
  }
  function inWindow(nowMs, atMs, graceMin) { return atMs != null && nowMs >= atMs && nowMs - atMs <= (graceMin || 30) * 60000; }
  function maskId(s) {
    const t = String(s || '').replace(/\s+/g, '');
    if (t.length <= 4) return '••••';
    if (t.length <= 8) return '••••' + t.slice(-2);
    return t.slice(0, 4) + '•'.repeat(t.length - 8) + t.slice(-4);
  }
  function ageOn(birth, todayS) {
    if (!birth) return null;
    const b = parseD(birth), t = parseD(todayS);
    let a = t.getFullYear() - b.getFullYear();
    if (t.getMonth() < b.getMonth() || (t.getMonth() === b.getMonth() && t.getDate() < b.getDate())) a--;
    return a >= 0 ? a : null;
  }
  // Semua hal bertanggal untuk kalender (rentang setengah terbuka [from,to)): acara, tugas, ulang tahun, tagihan, perawatan, pajak/STNK, garansi, dokumen, stok kedaluwarsa.
  // ---------- pengingat acara (gaya Google Calendar: boleh 2 pengingat, dalam menit sebelum jam mulai) ----------
  const BDAY_RE = /ulang\s*tahun|ultah|birthday|\bhbd\b|\bb'?day\b/i;
  const isBirthdayTitle = (t) => BDAY_RE.test(String(t || ''));
  // Acara seharian tidak punya jam: pengingat dihitung dari jam 08.00 pada hari H.
  const ALLDAY_REF = '08:00';
  // remind lama: undefined = 10 menit (hanya acara ber-jam), '' = tanpa. remind2: kosong = tidak ada.
  function remindList(ev) {
    const timed = !!(ev.time && !ev.allDay), out = [];
    const r1 = ev.remind;
    if (r1 == null) { if (timed) out.push(10); } else if (r1 !== '' && !isNaN(+r1)) out.push(+r1);
    if (ev.remind2 != null && ev.remind2 !== '' && !isNaN(+ev.remind2)) out.push(+ev.remind2);
    return out.filter((m, i, a) => m >= 0 && a.indexOf(m) === i);
  }
  function remindLabel(min, allDay) {
    min = +min;
    if (min === 0) return allDay ? 'hari ini' : 'sekarang';
    if (min < 60) return min + ' menit lagi';
    if (min < 1440) return (min / 60) + ' jam lagi';
    if (min === 1440) return 'besok';
    if (min % 10080 === 0) return (min / 10080) + ' minggu lagi';
    return Math.round(min / 1440) + ' hari lagi';
  }
  // Pengingat acara yang jatuh tempo SEKARANG untuk satu kemunculan (dateS).
  // Jendela: 30 menit untuk pengingat menit/jam; 6 jam untuk pengingat berbasis hari (HP baru dibuka siang hari tetap dapat).
  function eventDue(ev, dateS, nowMs) {
    const timed = !!(ev.time && !ev.allDay), ref = timed ? ev.time : ALLDAY_REF, out = [];
    const startMs = fireAt(dateS, ref, 0), endMs = fireAt(dateS, '23:59', 0);
    remindList(ev).forEach((m) => {
      const at = fireAt(dateS, ref, m); if (at == null) return;
      const grace = m >= 1440 ? 360 : 30;
      if (!inWindow(nowMs, at, grace)) return;
      if (m > 0 && nowMs > (timed ? startMs : endMs)) return;
      out.push({ min: m, key: 'ev|' + ev.id + '|' + dateS + '|' + ref + '|' + m, label: remindLabel(m, !timed) });
    });
    return out;
  }
  // Ulang tahun anggota keluarga: otomatis diingatkan H-1 dan hari H pukul 08.00 (jendela 12 jam).
  function birthdayDue(items, todayS, nowMs) {
    const out = [];
    items.filter((x) => x.kind === 'birthday' && !x.id).forEach((x) => {
      const dd = x.date === todayS ? 0 : x.date === addDays(todayS, 1) ? 1 : -1; if (dd < 0) return;
      const at = fireAt(todayS, ALLDAY_REF, 0);
      if (inWindow(nowMs, at, 720)) out.push({ key: 'bd|' + x.title + '|' + x.date + '|' + dd, text: (dd === 0 ? 'hari ini' : 'besok') + ' — ' + x.title, title: x.title, dd });
    });
    return out;
  }

  function calendarItems(store, from, to) {
    const out = [], L = (t) => list(store, t);
    const push = (date, kind, icon, title, sub, go, extra) => { if (date >= from && date < to) out.push(Object.assign({ date, kind, icon, title, sub: sub || '', go: go || '' }, extra || {})); };
    L('event').forEach((ev) => expandEvent(ev, from, to).forEach((d) => push(d, 'event', isBirthdayTitle(ev.title) ? '🎂' : '📅', ev.title, ev.time && !ev.allDay ? ev.time : 'Seharian', '', { id: ev.id, occ: d, time: ev.allDay ? '' : ev.time, bday: isBirthdayTitle(ev.title) })));
    L('task').filter((t) => !t.done && t.due).forEach((t) => push(t.due, 'task', '✅', t.title, t.time || '', 'tugas', { id: t.id, time: t.time }));
    const pr = store.rec.profile && !store.rec.profile._d ? store.rec.profile : null;
    const people = L('person').map((p) => ({ name: p.nick || p.name, birth: p.birth })).concat(pr && pr.birth ? [{ name: pr.nick || pr.name || 'Saya', birth: pr.birth }] : []).filter((p) => /^\d{4}-\d{2}-\d{2}$/.test(p.birth || ''));
    const bpays = L('bpay'), bills = L('bill').filter((b) => billLive(b) && (bFreq(b) === 'weekly' || +b.dueDay >= 1)).map((b) => ({ b, end: billEndDate(b), led: billLedger(b, bpays) }));
    for (let d = from; d < to; d = addDays(d, 1)) {
      const dt = parseD(d), md = d.slice(5), dim = daysInMonth(dt.getFullYear(), dt.getMonth());
      people.forEach((p) => {
        let bmd = p.birth.slice(5); if (bmd === '02-29' && dim === 28) bmd = '02-28';
        if (bmd === md) { const age = dt.getFullYear() - +p.birth.slice(0, 4); push(d, 'birthday', '🎂', 'Ulang tahun ' + p.name, age > 0 ? 'ke-' + age : '', 'keluarga'); }
      });
      bills.forEach(({ b, end, led }) => {
        if (b.startDate && d < b.startDate) return; if (end && d > end) return;
        const hit = bFreq(b) === 'weekly' ? dt.getDay() === (+b.dueWeekday || 0) : Math.min(+b.dueDay, dim) === dt.getDate();
        if (!hit) return;
        const l = led.byOcc[d], paid = !!(l && l.full) || (bFreq(b) === 'monthly' && !!b.paidYM && d.slice(0, 7) <= b.paidYM);
        if (!paid && (+b.tenor > 0) && (+b.instBefore || 0) + led.fullCount >= +b.tenor) return;
        push(d, 'bill', '🧾', b.name, paid ? 'sudah dibayar' : l && l.paid > 0 ? 'dibayar sebagian' : b.amountEst ? '±' + fmtIDR(b.amountEst) : 'tagihan', 'tagihan', { paid });
      });
    }
    L('plan').forEach((p) => push(p.nextDue, 'plan', '🔧', p.name, 'perawatan', p.vehicleId ? 'kendaraan' : 'perawatan'));
    L('veh').forEach((v) => { push(v.pajakDue, 'veh', '🚗', 'Pajak ' + v.name, 'jatuh tempo', 'kendaraan'); push(v.stnkDue, 'veh', '🚗', 'STNK ' + v.name, 'jatuh tempo', 'kendaraan'); });
    L('asset').forEach((a) => push(a.warrantyUntil, 'asset', '🛡️', 'Garansi habis: ' + a.name, '', 'aset'));
    const vaultOn = !!(store.rec.vault && !store.rec.vault._d);
    L('doc').forEach((d) => push(d.expiry, 'doc', '📄', vaultOn ? 'Dokumen penting berlaku sampai' : 'Berlaku sampai: ' + d.title, '', 'dokumen'));
    L('inv').forEach((i) => push(i.expiry, 'inv', '📦', 'Kedaluwarsa: ' + i.name, '', 'stok'));
    return out.sort((a, b) => cmp(a.date, b.date) || cmp(a.time || '', b.time || '') || cmp(a.title, b.title));
  }

  // ---------- berat badan & IMT (klasifikasi Kemenkes RI / P2PTM 2018; hanya untuk dewasa >= 18 th) ----------
  function bmi(kg, cm) {
    kg = +kg; cm = +cm;
    if (!(kg > 0) || !(cm > 0)) return null;
    const m = cm / 100; return Math.round(kg / (m * m) * 10) / 10;
  }
  // < 17 sangat kurus; 17.0-18.4 kurus; 18.5-25.0 normal; 25.1-27.0 gemuk (kelebihan BB ringan); > 27 obesitas
  function bmiCategory(b) {
    if (b == null) return null;
    if (b < 17) return { key: 'sangat-kurus', label: 'Sangat kurus', level: 'low' };
    if (b < 18.5) return { key: 'kurus', label: 'Kurus', level: 'low' };
    if (b <= 25) return { key: 'normal', label: 'Normal', level: 'ok' };
    if (b <= 27) return { key: 'gemuk', label: 'Gemuk (kelebihan berat badan ringan)', level: 'warn' };
    return { key: 'obesitas', label: 'Obesitas', level: 'high' };
  }
  // Rentang berat badan normal (IMT 18.5-25.0) untuk tinggi tertentu.
  function healthyRange(cm) {
    cm = +cm; if (!(cm > 0)) return null;
    const m2 = Math.pow(cm / 100, 2);
    const r1 = (x) => Math.round(x * 10 + 1e-6) / 10;
    return { min: r1(18.5 * m2), max: r1(25 * m2) };
  }
  // Lingkar perut berisiko (obesitas sentral): pria >= 90 cm, wanita >= 80 cm.
  function waistRisk(sex, cm) { cm = +cm; if (!(cm > 0) || (sex !== 'L' && sex !== 'P')) return null; return cm >= (sex === 'L' ? 90 : 80); }
  // logs: [{date,kg}] -> titik terurut, satu per tanggal (yang terakhir menang)
  function weightSeries(logs) {
    const m = {}; logs.forEach((l) => { if (l.date && +l.kg > 0) m[l.date] = +l.kg; });
    return Object.keys(m).sort().map((d) => ({ date: d, kg: m[d] }));
  }
  // Perubahan kg per minggu dari data dalam `days` hari terakhir (regresi garis lurus sederhana); null bila data kurang.
  function weeklyRate(series, todayS, days) {
    const from = addDays(todayS, -(days || 14)), pts = series.filter((p) => p.date >= from && p.date <= todayS);
    if (pts.length < 3) return null;
    const x0 = parseD(pts[0].date).getTime(), xs = pts.map((p) => (parseD(p.date).getTime() - x0) / 86400000), ys = pts.map((p) => p.kg);
    const n = pts.length, mx = xs.reduce((a, b) => a + b, 0) / n, my = ys.reduce((a, b) => a + b, 0) / n;
    const den = xs.reduce((a, x) => a + (x - mx) * (x - mx), 0); if (den === 0) return null;
    const slope = xs.reduce((a, x, i) => a + (x - mx) * (ys[i] - my), 0) / den;
    return Math.round(slope * 7 * 100) / 100;
  }

  // Nomor WhatsApp internasional tanpa tanda: 0812-xxx -> 62812xxx (Indonesia); "+62 8.." -> 628..
  function waNumber(phone) {
    let d = String(phone || '').replace(/[^\d+]/g, '');
    const plus = d.startsWith('+'); d = d.replace(/\D/g, '');
    if (!d) return '';
    if (!plus && d.startsWith('0')) d = '62' + d.slice(1);
    else if (!plus && d.startsWith('8')) d = '62' + d;
    return d.length >= 8 && d.length <= 15 ? d : '';
  }

  // ---------- Minum air ----------
  // Catatan = `wlog` {date, time, ml, gml, goalMl, void}; pengaturan = satu record `wcfg`. Perubahan target/ukuran gelas tidak mengubah riwayat (ml per catatan + snapshot target).
  const WATER_DEFAULT = { on: true, goal: 8, glassMl: 250, from: '08:00', to: '20:00', every: 60, quietFrom: '', quietTo: '' };
  function waterCfg(store) {
    const r = store.rec.wcfg && !store.rec.wcfg._d ? store.rec.wcfg : {}, o = Object.assign({}, WATER_DEFAULT);
    for (const k of Object.keys(WATER_DEFAULT)) if (r[k] !== undefined && r[k] !== null && r[k] !== '') o[k] = r[k];
    if (r.quietFrom === '' || r.quietTo === '') { o.quietFrom = ''; o.quietTo = ''; }
    o.goal = Math.min(40, Math.max(1, Math.round(+o.goal) || 8)); o.glassMl = Math.min(2000, Math.max(50, Math.round(+o.glassMl) || 250)); o.every = Math.max(15, Math.round(+o.every) || 60);
    o.goalMl = o.goal * o.glassMl; return o;
  }
  const waterLogs = (store, dateS) => list(store, 'wlog').filter((l) => !l.void && l.date === dateS).sort((a, b) => cmp((a.time || '') + a._u, (b.time || '') + b._u));
  function waterDay(store, dateS) {
    const cfg = waterCfg(store), ls = waterLogs(store, dateS), ml = ls.reduce((s, l) => s + (+l.ml || 0), 0);
    const goalMl = ls.length && ls[ls.length - 1].goalMl ? +ls[ls.length - 1].goalMl : cfg.goalMl; // riwayat memakai target saat dicatat
    return { ml, goalMl, glasses: Math.round((ml / cfg.glassMl) * 10) / 10, pct: goalMl > 0 ? Math.min(999, Math.round((ml / goalMl) * 100)) : 0, count: ls.length, logs: ls, reached: ml >= goalMl };
  }
  // tambah air: ml bulat 1..5000; hindari catatan ganda (id deterministik per tanggal+menit+ml+urutan) lewat batas waktu di UI dan pengecekan ini
  function waterAdd(store, ml, dateS, hm, nowISO) {
    const v = Math.round(+ml); if (!(v >= 1 && v <= 5000)) return null;
    const cfg = waterCfg(store); return put(store, 'wlog', { date: dateS, time: hm, ml: v, gml: cfg.glassMl, goalMl: cfg.goalMl, void: false }, nowISO);
  }
  function waterUndoLast(store, dateS, nowISO) { const ls = waterLogs(store, dateS); if (!ls.length) return null; const l = ls[ls.length - 1]; put(store, 'wlog', { id: l.id, void: true }, nowISO); return l; }
  function inQuiet(min, qf, qt) { const a = toMin(qf), b = toMin(qt); if (a == null || b == null || a === b) return false; return a < b ? min >= a && min < b : min >= a || min < b; }
  function waterTimes(cfg) {
    const a = toMin(cfg.from), b = toMin(cfg.to); if (a == null || b == null || b < a) return [];
    const out = []; for (let m = a; m <= b && out.length < 48; m += cfg.every) if (!inQuiet(m, cfg.quietFrom, cfg.quietTo)) out.push(fmtHM(m)); return out;
  }
  // pengingat yang jatuh tempo sekarang (null bila mati, target tercapai, di luar rentang, jam tenang, atau sudah dikirim)
  function waterDue(store, dateS, nowMin, fired, graceMin) {
    const cfg = waterCfg(store); if (!cfg.on || inQuiet(nowMin, cfg.quietFrom, cfg.quietTo)) return null;
    const day = waterDay(store, dateS); if (day.reached) return null;
    const grace = graceMin || 20; let hit = null;
    waterTimes(cfg).forEach((hm) => { const m = toMin(hm); if (m <= nowMin && nowMin - m <= grace) hit = hm; });
    if (!hit) return null; const key = 'wt|' + dateS + '|' + hit; if (fired && fired.has(key)) return null;
    return { key, ml: day.ml, goalMl: day.goalMl, glasses: day.glasses, goal: cfg.goal };
  }
  function waterHistory(store, endS, days) {
    const out = []; for (let i = 0; i < days; i++) { const d = addDays(endS, -i), x = waterDay(store, d); out.push({ date: d, ml: x.ml, goalMl: x.goalMl, pct: x.pct, count: x.count }); } return out;
  }

  // Sabtu/Minggu (untuk pewarnaan kalender); tanggal lokal YYYY-MM-DD
  function isWeekend(dateS) { const d = parseD(dateS).getDay(); return d === 0 || d === 6; }
  // Aksi kontak dari nomor telepon. wa = angka internasional untuk wa.me (kosong bila tidak valid); tel = nomor dengan + untuk tel:/sms:.
  // Nomor Indonesia harus ponsel (62 + 8xx, 9–12 digit sesudah 62); nomor luar negeri diterima 8–15 digit.
  function phoneActions(phone) {
    const wa = waNumber(phone); if (!wa) return { ok: false, wa: '', tel: '' };
    if (wa.startsWith('62') && !/^628\d{8,11}$/.test(wa)) return { ok: false, wa: '', tel: '+' + wa };
    return { ok: true, wa, tel: '+' + wa };
  }
  function waUrl(phone, text) { const a = phoneActions(phone); return a.ok ? 'https://wa.me/' + a.wa + (text ? '?text=' + encodeURIComponent(text) : '') : ''; }

  // ICS: pengingat nyata di HP lewat aplikasi Kalender (jalan walau aplikasi ini tertutup).
  const icsEsc = (s) => String(s == null ? '' : s).replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/[,;]/g, (c) => '\\' + c);
  function icsFold(line) {
    const out = []; let cur = '';
    for (const ch of line) { if ((cur + ch).length > 60) { out.push(cur); cur = ' ' + ch; } else cur += ch; }
    out.push(cur); return out.join('\r\n');
  }
  // items: [{uid,title,date:'YYYY-MM-DD',time:'HH:MM',rrule?,alarmMin?,desc?}] -> teks .ics (waktu "mengambang" = jam lokal pengguna)
  function buildICS(items, nowISO) {
    const stamp = String(nowISO || new Date().toISOString()).replace(/[-:]/g, '').replace(/\.\d+/, '');
    const L = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//RUMAHKU-ONE Lite//ID', 'CALSCALE:GREGORIAN'];
    items.forEach((it) => {
      if (!it.date) return;
      const alarms = (it.alarms && it.alarms.length ? it.alarms : [it.alarmMin]).map((m) => +m || 0);
      const d = it.date.replace(/-/g, '');
      L.push('BEGIN:VEVENT', 'UID:' + it.uid + '@rumahku', 'DTSTAMP:' + stamp);
      let ref;
      if (it.allDay) { L.push('DTSTART;VALUE=DATE:' + d, 'DTEND;VALUE=DATE:' + addDays(it.date, 1).replace(/-/g, '')); ref = toMin(ALLDAY_REF); }
      else {
        const st = toMin(it.time); if (st == null) { L.pop(); L.pop(); L.pop(); return; }
        const en = Math.min(st + 5, 23 * 60 + 59);
        L.push('DTSTART:' + d + 'T' + fmtHM(st).replace(':', '') + '00', 'DTEND:' + d + 'T' + fmtHM(en).replace(':', '') + '00'); ref = 0;
      }
      if (it.rrule) L.push('RRULE:' + it.rrule);
      L.push('SUMMARY:' + icsEsc(it.title));
      if (it.desc) L.push('DESCRIPTION:' + icsEsc(it.desc));
      alarms.forEach((m) => {
        // semua-hari: DTSTART = 00.00, pengingat dihitung dari 08.00 -> offset = 480 - m menit dari awal hari
        const off = it.allDay ? ref - m : -m;
        L.push('BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:' + icsEsc(it.title), 'TRIGGER:' + (it.allDay ? (off < 0 ? '-' : '') : '-') + 'PT' + Math.abs(off) + 'M', 'END:VALARM');
      });
      L.push('END:VEVENT');
    });
    L.push('END:VCALENDAR');
    return L.map(icsFold).join('\r\n') + '\r\n';
  }
  const DAY_ICS = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
  function routineICS(r, startDate) {
    const rr = 'FREQ=' + (r.days && r.days.length ? 'WEEKLY;BYDAY=' + r.days.map((x) => DAY_ICS[x]).join(',') : 'DAILY');
    return routineTimes(r).map((t, i) => ({ uid: r.id + '-' + i, title: (r.emoji ? r.emoji + ' ' : '') + r.name, date: startDate, time: t, rrule: rr, alarmMin: 0 }));
  }

  return {
    uid, dstr, today, parseD, addDays, addMonths, nextDate, cmp,
    completeTask, expandEvent, fmtIDR, parseAmount, liveTx, balances, netWorth,
    monthReport, budgetStatus, streak, warrantySoon, serviceDue,
    kmLeft, daysBetween, countdown, urgency, intervalLabel, planNext, completePlan, dueInMonth, billNext, billState, billLedger, billPayPlan, applyBillPay, voidBillPay, billMonthSummary, billEndDate, billOccAfter, billLive, lowStock, homeAttention,
    emptyStore, put, remove, list, mergeStores, validStore,
    greeting, toMin, fmtHM, routineTimes, routineActiveOn, routineTarget, routineDone, routineDue, routineExpected, fireAt, inWindow, waNumber, waterCfg, waterDay, waterAdd, waterUndoLast, waterTimes, waterDue, waterHistory, inQuiet, isWeekend, phoneActions, waUrl, calendarItems, isBirthdayTitle, remindList, remindLabel, eventDue, birthdayDue, ALLDAY_REF, topSlices, dailyCum, netWorthAt, assetsDebt, avgMonthly, EF_MONTHS, healthLevel, goalProgress, budgetPace, bmi, bmiCategory, healthyRange, waistRisk, weightSeries, weeklyRate, maskId, ageOn, buildICS, routineICS,
  };
});
