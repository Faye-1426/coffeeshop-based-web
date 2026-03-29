/** Query key roots for POS Supabase-backed data; segment by auth user to isolate cache on logout/login. */
export const posQueryKeys = {
  root: ["pos"] as const,
  categories: (userId: string | undefined) =>
    [...posQueryKeys.root, "categories", userId ?? "none"] as const,
  products: (userId: string | undefined) =>
    [...posQueryKeys.root, "products", userId ?? "none"] as const,
  orders: (userId: string | undefined) =>
    [...posQueryKeys.root, "orders", userId ?? "none"] as const,
  transactions: (userId: string | undefined) =>
    [...posQueryKeys.root, "transactions", userId ?? "none"] as const,
  outstanding: (userId: string | undefined) =>
    [...posQueryKeys.root, "outstanding", userId ?? "none"] as const,
  dashboard: (userId: string | undefined) =>
    [...posQueryKeys.root, "dashboard", userId ?? "none"] as const,
};
