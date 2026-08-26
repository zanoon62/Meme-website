# MEME Store — Claude Code Project Knowledge

## What This Project Is
Next.js 16 e-commerce store for MEME (Egyptian fashion brand). Stack:
- **Framework**: Next.js 16 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS v4
- **Database**: Supabase (PostgreSQL) + Supabase Storage for images
- **Auth**: Simple cookie auth (meme_admin_session) + Supabase auth
- **State**: Zustand with localStorage persistence
- **Payments**: Stripe + Cash on Delivery
- **Hosting**: Vercel free tier (region: iad1)
- **Package manager**: bun (but npm/node also work)

## Directory Map
```
src/
  app/
    admin/          ← Admin dashboard (protected, /admin/login gate)
    api/
      admin/        ← Protected API routes (requireAdmin guard)
      products/     ← Public product listing API (Edge Cached)
      categories/   ← Public categories API
      checkout/     ← Checkout flow
      stripe/       ← Stripe webhooks
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
    auth/
      simple-auth.ts    ← Cookie-based admin auth
      admin-guard.ts    ← requireAdmin() for API routes
    supabase/
      browser.ts        ← Client-side Supabase client
      server.ts         ← Server-side + service role clients
      middleware.ts     ← Auth middleware (skips public routes)
      database.types.ts ← Generated Supabase types
    api/products.ts     ← DB↔Store mappers (dbProductToStore, storeProductToDb)
    rate-limit/         ← In-memory token bucket limiter
    email/index.ts      ← Resend email integration
    i18n.ts             ← EN/AR translations
    format.ts           ← Price formatting (EGP)
    demo-store.ts       ← Seed data fallback when Supabase not configured
  middleware.ts     ← Edge middleware (auth gate, skips public routes)
data/products.ts    ← Seed product catalog (fallback)
```

## Key Patterns

### Admin Auth
- Cookie `meme_admin_session=true` → simple hardcoded admin
- Supabase `staff_profiles` table → role-based staff auth
- All `/api/admin/*` routes call `requireAdmin()` before doing anything
- Admin panel lives at `/admin`, hidden from nav (no public links)

### Data Flow & Performance
- Products fetched client-side via Zustand `useProductStore`
- `StoreProvider` calls `refreshFromServer()` on mount (with 60s staleness check)
- Public `/api/products` and `/api/homepage` are edge-cached (s-maxage=300, swr=3600) to minimize Supabase egress
- Zustand persists to localStorage in demo mode only
- Product images are uploaded directly to Supabase Storage via `/api/admin/product-image` and converted to WebP

### Supabase Tables
- `products` — main product table
- `product_images` — images with sort_order
- `categories` — product categories
- `collections` — product collections
- `orders` / `order_items` — order management
- `customers` — customer profiles
- `staff_profiles` — admin/staff roles
- `homepage_settings` — admin-configurable homepage content
- `reviews` — product reviews
- `coupons` — discount codes
- `returns` — customer return requests

### Environment Variables
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — public anon key
- `SUPABASE_SERVICE_ROLE_KEY` — bypasses RLS, server-only
- `STRIPE_SECRET_KEY` / `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `RESEND_API_KEY` — for sending transactional emails
- `NEXT_PUBLIC_SITE_URL` — for sitemap/OG

### i18n
- Bilingual: English + Arabic
- RTL support via `useLangDir()` hook
- Translation keys in `src/lib/i18n.ts`

## Where to Find Things Fast
| Task | File |
|---|---|
| Change admin credentials | `src/lib/auth/simple-auth.ts` |
| Add/edit API route guard | `src/lib/auth/admin-guard.ts` |
| Product CRUD UI | `src/components/admin/product-form-view.tsx` |
| Homepage sections config | `src/components/providers/homepage-store.ts` |
| Store settings (name, phone, etc) | `src/lib/store-settings-store.ts` |
| Nav links / header | `src/components/layout/header.tsx` |
| Footer | `src/components/layout/footer.tsx` |
| Cart state | `src/components/providers/ui-provider.tsx` |
| Price formatting | `src/lib/format.ts` |
| Site-wide middleware | `src/middleware.ts` + `src/lib/supabase/middleware.ts` |
| Email sending | `src/lib/email/index.ts` |

## Claude Code Specific Instructions
- **DO NOT** run `npm run build` blindly. Next.js 16 app router builds can be slow. Prefer using `npx tsc --noEmit` to typecheck.
- **DO NOT** write code outside of `src/` unless it is a config file (like `next.config.ts`, `tailwind.config.ts`).
- When fixing UI bugs, prioritize editing the reusable shadcn/ui components in `src/components/ui/` or the specific page/component.
- Always check this file first to understand the architecture instead of running a full repo scan.
