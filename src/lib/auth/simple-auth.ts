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
 * Client-side: Set cookie and localStorage session for admin login.
 */
export function setAdminSession(): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(ADMIN_COOKIE_NAME, "true");
    document.cookie = `${ADMIN_COOKIE_NAME}=true; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
  }
}

/**
 * Client-side: Clear cookie and localStorage session for admin logout.
 */
export function clearAdminSession(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(ADMIN_COOKIE_NAME);
    document.cookie = `${ADMIN_COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax`;
  }
}

/**
 * Client-side check if admin session exists.
 */
export function isAdminLoggedInClient(): boolean {
  if (typeof window !== "undefined") {
    const fromStorage = localStorage.getItem(ADMIN_COOKIE_NAME) === "true";
    const fromCookie = document.cookie.includes(`${ADMIN_COOKIE_NAME}=true`);
    return fromStorage || fromCookie;
  }
  return false;
}
