import { useQuery } from "@tanstack/react-query";
import { isSupabaseConfigured } from "../lib/supabaseClient";
import { posQueryKeys } from "../lib/keys/posQueryKeys";
import {
  sbFetchCategories,
  sbFetchDashboardSnapshot,
  sbFetchOrders,
  sbFetchOutstanding,
  sbFetchProducts,
  sbFetchTransactions,
} from "../lib/supabase/posSupabaseData";
import { useTenant } from "../features/tenants/context/TenantContext";

function useAuthUid() {
  const { session } = useTenant();
  return session?.user?.id;
}

export function usePosCategoriesQuery() {
  const uid = useAuthUid();
  const supa = isSupabaseConfigured();
  return useQuery({
    queryKey: posQueryKeys.categories(uid),
    queryFn: () => sbFetchCategories(),
    enabled: supa && !!uid,
  });
}

export function usePosProductsQuery() {
  const uid = useAuthUid();
  const supa = isSupabaseConfigured();
  return useQuery({
    queryKey: posQueryKeys.products(uid),
    queryFn: () => sbFetchProducts(),
    enabled: supa && !!uid,
  });
}

export function usePosOrdersQuery() {
  const uid = useAuthUid();
  const supa = isSupabaseConfigured();
  return useQuery({
    queryKey: posQueryKeys.orders(uid),
    queryFn: () => sbFetchOrders(),
    enabled: supa && !!uid,
  });
}

export function usePosTransactionsQuery() {
  const uid = useAuthUid();
  const supa = isSupabaseConfigured();
  return useQuery({
    queryKey: posQueryKeys.transactions(uid),
    queryFn: () => sbFetchTransactions(),
    enabled: supa && !!uid,
  });
}

export function usePosOutstandingQuery() {
  const uid = useAuthUid();
  const supa = isSupabaseConfigured();
  return useQuery({
    queryKey: posQueryKeys.outstanding(uid),
    queryFn: () => sbFetchOutstanding(),
    enabled: supa && !!uid,
  });
}

export function usePosDashboardSnapshotQuery() {
  const uid = useAuthUid();
  const supa = isSupabaseConfigured();
  return useQuery({
    queryKey: posQueryKeys.dashboard(uid),
    queryFn: () => sbFetchDashboardSnapshot(),
    enabled: supa && !!uid,
  });
}
