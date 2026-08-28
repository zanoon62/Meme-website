import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getCurrentSession } from "@/lib/auth/session";
import { resolveStaffAccess } from "@/lib/auth/admin-provision";
import { ADMIN_EMAIL_COOKIE_NAME } from "@/lib/auth/simple-auth";

const UI_HINT_COOKIE_MAX_AGE = 60 * 60 * 24;
const NO_STORE_HEADERS = { "Cache-Control": "no-store, must-revalidate" };

/**
 * POST /api/admin/auth/elevate
 * Called after ANY successful login (password login, or the plain
 * customer "Sign in with Google" button on /account — not just the
 * dedicated /admin/login flow) to check whether the logged-in user should
 * be staff. Uses the same whitelist-check-and-auto-provision logic as
 * /api/admin/auth/check, so a whitelisted email is recognized as admin no
 * matter which login path they used first.
 * Returns { ok: true, isAdmin: boolean }.
 */
export async function POST() {
  const { user } = await getCurrentSession();
  const cookieStore = await cookies();

  if (!user) {
    cookieStore.set(ADMIN_EMAIL_COOKIE_NAME, "", { maxAge: 0, path: "/" });
    return NextResponse.json({ ok: true, isAdmin: false }, { headers: NO_STORE_HEADERS });
  }

  const { granted } = await resolveStaffAccess(user);

  if (!granted) {
    cookieStore.set(ADMIN_EMAIL_COOKIE_NAME, "", { maxAge: 0, path: "/" });
    return NextResponse.json({ ok: true, isAdmin: false }, { headers: NO_STORE_HEADERS });
  }

  cookieStore.set(ADMIN_EMAIL_COOKIE_NAME, user.email, {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: UI_HINT_COOKIE_MAX_AGE,
  });

  return NextResponse.json({ ok: true, isAdmin: true }, { headers: NO_STORE_HEADERS });
}
