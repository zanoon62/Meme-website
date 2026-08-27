import { NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth/admin-guard";
import { SUPER_ADMIN_EMAIL } from "@/lib/auth/simple-auth";
import { db } from "@/lib/db/client";
import { adminAllowedEmails } from "@/lib/db/schema";

/**
 * GET /api/admin/allowed-emails
 * List all whitelisted admin emails. Requires admin session.
 */
export async function GET() {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.error;

  const emails = await db.select().from(adminAllowedEmails).orderBy(asc(adminAllowedEmails.createdAt));
  return NextResponse.json({ ok: true, emails });
}

/**
 * POST /api/admin/allowed-emails
 * Add an email to the whitelist. Only super-admin can do this.
 */
export async function POST(req: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.error;

  // Only super-admin can manage the whitelist — checked against the real
  // authenticated session email, not a client-writable cookie.
  if (guard.email.toLowerCase() !== SUPER_ADMIN_EMAIL.toLowerCase()) {
    return NextResponse.json({ ok: false, error: "Only super-admin can manage whitelist." }, { status: 403 });
  }

  try {
    const { email } = await req.json();
    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ ok: false, error: "Invalid email." }, { status: 400 });
    }

    const [entry] = await db
      .insert(adminAllowedEmails)
      .values({ email: email.toLowerCase().trim(), addedBy: guard.email })
      .returning();

    return NextResponse.json({ ok: true, entry });
  } catch (e: unknown) {
    const code = (e as { code?: string })?.code;
    if (code === "23505") {
      return NextResponse.json({ ok: false, error: "Email already in whitelist." }, { status: 409 });
    }
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
