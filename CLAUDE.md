# CLAUDE.md

Context for Claude (or anyone) working on this repository.

## What this is

A public Qur'an reading website: Arabic text, translations, recitation audio and
tafsir, in Indonesian and English. Built with Next.js (App Router, TypeScript,
Tailwind). It fully replaces the old PHP application, whose code stays on the
`legacy-php` branch as an archive: do not develop it further and never merge it
into `master`.

There is **no panel for editing Qur'an content**. Reading progress and bookmarks live in the browser. Optional
sign-in (OIDC through our own identity provider) and a SQLite database for accounts are being added (roadmap
phase 3); reading data syncs with the account when signed in, readers can download or delete it, and the admin can manage accounts; the long-term plan is in
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
  `AudioProvider` resolves audio URLs and is separate from text.
- **Source registry** (`sources.ts`): which providers are active, in which order (the
  priority; later ones are fallbacks), which fawazahmed0 editions are enabled and the
  defaults. It is data: `DEFAULT_SOURCES` is the built-in registry, `QURAN_CONFIG` replaces
  it with a JSON file (`config/sources.example.json`), and `parseSourceConfig` rejects typos,
  unknown provider types and unknown editions with a message naming the path. The
  `QURAN_*_URL` variables only fill in a `baseUrl` the registry leaves out; an explicit one wins.
- **Transport** (`transport.ts`): a provider's base URL is an HTTP URL or a directory (or
  `file://`) with a local copy of the mirror, so the app can run with no HTTP for text.
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
    text only. Nine editions: Arabic Uthmani Hafs, Quraish Shihab
    (tafsir), Jalalayn (tafsir), Yusuf Ali, Pickthall, the Turkish Diyanet İşleri meal
    (`tur-diyanetisleri`, the default translation with the Turkish interface), and since 2026-11-21 the defaults of three
    new interfaces: Abdullah Basmeih in Malay (`msa-abdullahmuhamma`), Muhiuddin Khan in Bengali (`ben-muhiuddinkhan`) and
    Elmir Kuliev in Russian (`rus-elmirkuliev`), all through Tanzil. They only extend the catalog.
    Tanzil's terms (four of these editions, and the Turkish one, come through Tanzil): non-commercial use, and a link back
    to https://tanzil.net/trans/ when more than three of its translations are used on a site; the source link of every Tanzil
    edition on the About page goes there (a test checks it).
    All have 6,236 verses and verse counts per surah identical to the EQuran.id
    metadata (verified for every surah).
  - `providers/islamic-network.ts`: audio only, from the [AlQuran.cloud](https://alquran.cloud/cdn) CDN
    (`cdn.islamic.network/quran/audio/{bitrate}/{edition}/{ayah}.mp3`, where `{ayah}` is the verse's number in the whole
    Qur'an, 1 to 6,236: `ayahNumber` in `ayah-number.ts`). The owner chose it over hosting audio ourselves (2026-11-19). Of
    its 176 Arabic audio editions only 26 have every verse as a file, 7 of those are copies of another ("-2"), and the rest
    are whole surahs only, so 19 reciters are listed (`ISLAMIC_NETWORK_RECITERS`, each checked file by file at the chosen
    bitrates; Minshawi's murattal is left out, it misses one verse). Two of them (Alafasy and Sudais) have the EQuran.id
    ids, so the service merges them and the CDN becomes their fallback URL. The API itself is limited to 12 requests a
    second, so the app never calls it: the list is in the code. Whole-surah recordings would need a playback mode of their
    own (not built).
  - **The reciter list** (`ReciterPicker`, in the side panel and the Audio section) puts the best known first in a fixed
    order (`BEST_KNOWN_RECITERS` in `reciter-order.ts`), then the others by name, with a search box over the Latin and
    Arabic names (`matchesReciter`: no diacritics, any alif, hyphens and spaces optional). A reciter's name is the same in
    every language, so never put a translatable word in it.
  - **Data saver** (`src/lib/audio-quality.ts`, `AudioQualitySelect` in the Audio section; public issue #41 ended here): a provider
    may tell the bitrate of its URLs (`AudioProvider.kbps`; the CDN's is in the path). The service gives each verse `audio` (the
    usual order) and, only when it differs, `audioSaver` (smallest first; a URL of unknown size counts as the largest), and marks
    a reciter `dataSaver` when that changes the first file, so the setting can say whether it does anything for the chosen
    reciter. EQuran.id's Alafasy file is byte for byte the CDN's 128 kbps file; the 64 kbps one is half that. The choice is
    local storage `quranweb:audio-quality`, per device and **not** recorded in the account: it depends on the device's
    connection. `SurahReader` reads it when a verse starts and keeps that verse's list for the error fallback.
  - `providers/quranenc.ts`: [QuranEnc.com](https://quranenc.com/en/home/api), reviewed translations with **footnotes**
    and *Al-Mukhtasar fi Tafsir al-Qur'an* in many languages. Wave 2 (2026-11-21) added Junagarhi's Urdu translation
    (`urd-muhammadjunagar`, 1.1.3), the Rowwad Persian translation (`fas-islamhousecompe`, 1.1.3) and Al-Mukhtasar in Persian
    and in the Arabic original (`fas-mokhtasar`, `ara-mokhtasar`). The first four editions: the Kemenag translation (`ind-indonesianislam`,
    which came through fawazahmed0 until 2026-11-19; that copy had turned the footnote markers into stray numbers in 563 verses,
    so the edition moved here with the same ID, and readers' saved choices still work) and Al-Mukhtasar in English
    (`eng-mokhtasar`) and Turkish (`tur-mokhtasar`), the default tafsir with those interfaces, and in Indonesian (`ind-mokhtasar`, a
    short tafsir to choose beside Kemenag, which stays the Indonesian default; added 2026-11-19). The text is passed on unchanged:
    the markers ("[252]") stay in it and the footnotes come with it (`VerseText.notes`, shown folded under the translation by
    `Footnotes`). Since 2026-11-21 also the French translation of Rachid Maach (`fra-rashidmaash`, version 1.0.3, with
    footnotes; the default with the French interface) and Al-Mukhtasar in Bengali, French and Russian (`ben-mokhtasar`,
    `fra-mokhtasar`, `rus-mokhtasar`, the default tafsir with those interfaces). `mokhtasar()` and `translationCredit()` build
    an edition's name and credit in every interface language. QuranEnc's terms: no modification, addition or deletion; name the publisher and QuranEnc.com; give the version;
    keep it up to date; no inappropriate ads. So each credit names the version (1.0.1 for Kemenag; Al-Mukhtasar has none
    published, so the date of the copy), and the copy is **not** served publicly. Production reads the private copy made by
    `sync-quranenc.mjs` in the data repository (`QURAN_QURANENC_URL=/data/quranenc`); run its `--check` now and then, and when
    it reports a newer version, fetch again and update the version in the credit.
- **Not every edition is mirrored** (the owner's choice, 2026-11-21): new translations and tafsir are **not** downloaded or
  copied to `/srv/quranweb-mirror`. The QuranEnc provider reads the keys in `MIRRORED_KEYS` from the copy and every other key
  from the live QuranEnc API, also in production. Remote JSON is kept in memory for a day (`transport.ts`: at most 400
  answers, a failure is not kept, an 8 s timeout), so a source is asked about once per surah and edition per day, not per
  page view. Because a live source can be down, `getSurahView` treats translations and tafsir as optional: one that fails is
  left out, logged, and listed in `SurahView.unavailable`, and the reader shows one line naming it (`reader.unavailable`).
  The Arabic text and the transliteration (both mirrored) still fail the page. Tests start with an empty cache
  (`vitest.setup.ts`).
- **Adding a source** = write a provider, add its type to `sources.ts` (parser and
  factory), and record its licence in the source register of the roadmap. No component
  changes.
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
  so a provider must give both `en` and `id`. With twenty-five interface languages the rest is filled by `completeEditions`
  (`quran/edition-names.ts`): an edition keeps the names written for it, any other interface language gets "author
  (language)", the language named by `Intl.DisplayNames` ("Isa Garcia (español)"), and the English credit. Write a name out
  only where the generic one reads badly (the EQuran.id editions, which have no author; Al-Mukhtasar, built by `mokhtasar()`).

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
- **Schema version 2 is made to be synchronised** (roadmap phase 3, see `PHASE3.md` in the
  workspace repository). Every item has the time of its last change (`updatedAt`, or `at` for
  last read and progress), and a removed bookmark or cleared progress stays as a tombstone
  (`deletedAt`) for 90 days, so a removal reaches every device. `mergeUserData` takes the
  newest change per item (a removal wins a tie), and it is commutative, associative and
  idempotent, which tests check on 300 random triples: copies merged in any order converge.
  Change times more than a day in the future are brought back to the current time (`clampFutureTimes`) on import, on the
  server before each merge and in the browser after a sync: otherwise an item dated 9999 (a crafted backup file) would beat
  every later real change and its tombstone would never be pruned.
  Show data with `liveBookmarks` and `liveProgress`, never by reading `bookmarks` or
  `progress` directly. Version 1 data (and backup files) is migrated when read; the stored
  copy becomes version 2 at the next change. The backup envelope stays `format: 1`.
- **Display toggles** (Arabic, transliteration, translation) are browser-only (`PrefsProvider`). The theme and text
  size are kept in the browser too and also follow the account (see "Settings page, theme and text size").
- This schema is designed to move to accounts later (roadmap phase 3).

### Interface language (i18n)

The interface is available in English and Indonesian, and as community translations in Turkish, Malay, Bengali, French,
Russian, Urdu, Arabic, Persian, Spanish, Bosnian, Chinese, Thai, Uzbek, Tamil, Malayalam, German, Portuguese, Italian, Hindi,
Swahili, Hausa, Japanese and Vietnamese (`src/lib/i18n/`); Urdu, Arabic and Persian are right to left. Both READMEs list every
language with its default translation and tafsir (section "Languages"): update that table when a language or a default changes.

- **Which language:** the cookie `qw-lang` (set by the language menu in the header, or the "Interface language" list on
  `/settings`; both use `useLocaleChoice` in `LanguageMenu.tsx`) wins, then the first
  supported language in the browser's `Accept-Language`, then Indonesian
  (`negotiateLocale`). The root layout reads it per request, sets `<html lang>`, and gives
  the messages to client components through `I18nProvider` / `useI18n()`; server
  components use `getI18n()`.
- **Messages:** every user-visible string lives in `messages/en.ts` (the source catalog)
  and `messages/id.ts`. The shape of `id` is derived from `en` by TypeScript, so a missing
  key does not compile, and a test checks that both catalogs have the same keys and the
  same placeholders. Use `t("area.key", { name })` and, for counts, `tn("common.verses", n)`
  (plural forms by CLDR category). Never write a user-visible string in a component.
- **Adding a language:** add the code to `LOCALES` in `config.ts`, and to `LOCALES_BY_NAME` (the menu order) and
  `LOCALE_FLAGS` (its flag; add the country to the imports of `LanguageFlag.tsx` if it is new), create the catalog
  (typed as `Messages`), register it in `messages/index.ts`, give every edition name and
  credit a text for it (`LocalizedText`), and add the intl code in `translate.ts`.
  Contributed translations (interface only) follow `CONTRIBUTING.md`, "Translating the
  interface": pull requests only, reviewed by the language maintainer in `.github/CODEOWNERS`.
- **Language of the content** is separate: editions have their own language and the reader
  chooses them (cookie `qw-sel`). With another interface than Indonesian and no saved choice, the default translation is
  one in that language (Yusuf Ali, the Diyanet meal, Basmeih, Muhiuddin Khan, Rachid Maach, Kuliev, Junagarhi, the Rowwad
  Persian, Isa Garcia, the Rowwad Bosnian, Thai and Uzbek, Ma Jian's Chinese, Omar Sharif's Tamil, Kunhi Muhammad's Malayalam, Bubenheim and Elyas's German, Helmi Nasr's Portuguese, Al-Omari's Hindi,
  Al-Barwani's Swahili, Gumi's Hausa, Saeed Sato's Japanese, the Rowwad Vietnamese)
  and the default tafsir is Al-Mukhtasar in that language (`localeDefaults` in the source registry); Indonesian keeps the
  Kemenag tafsir, and Malay, which has no Al-Mukhtasar, keeps it too. **A language with no translation or tafsir of its own falls back
  to English** (the owner's rule, 2026-11-21): Urdu and Spanish read Al-Mukhtasar in English (none in our sources is in Urdu;
  QuranEnc's Spanish Al-Mukhtasar has an empty 59:24, its numbering one verse off from 59:22, so it is left out rather than
  altered). Malay keeps the Kemenag tafsir, which a Malay reader follows more easily than English. Wave 4 (2026-11-21): German,
  Portuguese, Swahili and Hausa read Al-Mukhtasar in English (QuranEnc has none in those languages), and Italian, which has
  Al-Mukhtasar but no reviewed translation on QuranEnc, reads Yusuf Ali. Every live key of waves 3 and 4 was checked for empty or
  missing verses before it was added (Spanish Al-Mukhtasar was the only one that failed). **Arabic** has no translation and no transliteration by default, and the Arabic original of Al-Mukhtasar as
  its tafsir; with no translation and no transliteration the mushaf layout drops its numbered column and the Arabic takes
  the whole width.
- **Plurals:** `Plural` has the CLDR categories `zero`, `one`, `two`, `few`, `many` and `other`; `tn` picks the category of the
  count and falls back to `other`. Russian and Bosnian use three or four (`messages/ru.ts`, `bs.ts`), Arabic all six (`messages/ar.ts`); Chinese, Thai,
  Persian, Uzbek, Japanese and Vietnamese only `other`; write `other`
  last, because the catalog test compares its placeholders.
- **Data text in a language we lack** (an edition name, a surah meaning) falls back to a close language first (`CLOSE_LANGUAGE`
  in `translate.ts`: Malay reads the Indonesian surah meanings), then English. Surah meanings exist in English and Indonesian
  only, so the other interfaces show the English one (for Arabic, Urdu and Persian a known gap: the Arabic name is beside it). `editions-i18n.test.ts` checks that every edition has a name and
  a credit in every interface language.
- **Right to left** (prepared 2026-11-21 for Arabic, Urdu and Persian): `RTL_LOCALES` and `directionOf` in `config.ts`; the root
  layout sets `<html dir>`. The layout uses **logical** utilities only: `ms-`/`me-`, `ps-`/`pe-`, `start-`/`end-`, `border-s`/`border-e`,
  `text-start`, `inset-x-0`, so the page mirrors itself; never write `ml-`, `pr-`, `left-`, `right-`, `border-l` or `text-left`
  for something that follows the reading direction. Arrows and the panel chevron mirror with `rtl:-scale-x-100`. Text keeps its own
  direction whatever the page: the Arabic is `dir="rtl"`, the transliteration `dir="ltr"`, a translation and its footnotes take
  the edition's `direction`, and the tafsir `dir="auto"`. Checked by forcing `dir="rtl"` on the Indonesian pages at 320 and
  1280 px: no page wider than the screen, menus on screen, side panel, read marks and pagination mirrored.
- **Fonts:** the interface fonts have no Cyrillic, Bengali, Arabic-script, Chinese, Thai, Tamil, Malayalam, Devanagari or Japanese glyphs, so those
  interfaces use the system font from the `--font-sans` stack (`system-ui`; Amiri stays for the Qur'an text). Checked at
  320, 390 and 1280 px in the seven languages of wave 3 and the eight of wave 4: no page wider than the screen, menus on screen
  (the language menu scrolls inside itself when it is taller than the screen).
- **Language menu order and flags** (the owner's request, 2026-11-21): the menu and the settings list follow `LOCALES_BY_NAME`,
  alphabetical by each language's own name (`Intl.Collator("und")`: Latin script first, then Cyrillic, Arabic, the Indic
  scripts, Thai, Chinese and Japanese). It is written out, not sorted at run time, because the server's and the browser's ICU
  could order it differently and break hydration; `i18n.test.ts` checks it is sorted and complete. The menu shows a flag
  before each name (`LOCALE_FLAGS`, the country the language is usually shown with: Malay with Malaysia, Urdu with Pakistan,
  Arabic with Saudi Arabia, Portuguese with Brazil, Swahili with Tanzania, English with the United Kingdom, Tamil, Malayalam
  and Hindi with India). The flags are inline SVG from `country-flag-icons` (MIT), imported one by one so the bundle carries
  only those 23; emoji flags were not used because Windows shows them as two letters. The `<select>` on `/settings` has no
  flags (an `<option>` cannot hold an image).
- **Community translations** (`COMMUNITY_LOCALES` in `config.ts`): a language not yet reviewed by a speaker (the owner's
  decision, 2026-11-18, for Turkish, translated by a reader; and 2026-11-21 for the twenty-two others, first drafts by Claude at
  the owner's request) is marked "Community" in the language menu and the settings list, its privacy
  page says that the English and Indonesian versions apply where the translation differs (`privacy.translationNote`), and the menu offers "Report a translation mistake" (a new GitHub issue with the language in the title) while
  that language is the current one. `tr` is already listed, so the label appears together with the language. Remove a
  language from the list once it has been reviewed and has a maintainer in `.github/CODEOWNERS`.
- **No machine translation of the Qur'an text.** Chrome and other browsers offer to translate a page, and on an Indonesian
  page they replaced the Arabic of Al-Fatihah with Indonesian words, the verse markers with `)1 (`, and the language code
  "ID" with "Pengenal" (seen on QA, 2026-11-18). Everything Arabic (`lang="ar"`), the transliteration, translations and tafsir of a
  verse, and the language names and codes carry `translate="no"`; the interface text stays translatable for a reader whose
  language we do not have. `no-machine-translation.test.ts` fails when an element with `lang="ar"` lacks it.
- **URLs, anchors and storage keys are English** (`/my-reading`, `#verse-12`, the field
  `verse` in `quranweb:user`). Older links keep working: `/saya` redirects to
  `/my-reading` and `#ayat-N` is rewritten to `#verse-N` in the browser.

### Mushaf layout and account menu

- **Two layouts for the Reading tab** (`src/lib/layout.ts`, cookie `qw-layout`, read by the surah page on the server):
  `mushaf` (the default) and `cards`. `MushafView` puts the Arabic text of the page in one justified block with a marker
  ﴿N﴾ (Arabic-Indic digits) after each verse, and the transliteration and translations in a numbered column beside it
  (`lg`; below it on smaller screens). Selecting a marker or a number opens that verse's actions (`VerseActions`, shared
  with `VerseCard`) in a bar fixed at the bottom of the screen (a sticky bar would not stick inside the reader's
  `overflow-hidden` box). The translation items carry the `verse-N` ids, so verse links, the jump menu, last-read
  tracking (`[id^='verse-']`) and audio scrolling work in both layouts. The Tafsir tab always uses cards. Pages are still
  our 10-verse pages; the 604 pages of the printed mushaf are being added as a second paging mode (see "Mushaf pages"). The layout is a choice like the editions: switching it
  in the settings writes the cookie and records `choices.layout`, which follows the account.
- **Account menu** (`AccountMenu`): a button with the person icon (and the name on wide screens) opens a dropdown with
  "My reading" and Sign in, or the name and email, "My reading" and Sign out. With sign-in on, "My reading" is only in
  this menu; with sign-in off the menu is not rendered and "My reading" stays in the main navigation. It closes on a
  click outside and on Escape.
- **The side panel of the surah page** (surah list and reading settings) can be collapsed on wide screens
  (`SurahLayout`, button above the reader), so the reader and the mushaf text use the whole width. The state is the
  cookie `qw-sidebar` (`SIDEBAR_COOKIE` in `layout.ts`; a constant shared with a server component must not live in a
  `"use client"` module, where it becomes a client reference), read by the server so the page renders collapsed without a
  flash. It is per browser and does not follow the account. Below `lg` the same surah list and settings are in the folded
  "Surah list and settings" panel above the surah, so phones have everything the side panel has.
- **No page wider than the screen on phones:** the header puts the navigation on a second row below `sm`, and grids that
  hold `truncate`d text need `grid-cols-1` (an implicit grid column grows to the text). Check new pages at 320 px.
- **Keyboard focus and tap targets** (UI audit, 2026-11-19): every control gets a 2px ring on `:focus-visible` from an
  unlayered rule in `globals.css` (teal; gold inside `.on-dark`, which the chapter head and the home hero carry), so do not
  remove it with `outline-none`. Small round buttons keep their look and get a 44px hit area from an `::after` layer
  (`relative after:absolute after:-inset-1 after:rounded-full`; one step more when the button has a 1px border, because
  the layer is measured from inside it). Numbers use `tabular-nums` in the interface font, not monospace; small labels are
  sentence case. `docs/DESIGN.md` describes the system: update it with any visible change.

### Settings page, theme and text size

- **`/settings`** holds every setting of the reader, in sections linked at the top: language, theme and text size
  (`DisplaySection`), **audio** (`AudioSection`: the reciter, what the audio does at the end of a surah or a juz, and a list that
  starts a whole juz from here), the reading settings (the same `SettingsPanel` as beside a surah: layout, what is shown,
  editions; the reciter is left out on this page with `showQari={false}`, because the Audio section has it) and, when sign-in is
  on, the account (`AccountSection`: download and delete, or sign in; it moved here from
  `/my-reading`, and the privacy page says so). It is opened from the account menu, or from the main navigation when
  sign-in is off, and from the "All settings" link in the side panel. The side panel keeps its settings, the reciter included,
  as a shortcut (the owner's decision) and adds the text size; the surah header keeps the playback mode. The shared pieces:
  `useSelectionChoice` (editions and reciter: cookie, recorded choice, refresh) and `PlaybackModeSelect` (header and settings).
  A juz started from the settings page goes through `beginJuz` (`audio.ts`): the reader that opens at its first verse plays it.
- **Theme:** light, dark or auto (follows `prefers-color-scheme`, also while the page is open). Local storage `theme`
  (the old key; no value means auto). The header button switches between light and dark and records that choice.
- **Text size:** Arabic and Latin on their own scale, five steps (`FONT_SCALES`: 85 % to 150 %), local storage
  `quranweb:font-size`. The reading text multiplies its size by the CSS variables `--arabic-scale` and `--latin-scale`
  on `<html>` (`text-[length:calc(2rem*var(--arabic-scale,1))]`): mushaf and verse-by-verse Arabic, transliteration,
  translations, tafsir and the Bismillah. Labels and buttons keep their size.
- **No flash:** `displayScript` (`src/lib/display.ts`), inline in the root layout's `<head>`, applies both before the
  first paint. `display.ts` has no `"use client"` so the server layout can import the script and constants; the hooks
  are in `DisplayControls.tsx`. Every storage access is guarded (storage can be blocked).
- **Choices:** an explicit change records `choices.theme` / `choices.fontSize` (newest wins, validated against the
  known values), so they follow a signed-in reader like the layout.

### Playback at the end of a surah, and a whole juz

- **Playback mode** (`src/lib/playback.ts`): what the audio does after the last verse of a surah: `stop` (the default and the
  old behaviour), `repeat` (the same surah from verse 1) or `next` (verse 1 of the next surah; after surah 114 it stops,
  it does not wrap). `afterSurah` is the pure rule. A selector in the surah header chooses it; it is stored in local storage
  (`quranweb:playback-mode`) and recorded as `choices.playbackMode`, so it follows the account like the theme (applied after a
  sync by `playbackUpdate`, no refresh). A mode that is not one of the three is refused on import and on sync.
- **One shared `<audio>` element** (`src/lib/audio.ts`), not one per page: moving on to the next surah replaces the page
  component, and on iPhones and in Safari a new element may not start by itself while an element that a tap started may. The
  reader attaches its `ended` and `error` listeners in an effect (to the latest handlers) and pauses the element when it is left.
- **Hand-over between pages** is `setPendingStart` / `takePendingStart` (the verse playback is heading for, kept in module
  state, which survives a client-side navigation): used for the next page of a surah, the first page again, and the next
  surah. A repeat of a one-page surah just restarts verse 1.
- **Play a whole juz** (the "Play a juz" list in the surah header): start at the first verse of a juz and go on across pages and
  surahs to its last verse. The boundaries are not a table of ours: `info.json` of fawazahmed0 has them (`juzs.references`),
  the provider gives them as `juzs()`, and `getJuzList` in the service checks them (`quran/juz.ts`: 30 juz in order, the first at
  1:1, each starting right after the previous one ends, every verse real, the last ending at the end of surah 114) before they
  are used, because a wrong table would make audio skip or repeat verses. The page passes the list to `SurahReader`; without it
  the list is left out and the rest works. The juz being played is module state (`getJuzScope`, `setJuzScope` in `audio.ts`,
  also a store, so the page shows "Playing juz N"). Inside a juz the end of a surah does not stop playback (it goes on in the
  next surah); at the last verse of the juz the **playback mode** decides (`afterJuz`): stop, the same juz again, or the next
  juz (after juz 30 it stops). Playing a verse by hand leaves the juz. A pending start may be any verse of the arriving page
  (`takePendingStart(surah, from, to)`), not only its first, because a juz can start in the middle of a page.
- **Next keeps a page that was left**, hidden and with its state, so a hidden `SurahReader` is still in the DOM (a second
  "Playing juz" in a text search; use `:visible`). Its effects are cleaned up, which pauses the audio and clears the
  "playing" mark, so returning to it does not show a verse as playing that is not.
- **Lock screen and media keys** (`src/lib/media-session.ts`, Media Session API): while a verse plays or is paused, the phone's
  lock screen shows "Al-Baqarah 2:255", the reciter and the logo, with play/pause and previous/next verse. Next and previous go
  through `goTo`, so they cross pages; next after the last verse of a surah starts the next surah, and nothing follows 114:6.
  Pausing remembers the verse (`pausedVerse`), so play carries on from where it stopped. Browsers without the API are left
  alone. Test it by capturing `setActionHandler` in an init script and calling the handlers.
- **Keyboard** (surah page): Space plays or pauses (with nothing playing or paused, the first verse in view starts), N and P
  go to the next and the previous verse, through the same functions as the lock screen. Ignored in fields and with Alt, Ctrl
  or Meta; Space on a focused button or link is left to the browser. The Audio section of the settings lists the keys.
- **Every `play()` goes through `play()` in `SurahReader`**, which numbers it: a failure clears the "playing" mark only if it is
  the latest one. Moving on quickly interrupts the previous `play()` with an `AbortError`, which used to clear the mark of the
  verse that had just started (found with the N and P keys, 2026-11-19).
- **Memorization, step 1** (`src/lib/memorize.ts`, `MemorizePanel` behind the "Memorize" button in the surah header; public
  issue #45): **play each verse N times** (1, 2, 3, 5, 10; local storage `quranweb:verse-repeat`): `startVerse` sets
  `repeatsLeft`, and `onEnded` restarts the same verse before anything else, so it applies to surahs, juz and ranges alike.
  **Loop a range** of the surah (from/to verse, 2, 3, 5, 10 rounds or until stopped): module state like the juz scope
  (`getRangeLoop`/`setRangeLoop`), so it survives a page change inside the surah; `rangeStep` is the pure rule (after the last
  verse: the next round from the first verse, or stop). A range and a juz exclude each other; playing a verse by hand outside
  the range leaves it (inside it, the loop goes on, so pause and play keep it). Both are per browser and not in the account
  yet.
- **Memorization, step 2: hide the text** ("Hide while memorizing" in the same panel: nothing, the Arabic, or the translation
  with the transliteration; local storage `quranweb:memorize-hide`). `useHiding(surah)` gives each block that may be hidden
  its props: `data-hidden` (blurred by `globals.css`, not selectable), `role="button"`, and a tap, Enter or Space that shows
  that verse and hides it again. Which verses are shown is module state in `memorize.ts`, cleared when the mode changes; it
  is a check, not a setting. Works in both layouts; the Tafsir tab is never hidden. Space on a hidden block toggles it
  instead of starting the audio.
- **Browser tests in the repository** (`e2e/*.e2e.ts`, `playwright.config.ts`, CI job "Browser tests"): audio across pages and
  surahs, the end-of-surah mode, data saver, the fallback server, keyboard, lock screen, memorization (repeats, range, hiding),
  the reciter list, the 404s and the manifest. They run against the production build with `e2e/fixtures`, a small copy of the
  mirror (surahs 1, 2 and 112 to 114 with their tafsir, the surah list, a reduced `info.json`) made by
  `scripts/e2e-fixtures.mjs`: run it again when a test needs another surah. The Indonesian interface only (`locale: "id-ID"`;
  the browser's locale decides Accept-Language, `extraHTTPHeaders` did not), because the fixtures hold the Indonesian
  editions. Helpers in `e2e/helpers.ts` (`routeAudio`, `logPlays`, `playing`). `@playwright/test` is pinned exactly, so a
  local run can use the Playwright image of the same version (docs/development.md, "Browser tests").
- **Testing audio in a browser:** route `**/*.mp3` to a short generated WAV so `ended` fires at once, and read the requested
  URLs (`001001.mp3` is surah 1, verse 1) to see the order. `page.waitForFunction` does not work here (the CSP blocks it and
  the error is easy to swallow): poll with `page.evaluate` in a loop instead.

### Installable app (no offline yet)

- **`src/app/manifest.ts`** (served as `/manifest.webmanifest`): name, description and `lang` in the reader's language (per
  request, from Accept-Language; a browser does not always send cookies with it), `display: standalone`, start at `/`, and three
  PNG icons in `public/icons/` (192 and 512 with rounded corners, and a full-bleed maskable 512 with the logo inside the 80 %
  safe zone). The root layout adds `appleWebApp` (iPhone "Add to Home Screen") and a `theme-color` per colour scheme (the
  page background of each theme; it follows the device's scheme, not a theme chosen on the site).
- **Icons** (`src/app/favicon.ico`, `icon.svg`, `apple-icon.png`, `public/icons/*.png`) are the logo of `Logo.tsx` in cream and
  gold on the primary colour. Until 2026-11-19 `favicon.ico` was still the Next.js default. There is no image tool on the
  server: they were rendered from the SVG with Playwright (`locator.screenshot({ omitBackground: true })`), and the `.ico`
  is three PNGs (16, 32, 48) in an ICO container. Redraw all of them together if the logo changes.
- **No service worker**, so nothing works offline yet: Chromium no longer needs one to offer installing
  (`Page.getInstallabilityErrors` reports none). Offline reading is the next step of public issue #46 and needs a decision on
  what is kept (text only, or audio too, which is large) and a CSP `worker-src`.

### Mushaf pages (public issue #61, in progress)

The 604 pages of the printed Madinah mushaf come as a second way to cut the text, next to our 10-verse pages; the plan, the
owner's decisions (addresses `/mushaf/50` and `/surah/2/page/3`, 10-verse pages stay the default) and the order of the
pull requests are in `ROADMAP.md`, phase 5. Step 1 is in: the page table. Like the juz, it is not ours: `info.json` of
fawazahmed0 has it (`pages.references`, page, first and last verse), the provider gives it as `mushafPages()`, and
`getMushafPages` in the service checks it (`quran/mushaf-pages.ts`) before use. The juz and the pages share one check
(`checkRanges` in `quran/ranges.ts`: the right count, numbered in order, starting at 1:1, every range right after the
previous one, every verse real, ending at the end of surah 114). A page can span surahs (page 604 holds 112 to 114).
`mushafPageOf` finds the page of a verse (binary search, `rangeOf`). Nothing in the interface uses them yet.

### Paging of long surahs

A surah is shown 10 verses at a time (`PAGE_SIZE` in `src/lib/pagination.ts`), so Al-Baqarah
is 29 pages instead of one very long scroll.

- **The page is in the URL** (`/surah/2?page=3`): `clampPage` makes anything unusable page 1
  and anything past the end the last page. The page component builds only that page's verses
  (`getSurahView(..., { from, to })`), so the HTML shrinks from about 2 MB to about 230 KB for
  Al-Baqarah. The providers still return and check the whole surah on the server.
- **Links to a verse carry the page** (`verseHref` in `anchors.ts`, used by "continue reading",
  bookmarks, progress and copy link). A hash that points to a verse on another page (an old
  `#ayat-N` link, a shared link, a hand-edited URL) is sent to the right page by an effect in
  `SurahReader`; the jump menu lists every verse of the surah and navigates when needed.
- **Audio auto-advance** continues across a page boundary: at the end of the last verse of a
  page the reader goes to the next page and starts the next verse (`playOnArrival`). The
  `<audio>` element stays mounted, so the browser still allows playback. The tab (Reading or
  Tafsir) and the settings also survive a page change.
- The Bismillah is shown on page 1 only, and a surah of 10 verses or fewer has no pagination.

### Sign-in (OIDC)

Optional and off by default: reading never needs an account (`src/lib/auth/`, `src/app/api/auth/`).

- **Our own provider.** Sign-in is OpenID Connect against our authentik instance (the workspace
  repository `udienz/claude-project` documents it in `repos/auth/README.md`), whose login source is
  Google. The app never talks to Google. One authentik application per environment (`quranweb`,
  `quranweb-qa`), confidential client, authorization-code flow with PKCE S256.
- **Library: Better Auth** with its Generic OAuth plugin (`create.ts`), sessions in our SQLite database
  through `node:sqlite`. In version 1.7 the provider is used through the core endpoints
  (`POST /api/auth/sign-in/social` with `provider: "authentik"`, `GET /api/auth/callback/authentik`), not
  through `sign-in/oauth2` as older documentation says. The callback path is the one registered in authentik.
- **Identity is the token's `sub`**, stored as `account.accountId` (authentik "hashed user ID": a hex digest, not
  an email, stable when the email changes). `account.accountLinking` is off and the email is unique, so a
  different `sub` with an existing email fails instead of merging into that account. The ID token is always
  verified against the issuer's keys (`requireIdTokenVerification`). The library stores the provider's tokens
  from the last sign-in in `account` (ID token, access token, scope): the ID token is
  used only as `id_token_hint` on sign-out, the access token is not used for anything. The privacy page lists them.
- **Disabled accounts** (`user.disabledAt`, set by the admin page in step 7) cannot get a session
  (`databaseHooks.session.create.before`). `user.lastSeenAt` is updated at each sign-in.
- **Origin checks are switched on explicitly** (`advanced.disableOriginCheck: false`): the library turns them
  off by default when `NODE_ENV` is `test`, which hid the redirect and CSRF behaviour from the tests.
- **Tables** are migration 2 (the library's `user`, `session`, `account`, `verification` with their own column
  names and types, plus `disabledAt` and `lastSeenAt` on `user`); a test asks the library whether anything is
  missing, so a library upgrade that needs a new column fails the tests. The tables of migration 1 (`users` with
  `google_sub` and the data tables that point to it) were never used and are dropped by migration 5 (2026-11-19, three
  releases after they shipped), which first checks that all six are empty and otherwise fails and rolls back, so the
  deploy keeps the previous image and no row is lost.
- **The account menu** (`AccountMenu`) is a client component that reads the session through
  `authClient.useSession()` in a `<Suspense>` in the header, so pages stay cache-friendly and the layout never reads
  the session cookie. It is rendered only when sign-in is configured. After sign-in the reader returns to the page they came from
  (the callback URL must be a path on this site).
- **Sign-out ends the authentik session too.** The library's Generic OAuth plugin finds authentik's
  `end_session_endpoint` in discovery, and `POST /api/auth/sign-out` answers with that URL (`redirect: true`), which
  the client follows. `postLogoutRedirectURI: "/"` makes authentik send the reader back to our home page; without it the
  reader ended on `auth.udienz.web.id` (seen on QA and production, 2026-11-19). authentik 2026.8 only redirects back to
  a URI registered on the provider as a **Logout** redirect URI (`BETTER_AUTH_URL` plus `/`, strict) and only when
  `id_token_hint` is sent, which works because the library keeps the ID token in `account.idToken`.
- **Configuration** is all-or-nothing (`readAuthSettings`): all of `BETTER_AUTH_URL`, `AUTH_ISSUER_URL`,
  `AUTH_CLIENT_ID`, `AUTH_CLIENT_SECRET`, `BETTER_AUTH_SECRET` and `QURAN_DB_PATH`, or none (sign-in off, the
  route answers 404). A half configuration stops the start. On the servers they come from
  `/etc/quranweb/<env>.env` (`deploy.sh` passes it with `--env-file`); never put them in git.
- **Tests** run the whole flow against a fake OIDC provider (`fake-oidc.ts`: RS256 tokens, PKCE check, hashed
  `sub`): sign-in, same account on repeat, changed email, same email with another `sub`, wrong audience,
  disabled account, sign-out, CSRF, open redirect. Never use real credentials in tests.
- **Security headers** (CSP, `nosniff`, `Referrer-Policy`, `X-Frame-Options`, `Permissions-Policy`) are set for
  every response in `next.config.ts`. The CSP allows inline scripts and styles (Next.js and the theme script need
  them) and https audio; a nonce-based policy would make every page fully dynamic.
- **Cloudflare Web Analytics** (the owner's choice, 2026-11-19: internal traffic figures only). Cloudflare adds its beacon to
  every page of both domains (`static.cloudflareinsights.com/beacon.min.js`, which reports to `/cdn-cgi/rum` on our own domain);
  the CSP allows that one script host and nothing else of Cloudflare's. Before that the CSP blocked it, with a console error on every page.
  The privacy page ("Visitor statistics"), both READMEs and the CSP describe the same thing: change them together, and never
  add another analytics or tracking tool without updating the policy in every language first.

### Syncing reading data (signed in)

Local first: the browser copy is always usable, and signing in only adds a copy on the server.

- **One document per account** (`account_data`, migration 3): the same version-2 JSON the browser keeps,
  validated by `parseUserData` and merged by `mergeUserData`, so server and browser cannot disagree about the
  format or the merge rule. Chosen over separate tables because the whole state is small (about 3 MB at the
  schema limits) and is exchanged in one request; it replaces the four-table plan in `PHASE3.md`.
- **API** (`src/lib/sync/api.ts`, route `/api/me/state`): `GET` returns the account's data, `PUT` merges the
  device's data into it in one `BEGIN IMMEDIATE` transaction and returns the merged result, so one request both
  pushes and pulls. Needs a session; a disabled account gets 403 even with a session that already exists. A `PUT`
  must come from this site (`Origin`), be JSON and be at most 4 MB (a reverse proxy in front must allow a body that
  size on this path, for example nginx `client_max_body_size 4m`). Bad data is a 400 and nothing is stored, and so is a PUT
  whose merge with the stored data would go over the schema limits (each side valid, the union not). Tombstones
  older than 90 days are dropped on each exchange.
- **Browser** (`src/lib/sync/engine.ts`, `client.ts`, used by `AccountMenu`): sync once when the reader is known, about
  2 s after a local change, when the tab is hidden or shown, and when the connection returns. A failure never changes
  the local data (a "!" shows in the menu) and the next trigger retries.
- **Shared computers:** the browser remembers which account its data was last synchronised with
  (`quranweb:sync-owner`). A different reader signing in never sends that data: it is dropped from the browser and
  the new reader starts from their own account. Data from before any sign-in (no owner) is merged in. Known cost:
  changes the previous reader made offline and never synced are lost when another reader signs in.
- **Signing out asks whether to keep the reading on this device** (`signOutOfAccount` in `sync/sign-out.ts`; `AccountMenu`
  shows "remove from this device", first and focused, and "keep on this device", with a hint to remove it on a shared
  computer; the owner's choice, 2026-11-19). Both send pending changes first. Remove then empties `quranweb:user`, forgets the
  owner and signs out; keep only signs out. Before, the account's whole document (notes from other devices too) always stayed
  for the next person at a shared computer, and their changes went to the account when its owner signed in again. If the
  pending changes cannot be sent, nothing is removed and the reader stays signed in, with a message. While a removal runs
  (and after it succeeds) the sync hook neither starts nor saves. The privacy page says so.
- **Bookmark collections** (`collections` in the user data, `BookmarkList` on `/my-reading`): named groups, at most 50, names up
  to 40 characters; a bookmark is in at most one (`collectionId`). Collections merge by id, newest change wins, removal is a
  tombstone; moving a bookmark is a change of that bookmark. Removing a collection keeps its bookmarks, which then show as having no
  collection (`collectionOf` ignores a removed collection), so the merge never has to touch bookmarks. Works without an account too.
- **Daily goal and khatam progress** (`goal`, `activity`, `DailyGoal` on `/my-reading`): the goal is verses per day (0 = off,
  newest setting wins). `activity` counts verses marked as read per local day **per device** (`quranweb:device`, a random id);
  each device only raises its own count, so copies merge by the larger count per device and a day's total is the sum over
  devices (a G-counter: reading on two devices adds up, syncing twice never counts twice). Counting happens in
  `userDataActions.toggleReadUpTo` (newly marked verses only; unmarking never subtracts). 120 days are kept. The streak is the
  run of days that reached the goal, ending today or, while today is open, yesterday. Khatam progress is the sum of the
  progress marks out of 6,236 verses.
- **Choices follow the account** (editions and reciter, interface language, layout): the cookies `qw-sel` and `qw-lang` stay the
  source the server renders from, so readers without an account work as before. An explicit choice (the settings panel, the
  language menu) is also recorded in the user data as `choices.selection` / `choices.locale` with its time, merged newest-first
  per kind like any item. After each sync `cookieUpdates` (`sync/choices.ts`) writes the account's choices to this browser's
  cookies when they differ, then refreshes the page. A cookie that was never chosen on this device has no time and is not
  synced, so a new device cannot overwrite the account's choices with its defaults. The theme and text size are
  recorded as `choices.theme` and `choices.fontSize` the same way, but live in local storage: after a sync
  `displayUpdates` (`display.ts`) applies the account's values in place, with no page refresh. Display toggles stay per browser.
- **Tests:** API and merge behaviour against a temp database with the fake provider (`sync.test.ts`); the browser
  side with fakes (`runSync`). For two real devices, run the built image with the fake provider (its `/__user?seed=`
  endpoint switches the reader) and drive two browser contexts.

### Account, export, deletion and privacy

- **`GET /api/me/export`** downloads one JSON file: the account details (email, name, creation date) and the reading
  data in the same envelope as the backup on `/my-reading`, so the file can be imported there. **`DELETE /api/me`**
  (body `{"confirm":"delete"}`, from this site, JSON) signs the reader out and deletes the account **at once and for
  good**: the `user` row goes and, by foreign-key cascade, so do the sessions, the sign-in link and `account_data`.
  New tables that hold a reader's data must reference `"user"(id)` with `ON DELETE CASCADE`, or deletion misses them.
  Backups age out within 30 days; the privacy page says so.
- A **`GET` route handler is prerendered at build time under Cache Components** unless it reads runtime data: a handler
  that only passes `request` on can get the 404 of a build without sign-in baked in. `export/route.ts` calls
  `connection()` for that reason; do the same in any new `GET` handler that depends on the session.
- **The session stores no IP address or browser type.** Rate limiting still sees the IP while the request runs, but the
  `session.create.before` hook nulls `ipAddress` and `userAgent` before the row is written (turning off IP tracking in
  the library would also turn off its rate limiting). The privacy page promises this, so keep a test on it.
- **Privacy page** (`/privacy`, text in the `privacy.*` messages, both languages) and the **Account section** of `/my-reading`
  (`AccountSection`: download, delete with a confirmation step, link to the policy). After deletion the copy in the
  browser stays and `clearOwner()` makes it count as data from before any sign-in, so signing up again merges it.
- **Who to contact** comes from `PRIVACY_CONTACT_NAME` and `PRIVACY_CONTACT_EMAIL`, never from git (this repository is
  public). They are GitHub variables or secrets (the workflows read `vars.X || secrets.X`; the page shows them, so they are not sensitive, but a secret works too): the deploy workflows pass each one
  base64-encoded to `scripts/deploy.sh` (`PRIVACY_CONTACT_*_B64`), which decodes it and gives it to `docker run -e`, so no
  character in a name can change the ssh command line (`scripts/deploy-contact.test.sh` checks that, CI runs it). A value
  in `/etc/quranweb/<env>.env` is overridden by them. Without them the page says the contact is not set up yet.
- When the policy text changes, change both languages in the same commit and check it still matches what the code does
  (what is stored, cookies, recipients, retention).

### Admin (accounts only)

- **Who:** the signed-in readers whose **verified** email is in `ADMIN_EMAILS` (comma-separated, case-insensitive) in the
  server environment. It is never written in git or in tests (tests use `boss@example.test`). Unset means no admin.
  The check is on the server for every request (`requireAdmin`, and the page itself), by the email of the session.
- **What:** `/admin` lists accounts (name, email, created, last sign-in, status) and the recent actions, and can disable,
  enable or delete an account (`POST /api/admin/users/<id>` with `{"action":"disable"|"enable"|"delete"}`). It never
  selects or shows reading data and has no way to touch Qur'an content. Disabling deletes the account's sessions at
  once; deleting is the same permanent deletion as a reader's own (`deleteAccount`). An admin cannot act on their own
  account (409), so a slip cannot lock everyone out.
- **Anyone else sees a 404:** a visitor or a reader who is not an admin gets the not-found page from `/admin` and a 404
  from the API, so the page is not advertised. There is no menu link; the admin opens `/admin` directly.
- **Audit log:** every action is a row in `admin_audit` (migration 4: time, admin email, action, target account id). It has no
  foreign key, so it outlives a deleted account. The privacy page tells readers that the operator sees this list.
- **Rows from `node:sqlite` have a null prototype**, which React refuses to pass from a server to a client component
  (`Only plain objects ... can be passed`); copy them into plain objects first (`plain()` in `admin/server.ts`). A unit
  test checks it, and this was only caught by a browser run, so keep running one for pages that pass database rows down.

### Hardening (rate limits, headers, load)

- **Two limiters.** The auth library limits the sign-in paths per address and path (`rateLimit` in `create.ts`: 10 sign-in
  starts, 20 callbacks and 300 session checks a minute, 100 for anything else). Our own routes use `src/lib/ratelimit.ts`
  (in memory, one process): 240 requests a minute per address for `/api/me` and `/api/admin`, and per account 60 syncs,
  6 exports, 5 deletes and 60 admin actions. Over the limit the answer is 429 with `Retry-After`. The library only rate
  limits in production by default; it is switched on explicitly, and tests that sign in many times pass
  `{ rateLimit: false }` to `createAuth` (`ratelimit.test.ts` runs it on).
- **The client address** is `cf-connecting-ip` (Cloudflare proxies both domains, and nginx passes the header on), else an
  `x-forwarded-for` with a single address. A header with a chain of addresses is not trusted, because a client can write
  the first one; with no trusted address the library falls back to one shared bucket per path, which is safe but shared by
  everyone, so **check that Cloudflare's header reaches the app** if sign-ins start answering 429 for everybody.
  The origin is reachable without Cloudflare, so the header can be forged there; that only lets a caller choose their own
  bucket, and the per-account limits still hold.
- **Headers** added here: `Strict-Transport-Security` (one year, without `includeSubDomains` or preload, which are the
  owner's decision) and `Cross-Origin-Opener-Policy`, next to the earlier CSP, `nosniff`, `Referrer-Policy`,
  `X-Frame-Options` and `Permissions-Policy`.
- **Load check:** `scripts/load-test.mjs` signs in 100 fake readers and syncs 200 bookmarks each against a running app that
  uses the fake provider (see the header of the script; never against a real provider or production). On 2026-11-18, Node 26
  in Docker, one process: with a realistic pace (a sync every 5 to 10 s per reader, 10 a second in all) p50 25 ms, p95 53 ms,
  no errors; as a stress run (a sync every 0.5 to 1 s per reader, 81 a second) p50 402 ms, p95 831 ms, no errors, 195 MB.
  The first run of the realistic pace showed a p95 of 1.3 s only because all readers started in the same second; the
  script now staggers the start.

### Rendering and configuration

- **A database exists for accounts** (phase 3, `PHASE3.md`; sign-in sessions and, for signed-in readers,
  their synced reading data). Without an account, reading data never leaves the browser. The account database is SQLite through the built-in
  `node:sqlite` (`src/lib/db/`, chosen over `better-sqlite3` in a spike: no dependency and no
  native module in the standalone build; Node documents it as a release candidate, so re-check
  it on each Node upgrade). `openDatabase` sets WAL and foreign keys and applies the numbered
  migrations in `migrations.ts`, each in a transaction. A migration is never edited after it ships
  and is additive only (rollback runs the previous image against a migrated database; a destructive
  change takes two releases); an older build started on a newer database logs a warning and carries on (that is the rollback). `src/instrumentation.ts`
  opens the database at server start when `QURAN_DB_PATH` is set, so a deploy that cannot use it
  fails and rolls back; with the variable unset the app runs as before. `deploy.sh` mounts
  `/srv/quranweb-db/<env>` (mode 700, uid 1001) at `/db` and never replaces it. Backups, restore and
  the systemd timer, and the encrypted off-server copy (a private GitHub repository written with a deploy key) are in `docs/backup.md`.
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
| `QURAN_API_URL` | `https://equran.id/api/v2` | Base URL (or local directory) of an EQuran.id-format API (point it to our mirror) |
| `QURAN_AUDIO_URL` | `https://cdn.equran.id` | Base URL of the EQuran.id audio |
| `QURAN_ISLAMIC_AUDIO_URL` | `https://cdn.islamic.network` | Base URL of the AlQuran.cloud audio CDN |
| `QURAN_FAWAZ_URL` | jsDelivr, then raw GitHub | Base URL (or local directory) of a fawazahmed0-format API (point it to our mirror) |
| `QURAN_QURANENC_URL` | the live QuranEnc API | Base URL (or local directory) of the QuranEnc copy (`/data/quranenc` on the servers) |
| `BETTER_AUTH_URL`, `AUTH_ISSUER_URL`, `AUTH_CLIENT_ID`, `AUTH_CLIENT_SECRET`, `BETTER_AUTH_SECRET` | none | Sign-in (all five, plus `QURAN_DB_PATH`, or none). `BETTER_AUTH_SECRET` is at least 32 random characters |
| `ADMIN_EMAILS` | none | Comma-separated emails of the admins (verified sign-in emails); unset = no admin page |
| `PRIVACY_CONTACT_NAME`, `PRIVACY_CONTACT_EMAIL` | none | Shown on the privacy page as the contact for questions about personal data |
| `QURAN_DB_PATH` | none | SQLite file of the account database (`/db/quranweb.db` on the servers); unset = no database |
| `QURAN_CONFIG` | none | Path of a JSON file that replaces the built-in source registry (must be readable by the container user, uid 1001) |

## Project structure

```
src/
  app/
    layout.tsx                 shell: header, theme, fonts (@fontsource), footer
    globals.css                colour tokens (light/dark), Amiri font for Arabic
    page.tsx                   home: hero, "continue reading", grid of 114 surahs
    my-reading/page.tsx        "My reading": last read, progress, bookmarks, backup
    settings/page.tsx          settings: theme and text size, reading settings, account
    privacy/page.tsx           privacy policy (English and Indonesian)
    about/page.tsx             about the site, and the sources, credits and licences of every edition and reciter
    admin/page.tsx             admin: accounts and audit log (404 for everyone else)
    not-found.tsx              404 page (translated)
    manifest.ts, favicon.ico, icon.svg, apple-icon.png   installable app: manifest and icons (more sizes in public/icons/)
    surah/[number]/page.tsx    surah list + settings (left) and reader (right)
  components/
    SurahReader.tsx            surah header, Reading/Tafsir tabs, jump to verse, audio
                               (one <audio>, auto-advance, falls back through URLs),
                               last-read tracking, list of sources
    VerseCard.tsx              one verse: text, bookmark, mark as read, note, copy (VerseActions, NoteEditor)
    MushafView.tsx             mushaf layout: running Arabic block, numbered translation column, verse action bar
    BookmarkList.tsx, DailyGoal.tsx   bookmark collections and the daily goal on My reading
    SettingsPanel.tsx          display toggles and edition/reciter choice (cookie)
    ReciterPicker.tsx          the reciter list: best known first, search in Latin and Arabic
    TranslationPicker.tsx      the translations: chosen ones as removable labels, a language list, that language's editions
                               (`quran/translation-groups.ts`; language names from `i18n/languages.ts`, the catalogs first,
                               then `Intl.DisplayNames`, so a new language of translations needs no new message)
    AudioSection.tsx, PlaybackModeSelect.tsx   the Audio section of the settings page; the end-of-surah mode select (also in the surah header)
    MemorizePanel.tsx          memorization: play each verse N times, loop a range of verses (`lib/memorize.ts`)
    AudioQualitySelect.tsx     standard or data-saver audio (this device only; `lib/audio-quality.ts`)
    SurahSidebar.tsx, SurahGrid.tsx   surah list and search
    Pagination.tsx             page links and "Verses 11-20 of 286"
    ContinueReading.tsx, MyReading.tsx
    LanguageMenu.tsx           language menu in the header and the language list on /settings (cookie qw-lang); useDismiss.ts closes dropdowns
    LanguageFlag.tsx           the flag beside each language in the menu (country-flag-icons, only the flags in use)
    AccountMenu.tsx            account dropdown in the header: My reading, sign in / sign out (only when sign-in is on)
    AccountSection.tsx         download and delete account, or sign in, on the settings page
    DisplayControls.tsx, DisplaySection.tsx   theme choice and text size controls (hooks on display.ts)
    AdminUsers.tsx             accounts and audit log for the admin
    PrefsProvider.tsx, ThemeToggle.tsx, Logo.tsx
  lib/
    quran/                     modular data sources (see above)
      types.ts, provider.ts, service.ts, sources.ts, transport.ts, index.ts, labels.ts
      providers/equran.ts, providers/fawazahmed0.ts, providers/quranenc.ts, providers/islamic-network.ts
      ayah-number.ts, reciter-order.ts   verse number in the whole Qur'an; order and search of the reciter list
    userdata/schema.ts, store.ts   reading data (pure logic, browser store)
    db/                        SQLite (node:sqlite): open, migrations, tests on temp files
    auth/                      OIDC sign-in (Better Auth): settings, options, client, fake provider for tests
    sync/                      account sync: server (merge, store), API handler, engine, browser hook
    account/                   export and deletion of an account (API handler, tests)
    admin/                     admin allowlist, account list, actions and audit log (API handler, tests)
    privacy.ts                 privacy contact from the environment
    ratelimit.ts               in-memory rate limiter and client address for our own API routes
    selection.ts               parse/serialize the selection cookie
    layout.ts                  the layout choice (mushaf or cards, cookie qw-layout)
    display.ts                 theme and text size: steps, storage, the no-flash head script, account updates
    playback.ts, audio.ts      audio at the end of a surah or a juz (stop, repeat, next); the one shared <audio> element
    quran/juz.ts               checks the table of the 30 juz that a source gives
    quran/mushaf-pages.ts      checks the table of the 604 mushaf pages; the page of a verse
    quran/ranges.ts            the shared check of a table of verse ranges (juz, pages) and the range of a verse
    i18n/                      config.ts (locales, negotiation), translate.ts (t, tn, plurals),
                               server.ts, client.tsx, messages/{en,id,types,index}.ts
    anchors.ts, cookies.ts     verse and page links (incl. legacy #ayat-N), cookie helper
    pagination.ts              page size, page of a verse, clamping, which page numbers to show
  **/*.test.ts                 vitest tests, no network
scripts/
  deploy.sh                    server deploy (see CI and deployment)
  mirror-nginx.conf.example    nginx locations for the data mirrors
  sync-mirror.mjs              copy the EQuran.id text to static JSON
  backup-db.sh, restore-db.sh, db-tool.mjs, backup-db.test.sh   encrypted database backup (docs/backup.md)
  deploy-contact.test.sh, load-test.mjs   test of deploy.sh's contact variables; load check with fake readers
  readme-screenshots.mjs       take the how-to screenshots of the READMEs (docs/screenshots/<lang>/how-*.png)
  upload-git.sh, upload-git.test.sh   off-server copy of the backups to a private GitHub repository (in use, docs/backup.md)
  update-contributors.mjs, contributors-lib.mjs   write CONTRIBUTORS.md from the GitHub API (the logic is tested in contributors.test.mjs)
  upload-rclone.sh, rclone-conf-from-blob.py, upload-rclone.test.sh   alternative copy to Google Drive (not in use)
deploy/systemd/                backup service and timer units
config/sources.example.json    example source registry for QURAN_CONFIG
docs/screenshots/              images used by the READMEs
docs/previews/                 pictures of planned features in pull requests (mushaf page 42 for #61), not the real interface
docs/development.md            running, Docker, data sources, environments, deployment
docs/DESIGN.md                 the visual design system (colours, type, components, do's and don'ts, agent prompts), measured
                               from production on 2026-11-19; evidence in docs/design-tokens.json. Update it with the UI
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
bash scripts/backup-db.test.sh   # backup/restore round trip (needs age; CI runs it)
bash scripts/deploy-contact.test.sh   # the privacy contact part of deploy.sh (CI runs it)
bash scripts/upload-rclone.test.sh    # Google Drive upload and retention (needs rclone; CI runs it; not in use)
bash scripts/upload-git.test.sh       # off-server copy to the private GitHub repository (CI runs it; in use)
bash scripts/docker-smoke.sh          # build the image and check it starts as uid 1001 and serves its files (CI runs it)
npm run test:e2e          # browser tests (e2e/*.e2e.ts, Playwright) against the build; needs `npm run build` first (CI runs it)
node scripts/update-contributors.mjs  # regenerate CONTRIBUTORS.md from the GitHub history (--check: only say if it is stale)
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

Base images (`node:26-alpine`) are pulled from Docker Hub. In an environment with a
limited network allowlist the pull can fail even though the Dockerfile is valid.
The project runs on the Node LTS that is current when it is upgraded: Node 26 ("Lithium", LTS since
October 2026) in the Dockerfile and CI, and `engines` allows Node 24 or newer (both were tested:
`npm ci`, lint, the tests and the build). Upgrade again before the LTS you use reaches its end of life.

## CI and deployment

- `.github/workflows/ci.yml`: lint, `npm test` and `npm run build` (which includes the
  type check) on every push to `master` and every PR.
- **The Docker image is checked in CI** (job "Docker image starts", `scripts/docker-smoke.sh`): it builds the image, starts
  it as the servers do (runtime user uid 1001), and checks that `/privacy`, the manifest and the icons answer 200 and that the
  log has no error. With `STRICT_PERMISSIONS=1` (CI) it first removes the "others" permission bits from the checkout, like the
  servers' umask 007. A Docker build in CI was dropped on 2026-11-17 (it had never failed) and brought back after a QA deploy
  failed on a `public/` directory the runtime user could not read (PR #71); the script fails on exactly that (checked by
  reverting the fix). Run it locally with `bash scripts/docker-smoke.sh` before merging a Dockerfile or `public/` change.
- `.github/workflows/deploy-qa.yml`: run by hand (`workflow_dispatch`, not on push) deploys to QA over SSH with
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
| QA | https://quranweb-qa.udienz.web.id | `quranweb-qa`, `127.0.0.1:3000` | by hand from `master` (Run workflow) |
| Production | https://quranweb.udienz.web.id | `quranweb-prod`, `127.0.0.1:3002` | from release tags |

Both run on one VM behind nginx with Let's Encrypt (certbot); DNS goes through
Cloudflare. Do not write the server IP in this public repository: the domains are
proxied.

### Data mirrors

Both domains serve static JSON mirrors from `/srv/quranweb-mirror` (nginx locations in
`scripts/mirror-nginx.conf.example`) as public APIs. The containers do not call them over
HTTP: `deploy.sh` mounts the directory read-only at `/data` and sets `QURAN_API_URL=/data/api/v2`,
`QURAN_FAWAZ_URL=/data/quran-api` and `QURAN_QURANENC_URL=/data/quranenc`, so the app reads the files directly (a deploy
fails, and rolls back, if one of the three directories is missing). `quranenc/` is private: nginx does not serve it. The two mirrors are:

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
audio comes from `cdn.equran.id` and `cdn.islamic.network` (the CSP allows any https audio).

Use is non-commercial: the data is not sold and EQuran.id, Kemenag RI and the original
sources of each edition are credited in the UI: the About page (`/about`) lists the source, credit and licence of every
edition and reciter in the catalog, and the footer of every page (About · Privacy) links to it.
Keep that footer link: the credit must stay one click away from every reading page.

### Known limits

- `/surah/<invalid>` answers **404** since 2026-11-19: `src/proxy.ts` checks the number before rendering (`surahFromSegment`,
  shared with the page) and rewrites anything else to a path that does not exist, so Next.js serves the translated
  not-found page with status 404. Without it the page's own `notFound()` came after streaming had started, with status 200
  (Cache Components does not support `dynamicParams = false`).
- The surah list is fetched on every request (from our mirror, so it is cheap).

## Working rules

- Do not add a panel or feature for editing surahs, verses, translations or tafsir:
  Qur'an content only comes from verified sources through the sync scripts and PRs.
  User management (view, disable, delete accounts) may be added together with the
  account feature.
- Non-trivial changes go through a PR, not a direct push to `master`.
- **Licence and community files.** The code is MIT (`LICENSE`, `"license"` in `package.json`; the owner's choice, 2026-11-19: free
  to modify, no duty to publish changes, no liability); the content (Qur'an text, translations, tafsir, recitations) is not
  covered and keeps its sources' terms (READMEs and About say so). `SECURITY.md` sends reports to GitHub's private vulnerability
  reporting, and `CODE_OF_CONDUCT.md` (Contributor Covenant 2.1) to the same private channel with "Conduct:" in the title: no
  personal email in this public repository. The issue forms are in `.github/ISSUE_TEMPLATE/`; the "Report a translation
  mistake" link in the language menu opens the `translation_mistake.yml` form with the language filled in.
- **`CONTRIBUTORS.md` is generated**, never edited by hand: after merging a contribution from someone else (code or a
  translation), run `node scripts/update-contributors.mjs` and commit the result. The script lists the owner as
  maintainer, the people who changed each language catalog, and everyone with commits; it leaves out bots and the
  account GitHub wrongly attributes the early `Claude <noreply@anthropic.com>` commits to (`EXCLUDED_LOGINS`). A commit
  whose email GitHub cannot link to an account (the first Turkish translator's) is credited to the author of its merged pull
  request, and the owner counts as a language's translator only when `CODEOWNERS` names them for it.
- **One branch per task.** Start every task on a new branch named after the work (for
  example `source-registry`), from the latest `master`, or from the branch it depends on
  when the work is stacked on an open PR. Never reuse a merged branch or its name: once its
  pull request is merged the branch is deleted and the next task gets a new one. Open the
  PR as a draft and keep it a draft until it is ready.
- **Two READMEs.** `README.md` is English and `README.id.md` is Indonesian. Any change
  to one MUST be made in the other in the same commit (sections, tables and commands
  stay aligned). Before committing a change that touches a README, check that both
  files are updated, and keep the language links on the second line of each file.
- **The READMEs are for readers**, not developers: what the site does, privacy, sources, how to
  give feedback. Technical material (setup, Docker, data sources, deployment) goes in
  `docs/development.md` (English only).
- Screenshots in `docs/screenshots/en/` and `docs/screenshots/id/` show the real UI in each
  language (English README and Indonesian README respectively); retake both sets when the
  UI changes noticeably. The `how-*.png` pictures of the "How to" section come from
  `node scripts/readme-screenshots.mjs [base URL]` (production by default; sample reading data in local storage, nothing
  of a real reader). It needs a Chromium that Playwright can start: on a machine without one, run it in the Playwright
  image of the pinned version, as for the browser tests. The other pictures are still taken by hand. When a step in the
  "How to" section changes (a label, where a setting lives), change it in both READMEs.
- **Language of the repository.** Everything is in English: code, identifiers, comments,
  error messages and logs, test names, scripts, workflows, configuration and documentation.
  The only exceptions are the Indonesian interface strings (`messages/id.ts`),
  `README.id.md`, and data that is Indonesian by nature (edition text, `LocalizedText.id`
  values, API field names such as `nomor` that belong to a source). Commit messages and
  PR descriptions are in English too.
- **No hard-coded UI text.** A user-visible string goes into both message catalogs; error
  classes carry a code and an English message, and the UI maps the code to a translated
  message (see `UserDataError`).
