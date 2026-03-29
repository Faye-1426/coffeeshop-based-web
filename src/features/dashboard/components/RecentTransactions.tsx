import Card from "../../../components/ui/Card";
import Badge from "../../../components/ui/Badge";
import { formatIDR } from "../../../lib/formatCurrency";
import type { PosTransaction } from "../../../types/pos";

export default function RecentTransactions({
  transactions,
}: {
  transactions: PosTransaction[];
}) {
  return (
    <Card className="p-5">
      <div className="font-extrabold text-neutral-900 mb-4">
        Recent transactions
      </div>
      <ul className="space-y-3">
        {transactions.map((tx) => (
          <li
            key={tx.id}
            className="flex items-center justify-between gap-2 text-sm border-b border-neutral-100 pb-3 last:border-0 last:pb-0"
          >
            <div className="min-w-0">
              <div className="font-bold text-neutral-900 truncate">{tx.id}</div>
              <div className="text-xs text-neutral-500">
                {tx.method.toUpperCase()} · {tx.createdAt.slice(0, 16)}
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="font-extrabold">{formatIDR(tx.amount)}</div>
              <Badge
                tone={tx.status === "paid" ? "success" : "warning"}
                className="mt-1"
              >
                {tx.status}
              </Badge>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
