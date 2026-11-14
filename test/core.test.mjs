import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const C = createRequire(import.meta.url)('../core.js');

test('fmtIDR: rupiah utuh, tidak bergantung ICU', () => {
  assert.equal(C.fmtIDR(1500), 'Rp 1.500');
  assert.equal(C.fmtIDR(0), 'Rp 0');
  assert.equal(C.fmtIDR(-1250000), '-Rp 1.250.000');
  assert.throws(() => C.fmtIDR(1.5));
});
test('parseAmount: terima format Indonesia, tolak desimal/sampah', () => {
  assert.equal(C.parseAmount('1.500.000'), 1500000);
  assert.equal(C.parseAmount('Rp 25.000'), 25000);
  assert.equal(C.parseAmount('1500'), 1500);
  assert.equal(C.parseAmount('12,50'), null);
  assert.equal(C.parseAmount('abc'), null);
  assert.equal(C.parseAmount(''), null);
  assert.equal(C.parseAmount('99999999999999999999'), null);
});
test('tanggal: akhir bulan & anchor 31', () => {
  assert.equal(C.addMonths('2026-01-31', 1, 31), '2026-02-28');
  assert.equal(C.addMonths('2026-02-28', 1, 31), '2026-03-31');
  assert.equal(C.addMonths('2024-01-31', 1, 31), '2024-02-29');
  assert.equal(C.addDays('2026-12-31', 1), '2027-01-01');
  assert.equal(C.nextDate('2026-02-28', 'yearly', 28), '2027-02-28');
});
test('completeTask: berulang memajukan due, melompati yang terlewat; sekali jadi selesai', () => {
  const t = { id: 'a', title: 'x', due: '2026-11-01', repeat: 'weekly' };
  const r = C.completeTask(t, '2026-11-14');
  assert.equal(r.due, '2026-11-15');
  assert.equal(r.done, false);
  assert.deepEqual(r.doneLog, ['2026-11-14']);
  const o = C.completeTask({ id: 'b', title: 'y', due: '2026-11-14', repeat: 'none' }, '2026-11-14');
  assert.equal(o.done, true);
  const m = C.completeTask({ id: 'c', due: '2026-01-31', repeat: 'monthly' }, '2026-01-31');
  assert.equal(m.due, '2026-02-28');
  assert.equal(C.completeTask(m, '2026-02-28').due, '2026-03-31');
});
test('expandEvent: half-open, skip, until, batas', () => {
  const ev = { date: '2026-11-01', repeat: 'daily' };
  assert.deepEqual(C.expandEvent(ev, '2026-11-03', '2026-11-06'), ['2026-11-03', '2026-11-04', '2026-11-05']);
  assert.deepEqual(C.expandEvent({ ...ev, skip: ['2026-11-04'] }, '2026-11-03', '2026-11-06'), ['2026-11-03', '2026-11-05']);
  assert.deepEqual(C.expandEvent({ ...ev, until: '2026-11-04' }, '2026-11-03', '2026-11-30'), ['2026-11-03', '2026-11-04']);
  assert.equal(C.expandEvent(ev, '2020-01-01', '2040-01-01').length, 1000);
  assert.deepEqual(C.expandEvent({ date: '2026-11-05', repeat: 'none' }, '2026-11-05', '2026-11-06'), ['2026-11-05']);
  assert.deepEqual(C.expandEvent({ date: '2026-11-06', repeat: 'none' }, '2026-11-05', '2026-11-06'), []);
});
const accs = [{ id: 'k', opening: 100000 }, { id: 'b', opening: 0 }];
test('transfer tidak mengubah kekayaan bersih & tidak masuk laporan', () => {
  const before = C.netWorth(accs, []);
  const txs = [{ id: '1', kind: 'transfer', acc: 'k', to: 'b', amount: 40000, date: '2026-11-02' }];
  assert.equal(C.netWorth(accs, txs), before);
  const bal = C.balances(accs, txs);
  assert.equal(bal.k, 60000); assert.equal(bal.b, 40000);
  const r = C.monthReport(txs, '2026-11');
  assert.equal(r.income, 0); assert.equal(r.expense, 0);
});
test('void = seolah transaksi tak ada; pemasukan/pengeluaran benar', () => {
  const txs = [
    { id: '1', kind: 'income', acc: 'k', amount: 500000, date: '2026-11-01' },
    { id: '2', kind: 'expense', acc: 'k', amount: 120000, date: '2026-11-03', cat: 'Makan' },
    { id: '3', kind: 'expense', acc: 'k', amount: 80000, date: '2026-11-04', cat: 'Makan', void: true },
  ];
  assert.equal(C.balances(accs, txs).k, 100000 + 500000 - 120000);
  const r = C.monthReport(txs, '2026-11');
  assert.equal(r.expense, 120000); assert.equal(r.byCat.Makan, 120000);
  const bs = C.budgetStatus([{ id: 'b1', cat: 'Makan', limit: 150000 }], r)[0];
  assert.equal(bs.pct, 80); assert.equal(bs.level, 'warn');
  assert.equal(C.budgetStatus([{ id: 'b', cat: 'Makan', limit: 100000 }], r)[0].level, 'over');
});
test('transaksi tidak bisa dihapus lewat remove', () => {
  const s = C.emptyStore();
  const t = C.put(s, 'tx', { kind: 'expense', acc: 'k', amount: 1, date: '2026-11-01' });
  assert.throws(() => C.remove(s, t.id));
  const tk = C.put(s, 'task', { title: 'a' });
  C.remove(s, tk.id);
  assert.equal(C.list(s, 'task').length, 0);
});
test('merge: terbaru menang per rekaman, komutatif, tombstone & void bertahan', () => {
  const a = C.emptyStore(), b = C.emptyStore();
  C.put(a, 'task', { id: 't1', title: 'lama' }, '2026-11-01T00:00:00Z');
  C.put(b, 'task', { id: 't1', title: 'baru' }, '2026-11-02T00:00:00Z');
  C.put(a, 'task', { id: 't2', title: 'hanya A' }, '2026-11-01T00:00:00Z');
  C.put(b, 'task', { id: 't3', title: 'dihapus di B' }, '2026-11-01T00:00:00Z');
  C.put(a, 'task', { id: 't3', title: 'dihapus di B' }, '2026-11-01T00:00:00Z');
  C.remove(b, 't3', '2026-11-03T00:00:00Z');
  const m1 = C.mergeStores(a, b), m2 = C.mergeStores(b, a);
  assert.deepEqual(m1, m2);
  assert.equal(m1.rec.t1.title, 'baru');
  assert.equal(C.list(m1, 'task').map((x) => x.id).sort().join(), 't1,t2');
  // void tidak hidup lagi walau sisi lain lebih baru tanpa void
  const x = C.emptyStore(), y = C.emptyStore();
  C.put(x, 'tx', { id: 'v', kind: 'expense', acc: 'k', amount: 5, date: '2026-11-01', void: true }, '2026-11-01T00:00:00Z');
  C.put(y, 'tx', { id: 'v', kind: 'expense', acc: 'k', amount: 5, date: '2026-11-01' }, '2026-11-09T00:00:00Z');
  assert.equal(C.mergeStores(x, y).rec.v.void, true);
  assert.equal(C.mergeStores(y, x).rec.v.void, true);
});
test('streak kebiasaan', () => {
  assert.equal(C.streak(['2026-11-12', '2026-11-13', '2026-11-14'], '2026-11-14'), 3);
  assert.equal(C.streak(['2026-11-12', '2026-11-13'], '2026-11-14'), 2);
  assert.equal(C.streak(['2026-11-10'], '2026-11-14'), 0);
});
test('garansi & servis jatuh tempo', () => {
  const a = [{ id: '1', warrantyUntil: '2026-11-20' }, { id: '2', warrantyUntil: '2027-05-01' }, { id: '3', warrantyUntil: '2026-10-01' }, { id: '4', nextService: '2026-11-10' }];
  assert.deepEqual(C.warrantySoon(a, '2026-11-14', 30).map((x) => x.id), ['1']);
  assert.deepEqual(C.serviceDue(a, '2026-11-14').map((x) => x.id), ['4']);
});
test('validStore menolak bentuk salah (impor backup)', () => {
  assert.equal(C.validStore({ v: 1, rec: {} }), true);
  assert.equal(C.validStore({ v: 2, rec: {} }), false);
  assert.equal(C.validStore(null), false);
  assert.equal(C.validStore({ v: 1, rec: [] }), false);
});
