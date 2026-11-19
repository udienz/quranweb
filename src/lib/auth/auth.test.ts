import { randomBytes } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { getMigrations } from "better-auth/db/migration";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { openDatabase, type Database } from "../db";
import { readAuthSettings } from "./config";
import { authOptions, createAuth, type Auth } from "./create";
import { browserSignIn, hashedSub, startFakeOidc, type FakeOidc } from "./fake-oidc";

const BASE = "http://localhost:3000";
let dir: string;
let db: Database;
let idp: FakeOidc;
let auth: Auth;

beforeAll(async () => {
  dir = mkdtempSync(join(tmpdir(), "qw-auth-"));
  db = openDatabase(join(dir, "auth.db"));
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

const call = (path: string, init?: RequestInit) => auth.handler(new Request(`${BASE}${path}`, init));

const signIn = (callbackURL = "/surah/2") => browserSignIn(call, BASE, callbackURL);

describe("settings", () => {
  const full = {
    BETTER_AUTH_URL: "https://quranweb.example.test",
    AUTH_ISSUER_URL: "https://auth.example.test/application/o/quranweb/",
    AUTH_CLIENT_ID: "id",
    AUTH_CLIENT_SECRET: "secret",
    BETTER_AUTH_SECRET: "x".repeat(32),
  };

  it("is off when nothing is set", () => expect(readAuthSettings({})).toBeNull());
  it("reads a complete configuration", () => expect(readAuthSettings(full)?.clientId).toBe("id"));
  it("refuses a half configuration", () => {
    expect(() => readAuthSettings({ ...full, AUTH_CLIENT_SECRET: "" })).toThrow(/half configured/);
  });
  it("refuses a short secret and a bad URL", () => {
    expect(() => readAuthSettings({ ...full, BETTER_AUTH_SECRET: "short" })).toThrow(/32 characters/);
    expect(() => readAuthSettings({ ...full, AUTH_ISSUER_URL: "nope" })).toThrow(/not a valid URL/);
  });
});

describe("schema", () => {
  it("migration 2 has everything the library needs (no table or column left to create)", async () => {
    const { toBeCreated, toBeAdded } = await getMigrations(authOptions(db, {
      baseUrl: BASE, issuerUrl: idp.issuer, clientId: "a", clientSecret: "b", secret: randomBytes(32).toString("hex"),
    }) as never);
    expect(toBeCreated).toEqual([]);
    expect(toBeAdded).toEqual([]);
  });
});

describe("OIDC sign-in against a fake provider", () => {
  it("starts with PKCE S256, the scopes and a nonce, and the callback path we registered", async () => {
    idp.authorizeRequests.length = 0;
    await signIn();
    const q = idp.authorizeRequests[0];
    expect(q.get("code_challenge_method")).toBe("S256");
    expect(q.get("scope")).toBe("openid email profile");
    expect(q.get("nonce")).toBeTruthy();
    expect(q.get("redirect_uri")).toBe(`${BASE}/api/auth/callback/authentik`);
    expect(q.get("client_id")).toBe(idp.clientId);
  });

  it("creates the user, stores the hashed sub as the account id and issues a session", async () => {
    const callback = await signIn("/surah/2");
    expect(callback.status).toBe(302);
    expect(callback.headers.get("location")).toBe("/surah/2");
    const cookie = callback.headers.getSetCookie().map((c) => c.split(";")[0]).join("; ");
    expect(callback.headers.getSetCookie().join("\n")).toMatch(/HttpOnly/i);

    const account = db.prepare('SELECT "accountId", "providerId", "accessToken", "idToken" FROM account').get() as Record<string, string | null>;
    expect(account.accountId).toBe(idp.user.sub);
    expect(account.accountId).toMatch(/^[0-9a-f]{64}$/);
    expect(account.accountId).not.toContain("@");
    expect(account.providerId).toBe("authentik");

    const session = await call("/api/auth/get-session", { headers: { cookie } });
    const body = (await session.json()) as { user: { email: string; name: string } };
    expect(body.user.email).toBe("reader@example.test");
    expect(body.user.name).toBe("Test Reader");
    expect((db.prepare('SELECT "lastSeenAt" AS t FROM "user"').get() as { t: number }).t).toBeGreaterThan(0);
  });

  it("does not store the IP address or the browser with the session", async () => {
    await browserSignIn(call, BASE, "/", { "x-forwarded-for": "203.0.113.9", "user-agent": "TestBrowser/1.0" });
    const rows = db.prepare('SELECT "ipAddress" AS ip, "userAgent" AS ua FROM session').all() as { ip: string | null; ua: string | null }[];
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((r) => r.ip === null && r.ua === null)).toBe(true);
  });

  it("is the same account on the next sign-in (the sub is stable)", async () => {
    await signIn();
    await signIn();
    expect(db.prepare("SELECT COUNT(*) AS n FROM \"user\"").get()).toEqual({ n: 1 });
    expect(db.prepare("SELECT COUNT(*) AS n FROM account").get()).toEqual({ n: 1 });
  });

  it("keeps a changed email on the same subject as the same account", async () => {
    const before = idp.user;
    idp.user = { ...before, email: "renamed@example.test" };
    const callback = await signIn();
    idp.user = before;
    expect(callback.status).toBe(302);
    expect(db.prepare("SELECT COUNT(*) AS n FROM \"user\"").get()).toEqual({ n: 1 });
  });

  it("does not link a different subject that has the same email", async () => {
    const before = idp.user;
    idp.user = { ...before, sub: hashedSub("someone-else") };
    const callback = await signIn();
    idp.user = before;
    expect(callback.headers.getSetCookie().some((c) => c.startsWith("better-auth.session_token"))).toBe(false);
    expect(callback.headers.get("location") ?? "").toMatch(/error=/);
    expect(db.prepare("SELECT COUNT(*) AS n FROM account").get()).toEqual({ n: 1 });
  });

  it("rejects an ID token that is not for this client", async () => {
    const before = idp.user;
    idp.user = { sub: hashedSub("reader-2"), email: "two@example.test", name: "Two" };
    idp.breakNextToken = true;
    const callback = await signIn();
    idp.user = before;
    expect(callback.headers.getSetCookie().some((c) => c.startsWith("better-auth.session_token"))).toBe(false);
    expect(db.prepare('SELECT COUNT(*) AS n FROM "user" WHERE email = ?').get("two@example.test")).toEqual({ n: 0 });
  });

  it("does not give a session to a disabled account", async () => {
    db.prepare('UPDATE "user" SET "disabledAt" = ?').run(Date.now());
    const callback = await signIn();
    expect(callback.headers.getSetCookie().some((c) => c.startsWith("better-auth.session_token"))).toBe(false);
    db.prepare('UPDATE "user" SET "disabledAt" = NULL').run();
    const again = await signIn();
    expect(again.headers.getSetCookie().some((c) => c.startsWith("better-auth.session_token"))).toBe(true);
  });

  it("signs out: the session row is deleted and the cookie no longer works", async () => {
    const callback = await signIn();
    const cookie = callback.headers.getSetCookie().map((c) => c.split(";")[0]).join("; ");
    const out = await call("/api/auth/sign-out", { method: "POST", headers: { cookie, origin: BASE, "content-type": "application/json" }, body: "{}" });
    expect(out.status).toBe(200);
    const session = await call("/api/auth/get-session", { headers: { cookie } });
    expect(await session.json()).toBeNull();
  });

  it("signs out at the provider too, and the provider sends the reader back to this site", async () => {
    const callback = await signIn();
    const cookie = callback.headers.getSetCookie().map((c) => c.split(";")[0]).join("; ");
    const { idToken } = db.prepare('SELECT "idToken" FROM account').get() as { idToken: string | null };
    const out = await call("/api/auth/sign-out", { method: "POST", headers: { cookie, origin: BASE, "content-type": "application/json" }, body: "{}" });
    const body = (await out.json()) as { url?: string; redirect?: boolean };
    expect(body.redirect).toBe(true);
    const url = new URL(body.url ?? "");
    expect(`${url.origin}${url.pathname}`).toBe(`${idp.issuer.replace(/\/$/, "")}/end-session/`);
    // authentik only redirects back when the URI is registered and the ID token is sent with it.
    expect(url.searchParams.get("post_logout_redirect_uri")).toBe(`${BASE}/`);
    expect(url.searchParams.get("id_token_hint")).toBe(idToken);
    expect(url.searchParams.get("client_id")).toBe(idp.clientId);
  });

  it("refuses a sign-out sent from another site (CSRF), and the session survives", async () => {
    const callback = await signIn();
    const cookie = callback.headers.getSetCookie().map((c) => c.split(";")[0]).join("; ");
    const res = await call("/api/auth/sign-out", {
      method: "POST",
      headers: { cookie, origin: "https://evil.example.test", "content-type": "application/json" },
      body: "{}",
    });
    expect(res.status).toBe(403);
    const session = await call("/api/auth/get-session", { headers: { cookie } });
    expect(await session.json()).not.toBeNull();
  });

  it("does not accept a bare ID token as a sign-in, not even the one from the sign-out URL", async () => {
    const callback = await signIn();
    const cookie = callback.headers.getSetCookie().map((c) => c.split(";")[0]).join("; ");
    const out = await call("/api/auth/sign-out", { method: "POST", headers: { cookie, origin: BASE, "content-type": "application/json" }, body: "{}" });
    const hint = new URL(((await out.json()) as { url: string }).url).searchParams.get("id_token_hint");
    expect(hint).toBeTruthy();
    const sessionsBefore = db.prepare("SELECT COUNT(*) AS n FROM session").get();

    const variants: Record<string, string>[] = [{ "content-type": "application/json" }, { "content-type": "application/json", origin: BASE }];
    for (const headers of variants) {
      const res = await call("/api/auth/sign-in/social", {
        method: "POST",
        headers,
        body: JSON.stringify({ provider: "authentik", idToken: { token: hint } }),
      });
      expect(res.status).toBe(400);
      expect(res.headers.getSetCookie().some((c) => c.startsWith("better-auth.session_token"))).toBe(false);
    }
    expect(db.prepare("SELECT COUNT(*) AS n FROM session").get()).toEqual(sessionsBefore);
  });

  it("refuses a callback URL on another site (no open redirect after sign-in)", async () => {
    const res = await call("/api/auth/sign-in/social", {
      method: "POST",
      headers: { "content-type": "application/json", origin: BASE },
      body: JSON.stringify({ provider: "authentik", callbackURL: "https://evil.example.test/steal" }),
    });
    expect(res.status).toBe(403);
  });
});
