<!-- Generated: 2026-11-19 | Source: https://quranweb.udienz.web.id | Pages: 5 | Framework: tailwindcss 4 | Format: v2 -->
<!-- Values come from the computed styles of every visible element (light and dark) in production and from src/app/globals.css; see docs/design-tokens.json. The UI audit fixes of 2026-11-19 (focus ring, tap areas, tabular figures, no header dot, no uppercase eyebrows) were measured on their build. -->
<!-- Generated with the design-md-generator method (https://github.com/jasonhnd/design-md-generator), extraction done with the project's own Playwright. -->

# Design System: QuranWeb

## 0. Brand Context

QuranWeb is a free reading site for the Qur'an: Arabic text, transliteration, translations, tafsir and verse-by-verse recitation, with an optional account that syncs reading progress.

Target audience: Indonesian readers first (the interface defaults to Indonesian), then English and Turkish readers. The layout has a phone version for every page. Secondary: people memorizing, who use repetition and hidden text.

**Brand personality:**
- Devotional (the Arabic text is set in `Amiri` at 36px with a 86.4px line, larger than any Latin headline on the page)
- Quiet (one chromatic brand colour, teal `#176c7d`, on a cream `#f5f2eb` canvas; gold `#d7a342` appears on 5 elements across the five pages)
- Bookish (`Space Grotesk` for titles, `Plus Jakarta Sans` for reading and for numbers, set with tabular figures so "036" and "36:1" line up)
- Patient (every interaction uses one 150ms transition, `cubic-bezier(0.4, 0, 0.2, 1)`; nothing animates on its own)

**Sources referenced:** `/`, `/surah/36`, `/settings`, `/my-reading`, `/about` on https://quranweb.udienz.web.id, in light and dark, desktop (1280px) and phone (390px).

## 1. Visual Theme & Atmosphere

QuranWeb's website is a printed mushaf laid on a reading desk -- a cream page and white index cards around one block of Arabic that is bigger and more widely spaced than anything else on screen.

The canvas is warm paper, `#f5f2eb`, never white; white `#ffffff` is reserved for cards and panels that sit on it, so every surface reads as a card placed on a page. Text is a deep green-grey, `#274045`, rather than black, and the only saturated colour is the teal `#176c7d`, used for links, the active page number and the selected layout. The one dark surface is the surah header: a 135-degree gradient from `#104f5b` to `#082026` that frames the surah title like the illuminated head of a chapter.

Typography splits three ways by script and purpose. `Space Grotesk` carries identity (the "QuranWeb" wordmark at 20px weight 700 with -0.5px tracking, page titles at 24px 600). `Plus Jakarta Sans` carries the interface at 14px weight 500 and the translation at 15px with a 24.375px line. `Amiri` carries the revelation itself: 36px with an 86.4px line height (2.4), a ratio no Latin text on the site comes near.

The technique that defines the system is the pair of scale variables `--arabic-scale` and `--latin-scale`. Reading text never uses a fixed size; it is written as `calc(2rem*var(--arabic-scale,1))`, so the reader can enlarge Arabic and Latin separately (85% to 150%) without touching any label or button.

In the mushaf layout the Arabic takes the wider, right-hand column (3 parts to the translation's 2), at 36px against the translation's 15px. Most of the visual weight on a reading page belongs to the Arabic.

**Design Principles:**
- **Arabic first**: the Arabic text is the largest and most spacious element of every reading view; Latin text yields to it.
- **Paper and cards**: depth comes from a white card on a cream page and a 1px border, almost never from shadows.
- **One accent, two jobs**: teal marks what can be acted on; gold marks what matters (verse markers, the current surah, the main call to action).
- **Reader-owned scale**: reading text scales by the reader's choice through CSS variables; chrome does not.

**Key Characteristics:**
- Warm paper canvas -- `#f5f2eb` body, `#ffffff` only on cards
- Green-grey ink -- body text `#274045`, secondary `#596e73`
- A single interactive colour -- teal `#176c7d` for links, active states and focus borders
- Gold for ornament and for the one main action -- `#d7a342` on verse markers ﴿١﴾, the surah badge ring and the hero button
- Chapter-head gradient -- `linear-gradient(135deg, #104f5b, #082026)` behind every surah title
- Arabic set larger than any heading -- `Amiri` 36px, line height 86.4px
- Translation in a reading measure -- 15px `Plus Jakarta Sans`, line height 24.375px (1.625)
- Cards drawn with borders -- 1px `#e0e8e4` borders appear 204 times; the only drop shadow appears 14 times
- Two radii carry most of the shapes -- 16px on cards, fully rounded pills on buttons and chips
- Reader-controlled type -- `--arabic-scale` and `--latin-scale`, five steps from 85% to 150%
- Every state change in 150ms -- `cubic-bezier(0.4, 0, 0.2, 1)` on colour, background and border

## 2. Color Palette & Roles

The system defines nine HSL tokens in `src/app/globals.css` (`--background`, `--foreground`, `--card`, `--muted`, `--muted-foreground`, `--border`, `--primary`, `--primary-soft`, `--gold`) plus two for the hero gradient. Components use them through Tailwind (`bg-card`, `text-primary`, `border-border`). Frequencies below are counts of visible elements over the five pages in light mode.

### Brand Colors

#### Accent

- **Mushaf Teal** (`#176c7d`): frequency 340. Used as text (327), background (13). CSS var: `--primary` (`190 69% 29%`). Links, the active page number, the selected layout segment, focus borders on inputs, verse numbers. A deep blue-green with enough weight to read as ink on cream.
- **Illumination Gold** (`#d7a342`): frequency 5 (10 before a decorative dot in the header was removed). Used as background (2), text (3). CSS var: `--gold` (`39 65% 55%`). The hero call to action, verse markers ﴿N﴾ in the mushaf block, the ring around the surah badge, the 2px left edge of the current surah in the list. A muted ochre that reads as gilt rather than as yellow.
- **Gold Ink** (`#092d34`): frequency 2. Used as text (2). Defined inline as `hsl(190 70% 12%)`. Text on gold buttons and on the active Reading/Tafsir tab. Nearly black teal, so gold buttons keep the brand hue in their label.

#### Chapter Head

- **Hero Teal** (`#104f5b`): frequency 2. Used as gradient (2). CSS var: `--hero-from` (`190 70% 21%`). Start of the 135-degree gradient on the surah header and the home hero.
- **Hero Night** (`#082026`): frequency 2. Used as gradient (2). CSS var: `--hero-to` (`192 64% 9%`). End of the same gradient; white text on it measures 16.87:1.

### Structural Colors

- **Paper** (`#f5f2eb`): frequency 32. Used as background (32). CSS var: `--background` (`42 33% 94%`). The page itself. A cream with a faint yellow cast.
- **Card White** (`#ffffff`): frequency 184. Used as background (175), text (9). CSS var: `--card` (`0 0% 100%`). Cards, panels, the reader body, the settings sections; white text on teal and on the hero.
- **Ink** (`#274045`): frequency 412. Used as text (412). CSS var: `--foreground` (`190 28% 21%`). All primary text. A green-grey that matches the teal's hue family.
- **Faded Ink** (`#596e73`): frequency 435. Used as text (435). CSS var: `--muted-foreground` (`191 13% 40%`). Meta lines ("286 ayat · Madinah"), hints, placeholders, inactive tabs. The most frequent text colour on the site, which keeps the page calm.
- **Rule** (`#e0e8e4`): frequency 204. Used as border (204). CSS var: `--border` (`146 14% 89.5%`). Every card edge, divider and input border. A grey with a hint of green.
- **Teal Wash** (`#e2f0f3`): frequency 115. Used as background (115). CSS var: `--primary-soft` (`190 40% 92%`). The current surah in the list, the playing verse, chips, hover fills. A pale blue that marks "selected".
- **Linen** (`#ede9de`): frequency 1. Used as background (1). CSS var: `--muted` (`44 29% 90%`). Hover fill on secondary buttons and the track of progress bars.

### Color Boundary Rules

- Teal `#176c7d` is the only colour that means "you can act on this". Gold `#d7a342` decorates and marks importance, and is used as a button fill only for the single main action of a view.
- `bg-red-600` appears only on the account-deletion and admin buttons; it is not part of the reading palette and never appears on reading pages.
- The hero gradient (`#104f5b` to `#082026`) is the only dark surface in light mode. Do not add other dark panels.
- Every colour comes from a token; reading text never uses an arbitrary colour. The single inline value is the gold-button ink `#092d34`.

### Dark Mode Overrides

See Section 2.5: nine of the eleven tokens change, the hero gradient does not.

## 2.5. Dark Mode System

### Detection Method

A `dark` class on `<html>` (`@custom-variant dark (&:where(.dark, .dark *))`). The class comes from local storage `theme` (`light`, `dark`, or none for auto); in auto it follows `prefers-color-scheme`. An inline script in `<head>` applies it before the first paint, so there is no flash.

### Color Mapping Table

#### Backgrounds & Surfaces

| Variable | Light Value | Dark Value | Role |
|---|---|---|---|
| `--background` | `#f5f2eb` | `#071b20` | Page |
| `--card` | `#ffffff` | `#0d252b` | Cards, panels, reader body |
| `--primary-soft` | `#e2f0f3` | `#153038` | Selected and playing rows, chips |
| `--muted` | `#ede9de` | `193 46% 15%` (same value as `--primary-soft`) | Hover fill, progress track |

#### Text Colors

| Variable | Light Value | Dark Value | Role |
|---|---|---|---|
| `--foreground` | `#274045` | `#e6eff0` | Body text |
| `--muted-foreground` | `#596e73` | `#a0b2b6` | Meta and hints |
| `--primary` | `#176c7d` | `#3db8ab` | Links, active states |
| `--gold` | `#d7a342` | `#dfb85d` | Markers, main action |

#### Borders

| Variable | Light Value | Dark Value | Role |
|---|---|---|---|
| `--border` | `#e0e8e4` | `#1f3337` | Card edges, dividers, input borders |

#### Unchanged

`--hero-from` (`#104f5b`) and `--hero-to` (`#082026`) are not redefined in `.dark`: the chapter head is the same in both modes.

### Dark Surface Stack

1. **Night Page** (`#071b20`) -- the page
2. **Deep Card** (`#0d252b`) -- cards and the reader body
3. **Raised Wash** (`#153038`) -- selected rows, chips, hover

### Dark Text Ladder

1. `#e6eff0` -- body text, 15.14:1 on the page, 13.65:1 on cards
2. `#3db8ab` -- links and active states, 6.56:1 on cards
3. `#a0b2b6` -- meta and hints, 7.24:1 on cards
4. `#071c21` -- text on teal and gold fills (7.22:1 on `#3db8ab`)

### Dark Shadow Adjustments

Shadows are unchanged between modes; the one drop shadow (`rgba(0, 0, 0, 0.1)`) almost disappears on `#0d252b`, so dark mode relies entirely on the surface stack and the `#1f3337` borders.

### Dark Component Overrides

- Buttons with a teal or gold fill switch their label from white or `#092d34` to `#071c21`, because the dark teal `#3db8ab` is light enough to need dark text.
- The hero gradient stays, so the surah header becomes the lightest element on a dark page rather than the darkest.

### Implementation Notes

Tokens are raw HSL triplets (`190 69% 29%`) wrapped by Tailwind's `@theme inline` as `hsl(var(--primary))`, so opacity variants (`ring-gold/60`, `bg-background/85`) work. Switching modes only swaps the triplets; no component has a `dark:` colour of its own except the ink on filled buttons.

**Dark Mode Strategy:** **Lamp-lit teal** -- the hue family stays teal throughout; only lightness inverts, and the accent shifts from deep teal to a brighter sea green.

The hierarchy compresses in dark mode: in light mode, muted text (`#596e73`) on white is 5.38:1 while body text is 11.02:1; in dark mode they are 7.24:1 and 13.65:1, so secondary text gains weight and the page reads more evenly. The brighter accent `#3db8ab` also carries more visual weight against `#0d252b` than `#176c7d` does against white, so links stand out more at night.

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
| Home Headline | Space Grotesk Variable | 30px (1.88rem) | 700 | 36px | normal | - | "Baca Al-Qur'an"; 24px below 640px |
| Page Title | Space Grotesk Variable | 24px (1.50rem) | 600 | 32px | normal | - | "Bacaan saya", "Pengaturan" |
| Wordmark | Space Grotesk Variable | 20px (1.25rem) | 700 | 28px | -0.5px | - | "QuranWeb" in the header |
| Surah Title | Space Grotesk Variable | 20px (1.25rem) | 700 | 28px | normal | - | "Yasin" in the chapter head |
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
| Hero Bismillah | Amiri | 36px (2.25rem) | 400 | 40px | normal | - | Home hero, `#d7a342`; 30px below 640px (kept short so "continue reading" stays high) |
| Bismillah | Amiri | 36px (2.25rem) | 400 | 54px | normal | - | Above every surah but 1 and 9 |
| Arabic Surah Name | Amiri | 24px (1.50rem) | 400 | 32px | normal | - | Grid cards; 18px/28px in the side list |

### Named Strategies

- **Script sovereignty**: Arabic text is 18px in the surah list, 24px in the grid and 36px with an 86.4px line in reading views, while the largest Latin heading is 30px (the only smaller Arabic is the letter ع on the text-size buttons). Architectural benefit: the reading text keeps its rank even when a reader enlarges Latin text to 150%.
- **Three families, three jobs**: `Space Grotesk` only names things (titles, numbers, wordmark), `Plus Jakarta Sans` only explains them, `Amiri` only carries the revelation. Architectural benefit: a reader can tell UI from scripture by typeface alone.
- **Weight over size in the interface**: chrome lives at 12px and 14px and gets its hierarchy from weight (400, 500, 600). Architectural benefit: navigation stays compact so the reading column keeps its width.
- **Variables, not breakpoints, for reading size**: reading text is `calc(<base>*var(--arabic-scale,1))`; only the mushaf Arabic also steps up at 640px (2rem to 2.25rem). Architectural benefit: size follows the reader, not the device.

## 4. Component Stylings

### Buttons

**Gold Pill (main action)**
- Background: `#d7a342`
- Text: `#092d34`, 14px `Plus Jakarta Sans Variable` weight 600
- Padding: 10px 24px on page-level actions, 8px 16px inside panels
- Radius: fully rounded (`rounded-full`)
- Disabled: opacity 0.5 -- keeps the gold visible so the reader knows what will become available
- Transition: `color, background-color, border-color 0.15s cubic-bezier(0.4, 0, 0.2, 1)`
- Use: Main call to action ("Mulai dari Al-Fatihah" on the home page and the 404 page, "Mulai" in the Memorize panel)

**Tab (on the chapter head)**
- Active: background `#d7a342`, text `#092d34`, 14px weight 600, padding 8px 20px, fully rounded
- Inactive: transparent, 1px border white at 15% opacity, text white at 85%
- Hover (inactive): background white at 10% -- a lift that stays inside the dark gradient
- Use: Reading / Tafsir switch ("Bacaan", "Tafsir"), "Hafalan" toggle

**Outline Pill (secondary)**
- Background: transparent; border 1px `#e0e8e4`
- Text: `#274045`, 12px weight 500
- Padding: 4px 12px; radius fully rounded
- Hover: background `#f5f2eb` -- sinks into the page colour rather than darkening
- Disabled: opacity 0.6
- Use: "Unduh cadangan", "Impor cadangan", small actions in My reading

**Segmented Control**
- Track: `#f5f2eb`, radius fully rounded
- Selected segment: background `#176c7d`, text `#ffffff`
- Unselected: text `#596e73`
- Use: Layout choice ("Mushaf", "Per ayat"), theme ("Terang", "Gelap", "Otomatis")

**Icon Button (verse actions, header controls)**
- 36px round on verses, 40px round in the header (header ones add a 1px `#e0e8e4` border on `#ffffff`)
- Icon 16px (verses) or 18px (header), stroke 2, `currentColor`
- Active (bookmarked): background `#e2f0f3`, icon `#176c7d`
- Hover: background `#ede9de` -- the linen fill darkens the button slightly without borrowing the "selected" wash
- Use: Play, bookmark, mark as read, copy, link on each verse; the theme toggle and language menu

### Inputs and Selects

**Select / Text Field**
- Background: `#f5f2eb` (on cards) or `#ffffff`
- Border: 1px `#e0e8e4`; radius 12px
- Text: 14px `#274045`; padding 8px 12px
- Focus: border becomes `#176c7d` (`focus:border-primary`), and the keyboard ring below appears as well
- Use: "Cari nama atau nomor...", "Ayat per hari", the translation language list

**Dark Select (on the chapter head)**
- Transparent background, 1px border white at 15%, text `#d7a342`, radius 12px
- Options: background `hsl(192 64% 9%)`, white text
- Use: "Ayat...", "Juz...", "Berhenti di akhir"

### Cards

**Section Card**
- Background: `#ffffff`; border 1px `#e0e8e4`; radius 16px
- Header row: 16px `Space Grotesk` weight 600, separated by a 1px `#e0e8e4` rule
- Padding: 16px to 24px
- Use: "Terakhir dibaca", "Target harian", every settings section

**Surah Card (home grid)**
- Background: `#ffffff`; border 1px `#e0e8e4`; radius 16px; padding 14px 16px; 16px gap
- Left: number in a 36px diamond rotated 45 degrees, radius 6px (background `#e2f0f3`, numeral 12px `Space Grotesk` 700 in `#176c7d`)
- Middle: surah name 16px weight 600, meta 12px `#596e73`
- Right: Arabic name, `Amiri` 24px
- Hover: border becomes `#176c7d` at 50% and the small shadow appears -- the card lifts off the page as the link target
- Use: the 114 surah links ("Al-Fatihah · Pembukaan · 7 ayat · Mekah")

### Navigation

**Header**
- Sticky, background `#f5f2eb` at 85% opacity with `backdrop-blur`, bottom border 1px `#e0e8e4`
- Wordmark 20px `Space Grotesk` 700, -0.5px tracking, in `#176c7d`, next to the book logo
- Right side: language menu, theme toggle, account menu: 40px round buttons, 1px `#e0e8e4` border on `#ffffff`, hover `#ede9de`
- Language menu: 240px wide, scrolls inside itself; languages in alphabetical order of their own names, each with a 20×14px
  flag (inline SVG, 2px radius, a 1px ring at 10% black so white flags stay visible) before the name; a community
  translation has an asterisk after the name in `#176c7d` (gold `#d7a342` is only 2.3:1 on white), explained by a 12px
  note in `--muted-foreground` under the list
- Use: every page

**Surah List (side panel)**
- Rows: index in tabular figures `#596e73`, name 14px weight 500, Arabic name `Amiri` 18px
- Current surah: background `#e2f0f3`, 2px left edge in `#d7a342`
- Use: the side panel and the phone panel "Daftar surat dan pengaturan"

### Distinctive Components

**Chapter Head**
- Background: `linear-gradient(135deg, #104f5b, #082026)`; radius 16px; padding 20px (24px sides from 640px); the system's small shadow
- Surah number in a 44px diamond: 1px ring of `#d7a342` at 60% opacity, numeral `#d7a342`
- Title 20px `Space Grotesk` 700 white; Arabic name `Amiri` 30px in `#d7a342`
- Use: top of every surah page ("Yasin", "Al-Baqarah")

**Mushaf Block**
- One justified paragraph of Arabic (`Amiri` 36px, line height 86.4px) with a marker ﴿N﴾ after each verse in `#d7a342`
- The playing verse gets a `#e2f0f3` background
- Beside it (from 1024px), a numbered translation column with a 1px `#e0e8e4` rule between them
- Use: the default Reading layout

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
- Medium (8px): the chapter-head diamond -- 2 occurrences

## 6. Depth & Elevation

**Named principle:** Paper depth -- elevation comes from a white card on a cream page and a 1px border, not from shadow.

| Level | Treatment | Frequency | Use |
|---|---|---|---|
| Flat | none | - | Page, list rows |
| Card | 1px `#e0e8e4` border on `#ffffff` | 204 | Every card and panel |
| Lifted | `rgba(0, 0, 0, 0.1) 0px 1px 3px 0px, rgba(0, 0, 0, 0.1) 0px 1px 2px -1px` | 14 | The chapter head at rest; surah and continue-reading cards on hover |
| Ring | 1px ring of gold at 60% (`ring-1 ring-gold/60`) | 2 | Surah badge on the chapter head |

**Dominant shadow:** `rgba(0, 0, 0, 0.1) 0px 1px 3px 0px, rgba(0, 0, 0, 0.1) 0px 1px 2px -1px` (14 occurrences) -- Tailwind's `shadow-sm`, on the chapter head and on cards while hovered. Things that float above the page (the language and account menus, the reciter list, the mushaf verse bar) use `shadow-lg` when open.

QuranWeb has one small resting shadow and lets the cream-to-white step do the rest: `#f5f2eb` to `#ffffff` is a visible edge on its own, and the `#e0e8e4` border sharpens it. The result is a page that stays flat enough to read for an hour, and a dark mode that needs no shadow changes at all.

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
- Put cards on the cream page -- `#ffffff` card, 1px `#e0e8e4` border, 16px radius, on `#f5f2eb`
- Use teal `#176c7d` for anything clickable that is not the single main action
- Give the main action of a view the gold pill -- `#d7a342` fill, `#092d34` label, fully rounded, 8px 16px
- Mark selection with the wash -- `#e2f0f3` background (dark: `#153038`), never with bold text alone
- Keep Arabic in `Amiri` with `dir="rtl" lang="ar" translate="no"` and a line height of at least 2.4 in reading views
- Use one transition everywhere -- `150ms cubic-bezier(0.4, 0, 0.2, 1)` on colour, background and border
- Reuse the chapter-head gradient for any dark hero -- `linear-gradient(135deg, #104f5b, #082026)`
- Write tokens as HSL triplets in `globals.css` (`--primary: 190 69% 29%`) so `/60`-style opacity variants keep working

### Don'ts

- Don't set the Arabic smaller than the translation -- in this system the Arabic is the main text; keep it at 36px against a 15px translation
- Don't use black ink on cream -- text is `#274045` (9.86:1 on `#f5f2eb`, 11.02:1 on white), already far above AA; black adds contrast nobody needs and breaks the teal family
- Don't put gold on a button that is not the main action -- gold `#d7a342` is on 5 elements across five pages; more than one gold button per view dilutes it
- Don't give resting cards a shadow -- depth here is the `#e0e8e4` border; `shadow-sm` (`rgba(0, 0, 0, 0.1) 0px 1px 3px 0px`) is for hover and the chapter head, `shadow-lg` only for things that float (menus, the verse bar)
- Don't use a white page background -- `#ffffff` is the card colour; a white page erases the card edges
- Don't machine-translate or restyle the Arabic -- every Arabic element carries `translate="no"`; no letter-spacing, no italic, no `font-weight` above 400 in reading views
- Don't size reading text with breakpoints alone -- use `--arabic-scale` / `--latin-scale`; a breakpoint step (2rem to 2.25rem at 640px) is the only exception
- Don't add a second accent hue -- red appears only on account deletion; a new feature uses teal, gold or the wash
- Don't animate on entry -- panels and menus appear instantly; motion is limited to 150ms state transitions

## 9. Accessibility Contract

**Inferred target:** WCAG 2.1 AA. Evidence: every text pair measured passes 4.5:1 except gold on the hero teal (large text only), ARIA attributes are used throughout (150 `aria-label`), and Arabic carries `lang="ar"`.

### Contrast Ratios

| Role | Foreground | Background | Ratio | Pass (AA) |
|---|---|---|---|---|
| Body on page | `#274045` | `#f5f2eb` | 9.86:1 | Yes |
| Body on card | `#274045` | `#ffffff` | 11.02:1 | Yes |
| Meta on card | `#596e73` | `#ffffff` | 5.38:1 | Yes |
| Meta on page | `#596e73` | `#f5f2eb` | 4.81:1 | Yes |
| Link on card | `#176c7d` | `#ffffff` | 6.04:1 | Yes |
| Link on wash | `#176c7d` | `#e2f0f3` | 5.17:1 | Yes |
| White on teal | `#ffffff` | `#176c7d` | 6.04:1 | Yes |
| Ink on gold | `#092d34` | `#d7a342` | 6.41:1 | Yes |
| Gold on hero | `#d7a342` | `#104f5b` | 4.02:1 | Large text only |
| Dark: body on card | `#e6eff0` | `#0d252b` | 13.65:1 | Yes |
| Dark: meta on card | `#a0b2b6` | `#0d252b` | 7.24:1 | Yes |
| Dark: link on card | `#3db8ab` | `#0d252b` | 6.56:1 | Yes |
| Dark: ink on teal | `#071c21` | `#3db8ab` | 7.22:1 | Yes |

Gold on the hero is used for the Arabic surah name (30px) and the badge numeral; keep it at 18px or larger, or 14px bold, where 3:1 is enough.

### Focus Indicators

- Every control, on keyboard focus (`:focus-visible`): `outline: 2px solid` in `--primary` (`#176c7d`, dark `#3db8ab`) with a 2px offset. On the dark chapter head and the home hero (`.on-dark`) the ring is gold `#d7a342`.
- The rule is unlayered in `globals.css`, so a utility such as `outline-none` cannot remove it; inputs also turn their border `#176c7d`.
- Until 2026-11-19 buttons and links had only the browser's default ring, which was nearly invisible on the chapter head.
- Ring contrast against what surrounds it (3:1 needed): teal `#176c7d` 5.40:1 on `#f5f2eb`, 6.04:1 on `#ffffff`, 5.17:1 on `#e2f0f3`; dark teal `#3db8ab` 7.28:1 on `#071b20`, 6.56:1 on `#0d252b`; gold `#d7a342` 4.02:1 on `#104f5b` (the weakest pair) and 7.40:1 on `#082026`; dark gold `#dfb85d` 4.87:1 and 8.96:1.

### Touch/Click Targets

- Header controls: 40px round buttons
- Verse action buttons and page numbers: 36px to look at, 44px to tap -- an `::after` layer reaches past the edge (`after:-inset-1`, `after:-inset-1.5` where a 1px border sits inside)
- Gold pill: 40px high on pages (10px + 20px line + 10px), 36px in panels
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
- Chapter-head controls: one row at 1024px -> wrap onto two or three rows on phones

### Image Behavior

- The site has no photographs; the only images are the logo and icons (inline SVG), which scale with their container.
- App icons for installing: 192px and 512px PNG, plus a full-bleed maskable 512px.
- The link preview image, `public/og.png` (1200 by 630): the logo and the wordmark in cream on the hero gradient, the Bismillah in gold
  Amiri, a one-line tagline and the address. Drawn by `scripts/og-image.mjs`; redraw it with the icons if the brand changes.
- Screenshots in the README are the only raster images in the project.

## 11. State Matrix

| Component | Loading | Empty | Error | Disabled | Success |
|---|---|---|---|---|---|
| Gold pill | - | n/a | - | opacity 0.5 | n/a |
| Outline pill | - | n/a | - | opacity 0.6 | - |
| Settings section | `aria-busy` while a choice saves | n/a | - | n/a | page refreshes with the choice |
| Section card (My reading) | n/a | "Belum ada bacaan tersimpan..." in `#596e73` | - | n/a | n/a |
| Surah search | n/a | - | n/a | n/a | n/a |
| Verse audio | "Jeda audio" icon while playing | n/a | falls back to the next server, then stops | n/a | `#e2f0f3` on the playing verse |
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

- Page: `#f5f2eb` (dark `#071b20`)
- Card: `#ffffff` (dark `#0d252b`)
- Text: `#274045` (dark `#e6eff0`)
- Muted text: `#596e73` (dark `#a0b2b6`)
- Border: `#e0e8e4` (dark `#1f3337`)
- Teal (action): `#176c7d` (dark `#3db8ab`)
- Wash (selected): `#e2f0f3` (dark `#153038`)
- Gold (main action, markers): `#d7a342` (dark `#dfb85d`)
- Ink on gold: `#092d34`
- Hero gradient: `#104f5b` to `#082026`

### Self-Containment Checklist

Every prompt below satisfies:
- [x] Font family, size, weight, line-height, letter-spacing specified
- [x] All colors as hex (never "the primary color")
- [x] Padding, radius, shadow values included
- [x] OpenType features included if system uses them (none)
- [x] Hover/focus state values included
- [x] Transition values included

### Example Component Prompts

- "Build a chapter header card: background `linear-gradient(135deg, #104f5b, #082026)`, radius 16px, padding 20px 24px, white text, shadow `rgba(0, 0, 0, 0.1) 0px 1px 3px 0px, rgba(0, 0, 0, 0.1) 0px 1px 2px -1px`. Left: a 44px square rotated 45 degrees with a 1px ring of `#d7a342` at 60% opacity and the number in `Space Grotesk Variable` 14px weight 700 `#d7a342`. Next to it the title in `Space Grotesk Variable` 20px weight 700, line height 28px, and a meta line in `Plus Jakarta Sans Variable` 12px with `tabular-nums`, white at 70%. Right: the Arabic name in `Amiri` 30px, line height 36px, colour `#d7a342`, `dir=rtl`. Below a 1px rule of white at 15%: two pill tabs, padding 8px 20px, 14px weight 600 -- active `#d7a342` fill with `#092d34` text, inactive transparent with a 1px border of white at 15% and white text at 85%, hover background white at 10%, transition 150ms `cubic-bezier(0.4, 0, 0.2, 1)`."
- "Build a section card on a `#f5f2eb` page: background `#ffffff`, 1px border `#e0e8e4`, radius 16px, no shadow. Header row: title in `Space Grotesk Variable` 16px weight 600, line height 24px, colour `#274045`, padding 16px 24px, separated from the body by a 1px `#e0e8e4` rule. Body: padding 16px 24px, text `Plus Jakarta Sans Variable` 14px weight 400 line height 20px `#274045`, secondary lines 12px `#596e73`. An empty state is one sentence in 14px `#596e73` that names the action that fills the card."
- "Build a surah grid card: `#ffffff`, 1px `#e0e8e4` border, radius 16px, padding 14px 16px, flex row with 16px gap. Left: a 36px diamond (square rotated 45 degrees, radius 6px) filled `#e2f0f3` with the number in `Space Grotesk Variable` 12px weight 700 `#176c7d`. Middle: name in `Plus Jakarta Sans Variable` 16px weight 600 line height 24px `#274045`, meta below in 12px weight 400 `#596e73` ('Pembukaan · 7 ayat · Mekah'). Right: Arabic name in `Amiri` 24px line height 32px `#274045`, `dir=rtl lang=ar translate=no`. Hover: border `#176c7d` at 50% opacity plus shadow `rgba(0, 0, 0, 0.1) 0px 1px 3px 0px, rgba(0, 0, 0, 0.1) 0px 1px 2px -1px`, transition 150ms `cubic-bezier(0.4, 0, 0.2, 1)`."
- "Build a pill badge: fully rounded, padding 4px 12px, background `#e2f0f3`, text `#176c7d` in `Plus Jakarta Sans Variable` 12px weight 500 line height 16px, no border, no shadow. For a removable label add a 12px close icon (24px grid, stroke 2, `currentColor`) with an 8px gap and `aria-label` naming what it removes."
- "Build a sticky site header: background `#f5f2eb` at 85% opacity with `backdrop-filter: blur`, bottom border 1px `#e0e8e4`, max width 1200px, padding 12px 16px. Left: a 32px book logo and the wordmark 'QuranWeb' in `Space Grotesk Variable` 20px weight 700, letter-spacing -0.5px, colour `#176c7d`. Right: three 40px round buttons, background `#ffffff`, 1px `#e0e8e4` border, no shadow, icons 18px stroke 2 `#274045`; hover background `#ede9de`; focus outline 2px solid `#176c7d` with 2px offset; transition 150ms `cubic-bezier(0.4, 0, 0.2, 1)`."
- "Build a mushaf reading block inside a `#ffffff` card: one justified paragraph, `dir=rtl lang=ar translate=no`, font `Amiri` 36px weight 400, line height 86.4px, colour `#274045`. After each verse place a marker ﴿N﴾ with Arabic-Indic digits in `Amiri` 25.2px, colour `#d7a342`, inside an inline button with 4px horizontal padding and a 6px radius; hover background `#e2f0f3`. The playing verse gets a `#e2f0f3` background with a 4px radius. Font size must be `calc(2.25rem*var(--arabic-scale,1))` so the reader's text size applies."

### Iteration Guide

1. Start every page on `#f5f2eb` and put content in `#ffffff` cards with a 1px `#e0e8e4` border and 16px radius.
2. Choose the typeface by role: `Space Grotesk Variable` for names and numbers, `Plus Jakarta Sans Variable` for UI and translations, `Amiri` for Arabic.
3. Make Arabic the largest text in any reading view: 36px with an 86.4px line, `translate="no"`.
4. Use `#176c7d` for every action; use `#d7a342` with `#092d34` text for at most one main action per view.
5. Show selection with `#e2f0f3`, not with weight or a shadow.
6. Add `transition: color, background-color, border-color 150ms cubic-bezier(0.4, 0, 0.2, 1)` to interactive elements and nothing else.
7. Check dark mode by swapping the tokens: page `#071b20`, card `#0d252b`, text `#e6eff0`, teal `#3db8ab`.
8. Keep the global keyboard ring (2px `#176c7d`, gold `#d7a342` inside `.on-dark`); never hide it with `outline-none` on a new control.
