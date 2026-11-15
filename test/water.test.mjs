import test from 'node:test'; import assert from 'node:assert/strict'; import { createRequire } from 'node:module';
const C = createRequire(import.meta.url)('../core.js');
const mk = () => C.emptyStore();
test('Default 8 gelas × 250 ml = 2000 ml; tambah & kurangi gelas', () => {
  const st = mk(); assert.equal(C.waterCfg(st).goalMl, 2000);
  C.waterAdd(st, 250, '2026-11-15', '08:00'); C.waterAdd(st, 250, '2026-11-15', '09:00'); C.waterAdd(st, 250, '2026-11-15', '10:00');
  let d = C.waterDay(st, '2026-11-15'); assert.equal(d.ml, 750); assert.equal(d.glasses, 3); assert.equal(d.pct, 38); assert.equal(d.reached, false);
  C.waterUndoLast(st, '2026-11-15'); d = C.waterDay(st, '2026-11-15'); assert.equal(d.ml, 500); assert.equal(d.count, 2);
});
test('Pencatatan yang dibatalkan tidak dihitung; nominal tidak valid ditolak', () => {
  const st = mk(); assert.equal(C.waterAdd(st, 0, '2026-11-15', '08:00'), null); assert.equal(C.waterAdd(st, 9999, '2026-11-15', '08:00'), null); assert.equal(C.waterAdd(st, 'abc', '2026-11-15', '08:00'), null);
  C.waterAdd(st, 300, '2026-11-15', '08:00'); C.waterUndoLast(st, '2026-11-15'); assert.equal(C.waterDay(st, '2026-11-15').ml, 0); assert.equal(C.waterUndoLast(st, '2026-11-15'), null);
});
test('Reset mengikuti tanggal lokal; riwayat hari lain tetap', () => {
  const st = mk(); C.waterAdd(st, 500, '2026-11-14', '20:00'); C.waterAdd(st, 250, '2026-11-15', '07:00');
  assert.equal(C.waterDay(st, '2026-11-15').ml, 250); assert.equal(C.waterDay(st, '2026-11-14').ml, 500);
  const h = C.waterHistory(st, '2026-11-15', 3); assert.deepEqual(h.map((x) => x.ml), [250, 500, 0]);
});
test('Ubah target & ukuran gelas tidak mengubah riwayat (ml dan target saat dicatat)', () => {
  const st = mk(); C.waterAdd(st, 250, '2026-11-14', '09:00'); C.waterAdd(st, 1750, '2026-11-14', '15:00');
  assert.equal(C.waterDay(st, '2026-11-14').pct, 100);
  C.put(st, 'wcfg', { id: 'wcfg', goal: 12, glassMl: 300 });
  assert.equal(C.waterCfg(st).goalMl, 3600); const d = C.waterDay(st, '2026-11-14'); assert.equal(d.ml, 2000); assert.equal(d.goalMl, 2000); assert.equal(d.pct, 100);
  C.waterAdd(st, 300, '2026-11-15', '09:00'); assert.equal(C.waterDay(st, '2026-11-15').goalMl, 3600);
});
test('Jam tenang (termasuk lewat tengah malam) dan rentang pengingat', () => {
  assert.equal(C.inQuiet(12 * 60 + 30, '12:00', '13:00'), true); assert.equal(C.inQuiet(13 * 60, '12:00', '13:00'), false);
  assert.equal(C.inQuiet(23 * 60, '22:00', '06:00'), true); assert.equal(C.inQuiet(3 * 60, '22:00', '06:00'), true); assert.equal(C.inQuiet(12 * 60, '22:00', '06:00'), false);
  const st = mk(); C.put(st, 'wcfg', { id: 'wcfg', from: '08:00', to: '12:00', every: 60, quietFrom: '10:00', quietTo: '11:00' });
  assert.deepEqual(C.waterTimes(C.waterCfg(st)), ['08:00', '09:00', '11:00', '12:00']);
});
test('Pengingat: tidak dikirim setelah target, di luar rentang, saat tenang, atau bila mati; tidak ganda', () => {
  const st = mk(); const fired = new Set(); const m = (h, mm = 0) => h * 60 + mm;
  const d1 = C.waterDue(st, '2026-11-15', m(9, 5), fired); assert.equal(d1.key, 'wt|2026-11-15|09:00'); fired.add(d1.key);
  assert.equal(C.waterDue(st, '2026-11-15', m(9, 6), fired), null);
  assert.equal(C.waterDue(st, '2026-11-15', m(7, 30), new Set()), null); assert.equal(C.waterDue(st, '2026-11-15', m(21, 0), new Set()), null);
  C.put(st, 'wcfg', { id: 'wcfg', quietFrom: '12:00', quietTo: '13:00' }); assert.equal(C.waterDue(st, '2026-11-15', m(12, 5), new Set()), null);
  C.put(st, 'wcfg', { id: 'wcfg', quietFrom: '', quietTo: '', on: false }); assert.equal(C.waterDue(st, '2026-11-15', m(14, 1), new Set()), null);
  C.put(st, 'wcfg', { id: 'wcfg', on: true }); for (let i = 0; i < 8; i++) C.waterAdd(st, 250, '2026-11-15', '10:00');
  assert.equal(C.waterDay(st, '2026-11-15').reached, true); assert.equal(C.waterDue(st, '2026-11-15', m(15, 2), new Set()), null);
});
