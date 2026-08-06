import { NextRequest, NextResponse } from "next/server";
import { isSupabaseServiceConfigured } from "@/lib/supabase/config";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { demoStore } from "@/lib/demo-store";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

  if (!isSupabaseServiceConfigured()) {
    const updated = demoStore.updateCoupon(id, body);
    return NextResponse.json({ coupon: updated });
  }

  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from("coupons")
    .update(body)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ coupon: data });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!isSupabaseServiceConfigured()) {
    demoStore.deleteCoupon(id);
    return NextResponse.json({ success: true });
  }

  const supabase = createSupabaseServiceClient();
  const { error } = await supabase.from("coupons").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
