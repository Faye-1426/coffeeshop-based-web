import type { PosOrder } from "../../../types/pos";

export function activeOrdersCount(orders: PosOrder[]): number {
  return orders.filter((o) =>
    ["pending", "preparing", "served"].includes(o.status),
  ).length;
}

export function lowStockCount(
  products: Array<{ stock: number; lowStockThreshold?: number }>,
): number {
  return products.filter((p) => {
    const t = p.lowStockThreshold ?? 10;
    return p.stock <= t;
  }).length;
}
