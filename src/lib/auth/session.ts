import { cookies } from "next/headers";
import {
  SESSION_COOKIE_NAME,
  createSession,
  validateSessionToken,
  invalidateSession,
  invalidateAllUserSessions,
} from "./session-core";

export {
  SESSION_COOKIE_NAME,
  createSession,
  validateSessionToken,
  invalidateSession,
  invalidateAllUserSessions,
};

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
export async function getCurrentSession() {
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
