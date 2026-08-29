import Redis from "ioredis";
import type { Server } from "socket.io";

/**
 * Channel -> which room(s) the payload's own fields say to deliver to.
 * `admin` events always go to the admin room; `order.status_changed` also
 * targets the specific customer if the order has one (guest orders don't).
 */
const CHANNELS = [
  "meme:order.created",
  "meme:order.status_changed",
  "meme:return.created",
  "meme:product.low_stock",
] as const;

export function startRedisSubscriber(io: Server) {
  const url = process.env.REDIS_URL;
  if (!url) {
    console.warn("[realtime] REDIS_URL not set — no events will be delivered");
    return;
  }

  const sub = new Redis(url, { maxRetriesPerRequest: null });
  sub.on("error", (err) => console.error("[realtime] Redis subscriber error:", err.message));

  sub.subscribe(...CHANNELS, (err) => {
    if (err) console.error("[realtime] Redis subscribe failed:", err.message);
    else console.log(`[realtime] subscribed to ${CHANNELS.length} channels`);
  });

  sub.on("message", (channel: string, raw: string) => {
    let payload: Record<string, unknown>;
    try {
      payload = JSON.parse(raw);
    } catch {
      return;
    }

    const event = channel.replace(/^meme:/, "");
    io.to("admin").emit(event, payload);

    if (channel === "meme:order.status_changed" && typeof payload.customerId === "string") {
      io.to(`customer:${payload.customerId}`).emit(event, payload);
    }
  });

  return sub;
}
