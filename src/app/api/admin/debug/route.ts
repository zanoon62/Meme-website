import { NextResponse } from "next/server";
import { createSupabaseStaticClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = createSupabaseStaticClient();
  const { data, error } = await supabase.from("product_images").select("*");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  
  // To avoid huge base64 strings, we'll map them
  const mapped = data.map(img => ({
    id: img.id,
    product_id: img.product_id,
    url_length: img.url.length,
    url_preview: img.url.substring(0, 50)
  }));
  return NextResponse.json({ count: data.length, images: mapped });
}
