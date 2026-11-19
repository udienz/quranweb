import { expect, test } from "@playwright/test";
import { cards, logPlays, playing, plays, routeAudio } from "./helpers";

// Memorization: each verse several times, a range in rounds, and hiding the text.

test.beforeEach(async ({ context }) => {
  await logPlays(context);
});

test("each verse twice, then the surah ends", async ({ page, context, baseURL }) => {
  await cards(context, baseURL!);
  await routeAudio(page);
  await page.goto("/surah/112");
  await page.getByRole("button", { name: "Hafalan" }).click();
  await page.getByRole("combobox", { name: "Putar setiap ayat" }).selectOption("2");
  await page.locator("#verse-1:visible").getByRole("button", { name: "Putar audio" }).click();
  await expect.poll(() => plays(page)).toEqual(["112:1", "112:1", "112:2", "112:2", "112:3", "112:3", "112:4", "112:4"]);
  await expect.poll(() => playing(page)).toBe("");
});

test("a range across a page boundary, two rounds, then stop", async ({ page, context, baseURL }) => {
  await cards(context, baseURL!);
  await routeAudio(page);
  await page.goto("/surah/2");
  await page.getByRole("button", { name: "Hafalan" }).click();
  await page.getByRole("combobox", { name: "Dari ayat" }).selectOption("9");
  await page.getByRole("combobox", { name: "Sampai ayat" }).selectOption("12");
  await page.getByRole("combobox", { name: "Berapa kali" }).selectOption("2");
  await page.getByRole("button", { name: "Mulai" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Mengulang ayat 9–12" })).toBeVisible();
  await expect.poll(() => plays(page), { timeout: 15_000 }).toEqual(["2:9", "2:10", "2:11", "2:12", "2:9", "2:10", "2:11", "2:12"]);
  await expect.poll(() => playing(page)).toBe("");
  await expect(page.getByRole("status").filter({ hasText: "Mengulang" })).toHaveCount(0);
});

for (const layout of ["cards", "mushaf"] as const) {
  test(`hiding the Arabic or the translation (${layout})`, async ({ page, context, baseURL }) => {
    await context.addCookies([{ name: "qw-layout", value: layout, url: baseURL! }]);
    await page.goto("/surah/112");
    const ar = (n: number) => (layout === "cards" ? page.locator(`#verse-${n}:visible p[lang=ar]`) : page.locator("main p[lang=ar] > span").nth(n - 1));
    const tr = (n: number) =>
      layout === "cards" ? page.locator(`#verse-${n}:visible p[lang=id]`).first() : page.locator(`#verse-${n}:visible span[lang=id]`).first();
    const blurred = (loc: ReturnType<typeof ar>) => loc.evaluate((el) => getComputedStyle(el).filter.startsWith("blur"));
    expect(await blurred(ar(1))).toBe(false);
    await page.getByRole("button", { name: "Hafalan" }).click();
    const hide = page.getByRole("combobox", { name: "Sembunyikan saat menghafal" });
    await hide.selectOption("arabic");
    expect([await blurred(ar(1)), await blurred(ar(4)), await blurred(tr(1))]).toEqual([true, true, false]);
    await ar(2).click();
    expect([await blurred(ar(2)), await blurred(ar(1))]).toEqual([false, true]);
    await ar(2).click();
    expect(await blurred(ar(2))).toBe(true);
    await hide.selectOption("translation");
    expect([await blurred(tr(1)), await blurred(ar(1))]).toEqual([true, false]);
    await hide.selectOption("none");
    expect(await blurred(tr(1))).toBe(false);
  });
}
