import type { SurahMeta } from "./types";

const REVELATION: Record<SurahMeta["revelation"], string> = {
  mecca: "Mekah",
  medina: "Madinah",
};

export function revelationLabel(revelation: SurahMeta["revelation"]): string {
  return REVELATION[revelation];
}

/** Arti nama surat dalam bahasa tertentu, jatuh ke bahasa pertama yang ada. */
export function meaningOf(meta: SurahMeta, language = "id"): string {
  return meta.name.meaning[language] ?? Object.values(meta.name.meaning)[0] ?? "";
}
