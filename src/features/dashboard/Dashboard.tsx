import { useMemo } from "react";
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
import { isSupabaseConfigured } from "../../lib/supabaseClient";
import type { DashboardSnapshot } from "../../lib/posSupabaseData";
import { usePosDashboardSnapshotQuery } from "../../hooks/usePosRemoteData";

const emptySnapshot: DashboardSnapshot = {
  paidTotal: 0,
  orderCount: 0,
  activeOrders: 0,
  lowStockCount: 0,
  recent: [],
};

export default function Dashboard() {
  const isDemo = !isSupabaseConfigured();
  const remoteQuery = usePosDashboardSnapshotQuery();

  const demoDisplay = useMemo(
    (): DashboardSnapshot => ({
      paidTotal: posTransactionsSeed
        .filter((t) => t.status === "paid")
        .reduce((s, t) => s + t.amount, 0),
      orderCount: posOrdersSeed.length,
      activeOrders: activeOrdersCount(posOrdersSeed),
      lowStockCount: lowStockCount(posProductsSeed),
      recent: [...posTransactionsSeed]
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, 5),
    }),
    [],
  );

  const display: DashboardSnapshot = isDemo
    ? demoDisplay
    : (remoteQuery.data ?? emptySnapshot);

  const {
    paidTotal,
    orderCount,
    activeOrders,
    lowStockCount: lowStockTotal,
    recent,
  } = display;

  const remoteLoading = !isDemo && remoteQuery.isPending;

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle={
          isSupabaseConfigured()
            ? "Ringkasan dari Supabase untuk tenant Anda."
            : "Ringkasan operasional (dummy data)."
        }
      />

      {!isDemo && remoteQuery.isError ? (
        <p className="text-sm text-red-700 py-2">
          Gagal memuat ringkasan. Coba muat ulang halaman.
        </p>
      ) : null}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <RevenueCard amount={paidTotal} pending={remoteLoading} />
        <OrdersCard count={orderCount} pending={remoteLoading} />
        <ActiveOrdersCard count={activeOrders} pending={remoteLoading} />
        <LowStockCard count={lowStockTotal} pending={remoteLoading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <SalesTrendPlaceholder />
        <RecentTransactions
          transactions={recent}
          loading={remoteLoading}
        />
      </div>
    </div>
  );
}
