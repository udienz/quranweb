# Contributing

Contributions come as pull requests on GitHub. Open an issue first for anything larger than a small fix, so we can agree
on the approach before you spend time on it. The project's conventions (stack, commands, code layout, the rule that
everything in the repository is written in English) are in [CLAUDE.md](CLAUDE.md).

Before you open a pull request, run:

```bash
npm ci
npm run lint
npm test
npm run build
```

CI runs the same commands on every pull request.

## Translating the interface

You can translate QuranWeb's interface (menus, buttons, settings, messages, and the About and privacy pages) into your
language. The interface is in English and Indonesian today.

**Only the interface is translated this way, never the Qur'an.** Translations of the meaning of the Qur'an and tafsir
come only from verified, published sources and are chosen by the reader as editions. A pull request that adds or changes
Qur'an content as part of a translation is not accepted.

### Start a new language

1. Add the language code (ISO 639-1, for example `ms`) to `LOCALES` and its own name to `LOCALE_NAMES` in
   `src/lib/i18n/config.ts`, and the `Intl` locale (for example `ms-MY`) to `INTL_LOCALE` in `src/lib/i18n/translate.ts`.
2. Copy `src/lib/i18n/messages/en.ts`, the source catalog, to `src/lib/i18n/messages/<code>.ts`, type the copy as
   `Messages` (look at `id.ts`), and translate every message.
3. Register the catalog in `src/lib/i18n/messages/index.ts`.
4. Give the names and credits of the editions and reciters a text in your language (`LocalizedText` in
   `src/lib/quran/providers/`). These are names of published works: translate the description, keep the title of the work
   as its publisher wrote it.
5. Run the checks above. TypeScript refuses a catalog with a missing key, and `npm test` checks that every language has
   the same keys as English, that no message is empty, and that the placeholders match.

Improving an existing language is the same, but only the catalog changes.

### How to translate

- **Placeholders** in braces (`{count}`, `{name}`, `{total}`, ...) are filled in by the app. Keep them exactly as they
  are, in the place your grammar needs; do not translate the word inside the braces.
- **Plurals** use `plural(other, one)`, chosen by the language's CLDR rules. Only the `one` and `other` forms are
  supported today. If your language needs more forms (`few`, `many`, ...), say so in the pull request.
- **Tone:** plain, calm and respectful, addressing the reader politely (in Indonesian, *Anda*). Short labels on buttons.
  Follow the meaning of the English message rather than its words.
- **Terms kept as they are** (in the spelling usual in your language): Allah, Qur'an, surah, juz, tafsir, khatam,
  mushaf. Words such as *verse* (Indonesian *ayat*) and *reciter* (Indonesian *qari*) are translated with the word your
  language normally uses for them.
- **Names of surahs, reciters, translators and sources** are not translated.

### Review

A translation is published only after another speaker of the language has reviewed it.

1. **Automatic checks** run first in CI (keys, placeholders, empty messages).
2. **A second speaker reviews it.** You do not approve your own translation. Each language has one or two language
   maintainers, listed in [.github/CODEOWNERS](.github/CODEOWNERS); GitHub asks them to review every change to their
   catalog. The project owner merges after their approval.
3. **A new language with no maintainer yet** stays open until someone else who speaks it has reviewed it, or the owner
   may decide to publish it as a community translation, marked as such. The first contributor of a language becomes its
   maintainer once their work has been reviewed by someone else.

The Indonesian catalog (`messages/id.ts`) is maintained by @udienz.
