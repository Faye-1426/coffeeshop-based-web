import { useEffect, useState } from "react";
import PageHeader from "../../components/ui/PageHeader";
import Button from "../../components/ui/Button";
import { useOrdersStore } from "./store/ordersStore";
import { useVisibleOrders } from "./hooks/useVisibleOrders";
import OrderStatusFilters from "./components/OrderStatusFilters";
import OrderList from "./components/OrderList";
import CreateOrderDrawer from "./components/CreateOrderDrawer";
import CompletePaymentModal from "./components/CompletePaymentModal";
import { isSupabaseConfigured } from "../../lib/supabaseClient";
import { useTenant } from "../../lib/supabase/TenantContext";
import type { PosOrder } from "../../types/pos";

export default function Order() {
  const { session } = useTenant();
  const syncFromRemote = useOrdersStore((s) => s.syncFromRemote);
  const [checkoutOrder, setCheckoutOrder] = useState<PosOrder | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured() || !session) return;
    void syncFromRemote();
  }, [session?.user?.id, syncFromRemote]);

  const orders = useOrdersStore((s) => s.orders);
  const products = useOrdersStore((s) => s.products);
  const filter = useOrdersStore((s) => s.filter);
  const drawerOpen = useOrdersStore((s) => s.drawerOpen);
  const setFilter = useOrdersStore((s) => s.setFilter);
  const setDrawerOpen = useOrdersStore((s) => s.setDrawerOpen);
  const advanceStatus = useOrdersStore((s) => s.advanceStatus);
  const completeOrderWithPayment = useOrdersStore(
    (s) => s.completeOrderWithPayment,
  );
  const appendOrder = useOrdersStore((s) => s.appendOrder);

  const visible = useVisibleOrders(orders, filter);

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

      <OrderStatusFilters value={filter} onChange={setFilter} />

      <OrderList
        orders={visible}
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
