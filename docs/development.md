# Development

Technical notes for running, building and deploying QuranWeb. The overview for readers is in the [README](../README.md);
the project's conventions (code layout, i18n, sync, privacy, tests) are in [CLAUDE.md](../CLAUDE.md), and how to
contribute is in [CONTRIBUTING.md](../CONTRIBUTING.md).

QuranWeb is built with Next.js (App Router, TypeScript, Tailwind) and replaces an older PHP version, which is kept in the
`legacy-php` branch.

## Running locally

Node.js 24 or newer is needed (the Docker image and CI use Node 26, the current LTS).

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Run the tests (no network needed) with `npm test`; `npm run test:live` checks the real sources (about 8 minutes).

## Environments and deployment

| Environment | URL | Purpose | How it is deployed | Data source |
|---|---|---|---|---|
| **Production** | https://quranweb.udienz.web.id | public site | automatically when a `v*` release tag is pushed (`deploy-prod.yml`), only for commits already on `master` | own mirrors at `/api/v2` and `/quran-api` on the same domain |
| **QA** | https://quranweb-qa.udienz.web.id | testing before release | by hand from `master` (`deploy-qa.yml`, Run workflow) | own mirrors on its own domain |
| Local | http://localhost:3000 | development | `npm run dev` | EQuran.id and fawazahmed0 directly (default) |

Both run on the same VM: Docker containers (`quranweb-prod` and `quranweb-qa`) behind nginx with Let's Encrypt certificates (certbot), with DNS through Cloudflare. Deployment uses SSH and `scripts/deploy.sh`, which builds the image on the server and rolls back to the previous image if the new app does not respond. First release: `v2.0.0` (2026-11-17).

## Data sources

The app does not depend on any one API's format. Everything is mapped to an **edition-based schema** (one edition = one Arabic text, transliteration, translation or tafsir) through **providers** in `src/lib/quran/`. The providers, the default editions and the default reciter are configured in one place (`defaultConfig` in `src/lib/quran/index.ts`), providers are tried in priority order with fallback, and audio has its own provider. Adding a source means writing a provider and registering it; the UI does not change.

| Source | Provides | Variable (optional) |
|---|---|---|
| [EQuran.id API v2](https://equran.id/apidev/v2) | Arabic text, Latin transliteration, Indonesian translation and tafsir (Kemenag), audio from six reciters | `QURAN_API_URL` (default `https://equran.id/api/v2`), `QURAN_AUDIO_URL` (default `https://cdn.equran.id`) |
| [AlQuran.cloud CDN](https://alquran.cloud/cdn) | audio only: 19 more reciters verse by verse (EveryAyah recordings), and a second address for the reciters EQuran.id also has | `QURAN_ISLAMIC_AUDIO_URL` (default `https://cdn.islamic.network`) |
| [fawazahmed0/quran-api](https://github.com/fawazahmed0/quran-api) | more editions, text only: Arabic Uthmani Hafs, Indonesian (Kemenag, Quraish Shihab, Jalalayn), English (Yusuf Ali, Pickthall) | `QURAN_FAWAZ_URL` (default jsDelivr with a raw GitHub fallback) |

The variables intentionally have no `NEXT_PUBLIC_` prefix: they are read on the server at request time (pages are not prerendered at build), so they can be changed through the platform's environment variables or `docker run -e` without a rebuild. See `.env.example`.

In production both text sources are served from our own static mirrors, so the site does not call third parties for text:

- `/api/v2/...` follows the EQuran.id format.
- `/quran-api/...` follows the fawazahmed0 format (`editions.json`, `info.json`, `editions/{edition}/{surah}.json`).

They are plain JSON files kept in a separate data repository. Recitation audio is not mirrored: it comes from `cdn.equran.id` and `cdn.islamic.network`. Every edition's source is credited in the UI and in its entry in `editions.json`.

A base URL can also be a **directory with a local copy of that data** (for example `/data/api/v2`), and then the app makes no HTTP request at all for text: QA and production run this way, with the mirror directory mounted read-only into the container. To change which providers are active, their order, which editions are enabled and the defaults without touching code, point `QURAN_CONFIG` to a JSON file (see `config/sources.example.json`, which reads the local copy first and falls back to EQuran.id). The three variables above only fill in a `baseUrl` that the file leaves out.

## Docker

There is a `Dockerfile` (multi-stage, using the Next.js [`standalone` output](https://nextjs.org/docs/app/api-reference/config/next-config-js/output), final image based on `node:26-alpine`), which is also used for server deployment.

```bash
# build the image
docker build -t quranweb .

# run it (the QURAN_* variables are optional)
docker run -p 3000:3000 quranweb
```

Or use `docker-compose.yml` (edit the variables in it first):

```bash
docker compose up --build
```

Building the image needs no network access to the data sources at all: pages are rendered per request (`export const instant = false`) instead of being generated statically during `next build` or `docker build`.

## CI (GitHub Actions)

Workflows in `.github/workflows/`:

- **`ci.yml`**: runs on every push to `master` and every PR: `npm run lint`, `npm test` and `npm run build` (which already includes the type check).
- **`deploy-qa.yml`** and **`deploy-prod.yml`**: deploy to the server over SSH (see `CLAUDE.md`). The `Dockerfile` is validated at deploy time: the image is built on the server and rolled back to the previous version if the new app does not respond, so there is no separate Docker build in CI.

## Backups

How the account database is backed up and restored: [backup.md](backup.md).
