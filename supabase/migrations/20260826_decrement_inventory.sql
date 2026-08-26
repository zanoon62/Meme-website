-- Migration: Atomic inventory decrement RPC to prevent race conditions
-- Date: 2026-08-26

CREATE OR REPLACE FUNCTION decrement_inventory(
  p_product_id text,
  p_quantity int
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE products
  SET inventory = GREATEST(0, COALESCE(inventory, 0) - p_quantity),
      updated_at = NOW()
  WHERE id = p_product_id;
END;
$$;
