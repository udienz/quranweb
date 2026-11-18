import { describe, expect, it } from "vitest";
import { clientIp, guardIp, guardUser, RateLimiter } from "./ratelimit";

const req = (headers: Record<string, string>) => new Request("http://localhost/x", { headers });

describe("RateLimiter", () => {
  it("allows max requests per window and says when to retry", () => {
    const limiter = new RateLimiter(3, 60_000);
    expect([1, 2, 3].map(() => limiter.hit("a", 1000).ok)).toEqual([true, true, true]);
    const fourth = limiter.hit("a", 1000);
    expect(fourth.ok).toBe(false);
    expect(fourth.ok === false && fourth.retryAfter).toBe(60);
    expect(limiter.hit("a", 30_000)).toMatchObject({ ok: false, retryAfter: 31 });
  });

  it("starts a new window and keeps keys apart", () => {
    const limiter = new RateLimiter(1, 1000);
    expect(limiter.hit("a", 0).ok).toBe(true);
    expect(limiter.hit("a", 500).ok).toBe(false);
    expect(limiter.hit("b", 500).ok).toBe(true);
    expect(limiter.hit("a", 1000).ok).toBe(true);
  });

  it("forgets expired keys instead of growing for ever", () => {
    const limiter = new RateLimiter(1, 1000);
    for (let i = 0; i < 10_001; i++) limiter.hit(`k${i}`, 0);
    limiter.hit("late", 5000); // pruning runs when the table is large
    expect((limiter as unknown as { hits: Map<string, unknown> }).hits.size).toBeLessThan(10);
  });
});

describe("clientIp", () => {
  it("prefers Cloudflare's header", () => {
    expect(clientIp(req({ "cf-connecting-ip": "203.0.113.1", "x-forwarded-for": "198.51.100.2" }))).toBe("203.0.113.1");
  });
  it("accepts a single forwarded address", () => {
    expect(clientIp(req({ "x-forwarded-for": "198.51.100.2" }))).toBe("198.51.100.2");
  });
  it("does not trust a chain of addresses (a client can write the first one)", () => {
    expect(clientIp(req({ "x-forwarded-for": "1.2.3.4, 198.51.100.2" }))).toBeNull();
  });
  it("is null without a header", () => {
    expect(clientIp(req({}))).toBeNull();
  });
});

describe("guards", () => {
  it("limit one address across requests, with 429 and Retry-After", () => {
    const request = req({ "cf-connecting-ip": "203.0.113.77" });
    let blocked: Response | null = null;
    for (let i = 0; i < 241 && !blocked; i++) blocked = guardIp(request, 1_000_000);
    expect(blocked?.status).toBe(429);
    expect(Number(blocked?.headers.get("retry-after"))).toBeGreaterThan(0);
    expect(guardIp(req({}), 1_000_000)).toBeNull(); // no IP, no IP limit
  });

  it("limit one account per kind of request", () => {
    let blocked: Response | null = null;
    for (let i = 0; i < 7 && !blocked; i++) blocked = guardUser("export", "user-a", 2_000_000);
    expect(blocked?.status).toBe(429);
    expect(guardUser("export", "user-b", 2_000_000)).toBeNull();
    expect(guardUser("state", "user-a", 2_000_000)).toBeNull();
  });
});
