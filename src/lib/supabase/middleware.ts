import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/lib/supabase/database.types";

/**
 * Refreshes Supabase auth session and protects /admin routes.
 *
 * Supports both simple hardcoded admin login (admin/admin123 cookie)
 * and Supabase auth sessions.
 *
 * OPTIMIZATION: Public routes (/, /shop, /product/*, /collection/*, etc.)
 * skip Supabase auth entirely to eliminate unnecessary DB calls on the free tier.
 * Auth is only checked for /admin, /account, and /api/admin paths.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const { pathname } = request.nextUrl;

  const hasAdminSession =
    request.cookies.get("meme_admin_session")?.value === "true";

  // ── Fast path: Skip ALL Supabase calls for purely public routes ──────────
  // Storefront pages (/shop, /product/*, /collection/*, /, sitemap, robots)
  // never need auth. This eliminates ~90% of Supabase Auth requests on the
  // free tier without impacting functionality.
  const isProtectedPath =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/account") ||
    pathname.startsWith("/api/admin") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/checkout") ||
    pathname.startsWith("/api/stripe");

  if (!isProtectedPath) {
    return supabaseResponse;
  }
  // ─────────────────────────────────────────────────────────────────────────

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const isConfigured =
    Boolean(supabaseUrl) &&
    Boolean(supabaseKey) &&
    supabaseUrl!.startsWith("http");

  // Protect admin routes — require auth (hardcoded admin session cookie or Supabase auth)
  if (
    !hasAdminSession &&
    pathname.startsWith("/admin") &&
    !pathname.startsWith("/admin/login")
  ) {
    // If Supabase not configured and no simple-auth cookie, redirect to login
    if (!isConfigured) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      url.searchParams.set("redirect", pathname);
      return NextResponse.redirect(url);
    }
  }

  // Demo mode without Supabase
  if (!isConfigured) {
    if (hasAdminSession && pathname === "/admin/login") {
      const url = request.nextUrl.clone();
      url.pathname = "/admin";
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  const supabase = createServerClient<Database>(supabaseUrl!, supabaseKey!, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          const opts = { ...options, maxAge: 60 * 15 };
          request.cookies.set(name, value);
          supabaseResponse = NextResponse.next({ request });
          supabaseResponse.cookies.set(name, value, opts);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protect admin routes — require auth (simple-auth cookie OR Supabase user)
  if (
    !user &&
    !hasAdminSession &&
    pathname.startsWith("/admin") &&
    !pathname.startsWith("/admin/login")
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  // If already logged in and visiting /admin/login, send to /admin
  if ((user || hasAdminSession) && pathname === "/admin/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/admin";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

