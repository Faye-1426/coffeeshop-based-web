import { create } from "zustand";
import { posOrdersSeed, posProductsSeed } from "../../../data/posDummyData";
import type {
  OrderStatus,
  PaymentMethod,
  PosOrder,
  PosProduct,
  PosTransaction,
} from "../../../types/pos";
import { nextOrderId } from "../lib/nextOrderId";
import { isSupabaseConfigured } from "../../../lib/supabaseClient";
import { requireRemoteTenantId } from "../../../lib/supabase/remoteTenant";
import {
  sbCreateOrder,
  sbFetchOrders,
  sbFetchProducts,
  sbPayAndCompleteOrder,
  sbUpdateOrderStatus,
} from "../../../lib/posSupabaseData";
import { useOutstandingStore } from "../../outstanding/store/outstandingStore";
import { useTransactionsStore } from "../../transactions/store/transactionsStore";

export type CheckoutPaymentPayload = {
  method: PaymentMethod;
  amountPaid: number;
  dueDate?: string;
};

type OrdersState = {
  orders: PosOrder[];
  products: PosProduct[];
  filter: OrderStatus | "all";
  drawerOpen: boolean;
  setFilter: (f: OrderStatus | "all") => void;
  setDrawerOpen: (open: boolean) => void;
  advanceStatus: (o: PosOrder) => void | Promise<void>;
  completeOrderWithPayment: (
    order: PosOrder,
    payload: CheckoutPaymentPayload,
  ) => void | Promise<void>;
  appendOrder: (draft: Omit<PosOrder, "id" | "createdAt">) => void | Promise<void>;
  syncFromRemote: () => Promise<void>;
};

const statusFlow: OrderStatus[] = [
  "pending",
  "preparing",
  "served",
  "completed",
];

const useSeed = !isSupabaseConfigured();

export const useOrdersStore = create<OrdersState>((set, get) => ({
  orders: useSeed ? [...posOrdersSeed] : [],
  products: useSeed ? [...posProductsSeed] : [],
  filter: "all",
  drawerOpen: false,

  syncFromRemote: async () => {
    if (!isSupabaseConfigured()) return;
    const [orders, products] = await Promise.all([
      sbFetchOrders(),
      sbFetchProducts(),
    ]);
    set({ orders, products });
  },

  setFilter: (filter) => set({ filter }),

  setDrawerOpen: (drawerOpen) => set({ drawerOpen }),

  advanceStatus: async (o) => {
    const i = statusFlow.indexOf(o.status);
    if (i < 0 || i >= statusFlow.length - 1) return;
    const next = statusFlow[i + 1];
    if (next === "completed") {
      window.alert(
        "Untuk menyelesaikan order, gunakan “Bayar & selesai” pada order berstatus disajikan (served).",
      );
      return;
    }

    if (isSupabaseConfigured()) {
      try {
        await sbUpdateOrderStatus(o.id, next);
        await get().syncFromRemote();
      } catch (e) {
        window.alert(
          e instanceof Error ? e.message : "Gagal memperbarui status order.",
        );
      }
      return;
    }

    set((s) => ({
      orders: s.orders.map((x) => (x.id === o.id ? { ...x, status: next } : x)),
    }));
  },

  completeOrderWithPayment: async (order, payload) => {
    if (isSupabaseConfigured()) {
      try {
        await sbPayAndCompleteOrder({
          tenantId: requireRemoteTenantId(),
          orderId: order.id,
          total: order.total,
          customerName: order.customerName?.trim() || null,
          method: payload.method,
          amountPaid: payload.amountPaid,
          dueDate: payload.dueDate,
        });
        await get().syncFromRemote();
        await useTransactionsStore.getState().syncFromRemote();
        await useOutstandingStore.getState().syncFromRemote();
      } catch (e) {
        window.alert(
          e instanceof Error ? e.message : "Gagal mencatat pembayaran.",
        );
        throw e;
      }
      return;
    }

    const method = payload.method;
    const isBon = method === "bon";
    const amountPaid =
      method === "qris" ? order.total : payload.amountPaid;

    if (method === "cash" && amountPaid < order.total) {
      window.alert("Jumlah tunai kurang dari total.");
      throw new Error("validation");
    }
    if (isBon && !payload.dueDate?.trim()) {
      window.alert("BON memerlukan tanggal jatuh tempo.");
      throw new Error("validation");
    }

    const change =
      method === "cash" ? Math.max(0, amountPaid - order.total) : 0;
    const tx: PosTransaction = {
      id: `tx-${Date.now()}`,
      orderId: order.id,
      method,
      amount: amountPaid,
      change,
      status: isBon ? "unpaid" : "paid",
      customerName: order.customerName || undefined,
      createdAt: new Date().toISOString().slice(0, 19),
    };
    useTransactionsStore.getState().appendLocal(tx);
    if (isBon && payload.dueDate) {
      useOutstandingStore.getState().appendLocal({
        id: `out-${Date.now()}`,
        customerName: order.customerName || "BON",
        amount: order.total,
        dueDate: payload.dueDate,
        transactionId: tx.id,
      });
    }
    set((s) => ({
      orders: s.orders.map((x) =>
        x.id === order.id ? { ...x, status: "completed" } : x,
      ),
    }));
  },

  appendOrder: async (draft) => {
    if (isSupabaseConfigured()) {
      try {
        await sbCreateOrder(requireRemoteTenantId(), draft);
        await get().syncFromRemote();
      } catch (e) {
        window.alert(
          e instanceof Error
            ? e.message
            : "Gagal membuat order (cek stok atau izin).",
        );
        throw e;
      }
      return;
    }

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
