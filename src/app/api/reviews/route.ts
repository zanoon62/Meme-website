/**
 * GET  /api/reviews?productId=...   — list published reviews for a product
 * POST /api/reviews                  — submit a new review (auth required)
 *
 * Reviews are submitted with is_published=false by default — admin must
 * approve them in the dashboard before they appear publicly.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient, createSupabaseServiceClient } from "@/lib/supabase/server";
import { isSupabaseConfigured, isSupabaseServiceConfigured } from "@/lib/supabase/config";
import { limiters } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

export async function GET(req: NextRequest) {
  const rl = limiters.public(req);
  if (!rl.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { searchParams } = new URL(req.url);
  const productId = searchParams.get("productId");

  // Demo mode OR missing productId — return empty review set
  if (!productId || !isSupabaseConfigured()) {
    return NextResponse.json({ reviews: [], avgRating: null, count: 0, demo: !isSupabaseConfigured() });
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("reviews")
    .select("id, author, rating, title, body, is_verified, created_at, response, response_at")
    .eq("product_id", productId)
    .eq("is_published", true)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const reviews = data ?? [];
  const count = reviews.length;
  const avgRating = count > 0
    ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / count) * 10) / 10
    : null;

  return NextResponse.json({ reviews, avgRating, count });
}

const CreateReviewSchema = z.object({
  product_id: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  title: z.string().max(120).optional(),
  body: z.string().min(10).max(2000),
});

export async function POST(req: NextRequest) {
  const rl = limiters.public(req);
  if (!rl.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: true, demo: true });
  }

  // Auth check — only logged-in customers can review
  const serverClient = await createSupabaseServerClient();
  const { data: { user } } = await serverClient.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { error: "Please sign in to leave a review." },
      { status: 401 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = CreateReviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  // Find the customer row
  let customerId: string | null = null;
  let authorName = user.email ?? "Anonymous";
  if (isSupabaseServiceConfigured()) {
    const serviceClient = createSupabaseServiceClient();
    const { data: cust } = await serviceClient
      .from("customers")
      .select("id, first_name, last_name")
      .eq("auth_user_id", user.id)
      .maybeSingle();
    if (cust) {
      customerId = cust.id;
      const name = [cust.first_name, cust.last_name].filter(Boolean).join(" ");
      if (name) authorName = name;
    }
  }

  // Insert via server client (RLS allows customer-owned inserts)
  const { data, error } = await serverClient.from("reviews").insert({
    product_id: parsed.data.product_id,
    customer_id: customerId,
    author: authorName,
    rating: parsed.data.rating,
    title: parsed.data.title,
    body: parsed.data.body,
    is_published: false, // require admin approval
    is_verified: false,
  }).select().single();

  if (error) {
    logger.warn("review insert failed", { error: error.message, user: user.id });
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, review: data }, { status: 201 });
}
