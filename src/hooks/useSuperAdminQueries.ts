import { useQuery } from "@tanstack/react-query";
import { sbRpcGlobalStats } from "../lib/supabase/posSupabaseData";
import { isSupabaseConfigured } from "../lib/supabaseClient";
import {
  sbFetchOwnerTenant,
  sbFetchPlatformSettings,
  sbFetchSubsKeysForSuper,
  sbFetchSubscriptionPlans,
  sbFetchSuperRecentTransactions,
  sbFetchTenantById,
  sbFetchTenantsForSuper,
  sbRpcSuperDashboardSummary,
} from "../lib/supabase/superAdminData";
import { superQueryKeys } from "../lib/keys/superQueryKeys";
import { useTenant } from "../features/tenants/context/TenantContext";

function useSuperAdminEnabled() {
  const { isSupabase, isSuperAdmin } = useTenant();
  return isSupabaseConfigured() && isSupabase && isSuperAdmin;
}

export function useSuperDashboardSummaryQuery() {
  const enabled = useSuperAdminEnabled();
  return useQuery({
    queryKey: superQueryKeys.dashboardSummary(),
    queryFn: () => sbRpcSuperDashboardSummary(),
    enabled,
  });
}

export function useSuperTenantsQuery() {
  const enabled = useSuperAdminEnabled();
  return useQuery({
    queryKey: superQueryKeys.tenants(),
    queryFn: () => sbFetchTenantsForSuper(),
    enabled,
  });
}

export function useSuperRecentTransactionsQuery() {
  const enabled = useSuperAdminEnabled();
  return useQuery({
    queryKey: superQueryKeys.recentTransactions(),
    queryFn: () => sbFetchSuperRecentTransactions(),
    enabled,
  });
}

export function useSuperSubscriptionPlansQuery() {
  const enabled = useSuperAdminEnabled();
  return useQuery({
    queryKey: superQueryKeys.subscriptionPlans(),
    queryFn: () => sbFetchSubscriptionPlans(),
    enabled,
  });
}

export function useSuperPlatformSettingsQuery() {
  const enabled = useSuperAdminEnabled();
  return useQuery({
    queryKey: superQueryKeys.platformSettings(),
    queryFn: () => sbFetchPlatformSettings(),
    enabled,
  });
}

export function useSuperOwnerTenantQuery() {
  const enabled = useSuperAdminEnabled();
  return useQuery({
    queryKey: superQueryKeys.ownerTenant(),
    queryFn: () => sbFetchOwnerTenant(),
    enabled,
  });
}

export function useSuperTenantByIdQuery(id: string | undefined) {
  const base = useSuperAdminEnabled();
  return useQuery({
    queryKey: superQueryKeys.tenant(id ?? ""),
    queryFn: () => sbFetchTenantById(id!),
    enabled: base && Boolean(id),
  });
}

export function useSuperSubsKeysQuery() {
  const enabled = useSuperAdminEnabled();
  return useQuery({
    queryKey: superQueryKeys.subsKeys(),
    queryFn: () => sbFetchSubsKeysForSuper(),
    enabled,
  });
}

export function useSuperGlobalStatsQuery() {
  const enabled = useSuperAdminEnabled();
  return useQuery({
    queryKey: superQueryKeys.globalStats(),
    queryFn: () => sbRpcGlobalStats(),
    enabled,
  });
}
