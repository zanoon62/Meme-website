/**
 * Admin authentication for the MEME Atelier admin panel.
 * Auth is Gmail-based via Supabase Google OAuth + email whitelist.
 */

// Legacy — kept for backward compat during transition
export const ADMIN_CREDENTIALS = {
  username: "admin",
  password: "admin123",
};

export const ADMIN_COOKIE_NAME = "meme_admin_session";
/** Stores the verified admin email (NOT HttpOnly — readable by JS for UI hints). */
export const ADMIN_EMAIL_COOKIE_NAME = "meme_admin_email";

/** Default super-admin that can manage the email whitelist. */
export const SUPER_ADMIN_EMAIL = "zanoon.bis@gmail.com";

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

/** Client-side check if current user is the super-admin (can manage whitelist). */
export function isSuperAdmin(email: string): boolean {
  return email.toLowerCase().trim() === SUPER_ADMIN_EMAIL.toLowerCase();
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
    // Clear the non-HttpOnly email cookie
    document.cookie = `${ADMIN_EMAIL_COOKIE_NAME}=; path=/; max-age=0`;
  }
  try {
    await fetch("/api/admin/login", { method: "DELETE" });
  } catch {
    // best-effort
  }
}

/**
 * Client-side check if admin session exists.
 * Reads the meme_admin_email cookie (NOT HttpOnly) as a UI hint.
 * Real auth is always verified server-side.
 */
export function isAdminLoggedInClient(): boolean {
  if (typeof window !== "undefined") {
    return Boolean(getAdminEmailClient());
  }
  return false;
}

/** Client-side: get the admin email from non-HttpOnly cookie. */
export function getAdminEmailClient(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|;\s*)meme_admin_email=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}
