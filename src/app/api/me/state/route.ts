import { getAuth } from "@/lib/auth";
import { readAuthSettings } from "@/lib/auth/config";
import { getDatabase } from "@/lib/db";
import { handleState } from "@/lib/sync/api";

// The reading data of the signed-in reader. 404 when sign-in is not configured.
async function respond(request: Request) {
  const auth = getAuth();
  const settings = readAuthSettings();
  if (!auth || !settings) return new Response(null, { status: 404 });
  return handleState(request, { auth, db: getDatabase(), baseUrl: settings.baseUrl });
}

export const GET = respond;
export const PUT = respond;
