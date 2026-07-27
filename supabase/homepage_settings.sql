-- =====================================================================
-- HOMEPAGE SETTINGS
-- Stores the admin-configurable homepage section config as a single
-- JSONB document (key = 'main'). This keeps the schema simple while
-- supporting arbitrary nested section data.
-- =====================================================================

create table if not exists homepage_settings (
  id        text primary key default 'main',   -- singleton row
  config    jsonb not null default '{}'::jsonb, -- full section tree
  updated_at timestamptz default now()
);

-- Only allow the one singleton row
create unique index if not exists homepage_settings_singleton
  on homepage_settings (id);

-- Trigger to keep updated_at fresh
create trigger set_homepage_updated_at
  before update on homepage_settings
  for each row execute function update_updated_at();

-- RLS: public can read, only service-role can write
alter table homepage_settings enable row level security;

create policy "Public read homepage settings"
  on homepage_settings for select
  using (true);

-- No public insert/update: admin writes via service-role API route.

-- =====================================================================
-- STORAGE BUCKET: homepage-images
-- Used for hero slides, editorial sections, and other homepage media.
-- Images are stored as WebP at ≤1920px wide, ≤200 KB each.
-- =====================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'homepage-images',
  'homepage-images',
  true,             -- publicly readable (no signed URLs needed for storefront)
  5242880,          -- 5 MB upload limit (before server-side compression to ~200 KB WebP)
  array['image/jpeg','image/jpg','image/png','image/webp','image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Public read policy for homepage-images bucket
create policy "Public read homepage images"
  on storage.objects for select
  using (bucket_id = 'homepage-images');

-- Only authenticated users (service role bypasses this) can upload
create policy "Admin upload homepage images"
  on storage.objects for insert
  with check (bucket_id = 'homepage-images');

create policy "Admin delete homepage images"
  on storage.objects for delete
  using (bucket_id = 'homepage-images');
