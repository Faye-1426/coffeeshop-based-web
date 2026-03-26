import { useTransactionsStore } from "../store/transactionsStore";

export function useTransactions() {
  return useTransactionsStore((s) => s.transactions);
}
