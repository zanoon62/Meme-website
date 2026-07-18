/**
 * POST /api/auth/signup — customer signup via Supabase Auth.
 *
 * Body: { email, password, first_name?, last_name?, accepts_marketing? }
 *
 * Creates the auth user, then inserts a row in `customers` linked via
 * auth_user_id. The customers row insert is performed via the service-role
 * client because RLS blocks anon inserts (we want only server-confirmed).
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient, createSupabaseServiceClient } from "@/lib/supabase/server";
import { isSupabaseConfigured, isSupabaseServiceConfigured } from "@/lib/supabase/config";
import { limiters } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

const SignupSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(8).max(128),
  first_name: z.string().max(80).optional(),
  last_name: z.string().max(80).optional(),
  accepts_marketing: z.boolean().default(false),
});

export async function POST(req: NextRequest) {
  const rl = limiters.auth(req);
  if (!rl.success) {
    return NextResponse.json({ error: "Too many attempts. Please wait." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = SignupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Auth not configured. Set NEXT_PUBLIC_SUPABASE_URL and ANON_KEY." },
      { status: 503 },
    );
  }

  const { email, password, first_name, last_name, accepts_marketing } = parsed.data;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { first_name, last_name, accepts_marketing },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/account`,
    },
  });

  if (error) {
    logger.warn("signup failed", { email, error: error.message });
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // If service role is available, create the customers row immediately.
  // Otherwise the customer row will be created on first authenticated request
  // via a database trigger or /api/auth/session handler.
  if (isSupabaseServiceConfigured() && data.user) {
    const serviceClient = createSupabaseServiceClient();
    const { error: custErr } = await serviceClient.from("customers").upsert(
      {
        auth_user_id: data.user.id,
        email,
        first_name,
        last_name,
        accepts_marketing,
      },
      { onConflict: "auth_user_id" },
    );
    if (custErr) {
      logger.warn("customer row insert failed", { userId: data.user.id, error: custErr.message });
    }
  }

  logger.info("customer signed up", { userId: data.user?.id, email });

  return NextResponse.json({
    ok: true,
    user: data.user
      ? {
          id: data.user.id,
          email: data.user.email,
        }
      : null,
    requires_email_confirmation: !data.session,
  });
}
