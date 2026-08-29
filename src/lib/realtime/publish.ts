import Redis from "ioredis";

declare global {
  // eslint-disable-next-line no-var
  var __memePublishRedis: Redis | undefined;
}

function getPublisher(): Redis | null {
  const url = process.env.REDIS_URL;
  if (!url) return null;
  if (!globalThis.__memePublishRedis) {
    globalThis.__memePublishRedis = new Redis(url, { maxRetriesPerRequest: 1, lazyConnect: false });
    globalThis.__memePublishRedis.on("error", (err) => {
      console.error("Redis connection error (realtime publish):", err.message);
    });
  }
  return globalThis.__memePublishRedis;
}

export type RealtimeEvent =
  | "order.created"
  | "order.status_changed"
  | "return.created"
  | "product.low_stock";

/**
 * Fire-and-forget push to the realtime service via Redis pub/sub. Never
 * throws — a missed notification is a UX nit (an admin sees the update on
 * next refresh instead of instantly), not a correctness issue, so it must
 * never be allowed to fail whatever real operation (order creation, status
 * update, etc.) it's attached to.
 */
export async function publishRealtimeEvent(event: RealtimeEvent, payload: Record<string, unknown>): Promise<void> {
  try {
    const redis = getPublisher();
    if (!redis) return;
    await redis.publish(`meme:${event}`, JSON.stringify(payload));
  } catch (err) {
    console.error(`Failed to publish realtime event ${event}:`, err instanceof Error ? err.message : err);
  }
}
