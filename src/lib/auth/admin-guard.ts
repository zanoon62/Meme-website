/**
 * Admin API auth guard.
 *
 * Every /api/admin/* route MUST call `requireAdmin()` and bail if it returns
 * an error response. Resolves the real session cookie to a `users` row,
 * then requires an active `staff_profiles` row with role admin or staff.
 *
 * There is exactly one path through this function — real session lookup —
 * for both Google-OAuth-authenticated staff and the (NODE_ENV-gated) dev
 * password login, which also creates a real session against a real staff
 * profile. This replaces the old behavior where the hardcoded dev cookie
 * and every real admin login both collapsed to the literal userId
 * "admin-hardcoded", losing individual identity for real admins too.
 *
 * Usage:
 *   import { requireAdmin } from "@/lib/auth/admin-guard";
 *   const guard = await requireAdmin();
 *   if (!guard.ok) return guard.error;
 *   // guard.userId, guard.role are the real staff identity — use `db` from
 *   // "@/lib/db/client" for queries (no more service-role vs RLS split).
 */

import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getCurrentSession } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { staffProfiles } from "@/lib/db/schema";
import { logger } from "@/lib/logger";

type GuardResult =
  | { ok: true; userId: string; email: string; role: "admin" | "staff" }
  | { ok: false; error: NextResponse };

export async function requireAdmin(): Promise<GuardResult> {
  const { user } = await getCurrentSession();

  if (!user) {
    return {
      ok: false,
      error: NextResponse.json({ error: "Unauthorized — no session." }, { status: 401 }),
    };
  }

  const [staff] = await db
    .select()
    .from(staffProfiles)
    .where(eq(staffProfiles.userId, user.id))
    .limit(1);

  if (!staff) {
    logger.warn("Admin API denied — not staff", { userId: user.id, email: user.email });
    return {
      ok: false,
      error: NextResponse.json({ error: "Forbidden — account is not staff." }, { status: 403 }),
    };
  }

  if (!staff.isActive) {
    return {
      ok: false,
      error: NextResponse.json({ error: "Forbidden — staff account disabled." }, { status: 403 }),
    };
  }

  if (staff.role !== "admin" && staff.role !== "staff") {
    return {
      ok: false,
      error: NextResponse.json({ error: "Forbidden — insufficient role." }, { status: 403 }),
    };
  }

  return { ok: true, userId: user.id, email: user.email, role: staff.role };
}

/**
 * Stricter guard — only `admin` role (not `staff`).
 * Use for destructive operations: deleting products, managing staff, etc.
 */
export async function requireAdminRole(): Promise<GuardResult> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard;
  if (guard.role !== "admin") {
    return {
      ok: false,
      error: NextResponse.json({ error: "Forbidden — admin role required." }, { status: 403 }),
    };
  }
  return guard;
}
