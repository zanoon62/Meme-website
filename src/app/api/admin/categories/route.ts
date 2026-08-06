/**
 * GET    /api/admin/categories        — list all categories
 * POST   /api/admin/categories        — create a category
 * PATCH  /api/admin/categories?id=   — update a category
 * DELETE /api/admin/categories?id=   — delete a category
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin-guard";
import { isSupabaseServiceConfigured } from "@/lib/supabase/config";
import { demoStore } from "@/lib/demo-store";
import { logger } from "@/lib/logger";

export async function GET() {
  if (!isSupabaseServiceConfigured()) {
    return NextResponse.json({ categories: demoStore.listCategories() });
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
    return NextResponse.json({ categories: [] });
  }
  return NextResponse.json({ categories: data ?? [] });
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as {
    slug?: string;
    name?: string;
    description?: string;
    image_url?: string;
    sort_order?: number;
    is_active?: boolean;
  };

  if (!body.slug || !body.name) {
    return NextResponse.json(
      { error: "Missing required fields: slug, name" },
      { status: 400 },
    );
  }

  if (!isSupabaseServiceConfigured()) {
    const cat = demoStore.createCategory({
      slug: body.slug,
      name: body.name,
      description: body.description,
      image_url: body.image_url,
    });
    return NextResponse.json({ category: cat }, { status: 201 });
  }

  const guard = await requireAdmin();
  if (!guard.ok) return guard.error;

  const supabase = guard.client;

  const insertPayload = {
    slug: body.slug,
    name: body.name,
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
    const cat = demoStore.createCategory({
      slug: body.slug,
      name: body.name,
      description: body.description,
      image_url: body.image_url,
    });
    return NextResponse.json({ category: cat }, { status: 201 });
  }

  logger.info("category created", { id: data.id, by: guard.userId });
  return NextResponse.json({ category: data }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const body = (await req.json()) as {
    slug?: string;
    name?: string;
    description?: string;
    is_active?: boolean;
  };

  if (!isSupabaseServiceConfigured()) {
    // demo mode: just return success (no persistent store for updates)
    return NextResponse.json({ ok: true });
  }

  const guard = await requireAdmin();
  if (!guard.ok) return guard.error;

  const supabase = guard.client;

  const { data, error } = await supabase
    .from("categories")
    .update({
      ...(body.name !== undefined && { name: body.name }),
      ...(body.slug !== undefined && { slug: body.slug }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.is_active !== undefined && { is_active: body.is_active }),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    logger.error("category update failed", { error: error.message, id });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  logger.info("category updated", { id, by: guard.userId });
  return NextResponse.json({ category: data });
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  if (!isSupabaseServiceConfigured()) {
    // demo mode: just acknowledge
    return NextResponse.json({ ok: true });
  }

  const guard = await requireAdmin();
  if (!guard.ok) return guard.error;

  const supabase = guard.client;

  const { error } = await supabase.from("categories").delete().eq("id", id);

  if (error) {
    logger.error("category delete failed", { error: error.message, id });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  logger.info("category deleted", { id, by: guard.userId });
  return NextResponse.json({ ok: true });
}
