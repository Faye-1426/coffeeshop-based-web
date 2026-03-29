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
};

type TenantContextValue = {
  isSupabase: boolean;
  loading: boolean;
  session: Session | null;
  user: User | null;
  profile: PosProfile | null;
  tenantName: string | null;
  refreshProfile: () => Promise<void>;
};

const TenantContext = createContext<TenantContextValue | null>(null);

const AUTH_READY_TIMEOUT_MS = 10_000;

async function loadProfileAndTenant(
  userId: string,
): Promise<{ profile: PosProfile | null; tenantName: string | null }> {
  const sb = getSupabase();
  if (!sb) return { profile: null, tenantName: null };
  const { data: profileRow, error: pErr } = await sb
    .from("profiles")
    .select("tenant_id, role_id, full_name")
    .eq("id", userId)
    .maybeSingle();
  if (pErr) throw pErr;
  if (!profileRow) return { profile: null, tenantName: null };
  const profile: PosProfile = {
    tenant_id: profileRow.tenant_id,
    role_id: profileRow.role_id,
    full_name: profileRow.full_name ?? "",
  };
  let tenantName: string | null = null;
  if (profile.tenant_id) {
    const { data: t, error: tErr } = await sb
      .from("tenants")
      .select("name")
      .eq("id", profile.tenant_id)
      .maybeSingle();
    if (tErr) throw tErr;
    tenantName = t?.name ?? null;
  }
  return { profile, tenantName };
}

export function TenantProvider({ children }: { children: ReactNode }) {
  const isSupabase = isSupabaseConfigured();
  const [loading, setLoading] = useState(isSupabase);
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<PosProfile | null>(null);
  const [tenantName, setTenantName] = useState<string | null>(null);

  const refreshProfile = useCallback(async () => {
    const sb = getSupabase();
    const uid = sb ? (await sb.auth.getSession()).data.session?.user?.id : null;
    if (!uid) {
      setProfile(null);
      setTenantName(null);
      setRemoteTenantId(null);
      return;
    }
    const { profile: p, tenantName: tn } = await loadProfileAndTenant(uid);
    setProfile(p);
    setTenantName(tn);
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
              const { profile: p, tenantName: tn } = await loadProfileAndTenant(
                next.user.id,
              );
              if (!cancelled) {
                setProfile(p);
                setTenantName(tn);
                setRemoteTenantId(p?.tenant_id ?? null);
              }
            } catch {
              if (!cancelled) {
                setProfile(null);
                setTenantName(null);
                setRemoteTenantId(null);
              }
            }
          } else if (!cancelled) {
            setProfile(null);
            setTenantName(null);
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

  const value = useMemo(
    () => ({
      isSupabase,
      loading,
      session,
      user,
      profile,
      tenantName,
      refreshProfile,
    }),
    [isSupabase, loading, session, user, profile, tenantName, refreshProfile],
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
