import type { Auth } from "./create";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
  emailVerified: boolean;
}

const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } });

/** The signed-in reader of a request, or the error response to send (401 no session, 403 disabled account). */
export async function sessionUser(request: Request, auth: Auth): Promise<SessionUser | Response> {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return json({ error: "unauthenticated" }, 401);
  const user = session.user as SessionUser & { disabledAt?: number | null };
  if (user.disabledAt) return json({ error: "disabled" }, 403);
  return user;
}
