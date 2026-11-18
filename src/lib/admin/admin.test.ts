import { randomBytes } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createAuth, type Auth } from "../auth/create";
import { browserSignIn, hashedSub, sessionCookie, startFakeOidc, type FakeOidc } from "../auth/fake-oidc";
import { openDatabase, type Database } from "../db";
import { handleState } from "../sync/api";
import { emptyUserData, toggleBookmark } from "../userdata/schema";
import { handleAdminAction } from "./api";
import { adminEmails, isAdminEmail } from "./config";
import { listAudit, listUsers } from "./server";

const BASE = "http://localhost:3000";
const ADMINS = new Set(["boss@example.test"]);
let dir: string;
let db: Database;
let idp: FakeOidc;
let auth: Auth;

beforeAll(async () => {
  dir = mkdtempSync(join(tmpdir(), "qw-admin-"));
  db = openDatabase(join(dir, "admin.db"));
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

async function reader(seed: string) {
  idp.user = { sub: hashedSub(seed), email: `${seed}@example.test`, name: `Reader ${seed}` };
  const call = (path: string, init?: RequestInit) => auth.handler(new Request(`${BASE}${path}`, init));
  return sessionCookie(await browserSignIn(call, BASE));
}
const idOf = (email: string) => (db.prepare('SELECT id FROM "user" WHERE email = ?').get(email) as { id: string }).id;

const act = (cookie: string | null, targetId: string, body: unknown = { action: "disable" }, headers: Record<string, string> = {}) =>
  handleAdminAction(
    new Request(`${BASE}/api/admin/users/${targetId}`, {
      method: "POST",
      headers: { ...(cookie ? { cookie } : {}), origin: BASE, "content-type": "application/json", ...headers },
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
    targetId,
    { auth, db, baseUrl: BASE, admins: ADMINS },
  );

describe("who is an admin", () => {
  it("reads a comma-separated list, ignoring case and blanks", () => {
    expect([...adminEmails({ ADMIN_EMAILS: " A@Example.test, b@example.test ,, nope " })]).toEqual(["a@example.test", "b@example.test"]);
    expect(adminEmails({}).size).toBe(0);
  });
  it("needs a verified email", () => {
    const admins = new Set(["a@example.test"]);
    expect(isAdminEmail("A@example.test", true, admins)).toBe(true);
    expect(isAdminEmail("a@example.test", false, admins)).toBe(false);
    expect(isAdminEmail("b@example.test", true, admins)).toBe(false);
  });
});

describe("admin actions", () => {
  it("look like a missing page to anyone who is not an admin", async () => {
    const target = await reader("plain-target");
    const other = await reader("plain-other");
    expect((await act(null, idOf("plain-target@example.test"))).status).toBe(404);
    expect((await act(other, idOf("plain-target@example.test"))).status).toBe(404);
    expect(target).toBeTruthy();
    expect(db.prepare('SELECT "disabledAt" AS d FROM "user" WHERE email = ?').get("plain-target@example.test")).toEqual({ d: null });
  });

  it("do not work for an admin address that is not verified", async () => {
    const cookie = await reader("boss");
    await reader("victim-unverified");
    db.prepare('UPDATE "user" SET "emailVerified" = 0 WHERE email = ?').run("boss@example.test");
    expect((await act(cookie, idOf("victim-unverified@example.test"))).status).toBe(404);
    db.prepare('UPDATE "user" SET "emailVerified" = 1 WHERE email = ?').run("boss@example.test");
  });

  it("need this site, JSON and a known action, and never touch the admin's own account", async () => {
    const boss = await reader("boss");
    const target = idOf((await reader("careful-target"), "careful-target@example.test"));
    expect((await act(boss, target, { action: "disable" }, { origin: "https://evil.example.test" })).status).toBe(403);
    expect((await act(boss, target, "{}", { "content-type": "text/plain" })).status).toBe(415);
    expect((await act(boss, target, { action: "ban-forever" })).status).toBe(400);
    expect((await act(boss, target, "not json")).status).toBe(400);
    expect((await act(boss, idOf("boss@example.test"), { action: "delete" })).status).toBe(409);
    expect((await act(boss, "no-such-id")).status).toBe(404);
    expect(db.prepare("SELECT COUNT(*) AS n FROM admin_audit").get()).toEqual({ n: 0 });
  });

  it("disable signs the reader out everywhere and keeps them out until enabled, and are recorded", async () => {
    const boss = await reader("boss");
    const victim = await reader("to-disable");
    const victimId = idOf("to-disable@example.test");
    const state = () => handleState(new Request(`${BASE}/api/me/state`, { headers: { cookie: victim } }), { auth, db, baseUrl: BASE });
    expect((await state()).status).toBe(200);

    expect((await act(boss, victimId, { action: "disable" })).status).toBe(200);
    expect(db.prepare('SELECT COUNT(*) AS n FROM session WHERE "userId" = ?').get(victimId)).toEqual({ n: 0 });
    expect((await state()).status).toBe(401);
    // signing in again gives no session
    const call = (path: string, init?: RequestInit) => auth.handler(new Request(`${BASE}${path}`, init));
    idp.user = { sub: hashedSub("to-disable"), email: "to-disable@example.test", name: "Reader to-disable" };
    expect(sessionCookie(await browserSignIn(call, BASE))).not.toContain("session_token");

    expect((await act(boss, victimId, { action: "enable" })).status).toBe(200);
    expect(sessionCookie(await browserSignIn(call, BASE))).toContain("session_token");

    const log = listAudit(db).filter((a) => a.targetUserId === victimId);
    expect(log.map((a) => a.action).sort()).toEqual(["disable", "enable"]);
    expect(log.every((a) => a.actorEmail === "boss@example.test")).toBe(true);
  });

  it("delete removes the account and its data, and the log entry outlives it", async () => {
    const boss = await reader("boss");
    const victim = await reader("to-delete-by-admin");
    const victimId = idOf("to-delete-by-admin@example.test");
    await handleState(
      new Request(`${BASE}/api/me/state`, {
        method: "PUT",
        headers: { cookie: victim, origin: BASE, "content-type": "application/json" },
        body: JSON.stringify({ data: toggleBookmark(emptyUserData(), 2, 2, new Date().toISOString()) }),
      }),
      { auth, db, baseUrl: BASE },
    );
    expect((await act(boss, victimId, { action: "delete" })).status).toBe(200);
    for (const [table, column] of [["account_data", "user_id"], ["session", '"userId"'], ["account", '"userId"']]) {
      expect(db.prepare(`SELECT COUNT(*) AS n FROM ${table} WHERE ${column} = ?`).get(victimId)).toEqual({ n: 0 });
    }
    expect(listAudit(db).some((a) => a.targetUserId === victimId && a.action === "delete")).toBe(true);
  });
});

describe("listing", () => {
  it("shows account details only", async () => {
    await reader("listed");
    const row = listUsers(db).find((u) => u.email === "listed@example.test");
    expect(row).toBeDefined();
    expect(Object.keys(row!).sort()).toEqual(["createdAt", "disabledAt", "email", "id", "lastSeenAt", "name"]);
    expect(row!.createdAt).toBeGreaterThan(Date.parse("2020-01-01"));
    expect(row!.lastSeenAt).toBeGreaterThan(0);
  });

  it("returns plain objects, which Next.js can pass to a client component", () => {
    // node:sqlite rows have a null prototype; React refuses those between server and client components.
    expect(listUsers(db).length).toBeGreaterThan(0);
    for (const row of [...listUsers(db), ...listAudit(db)]) expect(Object.getPrototypeOf(row)).toBe(Object.prototype);
  });
});
