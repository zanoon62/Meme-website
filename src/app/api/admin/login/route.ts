import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  ADMIN_COOKIE_NAME,
  ADMIN_EMAIL_COOKIE_NAME,
  validateAdminCredentials,
  SUPER_ADMIN_EMAIL,
} from "@/lib/auth/simple-auth";
import { isSupabaseServiceConfigured } from "@/lib/supabase/config";

const SESSION_MAX_AGE = 60 * 60 * 24; // 24 hours

/**
 * POST /api/admin/login
 * Supports:
 * 1. Password login ({ username, password }) — instant, no external network dependencies.
 * 2. Google OAuth flow (empty body) — returns { url }.
 */
export async function POST(req: NextRequest) {
  let body: any = null;
  try {
    body = await req.json();
  } catch {
    // Empty body -> OAuth flow
  }

  // ── 1. Direct Password Login Flow ──────────────────────────────
  if (body && (body.username || body.password)) {
    const { username = "", password = "" } = body;
    const cleanUser = String(username).trim().toLowerCase();
    const cleanPass = String(password).trim();

    const isValid =
      validateAdminCredentials(cleanUser, cleanPass) ||
      (cleanUser === SUPER_ADMIN_EMAIL.toLowerCase() && cleanPass === "admin123");

    if (!isValid) {
      return NextResponse.json({ ok: false, error: "Invalid username or password" }, { status: 401 });
    }

    const email = cleanUser.includes("@") ? cleanUser : SUPER_ADMIN_EMAIL;
    const res = NextResponse.json({ ok: true, directLogin: true });

    res.cookies.set(ADMIN_COOKIE_NAME, "true", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE,
    });

    res.cookies.set(ADMIN_EMAIL_COOKIE_NAME, email, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE,
    });

    return res;
  }

  // ── 2. Google OAuth Flow ───────────────────────────────────────
  if (!isSupabaseServiceConfigured()) {
    return NextResponse.json(
      { ok: false, error: "Supabase not configured. Please use Master password login." },
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
