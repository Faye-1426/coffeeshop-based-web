import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isSupabaseConfigured } from "../lib/supabaseClient";
import { customerQueryKeys } from "../lib/keys/customerQueryKeys";
import {
  sbCustomerCreateCheckout,
  sbCustomerFetchMenu,
  type CustomerCreateOrderLine,
  type CustomerCheckoutResult,
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

export function useCustomerCreateCheckoutMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (args: {
      tenantSlugDb: string;
      customerName: string;
      customerEmail: string;
      tableNumber?: string;
      lines: CustomerCreateOrderLine[];
    }): Promise<CustomerCheckoutResult> => sbCustomerCreateCheckout(args),
    onSuccess: (_result, variables) => {
      void queryClient.invalidateQueries({
        queryKey: customerQueryKeys.menu(variables.tenantSlugDb),
      });
    },
  });
}

export type { CustomerCheckoutResult, CustomerMenuPayload };
