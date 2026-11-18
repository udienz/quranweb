// Sign-in settings from the environment. Everything is optional: with any of the four values
// missing, sign-in is simply off and the site works as before (reading never needs an account).

export const PROVIDER_ID = "authentik";

export interface AuthSettings {
  /** Public origin of this site, for example https://quranweb.udienz.web.id */
  baseUrl: string;
  /** OIDC issuer, for example https://auth.example.test/application/o/quranweb/ */
  issuerUrl: string;
  clientId: string;
  clientSecret: string;
  /** Signs and encrypts the library's cookies and tokens; at least 32 characters. */
  secret: string;
}

export function readAuthSettings(env: Record<string, string | undefined> = process.env): AuthSettings | null {
  const baseUrl = env.BETTER_AUTH_URL?.trim();
  const issuerUrl = env.AUTH_ISSUER_URL?.trim();
  const clientId = env.AUTH_CLIENT_ID?.trim();
  const clientSecret = env.AUTH_CLIENT_SECRET?.trim();
  const secret = env.BETTER_AUTH_SECRET?.trim();
  const given = [baseUrl, issuerUrl, clientId, clientSecret, secret].filter(Boolean).length;
  if (given === 0) return null;
  if (given < 5) {
    throw new Error(
      "Sign-in is half configured: set all of BETTER_AUTH_URL, AUTH_ISSUER_URL, AUTH_CLIENT_ID, AUTH_CLIENT_SECRET and BETTER_AUTH_SECRET, or none",
    );
  }
  if (secret!.length < 32) throw new Error("BETTER_AUTH_SECRET must be at least 32 characters");
  for (const [name, value] of [["BETTER_AUTH_URL", baseUrl], ["AUTH_ISSUER_URL", issuerUrl]] as const) {
    try {
      new URL(value!);
    } catch {
      throw new Error(`${name} is not a valid URL`);
    }
  }
  return { baseUrl: baseUrl!, issuerUrl: issuerUrl!, clientId: clientId!, clientSecret: clientSecret!, secret: secret! };
}

/** The discovery document of an issuer ends the same way for every OIDC provider. */
export function discoveryUrl(issuerUrl: string): string {
  return `${issuerUrl.replace(/\/+$/, "")}/.well-known/openid-configuration`;
}
