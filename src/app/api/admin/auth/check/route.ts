import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getCurrentSession, signOutCurrentSession } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { adminAllowedEmails, staffProfiles } from "@/lib/db/schema";
import { ADMIN_EMAIL_COOKIE_NAME, SUPER_ADMIN_EMAIL } from "@/lib/auth/simple-auth";
import { cookies } from "next/headers";
import { logger } from "@/lib/logger";

const UI_HINT_COOKIE_MAX_AGE = 60 * 60 * 24; // 24h — matches session UX, just a display hint

/**
 * GET /api/admin/auth/check
 * Called right after the Google OAuth callback for an admin login attempt.
 * The real session cookie is already set by the callback — this route only
 * decides whether that user is allowed to be staff.
 */
export async function GET(request: Request) {
  const { origin } = new URL(request.url);
  const redirectSuccess = `${origin}/admin`;
  const redirectDenied = `${origin}/admin/login?error=access-denied`;

  const { user } = await getCurrentSession();
  if (!user) {
    logger.warn("Admin auth check: no session");
    return NextResponse.redirect(redirectDenied);
  }

  const email = user.email.toLowerCase().trim();

  const [allowed] = await db
    .select({ id: adminAllowedEmails.id })
    .from(adminAllowedEmails)
    .where(eq(adminAllowedEmails.email, email))
    .limit(1);

  if (!allowed) {
    logger.warn("Admin auth check: email not in whitelist", { email });
    await signOutCurrentSession();
    return NextResponse.redirect(redirectDenied);
  }

  const [existingStaff] = await db
    .select()
    .from(staffProfiles)
    .where(eq(staffProfiles.userId, user.id))
    .limit(1);

  if (existingStaff) {
    // Being in the whitelist re-grants access after removal, but does NOT
    // override an explicit `isActive: false` set by an admin — a
    // deactivated staff member stays deactivated until reactivated
    // deliberately, even if they're still whitelisted.
    if (!existingStaff.isActive) {
      logger.warn("Admin auth check: staff account is deactivated", { email });
      await signOutCurrentSession();
      return NextResponse.redirect(redirectDenied);
    }
    await db
      .update(staffProfiles)
      .set({ lastLoginAt: new Date() })
      .where(eq(staffProfiles.id, existingStaff.id));
  } else {
    await db.insert(staffProfiles).values({
      userId: user.id,
      email,
      role: email === SUPER_ADMIN_EMAIL.toLowerCase() ? "admin" : "staff",
      isActive: true,
      lastLoginAt: new Date(),
    });
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
