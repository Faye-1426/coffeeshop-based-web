import PageHeader from "../../components/ui/PageHeader";
import {
  posOrdersSeed,
  posProductsSeed,
  posTransactionsSeed,
} from "./data";
import { activeOrdersCount, lowStockCount } from "./lib/dashboardMetrics";
import RevenueCard from "./components/RevenueCard";
import OrdersCard from "./components/OrdersCard";
import ActiveOrdersCard from "./components/ActiveOrdersCard";
import LowStockCard from "./components/LowStockCard";
import SalesTrendPlaceholder from "./components/SalesTrendPlaceholder";
import RecentTransactions from "./components/RecentTransactions";

export default function Dashboard() {
  const paidTotal = posTransactionsSeed
    .filter((t) => t.status === "paid")
    .reduce((s, t) => s + t.amount, 0);
  const orderCount = posOrdersSeed.length;
  const active = activeOrdersCount(posOrdersSeed);
  const lowStock = lowStockCount(posProductsSeed);

  const recent = [...posTransactionsSeed]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5);

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Ringkasan operasional (dummy data)."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <RevenueCard amount={paidTotal} />
        <OrdersCard count={orderCount} />
        <ActiveOrdersCard count={active} />
        <LowStockCard count={lowStock} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <SalesTrendPlaceholder />
        <RecentTransactions transactions={recent} />
      </div>
    </div>
  );
}
