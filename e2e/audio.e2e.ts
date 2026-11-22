import { expect, test } from "@playwright/test";
import { cards, logPlays, playing, plays, routeAudio, watchConsole } from "./helpers";

// Audio: verse after verse, across pages and surahs, the end-of-surah mode, data saver, the fallback to the second server,
// the keyboard and the lock screen. Every .mp3 is answered with a short WAV.

test.beforeEach(async ({ context, baseURL }) => {
  await cards(context, baseURL!);
  await logPlays(context);
});

const playButton = (page: import("@playwright/test").Page, n: number) =>
  page.locator(`#verse-${n}:visible`).getByRole("button", { name: "Putar audio" });

test("plays a surah verse by verse and stops at its end", async ({ page }) => {
  const problems = watchConsole(page);
  await routeAudio(page);
  await page.goto("/surah/112");
  await playButton(page, 1).click();
  await expect.poll(() => plays(page)).toEqual(["112:1", "112:2", "112:3", "112:4"]);
  await expect.poll(() => playing(page)).toBe("");
  expect(problems).toEqual([]);
});

test("'next surah' carries on into the following surahs and stops after 114", async ({ page, context }) => {
  await context.addInitScript(() => localStorage.setItem("quranweb:playback-mode", "next"));
  await routeAudio(page);
  await page.goto("/surah/113");
  await playButton(page, 1).click();
  await expect.poll(() => plays(page), { timeout: 15_000 }).toEqual(["113:1", "113:2", "113:3", "113:4", "113:5", "114:1", "114:2", "114:3", "114:4", "114:5", "114:6"]);
  await expect(page).toHaveURL(/\/surah\/114/);
  await expect.poll(() => playing(page)).toBe("");
});

test("crosses from one 10-verse page to the next", async ({ page }) => {
  await routeAudio(page);
  await page.goto("/surah/2");
  await playButton(page, 9).click();
  await expect.poll(() => plays(page)).toEqual(expect.arrayContaining(["2:9", "2:10", "2:11"]));
  await expect(page).toHaveURL(/\/page\/2/);
});

test("data saver plays the smallest file first; standard plays EQuran.id", async ({ page, context }) => {
  let urls = await routeAudio(page);
  await page.goto("/surah/2");
  await playButton(page, 1).click();
  await expect.poll(() => urls[0]).toBe("https://cdn.equran.id/audio-partial/Misyari-Rasyid-Al-Afasi/002001.mp3");

  const saver = await context.newPage();
  await saver.addInitScript(() => localStorage.setItem("quranweb:audio-quality", "saver"));
  urls = await routeAudio(saver);
  await saver.goto("/surah/2");
  await playButton(saver, 1).click();
  // 2:1 is ayah 8 of the Qur'an.
  await expect.poll(() => urls[0]).toBe("https://cdn.islamic.network/quran/audio/64/ar.alafasy/8.mp3");
});

test("falls back to the AlQuran.cloud CDN when EQuran.id fails", async ({ page }) => {
  const urls = await routeAudio(page, { fail: (url) => url.includes("cdn.equran.id") });
  await page.goto("/surah/1");
  await playButton(page, 2).click();
  await expect.poll(() => urls).toEqual(expect.arrayContaining(["https://cdn.islamic.network/quran/audio/128/ar.alafasy/2.mp3"]));
  expect(urls[0]).toContain("cdn.equran.id");
});

test("keyboard: Space plays and pauses, N and P move, even in quick succession", async ({ page }) => {
  await routeAudio(page, { seconds: 4 });
  await page.goto("/surah/2");
  await page.waitForLoadState("networkidle"); // the key listener is attached once React has hydrated
  await page.locator("body").click({ position: { x: 5, y: 5 } });
  await page.keyboard.press("Space");
  await expect.poll(() => playing(page)).toBe("verse-1");
  await page.keyboard.press("n");
  await expect.poll(() => playing(page)).toBe("verse-2");
  await page.keyboard.press("p"); // right after N: the interrupted play() must not clear the mark
  await expect.poll(() => playing(page)).toBe("verse-1");
  await page.keyboard.press("Space");
  await expect.poll(() => playing(page)).toBe("");
  await page.keyboard.press("Space");
  await expect.poll(() => playing(page)).toBe("verse-1");
});

test("the lock screen shows the verse and its buttons work", async ({ page, context }) => {
  await context.addInitScript(() => {
    const w = window as unknown as { __ms: Record<string, (() => void) | null> };
    w.__ms = {};
    const set = navigator.mediaSession.setActionHandler.bind(navigator.mediaSession);
    navigator.mediaSession.setActionHandler = (action, handler) => {
      w.__ms[action] = handler as (() => void) | null;
      return set(action, handler);
    };
  });
  await routeAudio(page, { seconds: 4 });
  const title = () => page.evaluate(() => navigator.mediaSession.metadata?.title ?? null);
  const press = (action: string) => page.evaluate((a) => (window as unknown as { __ms: Record<string, () => void> }).__ms[a]?.(), action);
  await page.goto("/surah/2");
  await playButton(page, 10).click();
  await expect.poll(title).toBe("Al-Baqarah 2:10");
  expect(await page.evaluate(() => navigator.mediaSession.metadata?.artist)).toBe("Misyari Rasyid Al-Afasi");
  await press("pause");
  await expect.poll(() => page.evaluate(() => navigator.mediaSession.playbackState)).toBe("paused");
  await press("play");
  await expect.poll(() => playing(page)).toBe("verse-10");
  await press("nexttrack");
  await expect.poll(title).toBe("Al-Baqarah 2:11");
  await expect(page).toHaveURL(/\/page\/2/);
  await press("previoustrack");
  await expect.poll(title).toBe("Al-Baqarah 2:10");
});

test("a surah plays as one recording, and the playback mode goes on with the next surah's recording", async ({ page, context }) => {
  await context.addInitScript(() => localStorage.setItem("quranweb:playback-mode", "next"));
  const urls = await routeAudio(page);
  await page.goto("/surah/1");
  await page.getByRole("button", { name: "Putar surat" }).click();
  await expect.poll(() => urls.filter((u) => /audio-full/.test(u)).length, { timeout: 15_000 }).toBeGreaterThanOrEqual(2);
  expect(urls[0]).toMatch(/\/audio-full\/[A-Za-z-]+\/001\.mp3$/);
  expect(urls[1]).toMatch(/\/audio-full\/[A-Za-z-]+\/002\.mp3$/);
  await expect(page).toHaveURL(/\/surah\/2/);
  expect(urls.some((u) => /audio-partial/.test(u))).toBe(false);
});

test("the lock screen names a whole surah that plays, and play and pause work", async ({ page, context }) => {
  await context.addInitScript(() => {
    const w = window as unknown as { __ms: Record<string, (() => void) | null> };
    w.__ms = {};
    const set = navigator.mediaSession.setActionHandler.bind(navigator.mediaSession);
    navigator.mediaSession.setActionHandler = (action, handler) => {
      w.__ms[action] = handler as (() => void) | null;
      return set(action, handler);
    };
  });
  await routeAudio(page, { seconds: 4 });
  const press = (action: string) => page.evaluate((a) => (window as unknown as { __ms: Record<string, () => void> }).__ms[a]?.(), action);
  await page.goto("/surah/1");
  await page.getByRole("button", { name: "Putar surat" }).click();
  await expect.poll(() => page.evaluate(() => navigator.mediaSession.metadata?.title ?? null)).toBe("Al-Fatihah");
  expect(await page.evaluate(() => navigator.mediaSession.metadata?.artist)).toBe("Misyari Rasyid Al-Afasi");
  await press("pause");
  await expect.poll(() => page.evaluate(() => navigator.mediaSession.playbackState)).toBe("paused");
  await expect(page.getByRole("button", { name: "Putar surat" })).toHaveAttribute("aria-pressed", "false");
  await press("play");
  await expect.poll(() => page.evaluate(() => navigator.mediaSession.playbackState)).toBe("playing");
  await expect(page.getByRole("button", { name: "Jeda surat" })).toHaveAttribute("aria-pressed", "true");
});
