/**
 * POST /api/auth/signout — invalidate the current session.
 */

import { NextResponse } from "next/server";
import { signOutCurrentSession } from "@/lib/auth/session";
import { logger } from "@/lib/logger";

export async function POST() {
  await signOutCurrentSession();
  logger.info("customer signed out");
  return NextResponse.json({ ok: true });
}
