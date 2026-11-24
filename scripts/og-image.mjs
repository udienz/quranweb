#!/usr/bin/env node
// Draw public/og.png, the image link previews show for every page (1200 by 630), from HTML in the site's colours (deep forest, soft cream and muted gold), logo
// and fonts. Run it again when the brand changes; the result is committed.
//
//   node scripts/og-image.mjs
//
// Needs Playwright's Chromium (on the workspace VM, run it in the mcr.microsoft.com/playwright image of the pinned
// version, as for the browser tests).

import { chromium } from "@playwright/test";
import { readFileSync } from "node:fs";

const root = new URL("../", import.meta.url);
const font = (path) => `data:font/woff2;base64,${readFileSync(new URL(`node_modules/${path}`, root)).toString("base64")}`;

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face { font-family: Amiri; src: url(${font("@fontsource/amiri/files/amiri-arabic-400-normal.woff2")}); }
@font-face { font-family: Grotesk; src: url(${font("@fontsource-variable/space-grotesk/files/space-grotesk-latin-wght-normal.woff2")}); font-weight: 300 700; }
@font-face { font-family: Jakarta; src: url(${font("@fontsource-variable/plus-jakarta-sans/files/plus-jakarta-sans-latin-wght-normal.woff2")}); font-weight: 200 800; }
* { margin: 0; box-sizing: border-box; }
body { width: 1200px; height: 630px; background: linear-gradient(135deg, #344c3d, #2a4033); color: #f8f2e7;
  font-family: Jakarta; display: flex; flex-direction: column; justify-content: center; padding: 0 96px; }
.brand { display: flex; align-items: center; gap: 28px; }
h1 { font-family: Grotesk; font-weight: 700; font-size: 104px; letter-spacing: -2px; }
.arabic { font-family: Amiri; font-size: 64px; color: #cdb67f; margin-top: 28px; direction: rtl; align-self: flex-start; }
p { font-size: 34px; color: rgb(248 242 231 / 0.85); margin-top: 18px; }
.url { position: absolute; bottom: 56px; left: 96px; font-size: 26px; color: rgb(248 242 231 / 0.72); }
</style></head><body>
<div class="brand">
  <svg width="120" height="120" viewBox="0 0 32 32" fill="none">
    <path d="M16 2l3.5 3.5H24.5V10.5L28 14l-3.5 3.5V22.5H19.5L16 26l-3.5-3.5H7.5V17.5L4 14l3.5-3.5V5.5H12.5L16 2z" fill="#f8f2e7" opacity="0.16"/>
    <path d="M6 12.5c3.5-1 7-.6 10 1.5 3-2.1 6.5-2.5 10-1.5v11c-3.5-1-7-.6-10 1.5-3-2.1-6.5-2.5-10-1.5v-11z" stroke="#f8f2e7" stroke-width="1.6" stroke-linejoin="round"/>
    <path d="M16 14v11" stroke="#f8f2e7" stroke-width="1.6"/>
    <circle cx="16" cy="8" r="1.8" fill="#cdb67f"/>
  </svg>
  <h1>QuranWeb</h1>
</div>
<div class="arabic" lang="ar">بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</div>
<p>Baca Al-Qur'an · Read the Qur'an</p>
<div class="url">quranweb.udienz.web.id</div>
</body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.setContent(html, { waitUntil: "load" });
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: new URL("public/og.png", root).pathname });
await browser.close();
console.log("wrote public/og.png");
