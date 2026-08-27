import { NextResponse } from "next/server";
import { exchangeGoogleCode } from "@/lib/auth/google-oauth";
import { readAndClearOAuthFlowCookies } from "@/lib/auth/oauth-flow";
import { findOrCreateUserFromGoogle, ensureCustomerForUser, parseGoogleName } from "@/lib/auth/identity";
import { createSession, setSessionCookie } from "@/lib/auth/session";
import { logger } from "@/lib/logger";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const returnedState = searchParams.get("state");

  const { state, codeVerifier, next } = await readAndClearOAuthFlowCookies();

  if (!code || !state || !codeVerifier || state !== returnedState) {
    logger.warn("OAuth callback: invalid state or missing code");
    return NextResponse.redirect(`${origin}/account?error=auth-failed`);
  }

  try {
    const redirectUri = `${origin}/auth/callback`;
    const googleUser = await exchangeGoogleCode({ code, redirectUri, codeVerifier });

    if (!googleUser.email) {
      throw new Error("Google account has no email");
    }

    const user = await findOrCreateUserFromGoogle(googleUser);

    // Admin login flow — skip customer upsert, go straight to the whitelist check.
    if (next === "/api/admin/auth/check") {
      const { token, expiresAt } = await createSession(user.id);
      await setSessionCookie(token, expiresAt);
      return NextResponse.redirect(`${origin}/api/admin/auth/check`);
    }

    // Normal customer login — ensure a customers row exists.
    const { firstName, lastName } = parseGoogleName(googleUser);
    await ensureCustomerForUser(user.id, googleUser.email, { firstName, lastName });

    const { token, expiresAt } = await createSession(user.id);
    await setSessionCookie(token, expiresAt);

    logger.info("customer signed in via Google", { userId: user.id });
    return NextResponse.redirect(`${origin}${next}`);
  } catch (e) {
    logger.warn("OAuth callback failed", { error: e instanceof Error ? e.message : String(e) });
    return NextResponse.redirect(`${origin}/account?error=auth-failed`);
  }
}
