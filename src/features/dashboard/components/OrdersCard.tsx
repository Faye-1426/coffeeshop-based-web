import Card from "../../../components/ui/Card";

export default function OrdersCard({ count }: { count: number }) {
  return (
    <Card className="p-5">
      <div className="text-xs font-bold text-neutral-500">Orders</div>
      <div className="mt-2 text-2xl font-extrabold text-neutral-900">{count}</div>
      <div className="mt-1 text-xs text-neutral-600">Total order dummy</div>
    </Card>
  );
}
