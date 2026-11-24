import Link from "next/link";
import { getI18n } from "@/lib/i18n/server";

// The layout reads the language from the request, so this page cannot be prerendered.
export const instant = false;

export default async function NotFound() {
  const { t } = await getI18n();
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <p className="font-display text-6xl font-bold text-primary">404</p>
      <h1 className="mt-4 font-display text-2xl font-semibold">{t("notFound.title")}</h1>
      <p className="mt-2 text-muted-foreground">{t("notFound.description")}</p>
      <Link href="/" className="mt-6 inline-block rounded-full bg-gold px-6 py-2.5 text-sm font-semibold text-[hsl(143_25%_12%)] hover:opacity-90">
        {t("notFound.home")}
      </Link>
    </div>
  );
}
