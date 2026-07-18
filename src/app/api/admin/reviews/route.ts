/**
 * GET  /api/admin/reviews — list all reviews
 * POST /api/admin/reviews/[id] — handled by dynamic route (PATCH)
 */

import { NextRequest, NextResponse } from "next/server";
import { isSupabaseServiceConfigured } from "@/lib/supabase/config";
import { demoStore } from "@/lib/demo-store";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const productId = searchParams.get("product_id");
  const status = searchParams.get("status"); // published | unpublished | all

  if (!isSupabaseServiceConfigured()) {
    let reviews = demoStore.listReviews();
    if (productId) {
      reviews = reviews.filter((r) => r.product_id === productId);
    }
    if (status === "published") {
      reviews = reviews.filter((r) => r.is_published);
    } else if (status === "unpublished") {
      reviews = reviews.filter((r) => !r.is_published);
    }
    return NextResponse.json({ reviews, total: reviews.length });
  }

  // Supabase mode would go here in production
  return NextResponse.json({ reviews: [], total: 0 });
}
