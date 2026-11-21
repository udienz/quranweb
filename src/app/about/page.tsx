import type { Metadata } from "next";
import Link from "next/link";
import { getQuran } from "@/lib/quran";
import type { Edition, EditionKind, SourceInfo } from "@/lib/quran/types";
import { localized } from "@/lib/i18n/translate";
import { getI18n } from "@/lib/i18n/server";
import { languageNamer } from "@/lib/i18n/languages";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: `${t("about.title")} | ${t("meta.title")}` };
}

// Rendered per request, like the other pages (the catalog comes from the configured sources).
export const instant = false;

const KINDS: EditionKind[] = ["arabic", "transliteration", "translation", "tafsir"];

function Credit({ source, locale, unknown }: { source: SourceInfo; locale: string; unknown: string }) {
  const text = localized(source.attribution, locale);
  return (
    <>
      <td className="px-3 py-2">{source.url ? <a href={source.url} className="text-primary hover:underline" rel="noopener">{text}</a> : text}</td>
      <td className="px-3 py-2 text-muted-foreground">{source.license ?? unknown}</td>
    </>
  );
}

/** What the site is, and the source and credit of every edition and reciter in the catalog. */
export default async function AboutPage() {
  const { t, locale } = await getI18n();
  const quran = getQuran();
  await quran.getSurahList();
  const catalog = quran.getCatalog();
  const byKind = (kind: EditionKind): Edition[] => catalog.editions.filter((e) => e.kind === kind);
  const language = languageNamer(t, locale);
  const head = (
    <thead className="text-start text-xs text-muted-foreground">
      <tr>
        <th className="px-3 py-2 font-medium">{t("about.columns.name")}</th>
        <th className="px-3 py-2 font-medium">{t("about.columns.language")}</th>
        <th className="px-3 py-2 font-medium">{t("about.columns.credit")}</th>
        <th className="px-3 py-2 font-medium">{t("about.columns.licence")}</th>
      </tr>
    </thead>
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-2 font-display text-2xl font-semibold">{t("about.title")}</h1>
      <p className="mb-8 leading-relaxed text-muted-foreground">{t("about.intro")}</p>

      <section id="sources" className="mb-8 scroll-mt-24">
        <h2 className="mb-1 font-display text-lg font-semibold">{t("about.sourcesTitle")}</h2>
        <p className="mb-4 text-sm text-muted-foreground">{t("about.sourcesIntro")}</p>
        {KINDS.map((kind) => {
          const editions = byKind(kind);
          if (editions.length === 0) return null;
          return (
            <div key={kind} className="mb-5 overflow-x-auto rounded-2xl border border-border bg-card">
              <h3 className="border-b border-border px-3 py-2 font-semibold">{t(`about.kinds.${kind}`)}</h3>
              <table className="w-full text-sm">
                {head}
                <tbody className="divide-y divide-border">
                  {editions.map((e) => (
                    <tr key={e.id}>
                      <td className="px-3 py-2 font-medium">{localized(e.name, locale)}</td>
                      <td className="px-3 py-2">{language(e.language)}</td>
                      <Credit source={e.source} locale={locale} unknown={t("about.unknownLicence")} />
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })}
        <div className="mb-5 overflow-x-auto rounded-2xl border border-border bg-card">
          <h3 className="border-b border-border px-3 py-2 font-semibold">{t("about.reciters")}</h3>
          <table className="w-full text-sm">
            {head}
            <tbody className="divide-y divide-border">
              {catalog.qaris.map((q) => (
                <tr key={q.id}>
                  <td className="px-3 py-2 font-medium">{q.name}</td>
                  <td className="px-3 py-2">{language("ar")}</td>
                  <Credit source={q.source} locale={locale} unknown={t("about.unknownLicence")} />
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="mb-2 font-display text-lg font-semibold">{t("about.providersTitle")}</h2>
        <p className="leading-relaxed">
          {t("about.providers")}{" "}
          <a href="https://equran.id/apidev/v2" className="text-primary hover:underline" rel="noopener">
            EQuran.id
          </a>{" "}
          ·{" "}
          <a href="https://github.com/fawazahmed0/quran-api" className="text-primary hover:underline" rel="noopener">
            fawazahmed0/quran-api
          </a>
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-2 font-display text-lg font-semibold">{t("about.codeTitle")}</h2>
        <p>
          {t("about.code")}{" "}
          <a href="https://github.com/udienz/quranweb" className="text-primary hover:underline" rel="noopener">
            github.com/udienz/quranweb
          </a>
        </p>
      </section>

      <p>
        <Link href="/privacy" className="text-primary hover:underline">
          {t("about.privacyLink")}
        </Link>
      </p>
    </div>
  );
}
