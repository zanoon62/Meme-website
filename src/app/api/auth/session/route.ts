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
import { logger } from "@/lib/logger";

/** Parse first/last name from Google OAuth metadata (which gives full_name) */
function parseName(meta: Record<string, unknown>) {
  if (meta.first_name && meta.last_name) {
    return {
      first_name: meta.first_name as string,
      last_name: meta.last_name as string,
    };
  }
  // Google OAuth sends `full_name`
  const full = (meta.full_name as string) ?? (meta.name as string) ?? "";
  const parts = full.trim().split(" ");
  return {
    first_name: parts[0] ?? null,
    last_name: parts.length > 1 ? parts.slice(1).join(" ") : null,
  };
}

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ user: null });
  }

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ user: null });

  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const avatarUrl = (meta.avatar_url as string) ?? (meta.picture as string) ?? null;

  let customer: Record<string, unknown> | null = null;
  if (isSupabaseServiceConfigured()) {
    const serviceClient = createSupabaseServiceClient();
    const { data: existing } = await serviceClient
      .from("customers")
      .select("*")
      .eq("auth_user_id", user.id)
      .maybeSingle();

    if (existing) {
      // Backfill name if missing (e.g. Google login before fix)
      if (!existing.first_name && meta.full_name) {
        const { first_name, last_name } = parseName(meta);
        await serviceClient
          .from("customers")
          .update({ first_name, last_name })
          .eq("id", existing.id);
        customer = { ...existing, first_name, last_name };
      } else {
        customer = existing;
      }
    } else {
      const { first_name, last_name } = parseName(meta);
      const { data: created, error: createErr } = await serviceClient
        .from("customers")
        .insert({
          auth_user_id: user.id,
          email: user.email ?? "",
          first_name,
          last_name,
          accepts_marketing: Boolean(meta.accepts_marketing),
        })
        .select()
        .single();
      if (createErr) {
        logger.warn("session: customer insert failed", { error: createErr.message });
      }
      customer = created;
    }
  }

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      avatar_url: avatarUrl,
      created_at: user.created_at,
    },
    customer,
  });
}
