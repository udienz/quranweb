// The pure part of scripts/update-contributors.mjs: who counts as a contributor and how CONTRIBUTORS.md looks.
// No network and no file access here, so it can be tested (scripts/contributors.test.mjs).

/**
 * Accounts that GitHub lists as contributors but that are not people who contributed. `claude` is the account GitHub
 * attributes the early commits written as "Claude <noreply@anthropic.com>" to: an unrelated person's account.
 * Bots (type "Bot", such as Dependabot) are left out by type.
 */
export const EXCLUDED_LOGINS = ["claude"];

/** A real person's account that should be credited. */
export function isPerson(account, excluded = EXCLUDED_LOGINS) {
  return (
    !!account &&
    typeof account.login === "string" &&
    account.type === "User" &&
    !excluded.map((l) => l.toLowerCase()).includes(account.login.toLowerCase())
  );
}

/** `{ tr: "Türkçe", ... }` from the LOCALE_NAMES line of src/lib/i18n/config.ts. */
export function parseLocaleNames(configSource) {
  const line = /LOCALE_NAMES[^=]*=\s*\{([^}]*)\}/.exec(configSource);
  if (!line) throw new Error("LOCALE_NAMES not found in the i18n config");
  const names = {};
  for (const [, code, name] of line[1].matchAll(/(\w+)\s*:\s*"([^"]*)"/g)) names[code] = name;
  return names;
}

/** Locale codes of the catalogs in src/lib/i18n/messages/, from the file names. English is the source, not a translation. */
export function translationLocales(fileNames) {
  return fileNames
    .map((name) => /^([a-z]{2,3})\.ts$/.exec(name)?.[1])
    .filter((code) => code && code !== "en")
    .sort();
}

/**
 * Who is listed for each language catalog in CODEOWNERS: `{ id: ["udienz"] }` from a line such as
 * `/src/lib/i18n/messages/id.ts @udienz`. Those are the language's maintainers.
 */
export function parseCodeowners(text) {
  const owners = {};
  for (const line of text.split("\n")) {
    const match = /^\s*\/?src\/lib\/i18n\/messages\/([a-z]{2,3})\.ts\s+(.+)$/.exec(line.replace(/#.*/, ""));
    if (match) owners[match[1]] = match[2].split(/\s+/).filter((w) => w.startsWith("@")).map((w) => w.slice(1));
  }
  return owners;
}

const byLoginCaseInsensitive = (a, b) => a.login.toLowerCase().localeCompare(b.login.toLowerCase());

/**
 * The people to credit.
 * - `owner`: the repository owner's login, listed first as the maintainer.
 * - `contributors`: GitHub's contributor list (login, type, contributions).
 * - `translators`: for each locale, the accounts that changed its catalog on the default branch.
 * - `names`: language names by locale code.
 * - `pullRequestAuthors`: the people whose pull requests were merged. Commits whose email GitHub cannot link to an
 *   account are missing from `contributors`, so this is how such a person is found.
 * - `codeowners`: the maintainers of each language (see parseCodeowners). The owner is credited as a translator of a
 *   language only when CODEOWNERS names them for it; a fix to someone else's catalog does not make them its translator.
 */
export function buildModel({ owner, contributors, translators, names, pullRequestAuthors = [], codeowners = {} }) {
  const people = new Map(); // lower-case login -> account (first spelling wins)
  const add = (account) => {
    if (isPerson(account) && !people.has(account.login.toLowerCase())) people.set(account.login.toLowerCase(), account);
  };
  contributors.forEach(add);
  pullRequestAuthors.forEach(add);
  Object.values(translators).flat().forEach(add);

  const counts = new Map(contributors.map((c) => [c.login.toLowerCase(), c.contributions ?? 0]));
  for (const a of pullRequestAuthors) {
    const key = a.login.toLowerCase();
    if (!counts.has(key)) counts.set(key, 0);
  }
  const maintainer = people.get(owner.toLowerCase()) ?? { login: owner };
  const others = [...people.values()]
    .filter((p) => p.login.toLowerCase() !== owner.toLowerCase())
    .sort(
      (a, b) =>
        (counts.get(b.login.toLowerCase()) ?? 0) - (counts.get(a.login.toLowerCase()) ?? 0) || byLoginCaseInsensitive(a, b),
    );

  const languages = Object.keys(translators)
    .sort()
    .map((code) => {
      const seen = new Set();
      const maintainers = (codeowners[code] ?? []).map((l) => l.toLowerCase());
      const logins = translators[code].filter((a) => {
        const key = a.login?.toLowerCase();
        if (!isPerson(a) || seen.has(key)) return false;
        if (key === owner.toLowerCase() && !maintainers.includes(key)) return false;
        seen.add(key);
        return true;
      });
      return { code, name: names[code] ?? code, people: logins.sort(byLoginCaseInsensitive) };
    })
    .filter((l) => l.people.length > 0);

  return { maintainer, translators: languages, contributors: others };
}

const link = (p) => `[@${p.login}](https://github.com/${p.login})`;

/** The text of CONTRIBUTORS.md. No dates, so running the script twice on the same history gives the same file. */
export function render(model) {
  const lines = [
    "# Contributors",
    "",
    "Thank you to everyone who has helped build QuranWeb.",
    "",
    "This list is generated from the GitHub history by `node scripts/update-contributors.mjs`; please do not edit it by hand.",
    "See [CONTRIBUTING.md](CONTRIBUTING.md) to take part.",
    "",
    "## Maintainer",
    "",
    `- ${link(model.maintainer)}`,
  ];
  if (model.translators.length > 0) {
    lines.push("", "## Interface translators", "");
    for (const l of model.translators) lines.push(`- **${l.name}** (\`${l.code}\`): ${l.people.map(link).join(", ")}`);
  }
  if (model.contributors.length > 0) {
    lines.push("", "## Contributors", "");
    for (const p of model.contributors) lines.push(`- ${link(p)}`);
  }
  return lines.join("\n") + "\n";
}
