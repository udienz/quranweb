// A small in-memory rate limiter for our own API routes (the sign-in endpoints use the auth library's limiter).
// One server process runs the site, so memory is enough; a restart only resets the counters.

export class RateLimiter {
  private readonly hits = new Map<string, { count: number; resetAt: number }>();

  constructor(
    private readonly max: number,
    private readonly windowMs: number,
  ) {}

  /** Count a request for `key`. Fixed window: `max` requests per `windowMs`. */
  hit(key: string, now = Date.now()): { ok: true } | { ok: false; retryAfter: number } {
    if (this.hits.size > 10_000) this.prune(now);
    const entry = this.hits.get(key);
    if (!entry || now >= entry.resetAt) {
      this.hits.set(key, { count: 1, resetAt: now + this.windowMs });
      return { ok: true };
    }
    if (entry.count >= this.max) return { ok: false, retryAfter: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)) };
    entry.count += 1;
    return { ok: true };
  }

  private prune(now: number): void {
    for (const [key, entry] of this.hits) if (now >= entry.resetAt) this.hits.delete(key);
  }
}

/**
 * The client's IP address as set by our proxy. Behind Cloudflare that is `cf-connecting-ip`; otherwise a
 * `x-forwarded-for` with a single address. A header with a chain of addresses is not trusted (a client can
 * put anything at the front), and then there is no IP and only the per-account limits apply. Must match
 * `advanced.ipAddress.ipAddressHeaders` of the auth library.
 */
export const IP_HEADERS = ["cf-connecting-ip", "x-forwarded-for"] as const;

export function clientIp(request: Request): string | null {
  for (const name of IP_HEADERS) {
    const value = request.headers.get(name)?.trim();
    if (value && !value.includes(",")) return value;
  }
  return null;
}

export const tooMany = (retryAfter: number): Response =>
  new Response(JSON.stringify({ error: "rate-limited" }), {
    status: 429,
    headers: { "content-type": "application/json", "cache-control": "no-store", "retry-after": String(retryAfter) },
  });

// Per minute. A reader syncs a few times a minute at most (a 2 s pause after each change).
const LIMITS = {
  ip: new RateLimiter(240, 60_000),
  state: new RateLimiter(60, 60_000),
  export: new RateLimiter(6, 60_000),
  delete: new RateLimiter(5, 60_000),
  admin: new RateLimiter(60, 60_000),
};

/** Before the session is looked up: stops one address from hammering the API, signed in or not. */
export function guardIp(request: Request, now = Date.now()): Response | null {
  const ip = clientIp(request);
  if (!ip) return null;
  const result = LIMITS.ip.hit(ip, now);
  return result.ok ? null : tooMany(result.retryAfter);
}

/** After the session is known: a limit per account for each kind of request. */
export function guardUser(kind: Exclude<keyof typeof LIMITS, "ip">, userId: string, now = Date.now()): Response | null {
  const result = LIMITS[kind].hit(userId, now);
  return result.ok ? null : tooMany(result.retryAfter);
}
