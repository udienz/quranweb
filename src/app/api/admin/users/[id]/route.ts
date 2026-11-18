import { getAuth } from "@/lib/auth";
import { readAuthSettings } from "@/lib/auth/config";
import { getDatabase } from "@/lib/db";
import { handleAdminAction } from "@/lib/admin/api";

// Admin actions on one account. 404 for everyone else, and when sign-in is not configured.
export async function POST(request: Request, context: RouteContext<"/api/admin/users/[id]">) {
  const auth = getAuth();
  const settings = readAuthSettings();
  if (!auth || !settings) return new Response(null, { status: 404 });
  const { id } = await context.params;
  return handleAdminAction(request, id, { auth, db: getDatabase(), baseUrl: settings.baseUrl });
}
