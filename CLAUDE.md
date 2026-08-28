# MEME Store — Claude Code Project Knowledge

## What This Project Is
Next.js 16 e-commerce store for MEME (Egyptian fashion brand). Migrated off
Vercel + Supabase onto a self-hosted VPS (Docker Compose). Stack:
- **Framework**: Next.js 16 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS v4
- **Database**: self-hosted Postgres via Drizzle ORM
- **Auth**: custom session system (email/password + Google OAuth) — no third-party auth provider
- **Storage**: self-hosted MinIO (S3-compatible)
- **Rate limiting / caching**: Redis + Nginx `proxy_cache`
- **State**: Zustand with localStorage persistence
- **Payments**: Stripe + Cash on Delivery
- **Hosting**: self-hosted VPS, Docker Compose, deployed via GitHub Actions → SSH → git pull
- **Package manager**: npm (bun.lock removed — Docker build uses npm/package-lock.json)

**Full details live in `docs/` — read these before making infra/auth/DB
changes, and update them in the same change if you alter that architecture:**
- `docs/ARCHITECTURE.md` — target-state system design (DB, auth, storage, caching, checkout)
- `docs/VPS_DEPLOYMENT.md` — how to operate the VPS stack (deploy, rollback, certs, backups)
- `docs/MIGRATION_RUNBOOK.md` — historical Supabase→VPS cutover procedure (archive once cutover is verified complete)

## Directory Map
```
src/
  app/
    admin/          ← Admin dashboard (protected, /admin/login gate)
    api/
      admin/        ← Protected API routes (requireAdmin guard)
      auth/         ← Session-based auth (login, signup, session, signout, google)
      products/     ← Public product listing API (Nginx-cached)
      categories/   ← Public categories API
      checkout/     ← Checkout flow (transactional order creation)
      stripe/       ← Stripe webhooks
      health/       ← Docker healthcheck endpoint
    auth/callback/  ← Google OAuth callback (customers + admin)
    product/[slug]/ ← ISR product pages (revalidate: 300s)
    collection/[slug]/ ← ISR collection pages (revalidate: 600s)
    shop/           ← Client-side shop with filters
    account/        ← Customer account
    checkout/       ← Checkout flow
    returns/        ← Customer Returns & Refunds page
  components/
    admin/          ← Admin UI (shell, sections, product forms)
    layout/         ← Header, Footer, SiteShell, AnnouncementBar
    home/           ← Homepage sections
    shop/           ← ProductCard, CartDrawer, etc.
    providers/      ← Zustand stores (product-store, homepage-store, ui-provider)
    ui/             ← shadcn/ui components
  lib/
    db/
      schema/           ← Drizzle schema (source of truth for the DB)
      client.ts         ← pooled `db` instance
      config.ts         ← isDatabaseConfigured()
      to-snake-case.ts  ← camelCase (Drizzle) -> snake_case (frontend contract) converter
    auth/
      session.ts        ← opaque session tokens (hash stored, cookie holds raw token)
      password.ts       ← Argon2 hashing
      google-oauth.ts   ← hand-rolled Google OAuth2 PKCE client
      oauth-flow.ts     ← state/verifier/next cookies across the OAuth redirect
      identity.ts       ← resolves Google login -> users/oauth_accounts/customers rows
      admin-guard.ts    ← requireAdmin()/requireAdminRole() for /api/admin/*
      customer-guard.ts ← requireCustomerSession() for customer-owned data
      middleware.ts     ← Node-runtime /admin/* page gate (real DB check, not Edge)
      simple-auth.ts    ← cookie-name constants + client-side UI-hint helpers only
    storage/client.ts   ← MinIO client (products/homepage/returns buckets)
    rate-limit/         ← Redis-backed limiter (rate-limiter-flexible)
    checkout/server.ts  ← transactional order creation
    api/products.ts     ← DB↔Store mappers (dbProductToStore, storeProductToDb)
    email/index.ts      ← Resend email integration
    i18n.ts             ← EN/AR translations
    format.ts           ← Price formatting (EGP)
    demo-store.ts       ← Seed data fallback when DATABASE_URL not configured
  middleware.ts     ← Node-runtime middleware (delegates to lib/auth/middleware.ts)
data/products.ts    ← Seed product catalog (fallback)
drizzle/migrations/ ← Generated + one hand-written SQL migration (Postgres functions/triggers)
deploy/
  nginx/meme-eg.store ← reverse proxy + TLS + micro-cache config
  deploy.sh              ← git-pull deploy script, run on the VPS
docker-compose.yml        ← production stack
docker-compose.dev.yml    ← local dev (postgres/redis/minio only)
Dockerfile                ← multi-stage build (deps → builder → migrate/runner)
scripts/migrate-from-supabase/ ← one-time export/import scripts (see MIGRATION_RUNBOOK.md)
```

## Key Patterns

### Admin Auth
- Google OAuth + `admin_allowed_emails` whitelist is the real production
  auth path — see `docs/ARCHITECTURE.md`'s Auth section for the full flow.
- A password login (`admin`/`admin123`) exists ONLY outside production
  (`NODE_ENV !== "production"` — hard-gated in `simple-auth.ts`, not just
  by convention) and, when used, creates a real session against a real
  `staff_profiles` row — there is exactly one code path through
  `requireAdmin()`, no separate "hardcoded identity" branch.
- All `/api/admin/*` routes MUST call `requireAdmin()`/`requireAdminRole()`
  before doing anything — this has been missed before (found and fixed
  during the migration in `admin/homepage`, `admin/reviews`,
  `admin/homepage-image`, `admin/debug-upload`, `admin/coupons/[id]`); if
  you add a new admin route, don't repeat that mistake.
- Admin panel lives at `/admin`, hidden from nav (no public links).

### Data Flow & Performance
- Products fetched client-side via Zustand `useProductStore`, which calls
  `/api/products` on mount (`refreshFromServer()`, 60s staleness check).
- Public `/api/products`, `/api/homepage`, `/api/categories` are cached by
  Nginx `proxy_cache` (see `deploy/nginx/meme-eg.store`) — the old
  Vercel-specific `CDN-Cache-Control`/`Vercel-CDN-Cache-Control` headers
  were dropped, only standard `Cache-Control` remains.
- Zustand persists to localStorage in demo mode only (`isBackendConfigured()`
  in `src/lib/config/backend.ts` — always `true` for a self-hosted deploy,
  kept as a function so the old demo-mode branches stay easy to find).
- Product/homepage/return images go through `sharp` (resize + WebP) then
  upload to MinIO via `src/lib/storage/client.ts`.

### API response shape contract
Drizzle returns camelCase row objects, but the frontend still expects
snake_case (matching the old raw Supabase rows) — routes that pass through
raw DB rows use `toSnakeCase`/`toSnakeCaseArray`
(`src/lib/db/to-snake-case.ts`) before returning JSON. Routes that
hand-build a specific frontend type (like `/api/products` building the
`Product` shape) don't need this — check which pattern an existing
neighboring route uses before adding a new one.

### No more Row Level Security
Every Supabase RLS policy is now an explicit condition in application
code — a missing filter is a silent data leak, not a crash. See
`docs/ARCHITECTURE.md`'s Database section before writing a new query that
touches customer-owned or draft/unpublished data.

### Database Tables (Postgres via Drizzle — see `src/lib/db/schema/`)
- `products` / `product_images` / `categories` / `collections` / `reviews`
- `orders` / `order_items` / `coupons` / `returns` / `wishlists`
- `customers` / `addresses`
- `users` / `sessions` / `oauth_accounts` / `staff_profiles` / `admin_allowed_emails`
- `homepage_settings` (singleton row) / `analytics_events`

### Environment Variables
See `.env.example` for the full current list (Postgres, Redis, MinIO,
Google OAuth, Stripe, Resend). No more `NEXT_PUBLIC_SUPABASE_*` /
`SUPABASE_SERVICE_ROLE_KEY` — those were removed along with `@supabase/*`
packages.

### i18n
- Bilingual: English + Arabic
- RTL support via `useLangDir()` hook
- Translation keys in `src/lib/i18n.ts`

## Where to Find Things Fast
| Task | File |
|---|---|
| Change admin dev-login credentials | `src/lib/auth/simple-auth.ts` |
| Add/edit API route guard | `src/lib/auth/admin-guard.ts` / `customer-guard.ts` |
| DB schema changes | `src/lib/db/schema/*.ts`, then `npm run db:generate` |
| Product CRUD UI | `src/components/admin/product-form-view.tsx` |
| Homepage sections config | `src/components/providers/homepage-store.ts` |
| Store settings (name, phone, etc) | `src/lib/store-settings-store.ts` |
| Nav links / header | `src/components/layout/header.tsx` |
| Footer | `src/components/layout/footer.tsx` |
| Cart state | `src/components/providers/ui-provider.tsx` |
| Price formatting | `src/lib/format.ts` |
| Site-wide middleware | `src/middleware.ts` + `src/lib/auth/middleware.ts` |
| Email sending | `src/lib/email/index.ts` |
| VPS deploy/rollback/backups | `docs/VPS_DEPLOYMENT.md` |
| Nginx / TLS / caching config | `deploy/nginx/meme-eg.store` |

## Claude Code Specific Instructions
- **DO NOT** run `npm run build` blindly. Next.js 16 app router builds can be slow. Prefer using `npx tsc --noEmit` to typecheck.
- **DO NOT** write code outside of `src/` unless it is a config file (like `next.config.ts`, `tailwind.config.ts`, or the `deploy/`/`docker-compose*.yml`/`Dockerfile` infra files).
- When fixing UI bugs, prioritize editing the reusable shadcn/ui components in `src/components/ui/` or the specific page/component.
- Always check this file first to understand the architecture instead of running a full repo scan.
- **If you change the DB schema, auth flow, storage handling, or deploy/infra config, update the matching file in `docs/` in the same change** — `ARCHITECTURE.md` and `VPS_DEPLOYMENT.md` are load-bearing references other sessions rely on to avoid re-scanning the whole repo from scratch.
