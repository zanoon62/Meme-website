# Architecture

Living document — if you change the DB schema, auth flow, storage handling,
or deploy/infra config, update this file in the same change. This is the
target-state architecture after the Supabase/Vercel → self-hosted VPS
migration; see `docs/MIGRATION_RUNBOOK.md` for the historical cutover
procedure.

## Stack

- **Framework**: Next.js 16 (App Router), React 19, TypeScript
- **Database**: self-hosted Postgres via **Drizzle ORM** (`src/lib/db/`)
- **Auth**: custom session system (`src/lib/auth/`) — email/password +
  Google OAuth, no third-party auth provider
- **Storage**: self-hosted **MinIO** (S3-compatible) via `src/lib/storage/client.ts`
- **Rate limiting**: Redis-backed (`src/lib/rate-limit/`, via `rate-limiter-flexible`)
- **Caching**: Next.js ISR for pages; Nginx `proxy_cache` for the three
  read-heavy public JSON endpoints (`/api/products`, `/api/homepage`,
  `/api/categories`)
- **Payments**: Stripe + Cash on Delivery
- **Realtime**: standalone Socket.io service (`realtime/`) fed by Redis
  pub/sub — see "Realtime" below
- **Hosting**: self-hosted VPS via Docker Compose (see `docs/VPS_DEPLOYMENT.md`)

## Database (`src/lib/db/`)

- `schema/*.ts` — the single source of truth for the schema (Drizzle,
  TypeScript). `enums.ts`, `catalog.ts` (products/categories/collections/
  reviews), `commerce.ts` (customers/orders/coupons/returns/wishlists),
  `auth.ts` (users/sessions/oauth_accounts/staff_profiles/admin_allowed_emails),
  `content.ts` (homepage_settings), `analytics.ts`, `relations.ts`.
- `drizzle/migrations/` — generated SQL migrations (`drizzle-kit generate`),
  plus one hand-written custom migration (`0001_functions_and_triggers.sql`)
  for the two native Postgres functions (`decrement_inventory`,
  `generate_order_number`) and the `updated_at` triggers, which aren't
  expressible in Drizzle's schema DSL.
- `client.ts` — single pooled `db` instance (`postgres.js` driver), replaces
  the old `createSupabaseServerClient`/`ServiceClient`/`StaticClient` split.
  There's no RLS-vs-service-role distinction anymore — one client,
  authorization enforced in application code (see below).
- `to-snake-case.ts` — Drizzle returns camelCase row objects; the frontend
  still expects snake_case (matching the old raw Supabase row shape) for
  routes that pass through raw rows. `toSnakeCase`/`toSnakeCaseArray`
  convert top-level keys only — jsonb column contents are never touched.
- `config.ts` — `isDatabaseConfigured()`, the demo/seed-data fallback gate
  (mirrors the old `isSupabaseConfigured()`).

**No more Row Level Security.** Every policy that used to live in
`supabase/schema.sql` is now an explicit condition in application code:
- Public-read filters (`products.status='active'`, `is_active`,
  `is_published`, etc.) must be applied explicitly in every storefront
  query — there's no RLS backstop, a missing filter is a silent data leak.
- Customer-owned-row access goes through `requireCustomerSession()`
  (`src/lib/auth/customer-guard.ts`), which resolves the session to a real
  `customerId` — every customer-scoped query must filter by that, never a
  client-supplied id.
- Admin/staff access goes through `requireAdmin()`/`requireAdminRole()`
  (`src/lib/auth/admin-guard.ts`).

## Auth (`src/lib/auth/`)

Custom session-based auth, not a third-party library (Lucia is
discontinued; NextAuth/Auth.js v5's Edge-first session model doesn't fit a
Node-only Postgres driver in middleware; `arctic` was deprecated on npm
during this migration) — Google OAuth is hand-rolled in
`google-oauth.ts` (PKCE + state, using only `fetch` against Google's stable
OAuth endpoints).

- `session-core.ts` — the framework-agnostic session logic (token
  create/validate/invalidate, no `next/headers`). Split out of `session.ts`
  so the standalone `realtime/` service (a plain Node process, not a
  Next.js request context) can validate sessions without pulling in
  `next/headers`. Opaque session tokens; only a SHA-256 hash is stored in
  the `sessions` table (the Lucia-recommended pattern), the raw token lives
  solely in an httpOnly cookie (`meme_session`).
- `session.ts` — re-exports `session-core.ts` plus the `next/headers`-bound
  helpers (`setSessionCookie`, `getCurrentSession`, `signOutCurrentSession`).
  Everything under `src/app/` should keep importing from here, not
  `session-core.ts` directly.
- `password.ts` — Argon2 hashing via `@node-rs/argon2`.
- `google-oauth.ts` + `oauth-flow.ts` — PKCE flow; `oauth-flow.ts` carries
  `state`/`codeVerifier`/`next` across the redirect via short-lived cookies.
- `identity.ts` — resolves a Google login to a `users` row (via
  `oauth_accounts`, falling back to email match), ensures a `customers` row.
- `admin-guard.ts` — `requireAdmin()`/`requireAdminRole()`. Resolves the
  session to a real `staff_profiles` row every time — **there is exactly
  one path through this function**, for both real Google-authenticated
  staff and the (NODE_ENV-gated, non-production-only) dev password login.
  This fixed a real bug in the pre-migration code, where the hardcoded dev
  cookie and every real admin login both collapsed to the same literal
  `userId: "admin-hardcoded"`, losing individual admin identity entirely.
- `customer-guard.ts` — `requireCustomerSession()`, the customer
  equivalent, replacing the RLS policy that used to enforce
  `customer_id in (select id from customers where auth_user_id = auth.uid())`.
- `simple-auth.ts` — now just cookie-name constants and client-side UI-hint
  helpers (`isAdminLoggedInClient()`, `getAdminEmailClient()`); the actual
  dev-only password credential check (`validateAdminCredentials`) hard-fails
  outside `NODE_ENV !== "production"` regardless of input.
- `middleware.ts` (+ root `src/middleware.ts`) — gates `/admin/*` page
  routes only, on the **Node.js middleware runtime** (not Edge — Next 16
  supports this), doing a real Postgres-backed session+staff check. All
  other routes (storefront, `/api/*`) skip middleware entirely — API routes
  self-protect via `requireAdmin()`/`requireCustomerSession()` regardless.

Admin login is Google OAuth + the `admin_allowed_emails` whitelist table,
managed by the super-admin (`SUPER_ADMIN_EMAIL` in `simple-auth.ts`) via
the admin panel. Whitelisting auto-provisions a `staff_profiles` row on
first successful login (role `admin` for the super-admin email, `staff`
otherwise) — but does NOT silently reactivate a staff account an admin
explicitly deactivated (`isActive: false` persists even if the email is
still whitelisted).

## Storage (`src/lib/storage/client.ts`)

MinIO (S3-compatible), three buckets: `products`, `homepage`, `returns`.
Upload routes (`api/admin/product-image`, `api/admin/homepage-image`,
`api/returns/image-upload`) keep the original `sharp`-resize-to-WebP
pipeline unchanged, only the upload client changed. `ensureBucket()` is
idempotent (creates the bucket + sets a public-read policy on first use).

Public URLs are built from `MINIO_PUBLIC_URL`, which in production points
at Nginx's `/media/` proxy (`deploy/nginx/meme-eg.store`), not directly
at MinIO's port — keeps TLS/caching/logging centralized in one reverse
proxy layer.

Return-photo uploads are now **server-mediated**
(`/api/returns/image-upload`) instead of the old direct-from-browser
Supabase Storage upload — there's no bucket-level RLS equivalent for
self-hosted MinIO, so this goes through a normal authenticated API route.

## Rate limiting & caching

`src/lib/rate-limit/index.ts` — Redis-backed via `rate-limiter-flexible`
(falls back to an in-memory limiter if `REDIS_URL` isn't set, same
"degrades gracefully" pattern as the DB/storage config checks). Same
limiter names/limits as before (`auth`, `admin`, `checkout`, `public`).
Call sites `await` the check now (a Redis round-trip is inherently async).

Page-level ISR (`export const revalidate` on product/collection pages)
needs no changes — works natively under `next start`/standalone output.
The three public JSON endpoints (`/api/products`, `/api/homepage`,
`/api/categories`) emit standard `Cache-Control: s-maxage=...` headers;
Nginx `proxy_cache` (configured in `deploy/nginx/meme-eg.store`) is what
actually caches them now, replacing Vercel's edge cache
(`Vercel-CDN-Cache-Control` headers were dropped — they do nothing off Vercel).

## Checkout (`src/lib/checkout/server.ts`)

`createOrder()` runs as a single real Postgres transaction (order insert,
order_items insert, per-line inventory decrement via the
`decrement_inventory()` Postgres function, coupon usage increment, customer
stats update) — replacing the old Supabase-JS version, which had no real
multi-statement transaction and manually rolled back the order row on
item-insert failure, plus a manual "if the RPC errors, fall back to a racy
read-then-write" branch. A real transaction makes both unnecessary. On success it fires
fire-and-forget realtime events (`order.created`, and `product.low_stock`
per line that crosses its threshold inside the same transaction) — see
"Realtime" below. These are published only after the transaction commits,
and a publish failure never affects the checkout response.

## Realtime (`realtime/`, `src/lib/realtime/publish.ts`)

A standalone Socket.io service, deliberately **not** part of the Next.js
app process — a crash or slow client in the realtime path must never take
down checkout/admin/storefront. Two halves:

- **Publish side** (`src/lib/realtime/publish.ts`, runs inside the Next.js
  app): `publishRealtimeEvent(event, payload)` does a fire-and-forget
  `redis.publish("meme:<event>", JSON.stringify(payload))`. Never throws —
  callers always `.catch(() => {})` it. Current emitters: order creation
  and low-stock crossing (`src/lib/checkout/server.ts`), order status
  change (`src/app/api/admin/orders/[id]/route.ts`), return submission
  (`src/app/api/returns/route.ts`).
- **Delivery side** (`realtime/`, a separate Node process/container):
  `server.ts` starts a Socket.io server on `REALTIME_PORT` (default 4001)
  at path `/socket.io/`. `redis-sub.ts` subscribes to the `meme:*` channels
  and re-emits each to the `admin` room, plus to `customer:<id>` for
  `order.status_changed`. `auth.ts` authenticates each socket handshake by
  reading the same `meme_session` cookie the rest of the app uses,
  validating it via `session-core.ts` (not `session.ts` — no
  `next/headers` in a plain Node process), then joining the socket to the
  `admin` room (if the user has an active `staff_profiles` row) and/or
  `customer:<customerId>` room. Auth failure is never a hard error — the
  socket just joins no rooms and receives nothing.
- Runs as its own Docker Compose service (`realtime/Dockerfile`, reuses the
  root `package.json`/`node_modules` rather than a second dependency tree),
  published to `127.0.0.1:4002` and proxied by the system Nginx at
  `/socket.io/` with the WebSocket `Upgrade` headers and a long
  `proxy_read_timeout`. Deploys as best-effort — see
  `docs/VPS_DEPLOYMENT.md` — a broken realtime service never fails or rolls
  back the main app deploy.

## Directory map (updated)

```
src/
  lib/
    db/            ← Drizzle client, schema, query helpers, snake_case converter
    auth/           ← session (+ session-core), password, Google OAuth, admin/customer guards
    storage/        ← MinIO client
    rate-limit/      ← Redis-backed limiter
    checkout/       ← order creation (transactional)
    realtime/       ← publish.ts — fire-and-forget Redis publish side
realtime/            ← standalone Socket.io + Redis subscriber service (own Dockerfile)
deploy/
  nginx/meme-eg.store  ← reverse proxy + TLS + micro-cache config
  deploy.sh              ← git-pull-based deploy script, run on the VPS
.github/workflows/deploy.yml ← SSHes into the VPS and runs deploy.sh on push to main
docker-compose.yml       ← production stack (app, postgres, redis, minio — NOT nginx/certbot, those are the shared system Nginx, see docs/VPS_DEPLOYMENT.md)
docker-compose.dev.yml   ← local dev only (postgres, redis, minio)
Dockerfile               ← multi-stage build (deps → builder → migrate/runner)
```

See `CLAUDE.md`'s directory map for everything unchanged by this migration
(admin UI, storefront components, i18n, etc.).
