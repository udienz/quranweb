import { betterAuth } from "better-auth";
import { genericOAuth } from "better-auth/plugins";
import type { DatabaseSync } from "node:sqlite";
import { discoveryUrl, PROVIDER_ID, type AuthSettings } from "./config";

/** Options of the auth library, kept apart from `betterAuth()` so a test can read them. */
export function authOptions(db: DatabaseSync, settings: AuthSettings) {
  return {
    appName: "QuranWeb",
    baseURL: settings.baseUrl,
    secret: settings.secret,
    database: db,
    // Only this site may start a sign-in or be a redirect target afterwards.
    trustedOrigins: [settings.baseUrl],
    // Stated explicitly: the library switches these checks off by default when NODE_ENV is "test",
    // and the tests must see the behaviour of production.
    advanced: { disableOriginCheck: false, disableCSRFCheck: false },
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
          },
        ],
      }),
    ],
  };
}

export function createAuth(db: DatabaseSync, settings: AuthSettings) {
  return betterAuth(authOptions(db, settings));
}

export type Auth = ReturnType<typeof createAuth>;
