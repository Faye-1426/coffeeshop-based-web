import Card from "../../../components/ui/Card";

export default function LowStockCard({
  count,
  pending,
}: {
  count: number;
  pending?: boolean;
}) {
  return (
    <Card className="p-5">
      <div className="text-xs font-bold text-neutral-500">Low stock</div>
      <div className="mt-2 text-2xl font-extrabold text-red-700">
        {pending ? "…" : count}
      </div>
      <div className="mt-1 text-xs text-neutral-600">SKU di bawah ambang</div>
    </Card>
  );
}
