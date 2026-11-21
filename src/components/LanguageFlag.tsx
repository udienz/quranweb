import { BA, BD, BR, CN, DE, ES, FR, GB, ID, IN, IR, IT, JP, MY, NG, PK, RU, SA, TH, TR, TZ, UZ, VN } from "country-flag-icons/react/3x2";
import { LOCALE_FLAGS, type Locale } from "@/lib/i18n/config";

// Only the flags in use are imported, so the bundle does not carry every country (country-flag-icons, MIT).
const FLAGS = { BA, BD, BR, CN, DE, ES, FR, GB, ID, IN, IR, IT, JP, MY, NG, PK, RU, SA, TH, TR, TZ, UZ, VN };

/**
 * The flag of a language (see LOCALE_FLAGS), as an inline SVG: emoji flags show as two letters on Windows. Decorative: the
 * language's name beside it is the label, so it is hidden from screen readers. The thin ring keeps white flags (Japan)
 * visible on a white menu.
 */
export default function LanguageFlag({ locale }: { locale: Locale }) {
  const Flag = FLAGS[LOCALE_FLAGS[locale] as keyof typeof FLAGS];
  return <Flag aria-hidden="true" focusable="false" className="h-3.5 w-5 shrink-0 rounded-[2px] ring-1 ring-black/10" />;
}
