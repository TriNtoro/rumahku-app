# Rumahku v1.0
PWA statis (tanpa server, tanpa dependensi). Data: penyimpanan lokal + opsional file pribadi di Google Drive (appDataFolder).
Jalankan tes logika: `node --test test/core.test.mjs`
Aturan: uang = bilangan bulat rupiah; transaksi tidak dihapus (void); transfer bukan pemasukan/pengeluaran.
Tidak ada rahasia di repo ini: Client ID Google dimasukkan pengguna di aplikasi dan disimpan di perangkatnya.


## Tentang
Dibuat oleh **Illusix**. Aplikasi ini **gratis** dan **dilarang diperjualbelikan**. Saran & masukan: trintoro@gmail.com

## Aturan versi
Setiap perbaikan (kecil maupun besar) menaikkan angka terakhir: 1.0 → 1.1 → 1.2 ... Ubah 3 tempat: `APP_VERSION` di app.js, `VER` di sw.js (`rk-v<versi>`), judul README.
