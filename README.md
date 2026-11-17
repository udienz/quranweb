# QuranWeb

**English** · [Bahasa Indonesia](README.id.md)

A website for reading the Qur'an: Arabic text, Indonesian translation, recitation audio (Sheikh Mishary Rashid Alafasy), and Indonesian tafsir. Built with Next.js, replacing the old PHP version (see the `legacy-php` branch for the previous code).

There is no panel for editing the Qur'an content: this is a read-only website for the public. User accounts and user management are planned for later.

## Environments and URLs

| Environment | URL | Purpose | How it is deployed | Data source |
|---|---|---|---|---|
| **Production** | https://quranweb.udienz.web.id | public site | automatically when a `v*` release tag is pushed (`deploy-prod.yml`), only for commits already on `master` | mirror at `https://quranweb.udienz.web.id/api/v2` |
| **QA** | https://quranweb-qa.udienz.web.id | testing before release | automatically on every push to `master` (`deploy-qa.yml`) | mirror at `https://quranweb-qa.udienz.web.id/api/v2` |
| Local | http://localhost:3000 | development | `npm run dev` | EQuran.id directly (default) |

Both run on the same VM: Docker containers (`quranweb-prod` and `quranweb-qa`) behind nginx with Let's Encrypt certificates (certbot), with DNS through Cloudflare. Deployment uses SSH and `scripts/deploy.sh`, which builds the image on the server and rolls back to the previous image if the new app does not respond.

Text data is served from our own static mirror under `/api/v2` on each domain instead of calling EQuran.id on every request. Recitation audio still comes from `cdn.equran.id`. First release: `v2.0.0` (2026-11-17).

## Running locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Run the tests (no network needed) with `npm test`; `npm run test:live` checks the real sources (about 8 minutes).

## Data source

All content (Arabic text, transliteration, Indonesian translation, recitation audio, Indonesian tafsir) comes from the [eQuran.id API v2](https://equran.id/apidev/v2) (`https://equran.id/api/v2`). No API key is needed.

To use another instance with the same format (for example your own mirror), set the environment variable:
```
QURAN_API_URL=https://your-host/api/v2
```
(see `.env.example`). The variable intentionally has no `NEXT_PUBLIC_` prefix: it is read on the server at request time (pages are not prerendered statically at build), so it can be changed at any time through the platform's environment variables or `docker run -e` without a rebuild. If it is empty, `https://equran.id/api/v2` is used.

Internally the app does not depend on that API's format. Everything is mapped to an **edition-based schema** (one edition = one Arabic text, transliteration, translation or tafsir) through **providers** in `src/lib/quran/`. The list of providers and the default editions and reciter are configured in one place (`defaultConfig` in `src/lib/quran/index.ts`), providers are tried in priority order with fallback, and audio has its own provider. Adding a source means writing a provider and registering it; the UI does not change. The audio base URL can be changed with `QURAN_AUDIO_URL` (default `https://cdn.equran.id`). A second provider adds more editions from [fawazahmed0/quran-api](https://github.com/fawazahmed0/quran-api) (text only: another Arabic text, more Indonesian and English editions); its base URL is `QURAN_FAWAZ_URL` (default jsDelivr with a raw GitHub fallback; point it to your own mirror in production).

Note: the per-verse audio links (`audio` on each verse, with qari `05` Mishary Rasyid Al-Afasi as the primary one) point to the external CDN `cdn.equran.id`, not to the API itself, so audio still depends on a third party.

## Deployment

Deployment targets our own VM through GitHub Actions and SSH, not Vercel: see the [Environments and URLs](#environments-and-urls) table above and the CI section below.

## Docker

There is a `Dockerfile` (multi-stage, using the Next.js [`standalone` output](https://nextjs.org/docs/app/api-reference/config/next-config-js/output), final image based on `node:20-alpine`), which is also used for server deployment.

```bash
# build the image
docker build -t quranweb .

# run it (QURAN_API_URL is optional, defaults to eQuran.id)
docker run -p 3000:3000 quranweb
```

Or use `docker-compose.yml` (edit `QURAN_API_URL` in it first):

```bash
docker compose up --build
```

Building the image needs no network access to the Qur'an API at all: pages are rendered per request (`export const instant = false`) instead of being generated statically during `next build` or `docker build`.

## CI (GitHub Actions)

Workflows in `.github/workflows/`:

- **`ci.yml`**: runs on every push to `master` and every PR: `npm run lint`, `npm test` and `npm run build` (which already includes the type check).
- **`deploy-qa.yml`** and **`deploy-prod.yml`**: deploy to the server over SSH (see `CLAUDE.md`). The `Dockerfile` is validated at deploy time: the image is built on the server and rolled back to the previous version if the new app does not respond, so there is no separate Docker build in CI.

## Documentation language

This README is in English and [README.id.md](README.id.md) is the Indonesian version. Keep both in sync: any change to one must be made in the other in the same commit.
