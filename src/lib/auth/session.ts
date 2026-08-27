import crypto from "crypto";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { sessions, users } from "@/lib/db/schema";

export const SESSION_COOKIE_NAME = "meme_session";

const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 30; // 30 days
const SESSION_RENEW_THRESHOLD_MS = 1000 * 60 * 60 * 24 * 15; // renew when <15 days left

type User = typeof users.$inferSelect;

function generateSessionToken(): string {
  return crypto.randomBytes(32).toString("base64url");
}

/** Only the hash is ever stored — the raw token lives solely in the httpOnly cookie. */
function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function createSession(userId: string): Promise<{ token: string; expiresAt: Date }> {
  const token = generateSessionToken();
  const sessionId = hashToken(token);
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
  await db.insert(sessions).values({ id: sessionId, userId, expiresAt });
  return { token, expiresAt };
}

export async function validateSessionToken(
  token: string,
): Promise<{ session: typeof sessions.$inferSelect | null; user: User | null }> {
  const sessionId = hashToken(token);
  const rows = await db
    .select({ session: sessions, user: users })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(eq(sessions.id, sessionId))
    .limit(1);

  if (rows.length === 0) return { session: null, user: null };
  const { session, user } = rows[0];

  if (Date.now() >= session.expiresAt.getTime()) {
    await db.delete(sessions).where(eq(sessions.id, session.id));
    return { session: null, user: null };
  }

  if (Date.now() >= session.expiresAt.getTime() - SESSION_RENEW_THRESHOLD_MS) {
    const newExpiresAt = new Date(Date.now() + SESSION_DURATION_MS);
    await db.update(sessions).set({ expiresAt: newExpiresAt }).where(eq(sessions.id, session.id));
    session.expiresAt = newExpiresAt;
  }

  return { session, user };
}

export async function invalidateSession(sessionId: string): Promise<void> {
  await db.delete(sessions).where(eq(sessions.id, sessionId));
}

export async function invalidateAllUserSessions(userId: string): Promise<void> {
  await db.delete(sessions).where(eq(sessions.userId, userId));
}

export async function setSessionCookie(token: string, expiresAt: Date): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function deleteSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, "", { maxAge: 0, path: "/" });
}

/** Server Components / Route Handlers: resolve the current session + user from cookies. */
export async function getCurrentSession(): Promise<{
  session: typeof sessions.$inferSelect | null;
  user: User | null;
}> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return { session: null, user: null };
  return validateSessionToken(token);
}

/** Signs the user out: invalidates the DB session row and clears the cookie. */
export async function signOutCurrentSession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (token) {
    const { session } = await validateSessionToken(token);
    if (session) await invalidateSession(session.id);
  }
  await deleteSessionCookie();
}
