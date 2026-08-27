import crypto from "crypto";

/**
 * Hand-rolled Google OAuth2 (PKCE + state) client. Not using the `arctic`
 * library here — it was deprecated/marked "no longer supported" on npm
 * during this migration, and Google's OAuth endpoints are stable enough
 * that a small purpose-built module is lower risk than a second
 * unmaintained auth dependency.
 */

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo";

function base64url(input: Buffer): string {
  return input.toString("base64url");
}

export function generateState(): string {
  return base64url(crypto.randomBytes(32));
}

export function generateCodeVerifier(): string {
  return base64url(crypto.randomBytes(32));
}

function codeChallengeFromVerifier(verifier: string): string {
  return base64url(crypto.createHash("sha256").update(verifier).digest());
}

export function createGoogleAuthorizationUrl(params: {
  redirectUri: string;
  state: string;
  codeVerifier: string;
  scopes?: string[];
}): string {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) throw new Error("GOOGLE_CLIENT_ID is not set");

  const url = new URL(GOOGLE_AUTH_URL);
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", params.redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", (params.scopes ?? ["openid", "email", "profile"]).join(" "));
  url.searchParams.set("state", params.state);
  url.searchParams.set("code_challenge", codeChallengeFromVerifier(params.codeVerifier));
  url.searchParams.set("code_challenge_method", "S256");
  url.searchParams.set("access_type", "online");
  url.searchParams.set("prompt", "select_account");
  return url.toString();
}

export interface GoogleUser {
  sub: string;
  email: string;
  email_verified: boolean;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
}

export async function exchangeGoogleCode(params: {
  code: string;
  redirectUri: string;
  codeVerifier: string;
}): Promise<GoogleUser> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error("Google OAuth is not configured");

  const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code: params.code,
      code_verifier: params.codeVerifier,
      redirect_uri: params.redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenRes.ok) {
    throw new Error(`Google token exchange failed: ${tokenRes.status} ${await tokenRes.text()}`);
  }
  const tokens = (await tokenRes.json()) as { access_token: string };

  const userRes = await fetch(GOOGLE_USERINFO_URL, {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  if (!userRes.ok) {
    throw new Error(`Google userinfo fetch failed: ${userRes.status}`);
  }
  return (await userRes.json()) as GoogleUser;
}

export function isGoogleOAuthConfigured(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID) && Boolean(process.env.GOOGLE_CLIENT_SECRET);
}
