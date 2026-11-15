# Implementation report v0.5.6 (berjalan)

## Modul 1 + Addendum tagihan & angsuran — selesai
- File: core.js (billState, billLedger, billPayPlan, applyBillPay, voidBillPay, billMonthSummary, billEndDate, billOccAfter), app.js (billForm, billPayForm, halaman tagihan/tagihandetail/riwayatbayar), export.js (sheet baru), test/bills.test.mjs (15 tes), ui-tests/t15.mjs.
- Tes: 75 unit lulus; UI t15 + regresi lama lulus (smoke2 diperbarui untuk alur baru).
- Skema baru: bill.{cat,freq,dueWeekday,creditor,bank,ref/refSec,total,dp,tenor,startDate,endDate,instBefore,paidBefore,extra,active,closed,paidThru}; bpay.{billId,name,occ,date,amount,due,part,payoff,late,instNo,txId,void}.
- Batas: pembayaran sebagian untuk KPR bunga mengambang bersifat perkiraan; tidak diuji di HP nyata.
