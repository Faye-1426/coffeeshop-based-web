-- Midtrans QRIS: awaiting_payment checkout, pending_lines, tenant keys, finalize (service_role only).

-- -----------------------------------------------------------------------------
-- order_status: awaiting_payment (customer checkout before payment)
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  ALTER TYPE public.order_status ADD VALUE 'awaiting_payment';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END$$;

-- -----------------------------------------------------------------------------
-- tenants: Midtrans credentials (Base64 JSON { serverKey, clientKey }); never SELECT in app
-- -----------------------------------------------------------------------------
ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS midtrans_key text;

ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS midtrans_configured boolean NOT NULL DEFAULT false;

UPDATE public.tenants
SET midtrans_configured = (midtrans_key IS NOT NULL AND btrim(midtrans_key) <> '')
WHERE true;

COMMENT ON COLUMN public.tenants.midtrans_key IS
  'Base64(JSON { serverKey, clientKey }). Written only via RPC; do not select from browser.';

COMMENT ON COLUMN public.tenants.midtrans_configured IS
  'True when midtrans_key is set; safe to expose in TenantContext.';

-- -----------------------------------------------------------------------------
-- orders: pending checkout + one-time nonce for Edge snap
-- -----------------------------------------------------------------------------
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS pending_lines jsonb;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS checkout_nonce uuid;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS snap_merchant_order_id text;

COMMENT ON COLUMN public.orders.pending_lines IS
  'Mirror of customer line items json until Midtrans payment succeeds; then cleared by finalize.';

COMMENT ON COLUMN public.orders.checkout_nonce IS
  'Returned with order_id; required to call midtrans-snap (prevents blind token minting).';

-- -----------------------------------------------------------------------------
-- transactions: idempotency for webhook
-- -----------------------------------------------------------------------------
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS gateway_transaction_id text;

CREATE UNIQUE INDEX IF NOT EXISTS transactions_gateway_transaction_id_key
  ON public.transactions (gateway_transaction_id)
  WHERE gateway_transaction_id IS NOT NULL;

-- -----------------------------------------------------------------------------
-- rpc_customer_create_checkout: NO order_items until payment (stock not decremented)
-- Returns { order_id, checkout_nonce }.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.rpc_customer_create_checkout(
  p_slug text,
  p_customer_name text,
  p_customer_email text,
  p_table_number text,
  p_lines jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant_id uuid;
  v_order_id uuid;
  v_nonce uuid;
  v_enriched jsonb := '[]'::jsonb;
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

    v_enriched := v_enriched || jsonb_build_array(
      jsonb_build_object(
        'product_id', v_product_id,
        'quantity', v_qty,
        'line_item_name', v_line_label,
        'unit_price_at_sale', v_price
      )
    );

    v_total := v_total + (v_price * v_qty);
  END LOOP;

  v_nonce := gen_random_uuid();

  INSERT INTO public.orders (
    tenant_id,
    table_number,
    status,
    total_price,
    customer_name,
    customer_email,
    pending_lines,
    checkout_nonce
  )
  VALUES (
    v_tenant_id,
    v_table,
    'awaiting_payment',
    v_total,
    nullif(trim(p_customer_name), ''),
    nullif(trim(p_customer_email), ''),
    v_enriched,
    v_nonce
  )
  RETURNING id INTO v_order_id;

  RETURN jsonb_build_object(
    'order_id', v_order_id,
    'checkout_nonce', v_nonce
  );
END;
$$;

REVOKE ALL ON FUNCTION public.rpc_customer_create_checkout(text, text, text, text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rpc_customer_create_checkout(text, text, text, text, jsonb) TO anon, authenticated;

COMMENT ON FUNCTION public.rpc_customer_create_checkout(text, text, text, text, jsonb) IS
  'Customer checkout: order awaiting_payment + pending_lines only (no order_items).';

-- -----------------------------------------------------------------------------
-- rpc_finalize_midtrans_payment: service_role only; webhook path
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.rpc_finalize_midtrans_payment(
  p_order_id uuid,
  p_gateway_transaction_id text,
  p_gross_amount numeric,
  p_transaction_status text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant_id uuid;
  v_status public.order_status;
  v_total numeric(12, 2);
  v_pending jsonb;
  v_customer_name text;
  line jsonb;
  v_product_id uuid;
  v_qty int;
  v_name text;
  v_price numeric(12, 2);
  v_stock int;
  v_line_label text;
  v_exists int;
BEGIN
  IF p_gateway_transaction_id IS NULL OR btrim(p_gateway_transaction_id) = '' THEN
    RAISE EXCEPTION 'gateway transaction id required';
  END IF;

  IF p_transaction_status IS NOT NULL AND lower(p_transaction_status) NOT IN ('settlement', 'capture') THEN
    RETURN jsonb_build_object('ok', true, 'skipped', true, 'reason', 'not_success_status');
  END IF;

  SELECT 1 INTO v_exists
  FROM public.transactions t
  WHERE t.gateway_transaction_id = p_gateway_transaction_id
  LIMIT 1;

  IF v_exists IS NOT NULL THEN
    RETURN jsonb_build_object('ok', true, 'idempotent', true, 'reason', 'duplicate_gateway_tx');
  END IF;

  SELECT o.tenant_id, o.status, o.total_price, o.pending_lines, o.customer_name
  INTO v_tenant_id, v_status, v_total, v_pending, v_customer_name
  FROM public.orders o
  WHERE o.id = p_order_id
  FOR UPDATE;

  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  IF v_status = 'completed' THEN
    RETURN jsonb_build_object('ok', true, 'idempotent', true, 'reason', 'already_completed');
  END IF;

  IF v_status <> 'awaiting_payment'::public.order_status THEN
    RAISE EXCEPTION 'Order not awaiting payment';
  END IF;

  IF v_pending IS NULL OR jsonb_typeof(v_pending) <> 'array' OR jsonb_array_length(v_pending) = 0 THEN
    RAISE EXCEPTION 'Order has no pending lines';
  END IF;

  IF round(v_total, 2) <> round(p_gross_amount, 2) THEN
    RAISE EXCEPTION 'Amount mismatch';
  END IF;

  FOR line IN SELECT value FROM jsonb_array_elements(v_pending)
  LOOP
    v_product_id := (line->>'product_id')::uuid;
    v_qty := (line->>'quantity')::int;

    SELECT p.name, p.price, p.stock_units
    INTO v_name, v_price, v_stock
    FROM public.products p
    WHERE p.id = v_product_id
      AND p.tenant_id = v_tenant_id;

    IF v_name IS NULL THEN
      RAISE EXCEPTION 'Product missing during finalize';
    END IF;

    IF v_stock < v_qty THEN
      RAISE EXCEPTION 'Insufficient stock for % at finalize', v_name;
    END IF;

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
      p_order_id,
      v_tenant_id,
      v_product_id,
      v_line_label,
      v_qty,
      v_price
    );
  END LOOP;

  INSERT INTO public.transactions (
    tenant_id,
    order_id,
    payment_method,
    amount_paid,
    change_amount,
    customer_name,
    status,
    gateway_transaction_id
  )
  VALUES (
    v_tenant_id,
    p_order_id,
    'qris',
    v_total,
    0,
    v_customer_name,
    'paid',
    p_gateway_transaction_id
  );

  UPDATE public.orders
  SET
    status = 'completed',
    pending_lines = NULL,
    checkout_nonce = NULL
  WHERE id = p_order_id;

  RETURN jsonb_build_object('ok', true, 'completed', true);
END;
$$;

REVOKE ALL ON FUNCTION public.rpc_finalize_midtrans_payment(uuid, text, numeric, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rpc_finalize_midtrans_payment(uuid, text, numeric, text) TO service_role;

COMMENT ON FUNCTION public.rpc_finalize_midtrans_payment(uuid, text, numeric, text) IS
  'After Midtrans success: insert order_items, paid transaction, complete order. service_role only.';

-- -----------------------------------------------------------------------------
-- Outlet owner: set / clear Midtrans blob (no plaintext read)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.rpc_owner_set_midtrans_key(p_midtrans_key_b64 text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tid uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authenticated' USING ERRCODE = '42501';
  END IF;

  IF public.current_role_id() IS DISTINCT FROM 1 THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  v_tid := public.current_tenant_id();
  IF v_tid IS NULL THEN
    RAISE EXCEPTION 'no tenant';
  END IF;

  IF p_midtrans_key_b64 IS NULL OR btrim(p_midtrans_key_b64) = '' THEN
    UPDATE public.tenants
    SET midtrans_key = NULL, midtrans_configured = false
    WHERE id = v_tid;
  ELSE
    UPDATE public.tenants
    SET
      midtrans_key = btrim(p_midtrans_key_b64),
      midtrans_configured = true
    WHERE id = v_tid;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.rpc_owner_set_midtrans_key(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rpc_owner_set_midtrans_key(text) TO authenticated;

COMMENT ON FUNCTION public.rpc_owner_set_midtrans_key(text) IS
  'Tenant owner (role_id=1): set or clear midtrans_key. Never returns secret.';

-- -----------------------------------------------------------------------------
-- Superadmin: set / clear Midtrans for any outlet tenant
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.rpc_superadmin_set_midtrans_key(
  p_tenant_id uuid,
  p_midtrans_key_b64 text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  IF p_tenant_id IS NULL THEN
    RAISE EXCEPTION 'tenant id required';
  END IF;

  IF EXISTS (SELECT 1 FROM public.tenants t WHERE t.id = p_tenant_id AND t.is_owner = true) THEN
    RAISE EXCEPTION 'cannot set Midtrans on platform tenant';
  END IF;

  IF p_midtrans_key_b64 IS NULL OR btrim(p_midtrans_key_b64) = '' THEN
    UPDATE public.tenants
    SET midtrans_key = NULL, midtrans_configured = false
    WHERE id = p_tenant_id;
  ELSE
    UPDATE public.tenants
    SET
      midtrans_key = btrim(p_midtrans_key_b64),
      midtrans_configured = true
    WHERE id = p_tenant_id;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.rpc_superadmin_set_midtrans_key(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rpc_superadmin_set_midtrans_key(uuid, text) TO authenticated;

COMMENT ON FUNCTION public.rpc_superadmin_set_midtrans_key(uuid, text) IS
  'Superadmin only: configure tenant Midtrans blob; never returns secret.';

-- -----------------------------------------------------------------------------
-- Deprecate direct customer create_order (stock would drop before payment)
-- -----------------------------------------------------------------------------
REVOKE EXECUTE ON FUNCTION public.rpc_customer_create_order(text, text, text, text, jsonb) FROM anon;
REVOKE EXECUTE ON FUNCTION public.rpc_customer_create_order(text, text, text, text, jsonb) FROM authenticated;
