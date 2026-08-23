/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * PATCH /api/admin/returns/[id] — update return status + admin note
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/admin-guard";
import { limiters } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

const UpdateReturnSchema = z.object({
  status: z.enum(["pending", "reviewing", "approved", "rejected", "refunded"]).optional(),
  admin_note: z.string().max(1000).optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rl = limiters.admin(req);
  if (!rl.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const guard = await requireAdmin();
  if (!guard.ok) return guard.error;

  const { id } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = UpdateReturnSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const supabase = guard.client;

  const { data: updated, error } = await (supabase as any)
    .from("returns")
    .update(parsed.data)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    logger.error("admin return PATCH failed", { id, error: error.message });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  logger.info("return updated", { id, status: parsed.data.status });
  return NextResponse.json({ ok: true, return: updated });
}
