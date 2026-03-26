import PageHeader from "../../components/ui/PageHeader";
import Button from "../../components/ui/Button";
import { useOrdersStore } from "./store/ordersStore";
import { useVisibleOrders } from "./hooks/useVisibleOrders";
import OrderStatusFilters from "./components/OrderStatusFilters";
import OrderList from "./components/OrderList";
import CreateOrderDrawer from "./components/CreateOrderDrawer";

export default function Order() {
  const orders = useOrdersStore((s) => s.orders);
  const products = useOrdersStore((s) => s.products);
  const filter = useOrdersStore((s) => s.filter);
  const drawerOpen = useOrdersStore((s) => s.drawerOpen);
  const setFilter = useOrdersStore((s) => s.setFilter);
  const setDrawerOpen = useOrdersStore((s) => s.setDrawerOpen);
  const advanceStatus = useOrdersStore((s) => s.advanceStatus);
  const appendOrder = useOrdersStore((s) => s.appendOrder);

  const visible = useVisibleOrders(orders, filter);

  return (
    <div>
      <PageHeader
        title="Orders"
        subtitle="Simulasi POS — buat order baru dari drawer."
        action={
          <Button onClick={() => setDrawerOpen(true)}>Create order</Button>
        }
      />

      <OrderStatusFilters value={filter} onChange={setFilter} />

      <OrderList orders={visible} onAdvanceStatus={advanceStatus} />

      <CreateOrderDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        products={products}
        onCreate={(draft) => {
          appendOrder(draft);
        }}
      />
    </div>
  );
}
