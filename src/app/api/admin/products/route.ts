/**
 * GET  /api/admin/products — list all products (incl. drafts) for admin
 * POST /api/admin/products — create a new product
 *
 * Secured: caller must be authenticated staff/admin (see requireAdmin).
 * In demo mode (Supabase not configured), GET returns seed data so the
 * admin panel is still explorable; writes are blocked.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, requireAdminRole } from "@/lib/auth/admin-guard";
import { storeProductToDb } from "@/lib/api/products";
import { limiters } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import { products as seedProducts } from "@/data/products";
import { isSupabaseServiceConfigured } from "@/lib/supabase/config";

export async function GET(req: NextRequest) {
  const rl = limiters.admin(req);
  if (!rl.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: { "Retry-After": "60" } });
  }

  // Demo mode: return seed products so admin panel is explorable without DB
  if (!isSupabaseServiceConfigured()) {
    return NextResponse.json({
      products: seedProducts.map((p) => ({
        id: p.id,
        slug: p.slug,
        name: p.name,
        subtitle: p.subtitle,
        description: p.description,
        price: p.price,
        compare_at_price: p.compareAtPrice ?? null,
        currency: p.currency,
        category_name: p.category,
        collection_name: p.collection,
        inventory: p.inventory,
        status: "active",
        images: p.images,
        is_featured: p.isLimited,
        created_at: new Date(Date.now() - Math.random() * 86400000 * 30).toISOString(),
      })),
      demo: true,
    });
  }

  const guard = await requireAdmin();
  if (!guard.ok) return guard.error;

  try {
    const supabase = guard.client;
    const [{ data: products, error }, { data: images }] = await Promise.all([
      supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase
        .from("product_images")
        .select("product_id, url, sort_order, is_primary")
        .order("sort_order", { ascending: true }),
    ]);

    if (error) {
      logger.error("admin products GET failed", { error: error.message });
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const imageMap = new Map<string, string[]>();
    for (const img of images ?? []) {
      const arr = imageMap.get(img.product_id) ?? [];
      arr.push(img.url);
      imageMap.set(img.product_id, arr);
    }

    return NextResponse.json({
      products: (products ?? []).map((p) => ({
        ...p,
        images: imageMap.get(p.id) ?? [],
      })),
    });
  } catch (e) {
    logger.error("admin products GET exception", {
      error: e instanceof Error ? e.message : String(e),
    });
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  const rl = limiters.admin(req);
  if (!rl.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const guard = await requireAdmin();
  if (!guard.ok) return guard.error;

  try {
    const body = await req.json();
    const supabase = guard.client;

    const payload = storeProductToDb(body);
    if (!payload.slug || !payload.name || payload.price === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: slug, name, price" },
        { status: 400 },
      );
    }

    // Auto-generate slug from name if not provided
    if (!payload.slug) {
      payload.slug = body.name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");
    }

    const { data, error } = await supabase
      .from("products")
      .insert(payload as never)
      .select()
      .single();

    if (error) {
      logger.warn("admin product create failed", { error: error.message, slug: payload.slug });
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Insert images if provided
    if (body.images?.length) {
      const imgPayload = body.images.map((url: string, i: number) => ({
        product_id: data.id,
        url,
        sort_order: i,
        is_primary: i === 0,
        alt: body.name,
      }));
      const { error: imgErr } = await supabase.from("product_images").insert(imgPayload);
      if (imgErr) {
        logger.warn("product image insert failed", { productId: data.id, error: imgErr.message });
      }
    }

    logger.info("product created", { productId: data.id, slug: payload.slug, by: guard.userId });
    return NextResponse.json({ product: data }, { status: 201 });
  } catch (e) {
    logger.error("admin product create exception", {
      error: e instanceof Error ? e.message : String(e),
    });
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 },
    );
  }
}

// DELETE requires admin role (not just staff)
export async function DELETE(req: NextRequest) {
  const guard = await requireAdminRole();
  if (!guard.ok) return guard.error;
  // (this route is handled by [id]/route.ts; this is a safety net)
  return NextResponse.json({ error: "Use /api/admin/products/[id]" }, { status: 400 });
}
