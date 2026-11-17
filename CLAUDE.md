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
- Known data limits: EQuran.id has no English translation and one tafsir version, and its
  surah names have only an Indonesian meaning (the English meanings come from fawazahmed0's
  `info.json`); the Bismillah above every surah except Al-Fatihah and At-Taubah is added by the UI.
- Edition names and credits are localized (`LocalizedText`, one text per interface language),
  so a provider must give both `en` and `id`.

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
  data, and syncs between tabs. The `/my-reading` page shows it and offers JSON export and
  merge-import. Last read is recorded by an `IntersectionObserver` in `SurahReader`.
- **Display toggles** (Arabic, transliteration, translation) and the theme are also
  browser-only (`PrefsProvider`, `ThemeToggle`).
- This schema is designed to move to accounts later (roadmap phase 3).

### Interface language (i18n)

The interface is available in English and Indonesian (`src/lib/i18n/`).

- **Which language:** the cookie `qw-lang` (set by the EN/ID button) wins, then the first
  supported language in the browser's `Accept-Language`, then Indonesian
  (`negotiateLocale`). The root layout reads it per request, sets `<html lang>`, and gives
  the messages to client components through `I18nProvider` / `useI18n()`; server
  components use `getI18n()`.
- **Messages:** every user-visible string lives in `messages/en.ts` (the source catalog)
  and `messages/id.ts`. The shape of `id` is derived from `en` by TypeScript, so a missing
  key does not compile, and a test checks that both catalogs have the same keys and the
  same placeholders. Use `t("area.key", { name })` and, for counts, `tn("common.verses", n)`
  (plural forms by CLDR category). Never write a user-visible string in a component.
- **Adding a language:** add the code to `LOCALES` in `config.ts`, create the catalog
  (typed as `Messages`), register it in `messages/index.ts`, give every edition name and
  credit a text for it (`LocalizedText`), and add the intl code in `translate.ts`.
- **Language of the content** is separate: editions have their own language and the reader
  chooses them (cookie `qw-sel`). With the English interface and no saved choice, the
  default translation is English (`localeDefaults` in `defaultConfig`).
- **URLs, anchors and storage keys are English** (`/my-reading`, `#verse-12`, the field
  `verse` in `quranweb:user`). Older links keep working: `/saya` redirects to
  `/my-reading` and `#ayat-N` is rewritten to `#verse-N` in the browser.

### Rendering and configuration

- **No own backend or database.** Reading data never leaves the browser.
- **Pages `/`, `/my-reading`, `/surah/[number]` and `not-found` use `export const instant = false`.**
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
    my-reading/page.tsx        "My reading": last read, progress, bookmarks, backup
    not-found.tsx              404 page (translated)
    surah/[number]/page.tsx    surah list + settings (left) and reader (right)
  components/
    SurahReader.tsx            surah header, Reading/Tafsir tabs, jump to verse, audio
                               (one <audio>, auto-advance, falls back through URLs),
                               last-read tracking, list of sources
    VerseCard.tsx              one verse: text, bookmark, mark as read, note, copy
    SettingsPanel.tsx          display toggles and edition/reciter choice (cookie)
    SurahSidebar.tsx, SurahGrid.tsx   surah list and search
    ContinueReading.tsx, MyReading.tsx
    LanguageSwitch.tsx         EN/ID button (cookie qw-lang)
    PrefsProvider.tsx, ThemeToggle.tsx, Logo.tsx
  lib/
    quran/                     modular data sources (see above)
      types.ts, provider.ts, service.ts, index.ts, labels.ts
      providers/equran.ts, providers/fawazahmed0.ts
    userdata/schema.ts, store.ts   reading data (pure logic, browser store)
    selection.ts               parse/serialize the selection cookie
    i18n/                      config.ts (locales, negotiation), translate.ts (t, tn, plurals),
                               server.ts, client.tsx, messages/{en,id,types,index}.ts
    anchors.ts, cookies.ts     verse anchors (incl. legacy #ayat-N), cookie helper
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
sources of each edition are credited in the UI (the "Sources" line under each surah).

### Known limits

- `/surah/<invalid>` shows the translated 404 page but the HTTP status is 200: Cache
  Components does not support `dynamicParams = false`, and a `proxy.ts` check was judged
  too much for links nobody has.
- The surah list is fetched on every request (from our mirror, so it is cheap).

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
- Screenshots in `docs/screenshots/en/` and `docs/screenshots/id/` show the real UI in each
  language (English README and Indonesian README respectively); retake both sets when the
  UI changes noticeably.
- **Language of the repository.** Everything is in English: code, identifiers, comments,
  error messages and logs, test names, scripts, workflows, configuration and documentation.
  The only exceptions are the Indonesian interface strings (`messages/id.ts`),
  `README.id.md`, and data that is Indonesian by nature (edition text, `LocalizedText.id`
  values, API field names such as `nomor` that belong to a source). Commit messages and
  PR descriptions are in English too.
- **No hard-coded UI text.** A user-visible string goes into both message catalogs; error
  classes carry a code and an English message, and the UI maps the code to a translated
  message (see `UserDataError`).
