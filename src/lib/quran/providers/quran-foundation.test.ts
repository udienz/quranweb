import { afterEach, describe, expect, it, vi } from "vitest";
import { LOCALES } from "../../i18n/config";
import { clearRemoteCache } from "../transport";
import {
  clearQuranFoundationTokens,
  createQuranFoundationTextProvider,
  htmlToText,
  QURAN_FOUNDATION_API_URL,
  QURAN_FOUNDATION_EDITIONS,
  QURAN_FOUNDATION_IDS,
} from "./quran-foundation";

const BASE = "https://qf.test/api/v4";
const chapter = (surah: number, count: number, rows: [number, string][]) => ({
  tafsirs: rows.map(([verse, text], i) => ({ id: i + 1, resource_id: 160, verse_key: `${surah}:${verse}`, language_id: 174, text })),
  pagination: { per_page: 300, current_page: 1, next_page: null, total_pages: 1, total_records: count },
});

function mockFetch(routes: Record<string, unknown>) {
  const fn = vi.fn(async (url: string | URL | Request) => {
    const data = routes[String(url)];
    return data === undefined ? new Response("", { status: 404 }) : new Response(JSON.stringify(data));
  });
  vi.stubGlobal("fetch", fn);
  return fn;
}
afterEach(() => vi.unstubAllGlobals());

describe("htmlToText", () => {
  it("keeps the words, turns paragraphs and blocks into blank lines and drops inline tags", () => {
    expect(
      htmlToText(
        'سورہ فاتحہ کے نام:<div lang="ur" class="ur"><p class="ur">اس سورت کا نام سورۂ <span class="arabic qpc-hafs"> «فاتحہ»</span>  ہے۔ </p><p class="ur"> دوسرا </p></div>',
      ),
    ).toBe("سورہ فاتحہ کے نام:\n\nاس سورت کا نام سورۂ  «فاتحہ»  ہے۔\n\nدوسرا");
  });

  it("leaves no tag behind when tags are nested", () => {
    expect(htmlToText("a<scr<script>ipt>alert(1)</scr</script>ipt>b")).toBe("aipt>alert(1)ipt>b");
  });

  it("decodes entities and line breaks", () => {
    expect(htmlToText("a &amp; b&nbsp;c<br>d &#1575; &#x627; &lt;x&gt; &unknown;")).toBe("a & b c\nd ا ا <x> &unknown;");
  });
});

describe("Quran Foundation provider", () => {
  it("reads a whole surah in one request, and gives the verses a passage covers a pointer to it", async () => {
    const fetchMock = mockFetch({
      [`${BASE}/tafsirs/160/by_chapter/2?per_page=300`]: chapter(2, 5, [
        [1, "<p>one</p>"],
        [2, "<p>two and three</p>"],
        [4, "<div><p>four and five</p></div>"],
      ]),
    });
    const text = await createQuranFoundationTextProvider({ baseUrl: `${BASE}/` }).text("urd-ibnkathir", 2);
    expect(text).toEqual({
      edition: "urd-ibnkathir",
      surah: 2,
      verses: [
        { number: 1, text: "one" },
        { number: 2, text: "two and three" },
        { number: 3, text: "", sharedWith: 2 },
        { number: 4, text: "four and five" },
        { number: 5, text: "", sharedWith: 4 },
      ],
    });
    expect(fetchMock.mock.calls.map((c) => String(c[0]))).toEqual([`${BASE}/tafsirs/160/by_chapter/2?per_page=300`]);
  });

  it("reads the live v4 API by default", async () => {
    const fetchMock = mockFetch({ [`${QURAN_FOUNDATION_API_URL}/tafsirs/160/by_chapter/112?per_page=300`]: chapter(112, 4, [[1, "all four"]]) });
    const text = await createQuranFoundationTextProvider().text("urd-ibnkathir", 112);
    expect(text.verses.map((v) => v.sharedWith)).toEqual([undefined, 1, 1, 1]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("refuses an answer it cannot trust: another surah, a verse out of order or past the end, an empty passage, no first verse", async () => {
    const cases: [number, unknown, RegExp][] = [
      [1, chapter(3, 2, [[1, "x"]]), /unexpected verse "3:1"/],
      [2, chapter(2, 3, [[1, "x"], [3, "y"], [2, "z"]]), /unexpected verse "2:2"/],
      [4, chapter(4, 2, [[1, "x"], [3, "y"]]), /unexpected verse "4:3"/],
      [5, chapter(5, 2, [[1, "x"], [2, "<p> </p>"]]), /empty passage at 5:2/],
      [6, chapter(6, 2, [[2, "x"]]), /no passage for its first verse/],
      [7, { tafsirs: [] }, /unexpected format/],
    ];
    mockFetch(Object.fromEntries(cases.map(([s, body]) => [`${BASE}/tafsirs/160/by_chapter/${s}?per_page=300`, body])));
    const provider = createQuranFoundationTextProvider({ baseUrl: BASE });
    for (const [s, , error] of cases) await expect(provider.text("urd-ibnkathir", s)).rejects.toThrow(error);
  });

  it("refuses an edition it does not serve or that is not enabled", async () => {
    await expect(createQuranFoundationTextProvider({ baseUrl: BASE }).text("eng-mokhtasar", 1)).rejects.toThrow(/does not serve/);
    expect(() => createQuranFoundationTextProvider({ editions: ["nope"] })).toThrow(/Unknown Quran Foundation edition/);
  });

  it("knows the id of every edition, and credits Quran Foundation in every interface language", () => {
    for (const e of QURAN_FOUNDATION_EDITIONS) {
      expect(QURAN_FOUNDATION_IDS[e.id]).toBeGreaterThan(0);
      for (const ui of LOCALES) {
        expect(e.name[ui]).toBeTruthy();
        expect(e.source.attribution[ui]).toMatch(/Quran Foundation/);
      }
    }
  });
});

describe("Quran Foundation Content API", () => {
  const TOKEN = "https://oauth.test/oauth2/token";
  const CONTENT = "https://content.test/content/api/v4";
  const auth = { clientId: "client-1", clientSecret: "s3cret-value", tokenUrl: TOKEN, contentUrl: CONTENT };
  const path = (surah: number) => `/tafsirs/160/by_chapter/${surah}?per_page=300`;

  /** A fake token endpoint and Content API; `scopes` are the scopes the client holds, `valid` the tokens the API accepts. */
  function server(opts: { scopes?: string[]; valid?: string[]; contentDown?: boolean } = {}) {
    const scopes = opts.scopes ?? ["content.tafsirs.read"];
    let issued = 0;
    const calls: { url: string; init?: RequestInit }[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
        const url = String(input);
        calls.push({ url, init });
        if (url === TOKEN) {
          const scope = new URLSearchParams(String(init?.body)).get("scope") ?? "";
          if (!scopes.includes(scope)) return new Response('{"error":"invalid_scope"}', { status: 400 });
          issued++;
          return new Response(JSON.stringify({ access_token: `token-${issued}`, token_type: "bearer", expires_in: 3600, scope }));
        }
        if (url.startsWith(CONTENT)) {
          const token = new Headers(init?.headers).get("x-auth-token") ?? "";
          if (opts.contentDown) return new Response("", { status: 503 });
          if (!(opts.valid ?? [`token-${issued}`]).includes(token)) return new Response("", { status: 401 });
          return new Response(JSON.stringify(chapter(1, 1, [[1, "from the Content API"]])));
        }
        if (url.startsWith(BASE)) return new Response(JSON.stringify(chapter(1, 1, [[1, "from the v4 API"]])));
        return new Response("", { status: 404 });
      }),
    );
    return calls;
  }
  const provider = () => createQuranFoundationTextProvider({ baseUrl: BASE, auth });
  afterEach(() => {
    clearQuranFoundationTokens();
    clearRemoteCache();
    vi.restoreAllMocks();
  });

  it("asks for a token with HTTP Basic and the tafsir scope, then sends it with the client id", async () => {
    const calls = server();
    const text = await provider().text("urd-ibnkathir", 1);
    expect(text.verses[0].text).toBe("from the Content API");
    const [token, content] = calls;
    expect(token.url).toBe(TOKEN);
    expect(new Headers(token.init?.headers).get("authorization")).toBe(`Basic ${Buffer.from("client-1:s3cret-value").toString("base64")}`);
    expect(String(token.init?.body)).toBe("grant_type=client_credentials&scope=content.tafsirs.read");
    expect(content.url).toBe(`${CONTENT}${path(1)}`);
    expect(new Headers(content.init?.headers).get("x-auth-token")).toBe("token-1");
    expect(new Headers(content.init?.headers).get("x-client-id")).toBe("client-1");
  });

  it("falls back to the scope `content` for older credentials, and reuses the token", async () => {
    const calls = server({ scopes: ["content"] });
    await provider().text("urd-ibnkathir", 1);
    clearRemoteCache();
    await provider().text("urd-ibnkathir", 1);
    const tokenCalls = calls.filter((c) => c.url === TOKEN);
    expect(tokenCalls.map((c) => new URLSearchParams(String(c.init?.body)).get("scope"))).toEqual(["content.tafsirs.read", "content"]);
  });

  it("renews the token once when the API answers 401", async () => {
    const calls = server({ valid: ["token-2"] });
    expect((await provider().text("urd-ibnkathir", 1)).verses[0].text).toBe("from the Content API");
    expect(calls.filter((c) => c.url === TOKEN)).toHaveLength(2);
  });

  it("reads the unauthenticated API when the Content API fails, and never logs the secret", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    server({ contentDown: true });
    expect((await provider().text("urd-ibnkathir", 1)).verses[0].text).toBe("from the v4 API");
    expect(JSON.stringify(log.mock.calls)).not.toContain("s3cret-value");
  });

  it("reads the unauthenticated API when the token is refused", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    server({ scopes: [] });
    expect((await provider().text("urd-ibnkathir", 1)).verses[0].text).toBe("from the v4 API");
  });
});
