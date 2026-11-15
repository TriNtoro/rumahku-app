# Status Modul — RUMAHKU-ONE Lite v0.5.4

Status: `COMPLETED` `PARTIAL` `IN PROGRESS` `PLANNED` `BLOCKED`.
Kolom **Progress** sengaja **tidak berisi persentase**: persentase tidak diukur. Isinya bukti verifikasi yang nyata.
Bukti: **T** = tes unit `test/core.test.mjs` (52 lulus), **U** = skrip UI Puppeteer di Chrome headless viewport HP (`docs/handover/ui-tests`), **M** = diverifikasi manual oleh pemilik (dari screenshot yang ia kirim), **—** = tidak ada verifikasi.

## Lite (yang ada di kode)

| Modul | Status | Progress (bukti) | Catatan |
|---|---|---|---|
| Beranda (sapaan, perhatian, ringkasan, ajakan profil/mode) | COMPLETED | U | Sapaan memakai nama dari Profil; versi tampil di sub-judul |
| Profil & mode (pelajar/pekerja/berkeluarga, jenis kelamin, tinggi) | COMPLETED | U | Mode mengatur daftar kategori, tujuan, template tagihan, target dana darurat |
| Perawatan rumah berulang | COMPLETED | T, U | v0.5.4: template Servis AC rumah dan Servis AC mobil (+ filter kabin). Template per kelompok; jadwal ulang dari tanggal selesai |
| Kendaraan (motor/mobil/motor EV/mobil EV) | COMPLETED | T, U | Template servis per jenis, interval umum, jadwal bisa diubah (tombol ✎ Ubah); odometer, pajak, STNK |
| Tagihan rutin, kewajiban tetap, cicilan | COMPLETED | T, U | `bill.kind`: tagihan/wajib/cicilan; bayar → transaksi dengan kategori sesuai jenis |
| Aset & garansi | COMPLETED | T, U | Garansi → muncul di perhatian & kalender |
| Stok & daftar belanja | COMPLETED | T, U | Batas minimum, kedaluwarsa |
| Kontak penting | COMPLETED | U | Template nomor darurat |
| Dokumen penting (+ foto scan) | COMPLETED | U | v0.5.2-0.5.3: tombol 📷 Foto cepat; v0.5.3: tombol 📷 Ambil foto / 🖼️ Galeri langsung di formulir dokumen dan bukti transaksi; (kamera, `capture=environment`) + menu kamera/galeri di tiap foto. Foto scan via tombol 📷 (v0.5.1); blob hanya di IndexedDB perangkat |
| Brankas identitas | COMPLETED | U | Foto KTP/NPWP/KK/SIM per anggota, tombol Kirim/bagikan (Web Share API) — perilaku share di perangkat nyata `NEEDS VERIFICATION` |
| Keluarga (anggota, identitas ter-mask, foto profil) | COMPLETED | T (maskId), U | Relasi termasuk Pacar & Tunangan; ID teks tidak terenkripsi |
| Kabar & afeksi | COMPLETED | U | Draf santai, kartu obrolan, kirim WhatsApp/salin |
| Rutinitas harian + pengingat | COMPLETED | T, U | 29 template (kesehatan, ibu & rumah, keluarga, kerja, pribadi); berbunyi hanya saat aplikasi terbuka |
| Berat badan & IMT | COMPLETED | T, U | Klasifikasi Kemenkes RI; saran dari pedoman WHO 2020; hanya dewasa; bukan diagnosis |
| Tugas, jurnal, kebiasaan | COMPLETED | T, U | Tugas berulang & ber-jam dengan pengingat |
| Kalender (agregat + agenda sebulan, yang lewat dicoret, 🎂 ulang tahun) | COMPLETED | T, U | v0.5.2. Acara, tugas, ulang tahun, tagihan, perawatan, pajak/STNK, garansi, dokumen, stok kedaluwarsa |
| Notifikasi & ekspor `.ics` | PARTIAL | T (buildICS, eventDue, birthdayDue), U | v0.5.2: pengingat acara 0/10/30 mnt, 1/3 jam, 1/3 hari, 1 minggu + pengingat kedua; seharian dihitung dari 08.00; ulang tahun anggota otomatis H-1 & H. Ekspor `.ics` dihasilkan; **impor ke Google Calendar belum diuji**. Notifikasi aplikasi-tertutup tidak mungkin tanpa server |
| Uang: akun/rekening | COMPLETED | U | Banyak akun; template bank/e-wallet; penanda dana darurat |
| Uang: transaksi (+ sumber dana, kategori kustom, foto bukti, void) | COMPLETED | T, U | Uang bilangan bulat; tidak pernah dihapus; transaksi tidak bisa diedit (hanya void) |
| Uang: anggaran + jatah per hari | COMPLETED | T, U | Penanda "batas wajar hari ini" |
| Uang: goal tracker | COMPLETED | T, U | Setoran manual (`gc`) dan/atau saldo akun terkait; setoran manual tidak membuat transaksi |
| Uang: level kesehatan keuangan 0–5 | COMPLETED | T, U | Ambang 30% cicilan & bulan dana darurat per mode = **heuristik sendiri**, belum divalidasi ahli |
| Uang: statistik & grafik (SVG) | COMPLETED | U | Garis masuk-vs-keluar, donat pemasukan/pengeluaran, batang kekayaan 6 bulan. Mode gelap `NEEDS VERIFICATION` secara visual |
| Ekspor Excel (.xlsx) & PDF | COMPLETED | T (export.test.mjs, 7 tes), U (t13), diverifikasi dengan openpyxl & pdftotext/pdftoppm | v0.5.4. `export.js` tanpa pustaka (zip & PDF ditulis sendiri). Nomor identitas & foto tidak diekspor. Dibuka di Excel/Google Sheets/Adobe Reader sungguhan: `NEEDS VERIFICATION` |
| Rekap WhatsApp | COMPLETED | U (tombol ada) | Memakai `wa.me`, pengguna memilih penerima |
| Backup lokal (bagikan/unduh JSON) & impor | COMPLETED | T (validStore), U | **Tidak memuat foto** |
| Sinkron Google Drive (appDataFolder) | PARTIAL | T (mergeStores) | Kode lengkap; **tidak pernah dijalankan dengan Client ID nyata** |
| PWA (manifest + service worker) | PARTIAL | U (Chrome headless), M (aplikasi tampil di Android) | Instal ke layar utama Android: sebagian terlihat; iPhone (Safari/Chrome): **NEEDS VERIFICATION** |
| Bantuan & data contoh | COMPLETED | U | Bantuan: mulai cepat, instal, Drive, notifikasi, Uang, brankas, IMT, tentang |
| Notice Illusix / gratis / dilarang dijual | COMPLETED | U | UI + README + `LICENSE.txt` |
| Tes UI di repo | PARTIAL | — | Skrip ada di `docs/handover/ui-tests` tetapi belum jadi bagian pipeline; bergantung path lokal |
| Lint / typecheck / CI | PLANNED | — | Tidak ada konfigurasi apa pun |

## Bagian monorepo penuh (SPEC F0–F6)

Tidak ada di folder yang diaudit.

| Modul | Status | Progress | Catatan |
|---|---|---|---|
| F0 Fondasi (monorepo, DB, RLS, CI) | NEEDS VERIFICATION | — | Repo `TriNtoro/rumahku-one` tidak dapat diakses; Actions kosong menurut screenshot pemilik |
| F1–F6 (auth lanjutan, RBAC, task/kalender server, dokumen MinIO, keuangan server, E2EE, Berdua) | NEEDS VERIFICATION | — | Tidak diaudit |
| Google Calendar dua arah, Web Push, ClamAV, webhook | PLANNED | — | Tidak ada di Lite |
