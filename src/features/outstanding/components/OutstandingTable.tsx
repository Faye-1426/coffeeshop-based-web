import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";
import { formatIDR } from "../../../lib/formatCurrency";
import type { PosOutstanding } from "../../../types/pos";

export default function OutstandingTable({
  rows,
  onMarkPaid,
}: {
  rows: PosOutstanding[];
  onMarkPaid: (id: string) => void;
}) {
  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-neutral-50 border-b border-neutral-200">
            <tr>
              <th className="px-5 py-3 font-extrabold">Customer</th>
              <th className="px-5 py-3 font-extrabold">Amount</th>
              <th className="px-5 py-3 font-extrabold">Due</th>
              <th className="px-5 py-3 font-extrabold">Transaction</th>
              <th className="px-5 py-3 font-extrabold">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-5 py-10 text-center text-neutral-500"
                >
                  Tidak ada piutang aktif.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-neutral-100 hover:bg-neutral-50/80"
                >
                  <td className="px-5 py-3 font-semibold">{r.customerName}</td>
                  <td className="px-5 py-3 font-extrabold text-red-800">
                    {formatIDR(r.amount)}
                  </td>
                  <td className="px-5 py-3 text-neutral-600">{r.dueDate}</td>
                  <td className="px-5 py-3 font-mono text-xs">
                    {r.transactionId}
                  </td>
                  <td className="px-5 py-3">
                    <Button
                      variant="primary"
                      className="text-xs! py-1.5!"
                      onClick={() => onMarkPaid(r.id)}
                    >
                      Mark as Paid
                    </Button>
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
