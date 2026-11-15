# Keputusan Teknis — RUMAHKU-ONE Lite

Pembeda: **[DITERAPKAN]** sudah ada di kode · **[BELUM]** rencana/tidak diterapkan · **[TERBUKA]** belum final.
Alasan di bawah berasal dari percakapan pengembangan dengan pemilik (Illa). ADR resmi untuk Lite tidak ditemukan (`NEEDS VERIFICATION`).

## 1. Platform & stack

- **[DITERAPKAN] PWA statis, JavaScript biasa, tanpa build dan tanpa dependensi npm.**
  Alasan: pemilik ingin pemakaian pribadi tanpa server, bisa dihosting gratis di GitHub Pages, dan dibagikan ke komunitas Telegram untuk diuji. Diunggah manual lewat web GitHub. Konsekuensi: tidak ada lint/TypeScript/bundler.
- **[DITERAPKAN] Menyimpang dari ADR-001 monorepo (Next.js/Fastify/PostgreSQL).** Perubahan arah diputuskan pemilik; kelanjutan monorepo `[TERBUKA]`.
- **[DITERAPKAN] Satu IIFE besar `app.js` + modul logika murni `core.js` (UMD).** `core.js` bisa dijalankan Node untuk tes; `app.js` hanya dijalankan di browser.
- **[DITERAPKAN] Tanpa framework.** Render dengan string HTML + `innerHTML` pada `#main`, delegasi klik dengan atribut `data-a`. Setiap nilai dari pengguna lewat `esc()`.
- **[DITERAPKAN] Hanya skrip eksternal: Google Identity Services**, dimuat saat Drive dihubungkan. Tidak ada CDN lain, tidak ada font/ikon eksternal (ikon = emoji).
- **[DITERAPKAN] Lisensi**: tanpa dependensi → tidak ada kewajiban lisensi pihak ketiga selain GIS (layanan Google). Aplikasi: gratis, dilarang diperjualbelikan (`LICENSE.txt`). Jika menambah dependensi (mis. puppeteer-core untuk tes), cek lisensi dan catat di `docs/THIRD_PARTY_NOTICES.md` (belum ada) — aturan AGENTS.md butir 10.

## 2. Pola coding & konvensi

- UI & pesan: Bahasa Indonesia. Identifier & commit: Inggris. Komentar: campur, dominan Indonesia, menjelaskan *mengapa*.
- Nama halaman/aksi/tipe rekaman: huruf kecil pendek (`plan`, `tx`, `acc`, `bill`, `pfile`, `rtlog`…).
- Fungsi `vXxx()` mengembalikan `{title, sub, html, add?}` untuk tab; `pages.nama()` untuk halaman turunan; `A.nama(d)` aksi.
- Formulir hanya lewat `openForm`; template lewat `pickTemplates`; menu lewat `openMenu`; konfirmasi `confirmBox`.
- Selalu `commit()` setelah mengubah `store` (menyimpan, menjadwalkan sinkron, render ulang).
- Warna grafik lewat variabel CSS `--s1..--s8` (palet kategorikal tervalidasi, ada varian gelap); teks grafik memakai token teks, bukan warna seri; legenda/daftar angka selalu ada.
- Uang tampil lewat `rp()` / `C.fmtIDR` ("Rp1.234.567"), singkatan grafik lewat `cj()`.

## 3. Model data [DITERAPKAN]

```
store = { v: 1, rec: { [id]: { id, _t:<tipe>, _u:<ISO waktu ubah>, _d?:<ISO waktu hapus>, ...field } } }
```
- Disimpan di `localStorage['rk1.store']`; konfigurasi `rk1.cfg` (clientId, connected, lastSync, lastBackup, notifDetail); `rk1.fired` (kunci pengingat sudah berbunyi per hari); `rk1.nlog` (riwayat notifikasi, maks 40).
- Foto: blob di IndexedDB `rumahku-files`/store `f`, kunci = id rekaman `pfile`. Foto profil anggota (`person.photo`) berupa dataURL 160 px di dalam rekaman.
- `C.put` menggabungkan dengan rekaman lama (`Object.assign`), memperbarui `_u`, menghapus tanda `_d`, dan **melepas `demo`** bila pengguna mengedit data contoh.
- `C.remove` = tombstone (`_d`), **kecuali transaksi: menolak** (transaksi tidak pernah dihapus).
- `mergeStores(a,b)`: per rekaman, `_u` terbaru menang, seri → perbandingan JSON; transaksi yang sudah `void` tidak hidup lagi karena merge; tombstone bertahan.
- Tipe rekaman (27, hasil `grep` pemanggilan `C.put`): `plan`, `plog`, `tx`, `acc`, `budget`, `goal`, `gc`, `bill`, `veh`, `asset`, `inv`, `shop`, `contact`, `doc`, `pfile`, `task`, `event`, `habit`, `journal`, `profile`, `person`, `rt`, `rtlog`, `wt`, `draft`, `ccard`, `opt`.
- ID khusus: `profile` (tunggal), `rl|<rutinitas>|<tanggal>` (log rutinitas harian), `wt|<tanggal>` (berat per hari, satu per tanggal).
- Skema **tidak berversi per tipe**: field baru ditambah secara aditif dan dibaca defensif (`b.kind || 'tagihan'`). Tidak ada fungsi migrasi.

## 4. Aturan domain [DITERAPKAN]

- **Uang = bilangan bulat rupiah.** `parseAmount` menolak desimal/sampah, menerima format Indonesia ("1.250.000"). Tidak ada float untuk uang.
- **Transaksi tidak pernah dihapus**: `void:true` membuatnya dianggap tidak ada; tes menjaga ini. Transaksi tidak bisa diedit (hanya void + catat ulang).
- **Akuntansi**: transfer antar akun tidak masuk pemasukan/pengeluaran dan tidak mengubah kekayaan bersih; kartu kredit = akun bersaldo negatif (utang); investasi = akun bertipe `invest`.
- **Tanggal**: string lokal `YYYY-MM-DD`, tanpa zona waktu; pengulangan dihitung sederhana (`addMonths` dengan anchor tanggal 31 → akhir bulan). Tidak memakai RRULE/zona waktu (beda dengan SPEC penuh).
- **Level kesehatan keuangan** (`C.healthLevel`): pelajar/pekerja/berkeluarga → dana darurat [1,2,3] / [1,3,6] / [2,6,12] bulan; cicilan > 30% pemasukan = level 2; menabung ≥ 10% / ≥ 20%. Angka adalah **heuristik pedoman umum**, nama level dibuat sendiri (tidak menyalin aplikasi pihak lain). Dihitung dari rata-rata 3 bulan terakhir yang berdata; dana darurat = akun bertanda, jika tidak ada → seluruh kas/bank/e-wallet positif.
- **IMT** (`C.bmiCategory`): ambang Kemenkes RI (<17 / 17–18,4 / 18,5–25 / 25,1–27 / >27); hanya dewasa ≥ 18; ada catatan acuan WHO/Asia-Pasifik; bukan diagnosis.
- **Pengingat rutinitas** (`C.routineDue`): sesuai laju (`ceil(target*(slot+1)/jumlahSlot)`), jendela toleransi 20 menit, tidak berbunyi dua kali (kunci di `rk1.fired`), berhenti bila target hari itu tercapai.

## 5. Privasi & keamanan [DITERAPKAN] / [BELUM]

- [DITERAPKAN] Semua data lokal; Drive hanya memakai scope `drive.appdata` (folder tersembunyi milik aplikasi, bukan seluruh Drive).
- [DITERAPKAN] Nomor identitas ditampilkan ter-mask (`C.maskId`) dengan Tampilkan/Salin; **tidak terenkripsi**.
- [DITERAPKAN] Notifikasi memakai judul generik; nama rutinitas/tugas hanya bila pengguna mengaktifkan `notifDetail`.
- [DITERAPKAN] Foto tidak pernah keluar dari perangkat kecuali pengguna memilih Kirim/bagikan.
- [BELUM] Enkripsi (WebCrypto/E2EE). Aturan AGENTS.md: jangan membuat primitif kripto sendiri; perlu dokumen desain + persetujuan manusia dulu.
- [DITERAPKAN] Tidak ada rahasia di repo. Client ID Google dimasukkan pengguna lewat UI dan disimpan di `localStorage` perangkatnya.

## 6. Hal yang TIDAK boleh diubah sembarangan

1. Bentuk `store` (`{v:1, rec}`) dan semantik `put/remove/mergeStores`; backup pengguna dan Drive bergantung padanya.
2. Aturan uang bilangan bulat dan "transaksi tidak pernah dihapus".
3. Nama tipe rekaman dan pola id (`rl|…`, `wt|…`, `profile`); mengubahnya memecah data pengguna.
4. Service worker network-first dan **kenaikan `VER` tiap rilis**.
5. Scope Drive `drive.appdata` (jangan diperluas).
6. Notice Illusix/gratis/dilarang dijual dan email masukan.
7. Larangan menyalin tampilan/teks aplikasi pihak lain.
8. Jangan menambahkan kripto buatan sendiri.

## 7. Keputusan yang belum final [TERBUKA]

- Kelanjutan monorepo penuh vs tetap Lite.
- Enkripsi identitas/dokumen dan apakah foto ikut backup/Drive (saat ini tidak).
- Apakah goal setoran manual perlu membuat transaksi transfer.
- Apakah perlu mekanisme versi skema/migrasi sebelum ada perubahan tak-aditif.
- Memecah `app.js` per modul (tanpa build, mis. beberapa `<script>`) atau tetap satu berkas.
- Pengadopsian lint/tes UI sebagai bagian repo (`NEXT_ROADMAP.md`).

## Kripto brankas (v0.5.5)
WebCrypto saja, DEK dibungkus ganda (password & recovery), ganti password = rewrap. Rinci: docs/security/crypto-design.md.
