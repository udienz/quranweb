<!-- Revised 2026-11-24 for the editorial redesign ("QuranWeb -- A Quiet Place to Read"). This file is the single source of truth for the design: there is no other design document. The redesigned surfaces (the header, the home page, the surah and mushaf pages) were written from src/app/globals.css and the components and checked on QA; the per-element frequencies and pixel measurements of the 2026-11-19 production audit remain only where what they measure did not change. A full re-measure after release is listed in section 14. -->
<!-- Original extraction: 2026-11-19 | Source: https://quranweb.udienz.web.id | Pages: 5 | Framework: tailwindcss 4 | Format: v2. Values came from the computed styles of every visible element (light and dark) in production and from src/app/globals.css; see docs/design-tokens.json. -->
<!-- Generated with the design-md-generator method (https://github.com/jasonhnd/design-md-generator), extraction done with the project's own Playwright. -->

# Design System: QuranWeb

## 0. Brand Context

QuranWeb is a free reading site for the Qur'an: Arabic text, transliteration, translations, tafsir and verse-by-verse recitation, with an optional account that syncs reading progress.

**Design direction:** Editorial / Reading Experience, with the line *QuranWeb -- A Quiet Place to Read* (approved by the owner, 2026-11-24): warm paper, deep forest green, restrained muted gold, a calm reading surface, generous whitespace and little ornament. It is meant to look like QuranWeb and not like the familiar EQuran.id-style layout. The decisions and the work still open are in section 14.

Target audience: Indonesian readers first (the interface defaults to Indonesian), then English and Turkish readers. The layout has a phone version for every page. Secondary: people memorizing, who use repetition and hidden text.

**Brand personality:**
- Devotional (the Arabic text is set in `Amiri` at 36px with a 86.4px line, larger than any Latin headline on the page)
- Quiet (one brand colour, deep forest `#344c3d`, on parchment `#ede4d2`, soft cream `#f8f2e7` and a warm paper page `#f5f2eb`; muted gold `#b49a68` is small and rare)
- Bookish (`Space Grotesk` for titles, `Plus Jakarta Sans` for reading and for numbers, set with tabular figures so "036" and "36:1" line up)
- Patient (every interaction uses one 150ms transition, `cubic-bezier(0.4, 0, 0.2, 1)`; nothing animates on its own)

**Sources referenced:** the 2026-11-19 audit: `/`, `/surah/36`, `/settings`, `/my-reading`, `/about` on https://quranweb.udienz.web.id, in light and dark, desktop (1280px) and phone (390px). The redesign: `/` and `/surah/2` on QA, in light and dark at 1280, 820, 390 and 360px, and in Arabic (right to left).

## 1. Visual Theme & Atmosphere

QuranWeb's website is a printed mushaf on a reading desk in a quiet room: a parchment page, a soft-cream reading surface edged with one thin gold rule, and a block of Arabic bigger and more widely spaced than anything else on screen.

The canvas of a reading page is parchment `#ede4d2` around a soft-cream `#f8f2e7` reading surface; the page behind is the warm paper `#f5f2eb`, never white (in dark mode a night green, `#141c17`). Text is ink brown `#3d3428`. The one interactive colour and the one dark surface are deep forest `#344c3d`: links, the current page number, the selected surah and the play bar under the surah heading (a 135-degree gradient from `#344c3d` to `#2a4033`). Muted gold `#b49a68` appears as a hairline, a small diamond and the rings around verse numbers; it is never text on a light surface (2.42:1)., and the same palette runs through every page, Settings, My reading, About, Search and Privacy included.

The home hero is parchment with a photograph of an open mushaf: the heading, description and search are real text beside the photograph, never over it and never below a control (section 4, Home Hero).

Typography splits three ways by script and purpose. `Space Grotesk` carries identity (the "QuranWeb" wordmark at 20px weight 700 with -0.5px tracking, page titles at 24px 600). `Plus Jakarta Sans` carries the interface at 14px weight 500 and the translation at 15px with a 24.375px line. `Amiri` carries the revelation itself: 36px with an 86.4px line height (2.4), a ratio no Latin text on the site comes near.

The technique that defines the system is the pair of scale variables `--arabic-scale` and `--latin-scale`. Reading text never uses a fixed size; it is written as `calc(2rem*var(--arabic-scale,1))`, so the reader can enlarge Arabic and Latin separately (85% to 150%) without touching any label or button.

In the mushaf layout the Arabic takes the wider, right-hand column (3 parts to the translation's 2), at 36px against the translation's 15px. Most of the visual weight on a reading page belongs to the Arabic.

**Design Principles:**
- **Arabic first**: the Arabic text is the largest and most spacious element of every reading view; Latin text yields to it.
- **Paper and frame**: depth comes from cream surfaces on parchment, a 1px warm border and, on the reading surface, a thin inner gold rule; shadows stay small.
- **One calm colour, one small gold**: forest marks what can be acted on and carries the play bar; gold only decorates (hairlines, diamonds, verse rings) and marks the active tab.
- **Reader-owned scale**: reading text scales by the reader's choice through CSS variables; chrome does not.
- **The photograph supports the words**: it sits beside the heading, is never mirrored (the Arabic on its pages would read backwards) and never carries text of ours.

**Key Characteristics:**
- Parchment and soft cream -- `#ede4d2` around `#f8f2e7`, on the warm paper page `#f5f2eb`
- Ink brown text -- `#3d3428` (10.96:1 on soft cream); secondary `#72685a` (4.9:1)
- One interactive colour in the scope -- deep forest `#344c3d` (8.39:1 on soft cream)
- Play bar -- a forest pill (`linear-gradient(135deg, #344c3d, #2a4033)`) with a round gold button under the centred surah heading; the other controls are chips on the paper
- Arabic set larger than any heading -- `Amiri` 36px, line height 86.4px
- Translation in a reading measure -- 15px `Plus Jakarta Sans`, line height 24.375px (1.625)
- Verse numbers as thin gold rings, not tilted tiles
- A frame on the reading surface -- a 1px gold border at 45% and an inset rule at 35%
- Reader-controlled type -- `--arabic-scale` and `--latin-scale`, five steps from 85% to 150%
- Every state change in 150ms -- `cubic-bezier(0.4, 0, 0.2, 1)` on colour, background and border

## 2. Color Palette & Roles

One palette, set once in `:root` and `.dark` of `src/app/globals.css`, as HSL tokens (`--background`, `--foreground`, `--card`, `--muted`, `--muted-foreground`, `--border`, `--primary`, `--primary-soft`, `--gold`, plus `--hero-from` and `--hero-to`). Components use them through Tailwind (`bg-card`, `text-primary`, `border-border`) and carry no colour of their own, so a new page follows the palette by using tokens; nothing else has to change. The header, the home page, the surah and mushaf pages, Settings, My reading, About, Search and Privacy all use it.

### Palette (approved by the owner)

| Name | Hex | Token (light) | Role |
|---|---|---|---|
| Parchment | `#ede4d2` | `--reading-paper` (reader), `--home-paper` (hero) | The area around a reading surface; the hero |
| Soft Cream | `#f8f2e7` | `--card` `39 55% 94%` | Cards, panels, the reading surface, inputs |
| Ink Brown | `#3d3428` | `--foreground` `34 21% 20%` (`#3e3428`), `--reading-ink` | Primary text |
| Deep Forest | `#344c3d` | `--primary` `143 19% 25%` | Links, active page, selected state, the play bar, the main button |
| Muted Gold | `#b49a68` | `--gold` `39 34% 56%` (`#b59a69`) | Hairlines, diamonds, verse rings, the active tab (never small text on light) |
| Warm Gray | `#807565` | see below | Secondary text, **adjusted** |

Warm Gray `#807565` is 4.05:1 on soft cream and 3.58:1 on parchment, below AA for small text, so it is not used as text colour. Secondary text in the reader is `#6b6152` (`--reading-muted`: 5.45:1 on soft cream, 4.81:1 on parchment); in the shared token `--muted-foreground` it is `36 12% 40%` (`#72685a`: 4.90:1 on soft cream).

Other tokens: `--muted` `40 43% 88%` (`#eee5d3`, hover fills and tracks), `--border` `37 32% 78%` (`#d9cbb5`, every edge), `--primary-soft` `42 31% 87%` (`#e8e2d4`, the selected surah, the playing verse, chips). Dark values are in section 2.5. `--background` stays the warm paper `#f5f2eb` in light mode and is a night green, `#141c17`, in dark mode.

**Play bar, forest bar and hero**
- The play bar (`.surah-player`) and the forest bar (`.quran-reading__bar`, which holds the Memorize panel and the playing status) are `linear-gradient(135deg, #344c3d, #2a4033)`; the play bar is a pill with a 1px border of gold at 35% and a shadow of ink at 16%, the forest bar has a 24px radius and a gold border at 28%. Inside both `--gold` is the lighter `44 42% 65%` (`#cdb67f`), so small gold text and the active tab reach 4.73:1 on `#344c3d` and 5.65:1 on `#2a4033`; ink on the gold play button is `#17261d`. Other text on the bars is cream (white at 85% to 90%) with a 1px border of white at 15%.
- The hero is parchment with a 1px border of gold at 35%; its heading is ink brown, its description `#514536` (7.38:1), its eyebrow deep forest (7.40:1).

### Color Boundary Rules

- Deep forest is the only colour that means "you can act on this"; gold decorates and never fills a button there, except the dark-mode hero button and the verse-of-the-day link.
- The play bar and the forest bar are the only dark surfaces in light mode. Do not add other dark panels.
- Colours come from tokens. The values written out in `globals.css` (`.quran-reading`, `.home-editorial`) are the palette's own hexes and belong to those two blocks only.
- Gold on a light surface is decoration only (2.42:1 on soft cream): no text, no focus ring.

### Superseded teal palette (until 2026-11-24)

The site used a teal palette before the redesign; Settings, My reading, About, Search and Privacy were the last pages on it and moved to the editorial palette on 2026-11-24, so there is now one palette and no scope class. The 2026-11-19 audit measured the components in the teal values, so older rows and prompts in this file name them. Read them as the token, which now resolves to the editorial value:

| Token | Teal (light) | Editorial (light) | Teal (dark) | Editorial (dark) |
|---|---|---|---|---|
| `--background` | `#f5f2eb` | `#f5f2eb` (same) | `#071b20` | `#141c17` |
| `--foreground` | `#274045` | `#3e3428` | `#e6eff0` | `#eee6d7` |
| `--card` | `#ffffff` | `#f8f2e7` | `#0d252b` | `#27352c` |
| `--muted` | `#ede9de` | `#eee5d3` | `#153038` | `#304136` |
| `--muted-foreground` | `#596e73` | `#72685a` | `#a0b2b6` | `#b7ae9f` |
| `--border` | `#e0e8e4` | `#d9cbb5` | `#1f3337` | `#435146` |
| `--primary` | `#176c7d` | `#344c3d` | `#3db8ab` | `#a8c2a9` |
| `--primary-soft` | `#e2f0f3` | `#e8e2d4` | `#153038` | `#344639` |
| `--gold` | `#d7a342` | `#b59a69` | `#dfb85d` | `#c8ae79` |
| `--hero-from` / `--hero-to` | `#104f5b` / `#082026` | `#344c3d` / `#2a4033` | same | same |

Frequencies, contrast ratios and counts in older rows were measured on the teal values and are not repeated for the new ones; section 9 has the current ratios, and the full re-measure is open work (section 14).

## 2.5. Dark Mode System

### Detection Method

A `dark` class on `<html>` (`@custom-variant dark (&:where(.dark, .dark *))`). The class comes from local storage `theme` (`light`, `dark`, or none for auto); in auto it follows `prefers-color-scheme`. An inline script in `<head>` applies it before the first paint, so there is no flash.

### Color Mapping Table

| Variable | Light | Dark | Role |
|---|---|---|---|
| `--background` | `#f5f2eb` | `#141c17` (`143 17% 9.5%`) | Page |
| `--card` | `#f8f2e7` | `#27352c` (`141 16% 18%`) | Cards, panels, the reading surface |
| `--muted` | `#eee5d3` | `#304136` | Hover fill, tracks |
| `--primary-soft` | `#e8e2d4` | `#344639` | Selected and playing rows, chips |
| `--foreground` | `#3e3428` | `#eee6d7` | Body text |
| `--muted-foreground` | `#72685a` | `#b7ae9f` | Meta and hints |
| `--primary` | `#344c3d` | `#a8c2a9` (`122 17% 71%`) | Links, active states, selected |
| `--gold` | `#b59a69` | `#c8ae79` | Hairlines, rings, the active tab |
| `--border` | `#d9cbb5` | `#435146` | Edges, dividers, input borders |

The reader's parchment is `#ede4d2` (dark `#202c25`) and its reading surface `#f8f2e7` (dark `#26342b`); the play bar and the forest bar are `linear-gradient(135deg, #344c3d, #2a4033)` (dark `linear-gradient(135deg, #304638, #1d2d23)`). `--hero-from` and `--hero-to` are not redefined in `.dark`.

### Dark Surface Stack

1. **Night Page** (`#141c17`) -- the page
2. **Deep Card** (`#27352c`) -- cards and the reading surface
3. **Raised Wash** (`#344639`) -- selected rows, chips, hover

### Dark Text Ladder

1. `#eee6d7` -- body text, 14.02:1 on the page, 10.38:1 on cards
2. `#a8c2a9` -- links and active states, 9.07:1 on the page, 6.71:1 on cards
3. `#b7ae9f` -- meta and hints, 7.92:1 on the page, 5.86:1 on cards
4. `#07191f` -- text on the light-green fills (`dark:text-[hsl(192_64%_8%)]` in the code), 9.38:1 on `#a8c2a9`

### Dark Shadow Adjustments

Shadows are unchanged between modes; the one small drop shadow almost disappears on `#27352c`, so dark mode relies on the surface stack and the `#435146` borders.

### Dark Component Overrides

- Buttons with a forest fill switch their label from cream to `#07191f`, because the dark-mode forest `#a8c2a9` is light enough to need dark text.
- The home hero button becomes gold `#d0ad62` with `#1d2d23` text (6.77:1); the hero photograph is dimmed (a forest scrim on desktop, `brightness(0.62)` on the blocks).

### Implementation Notes

Tokens are raw HSL triplets (`143 19% 25%`) wrapped by Tailwind's `@theme inline` as `hsl(var(--primary))`, so opacity variants (`ring-gold/60`, `bg-background/85`) work. Switching modes only swaps the triplets; no component has a `dark:` colour of its own except the ink on filled buttons.

**Dark Mode Strategy:** **Night green** -- the hue family stays the forest green of the light palette; lightness inverts, the page is a near-black green and the accent becomes a pale sage.

The hierarchy compresses in dark mode: in light mode secondary text (`#72685a`) on soft cream is 4.90:1 while body text is 10.91:1; in dark mode they are 5.86:1 and 10.38:1, so secondary text gains weight and the page reads more evenly.

## 3. Typography Rules

### Font Families

- **Interface and reading**: `Plus Jakarta Sans Variable`, with fallbacks: `ui-sans-serif, system-ui, sans-serif`
- **Display**: `Space Grotesk Variable`, with fallbacks: `Plus Jakarta Sans Variable, ui-sans-serif, sans-serif`
- **Arabic**: `Amiri`, with fallbacks: `Scheherazade New, serif`
- **Numbers**: no monospace; surah indexes, verse references and percentages use `Plus Jakarta Sans` with `font-variant-numeric: tabular-nums`.
- **OpenType Features**: none set (`font-feature-settings: normal` everywhere).

All three named families are open source (SIL OFL) and self-hosted through `@fontsource`, so no request leaves the site for fonts. Spacing and borders use logical CSS (`ms-`, `pe-`, `border-s`, `start-`) so a right-to-left interface mirrors the whole layout. None of the fonts has Cyrillic, Bengali, Arabic-script, Chinese, Thai, Tamil, Malayalam, Devanagari or Japanese glyphs: those interfaces (2026-11-21) show their text in the system font from the end of each stack; Amiri stays for the Qur'an text.

**Why `Space Grotesk` stays** (owner's decision, 2026-11-19, after the UI audit flagged it as a common default for generated sites):
- It is the typeface of the site's own voice, never of the text being read. It sets the wordmark, page and surah titles and the numerals in the surah badges, and no running paragraph, so it never sits in a line next to the Arabic.
- Its hard-edged grotesque shapes are as far from `Amiri`'s naskh as the three families get. A title reads as the site speaking; the Arabic reads as the text itself. A serif here would compete with the Arabic instead.
- Its figures are wide and distinct at 12px weight 700, which is where most of its uses are (228 badge numerals in the measurement: five pages, light and dark).

Changing it would be a redesign of every title and badge, with new screenshots, for no reader-facing gain; revisit only together with a new identity.

**Substitution notes:** none needed; if `Amiri` cannot be loaded, `Scheherazade New` is the declared fallback and keeps the naskh style. Never substitute a geometric sans for Arabic.

### Hierarchy

| Role | Font | Size | Weight | Line Height | Letter Spacing | Features | Notes |
|---|---|---|---|---|---|---|---|
| Home Headline | Space Grotesk Variable | 30px (1.88rem), 36px from `sm`, 52px from `lg` | 600 | 1.25 | normal | - | "Baca Al-Qur'an" in the hero |
| Page Title | Space Grotesk Variable | 24px (1.50rem) | 600 | 32px | normal | - | "Bacaan saya", "Pengaturan" |
| Wordmark | Space Grotesk Variable | 20px (1.25rem) | 700 | 28px | -0.5px | - | "QuranWeb" in the header |
| Surah Title | Space Grotesk Variable | `clamp(1.9rem, 4.5vw, 2.75rem)` | 600 | 1.15 | normal | - | "Yasin" in the centred surah heading |
| Section Heading | Space Grotesk Variable | 18px (1.13rem) | 600 | 28px | normal | - | Settings section titles |
| Card Heading | Space Grotesk Variable | 16px (1.00rem) | 600 | 24px | normal | - | "Terakhir dibaca", "Target harian" |
| Badge Numeral | Space Grotesk Variable | 12px (0.75rem) | 700 | 16px | normal | - | Surah numbers in the diamond badges |
| Surah Name | Plus Jakarta Sans Variable | 16px (1.00rem) | 600 | 24px | normal | - | "Al-Fatihah" in the grid |
| Long-form Body | Plus Jakarta Sans Variable | 16px (1.00rem) | 400 | 26px | normal | - | About and privacy pages |
| Translation | Plus Jakarta Sans Variable | 15px (0.94rem) | 400 | 24.375px | normal | - | Scales with `--latin-scale` |
| UI Label | Plus Jakarta Sans Variable | 14px (0.88rem) | 500 | 20px | normal | - | Buttons, list names, tabs (most frequent: 402) |
| Secondary | Plus Jakarta Sans Variable | 14px (0.88rem) | 400 | 20px | normal | - | Descriptions, hints |
| Meta | Plus Jakarta Sans Variable | 12px (0.75rem) | 400 | 16px | normal | - | "7 ayat · Mekah" |
| Language Code | Plus Jakarta Sans Variable | 12px (0.75rem) | 600 | 16px | normal | - | `text-transform: uppercase`, "ID" on the language button |
| Surah Index | Plus Jakarta Sans Variable | 12px (0.75rem) | 400 | 16px | normal | `tabular-nums` | "036" in the surah list |
| Mushaf Arabic | Amiri | 36px (2.25rem) | 400 | 86.4px | normal | - | Line height 2.4; scales with `--arabic-scale` |
| Verse Marker | Amiri | 25.2px (1.58rem) | 400 | 25.2px | normal | - | ﴿١﴾ at 0.7em of the Arabic |
| Bismillah | Amiri | 36px (2.25rem) | 400 | 54px | normal | - | Above every surah but 1 and 9 |
| Arabic Surah Name | Amiri | 24px (1.50rem) | 400 | 32px | normal | - | Home index rows; 18px/28px in the side list; `clamp(2.25rem, 5vw, 3.25rem)` in the surah heading |

### Named Strategies

- **Script sovereignty**: Arabic text is 18px in the surah list, 24px in the grid and 36px with an 86.4px line in reading views, while the largest Latin heading is 30px (the only smaller Arabic is the letter ع on the text-size buttons). Architectural benefit: the reading text keeps its rank even when a reader enlarges Latin text to 150%.
- **Three families, three jobs**: `Space Grotesk` only names things (titles, numbers, wordmark), `Plus Jakarta Sans` only explains them, `Amiri` only carries the revelation. Architectural benefit: a reader can tell UI from scripture by typeface alone.
- **Weight over size in the interface**: chrome lives at 12px and 14px and gets its hierarchy from weight (400, 500, 600). Architectural benefit: navigation stays compact so the reading column keeps its width.
- **Variables, not breakpoints, for reading size**: reading text is `calc(<base>*var(--arabic-scale,1))`; only the mushaf Arabic also steps up at 640px (2rem to 2.25rem). Architectural benefit: size follows the reader, not the device.

## 4. Component Stylings

### Buttons

**Gold Pill (main action)**
- Background: `#b59a69`
- Text: `#17261d`, 14px `Plus Jakarta Sans Variable` weight 600
- Padding: 10px 24px on page-level actions, 8px 16px inside panels
- Radius: fully rounded (`rounded-full`)
- Disabled: opacity 0.5 -- keeps the gold visible so the reader knows what will become available
- Transition: `color, background-color, border-color 0.15s cubic-bezier(0.4, 0, 0.2, 1)`
- Use: Main call to action ("Mulai" in the Memorize panel, the 404 page, and the verse-of-the-day link). The home hero's main action is the forest pill below in light mode and this gold pill in dark mode.

**Forest Pill (home hero)**
- Background `#344c3d`, text `#f8f2e7` (8.39:1), 14px weight 600, padding 12px 24px, fully rounded; hover `#405b48`
- Dark: background `#d0ad62`, text `#1d2d23`; hover `#dfc17e`
- Use: "Start with Al-Fatihah" on the home hero

**Outline Forest Pill (hero search)**
- Transparent, 1px `--primary` border, `--primary` text, 14px weight 600, padding 12px 20px; hover `--primary-soft`
- Use: the "Search" button beside the hero's search field

**Chip (the controls under the play bar)** (`.quran-chip`)
- Background `--card` at 70%, 1px border `--primary` at 60%, text `--primary`, 14px weight 500 (600 on the tabs), padding 8px 14px, radius 12px (tabs: fully rounded); hover `--card`
- Selected (`.quran-chip--on`): background `--primary`, text `--card` (cream on forest 8.39:1; dark: sage with night-green text); used by the active tab and by "Memorize" while its panel is open
- Use: the Reading / Tafsir switch, "Ayat...", "Juz...", the end-of-surah mode and "Hafalan" under the play bar; their lists open as the usual cards

**Play Bar (surah)** (`SurahPlayer`; redesigned 2026-11-24 from the owner's reference)
- A pill, `linear-gradient(135deg, #344c3d, #2a4033)` (dark `#304638` to `#1d2d23`), minimum height 64px, at most 832px wide, centred under the heading; padding 10px 26px 10px 10px; 1px border of gold at 35%; shadow `0 10px 24px` of ink at 16%
- Left to right (mirrored in right to left): a 44px round gold button (`radial-gradient` from `#dcc690` to `#b99f6a`, icon `#17261d`; `aria-pressed`, named "Play the surah" or "Pause the surah"), the label (15px weight 600, the same words) over the reciter in 12.5px white at 72%, a slider, and the time or the verse in 13px tabular figures
- The slider: a 4px track that fills with gold `#cdb67f` up to the position, a 15px cream thumb, a 44px hit area that does not make the bar taller; a native `<input type="range">`, so the keyboard and screen readers work; named by the surah's name, with `aria-valuetext` carrying the time or the verse
- One recording of the whole surah (EQuran.id's six reciters, Alafasy and the others that have one): the slider seeks in it and the end reads "18:12 / 42:18" ("00:00 / --:--" until the length is known; the slider is disabled until then). A reciter with a file per verse and none for the whole surah: the button plays verse by verse from verse 1, pauses and carries on where it stopped; the slider runs over the verses (one verse a step, the verse starts when the pointer is let go or 0.4s after the last key); the end reads "286 verses" before anything plays and "Verse 12 / 286" after. A reciter with neither has no play bar
- It adds no way to play: the whole-surah recording and the verse player are the ones that already existed, so the mode at the end of a surah, the juz, memorization, the lock screen and the keys behave as before. Playing from the bar leaves a juz or a memorization range, as a verse button does
- Phones: two lines, the button, the label and the time first, the slider across the full width under them; the pill's radius becomes 28px
- Use: every surah page whose reciter has audio

**Dark Select (on the forest bar, in the Memorize panel)**
- Transparent background, 1px border white at 15%, text white at 90% (it was gold until 2026-11-24, when gold was kept for the active tab), radius 12px
- Options: background `hsl(192 64% 9%)`, white text
- Use: the lists inside the Memorize panel

**Outline Pill (secondary)**
- Background: transparent; border 1px `#d9cbb5`
- Text: `#3e3428`, 12px weight 500
- Padding: 4px 12px; radius fully rounded
- Hover: background `#f5f2eb` -- sinks into the page colour rather than darkening
- Disabled: opacity 0.6
- Use: "Unduh cadangan", "Impor cadangan", small actions in My reading

**Segmented Control**
- Track: `#f5f2eb`, radius fully rounded
- Selected segment: background `#344c3d`, text `#f8f2e7`
- Unselected: text `#72685a`
- Use: Layout choice ("Mushaf", "Per ayat"), theme ("Terang", "Gelap", "Otomatis")

**Icon Button (verse actions, header controls)**
- 36px round on verses, 40px round in the header (header ones add a 1px `#d9cbb5` border on `#f8f2e7`)
- Icon 16px (verses) or 18px (header), stroke 2, `currentColor`
- Active (bookmarked): background `#e8e2d4`, icon `#344c3d`
- Hover: background `#eee5d3` -- the linen fill darkens the button slightly without borrowing the "selected" wash
- Use: Play, bookmark, mark as read, copy, link on each verse; the theme toggle and language menu

### Inputs and Selects

**Select / Text Field**
- Background: `#f5f2eb` (on cards) or `#f8f2e7`
- Border: 1px `#d9cbb5`; radius 12px
- Text: 14px `#3e3428`; padding 8px 12px
- Focus: border becomes `#344c3d` (`focus:border-primary`), and the keyboard ring below appears as well
- Use: "Cari nama atau nomor...", "Ayat per hari", the translation language list

**Tajweed colours (`tj-<rule>` classes, `globals.css`)**
- One palette per theme, the usual tajweed colours made darker (light) or lighter (dark) so each keeps 3:1 against the card
  and the page at the Arabic text's size: silent letters grey (#8a8a8a / #9aa7aa), the kinds of madd blue, qalqalah red,
  ikhfa purple, idgham green, iqlab light blue, ghunnah orange.
- The ruku mark ع is gold, smaller and raised, after the verse; the ۩ of a sajdah is part of the text itself.
- Legend (`TajweedLegend`): a `<details>` under the setting, 12px primary summary; each row a 12px rounded square in the
  rule's colour and its name (the colour is never the only signal: the name says what it marks).

**Searchable list (`SearchableSelect`, more than 10 options)**
- Closed: looks like the select it replaces (the same classes, light or dark), with a chevron; the value is truncated.
- Open: a card under it (`bg-card`, 1px border, radius 12px, `shadow-lg`, at least 256px wide) with a search field on top
  and the options below (max 288px, scrolls); group labels in 12px semibold muted text; rows at least 44px, the active row on
  `bg-background`, the chosen one in primary semibold with a check.
- Empty result: "Tidak ada yang cocok." in muted text.
- Use: translation languages, tafsir, "Ayat...", "Juz..." (also on the dark chapter head), the interface language on Settings,
  the surah filter on Search

### Cards

**Section Card**
- Background: `#f8f2e7`; border 1px `#d9cbb5`; radius 16px
- Header row: 16px `Space Grotesk` weight 600, separated by a 1px `#d9cbb5` rule
- Padding: 16px to 24px
- Use: "Terakhir dibaca", "Target harian", every settings section

**Surah Index (home)** (since PR #140; it replaced the grid of cards)
- Two columns from `lg`, one below; a row per surah: soft cream `#f8f2e7`, 1px `#dfd3c1` border, hover border `#9b8a68` and a small shadow
- Left: the number in a chip (`#e4eadf` with a 1px `#cdd8c9` border, forest numeral; dark `#35473a`, border `#50634f`, numeral `#d2dfcb`); middle: Latin name, meaning, verse count and revelation in muted text; right: the Arabic name in `Amiri` in forest, and a gold arrow that shows on hover (always on phones)
- On the home page the index shows the first six surahs, and a text link "View all surahs" under them (14.9px weight 600, `--primary`, 44px high, an arrow that mirrors in right to left; underline on hover) opens `/surahs`, which shows all 114 in the same rows with an `h1`
- On `/surahs` the search field above the list filters by number, name and meaning; on the home page the same field suggests (see Surah Search Suggestions) and the six rows stay
- Use: the surah links ("Al-Fatihah · The Opening · 7 verses · Mecca")

**Surah Search Suggestions** (home page; 2026-11-24)
- The field keeps its place and look (pill, 288px from `sm`, full width below). Under it, on the field's end edge, floats a card: `--card`, 1px `--border`, radius 16px, shadow `0 12px 28px` of ink at 14%, 384px wide from `sm` (the field's width on a phone), at most `min(22rem, 60vh)` high and scrolling, never clipped by the page
- A row is at least 44px high, padding 6px 12px, radius 10px: the number in 12px tabular figures (`--muted-foreground`), the Latin name (14.4px weight 500, truncated), the Arabic name (`Amiri` 20.8px, `--primary`, `dir=rtl lang=ar translate=no`); the highlighted row (arrow keys or hover) is `--primary-soft`
- Empty result: one centred sentence, 14px `--muted-foreground` (`home.noResults`); nothing is shown for an empty field
- Keyboard: Arrow Down and Up (they wrap), Enter, Escape; a combobox with a listbox of options for screen readers
- Use: the home page only

### Navigation

**Header** (redesigned 2026-11-24 from the owner's reference)
- Sticky, background `#f5f2eb` at 85% opacity with `backdrop-blur`, bottom border 1px `--border`
- Left: a 40px rounded tile (radius 12px, `#344c3d`, dark `#26342b`, a 1px ring of gold at 40%) holding the book logo in cream and gold, then the wordmark "QuranWeb" in `Space Grotesk` 20px 700, -0.5px tracking, in `--primary`; below 480px only the tile shows
- Centre: text navigation, no pill container (`NavLink`): "Al-Quran" (`nav.quran`), "Surahs" (`home.listTitle`, links to `/#surahs`; the count 114 it showed from 2026-11-24 was removed the same day, by the owner), "About" (`footer.about`), and "My reading" and "Settings" when sign-in is off. 14px weight 500 in `--foreground` at 80%, hover `--primary`; the current page is `--primary` with a 2px underline and `aria-current="page"`; every link is 44px high. Below 640px the navigation takes a second row, and its links wrap onto a third when they do not fit (with sign-in off there are five, which in Indonesian are wider than a 390px phone: found by the home page's overflow test, 2026-11-24)
- Right: search link, language menu, theme toggle, account menu: 40px round buttons, 1px `--border` on `--card`, hover `--muted`. Their behaviour and place did not change
- Language menu: 240px wide, scrolls inside itself; languages in alphabetical order of their own names, each with a 20×14px
  flag (inline SVG, 2px radius, a 1px ring at 10% black so white flags stay visible) before the name; a community
  translation has an asterisk after the name in `--primary`, explained by a 12px note in `--muted-foreground` under the list
- Not built from the reference: the "Mushaf digital" tagline (a new message in 25 catalogs)
- Use: every page

**Verse of the day (home page)**
- A card under "continue reading": soft cream `#f8f2e7` on a 1px `#d9cbb5` border (dark `#26342b` on `#435247`), 16px radius, 20px padding (24px from `sm`)
- A 14px muted label, the verse in Arabic (`Amiri` 28px, right to left), its first translation at 16px, then the reference ("Al-Baqarah 2:255")
  as a primary link with the surah's meaning in muted text; a gold pill "Read in the surah" (`#d0ad62`, text `#263b30`)
- Use: the home page only; it is left out when the text cannot be read

**Search**
- A 40px round magnifier button (border, `--card`) in the header before the language button; in the home page's hero a pill input
  (soft cream at 92% on a 1px `--border`, `--muted-foreground` placeholder, forest border on focus) and the outline forest pill "Search", next to the forest start button
- The results page (768px column): the title, a form row (pill input, a pill surah select, a primary pill button), a muted count, then one
  card per result (`--card`, 1px border, 16px radius): the verse's name and numbers as a primary link, and the text around the match
  with each match in gold at 30% (`bg-gold/30`) and the text colour; Arabic results in `Amiri` 24px right to left; previous and next
  as pills with "page / pages" between them

**Page division (reading settings)**
- A second segmented control under "Layout" in the reading settings, the same pill group: two buttons, the pressed one in the
  primary colour (white text, dark text in dark mode), the other muted: "10 verses" and "Mushaf pages (604)"

**Mushaf page (`/mushaf/N`)**
- A 1200px column: the surah heading and a chip for the end-of-surah mode (page title, the surahs of the page, the end-of-surah mode); the navigation row (pill "Previous
  page", the counter "42 / 604" with a 128px pill number box and a small "Go" pill, pill "Next page") above and below; on a phone the
  two pills share a row and the box has its own; one card holding each surah's part in the mushaf layout, a surah that starts here with a
  centred band (Arabic name in `Amiri` 30px, Latin name, meaning, verses, the Bismillah), one that goes on with a 12px muted name; the
  page number "— 42 —" at the foot of the card

**Share menu (verse actions)**
- A 36px round share button (three joined circles, stroke 1.8) with the other verse actions; it opens a 224px card (`--card`, 1px
  border, 16px radius, shadow) of text items, 14px weight 500, 40px high: copy the verse, copy the link, "Share…" (only where the
  browser has a share sheet) and WhatsApp. It opens downward from a card and upward from the bar at the bottom of the mushaf layout;
  Escape and a click outside close it; "Copied" shows beside the button for a moment

**Verse page (`/surah/2/255`)**
- A narrow column (768px): a trail "Surahs / Al-Baqarah", the reference as the title (`Space Grotesk` 24px 600), one card with the Arabic
  (`Amiri`, 36 to 42px), the transliteration, and each translation under a 12px muted edition name, then "Read in the surah" and the
  share button; previous and next verse as pills under it

**Surah List (side panel)**
- Rows: index in tabular figures `--muted-foreground`, name 14px weight 500, Arabic name `Amiri` 18px
- Current surah: background `--primary-soft`, 2px left edge in `--gold`
- Use: the side panel and the phone panel "Daftar surat dan pengaturan"

### Distinctive Components

**Surah Heading** (redesigned 2026-11-24; it replaced the dark Chapter Head)
- The heading sits on the parchment, centred: a line "2 · Medina · 286 verses" (13px muted, `tabular-nums`, sentence case), then the Latin name in `Space Grotesk` 600, `clamp(1.9rem, 4.5vw, 2.75rem)`, a 1px gold rule, and the Arabic name in `Amiri` (`clamp(2.25rem, 5vw, 3.25rem)`), both in forest; below them the surah's meaning in italic muted text, then a gold hairline with one small diamond (`quran-reading__ornament`; the only ornament)
- Under it the play bar, then the chips (centred, wrapping: the tabs, then the lists, the mode and "Memorize"). The Memorize panel, when open, and the playing status ("Playing juz 3", the range being looped) sit in a forest bar (`quran-reading__bar`, radius 24px) under the chips
- On a phone the heading stays one block and the vertical gold rule hides below 480px; the chips wrap onto several rows (the first verse is still below the first screen)
- The mushaf page (`/mushaf/N`) has the same heading, with its end-of-surah mode as a chip under it and no play bar of its own (each surah on the page has its "Play the surah" button)
- Use: top of every surah page and of the mushaf page ("Yasin", "Al-Baqarah")

**Mushaf Block**
- One justified paragraph of Arabic (`Amiri` 36px, line height 86.4px) with a marker ﴿N﴾ after each verse in `--gold`
- The playing verse gets a `--primary-soft` background
- The reading surface (`quran-reading__surface`) is soft cream with a 1px gold border at 45% and an inset rule at 35%; each verse number is a thin gold ring (1px), not a tilted tile
- Beside it (from 1024px), a numbered translation column with a 1px `--border` rule between them
- Use: the default Reading layout

**Home Hero** (PR #142; the layouts were chosen by the owner from mockups on 2026-11-24)
- A parchment panel, radius 28px, 1px border of gold at 35%, minimum height `clamp(23rem, 38vw, 30rem)` from `lg`; the heading ("Read the Qur'an", `Space Grotesk` 600, 52px from `lg`), the description (`#514536`), the search form and the forest "Start" pill are real HTML, in that order, with the existing messages (`home.title`, `home.subtitle`, `search.*`, `home.start`)
- The photograph is a CSS background, so it takes no layout space and cannot shift the page: `public/images/quranweb-hero-mushaf.webp` (1600px, 96KB, from a 2MB PNG) from 1024px and `quranweb-hero-mushaf-sm.webp` (960px, 42KB) below, so a phone downloads only the small one. It is AI-generated (supplied by the owner); the Arabic on its pages is not a Qur'an source and the photograph is never mirrored
- Desktop, left to right: the photo fills the panel on the right (`cover`, 78% 65%) and a parchment gradient (`#ede4d2` to 92% at 30% to transparent at 62%) fades it into the text side
- Desktop, right to left: the photo is a block on the left 57% (`cover`, 100% 65%), fading on its right edge over 10%, with the mushaf facing the text, which is on the right; the block is narrower than two thirds so it stays clear of the search form
- Under 1024px: the photo is a block beside the heading and description, as tall as they are (minimum 14.5rem), 50% wide, bleeding to the panel's edge and fading into the paper on its text side and at the bottom; the text column is 56% wide; the search form and the button sit under both on plain paper. In right to left the block is on the left. From 640px the photo fills its block (`cover`, lantern and window included); below that it is 430px wide, so the whole mushaf shows
- Dark: the panel is `#1d2d23` with a forest scrim over the photo on desktop and `brightness(0.62)` on the blocks
- Use: the home page only

**Hidden Text (memorizing)**
- `filter: blur(0.4em)`, `user-select: none`, `cursor: pointer`
- Tap, Enter or Space shows that verse; again hides it
- Use: "Sembunyikan saat menghafal" with "teks Arab" or "terjemahan"

## 5. Layout Principles

### Spacing System

Base unit 4px (Tailwind's `spacing` scale). Most frequent values (padding, gap and margin, all five pages):

- 16px (1,324) -- card padding and the main gap between cards
- 12px (1,258) -- list rows, input padding, small card gaps
- 8px (878) -- button padding, icon gaps
- 10px (474) -- list row padding
- 14px (456) -- the side list's horizontal padding
- 4px (228) -- chip padding, tight gaps
- 24px (74) -- section padding on wide screens
- 32px (34) -- page top and bottom padding

### Grid & Container

- Site container: `1200px` with 16px gutters
- Prose pages (About, Privacy, My reading): `768px`
- Home grid: one column, two from 640px, three from 1024px, 12px gap
- Surah page: a 320px side panel plus the reader from 1024px (24px gap); the panel collapses to free the full width
- Mushaf layout: Arabic and translation side by side (3 : 2) from 1024px, stacked below

### Whitespace Philosophy

- **Cards on paper**: there are no full-width colour bands; content sits in white cards with 16px of cream between them, so every page has the same ground.
- **Generous reading, dense chrome**: the Arabic gets an 86.4px line for a 36px size, while lists use 10px and 12px row padding.

### Border Radius Scale

- Card (16px): cards, panels, the chapter head -- 266 occurrences (DOMINANT)
- Badge (6px): surah diamonds, small chips -- 248 occurrences
- Pill (fully rounded): buttons, chips, the header controls -- 204 occurrences
- Field (12px): inputs, selects, the reciter picker -- 52 occurrences
- Small (4px): highlights, the playing-verse mark -- 20 occurrences
- Medium (8px): small tiles
- Hero (28px): the home hero; play bar (a pill) and forest bar (24px); the reader's parchment panel (20px); the reading surface (16px, the Card radius); logo tile (12px)

## 6. Depth & Elevation

**Named principle:** Paper depth -- elevation comes from a white card on a cream page and a 1px border, not from shadow.

| Level | Treatment | Frequency | Use |
|---|---|---|---|
| Flat | none | - | Page, list rows |
| Card | 1px `#d9cbb5` border on `#f8f2e7` | 204 | Every card and panel |
| Lifted | `rgba(0, 0, 0, 0.1) 0px 1px 3px 0px, rgba(0, 0, 0, 0.1) 0px 1px 2px -1px` | 14 | The chapter head at rest; surah and continue-reading cards on hover |
| Ring | 1px ring of gold at 60% (`ring-1 ring-gold/60`) | 2 | Gold rings: the logo tile (at 40%) and the verse numbers (a 1px inset ring) |
| Frame | 1px gold border at 45% and an inset rule at 35%, plus `0 8px 28px` of ink at 5% | 1 | The editorial reading surface |

**Dominant shadow:** `rgba(0, 0, 0, 0.1) 0px 1px 3px 0px, rgba(0, 0, 0, 0.1) 0px 1px 2px -1px` (14 occurrences) -- Tailwind's `shadow-sm`, on the chapter head and on cards while hovered. Things that float above the page (the language and account menus, the reciter list, the mushaf verse bar) use `shadow-lg` when open.

QuranWeb has one small resting shadow and lets the cream-to-white step do the rest: `#f5f2eb` to `#f8f2e7` is a visible edge on its own, and the `#d9cbb5` border sharpens it. The result is a page that stays flat enough to read for an hour, and a dark mode that needs no shadow changes at all.

## 6.5. Motion System

**Motion philosophy:** Motion only confirms that a state changed. Nothing moves on its own; menus and panels appear without sliding.

| Token | Duration | Frequency | Use |
|---|---|---|---|
| Transition | 150ms (`0.15s`) | 542 | Colour, background, border, opacity on every interactive element |
| Transition (all) | 150ms (`0.15s`) | 12 | Buttons using `transition` with all properties |

**Easing:** `cubic-bezier(0.4, 0, 0.2, 1)` (554 occurrences) -- Tailwind's default ease-in-out, the only curve in the system.

**Enter/Exit choreography:** none. Dropdowns, the Memorize panel and folded sections appear and disappear instantly; smooth scrolling is used only to bring the playing verse into view.

**Reduced-motion fallback:**
**Observed:** no `prefers-reduced-motion` media queries and no `animate-*` classes.
**Recommended policy:** keep the 150ms colour transitions (they are not motion); switch `scrollIntoView({ behavior: "smooth" })` to instant under `prefers-reduced-motion: reduce`.

## 7. Content & Voice

### Tone

- **Plain**: "Baca Al-Qur'an" (not "Explore the Holy Qur'an")
- **Instructional**: "Buka sebuah surat dan posisi bacaan Anda akan dicatat otomatis." (empty state that says what to do)
- **Respectful**: Arabic names stay in Arabic beside their transliteration ("Yasin", يٰسۤ), and the book is written "Al-Qur'an"
- **Second person, formal**: "Anda" (28 times in the Indonesian catalog; "kamu" does not appear)

### Capitalization Rules

- Headings: sentence case ("Bacaan saya", "Target harian")
- Buttons: sentence case ("Unduh cadangan", "Mulai dari Al-Fatihah")
- Small labels: sentence case ("Lanjutkan membaca", "Paling dikenal"); only the language code is uppercase ("ID")
- Surah names: transliterated with hyphen and capital ("Al-Baqarah", "An-Nas")

### Button Label Patterns

- Verb + object: "Unduh cadangan", "Impor cadangan", "Mulai dari Al-Fatihah"
- Single verb: "Mulai", "Lanjutkan", "Masuk"
- Toggle nouns: "Bacaan", "Tafsir", "Hafalan", "Mushaf", "Per ayat"

### Error/Empty State Copy

- Empty: "Belum ada bacaan tersimpan. Buka sebuah surat dan posisi bacaan Anda akan dicatat otomatis." -- states the absence, then the one action that fills it.
- Errors were not observed on these pages; follow the same pattern: what happened, then what to do, in "Anda" form.

### Emoji Policy

- Observed: no emoji in content, navigation or buttons. Symbols are typographic (→, ·, ×, ﴿﴾).

### Voice Examples

1. "Baca Al-Qur'an" (home headline)
2. "Mulai dari Al-Fatihah" (home call to action)
3. "Sembunyikan daftar surat dan pengaturan" (surah page control)
4. "Belum ada bacaan tersimpan. Buka sebuah surat dan posisi bacaan Anda akan dicatat otomatis." (My reading, empty)

Labels are short, and full sentences appear only where an action needs explaining. The copy does not praise the product or the reader's progress; it says where the reader stopped and how to continue.

## 8. Do's and Don'ts

### Do's

- Set reading text with a scale variable -- `font-size: calc(2rem*var(--arabic-scale,1))` for Arabic, `calc(1rem*var(--latin-scale,1))` for translations; labels keep fixed sizes
- Put cards on the page -- `#f8f2e7` card, 1px `#d9cbb5` border, 16px radius, on the warm paper `#f5f2eb` or on parchment `#ede4d2`
- Use deep forest `#344c3d` (through `--primary`; write no colour of your own) for anything clickable that is not the single main action
- Give the main action of a view the gold pill -- `#b59a69` fill, `#17261d` label, fully rounded, 8px 16px
- Mark selection with the wash -- `#e8e2d4` background (dark: `#344639`), never with bold text alone
- Keep Arabic in `Amiri` with `dir="rtl" lang="ar" translate="no"` and a line height of at least 2.4 in reading views
- Use one transition everywhere -- `150ms cubic-bezier(0.4, 0, 0.2, 1)` on colour, background and border
- Reuse the forest bar gradient for a dark panel -- `linear-gradient(135deg, #344c3d, #2a4033)`
- Put the photograph beside the text, fade it on every edge that touches text, and give a right-to-left page the same photo on the other side, unmirrored
- Use tokens, not colours written into a component
- Write tokens as HSL triplets in `globals.css` (`--primary: 190 69% 29%`) so `/60`-style opacity variants keep working

### Don'ts

- Don't set the Arabic smaller than the translation -- in this system the Arabic is the main text; keep it at 36px against a 15px translation
- Don't use black ink on cream -- text is `#3e3428` (10.88:1 on the page, 10.91:1 on soft cream), already far above AA; black adds contrast nobody needs and breaks the warm family
- Don't mirror the hero photograph, and don't put text of ours over it -- its Arabic would read backwards, and words over a picture of a page are hard to read
- Don't use Warm Gray `#807565` as text -- it fails AA on both cream and parchment; use `#6b6152` or `--muted-foreground`
- Don't put gold in text on a light surface (2.42:1), and don't add ornament beyond the hairline and the one diamond
- Don't put gold on a button that is not the main action -- gold is rare; more than one gold button per view dilutes it
- Don't give resting cards a shadow -- depth here is the `#d9cbb5` border; `shadow-sm` (`rgba(0, 0, 0, 0.1) 0px 1px 3px 0px`) is for hover and the chapter head, `shadow-lg` only for things that float (menus, the verse bar)
- Don't use a white page or white cards -- the card is soft cream `#f8f2e7` on a warm paper page; pure white erases the warm look
- Don't machine-translate or restyle the Arabic -- every Arabic element carries `translate="no"`; no letter-spacing, no italic, no `font-weight` above 400 in reading views
- Don't size reading text with breakpoints alone -- use `--arabic-scale` / `--latin-scale`; a breakpoint step (2rem to 2.25rem at 640px) is the only exception
- Don't add a second accent hue -- red appears only on account deletion; a new feature uses forest, gold or the wash
- Don't animate on entry -- panels and menus appear instantly; motion is limited to 150ms state transitions

## 9. Accessibility Contract

**Inferred target:** WCAG 2.1 AA. Evidence: every text pair listed below passes 4.5:1 except gold, which is decoration only on light surfaces; ARIA attributes are used throughout (150 `aria-label` in the 2026-11-19 audit), and Arabic carries `lang="ar"`.

### Contrast Ratios

Computed from the token values (WCAG relative luminance), 2026-11-24.

| Role | Foreground | Background | Ratio | Pass (AA) |
|---|---|---|---|---|
| Body on page | `#3e3428` | `#f5f2eb` | 10.88:1 | Yes |
| Body on card | `#3e3428` | `#f8f2e7` | 10.91:1 | Yes |
| Secondary on card | `#72685a` | `#f8f2e7` | 4.90:1 | Yes |
| Secondary on page | `#72685a` | `#f5f2eb` | 4.89:1 | Yes |
| Reader metadata on parchment | `#6b6152` | `#ede4d2` | 4.81:1 | Yes |
| Link on card | `#344c3d` | `#f8f2e7` | 8.39:1 | Yes |
| Link on selected row | `#344c3d` | `#e8e2d4` | 7.24:1 | Yes |
| Cream on forest (button, bar) | `#f8f2e7` | `#344c3d` / `#2a4033` | 8.39:1 / 10.03:1 | Yes |
| Gold on forest bar | `#cdb67f` | `#344c3d` | 4.71:1 | Yes |
| Ink on active tab | `#17261d` | `#cdb67f` | 7.96:1 | Yes |
| Hero description | `#514536` | `#ede4d2` | 7.38:1 | Yes |
| Gold on card | `#b59a69` | `#f8f2e7` | 2.42:1 | No (decoration only) |
| Warm Gray as text | `#807565` | `#f8f2e7` | 4.05:1 | No (not used as text) |
| Dark: body on card | `#eee6d7` | `#27352c` | 10.38:1 | Yes |
| Dark: secondary on card | `#b7ae9f` | `#27352c` | 5.86:1 | Yes |
| Dark: link on card | `#a8c2a9` | `#27352c` | 6.71:1 | Yes |
| Dark: link on page | `#a8c2a9` | `#141c17` | 9.07:1 | Yes |
| Dark: ink on sage fill | `#07191f` | `#a8c2a9` | 9.38:1 | Yes |
| Dark: hero button | `#1d2d23` | `#d0ad62` | 6.77:1 | Yes |

Gold on a light surface is never text and never a focus ring.

### Focus Indicators

- Every control, on keyboard focus (`:focus-visible`): `outline: 2px solid` in `--primary` (`#344c3d`, dark `#a8c2a9`) with a 2px offset. On the play bar and the forest bar (`.on-dark`) the ring is gold, the lighter `#cdb67f` there.
- The rule is unlayered in `globals.css`, so a utility such as `outline-none` cannot remove it; inputs also turn their border `--primary`.
- Ring contrast against what surrounds it (3:1 needed): forest 8.36:1 on the page, 8.39:1 on soft cream, 7.40:1 on parchment, 7.24:1 on the selected row; dark sage 9.07:1 on the page and 6.71:1 on cards; gold `#cdb67f` 4.71:1 on `#344c3d` and 5.64:1 on `#2a4033`.

### Touch/Click Targets

- Header controls: 40px round buttons; header navigation links 44px high
- Verse action buttons and page numbers: 36px to look at, 44px to tap -- an `::after` layer reaches past the edge (`after:-inset-1`, `after:-inset-1.5` where a 1px border sits inside)
- Gold and forest pills: 40px high on pages (10px + 20px line + 10px), 36px in panels
- Font-size steppers (ع− ع+ A− A+): 32px to look at, 46px to tap (`after:-inset-2`)
- Surah list rows: 44px or taller

### Reduced-Motion Support

None observed (see 6.5). Only smooth scrolling to the playing verse would need a fallback.

### ARIA Patterns

Observed (all pages, both themes): `aria-label` (150), `aria-hidden` (84, decorative SVG), `aria-pressed` (34, toggles and hidden verses), `aria-expanded` (28, menus and panels), `aria-haspopup` (24), `aria-labelledby` (16), `aria-checked` (12, segmented controls), `aria-live` (8, playing status), `aria-current` (6, current page and surah), `aria-busy` (6, saving a choice), `aria-valuenow`/`-min`/`-max` (progress bars). Arabic and the reading text carry `translate="no"` so browser translation leaves them alone.

## 10. Responsive Behavior

### Breakpoints

| Name | Width | Uses | Key Changes |
|---|---|---|---|
| Phone | below 640px | - | One column; header navigation on a second row; side panel folded above the surah |
| sm | 640px | 24 | Home grid to two columns; mushaf Arabic 2rem to 2.25rem; wider padding |
| md | 768px | 1 | One prose-page adjustment |
| lg | 1024px | 11 | Side panel beside the reader; mushaf Arabic and translation side by side; three-column home grid |

### Touch Targets

- Round header buttons stay 40px at every width
- Surah list rows are full width with 12px padding on phones
- In the mushaf layout, a verse's actions open in a bar fixed 12px above the bottom of the screen, with 36px buttons
- Selects keep 8px 12px padding; none shrink below 36px

### Collapsing Strategy

- Side panel: beside the reader at 1024px and up -> folded "Daftar surat dan pengaturan" panel above the surah below 1024px
- Mushaf: Arabic (right) and translation (left) columns at 1024px -> Arabic above translation below 1024px
- Home grid: 3 columns at 1024px -> 2 at 640px -> 1 below
- Mushaf Arabic: 36px at 640px and up -> 32px below, line height 2.4 kept
- Header: one row at 640px and up -> navigation moves to a second row below 640px
- Play bar and chips: a pill and one or two rows of chips at 1024px -> on a phone the pill takes two lines and the chips wrap onto three rows (the first verse is then below the first screen on a 390px phone; open)
- Home hero: photo as the panel's background on the right at 1024px and up (on the left in right to left) -> a block beside the heading below 1024px, with the form and button under both (see Home Hero)
- Header navigation: a centred text row at 640px and up -> a second row below 640px

### Image Behavior

- The only photograph is the home hero's mushaf (see Home Hero), a CSS background in two WebP sizes; the other images are the logo and icons (inline SVG), which scale with their container.
- App icons for installing: 192px and 512px PNG, plus a full-bleed maskable 512px.
- The link preview image, `public/og.png` (1200 by 630): the logo and the wordmark in cream on the forest gradient (`#344c3d` to `#2a4033`), the Bismillah in gold `#cdb67f`
  Amiri, a one-line tagline and the address. Drawn by `scripts/og-image.mjs`; redraw it with the icons if the brand changes.
- Screenshots in the README (retaken 2026-11-24 on QA with `scripts/readme-screenshots.mjs`, which takes `ONLY=<names>` to retake some) and the hero photograph are the only raster images in the project besides `og.png` and the app icons.

## 11. State Matrix

| Component | Loading | Empty | Error | Disabled | Success |
|---|---|---|---|---|---|
| Gold pill | - | n/a | - | opacity 0.5 | n/a |
| Outline pill | - | n/a | - | opacity 0.6 | - |
| Settings section | `aria-busy` while a choice saves | n/a | - | n/a | page refreshes with the choice |
| Section card (My reading) | n/a | "Belum ada bacaan tersimpan..." in `#72685a` | - | n/a | n/a |
| Surah search | n/a | - | n/a | n/a | n/a |
| Verse audio | "Jeda audio" icon while playing | n/a | falls back to the next server, then stops | n/a | `#e8e2d4` on the playing verse |
| Account sync | - | n/a | "!" on the account button | n/a | - |

### Skeleton/Shimmer Patterns

None observed: pages render on the server with their data, so there is no client-side loading skeleton.

## 12. Iconography

- **Library detected**: none; custom inline SVG written in the components (15 icons)
- **Grid**: `viewBox="0 0 24 24"` (46 rendered icons); the logo uses `0 0 32 32`
- **Stroke weight**: 2 (7 icons), 1.8 (2), 2.5 (1); `stroke="currentColor"`, no fill
- **Style**: outlined, round caps and joins

### Sizing Scale

| Size | Frequency | Use |
|---|---|---|
| 16px | 22 | Verse actions, menu items |
| 18px | 10 | Header controls |
| 14px | 4 | Inline chevrons |
| 12px | 10 | Small chevrons and close marks |
| 32px | 10 | Logo |

### Icon-to-Text Alignment

Icons sit in flex rows with an 8px gap, vertically centred; decorative icons carry `aria-hidden="true"` and the button carries the `aria-label`.

### Substitution Recommendation

The icons match the Lucide style (24px grid, 2px stroke, round caps). For new icons, take them from Lucide and inline them with `stroke-width="2"` and `currentColor`.

## 13. Agent Prompt Guide

### Quick Color Reference

> **Warning:** Only the colours below are system tokens. Red on account deletion is not a palette colour; do not use it elsewhere.

- Page: `#f5f2eb` (dark `#141c17`); parchment `#ede4d2` (dark `#202c25`)
- Card and reading surface: `#f8f2e7` (dark `#27352c`)
- Text: `#3e3428` (dark `#eee6d7`); secondary `#72685a` (dark `#b7ae9f`)
- Border: `#d9cbb5` (dark `#435146`)
- Forest (action, play bar): `#344c3d` (dark `#a8c2a9`)
- Selected: `#e8e2d4` (dark `#344639`)
- Gold (hairline, rings, active tab): `#b59a69` (dark `#c8ae79`; `#cdb67f` on the bar)
- Play bar and forest bar: `linear-gradient(135deg, #344c3d, #2a4033)` (dark `#304638` to `#1d2d23`)
- Ink on gold: `#17261d`

### Self-Containment Checklist

Every prompt below satisfies:
- [x] Font family, size, weight, line-height, letter-spacing specified
- [x] All colors as hex (never "the primary color")
- [x] Padding, radius, shadow values included
- [x] OpenType features included if system uses them (none)
- [x] Hover/focus state values included
- [x] Transition values included

### Example Component Prompts

- "Build a surah heading on parchment `#ede4d2`, centred. A line '2 · Medina · 286 verses' in `Plus Jakarta Sans Variable` 13px with `tabular-nums`, colour `#6b6152`. Then the Latin name in `Space Grotesk Variable` 44px weight 600, line height 1.15, colour `#344c3d`, a 1px vertical rule of `#b59a69` at 60%, and the Arabic name in `Amiri` 52px, `dir=rtl lang=ar translate=no`, colour `#344c3d`. Below, the meaning in italic `#6b6152`, then a 1px hairline fading to transparent at both ends with a 8px diamond of `#b59a69` in the middle. Under it a play bar: a pill, `linear-gradient(135deg, #344c3d, #2a4033)`, minimum height 64px, max width 832px, padding 10px 26px 10px 10px, 1px border of `#b59a69` at 35%, shadow `0 10px 24px rgba(61, 52, 40, 0.16)`; inside, a 44px round gold button (`#cdb67f`, icon `#17261d`), the label 'Play the surah' (15px weight 600, white) over the reciter (12.5px, white at 72%), a slider (4px track, gold fill `#cdb67f`, 15px cream thumb) and the time '18:12 / 42:18' in 13px tabular figures. Under the bar, centred chips: background `#f8f2e7` at 70%, 1px border `#344c3d` at 60%, text `#344c3d`, 14px weight 500, padding 8px 14px, radius 12px; the selected one `#344c3d` with `#f8f2e7` text. Transition 150ms `cubic-bezier(0.4, 0, 0.2, 1)`."
- "Build a section card on a `#f5f2eb` page: background `#f8f2e7`, 1px border `#d9cbb5`, radius 16px, no shadow. Header row: title in `Space Grotesk Variable` 16px weight 600, line height 24px, colour `#3e3428`, padding 16px 24px, separated from the body by a 1px `#d9cbb5` rule. Body: padding 16px 24px, text `Plus Jakarta Sans Variable` 14px weight 400 line height 20px `#3e3428`, secondary lines 12px `#72685a`. An empty state is one sentence in 14px `#72685a` that names the action that fills the card."
- "Build a surah index row: `#f8f2e7`, 1px `#dfd3c1` border, radius 16px, padding 14px 16px, flex row with 16px gap. Left: a number chip (`#e4eadf`, 1px `#cdd8c9`, numeral `Space Grotesk Variable` 12px weight 700 `#344c3d`). Middle: name in `Plus Jakarta Sans Variable` 16px weight 600 `#3e3428`, meta below in 12px `#6b6152`. Right: Arabic name in `Amiri` 24px `#344c3d`, `dir=rtl lang=ar translate=no`, and a gold arrow `#b59a69` that shows on hover. Hover: border `#9b8a68` and shadow `rgba(0, 0, 0, 0.1) 0px 1px 3px 0px`, transition 150ms `cubic-bezier(0.4, 0, 0.2, 1)`."
- "Build a home hero: parchment `#ede4d2`, radius 28px, 1px border of `#b49a68` at 35%, padding 48px 56px, minimum height 480px. Text on the left (max width 34rem): eyebrow in 11px weight 700 with 0.24em tracking `#344c3d`, heading in `Space Grotesk Variable` 52px weight 600 `#3e3428`, description 16px line height 1.75 `#514536`, a search field (`#f8f2e7` at 92%, 1px `#d9cbb5`, pill) with an outline forest pill button, and a forest pill `#344c3d` with `#f8f2e7` text. The photograph is a CSS background on the right (`cover`, 78% 65%), faded into the parchment by a 90-degree gradient from `#ede4d2` to transparent at 62%. Below 1024px the photo is a block beside the heading and description and the form sits under both; in right to left it is on the left. Never put text over the photo and never mirror it."
- "Build a sticky site header: background `#f5f2eb` at 85% opacity with `backdrop-filter: blur`, bottom border 1px `#d9cbb5`, max width 1200px. Left: a 40px tile (radius 12px, `#344c3d`, 1px ring of `#b49a68` at 40%) with the book logo in cream and gold, and the wordmark 'QuranWeb' in `Space Grotesk Variable` 20px weight 700, letter-spacing -0.5px, `#344c3d`. Centre: text links 14px weight 500, `#3e3428` at 80%, 44px high, the current one `#344c3d` with a 2px underline. Right: round 40px buttons on `#f8f2e7` with a 1px `#d9cbb5` border; hover `#eee5d3`; focus outline 2px solid `#344c3d` with 2px offset."
- "Build a mushaf reading block inside a `#f8f2e7` surface with a 1px `#b49a68` border at 45% and an inset rule at 35%: one justified paragraph, `dir=rtl lang=ar translate=no`, `Amiri` 36px, line height 86.4px, `#3e3428`. After each verse a marker ﴿N﴾ with Arabic-Indic digits in `Amiri` 25.2px, `#b59a69`, in an inline button with 4px horizontal padding and a 6px radius; hover `#e8e2d4`. The playing verse gets a `#e8e2d4` background with a 4px radius. Font size must be `calc(2.25rem*var(--arabic-scale,1))` so the reader's text size applies."

### Iteration Guide

1. Start every page on `#f5f2eb` and put content in `#f8f2e7` cards with a 1px `#d9cbb5` border and 16px radius; use tokens, not colours of your own.
2. Choose the typeface by role: `Space Grotesk Variable` for names and numbers, `Plus Jakarta Sans Variable` for UI and translations, `Amiri` for Arabic.
3. Make Arabic the largest text in any reading view: 36px with an 86.4px line, `translate="no"`.
4. Use `#344c3d` for every action; gold is decoration (hairlines, rings, the active tab) and never small text on a light surface.
5. Show selection with `#e8e2d4`, not with weight or a shadow.
6. Add `transition: color, background-color, border-color 150ms cubic-bezier(0.4, 0, 0.2, 1)` to interactive elements and nothing else.
7. Check dark mode by swapping the tokens: page `#141c17`, card `#27352c`, text `#eee6d7`, forest `#a8c2a9`.
8. Keep the global keyboard ring (2px `#344c3d`, gold `#cdb67f` inside `.on-dark`); never hide it with `outline-none` on a new control.
## 14. Redesign Record and Open Work

This section replaces the separate redesign document (`docs/REDESIGN.md`, removed 2026-11-24) so that design lives in one file.

### Intent and boundaries

A visual identity distinct from the familiar EQuran.id-style layout, without rebuilding the application or changing a reading workflow: a calm digital reading room with the Qur'an at the centre. It is a visual redesign, not a product or data-model change.

- Do not change routes, query parameters, cookies, APIs, providers, selection IDs, user data, bookmarks, reading progress, audio, tafsir, search or sharing.
- Never add a way to edit Qur'an text, translations or tafsir; content comes from the verified providers and their credit paths.
- Keep all 25 interface languages, locale negotiation, right-to-left layout and the message catalogs; never hard-code a user-visible string.
- Keep the reader's Arabic and Latin scales, the Arabic font choice (Amiri or KFGQPC), tajweed colours and the light and dark preference.
- Keep About, Privacy and Terms one click from every page.
- Use logical CSS properties and test a right-to-left locale.
- Change fonts only after checking script coverage, licence, self-hosting, performance, Arabic shaping and the reader's font preference. The families did not change.

### Decisions (owner)

- 2026-11-24, direction: Editorial / Reading Experience, the line *QuranWeb -- A Quiet Place to Read*, the palette of section 2.
- 2026-11-24: the first pass left the header alone; the owner then supplied a reference mockup with a new header and lifted that rule. The header's look changed (section 4); the behaviour of search, language, theme and account did not.
- 2026-11-24: hero layouts chosen from mockups: desktop left to right and right to left, and phones with the mushaf beside the heading (never under the button). The photograph is not mirrored.
- 2026-11-24: this file is the single source of truth for design.

### Implemented

- PR #139: the reading surface in the editorial palette; hooks on the reader and verse cards.
- PR #140: the homepage composition (hero, verse of the day, the indexed surah list).
- The home page lists six surahs with suggestions from all 114 and a link to `/surahs` (2026-11-24); the header's "Surahs" lost its count.
- PR #142: the README screenshots (English and Indonesian) and `public/og.png`, retaken after the owner's approval; the play bar (owner's reference, 2026-11-24: mockup A2 and the phone mockup A, chosen by the owner) with the chips under it; one palette site-wide (the editorial tokens in `:root` and `.dark`, a night-green dark page, forest `--hero-from/to`, the installed app's theme colour); the centred surah heading and control bar on the surah page and on `/mushaf/N` and the forest control bar; the thin gold frame and the verse rings; the new header and `NavLink`; the hero photograph with its layouts; WebP assets.

### Checked on QA (2026-11-24)

- 80 page loads: English, Indonesian, Arabic, Urdu, Chinese, Thai, Japanese and Hindi, on `/`, `/surah/2`, `/mushaf/604`, `/settings` and `/about`, at 390px and 1280px: all answer 200 with an `h1`, no horizontal overflow, no console or network errors.
- By eye (light and dark where noted): the home page at 1280, 820, 390 and 360px, in English and Arabic; the surah page in English (light, dark) and Arabic (desktop, tablet, phone); the Tafsir tab; `/mushaf/604`; Settings (light, dark phone); My reading; Search; Privacy.
- Computed styles on `/surah/2` against this file: page, text, reading surface, parchment panel, heading, eyebrow and logo tile match the values written here (measured before the play bar replaced the control bar; the bar's own values are the CSS's).
- The play bar, tested on QA in a browser with a silent audio file: it plays and pauses one recording, its time and slider move, the keyboard moves the slider; a reciter with a file per verse starts at verse 1, shows "Verse 1 / 286", and moving the slider to 5 starts verse 5 ("Verse 5 / 286"), pausing keeps the verse; the Memorize panel opens under the chips; light, dark, phone and Arabic have no overflow and no errors.
- Not checked: the pages with sign-in signed in (the account menu), a non-Latin locale beyond the matrix on the surah page by eye (Tamil, Malayalam), and the print and installed-app views.

### Open work

- Full re-measure with the project's Playwright (computed styles of every visible element, light and dark): refresh the frequencies and the measured pixel values in this file and in `docs/design-tokens.json`, which holds the 2026-11-19 extraction plus an `editorial` group read from the source. The table of section 2 maps the old teal values to the new ones in the meantime.
- On a 390px phone the play bar (two lines) and the chips (three rows) still push the first verse just below the first screen; the next step would be folding the secondary controls, which needs a new message in 25 catalogs.
- The "Mushaf digital" tagline of the reference is not built (a new message in 25 catalogs).

### Acceptance

The redesign is done when the home page and the reading pages are visibly distinct from the previous look; nothing in the boundaries above changed; light and dark have intentional, readable contrast; desktop and phone have no horizontal overflow on long Arabic or translated text; Indonesian, English, one right-to-left and one non-Latin locale are checked; and Arabic font, scales, tajweed, anchors, audio, share, bookmark and the sidebar collapse still work.
