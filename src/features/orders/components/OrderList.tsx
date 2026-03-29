import Card from "../../../components/ui/Card";
import type { PosOrder } from "../../../types/pos";
import OrderCard from "./OrderCard";

export default function OrderList({
  orders,
  onAdvanceStatus,
  onOpenCheckout,
}: {
  orders: PosOrder[];
  onAdvanceStatus: (o: PosOrder) => void;
  onOpenCheckout: (o: PosOrder) => void;
}) {
  if (orders.length === 0) {
    return (
      <Card className="p-8 text-center text-neutral-600">
        Tidak ada order untuk filter ini.
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map((o) => (
        <OrderCard
          key={o.id}
          order={o}
          onAdvanceStatus={onAdvanceStatus}
          onOpenCheckout={onOpenCheckout}
        />
      ))}
    </div>
  );
}
