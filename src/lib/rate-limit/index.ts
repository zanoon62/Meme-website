/**
 * In-memory token-bucket rate limiter for API routes.
 *
 * Not distributed (won't share state across Vercel instances) — for true
 * distributed rate limiting use Upstash Redis. But for typical admin APIs
 * this is enough: each Vercel function instance enforces its own limit,
 * which roughly multiplies capacity by the number of warm instances.
 *
 * Usage:
 *   import { rateLimit } from "@/lib/rate-limit";
 *   const rl = rateLimit({ limit: 20, windowMs: 60_000 });
 *   const { success, remaining } = rl(req, "ip");
 *   if (!success) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
 */

import type { NextRequest } from "next/server";

type Bucket = { tokens: number; lastRefill: number };

type Options = {
  /** Max tokens in the bucket. */
  limit: number;
  /** Window length in milliseconds. */
  windowMs: number;
};

export function rateLimit({ limit, windowMs }: Options) {
  const buckets = new Map<string, Bucket>();

  // Periodic cleanup of stale buckets (every 5 minutes)
  const CLEANUP_INTERVAL = 5 * 60 * 1000;
  let lastCleanup = Date.now();
  function cleanup(now: number) {
    if (now - lastCleanup < CLEANUP_INTERVAL) return;
    lastCleanup = now;
    const staleCutoff = now - windowMs * 2;
    for (const [key, bucket] of buckets) {
      if (bucket.lastRefill < staleCutoff) buckets.delete(key);
    }
  }

  return function check(
    req: NextRequest,
    namespace: string = "ip",
  ): { success: boolean; remaining: number; resetAt: number } {
    const now = Date.now();
    cleanup(now);

    const key = namespace === "ip" ? getClientIp(req) : namespace;
    const bucket = buckets.get(key) ?? { tokens: limit, lastRefill: now };

    // Refill proportional to elapsed time
    const elapsed = now - bucket.lastRefill;
    const refill = (elapsed / windowMs) * limit;
    bucket.tokens = Math.min(limit, bucket.tokens + refill);
    bucket.lastRefill = now;

    if (bucket.tokens < 1) {
      buckets.set(key, bucket);
      return {
        success: false,
        remaining: 0,
        resetAt: now + Math.ceil((1 - bucket.tokens) * (windowMs / limit)),
      };
    }

    bucket.tokens -= 1;
    buckets.set(key, bucket);
    return {
      success: true,
      remaining: Math.floor(bucket.tokens),
      resetAt: now + windowMs,
    };
  };
}

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return req.headers.get("x-real-ip") ?? "anonymous";
}

/** Pre-configured limiters for common routes. */
export const limiters = {
  // Auth endpoints — protect against brute force
  auth: rateLimit({ limit: 10, windowMs: 60_000 }),
  // Admin APIs — generous but bounded
  admin: rateLimit({ limit: 120, windowMs: 60_000 }),
  // Public checkout — protect against abuse
  checkout: rateLimit({ limit: 8, windowMs: 60_000 }),
  // Default public APIs
  public: rateLimit({ limit: 60, windowMs: 60_000 }),
};
