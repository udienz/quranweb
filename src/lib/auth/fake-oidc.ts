// A small OIDC provider for tests (nothing here is a real credential). It signs ID tokens with
// RS256 like authentik, checks PKCE S256 and the client secret, and records what it saw.
import { createHash, randomBytes } from "node:crypto";
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { exportJWK, generateKeyPair, SignJWT } from "jose";

export interface FakeUser {
  /** The `sub` claim: in authentik with "hashed user ID" this is a hex digest, never an email. */
  sub: string;
  email: string;
  name: string;
}

export interface FakeOidc {
  issuer: string;
  clientId: string;
  clientSecret: string;
  /** The user the next login signs in as. */
  user: FakeUser;
  /** Authorization requests seen (query parameters). */
  authorizeRequests: URLSearchParams[];
  /** Sends the next ID token with a wrong audience, to test verification. */
  breakNextToken: boolean;
  close(): Promise<void>;
}

export const hashedSub = (seed: string) => createHash("sha256").update(seed).digest("hex");

export async function startFakeOidc(): Promise<FakeOidc> {
  const { publicKey, privateKey } = await generateKeyPair("RS256");
  const jwk = { ...(await exportJWK(publicKey)), kid: "k1", use: "sig", alg: "RS256" };
  const codes = new Map<string, { challenge: string; nonce: string; redirect: string }>();
  const state: FakeOidc = {
    issuer: "",
    clientId: "test-client",
    clientSecret: randomBytes(16).toString("hex"),
    user: { sub: hashedSub("reader-1"), email: "reader@example.test", name: "Test Reader" },
    authorizeRequests: [],
    breakNextToken: false,
    close: () => new Promise<void>((resolve) => server.close(() => resolve())),
  };

  const server: Server = createServer(async (req, res) => {
    const url = new URL(req.url ?? "/", state.issuer);
    const json = (body: unknown, status = 200) => {
      res.writeHead(status, { "content-type": "application/json" });
      res.end(JSON.stringify(body));
    };
    const base = state.issuer.replace(/\/$/, "");
    if (url.pathname.endsWith("/.well-known/openid-configuration")) {
      return json({
        issuer: state.issuer,
        authorization_endpoint: `${base}/authorize/`,
        token_endpoint: `${base}/token/`,
        userinfo_endpoint: `${base}/userinfo/`,
        jwks_uri: `${base}/jwks/`,
        response_types_supported: ["code"],
        subject_types_supported: ["public"],
        id_token_signing_alg_values_supported: ["RS256"],
        code_challenge_methods_supported: ["S256"],
      });
    }
    if (url.pathname.endsWith("/jwks/")) return json({ keys: [jwk] });
    if (url.pathname.endsWith("/authorize/")) {
      state.authorizeRequests.push(url.searchParams);
      const code = randomBytes(8).toString("hex");
      codes.set(code, {
        challenge: url.searchParams.get("code_challenge") ?? "",
        nonce: url.searchParams.get("nonce") ?? "",
        redirect: url.searchParams.get("redirect_uri") ?? "",
      });
      const back = new URL(url.searchParams.get("redirect_uri") ?? "");
      back.searchParams.set("code", code);
      back.searchParams.set("state", url.searchParams.get("state") ?? "");
      res.writeHead(302, { location: back.toString() });
      return res.end();
    }
    if (url.pathname.endsWith("/token/") && req.method === "POST") {
      const chunks: Buffer[] = [];
      for await (const chunk of req) chunks.push(chunk as Buffer);
      const form = new URLSearchParams(Buffer.concat(chunks).toString());
      const basic = req.headers.authorization?.startsWith("Basic ")
        ? Buffer.from(req.headers.authorization.slice(6), "base64").toString().split(":")
        : [form.get("client_id"), form.get("client_secret")];
      const entry = codes.get(form.get("code") ?? "");
      if (basic[0] !== state.clientId || basic[1] !== state.clientSecret || !entry) return json({ error: "invalid_client" }, 401);
      const challenge = createHash("sha256").update(form.get("code_verifier") ?? "").digest("base64url");
      if (challenge !== entry.challenge || form.get("redirect_uri") !== entry.redirect) return json({ error: "invalid_grant" }, 400);
      codes.delete(form.get("code")!);
      const idToken = await new SignJWT({ email: state.user.email, email_verified: true, name: state.user.name, nonce: entry.nonce })
        .setProtectedHeader({ alg: "RS256", kid: "k1" })
        .setIssuer(state.issuer)
        .setAudience(state.breakNextToken ? "someone-else" : state.clientId)
        .setSubject(state.user.sub)
        .setIssuedAt()
        .setExpirationTime("10m")
        .sign(privateKey);
      state.breakNextToken = false;
      return json({ access_token: randomBytes(8).toString("hex"), token_type: "Bearer", expires_in: 600, id_token: idToken, scope: "openid email profile" });
    }
    if (url.pathname.endsWith("/userinfo/")) {
      return json({ sub: state.user.sub, email: state.user.email, email_verified: true, name: state.user.name });
    }
    json({ error: "not_found" }, 404);
  });

  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  state.issuer = `http://127.0.0.1:${(server.address() as AddressInfo).port}/application/o/quranweb/`;
  return state;
}
