/** Customer marketplace cache; segment by DB tenant slug (not URL storeKey). */
export const customerQueryKeys = {
  root: ["customer"] as const,
  menu: (tenantSlugDb: string) =>
    [...customerQueryKeys.root, "menu", tenantSlugDb] as const,
};
