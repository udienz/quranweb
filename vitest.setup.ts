// Remote JSON is kept in memory between calls (transport.ts). Tests stub `fetch` with different answers for the same URL,
// so every test starts with an empty cache.
import { afterEach } from "vitest";
import { clearRemoteCache } from "./src/lib/quran/transport";

afterEach(() => clearRemoteCache());
