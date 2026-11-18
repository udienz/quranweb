import { toNextJsHandler } from "better-auth/next-js";
import { getAuth } from "@/lib/auth";

// Every sign-in endpoint (sign-in, callback, session, sign-out) is served by the auth library.
// With sign-in not configured the whole path is a plain 404.
function handler() {
  const auth = getAuth();
  return auth ? toNextJsHandler(auth) : null;
}

export async function GET(request: Request) {
  const h = handler();
  return h ? h.GET(request) : new Response(null, { status: 404 });
}

export async function POST(request: Request) {
  const h = handler();
  return h ? h.POST(request) : new Response(null, { status: 404 });
}
