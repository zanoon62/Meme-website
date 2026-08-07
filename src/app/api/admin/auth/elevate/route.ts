import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { isSupabaseServiceConfigured } from "@/lib/supabase/config";
import { cookies } from "next/headers";
import { ADMIN_COOKIE_NAME, ADMIN_EMAIL_COOKIE_NAME } from "@/lib/auth/simple-auth";

const SESSION_MAX_AGE = 60 * 5; // 5 minutes

/**
 * POST /api/admin/auth/elevate
 * Called after a normal shop login (account page) to silently check
 * if the logged-in user's email is in the admin whitelist.
 * If allowed: sets admin session cookies so the header shows the Admin link.
 * Returns { ok: true, isAdmin: boolean }.
 */
export async function POST() {
  if (!isSupabaseServiceConfigured()) {
    return NextResponse.json({ ok: true, isAdmin: false });
  }

  try {
    const serverClient = await createSupabaseServerClient();
    const { data: { user }, error } = await serverClient.auth.getUser();

    if (error || !user || !user.email) {
      const cookieStore = await cookies();
      cookieStore.set(ADMIN_COOKIE_NAME, "", { maxAge: 0, path: "/" });
      cookieStore.set(ADMIN_EMAIL_COOKIE_NAME, "", { maxAge: 0, path: "/" });
      return NextResponse.json({ ok: true, isAdmin: false });
    }

    const email = user.email.toLowerCase().trim();

    const serviceClient = createSupabaseServiceClient();
    const { data: allowed } = await (serviceClient as any)
      .from("admin_allowed_emails")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (!allowed) {
      const cookieStore = await cookies();
      cookieStore.set(ADMIN_COOKIE_NAME, "", { maxAge: 0, path: "/" });
      cookieStore.set(ADMIN_EMAIL_COOKIE_NAME, "", { maxAge: 0, path: "/" });
      return NextResponse.json({ ok: true, isAdmin: false });
    }

    // Set admin cookies
    const cookieStore = await cookies();
    cookieStore.set(ADMIN_COOKIE_NAME, "true", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE,
    });
    cookieStore.set(ADMIN_EMAIL_COOKIE_NAME, email, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE,
    });

    return NextResponse.json({ ok: true, isAdmin: true });
  } catch {
    return NextResponse.json({ ok: true, isAdmin: false });
  }
}
