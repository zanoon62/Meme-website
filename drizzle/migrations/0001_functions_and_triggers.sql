-- Postgres functions + updated_at triggers, ported from supabase/schema.sql
-- and supabase/migrations/20260826_decrement_inventory.sql. Not expressible
-- in Drizzle's schema DSL, so hand-written here.

-- =====================================================================
-- updated_at trigger (fires on every table that actually has the column;
-- the original Supabase schema also registered this on order_items,
-- which has no updated_at column — a dormant bug there since it only
-- errors on UPDATE, never exercised. Deliberately not reproduced here.)
-- =====================================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
  t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'categories', 'collections', 'products', 'customers', 'addresses',
    'orders', 'coupons', 'reviews', 'staff_profiles', 'returns',
    'homepage_settings', 'users'
  ])
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS set_updated_at ON %I;', t);
    EXECUTE format('CREATE TRIGGER set_updated_at BEFORE UPDATE ON %I
                    FOR EACH ROW EXECUTE FUNCTION update_updated_at();', t);
  END LOOP;
END$$;

-- =====================================================================
-- Atomic inventory decrement (called inside the checkout transaction).
-- Fixed from the original Supabase version: p_product_id is now typed
-- `uuid` (matching products.id) instead of `text` — the original text
-- parameter would fail Postgres's operator resolution against a uuid
-- column (`operator does not exist: uuid = text`) had it ever actually
-- been exercised through a strict path; behavior (GREATEST clamp) is
-- otherwise unchanged.
-- =====================================================================
CREATE OR REPLACE FUNCTION decrement_inventory(
  p_product_id uuid,
  p_quantity int
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE products
  SET inventory = GREATEST(0, COALESCE(inventory, 0) - p_quantity),
      updated_at = now()
  WHERE id = p_product_id;
END;
$$;

-- =====================================================================
-- Order number generator — preserved verbatim (including its reuse of
-- analytics_events' serial sequence as a cheap counter) to avoid
-- changing the order-number format for a live store.
-- =====================================================================
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS text AS $$
DECLARE
  seq_val bigint;
BEGIN
  seq_val := nextval(pg_get_serial_sequence('analytics_events', 'id'));
  RETURN 'MEME-' || to_char(now(), 'YYMMDD') || '-' || lpad(seq_val::text, 6, '0');
END;
$$ LANGUAGE plpgsql;