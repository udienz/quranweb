import { defineConfig } from "@playwright/test";
import { resolve } from "node:path";

// Browser tests (e2e/*.e2e.ts) against the production build (`npm run build` first), reading the small data copy in
// e2e/fixtures, so they need no network. CI runs them; locally see docs/development.md ("Browser tests").
const PORT = Number(process.env.E2E_PORT ?? 3100);
const fixtures = resolve(__dirname, "e2e/fixtures");

export default defineConfig({
  testDir: "e2e",
  testMatch: "**/*.e2e.ts",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: process.env.CI ? [["list"], ["github"]] : "list",
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    // Indonesian interface (the browser's locale decides Accept-Language; the fixtures have the Indonesian editions only).
    locale: "id-ID",
    // Audio may start without a user gesture in tests (the route below answers every .mp3 with a short WAV).
    launchOptions: { args: ["--autoplay-policy=no-user-gesture-required"] },
    trace: "off",
  },
  webServer: {
    // The search index is built from the fixtures first (it is not in git).
    command: `node scripts/build-search-index.mjs e2e/fixtures && npm run start -- -p ${PORT} -H 127.0.0.1`,
    url: `http://127.0.0.1:${PORT}/privacy`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
    env: {
      QURAN_API_URL: `${fixtures}/api/v2`,
      QURAN_FAWAZ_URL: `${fixtures}/quran-api`,
      QURAN_QURANENC_URL: `${fixtures}/quranenc`,
      QURAN_QUL_URL: `${fixtures}/qul`,
    },
  },
});
