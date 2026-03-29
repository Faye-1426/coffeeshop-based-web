import Card from "../../../components/ui/Card";
import Badge from "../../../components/ui/Badge";
import { formatIDR } from "../../../lib/formatCurrency";
import type { PosTransaction } from "../../../types/pos";

export default function TransactionsTable({
  transactions,
}: {
  transactions: PosTransaction[];
}) {
  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-neutral-50 border-b border-neutral-200">
            <tr>
              <th className="px-5 py-3 font-extrabold">ID</th>
              <th className="px-5 py-3 font-extrabold">Method</th>
              <th className="px-5 py-3 font-extrabold">Amount</th>
              <th className="px-5 py-3 font-extrabold">Change</th>
              <th className="px-5 py-3 font-extrabold">Status</th>
              <th className="px-5 py-3 font-extrabold">When</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx) => (
              <tr
                key={tx.id}
                className="border-b border-neutral-100 hover:bg-neutral-50/80"
              >
                <td className="px-5 py-3 font-mono font-semibold">{tx.id}</td>
                <td className="px-5 py-3 uppercase">{tx.method}</td>
                <td className="px-5 py-3 font-bold">{formatIDR(tx.amount)}</td>
                <td className="px-5 py-3">{formatIDR(tx.change)}</td>
                <td className="px-5 py-3">
                  <Badge tone={tx.status === "paid" ? "success" : "warning"}>
                    {tx.status}
                  </Badge>
                </td>
                <td className="px-5 py-3 text-neutral-600 whitespace-nowrap">
                  {tx.createdAt.replace("T", " ")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
