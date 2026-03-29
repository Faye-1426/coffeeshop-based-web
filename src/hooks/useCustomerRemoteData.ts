import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isSupabaseConfigured } from "../lib/supabaseClient";
import { customerQueryKeys } from "../lib/keys/customerQueryKeys";
import {
  sbCustomerCreateOrder,
  sbCustomerFetchMenu,
  type CustomerCreateOrderLine,
  type CustomerMenuPayload,
} from "../lib/supabase/customerPublicData";

export function useCustomerMenuQuery(tenantSlugDb: string | null) {
  const enabled = isSupabaseConfigured() && Boolean(tenantSlugDb);
  return useQuery({
    queryKey: tenantSlugDb
      ? customerQueryKeys.menu(tenantSlugDb)
      : [...customerQueryKeys.root, "menu", "none"],
    queryFn: () => sbCustomerFetchMenu(tenantSlugDb!),
    enabled,
  });
}

export function useCustomerCreateOrderMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (args: {
      tenantSlugDb: string;
      customerName: string;
      customerEmail: string;
      tableNumber?: string;
      lines: CustomerCreateOrderLine[];
    }) => sbCustomerCreateOrder(args),
    onSuccess: (_orderId, variables) => {
      void queryClient.invalidateQueries({
        queryKey: customerQueryKeys.menu(variables.tenantSlugDb),
      });
    },
  });
}

export type { CustomerMenuPayload };
