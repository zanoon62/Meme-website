/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * POST /api/returns — Customer submits a return request
 * GET  /api/returns — Customer fetches their own return requests
 *
 * Requires valid Supabase Auth session (Gmail login).
 * Validates that the order is within the 14-day return window.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient, createSupabaseServiceClient } from "@/lib/supabase/server";
import { isSupabaseConfigured, isSupabaseServiceConfigured } from "@/lib/supabase/config";
import { limiters } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

const RETURN_WINDOW_DAYS = 14;

const SubmitReturnSchema = z.object({
  order_number: z.string().min(1).max(100).trim().transform(v => v.replace(/^#/, "")),
  reason: z.enum([
    "wrong_size",
    "wrong_item",
    "damaged",
    "not_as_described",
    "changed_mind",
    "other",
  ]),
  description: z.string().max(2000).optional(),
  image_url: z.string().url().optional().or(z.literal("")),
});

export async function POST(req: NextRequest) {
  const rl = limiters.public(req);
  if (!rl.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Auth not configured" }, { status: 503 });
  }

  // Verify auth session
  const serverClient = await createSupabaseServerClient();
  const {
    data: { user },
  } = await serverClient.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized — please log in first" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = SubmitReturnSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  if (!isSupabaseServiceConfigured()) {
    return NextResponse.json({ error: "Service not configured" }, { status: 503 });
  }

  const service = createSupabaseServiceClient();

  // Find the customer record
  const { data: customer } = await service
    .from("customers")
    .select("id, email")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (!customer) {
    return NextResponse.json({ error: "Customer profile not found" }, { status: 404 });
  }

  // Find the order — must belong to this customer
  const { data: order } = await service
    .from("orders")
    .select("id, order_number, created_at, status")
    .eq("order_number", parsed.data.order_number)
    .maybeSingle();

  if (!order) {
    return NextResponse.json(
      { error: "Order not found. Please check the order number." },
      { status: 404 }
    );
  }

  // Validate 14-day return window
  const orderDate = new Date(order.created_at);
  const now = new Date();
  const diffDays = (now.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24);

  if (diffDays > RETURN_WINDOW_DAYS) {
    return NextResponse.json(
      {
        error: `Return window expired. Returns are only accepted within ${RETURN_WINDOW_DAYS} days of ordering. This order was placed ${Math.floor(diffDays)} days ago.`,
        code: "WINDOW_EXPIRED",
        days_elapsed: Math.floor(diffDays),
        window_days: RETURN_WINDOW_DAYS,
      },
      { status: 422 }
    );
  }

  // Check if a return for this order already exists
  const { data: existingReturn } = await (service as any)
    .from("returns")
    .select("id, status")
    .eq("order_number", parsed.data.order_number)
    .maybeSingle();

  if (existingReturn) {
    return NextResponse.json(
      {
        error: `A return request for order ${parsed.data.order_number} already exists (status: ${existingReturn.status}).`,
        code: "ALREADY_EXISTS",
      },
      { status: 409 }
    );
  }

  // Insert return
  const { data: returnRecord, error: insertError } = await (service as any)
    .from("returns")
    .insert({
      order_id: order.id,
      order_number: parsed.data.order_number,
      customer_id: customer.id,
      customer_email: customer.email || user.email || "",
      reason: parsed.data.reason,
      description: parsed.data.description || null,
      image_url: parsed.data.image_url || null,
      status: "pending",
    })
    .select()
    .single();

  if (insertError) {
    logger.error("return insert failed", { error: insertError.message });
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  logger.info("return submitted", { returnId: returnRecord.id, orderNumber: parsed.data.order_number });

  return NextResponse.json({ ok: true, return: returnRecord }, { status: 201 });
}

export async function GET(req: NextRequest) {
  const rl = limiters.public(req);
  if (!rl.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ returns: [] });
  }

  const serverClient = await createSupabaseServerClient();
  const {
    data: { user },
  } = await serverClient.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const service = createSupabaseServiceClient();

  const { data: customer } = await service
    .from("customers")
    .select("id")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (!customer) {
    return NextResponse.json({ returns: [] });
  }

  const { data: returns, error } = await (service as any)
    .from("returns")
    .select("*")
    .eq("customer_id", customer.id)
    .order("created_at", { ascending: false });

  if (error) {
    logger.error("returns GET failed", { error: error.message });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ returns: returns ?? [] });
}
