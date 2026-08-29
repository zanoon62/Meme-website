import type { Socket } from "socket.io";
import { eq } from "drizzle-orm";
import { db } from "../src/lib/db/client";
import { customers, staffProfiles } from "../src/lib/db/schema";
import { validateSessionToken, SESSION_COOKIE_NAME } from "../src/lib/auth/session-core";

/**
 * Parses a single cookie value out of a raw `Cookie` header — no library
 * needed for one cookie. Mirrors what next/headers' cookies() does
 * internally, just without the Next.js request context this service
 * doesn't have.
 */
function parseCookie(header: string | undefined, name: string): string | null {
  if (!header) return null;
  for (const part of header.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return decodeURIComponent(rest.join("="));
  }
  return null;
}

/**
 * Socket.io handshake middleware: validates the same `meme_session` cookie
 * the rest of the app uses, then joins the socket into whichever rooms its
 * identity qualifies for. A user can be in both rooms at once (e.g. an
 * admin who is also a customer). Invalid/missing session is never a hard
 * error to the client — it just means no rooms get joined, so no events
 * are ever delivered (silent no-op, matching the "fire-and-forget UI
 * notification" nature of this whole service).
 */
export async function authenticateSocket(socket: Socket, next: (err?: Error) => void) {
  try {
    const cookieHeader = socket.handshake.headers.cookie;
    const token = parseCookie(cookieHeader, SESSION_COOKIE_NAME);
    if (!token) return next();

    const { user } = await validateSessionToken(token);
    if (!user) return next();

    const [staff] = await db
      .select({ isActive: staffProfiles.isActive })
      .from(staffProfiles)
      .where(eq(staffProfiles.userId, user.id))
      .limit(1);
    if (staff?.isActive) {
      socket.join("admin");
    }

    const [customer] = await db
      .select({ id: customers.id })
      .from(customers)
      .where(eq(customers.userId, user.id))
      .limit(1);
    if (customer) {
      socket.join(`customer:${customer.id}`);
    }

    next();
  } catch {
    // Never let an auth-check failure crash the handshake — worst case,
    // this connection just never receives any events.
    next();
  }
}
