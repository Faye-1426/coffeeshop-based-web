import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { getSupabase, isSupabaseConfigured } from "../supabaseClient";
import { resetPosStoresAfterSignOut } from "../posStoresReset";
import { setRemoteTenantId } from "./remoteTenant";

export type PosProfile = {
  tenant_id: string | null;
  role_id: number;
  full_name: string;
  is_super_admin: boolean;
  /** From `roles.role_name` when readable. */
  role_name: string | null;
};

export type TenantRowBrief = {
  id: string;
  name: string;
  is_owner: boolean;
  slug: string;
  sub_status: string;
  end_subscription: string | null;
  logo_url: string | null;
  plan_id: string | null;
};

export type SubsKeyBrief = {
  id: string;
  is_active: boolean;
};

type TenantContextValue = {
  isSupabase: boolean;
  loading: boolean;
  session: Session | null;
  user: User | null;
  profile: PosProfile | null;
  tenantName: string | null;
  tenantRow: TenantRowBrief | null;
  subsKeyRow: SubsKeyBrief | null;
  /** Super admin user (profiles.is_super_admin). */
  isSuperAdmin: boolean;
  /** Outlet can use POS data: owner tenant or active subs_key or super admin. */
  outletPosUnlocked: boolean;
  refreshProfile: () => Promise<void>;
};

const TenantContext = createContext<TenantContextValue | null>(null);

const AUTH_READY_TIMEOUT_MS = 10_000;

async function loadProfileAndTenant(
  userId: string,
): Promise<{
  profile: PosProfile | null;
  tenantName: string | null;
  tenantRow: TenantRowBrief | null;
  subsKeyRow: SubsKeyBrief | null;
}> {
  const sb = getSupabase();
  if (!sb) {
    return {
      profile: null,
      tenantName: null,
      tenantRow: null,
      subsKeyRow: null,
    };
  }
  const { data: profileRow, error: pErr } = await sb
    .from("profiles")
    .select("tenant_id, role_id, full_name, is_super_admin")
    .eq("id", userId)
    .maybeSingle();
  if (pErr) throw pErr;
  if (!profileRow) {
    return {
      profile: null,
      tenantName: null,
      tenantRow: null,
      subsKeyRow: null,
    };
  }

  const { data: roleRow, error: rErr } = await sb
    .from("roles")
    .select("role_name")
    .eq("id", profileRow.role_id)
    .maybeSingle();
  if (rErr) throw rErr;

  const profile: PosProfile = {
    tenant_id: profileRow.tenant_id,
    role_id: profileRow.role_id,
    full_name: profileRow.full_name ?? "",
    is_super_admin: Boolean(profileRow.is_super_admin),
    role_name: roleRow?.role_name ?? null,
  };

  let tenantName: string | null = null;
  let tenantRow: TenantRowBrief | null = null;
  let subsKeyRow: SubsKeyBrief | null = null;

  if (profile.tenant_id) {
    const { data: t, error: tErr } = await sb
      .from("tenants")
      .select(
        "name, is_owner, id, slug, sub_status, end_subscription, logo_url, plan_id",
      )
      .eq("id", profile.tenant_id)
      .maybeSingle();
    if (tErr) throw tErr;
    tenantName = t?.name ?? null;
    if (t) {
      tenantRow = {
        id: t.id,
        name: t.name,
        is_owner: Boolean(t.is_owner),
        slug: t.slug,
        sub_status: t.sub_status,
        end_subscription: t.end_subscription ?? null,
        logo_url: t.logo_url ?? null,
        plan_id: t.plan_id ?? null,
      };
    }
    const { data: sk, error: skErr } = await sb
      .from("subs_key")
      .select("id, is_active")
      .eq("tenant_id", profile.tenant_id)
      .maybeSingle();
    if (skErr) throw skErr;
    if (sk) {
      subsKeyRow = { id: sk.id, is_active: Boolean(sk.is_active) };
    }
  }

  return { profile, tenantName, tenantRow, subsKeyRow };
}

export function TenantProvider({ children }: { children: ReactNode }) {
  const isSupabase = isSupabaseConfigured();
  const [loading, setLoading] = useState(isSupabase);
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<PosProfile | null>(null);
  const [tenantName, setTenantName] = useState<string | null>(null);
  const [tenantRow, setTenantRow] = useState<TenantRowBrief | null>(null);
  const [subsKeyRow, setSubsKeyRow] = useState<SubsKeyBrief | null>(null);

  const refreshProfile = useCallback(async () => {
    const sb = getSupabase();
    const uid = sb ? (await sb.auth.getSession()).data.session?.user?.id : null;
    if (!uid) {
      setProfile(null);
      setTenantName(null);
      setTenantRow(null);
      setSubsKeyRow(null);
      setRemoteTenantId(null);
      return;
    }
    const { profile: p, tenantName: tn, tenantRow: tr, subsKeyRow: sk } =
      await loadProfileAndTenant(uid);
    setProfile(p);
    setTenantName(tn);
    setTenantRow(tr);
    setSubsKeyRow(sk);
    setRemoteTenantId(p?.tenant_id ?? null);
  }, []);

  useEffect(() => {
    if (!isSupabase) {
      setLoading(false);
      setRemoteTenantId(null);
      return;
    }
    const sb = getSupabase();
    if (!sb) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const timeoutId = window.setTimeout(() => {
      if (cancelled) return;
      console.warn(
        "[Warcoop] Supabase auth: no INITIAL_SESSION within timeout — clearing loading.",
      );
      setLoading(false);
    }, AUTH_READY_TIMEOUT_MS);

    const clearAuthTimeout = () => {
      window.clearTimeout(timeoutId);
    };

    const { data: sub } = sb.auth.onAuthStateChange((_event, sess) => {
      void (async () => {
        try {
          const next = sess ?? null;
          setSession(next);
          setUser(next?.user ?? null);
          if (next?.user) {
            try {
              const { profile: p, tenantName: tn, tenantRow: tr, subsKeyRow: sk } =
                await loadProfileAndTenant(next.user.id);
              if (!cancelled) {
                setProfile(p);
                setTenantName(tn);
                setTenantRow(tr);
                setSubsKeyRow(sk);
                setRemoteTenantId(p?.tenant_id ?? null);
              }
            } catch {
              if (!cancelled) {
                setProfile(null);
                setTenantName(null);
                setTenantRow(null);
                setSubsKeyRow(null);
                setRemoteTenantId(null);
              }
            }
          } else if (!cancelled) {
            setProfile(null);
            setTenantName(null);
            setTenantRow(null);
            setSubsKeyRow(null);
            setRemoteTenantId(null);
            resetPosStoresAfterSignOut();
          }
        } finally {
          clearAuthTimeout();
          if (!cancelled) setLoading(false);
        }
      })();
    });

    return () => {
      cancelled = true;
      clearAuthTimeout();
      sub.subscription.unsubscribe();
    };
  }, [isSupabase]);

  const isSuperAdmin = Boolean(profile?.is_super_admin);
  const outletPosUnlocked =
    isSuperAdmin ||
    Boolean(tenantRow?.is_owner) ||
    Boolean(subsKeyRow?.is_active);

  const value = useMemo(
    () => ({
      isSupabase,
      loading,
      session,
      user,
      profile,
      tenantName,
      tenantRow,
      subsKeyRow,
      isSuperAdmin,
      outletPosUnlocked,
      refreshProfile,
    }),
    [
      isSupabase,
      loading,
      session,
      user,
      profile,
      tenantName,
      tenantRow,
      subsKeyRow,
      isSuperAdmin,
      outletPosUnlocked,
      refreshProfile,
    ],
  );

  return (
    <TenantContext.Provider value={value}>{children}</TenantContext.Provider>
  );
}

export function useTenant(): TenantContextValue {
  const ctx = useContext(TenantContext);
  if (!ctx) {
    throw new Error("useTenant must be used within TenantProvider");
  }
  return ctx;
}
