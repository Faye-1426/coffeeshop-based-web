import PageHeader from "../../components/ui/PageHeader";
import { useMarkOutstandingPaid } from "./hooks/useOutstandingRows";
import OutstandingTable from "./components/OutstandingTable";
import { isSupabaseConfigured } from "../../lib/supabaseClient";
import { useOutstandingStore } from "./store/outstandingStore";
import { usePosOutstandingQuery } from "../../hooks/usePosRemoteData";

export default function Outstanding() {
  const remote = usePosOutstandingQuery();
  const storeRows = useOutstandingStore((s) => s.rows);
  const markPaid = useMarkOutstandingPaid();
  const supa = isSupabaseConfigured();
  const rows = supa ? (remote.data ?? []) : storeRows;
  const listLoading = supa && remote.isPending;

  return (
    <div>
      <PageHeader
        title="Outstanding"
        subtitle={
          isSupabaseConfigured()
            ? "Piutang dari tabel outstanding; lunas memerlukan hak Manager/Owner."
            : "Piutang / BON — dummy."
        }
      />

      {supa && remote.isError ? (
        <p className="text-sm text-red-700 py-2">
          Gagal memuat data. Coba muat ulang halaman.
        </p>
      ) : null}

      <OutstandingTable rows={rows} loading={listLoading} onMarkPaid={markPaid} />
    </div>
  );
}
