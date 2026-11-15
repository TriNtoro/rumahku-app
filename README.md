# RUMAHKU-ONE Lite v0.5.7
PWA statis (tanpa server, tanpa dependensi). Data: penyimpanan lokal + opsional file pribadi di Google Drive (appDataFolder).
Jalankan tes logika: `node --test test/core.test.mjs`
Aturan: uang = bilangan bulat rupiah; transaksi tidak dihapus (void); transfer bukan pemasukan/pengeluaran.
Tidak ada rahasia di repo ini: Client ID Google dimasukkan pengguna di aplikasi dan disimpan di perangkatnya.


## Tentang
Dibuat oleh **Illusix**. Aplikasi ini **gratis** dan **dilarang diperjualbelikan**. Saran & masukan: trintoro@gmail.com

## Aturan versi
Setiap perbaikan (kecil maupun besar) menaikkan angka terakhir: 0.5.7 → 0.5.8 → 0.5.9 → 0.5.10 ... Ubah 3 tempat: `APP_VERSION` di app.js, `VER` di sw.js (`rk-v<versi>`), judul README.
