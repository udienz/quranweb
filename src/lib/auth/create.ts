import { betterAuth } from "better-auth";
import { genericOAuth } from "better-auth/plugins";
import type { DatabaseSync } from "node:sqlite";
import { IP_HEADERS } from "../ratelimit";
import { discoveryUrl, PROVIDER_ID, type AuthSettings } from "./config";

/** Options of the auth library, kept apart from `betterAuth()` so a test can read them. */
export interface AuthExtras {
  /** The library only rate limits in production by default; we switch it on explicitly. Tests that sign in many times turn it off. */
  rateLimit?: boolean;
}

export function authOptions(db: DatabaseSync, settings: AuthSettings, extras: AuthExtras = {}) {
  return {
    appName: "QuranWeb",
    baseURL: settings.baseUrl,
    secret: settings.secret,
    database: db,
    // Only this site may start a sign-in or be a redirect target afterwards.
    trustedOrigins: [settings.baseUrl],
    // Stated explicitly: the library switches these checks off by default when NODE_ENV is "test",
    // and the tests must see the behaviour of production.
    advanced: {
      disableOriginCheck: false,
      disableCSRFCheck: false,
      // The client address as our proxy sets it; a chain of addresses is not trusted (see ratelimit.ts).
      ipAddress: { ipAddressHeaders: [...IP_HEADERS] },
    },
    rateLimit: {
      enabled: extras.rateLimit ?? true,
      window: 60,
      max: 100,
      customRules: {
        // Starting and finishing a sign-in: a reader needs a few a day, a bot needs many.
        "/sign-in/social": { window: 60, max: 10 },
        "/callback/*": { window: 60, max: 20 },
        // Asked on every page load, and a school or office shares one address.
        "/get-session": { window: 60, max: 300 },
      },
    },
    // No passwords, no email sign-in: the identity provider is the only way in.
    emailAndPassword: { enabled: false },
    session: {
      expiresIn: 60 * 60 * 24 * 30,
      updateAge: 60 * 60 * 24,
    },
    account: {
      // Never link accounts by email: a person with the same email but another subject is a
      // different account (and the unique email makes the second one fail instead of merging).
      accountLinking: { enabled: false },
      // We never call the provider on the reader's behalf, so its tokens are not kept.
      storeAccountCookie: false,
    },
    user: {
      additionalFields: {
        disabledAt: { type: "number" as const, required: false, input: false },
        lastSeenAt: { type: "number" as const, required: false, input: false },
      },
    },
    databaseHooks: {
      session: {
        create: {
          // A disabled account (set by the admin, step 7) cannot get a session, so cannot sign in.
          // The IP address and browser of the request are used for rate limiting while it runs but are
          // never stored with the session (the privacy page says so).
          before: async (session: { userId: string }) => {
            const row = db.prepare('SELECT "disabledAt" AS d FROM "user" WHERE id = ?').get(session.userId) as
              | { d: number | null }
              | undefined;
            if (row?.d) return false;
            db.prepare('UPDATE "user" SET "lastSeenAt" = ? WHERE id = ?').run(Date.now(), session.userId);
            return { data: { ...session, ipAddress: null, userAgent: null } };
          },
        },
      },
    },
    plugins: [
      genericOAuth({
        config: [
          {
            providerId: PROVIDER_ID,
            clientId: settings.clientId,
            clientSecret: settings.clientSecret,
            discoveryUrl: discoveryUrl(settings.issuerUrl),
            // The ID token is verified against the issuer's keys; no unverified fallback.
            requireIdTokenVerification: true,
            pkce: true,
            scopes: ["openid", "email", "profile"],
            // Sign-out also ends the authentik session (RP-initiated logout, found through discovery). Without
            // this, authentik ends on its own home page; with it, it sends the reader back to our home page.
            // The URI (BETTER_AUTH_URL with a trailing slash) must be registered in authentik as a logout
            // redirect URI, and authentik needs the ID token with it, which the library keeps in `account`.
            postLogoutRedirectURI: "/",
          },
        ],
      }),
    ],
  };
}

export function createAuth(db: DatabaseSync, settings: AuthSettings, extras: AuthExtras = {}) {
  return betterAuth(authOptions(db, settings, extras));
}

export type Auth = ReturnType<typeof createAuth>;
