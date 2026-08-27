/**
 * POST /api/newsletter — subscribe an email to the newsletter.
 *
 * Public — no customer session required. Upserts into `customers` with
 * accepts_marketing=true (anonymous subscribers, same as the previous
 * Supabase-backed behavior). In production, also push to Klaviyo/Mailchimp
 * via webhook.
 *
 * Body: { email, source?: string }
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isDatabaseConfigured } from "@/lib/db/config";
import { db } from "@/lib/db/client";
import { customers } from "@/lib/db/schema";
import { limiters } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

const Schema = z.object({
  email: z.string().email().max(255),
  source: z.string().max(80).optional(),
});

export async function POST(req: NextRequest) {
  const rl = await limiters.public(req);
  if (!rl.success) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  if (!isDatabaseConfigured()) {
    // Demo — pretend success
    return NextResponse.json({ ok: true, demo: true });
  }

  try {
    // Try inserting into customers with accepts_marketing=true (anonymous subscribers).
    // For a separate subscribers list, create a `newsletter_subscribers` table.
    await db
      .insert(customers)
      .values({
        email: parsed.data.email,
        acceptsMarketing: true,
      })
      .onConflictDoUpdate({
        target: customers.email,
        set: { acceptsMarketing: true },
      });
  } catch (e) {
    logger.warn("newsletter subscribe failed", {
      email: parsed.data.email,
      error: e instanceof Error ? e.message : String(e),
    });
    return NextResponse.json(
      { error: "Could not subscribe — please try again later." },
      { status: 500 },
    );
  }

  logger.info("newsletter subscribe", { email: parsed.data.email, source: parsed.data.source });

  // TODO: push to Klaviyo/Mailchimp webhook for marketing automation
  return NextResponse.json({ ok: true });
}
