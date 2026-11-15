import test from 'node:test'; import assert from 'node:assert/strict'; import { createRequire } from 'node:module';
const C = createRequire(import.meta.url)('../core.js');
const mk = () => C.emptyStore();
const pays = (st) => C.list(st, 'bpay'), txs = (st) => C.list(st, 'tx');
function pay(st, b, date, amount, o = {}) {
  const cur = st.rec[b.id], plan = C.billPayPlan(cur, pays(st), Object.assign({ date, amount, today: date }, o));
  if (plan.error) return plan; C.applyBillPay(st, cur, plan, { date, accId: 'a1', cat: 'Cicilan', nowISO: date + 'T00:00:00Z' }); return plan;
}

test('KPR tenor panjang: angsuran ke-n, sisa tenor, sisa kewajiban, tanggal akhir', () => {
  const st = mk(); const b = C.put(st, 'bill', { name: 'KPR Rumah', cat: 'kpr', kind: 'cicilan', amountEst: 5000000, dueDay: 10, tenor: 180, startDate: '2026-01-10', total: 500000000 });
  assert.equal(C.billEndDate(b), '2040-12-10');
  let s = C.billState(b, [], '2026-01-05'); assert.equal(s.next, '2026-01-10'); assert.equal(s.instNext, 1); assert.equal(s.remainingInst, 180); assert.equal(s.remaining, 900000000);
  const p1 = pay(st, b, '2026-01-10', 5000000); assert.equal(p1.instNo, 1);
  const p2 = pay(st, b, '2026-02-10', 5000000); assert.equal(p2.instNo, 2);
  s = C.billState(st.rec[b.id], pays(st), '2026-02-15'); assert.equal(s.instDone, 2); assert.equal(s.remainingInst, 178); assert.equal(s.remaining, 178 * 5000000); assert.equal(s.next, '2026-03-10');
  assert.equal(txs(st).length, 2);
});
test('Pembayaran ganda dicegah (klik ganda / dua perangkat) dan id deterministik', () => {
  const st = mk(); const b = C.put(st, 'bill', { name: 'Internet', amountEst: 350000, dueDay: 5, kind: 'tagihan' });
  const plan1 = C.billPayPlan(st.rec[b.id], pays(st), { date: '2026-11-05', amount: 350000, today: '2026-11-05' });
  C.applyBillPay(st, st.rec[b.id], plan1, { date: '2026-11-05', accId: 'a1', cat: 'Tagihan', nowISO: '2026-11-05T00:00:00Z' });
  // perangkat lain menghitung rencana yang sama dari state lama -> id sama -> hanya 1 catatan
  const stale = C.billPayPlan(Object.assign({}, st.rec[b.id], { paidYM: '', paidThru: '' }), [], { date: '2026-11-05', amount: 350000, today: '2026-11-05' });
  assert.equal(stale.payId, plan1.payId); assert.equal(stale.txId, plan1.txId);
  C.applyBillPay(st, st.rec[b.id], stale, { date: '2026-11-05', accId: 'a1', cat: 'Tagihan', nowISO: '2026-11-05T01:00:00Z' });
  assert.equal(pays(st).length, 1); assert.equal(txs(st).length, 1);
  // pembayaran kedua pada periode yang sama langsung: next sudah bulan depan
  const again = C.billPayPlan(st.rec[b.id], pays(st), { date: '2026-11-05', amount: 350000, today: '2026-11-05' });
  assert.equal(again.occ, '2026-12-05');
});
test('Tanggal 29/30/31 mengikuti akhir bulan', () => {
  const b = { id: 'x', dueDay: 31, amountEst: 1 };
  assert.equal(C.billOccAfter(b, '2026-01-31'), '2026-02-28'); assert.equal(C.billOccAfter(b, '2028-01-31'), '2028-02-29'); assert.equal(C.billOccAfter(b, '2026-03-31'), '2026-04-30');
});
test('Pembayaran terlambat: tercatat dengan tanggal sebenarnya', () => {
  const st = mk(); const b = C.put(st, 'bill', { name: 'Cicilan motor', amountEst: 1200000, dueDay: 5, kind: 'cicilan', tenor: 12, startDate: '2026-09-05' });
  assert.equal(C.billState(b, [], '2026-11-15').status, 'terlambat');
  const p = pay(st, b, '2026-11-15', 1200000); assert.equal(p.occ, '2026-11-05'); assert.equal(p.late, true);
  assert.equal(pays(st)[0].date, '2026-11-15'); assert.equal(pays(st)[0].occ, '2026-11-05');
});
test('Bulan terlewat: yang paling lama belum dibayar muncul dulu', () => {
  const b = { id: 'q', dueDay: 10, amountEst: 100, paidYM: '2026-08' };
  assert.equal(C.billNext(b, '2026-11-15'), '2026-09-10');
});
test('Pembayaran sebagian: sisa tetap, lunas setelah total tercapai, angsuran naik sekali', () => {
  const st = mk(); const b = C.put(st, 'bill', { name: 'Cicilan elektronik', amountEst: 1000000, dueDay: 8, kind: 'cicilan', tenor: 6, startDate: '2026-11-08' });
  const a = pay(st, b, '2026-11-08', 400000, { part: true }); assert.equal(a.part, true);
  let s = C.billState(st.rec[b.id], pays(st), '2026-11-08'); assert.equal(s.status, 'sebagian'); assert.equal(s.instDone, 0); assert.equal(s.remaining, 6 * 1000000 - 400000);
  const c = pay(st, b, '2026-11-12', 600000, { part: true });
  s = C.billState(st.rec[b.id], pays(st), '2026-11-13'); assert.equal(s.instDone, 1); assert.equal(s.next, '2026-12-08');
  assert.equal(txs(st).length, 2);
});
test('Angsuran Haji dengan target pelunasan (tanpa tenor): sisa = target - dibayar', () => {
  const st = mk(); const b = C.put(st, 'bill', { name: 'Angsuran Haji', cat: 'haji', kind: 'cicilan', amountEst: 2500000, dueDay: 1, total: 35000000, paidBefore: 5000000, targetDate: '2028-12-01' });
  assert.equal(C.billState(b, [], '2026-11-01').remaining, 30000000);
  pay(st, b, '2026-11-01', 2500000); pay(st, b, '2026-12-01', 2500000);
  assert.equal(C.billState(st.rec[b.id], pays(st), '2026-12-02').remaining, 25000000);
});
test('Arisan mingguan dan bulanan', () => {
  const st = mk(); const w = C.put(st, 'bill', { name: 'Arisan RT', freq: 'weekly', dueWeekday: 6, amountEst: 50000, kind: 'wajib', tenor: 10, startDate: '2026-11-07' });
  assert.equal(C.billNext(w, '2026-11-09', []), '2026-11-14');
  pay(st, w, '2026-11-14', 50000); assert.equal(C.billNext(st.rec[w.id], '2026-11-15', pays(st)), '2026-11-21');
  assert.equal(C.billEndDate(w), '2027-01-09');
  const items = C.calendarItems(st, '2026-11-01', '2026-12-01').filter((x) => x.title === 'Arisan RT').map((x) => x.date);
  assert.deepEqual(items, ['2026-11-07', '2026-11-14', '2026-11-21', '2026-11-28']);
  const m = C.put(st, 'bill', { name: 'Arisan keluarga', amountEst: 200000, dueDay: 20, kind: 'wajib' });
  assert.equal(C.billNext(m, '2026-11-15', []), '2026-11-20');
});
test('Ubah nominal & tanggal template: riwayat tidak berubah, jadwal depan mengikuti', () => {
  const st = mk(); const b = C.put(st, 'bill', { name: 'Asuransi', amountEst: 500000, dueDay: 10, kind: 'wajib' });
  pay(st, b, '2026-11-10', 500000);
  C.put(st, 'bill', { id: b.id, amountEst: 650000, dueDay: 15 });
  const h = pays(st)[0]; assert.equal(h.amount, 500000); assert.equal(h.due, 500000); assert.equal(h.occ, '2026-11-10'); assert.equal(txs(st)[0].amount, 500000);
  assert.equal(C.billNext(st.rec[b.id], '2026-11-16', pays(st)), '2026-12-15');
});
test('Pelunasan lebih awal menutup template; tidak ada jadwal lagi', () => {
  const st = mk(); const b = C.put(st, 'bill', { name: 'Cicilan mobil', amountEst: 4000000, dueDay: 12, kind: 'cicilan', tenor: 36, startDate: '2026-01-12', instBefore: 10 });
  const p = pay(st, b, '2026-11-12', 80000000, { payoff: true }); assert.equal(p.instNo, 36);
  const s = C.billState(st.rec[b.id], pays(st), '2026-11-13'); assert.equal(s.status, 'lunas'); assert.equal(s.remaining, 0); assert.equal(s.next, null);
  assert.equal(C.calendarItems(st, '2026-12-01', '2027-01-01').filter((x) => x.kind === 'bill').length, 0);
  assert.ok(C.billPayPlan(st.rec[b.id], pays(st), { date: '2026-11-14', amount: 1, today: '2026-11-14' }).error);
});
test('Template nonaktif tidak menghasilkan jadwal dan tidak bisa dibayar', () => {
  const st = mk(); const b = C.put(st, 'bill', { name: 'Streaming', amountEst: 54000, dueDay: 3, active: false });
  assert.equal(C.billNext(b, '2026-11-15', []), null); assert.equal(C.billState(b, [], '2026-11-15').status, 'nonaktif');
  assert.equal(C.calendarItems(st, '2026-11-01', '2026-12-01').filter((x) => x.kind === 'bill').length, 0);
  assert.ok(C.billPayPlan(b, [], { date: '2026-11-15', amount: 54000, today: '2026-11-15' }).error);
});
test('Hapus template: riwayat bayar dan transaksi tetap ada', () => {
  const st = mk(); const b = C.put(st, 'bill', { name: 'Iuran lingkungan', amountEst: 100000, dueDay: 2, kind: 'wajib' });
  pay(st, b, '2026-11-02', 100000); C.remove(st, b.id);
  assert.equal(pays(st).length, 1); assert.equal(pays(st)[0].name, 'Iuran lingkungan'); assert.equal(txs(st).length, 1);
  assert.equal(C.list(st, 'bill').length, 0);
});
test('Batalkan pembayaran: void riwayat + transaksi, jadwal mundur, bisa dibayar lagi tanpa ganda', () => {
  const st = mk(); const b = C.put(st, 'bill', { name: 'Listrik', amountEst: 400000, dueDay: 20, kind: 'tagihan' });
  const p = pay(st, b, '2026-11-20', 400000);
  assert.ok(C.voidBillPay(st, p.payId, '2026-11-21', '2026-11-21T00:00:00Z'));
  assert.equal(st.rec[p.txId].void, true); assert.equal(C.billNext(st.rec[b.id], '2026-11-21', pays(st)), '2026-11-20');
  const again = pay(st, b, '2026-11-21', 410000); assert.equal(again.occ, '2026-11-20');
  const active = txs(st).filter((t) => !t.void); assert.equal(active.length, 1);
});
test('Ringkasan bulanan: total, sudah, belum, terlambat', () => {
  const st = mk();
  const a = C.put(st, 'bill', { name: 'A', amountEst: 100, dueDay: 5, kind: 'wajib' }), c = C.put(st, 'bill', { name: 'C', amountEst: 300, dueDay: 25, kind: 'wajib' }), d = C.put(st, 'bill', { name: 'D', amountEst: 200, dueDay: 8, kind: 'wajib' });
  pay(st, a, '2026-11-05', 100);
  const m = C.billMonthSummary(C.list(st, 'bill'), pays(st), '2026-11', '2026-11-15');
  assert.equal(m.total, 600); assert.equal(m.paid, 100); assert.equal(m.unpaid, 500); assert.equal(m.late, 200);
});
test('Data lama (paidYM tanpa riwayat) tetap terbaca', () => {
  const b = { id: 'old', name: 'PDAM', dueDay: 25, amountEst: 120000, paidYM: '2026-10' };
  assert.equal(C.billNext(b, '2026-11-15'), '2026-11-25'); assert.equal(C.billNext(b, '2026-11-15', []), '2026-11-25');
  const st = mk(); st.rec.old = Object.assign({ _t: 'bill', _u: 'x' }, b);
  const it = C.calendarItems(st, '2026-10-01', '2026-12-01').filter((x) => x.kind === 'bill'); assert.equal(it[0].paid, true); assert.equal(it[1].paid, false);
});
