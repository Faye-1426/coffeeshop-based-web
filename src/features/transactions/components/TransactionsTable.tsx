import Card from "../../../components/ui/Card";
import Badge from "../../../components/ui/Badge";
import TableBodyLoadingRow from "../../../components/ui/TableBodyLoadingRow";
import { formatIDR } from "../../../lib/formatCurrency";
import { formatTxLabel } from "../../../lib/formatPosIds";
import type { PosTransaction } from "../../../types/pos";

export default function TransactionsTable({
  transactions,
  loading,
}: {
  transactions: PosTransaction[];
  loading?: boolean;
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
            {loading ? (
              <TableBodyLoadingRow colSpan={6} label="Memuat transaksi…" />
            ) : transactions.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-5 py-10 text-center text-neutral-500"
                >
                  Tidak ada transaksi.
                </td>
              </tr>
            ) : (
              transactions.map((tx) => (
                <tr
                  key={tx.id}
                  className="border-b border-neutral-100 hover:bg-neutral-50/80"
                >
                  <td className="px-5 py-3 font-mono font-semibold">
                    {formatTxLabel(tx.id)}
                  </td>
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
              ))
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
