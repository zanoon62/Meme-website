/**
 * Simple hardcoded authentication for the MEME Atelier admin panel.
 * No Supabase auth needed for admin login.
 */

export const ADMIN_CREDENTIALS = {
  username: "admin",
  password: "admin123",
};

export const ADMIN_COOKIE_NAME = "meme_admin_session";

/**
 * Validates admin credentials.
 * Accepts "admin" (or "admin@memeatelier.com") as valid username.
 */
export function validateAdminCredentials(username: string, pass: string): boolean {
  const user = username.trim().toLowerCase();
  const validUser =
    user === ADMIN_CREDENTIALS.username ||
    user === "admin@memeatelier.com";
  return validUser && pass === ADMIN_CREDENTIALS.password;
}

/**
 * Client-side: Set admin session — handled server-side via POST /api/admin/login.
 * Kept as a no-op stub for any callers that may reference it.
 */
export function setAdminSession(): void {
  // No-op: cookie is now set by /api/admin/login (HttpOnly + Secure)
}

/**
 * Client-side: Clear admin session via server API (clears HttpOnly cookie).
 */
export async function clearAdminSession(): Promise<void> {
  if (typeof window !== "undefined") {
    localStorage.removeItem(ADMIN_COOKIE_NAME);
  }
  try {
    await fetch("/api/admin/login", { method: "DELETE" });
  } catch {
    // best-effort
  }
}

/**
 * Client-side check if admin session exists.
 * Note: HttpOnly cookie is not readable from JS — this checks localStorage only
 * as a UI hint. Real auth is always verified server-side.
 */
export function isAdminLoggedInClient(): boolean {
  if (typeof window !== "undefined") {
    return localStorage.getItem(ADMIN_COOKIE_NAME) === "true";
  }
  return false;
}
