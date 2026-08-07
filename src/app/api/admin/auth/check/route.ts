import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { isSupabaseServiceConfigured } from "@/lib/supabase/config";
import { cookies } from "next/headers";
import { ADMIN_COOKIE_NAME, ADMIN_EMAIL_COOKIE_NAME } from "@/lib/auth/simple-auth";
import { logger } from "@/lib/logger";

const SESSION_MAX_AGE = 60 * 5; // 5 minutes

/**
 * GET /api/admin/auth/check
 * Called after Google OAuth callback for admin login.
 * Checks if the authenticated user's email is in the admin_allowed_emails table.
 * If allowed: sets admin session cookies and redirects to /admin.
 * If denied: signs out and redirects to /admin/login?error=access-denied.
 */
export async function GET(request: Request) {
  const { origin } = new URL(request.url);
  const redirectSuccess = `${origin}/admin`;
  const redirectDenied = `${origin}/admin/login?error=access-denied`;

  if (!isSupabaseServiceConfigured()) {
    return NextResponse.redirect(redirectDenied);
  }

  try {
    const serverClient = await createSupabaseServerClient();
    const { data: { user }, error } = await serverClient.auth.getUser();

    if (error || !user || !user.email) {
      logger.warn("Admin auth check: no session", { error: error?.message });
      return NextResponse.redirect(redirectDenied);
    }

    const email = user.email.toLowerCase().trim();

    // Check whitelist via service client (bypasses RLS)
    const serviceClient = createSupabaseServiceClient();
    const { data: allowed, error: dbErr } = await (serviceClient as any)
      .from("admin_allowed_emails")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (dbErr || !allowed) {
      logger.warn("Admin auth check: email not in whitelist", { email });
      // Sign out this user so they don't remain logged in
      await serverClient.auth.signOut();
      return NextResponse.redirect(redirectDenied);
    }

    // Email is whitelisted — set admin session cookies
    const cookieStore = await cookies();

    // HttpOnly session cookie (tamper-proof)
    cookieStore.set(ADMIN_COOKIE_NAME, "true", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE,
    });

    // Non-HttpOnly email cookie (readable by JS for UI hints)
    cookieStore.set(ADMIN_EMAIL_COOKIE_NAME, email, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE,
    });

    logger.info("Admin session granted", { email });
    return NextResponse.redirect(redirectSuccess);
  } catch (e) {
    logger.error("Admin auth check error", { error: String(e) });
    return NextResponse.redirect(redirectDenied);
  }
}
