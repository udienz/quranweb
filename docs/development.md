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

### Browser tests

`e2e/*.e2e.ts` drive Chromium against the production build with a small copy of the data (`e2e/fixtures`, made by
`node scripts/e2e-fixtures.mjs /path/to/mirror`; run it again when a test needs another surah). Every `.mp3` is answered
with a short silent WAV, so nothing is downloaded.

```bash
npm run build
npx playwright install chromium   # once
npm run test:e2e                  # starts `next start` on port 3100 with the fixtures, then runs the tests
```

Without a local browser (for example on the server), use the Playwright image of the version in `package.json` and a
server started separately (the config reuses one that already answers on port 3100):

```bash
docker run -d --name qw-e2e --network host -v "$PWD":/app -w /app \
  -e QURAN_API_URL=/app/e2e/fixtures/api/v2 -e QURAN_FAWAZ_URL=/app/e2e/fixtures/quran-api \
  -e QURAN_QURANENC_URL=/app/e2e/fixtures/quranenc node:26-alpine npx next start -p 3100 -H 127.0.0.1
docker run --rm --network host -v "$PWD":/app -w /app mcr.microsoft.com/playwright:v1.65.1-noble npx playwright test
```

## Environments and deployment

| Environment | URL | Purpose | How it is deployed | Data source |
|---|---|---|---|---|
| **Production** | https://quranweb.udienz.web.id | public site | automatically when a `v*` release tag is pushed (`deploy-prod.yml`), only for commits already on `master` | own mirrors at `/api/v2` and `/quran-api` on the same domain |
| **QA** | https://quranweb-qa.udienz.web.id | testing before release | by hand from `master` (`deploy-qa.yml`, Run workflow) | own mirrors on its own domain |
| Local | http://localhost:3000 | development | `npm run dev` | EQuran.id and fawazahmed0 directly (default) |

Both run on the same VM: Docker containers (`quranweb-prod` and `quranweb-qa`) behind nginx with Let's Encrypt certificates (certbot), with DNS through Cloudflare. Deployment uses SSH and `scripts/deploy.sh`, which builds the image on the server and rolls back to the previous image if the new app does not respond. To deploy from the server itself, without GitHub Actions, run `scripts/deploy-local.sh <qa|prod> [branch-or-commit]`: it resolves the branch on GitHub and runs `scripts/deploy.sh` here. The privacy contact and the Quran Foundation credentials, which the workflows take from GitHub secrets, are read from `~/.config/quranweb/deploy-<env>.env` (mode 600, not in git). First release: `v2.0.0` (2026-11-17).

## Data sources

The app does not depend on any one API's format. Everything is mapped to an **edition-based schema** (one edition = one Arabic text, transliteration, translation or tafsir) through **providers** in `src/lib/quran/`. The providers, the default editions and the default reciter are configured in one place (`defaultConfig` in `src/lib/quran/index.ts`), providers are tried in priority order with fallback, and audio has its own provider. Adding a source means writing a provider and registering it; the UI does not change.

| Source | Provides | Variable (optional) |
|---|---|---|
| [EQuran.id API v2](https://equran.id/apidev/v2) | Arabic text, Latin transliteration, Indonesian translation and tafsir (Kemenag), audio from six reciters | `QURAN_API_URL` (default `https://equran.id/api/v2`), `QURAN_AUDIO_URL` (default `https://cdn.equran.id`) |
| [AlQuran.cloud CDN](https://alquran.cloud/cdn) | audio only: 19 more reciters verse by verse (EveryAyah recordings), and a second address for the reciters EQuran.id also has | `QURAN_ISLAMIC_AUDIO_URL` (default `https://cdn.islamic.network`) |
| [fawazahmed0/quran-api](https://github.com/fawazahmed0/quran-api) | more editions, text only: Arabic Uthmani Hafs, Indonesian tafsir (Quraish Shihab, Jalalayn), English (Yusuf Ali, Pickthall), Turkish (Diyanet İşleri) | `QURAN_FAWAZ_URL` (default jsDelivr with a raw GitHub fallback) |
| [QuranEnc.com](https://quranenc.com/en/home/api) | the Kemenag translation with its footnotes, and *Al-Mukhtasar* tafsir in Indonesian, English and Turkish | `QURAN_QURANENC_URL` (default the live QuranEnc API; production reads a private copy) |
| [Quran Foundation API](https://api-docs.quran.foundation) (Quran.com) | tafsir in languages the others lack: Tafsir Ibn Kathir in Urdu | `QF_CLIENT_ID` and `QF_CLIENT_SECRET` (secrets; with them the Content API with an OAuth2 token, without them the unauthenticated `https://api.quran.com/api/v4`); always read live, one request per surah, kept in memory for a day |

The variables intentionally have no `NEXT_PUBLIC_` prefix: they are read on the server at request time (pages are not prerendered at build), so they can be changed through the platform's environment variables or `docker run -e` without a rebuild. See `.env.example`.

In production the three text sources are read from copies on the server, so the site does not call third parties for text:

- `/api/v2/...` follows the EQuran.id format.
- `/quran-api/...` follows the fawazahmed0 format (`editions.json`, `info.json`, `editions/{edition}/{surah}.json`).
- `quranenc/...` follows the QuranEnc API (`translation/sura/{key}/{surah}.json`); it is private, not served by nginx, because QuranEnc's terms ask for the copy to be kept current.

They are plain JSON files kept in a separate data repository. Recitation audio is not mirrored: it comes from `cdn.equran.id` and `cdn.islamic.network`. Every edition's source is credited in the UI and in its entry in `editions.json`.

A base URL can also be a **directory with a local copy of that data** (for example `/data/api/v2`), and then the app makes no HTTP request at all for text: QA and production run this way, with the mirror directory mounted read-only into the container. To change which providers are active, their order, which editions are enabled and the defaults without touching code, point `QURAN_CONFIG` to a JSON file (see `config/sources.example.json`, which reads the local copy first and falls back to EQuran.id). The three variables above only fill in a `baseUrl` that the file leaves out.

**The search index.** Search reads `quranweb-search.sqlite`, a SQLite FTS5 database built from the mirror (the EQuran.id text, and fawazahmed0's Arabic, English, Turkish, Malay, Bengali and Russian editions); it is not in git and nginx must not serve it. Build it where the mirror is, and again after every change of the mirror:

```bash
node scripts/build-search-index.mjs /srv/quranweb-mirror     # about 2 s, writes /srv/quranweb-mirror/quranweb-search.sqlite
```

The containers see it as `/data/quranweb-search.sqlite` (the app looks two folders above `QURAN_API_URL`; `QURAN_SEARCH_INDEX` names another file). It is written beside the old file and renamed over it, so a running app is never left with a half-written file, and it is opened again when it changes: no restart. Without it, `/search` says search is not available. The browser tests build their own from `e2e/fixtures`.

**The address of the site** (canonical links, link previews, `robots.txt` and the sitemap) comes from `SITE_URL`, else `BETTER_AUTH_URL` (set on both servers for sign-in), else the request's Host (nginx passes it). Only `https://quranweb.udienz.web.id` is indexed: on QA and on a local run `robots.txt` says `Disallow: /`. After a deploy, check `/robots.txt` and `/sitemap/0.xml` on both sites; if production ever answers `Disallow: /`, the app does not know its own address, so set `SITE_URL` in `/etc/quranweb/prod.env`.

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

- **`ci.yml`**: runs on every push to `master` and every PR: `npm run lint`, `npm test` and `npm run build` (which already includes the type check); the Docker image is built and started (`scripts/docker-smoke.sh`); and the browser tests run against the build (`npm run test:e2e`).
- **`deploy-qa.yml`** and **`deploy-prod.yml`**: deploy to the server over SSH (see `CLAUDE.md`). The image is built on the server and rolled back to the previous version if the new app does not respond.

## Backups

How the account database is backed up and restored: [backup.md](backup.md).
