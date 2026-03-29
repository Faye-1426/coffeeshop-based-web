export const superQueryKeys = {
  root: ["super"] as const,
  dashboardSummary: () => [...superQueryKeys.root, "dashboardSummary"] as const,
  tenants: () => [...superQueryKeys.root, "tenants"] as const,
  recentTransactions: () =>
    [...superQueryKeys.root, "recentTransactions"] as const,
  subscriptionPlans: () =>
    [...superQueryKeys.root, "subscriptionPlans"] as const,
  platformSettings: () =>
    [...superQueryKeys.root, "platformSettings"] as const,
  ownerTenant: () => [...superQueryKeys.root, "ownerTenant"] as const,
  tenant: (id: string) => [...superQueryKeys.root, "tenant", id] as const,
  subsKeys: () => [...superQueryKeys.root, "subsKeys"] as const,
  globalStats: () => [...superQueryKeys.root, "globalStats"] as const,
} as const;
