# CLAUDE.md

Context for Claude (or anyone) working on this repository.

## What this is

A public Qur'an reading website: Arabic text, translations, recitation audio and
tafsir, in Indonesian and English. Built with Next.js (App Router, TypeScript,
Tailwind). It fully replaces the old PHP application, whose code stays on the
`legacy-php` branch as an archive: do not develop it further and never merge it
into `master`.

There is **no panel for editing Qur'an content** and no backend or database yet.
Reading progress and bookmarks live in the browser. Google sign-in, a database and
user management are planned for later; the long-term plan is in
`project/quranweb/ROADMAP.md` in the workspace repository `udienz/claude-project`
(open work is in `project/quranweb/TODO.md` there).

## Architecture decisions (do not reopen these without a reason)

### Modular data sources

All text comes through providers in `src/lib/quran/`; the UI never sees a source's
own format.

- **Edition-based schema** (`types.ts`): one edition = one Arabic text,
  transliteration, translation or tafsir. Edition IDs are stable and independent of
  the provider, named `{iso3-language}-{name}` like fawazahmed0 (for example
  `ind-kemenag`, `ara-quranuthmanihaf`). User choices are stored by these IDs.
- **Providers** (`provider.ts`): a `TextProvider` maps one source to the schema; an
  `AudioProvider` resolves audio URLs and is separate from text. The order in
  `defaultConfig` (`index.ts`) is the priority, and later providers are fallbacks.
- **Service** (`service.ts`): merges the catalogs, falls back between providers,
  validates the defaults against the catalog at startup, and checks every edition's
  verse count against the surah metadata, so a wrong or partial source fails with a
  clear message instead of rendering broken pages.
- **Providers in place:**
  - `providers/equran.ts`: [EQuran.id API v2](https://equran.id/apidev/v2)
    (`/surat`, `/surat/{n}`, `/tafsir/{n}`). Arabic text, Latin transliteration,
    Indonesian translation (Kemenag), Indonesian tafsir (Kemenag) and six reciters
    (default `misyari-rasyid-al-afasi`). These editions are the defaults.
  - `providers/fawazahmed0.ts`: [fawazahmed0/quran-api](https://github.com/fawazahmed0/quran-api),
    text only. Six editions: Arabic Uthmani Hafs, Kemenag (QuranEnc), Quraish Shihab
    (tafsir), Jalalayn (tafsir), Yusuf Ali, Pickthall. They only extend the catalog.
    All have 6,236 verses and verse counts per surah identical to the EQuran.id
    metadata (verified for every surah).
- **Adding a source** = write a provider, register it in `defaultConfig`, and record
  its licence in the source register of the roadmap. No component changes.
- **Do not use `api.quran.gading.dev`**: it is limited to 10 requests per 5 minutes
  per IP, and its `preBismillah` payload lacks `number`, `audio` and `tafsir`, which
  crashed the UI.
- **Do not rely on jsDelivr at runtime for fawazahmed0.** That repository is about
  4.2 GB, so jsDelivr sometimes refuses a file (403 "Package size exceeded the
  configured limit of 50 MB", seen on `ind-indonesianislam/45`). The provider falls
  back to raw GitHub, but production uses our own mirror (`QURAN_FAWAZ_URL`).
- Known data limits: EQuran.id has no English translation and one tafsir version;
  the Bismillah above every surah except Al-Fatihah and At-Taubah is added by the UI.

### Reader choices and user data

- **Edition and reciter choices** (Arabic text, translations, tafsir, reciter) are
  kept in the cookie `qw-sel` so the server can render them (`src/lib/selection.ts`).
  The server validates the cookie against the catalog and falls back to the defaults
  on anything invalid. The page reads it with `cookies()`, which works with Cache
  Components here because the pages are already dynamic.
- **Reading data** (last read, per-surah progress, bookmarks with notes) is stored in
  `localStorage` under `quranweb:user`, as a versioned schema
  (`src/lib/userdata/schema.ts`, pure functions) read through `useSyncExternalStore`
  (`store.ts`). It also works in memory when storage is unavailable, ignores corrupt
  data, and syncs between tabs. The `/saya` page shows it and offers JSON export and
  merge-import. Last read is recorded by an `IntersectionObserver` in `SurahReader`.
- **Display toggles** (Arabic, transliteration, translation) and the theme are also
  browser-only (`PrefsProvider`, `ThemeToggle`).
- This schema is designed to move to accounts later (roadmap phase 3).

### Rendering and configuration

- **No own backend or database.** Reading data never leaves the browser.
- **Pages `/`, `/saya` and `/surah/[number]` use `export const instant = false`.**
  This is intentional. Without it, Next.js 16 (Cache Components) tries to prerender
  them at `next build`, which would make `docker build` and CI depend on external
  APIs whose URLs are not even known at build time. With it, data is fetched at
  request time, so the build needs no network and the source URLs can change through
  environment variables without a rebuild. Do not remove it unless you deliberately
  go back to static generation.
- **Environment variables** are deliberately not prefixed with `NEXT_PUBLIC_`: they
  are read on the server at request time, not inlined at build time.

| Variable | Default | Purpose |
|---|---|---|
| `QURAN_API_URL` | `https://equran.id/api/v2` | Base URL of an EQuran.id-format API (point it to our mirror) |
| `QURAN_AUDIO_URL` | `https://cdn.equran.id` | Base URL for audio (for when audio is self-hosted) |
| `QURAN_FAWAZ_URL` | jsDelivr, then raw GitHub | Base URL of a fawazahmed0-format API (point it to our mirror) |

## Project structure

```
src/
  app/
    layout.tsx                 shell: header, theme, fonts (@fontsource), footer
    globals.css                colour tokens (light/dark), Amiri font for Arabic
    page.tsx                   home: hero, "continue reading", grid of 114 surahs
    saya/page.tsx              "Bacaan saya": last read, progress, bookmarks, backup
    surah/[number]/page.tsx    surah list + settings (left) and reader (right)
  components/
    SurahReader.tsx            surah header, Bacaan/Tafsir tabs, jump to verse, audio
                               (one <audio>, auto-advance, falls back through URLs),
                               last-read tracking, list of sources
    VerseCard.tsx              one verse: text, bookmark, mark as read, note, copy
    SettingsPanel.tsx          display toggles and edition/reciter choice (cookie)
    SurahSidebar.tsx, SurahGrid.tsx   surah list and search
    ContinueReading.tsx, MyReading.tsx
    PrefsProvider.tsx, ThemeToggle.tsx, Logo.tsx
  lib/
    quran/                     modular data sources (see above)
      types.ts, provider.ts, service.ts, index.ts, labels.ts
      providers/equran.ts, providers/fawazahmed0.ts
    userdata/schema.ts, store.ts   reading data (pure logic, browser store)
    selection.ts               parse/serialize the selection cookie
  **/*.test.ts                 vitest tests, no network
scripts/
  deploy.sh                    server deploy (see CI and deployment)
  mirror-nginx.conf.example    nginx locations for the data mirrors
  sync-mirror.mjs              copy the EQuran.id text to static JSON
docs/screenshots/              images used by the READMEs
```

## Commands

```bash
npm install
npm run dev               # dev server
npm run lint
npm test                  # vitest, no network
npm run test:live         # optional: real sources (about 8 minutes from the CDN, about
                          # 30 s against our mirrors). Set LIVE_QURAN_API_URL and
                          # LIVE_QURAN_FAWAZ_URL to our mirrors to spare the upstreams.
npm run build             # production build; needs no network (see instant = false).
                          # Includes the full type check.
```

Do not run `tsc --noEmit` as a separate step before `npm run build`: types such as
`LayoutProps` are generated by Next.js into `.next/types/` during build/dev, so an
earlier `tsc` fails with "Cannot find name 'LayoutProps'". That is the wrong order,
not a code error.

This Next.js version has breaking changes: read the relevant guide in
`node_modules/next/dist/docs/` before writing Next-specific code (see `AGENTS.md`).

## Docker

```bash
docker build -t quranweb .
docker run -p 3000:3000 quranweb       # QURAN_* variables are optional
docker compose up --build
```

Base images (`node:20-alpine`) are pulled from Docker Hub. In an environment with a
limited network allowlist the pull can fail even though the Dockerfile is valid.
Node 20 is past its end of life: moving to a current LTS is on the todo list.

## CI and deployment

- `.github/workflows/ci.yml`: lint, `npm test` and `npm run build` (which includes the
  type check) on every push to `master` and every PR.
- There is no separate Docker build in CI (removed 2026-11-17: it never failed in 14
  runs, repeated `npm run build`, and the Dockerfile changed once). The Dockerfile is
  validated by the QA deploy, which builds the same image and rolls back on failure.
  If you change the Dockerfile, run `docker build` locally before merging.
- `.github/workflows/deploy-qa.yml`: push to `master` deploys to QA over SSH with
  `scripts/deploy.sh qa <sha>`. It needs the repository variable `QA_DEPLOY=true`
  and the `QA_SSH_*` secrets (listed in the workflow).
- `.github/workflows/deploy-prod.yml`: pushing a `v*` tag deploys to production,
  only for commits already on `master` (GitHub Environment `production`).
  `git tag -a v2.0.1 <commit> && git push origin v2.0.1`. First release: `v2.0.0`
  (2026-11-17). Use numbers above 2.0.0: the old PHP app owns the tags `1.0` and `1.1`.
  Roll back by re-running the workflow for an older tag.
- `scripts/deploy.sh <qa|prod> <ref>` builds the image on the server, replaces the
  container and waits for HTTP 200; if the new container does not answer it restores
  the previous image.

## Environments

| | URL | Container | Deployed |
|---|---|---|---|
| QA | https://quranweb-qa.udienz.web.id | `quranweb-qa`, `127.0.0.1:3000` | automatically from `master` |
| Production | https://quranweb.udienz.web.id | `quranweb-prod`, `127.0.0.1:3002` | from release tags |

Both run on one VM behind nginx with Let's Encrypt (certbot); DNS goes through
Cloudflare. Do not write the server IP in this public repository: the domains are
proxied.

### Data mirrors

Both domains serve static JSON mirrors from `/srv/quranweb-mirror` (nginx locations in
`scripts/mirror-nginx.conf.example`), and `deploy.sh` points `QURAN_API_URL` and
`QURAN_FAWAZ_URL` at them:

- `/api/v2/...`: EQuran.id format (`surat.json`, `surat/{n}`, `tafsir/{n}`).
- `/quran-api/...`: fawazahmed0 format (`editions.json`, `info.json`,
  `editions/{edition}/{n}.json`); `.json` and `.min.json` are both served from the
  `.min.json` files.

The source files live in the separate private repository `udienz/quranweb-data`
(text and sync scripts; audio is not in git). The mirrors are one-time copies of data
that does not change; there is no scheduled sync (the server has no `crontab`, and a
systemd timer was installed and then disabled). To refresh, run
`node scripts/sync-mirror.mjs` here or `node scripts/sync-fawaz.mjs` in the data
repository, review the diff and copy the result to the server. Only text is mirrored;
audio still comes from `cdn.equran.id`.

Use is non-commercial: the data is not sold and EQuran.id, Kemenag RI and the original
sources of each edition are credited in the UI (the "Sumber" line under each surah).

## Working rules

- Do not add a panel or feature for editing surahs, verses, translations or tafsir:
  Qur'an content only comes from verified sources through the sync scripts and PRs.
  User management (view, disable, delete accounts) may be added together with the
  account feature.
- Non-trivial changes go through a PR, not a direct push to `master`.
- **Two READMEs.** `README.md` is English and `README.id.md` is Indonesian. Any change
  to one MUST be made in the other in the same commit (sections, tables and commands
  stay aligned). Before committing a change that touches a README, check that both
  files are updated, and keep the language links on the second line of each file.
- Screenshots in `docs/screenshots/` show the real UI; retake them when the UI changes
  noticeably.
- Commit messages and PR descriptions are in English.
