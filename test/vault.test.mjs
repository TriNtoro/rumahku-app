import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const V = createRequire(import.meta.url)('../vault.js');
const IT = { iter: 2000 }; // iterasi kecil khusus tes agar cepat; produksi 600.000

test('setup lalu unlock dengan password benar; password salah ditolak', async () => {
  const { meta, key } = await V.setup('kata-rahasia-saya', IT);
  assert.ok(key); assert.ok(await V.unlock(meta, 'kata-rahasia-saya'));
  assert.equal(await V.unlock(meta, 'kata-rahasia-salah'), null);
});
test('seal/open: bolak-balik benar, IV berbeda tiap segel, kunci lain gagal, rusak sedikit = gagal', async () => {
  const a = await V.setup('password-aman-1', IT), b = await V.setup('password-aman-2', IT);
  const obj = { num: '3201010101900001', notes: 'Map biru' };
  const s1 = await V.seal(a.key, obj), s2 = await V.seal(a.key, obj);
  assert.notEqual(s1, s2); assert.ok(!s1.includes('3201010101900001'));
  assert.deepEqual(await V.open(a.key, s1), obj);
  assert.equal(await V.open(b.key, s1), null);
  const p = s1.split('.'); const ct = Buffer.from(p[2], 'base64'); ct[0] ^= 1; p[2] = ct.toString('base64');
  assert.equal(await V.open(a.key, p.join('.')), null);
  assert.equal(await V.open(a.key, 'bukan-segel'), null);
});
test('sealBytes/openBytes: berkas biner (foto) utuh dan tidak terbaca', async () => {
  const { key } = await V.setup('password-aman-1', IT), data = Uint8Array.from({ length: 5000 }, (_, i) => i % 251);
  const c = await V.sealBytes(key, data); assert.equal(c.length, data.length + 32);
  assert.deepEqual(Array.from(await V.openBytes(key, c)), Array.from(data));
  c[100] ^= 255; assert.equal(await V.openBytes(key, c), null);
});
test('kode pemulihan membuka brankas; format & normalisasi (huruf kecil, O/0, I/1)', async () => {
  const { meta, recovery } = await V.setup('password-aman-1', IT);
  assert.match(recovery, /^[0-9A-Z]{5}(-[0-9A-Z]{5}){4}$/);
  assert.ok(await V.unlockRecovery(meta, recovery.toLowerCase().replace(/-/g, ' ')));
  assert.equal(await V.unlockRecovery(meta, 'AAAAA-AAAAA-AAAAA-AAAAA-AAAAA'), null);
});
test('ganti password: lama tidak berlaku, baru berlaku, data lama tetap terbuka, kode pemulihan tetap sah', async () => {
  const { meta, key, recovery } = await V.setup('password-lama-1', IT), seg = await V.seal(key, { a: 1 });
  const r = await V.setPassword(meta, 'pw', 'password-lama-1', 'password-baru-2'); assert.ok(r);
  assert.equal(await V.unlock(r.meta, 'password-lama-1'), null);
  const k2 = await V.unlock(r.meta, 'password-baru-2'); assert.deepEqual(await V.open(k2, seg), { a: 1 });
  assert.ok(await V.unlockRecovery(r.meta, recovery));
  assert.equal(await V.setPassword(meta, 'pw', 'salah-salah-1', 'x'), null);
});
test('reset password lewat kode pemulihan; kode pemulihan baru membatalkan yang lama', async () => {
  const { meta, key, recovery } = await V.setup('password-lama-1', IT), seg = await V.seal(key, { b: 2 });
  const r = await V.setPassword(meta, 'rec', recovery, 'password-baru-9'); assert.ok(r);
  assert.deepEqual(await V.open(await V.unlock(r.meta, 'password-baru-9'), seg), { b: 2 });
  const n = await V.newRecovery(r.meta, 'password-baru-9'); assert.ok(n); assert.notEqual(n.recovery, recovery);
  assert.equal(await V.unlockRecovery(n.meta, recovery), null); assert.ok(await V.unlockRecovery(n.meta, n.recovery));
  assert.equal(await V.newRecovery(r.meta, 'salah-salah-1'), null);
});
test('meta tidak memuat password/kunci polos dan tidak memberi tahu apa pun tanpa password', async () => {
  const { meta, recovery } = await V.setup('password-aman-1', IT), j = JSON.stringify(meta);
  assert.ok(!j.includes('password-aman-1')); assert.ok(!j.includes(recovery));
});
test('strength: tolak pendek, umum, angka saja pendek', () => {
  assert.equal(V.strength('abc').ok, false); assert.equal(V.strength('password').ok, false); assert.equal(V.strength('123456789').ok, false);
  assert.equal(V.strength('sapi-biru-minum-kopi').ok, true);
});
