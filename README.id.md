# QuranWeb

[English](README.md) · **Bahasa Indonesia**

Website bacaan Al-Qur'an: teks Arab, terjemahan Bahasa Indonesia, audio murottal (Syekh Mishary Rashid Alafasy), dan tafsir Bahasa Indonesia. Dibangun dengan Next.js, menggantikan versi PHP lama (lihat branch `legacy-php` untuk kode sebelumnya).

Tidak ada panel untuk mengubah isi Al-Qur'an — ini website baca untuk publik. Akun pengguna dan manajemen pengguna direncanakan nanti.

## Lingkungan dan URL

| Lingkungan | URL | Untuk apa | Cara deploy | Sumber data |
|---|---|---|---|---|
| **Produksi** | https://quranweb.udienz.web.id | situs publik | otomatis saat tag rilis `v*` di-push (`deploy-prod.yml`), hanya untuk commit yang sudah ada di `master` | mirror di `https://quranweb.udienz.web.id/api/v2` |
| **QA** | https://quranweb-qa.udienz.web.id | uji sebelum rilis | otomatis di setiap push ke `master` (`deploy-qa.yml`) | mirror di `https://quranweb-qa.udienz.web.id/api/v2` |
| Lokal | http://localhost:3000 | pengembangan | `npm run dev` | EQuran.id langsung (default) |

Keduanya berjalan di satu VM yang sama: container Docker (`quranweb-prod` dan `quranweb-qa`) di belakang nginx dengan sertifikat Let's Encrypt (certbot), dan DNS lewat Cloudflare. Deploy memakai SSH dan `scripts/deploy.sh`, yang membangun image di server dan kembali ke image sebelumnya kalau aplikasi baru tidak merespons.

Data teks disajikan dari mirror statis milik sendiri di path `/api/v2` pada tiap domain, bukan memanggil EQuran.id saat ada permintaan. Audio murottal masih dari `cdn.equran.id`. Rilis pertama: `v2.0.0` (2026-11-17).

## Menjalankan secara lokal

```bash
npm install
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000).

## Sumber Data

Semua konten (teks Arab, transliterasi, terjemahan ID, audio murottal, tafsir ID) diambil dari [eQuran.id API v2](https://equran.id/apidev/v2) (`https://equran.id/api/v2`). Tidak perlu API key.

Untuk memakai instance lain yang berformat sama (mis. mirror sendiri), set environment variable:
```
QURAN_API_URL=https://host-anda/api/v2
```
(lihat `.env.example`). Variabel ini sengaja tanpa prefix `NEXT_PUBLIC_` — dibaca di server saat request (halaman tidak di-prerender statis saat build), jadi bisa diganti kapan saja lewat env var platform / `docker run -e` tanpa perlu rebuild. Kalau kosong, dipakai `https://equran.id/api/v2`.

Catatan: link audio per ayat (`audio` di tiap ayat, qari `05` Misyari Rasyid Al-Afasi sebagai utama) mengarah ke CDN eksternal `cdn.equran.id`, bukan ke API itu sendiri, jadi audio masih bergantung pada pihak ketiga.

## Deploy

Deploy dilakukan ke VM sendiri lewat GitHub Actions dan SSH, bukan ke Vercel: lihat tabel [Lingkungan dan URL](#lingkungan-dan-url) di atas dan bagian CI di bawah.

## Docker

Ada `Dockerfile` (multi-stage, pakai [output `standalone`](https://nextjs.org/docs/app/api-reference/config/next-config-js/output) Next.js, image akhir berbasis `node:20-alpine`) yang juga dipakai untuk deploy ke server.

```bash
# build image
docker build -t quranweb .

# jalankan (QURAN_API_URL opsional, default eQuran.id)
docker run -p 3000:3000 quranweb
```

Atau pakai `docker-compose.yml` (edit `QURAN_API_URL` di file-nya dulu):

```bash
docker compose up --build
```

Build image tidak butuh akses jaringan ke API Qur'an sama sekali — halaman di-render per-request (`export const instant = false`), bukan di-generate statis saat `next build`/`docker build`.

## CI (GitHub Actions)

Workflow di `.github/workflows/`:

- **`ci.yml`** — jalan di tiap push ke `master` dan tiap PR: `npm run lint` dan `npm run build` (sudah termasuk type-check).
- **`deploy-qa.yml`** dan **`deploy-prod.yml`** — deploy ke server lewat SSH (lihat `CLAUDE.md`). `Dockerfile` divalidasi saat deploy: image dibangun di server dan dikembalikan ke versi sebelumnya kalau app baru tidak merespons, jadi tidak ada build Docker terpisah di CI.

## Bahasa dokumentasi

[README.md](README.md) berbahasa Inggris dan README ini versi Bahasa Indonesia-nya. Jaga keduanya tetap sama: setiap perubahan di salah satunya harus dilakukan juga di yang lain dalam commit yang sama.
