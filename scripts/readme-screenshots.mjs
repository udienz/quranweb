// Take the "What you can do" screenshots of the READMEs, in English and Indonesian.
//
//   node scripts/readme-screenshots.mjs [base URL]
//
// The base URL defaults to production. Each picture starts from a fresh browser with sample reading data (bookmarks,
// a goal, progress) written into local storage, so nothing of a real reader is used or changed. Output goes to
// docs/screenshots/<en|id>/how-*.png. Set PW_CHROMIUM to a Chromium binary when the one Playwright expects is missing.

import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";

const BASE = (process.argv[2] ?? "https://quranweb.udienz.web.id").replace(/\/$/, "");
const OUT = new URL("../docs/screenshots/", import.meta.url).pathname;

const day = (offset) => {
  const d = new Date();
  d.setDate(d.getDate() - offset);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

/** Sample reading data in the version 2 schema (src/lib/userdata/schema.ts). */
function sampleData(lang) {
  const at = new Date().toISOString();
  const text = {
    en: { morning: "Morning", kursi: "Read before sleeping", yasin: "Friday night" },
    id: { morning: "Pagi", kursi: "Dibaca sebelum tidur", yasin: "Malam Jumat" },
  }[lang];
  const activity = {};
  for (let i = 0; i < 6; i++) activity[day(i)] = { sample01: i === 0 ? 7 : 12 };
  return {
    version: 2,
    lastRead: { surah: 2, verse: 255, at },
    progress: {
      1: { readUpTo: 7, at },
      2: { readUpTo: 40, at },
      36: { readUpTo: 12, at },
    },
    bookmarks: [
      { surah: 2, verse: 255, note: text.kursi, createdAt: at, updatedAt: at, collectionId: "morning01" },
      { surah: 36, verse: 1, note: text.yasin, createdAt: at, updatedAt: at },
      { surah: 1, verse: 1, note: "", createdAt: at, updatedAt: at, collectionId: "morning01" },
    ],
    choices: {},
    collections: [{ id: "morning01", name: text.morning, createdAt: at, updatedAt: at }],
    goal: { versesPerDay: 10, at },
    activity,
  };
}

const browser = await chromium.launch(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {});

async function open(lang, { cookies = {}, storage = {}, data = false, width = 1280, height = 800 } = {}) {
  const context = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: 2,
    locale: lang === "id" ? "id-ID" : "en-US",
    colorScheme: "light",
  });
  const url = new URL(BASE);
  await context.addCookies(
    Object.entries({ "qw-lang": lang, ...cookies }).map(([name, value]) => ({ name, value, domain: url.hostname, path: "/" })),
  );
  const items = { theme: "light", ...storage };
  if (data) items["quranweb:user"] = JSON.stringify(sampleData(lang));
  await context.addInitScript((entries) => {
    for (const [k, v] of Object.entries(entries)) localStorage.setItem(k, v);
  }, items);
  // No visitor statistics from these runs, and no audio downloads.
  await context.route(/cloudflareinsights|\/cdn-cgi\/rum|\.mp3(\?|$)/, (route) => route.abort());
  const page = await context.newPage();
  return { context, page };
}

const selection = (value) => encodeURIComponent(JSON.stringify(value));

async function shoot(lang, name, fn, options) {
  const { context, page } = await open(lang, options);
  try {
    const target = (await fn(page)) ?? page;
    await page.waitForTimeout(400);
    await target.screenshot({ path: `${OUT}${lang}/${name}.png`, animations: "disabled" });
    console.log(`${lang}/${name}.png`);
  } finally {
    await context.close();
  }
}

const go = async (page, path) => {
  await page.goto(BASE + path, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
};

for (const lang of ["en", "id"]) {
  mkdirSync(`${OUT}${lang}`, { recursive: true });
  const T = (await import(`../src/lib/i18n/messages/${lang}.ts`))[lang];

  // Several translations side by side, verse by verse.
  await shoot(lang, "how-translations", async (page) => {
    await go(page, "/surah/1");
  }, {
    cookies: {
      "qw-layout": "cards",
      "qw-sel": selection({
        translations: lang === "id" ? ["ind-kemenag", "eng-abdullahyusufal"] : ["eng-abdullahyusufal", "eng-mohammedmarmadu"],
      }),
    },
  });

  // The Audio section of the settings page: reciter, data saver, end of surah, play a juz, keys.
  await shoot(lang, "how-listen", async (page) => {
    await go(page, "/settings");
    return page.locator("#audio");
  });

  // Memorization panel with the Arabic hidden and one verse shown.
  await shoot(lang, "how-memorize", async (page) => {
    await go(page, "/surah/112");
    await page.getByRole("button", { name: T.memorize.button }).click();
    await page.waitForTimeout(300);
  }, { storage: { "quranweb:memorize-hide": "arabic", "quranweb:verse-repeat": "3" } });

  // The action bar of a verse in the mushaf layout: play, bookmark, mark as read, copy.
  await shoot(lang, "how-verse-actions", async (page) => {
    await go(page, "/surah/1");
    await page.getByRole("button", { name: T.mushaf.verseActions.replace("{n}", "2") }).first().click();
    await page.waitForTimeout(300);
  }, { data: true });

  // Bookmarks with notes and a collection.
  await shoot(lang, "how-bookmarks", async (page) => {
    await go(page, "/my-reading");
    return page.locator("section", { has: page.getByRole("heading", { name: T.myReading.bookmarks.title }) }).last();
  }, { data: true });

  // Daily goal, streak and khatam progress.
  await shoot(lang, "how-daily-goal", async (page) => {
    await go(page, "/my-reading");
    return page.locator("section", { has: page.getByRole("heading", { name: T.myReading.goal.title }) }).last();
  }, { data: true });

  // Language menu in the header.
  await shoot(lang, "how-language", async (page) => {
    await go(page, "/");
    await page.getByRole("button", { name: T.nav.language }).first().click();
    await page.waitForTimeout(300);
    return null;
  }, { height: 420 });

  // Theme and text size on the settings page.
  await shoot(lang, "how-display", async (page) => {
    await go(page, "/settings");
    return page.locator("#display");
  });
}

await browser.close();
