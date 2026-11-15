import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const C = require('../core.js'), E = require('../export.js');

function store() {
  const st = C.emptyStore();
  const a = C.put(st, 'acc', { name: 'Dompet', type: 'kas', opening: 500000 }), b = C.put(st, 'acc', { name: 'BCA', type: 'bank', opening: 7500000 });
  C.put(st, 'tx', { kind: 'income', amount: 6000000, acc: b.id, to: '', cat: 'Gaji', date: '2026-11-01', note: 'Gaji' });
  C.put(st, 'tx', { kind: 'expense', amount: 450000, acc: a.id, to: '', cat: 'Makan', date: '2026-11-10', note: 'Pasar & <sayur> "segar"' });
  C.put(st, 'tx', { kind: 'transfer', amount: 1000000, acc: b.id, to: a.id, cat: '', date: '2026-11-11', note: 'Isi dompet' });
  C.put(st, 'tx', { kind: 'expense', amount: 90000, acc: a.id, to: '', cat: 'Makan', date: '2026-10-05', note: 'Bulan lalu' });
  const v = C.put(st, 'tx', { kind: 'expense', amount: 99000, acc: a.id, to: '', cat: 'Hiburan', date: '2026-11-12', note: 'salah' }); C.put(st, 'tx', { id: v.id, void: true });
  C.put(st, 'person', { name: 'Tri', ids: [{ kind: 'KTP', no: '3201010101900001' }] });
  C.put(st, 'doc', { title: 'KTP', place: 'Dompet' });
  C.put(st, 'plan', { name: 'Servis AC rumah (cuci indoor & outdoor)', group: 'rumah', every: 3, unit: 'month', nextDue: '2026-12-01' });
  return st;
}
const opts = { ym: '2026-11', today: '2026-11-15' };

test('sets: transaksi dibatasi bulan, void ikut tampil dan ditandai, transfer tidak dihitung pemasukan/pengeluaran', () => {
  const sh = E.sets(C, store(), opts), tx = sh.find((s) => s.name === 'Transaksi'), rs = sh.find((s) => s.name === 'Ringkasan uang');
  assert.equal(tx.rows.length, 4);                                   // Okt tidak ikut
  assert.ok(tx.rows.some((r) => r[7] === 'Dibatalkan (void)'));
  assert.equal(rs.rows[0][1], 6000000); assert.equal(rs.rows[1][1], 450000);
  assert.equal(E.sets(C, store(), Object.assign({ allTx: true }, opts)).find((s) => s.name === 'Transaksi').rows.length, 5);
});
test('sets: scope uang / rumah terpisah', () => {
  const u = E.sets(C, store(), Object.assign({ scope: 'uang' }, opts)).map((s) => s.name), r = E.sets(C, store(), Object.assign({ scope: 'rumah' }, opts)).map((s) => s.name);
  assert.ok(u.includes('Transaksi') && !u.includes('Perawatan')); assert.ok(r.includes('Perawatan') && !r.includes('Transaksi'));
});
test('PRIVASI: nomor identitas tidak pernah masuk hasil ekspor', () => {
  const sh = E.sets(C, store(), opts), j = JSON.stringify(sh);
  assert.ok(!j.includes('3201010101900001'));
  const bytes = Buffer.from(E.pdf('t', 's', sh)).toString('latin1'); assert.ok(!bytes.includes('3201010101900001'));
});
test('crc32 benar (vektor uji standar "123456789")', () => {
  assert.equal(E.crc32(new TextEncoder().encode('123456789')), 0xCBF43926);
});
test('xlsx: zip valid, berkas wajib ada, CRC cocok, XML ter-escape', () => {
  const u = E.xlsx(E.sets(C, store(), opts)), dv = new DataView(u.buffer, u.byteOffset, u.byteLength);
  assert.equal(dv.getUint32(0, true), 0x04034b50);
  const eocd = u.length - 22; assert.equal(dv.getUint32(eocd, true), 0x06054b50);
  const n = dv.getUint16(eocd + 10, true); let p = dv.getUint32(eocd + 16, true); const names = [];
  for (let i = 0; i < n; i++) {
    const crc = dv.getUint32(p + 16, true), sz = dv.getUint32(p + 20, true), nl = dv.getUint16(p + 28, true), off = dv.getUint32(p + 42, true);
    names.push(new TextDecoder().decode(u.subarray(p + 46, p + 46 + nl)));
    const ln = dv.getUint16(off + 26, true), start = off + 30 + ln; assert.equal(E.crc32(u.subarray(start, start + sz)), crc);
    p += 46 + nl;
  }
  for (const f of ['[Content_Types].xml', '_rels/.rels', 'xl/workbook.xml', 'xl/styles.xml', 'xl/worksheets/sheet1.xml']) assert.ok(names.includes(f), f);
  const all = Buffer.from(u).toString('utf8'); assert.ok(all.includes('Pasar &amp; &lt;sayur&gt; &quot;segar&quot;'));
});
test('pdf: struktur sah (header, xref, trailer) dan banyak halaman untuk data panjang', () => {
  const st = store(); for (let i = 0; i < 80; i++) C.put(st, 'tx', { kind: 'expense', amount: 1000 + i, acc: C.list(st, 'acc')[0].id, to: '', cat: 'Makan', date: '2026-11-0' + (1 + (i % 9)), note: 'catatan panjang ' + i });
  const u = E.pdf('Judul', 'Sub', E.sets(C, st, opts)), s = Buffer.from(u).toString('latin1');
  assert.ok(s.startsWith('%PDF-1.4')); assert.ok(s.trimEnd().endsWith('%%EOF'));
  const m = s.match(/startxref\n(\d+)/); assert.equal(s.slice(+m[1], +m[1] + 4), 'xref');
  assert.ok(+s.match(/\/Count (\d+)/)[1] >= 2);
});
test('pdf: emoji dibuang, aksara Latin tetap, kurung di-escape', () => {
  const s = Buffer.from(E.pdf('Tes (kurung) 🎂', 'é', [{ name: 'x', cols: [{ h: 'A', t: 's' }], rows: [['Ultah 🎂 (Ilham)']] }])).toString('latin1');
  assert.ok(s.includes('Tes \\(kurung\\)')); assert.ok(!s.includes('🎂'));
});
