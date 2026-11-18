import type { Auth } from "../auth/create";
import { sessionUser } from "../auth/session";
import type { Database } from "../db";
import { guardIp, guardUser } from "../ratelimit";
import { isAdminEmail } from "./config";
import { ADMIN_ACTIONS, applyAdminAction, type AdminAction } from "./server";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } });

/** The admin making a request, or the response to send. Anyone else, signed in or not, gets 404 so the page is not advertised. */
export async function requireAdmin(request: Request, auth: Auth, admins?: Set<string>): Promise<{ email: string; id: string } | Response> {
  const user = await sessionUser(request, auth);
  if (user instanceof Response) return user.status === 401 ? json({ error: "not-found" }, 404) : user;
  if (!isAdminEmail(user.email, user.emailVerified, admins)) return json({ error: "not-found" }, 404);
  return { email: user.email, id: user.id };
}

/**
 * POST /api/admin/users/<id> with `{"action":"disable"|"enable"|"delete"}`. Admin only, from this site, JSON.
 * An admin cannot act on their own account (no lock-out by mistake).
 */
export async function handleAdminAction(
  request: Request,
  targetUserId: string,
  deps: { auth: Auth; db: Database; baseUrl: string; admins?: Set<string> },
): Promise<Response> {
  const blockedIp = guardIp(request);
  if (blockedIp) return blockedIp;
  const admin = await requireAdmin(request, deps.auth, deps.admins);
  if (admin instanceof Response) return admin;
  const blocked = guardUser("admin", admin.id);
  if (blocked) return blocked;
  if (request.method !== "POST") return json({ error: "method" }, 405);
  if (request.headers.get("origin") !== new URL(deps.baseUrl).origin) return json({ error: "origin" }, 403);
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) return json({ error: "content-type" }, 415);

  let action: unknown;
  try {
    action = ((await request.json()) as { action?: unknown }).action;
  } catch {
    return json({ error: "invalid" }, 400);
  }
  if (typeof action !== "string" || !ADMIN_ACTIONS.includes(action as AdminAction)) return json({ error: "invalid" }, 400);
  if (targetUserId === admin.id) return json({ error: "self" }, 409);
  if (!applyAdminAction(deps.db, admin.email, action as AdminAction, targetUserId)) return json({ error: "not-found" }, 404);
  return json({ ok: true });
}
