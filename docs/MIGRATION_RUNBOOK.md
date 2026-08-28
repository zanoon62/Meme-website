# Migration Runbook: Supabase/Vercel → VPS

This is the Phase 6/7 cutover procedure. Unlike `ARCHITECTURE.md` and
`VPS_DEPLOYMENT.md`, this document can be marked historical/archived once
cutover is complete and verified — it describes a one-time transition, not
the ongoing system.

## Pre-cutover snapshot (recorded during planning, re-verify before cutover)

Live Supabase project at time of migration planning: 19 products, 27
product_images (23 of 27 stored as base64 `data:image` strings directly in
the row — the import script converts these to real MinIO objects), 3
orders, 5 customers, 1 staff_profiles row, 4 whitelisted admin emails, 1
returns row, 0 coupons.

## Status

**Data migration already executed and verified** (2026-08-27): all 19
products, 27 product_images (23 converted from base64 to real MinIO
objects — verified `0` remaining base64 rows), 5 customers, 3 orders/order_items,
1 staff_profile, 4 admin_allowed_emails, 1 homepage_settings, 1 returns
row, and 5 users were exported from the live Supabase project and imported
into a **persistent** (not throwaway) Postgres+Redis+MinIO stack now
running on the VPS under the isolated `meme-store` Docker Compose project.
Row counts verified to match exactly; a converted image was fetched
directly from MinIO and confirmed to load. Real secrets were generated and
written to `/home/ubuntu/apps/meme-store/.env` on the VPS (chmod 600).

**Known follow-up before going live**: the migrated `product_images.url`
and `returns.image_url` values currently point at `http://127.0.0.1:19000/...`
— the address of the temporary SSH tunnel used to run the import from a
local machine. Once the real domain is set up and Nginx's `/media/` proxy
is live (`deploy/nginx/meme-store.conf`), run this one-time rewrite:

```sql
UPDATE product_images SET url = replace(url, 'http://127.0.0.1:19000', 'https://meme-eg.store/media') WHERE url LIKE 'http://127.0.0.1:19000%';
UPDATE returns SET image_url = replace(image_url, 'http://127.0.0.1:19000', 'https://meme-eg.store/media') WHERE image_url LIKE 'http://127.0.0.1:19000%';
```

(via `docker compose -p meme-store exec -T postgres psql -U meme meme -c "..."` on the VPS, or through any Postgres client tunneled the same way this migration was run.)

The `app`/`nginx` containers have NOT been deployed yet — only the data
layer (postgres/redis/minio) is live so far. The steps below (dry run,
delta sync, cutover) describe the process this run followed and what's
still ahead for the full site to go live.

## 1. Dry run (mandatory — do this before touching anything production-adjacent)

```bash
# Export from the live Supabase project
SUPABASE_URL=https://dppiofhehylinmsrxeer.supabase.co \
SUPABASE_SERVICE_ROLE_KEY=<service_role_key> \
npm run migrate:export

# Bring up a throwaway local Postgres + MinIO
docker compose -f docker-compose.dev.yml up -d

# Run migrations against it, then import
DATABASE_URL=postgres://meme:meme_dev@localhost:5432/meme_dev npm run db:migrate
DATABASE_URL=postgres://meme:meme_dev@localhost:5432/meme_dev \
MINIO_ENDPOINT=localhost MINIO_PORT=9000 MINIO_ACCESS_KEY=meme_dev MINIO_SECRET_KEY=meme_dev_secret \
MINIO_PUBLIC_URL=http://localhost:9000 \
npm run migrate:import
```

Then verify:
- Row counts match the snapshot above (`select count(*) from products`, etc.)
- Spot-check a handful of products/orders/customers by hand
- Confirm the 23 base64 images actually became real MinIO URLs (`select
  count(*) from product_images where url like 'data:image%'` should be 0)
- Confirm `admin_allowed_emails` has all 4 entries and the super-admin
  (`zanoon.bis@gmail.com`) can still log in and gets `role: admin`

## 2. Final delta sync (right before cutover)

The store keeps taking orders on the old (Vercel/Supabase) deployment while
you're testing the dry run above. Re-run the export/import once more,
immediately before flipping DNS, to catch anything written since the first
pass — both scripts are idempotent (`onConflictDoNothing`), so re-running
them is always safe and only picks up genuinely new rows.

## 3. Password-auth customers

Supabase doesn't expose usable password hashes via any export surface. The
import script sets `passwordHash: null` for every migrated user. Any
customer who used email+password (not Google) needs a password reset
before they can log in again post-migration. Since there's no
password-reset-email flow built yet, either:
- Build a minimal "forgot password" flow before cutover, or
- Manually message affected customers (check `select email from users
  where password_hash is null` post-import — Google-only users will also
  show null here, so cross-reference against `oauth_accounts` to isolate
  genuinely password-based accounts that need outreach)

## 4. Cutover checklist

1. Confirm the VPS stack is fully deployed and healthy (`docs/VPS_DEPLOYMENT.md`)
2. Run the final delta sync (§2)
3. Briefly disable checkout on the OLD (Vercel) deployment if possible, to
   avoid a last-second order landing in the old database after the sync
4. Update DNS at GoDaddy (A record → VPS IP)
5. **At the same moment**: update the Stripe webhook endpoint URL to the
   new domain, and disable/delete the old Vercel-pointed webhook endpoint.
   Never let both be active at once — Stripe delivering the same event to
   two independently-writing databases is the single biggest cutover risk
   (double-marks an order paid, double-decrements inventory, etc.)
6. Update the Google OAuth client's authorized redirect URI (Google Cloud
   Console → APIs & Services → Credentials) to
   `https://meme-eg.store/auth/callback`
7. Do one real end-to-end test purchase on the live VPS before considering
   Vercel fully retired
8. Keep the Supabase project alive, read-only (don't write to it anymore,
   but don't delete it), for **14 days** as a rollback/verification
   fallback — long enough to cover one full return-window cycle
   (`RETURN_WINDOW_DAYS` in `src/app/api/returns/route.ts`)

## 5. Post-cutover housekeeping (after the 14-day fallback window closes)

- Delete the Supabase project (or at minimum rotate/revoke its keys)
- Delete `vercel.json` and the old Vercel deployment
- Revisit the untracked stale files at the repo root (`temp_debug.js`,
  `wide-leg-vest-suit.json`, `products_debug.json`, `products_debug2.json`)
  and the root `Caddyfile` — confirm still unused, then delete
- Archive this document (it's historical from this point on)
