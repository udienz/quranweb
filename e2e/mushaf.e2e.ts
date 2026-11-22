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
