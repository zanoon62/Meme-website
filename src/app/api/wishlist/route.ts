/**
 * GET    /api/wishlist        — list current user's wishlist
 * POST   /api/wishlist        — add a product to wishlist
 * DELETE /api/wishlist?id=... — remove a product from wishlist
 *
 * All routes require a logged-in customer. Guests get 401.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient, createSupabaseServiceClient } from "@/lib/supabase/server";
import { isSupabaseConfigured, isSupabaseServiceConfigured } from "@/lib/supabase/config";
import { limiters } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

async function getCustomerId(): Promise<string | null> {
  if (!isSupabaseConfigured()) return null;
  const serverClient = await createSupabaseServerClient();
  const { data: { user } } = await serverClient.auth.getUser();
  if (!user) return null;
  if (!isSupabaseServiceConfigured()) return null;
  const serviceClient = createSupabaseServiceClient();
  const { data: cust } = await serviceClient
    .from("customers")
    .select("id")
    .eq("auth_user_id", user.id)
    .maybeSingle();
  return cust?.id ?? null;
}

export async function GET(req: NextRequest) {
  const rl = limiters.public(req);
  if (!rl.success) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  // Demo mode: no auth — return empty wishlist so client doesn't crash
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ items: [], demo: true });
  }

  const customerId = await getCustomerId();
  if (!customerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const serverClient = await createSupabaseServerClient();
  const { data, error } = await serverClient
    .from("wishlists")
    .select("product_id, created_at, products(id, slug, name, price, images:product_images(url))")
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ items: data ?? [] });
}

const AddSchema = z.object({ product_id: z.string().uuid() });

export async function POST(req: NextRequest) {
  const rl = limiters.public(req);
  if (!rl.success) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const customerId = await getCustomerId();
  if (!customerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = AddSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const serverClient = await createSupabaseServerClient();
  const { error } = await serverClient
    .from("wishlists")
    .upsert(
      { customer_id: customerId, product_id: parsed.data.product_id },
      { onConflict: "customer_id,product_id" },
    );

  if (error) {
    logger.warn("wishlist add failed", { error: error.message });
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ ok: true }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const customerId = await getCustomerId();
  if (!customerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const productId = searchParams.get("id");
  if (!productId) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const serverClient = await createSupabaseServerClient();
  const { error } = await serverClient
    .from("wishlists")
    .delete()
    .eq("customer_id", customerId)
    .eq("product_id", productId);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
