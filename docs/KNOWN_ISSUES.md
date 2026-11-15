# Masalah yang Diketahui — RUMAHKU-ONE Lite v0.5.2

Diaudit 15 Nov 2026. Tingkat: **Critical** (data hilang/keamanan serius) · **High** · **Medium** · **Low**.
Tidak ada isu yang terbukti gagal di tes. Semua butir di bawah adalah celah verifikasi, risiko desain, atau utang teknis.

## Hasil pengujian (nyata, dijalankan 15 Nov 2026)

| Pemeriksaan | Perintah | Hasil |
|---|---|---|
| Tes unit logika | `node --test test/core.test.mjs` | **45 tes, 45 lulus, 0 gagal** (v0.5.2, 10 tes baru untuk pengingat acara/ulang tahun/ICS) |
| Sintaks | `node --check app.js core.js sw.js` | OK |
| TODO/FIXME | `grep -n "TODO\|FIXME" app.js core.js` | tidak ada |
| Tes UI Puppeteer (Chrome headless, viewport HP) | skrip di `docs/handover/ui-tests/` | Dijalankan pada rilis v0.5.1 dalam sesi pengembangan: smoke2 28 lulus, smoke3 30, t4 4, t5 1, t6 18, t7 22, t8 18, t9 9, t10 8; tanpa error konsol. **Tidak dijalankan ulang saat penyusunan dokumen ini** (butuh server lokal port 8099 + Chrome). |

**Belum pernah dilakukan:** lint, typecheck, build (tidak ada tooling), Lighthouse/axe, uji di iPhone, uji Drive nyata, uji impor `.ics`, uji mode gelap secara visual, uji kamera nyata, uji beban data besar, tes `app.js` di luar browser.

## Critical
Tidak ada yang diketahui.

## High

| # | Masalah | Dampak | File | Rekomendasi |
|---|---|---|---|---|
| H1 | Foto (bukti, scan KTP/KK/NPWP, foto anggota blob) hanya di IndexedDB; tidak masuk backup JSON maupun Drive | Ganti HP / hapus data situs = foto hilang permanen, termasuk scan identitas | `app.js` (`IDB`, `pfile`, backup `Blob(JSON…)` ±baris 1465) | Beri peringatan jelas di UI backup; pertimbangkan ekspor ZIP/berkas foto, atau unggah blob ke Drive `appDataFolder` (butuh keputusan ukuran/privasi) |
| H2 | Sinkron Google Drive tidak pernah dijalankan dengan Client ID nyata | Fitur utama "data aman di akun sendiri" belum terbukti; bug OAuth/CORS/token expiry mungkin tersembunyi | `app.js` (`runSync`, `getToken`, `dfetch`) | Uji manual dengan Client ID milik pemilik (Android + PC); tambah tes dengan `fetch` palsu |
| H3 | Nomor identitas (KTP, NPWP, KK, SIM) disimpan teks biasa di `localStorage`, hanya di-mask di layar | Siapa pun yang memegang perangkat tak terkunci/ekstensi berbahaya bisa membacanya; ikut backup JSON tanpa enkripsi | `app.js` (`person`), `core.js` (`maskId`) | Butuh dokumen desain kripto + **persetujuan manusia** sebelum koding (jangan buat primitif sendiri); sementara beri peringatan saat backup dibagikan |
| H4 | Pengingat hanya berbunyi saat aplikasi terbuka | Pengguna mengira alarm berbunyi walau aplikasi tertutup | `app.js` (`tick`), `sw.js` | Pesan sudah ada di Bantuan; tambahkan peringatan di layar Notifikasi; uji `.ics` impor ke Google Calendar |

## Medium

| # | Masalah | Dampak | File | Rekomendasi |
|---|---|---|---|---|
| M1 | Skrip tes UI tidak ada di pipeline; bergantung `localhost:8099`, `/usr/bin/google-chrome`, `puppeteer-core`, dan tanggal contoh | Regresi UI tak terdeteksi otomatis; skrip rapuh | `docs/handover/ui-tests/*.mjs` | Buat `package.json` dev-only, server statis di skrip, path Chrome via env, tanggal relatif; cek lisensi puppeteer-core (Apache-2.0, `NEEDS VERIFICATION`) |
| M2 | `imp.mjs` (tes impor contoh) basi: 3 kegagalan karena tanggal contoh bergeser | Menyesatkan bila dijalankan | tidak disalin ke `docs/` | Tulis ulang dengan tanggal relatif atau abaikan |
| M3 | Versi harus dinaikkan manual di 3 tempat (`APP_VERSION`/`APP_DATE` di `app.js`, `VER` di `sw.js`, README) | Lupa menaikkan `VER` = pengguna tetap melihat cache lama | `app.js`, `sw.js`, `README.md` | Skrip kecil `scripts/bump.mjs` atau tes yang membandingkan ketiganya |
| M4 | Tidak ada versi skema / migrasi data | Perubahan tak-aditif di masa depan bisa merusak data pengguna | `core.js` (`validStore`), `store.v` | Tambah `store.v` bertahap + fungsi `migrate()` + tes sebelum perubahan struktural pertama |
| M5 | Mengganti mode (pelajar/pekerja/berkeluarga) tidak memigrasi kategori/anggaran/tujuan yang sudah ada | Daftar kategori berubah, data lama tetap memakai nama lama | `app.js` (`MODES`, `optNames`) | Dokumentasikan; kategori lama tetap valid karena disimpan sebagai teks |
| M6 | Setoran goal manual (`gc`) tidak membuat transaksi | Angka goal dan saldo akun bisa tak sinkron | `app.js` (`goalDepForm`) | Opsi "dari akun" yang membuat transfer; butuh keputusan akuntansi |
| M7 | Ambang level keuangan (30% cicilan, bulan dana darurat 1–12, saving rate 10/20%) adalah heuristik buatan sendiri | Bisa dianggap saran finansial resmi | `core.js` (`healthLevel`, `EF_MONTHS`) | Tampilkan sebagai pedoman umum (sudah), validasi dengan perencana keuangan sebelum rilis luas |
| M8 | Service worker network-first: gagal jaringan lambat bisa menahan tampilan | UX pada koneksi buruk | `sw.js` | Tambah timeout fallback ke cache |
| M9 | `app.js` satu IIFE 1,7 rb baris | Sulit dirawat, risiko regresi | `app.js` | Jangan refactor besar; bila perlu pecah bertahap per modul dengan seluruh tes hijau |
| M10 | Formulir bayar tagihan tidak punya foto bukti (hanya transaksi biasa) | Bukti bayar tagihan tidak bisa dilampirkan langsung | `app.js` (`payBill`) | Gunakan `attachProof` yang sama |

## Low

| # | Masalah | File | Rekomendasi |
|---|---|---|---|
| L1 | Grafik mode gelap belum pernah di-screenshot/diperiksa; kontras palet `--s1..--s8` varian gelap belum divalidasi ulang dengan skrip | `index.html` | Jalankan `validate_palette.js` mode dark + screenshot |
| L2 | Tidak ada tabel-alternatif/aksesibilitas untuk grafik (hanya legenda + daftar angka) | `app.js` (`donutSVG`, `cumChart`, `nwBars`) | Tambah `<table>` tersembunyi/toggle |
| L3 | Takaran saran olahraga/berat memakai sumber umum, bukan halaman primer WHO | `app.js` (`weightAdvice`) | Verifikasi ulang ke dokumen WHO/Kemenkes dan catat tautan |
| L4 | Perilaku `navigator.share` dengan berkas bervariasi per perangkat/peramban | `app.js` (`viewFile`, backup) | Uji Android & iPhone; fallback unduh sudah ada |
| L5 | Tidak ada tombol "Tanya admin" berisi nomor versi | `app.js` | Opsional (usulan pengguna) |
| L6 | `AGENTS.md`, `docs/SPEC.html`, `docs/adr/`, `THIRD_PARTY_NOTICES.md`, `BACKLOG.md` tidak ada di folder Lite | — | Pemilik memutuskan; buat versi Lite ringkas |

## NEEDS VERIFICATION
- Isi repo `TriNtoro/rumahku-app` di GitHub (apakah v0.5.1 terunggah; apakah ada `docs/`).
- Status Pages: sempat "Queued" lama pada build; sudah dijelaskan ke pemilik, status akhir tidak dicek.
- Nasib monorepo `TriNtoro/rumahku-one` (tanpa workflow).
- Instal & notifikasi di iPhone (pemilik memakai Chrome iOS).

## Tambahan v0.5.2
- **Medium**: pengingat berbasis hari dihitung dari pukul 08.00 dan hanya berbunyi bila aplikasi terbuka dalam jendela 6 jam (30 menit untuk menit/jam). Aplikasi tertutup seharian = terlewat. Mitigasi: ekspor `.ics` (kini memuat acara seharian + 2 alarm; impor ke Google Calendar belum diuji). Berkas: `core.js` (`eventDue`), `app.js` (`tick`).
- **Low**: pengingat tugas (bukan acara) belum punya opsi 3 jam / hari; ulang tahun anggota keluarga selalu diingatkan H-1 & H (belum ada tombol matikan).
- **Low**: perilaku `capture="environment"` bergantung peramban (Android Chrome membuka kamera; iOS dapat menampilkan pilihan) — NEEDS VERIFICATION di perangkat nyata.
- Tes UI baru: `docs/handover/ui-tests/t11.mjs` (20 pemeriksaan lulus). `t6`, `smoke3`, `t10` diperbarui mengikuti perubahan UI (menu kamera/galeri, template KTP, versi).
