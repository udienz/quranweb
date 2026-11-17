// Layanan yang menyusun tampilan surat dari provider yang dikonfigurasi:
// registri edisi, fallback antar provider, dan pemeriksaan data.

import type { AudioProvider, TextProvider } from "./provider";
import type {
  Catalog,
  Edition,
  EditionKind,
  EditionText,
  Qari,
  Selection,
  SurahMeta,
  SurahView,
  VerseView,
} from "./types";

export interface QuranConfig {
  /** Urutan = prioritas: provider pertama dicoba dulu, sisanya jadi cadangan. */
  textProviders: TextProvider[];
  audioProviders: AudioProvider[];
  /** Pilihan bawaan; semua ID-nya harus ada di katalog. */
  defaults: Selection;
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
          `Edisi "${edition.id}" bertipe ${known.edition.kind} di satu provider dan ${edition.kind} di "${provider.id}"`,
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
    if (!found) throw new Error(`Edisi "${id}" tidak ada di katalog`);
    if (found.edition.kind !== kind) {
      throw new Error(`Edisi "${id}" bertipe ${found.edition.kind}, bukan ${kind}`);
    }
    return found.edition;
  }

  function validate(selection: Selection): void {
    requireEdition(selection.arabic, "arabic");
    if (selection.transliteration) requireEdition(selection.transliteration, "transliteration");
    for (const id of selection.translations) requireEdition(id, "translation");
    if (selection.tafsir) requireEdition(selection.tafsir, "tafsir");
    if (!qaris.has(selection.qari)) throw new Error(`Qari "${selection.qari}" tidak ada di katalog`);
  }

  // Konfigurasi yang salah harus gagal sejak awal, bukan saat halaman dibuka.
  validate(config.defaults);

  /** Gabungkan pilihan sebagian dengan bawaan, lalu periksa terhadap katalog. */
  function resolveSelection(partial: Partial<Selection> = {}): Selection {
    const selection: Selection = { ...config.defaults, ...partial };
    validate(selection);
    return selection;
  }

  async function getSurahList(): Promise<SurahMeta[]> {
    const errors: unknown[] = [];
    for (const provider of config.textProviders) {
      if (!provider.surahs) continue;
      try {
        return await provider.surahs();
      } catch (err) {
        errors.push(err);
      }
    }
    throw new Error(`Daftar surat tidak bisa dimuat: ${describeErrors(errors) || "tidak ada provider"}`);
  }

  async function getEditionText(edition: string, surah: number): Promise<EditionText> {
    const entry = editions.get(edition);
    if (!entry) throw new Error(`Edisi "${edition}" tidak ada di katalog`);
    const errors: unknown[] = [];
    for (const provider of entry.providers) {
      try {
        return await provider.text(edition, surah);
      } catch (err) {
        errors.push(err);
      }
    }
    throw new Error(`Edisi "${edition}" surat ${surah} tidak bisa dimuat: ${describeErrors(errors)}`);
  }

  function checkVerses(text: EditionText, meta: SurahMeta): void {
    const ok =
      text.verses.length === meta.ayatCount && text.verses.every((v, i) => v.number === i + 1);
    if (!ok) {
      throw new Error(
        `Edisi "${text.edition}" surat ${meta.number}: ${text.verses.length} ayat, seharusnya ${meta.ayatCount} (berurutan dari 1)`,
      );
    }
  }

  function audioUrls(qari: string, surah: number, ayat: number): string[] {
    const urls = (qaris.get(qari)?.providers ?? []).flatMap((p) => p.urls(qari, surah, ayat));
    return [...new Set(urls)];
  }

  async function getSurahView(number: number, partial?: Partial<Selection>): Promise<SurahView> {
    if (!Number.isInteger(number) || number < 1 || number > 114) {
      throw new Error(`Nomor surat tidak valid: ${number}`);
    }
    const selection = resolveSelection(partial);

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
    if (!meta) throw new Error(`Surat ${number} tidak ada di daftar surat`);
    for (const text of texts) checkVerses(text, meta);

    const byEdition = new Map(texts.map((t) => [t.edition, t]));
    const textOf = (id: string, i: number) => byEdition.get(id)!.verses[i].text;

    const verses: VerseView[] = Array.from({ length: meta.ayatCount }, (_, i) => ({
      number: i + 1,
      arabic: textOf(selection.arabic, i),
      transliteration: selection.transliteration ? textOf(selection.transliteration, i) : null,
      translations: selection.translations.map((id) => ({ edition: id, text: textOf(id, i) })),
      tafsir: selection.tafsir ? textOf(selection.tafsir, i) : null,
      audio: audioUrls(selection.qari, number, i + 1),
    }));

    return {
      meta,
      selection,
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

  return { getSurahList, getCatalog, getSurahView, resolveSelection };
}

export type QuranService = ReturnType<typeof createQuranService>;
