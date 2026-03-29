import PageHeader from "../../components/ui/PageHeader";
import { useTransactionsStore } from "./store/transactionsStore";
import TransactionsTable from "./components/TransactionsTable";
import { isSupabaseConfigured } from "../../lib/supabaseClient";
import { usePosTransactionsQuery } from "../../hooks/usePosRemoteData";

export default function Transaction() {
  const remote = usePosTransactionsQuery();
  const storeRows = useTransactionsStore((s) => s.transactions);
  const supa = isSupabaseConfigured();
  const transactions = supa ? (remote.data ?? []) : storeRows;
  const listLoading = supa && remote.isPending;

  return (
    <div>
      <PageHeader
        title="Transactions"
        subtitle={
          isSupabaseConfigured()
            ? "Riwayat pembayaran dari database (RLS per tenant)."
            : "Riwayat dummy (lokal)."
        }
      />

      {supa && remote.isError ? (
        <p className="text-sm text-red-700 py-2">
          Gagal memuat data. Coba muat ulang halaman.
        </p>
      ) : null}

      <TransactionsTable transactions={transactions} loading={listLoading} />
    </div>
  );
}
