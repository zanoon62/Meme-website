import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { staffProfiles, users } from "@/lib/db/schema";
import {
  ADMIN_EMAIL_COOKIE_NAME,
  validateAdminCredentials,
  SUPER_ADMIN_EMAIL,
} from "@/lib/auth/simple-auth";
import { createSession, setSessionCookie, signOutCurrentSession } from "@/lib/auth/session";
import { isGoogleOAuthConfigured } from "@/lib/auth/google-oauth";

const DEV_ADMIN_EMAIL = "dev-admin@localhost";
const UI_HINT_COOKIE_MAX_AGE = 60 * 60 * 24;

/**
 * POST /api/admin/login
 * Supports:
 * 1. Password login ({ username, password }) — dev-only (validateAdminCredentials
 *    always returns false in production). Creates a REAL session against a
 *    real staff profile, so it goes through the exact same requireAdmin()
 *    path as a Google login — no more special-cased "admin-hardcoded" identity.
 * 2. Google OAuth flow (empty body) — returns { url } to redirect the client to.
 */
export async function POST(req: NextRequest) {
  let body: { username?: string; password?: string } | null = null;
  try {
    body = await req.json();
  } catch {
    // Empty body -> OAuth flow
  }

  // ── 1. Dev password login ──────────────────────────────
  if (body && (body.username || body.password)) {
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        { ok: false, error: "Password login is disabled in production. Use Google sign-in." },
        { status: 403 },
      );
    }

    const { username = "", password = "" } = body;
    const cleanUser = String(username).trim().toLowerCase();
    const cleanPass = String(password).trim();

    const isValid =
      validateAdminCredentials(cleanUser, cleanPass) ||
      (cleanUser === SUPER_ADMIN_EMAIL.toLowerCase() && cleanPass === "admin123");

    if (!isValid) {
      return NextResponse.json({ ok: false, error: "Invalid username or password" }, { status: 401 });
    }

    const email = cleanUser.includes("@") ? cleanUser : DEV_ADMIN_EMAIL;

    let [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (!user) {
      [user] = await db.insert(users).values({ email, emailVerifiedAt: new Date() }).returning();
    }

    let [staff] = await db.select().from(staffProfiles).where(eq(staffProfiles.userId, user.id)).limit(1);
    if (!staff) {
      [staff] = await db
        .insert(staffProfiles)
        .values({
          userId: user.id,
          email,
          role: email === SUPER_ADMIN_EMAIL.toLowerCase() ? "admin" : "staff",
          isActive: true,
          lastLoginAt: new Date(),
        })
        .returning();
    } else if (!staff.isActive) {
      return NextResponse.json({ ok: false, error: "This dev admin account is deactivated." }, { status: 403 });
    }

    const { token, expiresAt } = await createSession(user.id);
    await setSessionCookie(token, expiresAt);

    const res = NextResponse.json({ ok: true, directLogin: true });
    res.cookies.set(ADMIN_EMAIL_COOKIE_NAME, email, {
      httpOnly: false,
      secure: false,
      sameSite: "lax",
      path: "/",
      maxAge: UI_HINT_COOKIE_MAX_AGE,
    });
    return res;
  }

  // ── 2. Google OAuth flow ───────────────────────────────
  if (!isGoogleOAuthConfigured()) {
    return NextResponse.json(
      { ok: false, error: "Google sign-in not configured. Please use Master password login (dev only)." },
      { status: 503 },
    );
  }

  const origin = req.nextUrl.origin;
  return NextResponse.json({ ok: true, url: `${origin}/api/auth/google?next=/api/admin/auth/check` });
}

/**
 * DELETE /api/admin/login
 * Signs out the admin — invalidates the session and clears cookies.
 */
export async function DELETE() {
  await signOutCurrentSession();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_EMAIL_COOKIE_NAME, "", { maxAge: 0, path: "/" });
  return res;
}
