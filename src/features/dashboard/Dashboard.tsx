import { useEffect, useMemo, useState } from "react";
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
import { sbFetchDashboardSnapshot } from "../../lib/posSupabaseData";
import type { DashboardSnapshot } from "../../lib/posSupabaseData";
import { useTenant } from "../../lib/supabase/TenantContext";

const emptySnapshot: DashboardSnapshot = {
  paidTotal: 0,
  orderCount: 0,
  activeOrders: 0,
  lowStockCount: 0,
  recent: [],
};

export default function Dashboard() {
  const { session } = useTenant();
  const isDemo = !isSupabaseConfigured();
  const [remoteSnapshot, setRemoteSnapshot] = useState<DashboardSnapshot | null>(
    null,
  );
  const [remoteFetchDone, setRemoteFetchDone] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured() || !session) {
      setRemoteSnapshot(null);
      setRemoteFetchDone(false);
      return;
    }
    setRemoteFetchDone(false);
    let cancelled = false;
    void (async () => {
      try {
        const snap = await sbFetchDashboardSnapshot();
        if (!cancelled) setRemoteSnapshot(snap);
      } catch {
        if (!cancelled) setRemoteSnapshot(null);
      } finally {
        if (!cancelled) setRemoteFetchDone(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [session?.user?.id]);

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
    : !session || !remoteFetchDone
      ? emptySnapshot
      : (remoteSnapshot ?? emptySnapshot);

  const {
    paidTotal,
    orderCount,
    activeOrders,
    lowStockCount: lowStockTotal,
    recent,
  } = display;

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

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <RevenueCard amount={paidTotal} />
        <OrdersCard count={orderCount} />
        <ActiveOrdersCard count={activeOrders} />
        <LowStockCard count={lowStockTotal} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <SalesTrendPlaceholder />
        <RecentTransactions transactions={recent} />
      </div>
    </div>
  );
}
