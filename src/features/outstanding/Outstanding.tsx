import { useEffect } from "react";
import PageHeader from "../../components/ui/PageHeader";
import {
  useOutstandingRows,
  useMarkOutstandingPaid,
} from "./hooks/useOutstandingRows";
import OutstandingTable from "./components/OutstandingTable";
import { isSupabaseConfigured } from "../../lib/supabaseClient";
import { useTenant } from "../../lib/supabase/TenantContext";
import { useOutstandingStore } from "./store/outstandingStore";

export default function Outstanding() {
  const { session } = useTenant();
  const rows = useOutstandingRows();
  const markPaid = useMarkOutstandingPaid();
  const syncFromRemote = useOutstandingStore((s) => s.syncFromRemote);

  useEffect(() => {
    if (!isSupabaseConfigured() || !session) return;
    void syncFromRemote();
  }, [session?.user?.id, syncFromRemote]);

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

      <OutstandingTable rows={rows} onMarkPaid={markPaid} />
    </div>
  );
}
