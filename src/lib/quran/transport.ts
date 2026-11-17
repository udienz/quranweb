// Where JSON comes from: an HTTP(S) URL or a file on disk. A provider's base URL can be
// either, so the app can run from a local copy of the data (for example the private
// data repository mounted into the container) without any HTTP request or web server.

import { readFile } from "node:fs/promises";

export const isRemote = (location: string): boolean => /^https?:\/\//i.test(location);

/** `file:///data/x` and `/data/x` both mean the file `/data/x`. */
export const toFilePath = (location: string): string => location.replace(/^file:\/\//i, "");

/** Read and parse JSON from a URL or a file path. Errors name the location. */
export async function loadJson(location: string): Promise<unknown> {
  if (isRemote(location)) {
    const res = await fetch(location);
    if (!res.ok) throw new Error(`Failed to load ${location} (status ${res.status})`);
    return res.json();
  }

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
