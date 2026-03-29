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
