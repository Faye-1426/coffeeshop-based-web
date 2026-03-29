-- =============================================================================
-- Warcoop POS — consolidated migration V4 (29 March 2026)
-- Gabungan: warcoop_init, outstanding_delete_manager, outstanding_insert_cashier,
--   v4_super_admin_subs_key, fix_digest_sha256_text_cast, subs_key_plaintext
-- Terapkan: supabase db push atau SQL editor
-- =============================================================================

-- Warcoop POS — core schema (multi-tenant + RBAC hooks)
-- Apply via Supabase SQL editor or: supabase db push

-- -----------------------------------------------------------------------------
-- Extensions
-- -----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -----------------------------------------------------------------------------
-- Enums
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status') THEN
    CREATE TYPE public.order_status AS ENUM (
      'pending', 'preparing', 'served', 'completed', 'cancelled'
    );
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_method') THEN
    CREATE TYPE public.payment_method AS ENUM ('cash', 'qris', 'bon');
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'transaction_status') THEN
    CREATE TYPE public.transaction_status AS ENUM ('paid', 'unpaid');
  END IF;
END$$;

-- -----------------------------------------------------------------------------
-- Core tables
-- -----------------------------------------------------------------------------
CREATE TABLE public.tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  sub_status text NOT NULL DEFAULT 'active'
    CHECK (sub_status IN ('active', 'expired')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.roles (
  id integer PRIMARY KEY CHECK (id BETWEEN 0 AND 3),
  role_name text NOT NULL UNIQUE
);

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  tenant_id uuid REFERENCES public.tenants (id) ON DELETE SET NULL,
  role_id integer NOT NULL REFERENCES public.roles (id),
  full_name text NOT NULL DEFAULT '',
  is_active boolean NOT NULL DEFAULT true
);

CREATE INDEX profiles_tenant_idx ON public.profiles (tenant_id);

CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants (id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, name)
);

CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants (id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES public.categories (id) ON DELETE RESTRICT,
  name text NOT NULL,
  price numeric(12, 2) NOT NULL CHECK (price >= 0),
  stock_units integer NOT NULL DEFAULT 0 CHECK (stock_units >= 0),
  image_url text,
  badge text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, name)
);

CREATE INDEX products_tenant_category_idx ON public.products (tenant_id, category_id);

CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants (id) ON DELETE CASCADE,
  table_number text NOT NULL DEFAULT '',
  status public.order_status NOT NULL DEFAULT 'pending',
  total_price numeric(12, 2) NOT NULL DEFAULT 0 CHECK (total_price >= 0),
  customer_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX orders_tenant_created_idx ON public.orders (tenant_id, created_at DESC);

CREATE TABLE public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders (id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES public.tenants (id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products (id) ON DELETE RESTRICT,
  line_item_name text NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  unit_price_at_sale numeric(12, 2) NOT NULL CHECK (unit_price_at_sale >= 0)
);

CREATE INDEX order_items_order_idx ON public.order_items (order_id);

CREATE TABLE public.transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants (id) ON DELETE CASCADE,
  order_id uuid REFERENCES public.orders (id) ON DELETE SET NULL,
  payment_method public.payment_method NOT NULL,
  amount_paid numeric(12, 2) NOT NULL CHECK (amount_paid >= 0),
  change_amount numeric(12, 2) NOT NULL DEFAULT 0 CHECK (change_amount >= 0),
  customer_name text,
  status public.transaction_status NOT NULL DEFAULT 'unpaid',
  is_paid boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX transactions_tenant_created_idx ON public.transactions (tenant_id, created_at DESC);

CREATE TABLE public.outstanding (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants (id) ON DELETE CASCADE,
  customer_name text NOT NULL,
  amount numeric(12, 2) NOT NULL CHECK (amount >= 0),
  due_date date NOT NULL,
  transaction_id uuid NOT NULL REFERENCES public.transactions (id) ON DELETE CASCADE,
  UNIQUE (tenant_id, transaction_id)
);

-- Keep is_paid aligned with status
CREATE OR REPLACE FUNCTION public.transactions_sync_is_paid()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.is_paid := NEW.status = 'paid';
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_transactions_sync_is_paid
  BEFORE INSERT OR UPDATE OF status ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.transactions_sync_is_paid();

-- order_items: fill tenant_id from parent order
CREATE OR REPLACE FUNCTION public.order_items_set_tenant_from_order()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  SELECT o.tenant_id INTO STRICT NEW.tenant_id
  FROM public.orders o
  WHERE o.id = NEW.order_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_order_items_set_tenant
  BEFORE INSERT ON public.order_items
  FOR EACH ROW
  EXECUTE FUNCTION public.order_items_set_tenant_from_order();

-- Stock decrement (prompt requirement)
CREATE OR REPLACE FUNCTION public.order_items_decrement_stock()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated int;
BEGIN
  UPDATE public.products p
  SET stock_units = p.stock_units - NEW.quantity
  WHERE p.id = NEW.product_id
    AND p.tenant_id = NEW.tenant_id
    AND p.stock_units >= NEW.quantity;

  GET DIAGNOSTICS updated = ROW_COUNT;
  IF updated <> 1 THEN
    RAISE EXCEPTION 'Insufficient stock or product/tenant mismatch';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_order_items_decrement_stock
  AFTER INSERT ON public.order_items
  FOR EACH ROW
  EXECUTE FUNCTION public.order_items_decrement_stock();

-- Auto profile (prompt requirement)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, tenant_id, role_id, full_name, is_active)
  VALUES (
    NEW.id,
    NULL,
    3,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', split_part(NEW.email, '@', 1)),
    true
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- -----------------------------------------------------------------------------
-- RLS helper functions (SECURITY DEFINER)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role_id = 0
      AND p.tenant_id IS NULL
      AND p.is_active = true
  );
$$;

CREATE OR REPLACE FUNCTION public.current_tenant_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.tenant_id
  FROM public.profiles p
  WHERE p.id = auth.uid() AND p.is_active = true;
$$;

CREATE OR REPLACE FUNCTION public.current_role_id()
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.role_id
  FROM public.profiles p
  WHERE p.id = auth.uid() AND p.is_active = true;
$$;

-- Super-admin aggregate (secure RPC; avoids leaking view aggregates via tenant RLS)
CREATE OR REPLACE FUNCTION public.rpc_admin_global_stats()
RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  RETURN json_build_object(
    'total_tenants', (SELECT count(*)::bigint FROM public.tenants),
    'total_paid_transactions', (
      SELECT count(*)::bigint FROM public.transactions WHERE status = 'paid'
    ),
    'total_revenue_global', (
      SELECT coalesce(sum(amount_paid), 0)::numeric
      FROM public.transactions
      WHERE status = 'paid'
    )
  );
END;
$$;

REVOKE ALL ON FUNCTION public.rpc_admin_global_stats() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rpc_admin_global_stats() TO authenticated;

-- Optional SQL view for ad-hoc super-admin queries (service role / manual only)
CREATE OR REPLACE VIEW public.admin_global_stats AS
SELECT
  (SELECT count(*)::bigint FROM public.tenants) AS total_tenants,
  (SELECT count(*)::bigint FROM public.transactions WHERE status = 'paid') AS total_paid_transactions,
  (SELECT coalesce(sum(amount_paid), 0)::numeric FROM public.transactions WHERE status = 'paid') AS total_revenue_global;

REVOKE ALL ON public.admin_global_stats FROM PUBLIC;

-- -----------------------------------------------------------------------------
-- Row Level Security
-- -----------------------------------------------------------------------------
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outstanding ENABLE ROW LEVEL SECURITY;

-- tenants
CREATE POLICY tenants_select ON public.tenants
  FOR SELECT TO authenticated
  USING (
    public.is_super_admin()
    OR id = public.current_tenant_id()
  );

CREATE POLICY tenants_write_super ON public.tenants
  FOR ALL TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- roles: readable by any logged-in user (for UI labels)
CREATE POLICY roles_select ON public.roles
  FOR SELECT TO authenticated
  USING (true);

-- profiles
CREATE POLICY profiles_select ON public.profiles
  FOR SELECT TO authenticated
  USING (
    public.is_super_admin()
    OR id = auth.uid()
    OR (
      tenant_id IS NOT NULL
      AND tenant_id = public.current_tenant_id()
      AND public.current_role_id() = 1
    )
  );

CREATE POLICY profiles_insert_super ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (public.is_super_admin());

CREATE POLICY profiles_update_own_or_super ON public.profiles
  FOR UPDATE TO authenticated
  USING (public.is_super_admin() OR id = auth.uid())
  WITH CHECK (public.is_super_admin() OR id = auth.uid());

CREATE POLICY profiles_delete_super ON public.profiles
  FOR DELETE TO authenticated
  USING (public.is_super_admin());

-- categories
CREATE POLICY categories_select ON public.categories
  FOR SELECT TO authenticated
  USING (
    public.is_super_admin()
    OR tenant_id = public.current_tenant_id()
  );

CREATE POLICY categories_write_manager ON public.categories
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_super_admin()
    OR (
      tenant_id = public.current_tenant_id()
      AND public.current_role_id() IN (1, 2)
    )
  );

CREATE POLICY categories_update_manager ON public.categories
  FOR UPDATE TO authenticated
  USING (
    public.is_super_admin()
    OR (
      tenant_id = public.current_tenant_id()
      AND public.current_role_id() IN (1, 2)
    )
  )
  WITH CHECK (
    public.is_super_admin()
    OR (
      tenant_id = public.current_tenant_id()
      AND public.current_role_id() IN (1, 2)
    )
  );

CREATE POLICY categories_delete_owner ON public.categories
  FOR DELETE TO authenticated
  USING (
    public.is_super_admin()
    OR (
      tenant_id = public.current_tenant_id()
      AND public.current_role_id() = 1
    )
  );

-- products
CREATE POLICY products_select ON public.products
  FOR SELECT TO authenticated
  USING (
    public.is_super_admin()
    OR tenant_id = public.current_tenant_id()
  );

CREATE POLICY products_write_manager ON public.products
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_super_admin()
    OR (
      tenant_id = public.current_tenant_id()
      AND public.current_role_id() IN (1, 2)
    )
  );

CREATE POLICY products_update_manager ON public.products
  FOR UPDATE TO authenticated
  USING (
    public.is_super_admin()
    OR (
      tenant_id = public.current_tenant_id()
      AND public.current_role_id() IN (1, 2)
    )
  )
  WITH CHECK (
    public.is_super_admin()
    OR (
      tenant_id = public.current_tenant_id()
      AND public.current_role_id() IN (1, 2)
    )
  );

CREATE POLICY products_delete_owner ON public.products
  FOR DELETE TO authenticated
  USING (
    public.is_super_admin()
    OR (
      tenant_id = public.current_tenant_id()
      AND public.current_role_id() IN (1, 2)
    )
  );

-- orders
CREATE POLICY orders_select ON public.orders
  FOR SELECT TO authenticated
  USING (
    public.is_super_admin()
    OR tenant_id = public.current_tenant_id()
  );

CREATE POLICY orders_insert_staff ON public.orders
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_super_admin()
    OR (
      tenant_id = public.current_tenant_id()
      AND public.current_role_id() IN (1, 2, 3)
    )
  );

CREATE POLICY orders_update_staff ON public.orders
  FOR UPDATE TO authenticated
  USING (
    public.is_super_admin()
    OR tenant_id = public.current_tenant_id()
  )
  WITH CHECK (
    public.is_super_admin()
    OR tenant_id = public.current_tenant_id()
  );

CREATE POLICY orders_delete_manager ON public.orders
  FOR DELETE TO authenticated
  USING (
    public.is_super_admin()
    OR (
      tenant_id = public.current_tenant_id()
      AND public.current_role_id() IN (1, 2)
    )
  );

-- order_items
CREATE POLICY order_items_select ON public.order_items
  FOR SELECT TO authenticated
  USING (
    public.is_super_admin()
    OR tenant_id = public.current_tenant_id()
  );

CREATE POLICY order_items_insert_staff ON public.order_items
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_super_admin()
    OR (
      tenant_id = public.current_tenant_id()
      AND public.current_role_id() IN (1, 2, 3)
    )
  );

CREATE POLICY order_items_update_manager ON public.order_items
  FOR UPDATE TO authenticated
  USING (
    public.is_super_admin()
    OR (
      tenant_id = public.current_tenant_id()
      AND public.current_role_id() IN (1, 2)
    )
  );

CREATE POLICY order_items_delete_manager ON public.order_items
  FOR DELETE TO authenticated
  USING (
    public.is_super_admin()
    OR (
      tenant_id = public.current_tenant_id()
      AND public.current_role_id() IN (1, 2)
    )
  );

-- transactions
CREATE POLICY transactions_select ON public.transactions
  FOR SELECT TO authenticated
  USING (
    public.is_super_admin()
    OR tenant_id = public.current_tenant_id()
  );

CREATE POLICY transactions_insert_staff ON public.transactions
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_super_admin()
    OR (
      tenant_id = public.current_tenant_id()
      AND public.current_role_id() IN (1, 2, 3)
    )
  );

CREATE POLICY transactions_update_manager ON public.transactions
  FOR UPDATE TO authenticated
  USING (
    public.is_super_admin()
    OR (
      tenant_id = public.current_tenant_id()
      AND public.current_role_id() IN (1, 2)
    )
  );

CREATE POLICY transactions_delete_manager ON public.transactions
  FOR DELETE TO authenticated
  USING (
    public.is_super_admin()
    OR (
      tenant_id = public.current_tenant_id()
      AND public.current_role_id() IN (1, 2)
    )
  );

-- outstanding
CREATE POLICY outstanding_select ON public.outstanding
  FOR SELECT TO authenticated
  USING (
    public.is_super_admin()
    OR tenant_id = public.current_tenant_id()
  );

CREATE POLICY outstanding_write_manager ON public.outstanding
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_super_admin()
    OR (
      tenant_id = public.current_tenant_id()
      AND public.current_role_id() IN (1, 2)
    )
  );

CREATE POLICY outstanding_update_manager ON public.outstanding
  FOR UPDATE TO authenticated
  USING (
    public.is_super_admin()
    OR (
      tenant_id = public.current_tenant_id()
      AND public.current_role_id() IN (1, 2)
    )
  );

CREATE POLICY outstanding_delete_owner ON public.outstanding
  FOR DELETE TO authenticated
  USING (
    public.is_super_admin()
    OR (
      tenant_id = public.current_tenant_id()
      AND public.current_role_id() = 1
    )
  );

-- -----------------------------------------------------------------------------
-- Seed: roles (idempotent)
-- -----------------------------------------------------------------------------
INSERT INTO public.roles (id, role_name) VALUES
  (0, 'super_admin'),
  (1, 'owner'),
  (2, 'manager'),
  (3, 'cashier')
ON CONFLICT (id) DO UPDATE
SET role_name = EXCLUDED.role_name;

-- =============================================================================

-- (was 20260326120001_outstanding_delete_manager.sql)

-- =============================================================================


-- Allow manager + owner to remove settled outstanding rows (e.g. after marking BON paid).

DROP POLICY IF EXISTS outstanding_delete_owner ON public.outstanding;

CREATE POLICY outstanding_delete_owner ON public.outstanding
  FOR DELETE TO authenticated
  USING (
    public.is_super_admin()
    OR (
      tenant_id = public.current_tenant_id()
      AND public.current_role_id() IN (1, 2)
    )
  );

-- =============================================================================

-- (was 20260327120000_outstanding_insert_cashier.sql)

-- =============================================================================


-- Izinkan kasir mencatat BON (outstanding) saat pembayaran order di POS.

DROP POLICY IF EXISTS outstanding_write_manager ON public.outstanding;

CREATE POLICY outstanding_write_manager ON public.outstanding
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_super_admin()
    OR (
      tenant_id = public.current_tenant_id()
      AND public.current_role_id() IN (1, 2, 3)
    )
  );

-- =============================================================================

-- (was 20260328130000_v4_super_admin_subs_key.sql)

-- =============================================================================


-- V4: is_super_admin on profiles, tenants.is_owner + subscription fields,
-- subs_key, subscription_plans, platform_settings, outlet RLS gate, RPCs.

-- -----------------------------------------------------------------------------
-- subscription_plans
-- -----------------------------------------------------------------------------
CREATE TABLE public.subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  price_monthly numeric(12, 2) NOT NULL DEFAULT 0 CHECK (price_monthly >= 0),
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- tenants: owner flag + subscription + logo
-- -----------------------------------------------------------------------------
ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS is_owner boolean NOT NULL DEFAULT false;

ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS plan_id uuid REFERENCES public.subscription_plans (id) ON DELETE SET NULL;

ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS end_subscription timestamptz;

ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS logo_url text;

CREATE UNIQUE INDEX IF NOT EXISTS tenants_single_is_owner
  ON public.tenants ((true))
  WHERE is_owner = true;

-- -----------------------------------------------------------------------------
-- subs_key (plaintext key; tenant_id set on successful bind)
-- -----------------------------------------------------------------------------
CREATE TABLE public.subs_key (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plain_key text NOT NULL UNIQUE,
  is_active boolean NOT NULL DEFAULT false,
  tenant_id uuid UNIQUE REFERENCES public.tenants (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS subs_key_tenant_idx ON public.subs_key (tenant_id);

-- -----------------------------------------------------------------------------
-- profiles: platform super flag
-- -----------------------------------------------------------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_super_admin boolean NOT NULL DEFAULT false;

UPDATE public.profiles
SET is_super_admin = true
WHERE role_id = 0
  AND tenant_id IS NULL
  AND is_active = true
  AND is_super_admin = false;

-- -----------------------------------------------------------------------------
-- platform_settings (singleton row)
-- -----------------------------------------------------------------------------
CREATE TABLE public.platform_settings (
  id smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  brand_name text,
  primary_color text,
  logo_url text,
  support_email text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.platform_settings (id) VALUES (1)
ON CONFLICT (id) DO NOTHING;

-- -----------------------------------------------------------------------------
-- Seed: default plan + platform tenant row (idempotent)
-- -----------------------------------------------------------------------------
INSERT INTO public.subscription_plans (name, slug, price_monthly, description, is_active)
VALUES ('Basic', 'basic', 100000, 'Paket dasar', true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.tenants (name, slug, sub_status, is_owner)
SELECT 'Warcoop Platform', 'warcoop-platform', 'active', true
WHERE NOT EXISTS (SELECT 1 FROM public.tenants WHERE is_owner = true);

UPDATE public.platform_settings
SET brand_name = COALESCE(brand_name, 'Warcoop'),
    updated_at = now()
WHERE id = 1;

-- Dev-only demo key: binds on first use (plaintext in DB)
INSERT INTO public.subs_key (plain_key, is_active, tenant_id)
SELECT 'warcoop-demo-subs-key', false, NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.subs_key WHERE plain_key = 'warcoop-demo-subs-key'
);

-- -----------------------------------------------------------------------------
-- RLS helpers (replace is_super_admin; add outlet gate)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.is_active = true
      AND p.is_super_admin = true
  );
$$;

CREATE OR REPLACE FUNCTION public.outlet_pos_unlocked()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.current_tenant_id() IS NOT NULL
    AND (
      EXISTS (
        SELECT 1
        FROM public.tenants t
        WHERE t.id = public.current_tenant_id()
          AND t.is_owner = true
      )
      OR EXISTS (
        SELECT 1
        FROM public.subs_key sk
        WHERE sk.tenant_id = public.current_tenant_id()
          AND sk.is_active = true
      )
    );
$$;

-- -----------------------------------------------------------------------------
-- RLS for new tables (after is_super_admin uses profiles column)
-- -----------------------------------------------------------------------------
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY subscription_plans_select ON public.subscription_plans
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY subscription_plans_write_super ON public.subscription_plans
  FOR ALL TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

ALTER TABLE public.subs_key ENABLE ROW LEVEL SECURITY;

CREATE POLICY subs_key_select ON public.subs_key
  FOR SELECT TO authenticated
  USING (
    public.is_super_admin()
    OR tenant_id = public.current_tenant_id()
  );

CREATE POLICY subs_key_insert_super ON public.subs_key
  FOR INSERT TO authenticated
  WITH CHECK (public.is_super_admin());

CREATE POLICY subs_key_update_super ON public.subs_key
  FOR UPDATE TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

CREATE POLICY subs_key_delete_super ON public.subs_key
  FOR DELETE TO authenticated
  USING (public.is_super_admin());

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY platform_settings_select ON public.platform_settings
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY platform_settings_write_super ON public.platform_settings
  FOR ALL TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- -----------------------------------------------------------------------------
-- RPC: bind subscription key (outlet staff)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.validate_and_bind_subscription_key(p_raw_key text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_tid uuid;
  v_id uuid;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated' USING ERRCODE = '28000';
  END IF;

  SELECT p.tenant_id INTO v_tid
  FROM public.profiles p
  WHERE p.id = v_uid AND p.is_active = true;

  IF v_tid IS NULL THEN
    RETURN json_build_object('ok', false, 'error', 'no_tenant');
  END IF;

  IF EXISTS (SELECT 1 FROM public.tenants t WHERE t.id = v_tid AND t.is_owner = true) THEN
    RETURN json_build_object('ok', true, 'skipped', true);
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.subs_key sk
    WHERE sk.tenant_id = v_tid AND sk.is_active = true
  ) THEN
    RETURN json_build_object('ok', true, 'already', true);
  END IF;

  SELECT sk.id INTO v_id
  FROM public.subs_key sk
  WHERE sk.plain_key = trim(p_raw_key)
    AND sk.tenant_id IS NULL
    AND sk.is_active = false
  FOR UPDATE;

  IF v_id IS NULL THEN
    RETURN json_build_object('ok', false, 'error', 'invalid_key');
  END IF;

  UPDATE public.subs_key
  SET tenant_id = v_tid, is_active = true
  WHERE id = v_id;

  RETURN json_build_object('ok', true);
END;
$$;

REVOKE ALL ON FUNCTION public.validate_and_bind_subscription_key(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.validate_and_bind_subscription_key(text) TO authenticated;

-- -----------------------------------------------------------------------------
-- RPC: create unassigned key (super admin); returns plaintext once
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.rpc_create_subs_key()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  plain text;
  v_id uuid;
BEGIN
  IF NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  plain := 'wc_' || replace(gen_random_uuid()::text, '-', '')
    || replace(gen_random_uuid()::text, '-', '');

  INSERT INTO public.subs_key (plain_key, is_active, tenant_id)
  VALUES (plain, false, NULL)
  RETURNING id INTO v_id;

  RETURN json_build_object('id', v_id, 'key', plain);
END;
$$;

REVOKE ALL ON FUNCTION public.rpc_create_subs_key() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rpc_create_subs_key() TO authenticated;

-- -----------------------------------------------------------------------------
-- Extend global stats RPC
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.rpc_admin_global_stats()
RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  RETURN json_build_object(
    'total_tenants', (SELECT count(*)::bigint FROM public.tenants),
    'total_paid_transactions', (
      SELECT count(*)::bigint FROM public.transactions WHERE status = 'paid'
    ),
    'total_revenue_global', (
      SELECT coalesce(sum(amount_paid), 0)::numeric
      FROM public.transactions
      WHERE status = 'paid'
    ),
    'active_subscriber_tenants', (
      SELECT count(DISTINCT sk.tenant_id)::bigint
      FROM public.subs_key sk
      WHERE sk.is_active = true
        AND sk.tenant_id IS NOT NULL
    )
  );
END;
$$;

-- -----------------------------------------------------------------------------
-- Super dashboard summary (charts + lists use client queries with RLS)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.rpc_super_dashboard_summary()
RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  RETURN json_build_object(
    'total_tenants', (SELECT count(*)::bigint FROM public.tenants WHERE NOT is_owner),
    'platform_tenant', (SELECT count(*)::bigint FROM public.tenants WHERE is_owner),
    'subscriber_tenants', (
      SELECT count(DISTINCT tenant_id)::bigint FROM public.subs_key
      WHERE is_active = true AND tenant_id IS NOT NULL
    ),
    'total_paid_transactions', (
      SELECT count(*)::bigint FROM public.transactions WHERE status = 'paid'
    ),
    'total_revenue_global', (
      SELECT coalesce(sum(amount_paid), 0)::numeric
      FROM public.transactions
      WHERE status = 'paid'
    )
  );
END;
$$;

REVOKE ALL ON FUNCTION public.rpc_super_dashboard_summary() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rpc_super_dashboard_summary() TO authenticated;

-- -----------------------------------------------------------------------------
-- Re-create RLS policies: gate tenant data on outlet_pos_unlocked()
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS categories_select ON public.categories;
CREATE POLICY categories_select ON public.categories
  FOR SELECT TO authenticated
  USING (
    public.is_super_admin()
    OR (
      tenant_id = public.current_tenant_id()
      AND public.outlet_pos_unlocked()
    )
  );

DROP POLICY IF EXISTS categories_write_manager ON public.categories;
CREATE POLICY categories_write_manager ON public.categories
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_super_admin()
    OR (
      tenant_id = public.current_tenant_id()
      AND public.outlet_pos_unlocked()
      AND public.current_role_id() IN (1, 2)
    )
  );

DROP POLICY IF EXISTS categories_update_manager ON public.categories;
CREATE POLICY categories_update_manager ON public.categories
  FOR UPDATE TO authenticated
  USING (
    public.is_super_admin()
    OR (
      tenant_id = public.current_tenant_id()
      AND public.outlet_pos_unlocked()
      AND public.current_role_id() IN (1, 2)
    )
  )
  WITH CHECK (
    public.is_super_admin()
    OR (
      tenant_id = public.current_tenant_id()
      AND public.outlet_pos_unlocked()
      AND public.current_role_id() IN (1, 2)
    )
  );

DROP POLICY IF EXISTS categories_delete_owner ON public.categories;
CREATE POLICY categories_delete_owner ON public.categories
  FOR DELETE TO authenticated
  USING (
    public.is_super_admin()
    OR (
      tenant_id = public.current_tenant_id()
      AND public.outlet_pos_unlocked()
      AND public.current_role_id() = 1
    )
  );

DROP POLICY IF EXISTS products_select ON public.products;
CREATE POLICY products_select ON public.products
  FOR SELECT TO authenticated
  USING (
    public.is_super_admin()
    OR (
      tenant_id = public.current_tenant_id()
      AND public.outlet_pos_unlocked()
    )
  );

DROP POLICY IF EXISTS products_write_manager ON public.products;
CREATE POLICY products_write_manager ON public.products
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_super_admin()
    OR (
      tenant_id = public.current_tenant_id()
      AND public.outlet_pos_unlocked()
      AND public.current_role_id() IN (1, 2)
    )
  );

DROP POLICY IF EXISTS products_update_manager ON public.products;
CREATE POLICY products_update_manager ON public.products
  FOR UPDATE TO authenticated
  USING (
    public.is_super_admin()
    OR (
      tenant_id = public.current_tenant_id()
      AND public.outlet_pos_unlocked()
      AND public.current_role_id() IN (1, 2)
    )
  )
  WITH CHECK (
    public.is_super_admin()
    OR (
      tenant_id = public.current_tenant_id()
      AND public.outlet_pos_unlocked()
      AND public.current_role_id() IN (1, 2)
    )
  );

DROP POLICY IF EXISTS products_delete_owner ON public.products;
CREATE POLICY products_delete_owner ON public.products
  FOR DELETE TO authenticated
  USING (
    public.is_super_admin()
    OR (
      tenant_id = public.current_tenant_id()
      AND public.outlet_pos_unlocked()
      AND public.current_role_id() IN (1, 2)
    )
  );

DROP POLICY IF EXISTS orders_select ON public.orders;
CREATE POLICY orders_select ON public.orders
  FOR SELECT TO authenticated
  USING (
    public.is_super_admin()
    OR (
      tenant_id = public.current_tenant_id()
      AND public.outlet_pos_unlocked()
    )
  );

DROP POLICY IF EXISTS orders_insert_staff ON public.orders;
CREATE POLICY orders_insert_staff ON public.orders
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_super_admin()
    OR (
      tenant_id = public.current_tenant_id()
      AND public.outlet_pos_unlocked()
      AND public.current_role_id() IN (1, 2, 3)
    )
  );

DROP POLICY IF EXISTS orders_update_staff ON public.orders;
CREATE POLICY orders_update_staff ON public.orders
  FOR UPDATE TO authenticated
  USING (
    public.is_super_admin()
    OR (
      tenant_id = public.current_tenant_id()
      AND public.outlet_pos_unlocked()
    )
  )
  WITH CHECK (
    public.is_super_admin()
    OR (
      tenant_id = public.current_tenant_id()
      AND public.outlet_pos_unlocked()
    )
  );

DROP POLICY IF EXISTS orders_delete_manager ON public.orders;
CREATE POLICY orders_delete_manager ON public.orders
  FOR DELETE TO authenticated
  USING (
    public.is_super_admin()
    OR (
      tenant_id = public.current_tenant_id()
      AND public.outlet_pos_unlocked()
      AND public.current_role_id() IN (1, 2)
    )
  );

DROP POLICY IF EXISTS order_items_select ON public.order_items;
CREATE POLICY order_items_select ON public.order_items
  FOR SELECT TO authenticated
  USING (
    public.is_super_admin()
    OR (
      tenant_id = public.current_tenant_id()
      AND public.outlet_pos_unlocked()
    )
  );

DROP POLICY IF EXISTS order_items_insert_staff ON public.order_items;
CREATE POLICY order_items_insert_staff ON public.order_items
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_super_admin()
    OR (
      tenant_id = public.current_tenant_id()
      AND public.outlet_pos_unlocked()
      AND public.current_role_id() IN (1, 2, 3)
    )
  );

DROP POLICY IF EXISTS order_items_update_manager ON public.order_items;
CREATE POLICY order_items_update_manager ON public.order_items
  FOR UPDATE TO authenticated
  USING (
    public.is_super_admin()
    OR (
      tenant_id = public.current_tenant_id()
      AND public.outlet_pos_unlocked()
      AND public.current_role_id() IN (1, 2)
    )
  );

DROP POLICY IF EXISTS order_items_delete_manager ON public.order_items;
CREATE POLICY order_items_delete_manager ON public.order_items
  FOR DELETE TO authenticated
  USING (
    public.is_super_admin()
    OR (
      tenant_id = public.current_tenant_id()
      AND public.outlet_pos_unlocked()
      AND public.current_role_id() IN (1, 2)
    )
  );

DROP POLICY IF EXISTS transactions_select ON public.transactions;
CREATE POLICY transactions_select ON public.transactions
  FOR SELECT TO authenticated
  USING (
    public.is_super_admin()
    OR (
      tenant_id = public.current_tenant_id()
      AND public.outlet_pos_unlocked()
    )
  );

DROP POLICY IF EXISTS transactions_insert_staff ON public.transactions;
CREATE POLICY transactions_insert_staff ON public.transactions
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_super_admin()
    OR (
      tenant_id = public.current_tenant_id()
      AND public.outlet_pos_unlocked()
      AND public.current_role_id() IN (1, 2, 3)
    )
  );

DROP POLICY IF EXISTS transactions_update_manager ON public.transactions;
CREATE POLICY transactions_update_manager ON public.transactions
  FOR UPDATE TO authenticated
  USING (
    public.is_super_admin()
    OR (
      tenant_id = public.current_tenant_id()
      AND public.outlet_pos_unlocked()
      AND public.current_role_id() IN (1, 2)
    )
  );

DROP POLICY IF EXISTS transactions_delete_manager ON public.transactions;
CREATE POLICY transactions_delete_manager ON public.transactions
  FOR DELETE TO authenticated
  USING (
    public.is_super_admin()
    OR (
      tenant_id = public.current_tenant_id()
      AND public.outlet_pos_unlocked()
      AND public.current_role_id() IN (1, 2)
    )
  );

DROP POLICY IF EXISTS outstanding_select ON public.outstanding;
CREATE POLICY outstanding_select ON public.outstanding
  FOR SELECT TO authenticated
  USING (
    public.is_super_admin()
    OR (
      tenant_id = public.current_tenant_id()
      AND public.outlet_pos_unlocked()
    )
  );

DROP POLICY IF EXISTS outstanding_write_manager ON public.outstanding;
CREATE POLICY outstanding_write_manager ON public.outstanding
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_super_admin()
    OR (
      tenant_id = public.current_tenant_id()
      AND public.outlet_pos_unlocked()
      AND public.current_role_id() IN (1, 2)
    )
  );

DROP POLICY IF EXISTS outstanding_update_manager ON public.outstanding;
CREATE POLICY outstanding_update_manager ON public.outstanding
  FOR UPDATE TO authenticated
  USING (
    public.is_super_admin()
    OR (
      tenant_id = public.current_tenant_id()
      AND public.outlet_pos_unlocked()
      AND public.current_role_id() IN (1, 2)
    )
  );

DROP POLICY IF EXISTS outstanding_delete_owner ON public.outstanding;
CREATE POLICY outstanding_delete_owner ON public.outstanding
  FOR DELETE TO authenticated
  USING (
    public.is_super_admin()
    OR (
      tenant_id = public.current_tenant_id()
      AND public.outlet_pos_unlocked()
      AND public.current_role_id() = 1
    )
  );

-- =============================================================================

-- (was 20260329120000_fix_digest_sha256_text_cast.sql)

-- =============================================================================


-- subs_key: plaintext column + RPCs (replaces prior digest-based fix migration).
-- If an older DB still has column key_hash, rename to plain_key (old hex values invalid for plaintext flow).

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'subs_key'
      AND column_name = 'key_hash'
  ) THEN
    ALTER TABLE public.subs_key RENAME COLUMN key_hash TO plain_key;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.validate_and_bind_subscription_key(p_raw_key text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_tid uuid;
  v_id uuid;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated' USING ERRCODE = '28000';
  END IF;

  SELECT p.tenant_id INTO v_tid
  FROM public.profiles p
  WHERE p.id = v_uid AND p.is_active = true;

  IF v_tid IS NULL THEN
    RETURN json_build_object('ok', false, 'error', 'no_tenant');
  END IF;

  IF EXISTS (SELECT 1 FROM public.tenants t WHERE t.id = v_tid AND t.is_owner = true) THEN
    RETURN json_build_object('ok', true, 'skipped', true);
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.subs_key sk
    WHERE sk.tenant_id = v_tid AND sk.is_active = true
  ) THEN
    RETURN json_build_object('ok', true, 'already', true);
  END IF;

  SELECT sk.id INTO v_id
  FROM public.subs_key sk
  WHERE sk.plain_key = trim(p_raw_key)
    AND sk.tenant_id IS NULL
    AND sk.is_active = false
  FOR UPDATE;

  IF v_id IS NULL THEN
    RETURN json_build_object('ok', false, 'error', 'invalid_key');
  END IF;

  UPDATE public.subs_key
  SET tenant_id = v_tid, is_active = true
  WHERE id = v_id;

  RETURN json_build_object('ok', true);
END;
$$;

REVOKE ALL ON FUNCTION public.validate_and_bind_subscription_key(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.validate_and_bind_subscription_key(text) TO authenticated;

CREATE OR REPLACE FUNCTION public.rpc_create_subs_key()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  plain text;
  v_id uuid;
BEGIN
  IF NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  plain := 'wc_' || replace(gen_random_uuid()::text, '-', '')
    || replace(gen_random_uuid()::text, '-', '');

  INSERT INTO public.subs_key (plain_key, is_active, tenant_id)
  VALUES (plain, false, NULL)
  RETURNING id INTO v_id;

  RETURN json_build_object('id', v_id, 'key', plain);
END;
$$;

REVOKE ALL ON FUNCTION public.rpc_create_subs_key() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rpc_create_subs_key() TO authenticated;

INSERT INTO public.subs_key (plain_key, is_active, tenant_id)
SELECT 'warcoop-demo-subs-key', false, NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.subs_key WHERE plain_key = 'warcoop-demo-subs-key'
);

-- Catatan: file migrasi 20260330120000_subs_key_plaintext.sql identik dengan blok di atas (idempotent); tidak diulang.
