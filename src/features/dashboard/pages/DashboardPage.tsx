import Card from "../../../components/ui/Card";
import PageHeader from "../../../components/ui/PageHeader";
import Badge from "../../../components/ui/Badge";
import { formatIDR } from "../../../lib/formatCurrency";
import {
  posOrdersSeed,
  posProductsSeed,
  posTransactionsSeed,
} from "../../../data/posDummyData";
import type { PosOrder } from "../../../types/pos";

function activeOrdersCount(orders: PosOrder[]): number {
  return orders.filter((o) =>
    ["pending", "preparing", "served"].includes(o.status),
  ).length;
}

function lowStockCount(
  products: typeof posProductsSeed,
): number {
  return products.filter((p) => {
    const t = p.lowStockThreshold ?? 10;
    return p.stock <= t;
  }).length;
}

export default function DashboardPage() {
  const paidTotal = posTransactionsSeed
    .filter((t) => t.status === "paid")
    .reduce((s, t) => s + t.amount, 0);
  const orderCount = posOrdersSeed.length;
  const active = activeOrdersCount(posOrdersSeed);
  const lowStock = lowStockCount(posProductsSeed);

  const recent = [...posTransactionsSeed]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5);

  const chartBars = [42, 65, 48, 72, 55, 80, 38];

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Ringkasan operasional (dummy data)."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <Card className="p-5">
          <div className="text-xs font-bold text-neutral-500">Revenue</div>
          <div className="mt-2 text-2xl font-extrabold text-neutral-900">
            {formatIDR(paidTotal)}
          </div>
          <div className="mt-1 text-xs text-emerald-700 font-semibold">
            dari transaksi Paid
          </div>
        </Card>
        <Card className="p-5">
          <div className="text-xs font-bold text-neutral-500">Orders</div>
          <div className="mt-2 text-2xl font-extrabold text-neutral-900">
            {orderCount}
          </div>
          <div className="mt-1 text-xs text-neutral-600">Total order dummy</div>
        </Card>
        <Card className="p-5">
          <div className="text-xs font-bold text-neutral-500">Active orders</div>
          <div className="mt-2 text-2xl font-extrabold text-amber-700">
            {active}
          </div>
          <div className="mt-1 text-xs text-neutral-600">
            Pending / Preparing / Served
          </div>
        </Card>
        <Card className="p-5">
          <div className="text-xs font-bold text-neutral-500">Low stock</div>
          <div className="mt-2 text-2xl font-extrabold text-red-700">
            {lowStock}
          </div>
          <div className="mt-1 text-xs text-neutral-600">SKU di bawah ambang</div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-5 lg:col-span-2">
          <div className="font-extrabold text-neutral-900 mb-4">
            Sales trend (placeholder)
          </div>
          <div className="flex items-end gap-2 h-40 pt-4 border-t border-neutral-100">
            {chartBars.map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-t-lg bg-red-600/70 transition hover:bg-red-600 min-w-0"
                style={{ height: `${h}%` }}
                title={`Day ${i + 1}`}
              />
            ))}
          </div>
          <p className="mt-3 text-xs text-neutral-500">
            Statis untuk demo — nanti hubungkan data real.
          </p>
        </Card>

        <Card className="p-5">
          <div className="font-extrabold text-neutral-900 mb-4">
            Recent transactions
          </div>
          <ul className="space-y-3">
            {recent.map((tx) => (
              <li
                key={tx.id}
                className="flex items-center justify-between gap-2 text-sm border-b border-neutral-100 pb-3 last:border-0 last:pb-0"
              >
                <div className="min-w-0">
                  <div className="font-bold text-neutral-900 truncate">
                    {tx.id}
                  </div>
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
      </div>
    </div>
  );
}
