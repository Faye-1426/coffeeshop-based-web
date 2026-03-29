import Card from "../../../components/ui/Card";

export default function ActiveOrdersCard({
  count,
  pending,
}: {
  count: number;
  pending?: boolean;
}) {
  return (
    <Card className="p-5">
      <div className="text-xs font-bold text-neutral-500">Active orders</div>
      <div className="mt-2 text-2xl font-extrabold text-amber-700">
        {pending ? "…" : count}
      </div>
      <div className="mt-1 text-xs text-neutral-600">
        Pending / Preparing / Served
      </div>
    </Card>
  );
}
