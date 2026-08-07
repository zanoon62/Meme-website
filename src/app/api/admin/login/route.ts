import { NextRequest, NextResponse } from "next/server";
import { validateAdminCredentials, ADMIN_COOKIE_NAME } from "@/lib/auth/simple-auth";

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();
    const isValid = validateAdminCredentials(username ?? "", password ?? "");

    if (!isValid) {
      return NextResponse.json({ ok: false, error: "Invalid credentials" }, { status: 401 });
    }

    const res = NextResponse.json({ ok: true });

    // Set HttpOnly + Secure cookie server-side
    res.cookies.set(ADMIN_COOKIE_NAME, "true", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return res;
  } catch {
    return NextResponse.json({ ok: false, error: "Bad request" }, { status: 400 });
  }
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return res;
}
