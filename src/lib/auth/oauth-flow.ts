import { cookies } from "next/headers";

/**
 * Short-lived cookies that carry OAuth flow state across the redirect to
 * Google and back. 10 minutes is generous for a login flow.
 */
const FLOW_COOKIE_MAX_AGE = 60 * 10;
const STATE_COOKIE = "meme_oauth_state";
const VERIFIER_COOKIE = "meme_oauth_verifier";
const NEXT_COOKIE = "meme_oauth_next";

export async function setOAuthFlowCookies(state: string, codeVerifier: string, next: string) {
  const cookieStore = await cookies();
  const opts = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: FLOW_COOKIE_MAX_AGE,
  };
  cookieStore.set(STATE_COOKIE, state, opts);
  cookieStore.set(VERIFIER_COOKIE, codeVerifier, opts);
  cookieStore.set(NEXT_COOKIE, next, opts);
}

export async function readAndClearOAuthFlowCookies(): Promise<{
  state: string | null;
  codeVerifier: string | null;
  next: string;
}> {
  const cookieStore = await cookies();
  const state = cookieStore.get(STATE_COOKIE)?.value ?? null;
  const codeVerifier = cookieStore.get(VERIFIER_COOKIE)?.value ?? null;
  const next = cookieStore.get(NEXT_COOKIE)?.value ?? "/account";

  cookieStore.set(STATE_COOKIE, "", { maxAge: 0, path: "/" });
  cookieStore.set(VERIFIER_COOKIE, "", { maxAge: 0, path: "/" });
  cookieStore.set(NEXT_COOKIE, "", { maxAge: 0, path: "/" });

  return { state, codeVerifier, next };
}
