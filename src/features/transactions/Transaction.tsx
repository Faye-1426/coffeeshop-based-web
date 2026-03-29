import { useEffect } from "react";
import PageHeader from "../../components/ui/PageHeader";
import { useTransactions } from "./hooks/useTransactions";
import TransactionsTable from "./components/TransactionsTable";
import { isSupabaseConfigured } from "../../lib/supabaseClient";
import { useTenant } from "../../lib/supabase/TenantContext";
import { useTransactionsStore } from "./store/transactionsStore";

export default function Transaction() {
  const { session } = useTenant();
  const transactions = useTransactions();
  const syncFromRemote = useTransactionsStore((s) => s.syncFromRemote);

  useEffect(() => {
    if (!isSupabaseConfigured() || !session) return;
    void syncFromRemote();
  }, [session?.user?.id, syncFromRemote]);

  return (
    <div>
      <PageHeader
        title="Transactions"
        subtitle={
          isSupabaseConfigured()
            ? "Riwayat dari tabel transactions (RLS)."
            : "Riwayat pembayaran (dummy)."
        }
      />

      <TransactionsTable transactions={transactions} />
    </div>
  );
}
