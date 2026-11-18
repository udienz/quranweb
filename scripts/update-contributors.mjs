#!/usr/bin/env node
// Writes CONTRIBUTORS.md from the GitHub history of the repository: the owner as maintainer, the translators of each
// interface language (who changed its catalog in src/lib/i18n/messages/), and everyone else with commits on the default
// branch. Bots and accounts that are not contributors are left out (see EXCLUDED_LOGINS in contributors-lib.mjs).
//
//   node scripts/update-contributors.mjs            write CONTRIBUTORS.md
//   node scripts/update-contributors.mjs --check    exit 1 if CONTRIBUTORS.md is out of date (writes nothing)
//   node scripts/update-contributors.mjs --repo owner/name
//
// Run it from the repository root. It reads the public GitHub API; set GITHUB_TOKEN (or GH_TOKEN) for a higher rate
// limit. Needs Node 24 or newer (the one the project already uses). No dependencies.

import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { buildModel, parseLocaleNames, render, translationLocales } from "./contributors-lib.mjs";

const OUTPUT = "CONTRIBUTORS.md";
const MESSAGES_DIR = "src/lib/i18n/messages";
const args = process.argv.slice(2);
const check = args.includes("--check");
const repoArg = args.includes("--repo") ? args[args.indexOf("--repo") + 1] : undefined;

function repoFromGit() {
  let url;
  try {
    url = execFileSync("git", ["remote", "get-url", "origin"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    throw new Error("Cannot read the git remote (is this a git checkout with an origin?); pass --repo owner/name");
  }
  const match = /github\.com[:/]([^/]+\/[^/]+?)(?:\.git)?$/.exec(url);
  if (!match) throw new Error(`Cannot tell the GitHub repository from the remote "${url}"; pass --repo owner/name`);
  return match[1];
}

function fail(error) {
  console.error(`update-contributors: ${error instanceof Error ? error.message : error}`);
  process.exit(2);
}
process.on("uncaughtException", fail);
process.on("unhandledRejection", fail);

const repo = repoArg ?? repoFromGit();
if (!/^[\w.-]+\/[\w.-]+$/.test(repo)) fail(`"${repo}" is not a repository name like owner/name`);
const [owner] = repo.split("/");
const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;

async function github(path) {
  const response = await fetch(`https://api.github.com${path}`, {
    headers: {
      accept: "application/vnd.github+json",
      "user-agent": "quranweb-contributors-script",
      "x-github-api-version": "2022-11-28",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!response.ok) throw new Error(`GitHub answered ${response.status} for ${path}: ${(await response.text()).slice(0, 200)}`);
  return response.json();
}

/** All pages of a list endpoint. */
async function list(path) {
  const items = [];
  for (let page = 1; ; page++) {
    const batch = await github(`${path}${path.includes("?") ? "&" : "?"}per_page=100&page=${page}`);
    items.push(...batch);
    if (batch.length < 100) return items;
  }
}

if (!existsSync("package.json") || !existsSync(MESSAGES_DIR)) {
  console.error("Run this from the root of the repository.");
  process.exit(2);
}

const names = parseLocaleNames(readFileSync("src/lib/i18n/config.ts", "utf8"));
const locales = translationLocales(readdirSync(MESSAGES_DIR));

const contributors = await list(`/repos/${repo}/contributors`);
const translators = {};
for (const code of locales) {
  const commits = await list(`/repos/${repo}/commits?path=${encodeURIComponent(`${MESSAGES_DIR}/${code}.ts`)}`);
  translators[code] = commits.map((c) => c.author).filter(Boolean);
}

const text = render(buildModel({ owner, contributors, translators, names }));
const current = existsSync(OUTPUT) ? readFileSync(OUTPUT, "utf8") : "";

if (check) {
  if (text === current) {
    console.log(`${OUTPUT} is up to date.`);
  } else {
    console.error(`${OUTPUT} is out of date: run "node scripts/update-contributors.mjs" and commit the result.`);
    process.exit(1);
  }
} else if (text === current) {
  console.log(`${OUTPUT} is already up to date.`);
} else {
  writeFileSync(OUTPUT, text);
  console.log(`Wrote ${OUTPUT}.`);
}
