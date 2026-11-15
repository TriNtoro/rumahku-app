# Desain kripto — Kunci dokumen penting (v0.5.5)

Status: diimplementasikan di `vault.js`, diuji `test/vault.test.mjs` + `ui-tests/t14`. **Belum ditinjau ahli kripto independen** — lihat "Batas".

## Tujuan
Nomor dokumen, lokasi simpan, catatan, nomor identitas anggota, dan foto scan tidak terbaca tanpa password, walau localStorage/IndexedDB/backup JSON/Drive dibaca pihak lain.

## Primitif (hanya WebCrypto bawaan browser, tanpa pustaka kripto buatan sendiri)
- Turunan kunci: PBKDF2-SHA256, 600.000 iterasi, salt acak 16 byte per pembungkus → KEK (AES-GCM 256).
- DEK: 256-bit acak (`crypto.subtle.generateKey`), non-extractable di memori.
- DEK dibungkus dua kali: oleh KEK-password dan KEK-kode-pemulihan (25 karakter Crockford base32 ≈ 125 bit acak).
- Data: AES-256-GCM, IV 12 byte acak per enkripsi, AAD berbeda per konteks (string/berkas).
- Format: string `rkv1.<iv>.<ciphertext>`; berkas `"RKV1" + iv + ciphertext`. Prefix = versi, memungkinkan migrasi.

## Alur
- Setup: buat DEK → bungkus dengan password & kode → simpan meta (`store.rec.vault`: salt, iterasi, dua wrapped-DEK) → enkripsi data yang ada.
- Ganti password: hanya membungkus ulang DEK (data tidak disentuh).
- Lupa password: kode pemulihan membuka DEK → set password baru.
- Kode pemulihan baru: DEK dibungkus ulang dengan kode baru; kode lama tak berlaku.
- Matikan kunci: dekripsi semua → simpan polos → hapus meta (butuh kunci terbuka).

## Ancaman & mitigasi
| Ancaman | Mitigasi |
|---|---|
| Pencuri membaca penyimpanan/backup/Drive | Hanya ciphertext + meta tanpa rahasia |
| Brute-force password offline | PBKDF2 600k + saran kalimat panjang; kekuatan minimum divalidasi |
| Brute-force di UI | Jeda eksponensial setelah 5 salah |
| Ubah ciphertext | GCM tag gagal → ditolak (diuji) |
| Pegang HP saat terbuka | Auto-kunci 2 menit setelah app ditinggalkan; tombol Kunci |

## Batas (jujur)
- Judul dokumen & tanggal berlaku tidak dienkripsi (agar pengingat jalan); disamarkan di Beranda/kalender saat kunci aktif.
- Plaintext ada di memori selama terbuka; tidak ada perlindungan terhadap malware/ekstensi berbahaya atau perangkat ter-root.
- Password + kode hilang = data tak dapat dipulihkan (by design).
- Salinan ke papan klip tidak dihapus otomatis.
- Foto hanya di perangkat (tidak ikut Drive/backup JSON).
- Perlu tinjauan kripto independen sebelum dipakai untuk data berisiko tinggi.
