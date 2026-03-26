import PageHeader from "../../components/ui/PageHeader";
import { useTransactions } from "./hooks/useTransactions";
import TransactionsTable from "./components/TransactionsTable";

export default function Transaction() {
  const transactions = useTransactions();

  return (
    <div>
      <PageHeader
        title="Transactions"
        subtitle="Riwayat pembayaran (dummy)."
      />

      <TransactionsTable transactions={transactions} />
    </div>
  );
}
