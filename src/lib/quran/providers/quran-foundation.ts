// Adapter for the Quran Foundation API (the API behind Quran.com, https://api-docs.quran.foundation): tafsir in languages
// that QuranEnc and our other sources do not cover. Read live, like every new edition (our rule of 2026-11-21).
//
// Two ways in, with the same paths and answers. With QF_CLIENT_ID and QF_CLIENT_SECRET (our registered app, 2026-11-24) it
// reads the Content API: an OAuth2 client-credentials token from oauth2.quran.foundation (HTTP Basic, scope
// content.tafsirs.read, or `content` for older credentials), kept until 30 s before it expires, sent as `x-auth-token` with
// `x-client-id`. A 401 renews the token once. Without the variables, or when the Content API fails, it reads the older
// unauthenticated v4 API (api.quran.com), and the failure is logged once an hour. The secret stays on the server: it is only
// sent to the token endpoint and never logged.
//
// The Developer Terms (2026-11-20): display is allowed; nothing is kept longer than a week (transport.ts keeps an answer for
// a day, in memory); no raw data in a public repository or download; credit "Quran data provided by Quran Foundation" and
// each tafsir by its named source. QUL (qul.tarteel.ai) lists the same tafsir with the same ids but needs a login to download.
//
// Chapter format (`/tafsirs/{id}/by_chapter/{n}?per_page=300`, one page holds a whole surah):
//   {"tafsirs":[{"verse_key":"2:8","text":"<div lang=\"ur\"><p>…</p></div>", …}, …],
//    "pagination":{"total_records":286, …}}
// The text is HTML (`div`, `p`, `span`) and shown as plain text. One passage can explain several verses: it sits on the
// first of them, and the others have no entry. Such a verse gets an empty text and `sharedWith`, the verse whose passage
// covers it, so the reader can point there instead of repeating a long passage.

import { cache } from "react";
import type { TextProvider } from "../provider";
import { HttpError, loadJson } from "../transport";
import { errorOncePerHour, mayLog } from "../../log-limited";
import { LOCALES } from "../../i18n/config";
import { completeEditions, languageIn } from "../edition-names";
import type { Edition, EditionText, VerseText } from "../types";

export const QURAN_FOUNDATION_API_URL = "https://api.quran.com/api/v4";
export const QURAN_FOUNDATION_CONTENT_URL = "https://apis.quran.foundation/content/api/v4";
export const QURAN_FOUNDATION_TOKEN_URL = "https://oauth2.quran.foundation/oauth2/token";

/** The registered app's credentials (server only), and for tests the addresses to use instead of the real ones. */
export interface QuranFoundationAuth {
  clientId: string;
  clientSecret: string;
  tokenUrl?: string;
  contentUrl?: string;
}

const CREDIT_EN = "Quran data provided by Quran Foundation (Quran.com)";

/**
 * The enabled editions. Enabling another one = an entry here and its id in QURAN_FOUNDATION_IDS, after checking all 114
 * surahs: every surah's first verse has an entry and no entry is empty. Tafsir Ibn Kathir in Urdu passed on 2026-11-24. The
 * other Urdu tafsir did not. Bayan ul Quran (159) and Fi Zilal al-Quran (157) leave the covered verses empty, without saying
 * which passage covers them. Tazkir ul Quran (818) puts a passage on the last verse it covers, but its data is broken
 * (checked 2026-11-24): surahs 82 to 101 have no entry by chapter, `by_ayah` answers 89:1 with the passage of 84:1-10 and
 * 101:1 with that of 100:1-10, and passages cross surahs (34:51-35:2, 62:9-63:3, 63:9-64:4).
 */
export const QURAN_FOUNDATION_EDITIONS: Edition[] = completeEditions([
  {
    id: "urd-ibnkathir",
    kind: "tafsir",
    language: "ur",
    direction: "rtl",
    name: Object.fromEntries(
      LOCALES.map((ui) => [ui, ui === "ur" ? "تفسیر ابنِ کثیر" : `Tafsir Ibn Kathir (${languageIn("ur", ui)})`]),
    ),
    author: "Hafiz Ibn Kathir",
    source: {
      name: "Quran Foundation (Quran.com)",
      url: "https://quran.foundation/",
      attribution: {
        en: `Hafiz Ibn Kathir, in Urdu. ${CREDIT_EN}`,
        id: `Hafiz Ibnu Katsir, dalam bahasa Urdu. Data Al-Qur'an dari Quran Foundation (Quran.com)`,
        ur: `حافظ ابنِ کثیر، اردو میں۔ ${CREDIT_EN}`,
      },
    },
  },
]);

/** The resource id of each edition in the Quran Foundation API (the same id as on QUL). */
export const QURAN_FOUNDATION_IDS: Record<string, number> = {
  "urd-ibnkathir": 160,
};

interface RawChapter {
  tafsirs: { verse_key: string; text: string }[];
  pagination: { total_records: number };
}

export interface QuranFoundationOptions {
  /** An HTTP URL of the unauthenticated API. Default: the v4 API at api.quran.com. */
  baseUrl?: string;
  /** Credentials for the Content API; without them only the unauthenticated API is read. */
  auth?: QuranFoundationAuth;
  /** IDs of the editions to enable. Empty = all the editions listed above. */
  editions?: string[];
}

/**
 * The passage as plain text: paragraphs and blocks become blank lines, every other tag goes, entities are decoded. React
 * shows the result as text, never as HTML; the tags are still removed until none is left, so that a nested one such as
 * `<scr<script>ipt>` cannot leave a tag behind.
 */
export function htmlToText(html: string): string {
  const entities: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };
  let text = html.replace(/<br\s*\/?>/gi, "\n").replace(/<\/?(?:p|div|h[1-6]|li|ul|ol|blockquote)\b[^>]*>/gi, "\n\n");
  let previous;
  do {
    previous = text;
    text = text.replace(/<[^>]*>/g, "");
  } while (text !== previous);
  return text
    .replace(/&(#x[0-9a-f]+|#[0-9]+|[a-z]+);/gi, (whole, code: string) => {
      if (code[0] !== "#") return entities[code.toLowerCase()] ?? whole;
      const n = code[1] === "x" || code[1] === "X" ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
      return Number.isFinite(n) && n > 0 && n <= 0x10ffff ? String.fromCodePoint(n) : whole;
    })
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

const USER_AGENT = "QuranWeb (https://quranweb.udienz.web.id)";
const TOKEN_TIMEOUT_MS = 8000;
/** Renew a token this long before it expires, as the docs advise. */
const TOKEN_MARGIN_MS = 30_000;
/** Newer credentials hold granular scopes and refuse `content` (invalid_scope); older ones hold `content` only. */
const SCOPES = ["content.tafsirs.read", "content"];

const tokens = new Map<string, { promise: Promise<{ token: string; expires: number }>; expires?: number }>();

/** Empty the token cache (for tests). */
export const clearQuranFoundationTokens = (): void => tokens.clear();

async function requestToken(auth: QuranFoundationAuth): Promise<{ token: string; expires: number }> {
  const basic = Buffer.from(`${auth.clientId}:${auth.clientSecret}`).toString("base64");
  let status = 0;
  for (const scope of SCOPES) {
    const res = await fetch(auth.tokenUrl ?? QURAN_FOUNDATION_TOKEN_URL, {
      method: "POST",
      headers: { Authorization: `Basic ${basic}`, "Content-Type": "application/x-www-form-urlencoded", "User-Agent": USER_AGENT },
      body: new URLSearchParams({ grant_type: "client_credentials", scope }),
      signal: AbortSignal.timeout(TOKEN_TIMEOUT_MS),
    });
    if (res.ok) {
      const body = (await res.json()) as { access_token?: unknown; expires_in?: unknown };
      if (typeof body.access_token !== "string" || !body.access_token) throw new Error("The Quran Foundation token answer has no access_token");
      const seconds = typeof body.expires_in === "number" && body.expires_in > 0 ? body.expires_in : 3600;
      return { token: body.access_token, expires: Date.now() + seconds * 1000 - TOKEN_MARGIN_MS };
    }
    status = res.status;
    if (status !== 400) break; // only a refused scope is worth another try
  }
  throw new HttpError(`The Quran Foundation token request failed (status ${status})`, status);
}

/** A valid access token: the cached one, the request already under way, or a new one (`renew` forces a new one). */
async function accessToken(auth: QuranFoundationAuth, renew = false): Promise<string> {
  const known = tokens.get(auth.clientId);
  if (known && !renew && (known.expires === undefined || known.expires > Date.now())) return (await known.promise).token;
  const entry: { promise: Promise<{ token: string; expires: number }>; expires?: number } = { promise: requestToken(auth) };
  tokens.set(auth.clientId, entry);
  entry.promise.then(
    (t) => (entry.expires = t.expires),
    () => tokens.get(auth.clientId) === entry && tokens.delete(auth.clientId),
  );
  return (await entry.promise).token;
}

async function loadChapter(base: string, id: number, surah: number, auth?: QuranFoundationAuth): Promise<RawChapter> {
  const path = `/tafsirs/${id}/by_chapter/${surah}?per_page=300`;
  if (!auth) return (await loadJson(`${base}${path}`)) as RawChapter;
  const url = `${(auth.contentUrl ?? QURAN_FOUNDATION_CONTENT_URL).replace(/\/$/, "")}${path}`;
  const headers = async (renew: boolean) => ({ "x-auth-token": await accessToken(auth, renew), "x-client-id": auth.clientId, "User-Agent": USER_AGENT });
  try {
    let raw: unknown;
    try {
      raw = await loadJson(url, await headers(false));
    } catch (err) {
      if (!(err instanceof HttpError && err.status === 401)) throw err;
      raw = await loadJson(url, await headers(true));
    }
    if (mayLog("quran-foundation-content-api-ok", Date.now(), 24 * 60 * 60 * 1000)) console.log("Quran Foundation: tafsir read through the Content API");
    return raw as RawChapter;
  } catch (err) {
    errorOncePerHour("quran-foundation-content-api", "Quran Foundation Content API failed, reading the unauthenticated API instead:", err instanceof Error ? err.message : String(err));
    return (await loadJson(`${base}${path}`)) as RawChapter;
  }
}

export function createQuranFoundationTextProvider(options: QuranFoundationOptions = {}): TextProvider {
  const base = (options.baseUrl ?? QURAN_FOUNDATION_API_URL).replace(/\/$/, "");
  const enabled = options.editions?.length
    ? options.editions.map((id) => {
        const found = QURAN_FOUNDATION_EDITIONS.find((e) => e.id === id);
        if (!found) throw new Error(`Unknown Quran Foundation edition "${id}"`);
        return found;
      })
    : QURAN_FOUNDATION_EDITIONS;
  const byId = new Map(enabled.map((e) => [e.id, e]));
  // One fetch per surah and edition per page render.
  const fetchChapter = cache((id: number, surah: number) => loadChapter(base, id, surah, options.auth));

  return {
    id: "quran-foundation",
    editions: () => enabled,

    async text(edition, surah): Promise<EditionText> {
      const resource = byId.has(edition) ? QURAN_FOUNDATION_IDS[edition] : undefined;
      if (!resource) throw new Error(`The Quran Foundation provider does not serve edition "${edition}"`);
      const raw = await fetchChapter(resource, surah);
      const bad = (why: string) => new Error(`The Quran Foundation answer for tafsir ${resource} surah ${surah} ${why}`);
      const count = raw?.pagination?.total_records;
      if (!Array.isArray(raw?.tafsirs) || !Number.isInteger(count) || count < 1) throw bad("has an unexpected format");

      // Entry per verse number; every verse number must be of this surah, in order, and within the surah.
      const entries = new Map<number, string>();
      let last = 0;
      for (const row of raw.tafsirs) {
        const [s, v] = String(row.verse_key).split(":").map(Number);
        if (s !== surah || !Number.isInteger(v) || v <= last || v > count) throw bad(`has an unexpected verse "${row.verse_key}"`);
        const text = typeof row.text === "string" ? htmlToText(row.text) : "";
        if (!text) throw bad(`has an empty passage at ${row.verse_key}`);
        entries.set(v, text);
        last = v;
      }
      if (!entries.has(1)) throw bad("has no passage for its first verse");

      let covering = 1;
      const verses: VerseText[] = Array.from({ length: count }, (_, i) => {
        const number = i + 1;
        const text = entries.get(number);
        if (text !== undefined) {
          covering = number;
          return { number, text };
        }
        return { number, text: "", sharedWith: covering };
      });
      return { edition, surah, verses };
    },
  };
}
