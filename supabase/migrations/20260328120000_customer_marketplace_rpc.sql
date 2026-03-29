-- Customer marketplace: public RPCs for anon (read menu, create pending order).
-- Slug argument must match tenants.slug (not the URL "-store" suffix; client strips that).

-- -----------------------------------------------------------------------------
-- Optional: customer email on orders
-- -----------------------------------------------------------------------------
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS customer_email text;

-- -----------------------------------------------------------------------------
-- rpc_customer_menu: categories + products JSON for one tenant (active only)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.rpc_customer_menu(p_slug text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant_id uuid;
  v_categories jsonb;
  v_products jsonb;
BEGIN
  IF p_slug IS NULL OR length(trim(p_slug)) = 0 THEN
    RAISE EXCEPTION 'Invalid slug';
  END IF;

  SELECT t.id INTO v_tenant_id
  FROM public.tenants t
  WHERE t.slug = p_slug
    AND t.sub_status = 'active';

  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Tenant not found or inactive';
  END IF;

  SELECT coalesce(
    (SELECT jsonb_agg(q.j ORDER BY q.nm)
     FROM (
       SELECT
         jsonb_build_object('id', c.id, 'name', c.name) AS j,
         c.name AS nm
       FROM public.categories c
       WHERE c.tenant_id = v_tenant_id
     ) q),
    '[]'::jsonb
  )
  INTO v_categories;

  SELECT coalesce(
    (SELECT jsonb_agg(q.j ORDER BY q.nm)
     FROM (
       SELECT
         jsonb_build_object(
           'id', p.id,
           'name', p.name,
           'price', p.price,
           'stock_units', p.stock_units,
           'category_id', p.category_id,
           'badge', p.badge,
           'image_url', p.image_url
         ) AS j,
         p.name AS nm
       FROM public.products p
       WHERE p.tenant_id = v_tenant_id
     ) q),
    '[]'::jsonb
  )
  INTO v_products;

  RETURN jsonb_build_object(
    'categories', coalesce(v_categories, '[]'::jsonb),
    'products', coalesce(v_products, '[]'::jsonb)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.rpc_customer_menu(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rpc_customer_menu(text) TO anon, authenticated;

COMMENT ON FUNCTION public.rpc_customer_menu(text) IS
  'Public menu JSON for customer storefront; p_slug = tenants.slug.';

-- -----------------------------------------------------------------------------
-- rpc_customer_create_order: pending order + lines; server-priced; stock check
-- p_lines: [{"product_id":"uuid","quantity":3,"line_item_name":"optional"}]
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.rpc_customer_create_order(
  p_slug text,
  p_customer_name text,
  p_customer_email text,
  p_table_number text,
  p_lines jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant_id uuid;
  v_order_id uuid;
  line jsonb;
  v_product_id uuid;
  v_qty int;
  v_name text;
  v_price numeric(12, 2);
  v_stock int;
  v_line_label text;
  v_total numeric(12, 2) := 0;
  v_table text;
BEGIN
  IF p_slug IS NULL OR length(trim(p_slug)) = 0 THEN
    RAISE EXCEPTION 'Invalid slug';
  END IF;

  IF p_lines IS NULL OR jsonb_typeof(p_lines) <> 'array' OR jsonb_array_length(p_lines) = 0 THEN
    RAISE EXCEPTION 'Order must have at least one line';
  END IF;

  SELECT t.id INTO v_tenant_id
  FROM public.tenants t
  WHERE t.slug = p_slug
    AND t.sub_status = 'active';

  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Tenant not found or inactive';
  END IF;

  v_table := coalesce(nullif(trim(p_table_number), ''), 'Online');

  -- Validate lines and compute total (server-side prices only)
  FOR line IN SELECT value FROM jsonb_array_elements(p_lines)
  LOOP
    v_product_id := (line->>'product_id')::uuid;
    v_qty := (line->>'quantity')::int;
    IF v_qty IS NULL OR v_qty < 1 THEN
      RAISE EXCEPTION 'Invalid quantity for product %', v_product_id;
    END IF;

    SELECT p.name, p.price, p.stock_units
    INTO v_name, v_price, v_stock
    FROM public.products p
    WHERE p.id = v_product_id
      AND p.tenant_id = v_tenant_id;

    IF v_name IS NULL THEN
      RAISE EXCEPTION 'Product not found for tenant';
    END IF;

    IF v_stock < v_qty THEN
      RAISE EXCEPTION 'Insufficient stock for %', v_name;
    END IF;

    v_line_label := nullif(trim(line->>'line_item_name'), '');
    IF v_line_label IS NULL THEN
      v_line_label := v_name;
    END IF;

    v_total := v_total + (v_price * v_qty);
  END LOOP;

  INSERT INTO public.orders (
    tenant_id,
    table_number,
    status,
    total_price,
    customer_name,
    customer_email
  )
  VALUES (
    v_tenant_id,
    v_table,
    'pending',
    v_total,
    nullif(trim(p_customer_name), ''),
    nullif(trim(p_customer_email), '')
  )
  RETURNING id INTO v_order_id;

  FOR line IN SELECT value FROM jsonb_array_elements(p_lines)
  LOOP
    v_product_id := (line->>'product_id')::uuid;
    v_qty := (line->>'quantity')::int;

    SELECT p.name, p.price
    INTO v_name, v_price
    FROM public.products p
    WHERE p.id = v_product_id
      AND p.tenant_id = v_tenant_id;

    v_line_label := nullif(trim(line->>'line_item_name'), '');
    IF v_line_label IS NULL THEN
      v_line_label := v_name;
    END IF;

    INSERT INTO public.order_items (
      order_id,
      tenant_id,
      product_id,
      line_item_name,
      quantity,
      unit_price_at_sale
    )
    VALUES (
      v_order_id,
      v_tenant_id,
      v_product_id,
      v_line_label,
      v_qty,
      v_price
    );
  END LOOP;

  RETURN v_order_id;
END;
$$;

REVOKE ALL ON FUNCTION public.rpc_customer_create_order(text, text, text, text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rpc_customer_create_order(text, text, text, text, jsonb) TO anon, authenticated;

COMMENT ON FUNCTION public.rpc_customer_create_order(text, text, text, text, jsonb) IS
  'Create pending order for customer; prices from products table; p_slug = tenants.slug.';
