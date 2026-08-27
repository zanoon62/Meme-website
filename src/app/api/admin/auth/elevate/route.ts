import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { getCurrentSession } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { staffProfiles } from "@/lib/db/schema";
import { ADMIN_EMAIL_COOKIE_NAME } from "@/lib/auth/simple-auth";

const UI_HINT_COOKIE_MAX_AGE = 60 * 60 * 24;

/**
 * POST /api/admin/auth/elevate
 * Called after a normal shop login (account page) to silently check
 * if the logged-in user is already staff. If so, sets the non-HttpOnly
 * UI-hint cookie so the header shows the Admin link.
 * Returns { ok: true, isAdmin: boolean }.
 */
export async function POST() {
  const { user } = await getCurrentSession();
  const cookieStore = await cookies();

  if (!user) {
    cookieStore.set(ADMIN_EMAIL_COOKIE_NAME, "", { maxAge: 0, path: "/" });
    return NextResponse.json({ ok: true, isAdmin: false });
  }

  const [staff] = await db
    .select()
    .from(staffProfiles)
    .where(eq(staffProfiles.userId, user.id))
    .limit(1);

  if (!staff || !staff.isActive) {
    cookieStore.set(ADMIN_EMAIL_COOKIE_NAME, "", { maxAge: 0, path: "/" });
    return NextResponse.json({ ok: true, isAdmin: false });
  }

  cookieStore.set(ADMIN_EMAIL_COOKIE_NAME, user.email, {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: UI_HINT_COOKIE_MAX_AGE,
  });

  return NextResponse.json({ ok: true, isAdmin: true });
}
