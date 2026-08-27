/**
 * Constants + client-side helpers for the admin UI. Real auth is a Google
 * OAuth + email-whitelist flow backed by real sessions (see
 * src/lib/auth/{session,admin-guard,google-oauth}.ts) — nothing here
 * performs authentication itself.
 */

/** Dev-only break-glass credentials — see validateAdminCredentials(). */
export const ADMIN_CREDENTIALS = {
  username: "admin",
  password: "admin123",
};

/** Stores the verified admin email (NOT HttpOnly — readable by JS for UI hints only). */
export const ADMIN_EMAIL_COOKIE_NAME = "meme_admin_email";

/** Default super-admin that can manage the email whitelist. */
export const SUPER_ADMIN_EMAIL = "zanoon.bis@gmail.com";

/**
 * Validates the hardcoded dev-login credentials. Deliberately hardwired to
 * fail outside development: this used to work identically in production,
 * which — combined with the admin-guard bug fixed alongside this rewrite —
 * meant any holder of these well-known credentials was indistinguishable
 * from a real Google-authenticated admin. Now it only ever unlocks a
 * NODE_ENV-gated dev session (see /api/admin/login), and never in production
 * regardless of what's passed in.
 */
export function validateAdminCredentials(username: string, pass: string): boolean {
  if (process.env.NODE_ENV === "production") return false;
  const user = username.trim().toLowerCase();
  const validUser = user === ADMIN_CREDENTIALS.username || user === "admin@memeatelier.com";
  return validUser && pass === ADMIN_CREDENTIALS.password;
}

/** Client-side check if current user is the super-admin (can manage whitelist). */
export function isSuperAdmin(email: string): boolean {
  return email.toLowerCase().trim() === SUPER_ADMIN_EMAIL.toLowerCase();
}

/** Client-side: clear the admin UI-hint cookie + sign out via the API. */
export async function clearAdminSession(): Promise<void> {
  if (typeof window !== "undefined") {
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
 * Real auth is always verified server-side via requireAdmin().
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
