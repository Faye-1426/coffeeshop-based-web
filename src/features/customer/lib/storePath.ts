/** URL segment suffix for marketplace routes, e.g. `warkop` → `warkop-store`. */
export const CUSTOMER_STORE_SUFFIX = "-store";

export function tenantSlugToStoreKey(tenantSlugDb: string): string {
  return `${tenantSlugDb}${CUSTOMER_STORE_SUFFIX}`;
}

/**
 * Parses `/:storeKey` (e.g. `warkop-store`) into DB `tenants.slug` (`warkop`).
 * Returns null if the segment does not end with `-store` or the slug part is empty.
 */
export function storeKeyToTenantSlug(storeKey: string | undefined): string | null {
  if (!storeKey || !storeKey.endsWith(CUSTOMER_STORE_SUFFIX)) return null;
  const base = storeKey.slice(0, -CUSTOMER_STORE_SUFFIX.length);
  return base.length > 0 ? base : null;
}
