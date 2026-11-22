import { expect, test } from "@playwright/test";
import { cards, routeAudio, watchConsole } from "./helpers";

// Addresses, the installable app, and the reciter list.

test("a surah address that is not one of the 114 answers 404", async ({ request }) => {
  for (const ok of ["1", "114", "001"]) expect((await request.get(`/surah/${ok}`)).status(), ok).toBe(200);
  for (const bad of ["0", "115", "abc", "2.5", "1e2"]) expect((await request.get(`/surah/${bad}`)).status(), bad).toBe(404);
});

test("a page of 10 verses has a clean address, and the old ?page= link and a wrong page are handled", async ({ page, request }) => {
  expect((await request.get("/surah/2/page/3")).status()).toBe(200);
  for (const bad of ["/surah/2/page/30", "/surah/2/page/0", "/surah/2/page/abc", "/surah/1/page/2", "/surah/2/page", "/surah/2/page/3/x"]) {
    expect((await request.get(bad)).status(), bad).toBe(404);
  }
  await page.goto("/surah/2?page=3");
  await expect(page).toHaveURL(/\/surah\/2\/page\/3$/);
  await page.goto("/surah/2/page/1");
  await expect(page).toHaveURL(/\/surah\/2$/);
  // The pagination links use the clean address.
  await expect(page.getByRole("link", { name: /^(Halaman 2|Page 2)$/ }).first()).toHaveAttribute("href", "/surah/2/page/2");
});

test("only production can be installed: the manifest is in the reader's language with its icons there, and absent anywhere else", async ({ request }) => {
  // The test server is at 127.0.0.1, not the production address: no manifest, no link to one, no "Add to Home Screen" data.
  expect((await request.get("/manifest.webmanifest")).status()).toBe(404);
  const html = await (await request.get("/privacy")).text();
  expect(html).not.toContain('rel="manifest"');
  expect(html).not.toContain("apple-mobile-web-app");
  // As nginx passes the Host of the production address, the manifest is served.
  const production = { "x-forwarded-host": "quranweb.udienz.web.id", "x-forwarded-proto": "https" };
  const page = await (await request.get("/privacy", { headers: production })).text();
  expect(page).toContain('rel="manifest"');
  const manifest = await (await request.get("/manifest.webmanifest", { headers: { ...production, "accept-language": "en-US" } })).json();
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
  const html = await (await request.get("/surah/2/page/3")).text();
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

test("a verse has a page of its own: 404 for a wrong one, a preview, the share menu and the way back", async ({ page, request, context }) => {
  for (const bad of ["/surah/1/0", "/surah/1/8", "/surah/2/abc", "/surah/115/1", "/surah/1/1/x"]) expect((await request.get(bad)).status(), bad).toBe(404);
  for (const ok of ["/surah/1/7", "/surah/2/255", "/surah/112/1"]) expect((await request.get(ok)).status(), ok).toBe(200);

  // What a link preview reads: no cookie.
  const html = await (await request.get("/surah/1/2")).text();
  const meta = (name: string) => html.match(new RegExp(`<meta (?:property|name)="${name}" content="([^"]*)"`))?.[1];
  expect(html).toContain('<link rel="canonical" href="http://127.0.0.1:3100/surah/1/2"');
  expect(meta("og:title")).toBe("Al-Fatihah 1:2 | QuranWeb");
  expect(meta("og:type")).toBe("article");
  expect(meta("og:description")).toContain("Segala puji bagi Allah");

  // The sitemap of the verses has all 6,236.
  const sitemap = await (await request.get("/sitemap/1.xml")).text();
  expect(sitemap.match(/<loc>/g)).toHaveLength(6236);

  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/surah/1/2");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Al-Fatihah 1:2");
  await page.getByRole("button", { name: "Bagikan ayat" }).click();
  await page.getByRole("menuitem", { name: "Salin ayat" }).click();
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  expect(copied).toContain("Segala puji bagi Allah");
  expect(copied).toContain("(QS. Al-Fatihah: 2)");
  expect(copied).toContain("/surah/1/2");

  await page.getByRole("button", { name: "Bagikan ayat" }).click();
  await expect(page.getByRole("menuitem", { name: "WhatsApp" })).toHaveAttribute("href", /^https:\/\/wa\.me\/\?text=.*%2Fsurah%2F1%2F2$/);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("menu")).toHaveCount(0);

  // Next verse, and the way back to the surah at that verse.
  await page.getByRole("link", { name: /Ayat berikutnya/ }).click();
  await expect(page).toHaveURL(/\/surah\/1\/3$/);
  await page.getByRole("link", { name: "Baca di surat" }).click();
  await expect(page).toHaveURL(/\/surah\/1#verse-3$/);
});

test("a typed reference opens the verse: on the home page and in the side panel", async ({ page }) => {
  await page.goto("/");
  const box = page.getByRole("searchbox", { name: "Cari surat" });
  await box.fill("2:255");
  await expect(page.getByRole("link", { name: "Buka Al-Baqarah 2:255" })).toBeVisible();
  // A plain surah number is not a reference: the list's own filter handles it.
  await box.fill("2");
  await expect(page.getByRole("link", { name: /^Buka / })).toHaveCount(0);
  await box.fill("baqarah 255");
  await expect(page.getByRole("link", { name: "Buka Al-Baqarah 2:255" })).toBeVisible();
  await box.press("Enter");
  await expect(page).toHaveURL(/\/surah\/2\/page\/26#verse-255$/);

  // The side panel of a surah has the same box.
  await page.goto("/surah/1");
  await page.getByRole("searchbox", { name: "Cari surat" }).last().fill("112 4");
  await page.getByRole("link", { name: "Buka Al-Ikhlas 112:4" }).click();
  await expect(page).toHaveURL(/\/surah\/112#verse-4$/);
});

test("search: from the home page, a word, a surah filter, an Arabic word without vowel marks, paging and a reference", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("search").getByRole("searchbox").fill("sabar");
  await page.getByRole("search").getByRole("button", { name: "Cari" }).click();
  await expect(page).toHaveURL(/\/search\?q=sabar$/);
  await expect(page.getByRole("status")).toContainText("Ayat ditemukan:");
  const first = page.getByRole("listitem").first();
  await expect(first.getByRole("link")).toHaveText(/^Al-\w+ \d+:\d+$/);
  await expect(first.locator("mark").first()).toHaveText(/sabar/i);

  // Limited to a surah.
  await page.goto("/search?q=Allah&surah=112");
  await expect(page.getByRole("listitem")).toHaveCount(await page.getByRole("listitem").count());
  for (const link of await page.getByRole("listitem").getByRole("link").allTextContents()) expect(link).toMatch(/ 112:\d+$/);

  // Arabic, without vowel marks and with the article attached.
  await page.goto("/search?q=" + encodeURIComponent("رحمن"));
  await expect(page.getByRole("listitem").first().getByRole("link")).toHaveText("Al-Fatihah 1:1");
  await expect(page.getByRole("listitem").first().locator("mark").first()).toHaveText("رحمن");

  // The same word is spelled in more than one way.
  await page.goto("/search?q=shalat");
  const shalat = await page.getByRole("status").textContent();
  await page.goto("/search?q=sholat");
  expect(await page.getByRole("status").textContent()).toBe(shalat);

  // A page of results at a time, and the way to the next.
  await page.goto("/search?q=Allah");
  await expect(page.getByRole("listitem")).toHaveCount(20);
  await page.getByRole("link", { name: /berikutnya/i }).click();
  await expect(page).toHaveURL(/page=2/);

  // A reference is offered as a link; a word that is not there says so; a query that is too short asks for more.
  await page.goto("/search?q=" + encodeURIComponent("2:255"));
  await expect(page.getByRole("link", { name: "Buka Al-Baqarah 2:255" })).toBeVisible();
  await page.goto("/search?q=zzzqqqxxx");
  await expect(page.getByRole("status")).toHaveText("Tidak ada ayat yang cocok.");
  await page.goto("/search?q=a");
  await expect(page.getByText("Ketik kata pencarian yang lebih panjang.")).toBeVisible();

  // Crawlers are kept out of the results pages.
  expect(await (await page.request.get("/search?q=sabar")).text()).toContain('name="robots" content="noindex');
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
