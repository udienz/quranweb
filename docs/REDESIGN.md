# Editorial Reading Experience Redesign

Status: in progress — first visual pass implemented; validation pending  
Branch: `redesign/editorial-reading-experience`  
Baseline: `master` at `e392df5f024c09f5b97ec9252470e8b96bb5a77e`

## Intent

Give QuranWeb a visual identity distinct from the familiar EQuran.id-style layout without rebuilding the application or changing its reading workflows. The direction is **Editorial / Reading Experience**: a calm digital reading room, with the Qur'an itself as the visual centre.

Working brand line: **QuranWeb — A Quiet Place to Read**.

This is a visual redesign, not a product or data-model redesign.

## Non-negotiable boundaries

- Preserve routes, query parameters, cookies, APIs, providers, selection IDs, user data, bookmarks, reading progress, audio behavior, tafsir, search and sharing behavior.
- Do not add any facility to edit Qur'an text, translations or tafsir. Content continues to come from the verified providers and their existing licence/credit paths.
- The global shell was out of scope in the first visual pass. The owner lifted that on 2026-11-24 (a reference mockup with a new header): the header's look (logo tile, wordmark, text navigation with an underline on the current page) may change, but `LanguageMenu`, `ThemeToggle`, `AccountMenu` and the search link keep their behaviour and their place.
- The interface already supports Indonesian, English and community translations in 25 locales. Preserve locale negotiation, RTL layout, message catalogs and translation behavior. Never replace localized UI strings with hard-coded copy.
- Preserve reader-controlled Arabic and Latin scale variables, the reader's Arabic font choice (Amiri or KFGQPC), tajweed colors, and the existing light/dark preference.
- Keep About, Privacy and Terms links available from every page; content credits must remain one click away.
- Use logical CSS properties and test RTL locales; do not assume left-to-right layout.
- Keep `docs/DESIGN.md` as the measured description of the current production design until the redesigned UI is actually implemented and measured. Do not overwrite it with a proposal.

## Visual direction

### Atmosphere

A quiet, bookish reading room: warm paper, a lighter reading surface, deep forest-green controls and restrained muted-gold details. Avoid pure-white reading canvases, generic dashboard styling, excessive ornament and heavy shadows.

### Initial palette proposal

| Role | Color | Intended use |
|---|---|---|
| Parchment | `#EDE4D2` | Main content-area background |
| Soft cream | `#F8F2E7` | Reading surface / verse canvas |
| Ink brown | `#3D3428` | Primary reading text |
| Deep forest | `#344C3D` | Reading controls, links and selected states |
| Muted gold | `#B49A68` | Small markers and restrained emphasis |
| Warm gray | `#807565` | Secondary reading metadata |

These are proposed content-area tokens, not replacements for the global shell tokens. The existing header, navigation and account/language controls remain on the established global theme in this phase. Dark-mode equivalents must be designed and checked before considering the palette complete.

### Typography

Typography is open for exploration. Do not assume the current families are locked, and do not replace them without checking script coverage, licensing, self-hosting, performance, Arabic shaping and the existing reader font preference. Arabic must remain highly legible for long sessions and must never be replaced with a geometric sans. Interface fonts must work across the 25 supported locales or fall back safely to system fonts.

## Page direction

### Homepage

- Give the page a clear editorial opening rather than a generic application hero.
- Keep search immediately discoverable and preserve the direct start-reading route.
- Present the daily verse as an editorial quotation with clear Arabic/translation hierarchy and an unobtrusive reference.
- Keep Continue Reading prominent for returning readers.
- Redesign the Surah index so it is recognizable as QuranWeb, while preserving search by number/name/meaning and all 114 destinations.
- Do not remove or hide existing capabilities merely to simplify the composition.

### Surah reading page

- Use a parchment-dominant content background and a slightly lighter cream reading canvas; no plain white reading page.
- Make the Arabic the visual centre, with proper RTL shaping, generous line height and reader-controlled scaling.
- Keep the translation directly associated with its verse and preserve the selected translation's language and direction.
- Use small, quiet verse markers; bookmark, audio, share, tafsir, memorization and other existing controls remain discoverable and functional.
- Make the audio player compact and visually integrated, using forest green rather than a large dashboard-like panel.
- Retain the existing surah sidebar and its collapse behavior on wide screens. It can be visually refined, but it must not disappear as a feature. On small screens retain the current responsive access to surah navigation and settings.
- Preserve both existing reading layouts (verse cards and printed mushaf), pagination and direct verse anchors.

## Implementation progress

- Added a scoped editorial palette to the Surah reader: parchment content area, warm-cream reading surface, forest-green chapter header, ink-toned reading text and restrained gold details.
- Applied the first homepage pass: forest-green hero, warm-cream daily-verse card and warm-paper Surah index cards.
- Added explicit styling hooks to the reader and verse cards. No routes, translations, data providers, reader state, audio logic or interaction handlers were changed.
- Global shell tokens remain unchanged. Arabic font families and scale variables remain untouched.
- Automated checks and visual review across themes, screen sizes and locales are still pending; this is not ready to merge.

- Reader polish (2026-11-24, after the QA review of PR #140): the surah heading is centred on the paper (number, revelation and verse count; Latin and Arabic names; meaning; a thin gold rule with one diamond), and every control sits in one deep-forest bar under it. The reading surface has a thin inner gold rule. Verse numbers are rings, not tilted tiles.
- Colour scope: `.editorial` (the header and the surah and mushaf pages) re-sets the shared tokens (`--card`, `--muted`, `--border`, `--primary`, `--primary-soft`, `--foreground`, `--muted-foreground`, `--gold`) to the palette, so the sidebar, pagination and inputs follow it without per-component rules; the old white panels, blue selected row and teal page numbers are gone there. Settings, My reading and About keep the teal theme for now. Warm Gray `#807565` is 4.05:1 on Soft Cream, so secondary text in the reader uses `#6b6152` (5.45:1) and the interface token is `hsl(36 12% 40%)`; gold text on the forest bar uses a lighter gold (4.7:1 or more).
- Header: a logo tile in deep forest, the wordmark, and text navigation (Al-Quran, Surahs with the surah count, About, and My reading and Settings when sign-in is off) with an underline on the current page (`NavLink`). The tagline and the mosque backdrop of the mockup are not built: a tagline needs a message in 25 catalogs, and the backdrop is the ornament the brief says to avoid.

- Home hero photograph: the hero is parchment with a photograph of an open mushaf (`public/images/quranweb-hero-mushaf.webp`, 1600 px, 96 KB; `-sm.webp`, 960 px, 42 KB, for widths under 1024 px, so a phone downloads only the small one). The heading, description, search and button stay real text, in the same order and with the same messages. The mushaf is always beside the heading, never under the button (the owner chose the layouts from mockups, 2026-11-24). Desktop, left to right: the photo is the hero's background on the right and a parchment gradient fades it into the page on the left. Desktop, right to left: the photo is a block on the left 57%, fading on its right edge. Under 1024 px: the photo is a block beside the heading and description, as tall as they are and bleeding to the hero's edge, and the search form and button sit under both on plain paper; in right-to-left it is on the left. The photo is never mirrored, because the Arabic on its pages would read backwards. In dark mode a forest scrim (desktop) or a brightness filter (blocks) dims it. It is a CSS background, so it takes no layout space. The bismillah calligraphy and halo that were in the hero are gone. The photograph is AI-generated (supplied by the owner); its text is not a Qur'an source.

## Implementation sequence

1. Add content-scoped design tokens and typography experiments without changing global shell tokens.
2. Apply the reading-page visual treatment while preserving all reader behavior.
3. Apply the homepage editorial hierarchy and distinct Surah index.
4. Review light and dark modes, mobile layouts, RTL, and long Arabic/translation content.
5. Run lint, unit tests, production build and relevant Playwright tests. Retake both English and Indonesian README screenshots against QA when the visual change is ready.
6. Only after the UI is implemented and verified, update the measured `docs/DESIGN.md` and `docs/design-tokens.json`.

## Acceptance criteria

- The homepage and reading page are visually distinct from the current production appearance.
- No change to routes, data sources, audio semantics, user data schema, account behavior or content attribution.
- Header, language selector, theme toggle and account menu behavior are unchanged.
- Indonesian and English are checked, along with at least one RTL locale and a non-Latin community locale.
- Arabic font selection, Arabic/Latin scale settings, tajweed, verse anchors, audio, share, bookmark and sidebar collapse still work.
- Light and dark modes both have intentional, readable contrast.
- Mobile and desktop layouts remain usable; no horizontal overflow on long Arabic or translated text.
