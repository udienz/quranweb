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
