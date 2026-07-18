/**
 * GET    /api/admin/products/[id] — get a single product (admin view)
 * PATCH  /api/admin/products/[id] — update a product
 * DELETE /api/admin/products/[id] — delete a product (admin role only)
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, requireAdminRole } from "@/lib/auth/admin-guard";
import { storeProductToDb } from "@/lib/api/products";
import { logger } from "@/lib/logger";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.error;
  const { id } = await params;
  const supabase = guard.client;
  const [{ data: product, error }, { data: images }] = await Promise.all([
    supabase.from("products").select("*").eq("id", id).single(),
    supabase
      .from("product_images")
      .select("url, alt, sort_order, is_primary")
      .eq("product_id", id)
      .order("sort_order", { ascending: true }),
  ]);
  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json({ product: { ...product, images: images ?? [] } });
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.error;
  const { id } = await params;
  const body = await req.json();
  const supabase = guard.client;

  const payload = storeProductToDb(body);
  // Strip undefined fields
  Object.keys(payload).forEach((k) =>
    (payload as Record<string, unknown>)[k] === undefined
      ? delete (payload as Record<string, unknown>)[k]
      : null,
  );

  const { data, error } = await supabase
    .from("products")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    logger.warn("product update failed", { id, error: error.message });
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // Replace images if provided
  if (body.images) {
    await supabase.from("product_images").delete().eq("product_id", id);
    if (body.images.length) {
      await supabase.from("product_images").insert(
        body.images.map((url: string, i: number) => ({
          product_id: id,
          url,
          sort_order: i,
          is_primary: i === 0,
          alt: body.name,
        })),
      );
    }
  }

  logger.info("product updated", { id, by: guard.userId });
  return NextResponse.json({ product: data });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const guard = await requireAdminRole();
  if (!guard.ok) return guard.error;
  const { id } = await params;
  const supabase = guard.client;

  // Soft-delete via status=archived (preserves order_items foreign keys)
  const { error } = await supabase
    .from("products")
    .update({ status: "archived" })
    .eq("id", id);
  if (error) {
    logger.warn("product archive failed", { id, error: error.message });
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  logger.info("product archived", { id, by: guard.userId });
  return NextResponse.json({ success: true });
}
