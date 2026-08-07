/**
 * PATCH /api/account/profile — update the logged-in customer's profile data.
 *
 * Body: { first_name?, last_name?, phone?, accepts_marketing? }
 * Requires a valid Supabase session cookie.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient, createSupabaseServiceClient } from "@/lib/supabase/server";
import { isSupabaseConfigured, isSupabaseServiceConfigured } from "@/lib/supabase/config";
import { limiters } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

const UpdateSchema = z.object({
  first_name: z.string().max(80).optional(),
  last_name: z.string().max(80).optional(),
  phone: z.string().max(30).optional().nullable(),
  accepts_marketing: z.boolean().optional(),
});

export async function PATCH(req: NextRequest) {
  const rl = limiters.public(req);
  if (!rl.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Auth not configured" }, { status: 503 });
  }

  const serverClient = await createSupabaseServerClient();
  const {
    data: { user },
  } = await serverClient.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  if (!isSupabaseServiceConfigured()) {
    return NextResponse.json({ error: "Service not configured" }, { status: 503 });
  }

  const serviceClient = createSupabaseServiceClient();

  // Find customer row
  const { data: customer } = await serviceClient
    .from("customers")
    .select("id")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (!customer) {
    return NextResponse.json({ error: "Customer profile not found" }, { status: 404 });
  }

  type CustomerUpdate = {
    first_name?: string;
    last_name?: string;
    phone?: string | null;
    accepts_marketing?: boolean;
  };
  const updatePayload: CustomerUpdate = {};
  if (parsed.data.first_name !== undefined) updatePayload.first_name = parsed.data.first_name;
  if (parsed.data.last_name !== undefined) updatePayload.last_name = parsed.data.last_name;
  if (parsed.data.phone !== undefined) updatePayload.phone = parsed.data.phone;
  if (parsed.data.accepts_marketing !== undefined)
    updatePayload.accepts_marketing = parsed.data.accepts_marketing;

  const { data: updated, error } = await serviceClient
    .from("customers")
    .update(updatePayload)
    .eq("id", customer.id)
    .select()
    .single();

  if (error) {
    logger.error("profile update failed", { error: error.message });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  logger.info("customer profile updated", { customerId: customer.id });
  return NextResponse.json({ ok: true, customer: updated });
}
