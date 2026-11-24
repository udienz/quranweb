import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// Browsers such as Chrome offer to translate a page, and when the page language is Indonesian they rewrite the Arabic of the
// Qur'an into Indonesian words (and turn the verse markers into ")1 (" and the language code "ID" into "Pengenal"). The
// text of the Qur'an must reach the reader as it is published, so everything Arabic and every language name says
// translate="no". This test keeps a new component from forgetting it.

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.tsx$/.test(name) && !/\.test\./.test(name) ? [path] : [];
  });
}

describe("machine translation of the Qur'an text", () => {
  const files = sourceFiles("src");

  it("every element marked as Arabic (lang=\"ar\") also says translate=\"no\"", () => {
    const missing = files.flatMap((file) =>
      readFileSync(file, "utf8")
        .split("\n")
        .map((text, i) => ({ file, line: i + 1, text }))
        .filter(({ text }) => text.includes('lang="ar"') && !text.includes('translate="no"'))
        .map(({ file, line }) => `${file}:${line}`),
    );
    expect(missing).toEqual([]);
  });

  it("the language menu does not let the browser translate the language names and codes", () => {
    const menu = readFileSync("src/components/LanguageMenu.tsx", "utf8");
    expect(menu.match(/translate="no"/g)?.length).toBeGreaterThanOrEqual(2); // the code and each menu item
    // The list on the settings page (a SearchableSelect) gives every option its `lang`, and those are not translated.
    expect(menu).toMatch(/lang: code/);
    const select = readFileSync("src/components/SearchableSelect.tsx", "utf8");
    expect(select.match(/translate=\{o\.lang \? "no" : undefined\}/g)?.length).toBeGreaterThanOrEqual(3);
  });

  it("finds the components it is meant to check", () => {
    expect(files.some((f) => f.endsWith("MushafView.tsx"))).toBe(true);
    expect(files.length).toBeGreaterThan(20);
  });
});
