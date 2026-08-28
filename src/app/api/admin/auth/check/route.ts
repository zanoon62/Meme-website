import { NextResponse } from "next/server";
import { getCurrentSession, signOutCurrentSession } from "@/lib/auth/session";
import { resolveStaffAccess } from "@/lib/auth/admin-provision";
import { ADMIN_EMAIL_COOKIE_NAME } from "@/lib/auth/simple-auth";
import { getSiteOrigin } from "@/lib/site-url";
import { cookies } from "next/headers";
import { logger } from "@/lib/logger";

const UI_HINT_COOKIE_MAX_AGE = 60 * 60 * 24; // 24h — matches session UX, just a display hint

/**
 * GET /api/admin/auth/check
 * Called right after the Google OAuth callback for an admin login attempt.
 * The real session cookie is already set by the callback — this route only
 * decides whether that user is allowed to be staff.
 */
export async function GET() {
  const origin = getSiteOrigin();
  const redirectSuccess = `${origin}/admin`;
  const redirectDenied = `${origin}/admin/login?error=access-denied`;

  const { user } = await getCurrentSession();
  if (!user) {
    logger.warn("Admin auth check: no session");
    return NextResponse.redirect(redirectDenied);
  }

  const email = user.email.toLowerCase().trim();
  const { granted } = await resolveStaffAccess(user);

  if (!granted) {
    logger.warn("Admin auth check: access denied", { email });
    await signOutCurrentSession();
    return NextResponse.redirect(redirectDenied);
  }

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_EMAIL_COOKIE_NAME, email, {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: UI_HINT_COOKIE_MAX_AGE,
  });

  logger.info("Admin session granted", { email });
  return NextResponse.redirect(redirectSuccess);
}
