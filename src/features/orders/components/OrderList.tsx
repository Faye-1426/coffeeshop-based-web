import Card from "../../../components/ui/Card";
import ListLoadingStatus from "../../../components/ui/ListLoadingStatus";
import type { PosOrder } from "../../../types/pos";
import OrderCard from "./OrderCard";

export default function OrderList({
  orders,
  loading,
  onAdvanceStatus,
  onOpenCheckout,
}: {
  orders: PosOrder[];
  loading?: boolean;
  onAdvanceStatus: (o: PosOrder) => void;
  onOpenCheckout: (o: PosOrder) => void;
}) {
  if (loading) {
    return (
      <Card className="p-8">
        <ListLoadingStatus label="Memuat order…" variant="inline" />
      </Card>
    );
  }

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
