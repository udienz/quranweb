import type { Metadata } from "next";
import Link from "next/link";
import { isCommunityLocale } from "@/lib/i18n/config";
import { getI18n } from "@/lib/i18n/server";
import { privacyContact } from "@/lib/privacy";
import { excerpt, shareMetadata } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  const { t, locale } = await getI18n();
  return shareMetadata({ title: `${t("terms.title")} | ${t("meta.title")}`, description: excerpt(t("terms.intro")), path: "/terms", locale });
}

// Rendered per request (the language and the contact come from the request and the environment).
export const instant = false;

/** The day the terms last changed: update it with every change of their text. */
const TERMS_UPDATED = "2026-11-24";

const SECTIONS = [
  ["terms.sections.use.title", "terms.sections.use.body"],
  ["terms.sections.content.title", "terms.sections.content.body"],
  ["terms.sections.account.title", "terms.sections.account.body"],
  ["terms.sections.conduct.title", "terms.sections.conduct.body"],
  ["terms.sections.code.title", "terms.sections.code.body"],
  ["terms.sections.warranty.title", "terms.sections.warranty.body"],
  ["terms.sections.changes.title", "terms.sections.changes.body"],
  ["terms.sections.law.title", "terms.sections.law.body"],
] as const;

export default async function TermsPage() {
  const { t, locale, date } = await getI18n();
  const contact = privacyContact();
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-2 font-display text-2xl font-semibold">{t("terms.title")}</h1>
      <p className="mb-2 text-muted-foreground">{t("terms.intro")}</p>
      <p className="mb-6 text-sm text-muted-foreground">
        {t("terms.updated", { date: date(`${TERMS_UPDATED}T00:00:00Z`, { dateStyle: "long", timeZone: "UTC" }) })}
        {" · "}
        <Link href="/privacy" className="text-primary hover:underline">
          {t("privacy.title")}
        </Link>
      </p>
      {isCommunityLocale(locale) && (
        <p className="mb-6 rounded-xl border border-border bg-muted px-4 py-3 text-sm">{t("terms.translationNote")}</p>
      )}
      {SECTIONS.map(([title, body]) => (
        <section key={title} className="mb-6">
          <h2 className="mb-2 font-display text-lg font-semibold">{t(title)}</h2>
          {t(body).split("\n\n").map((paragraph) => (
            <p key={paragraph} className="mb-3 leading-relaxed">
              {paragraph}
            </p>
          ))}
        </section>
      ))}
      <section className="mb-6">
        <h2 className="mb-2 font-display text-lg font-semibold">{t("terms.contactTitle")}</h2>
        {contact.name && <p className="mb-3">{t("terms.contactBy", { name: contact.name })}</p>}
        {contact.email ? (
          <p>
            {t("terms.contactEmail", { email: "" })}
            <a href={`mailto:${contact.email}`} className="text-primary hover:underline">
              {contact.email}
            </a>
          </p>
        ) : (
          <p className="text-muted-foreground">{t("terms.contactMissing")}</p>
        )}
      </section>
    </div>
  );
}
