import { NextResponse } from "next/server";
import { createSupabaseStaticClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = createSupabaseStaticClient();
  const [{ data: rows, error }, { data: images, error: imgError }] = await Promise.all([
    supabase.from("products").select("*").eq("status", "active").order("created_at", { ascending: false }),
    supabase.from("product_images").select("product_id, url, sort_order").order("sort_order", { ascending: true }),
  ]);
  
  return NextResponse.json({ rows, error, images, imgError });
}
