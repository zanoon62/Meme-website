/**
 * POST /api/auth/signout — invalidate the current session.
 */

import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";

export async function POST() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  logger.info("customer signed out");
  return NextResponse.json({ ok: true });
}
