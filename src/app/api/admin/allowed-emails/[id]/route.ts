import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin-guard";
import { SUPER_ADMIN_EMAIL, ADMIN_EMAIL_COOKIE_NAME } from "@/lib/auth/simple-auth";
import { cookies } from "next/headers";

/**
 * DELETE /api/admin/allowed-emails/[id]
 * Remove an email from the whitelist. Only super-admin can do this.
 * Cannot remove super-admin's own email.
 */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.error;

  const cookieStore = await cookies();
  const adminEmail = decodeURIComponent(cookieStore.get(ADMIN_EMAIL_COOKIE_NAME)?.value ?? "");
  if (adminEmail.toLowerCase() !== SUPER_ADMIN_EMAIL.toLowerCase()) {
    return NextResponse.json({ ok: false, error: "Only super-admin can manage whitelist." }, { status: 403 });
  }

  try {
    const { id } = await params;

    // Prevent removing super-admin
    const { data: target } = await guard.client
      .from("admin_allowed_emails")
      .select("email")
      .eq("id", id)
      .single();

    if (target?.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) {
      return NextResponse.json({ ok: false, error: "Cannot remove super-admin." }, { status: 400 });
    }

    const { error } = await guard.client
      .from("admin_allowed_emails")
      .delete()
      .eq("id", id);

    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
