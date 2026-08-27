import { NextResponse, type NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { SESSION_COOKIE_NAME, validateSessionToken } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { staffProfiles } from "@/lib/db/schema";

/**
 * Gates the /admin/* page routes. Runs on the Node.js middleware runtime
 * (not Edge) so it can do a real Postgres-backed check — session validity
 * AND active staff_profiles — same as requireAdmin(), rather than just
 * checking whether a cookie is present. A plain customer session cookie
 * does NOT pass this check.
 *
 * Everything else (storefront pages, /api/*) skips this entirely: API
 * routes already self-protect via requireAdmin()/requireCustomerSession(),
 * and /account renders its own login screen client-side when unauthenticated.
 */
export async function gateRequest(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;
  const response = NextResponse.next({ request });

  if (!pathname.startsWith("/admin")) return response;

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  let isActiveStaff = false;

  if (token) {
    const { user } = await validateSessionToken(token);
    if (user) {
      const [staff] = await db
        .select({ isActive: staffProfiles.isActive })
        .from(staffProfiles)
        .where(eq(staffProfiles.userId, user.id))
        .limit(1);
      isActiveStaff = Boolean(staff?.isActive);
    }
  }

  if (!isActiveStaff && !pathname.startsWith("/admin/login")) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  if (isActiveStaff && pathname === "/admin/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/admin";
    return NextResponse.redirect(url);
  }

  return response;
}
