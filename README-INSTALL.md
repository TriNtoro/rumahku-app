# RUMAHKU-APP — AI Instructions & Skills

## Isi paket
- `AGENTS.md`: instruksi proyek untuk agent yang mendukung `AGENTS.md`, termasuk Codex.
- `CLAUDE.md`: pedoman perilaku umum untuk [CC]; Codex memakai `AGENTS.md`.
- `.agents/skills/`: seluruh skill Codex, termasuk skill proyek dan Superpowers.

## Struktur skill
Setiap skill adalah folder berisi `SKILL.md` dengan frontmatter `name` dan `description`.

- 11 skill proyek berada di `.agents/skills/<nama>/SKILL.md`.
- 15 skill Superpowers berada di `.agents/skills/superpowers/<nama>/SKILL.md`.
- `.agents/skills/ponytail-root-duplicate.md` adalah arsip duplikat lama `ponytail`; versi kanonik ada di `.agents/skills/ponytail/SKILL.md`.
- `.agents/skills/build-project/` sudah dihapus karena kosong dan bukan skill.
- `.agents/skills/CLAUDE.md` adalah duplikat `CLAUDE.md` di root.

## Daftar skill proyek (11)

| Skill | Fungsi |
|---|---|
| `backend-api` | Backend service, route handler, validasi, otorisasi, kontrak API, error response. Relevan hanya jika backend ditambahkan. |
| `code-review` | Review diff/PR: correctness, regresi, maintainability, konvensi proyek. |
| `database-design` | Skema relasional, migrasi, index, constraint, transaksi, RLS, tenant isolation. Relevan hanya jika database ditambahkan. |
| `debugging` | Reproduksi bug, root cause, perbaikan minimal yang terverifikasi. |
| `documentation` | Dokumentasi proyek, ADR, referensi API, setup guide, runbook. |
| `frontend-design` | UI aksesibel, responsif, konsisten, dan state interaksi yang jelas. |
| `performance` | Investigasi performa berbasis bukti, bukan optimasi prematur. |
| `ponytail` | Mode senior dev: perubahan terkecil yang menyelesaikan tugas; level `lite`, `full`, `ultra`. |
| `release-readiness` | Kesiapan rilis: tes, keamanan, konfigurasi, observability, rollback. |
| `security-audit` | Audit auth, otorisasi, data exposure, secret, storage lokal/Drive, deployment. |
| `testing-qa` | Tes fokus, regresi, pemeriksaan sintaks, dan validasi yang benar-benar tersedia. |

## Daftar skill Superpowers (15)

| Skill | Fungsi |
|---|---|
| `brainstorming` | Gali kebutuhan, design doc, persetujuan sebelum implementasi. |
| `diagnosing-superpowers` | Diagnosis sesi Superpowers yang bermasalah dan pembuatan bug report. |
| `dispatching-parallel-agents` | Fan-out untuk 2+ task independen; membutuhkan subagent. |
| `executing-plans` | Eksekusi rencana secara inline, task per task, dengan TDD dan ledger. |
| `finishing-a-development-branch` | Verifikasi tes, pilih merge/PR/keep, lalu bersihkan workspace. |
| `receiving-code-review` | Memproses feedback review secara rigor, bukan asal setuju. |
| `requesting-code-review` | Meminta review ke subagent reviewer; membutuhkan subagent. |
| `subagent-driven-development` | Implementer dan reviewer subagent per task; membutuhkan subagent. |
| `systematic-debugging` | Alur debugging sistematis sebelum mengusulkan perbaikan. |
| `test-driven-development` | RED-GREEN-REFACTOR sebelum menulis kode implementasi. |
| `using-git-worktrees` | Isolasi workspace dengan git worktree. |
| `using-superpowers` | Aturan penemuan dan pemakaian skill sebelum merespons. |
| `verification-before-completion` | Jalankan verifikasi sebelum mengklaim selesai atau lulus. |
| `writing-plans` | Menyusun rencana implementasi sebelum menyentuh kode. |
| `writing-skills` | Membuat, mengubah, dan menguji skill. |

## Cara Codex memakai skill
1. Codex memindai folder skill untuk `SKILL.md` yang memiliki frontmatter `name` dan `description`.
2. Metadata tersebut dipakai untuk memilih skill yang relevan; isi `SKILL.md` baru dimuat saat skill dipakai.
3. File pendukung seperti `references/`, `scripts/`, dan prompt template dibaca hanya jika diperlukan.
4. `AGENTS.md` dan permintaan pengguna mengalahkan instruksi skill.
5. Skill yang lebih spesifik dipilih sebelum skill umum; jangan memuat semua skill sekaligus.

## Pemakaian di proyek ini
- Proyek ini PWA statis: tanpa server, database server, `package.json`, lint, typecheck, atau build.
- Pemeriksaan yang tersedia: `node --test test/core.test.mjs` dan `node --check app.js core.js sw.js`.
- `backend-api`, `database-design`, `security-audit`, `performance`, `release-readiness`, dan `testing-qa` tetap disimpan, tetapi bagian yang menyebut Next.js, PostgreSQL, RLS, tenant, migrasi, package scripts, lint, typecheck, atau build tidak berlaku sampai stack tersebut benar-benar ditambahkan.
- `requesting-code-review`, `subagent-driven-development`, dan `dispatching-parallel-agents` membutuhkan tool subagent. Jika tidak tersedia, gunakan `executing-plans` atau kerjakan inline.
- `brainstorming`, `writing-plans`, dan `executing-plans` dipakai untuk pekerjaan multi-langkah. Untuk perubahan trivial, gunakan judgment sesuai `CLAUDE.md`.
- Jangan commit, push, deploy, atau menjalankan migrasi tanpa izin eksplisit.

## Instalasi
Ekstrak seluruh isi ZIP ke root repository `13-RUMAHKU-APP`, sehingga `AGENTS.md`, `CLAUDE.md`, dan folder `.agents` berada sejajar dengan `app.js`, `core.js`, dan `index.html`.

Sebelum mengekstrak, pastikan file tujuan belum ada. Jangan menimpa instruksi atau skill yang dibuat kemudian.

## Catatan
Folder `superpowers/` dipertahankan agar seluruh skill tetap tersedia. Sumber dan versi isinya tidak diverifikasi di repo ini; periksa sumbernya sebelum menganggapnya sebagai distribusi resmi.
