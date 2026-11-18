import { getAuth } from "@/lib/auth";
import { readAuthSettings } from "@/lib/auth/config";
import { getDatabase } from "@/lib/db";
import { handleDelete } from "@/lib/account/api";

// DELETE /api/me deletes the signed-in reader's account. 404 when sign-in is not configured.
export async function DELETE(request: Request) {
  const auth = getAuth();
  const settings = readAuthSettings();
  if (!auth || !settings) return new Response(null, { status: 404 });
  return handleDelete(request, { auth, db: getDatabase(), baseUrl: settings.baseUrl });
}
