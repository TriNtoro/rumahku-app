# RUMAHKU v0.5.6 — Spesifikasi (bertahap)

## Modul 1 + Addendum — Tagihan & angsuran rutin (SELESAI)
Model: `bill` = template (boleh diubah); `bpay` = riwayat pembayaran (snapshot; tidak berubah saat template diedit); transaksi tetap lewat `tx` (void, tidak dihapus).
- Kategori bawaan (14): KPR/Angsuran rumah (digabung, isinya sama), Kendaraan, Haji, Umrah, Arisan, Elektronik, Pinjaman, Asuransi, Pendidikan, Internet & telepon, Listrik & air, Iuran lingkungan, Langganan, Lainnya.
- Field opsional angsuran: kreditur, bank, nomor kontrak (sensitif; dienkripsi bila kunci dokumen aktif), total, uang muka, tenor, mulai, selesai, angsuran sebelumnya, dibayar sebelumnya, bunga/biaya.
- Jadwal: bulanan (tgl 29/30/31 → akhir bulan) atau mingguan (arisan); tanggal mulai/selesai; tenor; nonaktif = tidak ada jadwal. Otomatis di kalender.
- Pembayaran: konfirmasi (angsuran ke-n, jatuh tempo), tanggal sebenarnya, penuh / sebagian / pelunasan awal, id deterministik (`bp…`/`tx…` dari tagihan+jatuh tempo) → tidak ganda walau diklik dua kali atau dibayar dari dua perangkat. Batalkan = void riwayat + transaksi.
- Sisa kewajiban: tenor & nominal → sisa angsuran × nominal; tanpa tenor → total − uang muka − dibayar sebelumnya − riwayat; selain itu tidak dihitung.
- Dashboard: total/sudah/belum/terlambat bulan ini, jatuh tempo 7 hari, kewajiban aktif, sisa kewajiban keseluruhan, filter jenis & status.
- Hapus template tidak menghapus riwayat atau transaksi. Data lama (paidYM) tetap terbaca.

## Modul lain: lihat docs/audit/IMPLEMENTATION_REPORT_056.md untuk status.
