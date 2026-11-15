# RUMAHKU-APP — Agent Instructions

## Communication
- Jawab dalam Bahasa Indonesia, langsung ke inti.
- Utamakan jawaban ringkas; hindari pengulangan dan penjelasan yang tidak diminta.
- Untuk pekerjaan teknis, laporkan hasil, file yang berubah, verifikasi, dan kendala.
- Jangan mengarang hasil test, status deployment, atau fakta yang belum diperiksa.

## Arsitektur
- PWA statis: `index.html`, `core.js` (logika murni, UMD), `app.js` (UI/IIFE), `sw.js`, `manifest.webmanifest`.
- Tanpa server, backend, database server, `package.json`, lint, typecheck, atau build.
- Data: `localStorage` (`rk1.store`, `rk1.cfg`, `rk1.fired`, `rk1.nlog`) dan IndexedDB `rumahku-files`.
- Sinkronisasi opsional: Google Drive `appDataFolder` dengan scope `drive.appdata`.
- Jangan mengasumsikan backend, database server, atau multi-tenant.

## Project Rules
- Baca dokumentasi dan kode terkait sebelum mengubah implementasi.
- Ikuti arsitektur, pola, dependency, dan konvensi yang sudah ada.
- Buat perubahan terkecil yang menyelesaikan kebutuhan secara utuh.
- Jangan menambah fitur, dependency, abstraksi, atau konfigurasi tanpa kebutuhan.
- Perhatikan keamanan data pribadi/keluarga, validasi input, kontrol akses, privasi penyimpanan lokal, sinkronisasi Google Drive, dan auditability sesuai arsitektur yang benar-benar ada.
- Logika baru ditaruh di `core.js` beserta tes; `app.js` hanya UI.
- Uang = bilangan bulat rupiah; transaksi tidak dihapus (void); transfer bukan pemasukan/pengeluaran.
- Bentuk `store` (`{v:1, rec}`) dan semantik `put`/`remove`/`mergeStores` tidak boleh diubah tanpa alasan kuat.
- Setiap rilis: naikkan `VER` di `sw.js`, serta `APP_VERSION` dan `APP_DATE` di `app.js`.

## Execution
- Jangan mengubah file di luar scope.
- Jangan menghapus data, menjalankan migrasi production, deploy, commit, atau push tanpa izin eksplisit.
- Jangan pernah menampilkan secret, token, password, atau data pribadi dalam log maupun jawaban.
- Jika ada informasi penting yang tidak jelas, tanyakan satu pertanyaan spesifik sebelum mengambil keputusan.

## Verification
Jalankan yang relevan dan laporkan hasil aktual:
- `node --test test/core.test.mjs` — tes logika `core.js`.
- `node --check app.js` — cek sintaks UI.
- `node --check core.js` — cek sintaks logika.
- `node --check sw.js` — cek sintaks service worker.
- Tes UI opsional mengikuti `docs/DEVELOPMENT_GUIDE.md` bagian 5.
- Jangan mengklaim lulus tanpa output perintah yang benar-benar dijalankan.

## Skills
- Gunakan hanya skill yang relevan dengan tugas saat ini.
- Baca `SKILL.md` skill terkait sebelum mulai.
- Jangan memuat semua skill sekaligus jika tidak diperlukan.
- Seluruh skill di `.agents/skills/` dipertahankan, termasuk `superpowers/`.
- Jika sebuah skill menyebut Next.js, PostgreSQL, RLS, tenant, migrasi, package scripts, lint, typecheck, atau build, bagian itu tidak berlaku untuk proyek ini.
- `AGENTS.md` dan permintaan pengguna mengalahkan instruksi skill.
- Skill Superpowers yang membutuhkan subagent hanya dipakai jika tool subagent tersedia; jika tidak, gunakan `executing-plans` atau kerjakan inline.
