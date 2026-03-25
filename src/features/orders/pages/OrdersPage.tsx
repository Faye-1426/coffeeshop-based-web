import { useState } from "react";
import PageHeader from "../../../components/ui/PageHeader";
import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";
import { formatIDR } from "../../../lib/formatCurrency";
import { posOrdersSeed, posProductsSeed } from "../../../data/posDummyData";
import type { OrderStatus, PosOrder } from "../../../types/pos";
import CreateOrderDrawer from "../components/CreateOrderDrawer";
import { OrderStatusBadge } from "../components/orderStatusUi";

function nextOrderId(existing: PosOrder[]): string {
  const n =
    existing.reduce((max, o) => {
      const m = /^ORD-(\d+)$/.exec(o.id);
      return m ? Math.max(max, Number(m[1])) : max;
    }, 1000) + 1;
  return `ORD-${n}`;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<PosOrder[]>(() => [...posOrdersSeed]);
  const [products] = useState(() => [...posProductsSeed]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [filter, setFilter] = useState<OrderStatus | "all">("all");

  const visible =
    filter === "all" ? orders : orders.filter((o) => o.status === filter);

  const advanceStatus = (o: PosOrder) => {
    const order: OrderStatus[] = [
      "pending",
      "preparing",
      "served",
      "completed",
    ];
    const i = order.indexOf(o.status);
    if (i < 0 || i >= order.length - 1) return;
    const next = order[i + 1];
    setOrders((prev) =>
      prev.map((x) => (x.id === o.id ? { ...x, status: next } : x)),
    );
  };

  return (
    <div>
      <PageHeader
        title="Orders"
        subtitle="Simulasi POS — buat order baru dari drawer."
        action={
          <Button onClick={() => setDrawerOpen(true)}>Create order</Button>
        }
      />

      <div className="flex flex-wrap gap-2 mb-4">
        {(
          [
            "all",
            "pending",
            "preparing",
            "served",
            "completed",
            "cancelled",
          ] as const
        ).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setFilter(s)}
            className={[
              "rounded-full px-4 py-2 text-xs font-bold border transition",
              filter === s
                ? "bg-red-600 text-white border-red-600"
                : "bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50",
            ].join(" ")}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {visible.length === 0 ? (
          <Card className="p-8 text-center text-neutral-600">
            Tidak ada order untuk filter ini.
          </Card>
        ) : (
          visible.map((o) => (
            <Card key={o.id} className="p-5">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-extrabold text-lg">{o.id}</span>
                    <OrderStatusBadge status={o.status} />
                  </div>
                  <div className="mt-2 text-sm text-neutral-600">
                    Meja {o.tableNumber} · {o.customerName}
                  </div>
                  <div className="mt-1 text-xs text-neutral-500">
                    {o.createdAt.replace("T", " ")}
                  </div>
                  <ul className="mt-3 text-sm space-y-1">
                    {o.items.map((li, i) => (
                      <li key={i}>
                        {li.qty}× {li.name} — {formatIDR(li.unitPrice * li.qty)}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm text-neutral-500">Total</div>
                  <div className="text-xl font-extrabold">
                    {formatIDR(o.total)}
                  </div>
                  {["pending", "preparing", "served"].includes(o.status) ? (
                    <Button
                      variant="secondary"
                      className="mt-3 text-xs! w-full sm:w-auto"
                      onClick={() => advanceStatus(o)}
                    >
                      Next status
                    </Button>
                  ) : null}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      <CreateOrderDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        products={products}
        onCreate={(draft) => {
          const id = nextOrderId(orders);
          const created: PosOrder = {
            ...draft,
            id,
            createdAt: new Date().toISOString().slice(0, 16),
          };
          setOrders((prev) => [created, ...prev]);
        }}
      />
    </div>
  );
}
