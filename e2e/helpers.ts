import type { BrowserContext, Page } from "@playwright/test";

/** A short silent WAV, so "ended" fires quickly and no audio is downloaded. */
export function wav(seconds = 0.25, rate = 8000): Buffer {
  const n = Math.floor(seconds * rate);
  const b = Buffer.alloc(44 + n);
  b.write("RIFF", 0);
  b.writeUInt32LE(36 + n, 4);
  b.write("WAVEfmt ", 8);
  b.writeUInt32LE(16, 16);
  b.writeUInt16LE(1, 20);
  b.writeUInt16LE(1, 22);
  b.writeUInt32LE(rate, 24);
  b.writeUInt32LE(rate, 28);
  b.writeUInt16LE(1, 32);
  b.writeUInt16LE(8, 34);
  b.write("data", 36);
  b.writeUInt32LE(n, 40);
  b.fill(128, 44);
  return b;
}

/** Answer every .mp3 with a WAV of `seconds`, and keep the requested URLs. `fail` makes matching URLs answer 404. */
export async function routeAudio(page: Page, options: { seconds?: number; fail?: (url: string) => boolean } = {}) {
  const urls: string[] = [];
  const body = wav(options.seconds);
  await page.route("**/*.mp3", (route) => {
    const url = route.request().url();
    urls.push(url);
    if (options.fail?.(url)) return route.fulfill({ status: 404, body: "" });
    return route.fulfill({ status: 200, contentType: "audio/wav", body });
  });
  return urls;
}

/**
 * Log every play() as "surah:verse" (from EQuran.id file names such as 002009.mp3), because replaying the same verse does
 * not fetch the file again. Read it with `plays(page)`. Uses `src`: `currentSrc` still names the old file at that moment.
 */
export async function logPlays(context: BrowserContext) {
  await context.addInitScript(() => {
    const w = window as unknown as { __plays: string[] };
    w.__plays = [];
    const play = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function () {
      const m = String(this.src || this.currentSrc).match(/(\d{3})(\d{3})\.mp3/);
      w.__plays.push(m ? `${Number(m[1])}:${Number(m[2])}` : this.src);
      return play.call(this);
    };
  });
}
export const plays = (page: Page) => page.evaluate(() => (window as unknown as { __plays: string[] }).__plays);

/** The verse ids marked as playing (visible ones only: Next keeps a left page hidden in the DOM). */
export const playing = (page: Page) =>
  page.evaluate(() =>
    [...document.querySelectorAll("[id^='verse-']")]
      .filter((e) => (e as HTMLElement).offsetParent && e.querySelector("button[aria-label='Jeda audio']"))
      .map((e) => e.id)
      .join(","),
  );

/** Cards layout: one block per verse, which the tests find by id. */
export async function cards(context: BrowserContext, baseURL: string) {
  await context.addCookies([{ name: "qw-layout", value: "cards", url: baseURL }]);
}

/** Console errors and page errors, without the noise of a test environment. */
export function watchConsole(page: Page): string[] {
  const problems: string[] = [];
  page.on("console", (m) => {
    if (m.type() === "error" && !/Failed to load resource|cloudflareinsights/.test(m.text())) problems.push(m.text());
  });
  page.on("pageerror", (e) => problems.push(`pageerror: ${e.message}`));
  return problems;
}
