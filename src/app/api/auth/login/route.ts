/**
 * POST /api/auth/login — customer email/password login.
 *
 * Body: { email, password }
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { verifyPassword } from "@/lib/auth/password";
import { createSession, setSessionCookie } from "@/lib/auth/session";
import { limiters } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

const LoginSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(1).max(128),
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

  const parsed = LoginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const email = parsed.data.email.toLowerCase().trim();

  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

  if (!user || !user.passwordHash) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  const valid = await verifyPassword(user.passwordHash, parsed.data.password);
  if (!valid) {
    logger.warn("login failed", { email });
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  const { token, expiresAt } = await createSession(user.id);
  await setSessionCookie(token, expiresAt);

  logger.info("customer signed in", { userId: user.id });
  return NextResponse.json({ ok: true, user: { id: user.id, email: user.email } });
}
