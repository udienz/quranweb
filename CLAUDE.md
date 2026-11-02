# CLAUDE.md

Konteks untuk Claude (atau siapa pun) yang mengerjakan repo ini.

## Apa ini

Website bacaan Al-Qur'an publik: teks Arab, terjemahan Bahasa Indonesia, audio
murottal, dan tafsir Bahasa Indonesia. **Tanpa panel admin.**

Dibangun dengan Next.js (App Router, TypeScript, Tailwind), menggantikan total
aplikasi PHP lama. Kode PHP lama masih ada di branch `legacy-php` sebagai
arsip/referensi — jangan dikembangkan lagi, jangan di-merge ke `master`.

## Keputusan arsitektur (jangan diulang diskusinya dari nol)

- **Satu sumber data saja**: fork dari [`gadingnst/quran-api`](https://github.com/gadingnst/quran-api),
  self-hosted. Sudah dicek: satu API ini berisi teks Arab, transliterasi,
  terjemahan EN+ID, link audio (ke CDN eksternal `cdn.alquran.cloud` /
  `cdn.islamic.network`, jadi streaming audio tidak kena rate limit API), dan
  tafsir ID (singkat+panjang) — semua per ayat dalam satu response. API lain
  (`fawazahmed0/quran-api`) sempat dipertimbangkan tapi **tidak diperlukan**.
- **Tidak ada backend/database sendiri.** App ini murni presentasi; semua
  logic baca ada di instance `quran-api` eksternal (self-hosted oleh user).
- **Env var `QURAN_API_URL`** (sengaja TANPA prefix `NEXT_PUBLIC_`) — dibaca
  di server saat request, bukan di-inline saat build. Kosong = fallback ke
  live instance resmi `https://api.quran.gading.dev` (rate limit 10 req/5
  menit/IP — hanya untuk dev/testing, bukan production).
- **Halaman `/` dan `/surah/[number]` pakai `export const instant = false`.**
  Ini SENGAJA: tanpa ini, Next.js 16 (Cache Components) akan mencoba
  prerender halaman ini secara statis saat `next build`, yang berarti build
  butuh akses jaringan ke `quran-api` saat itu juga — bikin `docker build`
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
    layout.tsx                 # shell halaman
    page.tsx                   # daftar 114 surah
    surah/[number]/page.tsx    # detail surah + daftar ayat
  components/
    VerseCard.tsx               # 1 ayat: Arab, transliterasi, terjemahan,
                                 # audio player, toggle tafsir
  lib/
    quran.ts                    # client API + tipe data (getAllSurah, getSurah)
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
docker run -p 3000:3000 -e QURAN_API_URL=https://instance-anda.vercel.app quranweb
# atau
docker compose up --build
```

Catatan: image `node:20-alpine` dan base lain ditarik dari Docker Hub — kalau
build dijalankan di lingkungan dengan network allowlist terbatas (sandbox
agent, dll), pull base image bisa gagal walau Dockerfile-nya sendiri valid.
Itu bukan bug di Dockerfile.

## CI

- `.github/workflows/ci.yml` — lint, typecheck, `next build` di tiap push/PR.
- `.github/workflows/docker.yml` — build image Docker di CI (tidak push ke
  registry mana pun secara default) untuk menjaga `Dockerfile` tetap valid.

## Yang masih perlu dilakukan (di luar repo ini)

1. Fork `gadingnst/quran-api`, deploy sendiri (Vercel/Docker), supaya tidak
   kena rate limit live instance resmi.
2. Set `QURAN_API_URL` di env var hosting production (Vercel, Docker, dll)
   mengarah ke instance tersebut.

## Aturan kerja

- Jangan tambahkan panel admin atau fitur manajemen konten — scope-nya
  sengaja hanya website baca.
- Perubahan non-trivial lewat PR, bukan push langsung ke `master`.
