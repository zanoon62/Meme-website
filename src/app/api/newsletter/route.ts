/**
 * POST /api/newsletter — subscribe an email to the newsletter.
 *
 * Stores in a `newsletter_subscribers` table (created on first call via
 * upsert). In production, also push to Klaviyo/Mailchimp via webhook.
 *
 * Body: { email, source?: string }
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { limiters } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

const Schema = z.object({
  email: z.string().email().max(255),
  source: z.string().max(80).optional(),
});

export async function POST(req: NextRequest) {
  const rl = limiters.public(req);
  if (!rl.success) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    // Demo — pretend success
    return NextResponse.json({ ok: true, demo: true });
  }

  const supabase = await createSupabaseServerClient();
  // Try inserting into customers with accepts_marketing=true (anonymous subscribers).
  // For a separate subscribers list, create a `newsletter_subscribers` table.
  const { error } = await supabase
    .from("customers")
    .upsert(
      {
        email: parsed.data.email,
        accepts_marketing: true,
      },
      { onConflict: "email" },
    );

  if (error) {
    logger.warn("newsletter subscribe failed", { email: parsed.data.email, error: error.message });
    // If RLS blocks the upsert (no anon insert policy), return a friendly error
    return NextResponse.json(
      { error: "Could not subscribe — please try again later." },
      { status: 500 },
    );
  }

  logger.info("newsletter subscribe", { email: parsed.data.email, source: parsed.data.source });

  // TODO: push to Klaviyo/Mailchimp webhook for marketing automation
  return NextResponse.json({ ok: true });
}
