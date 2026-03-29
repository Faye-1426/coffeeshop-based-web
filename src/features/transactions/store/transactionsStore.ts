import { create } from "zustand";
import { posTransactionsSeed } from "../../../data/posDummyData";
import type { PosTransaction } from "../../../types/pos";

type TransactionsState = {
  transactions: PosTransaction[];
};

export const useTransactionsStore = create<TransactionsState>(() => ({
  transactions: [...posTransactionsSeed],
}));
