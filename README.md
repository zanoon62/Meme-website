# MEME Atelier — Premium Women's Fashion E-Commerce

A production-ready Next.js 16 e-commerce platform for **MEME** — a premium women's fashion brand. Original design (not cloned from any reference), built for Vercel + Supabase deployment.

**Instagram:** [@suited_by_meme](https://instagram.com/suited_by_meme)

---

## ✨ Features

### Storefront
- Original women's fashion aesthetic — elegant, modern, mobile-first
- Hero carousel with editorial showcases
- Product catalog with category & collection filtering
- Product detail pages with image galleries, color/size variants, reviews
- Persistent cart drawer (Zustand + localStorage)
- Wishlist with heart-toggle
- Checkout flow (ready for Stripe integration)
- Search, FAQ, Instagram gallery
- Light / dark mode
- Fully responsive (mobile-first)

### Admin Dashboard (`/admin`)
- **Dashboard** — real KPIs (revenue, orders, AOV, low-stock alerts), revenue chart, top products
- **Products** — full CRUD (add / edit / delete / reset), bulk actions, search & filter
- **Inventory** — quick stock edits, low-stock highlighting, inventory value calculation
- **Orders** — list with filters, detail dialog, status updates, tracking numbers, staff notes
- **Customers** — list with search, tier badges (Platinum/Gold/Silver), marketing opt-in status
- **Categories** — CRUD with slug, description, sort order
- **Collections** — CRUD with cover image, featured flag, tagline
- **Marketing** — discount codes (percent / fixed / shipping), Instagram/email/Meta overview
- **Reviews** — moderate, publish/unpublish, respond publicly
- **Analytics** — revenue trend, orders per day, category distribution, traffic by source
- **Settings** — store profile, payments, shipping zones, notifications, security/staff
- **Admin Guide** — in-app step-by-step onboarding for new staff

### Architecture
- **Framework:** Next.js 16 (App Router) + React 19 + TypeScript 5
- **Styling:** Tailwind CSS 4 + shadcn/ui (New York)
- **State:** Zustand (client) + TanStack Query (server)
- **Database:** Supabase (PostgreSQL + Auth + Storage) with RLS
- **Auth:** Supabase Auth with middleware-protected `/admin` routes
- **Forms:** React Hook Form + Zod
- **Charts:** Recharts
- **Animations:** Framer Motion
- **Deployment:** Vercel-ready

---

## 🚀 Quick Start (Local Dev)

### Prerequisites
- Node.js 20+ (or Bun)
- A Supabase account (free tier works)

### 1. Clone & install

```bash
git clone https://github.com/YOUR_USERNAME/meme-atelier.git
cd meme-atelier
bun install   # or: npm install
```

### 2. Set up Supabase

1. Go to [supabase.com](https://supabase.com) → **New Project**
2. Wait for it to provision (~2 minutes)
3. Open **SQL Editor** → **New Query**
4. Paste the entire contents of [`supabase/schema.sql`](./supabase/schema.sql) → **Run**
5. Go to **Project Settings → API** and copy:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (keep secret!)

### 3. Create an admin user

In Supabase → **Authentication → Users → Add user**:
- Email: `admin@memeatelier.com`
- Password: (choose a strong one)
- Check "Auto Confirm User"

Then in **SQL Editor**, link this user to a staff profile:

```sql
insert into staff_profiles (auth_user_id, email, full_name, role)
values (
  (select id from auth.users where email = 'admin@memeatelier.com'),
  'admin@memeatelier.com',
  'Atelier Admin',
  'admin'
);
```

### 4. Configure environment

```bash
cp .env.example .env.local
```

Edit `.env.local` and fill in your Supabase values.

### 5. Run the dev server

```bash
bun run dev
```

Open [http://localhost:3000](http://localhost:3000).

**Admin:** [http://localhost:3000/admin/login](http://localhost:3000/admin/login) — sign in with the email/password you created.

### Demo mode (without Supabase)

If `NEXT_PUBLIC_SUPABASE_URL` is not set, the app runs in **demo mode**:
- Products load from `src/data/products.ts` (12 seed items)
- Admin writes persist to `localStorage` (so you can still test CRUD)
- `/admin` is accessible without auth
- API routes return mock orders / customers / analytics

This is great for evaluation — but **you must set up Supabase for production**.

---

## 🌐 Deploy to Vercel

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit — MEME Atelier"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/meme-atelier.git
git push -u origin main
```

### 2. Import to Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repo
3. Vercel auto-detects Next.js — no build config needed
4. Under **Environment Variables**, add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_SITE_URL` = `https://your-project.vercel.app`
5. **Deploy**

### 3. Configure Supabase for production

In your Supabase project → **Authentication → URL Configuration**:
- **Site URL:** `https://your-project.vercel.app`
- **Redirect URLs:** `https://your-project.vercel.app/**`

### 4. Custom domain (optional)

In Vercel → **Project → Settings → Domains** → add your domain (e.g. `memeatelier.com`).
Update your DNS to point to Vercel. Update `NEXT_PUBLIC_SITE_URL` to match.

---

## 📁 Project Structure

```
.
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── (storefront)/         # Public pages: /, /shop, /product/[slug], /collection/[slug]
│   │   ├── admin/                # Admin dashboard
│   │   │   ├── login/            # Sign-in page
│   │   │   └── page.tsx          # Dashboard composition
│   │   ├── api/                  # Route handlers
│   │   │   ├── admin/            # Admin-only endpoints (service-role)
│   │   │   │   ├── products/     # CRUD
│   │   │   │   ├── orders/       # CRUD
│   │   │   │   ├── customers/    # list
│   │   │   │   ├── categories/   # CRUD
│   │   │   │   ├── collections/  # CRUD
│   │   │   │   └── analytics/    # aggregated KPIs
│   │   │   ├── products/         # public catalog
│   │   │   ├── cart/             # cart sync
│   │   │   └── checkout/         # order creation
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── admin/                # Admin UI
│   │   │   ├── admin-shell.tsx   # Sidebar + topbar layout
│   │   │   ├── sections/         # One file per admin section
│   │   │   ├── product-form-dialog.tsx
│   │   │   └── admin-guide.tsx
│   │   ├── home/                 # Homepage sections
│   │   ├── layout/               # Header, footer, mobile nav
│   │   ├── shop/                 # ProductCard, cart drawer
│   │   ├── providers/            # Zustand stores, theme provider
│   │   └── ui/                   # shadcn/ui primitives
│   ├── data/                     # Seed data (catalog, reviews)
│   ├── lib/
│   │   ├── supabase/             # Supabase clients + types
│   │   │   ├── server.ts         # Server-side client (cookies)
│   │   │   ├── browser.ts        # Browser-side client
│   │   │   ├── middleware.ts     # Session refresh + auth gate
│   │   │   ├── database.types.ts # TypeScript schema
│   │   │   └── config.ts         # isSupabaseConfigured()
│   │   ├── api/                  # Data adapters (Supabase ↔ store)
│   │   ├── db.ts                 # Prisma client (legacy)
│   │   ├── format.ts             # Price / date formatting
│   │   └── utils.ts              # cn() + helpers
│   ├── hooks/
│   └── middleware.ts             # Mounts Supabase session refresh
├── supabase/
│   └── schema.sql                # Complete database schema + RLS + seed
├── public/                       # Static assets
├── .env.example                  # Copy to .env.local
├── vercel.json                   # Vercel deployment config
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## 🛡️ Security Model

| Layer | Mechanism |
|-------|-----------|
| Public storefront | Supabase RLS — `select` on `status='active'` products only |
| Customer data | RLS — users can only read/write their own rows |
| Admin API routes | Use `SUPABASE_SERVICE_ROLE_KEY` (bypasses RLS) — server-only |
| Admin UI | Middleware redirects unauthenticated users to `/admin/login` |
| Service role key | Never exposed to the client — `server.ts` only |
| Webhooks | Stripe webhook signature verification (when Stripe is added) |

---

## 📦 Scripts

| Command | Description |
|---------|-------------|
| `bun run dev` | Start dev server on port 3000 |
| `bun run build` | Production build |
| `bun run start` | Start production server |
| `bun run lint` | Run ESLint |
| `bun run db:push` | Push Prisma schema (legacy — use Supabase SQL Editor instead) |

---

## 🔄 Admin Workflow (How to Manage Products)

### Adding a product
1. Sign in at `/admin/login`
2. Click **Products** in the sidebar
3. Click **Add product** (top-right)
4. Fill in: name, subtitle, description, price, compare-at price, inventory, category, collection, colors (with hex picker), sizes, image URLs, badges, tags, material, care, flags (New / Best Seller / Trending / Limited)
5. Click **Save** — the product is immediately live on the storefront

### Editing a product
1. Go to **Products**
2. Click the pencil icon on the row you want to edit
3. Modify any field → **Save**

### Deleting a product
1. Go to **Products**
2. Click the trash icon
3. Confirm in the dialog

### Managing inventory
1. Go to **Inventory**
2. Edit the stock number inline
3. Click the save icon — changes persist immediately

### Resetting to seed catalog (demo mode only)
1. Go to **Products**
2. Click **Reset**
3. Confirm — restores the original 12-product women's catalog

---

## 📈 Production Checklist

- [ ] Supabase project created and schema deployed
- [ ] Admin user created and linked in `staff_profiles`
- [ ] All env vars set in `.env.local` (and on Vercel)
- [ ] `NEXT_PUBLIC_SITE_URL` matches your production domain
- [ ] Supabase Auth URL config updated to production domain
- [ ] Stripe keys set (if accepting real payments)
- [ ] DNS configured for custom domain
- [ ] HTTPS enforced (Vercel does this automatically)
- [ ] RLS enabled on all tables (schema does this by default)
- [ ] First test order placed and verified
- [ ] Email notifications tested (if Resend configured)

---

## 📝 License

© MEME Atelier. All rights reserved.

## 📞 Support

- **Brand:** [@suited_by_meme](https://instagram.com/suited_by_meme)
- **Docs:** This README + the in-app Admin Guide
