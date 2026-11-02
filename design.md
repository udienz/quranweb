# QuranWeb — Rebuild sebagai Website Bacaan (Next.js)

> Riwayat: dokumen ini awalnya berisi rencana migrasi PHP legacy ke PHP 8.4.
> Setelah diskusi, arahnya berubah: kebutuhan sebenarnya hanya website bacaan
> publik (teks + audio + tafsir), tanpa panel admin. Daripada migrasi 137 file
> PHP era 2000-an (dengan masalah `mysql_*` yang sudah dihapus, SQL injection,
> dll), lebih efisien membangun ulang dari nol dengan stack modern dan
> sumber data API yang sudah jadi. Kode PHP lama diamankan di branch
> `legacy-php` untuk referensi/arsip.

## Keputusan Arsitektur

- **Frontend**: Next.js (App Router, TypeScript, Tailwind) — dipilih user.
- **Sumber data**: satu API saja — fork dari [`gadingnst/quran-api`](https://github.com/gadingnst/quran-api), **self-hosted**.
  - Awalnya dipertimbangkan gabungan `fawazahmed0/quran-api` (teks/terjemahan, tanpa rate limit, tanpa audio/tafsir) + `gadingnst/quran-api` (audio+tafsir Indonesia, rate-limited kalau pakai live instance).
  - Setelah audit struktur data `gadingnst/quran-api` (`data/quran.json`), ternyata **satu API ini sudah berisi semuanya**: teks Arab, transliterasi, terjemahan EN+ID, link audio murottal (Mishary Alafasy), dan tafsir ID (versi singkat & panjang) — per ayat, dalam satu response. Jadi `fawazahmed0` tidak diperlukan sama sekali. Ini menyederhanakan arsitektur jadi satu dependency data saja.
  - Audio (`audio.primary` / `audio.secondary`) mengarah ke CDN eksternal (`cdn.alquran.cloud`, `cdn.islamic.network`) — bukan di-serve dari instance API itu sendiri, jadi streaming audio tidak kena rate limit API.
- **Self-hosting**: live instance resmi (`api.quran.gading.dev`) dibatasi 10 req/5menit/IP — cukup untuk dev, tidak untuk production. User perlu fork repo tersebut dan deploy sendiri (tombol Vercel satu klik, atau Docker/Node biasa) lalu set `NEXT_PUBLIC_QURAN_API_URL` di project ini.
- **Tidak ada backend/database sendiri** yang perlu dibangun — semua logic baca ada di API eksternal (self-hosted), Next.js app ini murni presentasi.
- **Tidak ada panel admin** — sesuai kebutuhan user (hanya tampilan baca).

## Struktur yang Dibangun

```
src/
  app/
    layout.tsx           # shell halaman, header/footer
    page.tsx              # daftar 114 surah
    surah/[number]/page.tsx  # detail surah: info + daftar ayat
  components/
    VerseCard.tsx         # 1 ayat: teks Arab, transliterasi, terjemahan,
                           # audio player, toggle tafsir singkat/panjang
  lib/
    quran.ts              # client API + tipe data, cache via "use cache"/cacheLife
```

- Next.js 16 pakai model caching baru (`cacheComponents` + directive `"use cache"` + `cacheLife`), menggantikan pola lama `export const revalidate`. Data surah/ayat di-cache ~1 hari, sesuai header cache API aslinya.
- Audio per-ayat dirender dengan `<audio controls>` native, fallback ke `secondary` URL kalau `primary` gagal.
- Tafsir disembunyikan di belakang tombol toggle (singkat → bisa expand ke versi panjang) supaya halaman tidak terlalu padat secara default.

## Yang Masih Perlu Dilakukan User

1. **Fork & deploy `gadingnst/quran-api`** ke akun sendiri (instruksi lengkap di `README.md` repo ini, bagian "Sumber Data & Self-hosting").
2. **Set `NEXT_PUBLIC_QURAN_API_URL`** di environment variable Vercel (atau hosting lain) project Next.js ini, mengarah ke instance yang baru di-deploy.
3. Deploy project Next.js ini sendiri (Vercel direkomendasikan, satu ekosistem dengan API-nya).

## Catatan Verifikasi

Build (`next build`) tidak bisa diuji penuh end-to-end di sandbox pengembangan ini karena domain `api.quran.gading.dev` tidak bisa diakses dari jaringan sandbox (bukan masalah kode). TypeScript (`tsc --noEmit`) dan ESLint sudah lolos bersih. Build sesungguhnya akan berjalan normal di Vercel karena akses internetnya tidak dibatasi seperti sandbox ini — perlu diverifikasi ulang setelah deploy pertama.
