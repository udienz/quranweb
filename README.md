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
   NEXT_PUBLIC_QURAN_API_URL=https://nama-instance-anda.vercel.app
   ```
   (lihat `.env.example`)

Tanpa env var ini, app otomatis fallback ke live instance resmi (dengan rate limit di atas) — cukup untuk development, tidak disarankan untuk production.

Catatan: link audio per-ayat (`audio.primary`/`audio.secondary`) mengarah ke CDN eksternal (`cdn.alquran.cloud` / `cdn.islamic.network`), bukan ke instance API itu sendiri — jadi streaming audio tidak ikut terbatas rate limit API.

## Deploy

Push ke `main`/`master` dan deploy lewat [Vercel](https://vercel.com/new), atau platform hosting Next.js lain.
