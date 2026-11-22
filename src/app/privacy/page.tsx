import type { Metadata } from "next";
import { isCommunityLocale } from "@/lib/i18n/config";
import { getI18n } from "@/lib/i18n/server";
import { privacyContact } from "@/lib/privacy";
import { excerpt, shareMetadata } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  const { t, locale } = await getI18n();
  return shareMetadata({ title: `${t("privacy.title")} | ${t("meta.title")}`, description: excerpt(t("privacy.intro")), path: "/privacy", locale });
}

// Rendered per request (the language and the contact come from the request and the environment).
export const instant = false;

const SECTIONS = [
  ["privacy.sections.reading.title", "privacy.sections.reading.body"],
  ["privacy.sections.account.title", "privacy.sections.account.body"],
  ["privacy.sections.cookies.title", "privacy.sections.cookies.body"],
  ["privacy.sections.analytics.title", "privacy.sections.analytics.body"],
  ["privacy.sections.recipients.title", "privacy.sections.recipients.body"],
  ["privacy.sections.retention.title", "privacy.sections.retention.body"],
  ["privacy.sections.rights.title", "privacy.sections.rights.body"],
  ["privacy.sections.law.title", "privacy.sections.law.body"],
] as const;

export default async function PrivacyPage() {
  const { t, locale } = await getI18n();
  const contact = privacyContact();
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-2 font-display text-2xl font-semibold">{t("privacy.title")}</h1>
      <p className="mb-6 text-muted-foreground">{t("privacy.intro")}</p>
      {isCommunityLocale(locale) && (
        <p className="mb-6 rounded-xl border border-border bg-muted px-4 py-3 text-sm">{t("privacy.translationNote")}</p>
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
        <h2 className="mb-2 font-display text-lg font-semibold">{t("privacy.contactTitle")}</h2>
        {contact.name && <p className="mb-3">{t("privacy.contactBy", { name: contact.name })}</p>}
        {contact.email ? (
          <p>
            {t("privacy.contactEmail", { email: "" })}
            <a href={`mailto:${contact.email}`} className="text-primary hover:underline">
              {contact.email}
            </a>
          </p>
        ) : (
          <p className="text-muted-foreground">{t("privacy.contactMissing")}</p>
        )}
      </section>
    </div>
  );
}
