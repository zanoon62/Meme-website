/**
 * GET /api/categories — public endpoint to list active categories for storefront
 */

import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { demoStore } from "@/lib/demo-store";

export async function GET() {
  if (!isSupabaseConfigured()) {
    const list = demoStore.listCategories().filter((c) => c.is_active !== false);
    return NextResponse.json({ categories: list });
  }

  try {
    const supabase = createSupabaseBrowserClient();
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .or("is_active.eq.true,is_active.is.null")
      .order("sort_order", { ascending: true });

    if (error || !data) {
      const list = demoStore.listCategories().filter((c) => c.is_active !== false);
      return NextResponse.json({ categories: list });
    }

    return NextResponse.json({ categories: data });
  } catch {
    const list = demoStore.listCategories().filter((c) => c.is_active !== false);
    return NextResponse.json({ categories: list });
  }
}
