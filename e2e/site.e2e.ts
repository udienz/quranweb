import { expect, test } from "@playwright/test";
import { cards, routeAudio, watchConsole } from "./helpers";

// Addresses, the installable app, and the reciter list.

test("a surah address that is not one of the 114 answers 404", async ({ request }) => {
  for (const ok of ["1", "114", "001"]) expect((await request.get(`/surah/${ok}`)).status(), ok).toBe(200);
  for (const bad of ["0", "115", "abc", "2.5", "1e2"]) expect((await request.get(`/surah/${bad}`)).status(), bad).toBe(404);
});

test("the app can be installed: manifest in the reader's language and its icons", async ({ request }) => {
  const manifest = await (await request.get("/manifest.webmanifest", { headers: { "accept-language": "en-US" } })).json();
  expect(manifest).toMatchObject({ display: "standalone", start_url: "/", lang: "en" });
  for (const icon of manifest.icons) {
    const res = await request.get(icon.src);
    expect(res.status(), icon.src).toBe(200);
    expect(res.headers()["content-type"]).toBe("image/png");
  }
});

test("search engines: robots keep a copy that is not production out, the sitemap lists the surahs, and a page says what it is", async ({ request }) => {
  // The test server is at 127.0.0.1, not the production address, so it must not be indexed.
  expect(await (await request.get("/robots.txt")).text()).toMatch(/Disallow: \/\s*$/m);

  const urls = [...(await (await request.get("/sitemap/0.xml")).text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  expect(urls.filter((u) => /\/surah\/\d+$/.test(u))).toHaveLength(114);
  expect(urls.some((u) => u.includes("?"))).toBe(false);

  // What a crawler or a link preview reads: no cookie, Indonesian by default.
  const html = await (await request.get("/surah/2?page=3")).text();
  const meta = (name: string) => html.match(new RegExp(`<meta (?:property|name)="${name}" content="([^"]*)"`))?.[1];
  expect(html).toContain('<link rel="canonical" href="http://127.0.0.1:3100/surah/2"');
  expect(meta("og:title")).toBe("Al-Baqarah (Sapi) | QuranWeb");
  expect(meta("og:description")).toContain("286 ayat");
  expect(meta("og:image")).toBe("http://127.0.0.1:3100/og.png");
  expect(meta("twitter:card")).toBe("summary_large_image");
  const image = await request.get("/og.png");
  expect(image.status()).toBe(200);
  expect(image.headers()["content-type"]).toBe("image/png");
});

test("the reciter list: best known first, search in Latin and Arabic, a CDN reciter plays from the CDN", async ({ page, context, baseURL }) => {
  const problems = watchConsole(page);
  await cards(context, baseURL!);
  const urls = await routeAudio(page);
  await page.goto("/settings");
  const audio = page.locator("#audio");
  await audio.getByRole("button", { name: /Qari/ }).click();
  const names = audio.getByRole("dialog").locator("li button > span:first-child");
  await expect(names.first()).toHaveText("Misyari Rasyid Al-Afasi");
  await audio.getByRole("searchbox").fill("الحصري");
  await expect(names).toHaveCount(2);
  await audio.getByRole("searchbox").fill("maher");
  await audio.getByRole("searchbox").press("Enter");
  await expect(audio.getByRole("button", { name: /Qari/ })).toContainText("Maher");
  await expect.poll(async () => (await context.cookies()).some((c) => c.name === "qw-sel" && decodeURIComponent(c.value).includes("maher"))).toBe(true);
  await page.goto("/surah/1");
  await page.locator("#verse-1:visible").getByRole("button", { name: "Putar audio" }).click();
  await expect.poll(() => urls[0]).toBe("https://cdn.islamic.network/quran/audio/128/ar.mahermuaiqly/1.mp3");
  expect(problems).toEqual([]);
});
