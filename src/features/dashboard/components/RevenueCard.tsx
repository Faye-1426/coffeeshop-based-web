import Card from "../../../components/ui/Card";
import { formatIDR } from "../../../lib/formatCurrency";

export default function RevenueCard({ amount }: { amount: number }) {
  return (
    <Card className="p-5">
      <div className="text-xs font-bold text-neutral-500">Revenue</div>
      <div className="mt-2 text-2xl font-extrabold text-neutral-900">
        {formatIDR(amount)}
      </div>
      <div className="mt-1 text-xs text-emerald-700 font-semibold">
        dari transaksi Paid
      </div>
    </Card>
  );
}
