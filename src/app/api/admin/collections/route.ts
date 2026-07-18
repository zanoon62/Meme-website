/**
 * GET  /api/admin/collections — list all collections
 * POST /api/admin/collections — create a collection (admin only)
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin-guard";
import { isSupabaseServiceConfigured } from "@/lib/supabase/config";
import { demoStore } from "@/lib/demo-store";
import { logger } from "@/lib/logger";

export async function GET() {
  if (!isSupabaseServiceConfigured()) {
    return NextResponse.json({ collections: demoStore.listCollections() });
  }

  const guard = await requireAdmin();
  if (!guard.ok) return guard.error;

  const supabase = guard.client;
  const { data, error } = await supabase
    .from("collections")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error) {
    logger.error("collections GET failed", { error: error.message });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ collections: data ?? [] });
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as {
    slug?: string;
    name?: string;
    tagline?: string;
    description?: string;
    image_url?: string;
    banner_url?: string;
    is_featured?: boolean;
    is_active?: boolean;
  };

  if (!body.slug || !body.name) {
    return NextResponse.json(
      { error: "Missing required fields: slug, name" },
      { status: 400 },
    );
  }

  // Demo mode — persist to in-memory store
  if (!isSupabaseServiceConfigured()) {
    const col = demoStore.createCollection({
      slug: body.slug,
      name: body.name,
      tagline: body.tagline,
      description: body.description,
      cover_image: body.image_url,
      is_featured: body.is_featured,
    });
    return NextResponse.json({ collection: col }, { status: 201 });
  }

  const guard = await requireAdmin();
  if (!guard.ok) return guard.error;

  const supabase = guard.client;

  const { data, error } = await supabase
    .from("collections")
    .insert({
      slug: body.slug!,
      name: body.name!,
      tagline: body.tagline ?? null,
      description: body.description ?? null,
      image_url: body.image_url ?? null,
      banner_url: body.banner_url ?? null,
      is_featured: body.is_featured ?? false,
      is_active: body.is_active ?? true,
    } as never)
    .select()
    .single();
  if (error) {
    logger.warn("collection create failed", { error: error.message, slug: body.slug });
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  logger.info("collection created", { id: data.id, by: guard.userId });
  return NextResponse.json({ collection: data }, { status: 201 });
}
