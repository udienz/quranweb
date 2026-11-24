import { expect, test, type Locator, type Page } from "@playwright/test";
import { MESSAGES } from "../src/lib/i18n/messages";
import { LOCALES } from "../src/lib/i18n/config";

// The home page lists six surahs and searches all 114 with suggestions; /surahs lists all 114; the header says "Daftar surat" without a count.
// The interface is Indonesian (the fixtures hold the Indonesian editions), and the surah list in the fixtures has all 114 names.

const SIX = ["Al-Fatihah", "Al-Baqarah", "Ali 'Imran", "An-Nisa'", "Al-Ma'idah", "Al-An'am"];

// Next keeps the page that was left, hidden, so only what is visible counts (the home page stays behind /surahs).
const rows = (page: Page): Locator => page.locator("section#surahs:visible ul.home-editorial__surah-list > li > a");
const box = (page: Page): Locator => page.locator("section#surahs:visible input[role=combobox]");
const options = (page: Page): Locator => page.getByRole("option");
const option = (page: Page, name: string | RegExp): Locator => page.getByRole("option", { name });

test("the home page lists exactly the first six surahs, each linking to its reader", async ({ page }) => {
  await page.goto("/");
  await expect(rows(page)).toHaveCount(6);
  for (const [i, name] of SIX.entries()) {
    await expect(rows(page).nth(i)).toContainText(name);
    await expect(rows(page).nth(i)).toHaveAttribute("href", `/surah/${i + 1}`);
  }
  // The rows go to their surah (the fixtures have the text of surahs 1 and 2).
  await rows(page).nth(1).click();
  await expect(page).toHaveURL(/\/surah\/2$/);
  await page.goto("/");
  await rows(page).first().click();
  await expect(page).toHaveURL(/\/surah\/1$/);
});

test("'Lihat semua surat' opens the full list, which has all 114 surahs and its own filter", async ({ page }) => {
  await page.goto("/");
  const link = page.getByRole("link", { name: /Lihat semua surat/ });
  await expect(link).toHaveAttribute("href", "/surahs");
  await link.click();
  await expect(page).toHaveURL(/\/surahs$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Daftar surat");
  await expect(rows(page)).toHaveCount(114);
  // The filter is the one it always was: it narrows the list, with no suggestion list.
  await page.getByRole("searchbox", { name: "Cari surat" }).fill("yasin");
  await expect(rows(page)).toHaveCount(1);
  await expect(rows(page).first()).toHaveAttribute("href", "/surah/36");
  await expect(options(page)).toHaveCount(0);
  await page.getByRole("searchbox", { name: "Cari surat" }).fill("zzzz");
  await expect(page.getByText("Surat tidak ditemukan.")).toBeVisible();
});

test.describe("suggestions in the home page's search box", () => {
  test("they come from all 114 surahs, not only the six listed, and the six stay as they are", async ({ page }) => {
    await page.goto("/");
    await box(page).fill("ikhlas");
    await expect(option(page, /Al-Ikhlas/)).toBeVisible();
    await expect(rows(page)).toHaveCount(6);
  });

  test("a Latin name, a part of it, and a name with an apostrophe or a hyphen", async ({ page }) => {
    await page.goto("/");
    for (const [typed, found] of [["Al-Baqarah", "Al-Baqarah"], ["baq", "Al-Baqarah"], ["fat", "Al-Fatihah"], ["imran", "Ali 'Imran"], ["maidah", "Al-Ma'idah"], ["nisa", "An-Nisa'"]] as const) {
      await box(page).fill(typed);
      await expect(options(page).first(), typed).toContainText(found);
    }
  });

  test("an Arabic name, with or without its article, vowel marks and the other forms of the letters", async ({ page }) => {
    await page.goto("/");
    for (const [typed, found] of [["البقرة", "Al-Baqarah"], ["بقرة", "Al-Baqarah"], ["ٱلْبَقَرَةِ", "Al-Baqarah"], ["الاخلاص", "Al-Ikhlas"], ["الفاتحه", "Al-Fatihah"]] as const) {
      await box(page).fill(typed);
      await expect(options(page).first(), typed).toContainText(found);
    }
  });

  test("a number, also in Arabic-Indic digits, finds that surah first", async ({ page }) => {
    await page.goto("/");
    for (const [typed, found] of [["112", "Al-Ikhlas"], ["2", "Al-Baqarah"], ["٢", "Al-Baqarah"], ["002", "Al-Baqarah"], ["36", "Yasin"]] as const) {
      await box(page).fill(typed);
      await expect(options(page).first(), typed).toContainText(found);
    }
  });

  test("a suggestion shows the number, the Latin name and the Arabic name", async ({ page }) => {
    await page.goto("/");
    await box(page).fill("baqarah");
    const first = options(page).first();
    await expect(first).toContainText("002");
    await expect(first).toContainText("Al-Baqarah");
    await expect(first.locator("[lang=ar]")).toHaveText("البقرة");
  });

  test("the mouse: hover highlights, a click opens the surah", async ({ page }) => {
    await page.goto("/");
    await box(page).fill("11");
    await expect(options(page).nth(3)).toBeVisible();
    await options(page).nth(3).hover();
    await expect(options(page).nth(3)).toHaveAttribute("aria-selected", "true");
    await expect(options(page).first()).toHaveAttribute("aria-selected", "false");
    await option(page, /Al-Ikhlas/).click();
    await expect(page).toHaveURL(/\/surah\/112$/);
  });

  test("the keyboard: arrows move, Enter opens, Escape closes and keeps the text", async ({ page }) => {
    await page.goto("/");
    await box(page).fill("11");
    // 11 (Hud) first, then the numbers that start with 11: 110, 111, 112, 113, 114.
    await expect(options(page)).toHaveCount(6);
    await expect(box(page)).toHaveAttribute("aria-expanded", "true");
    await expect(options(page).first()).toHaveAttribute("aria-selected", "true");
    await box(page).press("ArrowDown");
    await box(page).press("ArrowDown");
    await box(page).press("ArrowDown");
    await expect(option(page, /Al-Ikhlas/)).toHaveAttribute("aria-selected", "true");
    const activeId = await option(page, /Al-Ikhlas/).getAttribute("id");
    await expect(box(page)).toHaveAttribute("aria-activedescendant", activeId!);
    // Arrow Up from the first wraps to the last.
    await box(page).press("ArrowUp");
    await box(page).press("ArrowUp");
    await box(page).press("ArrowUp");
    await box(page).press("ArrowUp");
    await expect(option(page, /An-Nas(?!r)/)).toHaveAttribute("aria-selected", "true");
    // Escape closes the list and keeps what was typed; Arrow Down opens it again.
    await box(page).press("Escape");
    await expect(options(page)).toHaveCount(0);
    await expect(box(page)).toHaveAttribute("aria-expanded", "false");
    await expect(box(page)).toHaveValue("11");
    await box(page).press("ArrowDown");
    await expect(options(page)).toHaveCount(6);
    // Enter opens the highlighted surah: three steps down from the first is 112.
    await box(page).press("ArrowDown");
    await box(page).press("ArrowDown");
    await box(page).press("ArrowDown");
    await box(page).press("Enter");
    await expect(page).toHaveURL(/\/surah\/112$/);
  });

  test("Enter on the first suggestion needs no arrow", async ({ page }) => {
    await page.goto("/");
    await box(page).fill("baqarah");
    await box(page).press("Enter");
    await expect(page).toHaveURL(/\/surah\/2$/);
  });

  test("nothing typed shows no list; a text that matches nothing says so", async ({ page }) => {
    await page.goto("/");
    await box(page).focus();
    await expect(options(page)).toHaveCount(0);
    await expect(box(page)).toHaveAttribute("aria-expanded", "false");
    await box(page).fill("zzzz");
    await expect(page.getByRole("status").filter({ hasText: "Surat tidak ditemukan." })).toBeVisible();
    await expect(page.getByRole("listbox")).toHaveCount(0);
    await box(page).fill("   ");
    await expect(page.getByText("Surat tidak ditemukan.")).toHaveCount(0);
  });

  test("a press outside closes the list", async ({ page }) => {
    await page.goto("/");
    await box(page).fill("baq");
    await expect(options(page)).toHaveCount(1);
    await page.getByRole("heading", { level: 1 }).click();
    await expect(options(page)).toHaveCount(0);
  });

  test("a typed verse still opens that verse", async ({ page }) => {
    await page.goto("/");
    await box(page).fill("2:255");
    await expect(page.getByRole("link", { name: /Buka Al-Baqarah 2:255/ })).toBeVisible();
    await expect(options(page)).toHaveCount(0);
    await box(page).press("Enter");
    await expect(page).toHaveURL(/\/surah\/2(\?|#|\/)/);
  });

  test("the hero search is the one it was: no suggestions, and it goes to the search page", async ({ page }) => {
    await page.goto("/");
    const hero = page.getByRole("search").first();
    await hero.getByRole("searchbox").fill("baq");
    await expect(options(page)).toHaveCount(0);
    await hero.getByRole("searchbox").press("Enter");
    await expect(page).toHaveURL(/\/search\?q=baq/);
  });
});

test.describe("on a phone", () => {
  test.use({ hasTouch: true, viewport: { width: 390, height: 844 } });

  test("a tap on a suggestion opens the surah, and the list stays inside the screen", async ({ page }) => {
    await page.goto("/");
    await box(page).fill("baq");
    await expect(options(page)).toHaveCount(1);
    const panel = await page.locator(".home-editorial__suggest").boundingBox();
    expect(panel!.x).toBeGreaterThanOrEqual(0);
    expect(panel!.x + panel!.width).toBeLessThanOrEqual(390);
    expect((await options(page).first().boundingBox())!.height).toBeGreaterThanOrEqual(44);
    await options(page).first().tap();
    await expect(page).toHaveURL(/\/surah\/2$/);
  });

  test("the home page does not scroll sideways", async ({ page }) => {
    await page.goto("/");
    await box(page).fill("11");
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
  });
});

test.describe("right to left", () => {
  test.use({ locale: "ar-SA" });

  test("Arabic input, a list that mirrors and stays inside the screen", async ({ page, context, baseURL }) => {
    await context.addCookies([{ name: "qw-lang", value: "ar", url: baseURL! }]);
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await box(page).fill("الفاتحة");
    await expect(options(page)).toHaveCount(1);
    await expect(options(page).first()).toContainText("Al-Fatihah");
    for (const viewport of [{ width: 1280, height: 800 }, { width: 390, height: 844 }]) {
      await page.setViewportSize(viewport);
      const panel = (await page.locator(".home-editorial__suggest").boundingBox())!;
      expect(panel.x, `${viewport.width}px`).toBeGreaterThanOrEqual(0);
      expect(panel.x + panel.width, `${viewport.width}px`).toBeLessThanOrEqual(viewport.width);
    }
    // The list opens from the box's end edge, which is on the left in right to left: it does not stick out on the right.
    const input = (await box(page).boundingBox())!;
    const panel = (await page.locator(".home-editorial__suggest").boundingBox())!;
    expect(panel.x + panel.width).toBeLessThanOrEqual(input.x + input.width + 1);
    await options(page).first().click();
    await expect(page).toHaveURL(/\/surah\/1$/);
  });
});

test("the header says the list's name without a count, in every language, and still goes to the list", async ({ request }) => {
  for (const locale of LOCALES) {
    const html = await (await request.get("/privacy", { headers: { cookie: `qw-lang=${locale}` } })).text();
    const link = html.match(/<a [^>]*href="\/#surahs"[^>]*>([\s\S]*?)<\/a>/);
    expect(link, locale).not.toBeNull();
    const text = link![1].replace(/<[^>]*>/g, "").replace(/&#x27;|&#39;/g, "'").replace(/&amp;/g, "&").trim();
    expect(text, locale).toBe(MESSAGES[locale].home.listTitle);
    expect(link![1], locale).not.toMatch(/114/);
  }
});

test("the sitemap lists the full list of surahs", async ({ request }) => {
  const urls = [...(await (await request.get("/sitemap/0.xml")).text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  expect(urls.some((u) => u.endsWith("/surahs"))).toBe(true);
});
