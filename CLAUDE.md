# CLAUDE.md

Konteks untuk Claude (atau siapa pun) yang mengerjakan repo ini.

## Apa ini

Website bacaan Al-Qur'an publik: teks Arab, terjemahan Bahasa Indonesia, audio
murottal, dan tafsir Bahasa Indonesia. **Tanpa panel untuk mengubah isi
Al-Qur'an.** Akun pengguna (login Google) dan manajemen pengguna direncanakan nanti.
Rencana jangka panjang ada di `project/quranweb/ROADMAP.md` pada repo workspace
`udienz/claude-project`.

Dibangun dengan Next.js (App Router, TypeScript, Tailwind), menggantikan total
aplikasi PHP lama. Kode PHP lama masih ada di branch `legacy-php` sebagai
arsip/referensi — jangan dikembangkan lagi, jangan di-merge ke `master`.

## Keputusan arsitektur (jangan diulang diskusinya dari nol)

- **Sumber data modular lewat provider** (`src/lib/quran/`, Fase 1 roadmap).
  Skema internal berbasis *edisi*: satu edisi = satu teks Arab, transliterasi,
  terjemahan, atau tafsir (ID stabil `{bahasa-iso3}-{nama}`, mis. `ind-kemenag`).
  UI hanya mengenal skema itu (`types.ts`), tidak pernah format API sumber.
  Provider (`provider.ts`) memetakan satu sumber ke skema; urutan provider di
  konfigurasi (`defaultConfig` di `index.ts`) = prioritas dan fallback. Audio
  punya provider sendiri, terpisah dari teks. Pilihan bawaan (edisi, qari) harus
  ada di katalog, kalau tidak aplikasi gagal sejak awal.
  Provider yang ada: `providers/equran.ts` ([eQuran.id API v2](https://equran.id/apidev/v2),
  endpoint `/surat`, `/surat/{n}`, `/tafsir/{n}`; 6 qari, bawaan `misyari-rasyid-al-afasi`).
  Calon berikutnya: `fawazahmed0/quran-api` (lihat `project/quranweb/ROADMAP.md`
  di repo workspace). Menambah sumber = tulis provider baru + daftarkan di
  `defaultConfig` + catat lisensinya di daftar sumber roadmap, tanpa mengubah komponen.
  **Jangan pakai `api.quran.gading.dev`**: rate limit 10 req/5 menit/IP, dan bentuk
  datanya (`preBismillah` tanpa `number`/`audio`/`tafsir`) membuat UI crash.
  Batasan data eQuran: transliterasi hanya Latin, tidak ada terjemahan Inggris,
  tafsir satu versi. Bismillah selain di Al-Fatihah ditambahkan statis oleh UI.
- **Tidak ada backend/database sendiri.** App ini murni presentasi.
- **Env var `QURAN_API_URL`** (sengaja TANPA prefix `NEXT_PUBLIC_`) — dibaca
  di server saat request, bukan di-inline saat build. Opsional: kosong = pakai
  `https://equran.id/api/v2`. Isi hanya untuk mengarah ke mirror berformat sama.
  `QURAN_AUDIO_URL` (opsional, bawaan `https://cdn.equran.id`) mengatur basis URL
  audio dengan cara yang sama; dipakai nanti kalau audio dihosting sendiri.
- **Halaman `/` dan `/surah/[number]` pakai `export const instant = false`.**
  Ini SENGAJA: tanpa ini, Next.js 16 (Cache Components) akan mencoba
  prerender halaman ini secara statis saat `next build`, yang berarti build
  butuh akses jaringan ke API saat itu juga — bikin `docker build`
  dan CI jadi tergantung API eksternal yang URL-nya saja belum tentu
  diketahui saat build. Dengan `instant = false`, data diambil saat request
  (runtime), jadi build tidak perlu jaringan sama sekali dan `QURAN_API_URL`
  bisa diganti kapan saja via env var / `docker run -e` tanpa rebuild.
  **Jangan hapus `instant = false` ini** kecuali memang sengaja mau balik ke
  static generation (dan siap menyediakan `QURAN_API_URL` yang valid saat
  build berjalan).

## Struktur

```
src/
  app/
    layout.tsx                 # shell: header, tema, font (@fontsource), footer
    globals.css                # token warna (terang/gelap), font Amiri untuk Arab
    page.tsx                   # beranda: hero + grid 114 surah
    surah/[number]/page.tsx    # sidebar daftar surat + pembaca
  components/
    SurahReader.tsx             # hero surat, tab Bacaan/Tafsir, lompat ayat, audio
                                 # (satu <audio>, otomatis lanjut ke ayat berikutnya)
    VerseCard.tsx               # 1 ayat: Arab, transliterasi, terjemahan / tafsir
    SurahSidebar.tsx, SurahGrid.tsx  # daftar + pencarian surat
    PrefsProvider.tsx           # preferensi bacaan (localStorage)
    ThemeToggle.tsx, Logo.tsx
  lib/
    quran/                      # sumber data modular (lihat Keputusan arsitektur)
      types.ts                   # skema berbasis edisi (Edition, SurahMeta, SurahView, ...)
      provider.ts                # antarmuka TextProvider dan AudioProvider
      service.ts                 # katalog, fallback antar provider, penyusun SurahView
      index.ts                   # API publik + defaultConfig (daftar provider, pilihan bawaan)
      labels.ts                  # label tampilan (tempat turun, arti nama)
      providers/equran.ts        # adaptor EQuran.id (teks dan audio)
      *.test.ts                  # tes (vitest), tanpa jaringan
```

## Build, lint, test lokal

```bash
npm install
npm run dev              # dev server
npm run lint
npm test                 # vitest, tanpa jaringan
npm run build             # production build — TIDAK butuh QURAN_API_URL
                           # atau jaringan ke API (lihat instant=false di atas).
                           # Sudah termasuk type-check penuh.
```

Jangan jalankan `tsc --noEmit` sebagai step terpisah SEBELUM `npm run build`:
tipe seperti `LayoutProps` di-generate Next.js sendiri ke `.next/types/` saat
build/dev, jadi `tsc` yang dijalankan lebih dulu akan gagal dengan
"Cannot find name 'LayoutProps'" — ini bukan error kode, cuma salah urutan.

## Docker

```bash
docker build -t quranweb .
docker run -p 3000:3000 quranweb
# atau
docker compose up --build
```

Catatan: image `node:20-alpine` dan base lain ditarik dari Docker Hub — kalau
build dijalankan di lingkungan dengan network allowlist terbatas (sandbox
agent, dll), pull base image bisa gagal walau Dockerfile-nya sendiri valid.
Itu bukan bug di Dockerfile.

## CI

- `.github/workflows/ci.yml` — lint dan `next build` (sudah termasuk type-check) di
  tiap push ke `master` dan tiap PR.
- Tidak ada build Docker terpisah di CI (dihapus 2026-11-17: tidak pernah gagal dalam
  14 run, mengulang `npm run build`, dan `Dockerfile` hanya berubah sekali). `Dockerfile`
  divalidasi saat deploy QA, yang membangun image yang sama dan rollback otomatis.
  Kalau `Dockerfile` diubah, uji `docker build` secara lokal sebelum merge.

- `.github/workflows/deploy-qa.yml` — deploy ke server QA
  (`quranweb-qa.udienz.web.id`) lewat SSH + `scripts/deploy.sh` setelah push
  ke `master`. Nonaktif sampai variable `QA_DEPLOY=true` dan secret `QA_SSH_*`
  diisi (daftarnya ada di komentar workflow).

## Lingkungan

- **QA/demo:** https://quranweb-qa.udienz.web.id (satu VM, container
  `quranweb-qa` di belakang nginx + certbot, DNS lewat Cloudflare). Deploy otomatis
  dari `master` lewat `deploy-qa.yml`.
- **Mirror data (QA dan produksi):** salinan statis eQuran.id API v2 di
  `/srv/quranweb-mirror` (dibuat `scripts/sync-mirror.mjs`, disajikan nginx di
  `/api/v2` pada kedua domain, contoh konfigurasi di
  `scripts/mirror-nginx.conf.example`). `deploy.sh` mengarahkan `QURAN_API_URL`
  ke mirror di domain masing-masing. Mirror disalin SEKALI (17 Nov 2026) dan tidak
  disinkronkan otomatis: teks Al-Qur'an tidak berubah. Kalau perlu memperbarui
  (mis. koreksi terjemahan), jalankan manual
  `node scripts/sync-mirror.mjs --out /srv/quranweb-mirror --force`. Timer systemd
  `quranweb-mirror-sync.timer` sempat dipasang lalu dinonaktifkan. Server tidak
  punya `crontab`. Hanya teks;
  audio tetap dari `cdn.equran.id`. Non-komersial: data tidak dijual, EQuran.id
  dan Kemenag RI dicantumkan sebagai sumber.
- **Produksi:** https://quranweb.udienz.web.id (server sama, container
  `quranweb-prod` di `127.0.0.1:3002`, nginx + certbot, data dari mirror).
  Deploy lewat tag rilis, hanya untuk commit yang sudah ada di `master`:
  `git tag -a v2.0.1 <commit> && git push origin v2.0.1` memicu `deploy-prod.yml`
  (GitHub Environment `production`). Rilis pertama: `v2.0.0` (2026-11-17, penulisan
  ulang total; tag lama `1.0` dan `1.1` milik aplikasi PHP). Pakai nomor di atas 2.0.0
  supaya tidak bentrok dengan tag lama. Rollback: jalankan ulang workflow untuk tag lama.
  Kedua lingkungan memakai `scripts/deploy.sh <qa|prod> <ref>`, yang otomatis
  rollback ke image sebelumnya kalau app baru tidak merespons.

## Aturan kerja

- Jangan tambahkan panel atau fitur untuk mengubah surat, ayat, terjemahan, atau
  tafsir: isi Al-Qur'an hanya berasal dari sumber yang sudah diverifikasi lewat
  skrip sinkronisasi dan PR. Manajemen pengguna (lihat, nonaktifkan, hapus akun)
  baru boleh ditambahkan bersama fitur akun (lihat roadmap).
- Perubahan non-trivial lewat PR, bukan push langsung ke `master`.
- **README dua bahasa:** `README.md` berbahasa Inggris dan `README.id.md` berbahasa
  Indonesia. Setiap perubahan pada salah satunya WAJIB dibuat juga di yang lain, dalam
  commit yang sama (bagian, tabel, dan perintah harus tetap sejajar). Sebelum commit
  yang menyentuh README, cek bahwa kedua file sudah diperbarui. Tautan bahasa di baris
  kedua tiap file dipertahankan.
