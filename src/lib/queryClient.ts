import { QueryClient } from "@tanstack/react-query";

/**
 * Server state POS: cache cukup lama; refetch otomatis utamanya saat
 * `invalidateQueries` setelah mutasi — bukan setiap fokus window atau remount.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 15 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
