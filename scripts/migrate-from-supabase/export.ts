/**
 * Export every application table from the live Supabase project via its
 * REST API (PostgREST) — we only have the anon/service-role JWTs, not a
 * direct Postgres password, so this uses `fetch` rather than `pg`.
 *
 * Usage:
 *   SUPABASE_URL=https://xxxx.supabase.co \
 *   SUPABASE_SERVICE_ROLE_KEY=... \
 *   npx tsx scripts/migrate-from-supabase/export.ts
 *
 * Writes one JSON file per table to scripts/migrate-from-supabase/dump/.
 * Safe to re-run — each run overwrites the dump with a fresh export
 * (idempotent by design, not additive).
 */

import { writeFileSync, mkdirSync } from "fs";
import path from "path";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars first.");
  process.exit(1);
}

const TABLES = [
  "categories",
  "collections",
  "products",
  "product_images",
  "customers",
  "addresses",
  "orders",
  "order_items",
  "coupons",
  "reviews",
  "wishlists",
  "staff_profiles",
  "admin_allowed_emails",
  "homepage_settings",
  "returns",
] as const;

const DUMP_DIR = path.join(__dirname, "dump");

async function fetchAll(table: string): Promise<unknown[]> {
  const all: unknown[] = [];
  const pageSize = 1000;
  let offset = 0;

  for (;;) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=*&offset=${offset}&limit=${pageSize}`, {
      headers: {
        apikey: SERVICE_KEY!,
        Authorization: `Bearer ${SERVICE_KEY}`,
      },
    });
    if (!res.ok) {
      throw new Error(`GET ${table} failed: ${res.status} ${await res.text()}`);
    }
    const page = (await res.json()) as unknown[];
    all.push(...page);
    if (page.length < pageSize) break;
    offset += pageSize;
  }

  return all;
}

async function main() {
  mkdirSync(DUMP_DIR, { recursive: true });

  for (const table of TABLES) {
    try {
      const rows = await fetchAll(table);
      writeFileSync(path.join(DUMP_DIR, `${table}.json`), JSON.stringify(rows, null, 2));
      console.log(`exported ${table}: ${rows.length} rows`);
    } catch (e) {
      console.warn(`skipped ${table}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  // auth.users isn't exposed via PostgREST — fetch via the Admin API instead.
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users?per_page=1000`, {
      headers: { apikey: SERVICE_KEY!, Authorization: `Bearer ${SERVICE_KEY}` },
    });
    if (res.ok) {
      const data = (await res.json()) as { users: unknown[] };
      writeFileSync(path.join(DUMP_DIR, "auth_users.json"), JSON.stringify(data.users, null, 2));
      console.log(`exported auth_users: ${data.users.length} rows`);
    } else {
      console.warn(`auth admin users export failed: ${res.status}`);
    }
  } catch (e) {
    console.warn(`auth admin users export failed: ${e instanceof Error ? e.message : String(e)}`);
  }

  console.log(`\nDone. Dumps in ${DUMP_DIR}`);
}

main();
