// Adapter for our private copy of files from the Quranic Universal Library (QUL, https://qul.tarteel.ai), made by
// `scripts/convert-qul.mjs` in the data repository and read as files (QURAN_QUL_URL=/data/qul): the QPC Hafs text of the
// King Fahd Glorious Quran Printing Complex with its tajweed marks, and the 558 rukus (we chose QUL's over Tanzil's 556,
// 2026-11-24). QUL publishes no licence for them, so the copy is not served (nginx does not publish it). It serves no
// edition: the tajweed text is shown over the chosen Arabic text while tajweed colours are on, and the rukus mark verses.
//
//   tajweed/<surah>.json  {"surah":n,"verses":[{"verse":v,"runs":[["text"],["text","rule"],...]}]}
//   ruku.json             {"count":558,"references":[{"ruku":1,"start":{"chapter":1,"verse":1},"end":{...}},...]}

import { cache } from "react";
import type { TextProvider } from "../provider";
import { loadJson } from "../transport";
import type { RukuRef, TajweedRun } from "../types";

interface RawTajweed {
  surah: number;
  verses: { verse: number; runs: TajweedRun[] }[];
}
interface RawRukus {
  references: { ruku: number; start: { chapter: number; verse: number }; end: { chapter: number; verse: number } }[];
}

const isRun = (r: unknown): r is TajweedRun =>
  Array.isArray(r) && typeof r[0] === "string" && (r.length === 1 || (r.length === 2 && typeof r[1] === "string"));

// One read per page render.
const readTajweed = cache((base: string, surah: number) => loadJson(`${base}/tajweed/${surah}.json`) as Promise<RawTajweed>);
const readRukus = cache((base: string) => loadJson(`${base}/ruku.json`) as Promise<RawRukus>);

/** Without a base URL (no copy configured, as in development) it has nothing to give, and says so by having no methods. */
export function createQulProvider(options: { baseUrl?: string } = {}): TextProvider {
  const base = options.baseUrl?.replace(/\/$/, "");
  const provider: TextProvider = {
    id: "qul",
    editions: () => [],
    async text(edition) {
      throw new Error(`The QUL provider serves no edition ("${edition}")`);
    },
  };
  if (!base) return provider;

  return {
    ...provider,
    async tajweed(surah) {
      const raw = await readTajweed(base, surah);
      if (raw?.surah !== surah || !Array.isArray(raw.verses) || raw.verses.some((v, i) => v.verse !== i + 1 || !Array.isArray(v.runs) || !v.runs.every(isRun))) {
        throw new Error(`The QUL tajweed text of surah ${surah} has an unexpected format`);
      }
      return raw.verses.map((v) => v.runs);
    },
    async rukus(): Promise<RukuRef[]> {
      const raw = await readRukus(base);
      if (!Array.isArray(raw?.references)) throw new Error("The QUL ruku list has an unexpected format");
      return raw.references.map((r) => ({
        ruku: r.ruku,
        start: { surah: r.start.chapter, verse: r.start.verse },
        end: { surah: r.end.chapter, verse: r.end.verse },
      }));
    },
  };
}
