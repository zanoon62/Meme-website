/**
 * PATCH /api/admin/reviews/[id] — update review (publish/unpublish/respond)
 */

import { NextRequest, NextResponse } from "next/server";
import { isSupabaseServiceConfigured } from "@/lib/supabase/config";
import { demoStore } from "@/lib/demo-store";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  if (!isSupabaseServiceConfigured()) {
    const updated = demoStore.updateReview(id, body);
    if (!updated) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }
    return NextResponse.json({ review: updated, success: true });
  }

  return NextResponse.json({ success: true });
}
