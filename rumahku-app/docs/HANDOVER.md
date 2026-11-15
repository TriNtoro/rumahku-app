# RUMAHKU-ONE — Serah Terima ke Codex

Dokumen utama. Dibuat 15 Nov 2026 dari pemeriksaan **source code aktual** di folder kerja `rumahku-app` (versi aplikasi **0.5.4**; 0.5.2 = kamera foto cepat, agenda kalender dicoret, pengingat gaya Google Calendar; 0.5.3 = tombol kamera di formulir dokumen; 0.5.4 = template Servis AC rumah/mobil + ekspor Excel/PDF). Dokumen pendamping: `PROJECT_STATUS.md`, `TECHNICAL_DECISIONS.md`, `KNOWN_ISSUES.md`, `DEVELOPMENT_GUIDE.md`, `NEXT_ROADMAP.md`.

Tanda `NEEDS VERIFICATION` berarti tidak bisa dipastikan dari kode/lingkungan yang diperiksa. Jangan menganggapnya benar atau salah sebelum dicek.

---

## 0. Hal pertama yang WAJIB dipahami

**Repository yang diaudit adalah RUMAHKU-ONE *Lite*, bukan monorepo penuh.**

| | Yang diaudit (Lite) | Yang dijelaskan di AGENTS.md / SPEC.html (Penuh) |
|---|---|---|
| Bentuk | PWA statis: `index.html` + `core.js` + `app.js` + `sw.js` | Monorepo pnpm/Turborepo: `apps/web`, `apps/api`, `apps/worker` |
| Bahasa | JavaScript biasa, tanpa build | TypeScript strict |
| Server / DB | **Tidak ada** | Fastify + PostgreSQL 16 (RLS) + Redis + MinIO |
| Data | `localStorage` + IndexedDB di perangkat; opsional Google Drive `appDataFolder` | Server sendiri, multi-tenant |
| Hosting | GitHub Pages: `https://trintoro.github.io/rumahku-app/` (repo `TriNtoro/rumahku-app`) | Docker compose |
| Pengguna | Satu orang per perangkat (dibagikan ke komunitas untuk uji coba, tiap orang datanya sendiri) | Satu keluarga, banyak anggota, RBAC |

Akibatnya: aturan non-negosiabel di AGENTS.md yang bergantung pada server (RLS, RBAC, tenant, `workspace_id`, Idempotency-Key, `If-Match`, BullMQ, migrasi SQL, argon2) **tidak berlaku dan tidak ada di kode Lite**. Aturan yang tetap relevan dan diterapkan: uang = bilangan bulat, transaksi tidak pernah dihapus (void), semantik waktu sederhana, tanpa rahasia di repo, tanpa primitif kripto buatan sendiri, cek lisensi dependensi.

Repo `TriNtoro/rumahku-one` (monorepo) **tidak dapat diakses** dari sesi audit ini (daftar repo kosong). Dari screenshot pengguna, tab Actions repo itu menampilkan "0 workflow runs" dan "No workflows found". Isi repo itu: `NEEDS VERIFICATION`. Keputusan produk yang tercatat dari percakapan: pengguna beralih ke Lite untuk pemakaian pribadi dan berbagi cepat; kelanjutan monorepo `NEEDS VERIFICATION` (tanyakan ke pemilik).

`AGENTS.md`, `docs/SPEC.html`, `docs/adr/`, dan `.agents/skills/` **tidak ada** di folder yang diaudit. Apakah ada di repo GitHub: `NEEDS VERIFICATION`.

Folder yang diaudit **bukan repository git** (`git status` gagal: not a git repository). Riwayat commit tidak tersedia; perubahan dilacak lewat paket zip bernomor versi (v0.3, v0.4, v0.5, v0.5.1) yang dikirim ke pemilik, lalu diunggah manual ke GitHub.

---

## 1. Kondisi terakhir

- Versi: **0.5.4** (`APP_VERSION` di `app.js`, `VER = 'rk-v5-4'` di `sw.js`, README).
- Tampil di UI: kanan judul Beranda, judul Lainnya, bawah Beranda/Lainnya, Bantuan → Tentang.
- Ukuran: `app.js` 1.684 baris, `core.js` 538, `sw.js` 24, `index.html` 145 (CSS di dalamnya), `test/core.test.mjs` 317.
- Tidak ada dependensi npm, tidak ada build. Satu skrip eksternal saat runtime: Google Identity Services (`accounts.google.com/gsi/client`), hanya dimuat bila pengguna menghubungkan Drive.
- Pekerjaan terakhir (urut): v0.4 template kendaraan EV + jadwal bisa diubah, template rutinitas ibu rumah tangga, pelacak berat badan + IMT, notice Illusix; v0.5 modul Uang diperbarui (lihat bawah); v0.5.1 foto scan di Dokumen penting + versi di judul.

### Fitur yang sudah selesai (terverifikasi tes)
Ringkasan; rinci per modul di `PROJECT_STATUS.md`.

- **Rumah**: perawatan berulang, kendaraan (motor/mobil/EV, odometer, pajak, STNK, jadwal servis per jenis yang bisa diubah), tagihan & kewajiban tetap & cicilan, aset & garansi, stok & belanja, kontak, dokumen penting (+ foto scan).
- **Uang**: akun/rekening (banyak, tipe kas/bank/e-wallet/kartu/investasi, penanda dana darurat), transaksi (pemasukan/pengeluaran/transfer, void, foto bukti), sumber dana & kategori sebagai dropdown yang bisa ditambah, anggaran dengan garis laju, goal tracker, level kesehatan keuangan 0–5, statistik (garis masuk-vs-keluar, donat), kekayaan 6 bulan, rekap WhatsApp.
- **Keluarga & pribadi**: profil + mode (pelajar/pekerja/berkeluarga), anggota keluarga (identitas ter-mask, foto), Brankas identitas, kabar & afeksi (draf pesan), rutinitas harian dengan pengingat, berat badan + IMT + grafik + saran, tugas, jurnal, kebiasaan.
- **Lintas**: kalender agregat, notifikasi (selama aplikasi terbuka) + ekspor `.ics`, backup lokal (bagikan berkas JSON), sinkron Google Drive (kode ada, **belum teruji nyata**), data contoh yang bisa dihapus, bantuan lengkap.

### Fitur dalam pengembangan
Tidak ada pekerjaan setengah jadi yang diketahui di kode. Tidak ada `TODO`/`FIXME` yang dicari secara sistematis: `NEEDS VERIFICATION` (jalankan `grep -n "TODO\|FIXME" app.js core.js`).

### Modul belum diimplementasikan (ada di SPEC penuh, tidak di Lite)
Server/DB/RLS/RBAC, multi-pengguna dengan peran, E2EE T2, passkey/TOTP, Google Calendar dua arah (Lite hanya ekspor `.ics`), Web Push saat aplikasi tertutup, OCR/antivirus berkas, webhook, impor CSV mutasi, utang/cicilan dengan pemecahan pokok/bunga, investasi manual & kurs, snapshot kekayaan harian. Detail: `NEXT_ROADMAP.md`.

### Bug yang sudah diperbaiki (selama sesi)
- `pickTemplates` salah menganggap objek hasil `makeFn` sebagai pesan error (template aset/stok/kontak/dokumen/kebiasaan gagal).
- Notifikasi Android Chrome: `new Notification` melempar error; kini lewat `ServiceWorkerRegistration.showNotification`.
- Kalender tidak memuat ulang tahun pengguna/tagihan dll; diganti agregator `C.calendarItems`.
- Data contoh yang diedit pengguna tetap bertanda demo dan ikut terhapus; kini tanda demo dilepas saat diedit.
- Pembulatan `healthyRange` (53,5–72,2 vs 72,3) memakai epsilon.
- Tes lama bergantung interval oli mobil 2.500 km; disesuaikan ke 5.000 km setelah template per jenis.
- Tata letak: tab segmen terpotong, label `kv` membungkus; diperbaiki dengan CSS.

### Bug tersisa
Lihat `KNOWN_ISSUES.md`. Ringkas: tidak ada bug fungsional yang diketahui gagal di tes; risiko utama bersifat *belum diverifikasi* (Drive nyata, iPhone, pengingat saat tertutup, mode gelap grafik).

### File berubah pada pekerjaan terakhir
`app.js`, `core.js`, `index.html` (CSS), `sw.js`, `README.md`, `LICENSE.txt`, `test/core.test.mjs`. Daftar lengkap per rilis tidak bisa direkonstruksi dari git (tidak ada riwayat): `NEEDS VERIFICATION`.

### Perubahan database / migration
Tidak ada database. Skema data = bentuk objek `store` (lihat `TECHNICAL_DECISIONS.md` §3). Tipe rekaman baru bersifat aditif (tidak butuh migrasi): `opt`, `goal`, `gc`, `wt`; field baru: `profile.mode/sex/height`, `acc.emergency`, `bill.kind`, `tx.proof`, `pfile.txId/docId`, `person.rel` bertambah Pacar/Tunangan. Tidak ada mekanisme migrasi versi (`store.v` selalu 1).

### Perubahan API / frontend
Tidak ada API. Seluruhnya frontend.

---

## 2. Peta kode (baca dulu sebelum mengubah)

```
rumahku-app/
├─ index.html        shell + seluruh CSS (variabel tema, --s1..--s8 untuk grafik) + <dialog id="dlg">
├─ export.js         ekspor .xlsx & PDF tanpa pustaka (UMD, diuji di Node)
├─ core.js           logika murni (UMD: window.Core / module.exports); TANPA DOM; semua diuji
├─ app.js            UI: IIFE tunggal; state, form, halaman, aksi, sinkron Drive, tick pengingat
├─ sw.js             service worker: network-first + fallback cache; notificationclick
├─ manifest.webmanifest, icon.svg, icon-192.png, icon-512.png
├─ test/core.test.mjs   35 tes node:test untuk core.js
├─ README.md, LICENSE.txt
└─ docs/             dokumen serah terima ini + docs/handover/ui-tests (skrip Puppeteer)
```

Pola di `app.js` (cari kata kunci ini):
- `store` = `{v:1, rec:{...}}`; baca lewat `list(type)` / `get(type,id)`; tulis lewat `C.put(store,type,data)` lalu `commit()` (persist + jadwalkan sinkron + render).
- `pages = { namaHalaman() {...} }` halaman turunan (dibuka `data-a="nav" data-to="nama"`); `vToday/vHouse/vMoney/vCal/vMore` untuk 5 tab bawah.
- `A = { namaAksi(d) {...} }` pengendali klik (delegasi lewat atribut `data-a`, parameter `d` = `dataset`).
- `openForm(title, fields, init, onOk, extras, note, onChange)` untuk semua formulir; tipe field: teks, `select` (opsi `addList` = ada "➕ Tambah baru…"), `amount`, `dec`, `number`, `date`, `check`, `photo`, `textarea`.
- `pickTemplates(...)` dan `TPL`/`tplForms` untuk template kosong; `optNames('inc'|'exp')` untuk daftar sumber dana/kategori; `MODES`, `modeOf()`.
- `IDB` (IndexedDB `rumahku-files`, store `f`) menyimpan blob foto; metadata ada di rekaman `pfile`.
- `tick()` tiap 30 detik: pengingat rutinitas/tugas/acara (hanya jalan saat aplikasi terbuka).
- `runSync/getToken/dfetch` sinkron Drive.

---

## 3. Instruksi untuk Codex

Baca urut: file ini → `TECHNICAL_DECISIONS.md` → `KNOWN_ISSUES.md` → `NEXT_ROADMAP.md`.

1. **Baca AGENTS.md dan dokumentasi proyek sebelum koding.** Bila `AGENTS.md` tidak ada di repo Lite, jangan menerapkan aturan monorepo secara membabi buta; pakai bagian "Hal yang tidak boleh diubah" di `TECHNICAL_DECISIONS.md` §6. Sebaiknya minta pemilik membuat `AGENTS.md` khusus Lite.
2. **Pertahankan arsitektur**: tanpa build, tanpa framework, tanpa dependensi, logika murni di `core.js` + tes, UI di `app.js`.
3. **Jangan mengulang yang sudah selesai** (lihat `PROJECT_STATUS.md`).
4. **Jangan ubah keputusan teknis tanpa alasan kuat** dan tanpa persetujuan pemilik (§6 di `TECHNICAL_DECISIONS.md`).
5. **Tanpa refactor besar.** `app.js` besar (1,7 rb baris, satu IIFE) memang merepotkan, tetapi memecahnya berisiko; lakukan hanya bila diminta dan dengan seluruh tes hijau sebelum-sesudah.
6. **Skill `.agents/skills/`**: tidak ada di folder yang diaudit (`NEEDS VERIFICATION`). Bila ada, pakai yang relevan (mis. keamanan, pengujian).
7. **Perubahan bertahap, jalankan tes setiap langkah**: `node --test test/core.test.mjs` + `node --check app.js core.js sw.js` + skrip UI (`DEVELOPMENT_GUIDE.md` §5).
8. **Setiap rilis**: naikkan `APP_VERSION` (app.js), `VER` (sw.js), versi di README, dan `APP_DATE`. Pemilik perlu tahu nomor versi (diminta eksplisit).
9. **Jangan** melakukan deploy, commit, push, atau mengubah repo GitHub tanpa izin eksplisit pemilik. Jangan menampilkan atau menulis rahasia. Client ID Google dimasukkan pengguna di dalam aplikasi, tidak disimpan di repo.
10. **Hak cipta & lisensi**: aplikasi dibuat oleh **Illusix**, gratis, **dilarang diperjualbelikan** (`LICENSE.txt`, tampil di UI). Pertahankan notice dan email masukan `trintoro@gmail.com`. Tampilan/teks aplikasi pihak lain yang dijadikan referensi *tidak boleh disalin*; hanya ambil ide fungsi.
11. Bahasa: UI dan pesan pengguna **Bahasa Indonesia**; kode, nama variabel, commit message: Inggris (komentar kode saat ini campur, dominan Indonesia).
12. Pemilik adalah pengguna non-pemrogram yang mengunggah file manual ke GitHub: setiap kerja yang selesai sebaiknya berupa **paket lengkap siap-unggah** (zip semua berkas) dan melaporkan gejala spesifik, bukan potongan kode.

---

## 4. Risiko teknis yang perlu diperhatikan
1. **Data hanya di perangkat.** Hapus data situs/instal ulang = data hilang kecuali ada backup/Drive. Foto (IndexedDB) **tidak** ikut backup JSON maupun Drive.
2. **Drive belum teruji nyata** (butuh OAuth Client ID milik pemilik).
3. **Pengingat tidak berbunyi saat aplikasi tertutup**; solusi `.ics` belum diuji impor ke Google Calendar.
4. **Nomor identitas disimpan teks biasa** (ditutupi di layar, tidak terenkripsi). Enkripsi memerlukan desain kripto + persetujuan manusia lebih dulu.
5. **Perilaku iPhone** (instal dari Chrome/Safari, notifikasi) belum terverifikasi di perangkat nyata.
6. **Cache service worker**: setelah rilis, pengguna bisa melihat versi lama sampai aplikasi ditutup-dibuka ulang; selalu naikkan `VER`.

## 5. Rekomendasi langkah pertama untuk Codex
1. Jalankan semua tes (`DEVELOPMENT_GUIDE.md`) dan pastikan hasilnya sama dengan `KNOWN_ISSUES.md` §"Hasil pengujian".
2. Minta pemilik konfirmasi: (a) apakah `AGENTS.md`/`docs/` ada di repo GitHub `rumahku-app`; (b) apakah v0.5.1 sudah terunggah dan terlihat di Pages; (c) nasib monorepo `rumahku-one`.
3. Verifikasi di perangkat nyata (Android + iPhone): instal PWA, versi tampil, notifikasi, unggah foto, bagikan berkas.
4. Baru lanjut ke urutan di `NEXT_ROADMAP.md`.
