import { randomBytes } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { openDatabase, type Database } from "../db";
import { createAuth, type Auth } from "./create";
import { startFakeOidc, type FakeOidc } from "./fake-oidc";

const BASE = "http://localhost:3000";
let dir: string;
let db: Database;
let idp: FakeOidc;
let auth: Auth;

beforeAll(async () => {
  dir = mkdtempSync(join(tmpdir(), "qw-rl-"));
  db = openDatabase(join(dir, "rl.db"));
  idp = await startFakeOidc();
  // Rate limiting on, as in production.
  auth = createAuth(db, {
    baseUrl: BASE,
    issuerUrl: idp.issuer,
    clientId: idp.clientId,
    clientSecret: idp.clientSecret,
    secret: randomBytes(32).toString("hex"),
  });
});
afterAll(async () => {
  await idp.close();
  db.close();
  rmSync(dir, { recursive: true, force: true });
});

const start = (ip: string) =>
  auth.handler(
    new Request(`${BASE}/api/auth/sign-in/social`, {
      method: "POST",
      headers: { "content-type": "application/json", origin: BASE, "cf-connecting-ip": ip },
      body: JSON.stringify({ provider: "authentik", callbackURL: "/" }),
    }),
  );

describe("sign-in rate limit", () => {
  it("lets an address start a few sign-ins a minute, then answers 429 with Retry-After", async () => {
    const statuses: number[] = [];
    let last: Response | null = null;
    for (let i = 0; i < 12; i++) {
      last = await start("203.0.113.10");
      statuses.push(last.status);
    }
    expect(statuses.slice(0, 10).every((s) => s === 200)).toBe(true);
    expect(statuses.slice(10)).toEqual([429, 429]);
    expect(Number(last!.headers.get("x-retry-after") ?? last!.headers.get("retry-after"))).toBeGreaterThan(0);
  });

  it("limits each address on its own", async () => {
    expect((await start("203.0.113.11")).status).toBe(200);
  });

  it("does not trust a chain of forwarded addresses as a way to dodge the limit", async () => {
    // With a chain the library finds no trusted address and uses one shared bucket, so rotating the first
    // address does not give a fresh allowance.
    const statuses: number[] = [];
    for (let i = 0; i < 12; i++) {
      const res = await auth.handler(
        new Request(`${BASE}/api/auth/sign-in/social`, {
          method: "POST",
          headers: { "content-type": "application/json", origin: BASE, "x-forwarded-for": `10.0.0.${i}, 198.51.100.9` },
          body: JSON.stringify({ provider: "authentik", callbackURL: "/" }),
        }),
      );
      statuses.push(res.status);
    }
    expect(statuses).toContain(429);
  });
});
