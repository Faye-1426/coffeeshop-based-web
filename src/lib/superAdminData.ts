import { getSupabase } from "./supabaseClient";

export type SuperTenantRow = {
  id: string;
  name: string;
  slug: string;
  sub_status: string;
  is_owner: boolean;
  plan_id: string | null;
  end_subscription: string | null;
  logo_url: string | null;
};

export type SubscriptionPlanRow = {
  id: string;
  name: string;
  slug: string;
  price_monthly: number;
  description: string | null;
  is_active: boolean;
};

export type PlatformSettingsRow = {
  id: number;
  brand_name: string | null;
  primary_color: string | null;
  logo_url: string | null;
  support_email: string | null;
};

export type SuperRecentTxRow = {
  id: string;
  amount_paid: number;
  status: string;
  created_at: string;
  tenant_id: string;
};

export async function sbFetchSuperRecentTransactions(): Promise<
  SuperRecentTxRow[]
> {
  const sb = getSupabase();
  if (!sb) throw new Error("Supabase not configured");
  const { data: txData, error: txErr } = await sb
    .from("transactions")
    .select("id, amount_paid, status, created_at, tenant_id")
    .order("created_at", { ascending: false })
    .limit(12);
  if (txErr) throw txErr;
  return (txData ?? []).map((r) => ({
    id: r.id,
    amount_paid: Number(r.amount_paid),
    status: String(r.status),
    created_at: String(r.created_at),
    tenant_id: String(r.tenant_id),
  }));
}

export async function sbRpcSuperDashboardSummary(): Promise<
  Record<string, unknown>
> {
  const sb = getSupabase();
  if (!sb) throw new Error("Supabase not configured");
  const { data, error } = await sb.rpc("rpc_super_dashboard_summary");
  if (error) throw error;
  return (data ?? {}) as Record<string, unknown>;
}

export async function sbFetchOwnerTenant(): Promise<SuperTenantRow | null> {
  const sb = getSupabase();
  if (!sb) throw new Error("Supabase not configured");
  const { data, error } = await sb
    .from("tenants")
    .select(
      "id, name, slug, sub_status, is_owner, plan_id, end_subscription, logo_url",
    )
    .eq("is_owner", true)
    .maybeSingle();
  if (error) throw error;
  return (data as SuperTenantRow) ?? null;
}

export async function sbFetchTenantById(
  id: string,
): Promise<SuperTenantRow | null> {
  const sb = getSupabase();
  if (!sb) throw new Error("Supabase not configured");
  const { data, error } = await sb
    .from("tenants")
    .select(
      "id, name, slug, sub_status, is_owner, plan_id, end_subscription, logo_url",
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return (data as SuperTenantRow) ?? null;
}

export async function sbFetchTenantsForSuper(): Promise<SuperTenantRow[]> {
  const sb = getSupabase();
  if (!sb) throw new Error("Supabase not configured");
  const { data, error } = await sb
    .from("tenants")
    .select(
      "id, name, slug, sub_status, is_owner, plan_id, end_subscription, logo_url",
    )
    .order("name");
  if (error) throw error;
  return (data ?? []) as SuperTenantRow[];
}

export async function sbInsertTenant(row: {
  name: string;
  slug: string;
  sub_status?: string;
  plan_id?: string | null;
}): Promise<SuperTenantRow> {
  const sb = getSupabase();
  if (!sb) throw new Error("Supabase not configured");
  const { data, error } = await sb
    .from("tenants")
    .insert({
      name: row.name,
      slug: row.slug,
      sub_status: row.sub_status ?? "active",
      is_owner: false,
      plan_id: row.plan_id ?? null,
    })
    .select(
      "id, name, slug, sub_status, is_owner, plan_id, end_subscription, logo_url",
    )
    .single();
  if (error) throw error;
  return data as SuperTenantRow;
}

export async function sbUpdateTenant(
  id: string,
  patch: Partial<{
    name: string;
    slug: string;
    sub_status: string;
    plan_id: string | null;
    end_subscription: string | null;
    logo_url: string | null;
  }>,
) {
  const sb = getSupabase();
  if (!sb) throw new Error("Supabase not configured");
  const { error } = await sb.from("tenants").update(patch).eq("id", id);
  if (error) throw error;
}

export async function sbDeleteTenant(id: string) {
  const sb = getSupabase();
  if (!sb) throw new Error("Supabase not configured");
  const { error } = await sb.from("tenants").delete().eq("id", id);
  if (error) throw error;
}

export async function sbFetchSubscriptionPlans(): Promise<SubscriptionPlanRow[]> {
  const sb = getSupabase();
  if (!sb) throw new Error("Supabase not configured");
  const { data, error } = await sb
    .from("subscription_plans")
    .select("id, name, slug, price_monthly, description, is_active")
    .order("name");
  if (error) throw error;
  return (data ?? []) as SubscriptionPlanRow[];
}

export async function sbInsertSubscriptionPlan(row: {
  name: string;
  slug: string;
  price_monthly: number;
  description?: string | null;
  is_active?: boolean;
}): Promise<SubscriptionPlanRow> {
  const sb = getSupabase();
  if (!sb) throw new Error("Supabase not configured");
  const { data, error } = await sb
    .from("subscription_plans")
    .insert({
      name: row.name,
      slug: row.slug,
      price_monthly: row.price_monthly,
      description: row.description ?? null,
      is_active: row.is_active ?? true,
    })
    .select("id, name, slug, price_monthly, description, is_active")
    .single();
  if (error) throw error;
  return data as SubscriptionPlanRow;
}

export async function sbUpdateSubscriptionPlan(
  id: string,
  patch: Partial<{
    name: string;
    slug: string;
    price_monthly: number;
    description: string | null;
    is_active: boolean;
  }>,
) {
  const sb = getSupabase();
  if (!sb) throw new Error("Supabase not configured");
  const { error } = await sb
    .from("subscription_plans")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function sbDeleteSubscriptionPlan(id: string) {
  const sb = getSupabase();
  if (!sb) throw new Error("Supabase not configured");
  const { error } = await sb.from("subscription_plans").delete().eq("id", id);
  if (error) throw error;
}

export async function sbFetchPlatformSettings(): Promise<PlatformSettingsRow | null> {
  const sb = getSupabase();
  if (!sb) throw new Error("Supabase not configured");
  const { data, error } = await sb
    .from("platform_settings")
    .select("id, brand_name, primary_color, logo_url, support_email")
    .eq("id", 1)
    .maybeSingle();
  if (error) throw error;
  return data as PlatformSettingsRow | null;
}

export async function sbUpdatePlatformSettings(patch: {
  brand_name?: string | null;
  primary_color?: string | null;
  logo_url?: string | null;
  support_email?: string | null;
}) {
  const sb = getSupabase();
  if (!sb) throw new Error("Supabase not configured");
  const { error } = await sb
    .from("platform_settings")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", 1);
  if (error) throw error;
}

export async function sbRpcCreateSubsKey(): Promise<{
  id: string;
  key: string;
}> {
  const sb = getSupabase();
  if (!sb) throw new Error("Supabase not configured");
  const { data, error } = await sb.rpc("rpc_create_subs_key");
  if (error) throw error;
  const o = data as { id?: string; key?: string };
  if (!o?.id || !o?.key) throw new Error("Invalid rpc_create_subs_key response");
  return { id: o.id, key: o.key };
}

export async function sbValidateAndBindSubscriptionKey(rawKey: string): Promise<{
  ok: boolean;
  error?: string;
  already?: boolean;
  skipped?: boolean;
}> {
  const sb = getSupabase();
  if (!sb) throw new Error("Supabase not configured");
  const { data, error } = await sb.rpc("validate_and_bind_subscription_key", {
    p_raw_key: rawKey,
  });
  if (error) throw error;
  const o = data as Record<string, unknown>;
  return {
    ok: o.ok === true,
    error: typeof o.error === "string" ? o.error : undefined,
    already: o.already === true,
    skipped: o.skipped === true,
  };
}

export async function sbFetchSubsKeysForSuper(): Promise<
  { id: string; is_active: boolean; tenant_id: string | null }[]
> {
  const sb = getSupabase();
  if (!sb) throw new Error("Supabase not configured");
  const { data, error } = await sb
    .from("subs_key")
    .select("id, is_active, tenant_id")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as {
    id: string;
    is_active: boolean;
    tenant_id: string | null;
  }[];
}
