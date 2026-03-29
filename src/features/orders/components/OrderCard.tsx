import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";
import { formatIDR } from "../../../lib/formatCurrency";
import { formatOrderLabel } from "../../../lib/formatPosIds";
import type { PosOrder } from "../../../types/pos";
import { OrderStatusBadge } from "./orderStatusUi";

export default function OrderCard({
  order,
  onAdvanceStatus,
  onOpenCheckout,
}: {
  order: PosOrder;
  onAdvanceStatus: (o: PosOrder) => void;
  onOpenCheckout: (o: PosOrder) => void;
}) {
  const o = order;
  return (
    <Card className="p-5">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-extrabold text-lg">
              {formatOrderLabel(o.id)}
            </span>
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
          <div className="text-xl font-extrabold">{formatIDR(o.total)}</div>
          {o.status === "served" ? (
            <Button
              variant="secondary"
              className="mt-3 text-xs! w-full sm:w-auto"
              onClick={() => onOpenCheckout(o)}
            >
              Bayar & selesai
            </Button>
          ) : ["pending", "preparing"].includes(o.status) ? (
            <Button
              variant="secondary"
              className="mt-3 text-xs! w-full sm:w-auto"
              onClick={() => onAdvanceStatus(o)}
            >
              Next status
            </Button>
          ) : null}
        </div>
      </div>
    </Card>
  );
}
