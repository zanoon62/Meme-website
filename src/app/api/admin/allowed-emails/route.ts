import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin-guard";
import { SUPER_ADMIN_EMAIL, ADMIN_EMAIL_COOKIE_NAME } from "@/lib/auth/simple-auth";
import { cookies } from "next/headers";

/**
 * GET /api/admin/allowed-emails
 * List all whitelisted admin emails. Requires admin session.
 */
export async function GET() {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.error;

  try {
    const { data, error } = await (guard.client as any)
      .from("admin_allowed_emails")
      .select("id, email, added_by, created_at")
      .order("created_at", { ascending: true });

    if (error) throw error;
    return NextResponse.json({ ok: true, emails: data ?? [] });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}

/**
 * POST /api/admin/allowed-emails
 * Add an email to the whitelist. Only super-admin can do this.
 */
export async function POST(req: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.error;

  // Only super-admin can manage whitelist
  const cookieStore = await cookies();
  const adminEmail = decodeURIComponent(cookieStore.get(ADMIN_EMAIL_COOKIE_NAME)?.value ?? "");
  if (adminEmail.toLowerCase() !== SUPER_ADMIN_EMAIL.toLowerCase()) {
    return NextResponse.json({ ok: false, error: "Only super-admin can manage whitelist." }, { status: 403 });
  }

  try {
    const { email } = await req.json();
    if (!email || !email.includes("@")) {
      return NextResponse.json({ ok: false, error: "Invalid email." }, { status: 400 });
    }

    const { data, error } = await (guard.client as any)
      .from("admin_allowed_emails")
      .insert({ email: email.toLowerCase().trim(), added_by: adminEmail })
      .select("id, email, added_by, created_at")
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ ok: false, error: "Email already in whitelist." }, { status: 409 });
      }
      throw error;
    }

    return NextResponse.json({ ok: true, entry: data });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
