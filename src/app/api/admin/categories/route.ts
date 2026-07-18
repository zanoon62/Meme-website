/**
 * GET  /api/admin/categories — list all categories
 * POST /api/admin/categories — create a category (admin only)
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin-guard";
import { isSupabaseServiceConfigured } from "@/lib/supabase/config";
import { categories as seedCategories } from "@/data/products";
import { logger } from "@/lib/logger";

export async function GET() {
  if (!isSupabaseServiceConfigured()) {
    return NextResponse.json({
      categories: seedCategories.map((c, i) => ({
        id: `demo-cat-${i}`,
        slug: c.slug,
        name: c.name,
        sort_order: i,
        is_active: true,
        products_count: 0,
      })),
    });
  }

  const guard = await requireAdmin();
  if (!guard.ok) return guard.error;

  const supabase = guard.client;
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error) {
    logger.error("categories GET failed", { error: error.message });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ categories: data ?? [] });
}

export async function POST(req: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.error;

  const body = (await req.json()) as {
    slug?: string;
    name?: string;
    description?: string;
    image_url?: string;
    sort_order?: number;
    is_active?: boolean;
  };
  const supabase = guard.client;

  // Validate required fields
  if (!body.slug || !body.name) {
    return NextResponse.json(
      { error: "Missing required fields: slug, name" },
      { status: 400 },
    );
  }

  const insertPayload = {
    slug: body.slug!,
    name: body.name!,
    description: body.description ?? null,
    image_url: body.image_url ?? null,
    sort_order: body.sort_order ?? 0,
    is_active: body.is_active ?? true,
  };

  const { data, error } = await supabase
    .from("categories")
    .insert(insertPayload as never)
    .select()
    .single();
  if (error) {
    logger.warn("category create failed", { error: error.message, slug: body.slug });
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  logger.info("category created", { id: data.id, by: guard.userId });
  return NextResponse.json({ category: data }, { status: 201 });
}
