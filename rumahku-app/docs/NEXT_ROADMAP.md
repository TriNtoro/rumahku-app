# Peta Jalan Berikutnya — RUMAHKU-ONE Lite

Urutan disarankan, bukan keputusan. Tiap butir: kerjakan kecil, tes dulu, jangan refactor besar. Ide yang belum disetujui pemilik **dicatat saja**, jangan diimplementasikan.

## Prioritas 1 — Verifikasi (tanpa fitur baru)
1. Konfirmasi dari pemilik: isi repo GitHub (apakah v0.5.1 & `docs/` terunggah), status Pages, nasib `rumahku-one`.
2. Uji di perangkat nyata: instal PWA di Android dan iPhone (Chrome), versi tampil, notifikasi, kamera/foto, tombol Kirim/bagikan.
3. Uji Drive dengan Client ID milik pemilik (dua perangkat: ubah di A, sinkron di B, konflik).
4. Uji impor `.ics` ke Google Calendar dan alarm berbunyi saat aplikasi tertutup.
5. Screenshot + validasi palet mode gelap untuk semua grafik.

## Prioritas 2 — Keandalan
6. Jadikan tes UI bagian repo (`package.json` dev-only, server statis di skrip, tanggal relatif).
7. Skrip/tes konsistensi versi (3 tempat).
8. Versi skema + `migrate()` dengan tes, sebelum perubahan struktur pertama.
9. Peringatan jelas bahwa foto tidak ikut backup; opsi ekspor foto (ZIP) — butuh keputusan ukuran.
10. Timeout cache-fallback di service worker.

## Prioritas 3 — Keamanan (butuh persetujuan manusia)
11. Dokumen desain enkripsi nomor identitas/foto (WebCrypto, kunci dari sandi pengguna, recovery) → persetujuan → baru koding. Jangan buat primitif sendiri.

## Prioritas 4 — Fitur (urut manfaat bagi pemilik; semua perlu persetujuan)
12. Bukti foto di pembayaran tagihan.
13. Setoran goal lewat transfer akun (membuat transaksi).
14. Target berat badan (garis di grafik) dan berat per anggota keluarga.
15. Tombol "Tanya admin" berisi versi + info perangkat (membuka email ke trintoro@gmail.com).
16. Aksesibilitas grafik (tabel alternatif), lalu axe/Lighthouse.
17. Impor CSV mutasi bank (pratinjau, deteksi duplikat) — sudah ada di SPEC F4.
18. Utang dengan pemecahan pokok/bunga, proyeksi saldo 30/60/90 hari.

## Opsional / jangka panjang
19. Kembali ke monorepo penuh (server, multi-pengguna) — hanya bila pemilik memutuskan; Lite bisa jadi klien offline.
20. Pecah `app.js` per modul tanpa build (beberapa `<script>`), bertahap, tes hijau tiap langkah.

## Tidak dikerjakan tanpa keputusan pemilik
Monetisasi (aplikasi gratis & dilarang dijual), integrasi bank, eksekusi transaksi, nasihat investasi.
