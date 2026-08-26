# MEME Store — Project Knowledge Summary
# Read this INSTEAD of scanning files. 90% of questions answerable from here.

## What This Project Is
Next.js 16 e-commerce store for MEME (Egyptian fashion brand). Stack:
- **Framework**: Next.js 16 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS v4
- **Database**: Supabase (PostgreSQL) + Supabase Storage for images
- **Auth**: Simple cookie auth (meme_admin_session) + Supabase auth
- **State**: Zustand with localStorage persistence + SSR StoreInitializer hydration
- **Payments**: Stripe + Cash on Delivery
- **Hosting**: Vercel free tier (region: iad1)
- **Package manager**: bun (but npx/node also work)

## Directory Map
```
src/
  app/
    admin/          ← Admin dashboard (protected, /admin/login gate)
    api/
      admin/        ← Protected API routes (requireAdmin guard + cache revalidation)
      products/     ← Public product listing API (Edge Cached)
      categories/   ← Public categories API
      checkout/     ← Checkout flow (atomic inventory RPC)
      stripe/       ← Stripe webhooks
      returns/      ← Customer returns & refunds API
    product/[slug]/ ← ISR product pages (revalidate: 300s)
    collection/[slug]/ ← ISR collection pages (revalidate: 600s)
    shop/           ← Smart infinite scroll shop with filters & intersection observer
    account/        ← Customer account
    checkout/       ← Checkout flow
    returns/        ← Customer Returns & Refunds page
    wishlist/       ← Customer wishlist
  components/
    admin/          ← Admin UI (shell, sections, product forms)
    layout/         ← Header, Footer, SiteShell, AnnouncementBar
    home/           ← Homepage sections
    shop/           ← ProductCard, CartDrawer, etc.
    providers/      ← Zustand stores (product-store, homepage-store, ui-provider, store-initializer)
    ui/             ← shadcn/ui components
  lib/
    auth/
      simple-auth.ts    ← Cookie-based admin auth (admin/admin123)
      admin-guard.ts    ← requireAdmin() for API routes
    supabase/
      browser.ts        ← Client-side Supabase client
      server.ts         ← Server-side + service role clients
      middleware.ts     ← Auth middleware (skips public routes)
      database.types.ts ← Generated Supabase types
    api/
      products.ts       ← DB↔Store mappers (dbProductToStore, storeProductToDb)
      products-server.ts← Cached server-side fetcher for SSR (unstable_cache + tag 'products')
    checkout/
      server.ts         ← Atomic checkout & inventory decrement via decrement_inventory RPC
    rate-limit/         ← In-memory token bucket limiter
    email/index.ts      ← Resend email integration
    i18n.ts             ← EN/AR translations
    format.ts           ← Price formatting (EGP)
    shipping-store.ts   ← Egyptian governorates & shipping zones
    payment-store.ts    ← Payment methods configuration
    demo-store.ts       ← Seed data fallback when Supabase not configured
  middleware.ts     ← Edge middleware (auth gate, skips public routes)
supabase/
  migrations/       ← SQL migrations (returns table, atomic decrement_inventory RPC)
data/products.ts    ← Seed product catalog (fallback)
```

## Key Patterns

### Admin Auth
- Cookie `meme_admin_session=true` → simple hardcoded admin
- Supabase `staff_profiles` table → role-based staff auth
- All `/api/admin/*` routes call `requireAdmin()` before doing anything
- Admin panel lives at `/admin`, hidden from nav (no public links)

### Data Flow, SSR & Performance
- **Server Pre-fetching (Zero Loading Delay):** `RootLayout` (`src/app/layout.tsx`) pre-fetches products via `getCachedProductsServer` (`unstable_cache` with tag `'products'` and 60s TTL) and hydrates Zustand store via `StoreInitializer`.
- **On-Demand Cache Invalidation:** Admin operations (create/edit/delete product) automatically call `revalidateTag("products")` and `revalidatePath("/")` to update the catalog instantly across all visitors.
- **Smart Infinite Scroll:** Shop page (`src/app/shop/page.tsx`) renders products in batches via `IntersectionObserver` with smooth Framer Motion fade-ins.
- **Egress & Image Optimization:** Images use `loading="lazy"` with 30-day cache TTL (`minimumCacheTTL: 2592000`). Public APIs are edge-cached (`s-maxage=300, stale-while-revalidate=3600`).
- **Atomic Inventory Control:** Order creation in `src/lib/checkout/server.ts` uses PostgreSQL RPC `decrement_inventory` to prevent race conditions during concurrent checkouts.

### Supabase Tables & RPCs
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
- **RPC `decrement_inventory(p_product_id, p_quantity)`** — atomic quantity decrement

### Environment Variables
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — public anon key
- `SUPABASE_SERVICE_ROLE_KEY` — bypasses RLS, server-only
- `STRIPE_SECRET_KEY` / `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `RESEND_API_KEY` — for sending transactional emails
- `NEXT_PUBLIC_SITE_URL` — for sitemap/OG

### i18n & Mobile Responsiveness
- Bilingual: English + Arabic with full RTL support (`useLangDir()` hook).
- Mobile viewport configured with `maximumScale: 1` to prevent unwanted auto-zooming on iOS inputs.
- `SiteShell` wraps main content with `overflow-x-hidden` to prevent horizontal layout shift.
- Account dashboard and Wishlist pages use responsive horizontal scrollable tabs and flexible grids.

## Where to Find Things Fast
| Task | File |
|---|---|
| Server pre-fetch & layout | `src/app/layout.tsx` + `src/lib/api/products-server.ts` |
| Store hydration & provider | `src/components/providers/store-initializer.tsx` + `store-provider.tsx` |
| Product CRUD API | `src/app/api/admin/products/route.ts` + `[id]/route.ts` |
| Checkout & Atomic Inventory | `src/lib/checkout/server.ts` |
| Shop view & Infinite Scroll | `src/app/shop/page.tsx` |
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
| Returns client | `src/app/returns/returns-client.tsx` |
| Shipping config | `src/lib/shipping-store.ts` |
| Payment config | `src/lib/payment-store.ts` |
