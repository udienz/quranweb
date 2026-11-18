import type { Auth } from "../auth/create";
import type { Database } from "../db";
import { parseUserData, UserDataError } from "../userdata/schema";
import { exchangeAccountData, MAX_BODY_BYTES, readAccountData } from "./server";

const HEADERS = { "content-type": "application/json", "cache-control": "no-store" };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: HEADERS });

/**
 * GET returns the account's data; PUT merges the data of this device into it and returns the
 * merged result (so one request both pushes and pulls). Needs a session; the body of a PUT must be
 * JSON sent from this site.
 */
export async function handleState(request: Request, deps: { auth: Auth; db: Database; baseUrl: string }): Promise<Response> {
  const session = await deps.auth.api.getSession({ headers: request.headers });
  if (!session) return json({ error: "unauthenticated" }, 401);
  if ((session.user as { disabledAt?: number | null }).disabledAt) return json({ error: "disabled" }, 403);
  const userId = session.user.id;

  if (request.method === "GET") return json({ data: readAccountData(deps.db, userId) });
  if (request.method !== "PUT") return json({ error: "method" }, 405);

  // Cookies are SameSite=Lax, but a PUT must also come from this site's own pages.
  if (request.headers.get("origin") !== new URL(deps.baseUrl).origin) return json({ error: "origin" }, 403);
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) return json({ error: "content-type" }, 415);
  const declared = Number(request.headers.get("content-length") ?? 0);
  if (declared > MAX_BODY_BYTES) return json({ error: "too-large" }, 413);
  const text = await request.text();
  if (Buffer.byteLength(text) > MAX_BODY_BYTES) return json({ error: "too-large" }, 413);

  let incoming;
  try {
    const body = JSON.parse(text) as { data?: unknown };
    incoming = parseUserData(body.data);
  } catch (error) {
    return json({ error: "invalid", code: error instanceof UserDataError ? error.code : "not-json" }, 400);
  }
  return json({ data: exchangeAccountData(deps.db, userId, incoming) });
}
