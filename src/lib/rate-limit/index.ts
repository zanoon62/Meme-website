/**
 * Redis-backed rate limiter for API routes — replaces the old in-memory
 * token bucket, which was explicitly non-distributed (reset on every
 * restart, didn't share state across instances). Self-hosted Docker
 * Compose can run more than one app replica, and restarts shouldn't let
 * an attacker reset their own counter, so this needed a real shared store.
 *
 * Uses `rate-limiter-flexible`'s Redis backend (a maintained token-bucket
 * implementation) rather than hand-rolled Lua, keeping the same
 * refill-proportional-to-elapsed-time semantics as before.
 *
 * Usage (call sites now need `await`, since a Redis round-trip is
 * inherently async):
 *   import { limiters } from "@/lib/rate-limit";
 *   const rl = await limiters.checkout(req);
 *   if (!rl.success) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
 */

import type { NextRequest } from "next/server";
import Redis from "ioredis";
import { RateLimiterRedis, RateLimiterMemory, type IRateLimiterOptions } from "rate-limiter-flexible";

declare global {
  var __memeRedisClient: Redis | undefined;
}

function getRedisClient(): Redis | null {
  const url = process.env.REDIS_URL;
  if (!url) return null;
  if (!globalThis.__memeRedisClient) {
    globalThis.__memeRedisClient = new Redis(url, { maxRetriesPerRequest: 1, lazyConnect: false });
    globalThis.__memeRedisClient.on("error", (err) => {
      console.error("Redis connection error (rate-limit):", err.message);
    });
  }
  return globalThis.__memeRedisClient;
}

type Options = {
  /** Max requests in the window. */
  limit: number;
  /** Window length in milliseconds. */
  windowMs: number;
  /** Namespaces the Redis keys so different limiters don't collide. */
  keyPrefix: string;
};

function makeLimiter({ limit, windowMs, keyPrefix }: Options) {
  const redis = getRedisClient();
  const opts: IRateLimiterOptions = {
    points: limit,
    duration: Math.ceil(windowMs / 1000),
    keyPrefix,
  };

  // Falls back to a per-process in-memory limiter if Redis isn't configured
  // (e.g. local dev without docker-compose.dev.yml running) — same
  // "works standalone, degrades gracefully" spirit as the DB/storage
  // isConfigured() fallbacks elsewhere in the app.
  const limiter = redis ? new RateLimiterRedis({ storeClient: redis, ...opts }) : new RateLimiterMemory(opts);

  return async function check(
    req: NextRequest,
    namespace: string = "ip",
  ): Promise<{ success: boolean; remaining: number; resetAt: number }> {
    const key = namespace === "ip" ? getClientIp(req) : namespace;
    try {
      const result = await limiter.consume(key, 1);
      return {
        success: true,
        remaining: result.remainingPoints,
        resetAt: Date.now() + result.msBeforeNext,
      };
    } catch (rejection) {
      // rate-limiter-flexible throws (not returns) a RateLimiterRes on rejection
      const msBeforeNext =
        rejection && typeof rejection === "object" && "msBeforeNext" in rejection
          ? (rejection as { msBeforeNext: number }).msBeforeNext
          : windowMs;
      return { success: false, remaining: 0, resetAt: Date.now() + msBeforeNext };
    }
  };
}

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return req.headers.get("x-real-ip") ?? "anonymous";
}

/** Pre-configured limiters for common routes. */
export const limiters = {
  auth: makeLimiter({ limit: 10, windowMs: 60_000, keyPrefix: "rl:auth" }),
  admin: makeLimiter({ limit: 120, windowMs: 60_000, keyPrefix: "rl:admin" }),
  checkout: makeLimiter({ limit: 8, windowMs: 60_000, keyPrefix: "rl:checkout" }),
  public: makeLimiter({ limit: 60, windowMs: 60_000, keyPrefix: "rl:public" }),
};
