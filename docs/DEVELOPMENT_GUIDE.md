# Panduan Pengembangan — RUMAHKU-ONE Lite

Aplikasi statis tanpa build. Tidak ada `package.json`, lint, typecheck, atau pipeline build. Prasyarat: Node ≥ 18 (hanya untuk tes) dan Python 3 atau server statis apa pun.

## 1. Instalasi
Tidak ada `npm install`. Salin folder proyek; selesai.

## 2. Menjalankan dev server
```
cd rumahku-app
python3 -m http.server 8099
# buka http://localhost:8099/index.html
```
Service worker hanya aktif di `https://` atau `localhost`. Setelah mengubah berkas, naikkan `VER` di `sw.js` atau pakai DevTools → Application → "Update on reload"/Clear storage agar tidak melihat cache lama.

## 3. Lint / typecheck
**Belum ada.** Satu-satunya pemeriksaan statis: `node --check app.js core.js sw.js` (hanya sintaks). Menambah ESLint = dependensi dev baru (cek lisensi, catat di `docs/THIRD_PARTY_NOTICES.md`).

## 4. Tes unit
```
node --test test/core.test.mjs      # 35 tes untuk core.js (hasil terakhir: 35 lulus)
```
`core.js` murni (tanpa DOM) sehingga dapat diuji di Node. Setiap logika baru ditaruh di `core.js` + tes; `app.js` hanya UI.

## 5. Tes UI (opsional, manual-terbantu)
Skrip Puppeteer di `docs/handover/ui-tests/`:
```
mkdir -p /tmp/pt && cd /tmp/pt && npm init -y && npm i puppeteer-core
cp <repo>/docs/handover/ui-tests/* /tmp/pt/
# server dev harus jalan di port 8099 (langkah 2); Chrome di /usr/bin/google-chrome
node smoke2.mjs && node smoke3.mjs && node t4.mjs && node t5.mjs && node t6.mjs && node t7.mjs && node t8.mjs && node t9.mjs && node t10.mjs
```
Catatan: skrip memakai viewport HP, menyimpan screenshot ke `/tmp/pt/`, dan berkas foto uji `test.png` dari path itu. Path/tanggal di-hardcode (lihat KNOWN_ISSUES M1). Jangan jalankan terhadap profil browser yang berisi data nyata (skrip menulis `localStorage`).

## 6. Build
Tidak ada. Berkas dilayani apa adanya. Untuk rilis: kemas semua berkas (`index.html core.js app.js sw.js manifest.webmanifest icon.svg icon-192.png icon-512.png README.md LICENSE.txt` + `docs/`) menjadi zip bernomor versi.

## 7. Variabel lingkungan
**Tidak ada.** Satu-satunya konfigurasi: *Google OAuth Client ID* yang dimasukkan pengguna lewat UI (Lainnya → Sinkron) dan disimpan di `localStorage['rk1.cfg']`. Jangan menaruhnya di repo.

## 8. Database / storage
- Tidak ada database server. Data: `localStorage` (`rk1.store`, `rk1.cfg`, `rk1.fired`, `rk1.nlog`) dan IndexedDB `rumahku-files` (blob foto).
- Reset data saat uji: DevTools → Application → Clear site data, atau Lainnya → Hapus semua data.
- Impor/ekspor: Lainnya → Backup (JSON, tanpa foto).

## 9. Integrasi
- **Google Drive**: pengguna membuat OAuth Client ID (tipe Web) di Google Cloud Console, menambahkan origin `https://trintoro.github.io` (dan `http://localhost:8099` untuk uji) sebagai *Authorized JavaScript origin*, mengaktifkan Drive API, lalu menempel Client ID ke aplikasi. Scope: `https://www.googleapis.com/auth/drive.appdata`. Belum teruji nyata.
- **Google Calendar**: tidak ada integrasi; hanya ekspor `.ics`.
- **WhatsApp**: tautan `wa.me` (tanpa API).
- **Web Share API**: berbagi berkas/foto.

## 10. Hosting
GitHub Pages dari cabang utama repo `TriNtoro/rumahku-app` (URL `https://trintoro.github.io/rumahku-app/`). Pengunggahan dilakukan manual lewat web GitHub oleh pemilik. Jangan commit/push tanpa izin pemilik.

## 11. Alur rilis
1. Ubah kode + tes.
2. Jalankan: `node --test test/core.test.mjs`, `node --check …`, tes UI.
3. Naikkan `APP_VERSION`, `APP_DATE` (app.js), `VER` (sw.js), versi README.
4. Kemas zip `rumahku-app-vX.Y.Z.zip`, laporkan ke pemilik: apa yang berubah, gejala yang diperbaiki, apa yang belum teruji.

## 12. Checklist sebelum menyatakan selesai
- [ ] 35+ tes unit hijau; tes baru untuk logika baru
- [ ] Tes UI relevan hijau, tanpa error konsol
- [ ] Versi dinaikkan di 3 tempat
- [ ] Tidak ada rahasia di berkas
- [ ] Data pengguna lama tetap terbaca (perubahan skema hanya aditif)
- [ ] Mode gelap & layar sempit (≈360 px) tidak terpotong
