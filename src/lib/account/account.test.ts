import { randomBytes } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createAuth, type Auth } from "../auth/create";
import { browserSignIn, hashedSub, sessionCookie, startFakeOidc, type FakeOidc } from "../auth/fake-oidc";
import { openDatabase, type Database } from "../db";
import { handleState } from "../sync/api";
import { emptyUserData, importUserData, liveBookmarks, toggleBookmark, type UserData } from "../userdata/schema";
import { handleDelete, handleExport } from "./api";

const BASE = "http://localhost:3000";
let dir: string;
let db: Database;
let idp: FakeOidc;
let auth: Auth;

beforeAll(async () => {
  dir = mkdtempSync(join(tmpdir(), "qw-account-"));
  db = openDatabase(join(dir, "account.db"));
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

const deps = () => ({ auth, db, baseUrl: BASE });

async function reader(seed: string) {
  idp.user = { sub: hashedSub(seed), email: `${seed}@example.test`, name: `Reader ${seed}` };
  const call = (path: string, init?: RequestInit) => auth.handler(new Request(`${BASE}${path}`, init));
  return sessionCookie(await browserSignIn(call, BASE));
}

async function saveBookmark(cookie: string, surah: number, verse: number) {
  const data = toggleBookmark(emptyUserData(), surah, verse, new Date().toISOString());
  const res = await handleState(
    new Request(`${BASE}/api/me/state`, {
      method: "PUT",
      headers: { cookie, origin: BASE, "content-type": "application/json" },
      body: JSON.stringify({ data }),
    }),
    deps(),
  );
  expect(res.status).toBe(200);
}

const exportOf = (cookie: string | null) =>
  handleExport(new Request(`${BASE}/api/me/export`, { headers: cookie ? { cookie } : {} }), deps());
const del = (cookie: string | null, body: unknown = { confirm: "delete" }, headers: Record<string, string> = {}) =>
  handleDelete(
    new Request(`${BASE}/api/me`, {
      method: "DELETE",
      headers: { ...(cookie ? { cookie } : {}), origin: BASE, "content-type": "application/json", ...headers },
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
    deps(),
  );

describe("export", () => {
  it("needs a session", async () => {
    expect((await exportOf(null)).status).toBe(401);
  });

  it("is a download with the account details and the reading data, and can be imported again", async () => {
    const cookie = await reader("exporter");
    await saveBookmark(cookie, 2, 255);
    const res = await exportOf(cookie);
    expect(res.status).toBe(200);
    expect(res.headers.get("content-disposition")).toMatch(/^attachment; filename="quranweb-account-\d{4}-\d{2}-\d{2}\.json"$/);
    expect(res.headers.get("cache-control")).toBe("no-store");
    const text = await res.text();
    const parsed = JSON.parse(text) as { account: { email: string; name: string; createdAt: string } };
    expect(parsed.account.email).toBe("exporter@example.test");
    expect(parsed.account.name).toBe("Reader exporter");
    expect(Number.isNaN(Date.parse(parsed.account.createdAt))).toBe(false);
    // the same file is a valid backup for the My reading page
    const imported: UserData = importUserData(text);
    expect(liveBookmarks(imported).map((b) => `${b.surah}:${b.verse}`)).toEqual(["2:255"]);
  });

  it("holds nothing of another reader", async () => {
    const one = await reader("export-one");
    await saveBookmark(one, 3, 3);
    const two = await reader("export-two");
    const text = await (await exportOf(two)).text();
    expect(text).not.toContain("export-one");
    expect(importUserData(text).bookmarks).toEqual([]);
  });
});

describe("delete account", () => {
  it("needs a session, this site, JSON and an explicit confirmation", async () => {
    expect((await del(null)).status).toBe(401);
    const cookie = await reader("careful");
    expect((await del(cookie, { confirm: "delete" }, { origin: "https://evil.example.test" })).status).toBe(403);
    expect((await del(cookie, "{}", { "content-type": "text/plain" })).status).toBe(415);
    expect((await del(cookie, {})).status).toBe(400);
    expect((await del(cookie, { confirm: true })).status).toBe(400);
    expect((await del(cookie, "not json")).status).toBe(400);
    // still there after all the refusals
    expect(db.prepare('SELECT COUNT(*) AS n FROM "user" WHERE email = ?').get("careful@example.test")).toEqual({ n: 1 });
  });

  it("removes the account, its sign-in link, its sessions and its reading data at once, and clears the cookie", async () => {
    const cookie = await reader("leaver");
    await saveBookmark(cookie, 4, 4);
    const row = db.prepare('SELECT id FROM "user" WHERE email = ?').get("leaver@example.test") as { id: string };
    const count = (table: string, column: string) =>
      (db.prepare(`SELECT COUNT(*) AS n FROM ${table} WHERE ${column} = ?`).get(row.id) as { n: number }).n;
    expect([count("account_data", "user_id"), count("session", '"userId"'), count("account", '"userId"')]).toEqual([1, 1, 1]);

    const res = await del(cookie);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ deleted: true });
    expect(res.headers.getSetCookie().some((c) => /session_token=;|Max-Age=0/i.test(c))).toBe(true);
    expect(db.prepare('SELECT COUNT(*) AS n FROM "user" WHERE id = ?').get(row.id)).toEqual({ n: 0 });
    expect([count("account_data", "user_id"), count("session", '"userId"'), count("account", '"userId"')]).toEqual([0, 0, 0]);
    // the old cookie no longer opens anything
    expect((await exportOf(cookie)).status).toBe(401);
  });

  it("leaves other accounts alone", async () => {
    const keeper = await reader("keeper");
    await saveBookmark(keeper, 5, 5);
    const goner = await reader("goner");
    expect((await del(goner)).status).toBe(200);
    expect(liveBookmarks(importUserData(await (await exportOf(keeper)).text())).length).toBe(1);
  });

  it("lets the same person sign in again as a new, empty account", async () => {
    const first = await reader("returning");
    await saveBookmark(first, 6, 6);
    await del(first);
    const again = await reader("returning");
    expect(importUserData(await (await exportOf(again)).text()).bookmarks).toEqual([]);
    expect(db.prepare('SELECT COUNT(*) AS n FROM "user" WHERE email = ?').get("returning@example.test")).toEqual({ n: 1 });
  });
});
