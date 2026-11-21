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
npm run test:e2e   # browser tests against the build; needs Chromium (`npx playwright install chromium`)
```

CI runs the same commands on every pull request, and also builds and starts the Docker image.

## Licence of your contribution

QuranWeb's code is under the [MIT licence](LICENSE). By opening a pull request you agree that your contribution is under the
same licence. This is about code and interface text only: the Qur'an text, translations, tafsir and recitations keep the terms
of their sources and are never changed in a pull request.

The issue forms ("Bug report", "Translation mistake", "Feature idea") and the pull request template ask for what we need; please
follow them. The code of conduct is in [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) and security problems are reported privately,
see [SECURITY.md](SECURITY.md).

## The list of contributors

[CONTRIBUTORS.md](CONTRIBUTORS.md) thanks everyone who has contributed: the maintainer, the translators of each interface
language, and everyone else with a merged commit. It is generated from the GitHub history, so it is never edited by hand:
the maintainer runs `node scripts/update-contributors.mjs` after merging a contribution and commits the result
(`--check` says whether it is out of date). Bots are left out. A first-time contributor's commits are often not linked to
their GitHub account; the script then finds them through their merged pull request. The maintainer is credited as the
translator of a language only if `.github/CODEOWNERS` names them for it, not for a fix to someone else's catalog.

## Translating the interface

You can translate QuranWeb's interface (menus, buttons, settings, messages, and the About and privacy pages) into your
language. The interface is in Indonesian and English, and in Turkish, Malay, Bengali, French, Russian, Urdu, Arabic, Persian, Spanish,
Bosnian, Chinese, Thai, Uzbek, Tamil, Malayalam, German, Portuguese, Italian, Hindi, Swahili, Hausa, Japanese and Vietnamese
as community translations (see Review). Turkish was translated by a reader.
**The other twenty-two are first drafts made by Claude (an AI) at the owner's request**, published as community translations so that speakers can correct them: a review
of one of them, even of a few messages, is very welcome, and a reviewer can become that language's maintainer.

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
- **Plurals** use `plural(other, one)`, chosen by the language's CLDR rules. A language with more forms writes the
  object itself with `zero`, `one`, `two`, `few`, `many` and `other` as it needs (see `messages/ru.ts`, `messages/ar.ts`);
  `other` is required and comes last.
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
   may decide to publish it as a **community translation**: the language menu marks it ("Community") and offers a link to
   report a mistake (`COMMUNITY_LOCALES` in `src/lib/i18n/config.ts`). The label is removed once a second speaker has
   reviewed it. The first contributor of a language becomes its maintainer once their work has been reviewed by someone else.

The Indonesian catalog (`messages/id.ts`) is maintained by @udienz.
