import { useMemo } from "react";
import type { OrderStatus, PosOrder } from "../../../types/pos";

export function useVisibleOrders(
  orders: PosOrder[],
  filter: OrderStatus | "all",
) {
  return useMemo(
    () =>
      filter === "all" ? orders : orders.filter((o) => o.status === filter),
    [orders, filter],
  );
}
