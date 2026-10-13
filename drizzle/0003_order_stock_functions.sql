-- Stock holds for checkout. The app uses drizzle-orm/neon-http, which has no
-- interactive transactions, so each operation is one atomic function call.
-- Both lock the order row first, then the product_stock rows in
-- (product_id, size) order, so concurrent calls can't deadlock.

-- Takes the order's quantities out of stock, all or nothing. Returns false
-- (changing nothing) if the order isn't a pending, unpaid, never-reserved
-- order, has no items, or any line's size is missing or short.
CREATE OR REPLACE FUNCTION reserve_order_stock(p_order_id integer)
RETURNS boolean
LANGUAGE plpgsql
AS $$
DECLARE
  v_lines integer;
  v_available integer;
BEGIN
  PERFORM 1 FROM orders
  WHERE id = p_order_id
    AND status = 'pending'
    AND payment_status = 'unpaid'
    AND stock_reserved_at IS NULL
  FOR UPDATE;
  IF NOT FOUND THEN
    RETURN false;
  END IF;

  SELECT count(*) INTO v_lines FROM order_items WHERE order_id = p_order_id;
  IF v_lines = 0 THEN
    RETURN false;
  END IF;

  PERFORM 1
  FROM product_stock s
  JOIN order_items i ON i.product_id = s.product_id AND i.size = s.size
  WHERE i.order_id = p_order_id
  ORDER BY s.product_id, s.size
  FOR UPDATE OF s;

  SELECT count(*) INTO v_available
  FROM order_items i
  JOIN product_stock s ON s.product_id = i.product_id AND s.size = i.size
  WHERE i.order_id = p_order_id AND s.quantity >= i.quantity;
  IF v_available <> v_lines THEN
    RETURN false;
  END IF;

  UPDATE product_stock s
  SET quantity = s.quantity - i.quantity
  FROM order_items i
  WHERE i.order_id = p_order_id
    AND s.product_id = i.product_id
    AND s.size = i.size;

  UPDATE orders SET stock_reserved_at = now(), updated_at = now()
  WHERE id = p_order_id;
  RETURN true;
END;
$$;
--> statement-breakpoint

-- Gives a reserved, unpaid order's quantities back, exactly once. Returns
-- false (changing nothing) if stock was never reserved, was already
-- released, or the order has been paid. Lines whose product was deleted are
-- skipped.
CREATE OR REPLACE FUNCTION release_order_stock(p_order_id integer)
RETURNS boolean
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE orders SET stock_released_at = now(), updated_at = now()
  WHERE id = p_order_id
    AND stock_reserved_at IS NOT NULL
    AND stock_released_at IS NULL
    AND payment_status = 'unpaid';
  IF NOT FOUND THEN
    RETURN false;
  END IF;

  PERFORM 1
  FROM product_stock s
  JOIN order_items i ON i.product_id = s.product_id AND i.size = s.size
  WHERE i.order_id = p_order_id
  ORDER BY s.product_id, s.size
  FOR UPDATE OF s;

  UPDATE product_stock s
  SET quantity = s.quantity + i.quantity
  FROM order_items i
  WHERE i.order_id = p_order_id
    AND s.product_id = i.product_id
    AND s.size = i.size;

  RETURN true;
END;
$$;
