/**
 * GET /api/auth/google?next=/account
 *
 * Starts the Google OAuth (PKCE) flow. `next` is where the callback
 * redirects afterward on success — used for both the normal customer login
 * (`/account`) and the admin login (`/api/admin/auth/check`, which itself
 * checks the whitelist and redirects to `/admin`).
 */

import { NextRequest, NextResponse } from "next/server";
import {
  createGoogleAuthorizationUrl,
  generateCodeVerifier,
  generateState,
  isGoogleOAuthConfigured,
} from "@/lib/auth/google-oauth";
import { setOAuthFlowCookies } from "@/lib/auth/oauth-flow";
import { getSiteOrigin } from "@/lib/site-url";

export async function GET(req: NextRequest) {
  if (!isGoogleOAuthConfigured()) {
    return NextResponse.json({ error: "Google OAuth is not configured." }, { status: 503 });
  }

  const next = req.nextUrl.searchParams.get("next") ?? "/account";
  const state = generateState();
  const codeVerifier = generateCodeVerifier();
  const redirectUri = `${getSiteOrigin()}/auth/callback`;

  await setOAuthFlowCookies(state, codeVerifier, next);

  const url = createGoogleAuthorizationUrl({ redirectUri, state, codeVerifier });
  return NextResponse.redirect(url);
}
