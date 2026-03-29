import { useState } from "react";
import PageHeader from "../../components/ui/PageHeader";
import Button from "../../components/ui/Button";
import { useOrdersStore } from "./store/ordersStore";
import { useVisibleOrders } from "./hooks/useVisibleOrders";
import OrderStatusFilters from "./components/OrderStatusFilters";
import OrderList from "./components/OrderList";
import CreateOrderDrawer from "./components/CreateOrderDrawer";
import CompletePaymentModal from "./components/CompletePaymentModal";
import { isSupabaseConfigured } from "../../lib/supabaseClient";
import type { PosOrder } from "../../types/pos";
import {
  usePosOrdersQuery,
  usePosProductsQuery,
} from "../../hooks/usePosRemoteData";

export default function Order() {
  const ordersQuery = usePosOrdersQuery();
  const productsQuery = usePosProductsQuery();
  const [checkoutOrder, setCheckoutOrder] = useState<PosOrder | null>(null);

  const storeOrders = useOrdersStore((s) => s.orders);
  const storeProducts = useOrdersStore((s) => s.products);
  const filter = useOrdersStore((s) => s.filter);
  const drawerOpen = useOrdersStore((s) => s.drawerOpen);
  const setFilter = useOrdersStore((s) => s.setFilter);
  const setDrawerOpen = useOrdersStore((s) => s.setDrawerOpen);
  const advanceStatus = useOrdersStore((s) => s.advanceStatus);
  const completeOrderWithPayment = useOrdersStore(
    (s) => s.completeOrderWithPayment,
  );
  const appendOrder = useOrdersStore((s) => s.appendOrder);

  const supa = isSupabaseConfigured();
  const orders = supa ? (ordersQuery.data ?? []) : storeOrders;
  const products = supa ? (productsQuery.data ?? []) : storeProducts;

  const visible = useVisibleOrders(orders, filter);
  const listLoading = supa && (ordersQuery.isPending || productsQuery.isPending);

  return (
    <div>
      <PageHeader
        title="Orders"
        subtitle={
          isSupabaseConfigured()
            ? "Setelah disajikan (served), selesaikan dengan pembayaran — transaksi tercatat di Supabase."
            : "Simulasi POS — buat order baru dari drawer."
        }
        action={
          <Button onClick={() => setDrawerOpen(true)}>Create order</Button>
        }
      />

      {supa && (ordersQuery.isError || productsQuery.isError) ? (
        <p className="text-sm text-red-700 py-2">
          Gagal memuat data. Coba muat ulang halaman.
        </p>
      ) : null}

      <OrderStatusFilters value={filter} onChange={setFilter} />

      <OrderList
        orders={visible}
        loading={listLoading}
        onAdvanceStatus={advanceStatus}
        onOpenCheckout={(o) => setCheckoutOrder(o)}
      />

      <CompletePaymentModal
        open={checkoutOrder !== null}
        order={checkoutOrder}
        onClose={() => setCheckoutOrder(null)}
        onConfirm={(payload) =>
          checkoutOrder
            ? completeOrderWithPayment(checkoutOrder, payload)
            : Promise.resolve()
        }
      />

      <CreateOrderDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        products={products}
        onCreate={(draft) => appendOrder(draft)}
      />
    </div>
  );
}
