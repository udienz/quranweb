// Builds the surah view from the configured providers: edition registry, fallback
// between providers, and data checks.

import { checkJuzList } from "./juz";
import type { AudioProvider, TextProvider } from "./provider";
import type {
  Catalog,
  Edition,
  EditionKind,
  EditionText,
  JuzRef,
  Qari,
  Selection,
  SurahMeta,
  SurahView,
  VerseView,
} from "./types";

export interface QuranConfig {
  /** Order = priority: the first provider is tried first, the rest are fallbacks. */
  textProviders: TextProvider[];
  audioProviders: AudioProvider[];
  /** Default choices; every ID must exist in the catalog. */
  defaults: Selection;
  /** Defaults that replace the general ones for an interface language (e.g. an English translation for "en"). */
  localeDefaults?: Record<string, Partial<Selection>>;
}

function describeErrors(errors: unknown[]): string {
  return errors.map((e) => (e instanceof Error ? e.message : String(e))).join("; ");
}

export function createQuranService(config: QuranConfig) {
  const editions = new Map<string, { edition: Edition; providers: TextProvider[] }>();
  for (const provider of config.textProviders) {
    for (const edition of provider.editions()) {
      const known = editions.get(edition.id);
      if (!known) {
        editions.set(edition.id, { edition, providers: [provider] });
      } else if (known.edition.kind !== edition.kind) {
        throw new Error(
          `Edition "${edition.id}" is ${known.edition.kind} in one provider and ${edition.kind} in "${provider.id}"`,
        );
      } else {
        known.providers.push(provider);
      }
    }
  }

  const qaris = new Map<string, { qari: Qari; providers: AudioProvider[] }>();
  for (const provider of config.audioProviders) {
    for (const qari of provider.qaris()) {
      const known = qaris.get(qari.id);
      if (known) known.providers.push(provider);
      else qaris.set(qari.id, { qari, providers: [provider] });
    }
  }

  function requireEdition(id: string, kind: EditionKind): Edition {
    const found = editions.get(id);
    if (!found) throw new Error(`Edition "${id}" is not in the catalog`);
    if (found.edition.kind !== kind) {
      throw new Error(`Edition "${id}" has kind "${found.edition.kind}", expected "${kind}"`);
    }
    return found.edition;
  }

  function validate(selection: Selection): void {
    requireEdition(selection.arabic, "arabic");
    if (selection.transliteration) requireEdition(selection.transliteration, "transliteration");
    for (const id of selection.translations) requireEdition(id, "translation");
    if (selection.tafsir) requireEdition(selection.tafsir, "tafsir");
    if (!qaris.has(selection.qari)) throw new Error(`Reciter "${selection.qari}" is not in the catalog`);
  }

  // A wrong configuration must fail at startup, not when a page is opened.
  validate(config.defaults);
  for (const [locale, defaults] of Object.entries(config.localeDefaults ?? {})) {
    try {
      validate({ ...config.defaults, ...defaults });
    } catch (err) {
      throw new Error(`Invalid defaults for locale "${locale}": ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  /**
   * Merge a partial choice over the defaults (general, then the interface language's),
   * then check it against the catalog.
   */
  function resolveSelection(partial: Partial<Selection> = {}, locale?: string): Selection {
    const selection: Selection = {
      ...config.defaults,
      ...(locale ? config.localeDefaults?.[locale] : undefined),
      ...partial,
    };
    validate(selection);
    return selection;
  }

  async function getSurahList(): Promise<SurahMeta[]> {
    const errors: unknown[] = [];
    let list: SurahMeta[] | undefined;
    for (const provider of config.textProviders) {
      if (!provider.surahs) continue;
      try {
        list = await provider.surahs();
        break;
      } catch (err) {
        errors.push(err);
      }
    }
    if (!list) throw new Error(`The surah list could not be loaded: ${describeErrors(errors) || "no provider has it"}`);

    // Optional extras (e.g. English meanings) from any provider; failures only lose the extras.
    const extras = await Promise.all(
      config.textProviders.map((p) => p.surahMeanings?.().catch(() => ({}) as Record<number, Record<string, string>>)),
    );
    return list.map((surah) => {
      const meaning = { ...surah.name.meaning };
      for (const extra of extras) Object.assign(meaning, extra?.[surah.number]);
      return { ...surah, name: { ...surah.name, meaning } };
    });
  }

  /**
   * Where the 30 juz start and end, from the first provider that has them. A wrong table would make audio skip or repeat
   * verses, so it is checked against the surah list: 30 juz in order, the first at 1:1, the last at the end of surah 114,
   * every juz starting right after the previous one ends, and every verse number real.
   */
  async function getJuzList(): Promise<JuzRef[]> {
    const errors: unknown[] = [];
    let list: JuzRef[] | undefined;
    for (const provider of config.textProviders) {
      if (!provider.juzs) continue;
      try {
        list = await provider.juzs();
        break;
      } catch (err) {
        errors.push(err);
      }
    }
    if (!list) throw new Error(`The juz boundaries could not be loaded: ${describeErrors(errors) || "no provider has them"}`);
    checkJuzList(list, await getSurahList());
    return list;
  }

  async function getEditionText(edition: string, surah: number): Promise<EditionText> {
    const entry = editions.get(edition);
    if (!entry) throw new Error(`Edition "${edition}" is not in the catalog`);
    const errors: unknown[] = [];
    for (const provider of entry.providers) {
      try {
        return await provider.text(edition, surah);
      } catch (err) {
        errors.push(err);
      }
    }
    throw new Error(`Edition "${edition}" surah ${surah} could not be loaded: ${describeErrors(errors)}`);
  }

  function checkVerses(text: EditionText, meta: SurahMeta): void {
    const ok = text.verses.length === meta.verseCount && text.verses.every((v, i) => v.number === i + 1);
    if (!ok) {
      throw new Error(
        `Edition "${text.edition}" surah ${meta.number}: ${text.verses.length} verses, expected ${meta.verseCount} (numbered from 1)`,
      );
    }
  }

  function audioUrls(qari: string, surah: number, verse: number): string[] {
    const urls = (qaris.get(qari)?.providers ?? []).flatMap((p) => p.urls(qari, surah, verse));
    return [...new Set(urls)];
  }

  /**
   * The view of a surah: all of it, or only the verses from `range.from` to `range.to`
   * (inclusive), which keeps a page of a long surah small.
   */
  async function getSurahView(
    number: number,
    partial?: Partial<Selection>,
    locale?: string,
    range?: { from: number; to: number },
  ): Promise<SurahView> {
    if (!Number.isInteger(number) || number < 1 || number > 114) {
      throw new Error(`Invalid surah number: ${number}`);
    }
    const selection = resolveSelection(partial, locale);

    const ids = [
      selection.arabic,
      ...(selection.transliteration ? [selection.transliteration] : []),
      ...selection.translations,
      ...(selection.tafsir ? [selection.tafsir] : []),
    ];
    const [list, ...texts] = await Promise.all([
      getSurahList(),
      ...ids.map((id) => getEditionText(id, number)),
    ]);

    const meta = list.find((s) => s.number === number);
    if (!meta) throw new Error(`Surah ${number} is not in the surah list`);
    for (const text of texts) checkVerses(text, meta);

    const from = range?.from ?? 1;
    const to = range?.to ?? meta.verseCount;
    if (!Number.isInteger(from) || !Number.isInteger(to) || from < 1 || to < from || to > meta.verseCount) {
      throw new Error(`Invalid verse range ${from}-${to} for surah ${number} (${meta.verseCount} verses)`);
    }

    const byEdition = new Map(texts.map((t) => [t.edition, t]));
    const textOf = (id: string, i: number) => byEdition.get(id)!.verses[i].text;
    const notesOf = (id: string, i: number) => byEdition.get(id)!.verses[i].notes;

    const verses: VerseView[] = Array.from({ length: to - from + 1 }, (_, k) => k + from - 1).map((i) => ({
      number: i + 1,
      arabic: textOf(selection.arabic, i),
      transliteration: selection.transliteration ? textOf(selection.transliteration, i) : null,
      translations: selection.translations.map((id) => {
        const notes = notesOf(id, i);
        return { edition: id, text: textOf(id, i), ...(notes ? { notes } : {}) };
      }),
      tafsir: selection.tafsir ? textOf(selection.tafsir, i) : null,
      audio: audioUrls(selection.qari, number, i + 1),
    }));

    return {
      meta,
      selection,
      range: { from, to },
      editions: ids.map((id) => editions.get(id)!.edition),
      qari: qaris.get(selection.qari)!.qari,
      verses,
    };
  }

  function getCatalog(): Catalog {
    return {
      editions: [...editions.values()].map((e) => e.edition),
      qaris: [...qaris.values()].map((q) => q.qari),
    };
  }

  return { getSurahList, getJuzList, getCatalog, getSurahView, resolveSelection };
}

export type QuranService = ReturnType<typeof createQuranService>;
