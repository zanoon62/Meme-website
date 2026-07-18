/**
 * Admin API auth guard.
 *
 * Every /api/admin/* route MUST call `requireAdmin()` and bail if it returns
 * an error response. This verifies the caller has a valid Supabase session
 * AND that their auth user is linked to an active staff_profiles row with
 * role admin or staff.
 *
 * Usage:
 *   import { requireAdmin } from "@/lib/auth/admin-guard";
 *   const guard = await requireAdmin();
 *   if (guard.error) return guard.error;
 *   const supabase = guard.client; // service-role client, bypasses RLS
 */

import { NextResponse } from "next/server";
import { createSupabaseServerClient, createSupabaseServiceClient } from "@/lib/supabase/server";
import { isSupabaseServiceConfigured } from "@/lib/supabase/config";
import { logger } from "@/lib/logger";

type ServiceClient = ReturnType<typeof createSupabaseServiceClient>;

type GuardResult =
  | { ok: true; userId: string; role: "admin" | "staff"; client: ServiceClient }
  | { ok: false; error: NextResponse };

export async function requireAdmin(): Promise<GuardResult> {
  // Demo mode (no Supabase configured) — block admin writes
  if (!isSupabaseServiceConfigured()) {
    return {
      ok: false,
      error: NextResponse.json(
        { error: "Server not configured. Set SUPABASE_SERVICE_ROLE_KEY." },
        { status: 503 },
      ),
    };
  }

  // 1. Read session from cookies (server client)
  const serverClient = await createSupabaseServerClient();
  const {
    data: { user },
    error: userErr,
  } = await serverClient.auth.getUser();

  if (userErr || !user) {
    return {
      ok: false,
      error: NextResponse.json(
        { error: "Unauthorized — no session." },
        { status: 401 },
      ),
    };
  }

  // 2. Look up staff_profiles for this auth user via service client (bypass RLS)
  const serviceClient = createSupabaseServiceClient();
  const { data: staff, error: staffErr } = await serviceClient
    .from("staff_profiles")
    .select("id, role, is_active")
    .eq("auth_user_id", user.id)
    .single();

  if (staffErr || !staff) {
    logger.warn("Admin API denied — not staff", {
      userId: user.id,
      email: user.email,
    });
    return {
      ok: false,
      error: NextResponse.json(
        { error: "Forbidden — account is not staff." },
        { status: 403 },
      ),
    };
  }

  if (!staff.is_active) {
    return {
      ok: false,
      error: NextResponse.json(
        { error: "Forbidden — staff account disabled." },
        { status: 403 },
      ),
    };
  }

  if (staff.role !== "admin" && staff.role !== "staff") {
    return {
      ok: false,
      error: NextResponse.json(
        { error: "Forbidden — insufficient role." },
        { status: 403 },
      ),
    };
  }

  return { ok: true, userId: user.id, role: staff.role as "admin" | "staff", client: serviceClient };
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
      error: NextResponse.json(
        { error: "Forbidden — admin role required." },
        { status: 403 },
      ),
    };
  }
  return guard;
}
