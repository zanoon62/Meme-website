import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ADMIN_COOKIE_NAME, ADMIN_EMAIL_COOKIE_NAME } from "@/lib/auth/simple-auth";
import { isSupabaseServiceConfigured } from "@/lib/supabase/config";

/**
 * POST /api/admin/login
 * Initiates Google OAuth flow for admin login.
 * Returns { url } — the OAuth redirect URL that the client should navigate to.
 */
export async function POST(req: NextRequest) {
  if (!isSupabaseServiceConfigured()) {
    return NextResponse.json(
      { ok: false, error: "Supabase not configured. Cannot use Google OAuth." },
      { status: 503 }
    );
  }

  const origin = req.headers.get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL ?? "";

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${origin}/auth/callback?next=/api/admin/auth/check`,
        queryParams: {
          access_type: "offline",
          prompt: "select_account",
        },
      },
    });

    if (error || !data.url) {
      return NextResponse.json(
        { ok: false, error: error?.message ?? "OAuth initiation failed" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, url: data.url });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/login
 * Signs out the admin — clears session cookies.
 */
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  res.cookies.set(ADMIN_EMAIL_COOKIE_NAME, "", {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return res;
}
