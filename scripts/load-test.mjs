// Load check for the account features: many readers sign in and sync at the same time.
//   BASE=http://localhost:3920 IDP=http://127.0.0.1:PORT USERS=100 ROUNDS=30 node scripts/load-test.mjs
// It needs a running app with sign-in configured against the fake OIDC provider of the tests
// (src/lib/auth/fake-oidc.ts, whose /__user?seed= endpoint picks the next reader). Never run it against a real
// provider or against production: it creates accounts. Each reader gets its own fake client address (the
// cf-connecting-ip header) so the per-address limits do not stop the test, as they would not stop 100 real readers.
// It prints latency percentiles and errors and exits 1 on any error or if the 95th percentile of a sync is over 1 s.

const BASE = process.env.BASE ?? "http://localhost:3920";
const IDP = process.env.IDP;
const USERS = Number(process.env.USERS ?? 100);
const ROUNDS = Number(process.env.ROUNDS ?? 30);
const BOOKMARKS = Number(process.env.BOOKMARKS ?? 200);
const PAUSE_MS = Number(process.env.PAUSE_MS ?? 500);
if (!IDP) throw new Error("set IDP to the origin of the fake provider");

const origin = new URL(BASE).origin;
const ip = (n) => `10.${(n >> 8) & 255}.${n & 255}.1`;

async function signIn(n) {
  await fetch(`${IDP}/__user?seed=load-${n}`);
  const headers = { "content-type": "application/json", origin, "cf-connecting-ip": ip(n) };
  const start = await fetch(`${BASE}/api/auth/sign-in/social`, {
    method: "POST",
    headers,
    body: JSON.stringify({ provider: "authentik", callbackURL: "/" }),
  });
  if (start.status !== 200) throw new Error(`sign-in start ${start.status}`);
  const cookies = start.headers.getSetCookie().map((c) => c.split(";")[0]).join("; ");
  const { url } = await start.json();
  const authorize = await fetch(url, { redirect: "manual" });
  const back = new URL(authorize.headers.get("location"));
  const callback = await fetch(`${BASE}${back.pathname}${back.search}`, {
    redirect: "manual",
    headers: { cookie: cookies, "cf-connecting-ip": ip(n) },
  });
  const session = callback.headers.getSetCookie().map((c) => c.split(";")[0]).join("; ");
  if (!session.includes("session_token")) throw new Error(`sign-in callback gave no session (${callback.status})`);
  return session;
}

const state = (round) => {
  const at = (i) => new Date(Date.UTC(2026, 10, 18, 0, 0, 0) + (round * 1000) + i).toISOString();
  const bookmarks = [];
  for (let i = 0; i < BOOKMARKS; i++) {
    bookmarks.push({ surah: 2, verse: i + 1, note: `note ${round}-${i}`.padEnd(120, "x"), createdAt: at(0), updatedAt: at(i % 7 === 0 ? round : 0) });
  }
  return { version: 2, lastRead: { surah: 2, verse: (round % 286) + 1, at: at(round) }, progress: { 2: { readUpTo: round + 1, at: at(round) } }, bookmarks };
};

const percentile = (sorted, p) => sorted[Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length))];

console.log(`signing in ${USERS} readers...`);
const t0 = Date.now();
const sessions = [];
for (let n = 0; n < USERS; n++) sessions.push(await signIn(n)); // the fake provider picks the reader globally, so one at a time
console.log(`signed in in ${((Date.now() - t0) / 1000).toFixed(1)} s`);

const latencies = [];
const errors = new Map();
const fail = (what) => errors.set(what, (errors.get(what) ?? 0) + 1);

async function reader(n) {
  // Real readers do not all start in the same second; without this the first round is a stampede of USERS requests.
  await new Promise((r) => setTimeout(r, Math.random() * PAUSE_MS * 2));
  const headers = { cookie: sessions[n], origin, "content-type": "application/json", "cf-connecting-ip": ip(n) };
  for (let round = 1; round <= ROUNDS; round++) {
    const started = performance.now();
    try {
      const res = await fetch(`${BASE}/api/me/state`, { method: "PUT", headers, body: JSON.stringify({ data: state(round) }) });
      const body = await res.json();
      latencies.push(performance.now() - started);
      if (res.status !== 200) fail(`PUT ${res.status} ${body.error ?? ""}`);
      else if (body.data.bookmarks.length !== BOOKMARKS) fail("wrong bookmark count in the answer");
    } catch (error) {
      fail(String(error));
    }
    await new Promise((r) => setTimeout(r, PAUSE_MS + Math.random() * PAUSE_MS));
  }
  const final = await (await fetch(`${BASE}/api/me/state`, { headers })).json();
  if (final.data.bookmarks.length !== BOOKMARKS) fail("final state lost bookmarks");
}

console.log(`syncing: ${USERS} readers x ${ROUNDS} rounds, ${BOOKMARKS} bookmarks each...`);
const t1 = Date.now();
await Promise.all(Array.from({ length: USERS }, (_, n) => reader(n)));
const seconds = (Date.now() - t1) / 1000;

latencies.sort((a, b) => a - b);
const p = (x) => percentile(latencies, x).toFixed(0);
console.log(`${latencies.length} syncs in ${seconds.toFixed(1)} s (${(latencies.length / seconds).toFixed(1)}/s)`);
console.log(`latency ms: p50 ${p(50)}, p95 ${p(95)}, p99 ${p(99)}, max ${latencies[latencies.length - 1].toFixed(0)}`);
console.log(errors.size ? `errors: ${JSON.stringify([...errors])}` : "errors: none");
process.exit(errors.size === 0 && percentile(latencies, 95) < 1000 ? 0 : 1);
