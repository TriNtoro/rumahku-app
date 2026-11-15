# Implementation report v0.5.6 (berjalan)

## Modul 1 + Addendum tagihan & angsuran — selesai
- File: core.js (billState, billLedger, billPayPlan, applyBillPay, voidBillPay, billMonthSummary, billEndDate, billOccAfter), app.js (billForm, billPayForm, halaman tagihan/tagihandetail/riwayatbayar), export.js (sheet baru), test/bills.test.mjs (15 tes), ui-tests/t15.mjs.
- Tes: 75 unit lulus; UI t15 + regresi lama lulus (smoke2 diperbarui untuk alur baru).
- Skema baru: bill.{cat,freq,dueWeekday,creditor,bank,ref/refSec,total,dp,tenor,startDate,endDate,instBefore,paidBefore,extra,active,closed,paidThru}; bpay.{billId,name,occ,date,amount,due,part,payoff,late,instNo,txId,void}.
- Batas: pembayaran sebagian untuk KPR bunga mengambang bersifat perkiraan; tidak diuji di HP nyata.

## Modul 2 — Warna akhir pekan: selesai
Kalender bulan (sel + header Sab/Min) dan agenda diberi warna merah muda lembut (variabel `--wk`, `--wkink`, mode gelap tersendiri). Indikator hari ini/pilihan/titik status tidak diubah. Tidak ada tampilan mingguan di aplikasi saat ini. Tes: core `isWeekend`, UI t16.

## Modul 3 — Minum air: selesai (lokal)
Record `wlog` (ml, jam, snapshot target) + `wcfg`. Ikon gelas, ml, %, tambah/koreksi/batalkan, jumlah bebas, riwayat 7 hari, target & volume gelas, jam mulai/selesai/interval/jam tenang (termasuk lewat tengah malam), pengingat berhenti setelah target tercapai. Klik ganda dijaga (700 ms). Perubahan target tidak mengubah riwayat. Batas: pengingat hanya saat aplikasi hidup (Web Push = Modul 4, belum). Berdampingan dengan rutinitas "Minum air" lama (tidak dihapus). Tes: test/water.test.mjs (6), UI t17.

## Modul 5 — WhatsApp / Telepon / SMS: selesai
`phoneActions`/`waUrl` di core (08.., +62.., 62..; ponsel Indonesia 62 8xx 9–12 digit). Tombol di kartu dan detail anggota; pesan awal bisa diedit; tidak dikirim otomatis; nomor tidak valid → tombol WA nonaktif; tidak ada log/server. Tes: core + UI t16. Belum diuji di iPhone nyata.

## Modul 6 — Tag hubungan keluarga: selesai
Tag baru (Ayah, Ibu, Suami, Istri, Anak, Saudara, Kakek, Nenek, Kerabat, Lainnya, Selingkuhan) memakai field `rel` yang sama (kompatibel; nilai lama/kustom tetap). Tampil di kartu, filter chip, pencarian nama/tag. Tes: UI t16.

## Belum dikerjakan (butuh keputusan): Modul 4 (Web Push + Vercel Functions), Modul 7 (pusat pengingat, bergantung Modul 4), Modul 8 (multi-perangkat), Security hardening 055 (audit baseline belum ada di sesi ini).

## Perbaikan lanjutan (0.5.6)
- Semua kolom nominal (type 'amount') otomatis diberi pemisah ribuan saat mengetik (format Indonesia 500.000); kursor dijaga; nilai tetap disimpan sebagai bilangan bulat via C.parseAmount. Tes: ui-tests/t18.
- Arisan kini punya kolom "Sekarang periode/cicilan ke-berapa"; item tanpa tenor (Haji, arisan) menampilkan "cicilan ke-N" di daftar dan detail.
