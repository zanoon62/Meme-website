-- =====================================================================
-- MEME E-COMMERCE — SUPABASE SCHEMA
-- Women's Premium Fashion Atelier
-- =====================================================================
-- Run this in the Supabase SQL Editor to provision the full database.
-- Designed for: PostgreSQL 15+ (Supabase default), RLS enabled per table.
-- =====================================================================

-- Extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- =====================================================================
-- ENUMS
-- =====================================================================
create type product_status as enum ('draft', 'active', 'archived');
create type order_status as enum ('pending', 'paid', 'fulfilled', 'shipped', 'delivered', 'cancelled', 'refunded');
create type payment_status as enum ('awaiting', 'authorized', 'paid', 'partial_refund', 'refunded', 'failed');
create type fulfillment_status as enum ('unfulfilled', 'partial', 'fulfilled');
create type coupon_type as enum ('percent', 'fixed', 'shipping');
create type role as enum ('admin', 'staff', 'customer');

-- =====================================================================
-- CATEGORIES
-- =====================================================================
create table if not exists categories (
  id uuid primary key default uuid_generate_v4(),
  slug text unique not null,
  name text not null,
  description text,
  parent_id uuid references categories(id) on delete set null,
  image_url text,
  sort_order int default 0,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- =====================================================================
-- COLLECTIONS
-- =====================================================================
create table if not exists collections (
  id uuid primary key default uuid_generate_v4(),
  slug text unique not null,
  name text not null,
  tagline text,
  description text,
  image_url text,
  banner_url text,
  sort_order int default 0,
  is_featured boolean default false,
  is_active boolean default true,
  launch_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- =====================================================================
-- PRODUCTS
-- =====================================================================
create table if not exists products (
  id uuid primary key default uuid_generate_v4(),
  slug text unique not null,
  name text not null,
  subtitle text,
  description text,
  price numeric(10,2) not null check (price >= 0),
  compare_at_price numeric(10,2) check (compare_at_price is null or compare_at_price >= 0),
  currency text default 'USD',
  category_id uuid references categories(id) on delete set null,
  category_name text,
  collection_id uuid references collections(id) on delete set null,
  collection_name text,
  material text,
  care text,
  inventory int default 0 check (inventory >= 0),
  low_stock_threshold int default 5,
  sku text unique,
  status product_status default 'draft',
  rating numeric(2,1) default 5.0,
  review_count int default 0,
  is_new boolean default false,
  is_best_seller boolean default false,
  is_trending boolean default false,
  is_limited boolean default false,
  badges text[] default '{}',
  tags text[] default '{}',
  weight_grams int,
  meta_title text,
  meta_description text,
  published_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_products_category on products(category_id);
create index if not exists idx_products_collection on products(collection_id);
create index if not exists idx_products_status on products(status);
create index if not exists idx_products_slug on products(slug);
create index if not exists idx_products_tags on products using gin(tags);

-- =====================================================================
-- PRODUCT COLORS & SIZES (JSON columns on products for simplicity)
-- Colors: [{ name, hex }]
-- Sizes: ["XS","S","M","L","XL","XXL","ONE SIZE"]
-- =====================================================================
alter table products
  add column if not exists colors jsonb default '[]'::jsonb,
  add column if not exists sizes jsonb default '[]'::jsonb;

-- =====================================================================
-- PRODUCT IMAGES
-- =====================================================================
create table if not exists product_images (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid references products(id) on delete cascade,
  url text not null,
  alt text,
  sort_order int default 0,
  is_primary boolean default false,
  created_at timestamptz default now()
);
create index if not exists idx_product_images_product on product_images(product_id);

-- =====================================================================
-- CUSTOMERS (linked to auth.users)
-- =====================================================================
create table if not exists customers (
  id uuid primary key default uuid_generate_v4(),
  auth_user_id uuid references auth.users(id) on delete cascade unique,
  email text unique not null,
  first_name text,
  last_name text,
  phone text,
  accepts_marketing boolean default false,
  tags text[] default '{}',
  notes text,
  total_orders int default 0,
  total_spent numeric(10,2) default 0,
  last_order_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists idx_customers_email on customers(email);

-- =====================================================================
-- ADDRESSES
-- =====================================================================
create table if not exists addresses (
  id uuid primary key default uuid_generate_v4(),
  customer_id uuid references customers(id) on delete cascade,
  type text default 'shipping', -- shipping | billing
  first_name text,
  last_name text,
  company text,
  address1 text not null,
  address2 text,
  city text not null,
  state text,
  postal_code text,
  country text not null,
  phone text,
  is_default boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists idx_addresses_customer on addresses(customer_id);

-- =====================================================================
-- ORDERS
-- =====================================================================
create table if not exists orders (
  id uuid primary key default uuid_generate_v4(),
  order_number text unique not null,
  customer_id uuid references customers(id) on delete set null,
  email text not null,
  status order_status default 'pending',
  payment_status payment_status default 'awaiting',
  fulfillment_status fulfillment_status default 'unfulfilled',
  subtotal numeric(10,2) not null default 0,
  discount_total numeric(10,2) default 0,
  shipping_total numeric(10,2) default 0,
  tax_total numeric(10,2) default 0,
  total numeric(10,2) not null default 0,
  currency text default 'USD',
  coupon_code text,
  shipping_address jsonb,
  billing_address jsonb,
  shipping_method text,
  tracking_number text,
  tracking_url text,
  customer_note text,
  staff_note text,
  payment_intent_id text,
  payment_method text,
  placed_at timestamptz default now(),
  paid_at timestamptz,
  fulfilled_at timestamptz,
  shipped_at timestamptz,
  delivered_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists idx_orders_customer on orders(customer_id);
create index if not exists idx_orders_status on orders(status);
create index if not exists idx_orders_payment_status on orders(payment_status);
create index if not exists idx_orders_order_number on orders(order_number);
create index if not exists idx_orders_payment_intent on orders(payment_intent_id);

-- =====================================================================
-- ORDER ITEMS (line items snapshot — won't change if product changes later)
-- =====================================================================
create table if not exists order_items (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid references orders(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  product_name text not null,
  product_slug text,
  product_image text,
  variant_color text,
  variant_size text,
  sku text,
  unit_price numeric(10,2) not null,
  quantity int not null check (quantity > 0),
  total numeric(10,2) not null,
  created_at timestamptz default now()
);
create index if not exists idx_order_items_order on order_items(order_id);
create index if not exists idx_order_items_product on order_items(product_id);

-- =====================================================================
-- COUPONS / DISCOUNT CODES
-- =====================================================================
create table if not exists coupons (
  id uuid primary key default uuid_generate_v4(),
  code text unique not null,
  description text,
  type coupon_type not null,
  value numeric(10,2) not null, -- percent: 0-100, fixed: amount, shipping: 0
  min_subtotal numeric(10,2) default 0,
  max_uses int,
  used_count int default 0,
  starts_at timestamptz default now(),
  ends_at timestamptz,
  is_active boolean default true,
  applies_to text, -- 'all' | 'category:<slug>' | 'collection:<slug>' | 'product:<slug>'
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- =====================================================================
-- REVIEWS
-- =====================================================================
create table if not exists reviews (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid references products(id) on delete cascade,
  customer_id uuid references customers(id) on delete set null,
  author text not null,
  rating int not null check (rating >= 1 and rating <= 5),
  title text,
  body text,
  is_verified boolean default false,
  is_published boolean default false,
  helpful int default 0,
  response text,
  response_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists idx_reviews_product on reviews(product_id);
create index if not exists idx_reviews_published on reviews(is_published);

-- =====================================================================
-- WISHLISTS (server-side persistence for authed users)
-- =====================================================================
create table if not exists wishlists (
  id uuid primary key default uuid_generate_v4(),
  customer_id uuid references customers(id) on delete cascade,
  product_id uuid references products(id) on delete cascade,
  created_at timestamptz default now(),
  unique(customer_id, product_id)
);
create index if not exists idx_wishlists_customer on wishlists(customer_id);

-- =====================================================================
-- ADMIN STAFF PROFILES
-- =====================================================================
create table if not exists staff_profiles (
  id uuid primary key default uuid_generate_v4(),
  auth_user_id uuid references auth.users(id) on delete cascade unique,
  email text not null,
  full_name text,
  role role default 'staff',
  is_active boolean default true,
  last_login_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- =====================================================================
-- ANALYTICS EVENTS (lightweight event log)
-- =====================================================================
create table if not exists analytics_events (
  id bigserial primary key,
  event_type text not null, -- 'page_view' | 'add_to_cart' | 'checkout' | 'purchase' | 'search'
  entity_type text,
  entity_id text,
  customer_id uuid references customers(id) on delete set null,
  session_id text,
  payload jsonb default '{}'::jsonb,
  referrer text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  created_at timestamptz default now()
);
create index if not exists idx_events_type on analytics_events(event_type);
create index if not exists idx_events_created on analytics_events(created_at);
create index if not exists idx_events_product on analytics_events(entity_id);

-- =====================================================================
-- UPDATED_AT TRIGGERS
-- =====================================================================
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

do $$
declare
  t text;
begin
  for t in select unnest(array[
    'categories','collections','products','customers','addresses',
    'orders','order_items','coupons','reviews','staff_profiles'
  ])
  loop
    execute format('drop trigger if exists set_updated_at on %I;', t);
    execute format('create trigger set_updated_at before update on %I
                    for each row execute function update_updated_at();', t);
  end loop;
end$$;

-- =====================================================================
-- HELPER: generate order number
-- =====================================================================
create or replace function generate_order_number()
returns text as $$
declare
  seq_val bigint;
begin
  seq_val := nextval(pg_get_serial_sequence('analytics_events', 'id'));
  return 'MEME-' || to_char(now(), 'YYMMDD') || '-' || lpad(seq_val::text, 6, '0');
end;
$$ language plpgsql;

-- =====================================================================
-- ROW LEVEL SECURITY
-- =====================================================================
alter table categories enable row level security;
alter table collections enable row level security;
alter table products enable row level security;
alter table product_images enable row level security;
alter table customers enable row level security;
alter table addresses enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table coupons enable row level security;
alter table reviews enable row level security;
alter table wishlists enable row level security;
alter table staff_profiles enable row level security;
alter table analytics_events enable row level security;

-- Public can read active products, categories, collections
create policy "Public read active products"
  on products for select
  using (status = 'active');

create policy "Public read categories"
  on categories for select
  using (is_active = true);

create policy "Public read collections"
  on collections for select
  using (is_active = true);

create policy "Public read product images"
  on product_images for select
  using (true);

create policy "Public read published reviews"
  on reviews for select
  using (is_published = true);

-- Customers can CRUD their own data
create policy "Customer owns profile"
  on customers for all
  using (auth_user_id = auth.uid());

create policy "Customer owns addresses"
  on addresses for all
  using (customer_id in (
    select id from customers where auth_user_id = auth.uid()
  ));

create policy "Customer owns orders"
  on orders for select
  using (customer_id in (
    select id from customers where auth_user_id = auth.uid()
  ));

create policy "Customer owns wishlist"
  on wishlists for all
  using (customer_id in (
    select id from customers where auth_user_id = auth.uid()
  ));

create policy "Customer writes reviews"
  on reviews for insert
  with check (customer_id in (
    select id from customers where auth_user_id = auth.uid()
  ));

-- Coupons: public read to validate at checkout
create policy "Public read active coupons"
  on coupons for select
  using (is_active = true);

-- Staff profiles: only the staff user can read own
create policy "Staff reads own profile"
  on staff_profiles for select
  using (auth_user_id = auth.uid());

-- =====================================================================
-- NOTE: Admin write operations are performed via the service-role
-- client (createSupabaseServiceClient) which bypasses RLS.
-- This keeps the security model simple: anon/customer RLS for the
-- storefront, service role for the admin dashboard.
-- =====================================================================

-- =====================================================================
-- SEED DATA (run after first deploy)
-- =====================================================================
insert into categories (slug, name, sort_order) values
  ('dresses','Dresses',1),
  ('tailoring','Tailoring',2),
  ('outerwear','Outerwear',3),
  ('knitwear','Knitwear',4),
  ('hoodies-sweatshirts','Hoodies & Sweatshirts',5),
  ('tops','Tops',6),
  ('skirts','Skirts',7),
  ('pants','Pants',8),
  ('footwear','Footwear',9),
  ('accessories','Accessories',10)
on conflict (slug) do nothing;

insert into collections (slug, name, tagline, description, is_featured) values
  ('atelier-noir','Atelier Noir','Tailored essentials in depth-of-color black',
   'Our tailoring capsule — precision-cut blazer dresses, overcoats, silk trousers, and pencil skirts in Italian wools and leathers.', true),
  ('core-essentials','Core Essentials','The foundation of every great wardrobe',
   'Cashmere hoodies, fine merino knits, high-rise denim, and minimal loafers. The pieces you reach for every day.', true)
on conflict (slug) do nothing;
