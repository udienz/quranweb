import type { Auth } from "../auth/create";
import { sessionUser } from "../auth/session";
import type { Database } from "../db";
import { guardIp, guardUser } from "../ratelimit";
import { deleteAccount, exportAccount } from "./server";

interface Deps {
  auth: Auth;
  db: Database;
  baseUrl: string;
}

const json = (body: unknown, status = 200, extra?: Headers) => {
  const headers = new Headers(extra);
  headers.set("content-type", "application/json");
  headers.set("cache-control", "no-store");
  return new Response(JSON.stringify(body), { status, headers });
};

/** GET /api/me/export: the reader's data as a file download. */
export async function handleExport(request: Request, deps: Deps): Promise<Response> {
  const blockedIp = guardIp(request);
  if (blockedIp) return blockedIp;
  const user = await sessionUser(request, deps.auth);
  if (user instanceof Response) return user;
  const blocked = guardUser("export", user.id);
  if (blocked) return blocked;
  const body = JSON.stringify(exportAccount(deps.db, user), null, 2);
  const day = new Date().toISOString().slice(0, 10);
  return new Response(body, {
    headers: {
      "content-type": "application/json",
      "content-disposition": `attachment; filename="quranweb-account-${day}.json"`,
      "cache-control": "no-store",
    },
  });
}

/**
 * DELETE /api/me: delete the signed-in reader's account immediately and permanently. The body must be
 * `{"confirm":"delete"}` and the request must come from this site. The session cookie is cleared in the response.
 */
export async function handleDelete(request: Request, deps: Deps): Promise<Response> {
  const blockedIp = guardIp(request);
  if (blockedIp) return blockedIp;
  const user = await sessionUser(request, deps.auth);
  if (user instanceof Response) return user;
  const blocked = guardUser("delete", user.id);
  if (blocked) return blocked;
  if (request.headers.get("origin") !== new URL(deps.baseUrl).origin) return json({ error: "origin" }, 403);
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) return json({ error: "content-type" }, 415);
  let confirmed = false;
  try {
    confirmed = ((await request.json()) as { confirm?: unknown }).confirm === "delete";
  } catch {
    /* not JSON: not confirmed */
  }
  if (!confirmed) return json({ error: "not-confirmed" }, 400);

  // Sign out first so the cookies are cleared in this response, then delete the account.
  const out = await deps.auth.api.signOut({ headers: request.headers, returnHeaders: true });
  deleteAccount(deps.db, user.id);
  return json({ deleted: true }, 200, out.headers);
}
