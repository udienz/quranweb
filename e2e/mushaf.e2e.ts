import { expect, test } from "@playwright/test";
import { logPlays, playing, plays, routeAudio, watchConsole } from "./helpers";

// A page of the printed Madinah mushaf, /mushaf/N: its verses from one to three surahs, and the audio across them.

test.beforeEach(async ({ context }) => {
  await logPlays(context);
});

// The number of a verse in the translation column opens that verse's actions; the id carries the surah, because a page
// can hold several surahs.
const openVerse = async (page: import("@playwright/test").Page, surah: number, verse: number) => {
  await page.locator(`#verse-${surah}-${verse}`).getByRole("button").first().click();
  await page.getByRole("toolbar").getByRole("button", { name: "Putar audio" }).click();
};

test("a wrong page number is a 404, a right one is not", async ({ request }) => {
  for (const bad of ["0", "605", "abc", "2.5", "1e2", "-1"]) expect((await request.get(`/mushaf/${bad}`)).status(), bad).toBe(404);
  expect((await request.get("/mushaf/1/2")).status()).toBe(404);
  for (const ok of ["1", "2", "604", "0604"]) expect((await request.get(`/mushaf/${ok}`)).status(), ok).toBe(200);
});

test("page 604 holds three surahs, each with its name, and the preview names them", async ({ page, request }) => {
  const problems = watchConsole(page);
  await page.goto("/mushaf/604");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Halaman mushaf 604");
  for (const [surah, name] of [[112, "Al-Ikhlas"], [113, "Al-Falaq"], [114, "An-Nas"]] as const) {
    await expect(page.locator(`#verse-${surah}-1`)).toHaveCount(1);
    await expect(page.getByText(name, { exact: true }).first()).toBeVisible();
  }
  const html = await (await request.get("/mushaf/604")).text();
  expect(html).toContain("Al-Ikhlas 112:1–4 · Al-Falaq 113:1–5 · An-Nas 114:1–6");
  expect(html).toContain('<link rel="canonical"');
  expect(problems).toEqual([]);
});

test("the audio plays on across the surahs of the page and stops at the end of the page's last surah", async ({ page }) => {
  await routeAudio(page);
  await page.goto("/mushaf/604");
  await openVerse(page, 112, 4);
  await expect.poll(() => plays(page), { timeout: 15_000 }).toEqual([
    "112:4", "113:1", "113:2", "113:3", "113:4", "113:5", "114:1", "114:2", "114:3", "114:4", "114:5", "114:6",
  ]);
  await expect.poll(() => playing(page)).toBe("");
});

test("at the end of a page the audio goes on with the verse after it, on the next page", async ({ page, context }) => {
  await context.addInitScript(() => localStorage.setItem("quranweb:playback-mode", "next"));
  await routeAudio(page);
  await page.goto("/mushaf/1");
  await openVerse(page, 1, 7);
  // Page 1 ends with the end of Al-Fatihah; the reader chose to go on with the next surah, which starts page 2.
  await expect.poll(() => plays(page), { timeout: 15_000 }).toEqual(expect.arrayContaining(["1:7", "2:1", "2:2", "2:3", "2:4", "2:5"]));
  await expect(page).toHaveURL(/\/mushaf\/(2|3)$/);
});

test("turning pages: the buttons, a typed page number, the arrow keys and a swipe, and the page number on the page", async ({ page }) => {
  await page.goto("/mushaf/2");
  await expect(page.getByText("— 2 —")).toBeVisible();
  // The first page has no previous page, the last no next one.
  await page.goto("/mushaf/1");
  await expect(page.getByRole("link", { name: /sebelumnya/i })).toHaveCount(0);
  await page.goto("/mushaf/604");
  await expect(page.getByRole("link", { name: /berikutnya/i })).toHaveCount(0);

  await page.goto("/mushaf/2");
  await page.getByRole("link", { name: /berikutnya/i }).first().click();
  await expect(page).toHaveURL(/\/mushaf\/3$/);
  await expect(page.getByText("— 3 —")).toBeVisible();
  await page.getByRole("link", { name: /sebelumnya/i }).first().click();
  await expect(page).toHaveURL(/\/mushaf\/2$/);

  // A page number typed in the box (1 to 604); one out of range does nothing.
  const box = page.getByRole("spinbutton").first();
  await box.fill("700");
  await box.press("Enter");
  await expect(page).toHaveURL(/\/mushaf\/2$/);
  await box.fill("604");
  await box.press("Enter");
  await expect(page).toHaveURL(/\/mushaf\/604$/);

  // Arrow keys turn the page (to the right is forward in this left-to-right interface), but not while typing in the box.
  await page.goto("/mushaf/2", { waitUntil: "networkidle" });
  await page.keyboard.press("ArrowRight");
  await expect(page).toHaveURL(/\/mushaf\/3$/);
  await page.keyboard.press("ArrowLeft");
  await expect(page).toHaveURL(/\/mushaf\/2$/);
  await page.getByRole("spinbutton").first().focus();
  await page.keyboard.press("ArrowRight");
  await expect(page).toHaveURL(/\/mushaf\/2$/);

  // A swipe towards the start of the line (to the left here) turns to the next page; a short or a mostly vertical one does not.
  const swipe = (dx: number, dy: number) =>
    page.evaluate(([x, y]) => {
      const target = document.querySelector("h1")!;
      const touch = (cx: number, cy: number) => new Touch({ identifier: 1, target, clientX: cx, clientY: cy });
      const fire = (type: string, t: Touch) =>
        target.dispatchEvent(new TouchEvent(type, { bubbles: true, cancelable: true, touches: type === "touchend" ? [] : [t], changedTouches: [t] }));
      fire("touchstart", touch(300, 300));
      fire("touchend", touch(300 + x, 300 + y));
    }, [dx, dy]);
  await page.waitForLoadState("networkidle");
  await swipe(-30, 0);
  await swipe(-120, 200);
  await expect(page).toHaveURL(/\/mushaf\/2$/);
  await swipe(-120, 10);
  await expect(page).toHaveURL(/\/mushaf\/3$/);
  await swipe(120, 10);
  await expect(page).toHaveURL(/\/mushaf\/2$/);
});

// The page of the mushaf that has a verse, from the fixtures' table (the same one the app reads).
import { readFileSync } from "node:fs";
const pageTable = JSON.parse(readFileSync("e2e/fixtures/quran-api/info.json", "utf8")).pages.references as {
  page: number;
  start: { chapter: number; verse: number };
  end: { chapter: number; verse: number };
}[];
const pageOf = (surah: number, verse: number) =>
  pageTable.find((p) => (p.start.chapter < surah || (p.start.chapter === surah && p.start.verse <= verse)) && (p.end.chapter > surah || (p.end.chapter === surah && p.end.verse >= verse)))!.page;

test("the setting 'Halaman mushaf': a surah and an old link to a page of 10 verses lead to the mushaf page", async ({ page, context, baseURL }) => {
  // By default a surah opens as before.
  await page.goto("/surah/2");
  await expect(page).toHaveURL(/\/surah\/2$/);

  // Chosen on the settings page: a button that is pressed, a cookie, and the account's choice recorded.
  await page.goto("/settings", { waitUntil: "networkidle" });
  const mushaf = page.getByRole("button", { name: "Halaman mushaf (604)" });
  await mushaf.click();
  await expect(mushaf).toHaveAttribute("aria-pressed", "true");
  expect((await context.cookies(baseURL!)).find((c) => c.name === "qw-paging")?.value).toBe("mushaf");
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("quranweb:user") ?? "{}").choices?.paging?.value)).toBe("mushaf");

  // A surah opens at the page that has its first verse; an old link to a page of 10 verses at the page that has that page's first verse.
  await page.goto("/surah/2");
  await expect(page).toHaveURL(new RegExp(`/mushaf/${pageOf(2, 1)}$`));
  await page.goto("/surah/2?page=26");
  await expect(page).toHaveURL(new RegExp(`/mushaf/${pageOf(2, 251)}$`));
  await page.goto("/surah/113");
  await expect(page).toHaveURL(/\/mushaf\/604$/);
  // The page of a verse (the one to share) and a wrong address are not affected.
  expect((await page.request.get("/surah/2/255")).status()).toBe(200);
  expect((await page.request.get("/surah/115")).status()).toBe(404);

  // Back to pages of 10 verses.
  await page.goto("/settings", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "10 ayat" }).click();
  await page.goto("/surah/2");
  await expect(page).toHaveURL(/\/surah\/2$/);
});

test("a reader of the mushaf pages has the last read position recorded, with its surah", async ({ page, context }) => {
  await context.addCookies([{ name: "qw-paging", value: "mushaf", url: "http://127.0.0.1:3100" }]);
  await page.goto("/mushaf/604", { waitUntil: "networkidle" });
  // Put the verse in the band of the screen that counts as "being read".
  await page.evaluate(() => {
    const el = document.getElementById("verse-113-3")!;
    window.scrollBy(0, el.getBoundingClientRect().top - window.innerHeight * 0.32);
  });
  await expect
    .poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("quranweb:user") ?? "{}").lastRead), { timeout: 8000 })
    .toMatchObject({ surah: 113 });
});

test("the mushaf pages are in the sitemap and robots names it", async ({ request }) => {
  const urls = [...(await (await request.get("/sitemap/2.xml")).text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  expect(urls).toHaveLength(604);
  expect(urls.every((u) => /\/mushaf\/\d+$/.test(u))).toBe(true);
});
