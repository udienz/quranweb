import { connection } from "next/server";
import { getAuth } from "@/lib/auth";
import { readAuthSettings } from "@/lib/auth/config";
import { getDatabase } from "@/lib/db";
import { handleExport } from "@/lib/account/api";

// GET /api/me/export downloads the reader's data. 404 when sign-in is not configured.
export async function GET(request: Request) {
  // With Cache Components a GET handler that reads no runtime data is prerendered at build time, which
  // would bake in the 404 of a build without sign-in. This one must always run per request.
  await connection();
  const auth = getAuth();
  const settings = readAuthSettings();
  if (!auth || !settings) return new Response(null, { status: 404 });
  return handleExport(request, { auth, db: getDatabase(), baseUrl: settings.baseUrl });
}
