import PageHeader from "../../components/ui/PageHeader";
import {
  useOutstandingRows,
  useMarkOutstandingPaid,
} from "./hooks/useOutstandingRows";
import OutstandingTable from "./components/OutstandingTable";

export default function Outstanding() {
  const rows = useOutstandingRows();
  const markPaid = useMarkOutstandingPaid();

  return (
    <div>
      <PageHeader title="Outstanding" subtitle="Piutang / BON — dummy." />

      <OutstandingTable rows={rows} onMarkPaid={markPaid} />
    </div>
  );
}
