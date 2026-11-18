import { describe, expect, it } from "vitest";
import { buildModel, EXCLUDED_LOGINS, isPerson, parseLocaleNames, render, translationLocales } from "./contributors-lib.mjs";

const user = (login, contributions = 1) => ({ login, type: "User", contributions });
const names = { id: "Bahasa Indonesia", tr: "Türkçe" };

describe("who counts as a contributor", () => {
  it("accepts people, and refuses bots, other types and the excluded accounts", () => {
    expect(isPerson(user("alice"))).toBe(true);
    expect(isPerson({ login: "dependabot[bot]", type: "Bot" })).toBe(false);
    expect(isPerson({ login: "some-org", type: "Organization" })).toBe(false);
    expect(isPerson(user("Claude"))).toBe(false); // case does not matter
    expect(isPerson(null)).toBe(false);
    expect(isPerson({ type: "User" })).toBe(false);
    expect(EXCLUDED_LOGINS).toContain("claude");
  });
});

describe("reading the repository", () => {
  it("takes the language names from LOCALE_NAMES", () => {
    const source = `export const LOCALE_NAMES: Record<Locale, string> = { en: "English", id: "Bahasa Indonesia", tr: "Türkçe" };`;
    expect(parseLocaleNames(source)).toEqual({ en: "English", id: "Bahasa Indonesia", tr: "Türkçe" });
    expect(() => parseLocaleNames("nothing here")).toThrow();
  });

  it("finds the translation catalogs and skips English and the helper files", () => {
    expect(translationLocales(["tr.ts", "en.ts", "id.ts", "index.ts", "types.ts", "tr.test.ts"])).toEqual(["id", "tr"]);
  });
});

describe("the model", () => {
  const model = buildModel({
    owner: "udienz",
    contributors: [user("udienz", 90), user("claude", 5), { login: "dependabot[bot]", type: "Bot", contributions: 3 }, user("Zed", 2), user("amy", 2), user("P1LOTRX", 1)],
    translators: { tr: [user("P1LOTRX"), user("P1LOTRX"), user("helper")], id: [user("udienz"), user("claude")], fr: [] },
    names,
  });

  it("puts the owner first as the maintainer and does not repeat them", () => {
    expect(model.maintainer.login).toBe("udienz");
    expect(model.contributors.map((p) => p.login)).not.toContain("udienz");
  });

  it("leaves out bots and the excluded accounts everywhere", () => {
    const all = [model.maintainer.login, ...model.contributors.map((p) => p.login), ...model.translators.flatMap((l) => l.people.map((p) => p.login))];
    expect(all).not.toContain("claude");
    expect(all.some((l) => l.includes("[bot]"))).toBe(false);
  });

  it("orders by contributions, then by name without regard to case", () => {
    expect(model.contributors.map((p) => p.login)).toEqual(["amy", "Zed", "P1LOTRX", "helper"]);
  });

  it("credits a translator who has no commit count of their own, once, and skips empty languages", () => {
    expect(model.contributors.map((p) => p.login)).toContain("helper");
    expect(model.translators.map((l) => [l.code, l.name, l.people.map((p) => p.login)])).toEqual([
      ["id", "Bahasa Indonesia", ["udienz"]],
      ["tr", "Türkçe", ["helper", "P1LOTRX"]],
    ]);
  });

  it("still names the owner when GitHub did not list them", () => {
    expect(buildModel({ owner: "udienz", contributors: [], translators: {}, names }).maintainer).toEqual({ login: "udienz" });
  });
});

describe("the file", () => {
  const model = buildModel({ owner: "udienz", contributors: [user("udienz", 9), user("amy", 2)], translators: { tr: [user("amy")] }, names });
  const text = render(model);

  it("has the sections, with links to the profiles", () => {
    expect(text).toContain("## Maintainer\n\n- [@udienz](https://github.com/udienz)");
    expect(text).toContain("## Interface translators\n\n- **Türkçe** (`tr`): [@amy](https://github.com/amy)");
    expect(text).toContain("## Contributors\n\n- [@amy](https://github.com/amy)");
  });

  it("is the same every time and ends with one newline", () => {
    expect(render(model)).toBe(text);
    expect(text.endsWith("\n") && !text.endsWith("\n\n")).toBe(true);
  });

  it("omits the sections that would be empty", () => {
    const alone = render(buildModel({ owner: "udienz", contributors: [user("udienz")], translators: {}, names }));
    expect(alone).not.toContain("Interface translators");
    expect(alone).not.toContain("## Contributors");
  });
});
