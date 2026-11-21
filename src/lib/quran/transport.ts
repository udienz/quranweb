// Where JSON comes from: an HTTP(S) URL or a file on disk. A provider's base URL can be
// either, so the app can run from a local copy of the data (for example the private
// data repository mounted into the container) without any HTTP request or web server.

import { readFile } from "node:fs/promises";

export const isRemote = (location: string): boolean => /^https?:\/\//i.test(location);

/** `file:///data/x` and `/data/x` both mean the file `/data/x`. */
export const toFilePath = (location: string): string => location.replace(/^file:\/\//i, "");

// Editions read straight from their source (not mirrored, the owner's choice of 2026-11-21) would otherwise cost one request
// to that source per page view. A successful answer is kept in memory for a day, at most REMOTE_CACHE_SIZE of them (the
// oldest goes first); a failure is not kept, so the next page view tries again. A request that hangs is given up after
// REMOTE_TIMEOUT_MS, so a slow source cannot hold a page.
const REMOTE_TTL_MS = 24 * 60 * 60 * 1000;
const REMOTE_CACHE_SIZE = 400;
const REMOTE_TIMEOUT_MS = 8000;
const remoteCache = new Map<string, { expires: number; value: unknown }>();

/** Empty the cache of remote answers (for tests). */
export const clearRemoteCache = (): void => remoteCache.clear();

async function loadRemote(location: string): Promise<unknown> {
  const hit = remoteCache.get(location);
  if (hit && hit.expires > Date.now()) return hit.value;
  const res = await fetch(location, { signal: AbortSignal.timeout(REMOTE_TIMEOUT_MS) });
  if (!res.ok) throw new Error(`Failed to load ${location} (status ${res.status})`);
  const value: unknown = await res.json();
  remoteCache.delete(location);
  remoteCache.set(location, { expires: Date.now() + REMOTE_TTL_MS, value });
  if (remoteCache.size > REMOTE_CACHE_SIZE) remoteCache.delete(remoteCache.keys().next().value!);
  return value;
}

/** Read and parse JSON from a URL or a file path. Errors name the location. */
export async function loadJson(location: string): Promise<unknown> {
  if (isRemote(location)) return loadRemote(location);

  const path = toFilePath(location);
  let text: string;
  try {
    text = await readFile(path, "utf8");
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code ?? (err instanceof Error ? err.message : String(err));
    throw new Error(`Failed to read ${path} (${code})`);
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Invalid JSON in ${path}`);
  }
}
