import { create } from "zustand";
import { posTransactionsSeed } from "../../../data/posDummyData";
import type { PosTransaction } from "../../../types/pos";
import { isSupabaseConfigured } from "../../../lib/supabaseClient";

type TransactionsState = {
  transactions: PosTransaction[];
  appendLocal: (row: PosTransaction) => void;
};

const useSeed = !isSupabaseConfigured();

export const useTransactionsStore = create<TransactionsState>((set) => ({
  transactions: useSeed ? [...posTransactionsSeed] : [],

  appendLocal: (row) =>
    set((s) => ({ transactions: [row, ...s.transactions] })),
}));
