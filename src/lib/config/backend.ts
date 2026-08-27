/**
 * Client-safe "is the backend configured" flag. Under Supabase this checked
 * for a public URL env var (so client code could tell demo/seed mode from
 * real-backend mode). Self-hosted Postgres has no client-safe equivalent —
 * DATABASE_URL must stay server-only — and a self-hosted deployment always
 * has a real database, so this is now an unconditional true. Kept as a
 * function (not inlined at call sites) so the old demo-mode branches stay
 * easy to find and remove later if desired.
 */
export function isBackendConfigured(): boolean {
  return true;
}
