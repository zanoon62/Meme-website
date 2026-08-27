import { NextResponse } from "next/server";

/**
 * GET /api/health — used by the Docker healthcheck and deploy.sh's
 * post-deploy verification. Intentionally does NOT touch the database —
 * a slow/degraded DB shouldn't flip the app container to "unhealthy" and
 * get killed by Docker; that failure mode should surface differently.
 */
export async function GET() {
  return NextResponse.json({ ok: true, time: new Date().toISOString() });
}
