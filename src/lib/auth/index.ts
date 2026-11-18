import { getDatabase, databaseConfigured } from "@/lib/db";
import { readAuthSettings } from "./config";
import { createAuth, type Auth } from "./create";

let shared: Auth | null | undefined;

/** The auth instance, or null when sign-in is not configured (no database or no provider settings). */
export function getAuth(): Auth | null {
  if (shared !== undefined) return shared;
  const settings = databaseConfigured() ? readAuthSettings() : null;
  shared = settings ? createAuth(getDatabase(), settings) : null;
  return shared;
}

export function signInEnabled(): boolean {
  return getAuth() !== null;
}
