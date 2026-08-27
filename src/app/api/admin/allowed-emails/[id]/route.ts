import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth/admin-guard";
import { SUPER_ADMIN_EMAIL } from "@/lib/auth/simple-auth";
import { db } from "@/lib/db/client";
import { adminAllowedEmails } from "@/lib/db/schema";

/**
 * DELETE /api/admin/allowed-emails/[id]
 * Remove an email from the whitelist. Only super-admin can do this.
 * Cannot remove super-admin's own email.
 */
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.error;

  if (guard.email.toLowerCase() !== SUPER_ADMIN_EMAIL.toLowerCase()) {
    return NextResponse.json({ ok: false, error: "Only super-admin can manage whitelist." }, { status: 403 });
  }

  const { id } = await params;

  const [target] = await db.select().from(adminAllowedEmails).where(eq(adminAllowedEmails.id, id)).limit(1);

  if (target?.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) {
    return NextResponse.json({ ok: false, error: "Cannot remove super-admin." }, { status: 400 });
  }

  await db.delete(adminAllowedEmails).where(eq(adminAllowedEmails.id, id));
  return NextResponse.json({ ok: true });
}
