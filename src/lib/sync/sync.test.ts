import { randomBytes } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { browserSignIn, hashedSub, sessionCookie, startFakeOidc, type FakeOidc } from "../auth/fake-oidc";
import { createAuth, type Auth } from "../auth/create";
import { openDatabase, type Database } from "../db";
import {
  emptyUserData,
  liveBookmarks,
  setBookmarkNote,
  setLastRead,
  toggleBookmark,
  removeBookmark,
  type UserData,
} from "../userdata/schema";
import { handleState } from "./api";
import { runSync } from "./engine";
import { exchangeAccountData, readAccountData } from "./server";

const BASE = "http://localhost:3000";
let dir: string;
let db: Database;
let idp: FakeOidc;
let auth: Auth;

beforeAll(async () => {
  dir = mkdtempSync(join(tmpdir(), "qw-sync-"));
  db = openDatabase(join(dir, "sync.db"));
  idp = await startFakeOidc();
  auth = createAuth(db, {
    baseUrl: BASE,
    issuerUrl: idp.issuer,
    clientId: idp.clientId,
    clientSecret: idp.clientSecret,
    secret: randomBytes(32).toString("hex"),
  }, { rateLimit: false });
});
afterAll(async () => {
  await idp.close();
  db.close();
  rmSync(dir, { recursive: true, force: true });
});

const T = (n: number) => new Date(Date.UTC(2026, 10, 18, 0, 0, n)).toISOString();
const withBookmark = (d: UserData, surah: number, verse: number, at: string) => toggleBookmark(d, surah, verse, at);

/** Sign in as a reader and return the cookie. */
async function reader(seed: string) {
  idp.user = { sub: hashedSub(seed), email: `${seed}@example.test`, name: seed };
  const call = (path: string, init?: RequestInit) => auth.handler(new Request(`${BASE}${path}`, init));
  return sessionCookie(await browserSignIn(call, BASE));
}

const state = (cookie: string | null, init: RequestInit = {}) =>
  handleState(
    new Request(`${BASE}/api/me/state`, { ...init, headers: { ...(cookie ? { cookie } : {}), ...(init.headers as object) } }),
    { auth, db, baseUrl: BASE },
  );
const put = (cookie: string | null, body: unknown, headers: Record<string, string> = {}) =>
  state(cookie, {
    method: "PUT",
    headers: { origin: BASE, "content-type": "application/json", ...headers },
    body: typeof body === "string" ? body : JSON.stringify({ data: body }),
  });

describe("state API", () => {
  it("needs a session", async () => {
    expect((await state(null)).status).toBe(401);
    expect((await put(null, emptyUserData())).status).toBe(401);
  });

  it("returns empty data for a new account and keeps what a device sends", async () => {
    const cookie = await reader("new-reader");
    const first = (await (await state(cookie)).json()) as { data: UserData };
    expect(first.data.bookmarks).toEqual([]);
    const mine = setLastRead(withBookmark(emptyUserData(), 2, 255, T(1)), 36, 5, T(2));
    const res = await put(cookie, mine);
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe("no-store");
    const back = (await (await state(cookie)).json()) as { data: UserData };
    expect(liveBookmarks(back.data).map((b) => `${b.surah}:${b.verse}`)).toEqual(["2:255"]);
    expect(back.data.lastRead).toMatchObject({ surah: 36, verse: 5 });
  });

  it("merges two devices, and a removal on one reaches the other (tombstone)", async () => {
    const cookie = await reader("two-devices");
    const a1 = withBookmark(withBookmark(emptyUserData(), 1, 1, T(1)), 2, 2, T(2));
    await put(cookie, a1);
    // device B only knows what it pulled, then removes one bookmark and adds another
    const pulled = ((await (await state(cookie)).json()) as { data: UserData }).data;
    const b = withBookmark(removeBookmark(pulled, 1, 1, T(10)), 3, 3, T(11));
    await put(cookie, b);
    // device A, still holding its old copy, syncs again: the removal must win over its stale item
    const merged = ((await (await put(cookie, a1)).json()) as { data: UserData }).data;
    expect(liveBookmarks(merged).map((x) => `${x.surah}:${x.verse}`)).toEqual(["2:2", "3:3"]);
    expect(merged.bookmarks.find((x) => x.surah === 1)?.deletedAt).toBeDefined();
  });

  it("keeps each account's data apart", async () => {
    const one = await reader("reader-one");
    const two = await reader("reader-two");
    await put(one, withBookmark(emptyUserData(), 5, 5, T(1)));
    const seenByTwo = ((await (await state(two)).json()) as { data: UserData }).data;
    expect(seenByTwo.bookmarks).toEqual([]);
  });

  it("is idempotent: sending the same data again changes nothing", async () => {
    const cookie = await reader("idempotent");
    const mine = setBookmarkNote(withBookmark(emptyUserData(), 7, 7, T(1)), 7, 7, "note", T(2));
    const a = (await (await put(cookie, mine)).json()) as { data: UserData };
    const b = (await (await put(cookie, mine)).json()) as { data: UserData };
    expect(b.data).toEqual(a.data);
  });

  it("rejects bad input without touching the stored data", async () => {
    const cookie = await reader("bad-input");
    await put(cookie, withBookmark(emptyUserData(), 9, 9, T(1)));
    const before = ((await (await state(cookie)).json()) as { data: UserData }).data;
    expect((await put(cookie, "not json")).status).toBe(400);
    expect((await put(cookie, { version: 2, lastRead: null, progress: {}, bookmarks: [{ surah: 999, verse: 1 }] })).status).toBe(400);
    expect((await put(cookie, { version: 9 })).status).toBe(400);
    expect(((await (await state(cookie)).json()) as { data: UserData }).data).toEqual(before);
  });

  it("refuses a PUT from another site, without JSON, or too large", async () => {
    const cookie = await reader("csrf");
    expect((await put(cookie, emptyUserData(), { origin: "https://evil.example.test" })).status).toBe(403);
    expect((await state(cookie, { method: "PUT", headers: { origin: BASE }, body: "{}" })).status).toBe(415);
    const big = JSON.stringify({ data: emptyUserData(), pad: "x".repeat(5 * 1024 * 1024) });
    expect((await put(cookie, big)).status).toBe(413);
  });

  it("refuses a disabled account even with a session that already exists", async () => {
    const cookie = await reader("to-disable");
    expect((await state(cookie)).status).toBe(200);
    db.prepare('UPDATE "user" SET "disabledAt" = ? WHERE email = ?').run(Date.now(), "to-disable@example.test");
    expect((await state(cookie)).status).toBe(403);
  });

  it("deletes an account's data with the account", async () => {
    const cookie = await reader("to-delete");
    await put(cookie, withBookmark(emptyUserData(), 4, 4, T(1)));
    const row = db.prepare('SELECT id FROM "user" WHERE email = ?').get("to-delete@example.test") as { id: string };
    db.prepare('DELETE FROM "user" WHERE id = ?').run(row.id);
    expect(db.prepare("SELECT COUNT(*) AS n FROM account_data WHERE user_id = ?").get(row.id)).toEqual({ n: 0 });
  });

  it("refuses a PUT whose merge with the stored data would go over the limits, and stays readable", async () => {
    const cookie = await reader("over-limit");
    // 3,000 live bookmarks each, different verses: each is valid, together they are 6,000 (limit 5,000).
    const many = (first: number) => {
      const bookmarks = [];
      for (let surah = first; bookmarks.length < 3000; surah++) {
        for (let verse = 1; verse <= 60 && bookmarks.length < 3000; verse++) {
          bookmarks.push({ surah, verse, note: "", createdAt: T(1), updatedAt: T(1) });
        }
      }
      return { ...emptyUserData(), bookmarks };
    };
    expect((await put(cookie, many(1))).status).toBe(200);
    const second = await put(cookie, many(60));
    expect(second.status).toBe(400);
    expect(((await second.json()) as { code: string }).code).toBe("invalid");
    const stored = await state(cookie);
    expect(stored.status).toBe(200);
    expect(liveBookmarks(((await stored.json()) as { data: UserData }).data).length).toBe(3000);
  });

  it("brings future change times back to now on the server, also in a copy stored before", () => {
    db.prepare(`INSERT INTO "user" (id, name, email, "emailVerified", "createdAt", "updatedAt") VALUES ('u-future', 'f', 'future@example.test', 1, 0, 0)`).run();
    const FAR = "9999-01-01T00:00:00.000Z";
    const planted = { ...emptyUserData(), bookmarks: [{ surah: 1, verse: 1, note: "planted", createdAt: FAR, updatedAt: FAR }] };
    // a copy stored before the check existed
    db.prepare("INSERT INTO account_data (user_id, data, updated_at) VALUES (?, ?, ?)").run("u-future", JSON.stringify(planted), 0);
    const now = new Date(Date.UTC(2026, 10, 19));
    const healed = exchangeAccountData(db, "u-future", emptyUserData(), now);
    expect(healed.bookmarks[0].updatedAt).toBe(now.toISOString());
    const later = removeBookmark(healed, 1, 1, new Date(Date.UTC(2026, 10, 20)).toISOString());
    expect(liveBookmarks(exchangeAccountData(db, "u-future", later, new Date(Date.UTC(2026, 10, 20)))).length).toBe(0);
  });

  it("two overlapping exchanges lose nothing", () => {
    db.prepare(`INSERT INTO "user" (id, name, email, "emailVerified", "createdAt", "updatedAt") VALUES ('u-race', 'r', 'race@example.test', 1, 0, 0)`).run();
    exchangeAccountData(db, "u-race", withBookmark(emptyUserData(), 10, 1, T(1)));
    exchangeAccountData(db, "u-race", withBookmark(emptyUserData(), 10, 2, T(2)));
    expect(liveBookmarks(readAccountData(db, "u-race")).length).toBe(2);
  });
});

describe("runSync (the browser side)", () => {
  function fakeBrowser(local: UserData, owner: string | null, server: UserData) {
    const state = { local, owner, server, sent: [] as UserData[] };
    return {
      state,
      deps: (userId: string) => ({
        userId,
        load: () => state.local,
        save: (d: UserData) => void (state.local = d),
        getOwner: () => state.owner,
        setOwner: (id: string) => void (state.owner = id),
        exchange: async (d: UserData) => {
          state.sent.push(d);
          return state.server;
        },
      }),
    };
  }

  it("merges data from before sign-in into the account and keeps both", async () => {
    const local = withBookmark(emptyUserData(), 1, 1, T(1));
    const server = withBookmark(emptyUserData(), 2, 2, T(2));
    const b = fakeBrowser(local, null, server);
    await runSync(b.deps("me"));
    expect(liveBookmarks(b.state.local).length).toBe(2);
    expect(b.state.owner).toBe("me");
    expect(liveBookmarks(b.state.sent[0]).length).toBe(1);
  });

  it("never sends another reader's data and drops it from the browser", async () => {
    const local = withBookmark(emptyUserData(), 1, 1, T(1));
    const server = withBookmark(emptyUserData(), 3, 3, T(3));
    const b = fakeBrowser(local, "someone-else", server);
    await runSync(b.deps("me"));
    expect(b.state.sent[0].bookmarks).toEqual([]);
    expect(liveBookmarks(b.state.local).map((x) => x.surah)).toEqual([3]);
    expect(b.state.owner).toBe("me");
  });

  it("keeps a change made while the request was running", async () => {
    const b = fakeBrowser(emptyUserData(), "me", emptyUserData());
    const deps = b.deps("me");
    deps.exchange = async () => {
      b.state.local = withBookmark(b.state.local, 6, 6, T(5)); // the reader bookmarks during the request
      return emptyUserData();
    };
    await runSync(deps);
    expect(liveBookmarks(b.state.local).length).toBe(1);
  });

  it("leaves local data untouched when the request fails", async () => {
    const local = withBookmark(emptyUserData(), 1, 1, T(1));
    const b = fakeBrowser(local, "me", emptyUserData());
    const deps = b.deps("me");
    deps.exchange = async () => {
      throw new Error("offline");
    };
    await expect(runSync(deps)).rejects.toThrow("offline");
    expect(b.state.local).toBe(local);
  });
});

describe("choices to cookies", () => {
  const sel = (qari: string) => ({ value: { qari, translations: ["ind-kemenag"] }, at: T(1) });
  it("writes nothing when the browser already shows the account's choices", async () => {
    const { cookieUpdates } = await import("./choices");
    const { serializeSelection } = await import("../selection");
    const cookies = `qw-lang=en; qw-sel=${serializeSelection({ translations: ["ind-kemenag"], qari: "05" })}`;
    expect(cookieUpdates({ selection: sel("05"), locale: { value: "en", at: T(1) } }, cookies)).toEqual([]);
  });
  it("writes the choices that differ, and nothing without choices", async () => {
    const { cookieUpdates } = await import("./choices");
    const updates = cookieUpdates({ selection: sel("07"), locale: { value: "id", at: T(1) } }, "qw-lang=en; other=1");
    expect(updates.map(([n]) => n).sort()).toEqual(["qw-lang", "qw-sel"]);
    expect(updates.find(([n]) => n === "qw-lang")?.[1]).toBe("id");
    expect(cookieUpdates({}, "qw-lang=en")).toEqual([]);
    expect(cookieUpdates({ layout: { value: "cards", at: T(1) } }, "qw-layout=mushaf")).toEqual([["qw-layout", "cards"]]);
    expect(cookieUpdates({ layout: { value: "cards", at: T(1) } }, "qw-layout=cards")).toEqual([]);
  });
});
