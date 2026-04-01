import Badge from "../../../components/ui/Badge";
import type { OrderStatus } from "../../../types/pos";

function orderStatusTone(
  s: OrderStatus,
): "neutral" | "warning" | "success" | "danger" | "info" {
  switch (s) {
    case "awaiting_payment":
      return "info";
    case "pending":
      return "warning";
    case "preparing":
      return "info";
    case "served":
      return "success";
    case "completed":
      return "success";
    case "cancelled":
      return "danger";
    default:
      return "neutral";
  }
}

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <Badge tone={orderStatusTone(status)}>{status}</Badge>;
}
