import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { isRemote, loadJson, toFilePath } from "./transport";

let dir: string;
beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), "quranweb-transport-"));
});
afterEach(async () => {
  vi.unstubAllGlobals();
  await rm(dir, { recursive: true, force: true });
});

describe("locations", () => {
  it("tells URLs from paths and strips file://", () => {
    expect(isRemote("https://example.test/a")).toBe(true);
    expect(isRemote("HTTP://example.test/a")).toBe(true);
    expect(isRemote("/data/api/v2")).toBe(false);
    expect(isRemote("file:///data/api/v2")).toBe(false);
    expect(toFilePath("file:///data/x")).toBe("/data/x");
    expect(toFilePath("/data/x")).toBe("/data/x");
  });
});

describe("loadJson", () => {
  it("reads a local file, also through file://", async () => {
    await writeFile(join(dir, "a.json"), JSON.stringify({ ok: 1 }));
    expect(await loadJson(join(dir, "a.json"))).toEqual({ ok: 1 });
    expect(await loadJson(`file://${join(dir, "a.json")}`)).toEqual({ ok: 1 });
  });

  it("names the file when it is missing or is not JSON", async () => {
    await expect(loadJson(join(dir, "missing.json"))).rejects.toThrow(/Failed to read .*missing\.json \(ENOENT\)/);
    await writeFile(join(dir, "bad.json"), "{broken");
    await expect(loadJson(join(dir, "bad.json"))).rejects.toThrow(/Invalid JSON in .*bad\.json/);
  });

  it("fetches a remote URL and reports the status of a failure", async () => {
    const fetchMock = vi.fn(async (url: string | URL | Request) =>
      String(url).endsWith("/ok") ? new Response(JSON.stringify({ remote: true })) : new Response("no", { status: 503 }),
    );
    vi.stubGlobal("fetch", fetchMock);
    expect(await loadJson("https://example.test/ok")).toEqual({ remote: true });
    await expect(loadJson("https://example.test/down")).rejects.toThrow(/Failed to load https:\/\/example\.test\/down \(status 503\)/);
    expect(fetchMock.mock.calls[0][0]).toBe("https://example.test/ok");
  });

  it("keeps a remote answer in memory, but not a failure", async () => {
    let up = false;
    const fetchMock = vi.fn(async () => (up ? new Response(JSON.stringify({ n: 1 })) : new Response("no", { status: 503 })));
    vi.stubGlobal("fetch", fetchMock);
    await expect(loadJson("https://example.test/a")).rejects.toThrow(/status 503/);
    up = true;
    expect(await loadJson("https://example.test/a")).toEqual({ n: 1 });
    expect(await loadJson("https://example.test/a")).toEqual({ n: 1 });
    expect(fetchMock).toHaveBeenCalledTimes(2); // the failure, then one success; the third read came from memory
  });

  it("never reads a file for a remote location", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("{}")));
    await loadJson("https://example.test/x");
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});

describe("nested directories", () => {
  it("reads files below subdirectories", async () => {
    await mkdir(join(dir, "editions", "x"), { recursive: true });
    await writeFile(join(dir, "editions", "x", "1.min.json"), "[1,2]");
    expect(await loadJson(join(dir, "editions", "x", "1.min.json"))).toEqual([1, 2]);
  });
});
