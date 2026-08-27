/**
 * POST /api/auth/signup — customer signup with email + password.
 *
 * Body: { email, password, first_name?, last_name?, accepts_marketing? }
 *
 * Creates the user, hashes the password, creates the linked `customers`
 * row, and signs the customer straight in (no email confirmation step —
 * unlike Supabase Auth's default, there's no mail infra wired up for that
 * here yet; Resend is only used for order emails today).
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { hashPassword } from "@/lib/auth/password";
import { ensureCustomerForUser } from "@/lib/auth/identity";
import { createSession, setSessionCookie } from "@/lib/auth/session";
import { limiters } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

const SignupSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(8).max(128),
  first_name: z.string().max(80).optional(),
  last_name: z.string().max(80).optional(),
  accepts_marketing: z.boolean().default(false),
});

export async function POST(req: NextRequest) {
  const rl = await limiters.auth(req);
  if (!rl.success) {
    return NextResponse.json({ error: "Too many attempts. Please wait." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = SignupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { email: rawEmail, password, first_name, last_name, accepts_marketing } = parsed.data;
  const email = rawEmail.toLowerCase().trim();

  const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (existing) {
    return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);
  const [user] = await db.insert(users).values({ email, passwordHash }).returning();

  await ensureCustomerForUser(user.id, email, {
    firstName: first_name ?? null,
    lastName: last_name ?? null,
    acceptsMarketing: accepts_marketing,
  });

  const { token, expiresAt } = await createSession(user.id);
  await setSessionCookie(token, expiresAt);

  logger.info("customer signed up", { userId: user.id, email });

  return NextResponse.json({
    ok: true,
    user: { id: user.id, email: user.email },
    requires_email_confirmation: false,
  });
}
