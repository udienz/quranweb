# CLAUDE.md

Konteks untuk Claude (atau siapa pun) yang mengerjakan repo ini.

## Apa ini

Website bacaan Al-Qur'an publik: teks Arab, terjemahan Bahasa Indonesia, audio
murottal, dan tafsir Bahasa Indonesia. **Tanpa panel admin.**

Dibangun dengan Next.js (App Router, TypeScript, Tailwind), menggantikan total
aplikasi PHP lama. Kode PHP lama masih ada di branch `legacy-php` sebagai
arsip/referensi — jangan dikembangkan lagi, jangan di-merge ke `master`.

## Keputusan arsitektur (jangan diulang diskusinya dari nol)

- **Satu sumber data saja**: [eQuran.id API v2](https://equran.id/apidev/v2)
  (`https://equran.id/api/v2`, endpoint `/surat`, `/surat/{n}`, `/tafsir/{n}`).
  Berisi teks Arab, transliterasi, terjemahan ID, audio per ayat (6 qari; app
  memakai qari `05` Misyari Rasyid Al-Afasi), dan tafsir ID. **Jangan pakai
  `api.quran.gading.dev`**: rate limit 10 req/5 menit/IP, dan bentuk datanya
  (`preBismillah` tanpa `number`/`audio`/`tafsir`) membuat `VerseCard` crash.
  `src/lib/quran.ts` memetakan respons eQuran ke tipe internal, jadi komponen
  UI tidak tahu format API. Transliterasi hanya Latin (field `en`), tidak ada
  terjemahan EN, tafsir hanya satu versi (tanpa "long"), dan Bismillah tidak
  ditampilkan terpisah (`preBismillah` selalu `null`).
- **Tidak ada backend/database sendiri.** App ini murni presentasi.
- **Env var `QURAN_API_URL`** (sengaja TANPA prefix `NEXT_PUBLIC_`) — dibaca
  di server saat request, bukan di-inline saat build. Opsional: kosong = pakai
  `https://equran.id/api/v2`. Isi hanya untuk mengarah ke mirror berformat sama.
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
    quran.ts                    # client API eQuran + tipe data (getAllSurah, getSurah)
```

## Build, lint, test lokal

```bash
npm install
npm run dev              # dev server
npm run lint
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

- **QA/demo:** https://quranweb-qa.udienz.web.id (server 103.155.224.33, container
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
  `git tag v1.0.0 && git push origin v1.0.0` memicu `deploy-prod.yml`
  (GitHub Environment `production`). Rollback: jalankan ulang workflow untuk tag lama.
  Kedua lingkungan memakai `scripts/deploy.sh <qa|prod> <ref>`, yang otomatis
  rollback ke image sebelumnya kalau app baru tidak merespons.

## Aturan kerja

- Jangan tambahkan panel admin atau fitur manajemen konten — scope-nya
  sengaja hanya website baca.
- Perubahan non-trivial lewat PR, bukan push langsung ke `master`.
