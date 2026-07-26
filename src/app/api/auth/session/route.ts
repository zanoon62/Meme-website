/**
 * GET /api/auth/session — returns the current customer's session + profile.
 *
 * Returns:
 *   200 { user, customer } — logged in
 *   200 { user: null } — not logged in
 */

import { NextResponse } from "next/server";
import { createSupabaseServerClient, createSupabaseServiceClient } from "@/lib/supabase/server";
import { isSupabaseConfigured, isSupabaseServiceConfigured } from "@/lib/supabase/config";

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ user: null });
  }

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ user: null });

  let customer: Record<string, unknown> | null = null;
  if (isSupabaseServiceConfigured()) {
    const serviceClient = createSupabaseServiceClient();
    // Try to find the customers row; if missing, create it (lazy backfill)
    const { data: existing } = await serviceClient
      .from("customers")
      .select("*")
      .eq("auth_user_id", user.id)
      .maybeSingle();

    if (existing) {
      customer = existing;
    } else {
      const { data: created } = await serviceClient
        .from("customers")
        .insert({
          auth_user_id: user.id,
          email: user.email ?? "",
          first_name: (user.user_metadata?.first_name as string) ?? null,
          last_name: (user.user_metadata?.last_name as string) ?? null,
          accepts_marketing: Boolean(user.user_metadata?.accepts_marketing),
        })
        .select()
        .single();
      customer = created;
    }
  }

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      created_at: user.created_at,
    },
    customer,
  });
}
