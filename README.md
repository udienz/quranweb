# QuranWeb

Website bacaan Al-Qur'an: teks Arab, terjemahan Bahasa Indonesia, audio murottal (Syekh Mishary Rashid Alafasy), dan tafsir Bahasa Indonesia. Dibangun dengan Next.js, menggantikan versi PHP lama (lihat branch `legacy-php` untuk kode sebelumnya).

Tidak ada panel admin — ini murni website baca untuk publik.

## Menjalankan secara lokal

```bash
npm install
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000).

## Sumber Data & Self-hosting

Semua konten (teks Arab, transliterasi, terjemahan EN/ID, link audio, tafsir ID) diambil dari satu API: fork dari [`gadingnst/quran-api`](https://github.com/gadingnst/quran-api).

Live instance resminya (`https://api.quran.gading.dev`) dibatasi **10 request/5 menit per IP**, jadi untuk pakai beneran disarankan deploy instance sendiri:

1. Fork [`gadingnst/quran-api`](https://github.com/gadingnst/quran-api) ke akun GitHub Anda.
2. Deploy fork tersebut ke Vercel (tombol "Deploy with Vercel" ada di README repo itu), atau jalankan sendiri dengan `npm start` di server/Docker manapun.
3. Set environment variable di project Next.js ini:
   ```
   QURAN_API_URL=https://nama-instance-anda.vercel.app
   ```
   (lihat `.env.example`). Variabel ini sengaja tanpa prefix `NEXT_PUBLIC_` — dibaca di server saat request (halaman tidak di-prerender statis saat build), jadi bisa diganti kapan saja lewat env var platform / `docker run -e` tanpa perlu rebuild.

Tanpa env var ini, app otomatis fallback ke live instance resmi (dengan rate limit di atas) — cukup untuk development, tidak disarankan untuk production.

Catatan: link audio per-ayat (`audio.primary`/`audio.secondary`) mengarah ke CDN eksternal (`cdn.alquran.cloud` / `cdn.islamic.network`), bukan ke instance API itu sendiri — jadi streaming audio tidak ikut terbatas rate limit API.

## Deploy

Push ke `main`/`master` dan deploy lewat [Vercel](https://vercel.com/new), atau platform hosting Next.js lain.

## Docker

Ada `Dockerfile` (multi-stage, pakai [output `standalone`](https://nextjs.org/docs/app/api-reference/config/next-config-js/output) Next.js, image akhir berbasis `node:20-alpine`) untuk testing build secara lokal tanpa Vercel.

```bash
# build image
docker build -t quranweb .

# jalankan, arahkan ke instance quran-api self-hosted Anda
docker run -p 3000:3000 -e QURAN_API_URL=https://nama-instance-anda.vercel.app quranweb
```

Atau pakai `docker-compose.yml` (edit `QURAN_API_URL` di file-nya dulu):

```bash
docker compose up --build
```

Build image tidak butuh akses jaringan ke API Qur'an sama sekali — halaman di-render per-request (`export const instant = false`), bukan di-generate statis saat `next build`/`docker build`.

## CI (GitHub Actions)

Dua workflow di `.github/workflows/`:

- **`ci.yml`** — jalan di tiap push/PR: `npm run lint`, typecheck (`tsc --noEmit`), dan `npm run build`.
- **`docker.yml`** — build image dari `Dockerfile` di CI (tidak push ke registry mana pun secara default) untuk memastikan Dockerfile selalu valid.
