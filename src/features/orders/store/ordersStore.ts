import { create } from "zustand";
import { posOrdersSeed, posProductsSeed } from "../../../data/posDummyData";
import type { OrderStatus, PosOrder, PosProduct } from "../../../types/pos";
import { nextOrderId } from "../lib/nextOrderId";

type OrdersState = {
  orders: PosOrder[];
  products: PosProduct[];
  filter: OrderStatus | "all";
  drawerOpen: boolean;
  setFilter: (f: OrderStatus | "all") => void;
  setDrawerOpen: (open: boolean) => void;
  advanceStatus: (o: PosOrder) => void;
  appendOrder: (draft: Omit<PosOrder, "id" | "createdAt">) => void;
};

const statusFlow: OrderStatus[] = [
  "pending",
  "preparing",
  "served",
  "completed",
];

export const useOrdersStore = create<OrdersState>((set, get) => ({
  orders: [...posOrdersSeed],
  products: [...posProductsSeed],
  filter: "all",
  drawerOpen: false,

  setFilter: (filter) => set({ filter }),

  setDrawerOpen: (drawerOpen) => set({ drawerOpen }),

  advanceStatus: (o) => {
    const i = statusFlow.indexOf(o.status);
    if (i < 0 || i >= statusFlow.length - 1) return;
    const next = statusFlow[i + 1];
    set((s) => ({
      orders: s.orders.map((x) => (x.id === o.id ? { ...x, status: next } : x)),
    }));
  },

  appendOrder: (draft) => {
    const { orders } = get();
    const id = nextOrderId(orders);
    const created: PosOrder = {
      ...draft,
      id,
      createdAt: new Date().toISOString().slice(0, 16),
    };
    set((s) => ({ orders: [created, ...s.orders] }));
  },
}));
