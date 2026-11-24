import { expect, test } from "@playwright/test";

// Tajweed colours, the ruku mark and the Arabic font (issues #130 to #132). The fixtures' QUL copy is made up
// (scripts/e2e-fixtures.mjs): the first word of every verse is marked `ghunnah`, and every surah is one ruku.

test("tajweed colours and the ruku mark are on by default, and each can be turned off", async ({ page }) => {
  await page.goto("/surah/112");
  const panel = page.locator("aside");
  await expect(page.locator(".tj-ghunnah").first()).toBeVisible();
  // Al-Ikhlas is one ruku: the mark follows its last verse only.
  await expect(page.getByRole("img", { name: "Akhir ruku" })).toHaveCount(1);

  await panel.getByRole("switch", { name: "Warna tajwid" }).click();
  await expect(page.locator(".tj-ghunnah")).toHaveCount(0);
  await panel.getByRole("switch", { name: "Tanda ruku (ع)" }).click();
  await expect(page.getByRole("img", { name: "Akhir ruku" })).toHaveCount(0);

  // The choice is kept in this browser.
  await page.reload();
  await expect(page.locator(".tj-ghunnah")).toHaveCount(0);
});

test("the Arabic font can be the King Fahd Complex's, and stays after a reload", async ({ page }) => {
  await page.goto("/surah/112");
  await expect(page.locator("html")).not.toHaveAttribute("data-arabic-font");
  await page.locator("aside").getByRole("button", { name: "KFGQPC Uthmanic Hafs" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-arabic-font", "kfgqpc");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-arabic-font", "kfgqpc");
  const family = await page.locator(".font-arabic").first().evaluate((el) => getComputedStyle(el).fontFamily);
  expect(family).toContain("KFGQPC HAFS Uthmanic Script");
});
