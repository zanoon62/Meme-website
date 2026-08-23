-- ============================================================
-- Returns Table Migration
-- Run this in Supabase Dashboard > SQL Editor
-- ============================================================

create table if not exists public.returns (
  id             uuid primary key default gen_random_uuid(),
  order_id       uuid references public.orders(id) on delete set null,
  order_number   text not null,
  customer_id    uuid references public.customers(id) on delete set null,
  customer_email text not null,
  reason         text not null,
  description    text,
  image_url      text,
  status         text not null default 'pending'
                   check (status in ('pending','reviewing','approved','rejected','refunded')),
  admin_note     text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- Indexes
create index if not exists returns_status_idx        on public.returns(status);
create index if not exists returns_customer_id_idx   on public.returns(customer_id);
create index if not exists returns_order_number_idx  on public.returns(order_number);
create index if not exists returns_created_at_idx    on public.returns(created_at desc);

-- Auto-update updated_at
create or replace function public.handle_returns_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists returns_updated_at on public.returns;
create trigger returns_updated_at
  before update on public.returns
  for each row execute procedure public.handle_returns_updated_at();

-- RLS
alter table public.returns enable row level security;

-- Customers can read/insert their own returns
create policy "customers_select_own_returns" on public.returns
  for select using (
    auth.uid() is not null
    and customer_id = (
      select id from public.customers where auth_user_id = auth.uid() limit 1
    )
  );

create policy "customers_insert_own_returns" on public.returns
  for insert with check (
    auth.uid() is not null
    and customer_id = (
      select id from public.customers where auth_user_id = auth.uid() limit 1
    )
  );

-- Service role (admin) has full access — handled via service client which bypasses RLS
